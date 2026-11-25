import React from 'react';
import { StyleSheet, View } from 'react-native';
import type { EditorBridge } from '@10play/tentap-editor';
import { BacklinkSuggestBar } from '@/features/notes/components/BacklinkSuggestBar';
import { CompactFormatBar } from '@/features/notes/components/CompactFormatBar';
import type { BacklinkMatch } from '@/features/notes/types/note.types';

interface NoteEditorAccessoryBarProps {
  editor: EditorBridge | null;
  backlinkMatches: readonly BacklinkMatch[];
  showBacklinks: boolean;
  onSelectBacklink: (match: BacklinkMatch) => void;
}

export function NoteEditorAccessoryBar({
  editor,
  backlinkMatches,
  showBacklinks,
  onSelectBacklink,
}: NoteEditorAccessoryBarProps) {
  return (
    <View style={styles.stack}>
      {showBacklinks ? (
        <BacklinkSuggestBar matches={backlinkMatches} onSelect={onSelectBacklink} />
      ) : null}

      {editor ? <CompactFormatBar editor={editor} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: { paddingBottom: 8 },
});
