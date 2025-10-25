import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import type { List } from '$lib/types/list';

// Mock stores
vi.mock('$lib/stores/lists', () => ({
  listsStore: {
    delete: vi.fn()
  }
}));

vi.mock('$lib/stores/notes', () => ({
  notesStore: {
    subscribe: vi.fn((callback) => {
      callback({ items: [], isLoading: false, error: null });
      return () => {};
    })
  }
}));

vi.mock('$lib/stores/tasks', () => ({
  tasksStore: {
    subscribe: vi.fn((callback) => {
      callback({ items: [], isLoading: false, error: null });
      return () => {};
    })
  }
}));

describe('ListCard', () => {
  const mockList: List = {
    _id: '1',
    userId: 'user1',
    title: 'Work',
    color: '#3B82F6',
    emoji: '💼',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('renders list title', async () => {
    const ListCard = (await import('./ListCard.svelte')).default;
    render(ListCard, { props: { list: mockList } });
    const title = screen.getByText('Work');
    expect(title).toBeTruthy();
  });

  it('displays emoji when provided', async () => {
    const ListCard = (await import('./ListCard.svelte')).default;
    render(ListCard, { props: { list: mockList } });
    const emoji = screen.getByText('💼');
    expect(emoji).toBeTruthy();
  });

  it('shows edit button', async () => {
    const ListCard = (await import('./ListCard.svelte')).default;
    render(ListCard, { props: { list: mockList } });
    const editButton = screen.getByText('Edit');
    expect(editButton).toBeTruthy();
  });

  it('shows delete button', async () => {
    const ListCard = (await import('./ListCard.svelte')).default;
    render(ListCard, { props: { list: mockList } });
    const deleteButton = screen.getByText('Delete');
    expect(deleteButton).toBeTruthy();
  });

  it('displays item count', async () => {
    const ListCard = (await import('./ListCard.svelte')).default;
    render(ListCard, { props: { list: mockList } });
    const itemCount = screen.getByText(/items/);
    expect(itemCount).toBeTruthy();
  });

  it('renders without emoji', async () => {
    const ListCard = (await import('./ListCard.svelte')).default;
    const listWithoutEmoji = { ...mockList, emoji: undefined };
    const { container } = render(ListCard, { props: { list: listWithoutEmoji } });
    expect(container).toBeTruthy();
  });
});
