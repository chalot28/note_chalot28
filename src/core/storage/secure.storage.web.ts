import { SECURE_KEYS } from '@/shared/constants/storage.keys';

const memoryFallback = new Map<string, string>();

function readStore(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key);
    }
  } catch {
    // ignore storage access errors
  }
  return memoryFallback.get(key) ?? null;
}

function writeStore(key: string, value: string): void {
  memoryFallback.set(key, value);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // ignore storage quota errors
  }
}

function removeStore(key: string): void {
  memoryFallback.delete(key);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    return readStore(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    writeStore(key, value);
  },
  async removeItem(key: string): Promise<void> {
    removeStore(key);
  },
  async getAiApiKey(providerId: string): Promise<string | null> {
    return readStore(`${SECURE_KEYS.AI_API_KEY_PREFIX}${providerId}`);
  },
  async setAiApiKey(providerId: string, apiKey: string): Promise<void> {
    const key = `${SECURE_KEYS.AI_API_KEY_PREFIX}${providerId}`;
    if (!apiKey.trim()) {
      removeStore(key);
      return;
    }
    writeStore(key, apiKey.trim());
  },
};
