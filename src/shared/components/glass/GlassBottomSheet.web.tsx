import React, { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { BlurView } from 'expo-blur';
import { X } from 'lucide-react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';

interface GlassBottomSheetProps {
  children: React.ReactNode;
  title?: string;
  snapPoints?: (string | number)[];
  onDismiss?: () => void;
}

export const GlassBottomSheet = forwardRef<BottomSheetModal, GlassBottomSheetProps>(
  function GlassBottomSheet({ children, title, onDismiss }, ref) {
    const glass = useGlassStyle();
    const [visible, setVisible] = useState(false);
    const openedAtRef = useRef(0);

    const close = () => {
      setVisible(false);
      onDismiss?.();
    };

    const handleBackdropPress = () => {
      // Ignore the trailing click/release from the gesture that just opened the sheet
      if (Date.now() - openedAtRef.current < 250) return;
      close();
    };

    useImperativeHandle(
      ref,
      () =>
        ({
          present: () => {
            openedAtRef.current = Date.now();
            setVisible(true);
          },
          dismiss: close,
          close,
          snapToIndex: () => undefined,
          snapToPosition: () => undefined,
          expand: () => undefined,
          collapse: () => undefined,
          forceClose: close,
        }) as unknown as BottomSheetModal,
    );

    const isDark = glass.blurTint === 'dark';

    return (
      <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
        <View style={styles.backdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={handleBackdropPress} />
          <View
            style={[
              styles.sheet,
              {
                borderTopLeftRadius: glass.borderRadius + 6,
                borderTopRightRadius: glass.borderRadius + 6,
                backgroundColor: isDark ? 'rgba(13, 20, 36, 0.94)' : 'rgba(255, 255, 255, 0.94)',
              },
            ]}
          >
            <BlurView
              intensity={Math.min(100, glass.blurIntensity + 20)}
              tint={glass.blurTint}
              pointerEvents="none"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.header}>
              <Text style={[styles.title, { color: glass.textPrimary }]}>{title ?? ''}</Text>
              <Pressable onPress={close} hitSlop={10}>
                <X size={18} color={glass.textMuted} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
              {children}
            </ScrollView>
          </View>
        </View>
      </Modal>
    );
  },
);

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheet: {
    width: '100%',
    maxWidth: 540,
    maxHeight: '82%',
    overflow: 'hidden',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  title: { fontSize: 17, fontWeight: '600' },
  body: { paddingBottom: 12 },
});
