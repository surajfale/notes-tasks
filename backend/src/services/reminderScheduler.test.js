jest.mock('../models/Task', () => ({ find: jest.fn(), updateOne: jest.fn() }));
jest.mock('../models/User', () => ({ findById: jest.fn() }));
jest.mock('../models/List', () => ({ findOne: jest.fn() }));
jest.mock('../models/NotificationPreference', () => ({ findOne: jest.fn() }));
jest.mock('./notificationProcessor', () => ({ sendReminder: jest.fn() }));
jest.mock('../utils/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }));

const Task = require('../models/Task');
const User = require('../models/User');
const List = require('../models/List');
const NotificationPreference = require('../models/NotificationPreference');
const { sendReminder } = require('./notificationProcessor');
const { runDueReminders } = require('./reminderScheduler');

const NOW = new Date('2026-10-01T09:00:30Z');
const lean = (value) => ({ lean: () => Promise.resolve(value) });

function task(reminders, extra = {}) {
  return { _id: 't1', userId: 'u1', title: 'Ship it', priority: 2, isCompleted: false, reminders, ...extra };
}

function reminder(extra = {}) {
  return {
    _id: 'r1',
    startAt: new Date('2026-10-01T09:00:00Z'),
    timezone: 'UTC',
    repeat: { frequency: 'none', interval: 1, weekdays: [] },
    channels: { email: true, push: false },
    nextFireAt: new Date('2026-10-01T09:00:00Z'),
    lastFiredAt: null,
    ...extra,
  };
}

function givenDueTasks(tasks) {
  Task.find.mockReturnValue({ limit: () => lean(tasks) });
}

beforeEach(() => {
  jest.clearAllMocks();
  User.findById.mockReturnValue({ select: () => lean({ _id: 'u1', email: 'a@b.co', displayName: 'Ada' }) });
  NotificationPreference.findOne.mockReturnValue(lean({ emailNotificationsEnabled: true }));
  List.findOne.mockReturnValue(lean({ _id: 'l1', title: 'Work' }));
  Task.updateOne.mockResolvedValue({ modifiedCount: 1 });
  sendReminder.mockResolvedValue({ emailSent: true, pushSent: false, errors: [] });
});

it('only queries open tasks with a due reminder', async () => {
  givenDueTasks([]);
  await runDueReminders(NOW);
  expect(Task.find).toHaveBeenCalledWith({
    isCompleted: false,
    reminders: { $elemMatch: { nextFireAt: { $ne: null, $lte: NOW } } },
  });
});

it('claims the occurrence atomically before sending it', async () => {
  givenDueTasks([task([reminder()])]);

  const summary = await runDueReminders(NOW);

  expect(Task.updateOne).toHaveBeenCalledWith(
    {
      _id: 't1',
      isCompleted: false,
      reminders: { $elemMatch: { _id: 'r1', nextFireAt: new Date('2026-10-01T09:00:00Z') } },
    },
    { $set: { 'reminders.$.nextFireAt': null, 'reminders.$.lastFiredAt': NOW } }
  );
  expect(Task.updateOne.mock.invocationCallOrder[0]).toBeLessThan(sendReminder.mock.invocationCallOrder[0]);
  expect(sendReminder).toHaveBeenCalledWith(expect.objectContaining({
    occurrenceAt: new Date('2026-10-01T09:00:00Z'),
    user: expect.objectContaining({ email: 'a@b.co' }),
  }));
  expect(summary).toEqual({ due: 1, sent: 1, skipped: 0, failed: 0 });
});

it('never sends when another tick/instance already claimed it', async () => {
  givenDueTasks([task([reminder()])]);
  Task.updateOne.mockResolvedValue({ modifiedCount: 0 });

  const summary = await runDueReminders(NOW);

  expect(sendReminder).not.toHaveBeenCalled();
  expect(summary.skipped).toBe(1);
});

it('schedules the following occurrence for a repeating reminder', async () => {
  givenDueTasks([task([reminder({ repeat: { frequency: 'hourly', interval: 2, weekdays: [] } })])]);

  await runDueReminders(NOW);

  expect(Task.updateOne.mock.calls[0][1].$set['reminders.$.nextFireAt']).toEqual(new Date('2026-10-01T11:00:00Z'));
});

it('advances but does not send an occurrence missed by more than an hour', async () => {
  const late = new Date('2026-10-01T12:00:00Z'); // 3h after the 09:00 occurrence
  givenDueTasks([task([reminder({ repeat: { frequency: 'daily', interval: 1, weekdays: [] } })])]);

  const summary = await runDueReminders(late);

  expect(Task.updateOne.mock.calls[0][1].$set['reminders.$.nextFireAt']).toEqual(new Date('2026-10-02T09:00:00Z'));
  expect(sendReminder).not.toHaveBeenCalled();
  expect(summary.skipped).toBe(1);
});

it('ignores reminders on the task that are not due yet', async () => {
  givenDueTasks([task([
    reminder(),
    reminder({ _id: 'r2', nextFireAt: new Date('2026-10-01T10:00:00Z') }),
  ])]);

  const summary = await runDueReminders(NOW);

  expect(Task.updateOne).toHaveBeenCalledTimes(1);
  expect(summary.due).toBe(1);
});

it('looks the list up scoped to the task owner', async () => {
  givenDueTasks([task([reminder()], { listId: 'l1' })]);
  await runDueReminders(NOW);
  expect(List.findOne).toHaveBeenCalledWith({ _id: 'l1', userId: 'u1' });
});

it('fetches each user once per tick', async () => {
  givenDueTasks([task([reminder()]), task([reminder({ _id: 'r9' })], { _id: 't2' })]);
  await runDueReminders(NOW);
  expect(User.findById).toHaveBeenCalledTimes(1);
  expect(NotificationPreference.findOne).toHaveBeenCalledTimes(1);
});

it('counts "all channels switched off" as skipped, a delivery error as failed', async () => {
  givenDueTasks([task([reminder(), reminder({ _id: 'r2' })])]);
  sendReminder
    .mockResolvedValueOnce({ emailSent: false, pushSent: false, errors: [] })
    .mockResolvedValueOnce({ emailSent: false, pushSent: false, errors: ['Email failed: 500'] });

  const summary = await runDueReminders(NOW);

  expect(summary).toEqual({ due: 2, sent: 0, skipped: 1, failed: 1 });
});

it('skips a tick that overlaps one still running in this process', async () => {
  let release;
  Task.find.mockReturnValue({ limit: () => ({ lean: () => new Promise((r) => { release = () => r([]); }) }) });

  const first = runDueReminders(NOW);
  const second = await runDueReminders(NOW);
  release();
  await first;

  expect(Task.find).toHaveBeenCalledTimes(1);
  expect(second).toEqual({ due: 0, sent: 0, skipped: 0, failed: 0 });
});
