import { DetailedCellError, HyperFormula, type RawCellContent } from 'hyperformula';
import type { SheetRawMatrix } from '@/features/spreadsheets/types/sheet.types';

export type ComputedCellValue = string | number | boolean | null;

function parseRawInput(raw: string): RawCellContent {
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  if (trimmed.startsWith('=')) return trimmed;
  if (trimmed.toUpperCase() === 'TRUE') return true;
  if (trimmed.toUpperCase() === 'FALSE') return false;
  const num = Number(trimmed);
  if (!Number.isNaN(num) && /^-?\d+(\.\d+)?$/.test(trimmed)) {
    return num;
  }
  return raw;
}

function normalizeMatrix(rawData: SheetRawMatrix, rows: number, cols: number): RawCellContent[][] {
  const matrix: RawCellContent[][] = [];
  for (let r = 0; r < rows; r += 1) {
    const rowArr: RawCellContent[] = [];
    const srcRow = rawData[r] ?? [];
    for (let c = 0; c < cols; c += 1) {
      rowArr.push(parseRawInput(srcRow[c] ?? ''));
    }
    matrix.push(rowArr);
  }
  return matrix;
}

export class SpreadsheetEngine {
  private hf: HyperFormula;
  private rows: number;
  private cols: number;

  constructor(rawData: SheetRawMatrix, rows: number, cols: number) {
    this.rows = Math.max(1, rows);
    this.cols = Math.max(1, cols);
    const initial = normalizeMatrix(rawData, this.rows, this.cols);
    this.hf = HyperFormula.buildFromArray(initial, { licenseKey: 'gpl-v3' });
  }

  setCell(row: number, col: number, raw: string): void {
    this.hf.setCellContents({ sheet: 0, row, col }, [[parseRawInput(raw)]]);
  }

  getComputedValue(row: number, col: number): ComputedCellValue {
    const val = this.hf.getCellValue({ sheet: 0, row, col });
    if (val instanceof DetailedCellError) {
      return val.value || '#ERR';
    }
    if (val === null || val === undefined) return null;
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
      return val;
    }
    return String(val);
  }

  getComputedMatrix(rows = this.rows, cols = this.cols): ComputedCellValue[][] {
    const result: ComputedCellValue[][] = [];
    for (let r = 0; r < rows; r += 1) {
      const rowValues: ComputedCellValue[] = [];
      for (let c = 0; c < cols; c += 1) {
        rowValues.push(this.getComputedValue(r, c));
      }
      result.push(rowValues);
    }
    return result;
  }

  addRow(): number {
    this.hf.addRows(0, [this.rows, 1]);
    this.rows += 1;
    return this.rows;
  }

  addColumn(): number {
    this.hf.addColumns(0, [this.cols, 1]);
    this.cols += 1;
    return this.cols;
  }

  destroy(): void {
    this.hf.destroy();
  }
}
