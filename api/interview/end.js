import { calculateOverallScore, getScoreGrade } from '../_lib/scoring.js';
import { generateOverallSuggestions, generateSummaryText } from '../_lib/feedback.js';

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { sessionState } = req.body;

  if (!sessionState || !sessionState.answers) {
    return res.status(400).json({ error: 'Invalid session state' });
  }

  const { answers, behavioralScores, communicationScores, subjectName, subjectIcon, difficulty, startTime } = sessionState;

  // Calculate overall scores
  const avgTechnical = answers.length > 0
    ? answers.reduce((sum, a) => sum + a.evaluation.score, 0) / answers.length
    : 0;

  const avgBehavioral = behavioralScores.length > 0
    ? behavioralScores.reduce((sum, b) => sum + b.score, 0) / behavioralScores.length
    : 7;

  const avgCommunication = communicationScores.length > 0
    ? communicationScores.reduce((sum, c) => sum + c.score, 0) / communicationScores.length
    : 7;

  const overallScore = calculateOverallScore(avgTechnical, avgBehavioral, avgCommunication);

  // Generate suggestions
  const suggestions = generateOverallSuggestions({
    answers,
    behavioralScores,
    communicationScores
  });

  const summaryText = generateSummaryText(overallScore);

  let correctCount = 0;
  let incorrectCount = 0;
  answers.forEach(a => {
    if (a.evaluation.score >= 6) correctCount++;
    else incorrectCount++;
  });

  const report = {
    subject: subjectName,
    icon: subjectIcon,
    difficulty,
    duration: Math.round((Date.now() - startTime) / 1000),
    overallScore,
    grade: getScoreGrade(overallScore),
    correctCount,
    incorrectCount,
    scores: {
      technical: Math.round(avgTechnical * 10) / 10,
      behavioral: Math.round(avgBehavioral * 10) / 10,
      communication: Math.round(avgCommunication * 10) / 10
    },
    summary: summaryText,
    answers: answers.map((a, i) => ({
      questionNumber: i + 1,
      questionText: a.questionText,
      userAnswer: a.userAnswer,
      idealAnswer: a.idealAnswer,
      score: a.evaluation.score,
      grade: getScoreGrade(a.evaluation.score),
      keywordsFound: a.evaluation.keywordsFound,
      keywordsMissed: a.evaluation.keywordsMissed,
      summary: a.evaluation.summary,
      defects: a.evaluation.defects,
      feedback: a.feedback,
      behavioralScore: behavioralScores[i],
      communicationScore: communicationScores[i]
    })),
    suggestions,
    expressionTimeline: behavioralScores
  };

  res.json(report);
}
