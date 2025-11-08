/**
 * Test script to check push notification setup and send a test notification
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const NotificationPreference = require('../models/NotificationPreference');
const pushNotificationService = require('../services/pushNotificationService');

async function testPushNotification() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Get all users with push subscriptions
    const prefs = await NotificationPreference.find({
      browserNotificationsEnabled: true
    }).populate('userId').lean();

    if (prefs.length === 0) {
      console.log('❌ No users with browser notifications enabled found');
      console.log('\nPlease:');
      console.log('1. Go to Settings in your app');
      console.log('2. Enable "Browser/PWA Notifications"');
      console.log('3. Grant permission when prompted');
      console.log('4. Run this script again\n');
      await mongoose.disconnect();
      return;
    }

    console.log(`Found ${prefs.length} user(s) with browser notifications enabled:\n`);

    for (const pref of prefs) {
      console.log('User:', pref.userId?.email);
      console.log('Browser notifications enabled:', pref.browserNotificationsEnabled);
      console.log('Has push subscription:', !!pref.pushSubscription);

      if (pref.pushSubscription) {
        console.log('✅ Push subscription found!');
        console.log('Endpoint:', pref.pushSubscription.endpoint?.substring(0, 60) + '...');

        // Send test notification
        console.log('\nSending test push notification...');

        const testPayload = {
          title: '🔔 Test Notification',
          body: 'This is a test push notification from your Notes & Tasks app!',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
          data: {
            url: '/tasks',
            type: 'test'
          }
        };

        try {
          const result = await pushNotificationService.sendPushNotification(
            pref.pushSubscription,
            testPayload
          );

          if (result.success) {
            console.log('✅ Test notification sent successfully!');
            console.log('Check your browser for the notification.');
          } else {
            console.log('❌ Failed to send notification:', result.error);
          }
        } catch (error) {
          console.error('❌ Error sending notification:', error.message);
        }
      } else {
        console.log('❌ No push subscription found');
        console.log('\nThe subscription might not have been created properly.');
        console.log('Please try:');
        console.log('1. Toggle OFF browser notifications in Settings');
        console.log('2. Toggle it back ON');
        console.log('3. Grant permission when prompted');
      }
      console.log('\n' + '='.repeat(60) + '\n');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

testPushNotification();
