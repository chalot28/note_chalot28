import React, { forwardRef, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { Eye, EyeOff } from 'lucide-react-native';
import { useGlassStyle } from '@/core/theme/useGlassStyle';
import type { VaultItemEntity } from '@/features/vault/types/vault.types';
import { GlassBottomSheet } from '@/shared/components/glass/GlassBottomSheet';
import { GlassButton } from '@/shared/components/glass/GlassButton';
import { GlassInput } from '@/shared/components/glass/GlassInput';

export interface VaultAccountPayload {
  username: string;
  password: string;
  notes: string;
}

export function parseVaultPayload(raw: string): VaultAccountPayload {
  try {
    const parsed = JSON.parse(raw) as Partial<VaultAccountPayload>;
    if (
      typeof parsed.username === 'string' ||
      typeof parsed.password === 'string' ||
      typeof parsed.notes === 'string'
    ) {
      return {
        username: parsed.username ?? '',
        password: parsed.password ?? '',
        notes: parsed.notes ?? '',
      };
    }
  } catch {
    // fallback for legacy plain text
  }
  return { username: '', password: '', notes: raw };
}

interface VaultSecretEditorSheetProps {
  editingItem: VaultItemEntity | null;
  onSave: (payload: { id?: string; title: string; content: string }) => Promise<void>;
  onDelete?: (id: string) => Promise<void>;
}

export const VaultSecretEditorSheet = forwardRef<BottomSheetModal, VaultSecretEditorSheetProps>(
  function VaultSecretEditorSheet({ editingItem, onSave, onDelete }, ref) {
    const glass = useGlassStyle();
    const [title, setTitle] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [notes, setNotes] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
      setTitle(editingItem?.title ?? '');
      const parsed = editingItem ? parseVaultPayload(editingItem.content) : { username: '', password: '', notes: '' };
      setUsername(parsed.username);
      setPassword(parsed.password);
      setNotes(parsed.notes);
      setShowPassword(false);
    }, [editingItem]);

    const handleSave = async () => {
      if ((!title.trim() && !username.trim() && !password.trim() && !notes.trim()) || saving) return;
      setSaving(true);
      try {
        const serialized = JSON.stringify({
          username: username.trim(),
          password,
          notes: notes.trim(),
        });
        await onSave({ id: editingItem?.id, title, content: serialized });
      } finally {
        setSaving(false);
      }
    };

    return (
      <GlassBottomSheet
        ref={ref}
        title={editingItem ? 'Chi tiết tài khoản / mật' : 'Thêm tài khoản / ghi chú mật'}
        snapPoints={['78%']}
      >
        <View style={styles.form}>
          <GlassInput
            label="Dịch vụ / Tiêu đề"
            value={title}
            onChangeText={setTitle}
            placeholder="VD: Gmail, GitHub, Ngân hàng..."
          />
          <GlassInput
            label="Tài khoản / Email"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            placeholder="ten@example.com"
          />
          <GlassInput
            label="Mật khẩu / Mã bí mật"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            placeholder="••••••••"
            rightElement={
              <Pressable onPress={() => setShowPassword((v) => !v)} hitSlop={8}>
                {showPassword ? (
                  <EyeOff size={16} color={glass.textMuted} />
                ) : (
                  <Eye size={16} color={glass.textMuted} />
                )}
              </Pressable>
            }
          />
          <GlassInput
            label="Ghi chú thêm"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            placeholder="Mã khôi phục, ghi chú riêng..."
            style={styles.multiline}
          />
          <GlassButton label="Lưu" variant="accent" loading={saving} onPress={() => void handleSave()} />
          {editingItem && onDelete ? (
            <GlassButton
              label="Xóa"
              variant="danger"
              onPress={() => void onDelete(editingItem.id)}
            />
          ) : null}
        </View>
      </GlassBottomSheet>
    );
  },
);

const styles = StyleSheet.create({
  form: { gap: 12 },
  multiline: { minHeight: 88, textAlignVertical: 'top' },
});
