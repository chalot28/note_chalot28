import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { ArrowLeft, Check, Copy, KeyRound, Lock, Trash2 } from 'lucide-react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import {
  parseVaultPayload,
  VaultSecretEditorSheet,
} from '@/features/vault/components/VaultSecretEditorSheet';
import { vaultRepository } from '@/features/vault/services/vault.repository';
import { useVaultSessionStore } from '@/features/vault/store/vaultSessionStore';
import type { VaultItemEntity } from '@/features/vault/types/vault.types';
import { GlassCard } from '@/shared/components/glass/GlassCard';
import { GlassConfirmModal } from '@/shared/components/glass/GlassConfirmModal';
import { FloatingActionOrb } from '@/shared/components/layout/FloatingActionOrb';
import { MinimalScreen } from '@/shared/components/layout/MinimalScreen';
import { ZenHeader } from '@/shared/components/layout/ZenHeader';
import { useHaptics } from '@/shared/hooks/useHaptics';
import { formatRelativeTime } from '@/shared/utils/date.utils';

export default function VaultHomeScreen() {
  const router = useRouter();
  const glass = useGlassStyle();
  const haptics = useHaptics();
  const sessionKey = useVaultSessionStore((s) => s.sessionKey);
  const lockAndWipe = useVaultSessionStore((s) => s.lockAndWipe);
  const touchActivity = useVaultSessionStore((s) => s.touchActivity);

  const editorRef = useRef<BottomSheetModal>(null);
  const clearClipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [items, setItems] = useState<VaultItemEntity[]>([]);
  const [editing, setEditing] = useState<VaultItemEntity | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<VaultItemEntity | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    if (!sessionKey) return;
    const rows = await vaultRepository.getAllSecretNotes(sessionKey);
    setItems(rows);
  }, [sessionKey]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  useEffect(() => {
    return () => {
      if (clearClipTimerRef.current) clearTimeout(clearClipTimerRef.current);
    };
  }, []);

  const handleLockAndExit = () => {
    lockAndWipe();
    router.replace('/(tabs)');
  };

  const handleCopy = async (id: string, value: string) => {
    touchActivity();
    await Clipboard.setStringAsync(value);
    haptics.success();
    setCopiedId(id);
    setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1400);

    if (clearClipTimerRef.current) clearTimeout(clearClipTimerRef.current);
    clearClipTimerRef.current = setTimeout(() => {
      void Clipboard.getStringAsync().then((current) => {
        if (current === value) {
          void Clipboard.setStringAsync('');
        }
      });
    }, 30_000);
  };

  return (
    <MinimalScreen>
      <ZenHeader
        title="Không gian riêng"
        leftAction={
          <Pressable onPress={handleLockAndExit} hitSlop={10}>
            <ArrowLeft size={20} color={glass.textPrimary} />
          </Pressable>
        }
        rightAction={
          <View style={styles.headerActions}>
            <Pressable
              onPress={() => router.push('/(vault)/authenticator')}
              style={styles.pillBtn}
            >
              <KeyRound size={15} color={glass.textPrimary} />
              <Text style={[styles.pillText, { color: glass.textPrimary }]}>2FA</Text>
            </Pressable>
            <Pressable onPress={handleLockAndExit} hitSlop={10}>
              <Lock size={18} color={glass.textSecondary} />
            </Pressable>
          </View>
        }
      />

      <FlatList
        data={items}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <GlassCard style={styles.empty}>
            <Text style={[styles.emptyText, { color: glass.textMuted }]}>
              Chưa có tài khoản hay ghi chú mật
            </Text>
          </GlassCard>
        }
        renderItem={({ item }) => {
          const parsed = parseVaultPayload(item.content);
          const pwdKey = `${item.id}_pwd`;
          const userKey = `${item.id}_usr`;
          return (
            <GlassCard
              onPress={() => {
                setEditing(item);
                editorRef.current?.present();
              }}
              style={styles.card}
            >
              <View style={styles.cardHeader}>
                <Text numberOfLines={1} style={[styles.title, { color: glass.textPrimary }]}>
                  {item.title}
                </Text>
                <Pressable
                  onPress={(e) => {
                    e.stopPropagation?.();
                    haptics.light();
                    setConfirmDelete(item);
                  }}
                  hitSlop={8}
                >
                  <Trash2 size={15} color={glass.textMuted} />
                </Pressable>
              </View>

              {parsed.username ? (
                <View style={styles.credRow}>
                  <Text numberOfLines={1} style={[styles.credText, { color: glass.textSecondary }]}>
                    {parsed.username}
                  </Text>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation?.();
                      void handleCopy(userKey, parsed.username);
                    }}
                    hitSlop={6}
                  >
                    {copiedId === userKey ? (
                      <Check size={14} color={glass.accentColor} />
                    ) : (
                      <Copy size={14} color={glass.textMuted} />
                    )}
                  </Pressable>
                </View>
              ) : null}

              {parsed.password ? (
                <View style={styles.credRow}>
                  <Text style={[styles.credText, { color: glass.accentColor }]}>••••••••••••</Text>
                  <Pressable
                    onPress={(e) => {
                      e.stopPropagation?.();
                      void handleCopy(pwdKey, parsed.password);
                    }}
                    hitSlop={6}
                  >
                    {copiedId === pwdKey ? (
                      <Check size={14} color={glass.accentColor} />
                    ) : (
                      <Copy size={14} color={glass.textMuted} />
                    )}
                  </Pressable>
                </View>
              ) : null}

              {parsed.notes ? (
                <Text numberOfLines={2} style={[styles.content, { color: glass.textMuted }]}>
                  {parsed.notes}
                </Text>
              ) : null}

              <Text style={[styles.time, { color: glass.textMuted }]}>
                {formatRelativeTime(item.updatedAt)}
              </Text>
            </GlassCard>
          );
        }}
      />

      <FloatingActionOrb
        onPress={() => {
          setEditing(null);
          editorRef.current?.present();
        }}
        style={styles.orb}
      />

      <VaultSecretEditorSheet
        ref={editorRef}
        editingItem={editing}
        onSave={async (payload) => {
          await vaultRepository.upsertSecretNote(payload, sessionKey);
          editorRef.current?.dismiss();
          await loadItems();
        }}
        onDelete={async (id) => {
          await vaultRepository.remove(id);
          editorRef.current?.dismiss();
          await loadItems();
        }}
      />

      <GlassConfirmModal
        visible={confirmDelete !== null}
        title="Xóa mục này?"
        message={confirmDelete ? `"${confirmDelete.title}" sẽ bị xóa vĩnh viễn.` : undefined}
        onCancel={() => setConfirmDelete(null)}
        onConfirm={() => {
          const target = confirmDelete;
          setConfirmDelete(null);
          if (target) void vaultRepository.remove(target.id).then(loadItems);
        }}
      />
    </MinimalScreen>
  );
}

const styles = StyleSheet.create({
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pillBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  pillText: { fontSize: 12, fontWeight: '700' },
  list: { paddingBottom: 100, gap: 10 },
  empty: { marginTop: 24 },
  emptyText: { fontSize: 13, textAlign: 'center', lineHeight: 20 },
  card: { marginBottom: 2 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 4 },
  title: { flex: 1, fontSize: 15, fontWeight: '700' },
  credRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 4 },
  credText: { flex: 1, fontSize: 13 },
  content: { fontSize: 12, lineHeight: 18, marginTop: 6 },
  time: { fontSize: 11, marginTop: 8 },
  orb: { position: 'absolute', right: 20, bottom: 28 },
});
