import { test, expect, Page } from '@playwright/test';

/**
 * Data pengguna dan statistik terstandarisasi untuk pengujian E2E menyeluruh.
 */
const MOCK_ADMIN_USER = {
  id: 2,
  fullName: 'Komang Ari',
  username: 'komang.ari',
  email: 'komang.ari@polinela.ac.id',
  phone: '0812-3456-7890',
  role: 'ADMIN',
  roleLabel: 'Admin Humas',
  status: 'AKTIF',
  joinedAt: '2025-01-10T08:00:00.000Z',
  avatar: '',
};

const MOCK_SUPER_ADMIN_USER = {
  id: 1,
  fullName: 'Kepala Humas Polinela',
  username: 'kepala.humas',
  email: 'kepala.humas@polinela.ac.id',
  phone: '0811-2233-4455',
  role: 'SUPER_ADMIN',
  roleLabel: 'Kepala Humas',
  status: 'AKTIF',
  joinedAt: '2024-06-01T08:00:00.000Z',
  avatar: '',
};

const MOCK_DASHBOARD_SUMMARY = {
  statistics: {
    totalUsers: 5,
    timHumasUsers: 3,
    pendingVerificationActivities: 2,
    pendingApprovalActivities: 1,
    activeActivities: 2,
    totalActivities: 6,
    activeContentPlans: 3,
    totalContentPlans: 8,
    totalLoans: 4,
    totalEquipmentTypes: 4,
    totalEquipmentUnits: 12,
    unitsAvailable: 9,
    unitsBorrowed: 3,
  },
  monthlyStats: [
    { month: 'Jun', kegiatan: 2, konten: 1 },
    { month: 'Jul', kegiatan: 3, konten: 2 },
    { month: 'Agu', kegiatan: 4, konten: 3 },
    { month: 'Sep', kegiatan: 3, konten: 4 },
    { month: 'Okt', kegiatan: 5, konten: 3 },
    { month: 'Nov', kegiatan: 6, konten: 5 },
  ],
  agendaAnalytics: {
    periodLabel: '3 BULAN TERAKHIR',
    totalActivities: 14,
    monthsCovered: 3,
    monthsRangeLabel: 'Sep 2026 - Nov 2026',
    busiestMonth: { month: 'November', count: 6 },
    serviceFrequencies: [
      { category: 'Dokumentasi Kegiatan', count: 6 },
      { category: 'Liputan Eksternal', count: 4 },
      { category: 'Publikasi Media', count: 4 },
    ],
    monthlyTotals: [
      { month: 'Sep', total: 3 },
      { month: 'Okt', total: 5 },
      { month: 'Nov', total: 6 },
    ],
    serviceComparison: [
      { month: 'Sep', eksternal: 1, internal: 2 },
      { month: 'Okt', eksternal: 2, internal: 3 },
      { month: 'Nov', eksternal: 3, internal: 3 },
    ],
    totalInternal: 8,
    totalEksternal: 6,
  },
  upcomingActivitiesList: [
    {
      id: 101,
      title: 'Liputan Dies Natalis POLINELA',
      category: 'Dokumentasi Kegiatan',
      date: new Date().toISOString(),
      startTime: '09:00',
      endTime: '12:00',
      location: 'Gedung Serbaguna POLINELA',
      status: 'SEDANG_BERLANGSUNG',
      pic: { id: 3, fullName: 'Budi Santoso', roleLabel: 'Anggota Humas' },
      members: [{ user: { id: 4, fullName: 'Rina Wati' }, role: 'Jurnalis' }],
      loans: [
        {
          items: [{ equipment: { name: 'Sony Alpha A7 IV' } }],
        },
      ],
    },
  ],
};

interface PageHealthMonitor {
  pageErrors: Error[];
  consoleErrors: string[];
  api500Errors: string[];
  assertHealthy: (contextLabel?: string) => void;
}

/**
 * Memasang pemantau kesehatan halaman untuk memastikan:
 * 1. Tidak ada unhandled runtime error (`pageerror`)
 * 2. Tidak ada console.error kritis dari aplikasi
 * 3. Tidak ada respons API dengan status >= 500 (Internal Server Error)
 */
function attachHealthMonitor(page: Page): PageHealthMonitor {
  const pageErrors: Error[] = [];
  const consoleErrors: string[] = [];
  const api500Errors: string[] = [];

  page.on('pageerror', (err) => {
    pageErrors.push(err);
  });

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      const isExpectedAuthOrExternalTile =
        text.includes('401') ||
        text.includes('Unauthorized') ||
        text.includes('tile.openstreetmap') ||
        text.includes('favicon.ico') ||
        text.includes('ERR_CONNECTION_REFUSED');
      if (!isExpectedAuthOrExternalTile) {
        consoleErrors.push(text);
      }
    }
  });

  page.on('response', (res) => {
    const url = res.url();
    const status = res.status();
    if (url.includes('/api/') && status >= 500) {
      api500Errors.push(`${res.request().method()} ${url} -> HTTP ${status}`);
    }
  });

  return {
    pageErrors,
    consoleErrors,
    api500Errors,
    assertHealthy(contextLabel = 'Halaman') {
      expect(
        pageErrors,
        `[${contextLabel}] Ditemukan unhandled page error: ${pageErrors.map((e) => e.message).join('; ')}`
      ).toHaveLength(0);
      expect(
        api500Errors,
        `[${contextLabel}] Ditemukan API error status 500: ${api500Errors.join('; ')}`
      ).toHaveLength(0);
      expect(
        consoleErrors,
        `[${contextLabel}] Ditemukan console error: ${consoleErrors.join('; ')}`
      ).toHaveLength(0);
    },
  };
}

/**
 * Helper untuk memasang interceptor API stateful yang mendukung seluruh endpoint
 * aplikasi (GET, POST, PUT, PATCH, DELETE) secara cepat dan deterministik.
 */
async function setupApiWithFallback(page: Page) {
  let mockEquipmentList = [
    {
      id: 1,
      name: 'Sony Alpha A7 IV',
      code: 'KAM-001',
      category: 'Kamera & Audio',
      brand: 'Sony',
      serialNumber: 'SN-SONY-001',
      total: 4,
      available: 3,
      borrowed: 1,
      broken: 0,
      storage: 'Lemari Studio A1',
      condition: 'BAIK',
      status: 'AKTIF',
      description: 'Kamera Mirrorless Utama Tim Dokumentasi',
    },
    {
      id: 2,
      name: 'DJI RS 3 Pro Gimbal',
      code: 'GIM-002',
      category: 'Stabilizer',
      brand: 'DJI',
      serialNumber: 'SN-DJI-002',
      total: 2,
      available: 2,
      borrowed: 0,
      broken: 0,
      storage: 'Rak B2',
      condition: 'BAIK',
      status: 'AKTIF',
      description: 'Stabilizer kamera video',
    },
  ];

  let mockLoansList: any[] = [
    {
      id: 501,
      borrowerName: 'Budi Santoso',
      borrowerPhone: '081234567890',
      borrowDate: '2026-11-15T08:00:00.000Z',
      returnDate: '2026-11-16T16:00:00.000Z',
      purpose: 'Liputan Dies Natalis POLINELA',
      status: 'SEDANG_DIPINJAM',
      overdueDays: 0,
      items: [
        {
          id: 9001,
          equipmentId: 1,
          quantity: 1,
          returnedQuantity: 0,
          equipment: { id: 1, name: 'Sony Alpha A7 IV', code: 'KAM-001' },
        },
      ],
    },
  ];

  let mockIncomingLetters: any[] = [
    {
      id: 201,
      letterNumber: '001/PL15/HM/2026',
      sender: 'Ketua Jurusan Ekonomi dan Bisnis',
      institution: 'Jurusan Ekonomi dan Bisnis',
      recipient: 'Kepala Bagian Humas Polinela',
      subject: 'Permohonan Liputan Seminar Nasional Vokasi',
      title: 'Seminar Nasional Vokasi 2026',
      category: 'Dokumentasi Kegiatan',
      serviceType: 'INTERNAL',
      letterDate: '2026-11-14T09:00:00.000Z',
      receivedDate: '2026-11-14T09:00:00.000Z',
      date: '2026-11-20T08:00:00.000Z',
      startTime: '08:30',
      endTime: '12:00',
      location: 'Gedung Serba Guna (GSG) Polinela',
      latitude: -5.3583,
      longitude: 105.2333,
      radius: 100,
      status: 'MENUNGGU_PERSETUJUAN',
      picId: 3,
      pic: { id: 3, fullName: 'Budi Santoso', roleLabel: 'Anggota Humas' },
      members: [],
      createdAt: '2026-11-14T09:00:00.000Z',
    },
  ];

  let mockContentPlans: any[] = [
    {
      id: 301,
      title: 'Reels Dies Natalis Polinela 2026',
      platform: 'INSTAGRAM',
      contentType: 'Reels',
      category: 'Dies Natalis',
      deadline: '2026-11-20T16:00:00.000Z',
      time: '16:00 WIB',
      picId: 3,
      pic: { id: 3, fullName: 'Budi Santoso', roleLabel: 'Fotografer' },
      picName: 'Budi Santoso',
      picRole: 'Fotografer',
      status: 'PROSES',
      caption: 'Highlight kemeriahan acara Dies Natalis Polinela 2026.',
      description: 'Highlight kemeriahan acara Dies Natalis Polinela 2026.',
    },
  ];

  const mockDutySchedules: any[] = [
    {
      id: 401,
      userId: 3,
      dayOfWeek: 'SENIN',
      startTime: '08:00',
      endTime: '16:00',
      room: 'Ruang Humas Gedung A',
      notes: 'Piket layanan informasi & tamu',
      status: 'HADIR',
      user: {
        id: 3,
        fullName: 'Budi Santoso',
        roleLabel: 'Fotografer',
        phone: '0812-3456-7890',
      },
    },
  ];

  const mockUsersList: any[] = [
    MOCK_SUPER_ADMIN_USER,
    MOCK_ADMIN_USER,
    {
      id: 3,
      fullName: 'Budi Santoso',
      username: 'budi.santoso',
      email: 'budi.santoso@polinela.ac.id',
      phone: '0812-9988-7766',
      role: 'USER',
      roleLabel: 'Fotografer',
      status: 'AKTIF',
      joinedAt: '2025-02-01T08:00:00.000Z',
    },
  ];

  await page.route('**/api/**', async (route) => {
    const req = route.request();
    const url = req.url();
    const method = req.method();

    // ── AUTH ─────────────────────────────────────────────────────────────────
    if (url.includes('/api/auth/login') && method === 'POST') {
      const body = req.postDataJSON?.() || {};
      if (body.username === 'komang.ari' && body.password === 'admin123') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            accessToken: 'mock-jwt-token-admin',
            token: 'mock-jwt-token-admin',
            user: MOCK_ADMIN_USER,
          }),
        });
      } else if (body.username === 'kepala.humas' && body.password === 'admin123') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            accessToken: 'mock-jwt-token-superadmin',
            token: 'mock-jwt-token-superadmin',
            user: MOCK_SUPER_ADMIN_USER,
          }),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Username atau password salah.' }),
        });
      }
      return;
    }

    if (url.includes('/api/auth/profile')) {
      const authHeader = req.headers()['authorization'] || '';
      const isSuper = authHeader.includes('superadmin');
      const targetUser = isSuper ? MOCK_SUPER_ADMIN_USER : MOCK_ADMIN_USER;
      if (method === 'PATCH' || method === 'PUT') {
        const body = req.postDataJSON?.() || {};
        Object.assign(targetUser, body);
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(targetUser),
      });
      return;
    }

    // ── DASHBOARD ────────────────────────────────────────────────────────────
    if (url.includes('/api/dashboard/summary')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_DASHBOARD_SUMMARY),
      });
      return;
    }

    if (url.includes('/api/dashboard/agenda-analytics')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_DASHBOARD_SUMMARY.agendaAnalytics),
      });
      return;
    }

    // ── EQUIPMENT (INVENTARIS) ───────────────────────────────────────────────
    if (url.includes('/api/equipment-loans/equipment') || url.includes('/api/loans/equipment')) {
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockEquipmentList),
        });
        return;
      }
      if (method === 'POST') {
        const body = req.postDataJSON?.() || {};
        const created = {
          id: Date.now(),
          name: body.name || 'Alat Baru',
          code: body.code || 'ALT-999',
          category: body.category || 'Kamera & Audio',
          brand: body.brand || 'Canon',
          serialNumber: body.serialNumber || '',
          total: Number(body.total) || 1,
          available: Number(body.total) || 1,
          borrowed: 0,
          broken: 0,
          storage: body.storage || 'Rak A1',
          condition: body.condition || 'BAIK',
          status: body.status || 'AKTIF',
          description: body.description || '',
        };
        mockEquipmentList = [created, ...mockEquipmentList];
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(created),
        });
        return;
      }
      if (method === 'PATCH' || method === 'PUT') {
        const idMatch = url.match(/\/(\d+)(\?|$)/);
        const eqId = idMatch ? Number(idMatch[1]) : 0;
        const body = req.postDataJSON?.() || {};
        mockEquipmentList = mockEquipmentList.map((eq) =>
          eq.id === eqId
            ? {
                ...eq,
                ...body,
                total: body.total !== undefined ? Number(body.total) : eq.total,
                available:
                  body.total !== undefined ? Number(body.total) - eq.borrowed : eq.available,
              }
            : eq
        );
        const updated = mockEquipmentList.find((e) => e.id === eqId) || mockEquipmentList[0];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(updated),
        });
        return;
      }
      if (method === 'DELETE') {
        const idMatch = url.match(/\/(\d+)(\?|$)/);
        const eqId = idMatch ? Number(idMatch[1]) : 0;
        mockEquipmentList = mockEquipmentList.filter((e) => e.id !== eqId);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Deleted' }),
        });
        return;
      }
    }

    // ── PEMINJAMAN ALAT (LOANS) ──────────────────────────────────────────────
    if (url.includes('/api/equipment-loans') || url.includes('/api/loans')) {
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockLoansList),
        });
        return;
      }
      if (method === 'POST') {
        const body = req.postDataJSON?.() || {};
        const newLoan = {
          id: Date.now(),
          borrowerName: body.borrowerName,
          borrowerPhone: body.borrowerPhone,
          borrowDate: body.borrowDate || new Date().toISOString(),
          returnDate: body.returnDate || new Date().toISOString(),
          purpose: body.purpose || 'Peliputan Kegiatan Humas',
          status: 'SEDANG_DIPINJAM',
          overdueDays: 0,
          items: (body.items || []).map((it: any, idx: number) => {
            const eq =
              mockEquipmentList.find((e) => e.id === it.equipmentId) || mockEquipmentList[0];
            if (eq) {
              eq.available = Math.max(0, eq.available - (it.quantity || 1));
              eq.borrowed += it.quantity || 1;
            }
            return {
              id: Date.now() + idx,
              equipmentId: it.equipmentId,
              quantity: it.quantity || 1,
              returnedQuantity: 0,
              equipment: {
                id: eq?.id || 1,
                name: eq?.name || 'Sony Alpha A7 IV',
                code: eq?.code || 'KAM-001',
              },
            };
          }),
        };
        mockLoansList = [newLoan, ...mockLoansList];
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(newLoan),
        });
        return;
      }
      if (method === 'DELETE') {
        const idMatch = url.match(/\/(\d+)(\?|$)/);
        const loanId = idMatch ? Number(idMatch[1]) : 0;
        mockLoansList = mockLoansList.filter((l) => l.id !== loanId);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Deleted' }),
        });
        return;
      }
    }

    // ── SURAT MASUK & ACTIVITIES ─────────────────────────────────────────────
    if (url.includes('/api/activities/categories')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(['Dokumentasi Kegiatan', 'Liputan Eksternal', 'Publikasi Media']),
      });
      return;
    }

    if (url.includes('/api/incoming-letters')) {
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(mockIncomingLetters),
        });
        return;
      }
      if (method === 'POST') {
        const created = {
          id: Date.now(),
          letterNumber: '002/PL15/HM/2026',
          sender: 'Jurusan Teknologi Informasi',
          subject: 'Undangan Liputan Expo Inovasi Mahasiswa',
          title: 'Undangan Liputan Expo Inovasi Mahasiswa',
          category: 'Dokumentasi Kegiatan',
          serviceType: 'INTERNAL',
          date: new Date().toISOString(),
          startTime: '09:00',
          endTime: '12:00',
          location: 'Gedung Serba Guna (GSG) Polinela',
          status: 'MENUNGGU_PERSETUJUAN',
          picId: 3,
          pic: { id: 3, fullName: 'Budi Santoso', roleLabel: 'Anggota Humas' },
          members: [],
          createdAt: new Date().toISOString(),
        };
        mockIncomingLetters = [created, ...mockIncomingLetters];
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(created),
        });
        return;
      }
    }

    if (url.includes('/api/activities')) {
      if (method === 'GET') {
        const items = [...MOCK_DASHBOARD_SUMMARY.upcomingActivitiesList, ...mockIncomingLetters];
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items,
            total: items.length,
            hasMore: false,
            page: 1,
            pageSize: 10,
          }),
        });
        return;
      }
    }

    // ── CONTENT PLANS ────────────────────────────────────────────────────────
    if (url.includes('/api/content-plans')) {
      if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            items: mockContentPlans,
            total: mockContentPlans.length,
            hasMore: false,
            page: 1,
            pageSize: 100,
          }),
        });
        return;
      }
      if (method === 'POST') {
        const body = req.postDataJSON?.() || {};
        const created = {
          id: Date.now(),
          title: body.title || 'Konten Baru Humas',
          platform: body.platform || 'INSTAGRAM',
          contentType: body.contentType || 'Poster',
          category: body.category || 'Umum',
          deadline: body.deadline || new Date().toISOString(),
          time: '16:00 WIB',
          picId: body.picId || 3,
          pic: { id: 3, fullName: 'Budi Santoso', roleLabel: 'Fotografer' },
          picName: 'Budi Santoso',
          picRole: 'Fotografer',
          status: 'PROSES',
          caption: body.description || '',
          description: body.description || '',
        };
        mockContentPlans = [created, ...mockContentPlans];
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify(created),
        });
        return;
      }
      if (method === 'PATCH' || method === 'PUT') {
        const idMatch = url.match(/\/(\d+)(\?|$)/);
        const cpId = idMatch ? Number(idMatch[1]) : 0;
        const body = req.postDataJSON?.() || {};
        mockContentPlans = mockContentPlans.map((cp) =>
          cp.id === cpId ? { ...cp, ...body, caption: body.description ?? cp.caption } : cp
        );
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(
            mockContentPlans.find((c) => c.id === cpId) || mockContentPlans[0]
          ),
        });
        return;
      }
      if (method === 'DELETE') {
        const idMatch = url.match(/\/(\d+)(\?|$)/);
        const cpId = idMatch ? Number(idMatch[1]) : 0;
        mockContentPlans = mockContentPlans.filter((c) => c.id !== cpId);
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Deleted' }),
        });
        return;
      }
    }

    // ── JADWAL PIKET (/api/schedules) ────────────────────────────────────────
    if (url.includes('/api/schedules') || url.includes('/api/duty-schedules')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockDutySchedules),
      });
      return;
    }

    // ── USERS ────────────────────────────────────────────────────────────────
    if (url.includes('/api/users')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockUsersList),
      });
      return;
    }

    // ── LOCATIONS & NOTIFICATIONS ────────────────────────────────────────────
    if (url.includes('/api/locations')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            id: 1,
            userId: 3,
            fullName: 'Budi Santoso',
            roleLabel: 'Fotografer',
            latitude: -5.3585,
            longitude: 105.2345,
            isOnline: true,
            updatedAt: new Date().toISOString(),
          },
        ]),
      });
      return;
    }

    if (url.includes('/api/notifications')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0 }),
      });
      return;
    }

    // Default fallback untuk endpoint laporan (/api/reports/*) atau lainnya
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [], data: [], total: 0 }),
    });
  });
}

/**
 * Helper untuk menginisialisasi sesi Admin Humas / Kepala Humas dengan cepat
 * pada pengujian fitur internal (setelah alur form login diuji di Tes 1 & 2).
 */
async function authenticateSession(
  page: Page,
  role: 'ADMIN' | 'SUPER_ADMIN' = 'ADMIN'
) {
  const userObj = role === 'SUPER_ADMIN' ? MOCK_SUPER_ADMIN_USER : MOCK_ADMIN_USER;
  const tokenStr = role === 'SUPER_ADMIN' ? 'mock-jwt-token-superadmin' : 'mock-jwt-token-admin';
  await page.addInitScript(
    ({ user, token }) => {
      if (!window.localStorage.getItem('humass_token')) {
        window.localStorage.setItem('humass_token', token);
        window.localStorage.setItem('humass_user', JSON.stringify(user));
      }
    },
    { user: userObj, token: tokenStr }
  );
}

test.describe('Pengujian E2E Menyeluruh Aplikasi Humas Polinela', () => {
  test.beforeEach(async ({ page }) => {
    await setupApiWithFallback(page);
  });

  test('1. Menampilkan elemen halaman login dengan lengkap dan menguji validasi autentikasi', async ({
    page,
  }) => {
    const monitor = attachHealthMonitor(page);

    await page.goto('/login');

    // Tunggu hingga splash screen "Logo PRIMA" selesai bertransisi
    await expect(page.getByAltText('Logo PRIMA')).toBeHidden({ timeout: 10000 });

    // Pastikan judul dan subjudul login tampil
    await expect(page.getByRole('heading', { name: 'SELAMAT DATANG' })).toBeVisible();
    await expect(
      page.getByText('Silakan masuk menggunakan akun Admin Humas Polinela.')
    ).toBeVisible();

    // Pastikan input Username, Kata sandi, checkbox Ingat Saya, dan tombol Masuk tampil
    const usernameInput = page.locator('#username');
    const passwordInput = page.locator('#password');
    const togglePasswordBtn = page.locator('#togglePassword');
    const rememberMeCheckbox = page.locator('#remember-me');
    const submitBtn = page.getByRole('button', { name: /MASUK KE SISTEM/i });

    await expect(usernameInput).toBeVisible();
    await expect(passwordInput).toBeVisible();
    await expect(rememberMeCheckbox).toBeVisible();
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeEnabled();

    // Uji fitur tampilkan / sembunyikan kata sandi
    await expect(passwordInput).toHaveAttribute('type', 'password');
    await passwordInput.fill('rahasia123');
    await togglePasswordBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await togglePasswordBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Uji login gagal dengan kredensial tidak valid
    await usernameInput.fill('akun.tidak.valid');
    await passwordInput.fill('passwordsalah');
    await submitBtn.click();

    await expect(page.getByText(/Username atau password salah/i).first()).toBeVisible();
    monitor.assertHealthy('Halaman Login');
  });

  test('2. Berhasil login dan menampilkan grafik Recharts serta tabel di halaman dashboard tanpa error', async ({
    page,
  }) => {
    const monitor = attachHealthMonitor(page);

    await page.goto('/login');
    await expect(page.getByAltText('Logo PRIMA')).toBeHidden({ timeout: 10000 });

    await page.locator('#username').fill('komang.ari');
    await page.locator('#password').fill('admin123');
    await page.getByRole('button', { name: /MASUK KE SISTEM/i }).click();
    await expect(page).toHaveURL(/\/dashboard/);

    // Pastikan tidak muncul state error "Gagal Memuat Statistik"
    await expect(page.getByText('Gagal Memuat Statistik')).toHaveCount(0);

    // 1. Pastikan Welcome Banner tampil
    await expect(
      page.getByRole('heading', { name: /Selamat\s+(Pagi|Siang|Sore|Malam)/i })
    ).toBeVisible();

    // 2. Pastikan Grafik (Charts) di halaman Dashboard tampil tanpa error
    await expect(
      page.getByRole('heading', { name: 'Trend Operasional (6 Bulan Terakhir)' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Agenda Kegiatan Humas per Bulan' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Frekuensi Jenis Layanan Humas' })
    ).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Ringkasan Layanan Humas' })
    ).toBeVisible();

    // Pastikan komponen SVG grafik Recharts berhasil dirender di dalam DOM
    const chartSurfaces = page.locator('.recharts-responsive-container, svg.recharts-surface');
    await expect(chartSurfaces.first()).toBeVisible({ timeout: 15000 });
    expect(await chartSurfaces.count()).toBeGreaterThan(0);

    // Uji tombol filter periode pada grafik Agenda Kegiatan Humas (3B, 6B, Tahun, Semua)
    for (const periodLabel of ['6B', 'Tahun', 'Semua', '3B']) {
      const btn = page.getByRole('button', { name: periodLabel, exact: true });
      await expect(btn).toBeVisible();
      await btn.click();
    }

    // 3. Pastikan Tabel / Daftar Kegiatan & Ringkasan Inventaris tampil tanpa error
    await expect(page.getByRole('heading', { name: 'Kegiatan Sedang Berjalan' })).toBeVisible();

    const hasActivityItem = await page
      .getByText('Liputan Dies Natalis POLINELA')
      .isVisible()
      .catch(() => false);
    const hasEmptyState = await page
      .getByText('Belum Ada Kegiatan Terjadwal')
      .isVisible()
      .catch(() => false);
    const hasAnyActivityCard = (await page.locator('a[href^="/kegiatan/"]').count()) > 0;
    expect(hasActivityItem || hasEmptyState || hasAnyActivityCard).toBeTruthy();

    // Pastikan 4 Kartu Statistik Utama & Ringkasan Inventaris tampil
    await expect(page.getByText('JUMLAH TIM HUMAS')).toBeVisible();
    await expect(page.getByText('KEGIATAN AKTIF')).toBeVisible();
    await expect(page.getByText('CONTENT PLAN AKTIF')).toBeVisible();
    await expect(
      page.getByRole('heading', { name: 'Ringkasan Inventaris Peralatan Humas' })
    ).toBeVisible();
    await expect(page.getByText('TOTAL JENIS ALAT')).toBeVisible();
    await expect(page.getByText('TOTAL UNIT')).toBeVisible();
    await expect(page.getByText('UNIT TERSEDIA')).toBeVisible();
    await expect(page.getByText('UNIT SEDANG DIPINJAM')).toBeVisible();

    monitor.assertHealthy('Halaman Dashboard');
  });

  test('3. Navigasi seluruh menu Sidebar (termasuk sub-menu Riwayat & Persetujuan) bebas console error dan API 500', async ({
    page,
  }) => {
    test.setTimeout(120000);
    const monitor = attachHealthMonitor(page);

    await authenticateSession(page, 'ADMIN');
    await page.goto('/dashboard');
    const sidebar = page.locator('aside');

    // Daftar menu utama Sidebar untuk Admin Humas
    const mainMenus: { linkName: string; expectedUrl: RegExp; expectedHeading: RegExp }[] = [
      {
        linkName: 'Surat Masuk',
        expectedUrl: /\/surat-masuk/,
        expectedHeading: /Modul Surat Masuk Humas/i,
      },
      {
        linkName: 'Kegiatan',
        expectedUrl: /\/kegiatan/,
        expectedHeading: /Manajemen Kegiatan Kehumasan/i,
      },
      {
        linkName: 'Content Plan',
        expectedUrl: /\/content-plan/,
        expectedHeading: /Content Plan/i,
      },
      {
        linkName: 'Live Location Tim',
        expectedUrl: /\/live-location/,
        expectedHeading: /Pantau Lokasi Personel Kehumasan/i,
      },
      {
        linkName: 'Inventaris & Peminjaman',
        expectedUrl: /\/peminjaman-alat/,
        expectedHeading: /Inventaris & Peminjaman Alat/i,
      },
      {
        linkName: 'Jadwal Piket',
        expectedUrl: /\/jadwal-piket/,
        expectedHeading: /Jadwal Piket/i,
      },
      {
        linkName: 'Verifikasi Kelengkapan',
        expectedUrl: /\/verifikasi-kegiatan/,
        expectedHeading: /Verifikasi Kelengkapan/i,
      },
      {
        linkName: 'Laporan',
        expectedUrl: /\/laporan/,
        expectedHeading: /Laporan/i,
      },
      {
        linkName: 'Pengguna',
        expectedUrl: /\/pengguna/,
        expectedHeading: /Manajemen Personel & Hak Akses/i,
      },
    ];

    for (const menu of mainMenus) {
      await sidebar.getByRole('link', { name: new RegExp(`^${menu.linkName}`, 'i') }).first().click();
      await expect(page).toHaveURL(menu.expectedUrl);
      await expect(page.getByRole('heading', { name: menu.expectedHeading }).first()).toBeVisible();
      monitor.assertHealthy(`Menu Sidebar: ${menu.linkName}`);
    }

    // Uji grup akordion "Riwayat" dan keempat sub-menunya di Sidebar
    const riwayatMenus: { subLinkName: string; expectedUrl: RegExp; expectedHeading: RegExp }[] = [
      {
        subLinkName: 'Riwayat Surat Masuk',
        expectedUrl: /\/riwayat-surat/,
        expectedHeading: /Riwayat Surat Masuk/i,
      },
      {
        subLinkName: 'Riwayat Kegiatan',
        expectedUrl: /\/riwayat-kegiatan/,
        expectedHeading: /Riwayat Kegiatan/i,
      },
      {
        subLinkName: 'Riwayat Content Plan',
        expectedUrl: /\/riwayat-content-plan/,
        expectedHeading: /Riwayat Content Plan/i,
      },
      {
        subLinkName: 'Riwayat Peminjaman',
        expectedUrl: /\/riwayat-peminjaman/,
        expectedHeading: /Riwayat Peminjaman Inventaris/i,
      },
    ];

    for (const sub of riwayatMenus) {
      const subLocator = sidebar.getByRole('link', { name: new RegExp(`^${sub.subLinkName}`, 'i') }).first();
      if (!(await subLocator.isVisible())) {
        await sidebar.getByRole('button', { name: /Riwayat/i }).click();
      }
      await subLocator.click();
      await expect(page).toHaveURL(sub.expectedUrl);
      await expect(page.getByRole('heading', { name: sub.expectedHeading }).first()).toBeVisible();
      monitor.assertHealthy(`Sub-menu Riwayat: ${sub.subLinkName}`);
    }

    // Uji akses menu Persetujuan menggunakan peran Kepala Humas (SUPER_ADMIN)
    await page.evaluate(
      ({ user, token }) => {
        window.localStorage.setItem('humass_token', token);
        window.localStorage.setItem('humass_user', JSON.stringify(user));
      },
      { user: MOCK_SUPER_ADMIN_USER, token: 'mock-jwt-token-superadmin' }
    );
    await page.goto('/persetujuan?tab=surat');
    await expect(
      page.getByRole('heading', { name: /Persetujuan|Pusat Keputusan Kepala Humas/i }).first()
    ).toBeVisible();
    monitor.assertHealthy('Halaman Persetujuan (SUPER_ADMIN)');
  });

  test('4. Menguji fitur Pencarian (SearchBox) dan Filter Dropdown kustom di berbagai halaman', async ({
    page,
  }) => {
    const monitor = attachHealthMonitor(page);
    await authenticateSession(page, 'ADMIN');

    // A. Uji Filter & Pencarian di halaman Surat Masuk (/surat-masuk)
    await page.goto('/surat-masuk');
    const searchSurat = page.getByPlaceholder(/Cari no\. surat \/ pengirim \/ perihal/i);
    await expect(searchSurat).toBeVisible();
    await searchSurat.fill('Seminar Nasional');

    // Buka FilterDropdown "Semua Status Aktif"
    const statusFilterBtn = page.getByRole('button', { name: /Semua Status Aktif/i });
    await expect(statusFilterBtn).toBeVisible();
    await statusFilterBtn.click();

    // Pilih opsi "Menunggu Persetujuan" dari listbox kustom
    const optionMenunggu = page.getByRole('option', { name: 'Menunggu Persetujuan' });
    await expect(optionMenunggu).toBeVisible();
    await optionMenunggu.click();

    // Pastikan tombol Hapus filter (clear 'X') muncul dan dapat mereset filter
    const clearFilterBtn = page.getByRole('button', { name: 'Hapus filter' });
    await expect(clearFilterBtn).toBeVisible();
    await clearFilterBtn.click();
    await expect(page.getByRole('button', { name: /Semua Status Aktif/i })).toBeVisible();

    // B. Uji Filter Platform & Status di halaman Content Plan (/content-plan)
    await page.goto('/content-plan');
    const platformFilterBtn = page.getByRole('button', { name: /Semua Platform/i });
    await expect(platformFilterBtn).toBeVisible();
    await platformFilterBtn.click();
    await page.getByRole('option', { name: 'Instagram' }).click();
    await page.getByRole('button', { name: 'Hapus filter' }).first().click();

    // C. Uji 4 Filter Dropdown kustom di halaman Jadwal Piket (/jadwal-piket)
    await page.goto('/jadwal-piket');
    const hariFilterBtn = page.getByRole('button', { name: /Semua Hari/i });
    await expect(hariFilterBtn).toBeVisible();
    await hariFilterBtn.click();
    await page.getByRole('option', { name: 'Senin' }).click();

    // Reset filter di Jadwal Piket menggunakan tombol "Hapus filter" pada FilterDropdown
    const clearJadwalFilterBtn = page.getByRole('button', { name: 'Hapus filter' }).first();
    await expect(clearJadwalFilterBtn).toBeVisible();
    await clearJadwalFilterBtn.click();
    await expect(page.getByRole('button', { name: /Semua Hari/i })).toBeVisible();

    monitor.assertHealthy('Pengujian Filter & SearchBox');
  });

  test('5. Menguji validasi form error (Surat Masuk) serta Tambah, Edit, dan Hapus data (Content Plan)', async ({
    page,
  }) => {
    const monitor = attachHealthMonitor(page);
    await authenticateSession(page, 'ADMIN');

    // ── BAGIAN A: Validasi Form Error pada Input Surat Masuk (/surat-masuk) ──
    await page.goto('/surat-masuk');
    const inputSuratBtn = page.getByRole('button', { name: /Input Surat Masuk/i });
    await expect(inputSuratBtn).toBeVisible();
    await inputSuratBtn.click();

    // Pastikan modal "Input Surat Masuk Baru" terbuka
    await expect(
      page.getByRole('heading', { name: /Input Surat Masuk Baru/i })
    ).toBeVisible();

    // Pastikan rekomendasi cepat gedung Polinela tampil di dalam modal
    await expect(page.getByText(/Rekomendasi Polinela:/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'GSG Polinela' })).toBeVisible();

    // Langsung klik tombol submit tanpa mengisi kolom wajib untuk memicu validasi error form
    await page.getByRole('button', { name: /Simpan Surat Masuk/i }).click();

    // Pastikan banner error validasi form tampil dengan daftar field yang wajib diisi
    await expect(
      page.getByText(/Gagal menyimpan: Beberapa kolom wajib bertanda bintang \(\*\) belum diisi/i)
    ).toBeVisible();
    await expect(page.getByText(/Nomor Surat wajib diisi/i)).toBeVisible();

    // Tutup modal Surat Masuk
    await page.getByRole('button', { name: /^Batal$/i }).click();

    // ── BAGIAN B: Tambah, Edit, dan Hapus Data pada Content Plan (/content-plan) ──
    await page.goto('/content-plan');
    await page.getByRole('button', { name: /Tambah Content Plan/i }).click();

    // Isi form Tambah Content Plan baru
    const uniqueTitle = `Konten E2E Playwright ${Date.now()}`;
    const titleInput = page.getByPlaceholder(/Contoh: Dokumentasi PKKMB/i);
    await expect(titleInput).toBeVisible();
    await titleInput.fill(uniqueTitle);
    await page.getByPlaceholder(/Ketik platform/i).fill('Instagram');
    await page.getByPlaceholder(/Ketik jenis konten/i).fill('Poster');

    await page.getByRole('button', { name: /Simpan Content Plan/i }).click();

    // Pastikan data Content Plan yang baru ditambahkan tampil di tabel
    await expect(page.getByText(uniqueTitle).first()).toBeVisible();

    // Edit data Content Plan tersebut
    const targetRow = page.locator('tr', { hasText: uniqueTitle }).first();
    await targetRow.locator('button[title="Edit Rencana Konten"]').click();

    const updatedTitle = `${uniqueTitle} (Edited)`;
    const editTitleInput = page.getByRole('dialog').locator('input[type="text"]').first();
    await editTitleInput.fill(updatedTitle);
    await page.getByRole('button', { name: /Simpan Perubahan/i }).click();

    await expect(page.getByText(updatedTitle).first()).toBeVisible();

    // Hapus data Content Plan tersebut
    const updatedRow = page.locator('tr', { hasText: updatedTitle }).first();
    await updatedRow.locator('button[title="Hapus Content Plan"]').click();
    await page.getByRole('button', { name: /Ya, Hapus/i }).click();

    await expect(page.getByText(updatedTitle)).toHaveCount(0);
    monitor.assertHealthy('Validasi Form & CRUD Content Plan');
  });

  test('6. Menguji Tambah, Edit, Hapus Inventaris Alat serta Catat Peminjaman Unit (/peminjaman-alat)', async ({
    page,
  }) => {
    const monitor = attachHealthMonitor(page);
    await authenticateSession(page, 'ADMIN');

    await page.goto('/peminjaman-alat');
    await expect(
      page.getByRole('heading', { name: /Inventaris & Peminjaman Alat/i }).first()
    ).toBeVisible();

    // ── 1. TAMBAH ALAT INVENTARIS ────────────────────────────────────────────
    await page.getByRole('button', { name: /Tambah Alat/i }).click();
    await expect(
      page.getByRole('heading', { name: /Tambah Alat ke Inventaris/i })
    ).toBeVisible();

    const eqName = `Kamera Uji E2E ${Date.now().toString().slice(-4)}`;
    const eqCode = `E2E-${Date.now().toString().slice(-4)}`;

    await page.getByPlaceholder('Cth: Kamera DSLR Canon').fill(eqName);
    await page.getByPlaceholder('Cth: KAM-001').fill(eqCode);
    await page.getByPlaceholder('Cth: Canon, Sony, DJI').fill('Sony');
    await page.getByPlaceholder('Cth: Rak A3, Lemari Studio').fill('Lemari E2E');
    await page.getByRole('button', { name: /Simpan Alat/i }).click();

    // Pastikan alat baru tampil di tabel inventaris
    await expect(page.getByText(eqName).first()).toBeVisible();

    // ── 2. EDIT ALAT INVENTARIS ──────────────────────────────────────────────
    const eqRow = page.locator('tr', { hasText: eqName }).first();
    await eqRow.locator('button[title="Edit"]').click();

    const editedEqName = `${eqName} Pro`;
    await page.getByPlaceholder('Cth: Kamera DSLR Canon').fill(editedEqName);
    await page.getByRole('button', { name: /Perbarui Alat/i }).click();
    await expect(page.getByText(editedEqName).first()).toBeVisible();

    // ── 3. PEMINJAMAN UNIT ALAT (TAB PEMINJAMAN AKTIF & TERLAMBAT) ──────────
    await page.getByRole('button', { name: /Peminjaman Aktif & Terlambat/i }).click();
    await page.getByRole('button', { name: /Catat Peminjaman/i }).click();

    await expect(page.getByRole('heading', { name: /Catat Peminjaman Alat/i })).toBeVisible();

    // Isi informasi peminjam tetapi belum memilih unit alat -> uji validasi wajib pilih alat
    await page.getByPlaceholder('Nama lengkap peminjam').fill('Andi Pratama E2E');
    await page.getByPlaceholder('08xxxxxxxxxx').fill('081234567899');
    await page
      .getByPlaceholder('Deskripsi keperluan peminjaman alat...')
      .fill('Liputan Kegiatan Wisuda Polinela');

    await page.getByRole('button', { name: /Simpan Peminjaman/i }).click();
    // Toast error validasi "Pilih minimal satu peralatan!" muncul dan modal tetap terbuka
    await expect(page.getByText(/Pilih minimal satu peralatan/i).first()).toBeVisible();

    // Pilih salah satu unit peralatan yang tersedia (+ Pilih)
    const pilihBtn = page.getByRole('button', { name: '+ Pilih' }).first();
    await expect(pilihBtn).toBeVisible();
    await pilihBtn.click();

    // Simpan peminjaman unit
    await page.getByRole('button', { name: /Simpan Peminjaman/i }).click();

    // Pastikan catatan peminjaman unit baru tampil di daftar Peminjaman Aktif
    await expect(page.getByText('Andi Pratama E2E').first()).toBeVisible();

    // ── 4. HAPUS ALAT INVENTARIS YANG DIBUAT SAAT UJI ────────────────────────
    await page.getByRole('button', { name: /Inventaris Alat/i }).click();
    const editedRow = page.locator('tr', { hasText: editedEqName }).first();
    await editedRow.locator('button[title="Hapus"]').click();
    await page.getByRole('button', { name: /Ya, Hapus/i }).click();
    await expect(page.getByText(editedEqName)).toHaveCount(0);

    monitor.assertHealthy('CRUD Inventaris & Peminjaman Unit');
  });

  test('7. Menguji validasi form Profil Pengguna dan proses Logout hingga kembali ke halaman Login', async ({
    page,
  }) => {
    const monitor = attachHealthMonitor(page);
    await authenticateSession(page, 'ADMIN');

    // Kunjungi halaman Profil (/profil)
    await page.goto('/profil');
    await expect(
      page.getByRole('heading', { name: /Profil Personel Kehumasan/i }).first()
    ).toBeVisible();

    // Uji validasi format nomor telepon tidak valid pada form profil
    const phoneInput = page.getByPlaceholder(/Contoh: 0812-3456-7890/i);
    if (await phoneInput.isVisible().catch(() => false)) {
      await phoneInput.fill('12345');
      await page.getByRole('button', { name: /Simpan Perubahan Profil/i }).click();
      await expect(page.getByText(/Nomor telepon harus diawali 08/i).first()).toBeVisible();

      // Kembalikan nomor telepon yang valid
      await phoneInput.fill('081234567890');
    }

    // Uji fitur lihat kata sandi (toggle icon mata) pada form kata sandi
    const currentPwInput = page.getByPlaceholder(/Masukkan kata sandi lama Anda/i);
    if (await currentPwInput.isVisible().catch(() => false)) {
      await expect(currentPwInput).toHaveAttribute('type', 'password');
      const toggleBtn = page.getByRole('button', { name: /(Lihat|Sembunyikan) kata sandi saat ini/i });
      await toggleBtn.click();
      await expect(currentPwInput).toHaveAttribute('type', 'text');
      await toggleBtn.click();
      await expect(currentPwInput).toHaveAttribute('type', 'password');
    }

    // Lakukan Logout melalui tombol "Keluar" di Sidebar
    const logoutBtn = page.locator('aside').getByRole('button', { name: /Keluar/i });
    await expect(logoutBtn).toBeVisible();
    await logoutBtn.click();

    // Pastikan diarahkan kembali ke halaman /login dan sesi telah dibersihkan
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: 'SELAMAT DATANG' })).toBeVisible();

    const tokenAfterLogout = await page.evaluate(() => localStorage.getItem('humass_token'));
    expect(tokenAfterLogout).toBeNull();

    monitor.assertHealthy('Halaman Profil & Logout');
  });
});
