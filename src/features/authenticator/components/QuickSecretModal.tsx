import React, { forwardRef, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { KeyRound } from 'lucide-react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { SkiaTimerCircle } from '@/features/authenticator/components/SkiaTimerCircle';
import { useTotpGlobalClock } from '@/features/authenticator/hooks/useTotpGlobalClock';
import { previewTotpFromSecret } from '@/features/authenticator/services/totp.engine';
import type { TotpDraft } from '@/features/authenticator/types/totp.types';
import { GlassBottomSheet } from '@/shared/components/glass/GlassBottomSheet';
import { GlassButton } from '@/shared/components/glass/GlassButton';
import { GlassCard } from '@/shared/components/glass/GlassCard';
import { GlassInput } from '@/shared/components/glass/GlassInput';
import { isValidBase32, normalizeBase32Secret } from '@/shared/utils/base32.utils';

interface QuickSecretModalProps {
  onSave: (draft: TotpDraft) => Promise<void>;
}

export const QuickSecretModal = forwardRef<BottomSheetModal, QuickSecretModalProps>(
  function QuickSecretModal({ onSave }, ref) {
    const glass = useGlassStyle();
    const { nowMs } = useTotpGlobalClock();
    const [label, setLabel] = useState('');
    const [rawSecret, setRawSecret] = useState('');
    const [saving, setSaving] = useState(false);

    const preview = useMemo(() => previewTotpFromSecret(rawSecret, nowMs), [nowMs, rawSecret]);
    const valid = isValidBase32(rawSecret);

    const handleSave = async () => {
      if (!valid || saving) return;
      setSaving(true);
      try {
        await onSave({
          label: label.trim() || 'Tài khoản 2FA',
          secret: normalizeBase32Secret(rawSecret),
        });
        setLabel('');
        setRawSecret('');
      } finally {
        setSaving(false);
      }
    };

    return (
      <GlassBottomSheet ref={ref} title="Thêm nhanh 2FA (chuẩn 2fa.live)" snapPoints={['58%']}>
        <View style={styles.form}>
          <GlassInput
            label="Chuỗi Secret Key (Base32)"
            value={rawSecret}
            onChangeText={setRawSecret}
            placeholder="Ví dụ: jbsw y3dp ehpk 3pxp"
            autoCapitalize="none"
            autoCorrect={false}
            leftIcon={<KeyRound size={16} color={glass.textMuted} />}
            error={rawSecret.trim().length > 0 && !valid ? 'Secret Key Base32 chưa hợp lệ' : undefined}
          />

          <GlassInput
            label="Tên gợi nhớ (tùy chọn)"
            value={label}
            onChangeText={setLabel}
            placeholder="Ví dụ: GitHub, Facebook, AWS..."
          />

          {preview ? (
            <GlassCard style={styles.previewCard} contentStyle={styles.previewContent}>
              <View>
                <Text style={[styles.previewHint, { color: glass.textMuted }]}>Xem trước mã trực tiếp</Text>
                <Text style={[styles.previewCode, { color: glass.accentColor, fontFamily: glass.fontMono }]}>
                  {preview.formattedCode}
                </Text>
              </View>
              <SkiaTimerCircle remainingSeconds={preview.remainingSeconds} />
            </GlassCard>
          ) : null}

          <GlassButton
            label="Lưu vào Không gian riêng"
            variant="accent"
            disabled={!valid}
            loading={saving}
            onPress={() => void handleSave()}
          />
        </View>
      </GlassBottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  form: { gap: 12 },
  previewCard: { marginTop: 4 },
  previewContent: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 14 },
  previewHint: { fontSize: 11, marginBottom: 2 },
  previewCode: { fontSize: 26, fontWeight: '700', letterSpacing: 2 },
});
