import { decryptAesGcm, encryptAesGcm } from '@/core/security/aes.cipher';
import type { VaultEncryptedRow, VaultItemDraft, VaultItemEntity } from '@/features/vault/types/vault.types';
import { createId } from '@/shared/utils/id.utils';

const KEY = 'liquid_web_vault_v1';

function readAll(): VaultEncryptedRow[] {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null;
    return raw ? (JSON.parse(raw) as VaultEncryptedRow[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: VaultEncryptedRow[]): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export const vaultRepository = {
  async getAllSecretNotes(sessionKey: string | null): Promise<VaultItemEntity[]> {
    if (!sessionKey) throw new Error('Không gian riêng chưa được mở khóa.');
    const sorted = readAll().sort((a, b) => b.updatedAt - a.updatedAt);
    return Promise.all(
      sorted.map(async (row) => {
        const title = await decryptAesGcm(
          { cipherText: row.titleCipher, iv: row.titleIv, authTag: row.titleTag },
          sessionKey,
        );
        const payload = await decryptAesGcm(
          { cipherText: row.payloadCipher, iv: row.payloadIv, authTag: row.payloadTag },
          sessionKey,
        );
        let content = payload;
        try {
          const parsed = JSON.parse(payload) as { content?: string };
          if (typeof parsed.content === 'string') content = parsed.content;
        } catch {
          content = payload;
        }
        return {
          id: row.id,
          kind: row.kind,
          title,
          content,
          isPinned: row.isPinned,
          createdAt: row.createdAt,
          updatedAt: row.updatedAt,
        };
      }),
    );
  },

  async upsertSecretNote(draft: VaultItemDraft, sessionKey: string | null): Promise<VaultItemEntity> {
    if (!sessionKey) throw new Error('Không thể lưu khi khóa phiên không tồn tại.');
    const all = readAll();
    const now = Date.now();
    const id = draft.id ?? createId('vault');
    const existing = all.find((r) => r.id === id);
    const titleText = draft.title.trim() || 'Tài khoản mật';
    const titleEnc = await encryptAesGcm(titleText, sessionKey);
    const payloadEnc = await encryptAesGcm(JSON.stringify({ content: draft.content }), sessionKey);

    const row: VaultEncryptedRow = {
      id,
      kind: draft.kind ?? existing?.kind ?? 'note',
      titleCipher: titleEnc.cipherText,
      titleIv: titleEnc.iv,
      titleTag: titleEnc.authTag,
      payloadCipher: payloadEnc.cipherText,
      payloadIv: payloadEnc.iv,
      payloadTag: payloadEnc.authTag,
      isPinned: draft.isPinned ?? existing?.isPinned ?? false,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
    writeAll(existing ? all.map((r) => (r.id === id ? row : r)) : [row, ...all]);
    return {
      id: row.id,
      kind: row.kind,
      title: titleText,
      content: draft.content,
      isPinned: row.isPinned,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  },

  async remove(id: string): Promise<void> {
    writeAll(readAll().filter((r) => r.id !== id));
  },
};
