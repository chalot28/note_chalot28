import { and, asc, desc, eq, gte, lte } from 'drizzle-orm';
import { db } from '@/core/db/client';
import { tasks } from '@/core/db/schema';
import type { TaskDraft, TaskEntity } from '@/features/planner/types/planner.types';
import { createId } from '@/shared/utils/id.utils';

function mapTaskRow(row: typeof tasks.$inferSelect): TaskEntity {
  return {
    id: row.id,
    title: row.title,
    notes: row.notes,
    groupName: row.groupName,
    priority: row.priority,
    dueDate: row.dueDate ?? null,
    reminderAt: row.reminderAt ?? null,
    recurrence: row.recurrence,
    notificationId: row.notificationId ?? null,
    isCompleted: row.isCompleted,
    completedAt: row.completedAt ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const taskRepository = {
  async getById(id: string): Promise<TaskEntity | null> {
    const rows = await db.select().from(tasks).where(eq(tasks.id, id)).limit(1);
    const first = rows[0];
    return first ? mapTaskRow(first) : null;
  },

  async getByDateRange(startMs: number, endMs: number): Promise<TaskEntity[]> {
    const rows = await db
      .select()
      .from(tasks)
      .where(and(gte(tasks.createdAt, startMs), lte(tasks.createdAt, endMs)))
      .orderBy(asc(tasks.isCompleted), desc(tasks.createdAt));
    return rows.map(mapTaskRow);
  },

  async getTasksByDay(dateStr: string): Promise<TaskEntity[]> {
    const rows = await db
      .select()
      .from(tasks)
      .where(eq(tasks.dueDate, dateStr))
      .orderBy(asc(tasks.isCompleted), desc(tasks.priority), asc(tasks.reminderAt));
    return rows.map(mapTaskRow);
  },

  async getMarkedDates(): Promise<Record<string, { marked: boolean; dotColor?: string }>> {
    const rows = await db.select({ dueDate: tasks.dueDate, isCompleted: tasks.isCompleted }).from(tasks);
    const map: Record<string, { marked: boolean; dotColor?: string }> = {};
    for (const row of rows) {
      if (!row.dueDate) continue;
      if (!map[row.dueDate] || !row.isCompleted) {
        map[row.dueDate] = { marked: true };
      }
    }
    return map;
  },

  async create(draft: TaskDraft, notificationId: string | null = null): Promise<TaskEntity> {
    const now = Date.now();
    const record = {
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
    await db.insert(tasks).values(record);
    return record;
  },

  async toggleComplete(id: string): Promise<TaskEntity | null> {
    const existing = await this.getById(id);
    if (!existing) return null;
    const isCompleted = !existing.isCompleted;
    const now = Date.now();
    await db
      .update(tasks)
      .set({ isCompleted, completedAt: isCompleted ? now : null, updatedAt: now })
      .where(eq(tasks.id, id));
    return { ...existing, isCompleted, completedAt: isCompleted ? now : null, updatedAt: now };
  },

  async update(id: string, patch: Partial<TaskEntity>): Promise<void> {
    await db
      .update(tasks)
      .set({ ...patch, updatedAt: Date.now() })
      .where(eq(tasks.id, id));
  },

  async remove(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  },

  async getPendingReminders(nowMs = Date.now()): Promise<TaskEntity[]> {
    const rows = await db
      .select()
      .from(tasks)
      .where(and(eq(tasks.isCompleted, false), gte(tasks.reminderAt, nowMs)));
    return rows.map(mapTaskRow);
  },
};
