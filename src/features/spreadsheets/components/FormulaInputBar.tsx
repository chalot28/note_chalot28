import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Check } from 'lucide-react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { coordToA1 } from '@/features/spreadsheets/services/cell.formatter';
import type { CellFormat, SheetCoord } from '@/features/spreadsheets/types/sheet.types';
import { useHaptics } from '@/shared/hooks/useHaptics';

interface FormulaInputBarProps {
  selected: SheetCoord;
  rawValue: string;
  activeFormat: CellFormat;
  onChangeRaw: (value: string) => void;
  onChangeFormat: (format: CellFormat) => void;
}

const FORMAT_OPTIONS: ReadonlyArray<{ format: CellFormat; label: string }> = [
  { format: 'general', label: '123' },
  { format: 'vnd', label: '₫' },
  { format: 'usd', label: '$' },
  { format: 'percent', label: '%' },
  { format: 'checkbox', label: '☑' },
];

export function FormulaInputBar({
  selected,
  rawValue,
  activeFormat,
  onChangeRaw,
  onChangeFormat,
}: FormulaInputBarProps) {
  const glass = useGlassStyle();
  const haptics = useHaptics();
  const coordLabel = coordToA1(selected.row, selected.col);
  const isFormula = rawValue.trimStart().startsWith('=');

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: isFormula ? glass.accentColor : glass.borderColor,
          borderWidth: glass.borderWidth,
          backgroundColor: glass.surfaceElevatedColor,
          borderRadius: Math.min(glass.borderRadius, 14),
        },
      ]}
    >
      <BlurView
        intensity={glass.blurIntensity}
        tint={glass.blurTint}
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.blurLayer]}
      />
      <View style={styles.topRow}>
        <View style={[styles.coordPill, { backgroundColor: `${glass.accentColor}24` }]}>
          <Text style={[styles.coordText, { color: glass.accentColor }]}>{coordLabel}</Text>
        </View>
        <Text style={[styles.fxLabel, { color: glass.textMuted }]}>fx</Text>
        <TextInput
          value={rawValue}
          onChangeText={onChangeRaw}
          placeholder={isFormula ? 'Chạm ô để chèn tọa độ...' : 'Nhập số, chữ hoặc =SUM(A1:A3)'}
          placeholderTextColor={glass.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={[styles.input, { color: glass.textPrimary, fontFamily: glass.fontMono }]}
        />
        {isFormula ? (
          <View style={[styles.formulaHint, { backgroundColor: `${glass.accentColor}24` }]}>
            <Check size={12} color={glass.accentColor} strokeWidth={2.5} />
          </View>
        ) : null}
      </View>

      <View style={styles.formatRow}>
        {FORMAT_OPTIONS.map((opt) => {
          const active = opt.format === activeFormat;
          return (
            <Pressable
              key={opt.format}
              onPress={() => {
                haptics.selection();
                onChangeFormat(opt.format);
              }}
              style={[
                styles.formatChip,
                {
                  borderColor: active ? glass.accentColor : glass.borderColor,
                  backgroundColor: active ? `${glass.accentColor}26` : 'transparent',
                },
              ]}
            >
              <Text style={[styles.formatText, { color: active ? glass.accentColor : glass.textSecondary }]}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
        {!isFormula ? (
          <Pressable
            onPress={() => {
              haptics.selection();
              onChangeRaw('=SUM(');
            }}
            style={[
              styles.formatChip,
              styles.sumChip,
              { borderColor: `${glass.accentColor}55`, backgroundColor: `${glass.accentColor}16` },
            ]}
          >
            <Text style={[styles.formatText, { color: glass.accentColor }]}>=SUM</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    padding: 8,
    gap: 6,
    marginBottom: 8,
  },
  blurLayer: {
    zIndex: 0,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 1,
  },
  coordPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 7,
  },
  coordText: {
    fontSize: 11,
    fontWeight: '700',
  },
  fxLabel: {
    fontSize: 12,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  input: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 2,
  },
  formulaHint: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  formatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    zIndex: 1,
  },
  formatChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 0.75,
  },
  sumChip: {
    marginLeft: 'auto',
  },
  formatText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
