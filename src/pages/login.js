/**
 * Login & Register Page
 * Authenticates users against the Excel-based user database
 */

let isLoginMode = true;

export function renderLogin(container) {
  isLoginMode = true;
  renderAuthForm(container);
}

function renderAuthForm(container) {
  container.innerHTML = `
    <div class="auth-page">
      <div class="auth-bg-orbs">
        <div class="orb orb-1"></div>
        <div class="orb orb-2"></div>
        <div class="orb orb-3"></div>
      </div>

      <div class="auth-container">
        <div class="auth-brand">
          <div class="auth-logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <rect width="48" height="48" rx="12" fill="url(#grad1)"/>
              <path d="M14 34V14h6l4 12 4-12h6v20h-5V21l-3.5 10h-3L19 21v13h-5z" fill="#0a0e1a"/>
              <defs><linearGradient id="grad1" x1="0" y1="0" x2="48" y2="48"><stop stop-color="#06d6a0"/><stop offset="1" stop-color="#3b82f6"/></linearGradient></defs>
            </svg>
          </div>
          <h1 class="auth-title">AI Interview<br/><span class="text-gradient">Analyzer</span></h1>
          <p class="auth-subtitle">Master your technical interviews with AI-powered analysis</p>
        </div>

        <div class="auth-card glass-card-static">
          <div class="auth-tabs">
            <button class="auth-tab ${isLoginMode ? 'active' : ''}" id="tab-login">Sign In</button>
            <button class="auth-tab ${!isLoginMode ? 'active' : ''}" id="tab-register">Create Account</button>
          </div>

          <form id="auth-form" class="auth-form">
            <div id="auth-error" class="auth-error" style="display: none;"></div>

            <div class="input-group">
              <label for="auth-username">Username</label>
              <div class="input-wrapper">
                <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <input type="text" id="auth-username" placeholder="Enter username" required autocomplete="username" />
              </div>
            </div>

            <div class="input-group" id="email-group" style="display: none;">
              <label for="auth-email">Email</label>
              <div class="input-wrapper">
                <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                <input type="email" id="auth-email" placeholder="Enter email" autocomplete="email" />
              </div>
            </div>

            <div class="input-group">
              <label for="auth-password">Password</label>
              <div class="input-wrapper">
                <svg class="input-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <input type="password" id="auth-password" placeholder="Enter password" required autocomplete="current-password" />
              </div>
            </div>

            <button type="submit" class="btn btn-primary auth-submit" id="auth-submit-btn">
              <span id="auth-btn-text">Sign In</span>
              <div class="btn-loader" id="auth-loader" style="display: none;"></div>
            </button>
          </form>

          <p class="auth-footer" id="auth-footer">
            Default credentials: <strong>Saksham</strong> / <strong>1234</strong>
          </p>
        </div>
      </div>
    </div>
  `;

  setupAuthEvents(container);
}

function setupAuthEvents(container) {
  const form = document.getElementById('auth-form');
  const tabLogin = document.getElementById('tab-login');
  const tabRegister = document.getElementById('tab-register');
  const emailGroup = document.getElementById('email-group');
  const btnText = document.getElementById('auth-btn-text');
  const authFooter = document.getElementById('auth-footer');
  const errorEl = document.getElementById('auth-error');

  tabLogin.addEventListener('click', () => {
    isLoginMode = true;
    tabLogin.classList.add('active');
    tabRegister.classList.remove('active');
    emailGroup.style.display = 'none';
    btnText.textContent = 'Sign In';
    authFooter.innerHTML = 'Default credentials: <strong>Saksham</strong> / <strong>1234</strong>';
    errorEl.style.display = 'none';
  });

  tabRegister.addEventListener('click', () => {
    isLoginMode = false;
    tabRegister.classList.add('active');
    tabLogin.classList.remove('active');
    emailGroup.style.display = 'block';
    btnText.textContent = 'Create Account';
    authFooter.innerHTML = 'Already have an account? Click <strong>Sign In</strong> above.';
    errorEl.style.display = 'none';
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('auth-username').value.trim();
    const password = document.getElementById('auth-password').value.trim();
    const email = document.getElementById('auth-email').value.trim();
    const loader = document.getElementById('auth-loader');
    const submitBtn = document.getElementById('auth-submit-btn');

    errorEl.style.display = 'none';
    loader.style.display = 'inline-block';
    submitBtn.disabled = true;

    try {
      const endpoint = isLoginMode ? '/api/auth/login' : '/api/auth/register';
      const body = isLoginMode
        ? { username, password }
        : { username, password, email };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (data.success) {
        if (isLoginMode) {
          localStorage.setItem('user_name', data.user.username);
          localStorage.setItem('user_email', data.user.email || '');
          window.location.hash = '#home';
        } else {
          // Registration successful — switch to login
          errorEl.style.display = 'block';
          errorEl.style.background = 'rgba(6, 214, 160, 0.15)';
          errorEl.style.borderColor = 'rgba(6, 214, 160, 0.3)';
          errorEl.style.color = 'var(--accent-cyan)';
          errorEl.textContent = '✓ Account created! You can now sign in.';
          isLoginMode = true;
          tabLogin.click();
        }
      } else {
        errorEl.style.display = 'block';
        errorEl.style.background = 'rgba(239, 68, 68, 0.15)';
        errorEl.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        errorEl.style.color = 'var(--accent-red)';
        errorEl.textContent = data.error || 'Authentication failed';
      }
    } catch (err) {
      errorEl.style.display = 'block';
      errorEl.style.background = 'rgba(239, 68, 68, 0.15)';
      errorEl.style.borderColor = 'rgba(239, 68, 68, 0.3)';
      errorEl.style.color = 'var(--accent-red)';
      errorEl.textContent = 'Server error. Make sure the backend is running.';
    } finally {
      loader.style.display = 'none';
      submitBtn.disabled = false;
    }
  });
}
