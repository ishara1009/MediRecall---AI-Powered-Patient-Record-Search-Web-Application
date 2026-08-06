const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { sendError } = require('../utils/response');

const JWT_SECRET = process.env.JWT_SECRET || 'medirecall_super_secret_key_12345!';

/**
 * Middleware to protect routes and verify JWT tokens
 */
const protect = async (req, res, next) => {
  let token;

  // Retrieve token from Authorization header or cookies if implemented (we use header Bearer)
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header: "Bearer <token>"
      token = req.headers.authorization.split(' ')[1];

      // Decode token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Fetch user associated with token and attach to request
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return sendError(res, 'Not authorized, user not found', 401);
      }

      // Check if user account is deactivated
      if (req.user.status === 'inactive') {
        return sendError(res, 'Your account has been deactivated. Please contact support.', 401);
      }

      return next();
    } catch (err) {
      console.error('JWT Token Verification Error:', err.message);
      return sendError(res, 'Not authorized, token failed', 401, err.message);
    }
  }

  if (!token) {
    return sendError(res, 'Not authorized, no token provided', 401);
  }
};

/**
 * Middleware to authorize specific user roles
 * @param {Array<string>} roles Allowed roles
 */
const authorize = (roles = []) => {
  // Convert single string role to array if needed
  if (typeof roles === 'string') {
    roles = [roles];
  }

  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 'Not authenticated', 401);
    }

    if (roles.length && !roles.includes(req.user.role)) {
      return sendError(res, `Access denied. Role "${req.user.role}" is not authorized for this resource.`, 403);
    }

    return next();
  };
};

module.exports = {
  protect,
  authorize
};
