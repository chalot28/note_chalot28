import type { notes } from '@/core/db/schema';
import type { NoteContentPayload, NoteEntity } from '@/features/notes/types/note.types';

export function parseNotePayload(rawJson: string): NoteContentPayload {
  try {
    const parsed = JSON.parse(rawJson) as Partial<NoteContentPayload>;
    return {
      html: typeof parsed.html === 'string' ? parsed.html : '',
      embeddedSheetIds: Array.isArray(parsed.embeddedSheetIds)
        ? parsed.embeddedSheetIds.filter((v): v is string => typeof v === 'string')
        : [],
    };
  } catch {
    return { html: rawJson, embeddedSheetIds: [] };
  }
}

export function parseStringArray(raw: string): string[] {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

export function mapDrizzleNoteRow(row: typeof notes.$inferSelect): NoteEntity {
  const payload = parseNotePayload(row.contentJson);
  return {
    id: row.id,
    title: row.title,
    html: payload.html,
    plainText: row.plainText,
    excerpt: row.excerpt,
    tags: parseStringArray(row.tagsJson),
    backlinks: parseStringArray(row.backlinksJson),
    embeddedSheetIds: payload.embeddedSheetIds,
    isPinned: row.isPinned,
    isArchived: row.isArchived,
    linkedDate: row.linkedDate ?? null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export function mapRawFtsNoteRow(r: Record<string, unknown>): NoteEntity {
  const payload = parseNotePayload(String(r.content_json ?? '{}'));
  return {
    id: String(r.id),
    title: String(r.title ?? ''),
    html: payload.html,
    plainText: String(r.plain_text ?? ''),
    excerpt: String(r.excerpt ?? ''),
    tags: parseStringArray(String(r.tags_json ?? '[]')),
    backlinks: parseStringArray(String(r.backlinks_json ?? '[]')),
    embeddedSheetIds: payload.embeddedSheetIds,
    isPinned: Boolean(r.is_pinned),
    isArchived: Boolean(r.is_archived),
    linkedDate: typeof r.linked_date === 'string' ? r.linked_date : null,
    createdAt: Number(r.created_at ?? Date.now()),
    updatedAt: Number(r.updated_at ?? Date.now()),
  };
}
