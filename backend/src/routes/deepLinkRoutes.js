const express = require('express');
const router = express.Router();
const { handleTaskDeepLink, checkTaskDeepLink } = require('../controllers/deepLinkController');
const { authenticateDeepLink, handleDeepLinkAuth } = require('../middleware/deepLinkAuth');

/**
 * Deep link route for task access from email notifications
 * @route GET /api/tasks/link/:token
 * @desc Direct access to task via deep link token
 * @access Public (token-based authentication)
 */
router.get('/link/:token', authenticateDeepLink, handleTaskDeepLink);

/**
 * Deep link route with authentication check
 * @route GET /api/tasks/link/:token/check
 * @desc Check authentication status and provide appropriate response
 * @access Public (token-based authentication with optional user auth)
 */
router.get('/link/:token/check', authenticateDeepLink, handleDeepLinkAuth, checkTaskDeepLink);

module.exports = router;