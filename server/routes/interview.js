import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { evaluateAnswer, analyzeSpeechFluency } from '../engine/nlp.js';
import { calculateBehavioralScore, calculateCommunicationScore, calculateOverallScore, getScoreGrade } from '../engine/scoring.js';
import { generateQuestionFeedback, generateOverallSuggestions, generateSummaryText } from '../engine/feedback.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Load questions data
const questionsData = JSON.parse(
  readFileSync(join(__dirname, '..', 'data', 'questions.json'), 'utf-8')
);

// In-memory session store
const sessions = new Map();

/**
 * POST /api/interview/start - Start a new interview session
 * Body: { subject, difficulty, questionCount }
 */
router.post('/start', (req, res) => {
  const { subject, difficulty = 'mixed', questionCount = 5 } = req.body;

  const subjectData = questionsData.subjects[subject];
  if (!subjectData) {
    return res.status(404).json({ error: 'Subject not found' });
  }

  let questions = [...subjectData.questions];

  // Filter by difficulty
  if (difficulty !== 'mixed') {
    questions = questions.filter(q => q.difficulty === difficulty);
  }

  // Shuffle
  for (let i = questions.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [questions[i], questions[j]] = [questions[j], questions[i]];
  }

  // Progressive difficulty for mixed
  if (difficulty === 'mixed') {
    const easy = questions.filter(q => q.difficulty === 'easy');
    const medium = questions.filter(q => q.difficulty === 'medium');
    const hard = questions.filter(q => q.difficulty === 'hard');
    questions = [...easy, ...medium, ...hard];
  }

  questions = questions.slice(0, parseInt(questionCount));

  const sessionId = uuidv4();
  const session = {
    id: sessionId,
    subject,
    subjectName: subjectData.name,
    subjectIcon: subjectData.icon,
    difficulty,
    questions,
    currentIndex: 0,
    answers: [],
    behavioralScores: [],
    communicationScores: [],
    startTime: Date.now(),
    status: 'active'
  };

  sessions.set(sessionId, session);

  // Return first question (without ideal answer)
  const firstQuestion = {
    id: questions[0].id,
    question: questions[0].question,
    difficulty: questions[0].difficulty
  };

  res.json({
    sessionId,
    subject: subjectData.name,
    icon: subjectData.icon,
    totalQuestions: questions.length,
    currentQuestion: 1,
    question: firstQuestion
  });
});

/**
 * POST /api/interview/answer - Submit an answer and get evaluation + next question
 * Body: { sessionId, answer, faceData, speechDuration }
 */
router.post('/answer', (req, res) => {
  const { sessionId, answer, faceData, speechDuration } = req.body;

  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  if (session.status !== 'active') {
    return res.status(400).json({ error: 'Session is no longer active' });
  }

  const currentQuestion = session.questions[session.currentIndex];

  // Evaluate the answer using NLP engine
  const evaluation = evaluateAnswer(answer || '', currentQuestion);

  // Analyze speech fluency
  const speechAnalysis = analyzeSpeechFluency(answer || '', speechDuration || 30);

  // Calculate behavioral score from face data
  const behavioralScore = calculateBehavioralScore(faceData || {});

  // Calculate communication score
  const communicationScore = calculateCommunicationScore(speechAnalysis);

  // Generate per-question feedback
  const feedback = generateQuestionFeedback(evaluation, currentQuestion, faceData);

  // Store the answer data
  session.answers.push({
    questionId: currentQuestion.id,
    questionText: currentQuestion.question,
    userAnswer: answer || '(No answer provided)',
    idealAnswer: currentQuestion.idealAnswer,
    evaluation,
    feedback
  });
  session.behavioralScores.push(behavioralScore);
  session.communicationScores.push(communicationScore);

  // Move to next question
  session.currentIndex++;

  const isComplete = session.currentIndex >= session.questions.length;

  const response = {
    evaluation: {
      score: evaluation.score,
      similarity: evaluation.similarity,
      keywordCoverage: evaluation.keywordCoverage,
      completeness: evaluation.completeness,
      keywordsFound: evaluation.keywordsFound,
      keywordsMissed: evaluation.keywordsMissed,
      grade: getScoreGrade(evaluation.score)
    },
    behavioralScore,
    communicationScore,
    feedback,
    isComplete,
    currentQuestion: session.currentIndex + 1,
    totalQuestions: session.questions.length
  };

  // If not complete, include next question
  if (!isComplete) {
    const nextQ = session.questions[session.currentIndex];
    response.nextQuestion = {
      id: nextQ.id,
      question: nextQ.question,
      difficulty: nextQ.difficulty
    };
  }

  res.json(response);
});

/**
 * POST /api/interview/end - End the interview and get full report
 * Body: { sessionId }
 */
router.post('/end', (req, res) => {
  const { sessionId } = req.body;

  const session = sessions.get(sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }

  session.status = 'completed';
  session.endTime = Date.now();

  // Calculate overall scores
  const avgTechnical = session.answers.length > 0
    ? session.answers.reduce((sum, a) => sum + a.evaluation.score, 0) / session.answers.length
    : 0;

  const avgBehavioral = session.behavioralScores.length > 0
    ? session.behavioralScores.reduce((sum, b) => sum + b.score, 0) / session.behavioralScores.length
    : 7;

  const avgCommunication = session.communicationScores.length > 0
    ? session.communicationScores.reduce((sum, c) => sum + c.score, 0) / session.communicationScores.length
    : 7;

  const overallScore = calculateOverallScore(avgTechnical, avgBehavioral, avgCommunication);

  // Generate suggestions
  const suggestions = generateOverallSuggestions({
    answers: session.answers,
    behavioralScores: session.behavioralScores,
    communicationScores: session.communicationScores
  });

  const summaryText = generateSummaryText(overallScore);

  const report = {
    sessionId,
    subject: session.subjectName,
    icon: session.subjectIcon,
    difficulty: session.difficulty,
    duration: Math.round((session.endTime - session.startTime) / 1000),
    overallScore,
    grade: getScoreGrade(overallScore),
    scores: {
      technical: Math.round(avgTechnical * 10) / 10,
      behavioral: Math.round(avgBehavioral * 10) / 10,
      communication: Math.round(avgCommunication * 10) / 10
    },
    summary: summaryText,
    answers: session.answers.map((a, i) => ({
      questionNumber: i + 1,
      questionText: a.questionText,
      userAnswer: a.userAnswer,
      idealAnswer: a.idealAnswer,
      score: a.evaluation.score,
      grade: getScoreGrade(a.evaluation.score),
      keywordsFound: a.evaluation.keywordsFound,
      keywordsMissed: a.evaluation.keywordsMissed,
      feedback: a.feedback,
      behavioralScore: session.behavioralScores[i],
      communicationScore: session.communicationScores[i]
    })),
    suggestions,
    expressionTimeline: session.behavioralScores
  };

  // Clean up session after a delay
  setTimeout(() => sessions.delete(sessionId), 30 * 60 * 1000);

  res.json(report);
});

export default router;
