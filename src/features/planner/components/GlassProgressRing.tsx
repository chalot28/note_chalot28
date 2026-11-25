import React, { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { useSharedValue, withSpring } from 'react-native-reanimated';
import { useGlassStyle } from '@/core/theme/useGlassStyle';

interface GlassProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
}

export function GlassProgressRing({
  progress,
  size = 56,
  strokeWidth = 5.5,
}: GlassProgressRingProps) {
  const glass = useGlassStyle();
  const clamped = Math.min(1, Math.max(0, progress));
  const animatedProgress = useSharedValue(clamped);

  useEffect(() => {
    animatedProgress.value = withSpring(clamped, { damping: 16, stiffness: 140 });
  }, [animatedProgress, clamped]);

  const circlePath = useMemo(() => {
    const path = Skia.Path.Make();
    const radius = (size - strokeWidth) / 2;
    const center = size / 2;
    path.addCircle(center, center, radius);
    return path;
  }, [size, strokeWidth]);

  const percent = Math.round(clamped * 100);

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
          color={glass.accentColor}
          start={0}
          end={animatedProgress}
        />
      </Canvas>
      <Text style={[styles.percentText, { color: glass.textPrimary }]}>{percent}%</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentText: {
    position: 'absolute',
    fontSize: 12,
    fontWeight: '700',
  },
});
