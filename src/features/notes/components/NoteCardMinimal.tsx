import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Pin, Trash2 } from 'lucide-react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import type { NoteEntity } from '@/features/notes/types/note.types';
import { GlassCard } from '@/shared/components/glass/GlassCard';
import { formatRelativeTime } from '@/shared/utils/date.utils';

interface NoteCardMinimalProps {
  note: NoteEntity;
  compact?: boolean;
  onPress: (note: NoteEntity) => void;
  onLongPress?: (note: NoteEntity) => void;
  onDelete?: (note: NoteEntity) => void;
}

export const NoteCardMinimal = memo(function NoteCardMinimal({
  note,
  compact = false,
  onPress,
  onLongPress,
  onDelete,
}: NoteCardMinimalProps) {
  const glass = useGlassStyle();
  const visibleTags = note.tags.slice(0, 2);

  return (
    <GlassCard
      onPress={() => onPress(note)}
      onLongPress={onLongPress ? () => onLongPress(note) : undefined}
      style={[styles.card, compact && styles.compactCard]}
      contentStyle={compact ? styles.compactContent : undefined}
    >
      <View style={styles.headerRow}>
        <Text
          numberOfLines={1}
          style={[styles.title, { color: glass.textPrimary, fontFamily: glass.fontRegular }]}
        >
          {note.title || 'Ghi chú không tiêu đề'}
        </Text>
        <View style={styles.badges}>
          {note.isPinned ? <Pin size={13} color={glass.accentColor} strokeWidth={2} /> : null}
          {onDelete ? (
            <Pressable
              onPress={(e) => {
                e.stopPropagation?.();
                onDelete(note);
              }}
              hitSlop={8}
              accessibilityLabel="Xóa ghi chú"
              style={styles.deleteBtn}
            >
              <Trash2 size={15} color={glass.textMuted} strokeWidth={1.9} />
            </Pressable>
          ) : null}
        </View>
      </View>

      {note.excerpt ? (
        <Text
          numberOfLines={compact ? 2 : 1}
          style={[styles.excerpt, { color: glass.textMuted, fontFamily: glass.fontRegular }]}
        >
          {note.excerpt}
        </Text>
      ) : null}

      <View style={styles.footerRow}>
        <Text style={[styles.time, { color: glass.textMuted }]}>
          {formatRelativeTime(note.updatedAt)}
        </Text>
        <View style={styles.tagRow}>
          {visibleTags.map((tag) => (
            <Text key={tag} numberOfLines={1} style={[styles.tagText, { color: glass.accentColor }]}>
              #{tag}
            </Text>
          ))}
        </View>
      </View>
    </GlassCard>
  );
});

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
  },
  compactCard: {
    marginHorizontal: 5,
    marginBottom: 10,
  },
  compactContent: {
    padding: 13,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  badges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteBtn: {
    padding: 4,
    borderRadius: 999,
  },
  excerpt: {
    fontSize: 13,
    lineHeight: 18,
    marginTop: 5,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    gap: 8,
  },
  time: {
    fontSize: 11,
  },
  tagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
