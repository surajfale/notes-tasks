const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const details = Object.values(err.errors).map((error) => ({
      field: error.path,
      message: error.message,
    }));

    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details,
      },
    });
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern)[0];
    return res.status(409).json({
      error: {
        code: 'DUPLICATE_ERROR',
        message: `${field} already exists`,
        details: [{ field, message: 'This value is already taken' }],
      },
    });
  }

  // Mongoose cast error (invalid ObjectId)
  if (err.name === 'CastError') {
    return res.status(400).json({
      error: {
        code: 'INVALID_ID',
        message: 'Invalid resource ID',
      },
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: {
        code: 'UNAUTHORIZED',
        message: 'Invalid token',
      },
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Token expired',
      },
    });
  }

  // Default error
  res.status(err.statusCode || 500).json({
    error: {
      code: err.code || 'SERVER_ERROR',
      message: err.message || 'Internal server error',
    },
  });
};

// Not found handler
const notFound = (req, res, next) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    },
  });
};

module.exports = { errorHandler, notFound };
