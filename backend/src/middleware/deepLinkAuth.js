const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Task = require('../models/Task');

/**
 * Generate a secure deep link token for task access
 * @param {string} userId - User ID
 * @param {string} taskId - Task ID
 * @param {number} expiresInHours - Token expiration in hours (default: 24)
 * @returns {string} Secure token for deep link
 */
const generateDeepLinkToken = (userId, taskId, expiresInHours = 24) => {
  const payload = {
    userId,
    taskId,
    type: 'deep_link',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (expiresInHours * 60 * 60)
  };

  // Use a different secret for deep links to add extra security
  const deepLinkSecret = process.env.DEEP_LINK_SECRET || process.env.JWT_SECRET;
  
  return jwt.sign(payload, deepLinkSecret, { algorithm: 'HS256' });
};

/**
 * Validate and decode a deep link token
 * @param {string} token - Deep link token to validate
 * @returns {Object} Decoded token payload or null if invalid
 */
const validateDeepLinkToken = (token) => {
  try {
    const deepLinkSecret = process.env.DEEP_LINK_SECRET || process.env.JWT_SECRET;
    const decoded = jwt.verify(token, deepLinkSecret);
    
    // Verify token type
    if (decoded.type !== 'deep_link') {
      return null;
    }
    
    return decoded;
  } catch (error) {
    return null;
  }
};

/**
 * Middleware to handle deep link authentication
 * Validates token and sets user/task context for the request
 */
const authenticateDeepLink = async (req, res, next) => {
  try {
    const { token } = req.params;
    
    if (!token) {
      return res.status(400).json({
        error: {
          code: 'INVALID_DEEP_LINK',
          message: 'Deep link token is required'
        }
      });
    }

    // Validate the token
    const decoded = validateDeepLinkToken(token);
    
    if (!decoded) {
      return res.status(401).json({
        error: {
          code: 'INVALID_DEEP_LINK',
          message: 'Invalid or expired deep link token'
        }
      });
    }

    // Verify user exists
    const user = await User.findById(decoded.userId).select('-passwordHash');
    if (!user) {
      return res.status(404).json({
        error: {
          code: 'USER_NOT_FOUND',
          message: 'User associated with this link no longer exists'
        }
      });
    }

    // Verify task exists and user has access
    const task = await Task.findOne({
      _id: decoded.taskId,
      userId: decoded.userId
    });
    
    if (!task) {
      return res.status(404).json({
        error: {
          code: 'TASK_NOT_FOUND',
          message: 'Task not found or you do not have permission to access it'
        }
      });
    }

    // Set user and task context for the request
    req.user = user;
    req.task = task;
    req.deepLinkToken = decoded;
    
    next();
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Error processing deep link authentication'
      }
    });
  }
};

/**
 * Optional middleware to handle authentication flow for logged-out users
 * This can be used to redirect users to login while preserving the deep link
 */
const handleDeepLinkAuth = async (req, res, next) => {
  try {
    // Check if user is already authenticated via regular JWT
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        // Verify regular JWT token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('-passwordHash');
        
        if (user) {
          req.user = user;
          req.isAuthenticated = true;
          return next();
        }
      } catch (error) {
        // Token invalid, continue with deep link auth
      }
    }

    // User not authenticated, mark for redirect to login
    req.isAuthenticated = false;
    next();
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Error checking authentication status'
      }
    });
  }
};

module.exports = {
  generateDeepLinkToken,
  validateDeepLinkToken,
  authenticateDeepLink,
  handleDeepLinkAuth
};