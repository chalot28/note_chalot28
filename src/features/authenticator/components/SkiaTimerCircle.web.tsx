import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useGlassStyle } from '@/core/theme/useGlassStyle';

interface SkiaTimerCircleProps {
  remainingSeconds: number;
  period?: number;
  size?: number;
  strokeWidth?: number;
}

export function SkiaTimerCircle({
  remainingSeconds,
  period = 30,
  size = 44,
  strokeWidth = 3.5,
}: SkiaTimerCircleProps) {
  const glass = useGlassStyle();
  const ratio = Math.min(1, Math.max(0, remainingSeconds / Math.max(1, period)));
  const ringColor =
    remainingSeconds <= 3 ? '#EF4444' : remainingSeconds < 5 ? '#F97316' : glass.accentColor;

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - ratio);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={glass.borderColor}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={ringColor}
          strokeWidth={strokeWidth}
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={dashOffset}
          strokeLinecap="round"
          fill="transparent"
          rotation={-90}
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <Text style={[styles.secText, { color: remainingSeconds < 5 ? ringColor : glass.textSecondary }]}>
        {remainingSeconds}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  secText: { position: 'absolute', fontSize: 12, fontWeight: '700' },
});
