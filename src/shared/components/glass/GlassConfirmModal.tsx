import React from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Trash2 } from 'lucide-react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { GlassButton } from '@/shared/components/glass/GlassButton';

interface GlassConfirmModalProps {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function GlassConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Xóa',
  cancelLabel = 'Hủy',
  onConfirm,
  onCancel,
}: GlassConfirmModalProps) {
  const glass = useGlassStyle();
  const isDark = glass.blurTint === 'dark';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={styles.backdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View
          style={[
            styles.card,
            {
              borderRadius: glass.borderRadius,
              backgroundColor: isDark ? 'rgba(13, 20, 36, 0.94)' : 'rgba(248, 250, 252, 0.96)',
            },
          ]}
        >
          <BlurView
            intensity={Math.min(100, glass.blurIntensity + 20)}
            tint={glass.blurTint}
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, styles.bgLayer]}
          />
          <View style={styles.content}>
            <View style={styles.iconWrap}>
              <Trash2 size={20} color="#EF4444" />
            </View>
            <Text style={[styles.title, { color: glass.textPrimary }]}>{title}</Text>
            {message ? (
              <Text style={[styles.message, { color: glass.textMuted }]}>{message}</Text>
            ) : null}
            <View style={styles.actions}>
              <GlassButton
                label={cancelLabel}
                onPress={onCancel}
                style={styles.btn}
              />
              <GlassButton
                label={confirmLabel}
                variant="danger"
                onPress={onConfirm}
                style={styles.btn}
              />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 330,
    overflow: 'hidden',
    padding: 20,
  },
  bgLayer: { zIndex: 0 },
  content: { zIndex: 1, alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  title: { fontSize: 16, fontWeight: '700', textAlign: 'center' },
  message: { fontSize: 13, textAlign: 'center', lineHeight: 19 },
  actions: { flexDirection: 'row', gap: 10, width: '100%', marginTop: 6 },
  btn: { flex: 1 },
});
