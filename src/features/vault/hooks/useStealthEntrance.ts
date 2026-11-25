import { useCallback } from 'react';
import { Platform } from 'react-native';
import {
  decryptAesGcm,
  deriveKeyFromPin,
  encryptAesGcm,
  generateRandomHex,
  hashPinWithSalt,
  verifyPinHash,
  type EncryptedPayload,
} from '@/core/security/aes.cipher';
import { authenticateWithBiometrics } from '@/core/security/biometric.service';
import { secureStorage } from '@/core/storage/secure.storage';
import { useVaultSessionStore } from '@/features/vault/store/vaultSessionStore';
import type { PinAuthMode, PinVerificationOutcome } from '@/features/vault/types/vault.types';
import { SECURE_KEYS } from '@/shared/constants/storage.keys';

interface StoredPinRecord {
  v?: number;
  salt: string;
  hash: string;
}

interface WrappedMasterKeyRecord {
  v: number;
  salt: string;
  payload: EncryptedPayload;
}

interface LockoutState {
  failedAttempts: number;
  lockedUntil: number;
}

const MAX_ATTEMPTS_TIER_1 = 5;
const MAX_ATTEMPTS_TIER_2 = 8;
const MAX_ATTEMPTS_TIER_3 = 10;

function computeLockoutDurationMs(attempts: number): number {
  if (attempts >= MAX_ATTEMPTS_TIER_3) return 5 * 60 * 1000;
  if (attempts >= MAX_ATTEMPTS_TIER_2) return 2 * 60 * 1000;
  if (attempts >= MAX_ATTEMPTS_TIER_1) return 30 * 1000;
  return 0;
}

async function readLockoutState(): Promise<LockoutState> {
  const raw = await secureStorage.getItem(SECURE_KEYS.PIN_LOCKOUT_STATE);
  if (!raw) return { failedAttempts: 0, lockedUntil: 0 };
  try {
    const parsed = JSON.parse(raw) as Partial<LockoutState>;
    return {
      failedAttempts: typeof parsed.failedAttempts === 'number' ? parsed.failedAttempts : 0,
      lockedUntil: typeof parsed.lockedUntil === 'number' ? parsed.lockedUntil : 0,
    };
  } catch {
    return { failedAttempts: 0, lockedUntil: 0 };
  }
}

async function recordFailedAttempt(): Promise<LockoutState> {
  const current = await readLockoutState();
  const failedAttempts = current.failedAttempts + 1;
  const durationMs = computeLockoutDurationMs(failedAttempts);
  const next: LockoutState = {
    failedAttempts,
    lockedUntil: durationMs > 0 ? Date.now() + durationMs : 0,
  };
  await secureStorage.setItem(SECURE_KEYS.PIN_LOCKOUT_STATE, JSON.stringify(next));
  return next;
}

async function resetLockout(): Promise<void> {
  await secureStorage.removeItem(SECURE_KEYS.PIN_LOCKOUT_STATE);
}

async function readPinRecord(key: string): Promise<StoredPinRecord | null> {
  const raw = await secureStorage.getItem(key);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<StoredPinRecord>;
    if (parsed.v === 2 && parsed.salt && parsed.hash) {
      return { v: 2, salt: parsed.salt, hash: parsed.hash };
    }
    return null;
  } catch {
    return null;
  }
}

async function isBiometricAllowed(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const pref = await secureStorage.getItem(SECURE_KEYS.BIOMETRIC_ENABLED);
  return pref !== 'false';
}

async function wrapAndStoreMasterKey(masterKeyHex: string, pin: string): Promise<void> {
  const kekSalt = generateRandomHex(16);
  const kekHex = await deriveKeyFromPin(pin, kekSalt);
  const payload = await encryptAesGcm(masterKeyHex, kekHex);
  const wrapped: WrappedMasterKeyRecord = { v: 1, salt: kekSalt, payload };
  await secureStorage.setItem(SECURE_KEYS.VAULT_WRAPPED_KEY, JSON.stringify(wrapped));

  if (await isBiometricAllowed()) {
    await secureStorage.setItem(SECURE_KEYS.VAULT_MASTER_KEY, masterKeyHex);
  } else {
    await secureStorage.removeItem(SECURE_KEYS.VAULT_MASTER_KEY);
  }
}

async function unwrapMasterKeyWithPin(pin: string): Promise<string | null> {
  const rawWrapped = await secureStorage.getItem(SECURE_KEYS.VAULT_WRAPPED_KEY);
  if (rawWrapped) {
    try {
      const parsed = JSON.parse(rawWrapped) as Partial<WrappedMasterKeyRecord>;
      if (parsed.v === 1 && parsed.salt && parsed.payload) {
        const kekHex = await deriveKeyFromPin(pin, parsed.salt);
        const masterKey = await decryptAesGcm(parsed.payload, kekHex);
        if (Platform.OS === 'web') {
          await secureStorage.removeItem(SECURE_KEYS.VAULT_MASTER_KEY);
        }
        return masterKey;
      }
    } catch {
      return null;
    }
  }

  // One-time migration from legacy unwrapped VAULT_MASTER_KEY
  const legacyKey = await secureStorage.getItem(SECURE_KEYS.VAULT_MASTER_KEY);
  if (legacyKey) {
    await wrapAndStoreMasterKey(legacyKey, pin);
    return legacyKey;
  }

  const fresh = generateRandomHex(32);
  await wrapAndStoreMasterKey(fresh, pin);
  return fresh;
}

export function useStealthEntrance() {
  const unlockApp = useVaultSessionStore((s) => s.unlockApp);
  const unlockVault = useVaultSessionStore((s) => s.unlockVault);

  const hasMainPin = useCallback(async (): Promise<boolean> => {
    return (await readPinRecord(SECURE_KEYS.MAIN_PIN_HASH)) !== null;
  }, []);

  const hasVaultPin = useCallback(async (): Promise<boolean> => {
    return (await readPinRecord(SECURE_KEYS.VAULT_PIN_HASH)) !== null;
  }, []);

  const getLockoutRemainingSeconds = useCallback(async (): Promise<number> => {
    const state = await readLockoutState();
    const diff = state.lockedUntil - Date.now();
    return diff > 0 ? Math.ceil(diff / 1000) : 0;
  }, []);

  const setupMainPin = useCallback(
    async (pin: string) => {
      const salt = generateRandomHex(16);
      const hash = await hashPinWithSalt(pin, salt);
      await secureStorage.setItem(SECURE_KEYS.MAIN_PIN_HASH, JSON.stringify({ v: 2, salt, hash }));
      await resetLockout();
      unlockApp();
    },
    [unlockApp],
  );

  const setupVaultPin = useCallback(
    async (pin: string, existingMasterKey?: string | null) => {
      const salt = generateRandomHex(16);
      const hash = await hashPinWithSalt(pin, salt);
      await secureStorage.setItem(SECURE_KEYS.VAULT_PIN_HASH, JSON.stringify({ v: 2, salt, hash }));

      let masterKey = existingMasterKey ?? useVaultSessionStore.getState().sessionKey;
      if (!masterKey) {
        masterKey = (await secureStorage.getItem(SECURE_KEYS.VAULT_MASTER_KEY)) ?? generateRandomHex(32);
      }
      await wrapAndStoreMasterKey(masterKey, pin);
      await resetLockout();
    },
    [],
  );

  const verifyExistingPin = useCallback(
    async (pin: string, kind: 'main' | 'vault'): Promise<'valid' | 'invalid' | 'locked_out'> => {
      const lockout = await readLockoutState();
      if (lockout.lockedUntil > Date.now()) {
        return 'locked_out';
      }

      const key = kind === 'vault' ? SECURE_KEYS.VAULT_PIN_HASH : SECURE_KEYS.MAIN_PIN_HASH;
      const record = await readPinRecord(key);
      if (!record) return 'invalid';

      const ok = await verifyPinHash(pin, record.salt, record.hash);
      if (!ok) {
        await recordFailedAttempt();
        return 'invalid';
      }

      await resetLockout();
      if (kind === 'vault') {
        const masterKey = await unwrapMasterKeyWithPin(pin);
        if (masterKey) unlockVault(masterKey);
      }
      return 'valid';
    },
    [unlockVault],
  );

  const verifyPin = useCallback(
    async (pin: string, mode: PinAuthMode): Promise<PinVerificationOutcome> => {
      const lockout = await readLockoutState();
      if (lockout.lockedUntil > Date.now()) {
        return 'locked_out';
      }

      if (mode === 'stealth_vault') {
        const vaultRecord = await readPinRecord(SECURE_KEYS.VAULT_PIN_HASH);
        if (vaultRecord && (await verifyPinHash(pin, vaultRecord.salt, vaultRecord.hash))) {
          const masterKey = await unwrapMasterKeyWithPin(pin);
          if (!masterKey) {
            await recordFailedAttempt();
            return 'invalid';
          }
          await resetLockout();
          unlockVault(masterKey);
          return 'vault_unlocked';
        }
        await recordFailedAttempt();
        return 'invalid';
      }

      if (mode === 'main_app') {
        const mainRecord = await readPinRecord(SECURE_KEYS.MAIN_PIN_HASH);
        if (mainRecord && (await verifyPinHash(pin, mainRecord.salt, mainRecord.hash))) {
          await resetLockout();
          unlockApp();
          return 'main_unlocked';
        }
        await recordFailedAttempt();
        return 'invalid';
      }

      return 'invalid';
    },
    [unlockApp, unlockVault],
  );

  const unlockWithBiometrics = useCallback(
    async (mode: PinAuthMode): Promise<PinVerificationOutcome> => {
      if (!(await isBiometricAllowed())) return 'invalid';

      if (mode === 'stealth_vault') {
        const vaultRecord = await readPinRecord(SECURE_KEYS.VAULT_PIN_HASH);
        const bioMasterKey = await secureStorage.getItem(SECURE_KEYS.VAULT_MASTER_KEY);
        if (!vaultRecord || !bioMasterKey) return 'invalid';

        const ok = await authenticateWithBiometrics('Xác thực để mở Không gian riêng');
        if (!ok) return 'invalid';

        await resetLockout();
        unlockVault(bioMasterKey);
        return 'vault_unlocked';
      }

      const mainRecord = await readPinRecord(SECURE_KEYS.MAIN_PIN_HASH);
      if (!mainRecord) return 'invalid';

      const ok = await authenticateWithBiometrics('Xác thực để mở Liquid Notes');
      if (!ok) return 'invalid';

      await resetLockout();
      unlockApp();
      return 'main_unlocked';
    },
    [unlockApp, unlockVault],
  );

  const setBiometricPreference = useCallback(async (enabled: boolean): Promise<boolean> => {
    if (Platform.OS === 'web') return false;

    const hasAnyPin =
      (await readPinRecord(SECURE_KEYS.MAIN_PIN_HASH)) !== null ||
      (await readPinRecord(SECURE_KEYS.VAULT_PIN_HASH)) !== null;

    if (hasAnyPin) {
      const ok = await authenticateWithBiometrics('Xác thực để thay đổi cài đặt sinh trắc học');
      if (!ok) return false;
    }

    await secureStorage.setItem(SECURE_KEYS.BIOMETRIC_ENABLED, enabled ? 'true' : 'false');
    if (!enabled) {
      await secureStorage.removeItem(SECURE_KEYS.VAULT_MASTER_KEY);
    } else {
      const currentSessionKey = useVaultSessionStore.getState().sessionKey;
      if (currentSessionKey) {
        await secureStorage.setItem(SECURE_KEYS.VAULT_MASTER_KEY, currentSessionKey);
      }
    }
    return true;
  }, []);

  return {
    hasMainPin,
    hasVaultPin,
    getLockoutRemainingSeconds,
    setupMainPin,
    setupVaultPin,
    verifyExistingPin,
    verifyPin,
    unlockWithBiometrics,
    setBiometricPreference,
  };
}
