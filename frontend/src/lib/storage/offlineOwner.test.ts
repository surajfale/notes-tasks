import { describe, it, expect, beforeEach, vi } from 'vitest';

vi.mock('$app/environment', () => ({ browser: true }));

const clearAll = vi.fn();
vi.mock('./offline', () => ({
  offlineStorage: { clearAll: (...args: unknown[]) => clearAll(...args) }
}));

const updatePendingCount = vi.fn();
vi.mock('./sync', () => ({
  syncService: { updatePendingCount: (...args: unknown[]) => updatePendingCount(...args) }
}));

import { claimOfflineData, clearOfflineData } from './offlineOwner';

describe('offline data ownership', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    clearAll.mockResolvedValue(undefined);
    updatePendingCount.mockResolvedValue(undefined);
    localStorage.clear();
  });

  it("wipes another user's cache when a different user claims it", async () => {
    await claimOfflineData('user-a');
    clearAll.mockClear();

    await claimOfflineData('user-b');

    expect(clearAll).toHaveBeenCalledTimes(1);
    expect(updatePendingCount).toHaveBeenCalled();
  });

  it('keeps the cache when the same user claims it again (e.g. re-login after a 401)', async () => {
    await claimOfflineData('user-a');
    clearAll.mockClear();

    await claimOfflineData('user-a');

    expect(clearAll).not.toHaveBeenCalled();
  });

  it('wipes untagged data on a fresh login (could be anyone’s)', async () => {
    await claimOfflineData('user-a');
    expect(clearAll).toHaveBeenCalledTimes(1);
  });

  it('adopts untagged data when restoring an existing session', async () => {
    await claimOfflineData('user-a', { adoptUnowned: true });
    expect(clearAll).not.toHaveBeenCalled();

    // ...and it is now tagged, so a different user still triggers a wipe.
    await claimOfflineData('user-b', { adoptUnowned: true });
    expect(clearAll).toHaveBeenCalledTimes(1);
  });

  it('clearOfflineData wipes and untags, so the same user starts clean next time', async () => {
    await claimOfflineData('user-a', { adoptUnowned: true });

    await clearOfflineData();
    expect(clearAll).toHaveBeenCalledTimes(1);

    await claimOfflineData('user-a');
    expect(clearAll).toHaveBeenCalledTimes(2);
  });

  it('a failing IndexedDB clear does not throw out of logout', async () => {
    clearAll.mockRejectedValue(new Error('idb blocked'));
    vi.spyOn(console, 'error').mockImplementation(() => {});
    await expect(clearOfflineData()).resolves.toBeUndefined();
  });
});
