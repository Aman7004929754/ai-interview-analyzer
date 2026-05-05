import { evaluateAnswer, analyzeSpeechFluency } from '../_lib/nlp.js';
import { calculateBehavioralScore, calculateCommunicationScore, getScoreGrade } from '../_lib/scoring.js';
import { generateQuestionFeedback } from '../_lib/feedback.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionState, answer, faceData, speechDuration } = req.body;

  if (!sessionState || !sessionState.questions) {
    return res.status(400).json({ error: 'Invalid session state' });
  }

  const { questions, currentIndex, answers, behavioralScores, communicationScores } = sessionState;

  if (currentIndex >= questions.length) {
    return res.status(400).json({ error: 'No more questions in this session' });
  }

  const currentQuestion = questions[currentIndex];

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

  // Update session state (client will hold this)
  const updatedAnswers = [...answers, {
    questionId: currentQuestion.id,
    questionText: currentQuestion.question,
    userAnswer: answer || '(No answer provided)',
    idealAnswer: currentQuestion.idealAnswer,
    evaluation,
    feedback
  }];
  const updatedBehavioralScores = [...behavioralScores, behavioralScore];
  const updatedCommunicationScores = [...communicationScores, communicationScore];
  const newIndex = currentIndex + 1;
  const isComplete = newIndex >= questions.length;

  const updatedSessionState = {
    ...sessionState,
    currentIndex: newIndex,
    answers: updatedAnswers,
    behavioralScores: updatedBehavioralScores,
    communicationScores: updatedCommunicationScores
  };

  const response = {
    evaluation: {
      score: evaluation.score,
      similarity: evaluation.similarity,
      keywordCoverage: evaluation.keywordCoverage,
      completeness: evaluation.completeness,
      keywordsFound: evaluation.keywordsFound,
      keywordsMissed: evaluation.keywordsMissed,
      defects: evaluation.defects,
      summary: evaluation.summary,
      grade: getScoreGrade(evaluation.score)
    },
    behavioralScore,
    communicationScore,
    feedback,
    isComplete,
    currentQuestion: newIndex + 1,
    totalQuestions: questions.length,
    sessionState: updatedSessionState
  };

  // If not complete, include next question
  if (!isComplete) {
    const nextQ = questions[newIndex];
    response.nextQuestion = {
      id: nextQ.id,
      question: nextQ.question,
      difficulty: nextQ.difficulty
    };
  }

  res.json(response);
}
