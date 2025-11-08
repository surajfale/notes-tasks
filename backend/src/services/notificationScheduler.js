const Task = require('../models/Task');
const NotificationPreference = require('../models/NotificationPreference');
const NotificationLog = require('../models/NotificationLog');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Main function to start the notification scheduler
 * This is called by the cron job
 */
async function startNotificationScheduler() {
  const startTime = Date.now();
  
  try {
    logger.info('Starting notification scheduler...', {
      timestamp: new Date().toISOString()
    });
    
    const currentDate = new Date();
    const notifications = await getTasksRequiringNotification(currentDate);
    
    if (notifications.length === 0) {
      const duration = Date.now() - startTime;
      logger.info('No notifications to send', {
        duration: `${duration}ms`
      });
      return {
        success: true,
        notificationsSent: 0,
        duration
      };
    }
    
    // Group notifications by user for batch processing
    const notificationsByUser = groupNotificationsByUser(notifications);
    
    logger.info(`Found ${notifications.length} notifications for ${Object.keys(notificationsByUser).length} users`, {
      totalNotifications: notifications.length,
      totalUsers: Object.keys(notificationsByUser).length
    });
    
    let totalSuccessful = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    
    // Process notifications for each user
    for (const [userId, userNotifications] of Object.entries(notificationsByUser)) {
      try {
        const result = await processUserNotifications(userId, userNotifications);
        totalSuccessful += result.summary.successfulNotifications;
        totalFailed += result.summary.failedNotifications;
        totalSkipped += result.summary.skippedNotifications;
      } catch (error) {
        logger.error(`Error processing notifications for user ${userId}:`, {
          error: error.message,
          userId,
          notificationCount: userNotifications.length
        });
        totalFailed += userNotifications.length;
      }
    }
    
    const duration = Date.now() - startTime;
    
    logger.info('Notification scheduler completed', {
      duration: `${duration}ms`,
      totalNotifications: notifications.length,
      successful: totalSuccessful,
      failed: totalFailed,
      skipped: totalSkipped,
      successRate: notifications.length > 0 
        ? `${((totalSuccessful / notifications.length) * 100).toFixed(2)}%`
        : '0%'
    });
    
    return {
      success: true,
      notificationsSent: totalSuccessful,
      notificationsFailed: totalFailed,
      notificationsSkipped: totalSkipped,
      duration
    };
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error('Error in notification scheduler:', {
      error: error.message,
      stack: error.stack,
      duration: `${duration}ms`
    });
    throw error;
  }
}

/**
 * Query tasks that need notifications based on due dates and user preferences
 * @param {Date} currentDate - The current date to calculate notifications from
 * @returns {Array} Array of notification objects
 */
async function getTasksRequiringNotification(currentDate) {
  try {
    // Get all users with either email or browser notifications enabled
    const usersWithNotifications = await NotificationPreference.find({
      $or: [
        { emailNotificationsEnabled: true },
        { browserNotificationsEnabled: true }
      ],
      notificationDays: { $exists: true, $ne: [] }
    }).populate('userId', 'email displayName');
    
    if (usersWithNotifications.length === 0) {
      return [];
    }
    
    const notifications = [];
    
    for (const userPreference of usersWithNotifications) {
      if (!userPreference.userId) continue;
      
      const userNotifications = await calculateUserNotifications(
        userPreference.userId._id,
        userPreference,
        currentDate
      );
      
      notifications.push(...userNotifications);
    }
    
    return notifications;
  } catch (error) {
    logger.error('Error getting tasks requiring notification:', error);
    throw error;
  }
}

/**
 * Calculate notifications for a specific user based on their preferences
 * @param {ObjectId} userId - User ID
 * @param {Object} userPreference - User's notification preferences
 * @param {Date} currentDate - Current date
 * @returns {Array} Array of notification objects for the user
 */
async function calculateUserNotifications(userId, userPreference, currentDate) {
  const notifications = [];
  const userTimezone = userPreference.timezone || 'UTC';
  const userNotificationTime = userPreference.notificationTime || '09:00';
  
  // Check if it's the right time to send notifications for this user
  if (!isNotificationTime(currentDate, userTimezone, userNotificationTime)) {
    logger.debug(`Skipping user ${userId} - not their notification time yet`, {
      userTime: userNotificationTime,
      timezone: userTimezone,
      currentTime: currentDate.toISOString()
    });
    return notifications; // Return empty array if not the right time
  }
  
  // Calculate date ranges for each notification type
  const dateRanges = calculateNotificationDateRanges(currentDate, userTimezone);
  
  for (const notificationDay of userPreference.notificationDays) {
    const dateRange = dateRanges[notificationDay];
    if (!dateRange) continue;
    
    // Find tasks that fall within this notification window
    const tasks = await Task.find({
      userId: userId,
      isCompleted: false,
      dueAt: {
        $gte: dateRange.start,
        $lte: dateRange.end
      }
    }).lean();
    
    for (const task of tasks) {
      // Check if we've already sent this type of notification for this task
      const alreadySent = await NotificationLog.hasNotificationBeenSent(
        userId,
        task._id,
        notificationDay,
        24 // Within last 24 hours
      );
      
      if (!alreadySent) {
        notifications.push({
          userId: userId,
          user: userPreference.userId,
          task: task,
          notificationType: notificationDay,
          scheduledFor: currentDate,
          timezone: userTimezone,
          notificationTime: userNotificationTime,
          userPreference: userPreference // Pass the full preference object
        });
      }
    }
  }
  
  return notifications;
}

/**
 * Check if current time matches user's preferred notification time
 * @param {Date} currentDate - Current date/time
 * @param {string} timezone - User's timezone (IANA timezone, e.g., 'America/New_York')
 * @param {string} notificationTime - User's preferred time in HH:MM format
 * @returns {boolean} True if it's time to send notifications
 */
function isNotificationTime(currentDate, timezone, notificationTime) {
  try {
    const { DateTime } = require('luxon');

    // Parse the notification time (HH:MM)
    const [targetHour, targetMinute] = notificationTime.split(':').map(Number);

    // Get current time in user's timezone
    const userTime = DateTime.fromJSDate(currentDate, { zone: timezone });

    // Get current hour and minute in user's timezone
    const currentHour = userTime.hour;
    const currentMinute = userTime.minute;

    // Calculate total minutes for easy comparison
    const currentTotalMinutes = currentHour * 60 + currentMinute;
    const targetTotalMinutes = targetHour * 60 + targetMinute;

    // Allow a 30-minute window (since cron runs every hour, we want to catch the notification)
    // This ensures notifications are sent if we're within 30 minutes of the target time
    const diff = Math.abs(currentTotalMinutes - targetTotalMinutes);

    logger.debug('Checking notification time', {
      timezone,
      userCurrentTime: userTime.toFormat('HH:mm'),
      targetTime: notificationTime,
      differenceMinutes: diff,
      shouldSend: diff <= 30
    });

    return diff <= 30;

  } catch (error) {
    logger.error('Error checking notification time:', {
      error: error.message,
      timezone,
      notificationTime
    });
    return true; // Default to sending if there's an error
  }
}

/**
 * Calculate date ranges for different notification types based on current date and timezone
 * @param {Date} currentDate - Current date
 * @param {string} timezone - User's timezone
 * @returns {Object} Object with date ranges for each notification type
 */
function calculateNotificationDateRanges(currentDate, timezone) {
  // For simplicity, we'll work with UTC dates and adjust for timezone later
  // In a production system, you might want to use a library like moment-timezone
  
  const today = new Date(currentDate);
  today.setHours(0, 0, 0, 0);
  
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const dayAfterTomorrow = new Date(today);
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  
  const endOfToday = new Date(today);
  endOfToday.setHours(23, 59, 59, 999);
  
  const endOfTomorrow = new Date(tomorrow);
  endOfTomorrow.setHours(23, 59, 59, 999);
  
  const endOfDayAfterTomorrow = new Date(dayAfterTomorrow);
  endOfDayAfterTomorrow.setHours(23, 59, 59, 999);
  
  return {
    'same_day': {
      start: today,
      end: endOfToday
    },
    '1_day_before': {
      start: tomorrow,
      end: endOfTomorrow
    },
    '2_days_before': {
      start: dayAfterTomorrow,
      end: endOfDayAfterTomorrow
    }
  };
}

/**
 * Group notifications by user ID for batch processing
 * @param {Array} notifications - Array of notification objects
 * @returns {Object} Object with userId as key and array of notifications as value
 */
function groupNotificationsByUser(notifications) {
  return notifications.reduce((groups, notification) => {
    const userId = notification.userId.toString();
    if (!groups[userId]) {
      groups[userId] = [];
    }
    groups[userId].push(notification);
    return groups;
  }, {});
}

/**
 * Process notifications for a specific user
 * @param {string} userId - User ID
 * @param {Array} notifications - Array of notifications for the user
 * @returns {Promise<Object>} Processing result with summary
 */
async function processUserNotifications(userId, notifications) {
  const startTime = Date.now();
  
  try {
    logger.info(`Processing ${notifications.length} notifications for user ${userId}`, {
      userId,
      notificationCount: notifications.length
    });
    
    // Import notification processor here to avoid circular dependencies
    const { processNotifications } = require('./notificationProcessor');
    
    const result = await processNotifications(notifications);
    
    const duration = Date.now() - startTime;
    
    logger.info(`Successfully processed notifications for user ${userId}`, {
      userId,
      duration: `${duration}ms`,
      successful: result.summary.successfulNotifications,
      failed: result.summary.failedNotifications,
      skipped: result.summary.skippedNotifications
    });
    
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error(`Error processing notifications for user ${userId}:`, {
      error: error.message,
      userId,
      duration: `${duration}ms`
    });
    throw error;
  }
}

module.exports = {
  startNotificationScheduler,
  getTasksRequiringNotification,
  calculateUserNotifications,
  isNotificationTime,
  calculateNotificationDateRanges,
  groupNotificationsByUser,
  processUserNotifications
};