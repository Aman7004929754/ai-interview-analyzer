import express from 'express';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Load questions data
const questionsData = JSON.parse(
  readFileSync(join(__dirname, '..', 'data', 'questions.json'), 'utf-8')
);

/**
 * GET /api/subjects - List all available subjects
 */
router.get('/subjects', (req, res) => {
  const subjects = Object.entries(questionsData.subjects).map(([key, subject]) => {
    // Extract unique topics from questions
    const topicsSet = new Map();
    subject.questions.forEach(q => {
      if (q.topic && !topicsSet.has(q.topic)) {
        topicsSet.set(q.topic, {
          name: q.topic,
          questionCount: 0
        });
      }
      if (q.topic) {
        topicsSet.get(q.topic).questionCount++;
      }
    });

    return {
      id: key,
      name: subject.name,
      icon: subject.icon,
      color: subject.color,
      description: subject.description,
      questionCount: subject.questions.length,
      difficulties: [...new Set(subject.questions.map(q => q.difficulty))],
      topics: Array.from(topicsSet.values())
    };
  });

  res.json({ subjects });
});

/**
 * GET /api/questions/:subject - Get questions for a subject
 * Query params: difficulty (easy|medium|hard|mixed), count (default 5)
 */
router.get('/questions/:subject', (req, res) => {
  const { subject } = req.params;
  const { difficulty = 'mixed', count = 5, topic = 'all', practice = 'false' } = req.query;

  const subjectData = questionsData.subjects[subject];
  if (!subjectData) {
    return res.status(404).json({ error: 'Subject not found' });
  }

  let questions = [...subjectData.questions];

  // Filter by topic
  if (topic !== 'all') {
    questions = questions.filter(q => q.topic === topic);
  }

  // Filter by difficulty
  if (difficulty !== 'mixed') {
    questions = questions.filter(q => q.difficulty === difficulty);
  }

  // Shuffle questions
  questions = shuffleArray(questions);

  // If mixed, ensure progressive difficulty
  if (difficulty === 'mixed') {
    const easy = questions.filter(q => q.difficulty === 'easy');
    const medium = questions.filter(q => q.difficulty === 'medium');
    const hard = questions.filter(q => q.difficulty === 'hard');
    questions = [...easy, ...medium, ...hard];
  }

  // Limit count
  questions = questions.slice(0, parseInt(count));

  // Return questions. Include ideal answers only if practice=true
  const safeQuestions = questions.map(q => {
    const resQ = {
      id: q.id,
      question: q.question,
      difficulty: q.difficulty,
      topic: q.topic,
      followUp: q.followUp
    };
    if (practice === 'true') {
      resQ.idealAnswer = q.idealAnswer;
      resQ.expectedKeywords = q.expectedKeywords;
    }
    return resQ;
  });

  res.json({
    subject: subjectData.name,
    icon: subjectData.icon,
    questions: safeQuestions,
    totalCount: safeQuestions.length
  });
});

/**
 * GET /api/questions/:subject/:questionId/details - Get full question details (for evaluation)
 * This is an internal route used by the interview route
 */
router.get('/questions/:subject/:questionId/details', (req, res) => {
  const { subject, questionId } = req.params;

  const subjectData = questionsData.subjects[subject];
  if (!subjectData) {
    return res.status(404).json({ error: 'Subject not found' });
  }

  const question = subjectData.questions.find(q => q.id === questionId);
  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }

  res.json({ question });
});

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default router;
