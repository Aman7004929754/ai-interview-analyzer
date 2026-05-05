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
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { subject, difficulty = 'mixed', questionCount = 5, topic = 'all' } = req.body;

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

  // Group by topic
  const questionsByTopic = {};
  questions.forEach(q => {
    if (!questionsByTopic[q.topic]) {
      questionsByTopic[q.topic] = [];
    }
    questionsByTopic[q.topic].push(q);
  });

  // Pick one question from each topic
  let selectedQuestions = [];
  const topics = Object.keys(questionsByTopic);
  
  // Shuffle topics
  const shuffledTopics = shuffleArray(topics);
  
  shuffledTopics.forEach(topic => {
    const topicQuestions = questionsByTopic[topic];
    if (topicQuestions && topicQuestions.length > 0) {
      const selected = topicQuestions[Math.floor(Math.random() * topicQuestions.length)];
      selectedQuestions.push(selected);
    }
  });

  // Adjust to questionCount
  if (selectedQuestions.length > parseInt(questionCount)) {
    selectedQuestions = selectedQuestions.slice(0, parseInt(questionCount));
  } else if (selectedQuestions.length < parseInt(questionCount)) {
    // If we need more questions, pick randomly from remaining
    const remaining = questions.filter(q => !selectedQuestions.includes(q));
    const extra = shuffleArray(remaining).slice(0, parseInt(questionCount) - selectedQuestions.length);
    selectedQuestions = [...selectedQuestions, ...extra];
  }

  // Progressive difficulty for mixed
  if (difficulty === 'mixed') {
    const easy = selectedQuestions.filter(q => q.difficulty === 'easy');
    const medium = selectedQuestions.filter(q => q.difficulty === 'medium');
    const hard = selectedQuestions.filter(q => q.difficulty === 'hard');
    selectedQuestions = [...easy, ...medium, ...hard];
  } else {
    selectedQuestions = shuffleArray(selectedQuestions);
  }

  questions = selectedQuestions;

  // Generate a simple session token (not a real session — state is client-side)
  const sessionId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);

  // Return first question (without ideal answer) + full session state for client to hold
  const firstQuestion = {
    id: questions[0].id,
    question: questions[0].question,
    difficulty: questions[0].difficulty
  };

  // Session state the client must hold and send back with each /answer call
  const sessionState = {
    subject,
    subjectName: subjectData.name,
    subjectIcon: subjectData.icon,
    difficulty,
    questions, // includes idealAnswer + expectedKeywords (needed server-side for eval)
    currentIndex: 0,
    answers: [],
    behavioralScores: [],
    communicationScores: [],
    startTime: Date.now()
  };

  res.json({
    sessionId,
    subject: subjectData.name,
    icon: subjectData.icon,
    totalQuestions: questions.length,
    currentQuestion: 1,
    question: firstQuestion,
    sessionState
  });
}
