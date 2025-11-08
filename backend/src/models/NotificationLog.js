const mongoose = require('mongoose');

const notificationLogSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task',
      required: [true, 'Task ID is required'],
      index: true,
    },
    notificationType: {
      type: String,
      required: [true, 'Notification type is required'],
      enum: {
        values: ['same_day', '1_day_before', '2_days_before', 'overdue'],
        message: 'Notification type must be one of: same_day, 1_day_before, 2_days_before, overdue'
      },
      index: true,
    },
    sentAt: {
      type: Date,
      required: [true, 'Sent date is required'],
      default: Date.now,
      index: true,
    },
    channel: {
      type: String,
      required: [true, 'Notification channel is required'],
      enum: {
        values: ['email', 'push'],
        message: 'Channel must be one of: email, push'
      },
      default: 'email',
      index: true,
    },
    emailId: {
      type: String,
      trim: true,
      // Only required for email notifications
    },
    endpoint: {
      type: String,
      trim: true,
      // Only for push notifications - stores truncated endpoint for reference
    },
    status: {
      type: String,
      required: [true, 'Status is required'],
      enum: {
        values: ['sent', 'failed', 'bounced', 'delivered', 'opened', 'clicked'],
        message: 'Status must be one of: sent, failed, bounced, delivered, opened, clicked'
      },
      default: 'sent',
      index: true,
    },
    metadata: {
      type: Object,
      default: {},
      // Additional metadata (subscriptionExpired, circuitBreakerOpen, etc.)
    },
    errorMessage: {
      type: String,
      trim: true,
      maxlength: [1000, 'Error message cannot exceed 1000 characters'],
    },
    retryCount: {
      type: Number,
      default: 0,
      min: [0, 'Retry count cannot be negative'],
      max: [5, 'Maximum retry count is 5'],
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient querying and duplicate prevention
notificationLogSchema.index({ userId: 1, taskId: 1, notificationType: 1, channel: 1 });
notificationLogSchema.index({ userId: 1, sentAt: -1 });
notificationLogSchema.index({ status: 1, sentAt: -1 });
notificationLogSchema.index({ channel: 1, sentAt: -1 });
notificationLogSchema.index({ emailId: 1 }, { sparse: true });

// Index for cleanup operations (remove old logs)
notificationLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 }); // 90 days TTL

// Static method to check if notification already sent
notificationLogSchema.statics.hasNotificationBeenSent = async function(userId, taskId, notificationType, withinHours = 24, channel = null) {
  const cutoffDate = new Date(Date.now() - (withinHours * 60 * 60 * 1000));

  const query = {
    userId,
    taskId,
    notificationType,
    status: { $in: ['sent', 'delivered', 'opened', 'clicked'] },
    sentAt: { $gte: cutoffDate }
  };

  // If channel is specified, check for that specific channel
  if (channel) {
    query.channel = channel;
  }

  const existingLog = await this.findOne(query);

  return !!existingLog;
};

// Static method to log notification attempt
notificationLogSchema.statics.logNotification = async function(notificationData) {
  const {
    userId,
    taskId,
    notificationType,
    channel = 'email',
    emailId = null,
    endpoint = null,
    status = 'sent',
    errorMessage = null,
    retryCount = 0,
    metadata = {}
  } = notificationData;

  const log = new this({
    userId,
    taskId,
    notificationType,
    channel,
    emailId,
    endpoint,
    status,
    errorMessage,
    retryCount,
    metadata,
    sentAt: new Date()
  });

  return await log.save();
};

// Static method to update notification status (for webhook updates)
notificationLogSchema.statics.updateNotificationStatus = async function(emailId, status, errorMessage = null) {
  return await this.findOneAndUpdate(
    { emailId },
    { 
      status,
      ...(errorMessage && { errorMessage }),
      updatedAt: new Date()
    },
    { new: true }
  );
};

// Transform output
notificationLogSchema.methods.toJSON = function () {
  const log = this.toObject();
  delete log.__v;
  return log;
};

const NotificationLog = mongoose.model('NotificationLog', notificationLogSchema);

module.exports = NotificationLog;