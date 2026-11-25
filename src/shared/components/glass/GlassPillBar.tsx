import React from 'react';
import { Pressable, StyleSheet, TextInput, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Search, X } from 'lucide-react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { useHaptics } from '@/shared/hooks/useHaptics';

interface GlassPillBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  rightAction?: React.ReactNode;
  onSubmitEditing?: () => void;
  autoFocus?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function GlassPillBar({
  value,
  onChangeText,
  placeholder = 'Tìm kiếm hoặc gõ lệnh...',
  rightAction,
  onSubmitEditing,
  autoFocus = false,
  style,
}: GlassPillBarProps) {
  const glass = useGlassStyle();
  const haptics = useHaptics();

  return (
    <View
      style={[
        styles.container,
        {
          borderRadius: glass.borderRadius,
          borderColor: glass.borderColor,
          borderWidth: glass.borderWidth,
          backgroundColor: glass.surfaceColor,
        },
        style,
      ]}
    >
      <BlurView
        intensity={glass.blurIntensity}
        tint={glass.blurTint}
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.blurLayer]}
      />
      <View style={styles.contentRow}>
        <Search size={18} color={glass.textMuted} strokeWidth={1.8} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={glass.textMuted}
          onSubmitEditing={onSubmitEditing}
          autoFocus={autoFocus}
          returnKeyType="search"
          style={[
            styles.input,
            { color: glass.textPrimary, fontFamily: glass.fontRegular },
          ]}
        />
        {value.length > 0 && (
          <Pressable
            onPress={() => {
              haptics.light();
              onChangeText('');
            }}
            hitSlop={10}
            style={styles.clearBtn}
          >
            <X size={16} color={glass.textMuted} />
          </Pressable>
        )}
        {rightAction}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 48,
    borderRadius: 999,
    overflow: 'hidden',
    paddingHorizontal: 16,
  },
  blurLayer: {
    zIndex: 0,
  },
  contentRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 8,
  },
  clearBtn: {
    padding: 4,
  },
});
