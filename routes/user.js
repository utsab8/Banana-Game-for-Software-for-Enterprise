/**
 * ==============================================================================
 * CIS046-3 Software For Enterprise — Assignment 1: Banana Challenge Enterprise System
 * ==============================================================================
 * THEME 4: VIRTUAL IDENTITY & PROFILE MANAGEMENT ROUTER
 *
 * REST Endpoints:
 * - POST /api/user/profile      : Updates player virtual avatar and unlocked title
 * - GET  /api/user/achievements : Retrieves achievement unlock progression from SQLite
 * ==============================================================================
 */

const express = require('express');
const router = express.Router();
const db = require('../database');
const { requireAuth } = require('../middleware/auth');

/**
 * POST /api/user/profile
 * Updates the user's avatar emoji and equipped title in SQLite and session store
 */
router.post('/profile', requireAuth, async (req, res) => {
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
 * Retrieves list of milestones & unlock status for current user from SQLite
 */
router.get('/achievements', requireAuth, async (req, res) => {
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

module.exports = router;

