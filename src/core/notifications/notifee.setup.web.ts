import type { TaskEntity } from '@/features/planner/types/planner.types';

export const REMINDER_CHANNEL_ID = 'liquid-reminders';
export const REMINDER_CATEGORY_ID = 'task_reminder_actions';
export const ACTION_MARK_DONE = 'mark_done';
export const ACTION_SNOOZE_15M = 'snooze_15m';

export interface NotificationActionHandlers {
  onMarkDone: (taskId: string) => Promise<void> | void;
  onSnooze15m: (taskId: string) => Promise<void> | void;
}

type InAppReminderListener = (task: TaskEntity) => void;

const inAppListeners = new Set<InAppReminderListener>();
let activeHandlers: NotificationActionHandlers | null = null;

export function getWebNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
}

export async function requestWebNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

export function emitInAppReminder(task: TaskEntity): void {
  for (const listener of inAppListeners) {
    listener(task);
  }
}

export function subscribeInAppReminders(listener: InAppReminderListener): () => void {
  inAppListeners.add(listener);
  return () => {
    inAppListeners.delete(listener);
  };
}

export async function dispatchWebNotificationAction(
  actionId: typeof ACTION_MARK_DONE | typeof ACTION_SNOOZE_15M,
  taskId: string,
): Promise<void> {
  if (!activeHandlers) return;
  if (actionId === ACTION_MARK_DONE) {
    await activeHandlers.onMarkDone(taskId);
  } else if (actionId === ACTION_SNOOZE_15M) {
    await activeHandlers.onSnooze15m(taskId);
  }
}

export async function initializeNotifications(): Promise<boolean> {
  const perm = getWebNotificationPermission();
  return perm === 'granted';
}

export function registerNotificationHandlers(handlers: NotificationActionHandlers): () => void {
  activeHandlers = handlers;
  return () => {
    if (activeHandlers === handlers) {
      activeHandlers = null;
    }
  };
}
