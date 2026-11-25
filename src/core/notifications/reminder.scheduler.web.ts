import {
  emitInAppReminder,
  getWebNotificationPermission,
  requestWebNotificationPermission,
} from '@/core/notifications/notifee.setup.web';
import type { RepeatRule, TaskEntity } from '@/features/planner/types/planner.types';

const MAX_TIMEOUT_MS = 2_147_483_647;
const activeTimers = new Map<string, ReturnType<typeof setTimeout>>();

function getNextOccurrence(currentMs: number, rule: RepeatRule): number | null {
  if (rule === 'none') return null;
  const d = new Date(currentMs);
  if (rule === 'daily') d.setDate(d.getDate() + 1);
  else if (rule === 'weekly') d.setDate(d.getDate() + 7);
  else if (rule === 'monthly') d.setMonth(d.getMonth() + 1);
  return d.getTime();
}

function playReminderChime(): void {
  if (typeof window === 'undefined') return;
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1174.66, ctx.currentTime + 0.14);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.45);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.46);
  } catch {
    // Ignore audio autoplay blocks
  }
}

function triggerWebNotification(task: TaskEntity): void {
  playReminderChime();
  emitInAppReminder(task);

  if (getWebNotificationPermission() === 'granted' && typeof window !== 'undefined') {
    try {
      new Notification(task.title, {
        body: task.notes || 'Đến giờ thực hiện công việc đã lên lịch',
        tag: task.id,
      });
    } catch {
      // Ignore Notification constructor errors in restricted contexts
    }
  }
}

function scheduleTimer(notificationId: string, task: TaskEntity, targetMs: number): void {
  const existing = activeTimers.get(notificationId);
  if (existing) clearTimeout(existing);

  const delay = targetMs - Date.now();
  if (delay <= 0) return;

  if (delay > MAX_TIMEOUT_MS) {
    const timer = setTimeout(() => {
      scheduleTimer(notificationId, task, targetMs);
    }, MAX_TIMEOUT_MS);
    activeTimers.set(notificationId, timer);
    return;
  }

  const timer = setTimeout(() => {
    activeTimers.delete(notificationId);
    triggerWebNotification(task);

    const nextAt = getNextOccurrence(targetMs, task.recurrence);
    if (nextAt && nextAt > Date.now()) {
      scheduleTimer(notificationId, { ...task, reminderAt: nextAt }, nextAt);
    }
  }, delay);

  activeTimers.set(notificationId, timer);
}

export const reminderScheduler = {
  async scheduleTaskReminder(task: TaskEntity): Promise<string | null> {
    if (!task.reminderAt || task.reminderAt <= Date.now() || task.isCompleted) {
      return null;
    }

    if (getWebNotificationPermission() === 'default') {
      void requestWebNotificationPermission();
    }

    const notificationId = task.notificationId || `task_${task.id}`;
    scheduleTimer(notificationId, task, task.reminderAt);
    return notificationId;
  },

  async cancelReminder(notificationId: string | null | undefined): Promise<void> {
    if (!notificationId) return;
    const timer = activeTimers.get(notificationId);
    if (timer) {
      clearTimeout(timer);
      activeTimers.delete(notificationId);
    }
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
