import { desc, eq } from 'drizzle-orm';
import { db } from '@/core/db/client';
import { vaultItems } from '@/core/db/schema';
import { decryptAesGcm, encryptAesGcm } from '@/core/security/aes.cipher';
import type { VaultItemDraft, VaultItemEntity } from '@/features/vault/types/vault.types';
import { createId } from '@/shared/utils/id.utils';

async function decryptRow(
  row: typeof vaultItems.$inferSelect,
  sessionKey: string,
): Promise<VaultItemEntity> {
  const title = await decryptAesGcm(
    { cipherText: row.titleCipher, iv: row.titleIv, authTag: row.titleTag },
    sessionKey,
  );
  const rawPayload = await decryptAesGcm(
    { cipherText: row.payloadCipher, iv: row.payloadIv, authTag: row.payloadTag },
    sessionKey,
  );

  let content = rawPayload;
  try {
    const parsed = JSON.parse(rawPayload) as { content?: string };
    if (typeof parsed.content === 'string') {
      content = parsed.content;
    }
  } catch {
    content = rawPayload;
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
}

export const vaultRepository = {
  async getAllSecretNotes(sessionKey: string | null): Promise<VaultItemEntity[]> {
    if (!sessionKey) {
      throw new Error('Không gian riêng chưa được mở khóa.');
    }
    const rows = await db
      .select()
      .from(vaultItems)
      .orderBy(desc(vaultItems.isPinned), desc(vaultItems.updatedAt));
    return Promise.all(rows.map((row) => decryptRow(row, sessionKey)));
  },

  async upsertSecretNote(
    draft: VaultItemDraft,
    sessionKey: string | null,
  ): Promise<VaultItemEntity> {
    if (!sessionKey) {
      throw new Error('Không thể lưu khi khóa phiên không tồn tại.');
    }

    const now = Date.now();
    const id = draft.id ?? createId('vault');
    const existingRows = await db.select().from(vaultItems).where(eq(vaultItems.id, id)).limit(1);
    const existing = existingRows[0];

    const titleEnc = await encryptAesGcm(draft.title.trim() || 'Tài khoản mật', sessionKey);
    const payloadEnc = await encryptAesGcm(JSON.stringify({ content: draft.content }), sessionKey);

    const record = {
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

    await db
      .insert(vaultItems)
      .values(record)
      .onConflictDoUpdate({
        target: vaultItems.id,
        set: {
          titleCipher: record.titleCipher,
          titleIv: record.titleIv,
          titleTag: record.titleTag,
          payloadCipher: record.payloadCipher,
          payloadIv: record.payloadIv,
          payloadTag: record.payloadTag,
          isPinned: record.isPinned,
          updatedAt: record.updatedAt,
        },
      });

    return {
      id: record.id,
      kind: record.kind,
      title: draft.title.trim() || 'Ghi chú mật',
      content: draft.content,
      isPinned: record.isPinned,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  },

  async remove(id: string): Promise<void> {
    await db.delete(vaultItems).where(eq(vaultItems.id, id));
  },
};
