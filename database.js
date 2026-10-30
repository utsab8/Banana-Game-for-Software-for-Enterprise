/**
 * ==============================================================================
 * CIS046-3 Software For Enterprise — Assignment 1: Banana Challenge Enterprise System
 * ==============================================================================
 * SQLite Database Persistence Layer
 *
 * Provides relational persistence for:
 * 1. Virtual Identities / Player Profiles (users table)
 * 2. Immutable Game Telemetry & Audit Logs (game_history table)
 * 3. High Score Leaderboards
 * ==============================================================================
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');

const DATA_DIR = path.join(__dirname, 'data');
const DB_PATH = process.env.SQLITE_DB_PATH || path.join(DATA_DIR, 'banana_game.sqlite');

let db = null;

/**
 * Promisified database run helper
 */
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('SQLite database is not initialized. Call initDatabase() first.'));
    db.run(sql, params, function (err) {
      if (err) return reject(err);
      resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

/**
 * Promisified database get helper (single row)
 */
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('SQLite database is not initialized. Call initDatabase() first.'));
    db.get(sql, params, (err, row) => {
      if (err) return reject(err);
      resolve(row);
    });
  });
}

/**
 * Promisified database all helper (multiple rows)
 */
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('SQLite database is not initialized. Call initDatabase() first.'));
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

/**
 * Initialize SQLite database connection, tables, and indexes
 */
async function initDatabase() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, async (err) => {
      if (err) {
        console.error('[SQLite] Failed to connect to database:', err.message);
        return reject(err);
      }

      console.log(`[SQLite] Connected to database file: ${DB_PATH}`);

      try {
        // Enable WAL mode for better concurrency and foreign keys
        await run('PRAGMA journal_mode = WAL;');
        await run('PRAGMA foreign_keys = ON;');

        // 1. Users table (Virtual Identity & Authenticated Account persistent store)
        await run(`
          CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL COLLATE NOCASE,
            email TEXT UNIQUE COLLATE NOCASE,
            password_hash TEXT,
            score INTEGER DEFAULT 0,
            streak INTEGER DEFAULT 0,
            high_score INTEGER DEFAULT 0,
            rounds_played INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            last_active_at DATETIME DEFAULT CURRENT_TIMESTAMP
          );
        `);

        // Migration check for existing SQLite databases
        const userCols = await all('PRAGMA table_info(users);');
        const colNames = userCols.map(c => c.name);
        if (!colNames.includes('email')) {
          await run('ALTER TABLE users ADD COLUMN email TEXT;');
        }
        if (!colNames.includes('password_hash')) {
          await run('ALTER TABLE users ADD COLUMN password_hash TEXT;');
        }
        if (!colNames.includes('avatar')) {
          await run("ALTER TABLE users ADD COLUMN avatar TEXT DEFAULT '🍌';");
        }
        if (!colNames.includes('title')) {
          await run("ALTER TABLE users ADD COLUMN title TEXT DEFAULT 'Banana Rookie';");
        }

        // 3. User achievements table (Virtual Identity milestones & trophies)
        await run(`
          CREATE TABLE IF NOT EXISTS user_achievements (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            achievement_key TEXT NOT NULL,
            unlocked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, achievement_key),
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          );
        `);

        await run(`
          CREATE INDEX IF NOT EXISTS idx_user_achievements_user 
          ON user_achievements (user_id);
        `);

        // Unique index for email (allowing nulls for guest or legacy records)
        await run(`
          CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email 
          ON users (email) WHERE email IS NOT NULL;
        `);

        // Index for rapid leaderboard sorting
        await run(`
          CREATE INDEX IF NOT EXISTS idx_users_high_score 
          ON users (high_score DESC);
        `);

        // 2. Game round audit log (Telemetry & event history)
        await run(`
          CREATE TABLE IF NOT EXISTS game_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            user_answer INTEGER NOT NULL,
            solution INTEGER NOT NULL,
            is_correct INTEGER NOT NULL,
            points_awarded INTEGER NOT NULL,
            is_fallback INTEGER NOT NULL DEFAULT 0,
            mode TEXT DEFAULT 'medium',
            played_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
          );
        `);

        // Index for fast query of user attempts
        await run(`
          CREATE INDEX IF NOT EXISTS idx_game_history_user 
          ON game_history (user_id, played_at DESC);
        `);

        // Migration check: ensure mode column exists in game_history
        const historyCols = await all('PRAGMA table_info(game_history);');
        const historyColNames = historyCols.map(c => c.name);
        if (!historyColNames.includes('mode')) {
          await run("ALTER TABLE game_history ADD COLUMN mode TEXT DEFAULT 'medium';");
        }

        console.log('[SQLite] Schema and indexes initialized successfully.');
        resolve();
      } catch (schemaErr) {
        console.error('[SQLite] Error during schema initialization:', schemaErr);
        reject(schemaErr);
      }
    });
  });
}

/**
 * Register a new user with username, email, and hashed password
 * @param {object} param0 
 */
async function registerUser({ username, email, password }) {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const result = await run(
    `INSERT INTO users (username, email, password_hash, score, streak, high_score, rounds_played) 
     VALUES (?, ?, ?, 0, 0, 0, 0)`,
    [username, email, passwordHash]
  );

  return await get(
    `SELECT id, username, email, score, streak, high_score, rounds_played, created_at, last_active_at 
     FROM users WHERE id = ?`, 
    [result.lastID]
  );
}

/**
 * Upgrade an existing unauthenticated guest/nickname account to a full password-protected account
 * Preserves existing score, streak, high score, rounds played, avatar, and achievements
 * @param {number} userId 
 * @param {object} param1 
 */
async function upgradeUserAccount(userId, { email, password }) {
  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  await run(
    `UPDATE users 
     SET email = ?, password_hash = ?, last_active_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [email, passwordHash, userId]
  );

  return await getUserById(userId);
}

/**
 * Find user by email or username
 * @param {string} identifier 
 */
async function findUserByIdentifier(identifier) {
  return await get(
    'SELECT * FROM users WHERE username = ? COLLATE NOCASE OR email = ? COLLATE NOCASE',
    [identifier, identifier]
  );
}

/**
 * Find user by email
 * @param {string} email 
 */
async function findUserByEmail(email) {
  return await get('SELECT * FROM users WHERE email = ? COLLATE NOCASE', [email]);
}

/**
 * Find user by username
 * @param {string} username 
 */
async function findUserByUsername(username) {
  return await get('SELECT * FROM users WHERE username = ? COLLATE NOCASE', [username]);
}

/**
 * Verify plaintext password against stored bcrypt hash
 * @param {string} plainPassword 
 * @param {string} passwordHash 
 */
async function verifyPassword(plainPassword, passwordHash) {
  if (!passwordHash) return false;
  return await bcrypt.compare(plainPassword, passwordHash);
}

/**
 * Retrieve an existing user or insert a new record by username (Virtual Identity fallback)
 * @param {string} username 
 */
async function findOrCreateUser(username) {
  const existing = await get('SELECT * FROM users WHERE username = ?', [username]);
  if (existing) {
    // Update last_active_at timestamp
    await run(
      'UPDATE users SET last_active_at = CURRENT_TIMESTAMP WHERE id = ?',
      [existing.id]
    );
    return existing;
  }

  const result = await run(
    'INSERT INTO users (username, score, streak, high_score, rounds_played) VALUES (?, 0, 0, 0, 0)',
    [username]
  );

  return await get('SELECT * FROM users WHERE id = ?', [result.lastID]);
}

/**
 * Fetch a user profile by ID
 * @param {number} userId 
 */
async function getUserById(userId) {
  return await get('SELECT * FROM users WHERE id = ?', [userId]);
}

/**
 * Persist updated game telemetry for a user
 * @param {number} userId 
 * @param {object} stats 
 */
async function updateUserStats(userId, { score, streak, highScore, roundsPlayed }) {
  await run(
    `UPDATE users 
     SET score = ?, 
         streak = ?, 
         high_score = MAX(high_score, ?), 
         rounds_played = ?,
         last_active_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [score, streak, highScore, roundsPlayed, userId]
  );

  return await getUserById(userId);
}

/**
 * Reset active score and streak counters for a user (preserves high score)
 * @param {number} userId 
 */
async function resetUserScore(userId) {
  await run(
    `UPDATE users 
     SET score = 0, 
         streak = 0, 
         last_active_at = CURRENT_TIMESTAMP 
     WHERE id = ?`,
    [userId]
  );

  return await getUserById(userId);
}

/**
 * Log a completed puzzle round attempt into game_history
 * @param {object} roundData 
 */
async function recordRound({ userId, userAnswer, solution, isCorrect, pointsAwarded, isFallback, mode = 'medium' }) {
  const result = await run(
    `INSERT INTO game_history 
     (user_id, user_answer, solution, is_correct, points_awarded, is_fallback, mode) 
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      userId,
      userAnswer,
      solution,
      isCorrect ? 1 : 0,
      pointsAwarded,
      isFallback ? 1 : 0,
      mode || 'medium'
    ]
  );

  return result.lastID;
}

/**
 * Fetch top players sorted by high score (Leaderboard)
 * @param {number} limit 
 */
async function getLeaderboard(limit = 10) {
  try {
    const rows = await all(
      `SELECT id, username, avatar, title, score, high_score, streak, rounds_played, last_active_at 
       FROM users 
       WHERE high_score > 0 OR rounds_played > 0
       ORDER BY high_score DESC, rounds_played ASC 
       LIMIT ?`,
      [limit]
    );
    return rows.map(r => ({
      ...r,
      avatar: r.avatar || '🍌',
      title: r.title || 'Banana Rookie'
    }));
  } catch (queryErr) {
    console.warn('[SQLite Leaderboard Warning] Retrying without avatar/title:', queryErr.message);
    try {
      const fallbackRows = await all(
        `SELECT id, username, score, high_score, streak, rounds_played, last_active_at 
         FROM users 
         WHERE high_score > 0 OR rounds_played > 0
         ORDER BY high_score DESC, rounds_played ASC 
         LIMIT ?`,
        [limit]
      );
      return fallbackRows.map(r => ({
        ...r,
        avatar: '🍌',
        title: 'Banana Rookie'
      }));
    } catch (fallbackErr) {
      console.error('[SQLite Leaderboard Fatal Error]', fallbackErr.message);
      return [];
    }
  }
}

/**
 * Fetch recent rounds played by a specific user
 * @param {number} userId 
 * @param {number} limit 
 */
async function getUserHistory(userId, limit = 8) {
  return await all(
    `SELECT id, user_answer, solution, is_correct, points_awarded, is_fallback, mode, played_at 
     FROM game_history 
     WHERE user_id = ? 
     ORDER BY played_at DESC 
     LIMIT ?`,
    [userId, limit]
  );
}


/**
 * Global achievements definitions
 */
const ACHIEVEMENTS_CATALOG = [
  {
    key: 'first_bite',
    name: 'First Bite',
    icon: '🍌',
    category: 'Milestone',
    description: 'Solve your very first math puzzle correctly.'
  },
  {
    key: 'streak_3',
    name: 'Sharp Deduction',
    icon: '🎯',
    category: 'Streak',
    description: 'Reach a winning streak of 3 puzzles in a row.'
  },
  {
    key: 'streak_5',
    name: 'On Fire!',
    icon: '🔥',
    category: 'Streak',
    description: 'Reach a blazing streak of 5 puzzles in a row.'
  },
  {
    key: 'speed_demon',
    name: 'Speed Demon',
    icon: '⚡',
    category: 'Speed',
    description: 'Solve a puzzle in Hard mode under the 12s timer.'
  },
  {
    key: 'centurion',
    name: 'Centurion',
    icon: '💯',
    category: 'Score',
    description: 'Achieve a High Score of 100 points or more.'
  },
  {
    key: 'high_roller',
    name: 'High Roller',
    icon: '👑',
    category: 'Score',
    description: 'Achieve an elite High Score of 500 points.'
  },
  {
    key: 'dedicated_solver',
    name: 'Dedicated Solver',
    icon: '📚',
    category: 'Dedication',
    description: 'Play 10 rounds of mathematical challenges.'
  },
  {
    key: 'grand_master',
    name: 'Grand Banana Master',
    icon: '🌟',
    category: 'Mastery',
    description: 'Achieve a legendary High Score of 1000 points.'
  }
];

/**
 * Update player avatar and equipped title
 */
async function updateUserProfile(userId, { avatar, title }) {
  const updates = [];
  const params = [];

  if (avatar) {
    updates.push('avatar = ?');
    params.push(avatar);
  }
  if (title) {
    updates.push('title = ?');
    params.push(title);
  }

  if (updates.length > 0) {
    params.push(userId);
    await run(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, params);
  }

  return await getUserById(userId);
}

/**
 * Fetch achievements unlocked by a user, merged with full achievements catalog
 */
async function getUserAchievements(userId) {
  const unlockedRows = await all(
    'SELECT achievement_key, unlocked_at FROM user_achievements WHERE user_id = ?',
    [userId]
  );
  const unlockedMap = {};
  unlockedRows.forEach(r => {
    unlockedMap[r.achievement_key] = r.unlocked_at;
  });

  return ACHIEVEMENTS_CATALOG.map(ach => ({
    ...ach,
    unlocked: Boolean(unlockedMap[ach.key]),
    unlockedAt: unlockedMap[ach.key] || null
  }));
}

/**
 * Check criteria and unlock any new achievements earned
 */
async function checkAndUnlockAchievements(userId, userStats, roundResult) {
  const unlockedRows = await all(
    'SELECT achievement_key FROM user_achievements WHERE user_id = ?',
    [userId]
  );
  const alreadyUnlocked = new Set(unlockedRows.map(r => r.achievement_key));
  const newlyUnlocked = [];

  for (const ach of ACHIEVEMENTS_CATALOG) {
    if (alreadyUnlocked.has(ach.key)) continue;

    let qualifies = false;
    switch (ach.key) {
      case 'first_bite':
        qualifies = roundResult && roundResult.isCorrect;
        break;
      case 'streak_3':
        qualifies = userStats.streak >= 3;
        break;
      case 'streak_5':
        qualifies = userStats.streak >= 5;
        break;
      case 'speed_demon':
        qualifies = roundResult && roundResult.isCorrect && roundResult.mode === 'hard';
        break;
      case 'centurion':
        qualifies = userStats.highScore >= 100;
        break;
      case 'high_roller':
        qualifies = userStats.highScore >= 500;
        break;
      case 'dedicated_solver':
        qualifies = userStats.roundsPlayed >= 10;
        break;
      case 'grand_master':
        qualifies = userStats.highScore >= 1000;
        break;
    }

    if (qualifies) {
      try {
        await run(
          'INSERT OR IGNORE INTO user_achievements (user_id, achievement_key) VALUES (?, ?)',
          [userId, ach.key]
        );
        newlyUnlocked.push(ach);
      } catch (e) {
        console.warn('[Achievement Error]', e.message);
      }
    }
  }

  return newlyUnlocked;
}

/**
 * Close SQLite database connection cleanly
 */
function closeDatabase() {
  return new Promise((resolve) => {
    if (db) {
      db.close((err) => {
        if (err) console.error('[SQLite] Error closing database:', err.message);
        else console.log('[SQLite] Database connection closed.');
        resolve();
      });
    } else {
      resolve();
    }
  });
}

module.exports = {
  initDatabase,
  registerUser,
  upgradeUserAccount,
  findUserByIdentifier,
  findUserByEmail,
  findUserByUsername,
  verifyPassword,
  findOrCreateUser,
  getUserById,
  updateUserStats,
  resetUserScore,
  recordRound,
  getLeaderboard,
  getUserHistory,
  updateUserProfile,
  getUserAchievements,
  checkAndUnlockAchievements,
  ACHIEVEMENTS_CATALOG,
  closeDatabase,
  DB_PATH
};
