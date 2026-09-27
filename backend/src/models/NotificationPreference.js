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