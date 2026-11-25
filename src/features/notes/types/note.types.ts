export type NoteViewMode = 'list' | 'grid';

export type SlashCommandType =
  | 'heading1'
  | 'heading2'
  | 'checklist'
  | 'quote'
  | 'code'
  | 'divider'
  | 'sheet'
  | 'ai';

export interface NoteContentPayload {
  html: string;
  embeddedSheetIds: string[];
}

export interface NoteEntity {
  id: string;
  title: string;
  html: string;
  plainText: string;
  excerpt: string;
  tags: string[];
  backlinks: string[];
  embeddedSheetIds: string[];
  isPinned: boolean;
  isArchived: boolean;
  linkedDate: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface NoteDraft {
  id: string;
  title: string;
  html: string;
  embeddedSheetIds?: string[];
  isPinned?: boolean;
  isArchived?: boolean;
  linkedDate?: string | null;
}

export interface BacklinkMatch {
  noteId: string;
  title: string;
  excerpt: string;
  score: number;
}
