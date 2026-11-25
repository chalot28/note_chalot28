import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { useBridgeState, type EditorBridge } from '@10play/tentap-editor';
import {
  Bold,
  CheckSquare,
  Code,
  Eraser,
  Heading1,
  Heading2,
  Highlighter,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Strikethrough,
  Underline,
  Undo2,
} from 'lucide-react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { useHaptics } from '@/shared/hooks/useHaptics';

interface CompactFormatBarProps {
  editor: EditorBridge;
}

const HIGHLIGHT_COLORS = [
  '#FEF08A',
  '#BBF7D0',
  '#BAE6FD',
  '#FBCFE8',
  '#DDD6FE',
] as const;

export function CompactFormatBar({ editor }: CompactFormatBarProps) {
  const glass = useGlassStyle();
  const haptics = useHaptics();
  const state = useBridgeState(editor);
  const [showHighlights, setShowHighlights] = useState(false);

  const items = [
    { key: 'undo', active: false, run: () => editor.undo(), Icon: Undo2 },
    { key: 'redo', active: false, run: () => editor.redo(), Icon: Redo2 },
    { key: 'h1', active: state.headingLevel === 1, run: () => editor.toggleHeading(1), Icon: Heading1 },
    { key: 'h2', active: state.headingLevel === 2, run: () => editor.toggleHeading(2), Icon: Heading2 },
    { key: 'bold', active: state.isBoldActive, run: () => editor.toggleBold(), Icon: Bold },
    { key: 'italic', active: state.isItalicActive, run: () => editor.toggleItalic(), Icon: Italic },
    { key: 'underline', active: state.isUnderlineActive, run: () => editor.toggleUnderline(), Icon: Underline },
    { key: 'strike', active: state.isStrikeActive, run: () => editor.toggleStrike(), Icon: Strikethrough },
    { key: 'bullet', active: state.isBulletListActive, run: () => editor.toggleBulletList(), Icon: List },
    { key: 'ordered', active: state.isOrderedListActive, run: () => editor.toggleOrderedList(), Icon: ListOrdered },
    { key: 'task', active: state.isTaskListActive, run: () => editor.toggleTaskList(), Icon: CheckSquare },
    { key: 'quote', active: state.isBlockquoteActive, run: () => editor.toggleBlockquote(), Icon: Quote },
    { key: 'code', active: state.isCodeActive, run: () => editor.toggleCode(), Icon: Code },
  ] as const;

  return (
    <View style={styles.wrap}>
      {showHighlights ? (
        <View
          style={[
            styles.highlightStrip,
            {
              borderRadius: Math.max(10, Math.round(glass.borderRadius * 0.7)),
              backgroundColor: glass.surfaceElevatedColor,
            },
          ]}
        >
          {HIGHLIGHT_COLORS.map((color) => (
            <Pressable
              key={color}
              onPress={() => {
                haptics.selection();
                editor.toggleHighlight(color);
                setShowHighlights(false);
              }}
              style={[styles.colorDot, { backgroundColor: color }]}
            />
          ))}
          <Pressable
            onPress={() => {
              haptics.light();
              editor.unsetHighlight();
              setShowHighlights(false);
            }}
            style={styles.clearHighlightBtn}
          >
            <Eraser size={15} color={glass.textSecondary} />
          </Pressable>
        </View>
      ) : null}

      <View
        style={[
          styles.bar,
          {
            borderRadius: Math.max(12, glass.borderRadius),
            backgroundColor: glass.surfaceElevatedColor,
          },
        ]}
      >
        <BlurView intensity={glass.blurIntensity} tint={glass.blurTint} style={[StyleSheet.absoluteFill, styles.blurLayer]} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          <Pressable
            onPress={() => {
              haptics.selection();
              setShowHighlights((v) => !v);
            }}
            style={[
              styles.iconBtn,
              (showHighlights || Boolean(state.activeHighlight)) && { backgroundColor: `${glass.accentColor}26` },
            ]}
          >
            <Highlighter
              size={17}
              color={showHighlights || state.activeHighlight ? glass.accentColor : glass.textPrimary}
            />
          </Pressable>
          {items.map(({ key, active, run, Icon }) => (
            <Pressable
              key={key}
              onPress={() => {
                haptics.selection();
                run();
              }}
              style={[styles.iconBtn, active && { backgroundColor: `${glass.accentColor}26` }]}
            >
              <Icon size={17} color={active ? glass.accentColor : glass.textPrimary} />
            </Pressable>
          ))}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  highlightStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 8,
  },
  colorDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  clearHighlightBtn: {
    padding: 4,
  },
  bar: { height: 44, overflow: 'hidden' },
  blurLayer: { zIndex: 0 },
  row: { zIndex: 1, alignItems: 'center', paddingHorizontal: 8, gap: 4 },
  iconBtn: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
