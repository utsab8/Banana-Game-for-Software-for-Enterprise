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
// 4. REST API ROUTES: VIRTUAL IDENTITY MANAGEMENT
// ==============================================================================

/**
 * POST /api/auth/login
 * Creates a new virtual identity session bound to a chosen nickname
 */
app.post('/api/auth/login', (req, res) => {
  const rawUsername = req.body.username;

  if (!rawUsername || typeof rawUsername !== 'string') {
    return res.status(400).json({ success: false, error: 'A valid username is required.' });
  }

  const sanitizedUsername = rawUsername.trim().slice(0, 25);

  if (sanitizedUsername.length === 0) {
    return res.status(400).json({ success: false, error: 'Username cannot be blank.' });
  }

  // Initialize player telemetry inside server-side session
  req.session.user = {
    username: sanitizedUsername,
    score: 0,
    streak: 0,
    highScore: 0,
    roundsPlayed: 0,
    sessionStarted: new Date().toISOString()
  };

  req.session.currentSolution = null;

  return res.json({
    success: true,
    message: `Virtual identity '${sanitizedUsername}' initialized successfully.`,
    user: req.session.user
  });
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
    const puzzle = await fetchBananaPuzzle();

    // CRITICAL SECURITY MECHANISM:
    // Stash the integer solution securely in the server session.
    // The client NEVER receives 'solution' in this response!
    req.session.currentSolution = puzzle.solution;
    req.session.puzzleIssuedAt = Date.now();

    return res.json({
      success: true,
      question: puzzle.question,
      isFallback: puzzle.isFallback,
      user: {
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
 * Evaluates the player's guess against the server-vaulted solution
 */
app.post('/api/game/submit-answer', requireAuth, (req, res) => {
  const { answer } = req.body;

  // Validate active puzzle existence
  if (req.session.currentSolution === null || req.session.currentSolution === undefined) {
    return res.status(400).json({
      success: false,
      error: 'No active puzzle found. Please request a new puzzle first.'
    });
  }

  // Parse and validate submitted answer (must be single digit integer 0-9)
  const parsedAnswer = parseInt(answer, 10);
  if (isNaN(parsedAnswer) || parsedAnswer < 0 || parsedAnswer > 9) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input. Answer must be an integer between 0 and 9.'
    });
  }

  const expectedSolution = req.session.currentSolution;
  const isCorrect = parsedAnswer === expectedSolution;

  // Update user session telemetry
  const user = req.session.user;
  user.roundsPlayed += 1;

  let pointsAwarded = 0;
  let feedbackMessage = '';

  if (isCorrect) {
    user.streak += 1;
    pointsAwarded = 10 * user.streak; // Streak multiplier bonus
    user.score += pointsAwarded;
    if (user.score > user.highScore) {
      user.highScore = user.score;
    }
    feedbackMessage = user.streak > 1 
      ? `Correct! Excellent deduction! Streak Bonus: ${user.streak}x (+${pointsAwarded} pts)`
      : `Correct! Well done! (+${pointsAwarded} pts)`;
  } else {
    user.streak = 0; // Reset streak on incorrect answer
    feedbackMessage = `Incorrect. You guessed ${parsedAnswer}, but the solution was ${expectedSolution}.`;
  }

  // Anti-Replay Security: Wipe solution from session after evaluation
  req.session.currentSolution = null;

  return res.json({
    success: true,
    correct: isCorrect,
    userAnswer: parsedAnswer,
    solution: expectedSolution,
    pointsAwarded,
    message: feedbackMessage,
    user: {
      score: user.score,
      streak: user.streak,
      highScore: user.highScore,
      roundsPlayed: user.roundsPlayed
    }
  });
});

/**
 * POST /api/game/reset
 * Resets score and streak counters for the current virtual player session
 */
app.post('/api/game/reset', requireAuth, (req, res) => {
  const user = req.session.user;
  user.score = 0;
  user.streak = 0;
  req.session.currentSolution = null;

  return res.json({
    success: true,
    message: 'Game telemetry reset successfully.',
    user: {
      score: user.score,
      streak: user.streak,
      highScore: user.highScore,
      roundsPlayed: user.roundsPlayed
    }
  });
});

// ==============================================================================
// 6. SERVER INITIALIZATION & NON-BLOCKING EVENT LOOP LISTENER
// Demonstrates Theme 2: Server-side asynchronous Event-Driven loop
// ==============================================================================

app.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`🍌 Enterprise Banana Challenge System (CIS046-3)`);
  console.log(`🚀 Application Server active at: http://localhost:${PORT}`);
  console.log(`🔒 Session Security: HTTP-Only Cookies Enabled`);
  console.log(`🌐 Interoperability Gateway: Connected to Marc Conrad API`);
  console.log(`========================================================`);
});
