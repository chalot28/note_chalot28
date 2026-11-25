import { extractHashtags } from '@/features/notes/services/autoTag.service';
import {
  buildExcerpt,
  extractBacklinks,
  stripHtmlToPlainText,
} from '@/features/notes/services/backlink.parser';
import { encryptNoteFields, tryDecryptNoteFields } from '@/features/notes/services/note.crypto';
import type { NoteDraft, NoteEntity } from '@/features/notes/types/note.types';

interface StoredWebNoteRow {
  id: string;
  encryptedJson?: string;
  isPinned: boolean;
  isArchived: boolean;
  linkedDate: string | null;
  createdAt: number;
  updatedAt: number;
  // Legacy unencrypted fields
  title?: string;
  html?: string;
  plainText?: string;
  excerpt?: string;
  tags?: string[];
  backlinks?: string[];
  embeddedSheetIds?: string[];
}

const KEY = 'liquid_web_notes_v1';

function readAllRaw(): StoredWebNoteRow[] {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null;
    return raw ? (JSON.parse(raw) as StoredWebNoteRow[]) : [];
  } catch {
    return [];
  }
}

function writeAllRaw(items: StoredWebNoteRow[]): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

async function hydrateWebRow(row: StoredWebNoteRow): Promise<NoteEntity> {
  if (row.encryptedJson) {
    const decrypted = await tryDecryptNoteFields(row.encryptedJson);
    if (decrypted) {
      return {
        id: row.id,
        title: decrypted.title,
        html: decrypted.html,
        plainText: decrypted.plainText,
        excerpt: decrypted.excerpt,
        tags: decrypted.tags,
        backlinks: decrypted.backlinks,
        embeddedSheetIds: decrypted.embeddedSheetIds,
        isPinned: row.isPinned,
        isArchived: row.isArchived,
        linkedDate: row.linkedDate ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      };
    }
  }
  return {
    id: row.id,
    title: row.title ?? '',
    html: row.html ?? '',
    plainText: row.plainText ?? '',
    excerpt: row.excerpt ?? '',
    tags: row.tags ?? [],
    backlinks: row.backlinks ?? [],
    embeddedSheetIds: row.embeddedSheetIds ?? [],
    isPinned: row.isPinned,
    isArchived: row.isArchived,
    linkedDate: row.linkedDate ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

function sortRows(items: NoteEntity[]): NoteEntity[] {
  return [...items].sort((a, b) => {
    if (a.isPinned !== b.isPinned) return a.isPinned ? -1 : 1;
    return b.updatedAt - a.updatedAt;
  });
}

export const noteRepository = {
  async getAll(includeArchived = false): Promise<NoteEntity[]> {
    const raw = readAllRaw();
    const filtered = includeArchived ? raw : raw.filter((n) => !n.isArchived);
    const hydrated = await Promise.all(filtered.map(hydrateWebRow));
    return sortRows(hydrated);
  },

  async getById(id: string): Promise<NoteEntity | null> {
    const found = readAllRaw().find((n) => n.id === id);
    return found ? hydrateWebRow(found) : null;
  },

  async searchFts(query: string): Promise<NoteEntity[]> {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAll();
    const all = await this.getAll();
    return all.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.plainText.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q)),
    );
  },

  async upsert(draft: NoteDraft): Promise<NoteEntity> {
    const all = readAllRaw();
    const existingRaw = all.find((n) => n.id === draft.id);
    const existing = existingRaw ? await hydrateWebRow(existingRaw) : null;
    const now = Date.now();
    const title = draft.title.trim();
    const plainText = stripHtmlToPlainText(draft.html);
    const excerpt = buildExcerpt(plainText);
    const tags = extractHashtags(`${title} ${plainText}`);
    const backlinks = extractBacklinks(plainText);
    const embeddedSheetIds = draft.embeddedSheetIds ?? existing?.embeddedSheetIds ?? [];
    const encryptedJson = await encryptNoteFields({
      title,
      html: draft.html,
      plainText,
      excerpt,
      tags,
      backlinks,
      embeddedSheetIds,
    });

    const row: StoredWebNoteRow = {
      id: draft.id,
      encryptedJson,
      isPinned: draft.isPinned ?? existing?.isPinned ?? false,
      isArchived: draft.isArchived ?? existing?.isArchived ?? false,
      linkedDate: draft.linkedDate !== undefined ? draft.linkedDate : existing?.linkedDate ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    const next = existingRaw ? all.map((n) => (n.id === row.id ? row : n)) : [row, ...all];
    writeAllRaw(next);

    return {
      id: row.id,
      title,
      html: draft.html,
      plainText,
      excerpt,
      tags,
      backlinks,
      embeddedSheetIds,
      isPinned: row.isPinned,
      isArchived: row.isArchived,
      linkedDate: row.linkedDate,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  },

  async togglePin(id: string): Promise<boolean> {
    const all = readAllRaw();
    let nextPinned = false;
    const next = all.map((n) => {
      if (n.id !== id) return n;
      nextPinned = !n.isPinned;
      return { ...n, isPinned: nextPinned, updatedAt: Date.now() };
    });
    writeAllRaw(next);
    return nextPinned;
  },

  async remove(id: string): Promise<void> {
    writeAllRaw(readAllRaw().filter((n) => n.id !== id));
  },
};
