/**
 * Interview Room Page
 * The main interview interface with webcam, questions, and speech transcription
 */

import InterviewFlow from '../modules/interviewFlow.js';
import { formatTime, getDifficultyBadge, getScoreClass } from '../utils/helpers.js';

let interviewFlow = null;
let timerInterval = null;

export function renderInterview(container) {
  const subject = sessionStorage.getItem('interview_subject');
  const difficulty = sessionStorage.getItem('interview_difficulty') || 'mixed';
  const questionCount = parseInt(sessionStorage.getItem('interview_count') || '5');

  if (!subject) {
    window.location.hash = '#subjects';
    return;
  }

  container.innerHTML = `
    <div class="interview-page">
      <!-- Header -->
      <div class="interview-header">
        <div class="interview-header-left">
          <h2 id="interview-subject-name">Loading...</h2>
          <span class="question-counter" id="question-counter">Q 0/0</span>
        </div>
        <div class="interview-timer" id="interview-timer">00:00</div>
        <button class="btn btn-danger btn-sm" id="end-interview-btn">End Interview</button>
      </div>

      <!-- Progress Bar -->
      <div class="progress-bar">
        <div class="progress-bar-fill" id="progress-fill" style="width: 0%"></div>
      </div>

      <!-- Body -->
      <div class="interview-body">
        <!-- Left: Video Panel -->
        <div class="video-panel">
          <div class="video-container" id="video-container">
            <video id="webcam-video" autoplay muted playsinline></video>
            <canvas id="face-canvas"></canvas>
            <div class="video-overlay">
              <div class="expression-badge" id="expression-badge">
                <span id="expression-emoji">😐</span>
                <span id="expression-label">Initializing...</span>
              </div>
              <div class="cheat-warning" id="cheat-warning">
                ⚠️ <span id="cheat-message"></span>
              </div>
            </div>
          </div>
          <div class="face-metrics" id="face-metrics">
            <div class="metric-card">
              <div class="metric-label">Confidence</div>
              <div class="metric-value" id="metric-confidence">--</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Nervousness</div>
              <div class="metric-value" id="metric-nervousness">--</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Engagement</div>
              <div class="metric-value" id="metric-engagement">--</div>
            </div>
            <div class="metric-card">
              <div class="metric-label">Warnings</div>
              <div class="metric-value" id="metric-warnings">0</div>
            </div>
          </div>
        </div>

        <!-- Right: Question Panel -->
        <div class="question-panel">
          <div class="question-card" id="question-card">
            <div class="question-number" id="question-number">QUESTION 1</div>
            <div class="question-text" id="question-text">Loading question...</div>
            <div class="question-difficulty" id="question-difficulty"></div>
          </div>

          <div class="transcript-area">
            <div class="transcript-header">
              <h4>Your Answer</h4>
              <div style="display: flex; align-items: center; gap: 10px;">
                <div class="volume-meter" id="volume-meter" style="display: none; width: 50px; height: 10px; background: rgba(255,255,255,0.1); border-radius: 5px; overflow: hidden;">
                  <div id="volume-bar" style="height: 100%; width: 0%; background: var(--accent-cyan); transition: width 0.1s;"></div>
                </div>
                <div class="recording-indicator" id="recording-indicator" style="display: none;">
                  <span class="recording-dot"></span>
                  Recording
                </div>
              </div>
            </div>
            <div class="transcript-content" id="transcript-content">
              <span style="color: var(--text-muted);">Click "Start Recording" to begin answering...</span>
            </div>
          </div>

          <div class="interview-controls">
            <button class="btn btn-primary" id="record-btn">
              🎤 Start Recording
            </button>
            <button class="btn btn-success" id="eval-next-btn">
              ✅ Submit Answer
            </button>
            <button class="btn btn-secondary" id="skip-btn">
              ⏭️ Skip Question
            </button>
          </div>
        </div>
      </div>

      <!-- Evaluation Overlay -->
      <div class="evaluation-overlay" id="evaluation-overlay">
        <div class="evaluation-card">
          <div class="evaluation-score">
            <div class="score-circle" id="eval-score-circle">
              <span id="eval-score-value">0</span>
            </div>
            <div id="eval-grade" style="font-weight: 600;"></div>
          </div>
          <div class="evaluation-feedback" id="eval-feedback"></div>
          <div class="evaluation-keywords" id="eval-keywords"></div>
          <button class="btn btn-primary" id="next-question-btn" style="width: 100%;">
            Next Question →
          </button>
        </div>
      </div>
    </div>

    <!-- Loading overlay for initialization -->
    <div id="init-overlay" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: var(--bg-primary); z-index: 200; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 1rem;">
      <div class="loading-spinner"></div>
      <div class="loading-text" id="init-status">Initializing camera and AI models...</div>
    </div>
  `;

  // Initialize interview
  initializeInterview(subject, difficulty, questionCount);
}

async function initializeInterview(subject, difficulty, questionCount) {
  const videoEl = document.getElementById('webcam-video');
  const canvasEl = document.getElementById('face-canvas');
  const initOverlay = document.getElementById('init-overlay');
  const initStatus = document.getElementById('init-status');

  interviewFlow = new InterviewFlow();

  // Setup callbacks
  interviewFlow.onQuestionChange = (question, number, total) => {
    updateQuestion(question, number, total);
  };

  interviewFlow.onExpressionUpdate = (exp) => {
    document.getElementById('expression-emoji').textContent = exp.emoji;
    document.getElementById('expression-label').textContent =
      exp.label === 'no face' ? 'No face detected' : `${exp.label} (${exp.confidence || 0}%)`;
  };

  interviewFlow.onCheatWarning = (msg) => {
    showCheatWarning(msg);
  };

  interviewFlow.onMetricsUpdate = (metrics) => {
    updateMetrics(metrics);
  };

  interviewFlow.onTranscriptUpdate = (text) => {
    const el = document.getElementById('transcript-content');
    const interimEl = el.querySelector('.interim');
    const mainText = text;
    el.innerHTML = mainText + (interimEl ? interimEl.outerHTML : '');
  };

  interviewFlow.onInterimUpdate = (text) => {
    const el = document.getElementById('transcript-content');
    let interimEl = el.querySelector('.interim');
    if (!interimEl) {
      interimEl = document.createElement('span');
      interimEl.className = 'interim';
      el.appendChild(interimEl);
    }
    interimEl.textContent = text;
  };

  interviewFlow.onVolumeChange = (vol) => {
    const volumeBar = document.getElementById('volume-bar');
    if (volumeBar) {
      volumeBar.style.width = `${vol}%`;
      // Change color based on volume (green -> yellow -> red)
      if (vol < 30) volumeBar.style.background = 'var(--accent-cyan)';
      else if (vol < 70) volumeBar.style.background = 'var(--accent-orange)';
      else volumeBar.style.background = 'var(--accent-red)';
    }
  };

  interviewFlow.onEvaluationReady = (result) => {
    showEvaluation(result);
  };

  interviewFlow.onError = (msg) => {
    console.error('Interview error:', msg);
  };

  try {
    initStatus.textContent = 'Loading face detection models...';
    await interviewFlow.initialize(subject, difficulty, questionCount, videoEl, canvasEl);

    // Update header
    document.getElementById('interview-subject-name').textContent = interviewFlow.subject;

    // Hide init overlay
    initOverlay.style.opacity = '0';
    initOverlay.style.transition = 'opacity 0.5s ease';
    setTimeout(() => initOverlay.remove(), 500);

    // Start timer
    startTimer();

    // Setup controls
    setupControls();

    // Tab switching anti-cheat
    document.addEventListener('visibilitychange', handleVisibilityChange);
  } catch (error) {
    initStatus.textContent = `❌ ${error.message}`;
    initStatus.style.color = 'var(--accent-red)';
    const retryBtn = document.createElement('button');
    retryBtn.className = 'btn btn-primary';
    retryBtn.textContent = 'Go Back';
    retryBtn.style.marginTop = '1rem';
    retryBtn.onclick = () => { window.location.hash = '#subjects'; };
    initOverlay.appendChild(retryBtn);
  }
}

function handleVisibilityChange() {
  if (document.visibilityState === 'hidden') {
    showCheatWarning('Tab switching is not allowed during the interview! This action has been recorded.');
  }
}

function setupControls() {
  const recordBtn = document.getElementById('record-btn');
  const evalNextBtn = document.getElementById('eval-next-btn');
  const skipBtn = document.getElementById('skip-btn');
  const endBtn = document.getElementById('end-interview-btn');
  const overlayNextBtn = document.getElementById('next-question-btn');

  let isRecording = false;

  recordBtn.addEventListener('click', () => {
    if (!isRecording) {
      // Start recording
      isRecording = true;
      recordBtn.innerHTML = '⏹️ Stop Recording';
      recordBtn.className = 'btn btn-danger';
      
      document.getElementById('recording-indicator').style.display = 'flex';
      document.getElementById('volume-meter').style.display = 'block';
      document.getElementById('transcript-content').innerHTML = '';
      interviewFlow.startRecording();
    } else {
      // Just stop recording but don't evaluate yet
      isRecording = false;
      recordBtn.innerHTML = '🎤 Start Recording (Append)';
      recordBtn.className = 'btn btn-primary';
      document.getElementById('recording-indicator').style.display = 'none';
      document.getElementById('volume-meter').style.display = 'none';
      interviewFlow.speechEngine.stop(); // Stops engine but doesn't submit to API
    }
  });

  evalNextBtn.addEventListener('click', async () => {
    // Stop recording and submit
    if (isRecording) {
      isRecording = false;
      document.getElementById('recording-indicator').style.display = 'none';
      document.getElementById('volume-meter').style.display = 'none';
    }
    
    recordBtn.style.display = 'none';
    evalNextBtn.innerHTML = '⏳ Submitting...';
    evalNextBtn.disabled = true;
    skipBtn.disabled = true;

    try {
      const result = await interviewFlow.stopRecording();
      
      // Auto-advance without overlay
      recordBtn.innerHTML = '🎤 Start Recording';
      recordBtn.className = 'btn btn-primary';
      recordBtn.disabled = false;
      skipBtn.disabled = false;
      recordBtn.style.display = 'inline-flex';
      
      evalNextBtn.innerHTML = '✅ Submit Answer';
      evalNextBtn.disabled = false;

      document.getElementById('transcript-content').innerHTML =
        '<span style="color: var(--text-muted);">Click "Start Recording" to begin answering...</span>';

      if (result.isComplete) {
        endInterviewAndShowResults();
      } else {
        interviewFlow.nextQuestion();
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      evalNextBtn.innerHTML = '✅ Submit Answer';
      evalNextBtn.disabled = false;
      recordBtn.style.display = 'inline-flex';
      skipBtn.disabled = false;
    }
  });

  skipBtn.addEventListener('click', async () => {
    if (isRecording) {
      isRecording = false;
      document.getElementById('recording-indicator').style.display = 'none';
      document.getElementById('volume-meter').style.display = 'none';
    }

    // Submit empty answer
    recordBtn.innerHTML = '⏳ Skipping...';
    recordBtn.disabled = true;
    skipBtn.disabled = true;

    try {
      const result = await interviewFlow.skipQuestion();
      
      // Auto-advance without overlay
      recordBtn.innerHTML = '🎤 Start Recording';
      recordBtn.className = 'btn btn-primary';
      recordBtn.disabled = false;
      skipBtn.disabled = false;
      recordBtn.style.display = 'inline-flex';
      
      const evalNextBtn = document.getElementById('eval-next-btn');
      evalNextBtn.innerHTML = '✅ Submit Answer';
      evalNextBtn.disabled = false;

      document.getElementById('transcript-content').innerHTML =
        '<span style="color: var(--text-muted);">Click "Start Recording" to begin answering...</span>';

      if (result.isComplete) {
        endInterviewAndShowResults();
      } else {
        interviewFlow.nextQuestion();
      }
    } catch (error) {
      console.error('Error skipping:', error);
      recordBtn.innerHTML = '🎤 Start Recording';
      recordBtn.className = 'btn btn-primary';
      recordBtn.disabled = false;
      skipBtn.disabled = false;
    }
  });

  endBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to end the interview? All progress will be evaluated.')) {
      await endInterviewAndShowResults();
    }
  });

  overlayNextBtn.addEventListener('click', () => {
    hideEvaluation();

    // Reset buttons
    recordBtn.style.display = 'inline-flex';
    recordBtn.innerHTML = '🎤 Start Recording';
    recordBtn.className = 'btn btn-primary';
    recordBtn.disabled = false;
    
    evalNextBtn.style.display = 'none';
    evalNextBtn.innerHTML = '✅ Evaluate & Next Question';
    evalNextBtn.disabled = false;
    
    skipBtn.disabled = false;

    // Check if interview is complete
    if (interviewFlow.currentQuestionNumber > interviewFlow.totalQuestions) {
      endInterviewAndShowResults();
      return;
    }

    // Move to next question
    interviewFlow.nextQuestion();

    // Reset UI
    document.getElementById('transcript-content').innerHTML =
      '<span style="color: var(--text-muted);">Click "Start Recording" to begin answering...</span>';
  });
}

function updateQuestion(question, number, total) {
  document.getElementById('question-number').textContent = `QUESTION ${number}`;
  document.getElementById('question-text').textContent = question.question;
  document.getElementById('question-counter').textContent = `Q ${number}/${total}`;
  document.getElementById('progress-fill').style.width = `${((number - 1) / total) * 100}%`;

  const diffEl = document.getElementById('question-difficulty');
  diffEl.innerHTML = `<span class="badge ${getDifficultyBadge(question.difficulty)}">${question.difficulty}</span>`;

  // Animate the question card
  const card = document.getElementById('question-card');
  card.style.animation = 'none';
  card.offsetHeight; // Trigger reflow
  card.style.animation = 'slideIn 0.4s ease';
}

function updateMetrics(metrics) {
  const confEl = document.getElementById('metric-confidence');
  confEl.textContent = `${metrics.confidence}%`;
  confEl.className = `metric-value ${getScoreClass(metrics.confidence / 10)}`;

  const nervEl = document.getElementById('metric-nervousness');
  nervEl.textContent = `${metrics.nervousness}%`;
  nervEl.className = `metric-value ${metrics.nervousness > 50 ? 'bad' : metrics.nervousness > 25 ? 'warn' : 'good'}`;

  const engEl = document.getElementById('metric-engagement');
  engEl.textContent = `${metrics.engagement}%`;
  engEl.className = `metric-value ${getScoreClass(metrics.engagement / 10)}`;

  document.getElementById('metric-warnings').textContent = metrics.cheatWarnings;
  document.getElementById('metric-warnings').className =
    `metric-value ${metrics.cheatWarnings > 0 ? 'bad' : 'good'}`;
}

function showCheatWarning(message) {
  const warning = document.getElementById('cheat-warning');
  document.getElementById('cheat-message').textContent = message;
  warning.classList.add('visible');
  setTimeout(() => warning.classList.remove('visible'), 3000);
}

function showEvaluation(result) {
  const overlay = document.getElementById('evaluation-overlay');
  const scoreCircle = document.getElementById('eval-score-circle');
  const scoreValue = document.getElementById('eval-score-value');
  const grade = document.getElementById('eval-grade');
  const feedbackEl = document.getElementById('eval-feedback');
  const keywordsEl = document.getElementById('eval-keywords');
  const nextBtn = document.getElementById('next-question-btn');

  // Score
  const score = result.evaluation.score;
  scoreValue.textContent = score;
  scoreCircle.className = `score-circle ${result.evaluation.grade.class}`;
  grade.textContent = result.evaluation.grade.grade;

  // Feedback
  let feedbackHTML = '';
  if (result.feedback && result.feedback.length > 0) {
    result.feedback.forEach(f => {
      feedbackHTML += `<h4>${f.icon} ${f.title}</h4><p>${f.text}</p>`;
    });
  }
  feedbackEl.innerHTML = feedbackHTML;

  // Keywords
  let keywordsHTML = '';
  if (result.evaluation.keywordsFound) {
    result.evaluation.keywordsFound.forEach(k => {
      keywordsHTML += `<span class="keyword-tag found">✓ ${k}</span>`;
    });
  }
  if (result.evaluation.keywordsMissed) {
    result.evaluation.keywordsMissed.slice(0, 5).forEach(k => {
      keywordsHTML += `<span class="keyword-tag missed">✗ ${k}</span>`;
    });
  }
  keywordsEl.innerHTML = keywordsHTML;

  // Button text
  if (result.isComplete) {
    nextBtn.textContent = '📊 View Results';
  } else {
    nextBtn.textContent = 'Next Question →';
  }

  overlay.classList.add('visible');
}

function hideEvaluation() {
  document.getElementById('evaluation-overlay').classList.remove('visible');
}

async function endInterviewAndShowResults() {
  if (timerInterval) clearInterval(timerInterval);

  try {
    const report = await interviewFlow.endInterview();
    // Store report for results page
    sessionStorage.setItem('interview_report', JSON.stringify(report));
    window.location.hash = '#results';
  } catch (error) {
    console.error('Failed to end interview:', error);
    window.location.hash = '#home';
  }
}

function startTimer() {
  const timerEl = document.getElementById('interview-timer');
  timerInterval = setInterval(() => {
    if (interviewFlow) {
      timerEl.textContent = formatTime(interviewFlow.getElapsedTime());
    }
  }, 1000);
}

export function cleanupInterview() {
  if (interviewFlow) {
    interviewFlow.destroy();
    interviewFlow = null;
  }
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  if (timerInterval) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}
