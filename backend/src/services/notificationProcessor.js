const emailService = require('./emailService');
const pushNotificationService = require('./pushNotificationService');
const emailTemplateService = require('./emailTemplateService');
const NotificationLog = require('../models/NotificationLog');
const NotificationPreference = require('../models/NotificationPreference');
const List = require('../models/List');
const logger = require('../utils/logger');

/**
 * Process an array of notifications and send emails
 * @param {Array} notifications - Array of notification objects
 * @returns {Promise<{success: boolean, results: Array, summary: Object}>}
 */
async function processNotifications(notifications) {
  if (!Array.isArray(notifications) || notifications.length === 0) {
    logger.info('No notifications to process');
    return {
      success: true,
      results: [],
      summary: {
        totalNotifications: 0,
        successfulNotifications: 0,
        failedNotifications: 0,
        skippedNotifications: 0
      }
    };
  }

  logger.info(`Processing ${notifications.length} notifications`);

  const results = [];
  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;

  // Process notifications individually to handle each one properly
  for (let i = 0; i < notifications.length; i++) {
    const notification = notifications[i];
    
    try {
      const result = await processNotification(notification);
      
      results.push({
        index: i,
        userId: notification.userId,
        taskId: notification.task._id,
        notificationType: notification.notificationType,
        ...result
      });

      if (result.success) {
        successCount++;
      } else if (result.skipped) {
        skippedCount++;
      } else {
        failedCount++;
      }

      // Add small delay between notifications to respect rate limits
      if (i < notifications.length - 1) {
        await sleep(100); // 100ms delay
      }

    } catch (error) {
      logger.error(`Unexpected error processing notification ${i}:`, {
        error: error.message,
        userId: notification.userId,
        taskId: notification.task._id,
        notificationType: notification.notificationType
      });
      
      results.push({
        index: i,
        userId: notification.userId,
        taskId: notification.task._id,
        notificationType: notification.notificationType,
        success: false,
        error: error.message
      });
      
      failedCount++;
    }
  }

  const summary = {
    totalNotifications: notifications.length,
    successfulNotifications: successCount,
    failedNotifications: failedCount,
    skippedNotifications: skippedCount
  };

  logger.info('Notification processing complete', summary);

  return {
    success: successCount > 0 || skippedCount > 0,
    results,
    summary
  };
}

/**
 * Process a single notification
 * @param {Object} notification - Notification object
 * @returns {Promise<{success: boolean, skipped?: boolean, emailId?: string, pushSent?: boolean, logIds?: Array, error?: string}>}
 */
async function processNotification(notification) {
  const { user, task, notificationType, userId, userPreference } = notification;

  try {
    // Skip if task is completed
    if (task.isCompleted) {
      logger.info('Skipping notification for completed task', {
        userId,
        taskId: task._id,
        notificationType
      });
      return { success: false, skipped: true, reason: 'Task is completed' };
    }

    // Get user preferences if not provided
    let preference = userPreference;
    if (!preference) {
      try {
        preference = await NotificationPreference.findOne({ userId });
      } catch (error) {
        logger.warn('Failed to fetch notification preferences', {
          userId,
          error: error.message
        });
      }
    }

    // Get list information if task has a list
    let list = null;
    if (task.listId) {
      try {
        list = await List.findOne({ _id: task.listId, userId }).lean();
      } catch (error) {
        logger.warn('Failed to fetch list for task', {
          taskId: task._id,
          listId: task.listId,
          error: error.message
        });
      }
    }

    const results = {
      success: false,
      emailSent: false,
      pushSent: false,
      logIds: [],
      errors: []
    };

    // Send email notification if enabled
    if (preference?.emailNotificationsEnabled) {
      try {
        const alreadySentEmail = await NotificationLog.hasNotificationBeenSent(
          userId,
          task._id,
          notificationType,
          24,
          'email'
        );

        if (!alreadySentEmail) {
          const emailContent = await emailTemplateService.generateTaskNotificationEmail({
            user,
            task: {
              ...task,
              dueDate: task.dueAt
            },
            list,
            notificationType
          });

          const emailData = {
            userId: userId.toString(),
            taskId: task._id.toString(),
            notificationType,
            to: user.email,
            subject: emailContent.subject,
            html: emailContent.html,
            text: emailContent.text,
            tags: [
              // Only add tags not already added by sendTaskNotification()
              { name: 'priority', value: task.priority.toString() }
            ]
          };

          const emailResult = await emailService.sendTaskNotification(emailData);

          if (emailResult.success) {
            results.emailSent = true;
            results.success = true;
            results.emailId = emailResult.emailId;
            if (emailResult.logId) results.logIds.push(emailResult.logId);

            logger.info('Email notification sent successfully', {
              userId,
              taskId: task._id,
              notificationType,
              emailId: emailResult.emailId
            });
          } else {
            results.errors.push(`Email failed: ${emailResult.error}`);
            logger.error('Failed to send email notification', {
              userId,
              taskId: task._id,
              error: emailResult.error
            });
          }
        } else {
          logger.debug('Email notification already sent recently', {
            userId,
            taskId: task._id,
            notificationType
          });
        }
      } catch (error) {
        results.errors.push(`Email error: ${error.message}`);
        logger.error('Error sending email notification', {
          userId,
          taskId: task._id,
          error: error.message
        });
      }
    }

    // Send push notification if enabled and subscription exists
    if (preference?.browserNotificationsEnabled && preference?.pushSubscription) {
      try {
        const alreadySentPush = await NotificationLog.hasNotificationBeenSent(
          userId,
          task._id,
          notificationType,
          24,
          'push'
        );

        if (!alreadySentPush) {
          const pushPayload = createPushPayload(task, list, notificationType);

          const pushData = {
            userId: userId.toString(),
            taskId: task._id.toString(),
            notificationType,
            pushSubscription: preference.pushSubscription,
            payload: pushPayload
          };

          const pushResult = await pushNotificationService.sendTaskPushNotification(pushData);

          if (pushResult.success) {
            results.pushSent = true;
            results.success = true;
            if (pushResult.logId) results.logIds.push(pushResult.logId);

            logger.info('Push notification sent successfully', {
              userId,
              taskId: task._id,
              notificationType
            });
          } else if (pushResult.subscriptionExpired) {
            // Clear expired subscription
            try {
              await NotificationPreference.findOneAndUpdate(
                { userId },
                {
                  $set: {
                    pushSubscription: null,
                    browserNotificationsEnabled: false
                  }
                }
              );
              logger.info('Cleared expired push subscription', { userId });
            } catch (updateError) {
              logger.error('Failed to clear expired subscription', {
                userId,
                error: updateError.message
              });
            }
            results.errors.push('Push subscription expired');
          } else {
            results.errors.push(`Push failed: ${pushResult.error}`);
            logger.error('Failed to send push notification', {
              userId,
              taskId: task._id,
              error: pushResult.error
            });
          }
        } else {
          logger.debug('Push notification already sent recently', {
            userId,
            taskId: task._id,
            notificationType
          });
        }
      } catch (error) {
        results.errors.push(`Push error: ${error.message}`);
        logger.error('Error sending push notification', {
          userId,
          taskId: task._id,
          error: error.message
        });
      }
    }

    // Update task model with notification tracking if any notification succeeded
    if (results.success) {
      try {
        const Task = require('../models/Task');
        await Task.findByIdAndUpdate(task._id, {
          lastNotificationSent: new Date(),
          $addToSet: { notificationsSent: notificationType }
        });

        logger.info('Task notification tracking updated', {
          userId,
          taskId: task._id,
          notificationType,
          emailSent: results.emailSent,
          pushSent: results.pushSent
        });
      } catch (updateError) {
        logger.error('Failed to update task notification fields', {
          userId,
          taskId: task._id,
          error: updateError.message
        });
      }
    }

    if (results.errors.length > 0) {
      results.error = results.errors.join('; ');
    }

    return results;

  } catch (error) {
    logger.error('Error processing notification', {
      userId,
      taskId: task._id,
      notificationType,
      error: error.message
    });

    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Create push notification payload from task data
 * @param {Object} task - Task object
 * @param {Object|null} list - List object
 * @param {string} notificationType - Type of notification
 * @returns {Object} Push notification payload
 */
function createPushPayload(task, list, notificationType) {
  const typeMessages = {
    same_day: 'Due Today',
    '1_day_before': 'Due Tomorrow',
    '2_days_before': 'Due in 2 Days',
    overdue: 'Overdue'
  };

  const title = typeMessages[notificationType] || 'Task Reminder';
  const listName = list ? ` [${list.name}]` : '';
  const body = `${task.title}${listName}`;

  const dueDate = task.dueAt ? new Date(task.dueAt).toLocaleDateString() : 'No date';

  return {
    title,
    body,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: `task-${task._id}`,
    requireInteraction: notificationType === 'overdue' || notificationType === 'same_day',
    data: {
      taskId: task._id.toString(),
      taskTitle: task.title,
      notificationType,
      dueDate,
      priority: task.priority,
      url: `/tasks/${task._id}`
    },
    actions: [
      {
        action: 'view',
        title: 'View Task'
      },
      {
        action: 'complete',
        title: 'Mark Complete'
      }
    ],
    vibrate: [200, 100, 200]
  };
}

/**
 * Process notifications using Resend batch API for efficiency
 * @param {Array} notifications - Array of notification objects
 * @returns {Promise<{success: boolean, results: Array, summary: Object}>}
 */
async function processBatchNotifications(notifications) {
  if (!Array.isArray(notifications) || notifications.length === 0) {
    logger.info('No notifications to process in batch');
    return {
      success: true,
      results: [],
      summary: {
        totalNotifications: 0,
        successfulNotifications: 0,
        failedNotifications: 0,
        skippedNotifications: 0
      }
    };
  }

  logger.info(`Processing ${notifications.length} notifications in batch mode`);

  // Filter out completed tasks and duplicates first
  const validNotifications = [];
  const skippedNotifications = [];

  for (const notification of notifications) {
    const { user, task, notificationType, userId } = notification;

    // Skip completed tasks
    if (task.isCompleted) {
      skippedNotifications.push({
        ...notification,
        reason: 'Task is completed'
      });
      continue;
    }

    // Check for duplicates
    const alreadySent = await NotificationLog.hasNotificationBeenSent(
      userId,
      task._id,
      notificationType,
      24
    );

    if (alreadySent) {
      skippedNotifications.push({
        ...notification,
        reason: 'Notification already sent'
      });
      continue;
    }

    validNotifications.push(notification);
  }

  logger.info(`Filtered notifications: ${validNotifications.length} valid, ${skippedNotifications.length} skipped`);

  if (validNotifications.length === 0) {
    return {
      success: true,
      results: skippedNotifications.map(n => ({
        userId: n.userId,
        taskId: n.task._id,
        notificationType: n.notificationType,
        success: false,
        skipped: true,
        reason: n.reason
      })),
      summary: {
        totalNotifications: notifications.length,
        successfulNotifications: 0,
        failedNotifications: 0,
        skippedNotifications: skippedNotifications.length
      }
    };
  }

  // Prepare batch notifications
  const batchNotifications = [];
  
  for (const notification of validNotifications) {
    try {
      const { user, task, notificationType, userId } = notification;

      // Get list information if needed
      let list = null;
      if (task.listId) {
        try {
          list = await List.findOne({ _id: task.listId, userId }).lean();
        } catch (error) {
          logger.warn('Failed to fetch list for batch notification', {
            taskId: task._id,
            listId: task.listId
          });
        }
      }

      // Generate email content
      const emailContent = await emailTemplateService.generateTaskNotificationEmail({
        user,
        task: {
          ...task,
          dueDate: task.dueAt
        },
        list,
        notificationType
      });

      batchNotifications.push({
        userId: userId.toString(),
        taskId: task._id.toString(),
        notificationType,
        to: user.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        tags: [
          { name: 'type', value: 'task-notification' },
          { name: 'notification-type', value: notificationType },
          { name: 'priority', value: task.priority.toString() }
        ]
      });

    } catch (error) {
      logger.error('Error preparing batch notification', {
        userId: notification.userId,
        taskId: notification.task._id,
        error: error.message
      });
    }
  }

  // Send batch notifications
  const batchResult = await emailService.sendBatchTaskNotifications(batchNotifications);

  // Combine results
  const allResults = [
    ...batchResult.results || [],
    ...skippedNotifications.map(n => ({
      userId: n.userId,
      taskId: n.task._id,
      notificationType: n.notificationType,
      success: false,
      skipped: true,
      reason: n.reason
    }))
  ];

  const summary = {
    totalNotifications: notifications.length,
    successfulNotifications: batchResult.summary?.successfulNotifications || 0,
    failedNotifications: batchResult.summary?.failedNotifications || 0,
    skippedNotifications: skippedNotifications.length
  };

  logger.info('Batch notification processing complete', summary);

  return {
    success: batchResult.success,
    results: allResults,
    summary
  };
}

/**
 * Process notifications for overdue tasks
 * @param {Date} currentDate - Current date to check against
 * @returns {Promise<{success: boolean, results: Array, summary: Object}>}
 */
async function processOverdueNotifications(currentDate = new Date()) {
  try {
    logger.info('Processing overdue task notifications');

    // Import here to avoid circular dependencies
    const { getTasksRequiringNotification } = require('./notificationScheduler');
    
    // Get overdue tasks (tasks with due date in the past that are not completed)
    const Task = require('../models/Task');
    const NotificationPreference = require('../models/NotificationPreference');
    const User = require('../models/User');

    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    // Find overdue tasks
    const overdueTasks = await Task.find({
      isCompleted: false,
      dueAt: { $lt: yesterday }
    }).lean();

    if (overdueTasks.length === 0) {
      logger.info('No overdue tasks found');
      return {
        success: true,
        results: [],
        summary: {
          totalNotifications: 0,
          successfulNotifications: 0,
          failedNotifications: 0,
          skippedNotifications: 0
        }
      };
    }

    // Group by user and check preferences
    const overdueNotifications = [];
    const userIds = [...new Set(overdueTasks.map(task => task.userId.toString()))];

    for (const userId of userIds) {
      // Check if user has notifications enabled
      const userPreference = await NotificationPreference.findOne({ userId }).populate('userId', 'email displayName');
      
      if (!userPreference || !userPreference.emailNotificationsEnabled) {
        continue;
      }

      const user = userPreference.userId;
      if (!user) continue;

      const userOverdueTasks = overdueTasks.filter(task => task.userId.toString() === userId);

      for (const task of userOverdueTasks) {
        // Check if we've already sent an overdue notification recently
        const alreadySent = await NotificationLog.hasNotificationBeenSent(
          userId,
          task._id,
          'overdue',
          168 // Within last week
        );

        if (!alreadySent) {
          overdueNotifications.push({
            userId,
            user,
            task,
            notificationType: 'overdue',
            scheduledFor: currentDate,
            timezone: userPreference.timezone || 'UTC'
          });
        }
      }
    }

    logger.info(`Found ${overdueNotifications.length} overdue notifications to send`);

    if (overdueNotifications.length === 0) {
      return {
        success: true,
        results: [],
        summary: {
          totalNotifications: 0,
          successfulNotifications: 0,
          failedNotifications: 0,
          skippedNotifications: 0
        }
      };
    }

    // Process overdue notifications
    return await processNotifications(overdueNotifications);

  } catch (error) {
    logger.error('Error processing overdue notifications:', error);
    throw error;
  }
}

/**
 * Sleep utility function
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

module.exports = {
  processNotifications,
  processNotification,
  processBatchNotifications,
  processOverdueNotifications
};