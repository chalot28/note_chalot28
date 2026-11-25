import { useCallback, useEffect, useMemo, useState } from 'react';
import { reminderScheduler } from '@/core/notifications/reminder.scheduler';
import { taskRepository } from '@/features/planner/services/task.repository';
import type {
  DailyAgendaSummary,
  TaskDraft,
  TaskEntity,
} from '@/features/planner/types/planner.types';
import { toIsoDateKey } from '@/shared/utils/date.utils';

export function useDailyAgenda(initialDate = toIsoDateKey()) {
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [tasks, setTasks] = useState<TaskEntity[]>([]);
  const [markedDates, setMarkedDates] = useState<Record<string, { marked: boolean }>>({});
  const [isLoading, setIsLoading] = useState(false);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    try {
      const [dayTasks, dots] = await Promise.all([
        taskRepository.getTasksByDay(selectedDate),
        taskRepository.getMarkedDates(),
      ]);
      setTasks(dayTasks);
      setMarkedDates(dots);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const summary = useMemo<DailyAgendaSummary>(() => {
    const totalCount = tasks.length;
    const completedCount = tasks.filter((t) => t.isCompleted).length;
    return {
      totalCount,
      completedCount,
      progress: totalCount > 0 ? completedCount / totalCount : 0,
    };
  }, [tasks]);

  const createTask = useCallback(
    async (draft: Omit<TaskDraft, 'dueDate'> & { dueDate?: string | null }) => {
      const created = await taskRepository.create({
        ...draft,
        dueDate: draft.dueDate ?? selectedDate,
      });
      const notificationId = await reminderScheduler.scheduleTaskReminder(created);
      if (notificationId) {
        await taskRepository.update(created.id, { notificationId });
      }
      await refresh();
      return { ...created, notificationId };
    },
    [refresh, selectedDate],
  );

  const toggleTask = useCallback(
    async (task: TaskEntity) => {
      const updated = await taskRepository.toggleComplete(task.id);
      if (!updated) return;
      if (updated.isCompleted) {
        await reminderScheduler.cancelReminder(updated.notificationId);
      } else if (updated.reminderAt && updated.reminderAt > Date.now()) {
        const nextId = await reminderScheduler.scheduleTaskReminder(updated);
        if (nextId) await taskRepository.update(updated.id, { notificationId: nextId });
      }
      await refresh();
    },
    [refresh],
  );

  const deleteTask = useCallback(
    async (task: TaskEntity) => {
      await reminderScheduler.cancelReminder(task.notificationId);
      await taskRepository.remove(task.id);
      await refresh();
    },
    [refresh],
  );

  return {
    selectedDate,
    setSelectedDate,
    tasks,
    summary,
    markedDates,
    isLoading,
    refresh,
    createTask,
    toggleTask,
    deleteTask,
  };
}
