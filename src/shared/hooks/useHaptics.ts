import { useCallback } from 'react';
import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

function runHaptic(fn: () => Promise<void>): void {
  if (Platform.OS === 'web') return;
  void fn().catch(() => undefined);
}

export function useHaptics() {
  const light = useCallback(() => {
    runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light));
  }, []);

  const medium = useCallback(() => {
    runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
  }, []);

  const heavy = useCallback(() => {
    runHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy));
  }, []);

  const selection = useCallback(() => {
    runHaptic(() => Haptics.selectionAsync());
  }, []);

  const success = useCallback(() => {
    runHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success));
  }, []);

  const warning = useCallback(() => {
    runHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning));
  }, []);

  const error = useCallback(() => {
    runHaptic(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error));
  }, []);

  return { light, medium, heavy, selection, success, warning, error };
}
