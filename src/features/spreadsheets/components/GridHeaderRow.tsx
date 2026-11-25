import React, { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { columnIndexToLabel } from '@/features/spreadsheets/services/cell.formatter';

interface GridHeaderRowProps {
  colCount: number;
  selectedCol: number;
  cellWidth: number;
  rowHeaderWidth: number;
}

export const GridHeaderRow = memo(function GridHeaderRow({
  colCount,
  selectedCol,
  cellWidth,
  rowHeaderWidth,
}: GridHeaderRowProps) {
  const glass = useGlassStyle();

  return (
    <View style={styles.row}>
      <View
        style={[
          styles.corner,
          {
            width: rowHeaderWidth,
            borderColor: glass.borderColor,
            backgroundColor: glass.surfaceElevatedColor,
          },
        ]}
      />
      {Array.from({ length: colCount }, (_, colIndex) => {
        const isSelected = colIndex === selectedCol;
        return (
          <View
            key={colIndex}
            style={[
              styles.colHeader,
              {
                width: cellWidth,
                borderColor: glass.borderColor,
                backgroundColor: isSelected ? `${glass.accentColor}24` : glass.surfaceElevatedColor,
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: isSelected ? glass.accentColor : glass.textSecondary },
              ]}
            >
              {columnIndexToLabel(colIndex)}
            </Text>
          </View>
        );
      })}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
  },
  corner: {
    height: 26,
    borderWidth: 0.5,
  },
  colHeader: {
    height: 26,
    borderWidth: 0.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
  },
});
