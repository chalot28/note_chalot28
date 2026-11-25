import React, { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { Redirect, Stack } from 'expo-router';
import { useVaultScreenGuard } from '@/core/security/screenCapture.guard';
import { useVaultSessionStore } from '@/features/vault/store/vaultSessionStore';

const VAULT_IDLE_TIMEOUT_MS = 2 * 60 * 1000;

export default function VaultLayout() {
  useVaultScreenGuard('liquid-vault-protected');
  const isVaultUnlocked = useVaultSessionStore((s) => s.isVaultUnlocked);
  const sessionKey = useVaultSessionStore((s) => s.sessionKey);
  const lockAndWipe = useVaultSessionStore((s) => s.lockAndWipe);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'background') {
        lockAndWipe();
      }
    });

    const handleVisibility = () => {
      if (typeof document !== 'undefined' && document.hidden) {
        lockAndWipe();
      }
    };
    if (Platform.OS === 'web' && typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibility);
    }

    const idleTimer = setInterval(() => {
      const { isVaultUnlocked: unlocked, lastActiveAt } = useVaultSessionStore.getState();
      if (unlocked && Date.now() - lastActiveAt > VAULT_IDLE_TIMEOUT_MS) {
        lockAndWipe();
      }
    }, 5000);

    return () => {
      sub.remove();
      clearInterval(idleTimer);
      if (Platform.OS === 'web' && typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibility);
      }
      lockAndWipe();
    };
  }, [lockAndWipe]);

  if (!isVaultUnlocked || !sessionKey) {
    return <Redirect href="/(auth)/lock?mode=stealth_vault" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' },
        animation: 'fade',
      }}
    />
  );
}
