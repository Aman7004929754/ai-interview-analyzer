/**
 * Scoring engine - combines technical, behavioral, and communication scores
 */

/**
 * Calculate behavioral score from face analysis data
 * @param {Object} faceData - Expression data from face analysis
 */
export function calculateBehavioralScore(faceData) {
  if (!faceData || !faceData.expressions || faceData.expressions.length === 0) {
    return { score: 7, confidence: 'N/A', nervousness: 'N/A', engagement: 'N/A' };
  }

  const expressions = faceData.expressions;

  // Average expression values
  const avgExpressions = {};
  const expressionKeys = Object.keys(expressions[0] || {});
  expressionKeys.forEach(key => {
    const values = expressions.map(e => e[key] || 0);
    avgExpressions[key] = values.reduce((a, b) => a + b, 0) / values.length;
  });

  // Confidence: high neutral + low fearful/sad
  const confidenceScore = Math.min(1,
    (avgExpressions.neutral || 0) * 0.5 +
    (1 - (avgExpressions.fearful || 0)) * 0.25 +
    (1 - (avgExpressions.sad || 0)) * 0.25
  );

  // Nervousness: high fearful + surprised + expression volatility
  const nervousnessLevel =
    (avgExpressions.fearful || 0) * 0.4 +
    (avgExpressions.surprised || 0) * 0.2 +
    (avgExpressions.angry || 0) * 0.2 +
    (avgExpressions.sad || 0) * 0.2;

  // Engagement: not too much neutral (which could mean disengaged)
  const engagementScore = Math.min(1,
    0.5 + (1 - avgExpressions.neutral || 0) * 0.5
  );

  // Cheat indicators
  const cheatPenalty = faceData.cheatWarnings ? Math.min(faceData.cheatWarnings * 0.1, 0.5) : 0;

  // Calculate expression stability (less volatile = more composed)
  let volatility = 0;
  if (expressions.length > 1) {
    for (let i = 1; i < expressions.length; i++) {
      expressionKeys.forEach(key => {
        volatility += Math.abs((expressions[i][key] || 0) - (expressions[i - 1][key] || 0));
      });
    }
    volatility /= (expressions.length - 1) * expressionKeys.length;
  }
  const stabilityScore = Math.max(0, 1 - volatility * 2);

  // Combined behavioral score (0-10)
  const rawScore = (
    confidenceScore * 0.35 +
    (1 - nervousnessLevel) * 0.25 +
    engagementScore * 0.15 +
    stabilityScore * 0.25
  );

  const finalScore = Math.max(0, Math.min(10, Math.round((rawScore - cheatPenalty) * 10 * 10) / 10));

  return {
    score: finalScore,
    confidence: Math.round(confidenceScore * 100),
    nervousness: Math.round(nervousnessLevel * 100),
    engagement: Math.round(engagementScore * 100),
    stability: Math.round(stabilityScore * 100),
    cheatWarnings: faceData.cheatWarnings || 0
  };
}

/**
 * Calculate communication score
 */
export function calculateCommunicationScore(speechData) {
  if (!speechData) {
    return { score: 7, wpm: 0, fillerCount: 0, clarity: 'N/A' };
  }

  const { wpm, fillerCount, communicationScore } = speechData;

  // Score based on speech metrics
  const score = Math.round((communicationScore || 0.7) * 10 * 10) / 10;

  let clarity = 'Good';
  if (score >= 8) clarity = 'Excellent';
  else if (score >= 6) clarity = 'Good';
  else if (score >= 4) clarity = 'Average';
  else clarity = 'Needs Improvement';

  return {
    score: Math.min(score, 10),
    wpm: wpm || 0,
    fillerCount: fillerCount || 0,
    clarity
  };
}

/**
 * Calculate overall score from all components
 */
export function calculateOverallScore(technicalScore, behavioralScore, communicationScore) {
  // Weighted: Technical 50%, Behavioral 25%, Communication 25%
  const overall = (
    technicalScore * 0.50 +
    behavioralScore * 0.25 +
    communicationScore * 0.25
  );

  return Math.round(overall * 10) / 10;
}

/**
 * Get score grade
 */
export function getScoreGrade(score) {
  if (score >= 8.5) return { grade: 'Excellent', class: 'good' };
  if (score >= 7) return { grade: 'Good', class: 'good' };
  if (score >= 5) return { grade: 'Average', class: 'average' };
  if (score >= 3) return { grade: 'Below Average', class: 'poor' };
  return { grade: 'Needs Improvement', class: 'poor' };
}
