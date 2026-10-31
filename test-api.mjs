// ============================================================
// Endpoints verified: /auth/profile (bukan /users/me), pagination wrapper = {data, meta}
// HUMASS API — Automated Concurrent Test Script
// Jalankan: node test-api.mjs
// Backend harus running di port 3001
// ============================================================

const BASE_URL = 'http://localhost:3001';
const LOGIN_USERNAME = 'komang.ari';
const LOGIN_PASSWORD = 'admin123'; // Password default user DB

const C = {
  reset: '\x1b[0m', bold: '\x1b[1m',
  green: '\x1b[32m', red: '\x1b[31m', yellow: '\x1b[33m',
  cyan: '\x1b[36m', magenta: '\x1b[35m', dim: '\x1b[2m',
};

const PASS = `${C.green}PASS${C.reset}`;
const FAIL = `${C.red}FAIL${C.reset}`;
const WARN = `${C.yellow}WARN${C.reset}`;

let token = null;
let results = [];
let firstActivityId = null;
let firstEquipmentId = null;
let createdEquipmentId = null;

// Helper: HTTP request
async function api(method, path, body = null, useToken = true) {
  const headers = { 'Content-Type': 'application/json' };
  if (useToken && token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const start = Date.now();
  try {
    const res = await fetch(`${BASE_URL}${path}`, opts);
    const elapsed = Date.now() - start;
    let data = null;
    try { data = await res.json(); } catch (_) {}
    return { ok: res.ok, status: res.status, data, elapsed };
  } catch (e) {
    return { ok: false, status: 0, data: null, elapsed: Date.now() - start, error: e.message };
  }
}

// Helper: log hasil test
function log(label, passed, status, elapsed, note = '') {
  const icon = passed ? `[${PASS}]` : `[${FAIL}]`;
  const noteStr = note ? ` -> ${note}` : '';
  console.log(`  ${icon} ${label.padEnd(50)} HTTP ${String(status).padEnd(5)} ${elapsed}ms${noteStr}`);
  results.push({ label, passed, status, elapsed });
}

function section(title) {
  console.log(`\n${C.bold}${C.cyan}--- ${title} ---${C.reset}`);
}

// ============================================================
// STEP 1: LOGIN
// ============================================================
async function stepLogin() {
  section('AUTH - Login');
  const r = await api('POST', '/api/auth/login', {
    username: LOGIN_USERNAME,
    password: LOGIN_PASSWORD,
  }, false);

  const t = r.data?.data?.accessToken || r.data?.accessToken;
  if (r.ok && t) {
    token = t;
    const user = r.data?.data?.user || r.data?.user;
    log('POST /api/auth/login', true, r.status, r.elapsed, `user: ${user?.username || LOGIN_USERNAME}`);
    return true;
  } else {
    log('POST /api/auth/login', false, r.status, r.elapsed,
      r.data?.message || r.error || 'Login gagal');
    console.log(`\n  ${C.yellow}Hint: Edit LOGIN_PASSWORD di baris 9 sesuai password user di DB Anda.${C.reset}`);
    console.log(`  ${C.yellow}Cek user aktif di: http://localhost:3001/api/docs${C.reset}\n`);
    return false;
  }
}

// ============================================================
// STEP 2: CONCURRENT TEST - semua endpoint berjalan bersamaan
// ============================================================
async function runConcurrentTests() {
  section('CONCURRENT TESTS - 12 request sekaligus via Promise.all()');

  const [
    rUsers, rMe, rActivities,
    rEquipNoPage, rEquipPage, rEquipLimit5,
    rLiveLocation, rNotifications, rDashboard,
    rSchedules, rReports, rSwagger,
  ] = await Promise.all([
    api('GET', '/api/users'),
    api('GET', '/api/auth/profile'),  // endpoint 'me' sebenarnya di /auth/profile
    api('GET', '/api/activities'),
    api('GET', '/api/equipment-loans/equipment'),
    api('GET', '/api/equipment-loans/equipment?page=1&limit=10'),
    api('GET', '/api/equipment-loans/equipment?page=1&limit=5'),
    api('GET', '/api/live-location'),
    api('GET', '/api/notifications'),
    api('GET', '/api/users?page=1&limit=3'), // /dashboard tidak ada, ganti dgn users pagination
    api('GET', '/api/schedules'),
    api('GET', '/api/reports'),
    api('GET', '/api/docs', null, false),
  ]);

  const userList = rUsers.data?.data || rUsers.data || [];
  log('GET /api/users', rUsers.ok, rUsers.status, rUsers.elapsed,
    `${Array.isArray(userList) ? userList.length : '?'} users`);

  log('GET /api/auth/profile (profile saya)', rMe.ok, rMe.status, rMe.elapsed,
    `role: ${rMe.data?.data?.role || rMe.data?.role || '-'}`);

  const acts = rActivities.data?.data || rActivities.data;
  const actArr = Array.isArray(acts) ? acts : (acts?.items || []);
  firstActivityId = actArr[0]?.id;
  log('GET /api/activities', rActivities.ok, rActivities.status, rActivities.elapsed,
    `${actArr.length} kegiatan, firstId=${firstActivityId}`);

  const eqList = rEquipNoPage.data?.data || rEquipNoPage.data;
  const eqArr = Array.isArray(eqList) ? eqList : [];
  firstEquipmentId = eqArr[0]?.id;
  log('GET /api/equipment-loans/equipment (no pagination)', rEquipNoPage.ok,
    rEquipNoPage.status, rEquipNoPage.elapsed, `${eqArr.length} alat`);

  // Cek struktur pagination: response wrapper TransformInterceptor = { success, data: { data:[], meta:{} } }
  const eqPagedOuter = rEquipPage.data;          // TransformInterceptor wrapper
  const eqPagedInner = eqPagedOuter?.data;       // inner payload = { data:[], meta:{} }
  const hasMeta = eqPagedInner?.meta !== undefined && Array.isArray(eqPagedInner?.data);
  log('GET /equipment?page=1&limit=10 (pagination - Fix #21)', rEquipPage.ok && hasMeta,
    rEquipPage.status, rEquipPage.elapsed,
    hasMeta
      ? `total=${eqPagedInner.meta.total} pages=${eqPagedInner.meta.totalPages}`
      : `WARN: struktur=${JSON.stringify(Object.keys(eqPagedOuter?.data || eqPagedOuter || {})).slice(0,60)}`);

  const eq5outer = rEquipLimit5.data;
  const eq5inner = eq5outer?.data;
  log('GET /equipment?page=1&limit=5', rEquipLimit5.ok, rEquipLimit5.status,
    rEquipLimit5.elapsed, eq5inner?.meta ? `limit=5 dapat=${eq5inner.data?.length}` : `${rEquipLimit5.status}`);

  const locArr = Array.isArray(rLiveLocation.data?.data)
    ? rLiveLocation.data.data
    : Array.isArray(rLiveLocation.data) ? rLiveLocation.data : [];
  log('GET /api/live-location (Fix #20 N+1)', rLiveLocation.ok, rLiveLocation.status,
    rLiveLocation.elapsed, `${locArr.length} user terpantau`);

  log('GET /api/notifications', rNotifications.ok, rNotifications.status, rNotifications.elapsed);
  log('GET /api/users?page=1&limit=3 (pagination users)', rDashboard.ok, rDashboard.status, rDashboard.elapsed);
  log('GET /api/schedules', rSchedules.ok, rSchedules.status, rSchedules.elapsed);
  log('GET /api/reports', rReports.ok, rReports.status, rReports.elapsed);
  log('GET /api/docs (Swagger UI)', rSwagger.status === 200, rSwagger.status, rSwagger.elapsed);
}

// ============================================================
// STEP 3: VALIDASI DTO Equipment (Fix #23)
// ============================================================
async function testDtoValidation() {
  section('VALIDASI DTO Equipment - Fix #23');

  const rNoName = await api('POST', '/api/equipment-loans/equipment', { code: 'T-INVALID', total: 1 });
  log('POST /equipment tanpa name -> expect 400', rNoName.status === 400,
    rNoName.status, rNoName.elapsed, String(rNoName.data?.message || '').slice(0, 80));

  const rNoCode = await api('POST', '/api/equipment-loans/equipment', { name: 'Test Cam', total: 1 });
  log('POST /equipment tanpa code -> expect 400', rNoCode.status === 400,
    rNoCode.status, rNoCode.elapsed, String(rNoCode.data?.message || '').slice(0, 80));

  const rCreate = await api('POST', '/api/equipment-loans/equipment', {
    name: `TestCam-${Date.now()}`,
    code: `TC-${Date.now()}`,
    category: 'Kamera',
    brand: 'Canon',
    total: 1,
    status: 'AKTIF',
  });
  const createdId = rCreate.data?.data?.id || rCreate.data?.id;
  createdEquipmentId = createdId;
  log('POST /equipment (valid body) -> expect 201/200', rCreate.ok,
    rCreate.status, rCreate.elapsed, `id=${createdId}`);
}

// ============================================================
// STEP 4: DETAIL & STOK Equipment (Fix #19)
// ============================================================
async function testEquipmentDetail() {
  section('EQUIPMENT Detail & Stok - Fix #19');

  if (!firstEquipmentId) {
    console.log(`  [${WARN}] Tidak ada equipment di DB, skip section ini`);
    return;
  }

  const [rDetail, rStock] = await Promise.all([
    api('GET', `/api/equipment-loans/equipment/${firstEquipmentId}`),
    api('GET', `/api/equipment-loans/equipment/${firstEquipmentId}/stock`),
  ]);

  const detail = rDetail.data?.data || rDetail.data;
  log(`GET /equipment/${firstEquipmentId} (aktif-alokasi Fix #19)`,
    rDetail.ok && detail?.activeAllocations !== undefined,
    rDetail.status, rDetail.elapsed,
    `available=${detail?.available} borrowed=${detail?.borrowed}`);

  const stock = rStock.data?.data || rStock.data;
  log(`GET /equipment/${firstEquipmentId}/stock`, rStock.ok, rStock.status, rStock.elapsed,
    `total=${stock?.total} avail=${stock?.available}`);
}

// ============================================================
// STEP 5: AUTH SECURITY
// ============================================================
async function testAuthSecurity() {
  section('AUTH Security Checks');

  const rWrong = await api('POST', '/api/auth/login', {
    username: LOGIN_USERNAME, password: 'WRONG_PASS_12345',
  }, false);
  log('POST /auth/login password salah -> expect 401', rWrong.status === 401,
    rWrong.status, rWrong.elapsed, rWrong.data?.message || '');

  const rNoTok = await api('GET', '/api/users/me', null, false);
  log('GET /users/me tanpa token -> expect 401', rNoTok.status === 401,
    rNoTok.status, rNoTok.elapsed);

  const origToken = token;
  token = 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOjk5OX0.INVALID_FAKE_SIG';
  const rFake = await api('GET', '/api/auth/profile');
  token = origToken;
  log('GET /auth/profile token palsu -> expect 401', rFake.status === 401,
    rFake.status, rFake.elapsed);
}

// ============================================================
// STEP 6: LIVE LOCATION (Fix #20)
// ============================================================
async function testLiveLocation() {
  section('LIVE LOCATION - Fix #20 (batch query)');

  const r = await api('GET', '/api/live-location');
  const locs = Array.isArray(r.data?.data) ? r.data.data : Array.isArray(r.data) ? r.data : [];

  log('GET /api/live-location (1 batch query)', r.ok, r.status, r.elapsed,
    `${locs.length} user terpantau`);

  if (locs.length > 0) {
    const hasCurrentActivity = 'currentActivity' in locs[0];
    log('Field currentActivity ada di response', hasCurrentActivity, r.status, 0,
      hasCurrentActivity ? `"${locs[0].currentActivity?.title || 'null'}"` : 'Field tidak ada!');
  }
}

// ============================================================
// STEP 7: CHECK-IN VALIDASI (Fix #15)
// ============================================================
async function testCheckInValidation() {
  section('CHECK-IN Validasi endTime - Fix #15');

  if (!firstActivityId) {
    console.log(`  [${WARN}] Tidak ada activity, skip`);
    return;
  }

  const r = await api('POST', `/api/activities/${firstActivityId}/check-in`, {
    latitude: -5.358488,
    longitude: 105.234472,
  });

  const msg = String(r.data?.message || '').toLowerCase();
  const isTimeGuard = msg.includes('berakhir') || msg.includes('belum tersedia') || msg.includes('selesai');

  if (r.status === 400 && isTimeGuard) {
    log(`POST /activities/${firstActivityId}/check-in (endTime guard)`, true,
      r.status, r.elapsed, r.data?.message?.slice(0, 60));
  } else if (r.ok) {
    log(`POST /activities/${firstActivityId}/check-in (kegiatan aktif, check-in OK)`, true,
      r.status, r.elapsed, 'Berhasil presensi');
  } else {
    log(`POST /activities/${firstActivityId}/check-in`, r.status === 400, r.status, r.elapsed,
      r.data?.message?.slice(0, 60));
  }
}

// ============================================================
// STEP 8: UPDATE EQUIPMENT (Fix #23)
// ============================================================
async function testEquipmentUpdate() {
  section('EQUIPMENT Update via DTO - Fix #23');

  const targetId = createdEquipmentId || firstEquipmentId;
  if (!targetId) {
    console.log(`  [${WARN}] Tidak ada equipment target, skip`);
    return;
  }

  const r = await api('PATCH', `/api/equipment-loans/equipment/${targetId}`, {
    brand: 'Sony-Updated',
    condition: 'BAIK',
  });
  log(`PATCH /equipment/${targetId} (partial DTO update)`, r.ok,
    r.status, r.elapsed, r.ok ? 'brand updated' : r.data?.message);
}

// ============================================================
// STEP 9: LOGOUT + TOKEN REVOCATION (Fix #7)
// ============================================================
async function testLogout() {
  section('LOGOUT & Token Revocation - Fix #7');

  const rLogout = await api('POST', '/api/auth/logout', {});
  log('POST /api/auth/logout', rLogout.ok, rLogout.status, rLogout.elapsed,
    rLogout.ok ? 'Token di-revoke' : rLogout.data?.message || '');

  if (rLogout.ok) {
    const rAfter = await api('GET', '/api/auth/profile');
    log('GET /auth/profile setelah logout -> expect 401', rAfter.status === 401,
      rAfter.status, rAfter.elapsed,
      rAfter.status === 401 ? 'Blacklist berfungsi!' : 'Token MASIH aktif (blacklist tidak dicek di guard)');
  }
}

// ============================================================
// SUMMARY
// ============================================================
function printSummary() {
  const total = results.length;
  const passed = results.filter(r => r.passed).length;
  const failed = total - passed;
  const avg = Math.round(results.reduce((s, r) => s + r.elapsed, 0) / total);
  const maxMs = Math.max(...results.map(r => r.elapsed));
  const slowest = results.find(r => r.elapsed === maxMs);

  console.log(`\n${C.bold}${C.cyan}${'='.repeat(70)}${C.reset}`);
  console.log(`${C.bold}  HUMASS API TEST SUMMARY${C.reset}`);
  console.log(`${'='.repeat(70)}`);
  console.log(`  Total    : ${total} tests`);
  console.log(`  ${C.green}Passed${C.reset}   : ${C.bold}${passed}${C.reset}`);
  if (failed > 0) console.log(`  ${C.red}Failed${C.reset}   : ${C.bold}${C.red}${failed}${C.reset}`);
  console.log(`  Avg Time : ${avg}ms`);
  console.log(`  Slowest  : ${maxMs}ms -- ${slowest?.label}`);

  if (failed > 0) {
    console.log(`\n${C.bold}${C.red}  Tests yang GAGAL:${C.reset}`);
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  x  ${r.label} (HTTP ${r.status})`);
    });
  }

  const pct = Math.round((passed / total) * 100);
  const color = pct >= 90 ? C.green : pct >= 70 ? C.yellow : C.red;
  console.log(`\n  ${C.bold}Score: ${color}${pct}%${C.reset}${C.bold} (${passed}/${total})${C.reset}`);
  console.log(`${C.cyan}${'='.repeat(70)}${C.reset}\n`);
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log(`\n${C.bold}${C.magenta}`);
  console.log(`  ╔══════════════════════════════════════════════════════════╗`);
  console.log(`  ║      HUMASS API - Automated Concurrent Test Suite        ║`);
  console.log(`  ║  Backend : ${BASE_URL.padEnd(44)} ║`);
  console.log(`  ╚══════════════════════════════════════════════════════════╝`);
  console.log(`${C.reset}`);

  const loginOk = await stepLogin();
  if (!loginOk) {
    console.log(`\n${C.red}Login gagal. Edit LOGIN_PASSWORD di baris 9 script ini.${C.reset}\n`);
    process.exit(1);
  }

  await runConcurrentTests();

  await Promise.all([
    testDtoValidation(),
    testEquipmentDetail(),
    testAuthSecurity(),
    testLiveLocation(),
  ]);

  await testCheckInValidation();
  await testEquipmentUpdate();
  await testLogout();

  printSummary();
}

main().catch(err => {
  console.error(`\n${C.red}Fatal: ${err.message}${C.reset}\n`);
  process.exit(1);
});
