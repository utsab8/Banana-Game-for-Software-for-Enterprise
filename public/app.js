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
  isSubmitting: false,      // Flag to prevent double submissions
  currentMode: 'medium',    // Active difficulty mode: 'easy' | 'medium' | 'hard'
  timerInterval: null,      // Active countdown interval reference
  timerSecondsLeft: 25,     // Remaining seconds on active puzzle
  timerTotalSeconds: 25     // Total duration of current round
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

  // Auth Tabs & Forms
  tabBtnLogin: document.getElementById('tab-btn-login'),
  tabBtnRegister: document.getElementById('tab-btn-register'),
  loginForm: document.getElementById('login-form'),
  loginIdentifier: document.getElementById('login-identifier'),
  loginPassword: document.getElementById('login-password'),
  loginPwdToggle: document.getElementById('login-pwd-toggle'),
  loginError: document.getElementById('login-error'),
  loginBtn: document.getElementById('login-btn'),
  guestPlayBtn: document.getElementById('guest-play-btn'),

  registerForm: document.getElementById('register-form'),
  regUsername: document.getElementById('reg-username'),
  regEmail: document.getElementById('reg-email'),
  regPassword: document.getElementById('reg-password'),
  regConfirmPassword: document.getElementById('reg-confirm-password'),
  regPwdToggle: document.getElementById('reg-pwd-toggle'),
  regConfirmPwdToggle: document.getElementById('reg-confirm-pwd-toggle'),
  registerError: document.getElementById('register-error'),
  registerBtn: document.getElementById('register-btn'),

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
  historyTbody: document.getElementById('history-tbody'),

  // Difficulty Mode & Countdown Timer
  modePills: document.querySelectorAll('.mode-pill'),
  puzzleTimerContainer: document.getElementById('puzzle-timer-container'),
  timerSeconds: document.getElementById('timer-seconds'),
  timerProgressBar: document.getElementById('timer-progress-bar'),

  // Virtual Identity: Player Profile & Achievements
  userAvatarDisplay: document.getElementById('user-avatar-display'),
  sessionTitleText: document.getElementById('session-title-text'),
  hudAvatarDisplay: document.getElementById('hud-avatar-display'),
  hudPlayerTitle: document.getElementById('hud-player-title'),
  hudProfileTrigger: document.getElementById('hud-profile-trigger'),
  tabBtnAchievements: document.getElementById('tab-btn-achievements'),
  tabContentAchievements: document.getElementById('tab-content-achievements'),
  achievementsTabBadge: document.getElementById('achievements-tab-badge'),
  achievementsGrid: document.getElementById('achievements-grid'),
  achievementsProgressText: document.getElementById('achievements-progress-text'),

  // Profile Modal Elements
  profileModal: document.getElementById('profile-modal'),
  profileModalCloseBtn: document.getElementById('profile-modal-close-btn'),
  saveProfileBtn: document.getElementById('save-profile-btn'),
  modalPreviewAvatar: document.getElementById('modal-preview-avatar'),
  modalPreviewUsername: document.getElementById('modal-preview-username'),
  modalPreviewTitle: document.getElementById('modal-preview-title'),
  modalPreviewHighscore: document.getElementById('modal-preview-highscore'),
  modalPreviewTrophies: document.getElementById('modal-preview-trophies'),
  avatarOptionsGrid: document.getElementById('avatar-options-grid'),
  titlesOptionsList: document.getElementById('titles-options-list'),

  // Sound Control
  soundToggleBtn: document.getElementById('sound-toggle-btn'),
  soundIcon: document.getElementById('sound-icon')
};

// -----------------------------------------------------------------------------
// Web Audio API Sound Synthesizer (Theme 2: Event-Driven Auditory Feedback)
// Zero external audio asset dependencies - pure procedural audio synthesis
// -----------------------------------------------------------------------------
const SoundFX = {
  audioCtx: null,
  isMuted: false,

  init() {
    if (!this.audioCtx) {
      const AudioCtxClass = window.AudioContext || window.webkitAudioContext;
      if (AudioCtxClass) {
        this.audioCtx = new AudioCtxClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  },

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
    if (this.isMuted) return;
    try {
      this.init();
      if (!this.audioCtx) return;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.audioCtx.destination);
      osc.start();
      osc.stop(this.audioCtx.currentTime + duration);
    } catch (e) {
      // Handled silently if autoplay restricted
    }
  },

  click() {
    this.playTone(600, 'triangle', 0.04, 0.05);
  },

  correct() {
    // Joyful melodic arpeggio (C5 -> E5 -> G5)
    this.playTone(523.25, 'sine', 0.1, 0.12);
    setTimeout(() => this.playTone(659.25, 'sine', 0.12, 0.12), 80);
    setTimeout(() => this.playTone(783.99, 'sine', 0.25, 0.14), 160);
  },

  wrong() {
    // Low error buzzer
    this.playTone(220, 'sawtooth', 0.15, 0.1);
    setTimeout(() => this.playTone(180, 'sawtooth', 0.25, 0.1), 120);
  },

  timeout() {
    // Alarm warning pulse
    this.playTone(330, 'square', 0.12, 0.08);
    setTimeout(() => this.playTone(260, 'square', 0.2, 0.08), 100);
  },

  achievement() {
    // Triumphant fanfare (C5 -> G5 -> C6)
    this.playTone(523.25, 'sine', 0.12, 0.14);
    setTimeout(() => this.playTone(783.99, 'sine', 0.14, 0.15), 100);
    setTimeout(() => this.playTone(1046.50, 'triangle', 0.35, 0.18), 220);
  }
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

  const avatar = user.avatar || '🍌';
  const title = user.title || 'Banana Rookie';

  if (DOM.hudAvatarDisplay) DOM.hudAvatarDisplay.textContent = avatar;
  if (DOM.hudPlayerTitle) DOM.hudPlayerTitle.textContent = title;
  if (DOM.userAvatarDisplay) DOM.userAvatarDisplay.textContent = avatar;
  if (DOM.sessionTitleText) DOM.sessionTitleText.textContent = title;
}

function switchView(view) {
  if (view === 'game') {
    DOM.authSection.classList.add('hidden');
    DOM.gameSection.classList.remove('hidden');
    DOM.logoutBtn.classList.remove('hidden');

    DOM.sessionBadge.className = 'player-chip active';
    DOM.sessionStatusText.textContent = state.user.username;
    if (DOM.userAvatarDisplay) DOM.userAvatarDisplay.textContent = state.user.avatar || '🍌';
    if (DOM.sessionTitleText) DOM.sessionTitleText.textContent = state.user.title || 'Banana Rookie';
  } else {
    DOM.gameSection.classList.add('hidden');
    DOM.authSection.classList.remove('hidden');
    DOM.logoutBtn.classList.add('hidden');

    DOM.sessionBadge.className = 'player-chip guest';
    DOM.sessionStatusText.textContent = 'Not Logged In';
    if (DOM.userAvatarDisplay) DOM.userAvatarDisplay.textContent = '🍌';
    if (DOM.sessionTitleText) DOM.sessionTitleText.textContent = 'Banana Rookie';
    if (DOM.loginIdentifier) {
      DOM.loginIdentifier.value = '';
    }
    if (DOM.loginPassword) {
      DOM.loginPassword.value = '';
    }
  }
}

function selectDigit(digit) {
  state.selectedAnswer = digit;

  if (digit !== null) {
    SoundFX.click();
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

async function loadLeaderboard(retryCount = 0) {
  const res = await api('/api/game/leaderboard');
  if (!res.ok || !res.data || !res.data.leaderboard) {
    if (retryCount < 2) {
      setTimeout(() => loadLeaderboard(retryCount + 1), 1200);
      return;
    }
    const errHtml = `<tr><td colspan="6" class="text-center py-4 text-muted">Leaderboard sync in progress... <button type="button" class="btn-link-highlight" onclick="loadLeaderboard()" style="margin-left: 6px; text-decoration: underline; cursor: pointer;">Retry</button></td></tr>`;
    if (DOM.leaderboardTbody) DOM.leaderboardTbody.innerHTML = errHtml;
    if (DOM.modalLeaderboardTbody) DOM.modalLeaderboardTbody.innerHTML = `<tr><td colspan="5" class="text-center py-4 text-muted">Leaderboard sync in progress... <button type="button" class="btn-link-highlight" onclick="loadLeaderboard()" style="margin-left: 6px; text-decoration: underline; cursor: pointer;">Retry</button></td></tr>`;
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
    const isCurrent = Boolean(state.user && state.user.username && player && player.username && state.user.username.toLowerCase() === player.username.toLowerCase());
    const highlightStyle = isCurrent ? 'font-weight: 700; background-color: #f0fdf4;' : '';
    const dateFormatted = player.last_active_at ? new Date(player.last_active_at).toLocaleDateString() : '-';

    return `
      <tr style="${highlightStyle}">
        <td><span class="rank-badge ${rankClass}">${rank}</span></td>
        <td><span class="player-avatar-mini">${player.avatar || '🍌'}</span><strong>${escapeHtml(player.username)}</strong>${isCurrent ? ' <span class="badge-db-small">You</span>' : ''} <span class="player-title-mini">${escapeHtml(player.title || 'Banana Rookie')}</span></td>
        <td class="text-right"><strong class="mono-val">${player.high_score}</strong> <span class="text-muted" style="font-size: 0.75rem;">pts</span></td>
        <td class="text-center"><span class="mono-val">${player.streak}x</span></td>
        <td class="text-center"><span class="mono-val">${player.rounds_played}</span></td>
        <td><span class="text-muted" style="font-size: 0.78rem;">${dateFormatted}</span></td>
      </tr>
    `;
  }).join('');

  const modalRowsHtml = list.map((player, idx) => {
    const rank = idx + 1;
    const rankClass = rank === 1 ? 'rank-1' : rank === 2 ? 'rank-2' : rank === 3 ? 'rank-3' : 'rank-other';
    const isCurrent = Boolean(state.user && state.user.username && player && player.username && state.user.username.toLowerCase() === player.username.toLowerCase());
    const highlightStyle = isCurrent ? 'font-weight: 700; background-color: #f0fdf4;' : '';

    return `
      <tr style="${highlightStyle}">
        <td><span class="rank-badge ${rankClass}">${rank}</span></td>
        <td><span class="player-avatar-mini">${player.avatar || '🍌'}</span><strong>${escapeHtml(player.username)}</strong>${isCurrent ? ' <span class="badge-db-small">You</span>' : ''} <span class="player-title-mini">${escapeHtml(player.title || 'Banana Rookie')}</span></td>
        <td class="text-right"><strong class="mono-val">${player.high_score}</strong> pts</td>
        <td class="text-center"><span class="mono-val">${player.streak}x</span></td>
        <td class="text-center"><span class="mono-val">${player.rounds_played}</span></td>
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
      DOM.historyTbody.innerHTML = `<tr><td colspan="8" class="text-center py-4 text-muted">No rounds recorded yet for ${escapeHtml(state.user.username)}.</td></tr>`;
    }
    return;
  }

  if (DOM.historyTbody) {
    DOM.historyTbody.innerHTML = history.map((round, idx) => {
      const resultBadge = round.is_correct 
        ? '<span class="badge-outcome-correct"><i class="fa-solid fa-check"></i> Validated</span>'
        : '<span class="badge-outcome-wrong"><i class="fa-solid fa-xmark"></i> Rejected</span>';
      const sourceBadge = round.is_fallback
        ? '<span class="status-badge fallback-badge" style="font-size: 0.68rem; padding: 0.15rem 0.45rem;">Offline SVG</span>'
        : '<span class="status-badge source-badge" style="font-size: 0.68rem; padding: 0.15rem 0.45rem;">Banana API</span>';
      
      const roundMode = round.mode || 'medium';
      const modeBadge = roundMode === 'easy'
        ? '<span class="badge-mode-easy">Easy</span>'
        : roundMode === 'hard'
          ? '<span class="badge-mode-hard">Hard</span>'
          : '<span class="badge-mode-medium">Medium</span>';

      const guessDisplay = round.user_answer === -1
        ? '<span style="color: var(--danger); font-size: 0.8rem; font-weight: 800;">⏰ Time\'s Up</span>'
        : escapeHtml(round.user_answer);

      const pointsDisplay = round.points_awarded > 0
        ? `<strong class="mono-val" style="color: var(--success);">+${round.points_awarded}</strong> pts`
        : round.points_awarded < 0
          ? `<strong class="mono-val" style="color: var(--danger);">${round.points_awarded}</strong> pts`
          : `<strong class="mono-val" style="color: var(--text-muted);">0</strong> pts`;

      const time = round.played_at ? new Date(round.played_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '-';

      return `
        <tr>
          <td><span class="mono-val" style="color: var(--text-muted);">#${round.id || (idx + 1)}</span></td>
          <td class="text-center"><strong class="mono-val" style="font-size: 1.05rem;">${guessDisplay}</strong></td>
          <td class="text-center"><strong class="mono-val" style="color: var(--primary); font-size: 1.05rem;">${round.solution}</strong></td>
          <td>${resultBadge}</td>
          <td class="text-right">${pointsDisplay}</td>
          <td class="text-center">${modeBadge}</td>
          <td>${sourceBadge}</td>
          <td><span class="mono-val" style="font-size: 0.75rem; color: var(--text-muted);">${time}</span></td>
        </tr>
      `;
    }).join('');
  }
}

// -----------------------------------------------------------------------------
// Virtual Identity Engine: Avatar Customizer & Achievement Trophies
// Demonstrates Theme 4: Virtual Identity via custom avatars and unlockable titles
// -----------------------------------------------------------------------------
const TITLES_CATALOG = [
  { id: 'rookie', title: 'Banana Rookie', icon: '🍌', minScore: 0 },
  { id: 'math_explorer', title: 'Math Explorer', icon: '🧭', minScore: 50 },
  { id: 'puzzle_solver', title: 'Puzzle Solver', icon: '🧩', minScore: 150 },
  { id: 'speed_master', title: 'Speed Master', icon: '⚡', minScore: 300 },
  { id: 'primate_genius', title: 'Primate Genius', icon: '🐵', minScore: 500 },
  { id: 'banana_champion', title: 'Grand Banana Champion', icon: '👑', minScore: 1000 }
];

let selectedAvatarInModal = '🍌';
let selectedTitleInModal = 'Banana Rookie';

async function loadAchievements() {
  if (!state.user) return;
  const res = await api('/api/user/achievements');
  if (!res.ok || !res.data || !res.data.achievements) return;

  const list = res.data.achievements;
  const unlockedCount = list.filter(a => a.unlocked).length;
  const totalCount = list.length;

  if (DOM.achievementsTabBadge) {
    DOM.achievementsTabBadge.textContent = `${unlockedCount}/${totalCount}`;
  }
  if (DOM.achievementsProgressText) {
    DOM.achievementsProgressText.textContent = `${unlockedCount} / ${totalCount}`;
  }
  if (DOM.modalPreviewTrophies) {
    DOM.modalPreviewTrophies.textContent = `${unlockedCount}/${totalCount}`;
  }

  if (DOM.achievementsGrid) {
    DOM.achievementsGrid.innerHTML = list.map(ach => {
      const isUnlocked = ach.unlocked;
      const statusTag = isUnlocked
        ? '<span class="achievement-badge-status unlocked-tag"><i class="fa-solid fa-check"></i> Unlocked</span>'
        : '<span class="achievement-badge-status locked-tag"><i class="fa-solid fa-lock"></i> Locked</span>';

      const dateText = isUnlocked && ach.unlockedAt
        ? `<div style="font-size: 0.68rem; color: var(--success); margin-top: 0.25rem;"><i class="fa-solid fa-clock"></i> Earned ${new Date(ach.unlockedAt).toLocaleDateString()}</div>`
        : '';

      return `
        <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
          <div class="achievement-icon-box">${ach.icon}</div>
          <div class="achievement-info">
            <div class="achievement-title-row">
              <span class="achievement-title">${escapeHtml(ach.name)}</span>
              ${statusTag}
            </div>
            <p class="achievement-desc">${escapeHtml(ach.description)}</p>` +
            dateText +
          `</div>
        </div>
      `;
    }).join('');
  }
}

function openProfileModal() {
  if (!state.user) {
    showToast('Please sign in or start playing to customize your profile.', 'info');
    return;
  }

  selectedAvatarInModal = state.user.avatar || '🍌';
  selectedTitleInModal = state.user.title || 'Banana Rookie';

  if (DOM.modalPreviewAvatar) DOM.modalPreviewAvatar.textContent = selectedAvatarInModal;
  if (DOM.modalPreviewUsername) DOM.modalPreviewUsername.textContent = state.user.username;
  if (DOM.modalPreviewTitle) DOM.modalPreviewTitle.textContent = selectedTitleInModal;
  if (DOM.modalPreviewHighscore) DOM.modalPreviewHighscore.textContent = state.user.highScore || 0;

  // Highlight active avatar button
  if (DOM.avatarOptionsGrid) {
    const btns = DOM.avatarOptionsGrid.querySelectorAll('.avatar-opt-btn');
    btns.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.avatar === selectedAvatarInModal);
    });
  }

  // Populate title options with lock status
  if (DOM.titlesOptionsList) {
    const currentHigh = state.user.highScore || 0;
    DOM.titlesOptionsList.innerHTML = TITLES_CATALOG.map(t => {
      const isLocked = currentHigh < t.minScore;
      const isSelected = selectedTitleInModal === t.title;

      return `
        <div class="title-opt-card ${isSelected ? 'active' : ''} ${isLocked ? 'locked' : ''}" data-title="${escapeHtml(t.title)}" data-locked="${isLocked}">
          <div class="title-left">
            <span>${t.icon}</span>
            <span>${escapeHtml(t.title)}</span>
          </div>
          <div class="title-req">
            ${isLocked ? `<i class="fa-solid fa-lock"></i> Requires ${t.minScore} pts` : `<span class="text-success"><i class="fa-solid fa-check"></i> Available</span>`}
          </div>
        </div>
      `;
    }).join('');

    // Attach click events on title cards
    DOM.titlesOptionsList.querySelectorAll('.title-opt-card').forEach(card => {
      card.addEventListener('click', () => {
        if (card.dataset.locked === 'true') {
          showToast(`Title locked! Score more points to unlock.`, 'info');
          return;
        }
        DOM.titlesOptionsList.querySelectorAll('.title-opt-card').forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        selectedTitleInModal = card.dataset.title;
        if (DOM.modalPreviewTitle) DOM.modalPreviewTitle.textContent = selectedTitleInModal;
      });
    });
  }

  loadAchievements();
  DOM.profileModal.classList.remove('hidden');
}

async function saveProfileChanges() {
  if (DOM.saveProfileBtn) DOM.saveProfileBtn.disabled = true;

  const res = await api('/api/user/profile', {
    method: 'POST',
    body: {
      avatar: selectedAvatarInModal,
      title: selectedTitleInModal
    }
  });

  if (DOM.saveProfileBtn) DOM.saveProfileBtn.disabled = false;

  if (res.ok && res.data.success) {
    state.user = { ...(state.user || {}), ...res.data.user };
    updateHUD(state.user);
    loadLeaderboard();
    showToast('Profile avatar and title updated!', 'success');
    DOM.profileModal.classList.add('hidden');
  } else {
    showToast(res.data?.error || 'Could not save profile changes.', 'error');
  }
}


// -----------------------------------------------------------------------------
// Timer & Difficulty Mode Mechanics
// Demonstrates Theme 2: Event-Driven Programming with non-blocking intervals
// -----------------------------------------------------------------------------
function startTimer(seconds) {
  stopTimer();

  if (!seconds || seconds <= 0) {
    if (DOM.puzzleTimerContainer) DOM.puzzleTimerContainer.classList.add('hidden');
    return;
  }

  state.timerTotalSeconds = seconds;
  state.timerSecondsLeft = seconds;

  if (DOM.puzzleTimerContainer) {
    DOM.puzzleTimerContainer.classList.remove('hidden');
  }
  updateTimerUI(100);

  const startTime = Date.now();
  const totalMs = seconds * 1000;

  state.timerInterval = setInterval(() => {
    const elapsedMs = Date.now() - startTime;
    const remainingMs = Math.max(0, totalMs - elapsedMs);
    state.timerSecondsLeft = Math.ceil(remainingMs / 1000);

    const percent = Math.max(0, (remainingMs / totalMs) * 100);
    updateTimerUI(percent);

    if (remainingMs <= 0) {
      stopTimer();
      handleTimeout();
    }
  }, 100);
}

function stopTimer() {
  if (state.timerInterval) {
    clearInterval(state.timerInterval);
    state.timerInterval = null;
  }
}

function updateTimerUI(percent = 100) {
  if (DOM.timerSeconds) {
    DOM.timerSeconds.textContent = `${state.timerSecondsLeft}s`;
  }
  if (DOM.timerProgressBar) {
    DOM.timerProgressBar.style.width = `${percent}%`;

    // Dynamic color gradient transitions: Green -> Yellow -> Red
    DOM.timerProgressBar.classList.remove('timer-green', 'timer-yellow', 'timer-red');
    if (percent > 45) {
      DOM.timerProgressBar.classList.add('timer-green');
    } else if (percent > 20) {
      DOM.timerProgressBar.classList.add('timer-yellow');
    } else {
      DOM.timerProgressBar.classList.add('timer-red');
    }
  }

  // Visual pulse when under 5 seconds remain
  if (DOM.puzzleTimerContainer) {
    if (state.timerSecondsLeft <= 4 && state.timerSecondsLeft > 0) {
      DOM.puzzleTimerContainer.classList.add('timer-pulse');
    } else {
      DOM.puzzleTimerContainer.classList.remove('timer-pulse');
    }
  }
}

async function handleTimeout() {
  if (state.isSubmitting || state.isLoading) return;
  state.isSubmitting = true;
  DOM.submitBtn.disabled = true;

  SoundFX.timeout();
  showToast("⏰ Time's up!", 'error', 2500);

  const res = await api('/api/game/submit-answer', {
    method: 'POST',
    body: {
      isTimeout: true,
      mode: state.currentMode
    }
  });

  state.isSubmitting = false;

  if (!res.ok) {
    loadNewPuzzle();
    return;
  }

  const { message, user } = res.data;
  state.user = { ...(state.user || {}), ...user };
  updateHUD(state.user);

  loadLeaderboard();
  loadUserHistory();

  DOM.puzzleCard.classList.remove('celebrate-animation');
  DOM.puzzleCard.classList.add('shake-animation');
  setTimeout(() => DOM.puzzleCard.classList.remove('shake-animation'), 400);

  showResultBanner(false, message);

  setTimeout(() => {
    loadNewPuzzle();
  }, 1900);
}

function setDifficultyMode(mode) {
  state.currentMode = mode;

  // Update active styling on mode pills
  if (DOM.modePills) {
    DOM.modePills.forEach((pill) => {
      const isActive = pill.dataset.mode === mode;
      pill.classList.toggle('active', isActive);
      pill.setAttribute('aria-checked', isActive ? 'true' : 'false');
    });
  }

  // Persist mode choice to backend session
  api('/api/game/mode', {
    method: 'POST',
    body: { mode }
  });

  const modeName = mode.charAt(0).toUpperCase() + mode.slice(1);
  showToast(`Switched to ${modeName} Mode!`, 'info', 2000);

  // If in active game screen, stop timer and fetch puzzle tailored to mode
  if (DOM.gameSection && !DOM.gameSection.classList.contains('hidden')) {
    stopTimer();
    loadNewPuzzle();
  }
}



// -----------------------------------------------------------------------------
// Game Actions: Fetch Puzzle & Submit Answer
// -----------------------------------------------------------------------------
async function loadNewPuzzle(retryCount = 0) {
  if (state.isLoading) return;
  stopTimer(); // Freeze existing countdown when requesting a new puzzle
  state.isLoading = true;

  selectDigit(null);
  hideResultBanner();

  DOM.puzzleLoader.classList.remove('hidden');
  DOM.puzzleImg.classList.add('hidden');
  DOM.skipBtn.disabled = true;

  const res = await api(`/api/game/new-puzzle?mode=${encodeURIComponent(state.currentMode)}`);
  state.isLoading = false;
  DOM.skipBtn.disabled = false;

  if (!res.ok) {
    // Auto-retry up to 2 times to handle cold-start API latency / transient errors
    if (retryCount < 2) {
      const delay = (retryCount + 1) * 1500;
      showToast(`Connecting to puzzle server... (attempt ${retryCount + 2}/3)`, 'info', delay);
      DOM.puzzleLoader.classList.remove('hidden'); // keep loader visible during retry
      setTimeout(() => loadNewPuzzle(retryCount + 1), delay);
      return;
    }
    // All retries exhausted
    showToast(res.data.error || 'Could not load puzzle. Press Skip to try again.', 'error', 5000);
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

    // Initiate countdown timer as soon as image is visible to player
    const timeLimit = res.data.timeLimit !== undefined
      ? res.data.timeLimit
      : (state.currentMode === 'easy' ? 0 : (state.currentMode === 'hard' ? 12 : 25));
    startTimer(timeLimit);
  };
  img.onerror = () => {
    // Image URL returned by API but couldn't load — retry if attempts remain
    if (retryCount < 2) {
      const delay = (retryCount + 1) * 1500;
      showToast(`Puzzle image failed to load, retrying...`, 'info', delay);
      DOM.puzzleLoader.classList.remove('hidden');
      setTimeout(() => loadNewPuzzle(retryCount + 1), delay);
    } else {
      DOM.puzzleLoader.classList.add('hidden');
      showToast('Failed to load puzzle image. Press Skip to try again.', 'error', 5000);
    }
  };
}

async function handleAnswerSubmit() {
  if (state.selectedAnswer === null || state.isSubmitting) return;
  stopTimer(); // Freeze timer immediately upon submission
  state.isSubmitting = true;
  DOM.submitBtn.disabled = true;

  const res = await api('/api/game/submit-answer', {
    method: 'POST',
    body: {
      answer: state.selectedAnswer,
      mode: state.currentMode
    }
  });

  state.isSubmitting = false;

  if (!res.ok) {
    if (res.status === 401) {
      showToast('Session expired. Please sign in again.', 'error', 3500);
      switchView('auth');
      state.user = null;
      return;
    }
    showToast(res.data?.error || 'Failed to submit answer.', 'error');
    DOM.submitBtn.disabled = false;
    return;
  }

  const { correct, message, user, newAchievements } = res.data;

  // Update HUD preserving username
  state.user = { ...(state.user || {}), ...user };
  updateHUD(state.user);

  // Trigger celebration toasts if new achievements were unlocked!
  if (Array.isArray(newAchievements) && newAchievements.length > 0) {
    SoundFX.achievement();
    newAchievements.forEach((ach) => {
      showToast(`🏆 Trophy Unlocked: ${ach.icon} ${ach.name}!`, 'success', 5500);
    });
    loadAchievements();
  } else if (correct) {
    SoundFX.correct();
  } else {
    SoundFX.wrong();
  }

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
    loadAchievements();

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

  // Helpers: Set & Clear Form Errors
  function setFormError(errorEl, message, showCreateLink = false, identifier = '') {
    if (!errorEl) return;
    const contentSpan = errorEl.querySelector('.error-msg-content') || errorEl;
    if (showCreateLink && identifier) {
      contentSpan.innerHTML = `${escapeHtml(message)} <button type="button" id="quick-create-link" class="btn-link-highlight" style="margin-left: 4px; text-decoration: underline;">Create this account?</button>`;
      const link = document.getElementById('quick-create-link');
      if (link) {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          if (DOM.tabBtnRegister) DOM.tabBtnRegister.click();
          if (DOM.regUsername) DOM.regUsername.value = identifier;
          if (DOM.regPassword) DOM.regPassword.focus();
        });
      }
    } else {
      contentSpan.textContent = message;
    }
    errorEl.classList.remove('hidden');
  }

  function clearFormError(errorEl) {
    if (!errorEl) return;
    errorEl.classList.add('hidden');
    const contentSpan = errorEl.querySelector('.error-msg-content') || errorEl;
    contentSpan.textContent = '';
  }

  // 2. Auth Tab Switching
  if (DOM.tabBtnLogin && DOM.tabBtnRegister) {
    DOM.tabBtnLogin.addEventListener('click', () => {
      DOM.tabBtnLogin.classList.add('active');
      DOM.tabBtnRegister.classList.remove('active');
      DOM.tabBtnLogin.setAttribute('aria-selected', 'true');
      DOM.tabBtnRegister.setAttribute('aria-selected', 'false');
      DOM.loginForm.classList.remove('hidden');
      DOM.registerForm.classList.add('hidden');
      clearFormError(DOM.loginError);
      clearFormError(DOM.registerError);
      if (DOM.loginIdentifier) DOM.loginIdentifier.focus();
    });

    DOM.tabBtnRegister.addEventListener('click', () => {
      DOM.tabBtnRegister.classList.add('active');
      DOM.tabBtnLogin.classList.remove('active');
      DOM.tabBtnRegister.setAttribute('aria-selected', 'true');
      DOM.tabBtnLogin.setAttribute('aria-selected', 'false');
      DOM.registerForm.classList.remove('hidden');
      DOM.loginForm.classList.add('hidden');
      clearFormError(DOM.loginError);
      clearFormError(DOM.registerError);
      if (DOM.regUsername) DOM.regUsername.focus();
    });
  }

  // Quick switch links at bottom of forms
  const switchToRegisterBtn = document.getElementById('switch-to-register-btn');
  const switchToLoginBtn = document.getElementById('switch-to-login-btn');
  if (switchToRegisterBtn) {
    switchToRegisterBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (DOM.tabBtnRegister) DOM.tabBtnRegister.click();
    });
  }
  if (switchToLoginBtn) {
    switchToLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      if (DOM.tabBtnLogin) DOM.tabBtnLogin.click();
    });
  }

  // Clear errors when user types
  if (DOM.loginIdentifier) DOM.loginIdentifier.addEventListener('input', () => clearFormError(DOM.loginError));
  if (DOM.loginPassword) DOM.loginPassword.addEventListener('input', () => clearFormError(DOM.loginError));
  if (DOM.regUsername) DOM.regUsername.addEventListener('input', () => clearFormError(DOM.registerError));
  if (DOM.regEmail) DOM.regEmail.addEventListener('input', () => clearFormError(DOM.registerError));
  if (DOM.regPassword) DOM.regPassword.addEventListener('input', () => clearFormError(DOM.registerError));
  if (DOM.regConfirmPassword) DOM.regConfirmPassword.addEventListener('input', () => clearFormError(DOM.registerError));

  // 3. Password Visibility Toggles
  function setupPwdToggle(toggleBtn, inputEl) {
    if (!toggleBtn || !inputEl) return;
    toggleBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isPassword = inputEl.type === 'password';
      inputEl.type = isPassword ? 'text' : 'password';
      toggleBtn.innerHTML = isPassword 
        ? '<i class="fa-solid fa-eye-slash"></i>' 
        : '<i class="fa-solid fa-eye"></i>';
      toggleBtn.setAttribute('title', isPassword ? 'Hide password' : 'Show password');
      toggleBtn.setAttribute('aria-label', isPassword ? 'Hide password' : 'Show password');
      inputEl.focus();
    });
  }
  setupPwdToggle(DOM.loginPwdToggle, DOM.loginPassword);
  setupPwdToggle(DOM.regPwdToggle, DOM.regPassword);
  setupPwdToggle(DOM.regConfirmPwdToggle, DOM.regConfirmPassword);

  // 4. Sign In Form Submit (Email / Username + Password)
  if (DOM.loginForm) {
    DOM.loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const identifier = DOM.loginIdentifier.value.trim();
      const password = DOM.loginPassword.value;

      if (!identifier) {
        setFormError(DOM.loginError, 'Please enter your username or email.');
        return;
      }

      if (!password) {
        setFormError(DOM.loginError, 'Please enter your password.');
        return;
      }

      clearFormError(DOM.loginError);
      DOM.loginBtn.disabled = true;

      const res = await api('/api/auth/login', {
        method: 'POST',
        body: { identifier, password }
      });

      DOM.loginBtn.disabled = false;

      if (!res.ok) {
        const errMsg = res.data.error || 'Login failed. Please check your credentials.';
        const isNotFound = res.status === 404;
        setFormError(DOM.loginError, errMsg, isNotFound, identifier);
        return;
      }

      state.user = res.data.user;
      switchView('game');
      updateHUD(state.user);
      loadLeaderboard();
      loadUserHistory();
      showToast(`Welcome back, ${state.user.username}!`, 'success');
      loadNewPuzzle();
    });
  }

  // 5. Register Form Submit (Username, Email, Password, Confirm Password)
  if (DOM.registerForm) {
    DOM.registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = DOM.regUsername.value.trim();
      const email = DOM.regEmail.value.trim();
      const password = DOM.regPassword.value;
      const confirmPassword = DOM.regConfirmPassword.value;

      if (!username || username.length < 3) {
        setFormError(DOM.registerError, 'Username must be at least 3 characters.');
        return;
      }

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        setFormError(DOM.registerError, 'Please enter a valid email address.');
        return;
      }

      if (!password || password.length < 6) {
        setFormError(DOM.registerError, 'Password must be at least 6 characters.');
        return;
      }

      if (password !== confirmPassword) {
        setFormError(DOM.registerError, 'Passwords do not match.');
        return;
      }

      clearFormError(DOM.registerError);
      DOM.registerBtn.disabled = true;

      const res = await api('/api/auth/register', {
        method: 'POST',
        body: { username, email, password }
      });

      DOM.registerBtn.disabled = false;

      if (!res.ok) {
        setFormError(DOM.registerError, res.data.error || 'Registration failed.');
        return;
      }

      state.user = res.data.user;
      switchView('game');
      updateHUD(state.user);
      loadLeaderboard();
      loadUserHistory();
      showToast(`Account created! Welcome, ${state.user.username}!`, 'success');
      loadNewPuzzle();
    });
  }

  // 6. Instant Guest Play
  if (DOM.guestPlayBtn) {
    DOM.guestPlayBtn.addEventListener('click', async () => {
      DOM.guestPlayBtn.disabled = true;
      const guestName = `Guest_${Math.floor(1000 + Math.random() * 9000)}`;
      const res = await api('/api/auth/login', {
        method: 'POST',
        body: { identifier: guestName }
      });
      DOM.guestPlayBtn.disabled = false;

      if (!res.ok) {
        DOM.loginError.textContent = res.data.error || 'Guest login failed.';
        DOM.loginError.classList.remove('hidden');
        return;
      }

      state.user = res.data.user;
      switchView('game');
      updateHUD(state.user);
      loadLeaderboard();
      loadUserHistory();
      showToast(`Playing as ${state.user.username} (Guest)`, 'info');
      loadNewPuzzle();
    });
  }

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
    stopTimer();
    showToast('Skipping puzzle...', 'info', 1500);
    loadNewPuzzle();
  });

  DOM.resetBtn.addEventListener('click', async () => {
    stopTimer();
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
    stopTimer();
    DOM.logoutBtn.disabled = true;
    try {
      await api('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.warn('Logout network error:', err);
    } finally {
      DOM.logoutBtn.disabled = false;
      state.user = null;
      state.selectedAnswer = null;
      state.currentMode = 'medium';
      switchView('auth');
      loadLeaderboard();
      showToast('You have been logged out.', 'info');
    }
  });

  // 5.1 Difficulty Mode Selector Handlers
  if (DOM.modePills && DOM.modePills.length > 0) {
    DOM.modePills.forEach((pill) => {
      pill.addEventListener('click', () => {
        const mode = pill.dataset.mode;
        if (!mode || mode === state.currentMode) return;
        setDifficultyMode(mode);
      });
    });
  }

  // 6. SQLite Leaderboard & History Tabs
  if (DOM.tabBtnLeaderboard && DOM.tabBtnHistory) {
    DOM.tabBtnLeaderboard.addEventListener('click', () => {
      DOM.tabBtnLeaderboard.classList.add('active');
      DOM.tabBtnHistory.classList.remove('active');
      if (DOM.tabBtnAchievements) DOM.tabBtnAchievements.classList.remove('active');
      DOM.tabContentLeaderboard.classList.remove('hidden');
      DOM.tabContentHistory.classList.add('hidden');
      if (DOM.tabContentAchievements) DOM.tabContentAchievements.classList.add('hidden');
    });

    DOM.tabBtnHistory.addEventListener('click', () => {
      DOM.tabBtnHistory.classList.add('active');
      DOM.tabBtnLeaderboard.classList.remove('active');
      if (DOM.tabBtnAchievements) DOM.tabBtnAchievements.classList.remove('active');
      DOM.tabContentHistory.classList.remove('hidden');
      DOM.tabContentLeaderboard.classList.add('hidden');
      if (DOM.tabContentAchievements) DOM.tabContentAchievements.classList.add('hidden');
      loadUserHistory();
    });

    if (DOM.tabBtnAchievements) {
      DOM.tabBtnAchievements.addEventListener('click', () => {
        DOM.tabBtnAchievements.classList.add('active');
        DOM.tabBtnLeaderboard.classList.remove('active');
        DOM.tabBtnHistory.classList.remove('active');
        if (DOM.tabContentAchievements) DOM.tabContentAchievements.classList.remove('hidden');
        DOM.tabContentLeaderboard.classList.add('hidden');
        DOM.tabContentHistory.classList.add('hidden');
        loadAchievements();
      });
    }
  }

  // 7. Refresh SQLite Data Button
  if (DOM.refreshDataBtn) {
    DOM.refreshDataBtn.addEventListener('click', async () => {
      DOM.refreshDataBtn.classList.add('fa-spin');
      await Promise.all([loadLeaderboard(), loadUserHistory(), loadAchievements()]);
      setTimeout(() => DOM.refreshDataBtn.classList.remove('fa-spin'), 600);
      showToast('SQLite records refreshed.', 'info', 1500);
    });
  }


  // 9. Profile & Avatar Customizer Listeners
  if (DOM.sessionBadge) {
    DOM.sessionBadge.addEventListener('click', () => {
      openProfileModal();
    });
  }

  if (DOM.hudProfileTrigger) {
    DOM.hudProfileTrigger.addEventListener('click', () => {
      openProfileModal();
    });
  }

  if (DOM.profileModalCloseBtn && DOM.profileModal) {
    DOM.profileModalCloseBtn.addEventListener('click', () => {
      DOM.profileModal.classList.add('hidden');
    });

    DOM.profileModal.addEventListener('click', (e) => {
      if (e.target === DOM.profileModal) {
        DOM.profileModal.classList.add('hidden');
      }
    });
  }

  if (DOM.saveProfileBtn) {
    DOM.saveProfileBtn.addEventListener('click', saveProfileChanges);
  }

  // Avatar button selectors in profile modal
  if (DOM.avatarOptionsGrid) {
    const btns = DOM.avatarOptionsGrid.querySelectorAll('.avatar-opt-btn');
    btns.forEach(btn => {
      btn.addEventListener('click', () => {
        btns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedAvatarInModal = btn.dataset.avatar;
        if (DOM.modalPreviewAvatar) DOM.modalPreviewAvatar.textContent = selectedAvatarInModal;
      });
    });
  }

  // Sound Effects Toggle Handler
  if (DOM.soundToggleBtn && DOM.soundIcon) {
    DOM.soundToggleBtn.addEventListener('click', () => {
      SoundFX.isMuted = !SoundFX.isMuted;
      DOM.soundToggleBtn.classList.toggle('muted', SoundFX.isMuted);
      DOM.soundIcon.className = SoundFX.isMuted ? 'fa-solid fa-volume-xmark' : 'fa-solid fa-volume-high';
      showToast(SoundFX.isMuted ? 'Sound FX muted.' : 'Sound FX enabled!', 'info', 1500);
      if (!SoundFX.isMuted) SoundFX.click();
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
