import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useGlassStyle } from '@/core/theme/useGlassStyle';

interface ZenHeaderProps {
  title: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  isZenActive?: boolean;
  onLongPressTitle?: () => void;
}

export function ZenHeader({
  title,
  subtitle,
  leftAction,
  rightAction,
  isZenActive = false,
  onLongPressTitle,
}: ZenHeaderProps) {
  const glass = useGlassStyle();
  const visibility = useSharedValue(isZenActive ? 0 : 1);

  useEffect(() => {
    visibility.value = withTiming(isZenActive ? 0 : 1, { duration: 240 });
  }, [isZenActive, visibility]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: visibility.value,
    transform: [{ translateY: (1 - visibility.value) * -8 }],
  }));

  return (
    <Animated.View
      style={[styles.container, animatedStyle]}
      pointerEvents={isZenActive ? 'none' : 'auto'}
    >
      <View style={styles.leftSlot}>{leftAction}</View>
      <Pressable
        onLongPress={onLongPressTitle}
        delayLongPress={2000}
        disabled={!onLongPressTitle}
        style={styles.centerSlot}
      >
        <Text
          numberOfLines={1}
          style={[styles.title, { color: glass.textPrimary, fontFamily: glass.fontRegular }]}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            numberOfLines={1}
            style={[styles.subtitle, { color: glass.textMuted, fontFamily: glass.fontRegular }]}
          >
            {subtitle}
          </Text>
        ) : null}
      </Pressable>
      <View style={styles.rightSlot}>{rightAction}</View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  leftSlot: { minWidth: 40, alignItems: 'flex-start' },
  centerSlot: { flex: 1, alignItems: 'center', paddingHorizontal: 8 },
  rightSlot: { minWidth: 40, alignItems: 'flex-end' },
  title: { fontSize: 18, fontWeight: '700', letterSpacing: -0.2 },
  subtitle: { fontSize: 12, marginTop: 1 },
});
