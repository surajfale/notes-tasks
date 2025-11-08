// Task type definitions

export type TaskPriority = 1 | 2 | 3; // 1=low, 2=normal, 3=high

export type NotificationTiming = 'same_day' | '1_day_before' | '2_days_before';

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
  notificationEnabled: boolean;
  notificationTimings: NotificationTiming[];
  notificationsSent?: NotificationTiming[];
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
  notificationEnabled?: boolean;
  notificationTimings?: NotificationTiming[];
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  isCompleted?: boolean;
  checklistItems?: ChecklistItem[];
  notificationEnabled?: boolean;
  notificationTimings?: NotificationTiming[];
}

export interface TaskFilters {
  listId?: string;
  isCompleted?: boolean;
  priority?: TaskPriority;
}
