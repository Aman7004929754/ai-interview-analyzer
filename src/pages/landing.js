/**
 * Landing Page — Dashboard Home
 */

export function renderLanding(container) {
  const userName = localStorage.getItem('user_name') || 'Guest';

  container.innerHTML = `
    <div class="landing-page">
      <!-- Top Navbar -->
      <nav class="app-nav">
        <div class="nav-left">
          <div class="nav-logo">
            <div class="nav-logo-icon">M</div>
            <span class="text-gradient" style="font-weight: 800; font-size: 1.15rem;">MockMaster</span>
          </div>
        </div>
        <div class="nav-center">
          <a href="#home" class="nav-link active">Home</a>
          <a href="#subjects" class="nav-link">Practice</a>
        </div>
        <div class="nav-right">
          <button class="nav-chat-btn" id="open-chatbot-btn" title="AI Assistant">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          </button>
          <div class="nav-user-menu">
            <div class="nav-avatar">${userName.charAt(0).toUpperCase()}</div>
            <span class="nav-username">${userName}</span>
            <button id="logout-btn" class="nav-logout-btn" title="Sign out">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </button>
          </div>
        </div>
      </nav>

      <!-- Hero Section -->
      <div class="hero">
        <div class="hero-bg-pattern"></div>
        <div class="hero-content">
          <div class="hero-badge">
            <span class="pulse-dot"></span>
            AI-Powered Interview Practice
          </div>
          <h1>
            Ace Your Next
            <span class="text-gradient">Technical Interview</span>
          </h1>
          <p>
            Practice with real-time facial analysis, voice recognition,
            and intelligent answer evaluation. Get personalized feedback powered by AI.
          </p>
          <div class="hero-buttons">
            <button class="btn btn-primary btn-lg" id="start-interview-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"/></svg>
              Start Interview
            </button>
            <button class="btn btn-secondary btn-lg" id="learn-more-btn">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              How It Works
            </button>
          </div>

          <!-- Quick Stats -->
          <div class="hero-stats">
            <div class="stat-item">
              <span class="stat-number">6</span>
              <span class="stat-label">Subjects</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-number">60+</span>
              <span class="stat-label">Questions</span>
            </div>
            <div class="stat-divider"></div>
            <div class="stat-item">
              <span class="stat-number">AI</span>
              <span class="stat-label">Chatbot</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Features Section -->
      <div class="container" id="features-section">
        <div class="section-header">
          <h2>How It <span class="text-gradient">Works</span></h2>
          <p>Four powerful AI modules working together to give you the most realistic interview experience</p>
        </div>
        <div class="features-grid">
          <div class="glass-card feature-card animate-in">
            <div class="feature-step">01</div>
            <div class="feature-icon feature-icon-cyan">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <h3>Facial Expression Analysis</h3>
            <p>Real-time AI monitors your expressions for nervousness, confidence, and engagement using TensorFlow.js.</p>
          </div>
          <div class="glass-card feature-card animate-in">
            <div class="feature-step">02</div>
            <div class="feature-icon feature-icon-purple">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
            </div>
            <h3>Voice Recognition</h3>
            <p>Speak naturally — answers are transcribed in real-time using browser-native speech recognition.</p>
          </div>
          <div class="glass-card feature-card animate-in">
            <div class="feature-step">03</div>
            <div class="feature-icon feature-icon-blue">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
            </div>
            <h3>NLP Answer Evaluation</h3>
            <p>Answers analyzed using TF-IDF similarity and keyword extraction for detailed scoring.</p>
          </div>
          <div class="glass-card feature-card animate-in">
            <div class="feature-step">04</div>
            <div class="feature-icon feature-icon-pink">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            </div>
            <h3>AI Interview Chatbot</h3>
            <p>Get instant help, practice questions, and interview tips from our built-in AI assistant.</p>
          </div>
        </div>
      </div>

      <!-- Privacy Banner -->
      <div class="container" style="padding-bottom: 4rem; text-align: center;">
        <div class="glass-card-static privacy-banner">
          <div class="privacy-icon">🔒</div>
          <div>
            <h3>100% Private & Offline Processing</h3>
            <p>Face analysis runs locally via TensorFlow.js. Speech recognition uses the Web Speech API. No data sent to external services.</p>
          </div>
        </div>
      </div>

      <!-- Chatbot Widget -->
      <div class="chatbot-widget" id="chatbot-widget" style="display: none;">
        <div class="chatbot-header">
          <div class="chatbot-header-info">
            <div class="chatbot-avatar">🤖</div>
            <div>
              <h4>Interview Assistant</h4>
              <span class="chatbot-status">Online</span>
            </div>
          </div>
          <button class="chatbot-close" id="close-chatbot-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div class="chatbot-messages" id="chatbot-messages">
          <div class="chat-message bot">
            <div class="chat-avatar">🤖</div>
            <div class="chat-bubble">
              Hello! 👋 I'm your AI Interview Preparation Assistant. Ask me about any CS topic, interview tips, or say <strong>"give me a question"</strong> to practice!
            </div>
          </div>
        </div>
        <form class="chatbot-input" id="chatbot-form">
          <input type="text" id="chatbot-input" placeholder="Ask about any interview topic..." autocomplete="off" />
          <button type="submit" class="chatbot-send">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
          </button>
        </form>
      </div>
    </div>
  `;

  // Event handlers
  document.getElementById('start-interview-btn').addEventListener('click', () => {
    window.location.hash = '#subjects';
  });

  document.getElementById('learn-more-btn').addEventListener('click', () => {
    document.getElementById('features-section').scrollIntoView({ behavior: 'smooth' });
  });

  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('user_name');
    localStorage.removeItem('user_email');
    window.location.hash = '#login';
  });

  // Chatbot
  setupChatbot();
}

function setupChatbot() {
  const widget = document.getElementById('chatbot-widget');
  const openBtn = document.getElementById('open-chatbot-btn');
  const closeBtn = document.getElementById('close-chatbot-btn');
  const form = document.getElementById('chatbot-form');
  const input = document.getElementById('chatbot-input');
  const messages = document.getElementById('chatbot-messages');

  openBtn.addEventListener('click', () => {
    widget.style.display = 'flex';
    widget.style.animation = 'scaleIn 0.3s ease';
    input.focus();
  });

  closeBtn.addEventListener('click', () => {
    widget.style.display = 'none';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;

    // Add user message
    addMessage(messages, text, 'user');
    input.value = '';

    // Show typing indicator
    const typingEl = document.createElement('div');
    typingEl.className = 'chat-message bot typing';
    typingEl.innerHTML = `
      <div class="chat-avatar">🤖</div>
      <div class="chat-bubble"><div class="typing-dots"><span></span><span></span><span></span></div></div>
    `;
    messages.appendChild(typingEl);
    messages.scrollTop = messages.scrollHeight;

    try {
      const response = await fetch('/api/chatbot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      const data = await response.json();

      // Remove typing indicator
      typingEl.remove();

      // Add bot response
      addMessage(messages, data.reply, 'bot');
    } catch (err) {
      typingEl.remove();
      addMessage(messages, "Sorry, I couldn't connect to the server. Make sure the backend is running.", 'bot');
    }
  });
}

function addMessage(container, text, sender) {
  const el = document.createElement('div');
  el.className = `chat-message ${sender}`;

  // Simple markdown-like formatting
  let formatted = text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^> (.*)/gm, '<blockquote>$1</blockquote>')
    .replace(/^• (.*)/gm, '<li>$1</li>')
    .replace(/^(\d+)\. (.*)/gm, '<li>$2</li>')
    .replace(/\n/g, '<br>');

  if (sender === 'user') {
    el.innerHTML = `
      <div class="chat-bubble">${formatted}</div>
      <div class="chat-avatar user-avatar">${(localStorage.getItem('user_name') || 'U').charAt(0).toUpperCase()}</div>
    `;
  } else {
    el.innerHTML = `
      <div class="chat-avatar">🤖</div>
      <div class="chat-bubble">${formatted}</div>
    `;
  }

  container.appendChild(el);
  container.scrollTop = container.scrollHeight;
}
