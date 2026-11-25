import React, { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import type { EditorBridge } from '@10play/tentap-editor';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ArrowLeft, Pin, Trash2 } from 'lucide-react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { NoteEditorAccessoryBar } from '@/features/notes/components/NoteEditorAccessoryBar';
import { SlashCommandSheet } from '@/features/notes/components/SlashCommandSheet';
import { TenTapEditorWrapper } from '@/features/notes/components/TenTapEditorWrapper';
import { useNoteEditorActions } from '@/features/notes/hooks/useNoteEditorActions';
import { useNotesQuery } from '@/features/notes/hooks/useNotesQuery';
import { useNoteStore } from '@/features/notes/store/noteStore';
import { GlassConfirmModal } from '@/shared/components/glass/GlassConfirmModal';
import { MinimalScreen } from '@/shared/components/layout/MinimalScreen';
import { ZenHeader } from '@/shared/components/layout/ZenHeader';

export default function NoteDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const noteId = id ?? '';
  const router = useRouter();
  const glass = useGlassStyle();

  const slashRef = useRef<BottomSheetModal>(null);
  const editorRef = useRef<EditorBridge | null>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [backlinkQuery, setBacklinkQuery] = useState<string | null>(null);
  const [editorReady, setEditorReady] = useState<EditorBridge | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const { searchBacklinkCandidates } = useNotesQuery();
  const removeNote = useNoteStore((s) => s.removeNote);
  const actions = useNoteEditorActions(noteId);

  const backlinkMatches = useMemo(
    () => (backlinkQuery === null ? [] : searchBacklinkCandidates(backlinkQuery, noteId)),
    [backlinkQuery, noteId, searchBacklinkCandidates],
  );

  const handleBack = useCallback(() => {
    void actions.flushNow().then(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    });
  }, [actions, router]);

  const handleDelete = useCallback(() => {
    void removeNote(noteId).then(() => {
      if (router.canGoBack()) {
        router.back();
      } else {
        router.replace('/(tabs)');
      }
    });
  }, [noteId, removeNote, router]);

  if (!actions.loaded) {
    return (
      <MinimalScreen style={styles.center}>
        <ActivityIndicator color={glass.accentColor} />
      </MinimalScreen>
    );
  }

  return (
    <MinimalScreen withBottomInset>
      <ZenHeader
        title=""
        subtitle={actions.saveStatus === 'saving' ? 'Đang lưu...' : actions.saveStatus === 'saved' ? 'Đã lưu' : ''}
        isZenActive={isFocused}
        leftAction={
          <Pressable onPress={handleBack} hitSlop={10}>
            <ArrowLeft size={20} color={glass.textPrimary} />
          </Pressable>
        }
        rightAction={
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => {
                const next = !actions.isPinned;
                actions.setIsPinned(next);
                actions.queueDraft(actions.title, actions.html, actions.embeddedSheetIds, next);
              }}
              hitSlop={10}
              accessibilityLabel="Ghim ghi chú"
            >
              <Pin size={18} color={actions.isPinned ? glass.accentColor : glass.textMuted} />
            </Pressable>
            <Pressable
              onPress={() => setConfirmDelete(true)}
              hitSlop={10}
              accessibilityLabel="Xóa ghi chú"
            >
              <Trash2 size={18} color="#EF4444" />
            </Pressable>
          </View>
        }
      />
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <TextInput
            value={actions.title}
            onChangeText={(nextTitle) => {
              actions.setTitle(nextTitle);
              actions.queueDraft(nextTitle, actions.html, actions.embeddedSheetIds, actions.isPinned);
            }}
            placeholder="Tiêu đề ghi chú..."
            placeholderTextColor={glass.textMuted}
            style={[styles.titleInput, { color: glass.textPrimary, fontFamily: glass.fontRegular }]}
          />
          <View style={styles.editorWrap}>
            <TenTapEditorWrapper
              initialHtml={actions.html}
              onHtmlChange={(nextHtml) => {
                actions.setHtml(nextHtml);
                actions.queueDraft(actions.title, nextHtml, actions.embeddedSheetIds, actions.isPinned);
              }}
              onFocusChange={setIsFocused}
              onTriggerSlash={() => slashRef.current?.present()}
              onBacklinkQuery={setBacklinkQuery}
              onEditorReady={(ed) => {
                editorRef.current = ed;
                setEditorReady(ed);
              }}
            />
          </View>
        </ScrollView>
        <NoteEditorAccessoryBar
          editor={editorReady}
          backlinkMatches={backlinkMatches}
          showBacklinks={backlinkQuery !== null}
          onSelectBacklink={(match) => {
            editorRef.current?.insertContent(`[[${match.title}]] `);
            setBacklinkQuery(null);
          }}
        />
      </KeyboardAvoidingView>
      <SlashCommandSheet
        ref={slashRef}
        onSelectCommand={(cmd) => {
          slashRef.current?.dismiss();
          actions.applySlashCommand(cmd, editorRef.current);
        }}
      />
      <GlassConfirmModal
        visible={confirmDelete}
        title="Xóa ghi chú này?"
        message={actions.title ? `"${actions.title}" sẽ bị xóa.` : undefined}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          setConfirmDelete(false);
          handleDelete();
        }}
      />
    </MinimalScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  scrollContent: { flexGrow: 1, paddingBottom: 16 },
  center: { alignItems: 'center', justifyContent: 'center' },
  titleInput: { fontSize: 24, fontWeight: '700', paddingVertical: 6, marginBottom: 4 },
  editorWrap: { flex: 1, minHeight: 180 },
});
