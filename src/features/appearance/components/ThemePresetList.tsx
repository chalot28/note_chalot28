import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Moon, Palette, Sun } from 'lucide-react-native';
import { useThemeStore } from '@/core/theme/themeStore';
import type { FontFamilyOption } from '@/core/theme/theme.types';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { ColorPickerModal } from '@/features/appearance/components/ColorPickerModal';
import { GlassCard } from '@/shared/components/glass/GlassCard';
import { useHaptics } from '@/shared/hooks/useHaptics';

interface BackdropOption {
  id: string;
  label: string;
  colors: [string, string, string, string];
}

const DARK_BACKDROPS: readonly BackdropOption[] = [
  { id: 'obsidian', label: 'Đêm sâu', colors: ['#04070D', '#0B1324', '#12182B', '#081B26'] },
  { id: 'aurora', label: 'Cực quang', colors: ['#071426', '#0E2D38', '#1C224A', '#0D3B3E'] },
  { id: 'emerald', label: 'Lục bảo', colors: ['#03120E', '#07241B', '#0B2F2A', '#041A1D'] },
  { id: 'plum', label: 'Tím khói', colors: ['#0F0718', '#1E1030', '#2A1438', '#140C24'] },
  { id: 'slate', label: 'Xám đá', colors: ['#0A0C10', '#161B22', '#1E242C', '#10141A'] },
];

const LIGHT_BACKDROPS: readonly BackdropOption[] = [
  { id: 'crystal', label: 'Pha lê', colors: ['#EBF4FF', '#D6E8FF', '#F3ECFF', '#DFF5F2'] },
  { id: 'sakura', label: 'Hoa anh đào', colors: ['#FFF1F5', '#FFE4EE', '#F8E8FF', '#FFF5EB'] },
  { id: 'mint', label: 'Bạc hà', colors: ['#ECFDF5', '#D1FAE5', '#E0F2FE', '#F0FDF4'] },
  { id: 'sand', label: 'Cát ấm', colors: ['#FAF6F0', '#F3EAE0', '#EFE8DF', '#FDFBF7'] },
  { id: 'paper', label: 'Giấy trắng', colors: ['#F8FAFC', '#F1F5F9', '#E2E8F0', '#F8FAFC'] },
];

const ACCENT_SWATCHES: readonly string[] = [
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
];

const FONTS: ReadonlyArray<{ id: FontFamilyOption; label: string }> = [
  { id: 'sans', label: 'Sans' },
  { id: 'serif', label: 'Serif' },
  { id: 'mono', label: 'Mono' },
];

export function ThemePresetList() {
  const glass = useGlassStyle();
  const haptics = useHaptics();

  const isDark = useThemeStore((s) => s.isDark);
  const meshColors = useThemeStore((s) => s.meshColors);
  const accentColor = useThemeStore((s) => s.accentColor);
  const fontFamily = useThemeStore((s) => s.fontFamily);

  const setIsDark = useThemeStore((s) => s.setIsDark);
  const setMeshColors = useThemeStore((s) => s.setMeshColors);
  const setAccentColor = useThemeStore((s) => s.setAccentColor);
  const setFontFamily = useThemeStore((s) => s.setFontFamily);

  const [hexInput, setHexInput] = useState(accentColor);
  const [pickerOpen, setPickerOpen] = useState(false);

  useEffect(() => {
    setHexInput(accentColor);
  }, [accentColor]);

  const backdrops = isDark ? DARK_BACKDROPS : LIGHT_BACKDROPS;
  const subSurface = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.05)';
  const dividerColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(15, 23, 42, 0.06)';

  const applyHex = (raw: string) => {
    setHexInput(raw);
    if (/^#[0-9A-Fa-f]{6}$/.test(raw.trim())) {
      setAccentColor(raw.trim());
    }
  };

  return (
    <GlassCard style={styles.card} contentStyle={styles.content}>
      {/* Header + Sáng / Tối */}
      <View style={styles.headerRow}>
        <Text style={[styles.heading, { color: glass.textPrimary }]}>Giao diện & Màu sắc</Text>
        <View style={[styles.segmented, { backgroundColor: subSurface }]}>
          <Pressable
            onPress={() => {
              haptics.selection();
              setIsDark(false);
            }}
            style={[styles.segBtn, !isDark && { backgroundColor: glass.accentColor }]}
          >
            <Sun size={13} color={!isDark ? '#FFFFFF' : glass.textMuted} />
            <Text style={[styles.segText, { color: !isDark ? '#FFFFFF' : glass.textSecondary }]}>
              Sáng
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              haptics.selection();
              setIsDark(true);
            }}
            style={[styles.segBtn, isDark && { backgroundColor: glass.accentColor }]}
          >
            <Moon size={13} color={isDark ? '#FFFFFF' : glass.textMuted} />
            <Text style={[styles.segText, { color: isDark ? '#FFFFFF' : glass.textSecondary }]}>
              Tối
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Màu nền */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: glass.textSecondary }]}>Màu nền</Text>
        <View style={styles.backdropRow}>
          {backdrops.map((item) => {
            const active = item.colors[0] === meshColors[0] && item.colors[1] === meshColors[1];
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  haptics.selection();
                  setMeshColors(item.colors);
                }}
                style={styles.backdropItem}
              >
                <LinearGradient
                  colors={[item.colors[0], item.colors[1], item.colors[2]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.backdropCircle,
                    active && { borderWidth: 2, borderColor: glass.accentColor },
                  ]}
                />
                <Text
                  numberOfLines={1}
                  style={[
                    styles.backdropLabel,
                    { color: active ? glass.accentColor : glass.textMuted },
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={[styles.divider, { backgroundColor: dividerColor }]} />

      {/* Màu nút / điểm nhấn */}
      <View style={styles.section}>
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: glass.textSecondary }]}>Màu nút & điểm nhấn</Text>
          <View style={[styles.hexPill, { backgroundColor: subSurface }]}>
            <TextInput
              value={hexInput}
              onChangeText={applyHex}
              maxLength={7}
              autoCapitalize="characters"
              style={[styles.hexInline, { color: glass.textPrimary }]}
            />
          </View>
        </View>

        <View style={styles.swatchRow}>
          {ACCENT_SWATCHES.map((color) => {
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

          <Pressable
            onPress={() => {
              haptics.light();
              setPickerOpen(true);
            }}
            style={[styles.pickerBtn, { backgroundColor: subSurface }]}
          >
            <Palette size={13} color={glass.textSecondary} />
            <Text style={[styles.pickerText, { color: glass.textSecondary }]}>Tự chọn</Text>
          </Pressable>
        </View>
      </View>

      <ColorPickerModal
        visible={pickerOpen}
        initialColor={accentColor}
        onSelect={(hex) => {
          haptics.selection();
          setAccentColor(hex);
        }}
        onClose={() => setPickerOpen(false)}
      />

      <View style={[styles.divider, { backgroundColor: dividerColor }]} />

      {/* Kiểu chữ */}
      <View style={styles.section}>
        <Text style={[styles.label, { color: glass.textSecondary }]}>Kiểu chữ</Text>
        <View style={[styles.fontSegmented, { backgroundColor: subSurface }]}>
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
                  styles.fontBtn,
                  active && { backgroundColor: `${glass.accentColor}26` },
                ]}
              >
                <Text
                  style={[
                    styles.fontText,
                    { color: active ? glass.accentColor : glass.textSecondary },
                  ]}
                >
                  {f.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 14 },
  content: { padding: 16, gap: 14 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  heading: { fontSize: 15, fontWeight: '700' },
  segmented: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 3,
  },
  segBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 9,
  },
  segText: { fontSize: 12, fontWeight: '600' },
  section: { gap: 10 },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: { fontSize: 12, fontWeight: '600' },
  backdropRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  backdropItem: {
    flex: 1,
    alignItems: 'center',
    gap: 5,
  },
  backdropCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  backdropLabel: {
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  divider: {
    height: 1,
  },
  hexPill: {
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  hexInline: {
    fontSize: 12,
    fontWeight: '600',
    width: 64,
    textAlign: 'center',
    backgroundColor: 'transparent',
  },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 9,
  },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
  },
  swatchActive: {
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  pickerBtn: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 28,
    paddingHorizontal: 10,
    borderRadius: 14,
    overflow: 'hidden',
  },
  pickerText: { fontSize: 11, fontWeight: '600' },
  fontSegmented: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 3,
    gap: 4,
  },
  fontBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 7,
    borderRadius: 9,
  },
  fontText: { fontSize: 12, fontWeight: '600' },
});
