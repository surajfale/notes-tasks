import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { writable } from 'svelte/store';
import OfflineIndicator from './OfflineIndicator.svelte';

// Create writable store for mocking
const mockIsOnline = writable(true);

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
