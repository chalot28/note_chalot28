import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const SEMVER_REGEX = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/;

export function isValidSemver(version) {
  return typeof version === 'string' && SEMVER_REGEX.test(version.trim());
}

export function readAppVersion(appJsonPath = path.resolve(process.cwd(), 'app.json')) {
  const raw = fs.readFileSync(appJsonPath, 'utf8');
  const parsed = JSON.parse(raw);
  const version = parsed?.expo?.version;
  if (!isValidSemver(version)) {
    throw new Error(`Invalid or missing expo.version in ${appJsonPath}: ${String(version)}`);
  }
  return version.trim();
}

export function hasLocalGitTag(tag, cwd = process.cwd()) {
  try {
    const out = execSync(`git tag -l "${tag}"`, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return out
      .split(/\r?\n/)
      .map((line) => line.trim())
      .includes(tag);
  } catch {
    return false;
  }
}

export async function hasGitHubRelease(repo, tag, token, fetchImpl = fetch) {
  if (!repo) return false;
  const headers = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'liquid-notes-ci-version-check',
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  try {
    const res = await fetchImpl(`https://api.github.com/repos/${repo}/releases/tags/${encodeURIComponent(tag)}`, {
      headers,
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function checkVersionNeedsBuild({
  appJsonPath,
  repo = process.env.GITHUB_REPOSITORY,
  token = process.env.GITHUB_TOKEN,
  forceBuild = process.env.FORCE_BUILD === 'true',
  checkTagFn = hasLocalGitTag,
  checkReleaseFn = hasGitHubRelease,
} = {}) {
  const version = readAppVersion(appJsonPath);
  const tag = `v${version}`;

  if (forceBuild) {
    return { version, tag, shouldBuild: true, reason: 'force_build enabled' };
  }

  const tagExists = checkTagFn(tag);
  if (tagExists) {
    return { version, tag, shouldBuild: false, reason: `git tag ${tag} already exists` };
  }

  const releaseExists = await checkReleaseFn(repo, tag, token);
  if (releaseExists) {
    return { version, tag, shouldBuild: false, reason: `GitHub release ${tag} already exists` };
  }

  return { version, tag, shouldBuild: true, reason: `new version ${version} detected` };
}

function writeGithubOutput(outputs) {
  const outputPath = process.env.GITHUB_OUTPUT;
  if (!outputPath) return;
  const lines = Object.entries(outputs).map(([k, v]) => `${k}=${String(v)}`);
  fs.appendFileSync(outputPath, `${lines.join('\n')}\n`, 'utf8');
}

async function main() {
  const result = await checkVersionNeedsBuild();
  console.log(`[version-check] version=${result.version} tag=${result.tag} should_build=${result.shouldBuild} (${result.reason})`);
  writeGithubOutput({
    version: result.version,
    tag: result.tag,
    should_build: result.shouldBuild,
  });
}

const isCli = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isCli) {
  main().catch((err) => {
    console.error('[version-check] Error:', err);
    process.exit(1);
  });
}
