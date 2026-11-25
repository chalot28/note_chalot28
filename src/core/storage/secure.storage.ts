import * as SecureStore from 'expo-secure-store';
import { SECURE_KEYS } from '@/shared/constants/storage.keys';

const SECURE_OPTIONS: SecureStore.SecureStoreOptions = {
  keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
};

export const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    return SecureStore.getItemAsync(key, SECURE_OPTIONS);
  },
  async setItem(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value, SECURE_OPTIONS);
  },
  async removeItem(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key, SECURE_OPTIONS);
  },
  async getAiApiKey(providerId: string): Promise<string | null> {
    return SecureStore.getItemAsync(`${SECURE_KEYS.AI_API_KEY_PREFIX}${providerId}`, SECURE_OPTIONS);
  },
  async setAiApiKey(providerId: string, apiKey: string): Promise<void> {
    const key = `${SECURE_KEYS.AI_API_KEY_PREFIX}${providerId}`;
    if (!apiKey.trim()) {
      await SecureStore.deleteItemAsync(key, SECURE_OPTIONS);
      return;
    }
    await SecureStore.setItemAsync(key, apiKey.trim(), SECURE_OPTIONS);
  },
};
