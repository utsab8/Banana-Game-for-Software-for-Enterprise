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
  toastContainer: document.getElementById('toast-container'),

  // Leaderboard & SQLite Data
  leaderboardNavBtn: document.getElementById('leaderboard-nav-btn'),
  leaderboardModal: document.getElementById('leaderboard-modal'),
  modalCloseBtn: document.getElementById('modal-close-btn'),
  modalLeaderboardTbody: document.getElementById('modal-leaderboard-tbody'),
  tabBtnLeaderboard: document.getElementById('tab-btn-leaderboard'),
  tabBtnHistory: document.getElementById('tab-btn-history'),
  tabContentLeaderboard: document.getElementById('tab-content-leaderboard'),
  tabContentHistory: document.getElementById('tab-content-history'),
  refreshDataBtn: document.getElementById('refresh-data-btn'),
  leaderboardTbody: document.getElementById('leaderboard-tbody'),
  historyTbody: document.getElementById('history-tbody')
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
// SQLite Persistence & Leaderboard Engine
// -----------------------------------------------------------------------------
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function loadLeaderboard() {
  const res = await api('/api/game/leaderboard');
  if (!res.ok || !res.data || !res.data.leaderboard) {
    const errHtml = `<tr><td colspan="6" class="text-center py-4 text-muted">Unable to load SQLite leaderboard.</td></tr>`;
    if (DOM.leaderboardTbody) DOM.leaderboardTbody.innerHTML = errHtml;
    if (DOM.modalLeaderboardTbody) DOM.modalLeaderboardTbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Unable to load SQLite leaderboard.</td></tr>`;
    return;
  }

  const list = res.data.leaderboard;
  if (list.length === 0) {
    const emptyHtml = `<tr><td colspan="6" class="text-center py-4 text-muted">No players recorded in SQLite yet. Play a round to rank #1!</td></tr>`;
    if (DOM.leaderboardTbody) DOM.leaderboardTbody.innerHTML = emptyHtml;
    if (DOM.modalLeaderboardTbody) DOM.modalLeaderboardTbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">No records yet.</td></tr>`;
    return;
  }

  const rowsHtml = list.map((player, idx) => {
    const rank = idx + 1;
    const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
    const isCurrent = state.user && state.user.username.toLowerCase() === player.username.toLowerCase();
    const highlightStyle = isCurrent ? 'font-weight: 700; background-color: #f0fdf4;' : '';
    const dateFormatted = player.last_active_at ? new Date(player.last_active_at).toLocaleDateString() : '-';

    return `
      <tr style="${highlightStyle}">
        <td><span class="rank-badge ${rankClass}">${rank}</span></td>
        <td><strong>${escapeHtml(player.username)}</strong>${isCurrent ? ' <span class="badge badge-db-small">You</span>' : ''}</td>
        <td><span class="score-number">${player.high_score}</span> pts</td>
        <td>${player.streak}x</td>
        <td>${player.rounds_played}</td>
        <td>${dateFormatted}</td>
      </tr>
    `;
  }).join('');

  const modalRowsHtml = list.map((player, idx) => {
    const rank = idx + 1;
    const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
    const isCurrent = state.user && state.user.username.toLowerCase() === player.username.toLowerCase();
    const highlightStyle = isCurrent ? 'font-weight: 700; background-color: #f0fdf4;' : '';

    return `
      <tr style="${highlightStyle}">
        <td><span class="rank-badge ${rankClass}">${rank}</span></td>
        <td><strong>${escapeHtml(player.username)}</strong>${isCurrent ? ' (You)' : ''}</td>
        <td>${player.high_score} pts</td>
        <td>${player.streak}x</td>
        <td>${player.rounds_played}</td>
      </tr>
    `;
  }).join('');

  if (DOM.leaderboardTbody) DOM.leaderboardTbody.innerHTML = rowsHtml;
  if (DOM.modalLeaderboardTbody) DOM.modalLeaderboardTbody.innerHTML = modalRowsHtml;
}

async function loadUserHistory() {
  if (!state.user) return;
  const res = await api('/api/game/history');
  if (!res.ok || !res.data || !res.data.history) return;

  const history = res.data.history;
  if (history.length === 0) {
    if (DOM.historyTbody) {
      DOM.historyTbody.innerHTML = `<tr><td colspan="7" class="text-center py-4 text-muted">No rounds recorded yet for ${escapeHtml(state.user.username)}.</td></tr>`;
    }
    return;
  }

  if (DOM.historyTbody) {
    DOM.historyTbody.innerHTML = history.map((round, idx) => {
      const resultBadge = round.is_correct 
        ? '<span class="badge-correct"><i class="fa-solid fa-check"></i> Correct</span>'
        : '<span class="badge-incorrect"><i class="fa-solid fa-xmark"></i> Incorrect</span>';
      const sourceBadge = round.is_fallback
        ? '<span class="badge badge-warning" style="font-size: 0.7rem;">Offline SVG</span>'
        : '<span class="badge badge-info" style="font-size: 0.7rem;">Banana API</span>';
      const time = round.played_at ? new Date(round.played_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-';

      return `
        <tr>
          <td>#${round.id || (idx + 1)}</td>
          <td><strong>${round.user_answer}</strong></td>
          <td><strong>${round.solution}</strong></td>
          <td>${resultBadge}</td>
          <td>+${round.points_awarded} pts</td>
          <td>${sourceBadge}</td>
          <td>${time}</td>
        </tr>
      `;
    }).join('');
  }
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

  // Refresh SQLite persistence views
  loadLeaderboard();
  loadUserHistory();

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
  // 1. On page load: Check session and initialize SQLite views
  window.addEventListener('DOMContentLoaded', async () => {
    loadLeaderboard();

    const res = await api('/api/auth/me');
    if (res.ok && res.data.authenticated) {
      state.user = res.data.user;
      switchView('game');
      updateHUD(state.user);
      loadUserHistory();
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
    loadLeaderboard();
    loadUserHistory();
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
    // If modal is open, Escape closes it
    if (DOM.leaderboardModal && !DOM.leaderboardModal.classList.contains('hidden') && e.key === 'Escape') {
      DOM.leaderboardModal.classList.add('hidden');
      return;
    }

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
    DOM.resetBtn.disabled = true;
    const res = await api('/api/game/reset', { method: 'POST' });
    DOM.resetBtn.disabled = false;

    if (res.ok && res.data.success) {
      state.user = res.data.user;
      selectDigit(null);
      hideResultBanner();
      updateHUD(state.user);
      loadLeaderboard();
      loadUserHistory();
      showToast('Score has been reset to 0.', 'info');
      loadNewPuzzle();
    } else {
      showToast(res.data.error || 'Failed to reset score.', 'error');
    }
  });

  DOM.logoutBtn.addEventListener('click', async () => {
    const res = await api('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
      state.user = null;
      state.selectedAnswer = null;
      switchView('auth');
      loadLeaderboard();
      showToast('You have been logged out.', 'info');
    }
  });

  // 6. SQLite Leaderboard & History Tabs
  if (DOM.tabBtnLeaderboard && DOM.tabBtnHistory) {
    DOM.tabBtnLeaderboard.addEventListener('click', () => {
      DOM.tabBtnLeaderboard.classList.add('active');
      DOM.tabBtnHistory.classList.remove('active');
      DOM.tabContentLeaderboard.classList.remove('hidden');
      DOM.tabContentHistory.classList.add('hidden');
    });

    DOM.tabBtnHistory.addEventListener('click', () => {
      DOM.tabBtnHistory.classList.add('active');
      DOM.tabBtnLeaderboard.classList.remove('active');
      DOM.tabContentHistory.classList.remove('hidden');
      DOM.tabContentLeaderboard.classList.add('hidden');
      loadUserHistory();
    });
  }

  // 7. Refresh SQLite Data Button
  if (DOM.refreshDataBtn) {
    DOM.refreshDataBtn.addEventListener('click', async () => {
      DOM.refreshDataBtn.classList.add('fa-spin');
      await Promise.all([loadLeaderboard(), loadUserHistory()]);
      setTimeout(() => DOM.refreshDataBtn.classList.remove('fa-spin'), 600);
      showToast('SQLite records refreshed.', 'info', 1500);
    });
  }

  // 8. Leaderboard Modal Handlers
  if (DOM.leaderboardNavBtn && DOM.leaderboardModal) {
    DOM.leaderboardNavBtn.addEventListener('click', () => {
      loadLeaderboard();
      DOM.leaderboardModal.classList.remove('hidden');
    });

    if (DOM.modalCloseBtn) {
      DOM.modalCloseBtn.addEventListener('click', () => {
        DOM.leaderboardModal.classList.add('hidden');
      });
    }

    DOM.leaderboardModal.addEventListener('click', (e) => {
      if (e.target === DOM.leaderboardModal) {
        DOM.leaderboardModal.classList.add('hidden');
      }
    });
  }
}

// Start event listeners
initEvents();
