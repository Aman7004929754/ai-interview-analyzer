/**
 * AI Interview Analyzer - Main Application Entry Point
 * Simple hash-based router for SPA navigation
 */

import { renderLanding } from './pages/landing.js';
import { renderSubjects } from './pages/subjects.js';
import { renderInterview, cleanupInterview } from './pages/interview.js';
import { renderResults } from './pages/results.js';
import { renderLogin } from './pages/login.js';
import { renderPractice } from './pages/practice.js';

const app = document.getElementById('app');

// Route definitions
const routes = {
  '#login': renderLogin,
  '#home': renderLanding,
  '#subjects': renderSubjects,
  '#interview': renderInterview,
  '#results': renderResults,
  '#practice': renderPractice
};

let currentRoute = null;

/**
 * Router - handle hash changes
 */
function router() {
  let hash = window.location.hash || '#home';

  // Check authentication
  const isAuthenticated = !!localStorage.getItem('user_name');
  if (!isAuthenticated && hash !== '#login') {
    window.location.hash = '#login';
    return;
  } else if (isAuthenticated && hash === '#login') {
    window.location.hash = '#home';
    return;
  }

  // Cleanup previous route if needed
  if (currentRoute === '#interview' && hash !== '#interview') {
    cleanupInterview();
  }

  currentRoute = hash;
  const renderFn = routes[hash] || routes['#home'];

  // Clear app container
  app.innerHTML = '';

  // Render the page
  renderFn(app);

  // Scroll to top
  window.scrollTo(0, 0);
}

// Listen for hash changes
window.addEventListener('hashchange', router);

// Initial route
window.addEventListener('DOMContentLoaded', () => {
  if (!window.location.hash) {
    window.location.hash = !!localStorage.getItem('user_name') ? '#home' : '#login';
  }
  router();
});

// Handle initial load
router();
