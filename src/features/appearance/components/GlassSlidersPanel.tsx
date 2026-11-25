import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { RotateCcw } from 'lucide-react-native';
import { useThemeStore } from '@/core/theme/themeStore';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { GlassSliderRow } from '@/features/appearance/components/GlassSliderRow';
import { GlassButton } from '@/shared/components/glass/GlassButton';
import { GlassCard } from '@/shared/components/glass/GlassCard';
import { useHaptics } from '@/shared/hooks/useHaptics';

export function GlassSlidersPanel() {
  const glass = useGlassStyle();
  const haptics = useHaptics();
  const blurIntensity = useThemeStore((s) => s.blurIntensity);
  const glassOpacity = useThemeStore((s) => s.glassOpacity);
  const borderRadius = useThemeStore((s) => s.borderRadius);

  const setBlurIntensity = useThemeStore((s) => s.setBlurIntensity);
  const setGlassOpacity = useThemeStore((s) => s.setGlassOpacity);
  const setBorderRadius = useThemeStore((s) => s.setBorderRadius);
  const resetTheme = useThemeStore((s) => s.resetTheme);

  return (
    <GlassCard style={styles.card}>
      <Text style={[styles.heading, { color: glass.textPrimary }]}>Chất liệu kính</Text>
      <View style={styles.list}>
        <GlassSliderRow
          label="Độ mờ kính"
          valueLabel={`${blurIntensity}`}
          value={blurIntensity}
          min={10}
          max={100}
          step={1}
          onChange={setBlurIntensity}
        />
        <GlassSliderRow
          label="Độ trong bề mặt"
          valueLabel={`${Math.round(glassOpacity * 100)}%`}
          value={glassOpacity}
          min={0.05}
          max={0.45}
          step={0.01}
          onChange={setGlassOpacity}
        />
        <GlassSliderRow
          label="Độ bo góc"
          valueLabel={`${borderRadius}px`}
          value={borderRadius}
          min={8}
          max={32}
          step={1}
          onChange={setBorderRadius}
        />
      </View>
      <View style={styles.resetWrap}>
        <GlassButton
          label="Khôi phục mặc định"
          variant="ghost"
          icon={<RotateCcw size={15} color={glass.textSecondary} />}
          onPress={() => {
            haptics.medium();
            resetTheme();
          }}
        />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14 },
  heading: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  list: { gap: 12 },
  resetWrap: { marginTop: 8 },
});
