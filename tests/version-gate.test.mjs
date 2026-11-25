import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { checkVersionNeedsBuild, isValidSemver, readAppVersion } from '../scripts/check-version.mjs';

function createTempAppJson(version) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'liquid-notes-ver-'));
  const filePath = path.join(dir, 'app.json');
  fs.writeFileSync(filePath, JSON.stringify({ expo: { version } }), 'utf8');
  return { dir, filePath };
}

test('isValidSemver validates standard and prerelease versions', () => {
  assert.equal(isValidSemver('1.0.0'), true);
  assert.equal(isValidSemver('2.10.3-beta.1'), true);
  assert.equal(isValidSemver('v1.0.0'), false);
  assert.equal(isValidSemver('1.0'), false);
  assert.equal(isValidSemver(''), false);
});

test('readAppVersion reads expo.version and rejects invalid versions', () => {
  const { dir, filePath } = createTempAppJson('1.2.3');
  try {
    assert.equal(readAppVersion(filePath), '1.2.3');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }

  const bad = createTempAppJson('invalid');
  try {
    assert.throws(() => readAppVersion(bad.filePath), /Invalid or missing expo\.version/);
  } finally {
    fs.rmSync(bad.dir, { recursive: true, force: true });
  }
});

test('checkVersionNeedsBuild skips build when local git tag already exists', async () => {
  const { dir, filePath } = createTempAppJson('1.0.0');
  try {
    const result = await checkVersionNeedsBuild({
      appJsonPath: filePath,
      checkTagFn: (tag) => tag === 'v1.0.0',
      checkReleaseFn: async () => false,
    });
    assert.equal(result.shouldBuild, false);
    assert.equal(result.tag, 'v1.0.0');
    assert.match(result.reason, /already exists/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('checkVersionNeedsBuild skips build when GitHub release already exists', async () => {
  const { dir, filePath } = createTempAppJson('1.0.0');
  try {
    const result = await checkVersionNeedsBuild({
      appJsonPath: filePath,
      repo: 'chalot28/note_chalot28',
      checkTagFn: () => false,
      checkReleaseFn: async () => true,
    });
    assert.equal(result.shouldBuild, false);
    assert.match(result.reason, /GitHub release v1\.0\.0 already exists/);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('checkVersionNeedsBuild triggers build when version is new', async () => {
  const { dir, filePath } = createTempAppJson('1.0.1');
  try {
    const result = await checkVersionNeedsBuild({
      appJsonPath: filePath,
      repo: 'chalot28/note_chalot28',
      checkTagFn: () => false,
      checkReleaseFn: async () => false,
    });
    assert.equal(result.shouldBuild, true);
    assert.equal(result.version, '1.0.1');
    assert.equal(result.tag, 'v1.0.1');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test('checkVersionNeedsBuild triggers build when forceBuild is true', async () => {
  const { dir, filePath } = createTempAppJson('1.0.0');
  try {
    const result = await checkVersionNeedsBuild({
      appJsonPath: filePath,
      forceBuild: true,
      checkTagFn: () => true,
      checkReleaseFn: async () => true,
    });
    assert.equal(result.shouldBuild, true);
    assert.equal(result.reason, 'force_build enabled');
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
