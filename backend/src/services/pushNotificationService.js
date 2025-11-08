const webPush = require('web-push');
const logger = require('../utils/logger');
const NotificationLog = require('../models/NotificationLog');
const CircuitBreaker = require('../utils/circuitBreaker');

class PushNotificationService {
  constructor() {
    this.vapidPublicKey = process.env.VAPID_PUBLIC_KEY;
    this.vapidPrivateKey = process.env.VAPID_PRIVATE_KEY;
    this.vapidSubject = process.env.VAPID_SUBJECT;
    this.maxRetries = parseInt(process.env.PUSH_RETRY_ATTEMPTS) || 3;
    this.retryDelayMs = parseInt(process.env.PUSH_RETRY_DELAY_MS) || 1000;

    // Initialize circuit breaker for push service
    this.circuitBreaker = new CircuitBreaker({
      name: 'WebPushService',
      failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD) || 5,
      successThreshold: parseInt(process.env.CIRCUIT_BREAKER_SUCCESS_THRESHOLD) || 2,
      timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT_MS) || 60000 // 1 minute
    });

    this.initializeWebPush();
  }

  /**
   * Initialize Web Push with VAPID credentials
   * @private
   */
  initializeWebPush() {
    if (!this.vapidPublicKey || !this.vapidPrivateKey) {
      logger.warn('VAPID keys not configured - push notification service disabled');
      logger.info('Run "node src/scripts/generateVapidKeys.js" to generate keys');
      return;
    }

    if (!this.vapidSubject) {
      logger.warn('VAPID subject not configured - using default');
      this.vapidSubject = 'mailto:admin@example.com';
    }

    try {
      webPush.setVapidDetails(
        this.vapidSubject,
        this.vapidPublicKey,
        this.vapidPrivateKey
      );
      logger.info('Web Push notification service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Web Push:', error.message);
    }
  }

  /**
   * Check if push notification service is available
   * @returns {boolean}
   */
  isAvailable() {
    return !!(this.vapidPublicKey && this.vapidPrivateKey);
  }

  /**
   * Get VAPID public key for client-side subscription
   * @returns {string|null}
   */
  getPublicKey() {
    return this.vapidPublicKey || null;
  }

  /**
   * Send a push notification to a single subscription
   * @param {Object} pushSubscription - Push subscription object from browser
   * @param {Object} payload - Notification payload
   * @param {string} payload.title - Notification title
   * @param {string} payload.body - Notification body
   * @param {string} [payload.icon] - Notification icon URL
   * @param {string} [payload.badge] - Notification badge URL
   * @param {string} [payload.tag] - Notification tag for grouping
   * @param {Object} [payload.data] - Additional data to include
   * @param {Array} [payload.actions] - Notification actions
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async sendPushNotification(pushSubscription, payload) {
    if (!this.isAvailable()) {
      const error = 'Push notification service is not available - check VAPID configuration';
      logger.error(error);
      return { success: false, error };
    }

    if (!pushSubscription || !pushSubscription.endpoint) {
      const error = 'Invalid push subscription object';
      logger.error(error);
      return { success: false, error };
    }

    if (!payload || !payload.title || !payload.body) {
      const error = 'Missing required payload fields: title and body are required';
      logger.error(error);
      return { success: false, error };
    }

    const notificationPayload = {
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon-192.png',
      badge: payload.badge || '/badge-72.png',
      tag: payload.tag || 'task-notification',
      data: payload.data || {},
      actions: payload.actions || [],
      requireInteraction: payload.requireInteraction || false,
      vibrate: payload.vibrate || [200, 100, 200]
    };

    return await this.sendPushWithRetry(pushSubscription, notificationPayload);
  }

  /**
   * Send push notification with retry logic and circuit breaker protection
   * @param {Object} pushSubscription - Push subscription object
   * @param {Object} notificationPayload - Notification payload
   * @returns {Promise<{success: boolean, error?: string, circuitBreakerOpen?: boolean}>}
   * @private
   */
  async sendPushWithRetry(pushSubscription, notificationPayload) {
    // Check circuit breaker before attempting to send
    if (this.circuitBreaker.isOpen()) {
      const cbState = this.circuitBreaker.getState();
      logger.error('Circuit breaker is OPEN - push notification service unavailable', {
        endpoint: this.truncateEndpoint(pushSubscription.endpoint),
        circuitBreakerState: cbState
      });

      return {
        success: false,
        error: `Push notification service temporarily unavailable. Circuit breaker is open. Will retry after ${cbState.nextAttempt}`,
        circuitBreakerOpen: true
      };
    }

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.debug(`Sending push notification attempt ${attempt}/${this.maxRetries}`, {
          endpoint: this.truncateEndpoint(pushSubscription.endpoint),
          title: notificationPayload.title
        });

        // Execute push send through circuit breaker
        await this.circuitBreaker.execute(async () => {
          await webPush.sendNotification(
            pushSubscription,
            JSON.stringify(notificationPayload)
          );
        });

        logger.info('Push notification sent successfully', {
          endpoint: this.truncateEndpoint(pushSubscription.endpoint),
          title: notificationPayload.title,
          attempt
        });

        return { success: true };

      } catch (error) {
        // Check if circuit breaker opened during this attempt
        if (error.circuitBreakerOpen) {
          logger.error('Circuit breaker opened during push notification send', {
            endpoint: this.truncateEndpoint(pushSubscription.endpoint),
            error: error.message,
            nextAttempt: error.nextAttempt
          });

          return {
            success: false,
            error: error.message,
            circuitBreakerOpen: true
          };
        }

        // Handle subscription errors (expired, invalid, etc.)
        if (this.isSubscriptionError(error)) {
          logger.error('Push subscription error (likely expired or invalid):', {
            statusCode: error.statusCode,
            endpoint: this.truncateEndpoint(pushSubscription.endpoint),
            error: error.message
          });

          return {
            success: false,
            error: error.message,
            subscriptionExpired: true,
            statusCode: error.statusCode
          };
        }

        // Log retryable error and continue if we have attempts left
        if (attempt < this.maxRetries) {
          const delay = this.calculateRetryDelay(attempt);
          logger.warn(`Push notification send failed (attempt ${attempt}), retrying in ${delay}ms`, {
            error: error.message,
            endpoint: this.truncateEndpoint(pushSubscription.endpoint),
            nextAttempt: attempt + 1
          });
          await this.sleep(delay);
          continue;
        }

        // Final attempt failed
        logger.error('Push notification send failed after all retry attempts', {
          error: error.message,
          endpoint: this.truncateEndpoint(pushSubscription.endpoint),
          attempts: this.maxRetries
        });

        return { success: false, error: error.message };
      }
    }
  }

  /**
   * Send task notification push with tracking
   * @param {Object} notificationData - Notification configuration
   * @param {string} notificationData.userId - User ID
   * @param {string} notificationData.taskId - Task ID
   * @param {string} notificationData.notificationType - Type of notification
   * @param {Object} notificationData.pushSubscription - Push subscription object
   * @param {Object} notificationData.payload - Notification payload
   * @returns {Promise<{success: boolean, logId?: string, error?: string, subscriptionExpired?: boolean}>}
   */
  async sendTaskPushNotification(notificationData) {
    const { userId, taskId, notificationType, pushSubscription, payload } = notificationData;

    // Validate required fields
    if (!userId || !taskId || !notificationType || !pushSubscription) {
      const error = 'Missing required notification fields: userId, taskId, notificationType, and pushSubscription are required';
      logger.error(error);
      return { success: false, error };
    }

    // Check if notification was already sent recently (prevent duplicates)
    try {
      const alreadySent = await NotificationLog.hasNotificationBeenSent(
        userId,
        taskId,
        notificationType,
        24,
        'push' // Channel type
      );

      if (alreadySent) {
        const message = `Push notification already sent for task ${taskId}, type ${notificationType} within last 24 hours`;
        logger.info(message);
        return { success: false, error: message, duplicate: true };
      }
    } catch (error) {
      logger.error('Error checking for duplicate push notifications:', error.message);
      // Continue with sending - don't fail on duplicate check error
    }

    // Send the push notification
    const pushResult = await this.sendPushNotification(pushSubscription, payload);

    // Log the notification attempt
    let logId = null;
    try {
      const logData = {
        userId,
        taskId,
        notificationType,
        channel: 'push',
        endpoint: this.truncateEndpoint(pushSubscription.endpoint),
        status: pushResult.success ? 'sent' : 'failed',
        errorMessage: pushResult.success ? null : pushResult.error,
        retryCount: 0,
        metadata: {
          subscriptionExpired: pushResult.subscriptionExpired || false,
          circuitBreakerOpen: pushResult.circuitBreakerOpen || false
        }
      };

      const log = await NotificationLog.logNotification(logData);
      logId = log._id.toString();

      logger.info('Push notification logged successfully', {
        logId,
        userId,
        taskId,
        notificationType,
        status: logData.status
      });
    } catch (error) {
      logger.error('Failed to log push notification:', {
        error: error.message,
        userId,
        taskId,
        notificationType
      });
      // Don't fail the entire operation if logging fails
    }

    return {
      ...pushResult,
      logId
    };
  }

  /**
   * Send multiple push notifications in batch
   * @param {Array<Object>} notifications - Array of notification configurations
   * @returns {Promise<{success: boolean, results?: Array, summary?: Object, error?: string}>}
   */
  async sendBatchPushNotifications(notifications) {
    if (!this.isAvailable()) {
      const error = 'Push notification service is not available - check VAPID configuration';
      logger.error(error);
      return { success: false, error };
    }

    if (!Array.isArray(notifications) || notifications.length === 0) {
      const error = 'Invalid notifications array provided';
      logger.error(error);
      return { success: false, error };
    }

    logger.info(`Processing ${notifications.length} push notifications`);

    const results = [];
    let successCount = 0;
    let expiredSubscriptions = 0;

    // Process notifications individually
    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];

      try {
        const result = await this.sendTaskPushNotification(notification);
        results.push({
          index: i,
          userId: notification.userId,
          taskId: notification.taskId,
          notificationType: notification.notificationType,
          ...result
        });

        if (result.success) {
          successCount++;
        } else if (result.subscriptionExpired) {
          expiredSubscriptions++;
        }

        // Add small delay between notifications to respect rate limits
        if (i < notifications.length - 1) {
          await this.sleep(50); // 50ms delay between notifications
        }

      } catch (error) {
        logger.error(`Unexpected error processing push notification ${i}:`, error.message);
        results.push({
          index: i,
          userId: notification.userId,
          taskId: notification.taskId,
          notificationType: notification.notificationType,
          success: false,
          error: error.message
        });
      }
    }

    logger.info(`Batch push notification processing complete: ${successCount}/${notifications.length} notifications sent successfully`, {
      expiredSubscriptions
    });

    return {
      success: successCount > 0,
      results,
      summary: {
        totalNotifications: notifications.length,
        successfulNotifications: successCount,
        failedNotifications: notifications.length - successCount,
        expiredSubscriptions
      }
    };
  }

  /**
   * Check if an error indicates a subscription issue
   * @param {Error} error - Error object from webPush
   * @returns {boolean}
   * @private
   */
  isSubscriptionError(error) {
    // Status codes indicating subscription issues:
    // 404 - Not Found (subscription expired)
    // 410 - Gone (subscription no longer valid)
    // 401 - Unauthorized (invalid subscription)
    const subscriptionErrorCodes = [404, 410, 401];
    return subscriptionErrorCodes.includes(error.statusCode);
  }

  /**
   * Calculate retry delay with exponential backoff
   * @param {number} attempt - Current attempt number (1-based)
   * @returns {number} Delay in milliseconds
   * @private
   */
  calculateRetryDelay(attempt) {
    const baseDelay = this.retryDelayMs;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter

    return Math.floor(exponentialDelay + jitter);
  }

  /**
   * Truncate endpoint URL for logging (privacy)
   * @param {string} endpoint - Full endpoint URL
   * @returns {string} Truncated endpoint
   * @private
   */
  truncateEndpoint(endpoint) {
    if (!endpoint) return 'unknown';
    const parts = endpoint.split('/');
    return parts.slice(0, 3).join('/') + '/.../' + parts[parts.length - 1].substring(0, 8) + '...';
  }

  /**
   * Sleep for specified milliseconds
   * @param {number} ms - Milliseconds to sleep
   * @returns {Promise<void>}
   * @private
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get circuit breaker state for monitoring
   * @returns {Object}
   */
  getCircuitBreakerState() {
    return this.circuitBreaker.getState();
  }

  /**
   * Manually reset circuit breaker (admin operation)
   * @returns {Object}
   */
  resetCircuitBreaker() {
    this.circuitBreaker.reset();
    logger.info('Push notification circuit breaker manually reset');
    return this.circuitBreaker.getState();
  }

  /**
   * Get comprehensive service health status
   * @returns {Object}
   */
  getServiceHealth() {
    const circuitBreakerState = this.circuitBreaker.getState();

    return {
      available: this.isAvailable(),
      configured: {
        vapidPublicKey: !!this.vapidPublicKey,
        vapidPrivateKey: !!this.vapidPrivateKey,
        vapidSubject: !!this.vapidSubject
      },
      circuitBreaker: circuitBreakerState,
      config: {
        maxRetries: this.maxRetries,
        retryDelayMs: this.retryDelayMs
      },
      healthy: this.isAvailable() && circuitBreakerState.state !== 'OPEN'
    };
  }
}

// Export singleton instance
module.exports = new PushNotificationService();
