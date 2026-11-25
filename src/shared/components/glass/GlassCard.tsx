import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { useHaptics } from '@/shared/hooks/useHaptics';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  onPress?: () => void;
  onLongPress?: () => void;
  elevated?: boolean;
  noPadding?: boolean;
  enableHaptic?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const SPRING_CONFIG = { damping: 18, stiffness: 280, mass: 0.7 };

export function GlassCard({
  children,
  style,
  contentStyle,
  onPress,
  onLongPress,
  elevated = false,
  noPadding = false,
  enableHaptic = true,
}: GlassCardProps) {
  const glass = useGlassStyle();
  const haptics = useHaptics();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const radiusStyle = { borderRadius: glass.borderRadius };
  const surfaceColor = elevated ? glass.surfaceElevatedColor : glass.surfaceColor;

  const innerContent = (
    <View
      style={[
        styles.wrapper,
        radiusStyle,
        { borderColor: glass.borderColor, borderWidth: glass.borderWidth },
      ]}
    >
      <BlurView
        intensity={glass.blurIntensity}
        tint={glass.blurTint}
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.bgLayer]}
      />
      <LinearGradient
        colors={[surfaceColor, 'rgba(255,255,255,0.01)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.bgLayer]}
      />
      <View style={[styles.content, !noPadding && styles.padded, contentStyle]}>{children}</View>
    </View>
  );

  if (!onPress && !onLongPress) {
    return <View style={[radiusStyle, style]}>{innerContent}</View>;
  }

  return (
    <AnimatedPressable
      onPress={() => {
        if (enableHaptic) haptics.light();
        onPress?.();
      }}
      onLongPress={() => {
        if (enableHaptic) haptics.medium();
        onLongPress?.();
      }}
      onPressIn={() => {
        scale.value = withSpring(0.975, SPRING_CONFIG);
      }}
      onPressOut={() => {
        scale.value = withSpring(1, SPRING_CONFIG);
      }}
      style={[radiusStyle, animatedStyle, style]}
    >
      {innerContent}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
  },
  bgLayer: {
    zIndex: 0,
  },
  content: {
    position: 'relative',
    zIndex: 1,
  },
  padded: {
    padding: 16,
  },
});
