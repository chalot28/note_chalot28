import React, { useCallback } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { Maximize2, Table2, Trash2 } from 'lucide-react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { FormulaInputBar } from '@/features/spreadsheets/components/FormulaInputBar';
import { SpreadsheetMatrix } from '@/features/spreadsheets/components/SpreadsheetMatrix';
import { useSpreadsheetState } from '@/features/spreadsheets/hooks/useSpreadsheetState';
import { GlassCard } from '@/shared/components/glass/GlassCard';
import { useHaptics } from '@/shared/hooks/useHaptics';

interface EmbeddedNoteSheetProps {
  sheetId: string;
  onExpand?: (sheetId: string) => void;
  onRemove?: (sheetId: string) => void;
}

export function EmbeddedNoteSheet({ sheetId, onExpand, onRemove }: EmbeddedNoteSheetProps) {
  const glass = useGlassStyle();
  const haptics = useHaptics();
  const {
    sheet,
    selected,
    selectedRaw,
    selectedFormat,
    displayMatrix,
    isLoading,
    selectCell,
    updateCell,
    setCellFormat,
    addRow,
    addColumn,
  } = useSpreadsheetState(sheetId);

  const handleToggleCheckbox = useCallback(
    (row: number, col: number) => {
      const current = sheet?.rawData[row]?.[col] ?? '';
      const next = current.toUpperCase() === 'TRUE' || current === '1' ? 'FALSE' : 'TRUE';
      updateCell(row, col, next);
    },
    [sheet?.rawData, updateCell],
  );

  if (isLoading || !sheet) {
    return (
      <GlassCard style={styles.card}>
        <ActivityIndicator size="small" color={glass.accentColor} />
      </GlassCard>
    );
  }

  return (
    <GlassCard style={styles.card} contentStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <Table2 size={15} color={glass.accentColor} />
          <Text numberOfLines={1} style={[styles.title, { color: glass.textPrimary }]}>
            {sheet.title}
          </Text>
        </View>
        <View style={styles.headerActions}>
          {onExpand ? (
            <Pressable
              onPress={() => {
                haptics.light();
                onExpand(sheetId);
              }}
              hitSlop={8}
              style={[styles.expandBtn, { borderColor: glass.borderColor }]}
            >
              <Maximize2 size={13} color={glass.textSecondary} />
              <Text style={[styles.expandText, { color: glass.textSecondary }]}>Mở rộng</Text>
            </Pressable>
          ) : null}
          {onRemove ? (
            <Pressable
              onPress={() => {
                haptics.light();
                onRemove(sheetId);
              }}
              hitSlop={8}
              accessibilityLabel="Xóa bảng nhúng"
              style={[styles.removeBtn, { borderColor: glass.borderColor }]}
            >
              <Trash2 size={13} color="#EF4444" />
            </Pressable>
          ) : null}
        </View>
      </View>

      <FormulaInputBar
        selected={selected}
        rawValue={selectedRaw}
        activeFormat={selectedFormat}
        onChangeRaw={(val) => updateCell(selected.row, selected.col, val)}
        onChangeFormat={(fmt) => setCellFormat(selected.row, selected.col, fmt)}
      />

      <SpreadsheetMatrix
        rowCount={sheet.rowCount}
        colCount={sheet.colCount}
        displayMatrix={displayMatrix}
        rawData={sheet.rawData}
        cellMetas={sheet.cellMetas}
        selected={selected}
        compact
        onSelectCell={(r, c) => selectCell({ row: r, col: c })}
        onChangeCell={updateCell}
        onToggleCheckbox={handleToggleCheckbox}
        onAddRow={addRow}
        onAddColumn={addColumn}
      />
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: 10,
  },
  content: {
    padding: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  titleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  expandBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 0.75,
  },
  removeBtn: {
    padding: 5,
    borderRadius: 999,
    borderWidth: 0.75,
  },
  expandText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
