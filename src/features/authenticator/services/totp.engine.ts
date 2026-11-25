import * as OTPAuth from 'otpauth';
import type {
  TotpAccountEntity,
  TotpAlgorithm,
  TotpGeneratedCode,
} from '@/features/authenticator/types/totp.types';
import { isValidBase32, normalizeBase32Secret } from '@/shared/utils/base32.utils';

export function formatOtpCode(code: string): string {
  if (code.length === 6) return `${code.slice(0, 3)} ${code.slice(3)}`;
  if (code.length === 8) return `${code.slice(0, 4)} ${code.slice(4)}`;
  return code;
}

export function computeTotpWindow(period = 30, timestampMs = Date.now()): {
  remainingSeconds: number;
  progress: number;
} {
  const safePeriod = Math.max(1, period);
  const elapsed = Math.floor(timestampMs / 1000) % safePeriod;
  const remainingSeconds = safePeriod - elapsed;
  return {
    remainingSeconds,
    progress: remainingSeconds / safePeriod,
  };
}

export function generateOtpForAccount(
  account: Pick<
    TotpAccountEntity,
    'issuer' | 'label' | 'secret' | 'digits' | 'period' | 'algorithm' | 'type' | 'counter'
  >,
  timestampMs = Date.now(),
): TotpGeneratedCode {
  const cleanSecret = normalizeBase32Secret(account.secret);
  const secretObj = OTPAuth.Secret.fromBase32(cleanSecret);

  if (account.type === 'hotp') {
    const hotp = new OTPAuth.HOTP({
      issuer: account.issuer,
      label: account.label,
      algorithm: account.algorithm,
      digits: account.digits,
      counter: account.counter,
      secret: secretObj,
    });
    const code = hotp.generate();
    return {
      code,
      formattedCode: formatOtpCode(code),
      remainingSeconds: 0,
      progress: 1,
    };
  }

  const totp = new OTPAuth.TOTP({
    issuer: account.issuer,
    label: account.label,
    algorithm: account.algorithm,
    digits: account.digits,
    period: account.period,
    secret: secretObj,
  });

  const code = totp.generate({ timestamp: timestampMs });
  const { remainingSeconds, progress } = computeTotpWindow(account.period, timestampMs);

  return {
    code,
    formattedCode: formatOtpCode(code),
    remainingSeconds,
    progress,
  };
}

export function previewTotpFromSecret(
  rawSecret: string,
  timestampMs = Date.now(),
  algorithm: TotpAlgorithm = 'SHA1',
): TotpGeneratedCode | null {
  if (!isValidBase32(rawSecret)) return null;
  try {
    return generateOtpForAccount(
      {
        issuer: '',
        label: 'Preview',
        secret: rawSecret,
        digits: 6,
        period: 30,
        algorithm,
        type: 'totp',
        counter: 0,
      },
      timestampMs,
    );
  } catch {
    return null;
  }
}
