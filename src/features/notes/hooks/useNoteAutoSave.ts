import { useCallback, useEffect, useRef, useState } from 'react';
import { useNoteStore } from '@/features/notes/store/noteStore';
import type { NoteDraft } from '@/features/notes/types/note.types';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved';

export function useNoteAutoSave(debounceMs = 300) {
  const upsertNote = useNoteStore((s) => s.upsertNote);
  const [saveStatus, setSaveStatus] = useState<AutoSaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingDraftRef = useRef<NoteDraft | null>(null);

  const persistDraft = useCallback(
    async (draft: NoteDraft) => {
      setSaveStatus('saving');
      try {
        await upsertNote(draft);
        setSaveStatus('saved');
      } catch {
        setSaveStatus('idle');
      }
    },
    [upsertNote],
  );

  const scheduleSave = useCallback(
    (draft: NoteDraft) => {
      pendingDraftRef.current = draft;
      setSaveStatus('saving');
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        const latest = pendingDraftRef.current;
        pendingDraftRef.current = null;
        timerRef.current = null;
        if (latest) {
          void persistDraft(latest);
        }
      }, debounceMs);
    },
    [debounceMs, persistDraft],
  );

  const flushNow = useCallback(async () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    const pending = pendingDraftRef.current;
    pendingDraftRef.current = null;
    if (pending) {
      await persistDraft(pending);
    }
  }, [persistDraft]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      const pending = pendingDraftRef.current;
      pendingDraftRef.current = null;
      if (pending) {
        void upsertNote(pending);
      }
    };
  }, [upsertNote]);

  return { saveStatus, scheduleSave, flushNow };
}
