import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useGlassStyle } from '@/core/theme/useGlassStyle';

interface SkiaTimerCircleProps {
  remainingSeconds: number;
  period?: number;
  size?: number;
  strokeWidth?: number;
}

const WARNING_COLOR = '#F97316';
const CRITICAL_COLOR = '#EF4444';

export function SkiaTimerCircle({
  remainingSeconds,
  period = 30,
  size = 44,
  strokeWidth = 3.5,
}: SkiaTimerCircleProps) {
  const glass = useGlassStyle();
  const safePeriod = Math.max(1, period);
  const ratio = Math.min(1, Math.max(0, remainingSeconds / safePeriod));

  const ringColor =
    remainingSeconds <= 3
      ? CRITICAL_COLOR
      : remainingSeconds < 5
        ? WARNING_COLOR
        : glass.accentColor;

  const circlePath = useMemo(() => {
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    return Skia.PathBuilder.Make().addCircle(center, center, radius).build();
  }, [size, strokeWidth]);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Canvas style={{ width: size, height: size }}>
        <Path
          path={circlePath}
          style="stroke"
          strokeWidth={strokeWidth}
          color={glass.borderColor}
        />
        <Path
          path={circlePath}
          style="stroke"
          strokeWidth={strokeWidth}
          strokeCap="round"
          color={ringColor}
          start={0}
          end={ratio}
        />
      </Canvas>
      <Text style={[styles.secText, { color: remainingSeconds < 5 ? ringColor : glass.textSecondary }]}>
        {remainingSeconds}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  secText: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '700',
  },
});
