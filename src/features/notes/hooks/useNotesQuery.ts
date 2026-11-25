import { useCallback, useMemo } from 'react';
import Fuse from 'fuse.js';
import { useNoteStore } from '@/features/notes/store/noteStore';
import type { BacklinkMatch, NoteEntity } from '@/features/notes/types/note.types';

export function useNotesQuery() {
  const notes = useNoteStore((s) => s.notes);
  const activeTag = useNoteStore((s) => s.activeTag);
  const searchQuery = useNoteStore((s) => s.searchQuery);
  const viewMode = useNoteStore((s) => s.viewMode);
  const isLoading = useNoteStore((s) => s.isLoading);

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const note of notes) {
      for (const tag of note.tags) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }, [notes]);

  const filteredNotes = useMemo<NoteEntity[]>(() => {
    if (!activeTag) return notes;
    return notes.filter((note) => note.tags.includes(activeTag));
  }, [notes, activeTag]);

  const fuseIndex = useMemo(
    () =>
      new Fuse(notes, {
        keys: [
          { name: 'title', weight: 0.7 },
          { name: 'plainText', weight: 0.2 },
          { name: 'tags', weight: 0.1 },
        ],
        threshold: 0.38,
        includeScore: true,
      }),
    [notes],
  );

  const searchBacklinkCandidates = useCallback(
    (query: string, excludeNoteId?: string): BacklinkMatch[] => {
      const cleaned = query.trim();
      if (!cleaned) {
        return notes
          .filter((n) => n.id !== excludeNoteId && n.title.length > 0)
          .slice(0, 6)
          .map((n) => ({
            noteId: n.id,
            title: n.title,
            excerpt: n.excerpt,
            score: 0,
          }));
      }
      return fuseIndex
        .search(cleaned)
        .filter((res) => res.item.id !== excludeNoteId)
        .slice(0, 6)
        .map((res) => ({
          noteId: res.item.id,
          title: res.item.title || 'Không tiêu đề',
          excerpt: res.item.excerpt,
          score: res.score ?? 1,
        }));
    },
    [fuseIndex, notes],
  );

  return {
    notes: filteredNotes,
    allNotesCount: notes.length,
    allTags,
    activeTag,
    searchQuery,
    viewMode,
    isLoading,
    searchBacklinkCandidates,
  };
}
