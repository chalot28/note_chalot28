import React, { useMemo } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Calendar, Clock, Moon, Sparkles, Sun, X } from 'lucide-react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { getDayFullInfo } from '@/features/planner/services/lunar.calendar';
import type { TaskEntity } from '@/features/planner/types/planner.types';

interface DayDetailBannerModalProps {
  visible: boolean;
  isoDate: string | null;
  tasks?: readonly TaskEntity[];
  onClose: () => void;
}

export function DayDetailBannerModal({
  visible,
  isoDate,
  tasks = [],
  onClose,
}: DayDetailBannerModalProps) {
  const glass = useGlassStyle();
  const info = useMemo(() => (isoDate ? getDayFullInfo(isoDate) : null), [isoDate]);

  if (!info) return null;

  const qualityColor = info.dayQuality.isHoangDao ? '#10B981' : '#F59E0B';
  const completedCount = tasks.filter((t) => t.isCompleted).length;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.banner,
            {
              borderRadius: glass.borderRadius + 4,
              backgroundColor:
                glass.blurTint === 'dark' ? 'rgba(13, 20, 36, 0.92)' : 'rgba(248, 250, 252, 0.94)',
            },
          ]}
        >
          <BlurView
            intensity={Math.min(100, glass.blurIntensity + 20)}
            tint={glass.blurTint}
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.blurLayer]}
          />
          <View style={styles.contentWrap}>
            <View style={styles.header}>
              <View style={styles.headerLeft}>
                <View style={styles.badge}>
                  <Sparkles size={13} color={qualityColor} />
                  <Text style={[styles.badgeText, { color: qualityColor }]}>
                    {info.dayQuality.label} • Sao {info.dayQuality.starName}
                  </Text>
                </View>
                <Text style={[styles.weekday, { color: glass.textMuted }]}>
                  {info.solar.weekdayName}
                </Text>
              </View>
              <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
                <X size={18} color={glass.textMuted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
              {/* Solar & Lunar Hero */}
              <View style={styles.heroGrid}>
                <View style={[styles.heroCard, { backgroundColor: glass.surfaceColor }]}>
                  <View style={styles.heroLabelRow}>
                    <Sun size={14} color={glass.accentColor} />
                    <Text style={[styles.heroLabel, { color: glass.textMuted }]}>Dương lịch</Text>
                  </View>
                  <Text style={[styles.heroDay, { color: glass.textPrimary }]}>
                    {String(info.solar.day).padStart(2, '0')}
                  </Text>
                  <Text style={[styles.heroSub, { color: glass.textSecondary }]}>
                    Tháng {info.solar.month}/{info.solar.year}
                  </Text>
                </View>

                <View style={[styles.heroCard, { backgroundColor: glass.surfaceColor }]}>
                  <View style={styles.heroLabelRow}>
                    <Moon size={14} color="#F59E0B" />
                    <Text style={[styles.heroLabel, { color: glass.textMuted }]}>Âm lịch</Text>
                  </View>
                  <Text style={[styles.heroDay, { color: '#F59E0B' }]}>
                    {String(info.lunar.day).padStart(2, '0')}
                  </Text>
                  <Text style={[styles.heroSub, { color: glass.textSecondary }]}>
                    Tháng {info.lunar.monthName} ({info.lunar.year})
                  </Text>
                </View>
              </View>

              {/* Holidays */}
              {info.holidays.length > 0 ? (
                <View style={[styles.sectionCard, { backgroundColor: `${glass.accentColor}18` }]}>
                  <View style={styles.sectionHeader}>
                    <Calendar size={14} color={glass.accentColor} />
                    <Text style={[styles.sectionTitle, { color: glass.accentColor }]}>
                      Ngày lễ / Sự kiện
                    </Text>
                  </View>
                  {info.holidays.map((h) => (
                    <Text key={h} style={[styles.holidayText, { color: glass.textPrimary }]}>
                      • {h}
                    </Text>
                  ))}
                </View>
              ) : null}

              {/* Can Chi & Tiết Khí */}
              <View style={[styles.sectionCard, { backgroundColor: glass.surfaceColor }]}>
                <Text style={[styles.sectionTitle, { color: glass.textPrimary }]}>
                  Thông tin Can Chi & Tiết khí
                </Text>
                <View style={styles.infoGrid}>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoKey, { color: glass.textMuted }]}>Năm:</Text>
                    <Text style={[styles.infoVal, { color: glass.textPrimary }]}>{info.canChi.year}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoKey, { color: glass.textMuted }]}>Tháng:</Text>
                    <Text style={[styles.infoVal, { color: glass.textPrimary }]}>{info.canChi.month}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoKey, { color: glass.textMuted }]}>Ngày:</Text>
                    <Text style={[styles.infoVal, { color: glass.textPrimary }]}>{info.canChi.day}</Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text style={[styles.infoKey, { color: glass.textMuted }]}>Tiết khí:</Text>
                    <Text style={[styles.infoVal, { color: glass.accentColor }]}>{info.tietKhi}</Text>
                  </View>
                </View>
              </View>

              {/* Giờ Hoàng Đạo */}
              <View style={[styles.sectionCard, { backgroundColor: glass.surfaceColor }]}>
                <View style={styles.sectionHeader}>
                  <Clock size={14} color="#10B981" />
                  <Text style={[styles.sectionTitle, { color: glass.textPrimary }]}>
                    Giờ Hoàng Đạo trong ngày
                  </Text>
                </View>
                <View style={styles.hoursGrid}>
                  {info.gioHoangDao.map((hr) => (
                    <View
                      key={hr.chi}
                      style={[styles.hourPill, { backgroundColor: 'rgba(16, 185, 129, 0.12)' }]}
                    >
                      <Text style={styles.hourCanChi}>{hr.canChi}</Text>
                      <Text style={[styles.hourRange, { color: glass.textSecondary }]}>
                        {hr.range}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>

              {/* Tasks Summary */}
              <View style={[styles.sectionCard, { backgroundColor: glass.surfaceColor }]}>
                <Text style={[styles.sectionTitle, { color: glass.textPrimary }]}>
                  Công việc ngày {info.solar.day}/{info.solar.month} ({completedCount}/{tasks.length})
                </Text>
                {tasks.length === 0 ? (
                  <Text style={[styles.emptyTaskText, { color: glass.textMuted }]}>
                    Chưa có công việc nào được lên lịch cho ngày này.
                  </Text>
                ) : (
                  tasks.map((t) => (
                    <Text
                      key={t.id}
                      numberOfLines={1}
                      style={[
                        styles.taskItemText,
                        {
                          color: t.isCompleted ? glass.textMuted : glass.textSecondary,
                          textDecorationLine: t.isCompleted ? 'line-through' : 'none',
                        },
                      ]}
                    >
                      {t.isCompleted ? '✓ ' : '• '}
                      {t.title}
                    </Text>
                  ))
                )}
              </View>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  banner: {
    width: '100%',
    maxWidth: 440,
    maxHeight: '85%',
    overflow: 'hidden',
    padding: 18,
  },
  blurLayer: {
    zIndex: 0,
  },
  contentWrap: {
    zIndex: 1,
    maxHeight: '100%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeft: {
    gap: 4,
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  weekday: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  scrollBody: {
    gap: 10,
    paddingBottom: 6,
  },
  heroGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  heroCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    gap: 4,
  },
  heroLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  heroDay: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 38,
  },
  heroSub: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  sectionCard: {
    borderRadius: 16,
    padding: 13,
    gap: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  holidayText: {
    fontSize: 13,
    fontWeight: '600',
  },
  infoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  infoRow: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  infoKey: {
    fontSize: 12,
  },
  infoVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  hoursGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  hourPill: {
    width: '48.5%',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 1,
  },
  hourCanChi: {
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
  },
  hourRange: {
    fontSize: 11,
  },
  emptyTaskText: {
    fontSize: 12,
  },
  taskItemText: {
    fontSize: 13,
    lineHeight: 19,
  },
});
