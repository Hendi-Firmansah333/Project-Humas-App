#!/usr/bin/env node
/**
 * Menjalankan ESLint lalu hanya menampilkan temuan dari aturan `security/*`
 * (eslint-plugin-security). Dipakai oleh script `security:lint`.
 *
 * Usage: node scripts/security/eslint-security-report.js <folder-modul> [glob...]
 */
const { spawnSync } = require('child_process');
const path = require('path');

const moduleDir = path.resolve(process.argv[2] || '.');
const targets = process.argv.slice(3);
if (targets.length === 0) targets.push('src');

const eslintBin = path.join(moduleDir, 'node_modules', 'eslint', 'bin', 'eslint.js');
const res = spawnSync(process.execPath, [eslintBin, ...targets, '--format', 'json'], {
  cwd: moduleDir,
  encoding: 'utf8',
  maxBuffer: 256 * 1024 * 1024,
});

let results;
try {
  results = JSON.parse(res.stdout);
} catch {
  console.error('[security:lint] Gagal mem-parse output ESLint:\n', res.stderr || res.stdout);
  process.exit(2);
}

const findings = [];
for (const file of results) {
  for (const msg of file.messages) {
    if (msg.ruleId && msg.ruleId.startsWith('security/')) {
      findings.push({
        file: path.relative(moduleDir, file.filePath).replace(/\\/g, '/'),
        line: msg.line,
        rule: msg.ruleId,
        severity: msg.severity === 2 ? 'error' : 'warn',
      });
    }
  }
}

const byRule = findings.reduce((acc, f) => {
  acc[f.rule] = (acc[f.rule] || 0) + 1;
  return acc;
}, {});

console.log(`\n[security:lint] ${path.basename(moduleDir)} — ${findings.length} temuan aturan keamanan`);
for (const [rule, count] of Object.entries(byRule).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(count).padStart(4)}  ${rule}`);
}
if (findings.length > 0) {
  console.log('\n  Detail:');
  for (const f of findings) {
    console.log(`  - ${f.file}:${f.line}  ${f.rule}`);
  }
}

// Gagal (exit 1) hanya bila ada temuan level error dari aturan security
process.exit(findings.some((f) => f.severity === 'error') ? 1 : 0);

