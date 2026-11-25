export type CellFormat = 'general' | 'vnd' | 'usd' | 'percent' | 'checkbox';

export interface CellMeta {
  format?: CellFormat;
}

export interface SheetCoord {
  row: number;
  col: number;
}

export type SheetRawMatrix = string[][];
export type SheetMetaMap = Record<string, CellMeta>;

export interface SpreadsheetEntity {
  id: string;
  title: string;
  noteId: string | null;
  rawData: SheetRawMatrix;
  cellMetas: SheetMetaMap;
  rowCount: number;
  colCount: number;
  createdAt: number;
  updatedAt: number;
}
