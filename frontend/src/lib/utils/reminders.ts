/**
 * Helpers for per-task reminders on the client: defaults, local date/time
 * conversion, human-readable descriptions and form validation.
 *
 * Scheduling itself (when a repeating reminder fires next) is the server's
 * job — see backend/src/services/reminders.js. Limits here mirror its
 * MAX_INTERVAL / MAX_REMINDERS_PER_TASK so the form rejects what the API
 * would.
 */

import type { IsoWeekday, ReminderFrequency, TaskReminder } from '$lib/types/task';

export const MAX_REMINDERS = 10;

export const MAX_INTERVAL: Record<ReminderFrequency, number> = {
  none: 1,
  hourly: 168,
  daily: 365,
  weekly: 52,
  monthly: 24
};

export const WEEKDAYS: { value: IsoWeekday; short: string; label: string }[] = [
  { value: 1, short: 'M', label: 'Mon' },
  { value: 2, short: 'T', label: 'Tue' },
  { value: 3, short: 'W', label: 'Wed' },
  { value: 4, short: 'T', label: 'Thu' },
  { value: 5, short: 'F', label: 'Fri' },
  { value: 6, short: 'S', label: 'Sat' },
  { value: 7, short: 'S', label: 'Sun' }
];

const UNIT: Record<Exclude<ReminderFrequency, 'none'>, [string, string]> = {
  hourly: ['hour', 'hours'],
  daily: ['day', 'days'],
  weekly: ['week', 'weeks'],
  monthly: ['month', 'months']
};

/** The device's IANA timezone (falls back to UTC). */
export function browserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}

/** ISO weekday (1 = Mon ... 7 = Sun) of a Date in local time. */
export function isoWeekday(date: Date): IsoWeekday {
  return (((date.getDay() + 6) % 7) + 1) as IsoWeekday;
}

/**
 * A sensible new reminder: 09:00 on the due date if it's still ahead,
 * otherwise 09:00 tomorrow. Email on, push off.
 */
export function newReminder(dueDate: Date | null = null, now: Date = new Date()): TaskReminder {
  let start: Date | null = null;
  if (dueDate) {
    start = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate(), 9, 0, 0, 0);
    if (start <= now) start = null;
  }
  if (!start) {
    start = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0, 0);
  }

  return {
    startAt: start.toISOString(),
    timezone: browserTimezone(),
    repeat: { frequency: 'none', interval: 1, weekdays: [] },
    channels: { email: true, push: false }
  };
}

/** Split an ISO instant into local `YYYY-MM-DD` / `HH:mm` form values. */
export function toLocalInputs(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`
  };
}

/** Combine local `YYYY-MM-DD` + `HH:mm` form values into an ISO instant (null if invalid). */
export function fromLocalInputs(date: string, time: string): string | null {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  if (![y, m, d, hh, mm].every(Number.isFinite)) return null;
  const result = new Date(y, m - 1, d, hh, mm, 0, 0);
  return Number.isNaN(result.getTime()) ? null : result.toISOString();
}

/** "Does not repeat", "Every 2 hours", "Weekly on Mon, Wed", ... */
export function describeRepeat(reminder: Pick<TaskReminder, 'repeat' | 'startAt'>): string {
  const { frequency, interval } = reminder.repeat;
  if (frequency === 'none') return 'Does not repeat';

  const [one, many] = UNIT[frequency];
  const every =
    interval > 1
      ? `Every ${interval} ${many}`
      : { hourly: 'Hourly', daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly' }[frequency];

  if (frequency !== 'weekly') return every ?? `Every ${one}`;

  const days = reminder.repeat.weekdays.length > 0 ? reminder.repeat.weekdays : [isoWeekday(new Date(reminder.startAt))];
  const names = [...days].sort((a, b) => a - b).map((d) => WEEKDAYS[d - 1].label);
  return `${every} on ${names.join(', ')}`;
}

/** "Tue, Oct 6, 9:00 AM" in the viewer's locale and timezone. */
export function formatReminderTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

/** Channel names for display: "Email + Browser". */
export function describeChannels(channels: TaskReminder['channels']): string {
  return [channels.email && 'Email', channels.push && 'Browser'].filter(Boolean).join(' + ');
}

/**
 * When a reminder fires next, for display. Saved reminders have a
 * server-computed `nextFireAt` (null = finished). Unsaved ones fall back to
 * `startAt` if it's still ahead.
 */
export function upcomingAt(reminder: TaskReminder, now: Date = new Date()): string | null {
  if (reminder.nextFireAt !== undefined) return reminder.nextFireAt;
  return new Date(reminder.startAt) > now ? reminder.startAt : null;
}

/** The soonest upcoming occurrence across a task's reminders, or null. */
export function nextReminderAt(reminders: TaskReminder[], now: Date = new Date()): string | null {
  const upcoming = reminders
    .map((r) => upcomingAt(r, now))
    .filter((iso): iso is string => Boolean(iso))
    .sort();
  return upcoming[0] ?? null;
}

/**
 * Validate one reminder as the editor holds it. Returns a message, or null
 * if it's valid. A one-off reminder must be in the future; a repeating one
 * may start in the past (it continues from its next occurrence).
 */
export function validateReminder(reminder: TaskReminder, now: Date = new Date()): string | null {
  const start = new Date(reminder.startAt);
  if (Number.isNaN(start.getTime())) return 'Pick a valid date and time.';

  const { frequency, interval } = reminder.repeat;
  if (frequency === 'none' && start <= now && !reminder._id) return 'Pick a time in the future.';
  if (!Number.isInteger(interval) || interval < 1) return 'Repeat interval must be at least 1.';
  if (interval > MAX_INTERVAL[frequency]) {
    return `Repeat interval can be at most ${MAX_INTERVAL[frequency]} for this option.`;
  }
  if (!reminder.channels.email && !reminder.channels.push) return 'Choose email, browser, or both.';
  return null;
}
