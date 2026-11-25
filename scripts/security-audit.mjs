import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SRC_DIR = path.join(ROOT, 'src');
const WORKFLOWS_DIR = path.join(ROOT, '.github', 'workflows');

function walkFiles(dir, extensions) {
  if (!fs.existsSync(dir)) return [];
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(full, extensions));
    } else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

export function runSecurityAudit() {
  const findings = [];
  const addFinding = (severity, rule, file, detail) => {
    findings.push({ severity, rule, file, detail });
  };

  // 1. Tracked sensitive files check
  try {
    const tracked = execSync('git ls-files', { encoding: 'utf8' }).split(/\r?\n/).filter(Boolean);
    const forbiddenFilePattern = /(^\.env(\.|$)|\.jks$|\.keystore$|\.p12$|\.p8$|\.mobileprovision$|\.pem$|\.key$)/i;
    for (const rel of tracked) {
      if (rel === 'android/app/debug.keystore') continue;
      if (forbiddenFilePattern.test(path.basename(rel))) {
        addFinding('CRITICAL', 'tracked-secret-file', rel, 'Sensitive credential/keystore file is tracked in git');
      }
    }
  } catch {
    // Non-git environment fallback
  }

  // 2. Source code SAST checks
  const sourceFiles = walkFiles(SRC_DIR, ['.ts', '.tsx', '.js', '.jsx', '.mjs']);
  const secretRegexes = [
    { name: 'private-key-block', re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----/ },
    { name: 'aws-access-key', re: /\bAKIA[0-9A-Z]{16}\b/ },
    { name: 'github-token', re: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{20,}\b/ },
    { name: 'github-pat', re: /\bgithub_pat_[A-Za-z0-9_]{20,}\b/ },
  ];

  for (const fullPath of sourceFiles) {
    const rel = path.relative(ROOT, fullPath);
    const content = fs.readFileSync(fullPath, 'utf8');
    const lines = content.split(/\r?\n/);

    for (const { name, re } of secretRegexes) {
      if (re.test(content)) {
        addFinding('CRITICAL', name, rel, 'Hardcoded secret pattern detected');
      }
    }

    lines.forEach((line, idx) => {
      const lineNo = idx + 1;

      if (/\beval\s*\(/.test(line) || /\bnew\s+Function\s*\(/.test(line)) {
        addFinding('HIGH', 'dynamic-code-exec', `${rel}:${lineNo}`, 'Avoid eval() or new Function()');
      }
      if (
        /dangerouslySetInnerHTML/.test(line) ||
        (/\.innerHTML\s*=/.test(line) && !/\.innerHTML\s*=\s*sanitizeEditorHtml\(/.test(line))
      ) {
        addFinding('HIGH', 'dom-xss-sink', `${rel}:${lineNo}`, 'Avoid unsanitized raw HTML injection sinks');
      }

      if (
        (rel.startsWith('src/core/security/') ||
          rel.startsWith('src/features/vault/') ||
          rel.startsWith('src/features/authenticator/')) &&
        /Math\.random\s*\(/.test(line)
      ) {
        addFinding('HIGH', 'insecure-prng', `${rel}:${lineNo}`, 'Use CSPRNG instead of Math.random() in security/auth modules');
      }

      if (rel.startsWith('src/core/security/') && /createCipher\(|aes-128-ecb|aes-256-ecb|'md5'|'sha1'/i.test(line)) {
        addFinding('CRITICAL', 'weak-crypto', `${rel}:${lineNo}`, 'Weak or deprecated cryptographic primitive detected');
      }

      const httpMatch = line.match(/http:\/\/[^\s'"`)]+/g);
      if (httpMatch) {
        for (const url of httpMatch) {
          if (
            !url.startsWith('http://localhost') &&
            !url.startsWith('http://127.0.0.1') &&
            !url.startsWith('http://www.w3.org/') &&
            !url.startsWith('http://schemas.android.com/')
          ) {
            addFinding('MEDIUM', 'cleartext-http', `${rel}:${lineNo}`, `Cleartext HTTP URL: ${url}`);
          }
        }
      }

      if (
        /console\.(log|info|debug|warn)\(/.test(line) &&
        /\b(pin|password|masterKey|secret|cipherText|authTag|privateKey)\b/i.test(line)
      ) {
        addFinding('HIGH', 'sensitive-console-log', `${rel}:${lineNo}`, 'Potential sensitive secret/key logged to console');
      }
    });
  }

  // 3. app.json security checks
  const appJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'app.json'), 'utf8'));
  const expo = appJson.expo ?? {};
  if (expo.android?.usesCleartextTraffic === true) {
    addFinding('HIGH', 'android-cleartext-traffic', 'app.json', 'usesCleartextTraffic must not be enabled');
  }
  const secureStore = (expo.plugins ?? []).find((p) => Array.isArray(p) && p[0] === 'expo-secure-store');
  if (!secureStore || secureStore[1]?.configureAndroidBackup !== false) {
    addFinding('HIGH', 'android-backup-keystore', 'app.json', 'expo-secure-store must set configureAndroidBackup: false');
  }

  // 4. GitHub Actions workflow injection check
  const workflowFiles = walkFiles(WORKFLOWS_DIR, ['.yml', '.yaml']);
  const untrustedContextRe = /\$\{\{\s*github\.event\.(?:pull_request\.(?:title|body|head\.ref|head\.label)|issue\.(?:title|body)|comment\.body|commits\[[^\]]+\]\.message)/;
  for (const wf of workflowFiles) {
    const rel = path.relative(ROOT, wf);
    const content = fs.readFileSync(wf, 'utf8');
    if (untrustedContextRe.test(content)) {
      addFinding('CRITICAL', 'gha-script-injection', rel, 'Untrusted github.event expression interpolated in workflow');
    }
  }

  return findings;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const findings = runSecurityAudit();
  if (findings.length === 0) {
    console.log('Security audit passed: 0 findings.');
    process.exit(0);
  }
  console.error(`Security audit failed with ${findings.length} finding(s):`);
  for (const f of findings) {
    console.error(`- [${f.severity}] (${f.rule}) ${f.file}: ${f.detail}`);
  }
  process.exit(1);
}
