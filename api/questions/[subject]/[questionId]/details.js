import { getQuestionsData } from '../../../_lib/data.js';

export default function handler(req, res) {
  const { subject, questionId } = req.query;

  const questionsData = getQuestionsData();
  const subjectData = questionsData.subjects[subject];

  if (!subjectData) {
    return res.status(404).json({ error: 'Subject not found' });
  }

  const question = subjectData.questions.find(q => q.id === questionId);
  if (!question) {
    return res.status(404).json({ error: 'Question not found' });
  }

  res.json({ question });
}
