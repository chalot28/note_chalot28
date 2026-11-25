import React, { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Bell, BellRing, ChevronDown, ChevronUp, Plus, Repeat } from 'lucide-react-native';
import {
  getWebNotificationPermission,
  requestWebNotificationPermission,
} from '@/core/notifications/notifee.setup.web';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import type { RepeatRule, TaskPriority } from '@/features/planner/types/planner.types';
import { GlassCard } from '@/shared/components/glass/GlassCard';
import { useHaptics } from '@/shared/hooks/useHaptics';

interface QuickTaskPillProps {
  selectedDate: string;
  onCreate: (payload: {
    title: string;
    priority: TaskPriority;
    recurrence: RepeatRule;
    reminderAt: number | null;
  }) => Promise<unknown>;
}

const PRIORITIES: readonly TaskPriority[] = ['low', 'medium', 'high'];
const PRIORITY_LABELS: Record<TaskPriority, string> = { low: 'Thấp', medium: 'Vừa', high: 'Cao' };
const RECURRENCE_CYCLE: readonly RepeatRule[] = ['none', 'daily', 'weekly'];
const RECURRENCE_LABELS: Record<RepeatRule, string> = {
  none: '1 lần',
  daily: 'Hàng ngày',
  weekly: 'Hàng tuần',
  monthly: 'Hàng tháng',
};

const QUICK_PRESETS: ReadonlyArray<{ label: string; hour: number; minute: number }> = [
  { label: '09:00', hour: 9, minute: 0 },
  { label: '14:00', hour: 14, minute: 0 },
  { label: '20:00', hour: 20, minute: 0 },
];

function formatHm(hour: number, minute: number): string {
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

export function QuickTaskPill({ selectedDate, onCreate }: QuickTaskPillProps) {
  const glass = useGlassStyle();
  const haptics = useHaptics();

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [recurrence, setRecurrence] = useState<RepeatRule>('none');
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [hour, setHour] = useState(9);
  const [minute, setMinute] = useState(0);
  const [permState, setPermState] = useState(() =>
    Platform.OS === 'web' ? getWebNotificationPermission() : 'granted',
  );

  const handleSubmit = async () => {
    const clean = title.trim();
    if (!clean) return;
    let reminderAt: number | null = null;
    if (reminderEnabled) {
      const target = new Date(`${selectedDate}T${formatHm(hour, minute)}:00`);
      reminderAt = Number.isNaN(target.getTime()) ? null : target.getTime();
    }
    haptics.success();
    await onCreate({ title: clean, priority, recurrence, reminderAt });
    setTitle('');
    setShowTimePicker(false);
  };

  const applyMinutesFromNow = (mins: number) => {
    haptics.selection();
    const target = new Date(Date.now() + mins * 60_000);
    setHour(target.getHours());
    setMinute(target.getMinutes());
    setReminderEnabled(true);
  };

  const stepHour = (delta: number) => {
    haptics.selection();
    setHour((h) => (h + delta + 24) % 24);
    setReminderEnabled(true);
  };

  const stepMinute = (delta: number) => {
    haptics.selection();
    setMinute((m) => (m + delta + 60) % 60);
    setReminderEnabled(true);
  };

  const handleEnableWebNotify = async () => {
    const next = await requestWebNotificationPermission();
    setPermState(next);
  };

  return (
    <GlassCard style={styles.card} contentStyle={styles.content}>
      <View style={styles.inputRow}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Thêm việc mới..."
          placeholderTextColor={glass.textMuted}
          onSubmitEditing={() => void handleSubmit()}
          returnKeyType="done"
          style={[styles.input, { color: glass.textPrimary }]}
        />
        <Pressable
          onPress={() => void handleSubmit()}
          style={[styles.addBtn, { backgroundColor: glass.accentColor }]}
        >
          <Plus size={18} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.optionRow}>
        <Pressable
          onPress={() => {
            haptics.selection();
            const idx = PRIORITIES.indexOf(priority);
            setPriority(PRIORITIES[(idx + 1) % PRIORITIES.length] ?? 'medium');
          }}
          style={[styles.chip, { backgroundColor: glass.surfaceColor }]}
        >
          <Text style={[styles.chipText, { color: glass.textSecondary }]}>
            Ưu tiên: {PRIORITY_LABELS[priority]}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            haptics.selection();
            setShowTimePicker((v) => !v);
          }}
          style={[
            styles.chip,
            {
              backgroundColor: reminderEnabled
                ? `${glass.accentColor}24`
                : glass.surfaceColor,
            },
          ]}
        >
          <Bell size={12} color={reminderEnabled ? glass.accentColor : glass.textMuted} />
          <Text
            style={[
              styles.chipText,
              { color: reminderEnabled ? glass.accentColor : glass.textSecondary },
            ]}
          >
            {reminderEnabled ? `Nhắc ${formatHm(hour, minute)}` : 'Hẹn giờ nhắc'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => {
            haptics.selection();
            const idx = RECURRENCE_CYCLE.indexOf(recurrence);
            setRecurrence(RECURRENCE_CYCLE[(idx + 1) % RECURRENCE_CYCLE.length] ?? 'none');
          }}
          style={[styles.chip, { backgroundColor: glass.surfaceColor }]}
        >
          <Repeat size={12} color={glass.textMuted} />
          <Text style={[styles.chipText, { color: glass.textSecondary }]}>
            {RECURRENCE_LABELS[recurrence]}
          </Text>
        </Pressable>
      </View>

      {showTimePicker ? (
        <View style={[styles.timePickerBox, { backgroundColor: glass.surfaceColor }]}>
          <View style={styles.presetRow}>
            <Pressable
              onPress={() => applyMinutesFromNow(15)}
              style={[styles.timeChip, { backgroundColor: `${glass.accentColor}22` }]}
            >
              <Text style={[styles.timeChipText, { color: glass.accentColor }]}>+15 phút</Text>
            </Pressable>
            {QUICK_PRESETS.map((p) => {
              const active = reminderEnabled && hour === p.hour && minute === p.minute;
              return (
                <Pressable
                  key={p.label}
                  onPress={() => {
                    haptics.selection();
                    setHour(p.hour);
                    setMinute(p.minute);
                    setReminderEnabled(true);
                  }}
                  style={[
                    styles.timeChip,
                    { backgroundColor: active ? glass.accentColor : glass.surfaceElevatedColor },
                  ]}
                >
                  <Text
                    style={[
                      styles.timeChipText,
                      { color: active ? '#FFFFFF' : glass.textSecondary },
                    ]}
                  >
                    {p.label}
                  </Text>
                </Pressable>
              );
            })}
            {reminderEnabled ? (
              <Pressable
                onPress={() => {
                  haptics.light();
                  setReminderEnabled(false);
                }}
                style={[styles.timeChip, { backgroundColor: 'rgba(239,68,68,0.18)' }]}
              >
                <Text style={[styles.timeChipText, { color: '#EF4444' }]}>Tắt</Text>
              </Pressable>
            ) : null}
          </View>

          <View style={styles.stepperRow}>
            <View style={[styles.stepperUnit, { backgroundColor: glass.surfaceElevatedColor }]}>
              <Pressable onPress={() => stepHour(1)} hitSlop={6} style={styles.stepBtn}>
                <ChevronUp size={15} color={glass.textSecondary} />
              </Pressable>
              <Text style={[styles.stepValue, { color: glass.textPrimary }]}>
                {String(hour).padStart(2, '0')}
              </Text>
              <Pressable onPress={() => stepHour(-1)} hitSlop={6} style={styles.stepBtn}>
                <ChevronDown size={15} color={glass.textSecondary} />
              </Pressable>
            </View>

            <Text style={[styles.colon, { color: glass.textMuted }]}>:</Text>

            <View style={[styles.stepperUnit, { backgroundColor: glass.surfaceElevatedColor }]}>
              <Pressable onPress={() => stepMinute(5)} hitSlop={6} style={styles.stepBtn}>
                <ChevronUp size={15} color={glass.textSecondary} />
              </Pressable>
              <Text style={[styles.stepValue, { color: glass.textPrimary }]}>
                {String(minute).padStart(2, '0')}
              </Text>
              <Pressable onPress={() => stepMinute(-5)} hitSlop={6} style={styles.stepBtn}>
                <ChevronDown size={15} color={glass.textSecondary} />
              </Pressable>
            </View>

            {Platform.OS === 'web' && permState !== 'granted' && permState !== 'unsupported' ? (
              <Pressable
                onPress={() => void handleEnableWebNotify()}
                style={[styles.permBtn, { backgroundColor: `${glass.accentColor}24` }]}
              >
                <BellRing size={12} color={glass.accentColor} />
                <Text style={[styles.permText, { color: glass.accentColor }]}>Bật thông báo</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      ) : null}
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  content: { padding: 12, gap: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, fontSize: 15, paddingVertical: 4 },
  addBtn: { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  optionRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  chipText: { fontSize: 11, fontWeight: '600' },
  timePickerBox: { borderRadius: 14, padding: 10, gap: 10 },
  presetRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  timeChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999 },
  timeChipText: { fontSize: 11, fontWeight: '600' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  stepperUnit: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingHorizontal: 6,
    paddingVertical: 4,
    gap: 6,
  },
  stepBtn: { padding: 4 },
  stepValue: { fontSize: 16, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  colon: { fontSize: 16, fontWeight: '700' },
  permBtn: { marginLeft: 'auto', flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 7, borderRadius: 10 },
  permText: { fontSize: 11, fontWeight: '600' },
});
