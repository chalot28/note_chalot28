import { useCallback, useEffect, useRef, useState } from 'react';
import { coordKey, formatCellValue } from '@/features/spreadsheets/services/cell.formatter';
import { SpreadsheetEngine } from '@/features/spreadsheets/services/hyperformula.engine';
import { sheetRepository } from '@/features/spreadsheets/services/sheet.repository';
import type {
  CellFormat,
  SheetCoord,
  SheetRawMatrix,
  SpreadsheetEntity,
} from '@/features/spreadsheets/types/sheet.types';

function cloneAndEnsureCell(matrix: SheetRawMatrix, row: number, col: number, value: string): SheetRawMatrix {
  const next = matrix.map((r) => [...r]);
  while (next.length <= row) {
    next.push([]);
  }
  const targetRow = next[row] ?? [];
  while (targetRow.length <= col) {
    targetRow.push('');
  }
  targetRow[col] = value;
  next[row] = targetRow;
  return next;
}

export function useSpreadsheetState(sheetId: string) {
  const [sheet, setSheet] = useState<SpreadsheetEntity | null>(null);
  const [selected, setSelected] = useState<SheetCoord>({ row: 0, col: 0 });
  const [displayMatrix, setDisplayMatrix] = useState<string[][]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const engineRef = useRef<SpreadsheetEngine | null>(null);

  const recomputeDisplay = useCallback((entity: SpreadsheetEntity, engine: SpreadsheetEngine) => {
    const computed = engine.getComputedMatrix(entity.rowCount, entity.colCount);
    const formatted = computed.map((rowArr, r) =>
      rowArr.map((val, c) => {
        const format = entity.cellMetas[coordKey(r, c)]?.format ?? 'general';
        return formatCellValue(val, format);
      }),
    );
    setDisplayMatrix(formatted);
  }, []);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    void sheetRepository.getById(sheetId).then((loaded) => {
      if (!active || !loaded) {
        setIsLoading(false);
        return;
      }
      engineRef.current?.destroy();
      const engine = new SpreadsheetEngine(loaded.rawData, loaded.rowCount, loaded.colCount);
      engineRef.current = engine;
      setSheet(loaded);
      recomputeDisplay(loaded, engine);
      setIsLoading(false);
    });
    return () => {
      active = false;
      engineRef.current?.destroy();
      engineRef.current = null;
    };
  }, [recomputeDisplay, sheetId]);

  const updateCell = useCallback(
    (row: number, col: number, raw: string) => {
      const engine = engineRef.current;
      if (!sheet || !engine) return;
      engine.setCell(row, col, raw);
      const nextRawData = cloneAndEnsureCell(sheet.rawData, row, col, raw);
      const updated: SpreadsheetEntity = { ...sheet, rawData: nextRawData, updatedAt: Date.now() };
      setSheet(updated);
      recomputeDisplay(updated, engine);
      void sheetRepository.save(updated);
    },
    [recomputeDisplay, sheet],
  );

  const setCellFormat = useCallback(
    (row: number, col: number, format: CellFormat) => {
      const engine = engineRef.current;
      if (!sheet || !engine) return;
      const key = coordKey(row, col);
      const updated: SpreadsheetEntity = {
        ...sheet,
        cellMetas: { ...sheet.cellMetas, [key]: { ...sheet.cellMetas[key], format } },
        updatedAt: Date.now(),
      };
      setSheet(updated);
      recomputeDisplay(updated, engine);
      void sheetRepository.save(updated);
    },
    [recomputeDisplay, sheet],
  );

  const addRow = useCallback(() => {
    const engine = engineRef.current;
    if (!sheet || !engine) return;
    const nextRowCount = engine.addRow();
    const nextRaw = [...sheet.rawData, Array.from({ length: sheet.colCount }, () => '')];
    const updated: SpreadsheetEntity = { ...sheet, rowCount: nextRowCount, rawData: nextRaw };
    setSheet(updated);
    recomputeDisplay(updated, engine);
    void sheetRepository.save(updated);
  }, [recomputeDisplay, sheet]);

  const addColumn = useCallback(() => {
    const engine = engineRef.current;
    if (!sheet || !engine) return;
    const nextColCount = engine.addColumn();
    const nextRaw = sheet.rawData.map((r) => [...r, '']);
    const updated: SpreadsheetEntity = { ...sheet, colCount: nextColCount, rawData: nextRaw };
    setSheet(updated);
    recomputeDisplay(updated, engine);
    void sheetRepository.save(updated);
  }, [recomputeDisplay, sheet]);

  const selectedRaw = sheet?.rawData[selected.row]?.[selected.col] ?? '';
  const selectedFormat = sheet?.cellMetas[coordKey(selected.row, selected.col)]?.format ?? 'general';

  return {
    sheet,
    selected,
    selectedRaw,
    selectedFormat,
    displayMatrix,
    isLoading,
    selectCell: setSelected,
    updateCell,
    setCellFormat,
    addRow,
    addColumn,
  };
}
