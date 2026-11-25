import { desc, eq, isNull } from 'drizzle-orm';
import { db } from '@/core/db/client';
import { spreadsheets } from '@/core/db/schema';
import type {
  SheetMetaMap,
  SheetRawMatrix,
  SpreadsheetEntity,
} from '@/features/spreadsheets/types/sheet.types';
import { createId } from '@/shared/utils/id.utils';

function createEmptyMatrix(rows: number, cols: number): SheetRawMatrix {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ''));
}

function safeParseJson<T>(raw: string, fallback: T): T {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function mapRow(row: typeof spreadsheets.$inferSelect): SpreadsheetEntity {
  const rawData = safeParseJson<SheetRawMatrix>(row.dataJson, []);
  const cellMetas = safeParseJson<SheetMetaMap>(row.columnMetaJson, {});
  return {
    id: row.id,
    title: row.title,
    noteId: row.noteId ?? null,
    rawData,
    cellMetas,
    rowCount: row.rowCount,
    colCount: row.colCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const sheetRepository = {
  async getAllStandalone(): Promise<SpreadsheetEntity[]> {
    const rows = await db
      .select()
      .from(spreadsheets)
      .where(isNull(spreadsheets.noteId))
      .orderBy(desc(spreadsheets.updatedAt));
    return rows.map(mapRow);
  },

  async getByNoteId(noteId: string): Promise<SpreadsheetEntity[]> {
    const rows = await db
      .select()
      .from(spreadsheets)
      .where(eq(spreadsheets.noteId, noteId))
      .orderBy(desc(spreadsheets.createdAt));
    return rows.map(mapRow);
  },

  async getById(id: string): Promise<SpreadsheetEntity | null> {
    const rows = await db.select().from(spreadsheets).where(eq(spreadsheets.id, id)).limit(1);
    const first = rows[0];
    return first ? mapRow(first) : null;
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

    await db.insert(spreadsheets).values({
      id: entity.id,
      title: entity.title,
      noteId: entity.noteId,
      dataJson: JSON.stringify(entity.rawData),
      columnMetaJson: JSON.stringify(entity.cellMetas),
      rowCount: entity.rowCount,
      colCount: entity.colCount,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    });
    return entity;
  },

  async save(entity: SpreadsheetEntity): Promise<void> {
    await db
      .update(spreadsheets)
      .set({
        title: entity.title,
        dataJson: JSON.stringify(entity.rawData),
        columnMetaJson: JSON.stringify(entity.cellMetas),
        rowCount: entity.rowCount,
        colCount: entity.colCount,
        updatedAt: Date.now(),
      })
      .where(eq(spreadsheets.id, entity.id));
  },

  async remove(id: string): Promise<void> {
    await db.delete(spreadsheets).where(eq(spreadsheets.id, id));
  },
};
