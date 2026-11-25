import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { BlurView } from 'expo-blur';
import type { EditorBridge } from '@10play/tentap-editor';
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

interface CompactFormatBarProps {
  editor: EditorBridge;
}

const HIGHLIGHT_COLORS = [
  '#FEF08A', // Vàng
  '#BBF7D0', // Xanh lá
  '#BAE6FD', // Xanh dương
  '#FBCFE8', // Hồng
  '#DDD6FE', // Tím
] as const;

export function CompactFormatBar({ editor }: CompactFormatBarProps) {
  const glass = useGlassStyle();
  const [showHighlights, setShowHighlights] = useState(false);

  const items = [
    { key: 'undo', run: () => editor.undo(), Icon: Undo2 },
    { key: 'redo', run: () => editor.redo(), Icon: Redo2 },
    { key: 'h1', run: () => editor.toggleHeading(1), Icon: Heading1 },
    { key: 'h2', run: () => editor.toggleHeading(2), Icon: Heading2 },
    { key: 'bold', run: () => editor.toggleBold(), Icon: Bold },
    { key: 'italic', run: () => editor.toggleItalic(), Icon: Italic },
    { key: 'underline', run: () => editor.toggleUnderline(), Icon: Underline },
    { key: 'strike', run: () => editor.toggleStrike(), Icon: Strikethrough },
    { key: 'bullet', run: () => editor.toggleBulletList(), Icon: List },
    { key: 'ordered', run: () => editor.toggleOrderedList(), Icon: ListOrdered },
    { key: 'task', run: () => editor.toggleTaskList(), Icon: CheckSquare },
    { key: 'quote', run: () => editor.toggleBlockquote(), Icon: Quote },
    { key: 'code', run: () => editor.toggleCode(), Icon: Code },
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
              // @ts-expect-error onMouseDown prevents clearing contentEditable selection on web
              onMouseDown={(e: { preventDefault?: () => void }) => e.preventDefault?.()}
              onPress={() => {
                editor.toggleHighlight(color);
                setShowHighlights(false);
              }}
              style={[styles.colorDot, { backgroundColor: color }]}
            />
          ))}
          <Pressable
            // @ts-expect-error onMouseDown prevents clearing contentEditable selection on web
            onMouseDown={(e: { preventDefault?: () => void }) => e.preventDefault?.()}
            onPress={() => {
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
        <BlurView
          intensity={glass.blurIntensity}
          tint={glass.blurTint}
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, styles.blurLayer]}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
          <Pressable
            // @ts-expect-error onMouseDown prevents clearing contentEditable selection on web
            onMouseDown={(e: { preventDefault?: () => void }) => e.preventDefault?.()}
            onPress={() => setShowHighlights((v) => !v)}
            style={[
              styles.iconBtn,
              showHighlights && { backgroundColor: `${glass.accentColor}26` },
            ]}
          >
            <Highlighter size={17} color={showHighlights ? glass.accentColor : glass.textPrimary} />
          </Pressable>
          {items.map(({ key, run, Icon }) => (
            <Pressable
              key={key}
              // @ts-expect-error onMouseDown prevents clearing contentEditable selection on web
              onMouseDown={(e: { preventDefault?: () => void }) => e.preventDefault?.()}
              onPress={run}
              style={styles.iconBtn}
            >
              <Icon size={17} color={glass.textPrimary} />
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
