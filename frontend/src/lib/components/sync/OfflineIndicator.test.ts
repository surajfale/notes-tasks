import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import OfflineIndicator from './OfflineIndicator.svelte';

// Create writable store for mocking. Built inline (rather than importing
// svelte/store) because vi.mock factories run before the module graph's
// static imports are initialized, so `mockIsOnline` must be self-contained.
const { mockIsOnline } = vi.hoisted(() => {
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
  return { mockIsOnline: createStore(true) };
});

// Mock the sync store
vi.mock('$lib/storage/sync', () => ({
  isOnline: mockIsOnline
}));

describe('OfflineIndicator', () => {
  it('does not render when online', () => {
    render(OfflineIndicator);
    const indicator = screen.queryByText("You're offline");
    expect(indicator).toBeFalsy();
  });

  it('renders offline message when offline', async () => {
    mockIsOnline.set(false);
    
    render(OfflineIndicator);
    const message = screen.getByText("You're offline");
    expect(message).toBeTruthy();
  });

  it('displays sync information when offline', async () => {
    mockIsOnline.set(false);
    
    render(OfflineIndicator);
    const syncInfo = screen.getByText(/Changes will sync when connection is restored/);
    expect(syncInfo).toBeTruthy();
  });
});
