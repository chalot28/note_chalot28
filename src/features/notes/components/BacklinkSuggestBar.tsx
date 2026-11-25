import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Link2 } from 'lucide-react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import type { BacklinkMatch } from '@/features/notes/types/note.types';
import { useHaptics } from '@/shared/hooks/useHaptics';

interface BacklinkSuggestBarProps {
  matches: readonly BacklinkMatch[];
  onSelect: (match: BacklinkMatch) => void;
}

export function BacklinkSuggestBar({ matches, onSelect }: BacklinkSuggestBarProps) {
  const glass = useGlassStyle();
  const haptics = useHaptics();

  if (matches.length === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: glass.surfaceElevatedColor,
          borderColor: glass.highlightBorderColor,
          borderWidth: glass.borderWidth,
        },
      ]}
    >
      <BlurView
        intensity={glass.blurIntensity}
        tint={glass.blurTint}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {matches.map((match) => (
          <Pressable
            key={match.noteId}
            onPress={() => {
              haptics.selection();
              onSelect(match);
            }}
            style={[styles.chip, { borderColor: `${glass.accentColor}55`, backgroundColor: `${glass.accentColor}18` }]}
          >
            <Link2 size={13} color={glass.accentColor} />
            <Text numberOfLines={1} style={[styles.chipText, { color: glass.textPrimary }]}>
              [[{match.title}]]
            </Text>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 40,
    borderRadius: 999,
    overflow: 'hidden',
    marginBottom: 6,
  },
  row: {
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 0.75,
    maxWidth: 200,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
