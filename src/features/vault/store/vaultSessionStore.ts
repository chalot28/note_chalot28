import { create } from 'zustand';

interface VaultSessionState {
  isAppUnlocked: boolean;
  isVaultUnlocked: boolean;
  sessionKey: string | null;
  lastActiveAt: number;
  unlockApp: () => void;
  unlockVault: (masterKeyHex: string) => void;
  touchActivity: () => void;
  lockApp: () => void;
  lockAndWipe: () => void;
}

export const useVaultSessionStore = create<VaultSessionState>((set) => ({
  isAppUnlocked: false,
  isVaultUnlocked: false,
  sessionKey: null,
  lastActiveAt: Date.now(),

  unlockApp: () => set({ isAppUnlocked: true, lastActiveAt: Date.now() }),

  unlockVault: (masterKeyHex) =>
    set({
      isAppUnlocked: true,
      isVaultUnlocked: true,
      sessionKey: masterKeyHex,
      lastActiveAt: Date.now(),
    }),

  touchActivity: () => set({ lastActiveAt: Date.now() }),

  lockApp: () =>
    set({
      isAppUnlocked: false,
      isVaultUnlocked: false,
      sessionKey: null,
    }),

  lockAndWipe: () =>
    set({
      isVaultUnlocked: false,
      sessionKey: null,
    }),
}));
