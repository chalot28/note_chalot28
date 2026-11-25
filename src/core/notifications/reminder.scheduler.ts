import notifee, {
  RepeatFrequency,
  TriggerType,
  type TimestampTrigger,
} from '@notifee/react-native';
import {
  ACTION_MARK_DONE,
  ACTION_SNOOZE_15M,
  REMINDER_CATEGORY_ID,
  REMINDER_CHANNEL_ID,
} from '@/core/notifications/notifee.setup';
import type { RepeatRule, TaskEntity } from '@/features/planner/types/planner.types';

function mapRepeatFrequency(rule: RepeatRule): RepeatFrequency | undefined {
  switch (rule) {
    case 'daily':
      return RepeatFrequency.DAILY;
    case 'weekly':
      return RepeatFrequency.WEEKLY;
    default:
      return undefined;
  }
}

export const reminderScheduler = {
  async scheduleTaskReminder(task: TaskEntity): Promise<string | null> {
    if (!task.reminderAt || task.reminderAt <= Date.now() || task.isCompleted) {
      return null;
    }

    if (task.notificationId) {
      await notifee.cancelNotification(task.notificationId);
    }

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: task.reminderAt,
      repeatFrequency: mapRepeatFrequency(task.recurrence),
    };

    const notificationId = await notifee.createTriggerNotification(
      {
        id: `task_${task.id}`,
        title: task.title,
        body: task.notes || 'Đến giờ thực hiện công việc đã lên lịch',
        data: { taskId: task.id },
        android: {
          channelId: REMINDER_CHANNEL_ID,
          pressAction: { id: 'default' },
          actions: [
            { title: 'Hoàn thành', pressAction: { id: ACTION_MARK_DONE } },
            { title: 'Nhắc lại 15p', pressAction: { id: ACTION_SNOOZE_15M } },
          ],
        },
        ios: {
          categoryId: REMINDER_CATEGORY_ID,
          sound: 'default',
        },
      },
      trigger,
    );

    return notificationId;
  },

  async cancelReminder(notificationId: string | null | undefined): Promise<void> {
    if (!notificationId) return;
    await notifee.cancelNotification(notificationId);
  },

  async rescheduleSnooze(task: TaskEntity, minutes = 15): Promise<string | null> {
    const snoozedAt = Date.now() + minutes * 60_000;
    return this.scheduleTaskReminder({
      ...task,
      reminderAt: snoozedAt,
      recurrence: 'none',
    });
  },
};
