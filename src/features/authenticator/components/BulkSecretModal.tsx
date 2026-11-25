import React, { forwardRef, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { parseBulkSecretLines } from '@/features/authenticator/services/otpauth.uri.parser';
import type { TotpDraft } from '@/features/authenticator/types/totp.types';
import { GlassBottomSheet } from '@/shared/components/glass/GlassBottomSheet';
import { GlassButton } from '@/shared/components/glass/GlassButton';
import { GlassInput } from '@/shared/components/glass/GlassInput';

interface BulkSecretModalProps {
  onImport: (drafts: readonly TotpDraft[]) => Promise<void>;
}

export const BulkSecretModal = forwardRef<BottomSheetModal, BulkSecretModalProps>(
  function BulkSecretModal({ onImport }, ref) {
    const glass = useGlassStyle();
    const [rawText, setRawText] = useState('');
    const [importing, setImporting] = useState(false);

    const parsed = useMemo(() => parseBulkSecretLines(rawText), [rawText]);

    const handleImport = async () => {
      if (parsed.valid.length === 0 || importing) return;
      setImporting(true);
      try {
        await onImport(parsed.valid);
        setRawText('');
      } finally {
        setImporting(false);
      }
    };

    return (
      <GlassBottomSheet ref={ref} title="Nhập hàng loạt 2FA" snapPoints={['68%']}>
        <View style={styles.root}>
          <Text style={[styles.hint, { color: glass.textSecondary }]}>
            Mỗi dòng theo dạng: Tên tài khoản | SecretKey (hoặc dán thẳng Secret / URI otpauth://)
          </Text>

          <GlassInput
            value={rawText}
            onChangeText={setRawText}
            multiline
            numberOfLines={6}
            placeholder={'GitHub | JBSWY3DPEHPK3PXP\nGoogle | MFRGGZDFMZTWQ2LK'}
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.multilineInput}
          />

          <View style={styles.statusRow}>
            <Text style={[styles.statusText, { color: glass.accentColor }]}>
              Hợp lệ: {parsed.valid.length} dòng
            </Text>
            {parsed.invalidLines.length > 0 ? (
              <Text style={styles.errorText}>
                Lỗi ở dòng: {parsed.invalidLines.join(', ')}
              </Text>
            ) : null}
          </View>

          <GlassButton
            label={`Nhập ${parsed.valid.length} tài khoản`}
            variant="accent"
            disabled={parsed.valid.length === 0}
            loading={importing}
            onPress={() => void handleImport()}
          />
        </View>
      </GlassBottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  root: { gap: 12 },
  hint: { fontSize: 12, lineHeight: 18 },
  multilineInput: { minHeight: 130, textAlignVertical: 'top' },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusText: { fontSize: 13, fontWeight: '600' },
  errorText: { fontSize: 12, color: '#EF4444' },
});
