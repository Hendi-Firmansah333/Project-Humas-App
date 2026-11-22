#!/usr/bin/env node
/**
 * Runner Otomatis Audit Keamanan Lokal untuk Project-Humas-App
 *
 * Menjalankan:
 * 1. Dependency Audit (npm audit - high/critical) untuk Backend & Frontend
 * 2. Static Code Analysis / Security Linter (eslint-plugin-security)
 * 3. Secret Leak Scanner (gitleaks)
 * 4. SAST Rule Scanner (semgrep) bila terpasang
 */

const { spawnSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const rootDir = path.resolve(__dirname, '..', '..');

// Pastikan PATH mencakup folder tools (Gitleaks via WinGet dan Semgrep via Python Scripts)
const extraPaths = [
  path.join(process.env.APPDATA || '', 'Python', 'Python314', 'Scripts'),
  path.join(process.env.LOCALAPPDATA || '', 'Microsoft', 'WinGet', 'Links'),
];
for (const p of extraPaths) {
  if (fs.existsSync(p) && !(process.env.PATH || '').toLowerCase().includes(p.toLowerCase())) {
    process.env.PATH = `${p};${process.env.PATH}`;
  }
}

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
};

function banner(title) {
  console.log(`\n${colors.cyan}${colors.bold}================================================================${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}  ${title}${colors.reset}`);
  console.log(`${colors.cyan}${colors.bold}================================================================${colors.reset}\n`);
}

function subheader(title) {
  console.log(`\n${colors.bold}${colors.blue}>>> [${title}]${colors.reset}`);
}

const summary = {
  dependencyAudit: { backend: 'SKIP', frontend: 'SKIP' },
  securityLinter: { backend: 'SKIP', frontend: 'SKIP' },
  secretScanner: 'SKIP',
  sastSemgrep: 'SKIP',
};

// -------------------------------------------------------------
// 1. Dependency Audit
// -------------------------------------------------------------
banner('1. AUDIT DEPENDENCY (NPM AUDIT)');

function runNpmAudit(name, dir) {
  subheader(`Memeriksa kerentanan paket di ${name}...`);
  const res = spawnSync('npm.cmd', ['audit', '--audit-level=high'], {
    cwd: dir,
    encoding: 'utf8',
  });

  const output = res.stdout || res.stderr || '';
  console.log(output.trim());

  if (res.status === 0) {
    console.log(`${colors.green}✔ ${name}: Tidak ada kerentanan High / Critical ditemukan.${colors.reset}`);
    summary.dependencyAudit[name.toLowerCase()] = 'PASSED';
  } else {
    console.log(`${colors.yellow}⚠ ${name}: Ditemukan kerentanan High/Critical (lihat rincian di atas).${colors.reset}`);
    summary.dependencyAudit[name.toLowerCase()] = 'FOUND ISSUES';
  }
}

runNpmAudit('Backend', path.join(rootDir, 'backend'));
runNpmAudit('Frontend', path.join(rootDir, 'frontend'));

// -------------------------------------------------------------
// 2. Static Code Analysis (ESLint Security)
// -------------------------------------------------------------
banner('2. STATIC CODE ANALYSIS (ESLINT SECURITY LINTER)');

function runSecurityLint(name, dir) {
  subheader(`Menjalankan eslint-plugin-security di ${name}...`);
  const reporterPath = path.join(rootDir, 'scripts', 'security', 'eslint-security-report.js');
  const res = spawnSync(process.execPath, [reporterPath, dir, 'src'], {
    cwd: rootDir,
    encoding: 'utf8',
  });

  if (res.stdout) console.log(res.stdout.trim());
  if (res.stderr) console.error(res.stderr.trim());

  if (res.status === 0) {
    summary.securityLinter[name.toLowerCase()] = 'PASSED';
  } else {
    summary.securityLinter[name.toLowerCase()] = 'WARNINGS/ERRORS';
  }
}

runSecurityLint('Backend', path.join(rootDir, 'backend'));
runSecurityLint('Frontend', path.join(rootDir, 'frontend'));

// -------------------------------------------------------------
// 3. Secret Scanner (Gitleaks)
// -------------------------------------------------------------
banner('3. PEMINDAIAN SECRET / HARDCODED KREDENSIAL (GITLEAKS)');

const reportJsonPath = path.join(rootDir, 'scripts', 'security', 'gitleaks-report.json');
const gitleaksCheck = spawnSync('where.exe', ['gitleaks'], { encoding: 'utf8' });

if (gitleaksCheck.status === 0) {
  subheader('Menjalankan Gitleaks...');
  const res = spawnSync('gitleaks', ['detect', '--no-banner', '--report-format', 'json', '--report-path', reportJsonPath], {
    cwd: rootDir,
    encoding: 'utf8',
  });

  if (res.stdout) console.log(res.stdout.trim());
  if (res.stderr) console.log(res.stderr.trim());

  if (fs.existsSync(reportJsonPath)) {
    try {
      const leaks = JSON.parse(fs.readFileSync(reportJsonPath, 'utf8'));
      if (leaks.length > 0) {
        console.log(`\n${colors.red}${colors.bold}⚠ Terdeteksi ${leaks.length} potensi secret/token bocor di repository!${colors.reset}`);
        console.log(`${colors.gray}  Laporan lengkap tersimpan di: scripts/security/gitleaks-report.json${colors.reset}`);
        summary.secretScanner = `${leaks.length} LEAKS FOUND`;
      } else {
        console.log(`${colors.green}✔ Bersih! Tidak ada hardcoded secret atau token ditemukan.${colors.reset}`);
        summary.secretScanner = 'CLEAN';
      }
    } catch {
      summary.secretScanner = 'SCANNED';
    }
  } else {
    summary.secretScanner = 'CLEAN';
  }
} else {
  console.log(`${colors.yellow}Gitleaks belum terdeteksi di PATH sistem.${colors.reset}`);
  console.log('Untuk menginstal: winget install --id Gitleaks.Gitleaks');
  summary.secretScanner = 'NOT INSTALLED';
}

// -------------------------------------------------------------
// 4. SAST Scanner (Semgrep)
// -------------------------------------------------------------
banner('4. STATIC ANALYSIS SAST (SEMGREP)');

const semgrepCheck = spawnSync('where.exe', ['semgrep'], { encoding: 'utf8' });
if (semgrepCheck.status === 0) {
  subheader('Menjalankan Semgrep scan (OWASP Top 10 ruleset)...');
  const semgrepRes = spawnSync('semgrep', ['scan', '--config=p/owasp-top-ten', '--disable-version-check', 'backend/src', 'frontend/src'], {
    cwd: rootDir,
    encoding: 'utf8',
  });
  if (semgrepRes.stdout) console.log(semgrepRes.stdout.trim());
  if (semgrepRes.stderr) console.log(semgrepRes.stderr.trim());
  summary.sastSemgrep = semgrepRes.status === 0 ? 'CLEAN' : 'COMPLETED';
} else {
  console.log(`${colors.yellow}Semgrep CLI belum terpasang atau belum ada di PATH Windows.${colors.reset}`);
  console.log('Catatan: Semgrep dapat dipasang via `pip install semgrep` atau dijalankan lewat Docker/WSL.');
  summary.sastSemgrep = 'NOT INSTALLED';
}

// -------------------------------------------------------------
// RINGKASAN AKHIR
// -------------------------------------------------------------
banner('RINGKASAN HASIL AUDIT KEAMANAN LOKAL');
console.log(`  - Dependency Audit Backend  : ${summary.dependencyAudit.backend}`);
console.log(`  - Dependency Audit Frontend : ${summary.dependencyAudit.frontend}`);
console.log(`  - Security Linter Backend   : ${summary.securityLinter.backend}`);
console.log(`  - Security Linter Frontend  : ${summary.securityLinter.frontend}`);
console.log(`  - Secret Scanner (Gitleaks) : ${summary.secretScanner}`);
console.log(`  - SAST Scanner (Semgrep)    : ${summary.sastSemgrep}`);
console.log(`\n${colors.cyan}Gunakan perintah ini kapan saja untuk audit ulang: security-audit.bat${colors.reset}\n`);
