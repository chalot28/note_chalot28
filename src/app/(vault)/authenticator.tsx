import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ArrowLeft, ListPlus, Plus, QrCode } from 'lucide-react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import { BulkSecretModal } from '@/features/authenticator/components/BulkSecretModal';
import { QrCameraScanner } from '@/features/authenticator/components/QrCameraScanner';
import { QuickSecretModal } from '@/features/authenticator/components/QuickSecretModal';
import { TotpAccountCard } from '@/features/authenticator/components/TotpAccountCard';
import { useTotpGlobalClock } from '@/features/authenticator/hooks/useTotpGlobalClock';
import { totpRepository } from '@/features/authenticator/services/totp.repository';
import type { TotpAccountEntity } from '@/features/authenticator/types/totp.types';
import { useVaultSessionStore } from '@/features/vault/store/vaultSessionStore';
import { GlassButton } from '@/shared/components/glass/GlassButton';
import { GlassCard } from '@/shared/components/glass/GlassCard';
import { GlassConfirmModal } from '@/shared/components/glass/GlassConfirmModal';
import { GlassPillBar } from '@/shared/components/glass/GlassPillBar';
import { MinimalScreen } from '@/shared/components/layout/MinimalScreen';
import { ZenHeader } from '@/shared/components/layout/ZenHeader';

export default function AuthenticatorScreen() {
  const router = useRouter();
  const glass = useGlassStyle();
  const sessionKey = useVaultSessionStore((s) => s.sessionKey);
  const { getCode } = useTotpGlobalClock();

  const quickRef = useRef<BottomSheetModal>(null);
  const bulkRef = useRef<BottomSheetModal>(null);

  const [accounts, setAccounts] = useState<TotpAccountEntity[]>([]);
  const [query, setQuery] = useState('');
  const [scannerOpen, setScannerOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<TotpAccountEntity | null>(null);

  const loadAccounts = useCallback(async () => {
    if (!sessionKey) return;
    const list = await totpRepository.getAll(sessionKey);
    setAccounts(list);
  }, [sessionKey]);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return accounts;
    return accounts.filter(
      (a) => a.label.toLowerCase().includes(q) || a.issuer.toLowerCase().includes(q),
    );
  }, [accounts, query]);

  return (
    <MinimalScreen>
      <ZenHeader
        title="2FA Offline"
        leftAction={
          <Pressable
            onPress={() => {
              if (router.canGoBack()) router.back();
              else router.replace('/(vault)');
            }}
            hitSlop={10}
          >
            <ArrowLeft size={20} color={glass.textPrimary} />
          </Pressable>
        }
      />

      <GlassPillBar value={query} onChangeText={setQuery} placeholder="Tìm tài khoản 2FA..." />

      <View style={styles.actionsRow}>
        <GlassButton
          label="Dán Secret"
          variant="accent"
          icon={<Plus size={15} color={glass.accentColor} />}
          onPress={() => quickRef.current?.present()}
          style={styles.actionBtn}
        />
        <GlassButton
          label="Hàng loạt"
          icon={<ListPlus size={15} color={glass.textPrimary} />}
          onPress={() => bulkRef.current?.present()}
          style={styles.actionBtn}
        />
        <GlassButton
          label="Quét QR"
          icon={<QrCode size={15} color={glass.textPrimary} />}
          onPress={() => setScannerOpen(true)}
          style={styles.actionBtn}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <GlassCard style={styles.empty}>
            <Text style={[styles.emptyText, { color: glass.textMuted }]}>
              Chưa có mã 2FA
            </Text>
          </GlassCard>
        }
        renderItem={({ item }) => (
          <TotpAccountCard
            account={item}
            generated={getCode(item)}
            onDelete={(acc) => setConfirmDelete(acc)}
          />
        )}
      />

      <QuickSecretModal
        ref={quickRef}
        onSave={async (draft) => {
          await totpRepository.create(draft, sessionKey);
          quickRef.current?.dismiss();
          await loadAccounts();
        }}
      />

      <BulkSecretModal
        ref={bulkRef}
        onImport={async (drafts) => {
          await totpRepository.createMany(drafts, sessionKey);
          bulkRef.current?.dismiss();
          await loadAccounts();
        }}
      />

      <Modal visible={scannerOpen} transparent animationType="fade" onRequestClose={() => setScannerOpen(false)}>
        <QrCameraScanner
          onClose={() => setScannerOpen(false)}
          onScanned={(draft) => {
            setScannerOpen(false);
            void totpRepository.create(draft, sessionKey).then(loadAccounts);
          }}
        />
      </Modal>

      <GlassConfirmModal
        visible={confirmDelete !== null}
        title="Xóa mã 2FA?"
        message={confirmDelete ? `Xóa "${confirmDelete.issuer || confirmDelete.label}" khỏi danh sách 2FA.` : undefined}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          const target = confirmDelete;
          setConfirmDelete(null);
          if (target) void totpRepository.remove(target.id).then(loadAccounts);
        }}
      />
    </MinimalScreen>
  );
}

const styles = StyleSheet.create({
  actionsRow: { flexDirection: 'row', gap: 8, marginTop: 10, marginBottom: 12 },
  actionBtn: { flex: 1, paddingHorizontal: 10 },
  list: { paddingBottom: 40 },
  empty: { marginTop: 24 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
});
