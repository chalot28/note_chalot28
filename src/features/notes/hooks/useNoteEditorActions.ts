import { useCallback, useEffect, useState } from 'react';
import type { EditorBridge } from '@10play/tentap-editor';
import { useNoteAutoSave } from '@/features/notes/hooks/useNoteAutoSave';
import { extractHashtags } from '@/features/notes/services/autoTag.service';
import { stripHtmlToPlainText } from '@/features/notes/services/backlink.parser';
import { noteRepository } from '@/features/notes/services/note.repository';
import type { SlashCommandType } from '@/features/notes/types/note.types';

export function useNoteEditorActions(noteId: string) {
  const [loaded, setLoaded] = useState(false);
  const [title, setTitle] = useState('');
  const [html, setHtml] = useState('<p></p>');
  const [embeddedSheetIds, setEmbeddedSheetIds] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const { saveStatus, scheduleSave, flushNow } = useNoteAutoSave(300);

  useEffect(() => {
    let active = true;
    void noteRepository.getById(noteId).then((note) => {
      if (!active) return;
      if (note) {
        setTitle(note.title);
        setHtml(note.html || '<p></p>');
        setEmbeddedSheetIds(note.embeddedSheetIds);
        setIsPinned(note.isPinned);
      }
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [noteId]);

  const queueDraft = useCallback(
    (nextTitle: string, nextHtml: string, nextSheets: string[], nextPinned: boolean) => {
      scheduleSave({
        id: noteId,
        title: nextTitle,
        html: nextHtml,
        embeddedSheetIds: nextSheets,
        isPinned: nextPinned,
      });
    },
    [noteId, scheduleSave],
  );

  const applySlashCommand = useCallback(
    (command: SlashCommandType, editor: EditorBridge | null) => {
      if (!editor) return;
      if (command === 'heading1') editor.toggleHeading(1);
      else if (command === 'heading2') editor.toggleHeading(2);
      else if (command === 'checklist') editor.toggleTaskList();
      else if (command === 'quote') editor.toggleBlockquote();
      else if (command === 'code') editor.toggleCode();
      else if (command === 'divider') editor.insertContent('<hr/>');
    },
    [],
  );

  const plainText = stripHtmlToPlainText(html);
  const existingTags = extractHashtags(`${title} ${plainText}`);

  return {
    loaded,
    title,
    setTitle,
    html,
    setHtml,
    embeddedSheetIds,
    isPinned,
    setIsPinned,
    plainText,
    existingTags,
    saveStatus,
    queueDraft,
    flushNow,
    applySlashCommand,
  };
}
