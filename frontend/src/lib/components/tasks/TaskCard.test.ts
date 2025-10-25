import { render, screen } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import type { Task } from '$lib/types/task';

// Mock SvelteKit navigation
vi.mock('$app/navigation', () => ({
  goto: vi.fn()
}));

// Mock stores
vi.mock('$lib/stores/tasks', () => ({
  tasksStore: {
    toggleComplete: vi.fn(),
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
  isTaskPending: vi.fn(() => ({ subscribe: (cb: any) => { cb(false); return () => {}; } }))
}));

describe('TaskCard', () => {
  const mockTask: Task = {
    _id: '1',
    userId: 'user1',
    title: 'Test Task',
    description: 'This is a test task description',
    priority: 2,
    isCompleted: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  it('renders task title', async () => {
    const TaskCard = (await import('./TaskCard.svelte')).default;
    render(TaskCard, { props: { task: mockTask } });
    const title = screen.getByText('Test Task');
    expect(title).toBeTruthy();
  });

  it('renders task description', async () => {
    const TaskCard = (await import('./TaskCard.svelte')).default;
    render(TaskCard, { props: { task: mockTask } });
    const description = screen.getByText('This is a test task description');
    expect(description).toBeTruthy();
  });

  it('displays priority badge', async () => {
    const TaskCard = (await import('./TaskCard.svelte')).default;
    render(TaskCard, { props: { task: mockTask } });
    const priority = screen.getByText('Normal');
    expect(priority).toBeTruthy();
  });

  it('displays low priority', async () => {
    const TaskCard = (await import('./TaskCard.svelte')).default;
    const lowPriorityTask = { ...mockTask, priority: 1 as const };
    render(TaskCard, { props: { task: lowPriorityTask } });
    const priority = screen.getByText('Low');
    expect(priority).toBeTruthy();
  });

  it('displays high priority', async () => {
    const TaskCard = (await import('./TaskCard.svelte')).default;
    const highPriorityTask = { ...mockTask, priority: 3 as const };
    render(TaskCard, { props: { task: highPriorityTask } });
    const priority = screen.getByText('High');
    expect(priority).toBeTruthy();
  });

  it('shows completion checkbox', async () => {
    const TaskCard = (await import('./TaskCard.svelte')).default;
    render(TaskCard, { props: { task: mockTask } });
    const checkbox = screen.getByLabelText('Mark as complete');
    expect(checkbox).toBeTruthy();
  });

  it('shows completed status for completed tasks', async () => {
    const TaskCard = (await import('./TaskCard.svelte')).default;
    const completedTask = { ...mockTask, isCompleted: true };
    render(TaskCard, { props: { task: completedTask } });
    const completedText = screen.getByText('Completed');
    expect(completedText).toBeTruthy();
  });

  it('shows delete button', async () => {
    const TaskCard = (await import('./TaskCard.svelte')).default;
    render(TaskCard, { props: { task: mockTask } });
    const deleteButton = screen.getByText('Delete');
    expect(deleteButton).toBeTruthy();
  });
});
