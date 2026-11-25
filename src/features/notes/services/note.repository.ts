import { desc, eq } from 'drizzle-orm';
import { db } from '@/core/db/client';
import { notes } from '@/core/db/schema';
import { extractHashtags } from '@/features/notes/services/autoTag.service';
import {
  buildExcerpt,
  extractBacklinks,
  stripHtmlToPlainText,
} from '@/features/notes/services/backlink.parser';
import { encryptNoteFields, tryDecryptNoteFields } from '@/features/notes/services/note.crypto';
import { mapDrizzleNoteRow } from '@/features/notes/services/note.mapper';
import type { NoteDraft, NoteEntity } from '@/features/notes/types/note.types';

async function hydrateNoteRow(row: typeof notes.$inferSelect): Promise<NoteEntity> {
  const decrypted = await tryDecryptNoteFields(row.contentJson);
  if (!decrypted) {
    return mapDrizzleNoteRow(row);
  }
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

export const noteRepository = {
  async getAll(includeArchived = false): Promise<NoteEntity[]> {
    const rows = await db
      .select()
      .from(notes)
      .where(includeArchived ? undefined : eq(notes.isArchived, false))
      .orderBy(desc(notes.isPinned), desc(notes.updatedAt));
    return Promise.all(rows.map(hydrateNoteRow));
  },

  async getById(id: string): Promise<NoteEntity | null> {
    const rows = await db.select().from(notes).where(eq(notes.id, id)).limit(1);
    const first = rows[0];
    return first ? hydrateNoteRow(first) : null;
  },

  async searchFts(query: string): Promise<NoteEntity[]> {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAll();
    const all = await this.getAll(false);
    return all.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.plainText.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q)),
    );
  },

  async upsert(draft: NoteDraft): Promise<NoteEntity> {
    const now = Date.now();
    const existing = await this.getById(draft.id);
    const title = draft.title.trim();
    const plainText = stripHtmlToPlainText(draft.html);
    const excerpt = buildExcerpt(plainText);
    const tags = extractHashtags(`${title} ${plainText}`);
    const backlinks = extractBacklinks(plainText);
    const embeddedSheetIds = draft.embeddedSheetIds ?? existing?.embeddedSheetIds ?? [];
    const encryptedContentJson = await encryptNoteFields({
      title,
      html: draft.html,
      plainText,
      excerpt,
      tags,
      backlinks,
      embeddedSheetIds,
    });

    const record = {
      id: draft.id,
      title: '',
      contentJson: encryptedContentJson,
      plainText: '',
      excerpt: '',
      tagsJson: '[]',
      backlinksJson: '[]',
      isPinned: draft.isPinned ?? existing?.isPinned ?? false,
      isArchived: draft.isArchived ?? existing?.isArchived ?? false,
      linkedDate: draft.linkedDate !== undefined ? draft.linkedDate : existing?.linkedDate ?? null,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };

    await db
      .insert(notes)
      .values(record)
      .onConflictDoUpdate({
        target: notes.id,
        set: {
          title: record.title,
          contentJson: record.contentJson,
          plainText: record.plainText,
          excerpt: record.excerpt,
          tagsJson: record.tagsJson,
          backlinksJson: record.backlinksJson,
          isPinned: record.isPinned,
          isArchived: record.isArchived,
          linkedDate: record.linkedDate,
          updatedAt: record.updatedAt,
        },
      });

    return {
      id: record.id,
      title,
      html: draft.html,
      plainText,
      excerpt,
      tags,
      backlinks,
      embeddedSheetIds,
      isPinned: record.isPinned,
      isArchived: record.isArchived,
      linkedDate: record.linkedDate,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  },

  async togglePin(id: string): Promise<boolean> {
    const existing = await this.getById(id);
    if (!existing) return false;
    const nextPinned = !existing.isPinned;
    await db
      .update(notes)
      .set({ isPinned: nextPinned, updatedAt: Date.now() })
      .where(eq(notes.id, id));
    return nextPinned;
  },

  async remove(id: string): Promise<void> {
    await db.delete(notes).where(eq(notes.id, id));
  },
};
