import { desc, eq } from 'drizzle-orm';
import { db } from '@/core/db/client';
import { totpAccounts } from '@/core/db/schema';
import { decryptAesGcm, encryptAesGcm } from '@/core/security/aes.cipher';
import type {
  TotpAccountEntity,
  TotpAlgorithm,
  TotpDraft,
} from '@/features/authenticator/types/totp.types';
import { normalizeBase32Secret } from '@/shared/utils/base32.utils';
import { createId } from '@/shared/utils/id.utils';

async function mapRow(
  row: typeof totpAccounts.$inferSelect,
  sessionKey: string,
): Promise<TotpAccountEntity> {
  const secret = await decryptAesGcm(
    { cipherText: row.secretCipher, iv: row.secretIv, authTag: row.secretTag },
    sessionKey,
  );
  return {
    id: row.id,
    issuer: row.issuer,
    label: row.accountLabel,
    secret,
    digits: row.digits,
    period: row.period,
    algorithm: (row.algorithm as TotpAlgorithm) || 'SHA1',
    type: row.kind,
    counter: row.counter,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export const totpRepository = {
  async getAll(sessionKey: string | null): Promise<TotpAccountEntity[]> {
    if (!sessionKey) {
      throw new Error('Phiên khóa 2FA chưa được mở.');
    }
    const rows = await db.select().from(totpAccounts).orderBy(desc(totpAccounts.createdAt));
    return Promise.all(rows.map((r) => mapRow(r, sessionKey)));
  },

  async create(draft: TotpDraft, sessionKey: string | null): Promise<TotpAccountEntity> {
    if (!sessionKey) {
      throw new Error('Không thể lưu mã 2FA khi chưa mở khóa.');
    }
    const now = Date.now();
    const normalizedSecret = normalizeBase32Secret(draft.secret);
    const enc = await encryptAesGcm(normalizedSecret, sessionKey);
    const record = {
      id: createId('totp'),
      issuer: draft.issuer?.trim() ?? '',
      accountLabel: draft.label.trim() || 'Tài khoản 2FA',
      secretCipher: enc.cipherText,
      secretIv: enc.iv,
      secretTag: enc.authTag,
      algorithm: draft.algorithm ?? 'SHA1',
      digits: draft.digits ?? 6,
      period: draft.period ?? 30,
      counter: draft.counter ?? 0,
      kind: draft.type ?? 'totp',
      createdAt: now,
      updatedAt: now,
    };

    await db.insert(totpAccounts).values(record);
    return {
      id: record.id,
      issuer: record.issuer,
      label: record.accountLabel,
      secret: normalizedSecret,
      digits: record.digits,
      period: record.period,
      algorithm: record.algorithm,
      type: record.kind,
      counter: record.counter,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  },

  async createMany(drafts: readonly TotpDraft[], sessionKey: string | null): Promise<number> {
    let count = 0;
    for (const draft of drafts) {
      await this.create(draft, sessionKey);
      count += 1;
    }
    return count;
  },

  async remove(id: string): Promise<void> {
    await db.delete(totpAccounts).where(eq(totpAccounts.id, id));
  },
};
