import React from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { useHaptics } from '@/shared/hooks/useHaptics';

interface FloatingActionOrbProps {
  onPress: () => void;
  onLongPress?: () => void;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FloatingActionOrb({
  onPress,
  onLongPress,
  icon,
  style,
}: FloatingActionOrbProps) {
  const glass = useGlassStyle();
  const haptics = useHaptics();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => {
        haptics.medium();
        onPress();
      }}
      onLongPress={() => {
        if (onLongPress) {
          haptics.heavy();
          onLongPress();
        }
      }}
      onPressIn={() => {
        scale.value = withSpring(0.9, { damping: 14, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 14, stiffness: 320 });
      }}
      style={[
        styles.orb,
        animatedStyle,
        style,
      ]}
    >
      <BlurView
        intensity={Math.min(35, glass.blurIntensity)}
        tint={glass.blurTint}
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.bgLayer]}
      />
      <LinearGradient
        colors={
          glass.blurTint === 'dark'
            ? ['rgba(255,255,255,0.12)', 'rgba(255,255,255,0.02)']
            : ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.18)']
        }
        start={{ x: 0.15, y: 0 }}
        end={{ x: 0.85, y: 1 }}
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.bgLayer]}
      />
      <View style={styles.iconWrap} pointerEvents="none">
        {icon ?? <Plus size={25} color={glass.textPrimary} strokeWidth={2.2} />}
      </View>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  orb: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bgLayer: {
    zIndex: 0,
  },
  iconWrap: {
    zIndex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
