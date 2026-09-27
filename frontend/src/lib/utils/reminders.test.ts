import { describe, it, expect } from 'vitest';
import type { TaskReminder } from '$lib/types/task';
import {
  describeChannels,
  describeRepeat,
  fromLocalInputs,
  isoWeekday,
  newReminder,
  nextReminderAt,
  toLocalInputs,
  upcomingAt,
  validateReminder
} from './reminders';

const NOW = new Date(2026, 9, 1, 12, 0); // Thu Oct 1 2026, 12:00 local

function reminder(overrides: Partial<TaskReminder> = {}): TaskReminder {
  return {
    startAt: new Date(2026, 9, 2, 9, 0).toISOString(),
    timezone: 'UTC',
    repeat: { frequency: 'none', interval: 1, weekdays: [] },
    channels: { email: true, push: false },
    ...overrides
  };
}

describe('newReminder', () => {
  it('defaults to 09:00 on the due date when it is ahead', () => {
    const r = newReminder(new Date(2026, 9, 5), NOW);
    expect(new Date(r.startAt)).toEqual(new Date(2026, 9, 5, 9, 0));
    expect(r.channels).toEqual({ email: true, push: false });
    expect(r.repeat.frequency).toBe('none');
  });

  it('falls back to 09:00 tomorrow when there is no (future) due date', () => {
    expect(new Date(newReminder(null, NOW).startAt)).toEqual(new Date(2026, 9, 2, 9, 0));
    expect(new Date(newReminder(new Date(2026, 9, 1), NOW).startAt)).toEqual(new Date(2026, 9, 2, 9, 0));
  });
});

describe('local input round-trip', () => {
  it('splits and rejoins a local date/time', () => {
    const iso = new Date(2026, 9, 5, 14, 30).toISOString();
    const { date, time } = toLocalInputs(iso);
    expect({ date, time }).toEqual({ date: '2026-10-05', time: '14:30' });
    expect(fromLocalInputs(date, time)).toBe(iso);
  });

  it('returns null for incomplete input', () => {
    expect(fromLocalInputs('', '09:00')).toBeNull();
    expect(fromLocalInputs('2026-10-05', '')).toBeNull();
  });
});

describe('describeRepeat', () => {
  it.each([
    [{ frequency: 'none', interval: 1, weekdays: [] }, 'Does not repeat'],
    [{ frequency: 'hourly', interval: 1, weekdays: [] }, 'Hourly'],
    [{ frequency: 'hourly', interval: 2, weekdays: [] }, 'Every 2 hours'],
    [{ frequency: 'daily', interval: 1, weekdays: [] }, 'Daily'],
    [{ frequency: 'daily', interval: 3, weekdays: [] }, 'Every 3 days'],
    [{ frequency: 'weekly', interval: 1, weekdays: [3, 1] }, 'Weekly on Mon, Wed'],
    [{ frequency: 'weekly', interval: 2, weekdays: [5] }, 'Every 2 weeks on Fri'],
    [{ frequency: 'monthly', interval: 1, weekdays: [] }, 'Monthly'],
    [{ frequency: 'monthly', interval: 6, weekdays: [] }, 'Every 6 months']
  ] as const)('%o -> %s', (repeat, expected) => {
    expect(describeRepeat(reminder({ repeat: { ...repeat, weekdays: [...repeat.weekdays] } }))).toBe(expected);
  });

  it('uses the start weekday for weekly with no days picked', () => {
    // Oct 2 2026 is a Friday.
    expect(describeRepeat(reminder({ repeat: { frequency: 'weekly', interval: 1, weekdays: [] } }))).toBe('Weekly on Fri');
  });
});

describe('isoWeekday', () => {
  it('maps Sunday to 7 and Monday to 1', () => {
    expect(isoWeekday(new Date(2026, 9, 4))).toBe(7);
    expect(isoWeekday(new Date(2026, 9, 5))).toBe(1);
  });
});

describe('describeChannels', () => {
  it('joins the enabled channels', () => {
    expect(describeChannels({ email: true, push: true })).toBe('Email + Browser');
    expect(describeChannels({ email: false, push: true })).toBe('Browser');
  });
});

describe('upcoming', () => {
  it('prefers the server-computed nextFireAt, including null for finished', () => {
    expect(upcomingAt(reminder({ _id: 'a', nextFireAt: '2026-10-09T00:00:00.000Z' }), NOW)).toBe('2026-10-09T00:00:00.000Z');
    expect(upcomingAt(reminder({ _id: 'a', nextFireAt: null }), NOW)).toBeNull();
  });

  it('uses startAt for an unsaved reminder only if it is ahead', () => {
    const past = new Date(2026, 8, 1).toISOString();
    expect(upcomingAt(reminder(), NOW)).toBe(reminder().startAt);
    expect(upcomingAt(reminder({ startAt: past }), NOW)).toBeNull();
  });

  it('nextReminderAt picks the soonest', () => {
    const soon = new Date(2026, 9, 1, 15, 0).toISOString();
    expect(nextReminderAt([reminder(), reminder({ startAt: soon }), reminder({ _id: 'x', nextFireAt: null })], NOW)).toBe(soon);
    expect(nextReminderAt([], NOW)).toBeNull();
  });
});

describe('validateReminder', () => {
  it('accepts a valid reminder', () => {
    expect(validateReminder(reminder(), NOW)).toBeNull();
  });

  it('rejects a new one-off in the past, but allows a repeating one to start in the past', () => {
    const past = new Date(2026, 8, 1, 9, 0).toISOString();
    expect(validateReminder(reminder({ startAt: past }), NOW)).toMatch(/future/);
    expect(validateReminder(reminder({ startAt: past, repeat: { frequency: 'daily', interval: 1, weekdays: [] } }), NOW)).toBeNull();
  });

  it('does not block saving a task whose one-off reminder already fired', () => {
    const past = new Date(2026, 8, 1, 9, 0).toISOString();
    expect(validateReminder(reminder({ _id: 'saved', startAt: past, nextFireAt: null }), NOW)).toBeNull();
  });

  it('enforces interval bounds and at least one channel', () => {
    expect(validateReminder(reminder({ repeat: { frequency: 'hourly', interval: 169, weekdays: [] } }), NOW)).toMatch(/at most 168/);
    expect(validateReminder(reminder({ repeat: { frequency: 'daily', interval: 0, weekdays: [] } }), NOW)).toMatch(/at least 1/);
    expect(validateReminder(reminder({ channels: { email: false, push: false } }), NOW)).toMatch(/email, browser/);
  });

  it('rejects an invalid date', () => {
    expect(validateReminder(reminder({ startAt: 'nope' }), NOW)).toMatch(/valid date/);
  });
});
