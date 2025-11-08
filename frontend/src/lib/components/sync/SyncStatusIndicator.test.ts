import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import { writable } from 'svelte/store';
import SyncStatusIndicator from './SyncStatusIndicator.svelte';

// Create writable stores for mocking
const mockPendingCount = writable(0);
const mockIsSyncing = writable(false);
const mockSyncErrors = writable<string[]>([]);
const mockIsOnline = writable(true);

// Mock the sync stores and service
vi.mock('$lib/storage/sync', () => ({
  syncService: {
    initialize: vi.fn(),
    sync: vi.fn(),
    clearErrors: vi.fn()
  },
  pendingCount: mockPendingCount,
  isSyncing: mockIsSyncing,
  syncErrors: mockSyncErrors,
  isOnline: mockIsOnline
}));

describe('SyncStatusIndicator', () => {
  it('does not render when no pending changes or errors', () => {
    const { container } = render(SyncStatusIndicator);
    expect(container.querySelector('.fixed')).toBeFalsy();
  });

  it('renders when there are pending changes', async () => {
    mockPendingCount.set(3);
    
    render(SyncStatusIndicator);
    const pendingText = screen.getByText(/Pending Changes/);
    expect(pendingText).toBeTruthy();
  });

  it('displays pending count', async () => {
    mockPendingCount.set(5);
    
    render(SyncStatusIndicator);
    const count = screen.getByText(/5 changes waiting to sync/);
    expect(count).toBeTruthy();
  });

  it('shows syncing status', async () => {
    mockPendingCount.set(2);
    mockIsSyncing.set(true);
    
    render(SyncStatusIndicator);
    const syncingText = screen.getByText(/Syncing\.\.\./);
    expect(syncingText).toBeTruthy();
  });

  it('displays sync errors', async () => {
    mockPendingCount.set(0);
    mockIsSyncing.set(false);
    mockSyncErrors.set(['Network error', 'Server error']);
    
    render(SyncStatusIndicator);
    const errorText = screen.getByText(/Sync Failed/);
    expect(errorText).toBeTruthy();
  });
});
