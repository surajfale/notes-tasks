/**
 * Per-minute reminder delivery.
 *
 * Every tick finds reminders whose `nextFireAt` has arrived on open tasks,
 * and for each one:
 *   1. computes the following occurrence,
 *   2. atomically claims the due occurrence by advancing `nextFireAt` only if
 *      it still holds the value we read (so overlapping ticks or several
 *      server instances can never both send it — at-most-once delivery),
 *   3. sends it via notificationProcessor.sendReminder, unless it was missed
 *      by more than MISSED_GRACE_MS (server downtime, or a completed task
 *      being reopened), in which case it's skipped rather than sent late.
 */

const Task = require('../models/Task');
const List = require('../models/List');
const User = require('../models/User');
const NotificationPreference = require('../models/NotificationPreference');
const { computeNextFireAt } = require('./reminders');
const { sendReminder } = require('./notificationProcessor');
const logger = require('../utils/logger');

const MISSED_GRACE_MS = 60 * 60 * 1000;
// Tasks handled per tick; anything beyond is picked up next minute.
const BATCH_SIZE = 200;

let running = false;

/**
 * Run one scheduler tick. Safe to call concurrently (a tick already in
 * progress in this process makes the new call a no-op; across processes the
 * atomic claim prevents double sends).
 *
 * @param {Date} [now]
 * @returns {Promise<{ due: number, sent: number, skipped: number, failed: number }>}
 */
async function runDueReminders(now = new Date()) {
  const summary = { due: 0, sent: 0, skipped: 0, failed: 0 };
  if (running) return summary;
  running = true;

  try {
    const tasks = await Task.find({
      isCompleted: false,
      reminders: { $elemMatch: { nextFireAt: { $ne: null, $lte: now } } },
    })
      .limit(BATCH_SIZE)
      .lean();

    const context = createContext();

    for (const task of tasks) {
      for (const reminder of task.reminders) {
        if (!reminder.nextFireAt || reminder.nextFireAt > now) continue;
        summary.due += 1;

        const outcome = await handleDueReminder(task, reminder, now, context);
        summary[outcome] += 1;
      }
    }

    if (summary.due > 0) logger.info('Reminder tick complete', summary);
    return summary;
  } finally {
    running = false;
  }
}

/**
 * @returns {Promise<'sent'|'skipped'|'failed'>}
 */
async function handleDueReminder(task, reminder, now, context) {
  const occurrenceAt = reminder.nextFireAt;
  // lastFiredAt = now (not occurrenceAt) so the next occurrence is always
  // strictly after this tick, even if several were missed.
  const following = computeNextFireAt({ ...reminder, lastFiredAt: now }, now);

  const claim = await Task.updateOne(
    {
      _id: task._id,
      isCompleted: false,
      reminders: { $elemMatch: { _id: reminder._id, nextFireAt: occurrenceAt } },
    },
    { $set: { 'reminders.$.nextFireAt': following, 'reminders.$.lastFiredAt': now } }
  );
  // Someone else claimed it, or the task was edited/completed since we read it.
  if (claim.modifiedCount !== 1) return 'skipped';

  if (now - occurrenceAt > MISSED_GRACE_MS) {
    logger.info('Skipping stale reminder occurrence', {
      taskId: task._id,
      reminderId: reminder._id,
      occurrenceAt,
    });
    return 'skipped';
  }

  try {
    const [user, preference, list] = await Promise.all([
      context.user(task.userId),
      context.preference(task.userId),
      task.listId ? context.list(task.userId, task.listId) : null,
    ]);
    if (!user) return 'skipped';

    const result = await sendReminder({ user, task, list, reminder, occurrenceAt, preference });
    if (result.emailSent || result.pushSent) return 'sent';
    // Nothing sent and nothing failed: every requested channel is switched
    // off at the account level (e.g. unsubscribed from email).
    return result.errors.length > 0 ? 'failed' : 'skipped';
  } catch (error) {
    logger.error('Failed to deliver reminder', {
      taskId: task._id,
      reminderId: reminder._id,
      error: error.message,
    });
    return 'failed';
  }
}

// Per-tick memoized lookups, so a user with many due reminders is fetched once.
function createContext() {
  const cache = new Map();
  const memo = (key, load) => {
    if (!cache.has(key)) cache.set(key, load());
    return cache.get(key);
  };

  return {
    user: (userId) => memo(`user:${userId}`, () => User.findById(userId).select('email displayName').lean()),
    preference: (userId) => memo(`pref:${userId}`, () => NotificationPreference.findOne({ userId }).lean()),
    // Scoped by userId as well as id: a task's listId is client-supplied.
    list: (userId, listId) => memo(`list:${listId}`, () => List.findOne({ _id: listId, userId }).lean()),
  };
}

module.exports = {
  runDueReminders,
  MISSED_GRACE_MS,
};
