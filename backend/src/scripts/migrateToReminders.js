/**
 * One-off migration: global "N days before the due date" notifications ->
 * per-task custom reminders.
 *
 * For every open task that had notifications switched on
 * (notificationEnabled + notificationTimings), each timing becomes a one-off
 * reminder at the same moment the old system targeted: the due date minus
 * 0/1/2 days, at the user's old `notificationTime`, in their old `timezone`.
 * Timings already in the past are dropped. Channels follow the user's old
 * account settings (email; browser push if they had a subscription).
 *
 * Then the retired fields are removed: notificationEnabled,
 * notificationTimings, notificationsSent, lastNotificationSent on tasks, and
 * notificationDays / notificationTime on notification preferences.
 *
 * Note: the old scheduler ignored the per-task switch and reminded about
 * every task with a due date. This migration follows the per-task switch,
 * which is what the task editor showed users, so tasks that never had it on
 * get no reminders.
 *
 * Dry run by default (reports what it would do). --apply to write.
 * Idempotent: migrated tasks no longer carry the old fields, and preferences
 * are only cleaned up after every task is done, so a crashed run can simply
 * be re-run.
 *
 * Usage:
 *   node src/scripts/migrateToReminders.js           # dry run
 *   node src/scripts/migrateToReminders.js --apply
 */
require('dotenv').config();
const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const Task = require('../models/Task');
const NotificationPreference = require('../models/NotificationPreference');
const { isValidTimezone } = require('../services/reminders');

const DAYS_BEFORE = { same_day: 0, '1_day_before': 1, '2_days_before': 2 };
const RETIRED_TASK_FIELDS = ['notificationEnabled', 'notificationTimings', 'notificationsSent', 'lastNotificationSent'];
const RETIRED_PREF_FIELDS = ['notificationDays', 'notificationTime'];
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

/**
 * Reminders equivalent to one legacy task's notification settings. Pure, so
 * it can be unit-tested.
 *
 * @param {Object} task - Raw task document (old fields included)
 * @param {Object|undefined} prefs - Raw NotificationPreference document
 * @param {Date} now
 * @returns {Array} Reminder subdocuments to push onto the task
 */
function remindersForLegacyTask(task, prefs, now) {
  const timings = Array.isArray(task.notificationTimings) ? task.notificationTimings : [];
  if (!task.notificationEnabled || timings.length === 0 || !task.dueAt || task.isCompleted) return [];

  const timezone = isValidTimezone(prefs?.timezone) ? prefs.timezone : 'UTC';
  const time = TIME_PATTERN.test(prefs?.notificationTime || '') ? prefs.notificationTime : '09:00';
  // Due dates are stored as noon UTC on the chosen calendar day.
  const dueDay = DateTime.fromJSDate(new Date(task.dueAt), { zone: 'utc' }).toISODate();
  const push = Boolean(prefs?.browserNotificationsEnabled && prefs?.pushSubscription);
  const email = prefs ? prefs.emailNotificationsEnabled !== false : true;

  return [...new Set(timings)]
    .filter((timing) => timing in DAYS_BEFORE)
    .map((timing) => DateTime.fromISO(`${dueDay}T${time}`, { zone: timezone }).minus({ days: DAYS_BEFORE[timing] }).toJSDate())
    .filter((startAt) => startAt > now)
    .sort((a, b) => a - b)
    .map((startAt) => ({
      _id: new mongoose.Types.ObjectId(),
      startAt,
      timezone,
      repeat: { frequency: 'none', interval: 1, weekdays: [] },
      // A reminder needs at least one channel; the account-level switches
      // still decide delivery, so email is a safe default.
      channels: { email: email || !push, push },
      nextFireAt: startAt,
      lastFiredAt: null,
    }));
}

async function migrate({ apply, now = new Date() }) {
  // Raw collections: the retired fields aren't in the schemas anymore.
  const tasks = Task.collection;
  const prefsCollection = NotificationPreference.collection;

  const prefsByUser = new Map();
  for await (const prefs of prefsCollection.find({})) prefsByUser.set(String(prefs.userId), prefs);

  const legacyFilter = { $or: RETIRED_TASK_FIELDS.map((field) => ({ [field]: { $exists: true } })) };
  const unsetTaskFields = Object.fromEntries(RETIRED_TASK_FIELDS.map((field) => [field, '']));
  const stats = { tasksScanned: 0, tasksWithReminders: 0, remindersCreated: 0, preferencesCleaned: 0 };

  for await (const task of tasks.find(legacyFilter)) {
    stats.tasksScanned += 1;
    const reminders = remindersForLegacyTask(task, prefsByUser.get(String(task.userId)), now);
    if (reminders.length > 0) {
      stats.tasksWithReminders += 1;
      stats.remindersCreated += reminders.length;
    }
    if (apply) {
      await tasks.updateOne(
        { _id: task._id },
        {
          ...(reminders.length > 0 ? { $push: { reminders: { $each: reminders } } } : {}),
          $unset: unsetTaskFields,
        }
      );
    }
  }

  const prefFilter = { $or: RETIRED_PREF_FIELDS.map((field) => ({ [field]: { $exists: true } })) };
  if (apply) {
    const result = await prefsCollection.updateMany(prefFilter, {
      $unset: Object.fromEntries(RETIRED_PREF_FIELDS.map((field) => [field, ''])),
    });
    stats.preferencesCleaned = result.modifiedCount;
  } else {
    stats.preferencesCleaned = await prefsCollection.countDocuments(prefFilter);
  }

  return stats;
}

async function main() {
  const apply = process.argv.includes('--apply');
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is not set.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);
  try {
    const stats = await migrate({ apply });
    const verb = apply ? '' : '[dry run] would have ';
    console.log(`${verb}scanned ${stats.tasksScanned} task(s) with legacy notification fields`);
    console.log(`${verb}created ${stats.remindersCreated} reminder(s) on ${stats.tasksWithReminders} task(s)`);
    console.log(`${verb}cleaned ${stats.preferencesCleaned} notification preference document(s)`);
    if (!apply) console.log('Re-run with --apply to write these changes.');
  } finally {
    await mongoose.disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  });
}

module.exports = { remindersForLegacyTask, migrate };
