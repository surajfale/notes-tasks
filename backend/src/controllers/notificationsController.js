const NotificationPreference = require('../models/NotificationPreference');
const pushNotificationService = require('../services/pushNotificationService');
const logger = require('../utils/logger');

// @desc    Get user's notification preferences
// @route   GET /api/notifications/preferences
// @access  Private
const getPreferences = async (req, res, next) => {
  try {
    let preferences = await NotificationPreference.findOne({
      userId: req.user._id,
    });

    // If no preferences exist, create default ones
    if (!preferences) {
      preferences = await NotificationPreference.create({
        userId: req.user._id,
        emailNotificationsEnabled: true,
        notificationDays: ['1_day_before'],
        timezone: 'UTC',
      });
    }

    res.json(preferences);
  } catch (error) {
    next(error);
  }
};

// @desc    Update user's notification preferences
// @route   PUT /api/notifications/preferences
// @access  Private
const updatePreferences = async (req, res, next) => {
  try {
    const {
      emailNotificationsEnabled,
      browserNotificationsEnabled,
      notificationDays,
      timezone,
      notificationTime
    } = req.body;

    let preferences = await NotificationPreference.findOne({
      userId: req.user._id,
    });

    if (!preferences) {
      // Create new preferences if they don't exist
      preferences = await NotificationPreference.create({
        userId: req.user._id,
        emailNotificationsEnabled: emailNotificationsEnabled !== undefined ? emailNotificationsEnabled : true,
        browserNotificationsEnabled: browserNotificationsEnabled !== undefined ? browserNotificationsEnabled : false,
        notificationDays: notificationDays || ['1_day_before'],
        timezone: timezone || 'UTC',
        notificationTime: notificationTime || '09:00',
      });
    } else {
      // Update existing preferences
      if (emailNotificationsEnabled !== undefined) {
        preferences.emailNotificationsEnabled = emailNotificationsEnabled;
      }
      if (browserNotificationsEnabled !== undefined) {
        preferences.browserNotificationsEnabled = browserNotificationsEnabled;
      }
      if (notificationDays !== undefined) {
        preferences.notificationDays = notificationDays;
      }
      if (timezone !== undefined) {
        preferences.timezone = timezone;
      }
      if (notificationTime !== undefined) {
        preferences.notificationTime = notificationTime;
      }

      await preferences.save();
    }

    res.json(preferences);
  } catch (error) {
    next(error);
  }
};

// @desc    Update push subscription for browser notifications
// @route   PUT /api/notifications/push-subscription
// @access  Private
const updatePushSubscription = async (req, res, next) => {
  try {
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint) {
      return res.status(400).json({
        success: false,
        message: 'Invalid push subscription object'
      });
    }

    let preferences = await NotificationPreference.findOne({
      userId: req.user._id,
    });

    if (!preferences) {
      // Create new preferences with push subscription
      preferences = await NotificationPreference.create({
        userId: req.user._id,
        emailNotificationsEnabled: true,
        browserNotificationsEnabled: true,
        notificationDays: ['1_day_before'],
        timezone: 'UTC',
        pushSubscription: subscription
      });
    } else {
      // Update existing preferences
      preferences.pushSubscription = subscription;
      preferences.browserNotificationsEnabled = true;
      await preferences.save();
    }

    logger.info('Push subscription updated', {
      userId: req.user._id,
      endpoint: subscription.endpoint.substring(0, 50) + '...'
    });

    res.json(preferences);
  } catch (error) {
    logger.error('Error updating push subscription:', {
      userId: req.user._id,
      error: error.message
    });
    next(error);
  }
};

// @desc    Remove push subscription (unsubscribe)
// @route   DELETE /api/notifications/push-subscription
// @access  Private
const removePushSubscription = async (req, res, next) => {
  try {
    const preferences = await NotificationPreference.findOne({
      userId: req.user._id,
    });

    if (!preferences) {
      return res.status(404).json({
        success: false,
        message: 'Notification preferences not found'
      });
    }

    preferences.pushSubscription = null;
    preferences.browserNotificationsEnabled = false;
    await preferences.save();

    logger.info('Push subscription removed', {
      userId: req.user._id
    });

    res.json(preferences);
  } catch (error) {
    logger.error('Error removing push subscription:', {
      userId: req.user._id,
      error: error.message
    });
    next(error);
  }
};

// @desc    Get VAPID public key for push notifications
// @route   GET /api/notifications/vapid-public-key
// @access  Private
const getVapidPublicKey = async (req, res, next) => {
  try {
    const publicKey = pushNotificationService.getPublicKey();

    if (!publicKey) {
      return res.status(503).json({
        success: false,
        message: 'Push notification service is not configured. Please contact the administrator.'
      });
    }

    res.json({
      success: true,
      publicKey
    });
  } catch (error) {
    logger.error('Error fetching VAPID public key:', error);
    next(error);
  }
};

module.exports = {
  getPreferences,
  updatePreferences,
  updatePushSubscription,
  removePushSubscription,
  getVapidPublicKey,
};