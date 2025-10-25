import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import type { Note } from '$lib/types/note';

// Mock SvelteKit navigation
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

// Mock stores
vi.mock('$lib/stores/notes', () => ({
  notesStore: {
    toggleArchive: vi.fn(),
    delete: vi.fn()
  }
}));

vi.mock('$lib/stores/lists', () => ({
  listsStore: {
    subscribe: vi.fn((callback) => {
      callback({ items: [], isLoading: false, error: null });
      return () => {};
    })
  }
}));

vi.mock('$lib/stores/syncStatus', () => ({
  isNotePending: vi.fn(() => ({ subscribe: (cb: any) => { cb(false); return () => {}; } }))
}));

describe('NoteCard', () => {
  const mockNote: Note = {
    _id: '1',
    userId: 'user1',
    title: 'Test Note',
    body: 'This is a test note body',
    tags: ['test', 'example'],
    isArchived: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('renders note title', async () => {
    const NoteCard = (await import('./NoteCard.svelte')).default;
    render(NoteCard, { props: { note: mockNote } });
    const title = screen.getByText('Test Note');
    expect(title).toBeTruthy();
  });

  it('renders note body preview', async () => {
    const NoteCard = (await import('./NoteCard.svelte')).default;
    render(NoteCard, { props: { note: mockNote } });
    const body = screen.getByText('This is a test note body');
    expect(body).toBeTruthy();
  });

  it('renders tags', async () => {
    const NoteCard = (await import('./NoteCard.svelte')).default;
    render(NoteCard, { props: { note: mockNote } });
    const tag1 = screen.getByText('#test');
    const tag2 = screen.getByText('#example');
    expect(tag1).toBeTruthy();
    expect(tag2).toBeTruthy();
  });

  it('shows archive button for non-archived notes', async () => {
    const NoteCard = (await import('./NoteCard.svelte')).default;
    render(NoteCard, { props: { note: mockNote } });
    const archiveButton = screen.getByText('Archive');
    expect(archiveButton).toBeTruthy();
  });

  it('shows unarchive button for archived notes', async () => {
    const NoteCard = (await import('./NoteCard.svelte')).default;
    const archivedNote = { ...mockNote, isArchived: true };
    render(NoteCard, { props: { note: archivedNote } });
    const unarchiveButton = screen.getByText('Unarchive');
    expect(unarchiveButton).toBeTruthy();
  });

  it('shows delete button', async () => {
    const NoteCard = (await import('./NoteCard.svelte')).default;
    render(NoteCard, { props: { note: mockNote } });
    const deleteButton = screen.getByText('Delete');
    expect(deleteButton).toBeTruthy();
  });

  it('displays archived status', async () => {
    const NoteCard = (await import('./NoteCard.svelte')).default;
    const archivedNote = { ...mockNote, isArchived: true };
    render(NoteCard, { props: { note: archivedNote } });
    const archivedText = screen.getByText('Archived');
    expect(archivedText).toBeTruthy();
  });
});
