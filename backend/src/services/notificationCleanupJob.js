const NotificationLog = require('../models/NotificationLog');
const logger = require('../utils/logger');

/**
 * Cleanup old notification logs
 * This job should be run periodically (e.g., weekly) to remove old logs
 * @param {number} daysToKeep - Number of days to keep logs (default: 90)
 * @returns {Promise<Object>} Cleanup result
 */
async function cleanupOldNotificationLogs(daysToKeep = 90) {
  const startTime = Date.now();
  
  try {
    logger.info('Starting notification logs cleanup job...', {
      daysToKeep,
      timestamp: new Date().toISOString()
    });
    
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    // Get count before deletion for logging
    const countToDelete = await NotificationLog.countDocuments({
      createdAt: { $lt: cutoffDate }
    });
    
    if (countToDelete === 0) {
      const duration = Date.now() - startTime;
      logger.info('No old notification logs to cleanup', {
        daysToKeep,
        cutoffDate: cutoffDate.toISOString(),
        duration: `${duration}ms`
      });
      
      return {
        success: true,
        deletedCount: 0,
        daysToKeep,
        cutoffDate: cutoffDate.toISOString(),
        duration
      };
    }
    
    // Delete old logs
    const result = await NotificationLog.deleteMany({
      createdAt: { $lt: cutoffDate }
    });
    
    const duration = Date.now() - startTime;
    
    logger.info('Notification logs cleanup completed', {
      deletedCount: result.deletedCount,
      daysToKeep,
      cutoffDate: cutoffDate.toISOString(),
      duration: `${duration}ms`
    });
    
    return {
      success: true,
      deletedCount: result.deletedCount,
      daysToKeep,
      cutoffDate: cutoffDate.toISOString(),
      duration
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in notification logs cleanup job:', {
      error: error.message,
      stack: error.stack,
      daysToKeep,
      duration: `${duration}ms`
    });
    
    return {
      success: false,
      error: error.message,
      daysToKeep,
      duration
    };
  }
}

/**
 * Cleanup failed notification logs older than specified days
 * Useful for removing failed notifications that are no longer relevant
 * @param {number} daysToKeep - Number of days to keep failed logs (default: 30)
 * @returns {Promise<Object>} Cleanup result
 */
async function cleanupFailedNotificationLogs(daysToKeep = 30) {
  const startTime = Date.now();
  
  try {
    logger.info('Starting failed notification logs cleanup job...', {
      daysToKeep,
      timestamp: new Date().toISOString()
    });
    
    const cutoffDate = new Date(Date.now() - daysToKeep * 24 * 60 * 60 * 1000);
    
    const result = await NotificationLog.deleteMany({
      status: { $in: ['failed', 'bounced'] },
      createdAt: { $lt: cutoffDate }
    });
    
    const duration = Date.now() - startTime;
    
    logger.info('Failed notification logs cleanup completed', {
      deletedCount: result.deletedCount,
      daysToKeep,
      cutoffDate: cutoffDate.toISOString(),
      duration: `${duration}ms`
    });
    
    return {
      success: true,
      deletedCount: result.deletedCount,
      daysToKeep,
      cutoffDate: cutoffDate.toISOString(),
      duration
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in failed notification logs cleanup job:', {
      error: error.message,
      stack: error.stack,
      daysToKeep,
      duration: `${duration}ms`
    });
    
    return {
      success: false,
      error: error.message,
      daysToKeep,
      duration
    };
  }
}

/**
 * Get cleanup job statistics
 * @returns {Promise<Object>} Statistics about notification logs
 */
async function getCleanupStatistics() {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
    
    const [
      totalLogs,
      logsOlderThan30Days,
      logsOlderThan90Days,
      failedLogsOlderThan30Days,
      oldestLog,
      newestLog
    ] = await Promise.all([
      NotificationLog.countDocuments(),
      NotificationLog.countDocuments({ createdAt: { $lt: thirtyDaysAgo } }),
      NotificationLog.countDocuments({ createdAt: { $lt: ninetyDaysAgo } }),
      NotificationLog.countDocuments({
        status: { $in: ['failed', 'bounced'] },
        createdAt: { $lt: thirtyDaysAgo }
      }),
      NotificationLog.findOne().sort({ createdAt: 1 }).select('createdAt').lean(),
      NotificationLog.findOne().sort({ createdAt: -1 }).select('createdAt').lean()
    ]);
    
    return {
      success: true,
      statistics: {
        totalLogs,
        logsOlderThan30Days,
        logsOlderThan90Days,
        failedLogsOlderThan30Days,
        oldestLogDate: oldestLog ? oldestLog.createdAt : null,
        newestLogDate: newestLog ? newestLog.createdAt : null,
        estimatedCleanupImpact: {
          standardCleanup90Days: logsOlderThan90Days,
          failedLogsCleanup30Days: failedLogsOlderThan30Days
        }
      }
    };
    
  } catch (error) {
    logger.error('Error getting cleanup statistics:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  cleanupOldNotificationLogs,
  cleanupFailedNotificationLogs,
  getCleanupStatistics
};
