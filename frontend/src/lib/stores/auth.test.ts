import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';
import type { ApiError as ApiErrorType } from '$lib/types/error';

const getCurrentUser = vi.fn();
vi.mock('$lib/repositories/auth.repository', () => ({
  authRepository: {
    getCurrentUser: (...args: unknown[]) => getCurrentUser(...args),
    login: vi.fn(),
    register: vi.fn()
  }
}));

const getToken = vi.fn();
const setToken = vi.fn();
const clearToken = vi.fn();
vi.mock('$lib/storage/token', () => ({
  tokenStorage: {
    getToken: (...args: unknown[]) => getToken(...args),
    setToken: (...args: unknown[]) => setToken(...args),
    clearToken: (...args: unknown[]) => clearToken(...args)
  }
}));

const FAKE_USER = { _id: '1', username: 'ada', email: 'ada@example.com', displayName: 'Ada', createdAt: '', updatedAt: '' };

/**
 * auth.ts is re-imported fresh (via vi.resetModules()) in every test below
 * to reset its private isInitializing/hasInitialized closure state. That
 * means it also gets a FRESH copy of $lib/types/error on each import — so
 * a statically-imported `ApiError` at this file's top level would be a
 * different class identity than the one auth.ts checks `instanceof`
 * against, and every instanceof check would silently fail. Importing it
 * dynamically here, after the same reset, keeps both sides pointing at the
 * same module instance.
 */
async function freshApiError(): Promise<typeof ApiErrorType> {
  const mod = await import('$lib/types/error');
  return mod.ApiError;
}

describe('authStore.initialize — session-restore resilience', () => {
  beforeEach(() => {
    // resetAllMocks (not clearAllMocks) also drops any leftover
    // mockResolvedValueOnce/mockRejectedValueOnce queue from a previous
    // test — those two mocks are declared once at module scope and shared
    // across every test in this file.
    vi.resetAllMocks();
    vi.resetModules();
    vi.useRealTimers();
  });

  it('leaves the user logged out without touching the token when none is stored', async () => {
    getToken.mockReturnValue(null);
    const { authStore } = await import('./auth');

    await authStore.initialize();

    expect(get(authStore).user).toBeNull();
    expect(getCurrentUser).not.toHaveBeenCalled();
    expect(clearToken).not.toHaveBeenCalled();
  });

  it('restores the session when the token is valid', async () => {
    getToken.mockReturnValue('a-valid-token');
    getCurrentUser.mockResolvedValue({ user: FAKE_USER });
    const { authStore } = await import('./auth');

    await authStore.initialize();

    expect(get(authStore).user).toEqual(FAKE_USER);
    expect(clearToken).not.toHaveBeenCalled();
  });

  it('clears the token and logs out on a genuine 401 (invalid/expired token)', async () => {
    const ApiError = await freshApiError();
    getToken.mockReturnValue('a-stale-token');
    getCurrentUser.mockRejectedValue(new ApiError(401, 'UNAUTHORIZED', 'Not authorized'));
    const { authStore } = await import('./auth');

    await authStore.initialize();

    expect(get(authStore).user).toBeNull();
    expect(clearToken).toHaveBeenCalledTimes(1);
  });

  it('does NOT clear the token on a network error, and retries once', async () => {
    const ApiError = await freshApiError();
    vi.useFakeTimers();
    getToken.mockReturnValue('a-perfectly-good-token');
    let callCount = 0;
    getCurrentUser.mockImplementation(() => {
      callCount += 1;
      if (callCount === 1) {
        return Promise.reject(new ApiError(0, 'NETWORK_ERROR', 'Network request failed'));
      }
      return Promise.resolve({ user: FAKE_USER });
    });
    const { authStore } = await import('./auth');

    const initPromise = authStore.initialize();
    await vi.advanceTimersByTimeAsync(3000);
    await initPromise;

    expect(get(authStore).user).toEqual(FAKE_USER);
    expect(callCount).toBe(2);
    expect(clearToken).not.toHaveBeenCalled();
  });

  it('keeps the token even if the retry also fails, so a later reload can recover', async () => {
    const ApiError = await freshApiError();
    vi.useFakeTimers();
    getToken.mockReturnValue('still-a-good-token-backend-is-just-asleep');
    getCurrentUser.mockRejectedValue(new ApiError(0, 'NETWORK_ERROR', 'Network request failed'));
    const { authStore } = await import('./auth');

    const initPromise = authStore.initialize();
    await vi.advanceTimersByTimeAsync(3000);
    await initPromise;

    expect(get(authStore).user).toBeNull();
    expect(getCurrentUser).toHaveBeenCalledTimes(2);
    expect(clearToken).not.toHaveBeenCalled();
  });

  it('does NOT clear the token on a 5xx server error', async () => {
    const ApiError = await freshApiError();
    vi.useFakeTimers();
    getToken.mockReturnValue('a-fine-token');
    getCurrentUser.mockRejectedValue(new ApiError(503, 'SERVICE_UNAVAILABLE', 'Backend is warming up'));
    const { authStore } = await import('./auth');

    const initPromise = authStore.initialize();
    await vi.advanceTimersByTimeAsync(3000);
    await initPromise;

    expect(get(authStore).user).toBeNull();
    expect(clearToken).not.toHaveBeenCalled();
  });
});
