/**
 * Feedback generator - creates actionable improvement suggestions
 */

import { getScoreGrade } from './scoring.js';

export function generateQuestionFeedback(evaluation, question, faceData) {
  const feedback = [];
  const { score, keywordsFound, keywordsMissed, similarity, completeness } = evaluation;

  if (score < 4) {
    feedback.push({
      type: 'critical',
      icon: '🔴',
      title: 'Needs Significant Improvement',
      text: `Your answer didn't cover the core concepts. The key areas to study are: ${keywordsMissed.slice(0, 5).join(', ')}.`
    });
  } else if (score < 7) {
    feedback.push({
      type: 'improvement',
      icon: '🟡',
      title: 'Partially Correct',
      text: `You covered ${keywordsFound.length} out of ${keywordsFound.length + keywordsMissed.length} key concepts. Try to also mention: ${keywordsMissed.slice(0, 3).join(', ')}.`
    });
  } else {
    feedback.push({
      type: 'positive',
      icon: '🟢',
      title: 'Well Answered',
      text: `Great job! You covered most of the key concepts including ${keywordsFound.slice(0, 3).join(', ')}.`
    });
  }

  if (completeness < 40) {
    feedback.push({
      type: 'improvement',
      icon: '📝',
      title: 'Elaborate More',
      text: 'Your answer was quite brief. Try to provide more detailed explanations with examples.'
    });
  }

  if (evaluation.defects && evaluation.defects.length > 0) {
    feedback.push({
      type: 'critical',
      icon: '⚠️',
      title: 'Speech & Pronunciation Defects',
      text: 'NLP Analysis detected the following issues: ' + evaluation.defects.join('. ')
    });
  }

  if (similarity < 30 && score > 3) {
    feedback.push({
      type: 'suggestion',
      icon: '💡',
      title: 'Different Perspective',
      text: 'Your approach was different from the expected answer. While not necessarily wrong, try to include more standard terms and definitions.'
    });
  }

  return feedback;
}

export function generateOverallSuggestions(sessionData) {
  const suggestions = [];
  const { answers, behavioralScores, communicationScores } = sessionData;

  const avgTechnical = answers.reduce((sum, a) => sum + a.evaluation.score, 0) / answers.length;
  if (avgTechnical < 5) {
    suggestions.push({
      icon: '📚',
      iconBg: 'rgba(239, 68, 68, 0.15)',
      title: 'Strengthen Core Concepts',
      text: 'Review fundamental concepts for this subject. Focus on understanding the "why" behind each concept, not just definitions.'
    });
  }

  const weakQuestions = answers.filter(a => a.evaluation.score < 5);
  if (weakQuestions.length > 0) {
    const missedKeywords = [...new Set(weakQuestions.flatMap(q => q.evaluation.keywordsMissed))];
    if (missedKeywords.length > 0) {
      suggestions.push({
        icon: '🎯',
        iconBg: 'rgba(245, 158, 11, 0.15)',
        title: 'Key Concepts to Study',
        text: `Focus on these concepts you missed: ${missedKeywords.slice(0, 8).join(', ')}.`
      });
    }
  }

  if (behavioralScores) {
    const avgBehavioral = behavioralScores.reduce((sum, b) => sum + b.score, 0) / behavioralScores.length;

    if (avgBehavioral < 6) {
      const avgNervousness = behavioralScores.reduce((sum, b) => sum + (b.nervousness || 0), 0) / behavioralScores.length;

      if (avgNervousness > 40) {
        suggestions.push({
          icon: '😌',
          iconBg: 'rgba(139, 92, 246, 0.15)',
          title: 'Manage Nervousness',
          text: 'You appeared nervous during several questions. Practice deep breathing, maintain eye contact with the camera, and remember — pausing to think is perfectly okay.'
        });
      }

      const totalCheats = behavioralScores.reduce((sum, b) => sum + (b.cheatWarnings || 0), 0);
      if (totalCheats > 2) {
        suggestions.push({
          icon: '👀',
          iconBg: 'rgba(239, 68, 68, 0.15)',
          title: 'Maintain Focus',
          text: `You looked away from the camera ${totalCheats} times. In a real interview, maintain consistent eye contact. Avoid looking at other screens or notes.`
        });
      }
    }

    const avgConfidence = behavioralScores.reduce((sum, b) => sum + (b.confidence || 0), 0) / behavioralScores.length;
    if (avgConfidence < 50) {
      suggestions.push({
        icon: '💪',
        iconBg: 'rgba(6, 214, 160, 0.15)',
        title: 'Build Confidence',
        text: 'Your facial expressions showed low confidence. Practice answering questions aloud, record yourself, and work on maintaining a calm, composed expression.'
      });
    }
  }

  if (communicationScores) {
    const avgWpm = communicationScores.reduce((sum, c) => sum + (c.wpm || 0), 0) / communicationScores.length;
    const totalFillers = communicationScores.reduce((sum, c) => sum + (c.fillerCount || 0), 0);

    if (avgWpm < 80) {
      suggestions.push({
        icon: '🗣️',
        iconBg: 'rgba(59, 130, 246, 0.15)',
        title: 'Speak More Fluently',
        text: 'Your speaking pace was slower than typical. Practice explaining concepts at a natural pace. Aim for 100-140 words per minute for clear communication.'
      });
    } else if (avgWpm > 160) {
      suggestions.push({
        icon: '🐢',
        iconBg: 'rgba(59, 130, 246, 0.15)',
        title: 'Slow Down',
        text: 'You spoke quite fast. Interviewers need time to absorb your answers. Slow down and emphasize key points.'
      });
    }

    if (totalFillers > 5) {
      suggestions.push({
        icon: '🎤',
        iconBg: 'rgba(236, 72, 153, 0.15)',
        title: 'Reduce Filler Words',
        text: `You used ${totalFillers} filler words (um, uh, like, etc.). Practice pausing silently instead of using filler words. This makes you sound more confident and articulate.`
      });
    }
  }

  if (avgTechnical >= 7) {
    suggestions.push({
      icon: '⭐',
      iconBg: 'rgba(6, 214, 160, 0.15)',
      title: 'Strong Technical Knowledge',
      text: 'Your technical answers were impressive! Keep practicing to maintain this level, and focus on articulating your thoughts even more clearly.'
    });
  }

  return suggestions;
}

export function generateSummaryText(overallScore) {
  const { grade } = getScoreGrade(overallScore);

  const summaries = {
    'Excellent': 'Outstanding performance! You demonstrated strong technical knowledge, excellent communication skills, and confident body language. You are well-prepared for real interviews.',
    'Good': 'Good performance overall! You showed solid understanding of the concepts. Focus on the areas highlighted below to reach interview excellence.',
    'Average': 'Decent attempt with room for improvement. Review the feedback below to strengthen your weak areas. Practice explaining concepts aloud to build fluency.',
    'Below Average': 'This interview highlighted several areas that need attention. Don\'t be discouraged — review each question\'s feedback, study the missed concepts, and practice regularly.',
    'Needs Improvement': 'This subject needs significant study and practice. Start with the fundamentals, watch tutorial videos, and practice explaining concepts to build understanding.'
  };

  return summaries[grade] || summaries['Average'];
}
