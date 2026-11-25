import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');

function walkFiles(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkFiles(full));
    } else if (entry.isFile()) {
      files.push(full);
    }
  }
  return files;
}

function extractExportedSymbols(source) {
  const symbols = new Set();
  const patterns = [
    /export\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)/g,
    /export\s+(?:const|let|var|class)\s+([A-Za-z0-9_$]+)/g,
  ];
  for (const re of patterns) {
    let match = re.exec(source);
    while (match !== null) {
      if (match[1]) symbols.add(match[1]);
      match = re.exec(source);
    }
  }
  if (/export\s+default\s+/.test(source)) {
    symbols.add('default');
  }
  return symbols;
}

test('every .web.ts/.web.tsx module has a native counterpart and all shared imports exist on both platforms', () => {
  const allFiles = walkFiles(SRC_DIR);
  const webFiles = allFiles.filter((f) => /\.web\.(ts|tsx)$/.test(f));
  assert.ok(webFiles.length > 0, 'Expected at least one .web.ts/.web.tsx file');

  const splitModules = new Map();
  for (const webFile of webFiles) {
    const nativeFile = webFile.replace(/\.web\.(ts|tsx)$/, '.$1');
    assert.ok(
      fs.existsSync(nativeFile),
      `Missing native counterpart for ${path.relative(ROOT, webFile)}`,
    );
    const aliasBase = `@/${path.relative(SRC_DIR, nativeFile).replace(/\.(ts|tsx)$/, '').replace(/\\/g, '/')}`;
    splitModules.set(aliasBase, {
      nativeFile,
      webFile,
      nativeExports: extractExportedSymbols(fs.readFileSync(nativeFile, 'utf8')),
      webExports: extractExportedSymbols(fs.readFileSync(webFile, 'utf8')),
    });
  }

  const missing = [];
  const importRe = /import\s+(?!type\b)\{([^}]+)\}\s+from\s+['"](@\/[^'"]+)['"]/g;

  for (const file of allFiles) {
    if (!/\.(ts|tsx)$/.test(file)) continue;
    const content = fs.readFileSync(file, 'utf8');
    let match = importRe.exec(content);
    while (match !== null) {
      const mod = splitModules.get(match[2]);
      if (mod) {
        const specifiers = match[1]
          .split(',')
          .map((s) => s.trim())
          .filter((s) => s && !s.startsWith('type '))
          .map((s) => s.split(/\s+as\s+/)[0].trim());

        for (const sym of specifiers) {
          if (!mod.nativeExports.has(sym)) {
            missing.push(`${path.relative(ROOT, file)} imports "${sym}" missing in ${path.relative(ROOT, mod.nativeFile)}`);
          }
          if (!mod.webExports.has(sym)) {
            missing.push(`${path.relative(ROOT, file)} imports "${sym}" missing in ${path.relative(ROOT, mod.webFile)}`);
          }
        }
      }
      match = importRe.exec(content);
    }
  }

  assert.deepEqual(missing, []);
});

test('app.json satisfies strict mobile build, permissions, and security config invariants', () => {
  const appJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'));
  const expo = appJson.expo;

  assert.ok(expo, 'app.json must have expo object');
  assert.match(expo.version, /^\d+\.\d+\.\d+(-[0-9A-Za-z.-]+)?$/);
  assert.match(expo.android?.package ?? '', /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/);
  assert.match(expo.ios?.bundleIdentifier ?? '', /^[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)+$/);

  assert.ok(expo.ios?.infoPlist?.NSFaceIDUsageDescription, 'Missing NSFaceIDUsageDescription');
  assert.ok(expo.ios?.infoPlist?.NSCameraUsageDescription, 'Missing NSCameraUsageDescription');

  const secureStorePlugin = (expo.plugins ?? []).find(
    (p) => Array.isArray(p) && p[0] === 'expo-secure-store',
  );
  assert.ok(secureStorePlugin, 'expo-secure-store plugin must be configured');
  assert.equal(
    secureStorePlugin[1]?.configureAndroidBackup,
    false,
    'expo-secure-store configureAndroidBackup MUST be false to prevent key leakage',
  );
});
