jest.mock('../models/User', () => ({
  countDocuments: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  hashPassword: jest.fn(),
}));
jest.mock('../services/emailService', () => ({ sendWelcomeEmail: jest.fn() }));
jest.mock('../utils/logger', () => ({ info: jest.fn(), warn: jest.fn(), error: jest.fn(), debug: jest.fn() }));

process.env.JWT_SECRET = 'jwt-secret';
process.env.NODE_ENV = 'test';
// These tests make many sign-up calls; the real auth limiter (10 per 15 min,
// which is what stops invite-code guessing in production) would 429 them.
process.env.AUTH_RATE_LIMIT_MAX_REQUESTS = '1000';

const http = require('http');
const express = require('express');
const User = require('../models/User');
const { checkRegistration } = require('../config/registration');

let server;
let baseUrl;

beforeAll((done) => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', require('../routes/authRoutes'));
  server = http.createServer(app).listen(0, () => {
    baseUrl = `http://127.0.0.1:${server.address().port}/api/auth`;
    done();
  });
});

afterAll((done) => {
  server.close(done);
});

const SIGNUP = { username: 'friend', email: 'friend@example.com', password: 'Password123', displayName: 'Friend' };

function setEnv({ enabled, code }) {
  if (enabled === undefined) delete process.env.REGISTRATION_ENABLED;
  else process.env.REGISTRATION_ENABLED = enabled;
  if (code === undefined) delete process.env.REGISTRATION_INVITE_CODE;
  else process.env.REGISTRATION_INVITE_CODE = code;
}

const register = (body) =>
  fetch(`${baseUrl}/register`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async (res) => ({ status: res.status, body: await res.json() }));

const status = () => fetch(`${baseUrl}/registration-status`).then((res) => res.json());

beforeEach(() => {
  jest.clearAllMocks();
  setEnv({});
  User.countDocuments.mockResolvedValue(1);
  User.findOne.mockResolvedValue(null);
  User.hashPassword.mockResolvedValue('hash');
  User.create.mockImplementation(async (data) => ({ _id: '64b7f0c2a1b2c3d4e5f60718', createdAt: new Date(), ...data }));
  require('../services/emailService').sendWelcomeEmail.mockResolvedValue({});
});

describe('closed (default: nothing configured)', () => {
  it('refuses sign-up without touching the user collection', async () => {
    const res = await register(SIGNUP);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('REGISTRATION_CLOSED');
    // Checked first: no lookups that could reveal whether a username/email exists.
    expect(User.findOne).not.toHaveBeenCalled();
    expect(User.countDocuments).not.toHaveBeenCalled();
    expect(User.create).not.toHaveBeenCalled();
  });

  it('stays closed for REGISTRATION_ENABLED=false and an empty invite code', async () => {
    setEnv({ enabled: 'false', code: '' });
    expect((await register(SIGNUP)).status).toBe(403);
    expect(await status()).toEqual({ mode: 'closed' });
  });

  it('ignores an invite code the server does not have', async () => {
    const res = await register({ ...SIGNUP, inviteCode: 'guess' });
    expect(res.body.error.code).toBe('REGISTRATION_CLOSED');
  });
});

describe('invite-only (REGISTRATION_INVITE_CODE set)', () => {
  beforeEach(() => setEnv({ code: 'let-me-in-42' }));

  it('reports invite mode', async () => {
    expect(await status()).toEqual({ mode: 'invite' });
  });

  it('creates the account with the right code', async () => {
    const res = await register({ ...SIGNUP, inviteCode: 'let-me-in-42' });
    expect(res.status).toBe(201);
    expect(res.body.user.username).toBe('friend');
    // The invite code is never stored on the user.
    expect(User.create.mock.calls[0][0]).not.toHaveProperty('inviteCode');
  });

  it('tolerates surrounding whitespace from copy-paste', async () => {
    expect((await register({ ...SIGNUP, inviteCode: '  let-me-in-42\n' })).status).toBe(201);
  });

  it.each([
    ['a wrong code', 'let-me-in-43'],
    ['a prefix of the code', 'let-me-in'],
    ['an empty code', ''],
  ])('refuses %s', async (_, inviteCode) => {
    const res = await register({ ...SIGNUP, inviteCode });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('INVALID_INVITE_CODE');
    expect(User.create).not.toHaveBeenCalled();
  });

  it('refuses a missing code', async () => {
    const res = await register(SIGNUP);
    expect(res.body.error.code).toBe('INVALID_INVITE_CODE');
  });
});

describe('open (REGISTRATION_ENABLED=true)', () => {
  beforeEach(() => setEnv({ enabled: 'true' }));

  it('allows sign-up without a code', async () => {
    expect(await status()).toEqual({ mode: 'open' });
    expect((await register(SIGNUP)).status).toBe(201);
  });

  it('still applies MAX_ACCOUNTS', async () => {
    User.countDocuments.mockResolvedValue(10);
    const res = await register(SIGNUP);
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe('ACCOUNT_LIMIT_REACHED');
  });
});

describe('checkRegistration', () => {
  it('treats non-string invite codes as wrong', () => {
    setEnv({ code: 'secret' });
    expect(checkRegistration(['secret']).allowed).toBe(false);
    expect(checkRegistration({ toString: () => 'secret' }).allowed).toBe(false);
    expect(checkRegistration(undefined).allowed).toBe(false);
  });
});
