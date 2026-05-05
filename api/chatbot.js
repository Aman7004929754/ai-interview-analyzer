import { getQuestionsData } from './_lib/data.js';

/**
 * AI Interview Chatbot API
 * A custom chatbot that answers interview preparation questions
 * using the local questions database as its knowledge base.
 */

// Knowledge base for interview tips
const interviewTips = {
  general: [
    "Always structure your answer using the STAR method: Situation, Task, Action, Result.",
    "Practice explaining concepts as if teaching someone. Clarity shows deep understanding.",
    "Take a moment to think before answering. Interviewers appreciate thoughtful responses over rushed ones.",
    "Use specific examples and real-world analogies to make your answers memorable.",
    "If you don't know the answer, be honest — then explain how you'd approach finding it.",
    "Maintain eye contact with the camera and speak clearly at a moderate pace.",
    "End your answers with a summary statement to reinforce your key points."
  ],
  behavioral: [
    "Show self-awareness by discussing both strengths and areas you're improving.",
    "Quantify your achievements whenever possible — numbers make impact tangible.",
    "Demonstrate growth mindset by sharing examples of learning from failures.",
    "Show enthusiasm for the role and the technology you'd be working with."
  ],
  technical: [
    "Always mention time and space complexity when discussing algorithms.",
    "Draw diagrams mentally or verbally walk through examples to show your thought process.",
    "Consider edge cases and mention them proactively — it shows thoroughness.",
    "If asked about a data structure, compare it with alternatives to show breadth of knowledge."
  ]
};

function findRelevantAnswer(query, questionsData) {
  const queryLower = query.toLowerCase();
  const words = queryLower.split(/\s+/).filter(w => w.length > 3);
  
  let bestMatch = null;
  let bestScore = 0;

  for (const [subjectKey, subject] of Object.entries(questionsData.subjects)) {
    for (const q of subject.questions) {
      let score = 0;
      const questionLower = q.question.toLowerCase();
      const idealLower = q.idealAnswer.toLowerCase();
      const topicLower = (q.topic || '').toLowerCase();
      
      // Check keyword matches
      words.forEach(word => {
        if (questionLower.includes(word)) score += 3;
        if (idealLower.includes(word)) score += 1;
        if (topicLower.includes(word)) score += 5;
        if (q.expectedKeywords) {
          q.expectedKeywords.forEach(kw => {
            if (kw.toLowerCase().includes(word)) score += 4;
          });
        }
      });

      // Direct topic match
      if (queryLower.includes(topicLower) && topicLower.length > 3) score += 10;
      
      // Subject name match
      if (queryLower.includes(subject.name.toLowerCase())) score += 8;

      if (score > bestScore) {
        bestScore = score;
        bestMatch = { question: q, subject: subject.name, subjectKey };
      }
    }
  }

  return bestScore > 3 ? bestMatch : null;
}

function generateBotResponse(message, questionsData) {
  const msgLower = message.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|good morning|good evening|namaste)/.test(msgLower)) {
    return {
      text: "Hello! 👋 I'm your AI Interview Preparation Assistant. I can help you with:\n\n• **Explaining interview topics** — Ask me about any CS concept\n• **Practice tips** — How to structure your answers\n• **Subject guidance** — Which topics to focus on\n• **Mock Q&A** — I'll give you a sample question with an ideal answer\n\nWhat would you like to know?",
      type: 'greeting'
    };
  }

  // Ask for a practice question
  if (/give me a question|practice question|sample question|quiz me|test me|ask me/i.test(msgLower)) {
    const subjects = Object.values(questionsData.subjects);
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
    const randomQuestion = randomSubject.questions[Math.floor(Math.random() * randomSubject.questions.length)];
    
    return {
      text: `Here's a **${randomQuestion.difficulty}** question from **${randomSubject.name}** (${randomQuestion.topic}):\n\n> *"${randomQuestion.question}"*\n\nTry answering this, then I can share the ideal answer! Just say **"show answer"**.`,
      type: 'question',
      questionData: randomQuestion
    };
  }

  // Show answer
  if (/show answer|ideal answer|what's the answer|tell me the answer/i.test(msgLower)) {
    return {
      text: "To see the ideal answer, try answering the question first in a mock interview! Go to **Start Interview** and select a subject. I'll evaluate your answer and show you the ideal response with feedback.\n\n💡 **Tip:** " + interviewTips.technical[Math.floor(Math.random() * interviewTips.technical.length)],
      type: 'tip'
    };
  }

  // Tips
  if (/tip|advice|suggestion|how to prepare|how to answer|interview tips/i.test(msgLower)) {
    const allTips = [...interviewTips.general, ...interviewTips.behavioral, ...interviewTips.technical];
    const selectedTips = [];
    const indices = new Set();
    while (selectedTips.length < 3 && indices.size < allTips.length) {
      const idx = Math.floor(Math.random() * allTips.length);
      if (!indices.has(idx)) {
        indices.add(idx);
        selectedTips.push(allTips[idx]);
      }
    }
    
    return {
      text: `Here are some interview tips for you:\n\n${selectedTips.map((t, i) => `${i + 1}. ${t}`).join('\n\n')}\n\n💬 Ask me about a specific topic for more detailed guidance!`,
      type: 'tips'
    };
  }

  // List subjects
  if (/what subjects|which subjects|available subjects|what can i practice|subjects list/i.test(msgLower)) {
    const subjectList = Object.entries(questionsData.subjects)
      .map(([key, s]) => {
        const topics = [...new Set(s.questions.map(q => q.topic))];
        return `${s.icon} **${s.name}** — Topics: ${topics.join(', ')} (${s.questions.length} questions)`;
      })
      .join('\n');
    
    return {
      text: `Here are the available subjects:\n\n${subjectList}\n\nClick **Start Interview** on the home page to begin practicing!`,
      type: 'subjects'
    };
  }

  // Try to find a relevant answer from the knowledge base
  const match = findRelevantAnswer(message, questionsData);
  
  if (match) {
    const q = match.question;
    return {
      text: `Great question! Here's what you should know about **${q.topic}** in **${match.subject}**:\n\n📝 **Common Interview Question:**\n> *"${q.question}"*\n\n✅ **Key Points to Cover:**\n${q.expectedKeywords.slice(0, 6).map(k => `• ${k}`).join('\n')}\n\n📖 **Ideal Answer Approach:**\n${q.idealAnswer.substring(0, 300)}${q.idealAnswer.length > 300 ? '...' : ''}\n\n💡 **Tip:** Practice this in a mock interview with the **Start Interview** button for AI-powered feedback!`,
      type: 'answer'
    };
  }

  // Default response
  return {
    text: "I'm specialized in interview preparation for Computer Science topics. I can help with:\n\n• **DSA** — Data Structures, Algorithms, Trees, DP\n• **Operating Systems** — Processes, Memory, Scheduling\n• **DBMS** — SQL, Normalization, Transactions\n• **Networks** — OSI, TCP/IP, Protocols\n• **OOP** — Principles, Design Patterns\n• **Web Dev** — Frontend, Backend, Security\n• **Machine Learning** — Supervised/Unsupervised, Deep Learning\n\nTry asking something like:\n- *\"Explain process scheduling\"*\n- *\"Give me tips for technical interviews\"*\n- *\"What is dynamic programming?\"*",
    type: 'help'
  };
}

export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message } = req.body;

  if (!message || !message.trim()) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const questionsData = getQuestionsData();
  const response = generateBotResponse(message, questionsData);

  res.json({
    reply: response.text,
    type: response.type
  });
}
