// Task type definitions

export type TaskPriority = 1 | 2 | 3; // 1=low, 2=normal, 3=high

export interface Task {
  _id: string;
  userId: string;
  listId?: string;
  title: string;
  description: string;
  dueAt?: string;
  isCompleted: boolean;
  priority: TaskPriority;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskData {
  title: string;
  description: string;
  dueAt?: string;
  priority?: TaskPriority;
  listId?: string;
}

export interface UpdateTaskData extends Partial<CreateTaskData> {
  isCompleted?: boolean;
}

export interface TaskFilters {
  listId?: string;
  isCompleted?: boolean;
  priority?: TaskPriority;
}
