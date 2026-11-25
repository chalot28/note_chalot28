import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useGlassStyle } from '@/core/theme/useGlassStyle';

interface GlassSliderRowProps {
  label: string;
  valueLabel: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (nextValue: number) => void;
}

export function GlassSliderRow({
  label,
  valueLabel,
  value,
  min,
  max,
  step = 1,
  onChange,
}: GlassSliderRowProps) {
  const glass = useGlassStyle();
  const isDark = glass.blurTint === 'dark';
  const [trackWidth, setTrackWidth] = useState(240);
  const thumbScale = useSharedValue(1);

  const emitValueFromX = useCallback(
    (x: number) => {
      if (trackWidth <= 0) return;
      const ratio = Math.min(1, Math.max(0, x / trackWidth));
      const raw = min + ratio * (max - min);
      const snapped = Math.round(raw / step) * step;
      const clamped = Math.min(max, Math.max(min, Number(snapped.toFixed(4))));
      onChange(clamped);
    },
    [max, min, onChange, step, trackWidth],
  );

  const pan = Gesture.Pan()
    .onBegin((e) => {
      thumbScale.value = withSpring(1.18, { damping: 14, stiffness: 280 });
      runOnJS(emitValueFromX)(e.x);
    })
    .onUpdate((e) => runOnJS(emitValueFromX)(e.x))
    .onFinalize(() => {
      thumbScale.value = withSpring(1, { damping: 14, stiffness: 280 });
    });

  const tap = Gesture.Tap().onEnd((e) => runOnJS(emitValueFromX)(e.x));
  const gesture = Gesture.Race(pan, tap);

  const thumbAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: thumbScale.value }],
  }));

  const percent = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));

  const onLayout = (e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  };

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={[styles.label, { color: glass.textPrimary }]}>{label}</Text>
        <Text style={[styles.value, { color: glass.accentColor }]}>{valueLabel}</Text>
      </View>

      <GestureDetector gesture={gesture}>
        <View onLayout={onLayout} style={styles.hitArea}>
          <View
            style={[
              styles.track,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(15, 23, 42, 0.09)',
              },
            ]}
          >
            <LinearGradient
              colors={[`${glass.accentColor}88`, glass.accentColor]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={[styles.fill, { width: `${percent}%` }]}
            />
          </View>
          <Animated.View
            style={[
              styles.thumb,
              {
                left: `${percent}%`,
                backgroundColor: '#FFFFFF',
                shadowColor: glass.accentColor,
              },
              thumbAnimatedStyle,
            ]}
          />
        </View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 4 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: 13, fontWeight: '500' },
  value: { fontSize: 12, fontWeight: '700' },
  hitArea: { height: 30, justifyContent: 'center' },
  track: { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 3 },
  thumb: {
    position: 'absolute',
    width: 24,
    height: 16,
    borderRadius: 8,
    marginLeft: -12,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.32,
    shadowRadius: 6,
    elevation: 4,
  },
});
