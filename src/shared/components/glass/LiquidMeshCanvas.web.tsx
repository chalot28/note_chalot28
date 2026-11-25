import React from 'react';
import { StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeStore } from '@/core/theme/themeStore';

export function LiquidMeshCanvas() {
  const meshColors = useThemeStore((s) => s.meshColors);

  return (
    <LinearGradient
      colors={[meshColors[0], meshColors[1], meshColors[2], meshColors[3]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    />
  );
}
