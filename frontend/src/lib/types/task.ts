// Task type definitions

export type TaskPriority = 1 | 2 | 3; // 1=low, 2=normal, 3=high

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
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  isCompleted?: boolean;
  checklistItems?: ChecklistItem[];
}

export interface TaskFilters {
  listId?: string;
  isCompleted?: boolean;
  priority?: TaskPriority;
}
