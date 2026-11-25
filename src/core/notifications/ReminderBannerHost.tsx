import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { BellRing, Check, Clock, X } from 'lucide-react-native';
import {
  ACTION_MARK_DONE,
  ACTION_SNOOZE_15M,
  dispatchWebNotificationAction,
  subscribeInAppReminders,
} from '@/core/notifications/notifee.setup.web';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import type { TaskEntity } from '@/features/planner/types/planner.types';
import { formatTimeShort } from '@/shared/utils/date.utils';

export function ReminderBannerHost() {
  const glass = useGlassStyle();
  const [queue, setQueue] = useState<TaskEntity[]>([]);

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    return subscribeInAppReminders((task) => {
      setQueue((prev) => {
        const filtered = prev.filter((item) => item.id !== task.id);
        return [task, ...filtered];
      });
    });
  }, []);

  if (Platform.OS !== 'web' || queue.length === 0) {
    return null;
  }

  const current = queue[0]!;
  const dismissCurrent = () => setQueue((prev) => prev.slice(1));

  return (
    <View style={styles.host} pointerEvents="box-none">
      <View
        style={[
          styles.banner,
          {
            backgroundColor:
              glass.blurTint === 'dark' ? 'rgba(13, 20, 36, 0.96)' : 'rgba(255, 255, 255, 0.96)',
            borderColor: glass.accentColor,
          },
        ]}
      >
        <View style={styles.topRow}>
          <View style={styles.titleWrap}>
            <BellRing size={16} color={glass.accentColor} />
            <Text numberOfLines={1} style={[styles.title, { color: glass.textPrimary }]}>
              {current.title}
            </Text>
          </View>
          <Pressable onPress={dismissCurrent} hitSlop={8}>
            <X size={16} color={glass.textMuted} />
          </Pressable>
        </View>

        <Text style={[styles.subtitle, { color: glass.textSecondary }]}>
          Nhắc nhở lúc {current.reminderAt ? formatTimeShort(current.reminderAt) : 'bây giờ'}
        </Text>

        <View style={styles.actions}>
          <Pressable
            onPress={() => {
              void dispatchWebNotificationAction(ACTION_MARK_DONE, current.id);
              dismissCurrent();
            }}
            style={[styles.btn, { backgroundColor: `${glass.accentColor}24` }]}
          >
            <Check size={14} color={glass.accentColor} />
            <Text style={[styles.btnText, { color: glass.accentColor }]}>Hoàn thành</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              void dispatchWebNotificationAction(ACTION_SNOOZE_15M, current.id);
              dismissCurrent();
            }}
            style={[styles.btn, { backgroundColor: glass.surfaceColor }]}
          >
            <Clock size={14} color={glass.textSecondary} />
            <Text style={[styles.btnText, { color: glass.textSecondary }]}>Nhắc lại 15p</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    top: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
    zIndex: 9998,
  },
  banner: {
    width: '100%',
    maxWidth: 420,
    borderRadius: 18,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 12,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 999,
  },
  btnText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
