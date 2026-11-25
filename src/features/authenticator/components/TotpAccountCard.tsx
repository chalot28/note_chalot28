import React, { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Check, Trash2 } from 'lucide-react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { SkiaTimerCircle } from '@/features/authenticator/components/SkiaTimerCircle';
import type {
  TotpAccountEntity,
  TotpGeneratedCode,
} from '@/features/authenticator/types/totp.types';
import { GlassCard } from '@/shared/components/glass/GlassCard';
import { useHaptics } from '@/shared/hooks/useHaptics';

interface TotpAccountCardProps {
  account: TotpAccountEntity;
  generated: TotpGeneratedCode;
  onDelete?: (account: TotpAccountEntity) => void;
}

export function TotpAccountCard({ account, generated, onDelete }: TotpAccountCardProps) {
  const glass = useGlassStyle();
  const haptics = useHaptics();
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(generated.code);
    haptics.success();
    setCopied(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopied(false), 1600);
  };

  return (
    <GlassCard
      onPress={() => void handleCopy()}
      onLongPress={onDelete ? () => onDelete(account) : undefined}
      enableHaptic={false}
      style={[
        styles.card,
        copied && { borderColor: glass.accentColor, borderWidth: 1.25, borderRadius: glass.borderRadius },
      ]}
      contentStyle={styles.content}
    >
      <View style={styles.left}>
        <View style={styles.titleRow}>
          <Text numberOfLines={1} style={[styles.issuer, { color: glass.textPrimary }]}>
            {account.issuer || account.label}
          </Text>
          {copied ? (
            <View style={styles.copiedRow}>
              <Check size={12} color={glass.accentColor} strokeWidth={2.5} />
              <Text style={[styles.copiedText, { color: glass.accentColor }]}>Đã sao chép</Text>
            </View>
          ) : null}
        </View>

        {account.issuer && account.label !== account.issuer ? (
          <Text numberOfLines={1} style={[styles.label, { color: glass.textMuted }]}>
            {account.label}
          </Text>
        ) : null}

        <Text style={[styles.code, { color: glass.accentColor, fontFamily: glass.fontMono }]}>
          {generated.formattedCode}
        </Text>
      </View>

      <View style={styles.right}>
        {account.type === 'totp' ? (
          <SkiaTimerCircle
            remainingSeconds={generated.remainingSeconds}
            period={account.period}
          />
        ) : null}
        {onDelete ? (
          <Pressable
            onPress={(e) => {
              e.stopPropagation?.();
              haptics.light();
              onDelete(account);
            }}
            hitSlop={8}
            accessibilityLabel="Xóa mã 2FA"
            style={styles.deleteBtn}
          >
            <Trash2 size={16} color={glass.textMuted} />
          </Pressable>
        ) : null}
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  content: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14, gap: 12 },
  left: { flex: 1, gap: 3 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  issuer: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
  label: { fontSize: 12 },
  code: { fontSize: 28, fontWeight: '700', letterSpacing: 2, marginTop: 4 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  deleteBtn: { padding: 6 },
  copiedRow: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  copiedText: { fontSize: 11, fontWeight: '600' },
});
