import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ShieldCheck } from 'lucide-react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';

export function VaultBadgeBanner() {
  const glass = useGlassStyle();

  return (
    <View
      style={[
        styles.banner,
        {
          borderColor: `${glass.accentColor}55`,
          backgroundColor: `${glass.accentColor}1A`,
        },
      ]}
    >
      <ShieldCheck size={14} color={glass.accentColor} strokeWidth={2} />
      <Text style={[styles.text, { color: glass.textPrimary }]}>
        Chế độ ẩn • Đã chặn chụp màn hình
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 0.75,
    marginBottom: 10,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
