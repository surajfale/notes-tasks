const { Resend } = require('resend');
const logger = require('../utils/logger');
const NotificationLog = require('../models/NotificationLog');
const CircuitBreaker = require('../utils/circuitBreaker');

class EmailService {
  constructor() {
    this.resend = null;
    this.fromEmail = process.env.RESEND_FROM_EMAIL;
    this.fromName = process.env.RESEND_FROM_NAME || 'Notes & Tasks App';
    this.maxRetries = parseInt(process.env.EMAIL_RETRY_ATTEMPTS) || 3;
    this.retryDelayMs = parseInt(process.env.EMAIL_RETRY_DELAY_MS) || 1000;
    this.batchSize = parseInt(process.env.EMAIL_BATCH_SIZE) || 50;
    
    // Initialize circuit breaker for Resend service
    this.circuitBreaker = new CircuitBreaker({
      name: 'ResendEmailService',
      failureThreshold: parseInt(process.env.CIRCUIT_BREAKER_FAILURE_THRESHOLD) || 5,
      successThreshold: parseInt(process.env.CIRCUIT_BREAKER_SUCCESS_THRESHOLD) || 2,
      timeout: parseInt(process.env.CIRCUIT_BREAKER_TIMEOUT_MS) || 60000 // 1 minute
    });
    
    this.initializeResend();
  }

  /**
   * Initialize Resend client
   * @private
   */
  initializeResend() {
    const apiKey = process.env.RESEND_API_KEY;
    
    if (!apiKey) {
      logger.warn('Resend API key not configured - email service disabled');
      return;
    }

    if (!this.fromEmail) {
      logger.warn('Resend from email not configured - email service disabled');
      return;
    }

    try {
      this.resend = new Resend(apiKey);
      logger.info('Resend email service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize Resend client:', error.message);
    }
  }

  /**
   * Check if email service is available
   * @returns {boolean}
   */
  isAvailable() {
    return this.resend !== null;
  }

  /**
   * Send a single email with retry logic
   * @param {Object} emailOptions - Email configuration
   * @param {string|string[]} emailOptions.to - Recipient email(s)
   * @param {string} emailOptions.subject - Email subject
   * @param {string} [emailOptions.text] - Plain text content
   * @param {string} [emailOptions.html] - HTML content
   * @param {string} [emailOptions.replyTo] - Reply-to address
   * @param {Array} [emailOptions.tags] - Email tags for categorization
   * @param {Object} [emailOptions.headers] - Custom headers
   * @param {string} [emailOptions.idempotencyKey] - Unique key to prevent duplicates
   * @returns {Promise<{success: boolean, emailId?: string, error?: string}>}
   */
  async sendEmail(emailOptions) {
    if (!this.isAvailable()) {
      const error = 'Email service is not available - check configuration';
      logger.error(error);
      return { success: false, error };
    }

    // Validate required fields
    if (!emailOptions.to || !emailOptions.subject) {
      const error = 'Missing required fields: to and subject are required';
      logger.error(error);
      return { success: false, error };
    }

    if (!emailOptions.text && !emailOptions.html) {
      const error = 'Missing email content: either text or html is required';
      logger.error(error);
      return { success: false, error };
    }

    const emailPayload = {
      from: `${this.fromName} <${this.fromEmail}>`,
      to: emailOptions.to,
      subject: emailOptions.subject,
      ...(emailOptions.text && { text: emailOptions.text }),
      ...(emailOptions.html && { html: emailOptions.html }),
      ...(emailOptions.replyTo && { replyTo: emailOptions.replyTo }),
      ...(emailOptions.tags && { tags: emailOptions.tags }),
      ...(emailOptions.headers && { headers: emailOptions.headers })
    };

    const requestOptions = {};
    if (emailOptions.idempotencyKey) {
      requestOptions.idempotencyKey = emailOptions.idempotencyKey;
    }

    return await this.sendEmailWithRetry(emailPayload, requestOptions);
  }

  /**
   * Send email with exponential backoff retry logic and circuit breaker protection
   * @param {Object} emailPayload - Resend email payload
   * @param {Object} requestOptions - Request options including idempotency key
   * @returns {Promise<{success: boolean, emailId?: string, error?: string, circuitBreakerOpen?: boolean}>}
   * @private
   */
  async sendEmailWithRetry(emailPayload, requestOptions = {}) {
    // Check circuit breaker before attempting to send
    if (this.circuitBreaker.isOpen()) {
      const cbState = this.circuitBreaker.getState();
      logger.error('Circuit breaker is OPEN - email service unavailable', {
        to: emailPayload.to,
        subject: emailPayload.subject,
        circuitBreakerState: cbState
      });
      
      return {
        success: false,
        error: `Email service temporarily unavailable. Circuit breaker is open. Will retry after ${cbState.nextAttempt}`,
        circuitBreakerOpen: true
      };
    }

    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        logger.debug(`Sending email attempt ${attempt}/${this.maxRetries}`, {
          to: emailPayload.to,
          subject: emailPayload.subject
        });

        // Execute email send through circuit breaker
        const result = await this.circuitBreaker.execute(async () => {
          const { data, error } = await this.resend.emails.send(emailPayload, requestOptions);
          
          if (error) {
            // Create error object for circuit breaker
            const err = new Error(error.message);
            err.name = error.name;
            err.resendError = error;
            throw err;
          }
          
          return data;
        });

        logger.info('Email sent successfully', {
          emailId: result.id,
          to: emailPayload.to,
          subject: emailPayload.subject,
          attempt
        });
        
        return { success: true, emailId: result.id };

      } catch (error) {
        // Check if circuit breaker opened during this attempt
        if (error.circuitBreakerOpen) {
          logger.error('Circuit breaker opened during email send', {
            to: emailPayload.to,
            subject: emailPayload.subject,
            error: error.message,
            nextAttempt: error.nextAttempt
          });
          
          return {
            success: false,
            error: error.message,
            circuitBreakerOpen: true
          };
        }

        // Handle specific error types that should not be retried
        if (error.resendError && this.isNonRetryableError(error.resendError)) {
          logger.error('Non-retryable email error:', {
            error: error.name,
            message: error.message,
            to: emailPayload.to,
            subject: emailPayload.subject
          });
          return { success: false, error: error.message };
        }

        // Log retryable error and continue if we have attempts left
        if (attempt < this.maxRetries) {
          const delay = this.calculateRetryDelay(attempt);
          logger.warn(`Email send failed (attempt ${attempt}), retrying in ${delay}ms`, {
            error: error.name,
            message: error.message,
            to: emailPayload.to,
            nextAttempt: attempt + 1
          });
          await this.sleep(delay);
          continue;
        }

        // Final attempt failed
        logger.error('Email send failed after all retry attempts', {
          error: error.name,
          message: error.message,
          to: emailPayload.to,
          subject: emailPayload.subject,
          attempts: this.maxRetries
        });
        
        return { success: false, error: error.message };
      }
    }
  }

  /**
   * Send task notification email with tracking
   * @param {Object} notificationData - Notification configuration
   * @param {string} notificationData.userId - User ID
   * @param {string} notificationData.taskId - Task ID
   * @param {string} notificationData.notificationType - Type of notification (same_day, 1_day_before, 2_days_before)
   * @param {string|string[]} notificationData.to - Recipient email(s)
   * @param {string} notificationData.subject - Email subject
   * @param {string} [notificationData.text] - Plain text content
   * @param {string} [notificationData.html] - HTML content
   * @param {string} [notificationData.replyTo] - Reply-to address
   * @param {Array} [notificationData.tags] - Email tags for categorization
   * @param {Object} [notificationData.headers] - Custom headers
   * @returns {Promise<{success: boolean, emailId?: string, logId?: string, error?: string}>}
   */
  async sendTaskNotification(notificationData) {
    const { userId, taskId, notificationType, ...emailOptions } = notificationData;

    // Validate required notification fields
    if (!userId || !taskId || !notificationType) {
      const error = 'Missing required notification fields: userId, taskId, and notificationType are required';
      logger.error(error);
      return { success: false, error };
    }

    // Check if notification was already sent recently (prevent duplicates)
    try {
      const alreadySent = await NotificationLog.hasNotificationBeenSent(userId, taskId, notificationType, 24);
      if (alreadySent) {
        const message = `Notification already sent for task ${taskId}, type ${notificationType} within last 24 hours`;
        logger.info(message);
        return { success: false, error: message, duplicate: true };
      }
    } catch (error) {
      logger.error('Error checking for duplicate notifications:', error.message);
      // Continue with sending - don't fail on duplicate check error
    }

    // Generate idempotency key to prevent duplicate sends at Resend level
    const idempotencyKey = `task-${taskId}-${notificationType}-${Date.now()}`;
    emailOptions.idempotencyKey = idempotencyKey;

    // Add notification-specific tags
    const notificationTags = [
      { name: 'type', value: 'task-notification' },
      { name: 'notification-type', value: notificationType },
      { name: 'user-id', value: userId },
      { name: 'task-id', value: taskId }
    ];
    emailOptions.tags = [...(emailOptions.tags || []), ...notificationTags];

    // Send the email
    const emailResult = await this.sendEmail(emailOptions);

    // Log the notification attempt
    let logId = null;
    try {
      const logData = {
        userId,
        taskId,
        notificationType,
        emailId: emailResult.emailId || 'unknown',
        status: emailResult.success ? 'sent' : 'failed',
        errorMessage: emailResult.success ? null : emailResult.error,
        retryCount: 0
      };

      const log = await NotificationLog.logNotification(logData);
      logId = log._id.toString();

      logger.info('Notification logged successfully', {
        logId,
        userId,
        taskId,
        notificationType,
        emailId: emailResult.emailId,
        status: logData.status
      });
    } catch (error) {
      logger.error('Failed to log notification:', {
        error: error.message,
        userId,
        taskId,
        notificationType,
        emailId: emailResult.emailId
      });
      // Don't fail the entire operation if logging fails
    }

    return {
      ...emailResult,
      logId
    };
  }

  /**
   * Send multiple task notifications in batch with tracking
   * @param {Array<Object>} notifications - Array of notification configurations
   * @returns {Promise<{success: boolean, results?: Array, error?: string}>}
   */
  async sendBatchTaskNotifications(notifications) {
    if (!this.isAvailable()) {
      const error = 'Email service is not available - check configuration';
      logger.error(error);
      return { success: false, error };
    }

    if (!Array.isArray(notifications) || notifications.length === 0) {
      const error = 'Invalid notifications array provided';
      logger.error(error);
      return { success: false, error };
    }

    logger.info(`Processing ${notifications.length} task notifications`);

    const results = [];
    let successCount = 0;

    // Process notifications individually to handle tracking properly
    for (let i = 0; i < notifications.length; i++) {
      const notification = notifications[i];
      
      try {
        const result = await this.sendTaskNotification(notification);
        results.push({
          index: i,
          userId: notification.userId,
          taskId: notification.taskId,
          notificationType: notification.notificationType,
          ...result
        });

        if (result.success) {
          successCount++;
        }

        // Add small delay between notifications to respect rate limits
        if (i < notifications.length - 1) {
          await this.sleep(50); // 50ms delay between notifications
        }

      } catch (error) {
        logger.error(`Unexpected error processing notification ${i}:`, error.message);
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

    logger.info(`Batch notification processing complete: ${successCount}/${notifications.length} notifications sent successfully`);

    return {
      success: successCount > 0,
      results,
      summary: {
        totalNotifications: notifications.length,
        successfulNotifications: successCount,
        failedNotifications: notifications.length - successCount
      }
    };
  }

  /**
   * Update notification status (for webhook processing)
   * @param {string} emailId - Email ID from Resend
   * @param {string} status - New status (delivered, bounced, opened, clicked)
   * @param {string} [errorMessage] - Error message if status is failed/bounced
   * @returns {Promise<{success: boolean, updated?: boolean, error?: string}>}
   */
  async updateNotificationStatus(emailId, status, errorMessage = null) {
    try {
      const updatedLog = await NotificationLog.updateNotificationStatus(emailId, status, errorMessage);
      
      if (updatedLog) {
        logger.info('Notification status updated', {
          logId: updatedLog._id,
          emailId,
          status,
          userId: updatedLog.userId,
          taskId: updatedLog.taskId
        });
        return { success: true, updated: true };
      } else {
        logger.warn('No notification log found for email ID', { emailId });
        return { success: true, updated: false };
      }
    } catch (error) {
      logger.error('Failed to update notification status:', {
        error: error.message,
        emailId,
        status
      });
      return { success: false, error: error.message };
    }
  }

  /**
   * Get notification statistics for monitoring
   * @param {Object} filters - Filter options
   * @param {string} [filters.userId] - Filter by user ID
   * @param {Date} [filters.startDate] - Start date for date range
   * @param {Date} [filters.endDate] - End date for date range
   * @param {string} [filters.status] - Filter by status
   * @returns {Promise<{success: boolean, stats?: Object, error?: string}>}
   */
  async getNotificationStats(filters = {}) {
    try {
      const matchStage = {};
      
      if (filters.userId) {
        matchStage.userId = filters.userId;
      }
      
      if (filters.startDate || filters.endDate) {
        matchStage.sentAt = {};
        if (filters.startDate) {
          matchStage.sentAt.$gte = filters.startDate;
        }
        if (filters.endDate) {
          matchStage.sentAt.$lte = filters.endDate;
        }
      }
      
      if (filters.status) {
        matchStage.status = filters.status;
      }

      const stats = await NotificationLog.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: null,
            totalNotifications: { $sum: 1 },
            byStatus: {
              $push: {
                status: '$status',
                count: 1
              }
            },
            byType: {
              $push: {
                type: '$notificationType',
                count: 1
              }
            },
            avgRetryCount: { $avg: '$retryCount' },
            maxRetryCount: { $max: '$retryCount' }
          }
        },
        {
          $project: {
            _id: 0,
            totalNotifications: 1,
            statusBreakdown: {
              $arrayToObject: {
                $map: {
                  input: {
                    $setUnion: ['$byStatus.status']
                  },
                  as: 'status',
                  in: {
                    k: '$$status',
                    v: {
                      $size: {
                        $filter: {
                          input: '$byStatus',
                          cond: { $eq: ['$$this.status', '$$status'] }
                        }
                      }
                    }
                  }
                }
              }
            },
            typeBreakdown: {
              $arrayToObject: {
                $map: {
                  input: {
                    $setUnion: ['$byType.type']
                  },
                  as: 'type',
                  in: {
                    k: '$$type',
                    v: {
                      $size: {
                        $filter: {
                          input: '$byType',
                          cond: { $eq: ['$$this.type', '$$type'] }
                        }
                      }
                    }
                  }
                }
              }
            },
            avgRetryCount: { $round: ['$avgRetryCount', 2] },
            maxRetryCount: 1
          }
        }
      ]);

      const result = stats[0] || {
        totalNotifications: 0,
        statusBreakdown: {},
        typeBreakdown: {},
        avgRetryCount: 0,
        maxRetryCount: 0
      };

      return { success: true, stats: result };
    } catch (error) {
      logger.error('Failed to get notification stats:', error.message);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send multiple emails in batch
   * @param {Array<Object>} emails - Array of email configurations
   * @returns {Promise<{success: boolean, results?: Array, error?: string}>}
   */
  async sendBatchEmails(emails) {
    if (!this.isAvailable()) {
      const error = 'Email service is not available - check configuration';
      logger.error(error);
      return { success: false, error };
    }

    if (!Array.isArray(emails) || emails.length === 0) {
      const error = 'Invalid emails array provided';
      logger.error(error);
      return { success: false, error };
    }

    // Process emails in batches to respect API limits
    const results = [];
    const batches = this.chunkArray(emails, this.batchSize);

    logger.info(`Processing ${emails.length} emails in ${batches.length} batches`);

    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      
      try {
        // Prepare batch payload
        const batchPayload = batch.map(email => ({
          from: `${this.fromName} <${this.fromEmail}>`,
          to: email.to,
          subject: email.subject,
          ...(email.text && { text: email.text }),
          ...(email.html && { html: email.html }),
          ...(email.replyTo && { replyTo: email.replyTo }),
          ...(email.tags && { tags: email.tags }),
          ...(email.headers && { headers: email.headers })
        }));

        logger.debug(`Sending batch ${batchIndex + 1}/${batches.length} with ${batch.length} emails`);

        const { data, error } = await this.resend.batch.send(batchPayload, {
          batchValidation: 'lenient' // Continue processing even if some emails fail validation
        });

        if (error) {
          logger.error(`Batch ${batchIndex + 1} failed:`, error.message);
          results.push({ batchIndex, success: false, error: error.message });
        } else {
          logger.info(`Batch ${batchIndex + 1} sent successfully`, {
            emailIds: data.data.map(item => item.id)
          });
          results.push({ 
            batchIndex, 
            success: true, 
            emailIds: data.data.map(item => item.id) 
          });
        }

        // Add delay between batches to respect rate limits
        if (batchIndex < batches.length - 1) {
          await this.sleep(100); // 100ms delay between batches
        }

      } catch (error) {
        logger.error(`Unexpected error in batch ${batchIndex + 1}:`, error.message);
        results.push({ batchIndex, success: false, error: error.message });
      }
    }

    const successfulBatches = results.filter(r => r.success).length;
    const totalEmails = results.reduce((sum, r) => {
      return sum + (r.emailIds ? r.emailIds.length : 0);
    }, 0);

    logger.info(`Batch processing complete: ${successfulBatches}/${batches.length} batches successful, ${totalEmails} emails sent`);

    return {
      success: successfulBatches > 0,
      results,
      summary: {
        totalBatches: batches.length,
        successfulBatches,
        totalEmailsSent: totalEmails
      }
    };
  }

  /**
   * Check if an error should not be retried
   * @param {Object} error - Resend error object
   * @returns {boolean}
   * @private
   */
  isNonRetryableError(error) {
    const nonRetryableErrors = [
      'validation_error',
      'missing_required_field',
      'invalid_parameter',
      'not_found',
      'forbidden'
    ];
    
    return nonRetryableErrors.includes(error.name);
  }

  /**
   * Calculate retry delay with exponential backoff
   * @param {number} attempt - Current attempt number (1-based)
   * @returns {number} Delay in milliseconds
   * @private
   */
  calculateRetryDelay(attempt) {
    // Exponential backoff: baseDelay * (2 ^ (attempt - 1))
    // With jitter to prevent thundering herd
    const baseDelay = this.retryDelayMs;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 0.1 * exponentialDelay; // 10% jitter
    
    return Math.floor(exponentialDelay + jitter);
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
   * Split array into chunks of specified size
   * @param {Array} array - Array to chunk
   * @param {number} size - Chunk size
   * @returns {Array<Array>}
   * @private
   */
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Get email delivery status (for monitoring)
   * @param {string} emailId - Email ID from Resend
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async getEmailStatus(emailId) {
    if (!this.isAvailable()) {
      return { success: false, error: 'Email service is not available' };
    }

    try {
      const { data, error } = await this.resend.emails.get(emailId);
      
      if (error) {
        logger.error('Failed to get email status:', error.message);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (error) {
      logger.error('Unexpected error getting email status:', error.message);
      return { success: false, error: error.message };
    }
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
    logger.info('Circuit breaker manually reset');
    return this.circuitBreaker.getState();
  }

  /**
   * Send welcome email to new user
   * @param {Object} userData - User data
   * @param {string} userData.email - User email
   * @param {string} userData.displayName - User display name
   * @returns {Promise<{success: boolean, emailId?: string, error?: string}>}
   */
  async sendWelcomeEmail(userData) {
    if (!this.isAvailable()) {
      logger.warn('Email service not available, skipping welcome email', {
        email: userData.email
      });
      return { success: false, error: 'Email service not available' };
    }

    try {
      const emailTemplateService = require('./emailTemplateService');
      
      // Generate email content
      const emailContent = await emailTemplateService.generateWelcomeEmail({
        user: userData
      });

      // Send the email
      const emailOptions = {
        to: userData.email,
        subject: emailContent.subject,
        html: emailContent.html,
        text: emailContent.text,
        tags: [
          { name: 'type', value: 'welcome' },
          { name: 'user-email', value: userData.email }
        ]
      };

      const result = await this.sendEmail(emailOptions);

      if (result.success) {
        logger.info('Welcome email sent successfully', {
          email: userData.email,
          emailId: result.emailId
        });
      } else {
        logger.error('Failed to send welcome email', {
          email: userData.email,
          error: result.error
        });
      }

      return result;

    } catch (error) {
      logger.error('Error sending welcome email:', {
        error: error.message,
        email: userData.email
      });
      return {
        success: false,
        error: error.message
      };
    }
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
        apiKey: !!process.env.RESEND_API_KEY,
        fromEmail: !!this.fromEmail
      },
      circuitBreaker: circuitBreakerState,
      config: {
        maxRetries: this.maxRetries,
        retryDelayMs: this.retryDelayMs,
        batchSize: this.batchSize
      },
      healthy: this.isAvailable() && circuitBreakerState.state !== 'OPEN'
    };
  }
}

// Export singleton instance
module.exports = new EmailService();