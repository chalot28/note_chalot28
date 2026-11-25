import React, { forwardRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import {
  CheckSquare,
  Code,
  Heading1,
  Heading2,
  Minus,
  Quote,
} from 'lucide-react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import type { SlashCommandType } from '@/features/notes/types/note.types';
import { GlassBottomSheet } from '@/shared/components/glass/GlassBottomSheet';
import { useHaptics } from '@/shared/hooks/useHaptics';

interface SlashCommandSheetProps {
  onSelectCommand: (command: SlashCommandType) => void;
}

interface SlashOption {
  type: SlashCommandType;
  label: string;
  description: string;
  renderIcon: (color: string) => React.ReactNode;
}

const SLASH_OPTIONS: readonly SlashOption[] = [
  { type: 'heading1', label: 'Tiêu đề lớn (H1)', description: '', renderIcon: (c) => <Heading1 size={18} color={c} /> },
  { type: 'heading2', label: 'Tiêu đề vừa (H2)', description: '', renderIcon: (c) => <Heading2 size={18} color={c} /> },
  { type: 'checklist', label: 'Danh sách việc', description: '', renderIcon: (c) => <CheckSquare size={18} color={c} /> },
  { type: 'quote', label: 'Trích dẫn', description: '', renderIcon: (c) => <Quote size={18} color={c} /> },
  { type: 'code', label: 'Mã nguồn', description: '', renderIcon: (c) => <Code size={18} color={c} /> },
  { type: 'divider', label: 'Đường phân cách', description: '', renderIcon: (c) => <Minus size={18} color={c} /> },
];

export const SlashCommandSheet = forwardRef<BottomSheetModal, SlashCommandSheetProps>(
  function SlashCommandSheet({ onSelectCommand }, ref) {
    const glass = useGlassStyle();
    const haptics = useHaptics();

    return (
      <GlassBottomSheet ref={ref} title="Chèn khối nội dung" snapPoints={['60%']}>
        <View style={styles.list}>
          {SLASH_OPTIONS.map((option) => (
            <Pressable
              key={option.type}
              onPress={() => {
                haptics.selection();
                onSelectCommand(option.type);
              }}
              style={[styles.row, { borderColor: glass.borderColor, backgroundColor: glass.surfaceColor }]}
            >
              <View style={[styles.iconBox, { backgroundColor: `${glass.accentColor}1E` }]}>
                {option.renderIcon(glass.accentColor)}
              </View>
              <View style={styles.textWrap}>
                <Text style={[styles.label, { color: glass.textPrimary }]}>{option.label}</Text>
                {option.description ? (
                  <Text style={[styles.desc, { color: glass.textMuted }]}>{option.description}</Text>
                ) : null}
              </View>
            </Pressable>
          ))}
        </View>
      </GlassBottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  list: {
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 14,
    borderWidth: 0.75,
    gap: 12,
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  desc: {
    fontSize: 12,
    marginTop: 1,
  },
});
