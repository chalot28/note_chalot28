import { useEffect, useState } from 'react';
import { AppState, Platform, type AppStateStatus } from 'react-native';

export function useAppStateBlur(): {
  appState: AppStateStatus;
  isBlurred: boolean;
} {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [isWindowBlurred, setIsWindowBlurred] = useState<boolean>(
    Platform.OS === 'web' && typeof document !== 'undefined' ? document.hidden : false,
  );

  useEffect(() => {
    const changeSub = AppState.addEventListener('change', (nextState) => {
      setAppState(nextState);
      if (nextState === 'active') {
        setIsWindowBlurred(false);
      } else {
        setIsWindowBlurred(true);
      }
    });

    // Android-only: 'blur'/'focus' fire immediately on Recents / notification shade
    const blurSub =
      Platform.OS === 'android' ? AppState.addEventListener('blur', () => setIsWindowBlurred(true)) : null;
    const focusSub =
      Platform.OS === 'android' ? AppState.addEventListener('focus', () => setIsWindowBlurred(false)) : null;

    if (Platform.OS === 'web' && typeof window !== 'undefined' && typeof document !== 'undefined') {
      const handleVisibility = () => setIsWindowBlurred(document.hidden);
      const handleBlur = () => setIsWindowBlurred(true);
      const handleFocus = () => {
        if (!document.hidden) setIsWindowBlurred(false);
      };

      document.addEventListener('visibilitychange', handleVisibility);
      window.addEventListener('blur', handleBlur);
      window.addEventListener('focus', handleFocus);

      return () => {
        changeSub.remove();
        blurSub?.remove();
        focusSub?.remove();
        document.removeEventListener('visibilitychange', handleVisibility);
        window.removeEventListener('blur', handleBlur);
        window.removeEventListener('focus', handleFocus);
      };
    }

    return () => {
      changeSub.remove();
      blurSub?.remove();
      focusSub?.remove();
    };
  }, []);

  return {
    appState,
    isBlurred: isWindowBlurred || appState === 'inactive' || appState === 'background',
  };
}
