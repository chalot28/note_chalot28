import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Delete, ScanFace } from 'lucide-react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { useHaptics } from '@/shared/hooks/useHaptics';

interface PinKeypadGlassProps {
  pinLength: number;
  maxDigits?: number;
  errorCount: number;
  showBiometric?: boolean;
  disabled?: boolean;
  onDigit: (digit: string) => void;
  onDelete: () => void;
  onBiometric?: () => void;
}

const KEY_ROWS: ReadonlyArray<readonly string[]> = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['BIO', '0', 'DEL'],
];

export function PinKeypadGlass({
  pinLength,
  maxDigits = 6,
  errorCount,
  showBiometric = true,
  disabled = false,
  onDigit,
  onDelete,
  onBiometric,
}: PinKeypadGlassProps) {
  const glass = useGlassStyle();
  const haptics = useHaptics();
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (errorCount === 0) return;
    haptics.error();
    shakeX.value = withSequence(
      withTiming(-10, { duration: 45 }),
      withTiming(10, { duration: 45 }),
      withTiming(-8, { duration: 45 }),
      withTiming(8, { duration: 45 }),
      withTiming(0, { duration: 45 }),
    );
  }, [errorCount, haptics, shakeX]);

  const dotsStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={[styles.dotsRow, dotsStyle]}>
        {Array.from({ length: maxDigits }, (_, i) => {
          const filled = i < pinLength;
          return (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  borderColor: filled ? glass.accentColor : glass.borderColor,
                  backgroundColor: filled ? glass.accentColor : 'transparent',
                },
              ]}
            />
          );
        })}
      </Animated.View>

      <View style={styles.grid}>
        {KEY_ROWS.map((row, rIdx) => (
          <View key={rIdx} style={styles.row}>
            {row.map((cell) => {
              if (cell === 'BIO' && !showBiometric) {
                return <View key={cell} style={styles.keySpacer} />;
              }
              return (
                <KeypadButton
                  key={cell}
                  cell={cell}
                  disabled={disabled}
                  onPress={() => {
                    if (disabled) return;
                    haptics.light();
                    if (cell === 'BIO') onBiometric?.();
                    else if (cell === 'DEL') onDelete();
                    else onDigit(cell);
                  }}
                />
              );
            })}
          </View>
        ))}
      </View>
    </View>
  );
}

function KeypadButton({
  cell,
  disabled,
  onPress,
}: {
  cell: string;
  disabled?: boolean;
  onPress: () => void;
}) {
  const glass = useGlassStyle();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View style={[animStyle, disabled && { opacity: 0.45 }]}>
      <Pressable
        disabled={disabled}
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.9, { damping: 14, stiffness: 320 });
        }}
        onPressOut={() => {
          scale.value = withSpring(1, { damping: 14, stiffness: 320 });
        }}
        style={[
          styles.key,
          { borderColor: glass.borderColor, borderWidth: glass.borderWidth, backgroundColor: glass.surfaceColor },
        ]}
      >
        <BlurView
          intensity={glass.blurIntensity}
          tint={glass.blurTint}
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.blurLayer]}
        />
        <View style={styles.keyContent} pointerEvents="none">
          {cell === 'BIO' ? <ScanFace size={24} color={glass.accentColor} /> : cell === 'DEL' ? <Delete size={22} color={glass.textSecondary} /> : <Text style={[styles.digit, { color: glass.textPrimary }]}>{cell}</Text>}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { alignItems: 'center', gap: 28 },
  dotsRow: { flexDirection: 'row', gap: 14 },
  dot: { width: 13, height: 13, borderRadius: 7, borderWidth: 1.5 },
  grid: { gap: 14 },
  row: { flexDirection: 'row', gap: 20 },
  key: { width: 72, height: 72, borderRadius: 36, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  blurLayer: { zIndex: 0 },
  keyContent: { zIndex: 1, alignItems: 'center', justifyContent: 'center' },
  keySpacer: { width: 72, height: 72 },
  digit: { fontSize: 26, fontWeight: '500' },
});
