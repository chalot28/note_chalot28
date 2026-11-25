import type { CellFormat } from '@/features/spreadsheets/types/sheet.types';

export function columnIndexToLabel(colIndex: number): string {
  let index = colIndex;
  let label = '';
  while (index >= 0) {
    label = String.fromCharCode(65 + (index % 26)) + label;
    index = Math.floor(index / 26) - 1;
  }
  return label;
}

export function coordToA1(row: number, col: number): string {
  return `${columnIndexToLabel(col)}${row + 1}`;
}

export function coordKey(row: number, col: number): string {
  return `${row}:${col}`;
}

export function formatCellValue(
  value: string | number | boolean | null | undefined,
  format: CellFormat = 'general',
): string {
  if (value === null || value === undefined || value === '') {
    return format === 'checkbox' ? '☐' : '';
  }

  if (typeof value === 'string' && value.startsWith('#')) {
    return value;
  }

  if (format === 'checkbox') {
    const truthy =
      value === true ||
      value === 1 ||
      (typeof value === 'string' && ['true', '1', 'yes', '☑'].includes(value.toLowerCase()));
    return truthy ? '☑' : '☐';
  }

  const numeric = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(numeric) || typeof value === 'boolean') {
    return String(value);
  }

  if (format === 'vnd') {
    return `${new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(numeric)} ₫`;
  }

  if (format === 'usd') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 2,
    }).format(numeric);
  }

  if (format === 'percent') {
    return `${(numeric * 100).toFixed(1).replace(/\.0$/, '')}%`;
  }

  if (Number.isInteger(numeric)) {
    return String(numeric);
  }
  return String(Math.round(numeric * 10000) / 10000);
}
