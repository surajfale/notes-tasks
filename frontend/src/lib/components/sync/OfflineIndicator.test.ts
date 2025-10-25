import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, beforeEach } from 'vitest';
import { writable } from 'svelte/store';
import OfflineIndicator from './OfflineIndicator.svelte';

// Mock the sync store
vi.mock('$lib/storage/sync', () => ({
  isOnline: writable(true)
}));

describe('OfflineIndicator', () => {
  it('does not render when online', () => {
    render(OfflineIndicator);
    const indicator = screen.queryByText("You're offline");
    expect(indicator).toBeFalsy();
  });

  it('renders offline message when offline', async () => {
    const { isOnline } = await import('$lib/storage/sync');
    isOnline.set(false);
    
    render(OfflineIndicator);
    const message = screen.getByText("You're offline");
    expect(message).toBeTruthy();
  });

  it('displays sync information when offline', async () => {
    const { isOnline } = await import('$lib/storage/sync');
    isOnline.set(false);
    
    render(OfflineIndicator);
    const syncInfo = screen.getByText(/Changes will sync when connection is restored/);
    expect(syncInfo).toBeTruthy();
  });
});
