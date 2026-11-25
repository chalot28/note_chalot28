export type TaskPriority = 'low' | 'medium' | 'high';

export type RepeatRule = 'none' | 'daily' | 'weekly' | 'monthly';

export interface TaskEntity {
  id: string;
  title: string;
  notes: string;
  groupName: string;
  priority: TaskPriority;
  dueDate: string | null;
  reminderAt: number | null;
  recurrence: RepeatRule;
  notificationId: string | null;
  isCompleted: boolean;
  completedAt: number | null;
  createdAt: number;
  updatedAt: number;
}

export interface TaskDraft {
  id?: string;
  title: string;
  notes?: string;
  groupName?: string;
  priority?: TaskPriority;
  dueDate: string | null;
  reminderAt?: number | null;
  recurrence?: RepeatRule;
}

export interface DailyAgendaSummary {
  totalCount: number;
  completedCount: number;
  progress: number;
}
