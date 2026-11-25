const HTML_ENTITY_MAP: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
};

export function stripHtmlToPlainText(html: string): string {
  if (!html) return '';
  const withBreaks = html
    .replace(/<\/(p|div|h1|h2|h3|li|blockquote|pre)>/gi, '\n')
    .replace(/<br\s*\/?>/gi, '\n');
  const stripped = withBreaks.replace(/<[^>]+>/g, '');
  const decoded = stripped.replace(
    /&(nbsp|amp|lt|gt|quot|#39);/g,
    (match) => HTML_ENTITY_MAP[match] ?? match,
  );
  return decoded
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function buildExcerpt(plainText: string, maxLength = 120): string {
  const singleLine = plainText.replace(/\s+/g, ' ').trim();
  if (singleLine.length <= maxLength) return singleLine;
  return `${singleLine.slice(0, maxLength - 1).trimEnd()}…`;
}

export function extractBacklinks(plainText: string): string[] {
  const regex = /\[\[([^[\]\n]{1,80})\]\]/g;
  const results = new Set<string>();
  let match = regex.exec(plainText);
  while (match !== null) {
    const label = match[1]?.trim();
    if (label) results.add(label);
    match = regex.exec(plainText);
  }
  return Array.from(results);
}

export function detectActiveBacklinkQuery(textBeforeCursor: string): string | null {
  const match = textBeforeCursor.match(/\[\[([^[\]\n]{0,50})$/);
  if (!match) return null;
  return match[1] ?? '';
}

export function detectTrailingSlashCommand(textBeforeCursor: string): string | null {
  const match = textBeforeCursor.match(/(?:^|\s)\/([a-zA-Z0-9_-]{0,20})$/);
  if (!match) return null;
  return match[1] ?? '';
}
