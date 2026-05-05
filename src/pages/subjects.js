/**
 * Subject Selection Page
 * Shows subjects with expandable topics and interview configuration
 */

import { getDifficultyBadge } from '../utils/helpers.js';

let selectedDifficulty = 'mixed';
let selectedQuestionCount = 5;
let selectedSubject = null;
let selectedTopic = 'all';

export function renderSubjects(container) {
  const userName = localStorage.getItem('user_name') || 'Guest';

  container.innerHTML = `
    <div class="subjects-page">
      <!-- Top Navbar -->
      <nav class="app-nav">
        <div class="nav-left">
          <button class="back-btn" id="back-to-landing">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back
          </button>
        </div>
        <div class="nav-center">
          <span class="text-gradient" style="font-weight: 700; font-size: 1.1rem;">AI Interview Analyzer</span>
        </div>
        <div class="nav-right">
          <div class="nav-avatar">${userName.charAt(0).toUpperCase()}</div>
        </div>
      </nav>

      <div class="container">
        <div class="page-header">
          <div class="page-header-icon">📚</div>
          <h1>Choose Your <span class="text-gradient">Subject</span></h1>
          <p>Select a subject, explore its topics, and start your mock interview</p>
        </div>

        <div class="subjects-grid" id="subjects-grid">
          <div class="loading-screen" style="min-height: 200px; grid-column: 1 / -1;">
            <div class="loading-spinner"></div>
            <div class="loading-text">Loading subjects...</div>
          </div>
        </div>

        <!-- Settings Panel (shown after selecting a subject) -->
        <div class="interview-setup-panel glass-card-static" id="setup-panel" style="display: none;">
          <div class="setup-header">
            <div class="setup-subject-info" id="setup-subject-info"></div>
            <button class="btn btn-secondary btn-sm" id="change-subject-btn">Change Subject</button>
          </div>

          <div class="setup-topics" id="setup-topics"></div>

          <div class="setup-options">
            <div class="setup-option">
              <h4>Difficulty Level</h4>
              <div class="difficulty-options" id="difficulty-options">
                <button class="difficulty-btn active" data-diff="mixed">🎯 Mixed</button>
                <button class="difficulty-btn" data-diff="easy">🟢 Easy</button>
                <button class="difficulty-btn" data-diff="medium">🟡 Medium</button>
                <button class="difficulty-btn" data-diff="hard">🔴 Hard</button>
              </div>
            </div>
            <div class="setup-option">
              <h4>Number of Questions</h4>
              <div class="difficulty-options" id="count-options">
                <button class="difficulty-btn" data-count="3">3</button>
                <button class="difficulty-btn active" data-count="5">5</button>
                <button class="difficulty-btn" data-count="8">8</button>
                <button class="difficulty-btn" data-count="10">10</button>
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 1rem; margin-top: 1.5rem;">
            <button class="btn btn-secondary btn-lg" id="start-practice-final" style="flex: 1;">
              📖 Practice Mode
            </button>
            <button class="btn btn-primary btn-lg" id="start-interview-final" style="flex: 2;">
              🚀 Start Interview
            </button>
          </div>
        </div>
      </div>
    </div>
  `;

  // Back button
  document.getElementById('back-to-landing').addEventListener('click', () => {
    window.location.hash = '#home';
  });

  // Difficulty buttons
  document.getElementById('difficulty-options').addEventListener('click', (e) => {
    const btn = e.target.closest('.difficulty-btn');
    if (!btn) return;
    document.querySelectorAll('#difficulty-options .difficulty-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedDifficulty = btn.dataset.diff;
  });

  // Count buttons
  document.getElementById('count-options').addEventListener('click', (e) => {
    const btn = e.target.closest('.difficulty-btn');
    if (!btn) return;
    document.querySelectorAll('#count-options .difficulty-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    selectedQuestionCount = parseInt(btn.dataset.count);
  });

  // Change subject button
  document.getElementById('change-subject-btn').addEventListener('click', () => {
    document.getElementById('setup-panel').style.display = 'none';
    document.getElementById('subjects-grid').style.display = 'grid';
    selectedSubject = null;
  });

  // Start interview
  document.getElementById('start-interview-final').addEventListener('click', () => {
    if (selectedSubject) {
      sessionStorage.setItem('interview_subject', selectedSubject);
      sessionStorage.setItem('interview_difficulty', selectedDifficulty);
      sessionStorage.setItem('interview_count', selectedQuestionCount.toString());
      sessionStorage.setItem('interview_topic', selectedTopic);
      window.location.hash = '#interview';
    }
  });

  // Start practice mode
  document.getElementById('start-practice-final').addEventListener('click', () => {
    if (selectedSubject) {
      sessionStorage.setItem('practice_subject', selectedSubject);
      sessionStorage.setItem('practice_topic', selectedTopic);
      window.location.hash = '#practice';
    }
  });

  loadSubjects();
}

async function loadSubjects() {
  try {
    const response = await fetch('/api/subjects');
    const data = await response.json();

    const grid = document.getElementById('subjects-grid');
    grid.innerHTML = data.subjects.map((subject, i) => `
      <div class="subject-card-wrapper animate-in" data-subject="${subject.id}" style="animation-delay: ${i * 0.06}s">
        <div class="glass-card subject-card">
          <div class="subject-card-accent" style="background: ${subject.color};"></div>
          <div class="subject-card-header">
            <div class="subject-icon-lg" style="background: ${subject.color}18; color: ${subject.color};">
              <span>${subject.icon}</span>
            </div>
            <div>
              <h3>${subject.name}</h3>
              <span class="subject-count">${subject.questionCount} questions • ${subject.topics?.length || 0} topics</span>
            </div>
          </div>
          <p class="description">${subject.description}</p>
          <div class="subject-topics-preview">
            ${(subject.topics || []).map(t => `
              <span class="topic-chip" style="border-color: ${subject.color}40; color: ${subject.color};">
                ${t.name} <small>(${t.questionCount})</small>
              </span>
            `).join('')}
          </div>
          <div class="subject-card-footer">
            <div class="subject-meta">
              ${subject.difficulties.map(d => `<span class="badge ${getDifficultyBadge(d)}">${d}</span>`).join('')}
            </div>
            <span class="subject-arrow">→</span>
          </div>
        </div>
      </div>
    `).join('');

    // Click handlers
    grid.querySelectorAll('.subject-card-wrapper').forEach(card => {
      card.addEventListener('click', () => {
        const subjectId = card.dataset.subject;
        const subject = data.subjects.find(s => s.id === subjectId);
        if (subject) {
          selectSubject(subject);
        }
      });
    });
  } catch (error) {
    const grid = document.getElementById('subjects-grid');
    grid.innerHTML = `
      <div class="glass-card-static" style="grid-column: 1 / -1; text-align: center; padding: 3rem;">
        <h3 style="color: var(--accent-red);">⚠️ Could not load subjects</h3>
        <p style="color: var(--text-secondary); margin-top: 0.5rem;">Make sure the backend server is running on port 3001.</p>
        <button class="btn btn-secondary" style="margin-top: 1rem;" onclick="location.reload()">Retry</button>
      </div>
    `;
  }
}

function selectSubject(subject) {
  selectedSubject = subject.id;
  selectedTopic = 'all'; // Default to all topics

  // Hide grid, show setup panel
  document.getElementById('subjects-grid').style.display = 'none';
  const panel = document.getElementById('setup-panel');
  panel.style.display = 'block';
  panel.style.animation = 'fadeInUp 0.4s ease';

  // Populate subject info
  document.getElementById('setup-subject-info').innerHTML = `
    <div class="subject-icon-lg" style="background: ${subject.color}18; color: ${subject.color};">
      <span>${subject.icon}</span>
    </div>
    <div>
      <h3>${subject.name}</h3>
      <p style="color: var(--text-secondary); font-size: 0.85rem;">${subject.questionCount} questions available</p>
    </div>
  `;

  // Populate topics (make them selectable)
  document.getElementById('setup-topics').innerHTML = `
    <h4 style="margin-bottom: 0.75rem; font-size: 0.9rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.05em;">Topics Covered</h4>
    <div class="topics-grid" id="topics-selection-grid">
      <div class="topic-card animate-in active" data-topic="all" style="cursor: pointer; border-left: 3px solid ${subject.color};">
        <div class="topic-name">All Topics</div>
        <div class="topic-count">${subject.questionCount} questions</div>
      </div>
      ${(subject.topics || []).map((t, i) => `
        <div class="topic-card animate-in" data-topic="${t.name}" style="cursor: pointer; animation-delay: ${(i+1) * 0.05}s; border-left: 3px solid transparent;">
          <div class="topic-name">${t.name}</div>
          <div class="topic-count">${t.questionCount} questions</div>
        </div>
      `).join('')}
    </div>
  `;

  // Topic selection click handler
  document.getElementById('topics-selection-grid').addEventListener('click', (e) => {
    const card = e.target.closest('.topic-card');
    if (!card) return;
    
    document.querySelectorAll('#topics-selection-grid .topic-card').forEach(c => {
      c.classList.remove('active');
      c.style.borderLeftColor = 'transparent';
      c.style.background = 'rgba(255, 255, 255, 0.03)';
    });
    
    card.classList.add('active');
    card.style.borderLeftColor = subject.color;
    card.style.background = 'rgba(255, 255, 255, 0.08)';
    
    selectedTopic = card.dataset.topic;
  });
}
