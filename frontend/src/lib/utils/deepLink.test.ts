import { describe, it, expect } from 'vitest';
import { readTaskLink, safeRedirectPath } from './deepLink';

const USER = '64b7f0c2a1b2c3d4e5f60718';
const TASK = '64b7f0c2a1b2c3d4e5f60799';

// Build a JWT-shaped token the way the backend's jsonwebtoken does (base64url, unpadded).
function token(payload: object): string {
  const b64url = (o: object) => btoa(JSON.stringify(o)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${b64url({ alg: 'HS256', typ: 'JWT' })}.${b64url(payload)}.signature`;
}

describe('readTaskLink', () => {
  it('reads the task and user from a deep-link token', () => {
    expect(readTaskLink(token({ userId: USER, taskId: TASK, type: 'deep_link', exp: 1 }))).toEqual({ userId: USER, taskId: TASK });
  });

  it('still reads an expired token (expiry is not the browser’s call)', () => {
    expect(readTaskLink(token({ userId: USER, taskId: TASK, type: 'deep_link', exp: 0 }))?.taskId).toBe(TASK);
  });

  it.each([
    ['not a JWT', 'abc'],
    ['garbage payload', 'a.%%%.c'],
    ['wrong token type (e.g. a login JWT)', token({ id: USER })],
    ['unsubscribe token (taskId is not an id)', token({ userId: USER, taskId: 'unsubscribe', type: 'deep_link' })],
    ['path-like task id', token({ userId: USER, taskId: '../settings', type: 'deep_link' })]
  ])('rejects %s', (_, t) => {
    expect(readTaskLink(t)).toBeNull();
  });
});

describe('safeRedirectPath', () => {
  it.each(['/tasks/64b7f0c2a1b2c3d4e5f60799', '/notes?listId=1', '/'])('allows %s', (p) => {
    expect(safeRedirectPath(p)).toBe(p);
  });

  it.each(['//evil.com', '/\\evil.com', 'https://evil.com', 'javascript:alert(1)', '', null, undefined])('rejects %s', (p) => {
    expect(safeRedirectPath(p as string | null | undefined)).toBeNull();
  });
});
