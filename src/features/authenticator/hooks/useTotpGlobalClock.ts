import { useCallback, useEffect, useState } from 'react';
import { computeTotpWindow, generateOtpForAccount } from '@/features/authenticator/services/totp.engine';
import type { TotpAccountEntity, TotpGeneratedCode } from '@/features/authenticator/types/totp.types';

export function useTotpGlobalClock() {
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const defaultWindow = computeTotpWindow(30, nowMs);

  const getCode = useCallback(
    (account: TotpAccountEntity): TotpGeneratedCode => generateOtpForAccount(account, nowMs),
    [nowMs],
  );

  return {
    nowMs,
    remainingSeconds: defaultWindow.remainingSeconds,
    progress: defaultWindow.progress,
    getCode,
  };
}
