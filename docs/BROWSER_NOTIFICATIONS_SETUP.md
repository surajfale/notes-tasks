# Browser Push Notifications Setup Guide

This guide explains how to set up and use browser push notifications for the Notes & Tasks application.

## Overview

The application now supports two notification channels:
- **Email Notifications**: Sent via Resend email service
- **Browser Push Notifications**: Sent via Web Push API

Users can enable either or both channels based on their preferences.

## Backend Setup

### 1. Install Dependencies

The `web-push` package has already been installed:

```bash
cd backend
npm install
```

### 2. Generate VAPID Keys

VAPID (Voluntary Application Server Identification) keys are required for Web Push notifications. Generate them using the provided script:

```bash
node src/scripts/generateVapidKeys.js
```

This will output something like:

```
Generating VAPID keys for Web Push notifications...

VAPID Keys generated successfully!

Add these to your .env file:

VAPID_PUBLIC_KEY=BKxJz...
VAPID_PRIVATE_KEY=abc123...

Also add your contact email:
VAPID_SUBJECT=mailto:your-email@example.com

Note: Keep the private key secret and never commit it to version control!
```

### 3. Configure Environment Variables

Add the generated VAPID keys to your `.env` file:

```bash
# Push Notification Settings (Web Push)
VAPID_PUBLIC_KEY=BKxJz... # Your generated public key
VAPID_PRIVATE_KEY=abc123... # Your generated private key
VAPID_SUBJECT=mailto:admin@yourdomain.com # Your contact email
PUSH_RETRY_ATTEMPTS=3
PUSH_RETRY_DELAY_MS=1000
```

### 4. Restart the Backend

After adding the environment variables, restart your backend server:

```bash
npm run dev
```

## Frontend Setup

### 1. Service Worker

The service worker (`frontend/static/service-worker.js`) has been updated with push notification handlers. It automatically:
- Receives and displays push notifications
- Handles notification clicks
- Manages notification actions (view task, mark complete)
- Handles push subscription changes

### 2. Push Notification Manager

The push notification manager (`frontend/src/lib/services/pushNotificationManager.ts`) provides methods to:
- Subscribe to push notifications
- Unsubscribe from push notifications
- Check subscription status
- Handle permission requests

## User Flow

### Enabling Browser Notifications

1. **Navigate to Settings**: User goes to the Settings page
2. **Enable Browser Notifications**: Toggle the "Browser Notifications" option
3. **Grant Permission**: Browser prompts for notification permission
4. **Subscribe**: If permission granted, the app subscribes to push notifications
5. **Confirmation**: Subscription is saved to the server

### Receiving Notifications

When a task is due:

1. **Scheduler Runs**: Backend cron job checks for tasks requiring notification
2. **User Preferences**: Checks if user has email and/or browser notifications enabled
3. **Send Notifications**:
   - Email sent if `emailNotificationsEnabled: true`
   - Push notification sent if `browserNotificationsEnabled: true` and subscription exists
4. **Deduplication**: Prevents duplicate notifications within 24 hours per channel
5. **Logging**: All notifications are logged in the database

### Notification Actions

When a push notification is received, users can:
- **Click notification**: Opens the task details page
- **Click "View Task"**: Same as clicking notification
- **Click "Mark Complete"**: Marks the task as complete (simplified, needs auth token)
- **Dismiss**: Close the notification

## Architecture

### Backend Components

1. **pushNotificationService.js**: Core service for sending push notifications
   - Manages VAPID configuration
   - Sends push notifications via Web Push API
   - Handles retry logic and circuit breaker
   - Tracks expired subscriptions

2. **notificationProcessor.js**: Enhanced to support both channels
   - Checks user preferences for each channel
   - Sends to both email and push if enabled
   - Handles errors independently per channel
   - Clears expired push subscriptions

3. **notificationScheduler.js**: Updated scheduler
   - Queries users with either email OR browser notifications enabled
   - Passes user preferences to processor

4. **NotificationLog Model**: Enhanced with channel tracking
   - Stores separate logs for email and push
   - Supports channel-specific duplicate detection
   - Tracks metadata (subscription expiration, circuit breaker state)

### Frontend Components

1. **pushNotificationManager.ts**: Subscription management
   - Handles browser permission requests
   - Subscribes/unsubscribes from push
   - Communicates with backend API
   - Converts VAPID keys to proper format

2. **service-worker.js**: Push event handling
   - Receives push events from the browser
   - Displays notifications
   - Handles notification clicks and actions
   - Manages subscription changes

3. **notificationsRepository.ts**: API communication
   - Updates push subscriptions
   - Removes subscriptions
   - Fetches VAPID public key

## API Endpoints

### Get VAPID Public Key
```
GET /api/notifications/vapid-public-key
```
Returns the VAPID public key needed for browser subscription.

### Update Push Subscription
```
PUT /api/notifications/push-subscription
Body: { subscription: PushSubscription }
```
Saves the user's push subscription to the database.

### Remove Push Subscription
```
DELETE /api/notifications/push-subscription
```
Removes the user's push subscription (unsubscribe).

### Update Notification Preferences
```
PUT /api/notifications/preferences
Body: {
  emailNotificationsEnabled: boolean,
  browserNotificationsEnabled: boolean,
  notificationDays: string[],
  timezone: string,
  notificationTime: string
}
```
Updates all notification preferences including browser notifications.

## Database Schema

### NotificationPreference Model
```javascript
{
  userId: ObjectId,
  emailNotificationsEnabled: Boolean,
  browserNotificationsEnabled: Boolean,
  notificationDays: [String],
  timezone: String,
  notificationTime: String,
  pushSubscription: Object // { endpoint, keys: { p256dh, auth } }
}
```

### NotificationLog Model
```javascript
{
  userId: ObjectId,
  taskId: ObjectId,
  notificationType: String,
  channel: String, // 'email' or 'push'
  emailId: String, // Only for email
  endpoint: String, // Only for push (truncated)
  status: String,
  metadata: Object,
  errorMessage: String,
  retryCount: Number,
  sentAt: Date
}
```

## Testing

### Test Browser Notifications

1. **Enable in Settings**: Go to Settings and enable browser notifications
2. **Grant Permission**: Allow notifications when prompted
3. **Create Test Task**: Create a task with a due date tomorrow
4. **Wait or Trigger**: Either wait for the cron job or manually trigger the scheduler
5. **Check Notification**: You should receive a browser notification

### Test Notification Manager

```javascript
import { pushNotificationManager } from '$lib/services/pushNotificationManager';

// Initialize
await pushNotificationManager.initialize();

// Check if supported
const isSupported = pushNotificationManager.isSupported();

// Request permission
const permission = await pushNotificationManager.requestPermission();

// Subscribe
const subscription = await pushNotificationManager.subscribe();

// Check subscription status
const isSubscribed = await pushNotificationManager.isSubscribed();

// Show test notification
await pushNotificationManager.showTestNotification();

// Unsubscribe
await pushNotificationManager.unsubscribe();
```

## Troubleshooting

### Push Notifications Not Working

1. **Check VAPID Keys**: Ensure keys are properly configured in `.env`
2. **Check Permission**: Verify browser granted notification permission
3. **Check Subscription**: Verify subscription exists in database
4. **Check Service Worker**: Ensure service worker is registered and active
5. **Check Logs**: Review backend logs for push notification errors
6. **Check Browser**: Some browsers (Safari) have limited push support

### Subscription Expired

When a subscription expires:
1. Backend detects the error when sending
2. Clears the expired subscription from database
3. Sets `browserNotificationsEnabled: false`
4. User needs to re-enable and grant permission again

### Circuit Breaker Tripped

If too many push notifications fail:
1. Circuit breaker opens automatically
2. Push notifications are temporarily blocked
3. Wait for the timeout period (default 60 seconds)
4. Circuit breaker will attempt to close after timeout
5. Manually reset via admin API if needed

## Security Considerations

1. **VAPID Private Key**: Never commit to version control
2. **Permission Required**: Browser must grant permission before subscribing
3. **User Consent**: Only subscribe users who explicitly enable the feature
4. **Endpoint Privacy**: Store only truncated endpoints in logs
5. **Authentication**: All API endpoints require authentication

## Browser Support

Push notifications are supported in:
- Chrome 50+ (desktop and Android)
- Firefox 44+
- Edge 17+
- Opera 37+
- Safari 16+ (macOS 13+)

**Note**: Safari support is limited and may require additional configuration.

## Performance

- **Circuit Breaker**: Prevents cascading failures
- **Retry Logic**: Automatically retries failed notifications
- **Batch Processing**: Processes multiple notifications efficiently
- **Deduplication**: Prevents sending duplicate notifications
- **Logging**: Tracks all notification attempts for monitoring

## Future Enhancements

Potential improvements:
- [ ] Rich notifications with images
- [ ] Notification grouping
- [ ] Custom notification sounds
- [ ] Per-task notification preferences
- [ ] Notification history UI
- [ ] Analytics dashboard
- [ ] A/B testing for notification content
