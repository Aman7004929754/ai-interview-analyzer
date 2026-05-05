import natural from 'natural';

const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

/**
 * Calculate cosine similarity between user answer and ideal answer using TF-IDF
 */
export function calculateSimilarity(userAnswer, idealAnswer) {
  if (!userAnswer || !idealAnswer) return 0;

  const tfidf = new TfIdf();
  tfidf.addDocument(preprocessText(idealAnswer));
  tfidf.addDocument(preprocessText(userAnswer));

  const terms = new Set();
  tfidf.listTerms(0).forEach(item => terms.add(item.term));
  tfidf.listTerms(1).forEach(item => terms.add(item.term));

  const vec1 = [];
  const vec2 = [];
  terms.forEach(term => {
    vec1.push(tfidf.tfidf(term, 0));
    vec2.push(tfidf.tfidf(term, 1));
  });

  return cosineSimilarity(vec1, vec2);
}

/**
 * Calculate keyword coverage
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

    const phraseMatch = answerText.includes(keywordLower);
    const stemMatch = keywordStems.every(stem => answerStems.includes(stem));
    const partialMatch = keywordStems.some(stem =>
      answerStems.some(as => as.includes(stem) || stem.includes(as))
    );

    if (phraseMatch || stemMatch) {
      found.push(keyword);
    } else if (partialMatch) {
      found.push(keyword);
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
 * Evaluate answer completeness
 */
export function evaluateCompleteness(userAnswer, idealAnswer) {
  if (!userAnswer) return 0;

  const userTokens = tokenizer.tokenize(userAnswer);
  const idealTokens = tokenizer.tokenize(idealAnswer);

  const lengthRatio = Math.min(userTokens.length / (idealTokens.length * 0.5), 1.0);
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

  const fillerWords = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'literally', 'so', 'well', 'right', 'okay', 'hmm'];
  const lowerTranscript = transcript.toLowerCase();
  let fillerCount = 0;
  fillerWords.forEach(filler => {
    const regex = new RegExp(`\\b${filler}\\b`, 'gi');
    const matches = lowerTranscript.match(regex);
    if (matches) fillerCount += matches.length;
  });

  const wpmScore = wpm >= 80 && wpm <= 160 ? 1.0 : (wpm < 80 ? wpm / 80 : Math.max(0, 2 - wpm / 160));
  const fillerPenalty = Math.max(0, 1 - (fillerCount * 0.05));

  return {
    wpm: Math.round(wpm),
    fillerCount,
    communicationScore: wpmScore * 0.6 + fillerPenalty * 0.4
  };
}

/**
 * Detects stuttering, repeated words, and duplicate sentences
 */
function detectSpeechDefects(text) {
  if (!text) return [];
  const defects = [];
  const words = text.toLowerCase().split(/\s+/);
  
  // Detect consecutive repeated words (stuttering)
  for (let i = 0; i < words.length - 1; i++) {
    if (words[i] === words[i+1] && words[i].length > 2) {
      defects.push(`Repeated word detected: "${words[i]}"`);
    }
  }

  // Detect duplicate sentences
  const sentences = text.split(/[.!?]+/).map(s => s.trim().toLowerCase()).filter(s => s.length > 10);
  const seenSentences = new Set();
  for (const sentence of sentences) {
    if (seenSentences.has(sentence)) {
      defects.push(`Duplicate sentence detected: "${sentence.substring(0, 30)}..."`);
    }
    seenSentences.add(sentence);
  }

  return [...new Set(defects)];
}

/**
 * Basic summarization by extracting the most significant sentences
 */
function summarizeAnswer(text) {
  if (!text || text.length < 50) return text;
  
  const tfidf = new TfIdf();
  tfidf.addDocument(preprocessText(text));
  
  const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  if (sentences.length <= 2) return text;

  // Score sentences based on tf-idf weight of their words
  const scoredSentences = sentences.map((sentence, index) => {
    const tokens = tokenizer.tokenize(preprocessText(sentence));
    let score = 0;
    tokens.forEach(token => {
      score += tfidf.tfidf(token, 0); // document 0
    });
    return { sentence, score: score / Math.max(tokens.length, 1), index };
  });

  // Pick top 2 sentences
  scoredSentences.sort((a, b) => b.score - a.score);
  const summarySentences = scoredSentences.slice(0, 2).sort((a, b) => a.index - b.index);
  
  return summarySentences.map(s => s.sentence).join(' ');
}

/**
 * Main evaluation function
 */
export function evaluateAnswer(userAnswer, question) {
  const { idealAnswer, expectedKeywords } = question;

  // 1. Detect defects
  const defects = detectSpeechDefects(userAnswer);

  // 2. Summarize user answer
  const summary = summarizeAnswer(userAnswer);

  // 3. Evaluate using the summary to compare against ideal (as requested)
  // Or evaluate original answer for similarity? The user said "summarized and then compared"
  const similarityToIdeal = calculateSimilarity(summary, idealAnswer);
  
  // We still use original answer for keyword coverage so we don't penalize them for our summarizer dropping words
  const keywordResult = calculateKeywordCoverage(userAnswer, expectedKeywords);
  const completeness = evaluateCompleteness(userAnswer, idealAnswer);

  let technicalScore = (similarityToIdeal * 0.40 + keywordResult.score * 0.35 + completeness * 0.25);
  
  // Penalize for defects
  if (defects.length > 0) {
    technicalScore = Math.max(0, technicalScore - (defects.length * 0.5));
  }

  const score = Math.round(technicalScore * 10 * 10) / 10;

  return {
    score: Math.min(score, 10),
    similarity: Math.round(similarityToIdeal * 100),
    keywordCoverage: Math.round(keywordResult.score * 100),
    completeness: Math.round(completeness * 100),
    keywordsFound: keywordResult.found,
    keywordsMissed: keywordResult.missed,
    defects,
    summary
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
