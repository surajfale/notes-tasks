const rateLimit = require('express-rate-limit');

/**
 * AI endpoint rate limiter
 * Limits per authenticated user to prevent computational DoS
 * Default: 10 requests per hour
 */
const aiLimiter = rateLimit({
  windowMs: parseInt(process.env.AI_RATE_LIMIT_WINDOW_MS) || 60 * 60 * 1000, // 1 hour
  max: parseInt(process.env.AI_RATE_LIMIT_MAX_REQUESTS) || 10,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'AI enhancement quota exceeded. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Rate limit by user ID (since endpoint is protected with auth)
  keyGenerator: (req) => {
    return req.user?._id || req.ip;
  },
});

/**
 * Deep link endpoint rate limiter
 * Limits per token to prevent brute force attacks
 * Default: 20 requests per 15 minutes
 */
const deepLinkLimiter = rateLimit({
  windowMs: parseInt(process.env.DEEP_LINK_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.DEEP_LINK_RATE_LIMIT_MAX_REQUESTS) || 20,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many attempts to access this link. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Rate limit by token
  keyGenerator: (req) => {
    return req.params.token || req.ip;
  },
});

/**
 * Public endpoint rate limiter (VAPID key)
 * Limits per IP to prevent scraping
 * Default: 50 requests per 15 minutes
 */
const publicLimiter = rateLimit({
  windowMs: parseInt(process.env.PUBLIC_RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.PUBLIC_RATE_LIMIT_MAX_REQUESTS) || 50,
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Rate limit by IP
  keyGenerator: (req) => {
    return req.ip;
  },
});

module.exports = {
  aiLimiter,
  deepLinkLimiter,
  publicLimiter,
};
