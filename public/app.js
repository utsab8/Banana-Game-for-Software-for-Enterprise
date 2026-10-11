/**
 * ==============================================================================
 * CIS046-3 Software For Enterprise — Assignment 1: Banana Challenge Enterprise System
 * ==============================================================================
 * Student Name: Utsab
 * Academic Year: 2026/2027
 * Institution: University of Bedfordshire
 *
 * TIER 1: Event-Driven Client Controller
 *
 * DEMONSTRATION OF CORE THEMES:
 * 1. Event-Driven Programming: DOM event listeners (click, keydown, submit),
 *    asynchronous non-blocking network I/O via Promises & async/await.
 * 2. Virtual Identity: Session tracking across stateless HTTP, player HUD sync,
 *    and automated session resumption via HTTP-only cookie.
 * 3. Interoperability: Consuming Tier 2 API Gateway which securely proxies
 *    Dr. Marc Conrad's Banana API and isolates the mathematical puzzle solution.
 * ==============================================================================
 */

// Global Application State Store (Tier 1 Client Cache)
const AppState = {
  user: null,               // Active virtual identity { username, score, streak, highScore, roundsPlayed }
  selectedAnswer: null,     // Currently chosen integer answer (0-9)
  isLoadingPuzzle: false,   // True while network fetch is in flight
  isSubmittingAnswer: false // True while answer evaluation is in flight
};

// ==============================================================================
// 1. DOM ELEMENT REFERENCES (Cached for high performance)
// ==============================================================================
const DOM = {
  // Navigation & Session
  sessionBadge: document.getElementById('session-badge'),
  sessionStatusText: document.getElementById('session-status-text'),
  logoutBtn: document.getElementById('logout-btn'),

  // View Sections
  authSection: document.getElementById('auth-section'),
  gameSection: document.getElementById('game-section'),

  // Auth Form Elements
  loginForm: document.getElementById('login-form'),
  usernameInput: document.getElementById('username-input'),
  usernameError: document.getElementById('username-error'),
  loginBtn: document.getElementById('login-btn'),

  // Telemetry HUD Elements
  hudPlayerName: document.getElementById('hud-player-name'),
  hudScore: document.getElementById('hud-score'),
  hudStreak: document.getElementById('hud-streak'),
  hudStreakIcon: document.getElementById('hud-streak-icon'),
  hudHighScore: document.getElementById('hud-high-score'),
  hudRounds: document.getElementById('hud-rounds'),

  // Puzzle Elements
  puzzleCard: document.getElementById('puzzle-card'),
  puzzleLoader: document.getElementById('puzzle-loader'),
  puzzleImg: document.getElementById('puzzle-img'),
  puzzleSourceTag: document.getElementById('puzzle-source-tag'),
  fallbackIndicator: document.getElementById('fallback-indicator'),
  feedbackBanner: document.getElementById('feedback-banner'),
  feedbackIcon: document.getElementById('feedback-icon'),
  feedbackText: document.getElementById('feedback-text'),

  // Answer & Keypad Console
  currentAnswerBox: document.getElementById('current-answer-box'),
  answerPlaceholder: document.getElementById('answer-placeholder'),
  answerValue: document.getElementById('answer-value'),
  keypadButtons: document.querySelectorAll('.btn-key'),
  submitBtn: document.getElementById('submit-btn'),
  clearBtn: document.getElementById('clear-btn'),
  skipBtn: document.getElementById('skip-btn'),
  resetBtn: document.getElementById('reset-btn'),

  // Notifications
  toastContainer: document.getElementById('toast-container')
};

// ==============================================================================
// 2. CENTRALIZED ASYNCHRONOUS API CLIENT
// Wraps native fetch() with credentials and standard error handling
// ==============================================================================
async function apiRequest(endpoint, options = {}) {
  const defaultOptions = {
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json'
    },
    credentials: 'same-origin' // Ensures HTTP-only connect.sid cookie is sent
  };

  const config = { ...defaultOptions, ...options };
  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  try {
    const response = await fetch(endpoint, config);
    const data = await response.json();
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error(`[API Network Error] Request to ${endpoint} failed:`, error);
    return { ok: false, status: 0, data: { error: 'Network communication failure. Please check your connection.' } };
  }
}

// ==============================================================================
// 3. TOAST NOTIFICATION SYSTEM
// Non-intrusive floating feedback alerts
// ==============================================================================
function showToast(message, type = 'info', duration = 3500) {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;

  const iconMap = {
    success: '🎉',
    error: '⚠️',
    info: 'ℹ️'
  };

  toast.innerHTML = `
    <span class="toast-icon">${iconMap[type] || 'ℹ️'}</span>
    <span class="toast-message">${message}</span>
  `;

  DOM.toastContainer.appendChild(toast);

  // Auto-dismiss with transition
  setTimeout(() => {
    toast.classList.add('toast-hiding');
    toast.addEventListener('transitionend', () => toast.remove());
  }, duration);
}

// ==============================================================================
// 4. UI RENDERERS & HUD SYNCHRONIZERS
// ==============================================================================

/**
 * Updates telemetry HUD nodes with reactive player metrics
 */
function updateHUD(user) {
  if (!user) return;
  DOM.hudPlayerName.textContent = user.username;
  DOM.hudScore.textContent = user.score.toLocaleString();
  DOM.hudStreak.textContent = `${user.streak}x`;
  DOM.hudHighScore.textContent = user.highScore.toLocaleString();
  DOM.hudRounds.textContent = user.roundsPlayed;

  // Visual flourish: dynamic fire aura on active streak
  if (user.streak > 1) {
    DOM.hudStreakIcon.parentElement.parentElement.classList.add('streak-active');
  } else {
    DOM.hudStreakIcon.parentElement.parentElement.classList.remove('streak-active');
  }
}

/**
 * Toggles application views between Login Portal and Game Arena
 */
function renderView(viewName) {
  if (viewName === 'game') {
    DOM.authSection.classList.add('hidden');
    DOM.gameSection.classList.remove('hidden');
    DOM.logoutBtn.classList.remove('hidden');

    DOM.sessionBadge.className = 'session-badge badge-active';
    DOM.sessionStatusText.textContent = `Online: ${AppState.user.username}`;
  } else {
    DOM.gameSection.classList.add('hidden');
    DOM.authSection.classList.remove('hidden');
    DOM.logoutBtn.classList.add('hidden');

    DOM.sessionBadge.className = 'session-badge badge-guest';
    DOM.sessionStatusText.textContent = 'Guest Mode';
    DOM.usernameInput.value = '';
    DOM.usernameInput.focus();
  }
}

/**
 * Synchronizes the answer preview box and buttons state
 */
function setSelectedAnswer(digit) {
  AppState.selectedAnswer = digit;

  if (digit !== null) {
    DOM.answerPlaceholder.classList.add('hidden');
    DOM.answerValue.textContent = digit;
    DOM.answerValue.classList.remove('hidden');
    DOM.currentAnswerBox.classList.add('has-value');

    DOM.submitBtn.disabled = false;
    DOM.clearBtn.disabled = false;

    // Highlight corresponding keypad button
    DOM.keypadButtons.forEach((btn) => {
      btn.classList.toggle('key-active', btn.dataset.digit === String(digit));
    });
  } else {
    DOM.answerPlaceholder.classList.remove('hidden');
    DOM.answerValue.classList.add('hidden');
    DOM.answerValue.textContent = '';
    DOM.currentAnswerBox.classList.remove('has-value');

    DOM.submitBtn.disabled = true;
    DOM.clearBtn.disabled = true;

    DOM.keypadButtons.forEach((btn) => btn.classList.remove('key-active'));
  }
}

/**
 * Displays feedback banner under the puzzle
 */
function showFeedbackBanner(isCorrect, message) {
  DOM.feedbackBanner.className = `feedback-banner feedback-${isCorrect ? 'correct' : 'incorrect'}`;
  DOM.feedbackIcon.textContent = isCorrect ? '✅' : '❌';
  DOM.feedbackText.textContent = message;
  DOM.feedbackBanner.classList.remove('hidden');
}

function hideFeedbackBanner() {
  DOM.feedbackBanner.classList.add('hidden');
}

// ==============================================================================
// 5. ASYNCHRONOUS GAME ENGINE DISPATCHERS
// ==============================================================================

/**
 * Fetches a new mathematical puzzle from the Tier 2 Gateway
 */
async function fetchNewPuzzle() {
  if (AppState.isLoadingPuzzle) return;
  AppState.isLoadingPuzzle = true;

  // Clear previous answer and feedback
  setSelectedAnswer(null);
  hideFeedbackBanner();

  // Show skeleton loading state
  DOM.puzzleLoader.classList.remove('hidden');
  DOM.puzzleImg.classList.add('hidden');
  DOM.skipBtn.disabled = true;

  const result = await apiRequest('/api/game/new-puzzle');

  AppState.isLoadingPuzzle = false;
  DOM.skipBtn.disabled = false;

  if (!result.ok) {
    showToast(result.data.error || 'Failed to fetch puzzle.', 'error');
    DOM.puzzleLoader.classList.add('hidden');
    return;
  }

  // Check if offline resilience fallback was used
  if (result.data.isFallback) {
    DOM.fallbackIndicator.classList.remove('hidden');
    DOM.puzzleSourceTag.textContent = 'Offline Fallback Engine';
  } else {
    DOM.fallbackIndicator.classList.add('hidden');
    DOM.puzzleSourceTag.textContent = 'Live Banana API (Tier 3)';
  }

  // Preload and smoothly reveal the puzzle image
  const img = new Image();
  img.src = result.data.question;
  img.onload = () => {
    DOM.puzzleImg.src = result.data.question;
    DOM.puzzleLoader.classList.add('hidden');
    DOM.puzzleImg.classList.remove('hidden');
  };
  img.onerror = () => {
    DOM.puzzleLoader.classList.add('hidden');
    showToast('Failed to render puzzle image from CDN.', 'error');
  };
}

/**
 * Submits the selected answer guess to Tier 2 for server-side evaluation
 */
async function submitAnswer() {
  if (AppState.selectedAnswer === null || AppState.isSubmittingAnswer) return;
  AppState.isSubmittingAnswer = true;
  DOM.submitBtn.disabled = true;

  const result = await apiRequest('/api/game/submit-answer', {
    method: 'POST',
    body: { answer: AppState.selectedAnswer }
  });

  AppState.isSubmittingAnswer = false;

  if (!result.ok) {
    showToast(result.data.error || 'Submission failed.', 'error');
    DOM.submitBtn.disabled = false;
    return;
  }

  const { correct, message, user } = result.data;

  // Synchronize state and HUD
  AppState.user = user;
  updateHUD(user);

  // Trigger sensory micro-animations
  if (correct) {
    DOM.puzzleCard.classList.remove('shake-animation');
    DOM.puzzleCard.classList.add('celebrate-animation');
    setTimeout(() => DOM.puzzleCard.classList.remove('celebrate-animation'), 650);

    showFeedbackBanner(true, message);
    showToast(message, 'success');

    // Automatically load next puzzle after short celebration pause
    setTimeout(() => {
      fetchNewPuzzle();
    }, 1200);
  } else {
    DOM.puzzleCard.classList.remove('celebrate-animation');
    DOM.puzzleCard.classList.add('shake-animation');
    setTimeout(() => DOM.puzzleCard.classList.remove('shake-animation'), 500);

    showFeedbackBanner(false, message);
    showToast(message, 'error');

    // Automatically load next puzzle after short pause
    setTimeout(() => {
      fetchNewPuzzle();
    }, 1800);
  }
}

// ==============================================================================
// 6. EVENT-DRIVEN PROGRAMMING LISTENERS (Theme 2 Demonstration)
// ==============================================================================

function setupEventListeners() {
  // --------------------------------------------------------------------------
  // Event 1: DOMContentLoaded (Automated Session Resumption via Cookie)
  // --------------------------------------------------------------------------
  window.addEventListener('DOMContentLoaded', async () => {
    const sessionCheck = await apiRequest('/api/auth/me');

    if (sessionCheck.ok && sessionCheck.data.authenticated) {
      AppState.user = sessionCheck.data.user;
      renderView('game');
      updateHUD(AppState.user);
      showToast(`Welcome back, ${AppState.user.username}! Session resumed.`, 'info');
      fetchNewPuzzle();
    } else {
      renderView('auth');
    }
  });

  // --------------------------------------------------------------------------
  // Event 2: Submit on Login Form (Virtual Identity Registration)
  // --------------------------------------------------------------------------
  DOM.loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevents default HTTP form reload

    const username = DOM.usernameInput.value.trim();
    if (!username) {
      DOM.usernameError.textContent = 'Please provide a valid player nickname.';
      DOM.usernameError.classList.remove('hidden');
      return;
    }

    DOM.usernameError.classList.add('hidden');
    DOM.loginBtn.disabled = true;

    const result = await apiRequest('/api/auth/login', {
      method: 'POST',
      body: { username }
    });

    DOM.loginBtn.disabled = false;

    if (!result.ok) {
      DOM.usernameError.textContent = result.data.error || 'Login failed.';
      DOM.usernameError.classList.remove('hidden');
      return;
    }

    AppState.user = result.data.user;
    renderView('game');
    updateHUD(AppState.user);
    showToast(`Identity initialized: Welcome ${AppState.user.username}!`, 'success');
    fetchNewPuzzle();
  });

  // --------------------------------------------------------------------------
  // Event 3: Click on Virtual Keypad Buttons (0 to 9)
  // --------------------------------------------------------------------------
  DOM.keypadButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      const digit = parseInt(btn.dataset.digit, 10);
      setSelectedAnswer(digit);
    });
  });

  // --------------------------------------------------------------------------
  // Event 4: Physical Keyboard Keydown Event Listener
  // --------------------------------------------------------------------------
  window.addEventListener('keydown', (e) => {
    // Only capture keyboard shortcuts when in active game view
    if (DOM.gameSection.classList.contains('hidden')) return;

    // Numbers 0 through 9
    if (e.key >= '0' && e.key <= '9') {
      const digit = parseInt(e.key, 10);
      setSelectedAnswer(digit);
    } 
    // Enter key triggers submission
    else if (e.key === 'Enter') {
      if (AppState.selectedAnswer !== null && !AppState.isSubmittingAnswer) {
        submitAnswer();
      }
    } 
    // Escape or Backspace clears selection
    else if (e.key === 'Escape' || e.key === 'Backspace') {
      setSelectedAnswer(null);
    }
  });

  // --------------------------------------------------------------------------
  // Event 5: Primary Action Buttons (Submit, Clear, Skip, Reset, Logout)
  // --------------------------------------------------------------------------
  DOM.submitBtn.addEventListener('click', submitAnswer);

  DOM.clearBtn.addEventListener('click', () => {
    setSelectedAnswer(null);
  });

  DOM.skipBtn.addEventListener('click', () => {
    showToast('Skipping current puzzle...', 'info', 2000);
    fetchNewPuzzle();
  });

  DOM.resetBtn.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to reset your score and streak to zero?')) return;

    const result = await apiRequest('/api/game/reset', { method: 'POST' });
    if (result.ok) {
      AppState.user = result.data.user;
      updateHUD(AppState.user);
      showToast('Game statistics reset to 0.', 'info');
      fetchNewPuzzle();
    }
  });

  DOM.logoutBtn.addEventListener('click', async () => {
    const result = await apiRequest('/api/auth/logout', { method: 'POST' });
    if (result.ok) {
      AppState.user = null;
      AppState.selectedAnswer = null;
      renderView('auth');
      showToast('Logged out successfully.', 'info');
    }
  });
}

// Initialize Event-Driven Architecture
setupEventListeners();
