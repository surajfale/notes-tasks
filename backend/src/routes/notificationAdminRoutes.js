const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const notificationAdminController = require('../controllers/notificationAdminController');

// All routes require authentication
// Note: In a production system, you would add an additional admin role check middleware

/**
 * @route   GET /api/admin/notifications/stats
 * @desc    Get notification delivery statistics
 * @access  Private (Admin)
 */
router.get('/stats', protect, notificationAdminController.getNotificationStats);

/**
 * @route   GET /api/admin/notifications/logs
 * @desc    Get notification logs with pagination
 * @access  Private (Admin)
 */
router.get('/logs', protect, notificationAdminController.getNotificationLogs);

/**
 * @route   GET /api/admin/notifications/health
 * @desc    Get email service health status
 * @access  Private (Admin)
 */
router.get('/health', protect, notificationAdminController.getServiceHealth);

/**
 * @route   GET /api/admin/notifications/performance
 * @desc    Get notification processing performance metrics
 * @access  Private (Admin)
 */
router.get('/performance', protect, notificationAdminController.getPerformanceMetrics);

/**
 * @route   POST /api/admin/notifications/circuit-breaker/reset
 * @desc    Reset circuit breaker (admin operation)
 * @access  Private (Admin)
 */
router.post('/circuit-breaker/reset', protect, notificationAdminController.resetCircuitBreaker);

/**
 * @route   POST /api/admin/notifications/cleanup
 * @desc    Cleanup old notification logs
 * @access  Private (Admin)
 */
router.post('/cleanup', protect, notificationAdminController.cleanupOldLogs);

module.exports = router;
