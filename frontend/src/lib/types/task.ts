// Task type definitions

export type TaskPriority = 1 | 2 | 3; // 1=low, 2=normal, 3=high

/** How a reminder repeats. `hourly`/`daily`/`weekly`/`monthly` use `interval` ("every N"). */
export type ReminderFrequency = 'none' | 'hourly' | 'daily' | 'weekly' | 'monthly';

/** ISO weekday: 1 = Monday ... 7 = Sunday. */
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/**
 * A custom reminder on a task. The server computes the schedule
 * (backend/src/services/reminders.js); `nextFireAt` / `lastFiredAt` are
 * server-owned and only present on saved reminders.
 */
export interface TaskReminder {
  _id?: string;
  /** First occurrence (ISO instant). */
  startAt: string;
  /** IANA timezone the reminder was set in; repeats follow its wall clock. */
  timezone: string;
  repeat: {
    frequency: ReminderFrequency;
    interval: number;
    /** Weekly only; empty means the weekday of `startAt`. */
    weekdays: IsoWeekday[];
  };
  channels: { email: boolean; push: boolean };
  nextFireAt?: string | null;
  lastFiredAt?: string | null;
}

export interface ChecklistItem {
  _id?: string;
  text: string;
  isCompleted: boolean;
  order: number;
}

export interface Task {
  _id: string;
  userId: string;
  listId?: string;
  title: string;
  description: string;
  dueAt?: string;
  isCompleted: boolean;
  priority: TaskPriority;
  checklistItems: ChecklistItem[];
  reminders: TaskReminder[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskData {
  title: string;
  description: string;
  dueAt?: string;
  priority?: TaskPriority;
  listId?: string;
  checklistItems?: ChecklistItem[];
  reminders?: TaskReminder[];
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  isCompleted?: boolean;
}

export interface TaskFilters {
  listId?: string;
  isCompleted?: boolean;
  priority?: TaskPriority;
}
