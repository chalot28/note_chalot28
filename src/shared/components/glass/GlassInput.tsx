import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type StyleProp, type TextInputProps, type ViewStyle } from 'react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';

interface GlassInputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

export function GlassInput({
  label,
  error,
  leftIcon,
  rightElement,
  containerStyle,
  style,
  onFocus,
  onBlur,
  ...inputProps
}: GlassInputProps) {
  const glass = useGlassStyle();
  const [focused, setFocused] = useState(false);

  const isDark = glass.blurTint === 'dark';
  const borderColor = error
    ? '#EF4444'
    : focused
      ? glass.accentColor
      : isDark
        ? 'rgba(255, 255, 255, 0.08)'
        : 'rgba(15, 23, 42, 0.1)';
  const fieldBg = isDark ? 'rgba(255, 255, 255, 0.07)' : 'rgba(15, 23, 42, 0.05)';

  return (
    <View style={[styles.root, containerStyle]}>
      {label ? (
        <Text style={[styles.label, { color: glass.textSecondary, fontFamily: glass.fontRegular }]}>
          {label}
        </Text>
      ) : null}
      <View
        style={[
          styles.field,
          inputProps.multiline && styles.fieldMultiline,
          {
            borderRadius: Math.max(8, Math.round(glass.borderRadius * 0.78)),
            borderColor,
            borderWidth: 1,
            backgroundColor: fieldBg,
          },
        ]}
      >
        <View style={[styles.contentRow, inputProps.multiline && styles.contentRowMultiline]}>
          {leftIcon}
          <TextInput
            {...inputProps}
            placeholderTextColor={glass.textMuted}
            onFocus={(e) => {
              setFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              onBlur?.(e);
            }}
            style={[
              styles.input,
              { color: glass.textPrimary, fontFamily: glass.fontRegular },
              style,
            ]}
          />
          {rightElement}
        </View>
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginLeft: 4,
  },
  field: {
    height: 46,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  fieldMultiline: {
    height: undefined,
    minHeight: 110,
    paddingVertical: 10,
    justifyContent: 'flex-start',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  contentRowMultiline: {
    alignItems: 'flex-start',
  },
  input: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    paddingVertical: 8,
    backgroundColor: 'transparent',
  },
  errorText: {
    fontSize: 12,
    color: '#EF4444',
    marginLeft: 4,
  },
});
