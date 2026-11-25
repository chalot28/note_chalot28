import React, { useEffect, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { Palette, RotateCcw } from 'lucide-react-native';
import { useThemeStore } from '@/core/theme/themeStore';
import type { FontFamilyOption } from '@/core/theme/theme.types';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { GlassButton } from '@/shared/components/glass/GlassButton';
import { GlassCard } from '@/shared/components/glass/GlassCard';
import { GlassInput } from '@/shared/components/glass/GlassInput';
import { useHaptics } from '@/shared/hooks/useHaptics';

const SWATCHES: readonly string[] = [
  '#0A84FF',
  '#38BDF8',
  '#5EEAD4',
  '#10B981',
  '#EC4899',
  '#8B5CF6',
  '#F59E0B',
  '#F43F5E',
  '#6366F1',
  '#14B8A6',
  '#EF4444',
  '#EAB308',
];

const FONTS: ReadonlyArray<{ id: FontFamilyOption; label: string }> = [
  { id: 'sans', label: 'Sans-Serif' },
  { id: 'serif', label: 'Serif' },
  { id: 'mono', label: 'Monospace' },
];

export function AccentColorPicker() {
  const glass = useGlassStyle();
  const haptics = useHaptics();
  const accentColor = useThemeStore((s) => s.accentColor);
  const fontFamily = useThemeStore((s) => s.fontFamily);
  const setAccentColor = useThemeStore((s) => s.setAccentColor);
  const setFontFamily = useThemeStore((s) => s.setFontFamily);
  const resetTheme = useThemeStore((s) => s.resetTheme);

  const [hexInput, setHexInput] = useState(accentColor);

  useEffect(() => {
    setHexInput(accentColor);
  }, [accentColor]);

  const applyHex = (raw: string) => {
    setHexInput(raw);
    if (/^#[0-9A-Fa-f]{6}$/.test(raw.trim())) {
      setAccentColor(raw.trim());
    }
  };

  return (
    <GlassCard style={styles.card}>
      <Text style={[styles.heading, { color: glass.textPrimary }]}>Màu nút / Điểm nhấn & Kiểu chữ</Text>

      <View style={styles.swatchGrid}>
        {SWATCHES.map((color) => {
          const active = color.toLowerCase() === accentColor.toLowerCase();
          return (
            <Pressable
              key={color}
              onPress={() => {
                haptics.selection();
                setAccentColor(color);
              }}
              style={[
                styles.swatch,
                { backgroundColor: color },
                active && styles.swatchActive,
              ]}
            />
          );
        })}

        {Platform.OS === 'web' ? (
          <View style={[styles.webPickerWrap, { backgroundColor: glass.surfaceColor }]}>
            <Palette size={14} color={glass.textSecondary} />
            <Text style={[styles.webPickerText, { color: glass.textSecondary }]}>Chọn tự do</Text>
            <input
              type="color"
              value={/^#[0-9A-Fa-f]{6}$/.test(accentColor) ? accentColor : '#38BDF8'}
              onChange={(e) => setAccentColor(e.target.value)}
              aria-label="Chọn màu nút tùy chỉnh"
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 0,
                width: '100%',
                height: '100%',
                cursor: 'pointer',
              }}
            />
          </View>
        ) : null}
      </View>

      <GlassInput
        label="Mã màu Hex tùy chỉnh"
        value={hexInput}
        onChangeText={applyHex}
        placeholder="#38BDF8"
        autoCapitalize="characters"
        containerStyle={styles.hexBox}
      />

      <View style={styles.fontRow}>
        {FONTS.map((f) => {
          const active = f.id === fontFamily;
          return (
            <Pressable
              key={f.id}
              onPress={() => {
                haptics.selection();
                setFontFamily(f.id);
              }}
              style={[
                styles.fontChip,
                {
                  borderColor: active ? glass.accentColor : 'transparent',
                  borderWidth: active ? 1 : 0,
                  backgroundColor: active ? `${glass.accentColor}26` : glass.surfaceColor,
                },
              ]}
            >
              <Text style={[styles.fontLabel, { color: active ? glass.accentColor : glass.textSecondary }]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <GlassButton
        label="Khôi phục mặc định"
        variant="ghost"
        icon={<RotateCcw size={15} color={glass.textSecondary} />}
        onPress={() => {
          haptics.medium();
          resetTheme();
        }}
      />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14 },
  heading: { fontSize: 15, fontWeight: '700', marginBottom: 12 },
  swatchGrid: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 10, marginBottom: 12 },
  swatch: { width: 30, height: 30, borderRadius: 15 },
  swatchActive: { borderWidth: 2.5, borderColor: '#FFFFFF' },
  webPickerWrap: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
  },
  webPickerText: { fontSize: 11, fontWeight: '600' },
  hexBox: { marginBottom: 12 },
  fontRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  fontLabel: { fontSize: 12, fontWeight: '600' },
  fontChip: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 999 },
});
