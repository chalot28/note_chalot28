import {
  decryptAesGcm,
  encryptAesGcm,
  generateRandomHex,
  type EncryptedPayload,
} from '@/core/security/aes.cipher';
import { secureStorage } from '@/core/storage/secure.storage';
import { SECURE_KEYS } from '@/shared/constants/storage.keys';

export interface EncryptedNoteEnvelope extends EncryptedPayload {
  __enc: 1;
}

export interface DecryptedNoteFields {
  title: string;
  html: string;
  plainText: string;
  excerpt: string;
  tags: string[];
  backlinks: string[];
  embeddedSheetIds: string[];
}

let cachedNoteKey: string | null = null;

export async function getOrCreateNoteDataKey(): Promise<string> {
  if (cachedNoteKey) return cachedNoteKey;
  const existing = await secureStorage.getItem(SECURE_KEYS.NOTE_DATA_KEY);
  if (existing) {
    cachedNoteKey = existing;
    return existing;
  }
  const fresh = generateRandomHex(32);
  await secureStorage.setItem(SECURE_KEYS.NOTE_DATA_KEY, fresh);
  cachedNoteKey = fresh;
  return fresh;
}

export async function encryptNoteFields(fields: DecryptedNoteFields): Promise<string> {
  const key = await getOrCreateNoteDataKey();
  const payload = await encryptAesGcm(JSON.stringify(fields), key);
  const envelope: EncryptedNoteEnvelope = { __enc: 1, ...payload };
  return JSON.stringify(envelope);
}

export async function tryDecryptNoteFields(rawContentJson: string): Promise<DecryptedNoteFields | null> {
  let parsed: Partial<EncryptedNoteEnvelope> | null = null;
  try {
    parsed = JSON.parse(rawContentJson) as Partial<EncryptedNoteEnvelope>;
  } catch {
    return null;
  }

  if (
    !parsed ||
    parsed.__enc !== 1 ||
    typeof parsed.cipherText !== 'string' ||
    typeof parsed.iv !== 'string' ||
    typeof parsed.authTag !== 'string'
  ) {
    return null;
  }

  const key = await getOrCreateNoteDataKey();
  const plainJson = await decryptAesGcm(
    {
      cipherText: parsed.cipherText,
      iv: parsed.iv,
      authTag: parsed.authTag,
    },
    key,
  );
  const data = JSON.parse(plainJson) as Partial<DecryptedNoteFields>;
  return {
    title: typeof data.title === 'string' ? data.title : '',
    html: typeof data.html === 'string' ? data.html : '',
    plainText: typeof data.plainText === 'string' ? data.plainText : '',
    excerpt: typeof data.excerpt === 'string' ? data.excerpt : '',
    tags: Array.isArray(data.tags) ? data.tags.filter((v): v is string => typeof v === 'string') : [],
    backlinks: Array.isArray(data.backlinks)
      ? data.backlinks.filter((v): v is string => typeof v === 'string')
      : [],
    embeddedSheetIds: Array.isArray(data.embeddedSheetIds)
      ? data.embeddedSheetIds.filter((v): v is string => typeof v === 'string')
      : [],
  };
}
