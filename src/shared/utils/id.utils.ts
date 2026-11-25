export function createId(prefix = ''): string {
  const timestamp = Date.now().toString(36);
  const randomA = Math.floor(Math.random() * 0xffffffff)
    .toString(36)
    .padStart(6, '0');
  const randomB = Math.floor(Math.random() * 0xffffffff)
    .toString(36)
    .padStart(6, '0');
  const core = `${timestamp}-${randomA}${randomB}`;
  return prefix ? `${prefix}_${core}` : core;
}
