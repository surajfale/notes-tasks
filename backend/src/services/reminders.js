/**
 * Per-task reminders: recurrence math and input handling.
 *
 * A reminder is stored on its Task (see models/Task.js) as a first
 * occurrence (`startAt`), the IANA timezone it was set in, a repeat rule and
 * the channels to deliver on. The scheduler (reminderScheduler.js) only ever
 * looks at the server-computed `nextFireAt`; this module is what computes it.
 *
 * Repeats are evaluated on the wall clock of the reminder's own timezone, so
 * "daily at 09:00" stays at 09:00 local across DST changes. `hourly` is the
 * exception: "every N hours" is an absolute interval.
 *
 * Everything here is pure (no DB access) so it can be unit-tested directly.
 */

const { DateTime, IANAZone } = require('luxon');

const FREQUENCIES = ['none', 'hourly', 'daily', 'weekly', 'monthly'];
const MAX_REMINDERS_PER_TASK = 10;

// Upper bound for `interval` per frequency ("every N <unit>").
const MAX_INTERVAL = {
  none: 1,
  hourly: 168, // a week
  daily: 365,
  weekly: 52,
  monthly: 24,
};

// Safety valve for the search loops below; real inputs converge in a few
// iterations because each loop starts from an estimated index.
const MAX_ITERATIONS = 1000;

function isValidTimezone(timezone) {
  return typeof timezone === 'string' && IANAZone.isValidZone(timezone);
}

/**
 * Earliest occurrence of `reminder` at or after `after`, or null if there is
 * none (a one-off reminder whose time has passed).
 *
 * @param {{ startAt: Date, timezone: string, repeat: { frequency: string, interval?: number, weekdays?: number[] } }} reminder
 * @param {Date} after
 * @returns {Date|null}
 */
function nextOccurrence(reminder, after) {
  const startMs = new Date(reminder.startAt).getTime();
  const afterMs = after.getTime();
  const { frequency = 'none' } = reminder.repeat || {};
  const interval = Math.max(1, Math.floor(reminder.repeat?.interval || 1));

  if (frequency === 'none') {
    return startMs >= afterMs ? new Date(startMs) : null;
  }

  if (frequency === 'hourly') {
    if (afterMs <= startMs) return new Date(startMs);
    const stepMs = interval * 60 * 60 * 1000;
    const steps = Math.ceil((afterMs - startMs) / stepMs);
    return new Date(startMs + steps * stepMs);
  }

  const zone = isValidTimezone(reminder.timezone) ? reminder.timezone : 'UTC';
  const start = DateTime.fromMillis(startMs, { zone });
  const afterInZone = DateTime.fromMillis(afterMs, { zone });

  if (frequency === 'daily' || frequency === 'monthly') {
    const unit = frequency === 'daily' ? 'days' : 'months';
    // Always offset from `start` (not from the previous occurrence) so a
    // monthly reminder on the 31st lands on each month's last day without
    // drifting to the 28th after February.
    const elapsed = Math.max(0, Math.floor(afterInZone.diff(start, unit).as(unit)));
    let k = Math.max(0, Math.floor(elapsed / interval) - 1);
    for (let i = 0; i < MAX_ITERATIONS; i += 1, k += 1) {
      const candidate = start.plus({ [unit]: k * interval });
      if (candidate.toMillis() >= afterMs) return candidate.toJSDate();
    }
    return null;
  }

  if (frequency === 'weekly') {
    const weekdays = normalizeWeekdays(reminder.repeat?.weekdays, start.weekday);
    const firstWeek = start.startOf('week'); // ISO week: Monday
    const elapsedWeeks = Math.max(0, Math.floor(afterInZone.diff(firstWeek, 'weeks').as('weeks')));
    let week = Math.max(0, Math.floor(elapsedWeeks / interval) - 1) * interval;
    for (let i = 0; i < MAX_ITERATIONS; i += 1, week += interval) {
      const weekStart = firstWeek.plus({ weeks: week });
      for (const weekday of weekdays) {
        const candidate = weekStart.plus({ days: weekday - 1 }).set({
          hour: start.hour,
          minute: start.minute,
          second: start.second,
          millisecond: 0,
        });
        const ms = candidate.toMillis();
        if (ms >= startMs && ms >= afterMs) return candidate.toJSDate();
      }
    }
    return null;
  }

  return null;
}

/**
 * When a reminder should next fire, given the current time and when it last
 * fired. Never returns an occurrence at or before `lastFiredAt`, so
 * recomputing (e.g. on every task save) can't re-send one that already went
 * out.
 */
function computeNextFireAt(reminder, now = new Date()) {
  const lastFiredMs = reminder.lastFiredAt ? new Date(reminder.lastFiredAt).getTime() + 1 : 0;
  return nextOccurrence(reminder, new Date(Math.max(now.getTime(), lastFiredMs)));
}

function normalizeWeekdays(weekdays, fallbackWeekday) {
  const valid = Array.isArray(weekdays)
    ? [...new Set(weekdays.map(Number).filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))]
    : [];
  return (valid.length > 0 ? valid : [fallbackWeekday]).sort((a, b) => a - b);
}

/**
 * Turn client-supplied reminders into what gets stored.
 *
 * Only the user-editable fields are taken from input (never nextFireAt /
 * lastFiredAt, which are server-owned). A reminder that carries the `_id` of
 * one already on the task keeps that id and its `lastFiredAt`, so editing a
 * task doesn't make an already-sent occurrence fire again.
 *
 * Assumes input already passed the Joi schema in middleware/validation.js.
 *
 * @param {Array} existing - The task's current reminders (may be empty)
 * @param {Array} incoming - Reminders from the request body
 * @returns {Array} Plain objects ready to assign to `task.reminders`
 */
function mergeReminders(existing, incoming) {
  const byId = new Map((existing || []).map((r) => [String(r._id), r]));

  return incoming.slice(0, MAX_REMINDERS_PER_TASK).map((input) => {
    const frequency = input.repeat?.frequency || 'none';
    const previous = input._id ? byId.get(String(input._id)) : undefined;
    const startAt = new Date(input.startAt);
    startAt.setUTCSeconds(0, 0);

    return {
      ...(previous ? { _id: previous._id, lastFiredAt: previous.lastFiredAt } : {}),
      startAt,
      timezone: input.timezone,
      repeat: {
        frequency,
        interval: frequency === 'none' ? 1 : Math.floor(input.repeat?.interval || 1),
        weekdays: frequency === 'weekly' ? normalizeWeekdays(input.repeat?.weekdays, weekdayOf(startAt, input.timezone)) : [],
      },
      channels: {
        email: Boolean(input.channels?.email),
        push: Boolean(input.channels?.push),
      },
    };
  });
}

function weekdayOf(date, timezone) {
  return DateTime.fromJSDate(date, { zone: isValidTimezone(timezone) ? timezone : 'UTC' }).weekday;
}

module.exports = {
  FREQUENCIES,
  MAX_INTERVAL,
  MAX_REMINDERS_PER_TASK,
  isValidTimezone,
  nextOccurrence,
  computeNextFireAt,
  mergeReminders,
};
