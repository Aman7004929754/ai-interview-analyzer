import { getQuestionsData } from './_lib/data.js';

export default function handler(req, res) {
  const questionsData = getQuestionsData();

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
}
