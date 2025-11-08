const mongoose = require('mongoose');

const notificationPreferenceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      unique: true,
    },
    emailNotificationsEnabled: {
      type: Boolean,
      default: true,
    },
    notificationDays: [{
      type: String,
      enum: {
        values: ['same_day', '1_day_before', '2_days_before'],
        message: 'Notification day must be one of: same_day, 1_day_before, 2_days_before'
      },
      default: ['1_day_before']
    }],
    timezone: {
      type: String,
      default: 'UTC',
      validate: {
        validator: function(v) {
          // Basic timezone validation - accepts common timezone formats
          return /^[A-Za-z_\/]+$/.test(v) || v === 'UTC';
        },
        message: 'Please provide a valid timezone'
      }
    },
    notificationTime: {
      type: String,
      default: '09:00',
      validate: {
        validator: function(v) {
          // Validates HH:MM format (24-hour)
          return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: 'Notification time must be in HH:MM format (24-hour, e.g., 09:00, 14:30)'
      }
    },
    browserNotificationsEnabled: {
      type: Boolean,
      default: false,
    },
    pushSubscription: {
      type: Object,
      default: null,
      // Stores the push subscription object for web push notifications
      // Format: { endpoint, keys: { p256dh, auth } }
    },
  },
  {
    timestamps: true,
  }
);

// Indexes - compound index on userId for efficient queries
notificationPreferenceSchema.index({ userId: 1 });

// Transform output
notificationPreferenceSchema.methods.toJSON = function () {
  const preference = this.toObject();
  delete preference.__v;
  return preference;
};

const NotificationPreference = mongoose.model('NotificationPreference', notificationPreferenceSchema);

module.exports = NotificationPreference;