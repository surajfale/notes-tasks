import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { writable } from 'svelte/store';
import { tick } from 'svelte';

// Hoisted so the vi.mock factory below can close over them.
const mocks = vi.hoisted(() => ({
  sync: vi.fn(),
  clearErrors: vi.fn()
}));

const isOnline = writable(true);
const isSyncing = writable(false);
const pendingCount = writable(0);
const syncErrors = writable<unknown[]>([]);

vi.mock('$lib/storage/sync', () => ({
  syncService: { sync: mocks.sync, clearErrors: mocks.clearErrors },
  isOnline: { subscribe: (fn: any) => isOnline.subscribe(fn) },
  isSyncing: { subscribe: (fn: any) => isSyncing.subscribe(fn) },
  pendingCount: { subscribe: (fn: any) => pendingCount.subscribe(fn) },
  syncErrors: { subscribe: (fn: any) => syncErrors.subscribe(fn) }
}));

import SyncButton from './SyncButton.svelte';

describe('SyncButton', () => {
  const reload = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    isOnline.set(true);
    isSyncing.set(false);
    pendingCount.set(0);
    syncErrors.set([]);
    mocks.sync.mockResolvedValue(undefined);
    Object.defineProperty(window, 'location', {
      configurable: true,
      value: { ...window.location, reload }
    });
  });

  it('pushes pending changes, then reloads to pull fresh data', async () => {
    render(SyncButton);
    await fireEvent.click(screen.getByRole('button', { name: 'Sync and refresh' }));
    await tick();

    expect(mocks.sync).toHaveBeenCalledOnce();
    expect(reload).toHaveBeenCalledOnce();
  });

  it('does not reload when the sync reports errors', async () => {
    mocks.sync.mockImplementation(async () => syncErrors.set([{ message: 'boom' }]));
    render(SyncButton);
    await fireEvent.click(screen.getByRole('button'));
    await tick();

    expect(mocks.sync).toHaveBeenCalledOnce();
    expect(reload).not.toHaveBeenCalled();
  });

  it('does nothing while offline and says why', async () => {
    isOnline.set(false);
    render(SyncButton);
    const button = screen.getByRole('button', { name: /Offline/ });
    await fireEvent.click(button);

    expect(mocks.sync).not.toHaveBeenCalled();
    expect(reload).not.toHaveBeenCalled();
  });

  it('labels the pending change count', () => {
    pendingCount.set(3);
    render(SyncButton);
    expect(screen.getByRole('button', { name: 'Sync 3 pending changes and refresh' })).toBeTruthy();
  });

  it('is disabled while a background sync is already running', () => {
    isSyncing.set(true);
    render(SyncButton);
    expect((screen.getByRole('button') as HTMLButtonElement).disabled).toBe(true);
  });
});
