/**
 * ==============================================================================
 * CIS046-3 Software For Enterprise — Assignment 1: Banana Challenge Enterprise System
 * ==============================================================================
 * Student Name: Utsab
 * Academic Year: 2026/2027
 * Institution: University of Bedfordshire
 *
 * TIER 2: Application Server & Modular API Gateway
 *
 * ARCHITECTURAL DESIGN (3-TIER ENTERPRISE SEPARATION OF CONCERNS):
 * - Presentation Layer (Tier 1): Static SPA client in /public (HTML5, CSS3, ES6)
 * - Application Layer  (Tier 2): Modular Express API Gateway orchestrating routes:
 *   * /routes/auth.js          : Virtual Identity & bcrypt authentication
 *   * /routes/game.js          : Game mechanics, difficulty scaling, anti-cheat vault
 *   * /routes/user.js          : Player customization & achievement milestones
 *   * /middleware/auth.js      : Session authentication guards
 *   * /services/bananaApi.js   : Interoperable REST client & fallback degradation
 * - Data Layer         (Tier 3): SQLite persistence engine via /database.js
 *
 * ACADEMIC ATTRIBUTION & THIRD-PARTY DISCLOSURE:
 * 1. External Banana API Service:
 *    - Author: Dr. Marc Conrad (University of Bedfordshire)
 *    - Documentation: https://marcconrad.com/uob/banana/doc.php
 *    - Endpoint: https://marcconrad.com/uob/banana/api.php?out=json
 * 2. Node.js & Express Framework (MIT License)
 * 3. Session Engine (express-session) (MIT License)
 * ==============================================================================
 */

const express = require('express');
const session = require('express-session');
const cors = require('cors');
const path = require('path');
const db = require('./database');

// Modular Route Handlers
const authRouter = require('./routes/auth');
const gameRouter = require('./routes/game');
const userRouter = require('./routes/user');

const app = express();
const PORT = process.env.PORT || 3000;

// ==============================================================================
// 1. APPLICATION MIDDLEWARE & STATIC ASSET PIPELINE
// ==============================================================================

// Defense-in-depth Cross-Origin Resource Sharing
app.use(cors());

// HTTP body parsing for JSON and URL-encoded payloads
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve Tier 1 Presentation Layer static assets
app.use(express.static(path.join(__dirname, 'public')));

// ==============================================================================
// 2. VIRTUAL IDENTITY: SESSION CONFIGURATION OVER STATELESS HTTP
// Theme 4: Virtual Identity via HTTP-only cryptographic session cookies
// ==============================================================================

app.use(
  session({
    name: 'connect.sid',
    secret: process.env.SESSION_SECRET || 'enterprise-banana-challenge-secret-key-2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true, // Prevents client-side JS from accessing session cookie (XSS defense)
      sameSite: 'lax', // Protects against Cross-Site Request Forgery (CSRF)
      maxAge: 24 * 60 * 60 * 1000, // 24-hour persistent virtual identity
      secure: false // Set to true if deployed behind HTTPS reverse proxy
    }
  })
);

// ==============================================================================
// 3. MODULAR API ROUTE REGISTRATION
// ==============================================================================

app.use('/api/auth', authRouter);
app.use('/api/game', gameRouter);
app.use('/api/user', userRouter);

// ==============================================================================
// 4. SERVER INITIALIZATION & EVENT-DRIVEN LISTENER
// Theme 2: Server-side non-blocking asynchronous event loop with SQLite init
// ==============================================================================

async function startServer() {
  try {
    // Initialize SQLite schema, tables, and indexes before accepting client traffic
    await db.initDatabase();

    app.listen(PORT, () => {
      console.log(`========================================================`);
      console.log(`🍌 Enterprise Banana Challenge System (CIS046-3)`);
      console.log(`🚀 Application Server active at: http://localhost:${PORT}`);
      console.log(`💾 SQLite Persistence: Connected (${db.DB_PATH})`);
      console.log(`🔒 Session Security: HTTP-Only Cookies Enabled`);
      console.log(`🌐 Interoperability Gateway: Connected to Marc Conrad API`);
      console.log(`🧩 Architecture: Modular (routes/, services/, middleware/)`);
      console.log(`========================================================`);
    });
  } catch (error) {
    console.error('Fatal Server Initialization Error:', error);
    process.exit(1);
  }
}

// Only start listener if invoked directly (supports unit testing if required)
if (require.main === module) {
  startServer();
}

module.exports = app;
