import React, { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { GridCellItem } from '@/features/spreadsheets/components/GridCellItem';
import { GridHeaderRow } from '@/features/spreadsheets/components/GridHeaderRow';
import { coordKey, coordToA1 } from '@/features/spreadsheets/services/cell.formatter';
import type { SheetCoord, SheetMetaMap, SheetRawMatrix } from '@/features/spreadsheets/types/sheet.types';

function isExpectingCellRef(raw: string): boolean {
  const trimmed = raw.trimEnd();
  return trimmed.startsWith('=') && /[=+\-*/(,:\s]$/.test(trimmed);
}

interface SpreadsheetMatrixProps {
  rowCount: number;
  colCount: number;
  displayMatrix: string[][];
  rawData: SheetRawMatrix;
  cellMetas: SheetMetaMap;
  selected: SheetCoord;
  compact?: boolean;
  onSelectCell: (row: number, col: number) => void;
  onChangeCell?: (row: number, col: number, raw: string) => void;
  onToggleCheckbox: (row: number, col: number) => void;
  onAddRow: () => void;
  onAddColumn: () => void;
}

const ROW_HEADER_WIDTH = 32;

export function SpreadsheetMatrix({
  rowCount,
  colCount,
  displayMatrix,
  rawData,
  cellMetas,
  selected,
  compact = false,
  onSelectCell,
  onChangeCell,
  onToggleCheckbox,
  onAddRow,
  onAddColumn,
}: SpreadsheetMatrixProps) {
  const glass = useGlassStyle();
  const [editingCell, setEditingCell] = useState<SheetCoord | null>(null);
  const cellWidth = compact ? 78 : 88;
  const selectedRaw = rawData[selected.row]?.[selected.col] ?? '';
  const formulaPointMode = Boolean(onChangeCell) && isExpectingCellRef(selectedRaw);

  const handleSelect = useCallback(
    (r: number, c: number) => {
      if (formulaPointMode && onChangeCell && (r !== selected.row || c !== selected.col)) {
        const refA1 = coordToA1(r, c);
        onChangeCell(selected.row, selected.col, `${selectedRaw}${refA1}`);
        setEditingCell({ row: selected.row, col: selected.col });
        return;
      }
      onSelectCell(r, c);
    },
    [formulaPointMode, onChangeCell, onSelectCell, selected.col, selected.row, selectedRaw],
  );

  const handleStartEdit = useCallback(
    (r: number, c: number) => {
      if (formulaPointMode && (r !== selected.row || c !== selected.col)) {
        return;
      }
      setEditingCell({ row: r, col: c });
    },
    [formulaPointMode, selected.col, selected.row],
  );

  const handleEndEdit = useCallback((r: number, c: number) => {
    setEditingCell((cur) => (cur?.row === r && cur?.col === c ? null : cur));
  }, []);

  const handleCheckbox = useCallback(
    (r: number, c: number) => onToggleCheckbox(r, c),
    [onToggleCheckbox],
  );

  return (
    <View style={styles.root}>
      <View style={[styles.tableFrame, { borderColor: glass.borderColor }]}>
        <ScrollView horizontal showsHorizontalScrollIndicator={!compact}>
          <View>
            <GridHeaderRow
              colCount={colCount}
              selectedCol={selected.col}
              cellWidth={cellWidth}
              rowHeaderWidth={ROW_HEADER_WIDTH}
            />
            <ScrollView
              style={compact ? styles.compactScroll : undefined}
              showsVerticalScrollIndicator={!compact}
              nestedScrollEnabled
            >
              {Array.from({ length: rowCount }, (_, r) => (
                <View key={r} style={styles.row}>
                  <View
                    style={[
                      styles.rowHeader,
                      {
                        width: ROW_HEADER_WIDTH,
                        borderColor: glass.borderColor,
                        backgroundColor: selected.row === r ? `${glass.accentColor}24` : glass.surfaceElevatedColor,
                      },
                    ]}
                  >
                    <Text style={[styles.rowLabel, { color: selected.row === r ? glass.accentColor : glass.textMuted }]}>
                      {r + 1}
                    </Text>
                  </View>
                  {Array.from({ length: colCount }, (__, c) => (
                    <GridCellItem
                      key={c}
                      row={r}
                      col={c}
                      displayValue={displayMatrix[r]?.[c] ?? ''}
                      rawValue={rawData[r]?.[c] ?? ''}
                      format={cellMetas[coordKey(r, c)]?.format ?? 'general'}
                      isSelected={selected.row === r && selected.col === c}
                      isEditing={editingCell?.row === r && editingCell?.col === c}
                      width={cellWidth}
                      onSelect={handleSelect}
                      onStartEdit={onChangeCell ? handleStartEdit : undefined}
                      onEndEdit={handleEndEdit}
                      onChangeRaw={onChangeCell}
                      onToggleCheckbox={handleCheckbox}
                    />
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </ScrollView>
      </View>

      <View style={styles.actionsRow}>
        <Pressable
          onPress={onAddRow}
          style={[styles.actionChip, { borderColor: glass.borderColor, backgroundColor: glass.surfaceColor }]}
        >
          <Plus size={14} color={glass.accentColor} />
          <Text style={[styles.actionText, { color: glass.textPrimary }]}>Hàng</Text>
        </Pressable>
        <Pressable
          onPress={onAddColumn}
          style={[styles.actionChip, { borderColor: glass.borderColor, backgroundColor: glass.surfaceColor }]}
        >
          <Plus size={14} color={glass.accentColor} />
          <Text style={[styles.actionText, { color: glass.textPrimary }]}>Cột</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  tableFrame: { borderRadius: 12, borderWidth: 0.75, overflow: 'hidden' },
  compactScroll: { maxHeight: 205 },
  row: { flexDirection: 'row' },
  rowHeader: { height: 33, borderWidth: 0.5, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { fontSize: 11, fontWeight: '600' },
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  actionChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, borderWidth: 0.75 },
  actionText: { fontSize: 11.5, fontWeight: '600' },
});
