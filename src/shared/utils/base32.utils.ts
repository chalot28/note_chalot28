const BASE32_PATTERN = /^[A-Z2-7]+=*$/;

export function normalizeBase32Secret(raw: string): string {
  return raw.replace(/[\s\-_.\r\n]/g, '').toUpperCase();
}

export function isValidBase32(raw: string): boolean {
  const normalized = normalizeBase32Secret(raw);
  if (normalized.length < 8) return false;
  return BASE32_PATTERN.test(normalized);
}
