import { create } from 'zustand';
import { mmkvStorage } from '@/core/storage/mmkv.storage';
import { noteRepository } from '@/features/notes/services/note.repository';
import type { NoteDraft, NoteEntity, NoteViewMode } from '@/features/notes/types/note.types';
import { STORAGE_KEYS } from '@/shared/constants/storage.keys';

interface NoteState {
  notes: NoteEntity[];
  searchQuery: string;
  activeTag: string | null;
  viewMode: NoteViewMode;
  isLoading: boolean;
  loadNotes: () => Promise<void>;
  setSearchQuery: (query: string) => void;
  setActiveTag: (tag: string | null) => void;
  toggleViewMode: () => void;
  upsertNote: (draft: NoteDraft) => Promise<NoteEntity>;
  togglePin: (id: string) => Promise<void>;
  removeNote: (id: string) => Promise<void>;
}

const initialViewMode = (): NoteViewMode => {
  const saved = mmkvStorage.getString(STORAGE_KEYS.NOTES_VIEW_MODE);
  return saved === 'grid' ? 'grid' : 'list';
};

function sortNotes(list: NoteEntity[]): NoteEntity[] {
  return [...list].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });
}

export const useNoteStore = create<NoteState>((set, get) => ({
  notes: [],
  searchQuery: '',
  activeTag: null,
  viewMode: initialViewMode(),
  isLoading: false,

  loadNotes: async () => {
    set({ isLoading: true });
    try {
      const { searchQuery } = get();
      const rows = searchQuery.trim()
        ? await noteRepository.searchFts(searchQuery)
        : await noteRepository.getAll();
      set({ notes: rows, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  setSearchQuery: (searchQuery) => {
    set({ searchQuery });
    void get().loadNotes();
  },

  setActiveTag: (activeTag) => {
    set((state) => ({ activeTag: state.activeTag === activeTag ? null : activeTag }));
  },

  toggleViewMode: () => {
    const next: NoteViewMode = get().viewMode === 'list' ? 'grid' : 'list';
    mmkvStorage.setString(STORAGE_KEYS.NOTES_VIEW_MODE, next);
    set({ viewMode: next });
  },

  upsertNote: async (draft) => {
    const saved = await noteRepository.upsert(draft);
    set((state) => {
      const exists = state.notes.some((item) => item.id === saved.id);
      const updated = exists
        ? state.notes.map((item) => (item.id === saved.id ? saved : item))
        : [saved, ...state.notes];
      return { notes: sortNotes(updated) };
    });
    return saved;
  },

  togglePin: async (id) => {
    const previous = get().notes;
    set({
      notes: sortNotes(
        previous.map((item) => (item.id === id ? { ...item, isPinned: !item.isPinned } : item)),
      ),
    });
    try {
      await noteRepository.togglePin(id);
    } catch {
      set({ notes: previous });
    }
  },

  removeNote: async (id) => {
    const previous = get().notes;
    set({ notes: previous.filter((item) => item.id !== id) });
    try {
      await noteRepository.remove(id);
    } catch {
      set({ notes: previous });
    }
  },
}));
