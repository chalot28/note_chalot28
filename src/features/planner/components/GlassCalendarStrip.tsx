import React, { useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, Info } from 'lucide-react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import {
  convertSolar2Lunar,
  formatLunarShort,
  parseIsoDate,
} from '@/features/planner/services/lunar.calendar';
import { GlassCard } from '@/shared/components/glass/GlassCard';
import { useHaptics } from '@/shared/hooks/useHaptics';
import { toIsoDateKey } from '@/shared/utils/date.utils';

interface GlassCalendarStripProps {
  selectedDate: string;
  markedDates: Record<string, { marked?: boolean }>;
  onSelectDate: (date: string) => void;
  onOpenDayDetail: (date: string) => void;
}

const WEEKDAY_HEADERS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'] as const;

interface CalendarDayCell {
  isoDate: string;
  solarDay: number;
  lunarLabel: string;
  isLunarSpecial: boolean;
  inCurrentMonth: boolean;
}

function buildDayCell(dateObj: Date, currentMonth?: number): CalendarDayCell {
  const y = dateObj.getFullYear();
  const m = dateObj.getMonth() + 1;
  const d = dateObj.getDate();
  const lunar = convertSolar2Lunar(d, m, y, 7);
  return {
    isoDate: toIsoDateKey(dateObj),
    solarDay: d,
    lunarLabel: formatLunarShort(lunar),
    isLunarSpecial: lunar.day === 1 || lunar.day === 15,
    inCurrentMonth: currentMonth === undefined ? true : m === currentMonth,
  };
}

function getMondayOfWeek(isoDate: string): Date {
  const { year, month, day } = parseIsoDate(isoDate);
  const d = new Date(year, month - 1, day);
  const dayOfWeek = d.getDay(); // 0=Sun, 1=Mon..6=Sat
  const diffToMon = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  d.setDate(d.getDate() + diffToMon);
  return d;
}

export function GlassCalendarStrip({
  selectedDate,
  markedDates,
  onSelectDate,
  onOpenDayDetail,
}: GlassCalendarStripProps) {
  const glass = useGlassStyle();
  const haptics = useHaptics();
  const [expanded, setExpanded] = useState(false);

  const parsedSelected = useMemo(() => parseIsoDate(selectedDate), [selectedDate]);
  const [viewYear, setViewYear] = useState(parsedSelected.year);
  const [viewMonth, setViewMonth] = useState(parsedSelected.month);

  const lastTapRef = useRef<{ date: string; time: number }>({ date: '', time: 0 });
  const todayIso = toIsoDateKey();

  const selectedLunar = useMemo(() => {
    const l = convertSolar2Lunar(parsedSelected.day, parsedSelected.month, parsedSelected.year, 7);
    return `${l.day}/${l.month}${l.leap ? 'N' : ''} ÂL`;
  }, [parsedSelected]);

  const weekDays = useMemo(() => {
    const monday = getMondayOfWeek(selectedDate);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return buildDayCell(d);
    });
  }, [selectedDate]);

  const monthGrid = useMemo(() => {
    const firstOfMonth = new Date(viewYear, viewMonth - 1, 1);
    const startDay = firstOfMonth.getDay(); // 0=Sun
    const offset = startDay === 0 ? 6 : startDay - 1;
    const gridStart = new Date(viewYear, viewMonth - 1, 1 - offset);

    const lastOfMonth = new Date(viewYear, viewMonth, 0).getDate();
    const totalCells = offset + lastOfMonth > 35 ? 42 : 35;

    return Array.from({ length: totalCells }, (_, i) => {
      const d = new Date(gridStart);
      d.setDate(gridStart.getDate() + i);
      return buildDayCell(d, viewMonth);
    });
  }, [viewMonth, viewYear]);

  const handleDayTap = (isoDate: string) => {
    const now = Date.now();
    const isDoubleTap =
      lastTapRef.current.date === isoDate && now - lastTapRef.current.time < 360;

    lastTapRef.current = { date: isoDate, time: now };
    haptics.selection();
    onSelectDate(isoDate);

    const p = parseIsoDate(isoDate);
    setViewYear(p.year);
    setViewMonth(p.month);

    if (isDoubleTap) {
      lastTapRef.current = { date: '', time: 0 };
      onOpenDayDetail(isoDate);
    }
  };

  const shiftWeek = (deltaDays: number) => {
    haptics.selection();
    const { year, month, day } = parseIsoDate(selectedDate);
    const next = new Date(year, month - 1, day + deltaDays);
    const nextIso = toIsoDateKey(next);
    onSelectDate(nextIso);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth() + 1);
  };

  const shiftMonth = (deltaMonths: number) => {
    haptics.selection();
    const next = new Date(viewYear, viewMonth - 1 + deltaMonths, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth() + 1);
  };

  const jumpToToday = () => {
    haptics.selection();
    const now = new Date();
    onSelectDate(toIsoDateKey(now));
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth() + 1);
  };

  const renderCell = (cell: CalendarDayCell, weekdayLabel?: string) => {
    const isSelected = cell.isoDate === selectedDate;
    const isToday = cell.isoDate === todayIso;
    const hasTasks = Boolean(markedDates[cell.isoDate]?.marked);
    const dimText = !cell.inCurrentMonth;

    return (
      <Pressable
        key={cell.isoDate}
        onPress={() => handleDayTap(cell.isoDate)}
        style={[
          styles.dayCell,
          isSelected && { backgroundColor: glass.accentColor },
          !isSelected && isToday && { backgroundColor: `${glass.accentColor}22` },
        ]}
      >
        {weekdayLabel ? (
          <Text
            style={[
              styles.weekdayMini,
              { color: isSelected ? '#FFFFFF' : glass.textMuted },
            ]}
          >
            {weekdayLabel}
          </Text>
        ) : null}
        <Text
          style={[
            styles.solarText,
            {
              color: isSelected
                ? '#FFFFFF'
                : isToday
                  ? glass.accentColor
                  : dimText
                    ? `${glass.textMuted}66`
                    : glass.textPrimary,
            },
          ]}
        >
          {cell.solarDay}
        </Text>
        <Text
          numberOfLines={1}
          style={[
            styles.lunarText,
            {
              color: isSelected
                ? 'rgba(255,255,255,0.88)'
                : cell.isLunarSpecial
                  ? '#F59E0B'
                  : dimText
                    ? `${glass.textMuted}55`
                    : glass.textMuted,
            },
          ]}
        >
          {cell.lunarLabel}
        </Text>
        <View
          style={[
            styles.dot,
            {
              backgroundColor: hasTasks
                ? isSelected
                  ? '#FFFFFF'
                  : glass.accentColor
                : 'transparent',
            },
          ]}
        />
      </Pressable>
    );
  };

  return (
    <GlassCard style={styles.card} contentStyle={styles.content}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View style={styles.navGroup}>
          <Pressable
            onPress={() => (expanded ? shiftMonth(-1) : shiftWeek(-7))}
            hitSlop={8}
            style={styles.navBtn}
          >
            <ChevronLeft size={16} color={glass.textSecondary} />
          </Pressable>
          <View>
            <Text style={[styles.monthTitle, { color: glass.textPrimary }]}>
              Tháng {expanded ? viewMonth : parsedSelected.month}, {expanded ? viewYear : parsedSelected.year}
            </Text>
            <Text style={[styles.lunarSummary, { color: '#F59E0B' }]}>{selectedLunar}</Text>
          </View>
          <Pressable
            onPress={() => (expanded ? shiftMonth(1) : shiftWeek(7))}
            hitSlop={8}
            style={styles.navBtn}
          >
            <ChevronRight size={16} color={glass.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.actionsGroup}>
          {selectedDate !== todayIso ? (
            <Pressable
              onPress={jumpToToday}
              style={[styles.pillBtn, { backgroundColor: `${glass.accentColor}22` }]}
            >
              <Text style={[styles.pillBtnText, { color: glass.accentColor }]}>Hôm nay</Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => {
              haptics.light();
              onOpenDayDetail(selectedDate);
            }}
            hitSlop={6}
            style={[styles.pillBtn, { backgroundColor: glass.surfaceColor }]}
          >
            <Info size={12} color={glass.accentColor} />
            <Text style={[styles.pillBtnText, { color: glass.textSecondary }]}>Chi tiết</Text>
          </Pressable>

          <Pressable
            onPress={() => {
              haptics.selection();
              setExpanded((v) => !v);
            }}
            hitSlop={6}
            style={styles.expandBtn}
          >
            {expanded ? (
              <ChevronUp size={16} color={glass.textMuted} />
            ) : (
              <ChevronDown size={16} color={glass.textMuted} />
            )}
          </Pressable>
        </View>
      </View>

      {/* Week Strip or Full Month Grid */}
      {!expanded ? (
        <View style={styles.weekRow}>
          {weekDays.map((cell, idx) => renderCell(cell, WEEKDAY_HEADERS[idx]))}
        </View>
      ) : (
        <View style={styles.monthWrap}>
          <View style={styles.weekdayHeaderRow}>
            {WEEKDAY_HEADERS.map((label) => (
              <Text key={label} style={[styles.weekdayHeaderText, { color: glass.textMuted }]}>
                {label}
              </Text>
            ))}
          </View>
          <View style={styles.monthGrid}>
            {monthGrid.map((cell) => (
              <View key={cell.isoDate} style={styles.monthCellSlot}>
                {renderCell(cell)}
              </View>
            ))}
          </View>
        </View>
      )}

      <Text style={[styles.hintFooter, { color: glass.textMuted }]}>
        Chạm 2 lần vào một ngày để xem đầy đủ Âm lịch & Giờ Hoàng Đạo
      </Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  content: { padding: 12, gap: 10 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  navGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  navBtn: {
    padding: 4,
    borderRadius: 999,
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  lunarSummary: {
    fontSize: 11,
    fontWeight: '600',
  },
  actionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  pillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 999,
  },
  pillBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  expandBtn: {
    padding: 4,
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 4,
  },
  monthWrap: {
    gap: 6,
  },
  weekdayHeaderRow: {
    flexDirection: 'row',
  },
  weekdayHeaderText: {
    width: '14.285%',
    textAlign: 'center',
    fontSize: 11,
    fontWeight: '600',
  },
  monthGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthCellSlot: {
    width: '14.285%',
    paddingVertical: 2,
    paddingHorizontal: 1,
  },
  dayCell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 12,
    gap: 1,
  },
  weekdayMini: {
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 1,
  },
  solarText: {
    fontSize: 14,
    fontWeight: '700',
  },
  lunarText: {
    fontSize: 10,
    fontWeight: '500',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
  },
  hintFooter: {
    fontSize: 11,
    textAlign: 'center',
  },
});
