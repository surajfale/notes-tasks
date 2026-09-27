const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { register, login, getMe, changePassword, deleteAccount, forgotPassword, resetPassword } = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { validate, schemas } = require('../middleware/validation');

// Rate limiting for auth routes
// More lenient in development, stricter in production
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'development' 
    ? 50 // Allow 50 attempts in development
    : parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS) || 10, // 10 in production (increased from 5)
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for certain IPs in development (optional)
  skip: (req) => {
    if (process.env.NODE_ENV === 'development') {
      // Skip rate limiting for localhost in development
      const ip = req.ip || req.connection.remoteAddress;
      return ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1';
    }
    return false;
  }
});

// Public routes
router.post('/register', authLimiter, validate(schemas.register), register);
router.post('/login', authLimiter, validate(schemas.login), login);
router.post('/forgot-password', authLimiter, validate(schemas.forgotPassword), forgotPassword);
router.post('/reset-password', authLimiter, validate(schemas.resetPassword), resetPassword);

// Protected routes
router.get('/me', protect, getMe);
router.put('/password', protect, validate(schemas.changePassword), changePassword);
router.delete('/account', protect, deleteAccount);

module.exports = router;
