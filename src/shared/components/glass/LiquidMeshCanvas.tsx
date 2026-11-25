import React, { useEffect, useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import { Canvas, Fill, Shader, Skia } from '@shopify/react-native-skia';
import { LinearGradient } from 'expo-linear-gradient';
import { Easing, useDerivedValue, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';
import { useThemeStore } from '@/core/theme/themeStore';

const MESH_SHADER_SOURCE = `
uniform float2 u_resolution;
uniform float u_time;
uniform half4 u_c0;
uniform half4 u_c1;
uniform half4 u_c2;
uniform half4 u_c3;

half4 main(float2 xy) {
  float2 uv = xy / max(u_resolution, float2(1.0, 1.0));
  float t = u_time * 0.25;

  float2 p0 = float2(0.25 + 0.18 * sin(t * 1.1), 0.25 + 0.16 * cos(t * 0.9));
  float2 p1 = float2(0.78 + 0.16 * cos(t * 0.8), 0.28 + 0.18 * sin(t * 1.2));
  float2 p2 = float2(0.28 + 0.18 * cos(t * 1.3), 0.76 + 0.14 * sin(t * 0.7));
  float2 p3 = float2(0.75 + 0.15 * sin(t * 0.6), 0.78 + 0.16 * cos(t * 1.1));

  float w0 = exp(-3.2 * length(uv - p0));
  float w1 = exp(-3.0 * length(uv - p1));
  float w2 = exp(-3.1 * length(uv - p2));
  float w3 = exp(-2.9 * length(uv - p3));
  float total = max(w0 + w1 + w2 + w3, 0.0001);

  return (u_c0 * w0 + u_c1 * w1 + u_c2 * w2 + u_c3 * w3) / total;
}
`;

function hexToRgbaArray(hex: string): [number, number, number, number] {
  const clean = hex.replace('#', '');
  const full = clean.length === 3 ? clean.replace(/(.)/g, '$1$1') : clean.padEnd(6, '0');
  const intVal = parseInt(full.slice(0, 6), 16);
  return [((intVal >> 16) & 255) / 255, ((intVal >> 8) & 255) / 255, (intVal & 255) / 255, 1];
}

export function LiquidMeshCanvas() {
  const { width, height } = useWindowDimensions();
  const meshColors = useThemeStore((s) => s.meshColors);
  const clock = useSharedValue(0);

  const effect = useMemo(() => Skia.RuntimeEffect.Make(MESH_SHADER_SOURCE), []);

  useEffect(() => {
    clock.value = withRepeat(
      withTiming(Math.PI * 20, { duration: 90000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [clock]);

  const c0 = useMemo(() => hexToRgbaArray(meshColors[0]), [meshColors]);
  const c1 = useMemo(() => hexToRgbaArray(meshColors[1]), [meshColors]);
  const c2 = useMemo(() => hexToRgbaArray(meshColors[2]), [meshColors]);
  const c3 = useMemo(() => hexToRgbaArray(meshColors[3]), [meshColors]);

  const uniforms = useDerivedValue(() => ({
    u_resolution: [width, height],
    u_time: clock.value,
    u_c0: c0,
    u_c1: c1,
    u_c2: c2,
    u_c3: c3,
  }));

  if (!effect) {
    return (
      <LinearGradient
        colors={[meshColors[0], meshColors[1], meshColors[2], meshColors[3]]}
        style={StyleSheet.absoluteFill}
      />
    );
  }

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Fill>
        <Shader source={effect} uniforms={uniforms} />
      </Fill>
    </Canvas>
  );
}
