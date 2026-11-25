import assert from 'node:assert/strict';
import test from 'node:test';
import { isValidBase32, normalizeBase32Secret } from '../src/shared/utils/base32.utils.ts';
import {
  computeTotpWindow,
  formatOtpCode,
  generateOtpForAccount,
  previewTotpFromSecret,
} from '../src/features/authenticator/services/totp.engine.ts';
import {
  parseBulkSecretLines,
  parseOtpAuthUri,
} from '../src/features/authenticator/services/otpauth.uri.parser.ts';

test('normalizeBase32Secret and isValidBase32 handle whitespace, hyphens, padding, and invalid inputs', () => {
  assert.equal(normalizeBase32Secret(' jbsw-y3dp ehpk.3pxp\n'), 'JBSWY3DPEHPK3PXP');
  assert.equal(isValidBase32('JBSWY3DPEHPK3PXP'), true);
  assert.equal(isValidBase32('jbsw y3dp ehpk 3pxp===='), true);
  assert.equal(isValidBase32('JBSWY3D'), false); // < 8 chars
  assert.equal(isValidBase32('JBSWY3DP0189'), false); // invalid base32 digits 0,1,8,9
  assert.equal(isValidBase32(''), false);
});

test('generateOtpForAccount matches RFC 6238 SHA1 8-digit test vector', () => {
  // RFC 6238 ASCII secret "12345678901234567890" -> Base32 "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ"
  const secret = 'GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ';
  const result = generateOtpForAccount(
    {
      issuer: 'RFC6238',
      label: 'test',
      secret,
      digits: 8,
      period: 30,
      algorithm: 'SHA1',
      type: 'totp',
      counter: 0,
    },
    59_000,
  );
  assert.equal(result.code, '94287082');
  assert.equal(result.formattedCode, '9428 7082');
  assert.equal(result.remainingSeconds, 1);
});

test('generateOtpForAccount supports SHA1, SHA256, SHA512, 6/8 digits, and HOTP counters', () => {
  const base = {
    issuer: 'App',
    label: 'user@example.com',
    secret: 'JBSWY3DPEHPK3PXP',
    period: 30,
  };

  for (const algorithm of ['SHA1', 'SHA256', 'SHA512']) {
    for (const digits of [6, 8]) {
      const res = generateOtpForAccount({ ...base, algorithm, digits, type: 'totp', counter: 0 }, 1_700_000_000_000);
      assert.equal(res.code.length, digits);
      assert.match(res.code, /^\d+$/);
    }
  }

  const hotp0 = generateOtpForAccount({ ...base, algorithm: 'SHA1', digits: 6, type: 'hotp', counter: 0 });
  const hotp1 = generateOtpForAccount({ ...base, algorithm: 'SHA1', digits: 6, type: 'hotp', counter: 1 });
  assert.equal(hotp0.code.length, 6);
  assert.equal(hotp1.code.length, 6);
  assert.notEqual(hotp0.code, hotp1.code);
  assert.equal(hotp0.remainingSeconds, 0);
  assert.equal(hotp0.progress, 1);
});

test('computeTotpWindow and formatOtpCode handle boundary timestamps and code lengths', () => {
  assert.equal(formatOtpCode('123456'), '123 456');
  assert.equal(formatOtpCode('12345678'), '1234 5678');
  assert.equal(formatOtpCode('12345'), '12345');

  const startWindow = computeTotpWindow(30, 30_000);
  assert.equal(startWindow.remainingSeconds, 30);
  assert.equal(startWindow.progress, 1);

  const endWindow = computeTotpWindow(30, 59_000);
  assert.equal(endWindow.remainingSeconds, 1);

  const zeroPeriodGuard = computeTotpWindow(0, 10_000);
  assert.equal(zeroPeriodGuard.remainingSeconds, 1);
});

test('previewTotpFromSecret returns code for valid secret and null for invalid secret', () => {
  const valid = previewTotpFromSecret('JBSWY3DPEHPK3PXP', 59_000, 'SHA1');
  assert.ok(valid !== null);
  assert.equal(valid.code.length, 6);
  assert.equal(previewTotpFromSecret('INVALID!@#', 59_000), null);
});

test('parseOtpAuthUri parses TOTP and HOTP URIs with all parameter variants', () => {
  const totp = parseOtpAuthUri(
    'otpauth://totp/GitHub:alice@example.com?secret=JBSWY3DPEHPK3PXP&issuer=GitHub&algorithm=SHA256&digits=8&period=60',
  );
  assert.equal(totp.type, 'totp');
  assert.equal(totp.issuer, 'GitHub');
  assert.equal(totp.label, 'alice@example.com');
  assert.equal(totp.secret, 'JBSWY3DPEHPK3PXP');
  assert.equal(totp.algorithm, 'SHA256');
  assert.equal(totp.digits, 8);
  assert.equal(totp.period, 60);

  const hotp = parseOtpAuthUri(
    'otpauth://hotp/Corp:bob?secret=GEZDGNBVGY3TQOJQ&algorithm=SHA512&counter=7',
  );
  assert.equal(hotp.type, 'hotp');
  assert.equal(hotp.algorithm, 'SHA512');
  assert.equal(hotp.counter, 7);
});

test('parseBulkSecretLines handles mixed formats and accurately reports invalid line numbers', () => {
  const input = [
    'GitHub|JBSWY3DPEHPK3PXP',
    'AWS: GEZDGNBVGY3TQOJQ',
    '',
    'otpauth://totp/Google:me@gmail.com?secret=JBSWY3DPEHPK3PXP&issuer=Google',
    'BadLine|12345',
    'JBSWY3DPEHPK3PXP',
    'otpauth://totp/BrokenUriWithoutSecret',
  ].join('\n');

  const result = parseBulkSecretLines(input);
  assert.equal(result.valid.length, 4);
  assert.deepEqual(result.invalidLines, [5, 7]);
  assert.equal(result.valid[0]?.label, 'GitHub');
  assert.equal(result.valid[1]?.label, 'AWS');
  assert.equal(result.valid[2]?.issuer, 'Google');
});
