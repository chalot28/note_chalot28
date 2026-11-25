import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { DayDetailBannerModal } from '@/features/planner/components/DayDetailBannerModal';
import { GlassCalendarStrip } from '@/features/planner/components/GlassCalendarStrip';
import { GlassProgressRing } from '@/features/planner/components/GlassProgressRing';
import { QuickTaskPill } from '@/features/planner/components/QuickTaskPill';
import { TaskCheckRow } from '@/features/planner/components/TaskCheckRow';
import { useDailyAgenda } from '@/features/planner/hooks/useDailyAgenda';
import { GlassCard } from '@/shared/components/glass/GlassCard';
import { MinimalScreen } from '@/shared/components/layout/MinimalScreen';
import { ZenHeader } from '@/shared/components/layout/ZenHeader';

export default function PlannerScreen() {
  const glass = useGlassStyle();
  const [detailDate, setDetailDate] = useState<string | null>(null);
  const {
    selectedDate,
    setSelectedDate,
    tasks,
    summary,
    markedDates,
    createTask,
    toggleTask,
    deleteTask,
  } = useDailyAgenda();

  return (
    <MinimalScreen>
      <ZenHeader title="Lịch & Việc" subtitle={selectedDate} />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <GlassCalendarStrip
          selectedDate={selectedDate}
          markedDates={markedDates}
          onSelectDate={setSelectedDate}
          onOpenDayDetail={(date) => setDetailDate(date)}
        />

        <GlassCard style={styles.summaryCard} contentStyle={styles.summaryContent}>
          <View style={styles.summaryText}>
            <Text style={[styles.summaryTitle, { color: glass.textPrimary }]}>Tiến độ hôm nay</Text>
            <Text style={[styles.summarySub, { color: glass.textMuted }]}>
              Hoàn thành {summary.completedCount}/{summary.totalCount} công việc
            </Text>
          </View>
          <GlassProgressRing progress={summary.progress} />
        </GlassCard>

        <QuickTaskPill selectedDate={selectedDate} onCreate={createTask} />

        {tasks.map((task) => (
          <TaskCheckRow
            key={task.id}
            task={task}
            onToggle={(t) => void toggleTask(t)}
            onDelete={(t) => void deleteTask(t)}
          />
        ))}
      </ScrollView>

      <DayDetailBannerModal
        visible={detailDate !== null}
        isoDate={detailDate}
        tasks={detailDate === selectedDate ? tasks : []}
        onClose={() => setDetailDate(null)}
      />
    </MinimalScreen>
  );
}

const styles = StyleSheet.create({
  scrollContent: { paddingBottom: 110 },
  summaryCard: { marginBottom: 12 },
  summaryContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  summaryText: { gap: 4 },
  summaryTitle: { fontSize: 16, fontWeight: '700' },
  summarySub: { fontSize: 13 },
});
