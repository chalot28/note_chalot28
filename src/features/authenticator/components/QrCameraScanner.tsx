import React, { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Camera, X } from 'lucide-react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { parseOtpAuthUri } from '@/features/authenticator/services/otpauth.uri.parser';
import type { TotpDraft } from '@/features/authenticator/types/totp.types';
import { GlassButton } from '@/shared/components/glass/GlassButton';
import { GlassCard } from '@/shared/components/glass/GlassCard';
import { LiquidMeshCanvas } from '@/shared/components/glass/LiquidMeshCanvas';
import { useHaptics } from '@/shared/hooks/useHaptics';

interface QrCameraScannerProps {
  onScanned: (draft: TotpDraft) => void;
  onClose: () => void;
}

export function QrCameraScanner({ onScanned, onClose }: QrCameraScannerProps) {
  const glass = useGlassStyle();
  const haptics = useHaptics();
  const [permission, requestPermission] = useCameraPermissions();
  const [scanError, setScanError] = useState<string | null>(null);
  const lockedRef = useRef(false);

  const handleBarcode = (result: BarcodeScanningResult) => {
    if (lockedRef.current) return;
    try {
      const draft = parseOtpAuthUri(result.data);
      lockedRef.current = true;
      haptics.success();
      onScanned(draft);
    } catch {
      setScanError('Mã QR không hợp lệ');
    }
  };

  if (!permission?.granted) {
    return (
      <View style={styles.permissionWrap}>
        <LiquidMeshCanvas />
        <GlassCard style={styles.permissionCard} contentStyle={styles.permissionContent}>
          <View style={[styles.iconBadge, { backgroundColor: `${glass.accentColor}20` }]}>
            <Camera size={26} color={glass.accentColor} />
          </View>
          <Text style={[styles.permTitle, { color: glass.textPrimary }]}>
            Quét mã QR 2FA
          </Text>
          <Text style={[styles.permSub, { color: glass.textMuted }]}>
            Cần quyền truy cập Camera để quét mã
          </Text>
          <View style={styles.permActions}>
            <GlassButton label="Cấp quyền Camera" variant="accent" onPress={() => void requestPermission()} />
            <GlassButton label="Đóng" variant="ghost" onPress={onClose} />
          </View>
        </GlassCard>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
        onBarcodeScanned={handleBarcode}
      />

      <View style={styles.topBar}>
        <Pressable onPress={onClose} hitSlop={10} style={styles.closeCircle}>
          <X size={20} color="#FFFFFF" />
        </Pressable>
      </View>

      <View style={styles.overlay}>
        <View style={styles.reticle}>
          <View style={[styles.corner, styles.tl, { borderColor: glass.accentColor }]} />
          <View style={[styles.corner, styles.tr, { borderColor: glass.accentColor }]} />
          <View style={[styles.corner, styles.bl, { borderColor: glass.accentColor }]} />
          <View style={[styles.corner, styles.br, { borderColor: glass.accentColor }]} />
        </View>
        <Text style={styles.hintText}>
          {scanError ?? 'Đưa mã QR vào khung ngắm'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#04070D' },
  topBar: { position: 'absolute', top: 20, right: 20, zIndex: 10 },
  closeCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20, padding: 24 },
  reticle: { width: 220, height: 220, position: 'relative' },
  corner: { position: 'absolute', width: 32, height: 32, borderWidth: 3.5 },
  tl: { top: 0, left: 0, borderRightWidth: 0, borderBottomWidth: 0, borderTopLeftRadius: 18 },
  tr: { top: 0, right: 0, borderLeftWidth: 0, borderBottomWidth: 0, borderTopRightRadius: 18 },
  bl: { bottom: 0, left: 0, borderRightWidth: 0, borderTopWidth: 0, borderBottomLeftRadius: 18 },
  br: { bottom: 0, right: 0, borderLeftWidth: 0, borderTopWidth: 0, borderBottomRightRadius: 18 },
  hintText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', textAlign: 'center' },
  permissionWrap: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  permissionCard: { width: '100%', maxWidth: 340 },
  permissionContent: { alignItems: 'center', gap: 10, padding: 20 },
  iconBadge: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  permTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center' },
  permSub: { fontSize: 13, textAlign: 'center', marginBottom: 6 },
  permActions: { width: '100%', gap: 8 },
});
