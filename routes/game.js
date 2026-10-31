/**
 * ==============================================================================
 * CIS046-3 Software For Enterprise — Assignment 1: Banana Challenge Enterprise System
 * ==============================================================================
 * THEME 1, 2 & 3: GAME ENGINE & ANTI-CHEAT VALIDATION ROUTER
 *
 * REST Endpoints:
 * - GET  /api/game/new-puzzle    : Fetches puzzle from Tier 3, vaults solution in session
 * - POST /api/game/mode          : Switches active game difficulty mode
 * - POST /api/game/submit-answer : Evaluates answer against session-vaulted solution
 * - POST /api/game/reset         : Resets score & streak telemetry
 * - GET  /api/game/leaderboard   : Retrieves top global rankings from SQLite
 * - GET  /api/game/history       : Retrieves recent round telemetry for active player
 *
 * 3-Tier Security Feature:
 * The puzzle solution is strictly vaulted on Tier 2 in the HTTP session.
 * The client browser (Tier 1) NEVER receives the correct answer before submission.
 * ==============================================================================
 */

const express = require('express');
const router = express.Router();
const db = require('../database');
const { requireAuth } = require('../middleware/auth');
const { fetchBananaPuzzle } = require('../services/bananaApi');

// ==============================================================================
// GAME DIFFICULTY MODES & MECHANICS
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

/**
 * GET /api/game/new-puzzle
 * Retrieves a new challenge from Tier 3 (Banana API / procedural fallback),
 * isolates the integer solution in session, and serves only the puzzle question.
 */
router.get('/new-puzzle', requireAuth, async (req, res) => {
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

    req.session.save((saveErr) => {
      if (saveErr) {
        console.error('[Session Save Error - New Puzzle]', saveErr);
        return res.status(500).json({ success: false, error: 'Failed to initialize puzzle session.' });
      }
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
          avatar: req.session.user.avatar || '🍌',
          title: req.session.user.title || 'Banana Rookie',
          score: req.session.user.score,
          streak: req.session.user.streak,
          highScore: req.session.user.highScore,
          roundsPlayed: req.session.user.roundsPlayed
        }
      });
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
 * POST /api/game/mode
 * Sets the active game difficulty mode in user session
 */
router.post('/mode', requireAuth, (req, res) => {
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

/**
 * POST /api/game/submit-answer
 * Evaluates the player's guess against the server-vaulted solution and logs to SQLite
 */
router.post('/submit-answer', requireAuth, async (req, res) => {
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
    // Medium: base 20 * (1 + (streak - 1) * 0.5)
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

  req.session.save((saveErr) => {
    if (saveErr) {
      console.error('[Session Save Error - Submit Answer]', saveErr);
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
        high_score: user.highScore,
        roundsPlayed: user.roundsPlayed,
        rounds_played: user.roundsPlayed
      }
    });
  });
});

/**
 * POST /api/game/reset
 * Resets score and streak counters for the current virtual player session and SQLite
 */
router.post('/reset', requireAuth, async (req, res) => {
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

  req.session.save((saveErr) => {
    if (saveErr) {
      console.error('[Session Save Error - Reset]', saveErr);
    }
    return res.json({
      success: true,
      message: 'Game telemetry reset successfully.',
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar || '🍌',
        title: user.title || 'Banana Rookie',
        score: user.score,
        streak: user.streak,
        highScore: user.highScore,
        high_score: user.highScore,
        roundsPlayed: user.roundsPlayed,
        rounds_played: user.roundsPlayed
      }
    });
  });
});

/**
 * GET /api/game/leaderboard
 * Retrieves top ranking players from SQLite database
 */
router.get('/leaderboard', async (req, res) => {
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
router.get('/history', requireAuth, async (req, res) => {
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

module.exports = router;

