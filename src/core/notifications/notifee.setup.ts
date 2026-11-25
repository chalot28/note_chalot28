import notifee, {
  AndroidImportance,
  AuthorizationStatus,
  EventType,
  type Event,
} from '@notifee/react-native';
import { Platform } from 'react-native';

export const REMINDER_CHANNEL_ID = 'liquid-reminders';
export const REMINDER_CATEGORY_ID = 'task_reminder_actions';
export const ACTION_MARK_DONE = 'mark_done';
export const ACTION_SNOOZE_15M = 'snooze_15m';

export interface NotificationActionHandlers {
  onMarkDone: (taskId: string) => Promise<void> | void;
  onSnooze15m: (taskId: string) => Promise<void> | void;
}

export async function initializeNotifications(): Promise<boolean> {
  const settings = await notifee.requestPermission();
  const granted =
    settings.authorizationStatus === AuthorizationStatus.AUTHORIZED ||
    settings.authorizationStatus === AuthorizationStatus.PROVISIONAL;

  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: REMINDER_CHANNEL_ID,
      name: 'Nhắc nhở công việc',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
    });
  } else {
    await notifee.setNotificationCategories([
      {
        id: REMINDER_CATEGORY_ID,
        actions: [
          { id: ACTION_MARK_DONE, title: 'Hoàn thành' },
          { id: ACTION_SNOOZE_15M, title: 'Nhắc lại 15p' },
        ],
      },
    ]);
  }

  return granted;
}

async function dispatchNotificationEvent(
  event: Event,
  handlers: NotificationActionHandlers,
): Promise<void> {
  if (event.type !== EventType.ACTION_PRESS) return;
  const actionId = event.detail.pressAction?.id;
  const taskId = event.detail.notification?.data?.taskId;
  if (typeof taskId !== 'string' || !taskId) return;

  if (actionId === ACTION_MARK_DONE) {
    await handlers.onMarkDone(taskId);
    if (event.detail.notification?.id) {
      await notifee.cancelNotification(event.detail.notification.id);
    }
  } else if (actionId === ACTION_SNOOZE_15M) {
    await handlers.onSnooze15m(taskId);
  }
}

export function registerNotificationHandlers(handlers: NotificationActionHandlers): () => void {
  notifee.onBackgroundEvent(async (event) => {
    await dispatchNotificationEvent(event, handlers);
  });

  return notifee.onForegroundEvent((event) => {
    void dispatchNotificationEvent(event, handlers);
  });
}
