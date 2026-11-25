import assert from 'node:assert/strict';
import nodeCrypto from 'node:crypto';
import test from 'node:test';
import {
  decryptAesGcm,
  deriveKeyFromPin,
  encryptAesGcm,
  generateRandomHex,
  hashPinWithSalt,
  verifyPinHash,
} from '../src/core/security/aes.cipher.web.ts';

const TEST_MASTER_KEY = '0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef';

test('generateRandomHex returns cryptographically distinct hex strings of expected byte length', () => {
  const seen = new Set();
  for (let i = 0; i < 64; i += 1) {
    const hex = generateRandomHex(32);
    assert.equal(hex.length, 64);
    assert.match(hex, /^[0-9a-f]{64}$/);
    assert.equal(seen.has(hex), false);
    seen.add(hex);
  }
  assert.equal(generateRandomHex(16).length, 32);
});

test('deriveKeyFromPin and verifyPinHash match Node PBKDF2-SHA256 (100k iterations)', async () => {
  const pin = '258046';
  const saltHex = 'aabbccddeeff00112233445566778899';

  const derivedWeb = await deriveKeyFromPin(pin, saltHex);
  const derivedNode = nodeCrypto
    .pbkdf2Sync(pin, Buffer.from(saltHex, 'hex'), 100_000, 32, 'sha256')
    .toString('hex');

  assert.equal(derivedWeb, derivedNode);
  assert.equal(derivedWeb.length, 64);

  const hash = await hashPinWithSalt(pin, saltHex);
  assert.equal(await verifyPinHash(pin, saltHex, hash), true);
  assert.equal(await verifyPinHash('000000', saltHex, hash), false);
  assert.equal(await verifyPinHash(pin, '11111111111111111111111111111111', hash), false);
  assert.equal(await verifyPinHash(pin, saltHex, 'deadbeef'), false);
});

test('encryptAesGcm and decryptAesGcm roundtrip all payload variants', async () => {
  const variants = [
    '',
    'hello world',
    'Ghi chú mật khẩu 🔐 Tiếng Việt có dấu: ăâđêôơư',
    JSON.stringify({ secret: 'JBSWY3DPEHPK3PXP', issuer: 'GitHub', digits: 6 }),
    'A'.repeat(65_536),
  ];

  for (const plainText of variants) {
    const payload = await encryptAesGcm(plainText, TEST_MASTER_KEY);
    assert.ok(payload.iv.length > 0);
    assert.ok(payload.authTag.length > 0);
    const decrypted = await decryptAesGcm(payload, TEST_MASTER_KEY);
    assert.equal(decrypted, plainText);
  }
});

test('encryptAesGcm produces unique random IV and ciphertext on repeated encryptions', async () => {
  const ivs = new Set();
  const ciphers = new Set();
  for (let i = 0; i < 32; i += 1) {
    const payload = await encryptAesGcm('identical-secret-text', TEST_MASTER_KEY);
    assert.equal(ivs.has(payload.iv), false);
    assert.equal(ciphers.has(payload.cipherText), false);
    ivs.add(payload.iv);
    ciphers.add(payload.cipherText);
  }
});

test('AES-256-GCM web implementation is 100% wire-compatible with Node/QuickCrypto native', async () => {
  const plainText = 'Cross-platform Vault Secret 🔑 123456';
  const webPayload = await encryptAesGcm(plainText, TEST_MASTER_KEY);

  // Decrypt web payload using Node crypto (mirrors aes.cipher.ts)
  const decipher = nodeCrypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(TEST_MASTER_KEY, 'hex'),
    Buffer.from(webPayload.iv, 'base64'),
  );
  decipher.setAuthTag(Buffer.from(webPayload.authTag, 'base64'));
  const nodePlain = Buffer.concat([
    decipher.update(Buffer.from(webPayload.cipherText, 'base64')),
    decipher.final(),
  ]).toString('utf8');
  assert.equal(nodePlain, plainText);

  // Encrypt with Node crypto and decrypt with Web SubtleCrypto
  const iv = nodeCrypto.randomBytes(12);
  const cipher = nodeCrypto.createCipheriv(
    'aes-256-gcm',
    Buffer.from(TEST_MASTER_KEY, 'hex'),
    iv,
  );
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const webDecrypted = await decryptAesGcm(
    {
      cipherText: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    },
    TEST_MASTER_KEY,
  );
  assert.equal(webDecrypted, plainText);
});

test('decryptAesGcm rejects tampered cipherText, authTag, IV, or wrong master key', async () => {
  const payload = await encryptAesGcm('top-secret-data', TEST_MASTER_KEY);

  const flipFirstByte = (b64) => {
    const buf = Buffer.from(b64, 'base64');
    buf[0] = (buf[0] ?? 0) ^ 0xff;
    return buf.toString('base64');
  };

  await assert.rejects(() =>
    decryptAesGcm({ ...payload, cipherText: flipFirstByte(payload.cipherText) }, TEST_MASTER_KEY),
  );
  await assert.rejects(() =>
    decryptAesGcm({ ...payload, authTag: flipFirstByte(payload.authTag) }, TEST_MASTER_KEY),
  );
  await assert.rejects(() =>
    decryptAesGcm({ ...payload, iv: flipFirstByte(payload.iv) }, TEST_MASTER_KEY),
  );

  const wrongKey = 'f'.repeat(64);
  await assert.rejects(() => decryptAesGcm(payload, wrongKey));
});
