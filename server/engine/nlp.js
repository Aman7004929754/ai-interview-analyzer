import natural from 'natural';

const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

/**
 * NLP Engine for evaluating interview answers
 * Uses TF-IDF vectorization, cosine similarity, and keyword matching
 */

/**
 * Calculate cosine similarity between user answer and ideal answer using TF-IDF
 */
export function calculateSimilarity(userAnswer, idealAnswer) {
  if (!userAnswer || !idealAnswer) return 0;

  const tfidf = new TfIdf();
  tfidf.addDocument(preprocessText(idealAnswer));
  tfidf.addDocument(preprocessText(userAnswer));

  // Get terms from both documents
  const terms = new Set();
  tfidf.listTerms(0).forEach(item => terms.add(item.term));
  tfidf.listTerms(1).forEach(item => terms.add(item.term));

  // Build vectors
  const vec1 = [];
  const vec2 = [];
  terms.forEach(term => {
    vec1.push(tfidf.tfidf(term, 0));
    vec2.push(tfidf.tfidf(term, 1));
  });

  return cosineSimilarity(vec1, vec2);
}

/**
 * Calculate keyword coverage - what percentage of expected keywords
 * the user mentioned in their answer
 */
export function calculateKeywordCoverage(userAnswer, expectedKeywords) {
  if (!userAnswer || !expectedKeywords || expectedKeywords.length === 0) return { score: 0, found: [], missed: [] };

  const normalizedAnswer = preprocessText(userAnswer);
  const answerTokens = tokenizer.tokenize(normalizedAnswer);
  const answerStems = answerTokens.map(t => stemmer.stem(t.toLowerCase()));
  const answerText = normalizedAnswer.toLowerCase();

  const found = [];
  const missed = [];

  expectedKeywords.forEach(keyword => {
    const keywordLower = keyword.toLowerCase();
    const keywordStems = tokenizer.tokenize(keywordLower).map(t => stemmer.stem(t));

    // Check if keyword phrase exists in answer text
    const phraseMatch = answerText.includes(keywordLower);

    // Check if individual keyword stems exist in answer stems
    const stemMatch = keywordStems.every(stem => answerStems.includes(stem));

    // Check partial match (at least one stem matches)
    const partialMatch = keywordStems.some(stem =>
      answerStems.some(as => as.includes(stem) || stem.includes(as))
    );

    if (phraseMatch || stemMatch) {
      found.push(keyword);
    } else if (partialMatch) {
      found.push(keyword); // Count partial as found but could weight differently
    } else {
      missed.push(keyword);
    }
  });

  return {
    score: found.length / expectedKeywords.length,
    found,
    missed
  };
}

/**
 * Evaluate answer completeness based on length and structure
 */
export function evaluateCompleteness(userAnswer, idealAnswer) {
  if (!userAnswer) return 0;

  const userTokens = tokenizer.tokenize(userAnswer);
  const idealTokens = tokenizer.tokenize(idealAnswer);

  // Length ratio (capped at 1.0)
  const lengthRatio = Math.min(userTokens.length / (idealTokens.length * 0.5), 1.0);

  // Check for structured answer (has multiple points/sentences)
  const sentenceCount = userAnswer.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
  const structureScore = Math.min(sentenceCount / 3, 1.0);

  return (lengthRatio * 0.6 + structureScore * 0.4);
}

/**
 * Analyze speech fluency metrics
 */
export function analyzeSpeechFluency(transcript, durationSeconds) {
  if (!transcript || !durationSeconds) return { wpm: 0, fillerCount: 0, pauseScore: 1 };

  const words = tokenizer.tokenize(transcript);
  const wpm = (words.length / durationSeconds) * 60;

  // Detect filler words
  const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'so', 'well', 'right', 'okay', 'hmm'];
  const lowerTranscript = transcript.toLowerCase();
  let fillerCount = 0;
  fillerWords.forEach(filler => {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = lowerTranscript.match(regex);
    if (matches) fillerCount += matches.length;
  });

  // Communication score based on WPM and fillers
  const wpmScore = wpm >= 80 && wpm <= 160 ? 1.0 : (wpm < 80 ? wpm / 80 : Math.max(0, 2 - wpm / 160));
  const fillerPenalty = Math.max(0, 1 - (fillerCount * 0.05));

  return {
    wpm: Math.round(wpm),
    fillerCount,
    communicationScore: wpmScore * 0.6 + fillerPenalty * 0.4
  };
}

/**
 * Main evaluation function - evaluates a user's answer against the ideal
 */
export function evaluateAnswer(userAnswer, question) {
  const { idealAnswer, expectedKeywords } = question;

  // Calculate components
  const similarity = calculateSimilarity(userAnswer, idealAnswer);
  const keywordResult = calculateKeywordCoverage(userAnswer, expectedKeywords);
  const completeness = evaluateCompleteness(userAnswer, idealAnswer);

  // Weighted score: similarity 40%, keywords 35%, completeness 25%
  const technicalScore = (similarity * 0.40 + keywordResult.score * 0.35 + completeness * 0.25);

  // Scale to 0-10
  const score = Math.round(technicalScore * 10 * 10) / 10;

  return {
    score: Math.min(score, 10),
    similarity: Math.round(similarity * 100),
    keywordCoverage: Math.round(keywordResult.score * 100),
    completeness: Math.round(completeness * 100),
    keywordsFound: keywordResult.found,
    keywordsMissed: keywordResult.missed
  };
}

// --- Utility Functions ---

function preprocessText(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cosineSimilarity(vec1, vec2) {
  if (vec1.length !== vec2.length || vec1.length === 0) return 0;

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < vec1.length; i++) {
    dotProduct += vec1[i] * vec2[i];
    norm1 += vec1[i] * vec1[i];
    norm2 += vec2[i] * vec2[i];
  }

  norm1 = Math.sqrt(norm1);
  norm2 = Math.sqrt(norm2);

  if (norm1 === 0 || norm2 === 0) return 0;

  return dotProduct / (norm1 * norm2);
}
