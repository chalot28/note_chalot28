import React, { useCallback, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { LayoutGrid, List, Pin, Trash2 } from 'lucide-react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { NoteListView } from '@/features/notes/components/NoteListView';
import { useNotesQuery } from '@/features/notes/hooks/useNotesQuery';
import { useNoteStore } from '@/features/notes/store/noteStore';
import type { NoteEntity } from '@/features/notes/types/note.types';
import { StealthHeaderTrigger } from '@/features/vault/components/StealthHeaderTrigger';
import { useVaultSessionStore } from '@/features/vault/store/vaultSessionStore';
import { GlassBottomSheet } from '@/shared/components/glass/GlassBottomSheet';
import { GlassButton } from '@/shared/components/glass/GlassButton';
import { GlassConfirmModal } from '@/shared/components/glass/GlassConfirmModal';
import { GlassPillBar } from '@/shared/components/glass/GlassPillBar';
import { FloatingActionOrb } from '@/shared/components/layout/FloatingActionOrb';
import { MinimalScreen } from '@/shared/components/layout/MinimalScreen';
import { createId } from '@/shared/utils/id.utils';

export default function NotesHomeScreen() {
  const router = useRouter();
  const glass = useGlassStyle();
  const sheetRef = useRef<BottomSheetModal>(null);
  const [selectedNote, setSelectedNote] = useState<NoteEntity | null>(null);
  const [confirmDeleteNote, setConfirmDeleteNote] = useState<NoteEntity | null>(null);

  const loadNotes = useNoteStore((s) => s.loadNotes);
  const setSearchQuery = useNoteStore((s) => s.setSearchQuery);
  const setActiveTag = useNoteStore((s) => s.setActiveTag);
  const toggleViewMode = useNoteStore((s) => s.toggleViewMode);
  const togglePin = useNoteStore((s) => s.togglePin);
  const removeNote = useNoteStore((s) => s.removeNote);
  const isVaultUnlocked = useVaultSessionStore((s) => s.isVaultUnlocked);
  const { notes, allTags, activeTag, searchQuery, viewMode } = useNotesQuery();

  useFocusEffect(
    useCallback(() => {
      void loadNotes();
    }, [loadNotes]),
  );

  const handleTriggerStealth = () => {
    if (isVaultUnlocked) {
      router.push('/(vault)');
    } else {
      router.push({ pathname: '/(auth)/lock', params: { mode: 'stealth_vault' } });
    }
  };

  return (
    <MinimalScreen>
      <View style={styles.topBar}>
        <StealthHeaderTrigger onTriggerStealth={handleTriggerStealth}>
          <Text style={[styles.brand, { color: glass.textPrimary }]}>Liquid Notes</Text>
        </StealthHeaderTrigger>
        <Pressable onPress={toggleViewMode} hitSlop={10} style={styles.modeBtn}>
          {viewMode === 'list' ? (
            <LayoutGrid size={20} color={glass.textSecondary} />
          ) : (
            <List size={20} color={glass.textSecondary} />
          )}
        </Pressable>
      </View>

      <GlassPillBar value={searchQuery} onChangeText={setSearchQuery} placeholder="Tìm ghi chú, #tag..." />

      {allTags.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagScroll} contentContainerStyle={styles.tagRow}>
          {allTags.map((tag) => {
            const active = tag === activeTag;
            return (
              <Pressable
                key={tag}
                onPress={() => setActiveTag(tag)}
                style={[
                  styles.tagPill,
                  {
                    backgroundColor: active ? `${glass.accentColor}20` : 'transparent',
                  },
                ]}
              >
                <Text style={[styles.tagText, { color: active ? glass.accentColor : glass.textMuted }]}>
                  #{tag}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}

      <View style={styles.listWrap}>
        <NoteListView
          notes={notes}
          viewMode={viewMode}
          onPressNote={(n) => router.push({ pathname: '/note/[id]', params: { id: n.id } })}
          onLongPressNote={(n) => {
            setSelectedNote(n);
            sheetRef.current?.present();
          }}
          onDeleteNote={(n) => setConfirmDeleteNote(n)}
        />
      </View>

      <FloatingActionOrb
        onPress={() => router.push({ pathname: '/note/[id]', params: { id: createId('note') } })}
        style={styles.orb}
      />

      <GlassBottomSheet ref={sheetRef} title={selectedNote?.title || 'Tùy chọn ghi chú'} snapPoints={['30%']}>
        <View style={styles.sheetActions}>
          <GlassButton
            label={selectedNote?.isPinned ? 'Bỏ ghim ghi chú' : 'Ghim lên đầu'}
            icon={<Pin size={16} color={glass.textPrimary} />}
            onPress={() => {
              if (selectedNote) void togglePin(selectedNote.id);
              sheetRef.current?.dismiss();
            }}
          />
          <GlassButton
            label="Xóa ghi chú"
            variant="danger"
            icon={<Trash2 size={16} color="#EF4444" />}
            onPress={() => {
              if (selectedNote) void removeNote(selectedNote.id);
              sheetRef.current?.dismiss();
            }}
          />
        </View>
      </GlassBottomSheet>

      <GlassConfirmModal
        visible={confirmDeleteNote !== null}
        title="Xóa ghi chú?"
        message={confirmDeleteNote ? `"${confirmDeleteNote.title || 'Ghi chú không tiêu đề'}" sẽ bị xóa.` : undefined}
        onCancel={() => setConfirmDeleteNote(null)}
        onConfirm={() => {
          const target = confirmDeleteNote;
          setConfirmDeleteNote(null);
          if (target) void removeNote(target.id);
        }}
      />
    </MinimalScreen>
  );
}

const styles = StyleSheet.create({
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  brand: { fontSize: 24, fontWeight: '700', letterSpacing: -0.4 },
  modeBtn: { padding: 6 },
  tagScroll: { maxHeight: 38, marginTop: 10 },
  tagRow: { gap: 8, alignItems: 'center' },
  tagPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  tagText: { fontSize: 12, fontWeight: '600' },
  listWrap: { flex: 1, marginTop: 8 },
  orb: { position: 'absolute', right: 20, bottom: 96 },
  sheetActions: { gap: 10 },
});
