/**
 * Results Dashboard Page
 * Shows comprehensive interview analysis
 */

import { createScoreRing, getScoreClass, getDifficultyBadge, animateNumber } from '../utils/helpers.js';

export function renderResults(container) {
  const reportData = sessionStorage.getItem('interview_report');
  if (!reportData) {
    window.location.hash = '#home';
    return;
  }

  const report = JSON.parse(reportData);

  container.innerHTML = `
    <div class="results-page">
      <div class="container">
        <button class="back-btn" id="back-to-home">← Back to Home</button>

        <!-- Header -->
        <div class="results-header">
          <h1>${report.icon} Interview Results: <span class="text-gradient">${report.subject}</span></h1>
          <p style="color: var(--text-secondary); margin-bottom: 0.5rem;">
            ${report.answers?.length || 0} questions • ${report.difficulty} difficulty • ${formatDuration(report.duration)}
          </p>
          <div style="display: inline-flex; gap: 1rem; background: rgba(0,0,0,0.2); padding: 0.5rem 1rem; border-radius: 2rem;">
            <span style="color: var(--accent-cyan);"><strong>${report.correctCount || 0}</strong> Correct</span>
            <span style="color: var(--text-muted);">|</span>
            <span style="color: var(--accent-red);"><strong>${report.incorrectCount || 0}</strong> Incorrect/Skipped</span>
          </div>
        </div>

        <!-- Overall Score -->
        <div class="overall-score-section">
          <div class="glass-card-static overall-score-card">
            <div class="overall-score-ring">
              ${createScoreRing(report.overallScore, 10, 160)}
              <div class="score-text ${getScoreClass(report.overallScore)}" id="overall-score-num">${report.overallScore}</div>
            </div>
            <div class="score-label">${report.grade?.grade || 'N/A'}</div>
            <p style="color: var(--text-secondary); font-size: 0.9rem; margin-top: 0.75rem; max-width: 400px;">
              ${report.summary || ''}
            </p>
          </div>
        </div>

        <!-- Score Breakdown -->
        <div class="score-breakdown">
          ${renderBreakdownCard('Technical', report.scores?.technical, '#06d6a0')}
          ${renderBreakdownCard('Behavioral', report.scores?.behavioral, '#8b5cf6')}
          ${renderBreakdownCard('Communication', report.scores?.communication, '#3b82f6')}
        </div>

        <!-- Question-by-Question Results -->
        <div class="question-results">
          <h2>📋 Question-by-Question Analysis</h2>
          ${(report.answers || []).map((a, i) => renderQuestionResult(a, i)).join('')}
        </div>

        <!-- Suggestions -->
        ${renderSuggestions(report.suggestions || [])}

        <!-- Action Buttons -->
        <div style="text-align: center; padding: 2rem 0 3rem;">
          <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-primary btn-lg" id="retry-btn">🔄 Try Again</button>
            <button class="btn btn-secondary btn-lg" id="new-subject-btn">📚 Different Subject</button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Event handlers
  document.getElementById('back-to-home').addEventListener('click', () => {
    window.location.hash = '#home';
  });

  document.getElementById('retry-btn').addEventListener('click', () => {
    window.location.hash = '#interview';
  });

  document.getElementById('new-subject-btn').addEventListener('click', () => {
    window.location.hash = '#subjects';
  });

  // Toggle question details
  container.querySelectorAll('.question-result-header').forEach(header => {
    header.addEventListener('click', () => {
      const body = header.nextElementSibling;
      const arrow = header.querySelector('.toggle-arrow');
      if (body.style.display === 'none') {
        body.style.display = 'block';
        body.style.animation = 'fadeInUp 0.3s ease';
        arrow.textContent = '▼';
      } else {
        body.style.display = 'none';
        arrow.textContent = '▶';
      }
    });
  });
}

function renderBreakdownCard(label, score, color) {
  const safeScore = score || 0;
  const percentWidth = (safeScore / 10) * 100;

  return `
    <div class="glass-card-static breakdown-card animate-in">
      <h4>${label}</h4>
      <div class="breakdown-score" style="color: ${color}">${safeScore}</div>
      <div style="font-size: 0.75rem; color: var(--text-muted);">out of 10</div>
      <div class="breakdown-bar">
        <div class="breakdown-bar-fill" style="width: ${percentWidth}%; background: ${color};"></div>
      </div>
    </div>
  `;
}

function renderQuestionResult(answer, index) {
  const score = answer.score || 0;
  const scoreClass = getScoreClass(score);

  return `
    <div class="glass-card-static question-result-card animate-in" style="animation-delay: ${index * 0.05}s">
      <div class="question-result-header">
        <h4>
          <span class="badge ${getDifficultyBadge(answer.grade?.class === 'good' ? 'easy' : answer.grade?.class === 'average' ? 'medium' : 'hard')}" style="margin-right: 0.5rem;">
            ${score}/10
          </span>
          Q${answer.questionNumber}: ${answer.questionText}
        </h4>
        <span class="toggle-arrow" style="color: var(--text-muted); font-size: 0.8rem; flex-shrink: 0;">▶</span>
      </div>
      <div class="question-result-body" style="display: none;">
        <div class="answer-comparison">
          <div class="answer-box">
            <h5>Your Answer (Raw Transcript)</h5>
            <p>${answer.userAnswer || '(No answer provided)'}</p>
            ${answer.summary && answer.userAnswer.length > answer.summary.length ? `
              <div style="margin-top: 0.5rem; padding-top: 0.5rem; border-top: 1px dashed rgba(255,255,255,0.1);">
                <h5 style="color: var(--accent-cyan); margin-bottom: 0.25rem;">AI Extracted Summary</h5>
                <p style="font-size: 0.9rem; color: var(--text-secondary);">${answer.summary}</p>
              </div>
            ` : ''}
          </div>
          <div class="answer-box">
            <h5>Ideal Answer</h5>
            <p>${answer.idealAnswer || ''}</p>
          </div>
        </div>
        
        <div style="margin-bottom: 1rem;">
          <h5 style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 0.5rem;">Key Concepts</h5>
          <div class="evaluation-keywords">
            ${(answer.keywordsFound || []).map(k => `<span class="keyword-tag found">✓ ${k}</span>`).join('')}
            ${(answer.keywordsMissed || []).map(k => `<span class="keyword-tag missed">✗ ${k}</span>`).join('')}
          </div>
        </div>

        ${(answer.feedback || []).map(f => `
          <div style="padding: 0.5rem 0; color: var(--text-secondary); font-size: 0.9rem;">
            ${f.icon} <strong>${f.title}:</strong> ${f.text}
          </div>
        `).join('')}

        ${answer.behavioralScore ? `
          <div style="display: flex; gap: 1rem; margin-top: 0.75rem; flex-wrap: wrap;">
            <span class="badge badge-info">Confidence: ${answer.behavioralScore.confidence || 'N/A'}%</span>
            <span class="badge ${answer.behavioralScore.nervousness > 40 ? 'badge-danger' : 'badge-success'}">Nervousness: ${answer.behavioralScore.nervousness || 'N/A'}%</span>
            ${answer.communicationScore ? `<span class="badge badge-info">WPM: ${answer.communicationScore.wpm || 0}</span>` : ''}
          </div>
        ` : ''}
      </div>
    </div>
  `;
}

function renderSuggestions(suggestions) {
  if (!suggestions || suggestions.length === 0) return '';

  return `
    <div class="suggestions-section">
      <h2>💡 Improvement Suggestions</h2>
      ${suggestions.map(s => `
        <div class="suggestion-item animate-in">
          <div class="suggestion-icon" style="background: ${s.iconBg || 'rgba(6, 214, 160, 0.15)'};">
            ${s.icon}
          </div>
          <div>
            <h4>${s.title}</h4>
            <p>${s.text}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

function formatDuration(seconds) {
  if (!seconds) return 'N/A';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}
