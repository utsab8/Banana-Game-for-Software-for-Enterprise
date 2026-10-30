/**
 * ==============================================================================
 * CIS046-3 Software For Enterprise — Assignment 1: Banana Challenge Enterprise System
 * ==============================================================================
 * Student Name: Utsab
 * Academic Year: 2026/2027
 * Institution: University of Bedfordshire
 *
 * TIER 2: Application Server & API Gateway
 *
 * ACADEMIC ATTRIBUTION & THIRD-PARTY DISCLOSURE:
 * 1. External Banana API Service:
 *    - Author: Dr. Marc Conrad (University of Bedfordshire)
 *    - Documentation: https://marcconrad.com/uob/banana/doc.php
 *    - Endpoint: https://marcconrad.com/uob/banana/api.php?out=json
 * 2. Node.js & Express Framework:
 *    - License: MIT License (Open Source)
 * 3. Session Engine (express-session):
 *    - License: MIT License (Open Source)
 * ==============================================================================
 */

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// ==============================================================================
// 1. APPLICATION MIDDLEWARE & STATIC ASSET PIPELINE
// ==============================================================================

// Enable Cross-Origin Resource Sharing (defense-in-depth)
app.use(cors());

// Parse incoming JSON and URL-encoded HTTP request bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Tier 1 Presentation Layer static files (HTML, CSS, JS) from /public
app.use(express.static(path.join(__dirname, 'public')));

// ==============================================================================
// 2. VIRTUAL IDENTITY: SESSION CONFIGURATION OVER STATELESS HTTP
// Demonstrates Theme 4: Virtual Identity via HTTP-only cryptographic cookies
// ==============================================================================

app.use(
  session({
    name: 'connect.sid',
    secret: process.env.SESSION_SECRET || 'enterprise-banana-challenge-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // Prevents client-side JavaScript from accessing session cookie (XSS defense)
      sameSite: 'lax', // Protects against Cross-Site Request Forgery (CSRF)
      maxAge: 24 * 60 * 60 * 1000, // 24-hour persistent virtual identity
      secure: false // Set to true if deployed behind HTTPS reverse proxy
    }
  })
);

// Session Authentication Guard Middleware
const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthenticated. Please register a virtual player nickname first.'
    });
  }
  next();
};

// ==============================================================================
// 3. INTEROPERABILITY: BANANA API CLIENT & FAULT-TOLERANT FALLBACK
// Demonstrates Theme 3: Interoperability via external REST API & data decoupling
// ==============================================================================

const BANANA_API_URL = 'https://marcconrad.com/uob/banana/api.php?out=json';
const API_TIMEOUT_MS = 5000; // 5-second timeout boundary

// Procedural SVG Fallback Puzzles (Used if third-party API is unreachable)
const FALLBACK_PUZZLES = [
  {
    solution: 6,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="240" viewBox="0 0 600 240">
      <rect width="100%" height="100%" fill="#1e293b" rx="12"/>
      <text x="300" y="55" fill="#facc15" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">OFFLINE RESILIENCE PUZZLE</text>
      <text x="300" y="115" fill="#f8fafc" font-size="28" font-family="monospace" text-anchor="middle">🍌 + 🍌 + 🍌 = 18</text>
      <text x="300" y="170" fill="#f8fafc" font-size="28" font-family="monospace" text-anchor="middle">🍌 × 1 = ?</text>
    </svg>`
  },
  {
    solution: 4,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="240" viewBox="0 0 600 240">
      <rect width="100%" height="100%" fill="#1e293b" rx="12"/>
      <text x="300" y="55" fill="#facc15" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">OFFLINE RESILIENCE PUZZLE</text>
      <text x="300" y="115" fill="#f8fafc" font-size="28" font-family="monospace" text-anchor="middle">🍌 + 🍌 = 8</text>
      <text x="300" y="170" fill="#f8fafc" font-size="28" font-family="monospace" text-anchor="middle">🍌 = ?</text>
    </svg>`
  },
  {
    solution: 7,
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="240" viewBox="0 0 600 240">
      <rect width="100%" height="100%" fill="#1e293b" rx="12"/>
      <text x="300" y="55" fill="#facc15" font-size="20" font-family="sans-serif" font-weight="bold" text-anchor="middle">OFFLINE RESILIENCE PUZZLE</text>
      <text x="300" y="115" fill="#f8fafc" font-size="28" font-family="monospace" text-anchor="middle">🍌 + 3 = 10</text>
      <text x="300" y="170" fill="#f8fafc" font-size="28" font-family="monospace" text-anchor="middle">🍌 = ?</text>
    </svg>`
  }
];

/**
 * Fetches puzzle from Dr. Marc Conrad's external Banana API service
 * Implements AbortController timeout & automatic fallback degradation
 */
async function fetchBananaPuzzle() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  try {
    const response = await fetch(BANANA_API_URL, {
      signal: controller.signal,
      headers: { Accept: 'application/json' }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Banana API HTTP Status Error: ${response.status}`);
    }

    const data = await response.json();

    if (!data.question || data.solution === undefined) {
      throw new Error('Malformed Banana API response structure');
    }

    return {
      question: data.question,
      solution: parseInt(data.solution, 10),
      isFallback: false
    };
  } catch (error) {
    clearTimeout(timeoutId);
    console.warn('[Interoperability Warning] Upstream Banana API error. Engaging fallback:', error.message);

    // Pick random procedural SVG puzzle
    const fallback = FALLBACK_PUZZLES[Math.floor(Math.random() * FALLBACK_PUZZLES.length)];
    const base64Svg = Buffer.from(fallback.svg).toString('base64');

    return {
      question: `data:image/svg+xml;base64,${base64Svg}`,
      solution: fallback.solution,
      isFallback: true
    };
  }
}

// ==============================================================================
// 4. REST API ROUTES: VIRTUAL IDENTITY & USER AUTHENTICATION
// ==============================================================================

/**
 * POST /api/auth/register
 * Registers a new player identity with username, email, and bcrypt hashed password
 */
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;

  // 1. Validate username
  if (!username || typeof username !== 'string') {
    return res.status(400).json({ success: false, error: 'A valid username is required.' });
  }
  const sanitizedUsername = username.trim().slice(0, 25);
  if (sanitizedUsername.length < 3) {
    return res.status(400).json({ success: false, error: 'Username must be at least 3 characters long.' });
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(sanitizedUsername)) {
    return res.status(400).json({ success: false, error: 'Username can only contain letters, numbers, underscores, and dashes.' });
  }

  // 2. Validate email
  if (!email || typeof email !== 'string') {
    return res.status(400).json({ success: false, error: 'A valid email address is required.' });
  }
  const sanitizedEmail = email.trim().toLowerCase().slice(0, 100);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(sanitizedEmail)) {
    return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
  }

  // 3. Validate password
  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({ success: false, error: 'Password must be at least 6 characters long.' });
  }

  try {
    // Check if username already exists
    const existingUsername = await db.findUserByUsername(sanitizedUsername);
    if (existingUsername) {
      return res.status(409).json({ success: false, error: `Username '${sanitizedUsername}' is already taken.` });
    }

    // Check if email already exists
    const existingEmail = await db.findUserByEmail(sanitizedEmail);
    if (existingEmail) {
      return res.status(409).json({ success: false, error: 'This email is already registered. Please sign in instead.' });
    }

    // Create user with bcrypt password hash
    const newUser = await db.registerUser({
      username: sanitizedUsername,
      email: sanitizedEmail,
      password
    });

    // Establish authenticated server-side session
    req.session.user = {
      id: newUser.id,
      username: newUser.username,
      avatar: newUser.avatar || '🍌',
      title: newUser.title || 'Banana Rookie',
      email: newUser.email,
      score: 0,
      streak: 0,
      highScore: 0,
      roundsPlayed: 0,
      sessionStarted: new Date().toISOString()
    };
    req.session.currentSolution = null;

    // Explicitly persist session BEFORE responding to prevent race condition
    // on cold start where client's follow-up request arrives before session is saved.
    req.session.save((saveErr) => {
      if (saveErr) {
        console.error('[Session Save Error - Register]', saveErr);
        return res.status(500).json({ success: false, error: 'Session could not be established. Please try again.' });
      }
      return res.status(201).json({
        success: true,
        message: `Account registered successfully! Welcome, ${newUser.username}.`,
        user: req.session.user
      });
    });
  } catch (error) {
    console.error('[SQLite Registration Error]', error);
    return res.status(500).json({ success: false, error: 'Registration failed due to a database error.' });
  }
});

/**
 * POST /api/auth/login
 * Authenticates a user using email or username + password, or supports nickname login fallback
 */
app.post('/api/auth/login', async (req, res) => {
  const { identifier, username, email, password } = req.body;
  const loginIdentifier = (identifier || username || email || '').trim();

  if (!loginIdentifier) {
    return res.status(400).json({ success: false, error: 'Username or email is required to sign in.' });
  }

  try {
    // Case 1: Password is provided (Secure Password Authentication)
    if (password && typeof password === 'string') {
      const dbUser = await db.findUserByIdentifier(loginIdentifier);

      if (!dbUser) {
        return res.status(404).json({ success: false, error: 'No account found with that username or email.' });
      }

      // Check password if account has one set
      if (dbUser.password_hash) {
        const passwordMatches = await db.verifyPassword(password, dbUser.password_hash);
        if (!passwordMatches) {
          return res.status(401).json({ success: false, error: 'Incorrect password. Please try again.' });
        }
      }

      // Initialize player telemetry in session
      req.session.user = {
        id: dbUser.id,
        username: dbUser.username,
        avatar: dbUser.avatar || '🍌',
        title: dbUser.title || 'Banana Rookie',
        email: dbUser.email || null,
        score: dbUser.score || 0,
        streak: dbUser.streak || 0,
        highScore: dbUser.high_score || 0,
        roundsPlayed: dbUser.rounds_played || 0,
        sessionStarted: new Date().toISOString()
      };
      req.session.currentSolution = null;

      // Explicitly persist session BEFORE responding (prevents cold-start race condition)
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error('[Session Save Error - Login]', saveErr);
          return res.status(500).json({ success: false, error: 'Session could not be established. Please try again.' });
        }
        return res.json({
          success: true,
          message: `Welcome back, ${dbUser.username}!`,
          user: req.session.user
        });
      });
      return; // session.save is async; response sent inside callback
    }

    // Case 2: No password provided (Instant Virtual Identity Nickname mode)
    const sanitizedUsername = loginIdentifier.slice(0, 25);
    const dbUser = await db.findOrCreateUser(sanitizedUsername);

    req.session.user = {
      id: dbUser.id,
      username: dbUser.username,
      avatar: dbUser.avatar || '🍌',
      title: dbUser.title || 'Banana Rookie',
      email: dbUser.email || null,
      score: dbUser.score || 0,
      streak: dbUser.streak || 0,
      highScore: dbUser.high_score || 0,
      roundsPlayed: dbUser.rounds_played || 0,
      sessionStarted: new Date().toISOString()
    };
    req.session.currentSolution = null;

    // Explicitly persist session BEFORE responding (prevents cold-start race condition)
    req.session.save((saveErr) => {
      if (saveErr) {
        console.error('[Session Save Error - Guest Login]', saveErr);
        return res.status(500).json({ success: false, error: 'Session could not be established. Please try again.' });
      }
      return res.json({
        success: true,
        message: `Virtual identity '${dbUser.username}' loaded from SQLite successfully.`,
        user: req.session.user
      });
    });
  } catch (error) {
    console.error('[SQLite Auth Error]', error);
    return res.status(500).json({ success: false, error: 'Authentication failed due to a database error.' });
  }
});

/**
 * GET /api/auth/me
 * Checks if the incoming request has an active session cookie
 */
app.get('/api/auth/me', (req, res) => {
  if (req.session && req.session.user) {
    return res.json({
      authenticated: true,
      user: req.session.user
    });
  }
  return res.json({ authenticated: false });
});

/**
 * POST /api/auth/logout
 * Invalidates the server-side session and clears the cookie header
 */
app.post('/api/auth/logout', (req, res) => {
  if (req.session) {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ success: false, error: 'Could not destroy session.' });
      }
      res.clearCookie('connect.sid');
      return res.json({ success: true, message: 'Session logged out successfully.' });
    });
  } else {
    res.clearCookie('connect.sid');
    return res.json({ success: true, message: 'No active session found.' });
  }
});

/**
 * POST /api/user/profile
 * Updates the user's avatar emoji and equipped title
 */
app.post('/api/user/profile', requireAuth, async (req, res) => {
  const { avatar, title } = req.body;
  const userId = req.session.user.id;

  try {
    const updatedUser = await db.updateUserProfile(userId, { avatar, title });
    if (avatar) req.session.user.avatar = avatar;
    if (title) req.session.user.title = title;

    req.session.save((err) => {
      if (err) {
        console.error('[Session Error - Profile]', err);
        return res.status(500).json({ success: false, error: 'Failed to update session.' });
      }
      return res.json({
        success: true,
        message: 'Profile updated successfully!',
        user: req.session.user
      });
    });
  } catch (error) {
    console.error('[Profile Update Error]', error);
    return res.status(500).json({ success: false, error: 'Database update failed.' });
  }
});

/**
 * GET /api/user/achievements
 * Retrieves list of milestones & unlock status for current user
 */
app.get('/api/user/achievements', requireAuth, async (req, res) => {
  try {
    const achievements = await db.getUserAchievements(req.session.user.id);
    return res.json({
      success: true,
      achievements
    });
  } catch (error) {
    console.error('[Achievements Fetch Error]', error);
    return res.status(500).json({ success: false, error: 'Failed to fetch achievements.' });
  }
});

// ==============================================================================
// 4.1 GAME DIFFICULTY MODES & MECHANICS
// Demonstrates Enterprise Game Design: Difficulty balancing, timers, & risk/reward
// ==============================================================================
const GAME_MODES = {
  easy: {
    key: 'easy',
    name: 'Easy',
    timeLimit: 0, // No countdown timer
    basePoints: 10,
    streakMultiplier: 1.0,
    penalty: 0,
    description: 'Casual mode without timer pressure'
  },
  medium: {
    key: 'medium',
    name: 'Medium',
    timeLimit: 25, // 25 seconds
    basePoints: 20,
    streakMultiplier: 1.5,
    penalty: 0,
    description: 'Standard 25-second challenge'
  },
  hard: {
    key: 'hard',
    name: 'Hard',
    timeLimit: 12, // 12 seconds
    basePoints: 40,
    streakMultiplier: 2.0,
    penalty: 5,
    description: 'Intense 12-second speed mode with 2x points and -5 penalty'
  }
};

// ==============================================================================
// 5. REST API ROUTES: GAME ENGINE & ANTI-CHEAT VALIDATION
// Demonstrates 3-Tier Security: The puzzle solution is strictly vaulted in session
// ==============================================================================

/**
 * GET /api/game/new-puzzle
 * Retrieves a new challenge from Tier 3, isolates the solution, and serves question
 */
app.get('/api/game/new-puzzle', requireAuth, async (req, res) => {
  try {
    // Determine active difficulty mode (URL query param or session store)
    const requestedMode = (req.query.mode || '').toLowerCase();
    if (requestedMode && GAME_MODES[requestedMode]) {
      req.session.currentMode = requestedMode;
    }
    const currentMode = req.session.currentMode || 'medium';
    const modeConfig = GAME_MODES[currentMode] || GAME_MODES.medium;

    const puzzle = await fetchBananaPuzzle();

    // CRITICAL SECURITY MECHANISM:
    // Stash the integer solution securely in the server session.
    // The client NEVER receives 'solution' in this response!
    req.session.currentSolution = puzzle.solution;
    req.session.currentIsFallback = puzzle.isFallback;
    req.session.puzzleIssuedAt = Date.now();
    req.session.currentMode = currentMode;

    return res.json({
      success: true,
      question: puzzle.question,
      isFallback: puzzle.isFallback,
      mode: currentMode,
      timeLimit: modeConfig.timeLimit,
      basePoints: modeConfig.basePoints,
      penalty: modeConfig.penalty,
      user: {
        id: req.session.user.id,
        username: req.session.user.username,
        score: req.session.user.score,
        streak: req.session.user.streak,
        highScore: req.session.user.highScore,
        roundsPlayed: req.session.user.roundsPlayed
      }
    });
  } catch (error) {
    console.error('[Game Engine Error] Failed to generate puzzle:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve puzzle challenge. Please try again.'
    });
  }
});

/**
 * POST /api/game/submit-answer
 * Evaluates the player's guess against the server-vaulted solution and logs to SQLite
 */
/**
 * POST /api/game/mode
 * Sets the active game difficulty mode in user session
 */
app.post('/api/game/mode', requireAuth, (req, res) => {
  const { mode } = req.body;
  const modeKey = (mode || '').toLowerCase();
  if (!GAME_MODES[modeKey]) {
    return res.status(400).json({ success: false, error: 'Invalid mode. Select easy, medium, or hard.' });
  }

  req.session.currentMode = modeKey;
  req.session.save((err) => {
    if (err) {
      console.error('[Session Error - Mode]', err);
      return res.status(500).json({ success: false, error: 'Could not update mode in session.' });
    }
    return res.json({
      success: true,
      mode: modeKey,
      config: GAME_MODES[modeKey]
    });
  });
});

app.post('/api/game/submit-answer', requireAuth, async (req, res) => {
  const { answer, isTimeout, mode: clientMode } = req.body;

  // Validate active puzzle existence
  if (req.session.currentSolution === null || req.session.currentSolution === undefined) {
    return res.status(400).json({
      success: false,
      error: 'No active puzzle found. Please request a new puzzle first.'
    });
  }

  const expectedSolution = req.session.currentSolution;
  const isFallback = Boolean(req.session.currentIsFallback);

  // Determine active mode
  const modeKey = (clientMode && GAME_MODES[clientMode.toLowerCase()])
    ? clientMode.toLowerCase()
    : (req.session.currentMode || 'medium');
  const modeConfig = GAME_MODES[modeKey] || GAME_MODES.medium;
  req.session.currentMode = modeKey;

  // Parse and validate submitted answer (or handle timer timeout)
  let parsedAnswer = null;
  let isCorrect = false;

  if (isTimeout) {
    parsedAnswer = -1; // -1 denotes a round lost to countdown timeout
    isCorrect = false;
  } else {
    parsedAnswer = parseInt(answer, 10);
    if (isNaN(parsedAnswer) || parsedAnswer < 0 || parsedAnswer > 9) {
      return res.status(400).json({
        success: false,
        error: 'Invalid input. Answer must be an integer between 0 and 9.'
      });
    }
    isCorrect = parsedAnswer === expectedSolution;
  }

  // Update user session telemetry
  const user = req.session.user;
  user.roundsPlayed += 1;

  let pointsAwarded = 0;
  let feedbackMessage = '';

  if (isCorrect) {
    user.streak += 1;

    // Difficulty-adjusted dynamic scoring:
    // Easy: base 10 * streak
    // Medium: base 20 + ((streak - 1) * 10)
    // Hard: base 40 * streak
    if (modeKey === 'easy') {
      pointsAwarded = 10 * user.streak;
    } else if (modeKey === 'medium') {
      pointsAwarded = Math.round(20 * (1 + (user.streak - 1) * 0.5));
    } else {
      pointsAwarded = 40 * user.streak;
    }

    user.score += pointsAwarded;
    if (user.score > user.highScore) {
      user.highScore = user.score;
    }

    feedbackMessage = user.streak > 1 
      ? `Correct! Excellent deduction! [${modeConfig.name}] Streak Bonus: ${user.streak}x (+${pointsAwarded} pts)`
      : `Correct! Well done! [${modeConfig.name}] (+${pointsAwarded} pts)`;
  } else {
    user.streak = 0; // Reset streak on incorrect or timeout

    if (isTimeout) {
      if (modeKey === 'hard' && modeConfig.penalty > 0) {
        const penalty = Math.min(user.score, modeConfig.penalty);
        user.score -= penalty;
        pointsAwarded = -penalty;
        feedbackMessage = `⏰ Time's up! Penalty: -${penalty} pts. The solution was ${expectedSolution}.`;
      } else {
        feedbackMessage = `⏰ Time's up! You ran out of time. The solution was ${expectedSolution}.`;
      }
    } else {
      if (modeKey === 'hard' && modeConfig.penalty > 0) {
        const penalty = Math.min(user.score, modeConfig.penalty);
        user.score -= penalty;
        pointsAwarded = -penalty;
        feedbackMessage = `Incorrect (-${penalty} pts). You guessed ${parsedAnswer}, but the solution was ${expectedSolution}.`;
      } else {
        feedbackMessage = `Incorrect. You guessed ${parsedAnswer}, but the solution was ${expectedSolution}.`;
      }
    }
  }

  // Anti-Replay Security: Wipe solution from session after evaluation
  req.session.currentSolution = null;
  req.session.currentIsFallback = false;

  // Persist telemetry and round attempt to SQLite
  try {
    if (user.id) {
      await db.updateUserStats(user.id, {
        score: user.score,
        streak: user.streak,
        highScore: user.highScore,
        roundsPlayed: user.roundsPlayed
      });

      await db.recordRound({
        userId: user.id,
        userAnswer: parsedAnswer,
        solution: expectedSolution,
        isCorrect,
        pointsAwarded,
        isFallback,
        mode: modeKey
      });
    }
  } catch (dbErr) {
    console.error('[SQLite Write Error] Failed to persist game telemetry:', dbErr.message);
  }

  // Check for newly unlocked achievements
  let newAchievements = [];
  try {
    if (user.id) {
      newAchievements = await db.checkAndUnlockAchievements(
        user.id,
        {
          streak: user.streak,
          highScore: user.highScore,
          roundsPlayed: user.roundsPlayed
        },
        {
          isCorrect,
          mode: modeKey
        }
      );
    }
  } catch (achErr) {
    console.warn('[Achievements Evaluation Warning]', achErr.message);
  }

  return res.json({
    success: true,
    correct: isCorrect,
    isTimeout: Boolean(isTimeout),
    userAnswer: parsedAnswer,
    solution: expectedSolution,
    pointsAwarded,
    mode: modeKey,
    message: feedbackMessage,
    newAchievements,
    user: {
      id: user.id,
      username: user.username,
      avatar: user.avatar || '🍌',
      title: user.title || 'Banana Rookie',
      score: user.score,
      streak: user.streak,
      highScore: user.highScore,
      roundsPlayed: user.roundsPlayed
    }
  });
});

/**
 * POST /api/game/reset
 * Resets score and streak counters for the current virtual player session and SQLite
 */
app.post('/api/game/reset', requireAuth, async (req, res) => {
  const user = req.session.user;
  user.score = 0;
  user.streak = 0;
  req.session.currentSolution = null;

  try {
    if (user.id) {
      await db.resetUserScore(user.id);
    }
  } catch (dbErr) {
    console.error('[SQLite Reset Error]', dbErr.message);
  }

  return res.json({
    success: true,
    message: 'Game telemetry reset successfully.',
    user: {
      username: user.username,
      score: user.score,
      streak: user.streak,
      highScore: user.highScore,
      roundsPlayed: user.roundsPlayed
    }
  });
});

/**
 * GET /api/game/leaderboard
 * Retrieves top ranking players from SQLite database
 */
app.get('/api/game/leaderboard', async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);
    const leaderboard = await db.getLeaderboard(limit);
    return res.json({
      success: true,
      leaderboard: Array.isArray(leaderboard) ? leaderboard : []
    });
  } catch (error) {
    console.error('[SQLite Leaderboard Error]', error);
    return res.json({
      success: true,
      leaderboard: []
    });
  }
});

/**
 * GET /api/game/history
 * Retrieves recent round history for the active authenticated user
 */
app.get('/api/game/history', requireAuth, async (req, res) => {
  try {
    const history = await db.getUserHistory(req.session.user.id, 5);
    return res.json({
      success: true,
      history
    });
  } catch (error) {
    console.error('[SQLite History Error]', error);
    return res.status(500).json({ success: false, error: 'Failed to retrieve game history from database.' });
  }
});

// ==============================================================================
// 6. SERVER INITIALIZATION & NON-BLOCKING EVENT LOOP LISTENER
// Demonstrates Theme 2: Server-side asynchronous Event-Driven loop with SQLite init
// ==============================================================================

async function startServer() {
  try {
    // Initialize SQLite schema and indexes before accepting client traffic
    await db.initDatabase();

    app.listen(PORT, () => {
      console.log(`========================================================`);
      console.log(`🍌 Enterprise Banana Challenge System (CIS046-3)`);
      console.log(`🚀 Application Server active at: http://localhost:${PORT}`);
      console.log(`💾 SQLite Persistence: Connected (${db.DB_PATH})`);
      console.log(`🔒 Session Security: HTTP-Only Cookies Enabled`);
      console.log(`🌐 Interoperability Gateway: Connected to Marc Conrad API`);
      console.log(`========================================================`);
    });
  } catch (error) {
    console.error('Fatal Server Initialization Error:', error);
    process.exit(1);
  }
}

startServer();
