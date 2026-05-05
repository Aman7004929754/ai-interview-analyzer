/**
 * Utility functions
 */

/**
 * Format seconds to MM:SS
 */
export function formatTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Create element with classes and attributes
 */
export function createElement(tag, className, attrs = {}) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  Object.entries(attrs).forEach(([key, val]) => {
    if (key === 'textContent') el.textContent = val;
    else if (key === 'innerHTML') el.innerHTML = val;
    else el.setAttribute(key, val);
  });
  return el;
}

/**
 * Get color class based on score
 */
export function getScoreClass(score) {
  if (score >= 7) return 'good';
  if (score >= 4) return 'warn';
  return 'bad';
}

/**
 * Get badge class based on difficulty
 */
export function getDifficultyBadge(difficulty) {
  switch (difficulty) {
    case 'easy': return 'badge-success';
    case 'medium': return 'badge-warning';
    case 'hard': return 'badge-danger';
    default: return 'badge-info';
  }
}

/**
 * Animate number count-up
 */
export function animateNumber(element, target, duration = 1000) {
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.round(start + (target - start) * eased * 10) / 10;

    element.textContent = current;

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      element.textContent = target;
    }
  }

  requestAnimationFrame(update);
}

/**
 * Create SVG score ring
 */
export function createScoreRing(score, maxScore = 10, size = 160) {
  const normalizedScore = Math.min(score / maxScore, 1);
  const radius = size / 2 - 10;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - normalizedScore * circumference;

  let color = '#06d6a0';
  if (score < 5) color = '#ef4444';
  else if (score < 7) color = '#f59e0b';

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
      <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="8" />
      <circle cx="${size/2}" cy="${size/2}" r="${radius}" fill="none" stroke="${color}" stroke-width="8"
        stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"
        stroke-linecap="round" style="transition: stroke-dashoffset 1.5s ease;" />
    </svg>
  `;
}

/**
 * Debounce function
 */
export function debounce(fn, delay) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
