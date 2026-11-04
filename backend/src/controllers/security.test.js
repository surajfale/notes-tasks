/**
 * Regression tests for the security audit fixes:
 *   F2 - link previews never fetch internal addresses; link input is validated
 *   F4 - password change/reset revokes previously issued JWTs
 *   F5 - notes/tasks can't point at another account's list
 *   F6 - account deletion removes every per-user collection
 * (F1, the unauthenticated-admin API, was fixed by deleting the routes.)
 *
 * Models are stubbed with jest.spyOn so no database is needed.
 */
jest.mock('../utils/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }));

process.env.JWT_SECRET = 'jwt-secret';
process.env.NODE_ENV = 'test';

const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const User = require('../models/User');
const List = require('../models/List');
const Note = require('../models/Note');
const Task = require('../models/Task');
const Link = require('../models/Link');
const NotificationPreference = require('../models/NotificationPreference');
const NotificationLog = require('../models/NotificationLog');
const { errorHandler } = require('../middleware/errorHandler');

const USER_ID = new mongoose.Types.ObjectId();
const FOREIGN_LIST_ID = new mongoose.Types.ObjectId().toString();

let server;
let base;

beforeAll((done) => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', require('../routes/authRoutes'));
  app.use('/api/notes', require('../routes/notesRoutes'));
  app.use('/api/tasks', require('../routes/tasksRoutes'));
  app.use('/api/links', require('../routes/linksRoutes'));
  app.use(errorHandler);
  server = http.createServer(app).listen(0, '127.0.0.1', () => {
    base = `http://127.0.0.1:${server.address().port}`;
    done();
  });
});

afterAll(() => new Promise((resolve) => server.close(() => resolve())));

let currentUser;

beforeEach(() => {
  jest.restoreAllMocks();
  currentUser = new User({
    _id: USER_ID,
    username: 'ada',
    email: 'ada@example.com',
    passwordHash: 'x',
  });
  jest.spyOn(User, 'findById').mockImplementation(() => {
    const result = Promise.resolve(currentUser);
    result.select = () => Promise.resolve(currentUser);
    return result;
  });
});

const tokenIssuedAt = (iatSeconds) =>
  jwt.sign({ id: USER_ID.toString(), iat: iatSeconds }, process.env.JWT_SECRET, { expiresIn: '7d' });
const nowSeconds = () => Math.floor(Date.now() / 1000);

const call = (method, url, { token = tokenIssuedAt(nowSeconds()), body } = {}) =>
  fetch(`${base}${url}`, {
    method,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}` },
    body: body && JSON.stringify(body),
  }).then(async (res) => ({ status: res.status, body: await res.json() }));

describe('F1: admin notification API is gone', () => {
  it('has no route or controller file left to mount', () => {
    expect(fs.existsSync(path.join(__dirname, '../routes/notificationAdminRoutes.js'))).toBe(false);
    expect(fs.readFileSync(path.join(__dirname, '../server.js'), 'utf8')).not.toMatch(/\/api\/admin/);
  });
});

describe('F4: tokens issued before a password change are rejected', () => {
  it('rejects a token older than passwordChangedAt', async () => {
    currentUser.passwordChangedAt = new Date();
    const res = await call('GET', '/api/auth/me', { token: tokenIssuedAt(nowSeconds() - 3600) });
    expect(res.status).toBe(401);
  });

  it('accepts a token issued after (or in the same second as) the change', async () => {
    currentUser.passwordChangedAt = new Date(Date.now() - 5000);
    const res = await call('GET', '/api/auth/me');
    expect(res.status).toBe(200);
    expect(res.body.user.username).toBe('ada');
  });

  it('accepts tokens for users who never changed their password', async () => {
    const res = await call('GET', '/api/auth/me', { token: tokenIssuedAt(nowSeconds() - 3600) });
    expect(res.status).toBe(200);
  });

  it('rejects tokens signed with a non-HS256 algorithm', async () => {
    const token = jwt.sign({ id: USER_ID.toString() }, process.env.JWT_SECRET, { algorithm: 'HS512' });
    const res = await call('GET', '/api/auth/me', { token });
    expect(res.status).toBe(401);
  });

  it('change-password stamps passwordChangedAt and returns a fresh token that still works', async () => {
    jest.spyOn(currentUser, 'comparePassword').mockResolvedValue(true);
    jest.spyOn(User, 'hashPassword').mockResolvedValue('new-hash');
    const save = jest.spyOn(currentUser, 'save').mockResolvedValue(currentUser);

    const res = await call('PUT', '/api/auth/password', {
      body: { currentPassword: 'OldPassword1', newPassword: 'NewPassword1' },
    });

    expect(res.status).toBe(200);
    expect(save).toHaveBeenCalled();
    expect(currentUser.passwordChangedAt).toBeInstanceOf(Date);
    expect(typeof res.body.token).toBe('string');

    const me = await call('GET', '/api/auth/me', { token: res.body.token });
    expect(me.status).toBe(200);
  });

  it('reset-password stamps passwordChangedAt', async () => {
    const resetUser = new User({ _id: USER_ID, username: 'ada', email: 'ada@example.com', passwordHash: 'x' });
    jest.spyOn(User, 'findOne').mockResolvedValue(resetUser);
    jest.spyOn(User, 'hashPassword').mockResolvedValue('new-hash');
    jest.spyOn(resetUser, 'save').mockResolvedValue(resetUser);

    const res = await call('POST', '/api/auth/reset-password', {
      body: { token: 'abc', newPassword: 'NewPassword1' },
    });

    expect(res.status).toBe(200);
    expect(resetUser.passwordChangedAt).toBeInstanceOf(Date);
  });
});

describe("F5: notes/tasks can't reference another account's list", () => {
  beforeEach(() => {
    // List.exists is scoped by { _id, userId }; null = not this user's list.
    jest.spyOn(List, 'exists').mockResolvedValue(null);
  });

  it('createNote with a foreign listId is a 404 and creates nothing', async () => {
    const create = jest.spyOn(Note, 'create');
    const res = await call('POST', '/api/notes', { body: { title: 'x', listId: FOREIGN_LIST_ID } });
    expect(res.status).toBe(404);
    expect(create).not.toHaveBeenCalled();
    expect(List.exists).toHaveBeenCalledWith({ _id: FOREIGN_LIST_ID, userId: USER_ID });
  });

  it('updateNote with a foreign listId is a 404 and saves nothing', async () => {
    const note = new Note({ userId: USER_ID, title: 'mine' });
    const save = jest.spyOn(note, 'save');
    jest.spyOn(Note, 'findOne').mockResolvedValue(note);
    const res = await call('PUT', `/api/notes/${note._id}`, { body: { listId: FOREIGN_LIST_ID } });
    expect(res.status).toBe(404);
    expect(save).not.toHaveBeenCalled();
  });

  it('createTask with a foreign listId is a 404 and creates nothing', async () => {
    const create = jest.spyOn(Task, 'create');
    const res = await call('POST', '/api/tasks', { body: { title: 'x', listId: FOREIGN_LIST_ID } });
    expect(res.status).toBe(404);
    expect(create).not.toHaveBeenCalled();
  });

  it('updateTask with a foreign listId is a 404 and saves nothing', async () => {
    const task = new Task({ userId: USER_ID, title: 'mine' });
    const save = jest.spyOn(task, 'save');
    jest.spyOn(Task, 'findOne').mockResolvedValue(task);
    const res = await call('PUT', `/api/tasks/${task._id}`, { body: { listId: FOREIGN_LIST_ID } });
    expect(res.status).toBe(404);
    expect(save).not.toHaveBeenCalled();
  });

  it('own lists and "no list" still work', async () => {
    List.exists.mockResolvedValue({ _id: FOREIGN_LIST_ID });
    jest.spyOn(Note, 'create').mockImplementation(async (doc) => doc);
    const withList = await call('POST', '/api/notes', { body: { title: 'x', listId: FOREIGN_LIST_ID } });
    expect(withList.status).toBe(201);

    List.exists.mockClear();
    const noList = await call('POST', '/api/notes', { body: { title: 'y' } });
    expect(noList.status).toBe(201);
    expect(List.exists).not.toHaveBeenCalled();
  });
});

describe('F6: account deletion removes every per-user collection', () => {
  it('deletes notes, tasks, lists, links, notification prefs and logs, then the user', async () => {
    const models = [Note, Task, List, Link, NotificationPreference, NotificationLog];
    const spies = models.map((m) => jest.spyOn(m, 'deleteMany').mockResolvedValue({ deletedCount: 0 }));
    const delUser = jest.spyOn(User, 'findByIdAndDelete').mockResolvedValue(currentUser);

    const res = await call('DELETE', '/api/auth/account');

    expect(res.status).toBe(200);
    spies.forEach((spy) => expect(spy).toHaveBeenCalledWith({ userId: USER_ID }));
    expect(delUser).toHaveBeenCalledWith(USER_ID);
  });
});

describe('F2: link previews', () => {
  let internal;
  let internalPort;
  let hits = 0;

  beforeAll((done) => {
    internal = http
      .createServer((req, res) => {
        hits += 1;
        res.end('<title>internal secret</title>');
      })
      .listen(0, '127.0.0.1', () => {
        internalPort = internal.address().port;
        done();
      });
  });
  afterAll(() => new Promise((resolve) => internal.close(() => resolve())));

  it('never fetches an internal URL; the link is saved without scraped metadata', async () => {
    jest.spyOn(Link, 'create').mockImplementation(async (doc) => doc);
    jest.spyOn(console, 'error').mockImplementation(() => {});
    const url = `http://127.0.0.1:${internalPort}/`;

    const res = await call('POST', '/api/links', { body: { url } });

    expect(res.status).toBe(201);
    expect(hits).toBe(0);
    expect(res.body.title).toBe(url);
    expect(res.body.title).not.toMatch(/internal secret/);
  });

  it.each(['javascript:alert(1)', 'file:///etc/passwd', 'not a url'])('rejects url %s with 400', async (url) => {
    const create = jest.spyOn(Link, 'create');
    const res = await call('POST', '/api/links', { body: { url } });
    expect(res.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it('rejects a non-string url (e.g. an object) with 400', async () => {
    const res = await call('POST', '/api/links', { body: { url: { $gt: '' } } });
    expect(res.status).toBe(400);
  });

  it('returns 404 (not 500) for a link that is not yours', async () => {
    jest.spyOn(Link, 'findOne').mockResolvedValue(null);
    const res = await call('GET', `/api/links/${new mongoose.Types.ObjectId()}`);
    expect(res.status).toBe(404);
    expect(res.body.error.code).toBe('NOT_FOUND');
  });
});
