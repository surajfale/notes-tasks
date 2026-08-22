import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import SyncStatusIndicator from './SyncStatusIndicator.svelte';

// Create writable stores for mocking. Built inline (rather than importing
// svelte/store) because vi.mock factories run before the module graph's
// static imports are initialized, so these stores must be self-contained.
const { mockPendingCount, mockIsSyncing, mockSyncErrors, mockIsOnline } = vi.hoisted(() => {
  function createStore<T>(initial: T) {
    let value = initial;
    const subscribers = new Set<(v: T) => void>();
    return {
      subscribe(fn: (v: T) => void) {
        fn(value);
        subscribers.add(fn);
        return () => subscribers.delete(fn);
      },
      set(v: T) {
        value = v;
        subscribers.forEach((fn) => fn(v));
      }
    };
  }
  return {
    mockPendingCount: createStore(0),
    mockIsSyncing: createStore(false),
    mockSyncErrors: createStore<string[]>([]),
    mockIsOnline: createStore(true)
  };
});

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
