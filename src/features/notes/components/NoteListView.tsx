import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FlashList, type ListRenderItem } from '@shopify/flash-list';
import { FileText } from 'lucide-react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { NoteCardMinimal } from '@/features/notes/components/NoteCardMinimal';
import type { NoteEntity, NoteViewMode } from '@/features/notes/types/note.types';
import { GlassCard } from '@/shared/components/glass/GlassCard';

interface NoteListViewProps {
  notes: readonly NoteEntity[];
  viewMode: NoteViewMode;
  onPressNote: (note: NoteEntity) => void;
  onLongPressNote?: (note: NoteEntity) => void;
  onDeleteNote?: (note: NoteEntity) => void;
  bottomPadding?: number;
}

export function NoteListView({
  notes,
  viewMode,
  onPressNote,
  onLongPressNote,
  onDeleteNote,
  bottomPadding = 110,
}: NoteListViewProps) {
  const glass = useGlassStyle();
  const isGrid = viewMode === 'grid';

  const renderItem = useCallback<ListRenderItem<NoteEntity>>(
    ({ item }) => (
      <NoteCardMinimal
        note={item}
        compact={isGrid}
        onPress={onPressNote}
        onLongPress={onLongPressNote}
        onDelete={onDeleteNote}
      />
    ),
    [isGrid, onDeleteNote, onLongPressNote, onPressNote],
  );

  if (notes.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <GlassCard style={styles.emptyCard}>
          <View style={styles.emptyInner}>
            <FileText size={28} color={glass.accentColor} strokeWidth={1.6} />
            <Text style={[styles.emptyTitle, { color: glass.textPrimary }]}>
              Chưa có ghi chú nào
            </Text>
            <Text style={[styles.emptySubtitle, { color: glass.textMuted }]}>
              Chạm vào giọt kính bên dưới để bắt đầu ghi lại ý tưởng.
            </Text>
          </View>
        </GlassCard>
      </View>
    );
  }

  return (
    <FlashList
      key={viewMode}
      data={notes}
      numColumns={isGrid ? 2 : 1}
      estimatedItemSize={isGrid ? 132 : 104}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{
        paddingTop: 8,
        paddingBottom: bottomPadding,
      }}
    />
  );
}

const styles = StyleSheet.create({
  emptyWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 80,
  },
  emptyCard: {
    width: '100%',
    maxWidth: 320,
  },
  emptyInner: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
  },
});
