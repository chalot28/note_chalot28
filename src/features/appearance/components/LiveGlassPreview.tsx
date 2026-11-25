import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Pin, Sparkles } from 'lucide-react-native';
import { useThemeStore } from '@/core/theme/themeStore';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { GlassCard } from '@/shared/components/glass/GlassCard';

export function LiveGlassPreview() {
  const glass = useGlassStyle();
  const blurIntensity = useThemeStore((s) => s.blurIntensity);
  const glassOpacity = useThemeStore((s) => s.glassOpacity);
  const borderRadius = useThemeStore((s) => s.borderRadius);

  return (
    <GlassCard elevated style={styles.card}>
      <View style={styles.topRow}>
        <View style={styles.previewLabel}>
          <Sparkles size={13} color={glass.accentColor} />
          <Text style={[styles.previewLabelText, { color: glass.accentColor }]}>
            Xem trước trực tiếp
          </Text>
        </View>
        <Pin size={14} color={glass.accentColor} />
      </View>

      <Text style={[styles.title, { color: glass.textPrimary, fontFamily: glass.fontRegular }]}>
        Thiết kế Liquid Glass tối giản
      </Text>
      <Text style={[styles.excerpt, { color: glass.textSecondary, fontFamily: glass.fontRegular }]}>
        Kính mờ {blurIntensity}% • Độ trong {Math.round(glassOpacity * 100)}% • Bo góc {borderRadius}px
      </Text>

      <View style={styles.tagRow}>
        <Text style={[styles.tagText, { color: glass.accentColor }]}>#liquid-glass</Text>
        <Text style={[styles.tagText, { color: glass.textMuted }]}>#local-first</Text>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14 },
  topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  previewLabel: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  previewLabelText: { fontSize: 12, fontWeight: '600' },
  title: { fontSize: 17, fontWeight: '700', marginBottom: 4 },
  excerpt: { fontSize: 13, lineHeight: 19 },
  tagRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  tagText: { fontSize: 12, fontWeight: '600' },
});
