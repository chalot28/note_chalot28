import type { StateStorage } from 'zustand/middleware';

const mem = new Map<string, string>();

function read(key: string): string | undefined {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem(key) ?? undefined;
    }
  } catch {
    // ignore
  }
  return mem.get(key);
}

function write(key: string, value: string): void {
  mem.set(key, value);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // ignore
  }
}

function del(key: string): void {
  mem.delete(key);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(key);
    }
  } catch {
    // ignore
  }
}

export const mmkvStorage = {
  getString: (key: string): string | undefined => read(key),
  setString: (key: string, value: string): void => write(key, value),
  getNumber: (key: string): number | undefined => {
    const raw = read(key);
    return raw !== undefined ? Number(raw) : undefined;
  },
  setNumber: (key: string, value: number): void => write(key, String(value)),
  getObject<T>(key: string): T | null {
    const raw = read(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },
  setObject: <T,>(key: string, value: T): void => write(key, JSON.stringify(value)),
  remove: (key: string): void => del(key),
};

export const zustandMmkvStorage: StateStorage = {
  getItem: (name: string): string | null => read(name) ?? null,
  setItem: (name: string, value: string): void => write(name, value),
  removeItem: (name: string): void => del(name),
};
