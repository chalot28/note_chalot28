import { MMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

export const mmkv = new MMKV({
  id: 'liquid-notes-mmkv',
});

export const mmkvStorage = {
  getString(key: string): string | undefined {
    return mmkv.getString(key);
  },
  setString(key: string, value: string): void {
    mmkv.set(key, value);
  },
  getNumber(key: string): number | undefined {
    return mmkv.getNumber(key);
  },
  setNumber(key: string, value: number): void {
    mmkv.set(key, value);
  },
  getObject<T>(key: string): T | null {
    const raw = mmkv.getString(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  setObject<T>(key: string, value: T): void {
    mmkv.set(key, JSON.stringify(value));
  },
  remove(key: string): void {
    mmkv.delete(key);
  },
};

export const zustandMmkvStorage: StateStorage = {
  getItem: (name: string): string | null => mmkv.getString(name) ?? null,
  setItem: (name: string, value: string): void => {
    mmkv.set(name, value);
  },
  removeItem: (name: string): void => {
    mmkv.delete(name);
  },
};
