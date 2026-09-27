import { render, screen, fireEvent } from '@testing-library/svelte';
import { describe, it, expect, vi } from 'vitest';
import type { TaskReminder } from '$lib/types/task';

const prefs = { emailNotificationsEnabled: true, browserNotificationsEnabled: false, timezone: 'UTC' };
vi.mock('$lib/stores/notifications', () => ({
  notificationStore: {
    subscribe: (cb: (v: unknown) => void) => {
      cb({ preferences: prefs, isLoading: false, error: null });
      return () => {};
    },
    loadPreferences: vi.fn()
  }
}));

async function renderEditor(reminders: TaskReminder[] = []) {
  const ReminderEditor = (await import('./ReminderEditor.svelte')).default;
  return render(ReminderEditor, { props: { reminders } });
}

function saved(overrides: Partial<TaskReminder> = {}): TaskReminder {
  return {
    _id: 'r1',
    startAt: new Date(Date.now() + 86_400_000).toISOString(),
    timezone: 'UTC',
    repeat: { frequency: 'daily', interval: 2, weekdays: [] },
    channels: { email: true, push: false },
    nextFireAt: new Date(Date.now() + 86_400_000).toISOString(),
    ...overrides
  };
}

describe('ReminderEditor', () => {
  it('shows an empty state', async () => {
    await renderEditor();
    expect(screen.getByText(/No reminders/)).toBeTruthy();
  });

  it('summarizes existing reminders', async () => {
    await renderEditor([saved()]);
    expect(screen.getByText(/Every 2 days · Email/)).toBeTruthy();
  });

  it('adds a reminder and opens its form', async () => {
    await renderEditor();
    await fireEvent.click(screen.getByRole('button', { name: /Add reminder/ }));
    expect(screen.getByLabelText('Date')).toBeTruthy();
    expect(screen.getByLabelText('Time')).toBeTruthy();
    expect((screen.getByLabelText('Repeat') as HTMLSelectElement).value).toBe('none');
  });

  it('shows weekday chips for weekly and an interval for repeating reminders', async () => {
    await renderEditor();
    await fireEvent.click(screen.getByRole('button', { name: /Add reminder/ }));
    await fireEvent.change(screen.getByLabelText('Repeat'), { target: { value: 'weekly' } });

    expect(screen.getByRole('group', { name: 'Days of the week' })).toBeTruthy();
    expect(screen.getByLabelText('Repeat every how many weeks')).toBeTruthy();

    await fireEvent.click(screen.getByRole('button', { name: 'Mon' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByText(/^Weekly on .*Mon/)).toBeTruthy();
  });

  it('refuses to close with no channel selected', async () => {
    await renderEditor();
    await fireEvent.click(screen.getByRole('button', { name: /Add reminder/ }));
    await fireEvent.click(screen.getByRole('button', { name: 'Email' })); // turn email off
    await fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(screen.getByRole('alert').textContent).toMatch(/email, browser/i);
  });

  it('warns when browser is picked but push is off for the account', async () => {
    await renderEditor();
    await fireEvent.click(screen.getByRole('button', { name: /Add reminder/ }));
    await fireEvent.click(screen.getByRole('button', { name: 'Browser' }));
    expect(screen.getByText(/Browser notifications are off on your account/)).toBeTruthy();
  });

  it('cancelling a new reminder removes it', async () => {
    await renderEditor();
    await fireEvent.click(screen.getByRole('button', { name: /Add reminder/ }));
    await fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.getByText(/No reminders/)).toBeTruthy();
  });

  it('removes a reminder', async () => {
    await renderEditor([saved()]);
    await fireEvent.click(screen.getByRole('button', { name: 'Remove reminder' }));
    expect(screen.getByText(/No reminders/)).toBeTruthy();
  });
});
