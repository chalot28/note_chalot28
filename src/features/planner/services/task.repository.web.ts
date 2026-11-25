import type { TaskDraft, TaskEntity } from '@/features/planner/types/planner.types';
import { createId } from '@/shared/utils/id.utils';

const KEY = 'liquid_web_tasks_v1';

function readAll(): TaskEntity[] {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null;
    return raw ? (JSON.parse(raw) as TaskEntity[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: TaskEntity[]): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export const taskRepository = {
  async getById(id: string): Promise<TaskEntity | null> {
    return readAll().find((t) => t.id === id) ?? null;
  },

  async getByDateRange(startMs: number, endMs: number): Promise<TaskEntity[]> {
    return readAll().filter((t) => t.createdAt >= startMs && t.createdAt <= endMs);
  },

  async getTasksByDay(dateStr: string): Promise<TaskEntity[]> {
    return readAll()
      .filter((t) => t.dueDate === dateStr)
      .sort((a, b) => Number(a.isCompleted) - Number(b.isCompleted));
  },

  async getMarkedDates(): Promise<Record<string, { marked: boolean; dotColor?: string }>> {
    const map: Record<string, { marked: boolean; dotColor?: string }> = {};
    for (const row of readAll()) {
      if (row.dueDate) map[row.dueDate] = { marked: true };
    }
    return map;
  },

  async create(draft: TaskDraft, notificationId: string | null = null): Promise<TaskEntity> {
    const now = Date.now();
    const entity: TaskEntity = {
      id: draft.id ?? createId('task'),
      title: draft.title.trim(),
      notes: draft.notes?.trim() ?? '',
      groupName: draft.groupName?.trim() || 'Chung',
      priority: draft.priority ?? 'medium',
      dueDate: draft.dueDate,
      reminderAt: draft.reminderAt ?? null,
      recurrence: draft.recurrence ?? 'none',
      notificationId,
      isCompleted: false,
      completedAt: null,
      createdAt: now,
      updatedAt: now,
    };
    writeAll([entity, ...readAll()]);
    return entity;
  },

  async toggleComplete(id: string): Promise<TaskEntity | null> {
    const all = readAll();
    let updated: TaskEntity | null = null;
    const next = all.map((t) => {
      if (t.id !== id) return t;
      const isCompleted = !t.isCompleted;
      updated = { ...t, isCompleted, completedAt: isCompleted ? Date.now() : null, updatedAt: Date.now() };
      return updated;
    });
    writeAll(next);
    return updated;
  },

  async update(id: string, patch: Partial<TaskEntity>): Promise<void> {
    writeAll(readAll().map((t) => (t.id === id ? { ...t, ...patch, updatedAt: Date.now() } : t)));
  },

  async remove(id: string): Promise<void> {
    writeAll(readAll().filter((t) => t.id !== id));
  },

  async getPendingReminders(nowMs = Date.now()): Promise<TaskEntity[]> {
    return readAll().filter(
      (t) => !t.isCompleted && t.reminderAt !== null && t.reminderAt > nowMs,
    );
  },
};
