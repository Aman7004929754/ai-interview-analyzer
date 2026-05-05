import { getQuestionsData } from '../_lib/data.js';

function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function handler(req, res) {
  const { subject } = req.query;
  const { difficulty = 'mixed', count = 20, topic = 'all' } = req.query;

  const questionsData = getQuestionsData();
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

  // Return questions with ideal answers for practice mode
  const practiceQuestions = questions.map(q => ({
    id: q.id,
    question: q.question,
    difficulty: q.difficulty,
    topic: q.topic,
    idealAnswer: q.idealAnswer,
    expectedKeywords: q.expectedKeywords
  }));

  res.json({
    subject: subjectData.name,
    icon: subjectData.icon,
    questions: practiceQuestions,
    totalCount: practiceQuestions.length
  });
}
