import QuickCrypto from 'react-native-quick-crypto';

const CryptoBuffer = QuickCrypto.Buffer;

export interface EncryptedPayload {
  cipherText: string;
  iv: string;
  authTag: string;
}

const AES_ALGORITHM = 'aes-256-gcm';
const IV_BYTE_LENGTH = 12;
const KEY_BYTE_LENGTH = 32;
const PBKDF2_ITERATIONS = 100_000;

export function generateRandomHex(byteLength = KEY_BYTE_LENGTH): string {
  const bytes = QuickCrypto.randomBytes(byteLength);
  return CryptoBuffer.from(bytes).toString('hex');
}

export async function deriveKeyFromPin(pin: string, saltHex: string): Promise<string> {
  const salt = CryptoBuffer.from(saltHex, 'hex');
  const derived = QuickCrypto.pbkdf2Sync(pin, salt, PBKDF2_ITERATIONS, KEY_BYTE_LENGTH, 'sha256');
  return CryptoBuffer.from(derived).toString('hex');
}

export async function hashPinWithSalt(pin: string, saltHex: string): Promise<string> {
  return deriveKeyFromPin(pin, saltHex);
}

export async function verifyPinHash(
  pin: string,
  saltHex: string,
  expectedHashHex: string,
): Promise<boolean> {
  const candidateHex = await deriveKeyFromPin(pin, saltHex);
  const candidateBuf = CryptoBuffer.from(candidateHex, 'hex');
  const expectedBuf = CryptoBuffer.from(expectedHashHex, 'hex');
  if (candidateBuf.length !== expectedBuf.length) {
    return false;
  }
  return QuickCrypto.timingSafeEqual(candidateBuf, expectedBuf);
}

export async function encryptAesGcm(
  plainText: string,
  masterKeyHex: string,
): Promise<EncryptedPayload> {
  const key = CryptoBuffer.from(masterKeyHex, 'hex');
  const iv = CryptoBuffer.from(QuickCrypto.randomBytes(IV_BYTE_LENGTH));
  const cipher = QuickCrypto.createCipheriv(AES_ALGORITHM, key, iv);

  const encrypted = CryptoBuffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    cipherText: encrypted.toString('base64'),
    iv: iv.toString('base64'),
    authTag: CryptoBuffer.from(authTag).toString('base64'),
  };
}

export async function decryptAesGcm(
  payload: EncryptedPayload,
  masterKeyHex: string,
): Promise<string> {
  const key = CryptoBuffer.from(masterKeyHex, 'hex');
  const iv = CryptoBuffer.from(payload.iv, 'base64');
  const authTag = CryptoBuffer.from(payload.authTag, 'base64');
  const cipherBytes = CryptoBuffer.from(payload.cipherText, 'base64');

  const decipher = QuickCrypto.createDecipheriv(AES_ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);

  const decrypted = CryptoBuffer.concat([decipher.update(cipherBytes), decipher.final()]);
  return decrypted.toString('utf8');
}
