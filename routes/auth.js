/**
 * ==============================================================================
 * CIS046-3 Software For Enterprise — Assignment 1: Banana Challenge Enterprise System
 * ==============================================================================
 * THEME 4: VIRTUAL IDENTITY & AUTHENTICATION ROUTER
 *
 * REST Endpoints:
 * - POST /api/auth/register  : Creates persistent account with bcrypt password hashing
 * - POST /api/auth/login     : Password authentication or instant virtual nickname login
 * - GET  /api/auth/me        : Restores active session identity across stateless HTTP
 * - POST /api/auth/logout    : Secure session invalidation and cookie clearing
 * ==============================================================================
 */

const express = require('express');
const router = express.Router();
const db = require('../database');

/**
 * POST /api/auth/register
 * Registers a new player identity with username, email, and bcrypt hashed password
 */
router.post('/register', async (req, res) => {
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
    // Check if email already exists
    const existingEmail = await db.findUserByEmail(sanitizedEmail);
    if (existingEmail) {
      return res.status(409).json({ success: false, error: 'This email is already registered. Please sign in instead.' });
    }

    // Check if username already exists
    const existingUsername = await db.findUserByUsername(sanitizedUsername);
    let userRecord = null;

    if (existingUsername) {
      // If the account already has a password, reject
      if (existingUsername.password_hash) {
        return res.status(409).json({ success: false, error: `Username '${sanitizedUsername}' is already taken. Please sign in instead.` });
      }
      // If the account only existed as an unauthenticated guest/nickname, upgrade it!
      userRecord = await db.upgradeUserAccount(existingUsername.id, {
        email: sanitizedEmail,
        password
      });
    } else {
      // Create new user with bcrypt password hash
      userRecord = await db.registerUser({
        username: sanitizedUsername,
        email: sanitizedEmail,
        password
      });
    }

    // Establish authenticated server-side session
    req.session.user = {
      id: userRecord.id,
      username: userRecord.username,
      avatar: userRecord.avatar || '🍌',
      title: userRecord.title || 'Banana Rookie',
      email: userRecord.email,
      score: userRecord.score || 0,
      streak: userRecord.streak || 0,
      highScore: userRecord.high_score || 0,
      roundsPlayed: userRecord.rounds_played || 0,
      sessionStarted: new Date().toISOString()
    };
    req.session.currentSolution = null;

    // Explicitly persist session BEFORE responding to prevent race condition
    req.session.save((saveErr) => {
      if (saveErr) {
        console.error('[Session Save Error - Register]', saveErr);
        return res.status(500).json({ success: false, error: 'Session could not be established. Please try again.' });
      }
      return res.status(201).json({
        success: true,
        message: `Account registered successfully! Welcome, ${userRecord.username}.`,
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
router.post('/login', async (req, res) => {
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

      // Explicitly persist session BEFORE responding
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
      return;
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

    // Explicitly persist session BEFORE responding
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
router.get('/me', (req, res) => {
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
router.post('/logout', (req, res) => {
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

module.exports = router;

