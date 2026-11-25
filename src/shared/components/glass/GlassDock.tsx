import React from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { useHaptics } from '@/shared/hooks/useHaptics';

export interface GlassDockItem {
  key: string;
  label: string;
  renderIcon: (color: string, active: boolean) => React.ReactNode;
}

interface GlassDockProps {
  items: readonly GlassDockItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  style?: StyleProp<ViewStyle>;
}

export function GlassDock({ items, activeKey, onSelect, style }: GlassDockProps) {
  const glass = useGlassStyle();
  const haptics = useHaptics();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.outer, { bottom: Math.max(insets.bottom, 12) }, style]} pointerEvents="box-none">
      <View
        style={[
          styles.dock,
          {
            borderRadius: Math.round(glass.borderRadius * 1.6),
            backgroundColor: glass.surfaceColor,
            borderColor: glass.borderColor,
            borderWidth: glass.borderWidth,
          },
        ]}
      >
        <BlurView
          intensity={Math.min(100, glass.blurIntensity + 8)}
          tint={glass.blurTint}
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.blurLayer]}
        />
        {items.map((item) => {
          const isActive = item.key === activeKey;
          const color = isActive ? glass.accentColor : glass.textMuted;
          return (
            <Pressable
              key={item.key}
              onPress={() => {
                haptics.selection();
                onSelect(item.key);
              }}
              style={[
                styles.item,
                { borderRadius: Math.round(glass.borderRadius * 1.2) },
                isActive && { backgroundColor: `${glass.accentColor}1E` },
              ]}
            >
              {item.renderIcon(color, isActive)}
              <Text
                numberOfLines={1}
                style={[styles.label, { color, fontFamily: glass.fontRegular }]}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    position: 'absolute',
    left: 20,
    right: 20,
    alignItems: 'center',
  },
  dock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: 420,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 999,
    overflow: 'hidden',
  },
  blurLayer: {
    zIndex: 0,
  },
  item: {
    zIndex: 1,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 999,
    gap: 3,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});
