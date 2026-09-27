const emailService = require('./emailService');
const pushNotificationService = require('./pushNotificationService');
const emailTemplateService = require('./emailTemplateService');
const NotificationPreference = require('../models/NotificationPreference');
const notificationCopy = require('./notificationCopy');
const logger = require('../utils/logger');

const NOTIFICATION_TYPE = 'reminder';

/**
 * Deliver one occurrence of a task reminder on the channels it asks for.
 *
 * Channel rules: a reminder's own `channels` pick where it goes, and the
 * account-level switches in NotificationPreference still apply on top —
 * `emailNotificationsEnabled` doubles as the unsubscribe switch from email
 * footers, and push needs a stored browser subscription. A user with no
 * preference document gets email (the model's default) and no push.
 *
 * Deduplication is the caller's job (reminderScheduler claims each
 * occurrence atomically before calling this), so the services' 24h
 * (task, type) duplicate check is skipped: a reminder repeating every few
 * hours would otherwise be silently dropped after its first send.
 *
 * @param {Object} params
 * @param {Object} params.user - { _id, email, displayName }
 * @param {Object} params.task - Lean task document
 * @param {Object|null} params.list - Lean list document, if the task has one
 * @param {Object} params.reminder - The reminder subdocument being delivered
 * @param {Date} params.occurrenceAt - The occurrence being delivered
 * @param {Object|null} params.preference - The user's NotificationPreference, if any
 * @returns {Promise<{ emailSent: boolean, pushSent: boolean, errors: string[] }>}
 */
async function sendReminder({ user, task, list, reminder, occurrenceAt, preference }) {
  const result = { emailSent: false, pushSent: false, errors: [] };
  const userId = user._id.toString();
  const taskId = task._id.toString();
  const metadata = { reminderId: reminder._id.toString(), occurrenceAt };

  const emailAllowed = preference ? preference.emailNotificationsEnabled !== false : true;
  if (reminder.channels?.email && emailAllowed && user.email) {
    try {
      const content = await emailTemplateService.generateTaskNotificationEmail({
        user,
        task: { ...task, dueDate: task.dueAt },
        list,
        notificationType: NOTIFICATION_TYPE,
      });

      const sent = await emailService.sendTaskNotification({
        userId,
        taskId,
        notificationType: NOTIFICATION_TYPE,
        skipDuplicateCheck: true,
        metadata,
        to: user.email,
        subject: content.subject,
        html: content.html,
        text: content.text,
        tags: [{ name: 'priority', value: String(task.priority) }],
      });

      if (sent.success) result.emailSent = true;
      else result.errors.push(`Email failed: ${sent.error}`);
    } catch (error) {
      result.errors.push(`Email error: ${error.message}`);
    }
  }

  const pushAllowed = preference?.browserNotificationsEnabled && preference?.pushSubscription;
  if (reminder.channels?.push && pushAllowed) {
    try {
      const sent = await pushNotificationService.sendTaskPushNotification({
        userId,
        taskId,
        notificationType: NOTIFICATION_TYPE,
        skipDuplicateCheck: true,
        metadata,
        pushSubscription: preference.pushSubscription,
        payload: createPushPayload(task, list),
      });

      if (sent.success) {
        result.pushSent = true;
      } else if (sent.subscriptionExpired) {
        await clearExpiredSubscription(user._id);
        result.errors.push('Push subscription expired');
      } else {
        result.errors.push(`Push failed: ${sent.error}`);
      }
    } catch (error) {
      result.errors.push(`Push error: ${error.message}`);
    }
  }

  if (result.errors.length > 0) {
    logger.warn('Reminder delivered with errors', { userId, taskId, reminderId: metadata.reminderId, errors: result.errors });
  }
  return result;
}

async function clearExpiredSubscription(userId) {
  try {
    await NotificationPreference.findOneAndUpdate(
      { userId },
      { $set: { pushSubscription: null, browserNotificationsEnabled: false } }
    );
    logger.info('Cleared expired push subscription', { userId });
  } catch (error) {
    logger.error('Failed to clear expired subscription', { userId, error: error.message });
  }
}

/**
 * Push payload for a task reminder. The service worker (static/service-worker.js)
 * opens `data.url` on click.
 * @param {Object} task - Task object
 * @param {Object|null} list - List object
 * @returns {Object} Push notification payload
 */
function createPushPayload(task, list) {
  const listName = list ? ` [${list.title}]` : '';

  return {
    title: notificationCopy.pushTitle(NOTIFICATION_TYPE),
    body: `${task.title}${listName}`,
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    tag: `task-${task._id}`,
    requireInteraction: true,
    data: {
      taskId: task._id.toString(),
      taskTitle: task.title,
      notificationType: NOTIFICATION_TYPE,
      dueDate: task.dueAt ? new Date(task.dueAt).toLocaleDateString() : 'No date',
      priority: task.priority,
      url: `/tasks/${task._id}`,
    },
    actions: [
      { action: 'view', title: 'View Task' },
      { action: 'complete', title: 'Mark Complete' },
    ],
    vibrate: [200, 100, 200],
  };
}

module.exports = {
  sendReminder,
  createPushPayload,
};
