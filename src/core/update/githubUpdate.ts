export const DEFAULT_GITHUB_REPO = 'chalot28/note_chalot28';

export type UpdatePlatform = 'android' | 'ios' | 'web';

export interface GitHubReleaseAsset {
  name: string;
  browser_download_url: string;
  size?: number;
}

export interface GitHubReleasePayload {
  tag_name?: string;
  name?: string;
  html_url?: string;
  body?: string | null;
  published_at?: string;
  draft?: boolean;
  prerelease?: boolean;
  assets?: GitHubReleaseAsset[];
}

export interface UpdateCheckResult {
  hasUpdate: boolean;
  currentVersion: string;
  latestVersion: string;
  tagName: string;
  releaseUrl: string;
  downloadUrl: string | null;
  releaseNotes: string;
  publishedAt: string | null;
  error?: string;
}

export function normalizeVersion(version: string): string {
  return version.trim().replace(/^v/i, '');
}

interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
}

function parseSemver(raw: string): ParsedSemver | null {
  const cleaned = normalizeVersion(raw).split('+')[0] ?? '';
  const dashIndex = cleaned.indexOf('-');
  const corePart = dashIndex >= 0 ? cleaned.slice(0, dashIndex) : cleaned;
  const prePart = dashIndex >= 0 ? cleaned.slice(dashIndex + 1) : '';
  const parts = corePart.split('.');
  if (parts.length !== 3) return null;

  const [majorStr, minorStr, patchStr] = parts;
  const major = Number(majorStr);
  const minor = Number(minorStr);
  const patch = Number(patchStr);
  if (
    !Number.isInteger(major) || major < 0 ||
    !Number.isInteger(minor) || minor < 0 ||
    !Number.isInteger(patch) || patch < 0
  ) {
    return null;
  }

  return {
    major,
    minor,
    patch,
    prerelease: prePart ? prePart.split('.').filter(Boolean) : [],
  };
}

/**
 * Compares two semver strings: returns 1 if a > b, -1 if a < b, 0 if equal.
 */
export function compareSemver(a: string, b: string): number {
  const pa = parseSemver(a);
  const pb = parseSemver(b);
  if (!pa || !pb) {
    const na = normalizeVersion(a);
    const nb = normalizeVersion(b);
    if (na === nb) return 0;
    return na > nb ? 1 : -1;
  }

  if (pa.major !== pb.major) return pa.major > pb.major ? 1 : -1;
  if (pa.minor !== pb.minor) return pa.minor > pb.minor ? 1 : -1;
  if (pa.patch !== pb.patch) return pa.patch > pb.patch ? 1 : -1;

  if (pa.prerelease.length === 0 && pb.prerelease.length === 0) return 0;
  if (pa.prerelease.length === 0) return 1;
  if (pb.prerelease.length === 0) return -1;

  const len = Math.max(pa.prerelease.length, pb.prerelease.length);
  for (let i = 0; i < len; i += 1) {
    const ia = pa.prerelease[i];
    const ib = pb.prerelease[i];
    if (ia === undefined) return -1;
    if (ib === undefined) return 1;
    if (ia === ib) continue;
    const na = Number(ia);
    const nb = Number(ib);
    const aIsNum = Number.isInteger(na) && String(na) === ia;
    const bIsNum = Number.isInteger(nb) && String(nb) === ib;
    if (aIsNum && bIsNum) return na > nb ? 1 : -1;
    if (aIsNum) return -1;
    if (bIsNum) return 1;
    return ia > ib ? 1 : -1;
  }
  return 0;
}

export function selectAssetForPlatform(
  assets: GitHubReleaseAsset[] | undefined,
  platform: UpdatePlatform,
): GitHubReleaseAsset | null {
  if (!Array.isArray(assets) || assets.length === 0) return null;

  if (platform === 'android') {
    return assets.find((a) => a.name.toLowerCase().endsWith('.apk')) ?? null;
  }

  if (platform === 'ios') {
    const signedIpa = assets.find(
      (a) => a.name.toLowerCase().endsWith('.ipa') && !a.name.toLowerCase().includes('unsigned'),
    );
    return signedIpa ?? assets.find((a) => a.name.toLowerCase().endsWith('.ipa')) ?? null;
  }

  return null;
}

export interface CheckForUpdateOptions {
  currentVersion: string;
  platform: UpdatePlatform;
  repo?: string;
  fetchImpl?: typeof fetch;
}

export async function checkForGitHubUpdate({
  currentVersion,
  platform,
  repo = DEFAULT_GITHUB_REPO,
  fetchImpl = fetch,
}: CheckForUpdateOptions): Promise<UpdateCheckResult> {
  const normalizedCurrent = normalizeVersion(currentVersion);
  const fallbackReleaseUrl = `https://github.com/${repo}/releases`;

  try {
    const response = await fetchImpl(`https://api.github.com/repos/${repo}/releases/latest`, {
      headers: {
        Accept: 'application/vnd.github+json',
        'User-Agent': 'liquid-notes-auto-updater',
      },
    });

    if (response.status === 404) {
      return {
        hasUpdate: false,
        currentVersion: normalizedCurrent,
        latestVersion: normalizedCurrent,
        tagName: `v${normalizedCurrent}`,
        releaseUrl: fallbackReleaseUrl,
        downloadUrl: null,
        releaseNotes: '',
        publishedAt: null,
      };
    }

    if (!response.ok) {
      return {
        hasUpdate: false,
        currentVersion: normalizedCurrent,
        latestVersion: normalizedCurrent,
        tagName: `v${normalizedCurrent}`,
        releaseUrl: fallbackReleaseUrl,
        downloadUrl: null,
        releaseNotes: '',
        publishedAt: null,
        error: `GitHub API returned status ${response.status}`,
      };
    }

    const data = (await response.json()) as GitHubReleasePayload;
    if (data.draft) {
      return {
        hasUpdate: false,
        currentVersion: normalizedCurrent,
        latestVersion: normalizedCurrent,
        tagName: `v${normalizedCurrent}`,
        releaseUrl: data.html_url ?? fallbackReleaseUrl,
        downloadUrl: null,
        releaseNotes: '',
        publishedAt: data.published_at ?? null,
      };
    }

    const tagName = data.tag_name ?? `v${normalizedCurrent}`;
    const latestVersion = normalizeVersion(tagName);
    const hasUpdate = compareSemver(latestVersion, normalizedCurrent) > 0;
    const asset = selectAssetForPlatform(data.assets, platform);

    return {
      hasUpdate,
      currentVersion: normalizedCurrent,
      latestVersion,
      tagName,
      releaseUrl: data.html_url ?? fallbackReleaseUrl,
      downloadUrl: asset?.browser_download_url ?? null,
      releaseNotes: (data.body ?? '').trim(),
      publishedAt: data.published_at ?? null,
    };
  } catch (err) {
    return {
      hasUpdate: false,
      currentVersion: normalizedCurrent,
      latestVersion: normalizedCurrent,
      tagName: `v${normalizedCurrent}`,
      releaseUrl: fallbackReleaseUrl,
      downloadUrl: null,
      releaseNotes: '',
      publishedAt: null,
      error: err instanceof Error ? err.message : 'Network error',
    };
  }
}
