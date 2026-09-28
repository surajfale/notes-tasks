jest.mock('dotenv', () => ({ config: jest.fn() }));
jest.mock('../models/User', () => ({ find: jest.fn() }));
jest.mock('../models/Note', () => ({ aggregate: jest.fn() }));
jest.mock('../models/Task', () => ({ aggregate: jest.fn() }));
jest.mock('../models/List', () => ({ aggregate: jest.fn() }));

const User = require('../models/User');
const Note = require('../models/Note');
const Task = require('../models/Task');
const List = require('../models/List');
const { listUsers } = require('./listUsers');

it('lists accounts newest first with activity counts and no secrets', async () => {
  const sort = jest.fn(() => ({
    lean: async () => [
      { _id: 'u2', username: 'stranger', email: 's@x.co', createdAt: new Date('2026-09-02') },
      { _id: 'u1', username: 'suraj', email: 'me@x.co', displayName: 'Suraj', createdAt: new Date('2026-01-01') },
    ],
  }));
  User.find.mockReturnValue({ sort });
  Note.aggregate.mockResolvedValue([{ _id: 'u1', count: 12 }]);
  Task.aggregate.mockResolvedValue([{ _id: 'u1', count: 5 }, { _id: 'u2', count: 1 }]);
  List.aggregate.mockResolvedValue([]);

  const users = await listUsers();

  // Only safe fields are ever selected from the database.
  expect(User.find).toHaveBeenCalledWith({}, { username: 1, email: 1, displayName: 1, createdAt: 1 });
  expect(sort).toHaveBeenCalledWith({ createdAt: -1 });
  expect(users).toEqual([
    { username: 'stranger', email: 's@x.co', displayName: '', createdAt: new Date('2026-09-02'), notes: 0, tasks: 1, lists: 0 },
    { username: 'suraj', email: 'me@x.co', displayName: 'Suraj', createdAt: new Date('2026-01-01'), notes: 12, tasks: 5, lists: 0 },
  ]);
  expect(JSON.stringify(users)).not.toMatch(/passwordHash|resetPassword/);
});
