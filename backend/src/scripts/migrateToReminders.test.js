jest.mock('dotenv', () => ({ config: jest.fn() }));

const Task = require('../models/Task');
const NotificationPreference = require('../models/NotificationPreference');
const { remindersForLegacyTask, migrate } = require('./migrateToReminders');

const NOW = new Date('2026-10-01T00:00:00Z');
// Due date as the app stores it: noon UTC on the calendar day (Fri Oct 9).
const DUE = new Date('2026-10-09T12:00:00Z');

const legacyTask = (extra = {}) => ({
  _id: 't1',
  userId: 'u1',
  dueAt: DUE,
  isCompleted: false,
  notificationEnabled: true,
  notificationTimings: ['same_day', '1_day_before'],
  ...extra,
});

describe('remindersForLegacyTask', () => {
  it("maps each timing to a one-off at the user's old time, in their timezone", () => {
    const prefs = { timezone: 'Asia/Kolkata', notificationTime: '08:30', emailNotificationsEnabled: true };
    const reminders = remindersForLegacyTask(legacyTask(), prefs, NOW);

    // 08:30 IST = 03:00Z, on Oct 8 (1 day before) and Oct 9 (same day).
    expect(reminders.map((r) => r.startAt)).toEqual([new Date('2026-10-08T03:00:00Z'), new Date('2026-10-09T03:00:00Z')]);
    expect(reminders[0]).toMatchObject({
      timezone: 'Asia/Kolkata',
      repeat: { frequency: 'none', interval: 1, weekdays: [] },
      channels: { email: true, push: false },
      nextFireAt: new Date('2026-10-08T03:00:00Z'),
      lastFiredAt: null,
    });
  });

  it('keeps the calendar day even in a timezone behind UTC', () => {
    const reminders = remindersForLegacyTask(
      legacyTask({ notificationTimings: ['same_day'] }),
      { timezone: 'America/Los_Angeles', notificationTime: '09:00' },
      NOW
    );
    // 09:00 PDT on Oct 9 = 16:00Z Oct 9 (not Oct 8).
    expect(reminders[0].startAt).toEqual(new Date('2026-10-09T16:00:00Z'));
  });

  it('adds push when the user had a browser subscription', () => {
    const [reminder] = remindersForLegacyTask(
      legacyTask({ notificationTimings: ['same_day'] }),
      { browserNotificationsEnabled: true, pushSubscription: { endpoint: 'x' }, emailNotificationsEnabled: false },
      NOW
    );
    expect(reminder.channels).toEqual({ email: false, push: true });
  });

  it('falls back to 09:00 UTC with email when the user had no preferences', () => {
    const [reminder] = remindersForLegacyTask(legacyTask({ notificationTimings: ['same_day'] }), undefined, NOW);
    expect(reminder.startAt).toEqual(new Date('2026-10-09T09:00:00Z'));
    expect(reminder.channels).toEqual({ email: true, push: false });
  });

  it('drops timings that are already in the past', () => {
    const lateNow = new Date('2026-10-08T12:00:00Z');
    const reminders = remindersForLegacyTask(legacyTask({ notificationTimings: ['2_days_before', '1_day_before', 'same_day'] }), undefined, lateNow);
    expect(reminders.map((r) => r.startAt)).toEqual([new Date('2026-10-09T09:00:00Z')]);
  });

  it.each([
    ['notifications off', { notificationEnabled: false }],
    ['no timings', { notificationTimings: [] }],
    ['no due date', { dueAt: null }],
    ['completed', { isCompleted: true }],
  ])('creates nothing when %s', (_, extra) => {
    expect(remindersForLegacyTask(legacyTask(extra), undefined, NOW)).toEqual([]);
  });
});

describe('migrate', () => {
  function asyncIterable(items) {
    return { async *[Symbol.asyncIterator]() { yield* items; } };
  }

  let taskUpdates;
  let prefUpdates;

  beforeEach(() => {
    taskUpdates = [];
    prefUpdates = [];
    Object.defineProperty(Task, 'collection', {
      configurable: true,
      value: {
        find: () => asyncIterable([legacyTask(), legacyTask({ _id: 't2', notificationEnabled: false })]),
        updateOne: async (filter, update) => { taskUpdates.push([filter, update]); },
      },
    });
    Object.defineProperty(NotificationPreference, 'collection', {
      configurable: true,
      value: {
        find: () => asyncIterable([{ userId: 'u1', timezone: 'UTC', notificationTime: '09:00', emailNotificationsEnabled: true }]),
        updateMany: async (filter, update) => { prefUpdates.push([filter, update]); return { modifiedCount: 1 }; },
        countDocuments: async () => 1,
      },
    });
  });

  it('dry run reports without writing', async () => {
    const stats = await migrate({ apply: false, now: NOW });
    expect(stats).toEqual({ tasksScanned: 2, tasksWithReminders: 1, remindersCreated: 2, preferencesCleaned: 1 });
    expect(taskUpdates).toHaveLength(0);
    expect(prefUpdates).toHaveLength(0);
  });

  it('apply pushes reminders, unsets retired fields, then cleans preferences', async () => {
    await migrate({ apply: true, now: NOW });

    const [[filter, update], [, noReminders]] = taskUpdates;
    expect(filter).toEqual({ _id: 't1' });
    expect(update.$push.reminders.$each).toHaveLength(2);
    expect(update.$unset).toEqual({ notificationEnabled: '', notificationTimings: '', notificationsSent: '', lastNotificationSent: '' });
    // A task that had notifications off still gets its old fields removed.
    expect(noReminders.$push).toBeUndefined();
    expect(noReminders.$unset).toBeDefined();
    expect(prefUpdates[0][1]).toEqual({ $unset: { notificationDays: '', notificationTime: '' } });
  });
});
