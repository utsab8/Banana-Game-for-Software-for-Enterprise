/**
 * ==============================================================================
 * CIS046-3 Software For Enterprise — Assignment 1: Banana Challenge Enterprise System
 * ==============================================================================
 * THEME 4: VIRTUAL IDENTITY MIDDLEWARE
 *
 * Session Authentication Guard Middleware
 * Protects authenticated game routes from unauthorized or uninitialized access.
 * ==============================================================================
 */

const requireAuth = (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.status(401).json({
      success: false,
      error: 'Unauthenticated. Please register or sign in with your virtual player identity first.'
    });
  }
  next();
};

module.exports = {
  requireAuth
};
