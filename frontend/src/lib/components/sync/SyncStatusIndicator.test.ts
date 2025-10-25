import { render, screen } from '@testing-library/svelte';
import { describe, it, expect } from 'vitest';
import { writable } from 'svelte/store';
import SyncStatusIndicator from './SyncStatusIndicator.svelte';

// Mock the sync stores and service
vi.mock('$lib/storage/sync', () => ({
  syncService: {
    initialize: vi.fn(),
    sync: vi.fn(),
    clearErrors: vi.fn()
  },
  pendingCount: writable(0),
  isSyncing: writable(false),
  syncErrors: writable([]),
  isOnline: writable(true)
}));

describe('SyncStatusIndicator', () => {
  it('does not render when no pending changes or errors', () => {
    const { container } = render(SyncStatusIndicator);
    expect(container.querySelector('.fixed')).toBeFalsy();
  });

  it('renders when there are pending changes', async () => {
    const { pendingCount } = await import('$lib/storage/sync');
    pendingCount.set(3);
    
    render(SyncStatusIndicator);
    const pendingText = screen.getByText(/Pending Changes/);
    expect(pendingText).toBeTruthy();
  });

  it('displays pending count', async () => {
    const { pendingCount } = await import('$lib/storage/sync');
    pendingCount.set(5);
    
    render(SyncStatusIndicator);
    const count = screen.getByText(/5 changes waiting to sync/);
    expect(count).toBeTruthy();
  });

  it('shows syncing status', async () => {
    const { isSyncing, pendingCount } = await import('$lib/storage/sync');
    pendingCount.set(2);
    isSyncing.set(true);
    
    render(SyncStatusIndicator);
    const syncingText = screen.getByText(/Syncing\.\.\./);
    expect(syncingText).toBeTruthy();
  });

  it('displays sync errors', async () => {
    const { syncErrors, pendingCount, isSyncing } = await import('$lib/storage/sync');
    pendingCount.set(0);
    isSyncing.set(false);
    syncErrors.set(['Network error', 'Server error']);
    
    render(SyncStatusIndicator);
    const errorText = screen.getByText(/Sync Failed/);
    expect(errorText).toBeTruthy();
  });
});
