/**
 * Authentication Middleware
 * Handles JWT verification, role-based access control, and permission checking
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required');
}
const JWT_EXPIRY = process.env.JWT_EXPIRY || '7d';

/**
 * Verify JWT token and attach user to request
 */
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No authentication token provided',
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findOne({ id: decoded.userId, status: 'active' });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'User not found or account inactive',
      });
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired token',
    });
  }
};

/**
 * Check if user has specific role
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        requiredRole: allowedRoles,
        userRole: req.user.role,
      });
    }

    next();
  };
};

/**
 * Check if user has specific permission
 */
const requirePermission = (permissionKey) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'User not authenticated',
      });
    }

    if (!req.user.permissions[permissionKey]) {
      return res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
        requiredPermission: permissionKey,
      });
    }

    next();
  };
};

/**
 * Owner-only access
 */
const ownerOnly = authorize('owner');

/**
 * Admin or Owner access
 */
const adminOrOwner = authorize('admin', 'owner');

/**
 * Generate JWT token
 */
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRY }
  );
};

/**
 * Verify and refresh token
 */
const refreshToken = (req, res) => {
  try {
    const token = generateToken(req.user.id);
    res.json({
      success: true,
      token,
      expiresIn: JWT_EXPIRY,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Token refresh failed',
      details: error.message,
    });
  }
};

module.exports = {
  authenticate,
  authorize,
  requirePermission,
  ownerOnly,
  adminOrOwner,
  generateToken,
  refreshToken,
  JWT_SECRET,
  JWT_EXPIRY,
};
