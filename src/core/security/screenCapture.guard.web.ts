export async function enableScreenCaptureProtection(): Promise<void> {}

export async function disableScreenCaptureProtection(): Promise<void> {}

export function useVaultScreenGuard(): {
  isCaptureAlertActive: boolean;
  dismissCaptureAlert: () => void;
} {
  return {
    isCaptureAlertActive: false,
    dismissCaptureAlert: () => undefined,
  };
}
