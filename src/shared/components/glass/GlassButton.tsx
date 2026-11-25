import React from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { useHaptics } from '@/shared/hooks/useHaptics';

type GlassButtonVariant = 'accent' | 'glass' | 'ghost' | 'danger';

interface GlassButtonProps {
  label: string;
  onPress: () => void;
  variant?: GlassButtonVariant;
  icon?: React.ReactNode;
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const DANGER_COLOR = '#EF4444';

export function GlassButton({
  label,
  onPress,
  variant = 'glass',
  icon,
  disabled = false,
  loading = false,
  style,
}: GlassButtonProps) {
  const glass = useGlassStyle();
  const haptics = useHaptics();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const isDark = glass.blurTint === 'dark';
  const neutralBg = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.52)';
  const bgColor =
    variant === 'accent'
      ? isDark
        ? `${glass.accentColor}33`
        : 'rgba(255, 255, 255, 0.78)'
      : variant === 'ghost'
        ? 'transparent'
        : neutralBg;

  const textColor =
    variant === 'danger'
      ? '#EF4444'
      : variant === 'accent'
        ? isDark
          ? '#FFFFFF'
          : '#0F172A'
        : glass.textPrimary;

  return (
    <AnimatedPressable
      disabled={disabled || loading}
      onPress={() => {
        haptics.light();
        onPress();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.96, { damping: 16, stiffness: 300 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 300 });
      }}
      style={[
        styles.button,
        {
          borderRadius: Math.max(8, Math.round(glass.borderRadius * 0.78)),
          backgroundColor: bgColor,
          borderWidth: 0,
          opacity: disabled ? 0.5 : 1,
        },
        animatedStyle,
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="small" color={textColor} />
        ) : (
          <>
            {icon}
            <Text style={[styles.label, { color: textColor, fontFamily: glass.fontRegular }]}>
              {label}
            </Text>
          </>
        )}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 46,
    paddingHorizontal: 18,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
  },
});
