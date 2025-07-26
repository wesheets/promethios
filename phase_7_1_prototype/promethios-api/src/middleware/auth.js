const jwt = require('jsonwebtoken');

/**
 * Authentication middleware for API routes
 * Validates JWT tokens and sets user context
 */
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    // For development/testing, allow requests without auth
    req.user = { id: 'anonymous', role: 'user' };
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default-secret', (err, user) => {
    if (err) {
      // For development, still allow the request but mark as anonymous
      req.user = { id: 'anonymous', role: 'user' };
      return next();
    }

    req.user = user;
    next();
  });
};

/**
 * Admin authentication middleware
 * Requires valid admin role
 */
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

/**
 * Optional authentication middleware
 * Sets user context if token is present, but doesn't require it
 */
const optionalAuth = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    req.user = null;
    return next();
  }

  jwt.verify(token, process.env.JWT_SECRET || 'default-secret', (err, user) => {
    req.user = err ? null : user;
    next();
  });
};

module.exports = {
  authenticateToken,
  requireAdmin,
  optionalAuth
};

