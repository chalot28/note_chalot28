import { useEffect, useState } from 'react';
import * as ScreenCapture from 'expo-screen-capture';

export async function enableScreenCaptureProtection(key = 'liquid-vault'): Promise<void> {
  await ScreenCapture.preventScreenCaptureAsync(key);
}

export async function disableScreenCaptureProtection(key = 'liquid-vault'): Promise<void> {
  await ScreenCapture.allowScreenCaptureAsync(key);
}

export function useVaultScreenGuard(guardKey = 'liquid-vault-route'): {
  isCaptureAlertActive: boolean;
  dismissCaptureAlert: () => void;
} {
  ScreenCapture.usePreventScreenCapture(guardKey);
  const [isCaptureAlertActive, setIsCaptureAlertActive] = useState(false);

  useEffect(() => {
    const subscription = ScreenCapture.addScreenshotListener(() => {
      setIsCaptureAlertActive(true);
    });
    return () => {
      subscription.remove();
    };
  }, []);

  return {
    isCaptureAlertActive,
    dismissCaptureAlert: () => setIsCaptureAlertActive(false),
  };
}
