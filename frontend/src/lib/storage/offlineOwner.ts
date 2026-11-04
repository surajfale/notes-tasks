/**
 * Offline cache ownership.
 *
 * IndexedDB (storage/offline.ts) is per browser, not per account, and the
 * sync service pushes whatever is pending using whichever JWT is current.
 * Without an owner check, user A's unsynced offline edits would be uploaded
 * into user B's account after B signs in on the same browser, and A's
 * cached notes would be shown to B while offline. So the cache is tagged
 * with the user id that wrote it and wiped whenever a different account
 * (or nobody) takes over.
 */

import { browser } from '$app/environment';
import { offlineStorage } from './offline';
import { syncService } from './sync';

const OWNER_KEY = 'offlineDataOwner';

function readOwner(): string | null {
  try {
    return localStorage.getItem(OWNER_KEY);
  } catch {
    return null;
  }
}

function writeOwner(userId: string | null): void {
  try {
    if (userId) localStorage.setItem(OWNER_KEY, userId);
    else localStorage.removeItem(OWNER_KEY);
  } catch {
    // Storage unavailable (private mode etc.): the next claim will wipe.
  }
}

async function wipe(): Promise<void> {
  try {
    await offlineStorage.clearAll();
  } catch (error) {
    console.error('Failed to clear offline data:', error);
  }
  await syncService.updatePendingCount().catch(() => {});
}

/**
 * Drop all cached and pending offline data (on logout / account deletion).
 * Unsynced offline edits are discarded.
 */
export async function clearOfflineData(): Promise<void> {
  if (!browser) return;
  writeOwner(null);
  await wipe();
}

/**
 * Make the offline cache belong to `userId`, wiping it first if anyone else
 * wrote it. Call BEFORE storing the new JWT so the sync service can never
 * push the previous account's pending items with the new token.
 *
 * @param adoptUnowned - Keep untagged data instead of wiping it. Only for
 *   restoring an existing session: that data was written under this same
 *   token by a build that predates ownership tags.
 */
export async function claimOfflineData(
  userId: string,
  { adoptUnowned = false }: { adoptUnowned?: boolean } = {}
): Promise<void> {
  if (!browser) return;
  const owner = readOwner();
  if (owner === userId) return;
  if (owner !== null || !adoptUnowned) await wipe();
  writeOwner(userId);
}
