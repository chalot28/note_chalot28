import path from 'node:path';

export const DEFAULT_KEEP_COUNT = 5;

function toTimestamp(release) {
  const raw = release?.published_at || release?.created_at || '';
  const ts = Date.parse(raw);
  return Number.isNaN(ts) ? 0 : ts;
}

/**
 * Selects older non-draft releases beyond `keepCount` most recent releases.
 */
export function selectReleasesToDelete(releases, keepCount = DEFAULT_KEEP_COUNT) {
  if (!Array.isArray(releases) || keepCount < 0) return [];
  const published = releases
    .filter((r) => r && !r.draft)
    .slice()
    .sort((a, b) => toTimestamp(b) - toTimestamp(a));

  if (published.length <= keepCount) return [];
  return published.slice(keepCount);
}

export async function cleanupOldReleases({
  repo = process.env.GITHUB_REPOSITORY,
  token = process.env.GITHUB_TOKEN,
  keepCount = Number(process.env.KEEP_RELEASES ?? DEFAULT_KEEP_COUNT),
  deleteTags = true,
  fetchImpl = fetch,
} = {}) {
  if (!repo) {
    throw new Error('GITHUB_REPOSITORY is required to clean up releases');
  }
  if (!token) {
    throw new Error('GITHUB_TOKEN is required to clean up releases');
  }

  const headers = {
    Accept: 'application/vnd.github+json',
    Authorization: `Bearer ${token}`,
    'User-Agent': 'liquid-notes-release-cleanup',
  };

  const listRes = await fetchImpl(
    `https://api.github.com/repos/${repo}/releases?per_page=100`,
    { headers },
  );
  if (!listRes.ok) {
    throw new Error(`Failed to list releases: HTTP ${listRes.status}`);
  }

  const releases = await listRes.json();
  const toDelete = selectReleasesToDelete(releases, keepCount);
  const deletedTags = [];
  const errors = [];

  for (const rel of toDelete) {
    const delRes = await fetchImpl(
      `https://api.github.com/repos/${repo}/releases/${rel.id}`,
      { method: 'DELETE', headers },
    );
    if (!delRes.ok) {
      errors.push(`release ${rel.tag_name ?? rel.id}: HTTP ${delRes.status}`);
      continue;
    }

    const label = rel.tag_name ?? String(rel.id);
    deletedTags.push(label);

    if (deleteTags && rel.tag_name) {
      await fetchImpl(
        `https://api.github.com/repos/${repo}/git/refs/tags/${encodeURIComponent(rel.tag_name)}`,
        { method: 'DELETE', headers },
      ).catch(() => {});
    }
  }

  const totalPublished = Array.isArray(releases) ? releases.filter((r) => r && !r.draft).length : 0;
  return {
    keptCount: Math.min(totalPublished, keepCount),
    deletedTags,
    errors,
  };
}

async function main() {
  const result = await cleanupOldReleases();
  console.log(
    `[release-cleanup] kept=${result.keptCount} deleted=${result.deletedTags.length} (${result.deletedTags.join(', ') || 'none'})`,
  );
  if (result.errors.length > 0) {
    console.warn('[release-cleanup] warnings:', result.errors.join('; '));
  }
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isCli) {
  main().catch((err) => {
    console.error('[release-cleanup] Error:', err);
    process.exit(1);
  });
}
