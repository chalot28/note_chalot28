import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, TextInput } from 'react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import type { CellFormat } from '@/features/spreadsheets/types/sheet.types';

interface GridCellItemProps {
  row: number;
  col: number;
  displayValue: string;
  rawValue: string;
  format: CellFormat;
  isSelected: boolean;
  isEditing: boolean;
  width: number;
  onSelect: (row: number, col: number) => void;
  onStartEdit?: (row: number, col: number) => void;
  onEndEdit?: (row: number, col: number) => void;
  onChangeRaw?: (row: number, col: number, raw: string) => void;
  onToggleCheckbox?: (row: number, col: number) => void;
}

export const GridCellItem = memo(function GridCellItem({
  row,
  col,
  displayValue,
  rawValue,
  format,
  isSelected,
  isEditing,
  width,
  onSelect,
  onStartEdit,
  onEndEdit,
  onChangeRaw,
  onToggleCheckbox,
}: GridCellItemProps) {
  const glass = useGlassStyle();
  const isError = displayValue.startsWith('#');
  const isNumericLike = format !== 'general' || /^-?[\d.,]+$/.test(displayValue);

  return (
    <Pressable
      onPress={() => {
        if (format === 'checkbox' && isSelected && onToggleCheckbox) {
          onToggleCheckbox(row, col);
          return;
        }
        onSelect(row, col);
        if (onStartEdit && onChangeRaw && format !== 'checkbox') {
          onStartEdit(row, col);
        }
      }}
      style={[
        styles.cell,
        {
          width,
          borderColor: isSelected ? glass.accentColor : glass.borderColor,
          borderWidth: isSelected ? 1.4 : 0.5,
          backgroundColor: isSelected ? `${glass.accentColor}1C` : glass.surfaceColor,
        },
      ]}
    >
      {isEditing && onChangeRaw ? (
        <TextInput
          value={rawValue}
          onChangeText={(val) => onChangeRaw(row, col, val)}
          onBlur={() => onEndEdit?.(row, col)}
          onSubmitEditing={() => onEndEdit?.(row, col)}
          autoFocus
          style={[
            styles.input,
            {
              color: glass.textPrimary,
              fontFamily: glass.fontRegular,
            },
          ]}
        />
      ) : (
        <Text
          numberOfLines={1}
          style={[
            styles.text,
            {
              color: isError ? '#EF4444' : glass.textPrimary,
              textAlign: format === 'checkbox' ? 'center' : isNumericLike ? 'right' : 'left',
              fontFamily: glass.fontRegular,
            },
          ]}
        >
          {displayValue}
        </Text>
      )}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  cell: {
    height: 33,
    paddingHorizontal: 7,
    justifyContent: 'center',
  },
  text: {
    fontSize: 12.5,
  },
  input: {
    fontSize: 12.5,
    paddingVertical: 0,
    width: '100%',
  },
});
