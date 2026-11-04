/**
 * Regression tests for the audit's hardening items:
 *   - validate() replaces req.body with the validated value (unknown fields
 *     dropped, defaults applied)
 *   - search text is matched literally, query params must be plain strings
 *   - password reset tokens are stored hashed
 *   - 5xx responses don't echo internal error messages
 *   - push subscriptions must be https and never reach internal addresses
 */
jest.mock('../utils/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }));
jest.mock('../services/emailService', () => ({
  sendPasswordResetEmail: jest.fn().mockResolvedValue({ success: true }),
  sendWelcomeEmail: jest.fn(),
}));

process.env.JWT_SECRET = 'jwt-secret';
process.env.NODE_ENV = 'test';
process.env.AUTH_RATE_LIMIT_MAX_REQUESTS = '1000';

const http = require('http');
const crypto = require('crypto');
const express = require('express');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const webPush = require('web-push');

const User = require('../models/User');
const Note = require('../models/Note');
const Task = require('../models/Task');
const Link = require('../models/Link');
const NotificationPreference = require('../models/NotificationPreference');
const emailService = require('../services/emailService');
const pushNotificationService = require('../services/pushNotificationService');
const { validate, schemas } = require('./validation');
const { errorHandler } = require('./errorHandler');

const USER_ID = new mongoose.Types.ObjectId();
let server;
let base;
let user;

beforeAll((done) => {
  const app = express();
  app.set('query parser', 'simple'); // as in server.js
  app.use(express.json());
  app.use('/api/auth', require('../routes/authRoutes'));
  app.use('/api/notes', require('../routes/notesRoutes'));
  app.use('/api/tasks', require('../routes/tasksRoutes'));
  app.use('/api/links', require('../routes/linksRoutes'));
  app.use('/api/notifications', require('../routes/notificationsRoutes'));
  app.get('/boom', () => {
    throw new Error('MongoServerError: connection to 10.0.0.7:27017 refused');
  });
  app.use(errorHandler);
  server = http.createServer(app).listen(0, '127.0.0.1', () => {
    base = `http://127.0.0.1:${server.address().port}`;
    done();
  });
});

afterAll(() => new Promise((resolve) => server.close(() => resolve())));

beforeEach(() => {
  jest.restoreAllMocks();
  user = new User({ _id: USER_ID, username: 'ada', email: 'ada@example.com', passwordHash: 'x' });
  jest.spyOn(User, 'findById').mockImplementation(() => {
    const result = Promise.resolve(user);
    result.select = () => Promise.resolve(user);
    return result;
  });
});

const token = () => jwt.sign({ id: USER_ID.toString() }, process.env.JWT_SECRET);
const call = (method, url, body) =>
  fetch(`${base}${url}`, {
    method,
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token()}` },
    body: body && JSON.stringify(body),
  }).then(async (res) => ({ status: res.status, body: await res.json() }));

/** Stub Model.find(...).sort(...).limit(...) chains and capture the filter. */
const captureFind = (Model) => {
  const seen = {};
  jest.spyOn(Model, 'find').mockImplementation((filter) => {
    seen.filter = filter;
    const chain = { sort: () => chain, limit: async () => [], then: (r) => Promise.resolve([]).then(r) };
    return chain;
  });
  return seen;
};

describe('validate() applies the schema to req.body', () => {
  it('drops unknown fields and applies defaults', () => {
    const req = {
      body: {
        title: 't',
        userId: 'someone-else',
        isAdmin: true,
        checklistItems: [{ text: 'a' }],
      },
    };
    const next = jest.fn();
    validate(schemas.createTask)(req, {}, next);

    expect(next).toHaveBeenCalled();
    expect(req.body).not.toHaveProperty('userId');
    expect(req.body).not.toHaveProperty('isAdmin');
    expect(req.body.checklistItems).toEqual([{ text: 'a', isCompleted: false, order: 0 }]);
  });

  it('keeps the fields the frontend actually sends for tasks', async () => {
    let created;
    jest.spyOn(Task, 'create').mockImplementation(async (doc) => {
      created = doc;
      return doc;
    });
    const itemId = new mongoose.Types.ObjectId().toString();

    const res = await call('POST', '/api/tasks', {
      title: 't',
      description: '',
      priority: 2,
      tags: ['x'],
      checklistItems: [{ _id: itemId, text: 'step', isCompleted: true, order: 0 }],
      reminders: [],
    });

    expect(res.status).toBe(201);
    expect(created.tags).toEqual(['x']);
    expect(created.checklistItems).toEqual([{ _id: itemId, text: 'step', isCompleted: true, order: 0 }]);
  });

  it('keeps browserNotificationsEnabled on preference updates and rejects bad timezones', async () => {
    const prefs = new NotificationPreference({ userId: USER_ID });
    jest.spyOn(NotificationPreference, 'findOne').mockResolvedValue(prefs);
    jest.spyOn(prefs, 'save').mockResolvedValue(prefs);

    const ok = await call('PUT', '/api/notifications/preferences', { browserNotificationsEnabled: true });
    expect(ok.status).toBe(200);
    expect(prefs.browserNotificationsEnabled).toBe(true);

    const bad = await call('PUT', '/api/notifications/preferences', { timezone: 'Mars/Olympus_Mons' });
    expect(bad.status).toBe(400);
  });
});

describe('search and query params', () => {
  it('matches note search text literally (regex metacharacters escaped)', async () => {
    const seen = captureFind(Note);
    await call('GET', '/api/notes?search=' + encodeURIComponent('(a+)+$'));
    expect(seen.filter.$or[0].title.$regex).toBe('\\(a\\+\\)\\+\\$');
  });

  it('matches link search text literally', async () => {
    const seen = captureFind(Link);
    await call('GET', '/api/links?search=' + encodeURIComponent('.*'));
    expect(seen.filter.$or[0].title.$regex).toBe('\\.\\*');
    expect(seen.filter.$or[2].tags.$in[0].source).toBe('\\.\\*');
  });

  it('ignores array and object-shaped query params', async () => {
    const seen = captureFind(Task);
    await call('GET', '/api/tasks?listId=a&listId=b&priority[$gt]=0');
    expect(seen.filter).toEqual({ userId: USER_ID });
  });
});

describe('password reset tokens are stored hashed', () => {
  it('stores sha256(token), emails the raw token, and looks up by hash', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValueOnce(user);
    jest.spyOn(user, 'save').mockResolvedValue(user);

    const res = await call('POST', '/api/auth/forgot-password', { email: 'ada@example.com' });
    expect(res.status).toBe(200);

    const rawToken = emailService.sendPasswordResetEmail.mock.calls.at(-1)[0].resetToken;
    const hashed = crypto.createHash('sha256').update(rawToken).digest('hex');
    expect(user.resetPasswordToken).toBe(hashed);
    expect(user.resetPasswordToken).not.toBe(rawToken);

    User.findOne.mockResolvedValueOnce(null);
    await call('POST', '/api/auth/reset-password', { token: rawToken, newPassword: 'NewPassword1' });
    expect(User.findOne).toHaveBeenLastCalledWith(expect.objectContaining({ resetPasswordToken: hashed }));
  });
});

describe('error responses', () => {
  it('does not leak internal error text on a 500', async () => {
    const res = await call('GET', '/boom');
    expect(res.status).toBe(500);
    expect(res.body.error).toEqual({ code: 'SERVER_ERROR', message: 'Internal server error' });
  });
});

describe('push subscriptions', () => {
  const keys = { p256dh: 'BPk', auth: 'aa' };

  it.each([
    'http://push.example.com/x',
    'javascript:alert(1)',
  ])('rejects endpoint %s at subscribe time', async (endpoint) => {
    const res = await call('PUT', '/api/notifications/push-subscription', { subscription: { endpoint, keys } });
    expect(res.status).toBe(400);
  });

  it('rejects a subscription without keys', async () => {
    const res = await call('PUT', '/api/notifications/push-subscription', {
      subscription: { endpoint: 'https://fcm.googleapis.com/fcm/send/abc' },
    });
    expect(res.status).toBe(400);
  });

  it.each(['https://127.0.0.1/push', 'https://[::1]/push', 'https://169.254.169.254/x', 'http://fcm.googleapis.com/x'])(
    'never sends to %s',
    async (endpoint) => {
      jest.spyOn(pushNotificationService, 'isAvailable').mockReturnValue(true);
      const send = jest.spyOn(webPush, 'sendNotification').mockResolvedValue({});

      const result = await pushNotificationService.sendPushNotification({ endpoint, keys }, { title: 't', body: 'b' });

      expect(result.success).toBe(false);
      expect(send).not.toHaveBeenCalled();
    }
  );

  it('sends to public https endpoints through the SSRF-safe agent', async () => {
    jest.spyOn(pushNotificationService, 'isAvailable').mockReturnValue(true);
    const send = jest.spyOn(webPush, 'sendNotification').mockResolvedValue({});

    await pushNotificationService.sendPushNotification(
      { endpoint: 'https://fcm.googleapis.com/fcm/send/abc', keys },
      { title: 't', body: 'b' }
    );

    expect(send).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      { agent: require('../utils/safeFetch').httpsAgent }
    );
  });
});
