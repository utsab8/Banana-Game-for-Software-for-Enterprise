/* ==============================================================================
 * CIS046-3: Software for Enterprise - Assignment 1
 * Banana Math Game - Client Side Logic (app.js)
 *
 * Demonstrates:
 * - Version Control (Git)
 * - Event-Driven Programming (DOM events, async/await, fetch)
 * - Interoperability (Integration with Marc Conrad's Banana API via our Node.js server)
 * - Virtual Identity (Session management using express-session and cookies)
 * ============================================================================== */

// Local state for the game
const state = {
  user: null,               // Holds the current player info (username, score, streak)
  selectedAnswer: null,     // Currently selected digit (0-9)
  isLoading: false,         // Flag to prevent spamming while fetching puzzle
  isSubmitting: false       // Flag to prevent double submissions
};

// Cached DOM Elements
const DOM = {
  // Session & Header
  sessionBadge: document.getElementById('session-badge'),
  sessionStatusText: document.getElementById('session-status-text'),
  logoutBtn: document.getElementById('logout-btn'),

  // Panels
  authSection: document.getElementById('auth-section'),
  gameSection: document.getElementById('game-section'),

  // Login Form
  loginForm: document.getElementById('login-form'),
  usernameInput: document.getElementById('username-input'),
  usernameError: document.getElementById('username-error'),
  loginBtn: document.getElementById('login-btn'),

  // HUD / Stats
  hudPlayerName: document.getElementById('hud-player-name'),
  hudScore: document.getElementById('hud-score'),
  hudStreak: document.getElementById('hud-streak'),
  hudStreakIcon: document.getElementById('hud-streak-icon'),
  hudHighScore: document.getElementById('hud-high-score'),
  hudRounds: document.getElementById('hud-rounds'),

  // Puzzle Area
  puzzleCard: document.getElementById('puzzle-card'),
  puzzleLoader: document.getElementById('puzzle-loader'),
  puzzleImg: document.getElementById('puzzle-img'),
  puzzleSourceTag: document.getElementById('puzzle-source-tag'),
  fallbackIndicator: document.getElementById('fallback-indicator'),
  feedbackBanner: document.getElementById('feedback-banner'),
  feedbackIcon: document.getElementById('feedback-icon'),
  feedbackText: document.getElementById('feedback-text'),

  // Keypad & Answer
  currentAnswerBox: document.getElementById('current-answer-box'),
  answerPlaceholder: document.getElementById('answer-placeholder'),
  answerValue: document.getElementById('answer-value'),
  keypadButtons: document.querySelectorAll('.btn-key'),
  submitBtn: document.getElementById('submit-btn'),
  clearBtn: document.getElementById('clear-btn'),
  skipBtn: document.getElementById('skip-btn'),
  resetBtn: document.getElementById('reset-btn'),

  // Toast Alerts
  toastContainer: document.getElementById('toast-container')
};

// -----------------------------------------------------------------------------
// Helper: Send HTTP requests to backend API
// -----------------------------------------------------------------------------
async function api(url, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    credentials: 'same-origin', // Ensure session cookie (connect.sid) is sent
    ...options
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const res = await fetch(url, config);
    const data = await res.json();
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    console.error('API call error:', err);
    return { ok: false, data: { error: 'Network error. Please try again.' } };
  }
}

// -----------------------------------------------------------------------------
// Helper: Show floating toast messages
// -----------------------------------------------------------------------------
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconTag = type === 'success' 
    ? '<i class="fa-solid fa-circle-check"></i>' 
    : type === 'error' 
      ? '<i class="fa-solid fa-circle-exclamation"></i>' 
      : '<i class="fa-solid fa-circle-info"></i>';

  toast.innerHTML = `${iconTag} <span>${message}</span>`;
  DOM.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('toast-hiding');
    toast.addEventListener('transitionend', () => toast.remove());
  }, duration);
}

// -----------------------------------------------------------------------------
// UI Updates: Stats and Panels
// -----------------------------------------------------------------------------
function updateHUD(user) {
  if (!user) return;
  DOM.hudPlayerName.textContent = user.username;
  DOM.hudScore.textContent = user.score;
  DOM.hudStreak.textContent = `${user.streak}x`;
  DOM.hudHighScore.textContent = user.highScore;
  DOM.hudRounds.textContent = user.roundsPlayed;
}

function switchView(view) {
  if (view === 'game') {
    DOM.authSection.classList.add('hidden');
    DOM.gameSection.classList.remove('hidden');
    DOM.logoutBtn.classList.remove('hidden');

    DOM.sessionBadge.className = 'session-pill active';
    DOM.sessionStatusText.textContent = state.user.username;
  } else {
    DOM.gameSection.classList.add('hidden');
    DOM.authSection.classList.remove('hidden');
    DOM.logoutBtn.classList.add('hidden');

    DOM.sessionBadge.className = 'session-pill guest';
    DOM.sessionStatusText.textContent = 'Not Logged In';
    DOM.usernameInput.value = '';
    DOM.usernameInput.focus();
  }
}

function selectDigit(digit) {
  state.selectedAnswer = digit;

  if (digit !== null) {
    DOM.answerPlaceholder.classList.add('hidden');
    DOM.answerValue.textContent = digit;
    DOM.answerValue.classList.remove('hidden');
    DOM.currentAnswerBox.classList.add('has-value');

    DOM.submitBtn.disabled = false;
    DOM.clearBtn.disabled = false;

    DOM.keypadButtons.forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.digit === String(digit));
    });
  } else {
    DOM.answerPlaceholder.classList.remove('hidden');
    DOM.answerValue.classList.add('hidden');
    DOM.answerValue.textContent = '';
    DOM.currentAnswerBox.classList.remove('has-value');

    DOM.submitBtn.disabled = true;
    DOM.clearBtn.disabled = true;

    DOM.keypadButtons.forEach((btn) => btn.classList.remove('active'));
  }
}

function showResultBanner(isCorrect, message) {
  DOM.feedbackBanner.className = `feedback-box ${isCorrect ? 'correct' : 'incorrect'}`;
  DOM.feedbackIcon.innerHTML = isCorrect 
    ? '<i class="fa-solid fa-circle-check"></i>' 
    : '<i class="fa-solid fa-circle-xmark"></i>';
  DOM.feedbackText.textContent = message;
  DOM.feedbackBanner.classList.remove('hidden');
}

function hideResultBanner() {
  DOM.feedbackBanner.classList.add('hidden');
}

// -----------------------------------------------------------------------------
// Game Actions: Fetch Puzzle & Submit Answer
// -----------------------------------------------------------------------------
async function loadNewPuzzle() {
  if (state.isLoading) return;
  state.isLoading = true;

  selectDigit(null);
  hideResultBanner();

  DOM.puzzleLoader.classList.remove('hidden');
  DOM.puzzleImg.classList.add('hidden');
  DOM.skipBtn.disabled = true;

  const res = await api('/api/game/new-puzzle');
  state.isLoading = false;
  DOM.skipBtn.disabled = false;

  if (!res.ok) {
    showToast(res.data.error || 'Could not load puzzle.', 'error');
    DOM.puzzleLoader.classList.add('hidden');
    return;
  }

  // Handle fallback state if Banana API was down
  if (res.data.isFallback) {
    DOM.fallbackIndicator.classList.remove('hidden');
    DOM.puzzleSourceTag.textContent = 'Offline Fallback';
  } else {
    DOM.fallbackIndicator.classList.add('hidden');
    DOM.puzzleSourceTag.textContent = 'Banana API Puzzle';
  }

  // Load and show image
  const img = new Image();
  img.src = res.data.question;
  img.onload = () => {
    DOM.puzzleImg.src = res.data.question;
    DOM.puzzleLoader.classList.add('hidden');
    DOM.puzzleImg.classList.remove('hidden');
  };
  img.onerror = () => {
    DOM.puzzleLoader.classList.add('hidden');
    showToast('Failed to load puzzle image from server.', 'error');
  };
}

async function handleAnswerSubmit() {
  if (state.selectedAnswer === null || state.isSubmitting) return;
  state.isSubmitting = true;
  DOM.submitBtn.disabled = true;

  const res = await api('/api/game/submit-answer', {
    method: 'POST',
    body: { answer: state.selectedAnswer }
  });

  state.isSubmitting = false;

  if (!res.ok) {
    showToast(res.data.error || 'Failed to submit answer.', 'error');
    DOM.submitBtn.disabled = false;
    return;
  }

  const { correct, message, user } = res.data;

  // Update HUD
  state.user = user;
  updateHUD(user);

  // Micro-animations for visual feedback
  if (correct) {
    DOM.puzzleCard.classList.remove('shake-animation');
    DOM.puzzleCard.classList.add('celebrate-animation');
    setTimeout(() => DOM.puzzleCard.classList.remove('celebrate-animation'), 500);

    showResultBanner(true, message);
    showToast(message, 'success');

    // Automatically load next puzzle after short delay
    setTimeout(() => {
      loadNewPuzzle();
    }, 1200);
  } else {
    DOM.puzzleCard.classList.remove('celebrate-animation');
    DOM.puzzleCard.classList.add('shake-animation');
    setTimeout(() => DOM.puzzleCard.classList.remove('shake-animation'), 400);

    showResultBanner(false, message);
    showToast(message, 'error');

    setTimeout(() => {
      loadNewPuzzle();
    }, 1800);
  }
}

// -----------------------------------------------------------------------------
// Setup Event Listeners (Theme 2: Event-Driven Programming)
// -----------------------------------------------------------------------------
function initEvents() {
  // 1. On page load: Check if user already has an active session cookie
  window.addEventListener('DOMContentLoaded', async () => {
    const res = await api('/api/auth/me');
    if (res.ok && res.data.authenticated) {
      state.user = res.data.user;
      switchView('game');
      updateHUD(state.user);
      showToast(`Welcome back, ${state.user.username}!`, 'info');
      loadNewPuzzle();
    } else {
      switchView('auth');
    }
  });

  // 2. Login Form Submit
  DOM.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = DOM.usernameInput.value.trim();
    if (!username) {
      DOM.usernameError.textContent = 'Please enter a username.';
      DOM.usernameError.classList.remove('hidden');
      return;
    }

    DOM.usernameError.classList.add('hidden');
    DOM.loginBtn.disabled = true;

    const res = await api('/api/auth/login', {
      method: 'POST',
      body: { username }
    });

    DOM.loginBtn.disabled = false;

    if (!res.ok) {
      DOM.usernameError.textContent = res.data.error || 'Login failed.';
      DOM.usernameError.classList.remove('hidden');
      return;
    }

    state.user = res.data.user;
    switchView('game');
    updateHUD(state.user);
    showToast(`Hello ${state.user.username}, let's play!`, 'success');
    loadNewPuzzle();
  });

  // 3. Keypad Buttons Click (0-9)
  DOM.keypadButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const digit = parseInt(btn.dataset.digit, 10);
      selectDigit(digit);
    });
  });

  // 4. Physical Keyboard Input (0-9, Enter, Escape)
  window.addEventListener('keydown', (e) => {
    if (DOM.gameSection.classList.contains('hidden')) return;

    if (e.key >= '0' && e.key <= '9') {
      const digit = parseInt(e.key, 10);
      selectDigit(digit);
    } else if (e.key === 'Enter') {
      if (state.selectedAnswer !== null && !state.isSubmitting) {
        handleAnswerSubmit();
      }
    } else if (e.key === 'Escape' || e.key === 'Backspace') {
      selectDigit(null);
    }
  });

  // 5. Control Buttons
  DOM.submitBtn.addEventListener('click', handleAnswerSubmit);

  DOM.clearBtn.addEventListener('click', () => {
    selectDigit(null);
  });

  DOM.skipBtn.addEventListener('click', () => {
    showToast('Skipping puzzle...', 'info', 1500);
    loadNewPuzzle();
  });

  DOM.resetBtn.addEventListener('click', async () => {
    if (!confirm('Do you want to reset your score back to 0?')) return;
    const res = await api('/api/game/reset', { method: 'POST' });
    if (res.ok) {
      state.user = res.data.user;
      updateHUD(state.user);
      showToast('Score has been reset.', 'info');
      loadNewPuzzle();
    }
  });

  DOM.logoutBtn.addEventListener('click', async () => {
    const res = await api('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      state.user = null;
      state.selectedAnswer = null;
      switchView('auth');
      showToast('You have been logged out.', 'info');
    }
  });
}

// Start event listeners
initEvents();
