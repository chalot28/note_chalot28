export interface EncryptedPayload {
  cipherText: string;
  iv: string;
  authTag: string;
}

const PBKDF2_ITERATIONS = 100_000;
const KEY_BIT_LENGTH = 256;
const IV_BYTE_LENGTH = 12;
const GCM_TAG_BYTE_LENGTH = 16;

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function fromHex(hex: string): Uint8Array {
  const clean = hex.trim();
  const out = new Uint8Array(Math.floor(clean.length / 2));
  for (let i = 0; i < out.length; i += 1) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16) || 0;
  }
  return out;
}

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i] ?? 0);
  }
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const out = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    out[i] = binary.charCodeAt(i);
  }
  return out;
}

function getSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error('Web Crypto SubtleCrypto không khả dụng trong môi trường này.');
  }
  return subtle;
}

export function generateRandomHex(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  globalThis.crypto.getRandomValues(bytes);
  return toHex(bytes);
}

export async function deriveKeyFromPin(pin: string, saltHex: string): Promise<string> {
  const subtle = getSubtle();
  const keyMaterial = await subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits'],
  );
  const bits = await subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: fromHex(saltHex),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_BIT_LENGTH,
  );
  return toHex(new Uint8Array(bits));
}

export async function hashPinWithSalt(pin: string, saltHex: string): Promise<string> {
  return deriveKeyFromPin(pin, saltHex);
}

export async function verifyPinHash(
  pin: string,
  saltHex: string,
  expectedHashHex: string,
): Promise<boolean> {
  const candidate = await deriveKeyFromPin(pin, saltHex);
  if (candidate.length !== expectedHashHex.length) return false;
  let diff = 0;
  for (let i = 0; i < candidate.length; i += 1) {
    diff |= candidate.charCodeAt(i) ^ expectedHashHex.charCodeAt(i);
  }
  return diff === 0;
}

export async function encryptAesGcm(
  plainText: string,
  masterKeyHex: string,
): Promise<EncryptedPayload> {
  const subtle = getSubtle();
  const iv = new Uint8Array(IV_BYTE_LENGTH);
  globalThis.crypto.getRandomValues(iv);

  const cryptoKey = await subtle.importKey(
    'raw',
    fromHex(masterKeyHex),
    { name: 'AES-GCM' },
    false,
    ['encrypt'],
  );

  const encryptedBuf = await subtle.encrypt(
    { name: 'AES-GCM', iv, tagLength: GCM_TAG_BYTE_LENGTH * 8 },
    cryptoKey,
    new TextEncoder().encode(plainText),
  );
  const combined = new Uint8Array(encryptedBuf);
  const splitIdx = Math.max(0, combined.length - GCM_TAG_BYTE_LENGTH);
  const cipherBytes = combined.slice(0, splitIdx);
  const authTagBytes = combined.slice(splitIdx);

  return {
    cipherText: toBase64(cipherBytes),
    iv: toBase64(iv),
    authTag: toBase64(authTagBytes),
  };
}

export async function decryptAesGcm(
  payload: EncryptedPayload,
  masterKeyHex: string,
): Promise<string> {
  const subtle = getSubtle();
  const iv = fromBase64(payload.iv);
  const cipherBytes = fromBase64(payload.cipherText);
  const authTagBytes = fromBase64(payload.authTag);

  const combined = new Uint8Array(cipherBytes.length + authTagBytes.length);
  combined.set(cipherBytes, 0);
  combined.set(authTagBytes, cipherBytes.length);

  const cryptoKey = await subtle.importKey(
    'raw',
    fromHex(masterKeyHex),
    { name: 'AES-GCM' },
    false,
    ['decrypt'],
  );

  const plainBuf = await subtle.decrypt(
    { name: 'AES-GCM', iv, tagLength: GCM_TAG_BYTE_LENGTH * 8 },
    cryptoKey,
    combined,
  );
  return new TextDecoder().decode(plainBuf);
}
