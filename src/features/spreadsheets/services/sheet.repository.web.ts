import type { SheetRawMatrix, SpreadsheetEntity } from '@/features/spreadsheets/types/sheet.types';
import { createId } from '@/shared/utils/id.utils';

const KEY = 'liquid_web_sheets_v1';

function createEmptyMatrix(rows: number, cols: number): SheetRawMatrix {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));
}

function readAll(): SpreadsheetEntity[] {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null;
    return raw ? (JSON.parse(raw) as SpreadsheetEntity[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: SpreadsheetEntity[]): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export const sheetRepository = {
  async getAllStandalone(): Promise<SpreadsheetEntity[]> {
    return readAll()
      .filter((s) => s.noteId === null)
      .sort((a, b) => b.updatedAt - a.updatedAt);
  },

  async getByNoteId(noteId: string): Promise<SpreadsheetEntity[]> {
    return readAll()
      .filter((s) => s.noteId === noteId)
      .sort((a, b) => b.createdAt - a.createdAt);
  },

  async getById(id: string): Promise<SpreadsheetEntity | null> {
    return readAll().find((s) => s.id === id) ?? null;
  },

  async create(options?: {
    title?: string;
    noteId?: string | null;
    rows?: number;
    cols?: number;
  }): Promise<SpreadsheetEntity> {
    const now = Date.now();
    const rowCount = options?.rows ?? (options?.noteId ? 6 : 16);
    const colCount = options?.cols ?? (options?.noteId ? 4 : 6);
    const entity: SpreadsheetEntity = {
      id: createId('sheet'),
      title: options?.title ?? (options?.noteId ? 'Bảng nhúng' : 'Bảng tính mới'),
      noteId: options?.noteId ?? null,
      rawData: createEmptyMatrix(rowCount, colCount),
      cellMetas: {},
      rowCount,
      colCount,
      createdAt: now,
      updatedAt: now,
    };
    writeAll([entity, ...readAll()]);
    return entity;
  },

  async save(entity: SpreadsheetEntity): Promise<void> {
    const all = readAll();
    const next = all.map((s) => (s.id === entity.id ? { ...entity, updatedAt: Date.now() } : s));
    writeAll(next);
  },

  async remove(id: string): Promise<void> {
    writeAll(readAll().filter((s) => s.id !== id));
  },
};
