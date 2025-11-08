const emailService = require('../services/emailService');
const NotificationLog = require('../models/NotificationLog');
const logger = require('../utils/logger');

/**
 * Get notification delivery statistics
 * @route GET /api/admin/notifications/stats
 */
const getNotificationStats = async (req, res) => {
  try {
    const { startDate, endDate, status, userId } = req.query;

    const filters = {};

    if (startDate) {
      filters.startDate = new Date(startDate);
    }

    if (endDate) {
      filters.endDate = new Date(endDate);
    }

    if (status) {
      filters.status = status;
    }

    if (userId) {
      filters.userId = userId;
    }

    // Get stats from email service
    const statsResult = await emailService.getNotificationStats(filters);

    if (!statsResult.success) {
      return res.status(500).json({
        success: false,
        message: 'Failed to retrieve notification statistics',
        error: statsResult.error
      });
    }

    // Get additional metrics
    const recentFailures = await NotificationLog.find({
      status: 'failed',
      sentAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    })
      .sort({ sentAt: -1 })
      .limit(10)
      .select('userId taskId notificationType sentAt errorMessage')
      .lean();

    const circuitBreakerState = emailService.getCircuitBreakerState();
    const serviceHealth = emailService.getServiceHealth();

    res.json({
      success: true,
      data: {
        statistics: statsResult.stats,
        recentFailures,
        circuitBreaker: circuitBreakerState,
        serviceHealth,
        filters
      }
    });

  } catch (error) {
    logger.error('Error getting notification stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notification statistics',
      error: error.message
    });
  }
};

/**
 * Get notification logs with pagination
 * @route GET /api/admin/notifications/logs
 */
const getNotificationLogs = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      status,
      notificationType,
      userId,
      taskId,
      startDate,
      endDate
    } = req.query;

    const query = {};

    if (status) {
      query.status = status;
    }

    if (notificationType) {
      query.notificationType = notificationType;
    }

    if (userId) {
      query.userId = userId;
    }

    if (taskId) {
      query.taskId = taskId;
    }

    if (startDate || endDate) {
      query.sentAt = {};
      if (startDate) {
        query.sentAt.$gte = new Date(startDate);
      }
      if (endDate) {
        query.sentAt.$lte = new Date(endDate);
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, totalCount] = await Promise.all([
      NotificationLog.find(query)
        .sort({ sentAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('userId', 'email displayName')
        .populate('taskId', 'title dueAt priority')
        .lean(),
      NotificationLog.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        logs,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalCount,
          totalPages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });

  } catch (error) {
    logger.error('Error getting notification logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve notification logs',
      error: error.message
    });
  }
};

/**
 * Get email service health status
 * @route GET /api/admin/notifications/health
 */
const getServiceHealth = async (req, res) => {
  try {
    const health = emailService.getServiceHealth();

    res.json({
      success: true,
      data: health
    });

  } catch (error) {
    logger.error('Error getting service health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve service health',
      error: error.message
    });
  }
};

/**
 * Reset circuit breaker (admin operation)
 * @route POST /api/admin/notifications/circuit-breaker/reset
 */
const resetCircuitBreaker = async (req, res) => {
  try {
    const state = emailService.resetCircuitBreaker();

    logger.info('Circuit breaker reset by admin', {
      adminUserId: req.user.userId,
      newState: state
    });

    res.json({
      success: true,
      message: 'Circuit breaker reset successfully',
      data: state
    });

  } catch (error) {
    logger.error('Error resetting circuit breaker:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset circuit breaker',
      error: error.message
    });
  }
};

/**
 * Get notification processing performance metrics
 * @route GET /api/admin/notifications/performance
 */
const getPerformanceMetrics = async (req, res) => {
  try {
    const { hours = 24 } = req.query;
    const startDate = new Date(Date.now() - parseInt(hours) * 60 * 60 * 1000);

    // Get performance metrics
    const metrics = await NotificationLog.aggregate([
      {
        $match: {
          sentAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            hour: { $hour: '$sentAt' },
            date: { $dateToString: { format: '%Y-%m-%d', date: '$sentAt' } }
          },
          totalNotifications: { $sum: 1 },
          successfulNotifications: {
            $sum: {
              $cond: [
                { $in: ['$status', ['sent', 'delivered', 'opened', 'clicked']] },
                1,
                0
              ]
            }
          },
          failedNotifications: {
            $sum: {
              $cond: [{ $in: ['$status', ['failed', 'bounced']] }, 1, 0]
            }
          },
          avgRetryCount: { $avg: '$retryCount' },
          maxRetryCount: { $max: '$retryCount' }
        }
      },
      {
        $sort: { '_id.date': -1, '_id.hour': -1 }
      },
      {
        $limit: 100
      }
    ]);

    // Calculate success rate
    const overallStats = await NotificationLog.aggregate([
      {
        $match: {
          sentAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalNotifications: { $sum: 1 },
          successfulNotifications: {
            $sum: {
              $cond: [
                { $in: ['$status', ['sent', 'delivered', 'opened', 'clicked']] },
                1,
                0
              ]
            }
          },
          failedNotifications: {
            $sum: {
              $cond: [{ $in: ['$status', ['failed', 'bounced']] }, 1, 0]
            }
          },
          avgRetryCount: { $avg: '$retryCount' }
        }
      }
    ]);

    const overall = overallStats[0] || {
      totalNotifications: 0,
      successfulNotifications: 0,
      failedNotifications: 0,
      avgRetryCount: 0
    };

    const successRate = overall.totalNotifications > 0
      ? ((overall.successfulNotifications / overall.totalNotifications) * 100).toFixed(2)
      : 0;

    res.json({
      success: true,
      data: {
        timeRange: {
          hours: parseInt(hours),
          startDate: startDate.toISOString()
        },
        overall: {
          ...overall,
          successRate: parseFloat(successRate)
        },
        hourlyMetrics: metrics
      }
    });

  } catch (error) {
    logger.error('Error getting performance metrics:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve performance metrics',
      error: error.message
    });
  }
};

/**
 * Cleanup old notification logs
 * @route POST /api/admin/notifications/cleanup
 */
const cleanupOldLogs = async (req, res) => {
  try {
    const { daysToKeep = 90 } = req.body;

    const cutoffDate = new Date(Date.now() - parseInt(daysToKeep) * 24 * 60 * 60 * 1000);

    const result = await NotificationLog.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    logger.info('Old notification logs cleaned up', {
      adminUserId: req.user.userId,
      daysToKeep: parseInt(daysToKeep),
      deletedCount: result.deletedCount,
      cutoffDate: cutoffDate.toISOString()
    });

    res.json({
      success: true,
      message: `Cleaned up ${result.deletedCount} old notification logs`,
      data: {
        deletedCount: result.deletedCount,
        daysToKeep: parseInt(daysToKeep),
        cutoffDate: cutoffDate.toISOString()
      }
    });

  } catch (error) {
    logger.error('Error cleaning up old logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cleanup old logs',
      error: error.message
    });
  }
};

module.exports = {
  getNotificationStats,
  getNotificationLogs,
  getServiceHealth,
  resetCircuitBreaker,
  getPerformanceMetrics,
  cleanupOldLogs
};
