import React, { useEffect, useMemo, useState } from 'react';
import { AppState, Platform, StyleSheet } from 'react-native';
import { DarkTheme, DefaultTheme, ThemeProvider, type Theme } from '@react-navigation/native';
import { Stack, useRootNavigationState, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { runMigrations } from '@/core/db/migrations';
import { initializeNotifications, registerNotificationHandlers } from '@/core/notifications/notifee.setup';
import { ReminderBannerHost } from '@/core/notifications/ReminderBannerHost';
import { reminderScheduler } from '@/core/notifications/reminder.scheduler';
import { PrivacyShieldOverlay } from '@/core/security/PrivacyShieldOverlay';
import { secureStorage } from '@/core/storage/secure.storage';
import { useThemeStore } from '@/core/theme/themeStore';
import { taskRepository } from '@/features/planner/services/task.repository';
import { useVaultSessionStore } from '@/features/vault/store/vaultSessionStore';
import { GlassSheetProvider } from '@/shared/components/glass/GlassSheetProvider';
import { LiquidMeshCanvas } from '@/shared/components/glass/LiquidMeshCanvas';
import { SECURE_KEYS } from '@/shared/constants/storage.keys';

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const isDark = useThemeStore((s) => s.isDark);
  const accentColor = useThemeStore((s) => s.accentColor);
  const isAppUnlocked = useVaultSessionStore((s) => s.isAppUnlocked);
  const unlockApp = useVaultSessionStore((s) => s.unlockApp);
  const lockApp = useVaultSessionStore((s) => s.lockApp);
  const segments = useSegments();
  const router = useRouter();
  const rootNavState = useRootNavigationState();

  const navigationTheme = useMemo<Theme>(() => {
    const base = isDark ? DarkTheme : DefaultTheme;
    return {
      ...base,
      dark: isDark,
      colors: {
        ...base.colors,
        primary: accentColor,
        background: 'transparent',
        card: 'transparent',
      },
    };
  }, [accentColor, isDark]);

  useEffect(() => {
    runMigrations();
    void initializeNotifications();
    void taskRepository.getPendingReminders().then((pending) => {
      for (const task of pending) {
        void reminderScheduler.scheduleTaskReminder(task);
      }
    });
    const unsubscribeNotif = registerNotificationHandlers({
      onMarkDone: async (taskId) => {
        await taskRepository.toggleComplete(taskId);
      },
      onSnooze15m: async (taskId) => {
        const task = await taskRepository.getById(taskId);
        if (task) await reminderScheduler.rescheduleSnooze(task, 15);
      },
    });

    void secureStorage
      .getItem(SECURE_KEYS.MAIN_PIN_HASH)
      .then((pinHash) => {
        if (!pinHash) {
          unlockApp();
        }
      })
      .finally(() => setReady(true));

    return () => unsubscribeNotif();
  }, [unlockApp]);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const styleId = 'liquid-notes-web-focus-reset';
    if (document.getElementById(styleId)) return;
    const styleEl = document.createElement('style');
    styleEl.id = styleId;
    styleEl.textContent = 'input:focus, textarea:focus { outline: none !important; box-shadow: none !important; }';
    document.head.appendChild(styleEl);
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'background') {
        void secureStorage.getItem(SECURE_KEYS.MAIN_PIN_HASH).then((pinHash) => {
          if (pinHash) lockApp();
        });
      }
    });
    return () => sub.remove();
  }, [lockApp]);

  useEffect(() => {
    if (!ready || !rootNavState?.key) return;
    const inAuthGroup = segments[0] === '(auth)';
    if (!isAppUnlocked && !inAuthGroup) {
      router.replace('/(auth)/lock');
    }
  }, [isAppUnlocked, ready, rootNavState?.key, router, segments]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <GlassSheetProvider>
          <StatusBar style={isDark ? 'light' : 'dark'} />
          <LiquidMeshCanvas />
          <ThemeProvider value={navigationTheme}>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: 'transparent' },
                animation: 'fade',
              }}
            />
          </ThemeProvider>
          <PrivacyShieldOverlay />
          <ReminderBannerHost />
        </GlassSheetProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
