import * as OTPAuth from 'otpauth';
import type { TotpAlgorithm, TotpDraft } from '@/features/authenticator/types/totp.types';
import { isValidBase32, normalizeBase32Secret } from '@/shared/utils/base32.utils';

function normalizeAlgorithm(raw: string): TotpAlgorithm {
  const upper = raw.toUpperCase();
  if (upper === 'SHA256') return 'SHA256';
  if (upper === 'SHA512') return 'SHA512';
  return 'SHA1';
}

export function parseOtpAuthUri(uri: string): TotpDraft {
  const parsed = OTPAuth.URI.parse(uri.trim());
  const isHotp = parsed instanceof OTPAuth.HOTP;

  return {
    issuer: parsed.issuer || '',
    label: parsed.label || parsed.issuer || 'Tài khoản 2FA',
    secret: parsed.secret.base32,
    digits: parsed.digits,
    period: isHotp ? 30 : parsed.period,
    algorithm: normalizeAlgorithm(parsed.algorithm),
    type: isHotp ? 'hotp' : 'totp',
    counter: isHotp ? parsed.counter : 0,
  };
}

export interface BulkParseResult {
  valid: TotpDraft[];
  invalidLines: number[];
}

export function parseBulkSecretLines(rawText: string): BulkParseResult {
  const lines = rawText.split(/\r?\n/);
  const valid: TotpDraft[] = [];
  const invalidLines: number[] = [];

  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    if (trimmed.toLowerCase().startsWith('otpauth://')) {
      try {
        valid.push(parseOtpAuthUri(trimmed));
      } catch {
        invalidLines.push(index + 1);
      }
      return;
    }

    const pipeParts = trimmed.split('|');
    const colonParts = pipeParts.length === 1 ? trimmed.split(':') : null;
    const parts = pipeParts.length >= 2 ? pipeParts : colonParts;

    let label = `Tài khoản #${valid.length + 1}`;
    let secretCandidate = trimmed;

    if (parts && parts.length >= 2) {
      label = parts[0]?.trim() || label;
      secretCandidate = parts.slice(1).join('').trim();
    }

    const normalized = normalizeBase32Secret(secretCandidate);
    if (!isValidBase32(normalized)) {
      invalidLines.push(index + 1);
      return;
    }

    valid.push({
      issuer: '',
      label,
      secret: normalized,
      digits: 6,
      period: 30,
      algorithm: 'SHA1',
      type: 'totp',
      counter: 0,
    });
  });

  return { valid, invalidLines };
}
