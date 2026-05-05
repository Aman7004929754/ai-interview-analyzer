/**
 * Practice Module Page
 * Allows users to review questions and ideal answers for specific topics
 */

export function renderPractice(container) {
  const subjectId = sessionStorage.getItem('practice_subject');
  const topicId = sessionStorage.getItem('practice_topic') || 'all';

  if (!subjectId) {
    window.location.hash = '#subjects';
    return;
  }

  container.innerHTML = `
    <div class="practice-page" style="padding: var(--space-xl); min-height: 100vh;">
      <nav class="app-nav" style="margin: -var(--space-xl) -var(--space-xl) var(--space-xl) -var(--space-xl);">
        <div class="nav-left">
          <button class="back-btn" id="back-to-subjects">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Subjects
          </button>
        </div>
        <div class="nav-center">
          <span class="text-gradient" style="font-weight: 700; font-size: 1.1rem;">Practice Module</span>
        </div>
        <div class="nav-right"></div>
      </nav>

      <div class="container">
        <div class="page-header" style="text-align: center; margin-bottom: var(--space-2xl);">
          <div class="page-header-icon" id="practice-icon">📖</div>
          <h1 id="practice-title">Loading Practice Mode...</h1>
          <p id="practice-subtitle" style="color: var(--text-secondary);">Focus on mastering these questions</p>
        </div>

        <div id="practice-questions-container" class="practice-questions-grid">
          <div class="loading-screen" style="min-height: 200px;">
            <div class="loading-spinner"></div>
            <div class="loading-text">Fetching questions...</div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById('back-to-subjects').addEventListener('click', () => {
    window.location.hash = '#subjects';
  });

  loadPracticeQuestions(subjectId, topicId);
}

async function loadPracticeQuestions(subjectId, topic) {
  try {
    const response = await fetch(`/api/questions/${subjectId}?topic=${topic}&practice=true&count=30`);
    const data = await response.json();

    if (data.error) throw new Error(data.error);

    document.getElementById('practice-title').innerHTML = `Practice: <span class="text-gradient">${data.subject}</span>`;
    document.getElementById('practice-icon').textContent = data.icon;
    document.getElementById('practice-subtitle').textContent = 
      `${topic === 'all' ? 'All Topics' : 'Topic: ' + topic} • ${data.questions.length} questions available`;

    const container = document.getElementById('practice-questions-container');
    
    if (!data.questions || data.questions.length === 0) {
      container.innerHTML = `<div class="glass-card-static" style="text-align: center;">No questions found for this topic.</div>`;
      return;
    }

    container.innerHTML = data.questions.map((q, i) => `
      <div class="glass-card-static practice-card animate-in" style="animation-delay: ${i * 0.05}s; margin-bottom: var(--space-lg);">
        <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-sm);">
          <span class="badge" style="background: rgba(255,255,255,0.1);">${q.topic || 'General'}</span>
          <span class="badge" style="background: ${q.difficulty === 'hard' ? 'rgba(239, 68, 68, 0.2)' : q.difficulty === 'medium' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(6, 214, 160, 0.2)'}; color: ${q.difficulty === 'hard' ? 'var(--accent-red)' : q.difficulty === 'medium' ? 'var(--accent-orange)' : 'var(--accent-cyan)'};">${q.difficulty.toUpperCase()}</span>
        </div>
        <h3 style="font-size: 1.1rem; margin-bottom: var(--space-md); line-height: 1.5;">${q.question}</h3>
        
        <button class="btn btn-secondary btn-sm show-answer-btn" data-id="${q.id}" style="width: 100%; display: flex; justify-content: space-between; align-items: center;">
          <span>Show Ideal Answer</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
        </button>

        <div class="ideal-answer-panel" id="answer-${q.id}" style="display: none; margin-top: var(--space-md); padding-top: var(--space-md); border-top: 1px solid var(--border-color);">
          <div style="background: rgba(0,0,0,0.2); padding: var(--space-md); border-radius: var(--radius-md); border-left: 2px solid var(--accent-cyan);">
            <h4 style="font-size: 0.85rem; color: var(--accent-cyan); margin-bottom: var(--space-xs); text-transform: uppercase; letter-spacing: 0.05em;">Ideal Approach</h4>
            <p style="color: var(--text-secondary); line-height: 1.6; font-size: 0.95rem; white-space: pre-wrap;">${q.idealAnswer}</p>
          </div>
          ${q.expectedKeywords && q.expectedKeywords.length ? `
            <div style="margin-top: var(--space-md);">
              <h4 style="font-size: 0.8rem; color: var(--text-muted); margin-bottom: var(--space-xs);">Key concepts to mention:</h4>
              <div style="display: flex; flex-wrap: wrap; gap: 4px;">
                ${q.expectedKeywords.map(kw => `<span class="topic-chip">${kw}</span>`).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>
    `).join('');

    // Attach toggle events
    document.querySelectorAll('.show-answer-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const id = e.currentTarget.dataset.id;
        const panel = document.getElementById(`answer-${id}`);
        if (panel.style.display === 'none') {
          panel.style.display = 'block';
          panel.style.animation = 'fadeIn 0.3s ease';
          e.currentTarget.innerHTML = `
            <span>Hide Ideal Answer</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"/></svg>
          `;
        } else {
          panel.style.display = 'none';
          e.currentTarget.innerHTML = `
            <span>Show Ideal Answer</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"/></svg>
          `;
        }
      });
    });

  } catch (err) {
    document.getElementById('practice-questions-container').innerHTML = `
      <div class="glass-card-static" style="text-align: center;">
        <h3 style="color: var(--accent-red);">Failed to load practice questions</h3>
        <p style="color: var(--text-secondary);">${err.message}</p>
      </div>
    `;
  }
}
