import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { useAppStateBlur } from '@/shared/hooks/useAppStateBlur';

interface PrivacyShieldOverlayProps {
  forceActive?: boolean;
}

export function PrivacyShieldOverlay({ forceActive = false }: PrivacyShieldOverlayProps) {
  const { isBlurred } = useAppStateBlur();
  const glass = useGlassStyle();

  if (!isBlurred && !forceActive) {
    return null;
  }

  const subtleTintBg =
    glass.blurTint === 'dark' ? 'rgba(10, 14, 24, 0.22)' : 'rgba(255, 255, 255, 0.22)';
  const webBackdropStyle =
    Platform.OS === 'web'
      ? ({ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' } as object)
      : null;

  return (
    <View
      style={[styles.container, { backgroundColor: subtleTintBg }, webBackdropStyle]}
      pointerEvents="auto"
    >
      {Platform.OS !== 'web' ? (
        <BlurView
          intensity={80}
          tint={glass.blurTint}
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    elevation: 9999,
  },
});
