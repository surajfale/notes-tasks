import { describe, it, expect, beforeEach, vi } from 'vitest';
import { get } from 'svelte/store';

// Mock browser environment
vi.mock('$app/environment', () => ({
  browser: true
}));

// Mock offline storage
vi.mock('$lib/storage/offline', () => ({
  offlineStorage: {
    getAllPending: vi.fn().mockResolvedValue({
      notes: [],
      tasks: [],
      lists: []
    })
  }
}));

describe('syncStatusService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should initialize with empty pending sets', async () => {
    const { syncStatusService } = await import('./syncStatus');
    const state = get(syncStatusService);
    
    expect(state.pendingNoteIds.size).toBe(0);
    expect(state.pendingTaskIds.size).toBe(0);
    expect(state.pendingListIds.size).toBe(0);
  });

  it('should mark note as pending', async () => {
    const { syncStatusService } = await import('./syncStatus');
    
    syncStatusService.markNotePending('note-1');
    const state = get(syncStatusService);
    
    expect(state.pendingNoteIds.has('note-1')).toBe(true);
  });

  it('should mark task as pending', async () => {
    const { syncStatusService } = await import('./syncStatus');
    
    syncStatusService.markTaskPending('task-1');
    const state = get(syncStatusService);
    
    expect(state.pendingTaskIds.has('task-1')).toBe(true);
  });

  it('should mark list as pending', async () => {
    const { syncStatusService } = await import('./syncStatus');
    
    syncStatusService.markListPending('list-1');
    const state = get(syncStatusService);
    
    expect(state.pendingListIds.has('list-1')).toBe(true);
  });

  it('should clear note pending status', async () => {
    const { syncStatusService } = await import('./syncStatus');
    
    syncStatusService.markNotePending('note-1');
    syncStatusService.clearNotePending('note-1');
    const state = get(syncStatusService);
    
    expect(state.pendingNoteIds.has('note-1')).toBe(false);
  });

  it('should clear task pending status', async () => {
    const { syncStatusService } = await import('./syncStatus');
    
    syncStatusService.markTaskPending('task-1');
    syncStatusService.clearTaskPending('task-1');
    const state = get(syncStatusService);
    
    expect(state.pendingTaskIds.has('task-1')).toBe(false);
  });

  it('should clear list pending status', async () => {
    const { syncStatusService } = await import('./syncStatus');
    
    syncStatusService.markListPending('list-1');
    syncStatusService.clearListPending('list-1');
    const state = get(syncStatusService);
    
    expect(state.pendingListIds.has('list-1')).toBe(false);
  });

  it('should handle multiple pending items', async () => {
    const { syncStatusService } = await import('./syncStatus');
    
    syncStatusService.markNotePending('note-1');
    syncStatusService.markNotePending('note-2');
    syncStatusService.markTaskPending('task-1');
    
    const state = get(syncStatusService);
    
    expect(state.pendingNoteIds.size).toBe(2);
    expect(state.pendingTaskIds.size).toBe(1);
    expect(state.pendingNoteIds.has('note-1')).toBe(true);
    expect(state.pendingNoteIds.has('note-2')).toBe(true);
  });
});

describe('derived pending stores', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  it('should check if note is pending', async () => {
    const { syncStatusService, isNotePending } = await import('./syncStatus');
    
    syncStatusService.markNotePending('note-1');
    const isPending = get(isNotePending('note-1'));
    
    expect(isPending).toBe(true);
  });

  it('should check if task is pending', async () => {
    const { syncStatusService, isTaskPending } = await import('./syncStatus');
    
    syncStatusService.markTaskPending('task-1');
    const isPending = get(isTaskPending('task-1'));
    
    expect(isPending).toBe(true);
  });

  it('should check if list is pending', async () => {
    const { syncStatusService, isListPending } = await import('./syncStatus');
    
    syncStatusService.markListPending('list-1');
    const isPending = get(isListPending('list-1'));
    
    expect(isPending).toBe(true);
  });

  it('should return false for non-pending items', async () => {
    const { isNotePending } = await import('./syncStatus');
    
    const isPending = get(isNotePending('non-existent'));
    expect(isPending).toBe(false);
  });
});
