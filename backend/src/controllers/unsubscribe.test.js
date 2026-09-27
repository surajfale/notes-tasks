jest.mock('../models/NotificationPreference', () => ({ findOneAndUpdate: jest.fn(), findOne: jest.fn() }));
jest.mock('../utils/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }));

process.env.DEEP_LINK_SECRET = 'deep-link-secret';
process.env.JWT_SECRET = 'jwt-secret';

const http = require('http');
const express = require('express');
const jwt = require('jsonwebtoken');
const NotificationPreference = require('../models/NotificationPreference');
const { generateDeepLinkToken } = require('../middleware/deepLinkAuth');
const emailTemplateService = require('../services/emailTemplateService');

const USER = '64b7f0c2a1b2c3d4e5f60718';

let server;
let baseUrl;

beforeAll((done) => {
  const app = express();
  app.use(express.json());
  app.use('/api/notifications', require('../routes/notificationsRoutes'));
  server = http.createServer(app).listen(0, () => {
    baseUrl = `http://127.0.0.1:${server.address().port}/api/notifications`;
    done();
  });
});

afterAll((done) => {
  server.close(done);
});

beforeEach(() => {
  jest.clearAllMocks();
  NotificationPreference.findOneAndUpdate.mockResolvedValue({});
});

const post = (token) => fetch(`${baseUrl}/unsubscribe/${token}`, { method: 'POST' });

it('turns off reminder emails for the account in the token', async () => {
  const res = await post(generateDeepLinkToken(USER, 'unsubscribe', 168));

  expect(res.status).toBe(200);
  expect(await res.json()).toEqual({ success: true, emailNotificationsEnabled: false });
  expect(NotificationPreference.findOneAndUpdate).toHaveBeenCalledWith(
    { userId: USER },
    { $set: { emailNotificationsEnabled: false } },
    { upsert: true, setDefaultsOnInsert: true }
  );
});

it('works with the exact link the email template generates', async () => {
  const link = emailTemplateService.generateUnsubscribeLink(USER);
  const token = link.split('/notifications/unsubscribe/')[1];
  expect((await post(token)).status).toBe(200);
});

it('still works once the token has expired (old emails keep working)', async () => {
  const expired = jwt.sign(
    { userId: USER, taskId: 'unsubscribe', type: 'deep_link', iat: 1, exp: 2 },
    process.env.DEEP_LINK_SECRET
  );
  expect((await post(expired)).status).toBe(200);
});

it.each([
  ['a task "View Task" token', () => generateDeepLinkToken(USER, '64b7f0c2a1b2c3d4e5f60799')],
  ['a token signed with the wrong secret', () => jwt.sign({ userId: USER, taskId: 'unsubscribe', type: 'deep_link' }, 'wrong')],
  ['a regular login JWT', () => jwt.sign({ id: USER }, process.env.JWT_SECRET)],
  ['garbage', () => 'not-a-token'],
])('rejects %s without touching preferences', async (_, makeToken) => {
  const res = await post(makeToken());
  expect(res.status).toBe(400);
  expect((await res.json()).error.code).toBe('INVALID_UNSUBSCRIBE_LINK');
  expect(NotificationPreference.findOneAndUpdate).not.toHaveBeenCalled();
});

it('does not unsubscribe on GET (email scanners pre-fetch links)', async () => {
  const res = await fetch(`${baseUrl}/unsubscribe/${generateDeepLinkToken(USER, 'unsubscribe', 168)}`);
  expect(res.status).not.toBe(200);
  expect(NotificationPreference.findOneAndUpdate).not.toHaveBeenCalled();
});
