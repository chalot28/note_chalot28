import assert from 'node:assert/strict';
import test from 'node:test';
import {
  checkForGitHubUpdate,
  compareSemver,
  normalizeVersion,
  selectAssetForPlatform,
} from '../src/core/update/githubUpdate.ts';

test('normalizeVersion strips leading v prefix', () => {
  assert.equal(normalizeVersion('v1.2.3'), '1.2.3');
  assert.equal(normalizeVersion(' V2.0.0 '), '2.0.0');
  assert.equal(normalizeVersion('1.0.0'), '1.0.0');
});

test('compareSemver orders major, minor, patch, and prerelease correctly', () => {
  assert.equal(compareSemver('1.0.1', '1.0.0'), 1);
  assert.equal(compareSemver('1.1.0', '1.0.9'), 1);
  assert.equal(compareSemver('2.0.0', '1.9.9'), 1);
  assert.equal(compareSemver('v1.0.0', '1.0.0'), 0);
  assert.equal(compareSemver('1.0.0', '1.0.1'), -1);
  assert.equal(compareSemver('1.0.1', '1.0.1-beta.1'), 1);
  assert.equal(compareSemver('1.0.1-beta.2', '1.0.1-beta.1'), 1);
});

test('selectAssetForPlatform picks the right binary for Android, iOS, and Web', () => {
  const assets = [
    { name: 'liquid-notes-v1.0.1-android.apk', browser_download_url: 'https://example.com/app.apk' },
    { name: 'liquid-notes-v1.0.1-ios-unsigned.ipa', browser_download_url: 'https://example.com/unsigned.ipa' },
    { name: 'liquid-notes-v1.0.1-ios.ipa', browser_download_url: 'https://example.com/signed.ipa' },
  ];

  assert.equal(selectAssetForPlatform(assets, 'android')?.browser_download_url, 'https://example.com/app.apk');
  assert.equal(selectAssetForPlatform(assets, 'ios')?.browser_download_url, 'https://example.com/signed.ipa');
  assert.equal(selectAssetForPlatform(assets.slice(0, 2), 'ios')?.browser_download_url, 'https://example.com/unsigned.ipa');
  assert.equal(selectAssetForPlatform(assets, 'web'), null);
});

test('checkForGitHubUpdate detects newer release and selects platform asset', async () => {
  const mockFetch = async () =>
    new Response(
      JSON.stringify({
        tag_name: 'v1.0.1',
        html_url: 'https://github.com/chalot28/note_chalot28/releases/tag/v1.0.1',
        body: 'Fix bug & add auto update',
        published_at: '2026-11-25T12:00:00Z',
        assets: [
          { name: 'liquid-notes-v1.0.1-android.apk', browser_download_url: 'https://github.com/dl/app.apk' },
        ],
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );

  const res = await checkForGitHubUpdate({
    currentVersion: '1.0.0',
    platform: 'android',
    fetchImpl: mockFetch,
  });

  assert.equal(res.hasUpdate, true);
  assert.equal(res.latestVersion, '1.0.1');
  assert.equal(res.downloadUrl, 'https://github.com/dl/app.apk');
  assert.equal(res.releaseNotes, 'Fix bug & add auto update');
});

test('checkForGitHubUpdate returns hasUpdate=false when already on latest version', async () => {
  const mockFetch = async () =>
    new Response(JSON.stringify({ tag_name: 'v1.0.0', assets: [] }), { status: 200 });

  const res = await checkForGitHubUpdate({
    currentVersion: '1.0.0',
    platform: 'android',
    fetchImpl: mockFetch,
  });

  assert.equal(res.hasUpdate, false);
});

test('checkForGitHubUpdate handles 404, draft releases, and network errors safely', async () => {
  const res404 = await checkForGitHubUpdate({
    currentVersion: '1.0.0',
    platform: 'android',
    fetchImpl: async () => new Response('Not Found', { status: 404 }),
  });
  assert.equal(res404.hasUpdate, false);
  assert.equal(res404.error, undefined);

  const resDraft = await checkForGitHubUpdate({
    currentVersion: '1.0.0',
    platform: 'android',
    fetchImpl: async () => new Response(JSON.stringify({ tag_name: 'v2.0.0', draft: true }), { status: 200 }),
  });
  assert.equal(resDraft.hasUpdate, false);

  const resNetErr = await checkForGitHubUpdate({
    currentVersion: '1.0.0',
    platform: 'android',
    fetchImpl: async () => {
      throw new Error('Offline');
    },
  });
  assert.equal(resNetErr.hasUpdate, false);
  assert.equal(resNetErr.error, 'Offline');
});
