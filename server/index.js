import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import questionsRouter from './routes/questions.js';
import interviewRouter from './routes/interview.js';

// API handlers (Vercel-compatible)
import subjectsHandler from '../api/subjects.js';
import healthHandler from '../api/health.js';
import loginHandler from '../api/auth/login.js';
import registerHandler from '../api/auth/register.js';
import chatbotHandler from '../api/chatbot.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// API Routes
app.use('/api', questionsRouter);
// Vercel-compatible routes
app.get('/api/subjects', (req, res) => subjectsHandler(req, res));
app.get('/api/health', (req, res) => healthHandler(req, res));
app.post('/api/auth/login', (req, res) => loginHandler(req, res));
app.post('/api/auth/register', (req, res) => registerHandler(req, res));
app.post('/api/chatbot', (req, res) => chatbotHandler(req, res));

import interviewStartHandler from '../api/interview/start.js';
import interviewAnswerHandler from '../api/interview/answer.js';
import interviewEndHandler from '../api/interview/end.js';

app.post('/api/interview/start', (req, res) => interviewStartHandler(req, res));
app.post('/api/interview/answer', (req, res) => interviewAnswerHandler(req, res));
app.post('/api/interview/end', (req, res) => interviewEndHandler(req, res));

// Start server
app.listen(PORT, () => {
  console.log(`\n🎯 AI Interview Analyzer - Backend Server`);
  console.log(`   Running on http://localhost:${PORT}`);
  console.log(`   API endpoints:`);
  console.log(`   - GET  /api/subjects`);
  console.log(`   - GET  /api/questions/:subject`);
  console.log(`   - POST /api/interview/start`);
  console.log(`   - POST /api/interview/answer`);
  console.log(`   - POST /api/interview/end`);
  console.log(`   - POST /api/auth/login`);
  console.log(`   - POST /api/auth/register`);
  console.log(`   - POST /api/chatbot`);
  console.log(`   - GET  /api/health\n`);
});
