import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const SRC_DIR = path.resolve(process.cwd(), 'src');

function resolveWithExtensions(basePath) {
  const candidates = [
    basePath,
    `${basePath}.ts`,
    `${basePath}.tsx`,
    `${basePath}.mts`,
    `${basePath}.mjs`,
    `${basePath}.js`,
    path.join(basePath, 'index.ts'),
    path.join(basePath, 'index.tsx'),
    path.join(basePath, 'index.js'),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return pathToFileURL(candidate).href;
    }
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const targetPath = path.join(SRC_DIR, specifier.slice(2));
    const resolvedUrl = resolveWithExtensions(targetPath);
    if (resolvedUrl) {
      return { url: resolvedUrl, shortCircuit: true };
    }
  }

  if (specifier.startsWith('.') && context.parentURL?.startsWith('file://')) {
    const parentDir = path.dirname(new URL(context.parentURL).pathname);
    const targetPath = path.resolve(parentDir, specifier);
    const resolvedUrl = resolveWithExtensions(targetPath);
    if (resolvedUrl) {
      return { url: resolvedUrl, shortCircuit: true };
    }
  }

  return nextResolve(specifier, context);
}
