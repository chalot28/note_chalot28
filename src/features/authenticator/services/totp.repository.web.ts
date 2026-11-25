import { decryptAesGcm, encryptAesGcm } from '@/core/security/aes.cipher';
import type { TotpAccountEntity, TotpAlgorithm, TotpDraft, TotpKind } from '@/features/authenticator/types/totp.types';
import { normalizeBase32Secret } from '@/shared/utils/base32.utils';
import { createId } from '@/shared/utils/id.utils';

interface StoredTotpRow {
  id: string;
  issuer: string;
  accountLabel: string;
  secretCipher: string;
  secretIv: string;
  secretTag: string;
  algorithm: string;
  digits: number;
  period: number;
  counter: number;
  kind: TotpKind;
  createdAt: number;
  updatedAt: number;
}

const KEY = 'liquid_web_totp_v1';

function readAll(): StoredTotpRow[] {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(KEY) : null;
    return raw ? (JSON.parse(raw) as StoredTotpRow[]) : [];
  } catch {
    return [];
  }
}

function writeAll(items: StoredTotpRow[]): void {
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export const totpRepository = {
  async getAll(sessionKey: string | null): Promise<TotpAccountEntity[]> {
    if (!sessionKey) throw new Error('Phiên khóa 2FA chưa được mở.');
    const sorted = readAll().sort((a, b) => b.createdAt - a.createdAt);
    return Promise.all(
      sorted.map(async (row) => ({
        id: row.id,
        issuer: row.issuer,
        label: row.accountLabel,
        secret: await decryptAesGcm(
          { cipherText: row.secretCipher, iv: row.secretIv, authTag: row.secretTag },
          sessionKey,
        ),
        digits: row.digits,
        period: row.period,
        algorithm: (row.algorithm as TotpAlgorithm) || 'SHA1',
        type: row.kind,
        counter: row.counter,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })),
    );
  },

  async create(draft: TotpDraft, sessionKey: string | null): Promise<TotpAccountEntity> {
    if (!sessionKey) throw new Error('Không thể lưu mã 2FA khi chưa mở khóa.');
    const now = Date.now();
    const secret = normalizeBase32Secret(draft.secret);
    const enc = await encryptAesGcm(secret, sessionKey);
    const row: StoredTotpRow = {
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
    writeAll([row, ...readAll()]);
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
    writeAll(readAll().filter((r) => r.id !== id));
  },
};
