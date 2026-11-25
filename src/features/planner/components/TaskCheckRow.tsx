import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Check, Clock, Trash2 } from 'lucide-react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import type { TaskEntity, TaskPriority } from '@/features/planner/types/planner.types';
import { GlassCard } from '@/shared/components/glass/GlassCard';
import { useHaptics } from '@/shared/hooks/useHaptics';
import { formatTimeShort } from '@/shared/utils/date.utils';

interface TaskCheckRowProps {
  task: TaskEntity;
  onToggle: (task: TaskEntity) => void;
  onDelete: (task: TaskEntity) => void;
}

const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#38BDF8',
  medium: '#F59E0B',
  high: '#EF4444',
};

export function TaskCheckRow({ task, onToggle, onDelete }: TaskCheckRowProps) {
  const glass = useGlassStyle();
  const haptics = useHaptics();
  const priorityColor = PRIORITY_COLORS[task.priority];

  return (
    <GlassCard style={styles.card} contentStyle={styles.content}>
      <Pressable
        onPress={() => {
          haptics.selection();
          onToggle(task);
        }}
        hitSlop={10}
        style={[
          styles.checkbox,
          {
            borderColor: task.isCompleted ? glass.accentColor : priorityColor,
            backgroundColor: task.isCompleted ? glass.accentColor : 'transparent',
          },
        ]}
      >
        {task.isCompleted ? <Check size={13} color="#FFFFFF" strokeWidth={3} /> : null}
      </Pressable>

      <View style={styles.body}>
        <Text
          numberOfLines={2}
          style={[
            styles.title,
            {
              color: task.isCompleted ? glass.textMuted : glass.textPrimary,
              textDecorationLine: task.isCompleted ? 'line-through' : 'none',
            },
          ]}
        >
          {task.title}
        </Text>
        <View style={styles.metaRow}>
          <View style={[styles.dot, { backgroundColor: priorityColor }]} />
          <Text style={[styles.metaText, { color: glass.textMuted }]}>{task.groupName}</Text>
          {task.reminderAt ? (
            <View style={styles.reminderBadge}>
              <Clock size={11} color={glass.accentColor} />
              <Text style={[styles.metaText, { color: glass.accentColor }]}>
                {formatTimeShort(task.reminderAt)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>

      <Pressable
        onPress={() => {
          haptics.light();
          onDelete(task);
        }}
        hitSlop={10}
        style={styles.deleteBtn}
      >
        <Trash2 size={15} color={glass.textMuted} />
      </Pressable>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 8 },
  content: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.8, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1, gap: 4 },
  title: { fontSize: 15, fontWeight: '500' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  metaText: { fontSize: 11 },
  reminderBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, marginLeft: 4 },
  deleteBtn: { padding: 4 },
});
