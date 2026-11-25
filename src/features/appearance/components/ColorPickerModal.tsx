import React, { useCallback, useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TextInput, View, type LayoutChangeEvent } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { X } from 'lucide-react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { GlassButton } from '@/shared/components/glass/GlassButton';

interface ColorPickerModalProps {
  visible: boolean;
  initialColor: string;
  onSelect: (hex: string) => void;
  onClose: () => void;
}

function hsvToHex(h: number, s: number, v: number): string {
  const c = v * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = v - c;
  let r = 0;
  let g = 0;
  let b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (n: number) =>
    Math.round((n + m) * 255)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function hexToHsv(hex: string): { h: number; s: number; v: number } {
  const clean = hex.replace('#', '');
  if (!/^[0-9A-Fa-f]{6}$/.test(clean)) return { h: 200, s: 0.77, v: 0.97 };
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = 60 * (((g - b) / d) % 6);
    else if (max === g) h = 60 * ((b - r) / d + 2);
    else h = 60 * ((r - g) / d + 4);
  }
  if (h < 0) h += 360;
  const s = max === 0 ? 0 : d / max;
  return { h, s, v: max };
}

const HUE_STOPS = [
  '#FF0000',
  '#FFFF00',
  '#00FF00',
  '#00FFFF',
  '#0000FF',
  '#FF00FF',
  '#FF0000',
] as const;

export function ColorPickerModal({
  visible,
  initialColor,
  onSelect,
  onClose,
}: ColorPickerModalProps) {
  const glass = useGlassStyle();
  const isDark = glass.blurTint === 'dark';

  const [hsv, setHsv] = useState(() => hexToHsv(initialColor));
  const [hexText, setHexText] = useState(initialColor.toUpperCase());
  const [padSize, setPadSize] = useState({ width: 280, height: 180 });
  const [hueWidth, setHueWidth] = useState(280);

  useEffect(() => {
    if (visible) {
      const next = hexToHsv(initialColor);
      setHsv(next);
      setHexText(initialColor.toUpperCase());
    }
  }, [initialColor, visible]);

  const updateSv = useCallback(
    (x: number, y: number) => {
      const s = Math.min(1, Math.max(0, x / Math.max(1, padSize.width)));
      const v = 1 - Math.min(1, Math.max(0, y / Math.max(1, padSize.height)));
      setHsv((prev) => {
        const next = { ...prev, s, v };
        setHexText(hsvToHex(next.h, next.s, next.v));
        return next;
      });
    },
    [padSize.height, padSize.width],
  );

  const updateHue = useCallback(
    (x: number) => {
      const ratio = Math.min(1, Math.max(0, x / Math.max(1, hueWidth)));
      const h = ratio * 360;
      setHsv((prev) => {
        const next = { ...prev, h };
        setHexText(hsvToHex(next.h, next.s, next.v));
        return next;
      });
    },
    [hueWidth],
  );

  const svPan = Gesture.Pan()
    .onBegin((e) => runOnJS(updateSv)(e.x, e.y))
    .onUpdate((e) => runOnJS(updateSv)(e.x, e.y));
  const svTap = Gesture.Tap().onEnd((e) => runOnJS(updateSv)(e.x, e.y));
  const svGesture = Gesture.Race(svPan, svTap);

  const huePan = Gesture.Pan()
    .onBegin((e) => runOnJS(updateHue)(e.x))
    .onUpdate((e) => runOnJS(updateHue)(e.x));
  const hueTap = Gesture.Tap().onEnd((e) => runOnJS(updateHue)(e.x));
  const hueGesture = Gesture.Race(huePan, hueTap);

  const pureHueHex = hsvToHex(hsv.h, 1, 1);
  const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[
            styles.card,
            {
              borderRadius: glass.borderRadius,
              backgroundColor: isDark ? 'rgba(13, 20, 36, 0.94)' : 'rgba(248, 250, 252, 0.96)',
            },
          ]}
        >
          <BlurView
            intensity={Math.min(100, glass.blurIntensity + 20)}
            tint={glass.blurTint}
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.bgLayer]}
          />
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={[styles.title, { color: glass.textPrimary }]}>Chọn màu chủ đạo</Text>
              <Pressable onPress={onClose} hitSlop={10}>
                <X size={18} color={glass.textMuted} />
              </Pressable>
            </View>

            {/* 2D Saturation / Value Pad */}
            <GestureDetector gesture={svGesture}>
              <View
                onLayout={(e: LayoutChangeEvent) => {
                  setPadSize({
                    width: e.nativeEvent.layout.width,
                    height: e.nativeEvent.layout.height,
                  });
                }}
                style={[styles.svPad, { borderRadius: Math.max(10, glass.borderRadius - 6) }]}
              >
                <LinearGradient
                  colors={['#FFFFFF', pureHueHex]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={StyleSheet.absoluteFill}
                />
                <LinearGradient
                  colors={['rgba(0,0,0,0)', '#000000']}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View
                  pointerEvents="none"
                  style={[
                    styles.svThumb,
                    {
                      left: `${hsv.s * 100}%`,
                      top: `${(1 - hsv.v) * 100}%`,
                      backgroundColor: currentHex,
                    },
                  ]}
                />
              </View>
            </GestureDetector>

            {/* Hue Rainbow Bar */}
            <GestureDetector gesture={hueGesture}>
              <View
                onLayout={(e: LayoutChangeEvent) => setHueWidth(e.nativeEvent.layout.width)}
                style={styles.hueWrap}
              >
                <LinearGradient
                  colors={[...HUE_STOPS]}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                  style={styles.hueBar}
                />
                <View
                  pointerEvents="none"
                  style={[
                    styles.hueThumb,
                    {
                      left: `${(hsv.h / 360) * 100}%`,
                      backgroundColor: pureHueHex,
                    },
                  ]}
                />
              </View>
            </GestureDetector>

            {/* Preview + Hex */}
            <View style={styles.previewRow}>
              <View style={[styles.previewSwatch, { backgroundColor: currentHex }]} />
              <TextInput
                value={hexText}
                onChangeText={(raw) => {
                  setHexText(raw);
                  if (/^#[0-9A-Fa-f]{6}$/.test(raw.trim())) {
                    setHsv(hexToHsv(raw.trim()));
                  }
                }}
                maxLength={7}
                autoCapitalize="characters"
                style={[
                  styles.hexInput,
                  {
                    color: glass.textPrimary,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.07)' : 'rgba(15,23,42,0.06)',
                  },
                ]}
              />
              <GlassButton
                label="Áp dụng"
                variant="accent"
                onPress={() => {
                  onSelect(currentHex);
                  onClose();
                }}
                style={styles.applyBtn}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    overflow: 'hidden',
    padding: 18,
  },
  bgLayer: { zIndex: 0 },
  content: { zIndex: 1, gap: 14 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 16, fontWeight: '700' },
  svPad: {
    height: 180,
    width: '100%',
    overflow: 'hidden',
    position: 'relative',
  },
  svThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    marginLeft: -10,
    marginTop: -10,
  },
  hueWrap: {
    height: 26,
    justifyContent: 'center',
    position: 'relative',
  },
  hueBar: {
    height: 12,
    borderRadius: 6,
    width: '100%',
  },
  hueThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    marginLeft: -10,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  previewSwatch: {
    width: 38,
    height: 38,
    borderRadius: 12,
  },
  hexInput: {
    flex: 1,
    height: 38,
    borderRadius: 10,
    paddingHorizontal: 10,
    fontSize: 13,
    fontWeight: '600',
    backgroundColor: 'transparent',
  },
  applyBtn: {
    height: 38,
    paddingHorizontal: 14,
  },
});
