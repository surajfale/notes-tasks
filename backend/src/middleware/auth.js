const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authorized, no token provided',
        },
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from token (exclude password)
      req.user = await User.findById(decoded.id).select('-passwordHash');

      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not found',
          },
        });
      }

      next();
    } catch (error) {
      return res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Not authorized, token invalid or expired',
        },
      });
    }
  } catch (error) {
    res.status(500).json({
      error: {
        code: 'SERVER_ERROR',
        message: 'Authentication error',
      },
    });
  }
};

module.exports = { protect };
