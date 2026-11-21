'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import AdminLayout from '@/components/layout/AdminLayout';
import CustomButton from '@/components/common/CustomButton';
import DashboardSkeleton from '@/components/common/DashboardSkeleton';
import {
  CalendarCheck2, FileText, Users, Clock, AlertCircle,
  TrendingUp, ArrowRight, Camera, Plus,
  ZoomIn, ZoomOut, LocateFixed, Tv, ExternalLink, RotateCcw,
  BarChart3, Loader2, ShieldAlert, Radio, CalendarClock,
} from 'lucide-react';
import { dashboardService, locationService, activityService } from '@/services';
import { getStoredUser } from '@/utils/session';
import { LocationData } from '@/types';
import { toast } from 'sonner';

// Heavy interactive components loaded dynamically to optimize initial bundle & LCP
const CampusMap = dynamic(() => import('@/components/common/CampusMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-80 bg-slate-50/80 rounded-2xl flex flex-col items-center justify-center text-slate-400 text-xs gap-2 animate-pulse border border-slate-100">
      <Loader2 className="w-6 h-6 text-[#003D58] animate-spin" />
      <span className="font-medium text-slate-500">Memuat Peta Live Location...</span>
    </div>
  ),
});

const DashboardMonthlyChart = dynamic(
  () => import('@/components/dashboard/DashboardMonthlyChart'),
  {
    ssr: false,
    loading: () => <div className="h-36 sm:h-40 w-full bg-slate-50/80 rounded-xl animate-pulse" />,
  }
);

const DashboardAgendaMonthlyChart = dynamic(
  () => import('@/components/dashboard/DashboardAgendaCharts').then((m) => m.DashboardAgendaMonthlyChart),
  {
    ssr: false,
    loading: () => <div className="h-36 sm:h-40 w-full bg-slate-50/80 rounded-xl animate-pulse" />,
  }
);

const DashboardServiceFreqChart = dynamic(
  () => import('@/components/dashboard/DashboardAgendaCharts').then((m) => m.DashboardServiceFreqChart),
  {
    ssr: false,
    loading: () => <div className="h-40 sm:h-44 w-full bg-slate-50/80 rounded-xl animate-pulse" />,
  }
);

const DashboardServiceCompChart = dynamic(
  () => import('@/components/dashboard/DashboardAgendaCharts').then((m) => m.DashboardServiceCompChart),
  {
    ssr: false,
    loading: () => <div className="h-44 sm:h-48 w-full bg-slate-50/80 rounded-xl animate-pulse" />,
  }
);

/* ─── Default Campus Coordinates (Polinela) ─── */
const POLINELA_CAMPUS_CENTER: [number, number] = [105.2345, -5.3585];

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(() => {
    if (typeof window !== 'undefined') {
      return getStoredUser();
    }
    return null;
  });
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [realActivities, setRealActivities] = useState<any[]>([]);
  const [agendaPeriod, setAgendaPeriod] = useState<'3m' | '6m' | 'year' | 'all'>('3m');
  const [agendaAnalytics, setAgendaAnalytics] = useState<any>(null);
  const [agendaLoading, setAgendaLoading] = useState(false);

  // Map controls state
  const [mapCenter, setMapCenter] = useState<[number, number]>(POLINELA_CAMPUS_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(16);
  const [recenterTrigger, setRecenterTrigger] = useState<number>(0);
  const [zoomInTrigger, setZoomInTrigger] = useState<number>(0);
  const [zoomOutTrigger, setZoomOutTrigger] = useState<number>(0);

  // Dynamic greeting based on current system time (Pagi / Siang / Sore / Malam)
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const [greeting, setGreeting] = useState<string>(getGreeting);

  useEffect(() => {
    setGreeting(getGreeting());
    const interval = setInterval(() => {
      setGreeting(getGreeting());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(false);
    try {
      const [summaryRes, locsRes, actsRes] = await Promise.allSettled([
        dashboardService.summary(),
        locationService.getAll(),
        activityService.getAll({ pageSize: 10 }),
      ]);

      let acts: any[] = [];
      if (actsRes.status === 'fulfilled') {
        const val = actsRes.value as any;
        acts = Array.isArray(val?.items) ? val.items : Array.isArray(val?.data) ? val.data : Array.isArray(val) ? val : [];
      }

      if (summaryRes.status === 'fulfilled') {
        const sumData = summaryRes.value;
        setDashboardData(sumData);
        if (sumData.agendaAnalytics) {
          setAgendaAnalytics(sumData.agendaAnalytics);
        }

        if (acts.length === 0 && Array.isArray(sumData.upcomingActivitiesList) && sumData.upcomingActivitiesList.length > 0) {
          acts = sumData.upcomingActivitiesList;
        }
      } else {
        throw new Error('Summary failed');
      }

      setRealActivities(acts);

      if (locsRes.status === 'fulfilled' && Array.isArray(locsRes.value)) {
        setLocations(locsRes.value.filter((l: any) => l.user?.role === 'USER'));
      }
    } catch {
      setError(true);
      toast.error('Gagal memuat data statistik dashboard dari server.');
    } finally {
      setLoading(false);
    }
  };

  const handleAgendaPeriodChange = async (period: '3m' | '6m' | 'year' | 'all') => {
    setAgendaPeriod(period);
    setAgendaLoading(true);
    try {
      const data = await dashboardService.agendaAnalytics(period);
      setAgendaAnalytics(data);
    } catch {
      toast.error('Gagal memuat analitik agenda kegiatan.');
    } finally {
      setAgendaLoading(false);
    }
  };

  useEffect(() => {
    const user = getStoredUser();
    setCurrentUser(user);
    loadDashboard();
  }, []);

  const handleZoomIn = () => setZoomInTrigger((prev) => prev + 1);
  const handleZoomOut = () => setZoomOutTrigger((prev) => prev + 1);
  const handleRecenter = () => {
    setMapCenter([...POLINELA_CAMPUS_CENTER]);
    setMapZoom(16);
    setRecenterTrigger((prev) => prev + 1);
  };

  const getActivityBadge = (status: string) => {
    switch (status) {
      case 'SEDANG_BERLANGSUNG':
        return {
          label: 'Sedang Berjalan • Liputan',
          className: 'bg-sky-50 text-[#003D58] border-sky-200/80',
          dot: true,
        };
      case 'MENUNGGU_PERSETUJUAN_AKHIR':
      case 'MENUNGGU_VERIFIKASI':
        return {
          label: 'Menunggu Persetujuan Akhir',
          className: 'bg-indigo-50 text-indigo-700 border-indigo-200/80',
          dot: false,
        };
      case 'DITUGASKAN':
        return {
          label: 'Ditugaskan • Peliputan',
          className: 'bg-blue-50 text-blue-700 border-blue-200/80',
          dot: false,
        };
      case 'DISETUJUI':
        return {
          label: 'Disetujui • Terjadwal',
          className: 'bg-sky-50 text-[#003D58] border-sky-200/80',
          dot: false,
        };
      case 'AKAN_DATANG':
        return {
          label: 'Akan Datang',
          className: 'bg-amber-50 text-amber-800 border-amber-200/80',
          dot: false,
        };
      case 'SELESAI':
        return {
          label: 'Selesai Peliputan',
          className: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: false,
        };
      default:
        return {
          label: status ? status.replace(/_/g, ' ') : 'Aktif',
          className: 'bg-slate-100 text-slate-700 border-slate-200',
          dot: false,
        };
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Dashboard Operasional Humas">
        <DashboardSkeleton />
      </AdminLayout>
    );
  }

  if (error || !dashboardData) {
    return (
      <AdminLayout title="Dashboard Operasional Humas">
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-4 max-w-md mx-auto my-12 shadow-xs">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base font-['Poppins']">Gagal Memuat Statistik</h3>
            <p className="text-xs text-slate-500 mt-1 font-['Poppins']">Terjadi kesalahan saat mengambil data dari server.</p>
          </div>
          <CustomButton variant="primary" icon={RotateCcw} onClick={loadDashboard}>
            Coba Lagi
          </CustomButton>
        </div>
      </AdminLayout>
    );
  }

  const stats = dashboardData.statistics || {};

  const rawName = currentUser?.fullName?.trim() || 'Komang Ari';
  const isKepalaHumas =
    currentUser?.role === 'SUPER_ADMIN' ||
    currentUser?.roleLabel?.toLowerCase().includes('kepala');

  // Khusus akun Kepala Humas: tidak disingkat (tampilkan nama lengkap seutuhnya).
  // Untuk Admin Humas / Anggota: gunakan nama depan yang lebih akrab / nama operasional.
  const displayName = isKepalaHumas
    ? rawName
    : rawName.toLowerCase().startsWith('admin')
      ? rawName
      : rawName.split(' ')[0] || rawName;
  const roleBadge = currentUser?.roleLabel || (isKepalaHumas ? 'KEPALA HUMAS' : 'ADMIN HUMAS');

  const activeContent = stats.activeContentPlans ?? 0;

  // Monthly stats for Line chart directly from DB monthly statistics
  const monthlyData = (dashboardData.monthlyStats && dashboardData.monthlyStats.length > 0)
    ? dashboardData.monthlyStats.map((m: any) => ({
      month: m.month,
      kegiatan: Number(m.kegiatan) || 0,
      konten: Number(m.konten) || 0,
    }))
    : [
      { month: 'Jun', kegiatan: 0, konten: 0 },
      { month: 'Jul', kegiatan: 0, konten: 0 },
      { month: 'Agu', kegiatan: 0, konten: 0 },
      { month: 'Sep', kegiatan: 0, konten: 0 },
      { month: 'Okt', kegiatan: 0, konten: 0 },
      { month: 'Nov', kegiatan: realActivities.length, konten: activeContent },
    ];

  const maxChartVal = Math.max(
    4,
    ...monthlyData.map((d: any) => Math.max(d.kegiatan, d.konten))
  );

  // Agenda Kegiatan Humas analytics data
  const agenda = agendaAnalytics || {
    periodLabel: '3 BULAN TERAKHIR',
    totalActivities: stats.totalActivities ?? 0,
    monthsCovered: 3,
    monthsRangeLabel: '-',
    busiestMonth: { month: '-', count: 0 },
    serviceFrequencies: [],
    monthlyTotals: [],
    serviceComparison: [],
    totalInternal: 0,
    totalEksternal: 0,
  };
  const serviceFreqData = (agenda.serviceFrequencies || []).slice(0, 8);
  const monthlyAgendaData = agenda.monthlyTotals || [];
  const serviceComparisonData = agenda.serviceComparison || [];

  return (
    <AdminLayout title="Dashboard Operasional Humas">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch pb-6">

        {/* ═════════════════════════════════════════════════════════ */}
        {/* LEFT COLUMN: BANNER, PETA, KEGIATAN, TREND               */}
        {/* ═════════════════════════════════════════════════════════ */}
        <div className="xl:col-span-7 flex flex-col gap-4">

          {/* 1. Welcome Banner */}
          <div
            className="rounded-2xl px-5 sm:px-8 py-5 text-white relative overflow-hidden flex flex-col justify-center shadow-xs"
            style={{
              background: '#003D5B',
              minHeight: '134px',
            }}
          >
            {/* Dekorasi kurva & lingkaran (Figma: Kartu Admin Humas) */}
            <svg
              aria-hidden="true"
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 1604 134"
              preserveAspectRatio="xMaxYMid slice"
              fill="none"
            >
              {/* Kurva belakang */}
              <path
                d="M785 134 C 900 40, 1150 22, 1604 27 L1604 134 Z"
                fill="rgba(45, 212, 191, 0.12)"
              />
              {/* Kurva tengah */}
              <path
                d="M985 134 C 1100 70, 1350 50, 1604 54 L1604 134 Z"
                fill="rgba(45, 212, 191, 0.22)"
              />
              {/* Garis aksen 1 */}
              <path
                d="M731 114 C 900 30, 1200 16, 1604 17"
                stroke="rgba(94, 234, 212, 0.6)"
                strokeWidth="1.8"
              />
              {/* Garis aksen 2 */}
              <path
                d="M621 134 C 800 100, 1150 80, 1604 80"
                stroke="rgba(94, 234, 212, 0.3)"
                strokeWidth="1.35"
              />
              {/* Lingkaran besar */}
              <circle cx="1210" cy="22" r="95" stroke="rgba(94, 234, 212, 0.25)" strokeWidth="2" />
              {/* Lingkaran kecil */}
              <circle cx="1295" cy="22" r="66" stroke="rgba(94, 234, 212, 0.18)" strokeWidth="1.5" />
            </svg>

            <div className="relative z-10 flex items-center justify-between gap-3 mb-3">
              <span
                className="inline-flex items-center justify-center px-3 py-1 rounded-[9px] text-white text-[12px] leading-[18px] font-bold tracking-wide uppercase font-['Poppins']"
                style={{ background: 'rgba(255, 255, 255, 0.15)' }}
              >
                {roleBadge}
              </span>

              {/* TV Display Quick Link */}
              <Link
                href="/dashboard/display"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 text-white text-[11px] font-semibold backdrop-blur-sm border border-white/20 transition-all shrink-0 font-['Poppins']"
                title="Buka Mode Layar TV Monitoring"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Mode TV Display</span>
                <ExternalLink className="w-3 h-3 opacity-80" />
              </Link>
            </div>

            <h1 className="relative z-10 text-xl sm:text-2xl font-bold text-white leading-9 font-['Poppins']">
              {greeting}, {displayName}!
            </h1>
          </div>

          {/* 2. Peta Monitoring Kampus Polinela */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-4.5 shadow-xs flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-sm font-bold text-[#0F172A] leading-snug font-['Poppins']">
                  Peta Monitoring Kampus Polinela
                </h2>
                <p className="text-[11px] text-[#64748B] mt-0.5 font-['Poppins']">
                  Tracking geolokasi tim liputan, verifikasi radius GPS, dan status operasional di lapangan
                </p>
              </div>

              {/* Controls */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                  title="Perbesar Peta"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 flex items-center justify-center transition-colors cursor-pointer shadow-xs"
                  title="Perkecil Peta"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Campus Map View */}
            <div className="relative w-full rounded-xl overflow-hidden border border-slate-100">
              <CampusMap
                locations={locations}
                center={mapCenter}
                zoom={mapZoom}
                recenterTrigger={recenterTrigger}
                zoomInTrigger={zoomInTrigger}
                zoomOutTrigger={zoomOutTrigger}
                height="h-[230px] sm:h-[250px]"
              />
            </div>

            {/* Bottom Legend */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs text-[#64748B]">
              <div className="flex items-center gap-4 flex-wrap">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#003D58] shrink-0" />
                  <span className="font-medium text-[#334155] font-['Poppins'] text-[11px]">
                    Personel Online (Biru)
                  </span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#94A3B8] shrink-0" />
                  <span className="font-medium text-[#334155] font-['Poppins'] text-[11px]">
                    Personel Offline (Abu-abu)
                  </span>
                </span>
              </div>
              <span className="text-[10px] italic text-[#64748B] font-['Poppins']">
                Klik marker untuk melihat detail profil &amp; WhatsApp
              </span>
            </div>
          </div>

          {/* 3. Kegiatan Sedang Berjalan (Memuat Kegiatan Riil Dari Database) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-4.5 shadow-xs flex flex-col gap-3 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#0F172A] leading-snug font-['Poppins']">
                  Kegiatan Sedang Berjalan
                </h2>
                <p className="text-[11px] text-[#64748B] mt-0.5 font-['Poppins']">
                  Pemantauan liputan lapangan langsung dari data kegiatan sistem
                </p>
              </div>
              <Link
                href="/kegiatan"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold text-[#003D58] bg-[#F0F9FF] border border-sky-200 hover:bg-sky-100 transition-colors shrink-0 font-['Poppins']"
              >
                {currentUser?.role === 'SUPER_ADMIN' ? (
                  <>
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Log</span>
                  </>
                ) : (
                  <>
                    <span>Lihat Kegiatan</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </Link>
            </div>

            {/* List Kegiatan Riil */}
            <div className="flex flex-col gap-2.5">
              {realActivities.length === 0 ? (
                <div className="py-6 text-center flex flex-col items-center justify-center rounded-xl bg-slate-50/70 border border-dashed border-slate-200">
                  <CalendarCheck2 className="w-7 h-7 text-slate-300 mb-1.5" />
                  <p className="font-bold text-slate-700 text-xs font-['Poppins']">Belum Ada Kegiatan Terjadwal</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-['Poppins']">
                    {currentUser?.role === 'SUPER_ADMIN'
                      ? 'Klik "Tambah Log" untuk membuat jadwal peliputan baru.'
                      : 'Menunggu penugasan jadwal peliputan dari Kepala Humas.'}
                  </p>
                  {currentUser?.role === 'SUPER_ADMIN' && (
                    <Link
                      href="/kegiatan"
                      className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white bg-[#003D58] hover:bg-[#002B3E] transition-all shadow-xs cursor-pointer font-['Poppins']"
                    >
                      <Plus className="w-3.5 h-3.5" /> Buat Kegiatan Baru
                    </Link>
                  )}
                </div>
              ) : (
                realActivities.slice(0, 4).map((act) => {
                  const badge = getActivityBadge(act.status);

                  // Formatting anggota tim
                  const memberStrings: string[] = [];
                  if (act.pic?.fullName) {
                    memberStrings.push(`${act.pic.fullName} (PIC)`);
                  }
                  (act.members || []).forEach((m: any) => {
                    const name = m.user?.fullName || m.name;
                    if (name && name !== act.pic?.fullName) {
                      memberStrings.push(m.role ? `${name} (${m.role})` : name);
                    }
                  });
                  const teamText = memberStrings.length > 0 ? memberStrings.join(', ') : 'Tim Humas Polinela';

                  // Formatting alat yang dipinjam
                  const equipmentList: string[] = (act.loans || [])
                    .flatMap((l: any) => (l.items || []).map((it: any) => it.equipment?.name || it.name))
                    .filter(Boolean);
                  const equipmentText = equipmentList.length > 0
                    ? equipmentList.slice(0, 3).join(', ')
                    : (act.category || 'Dokumentasi & Peliputan');

                  return (
                    <div
                      key={act.id}
                      className="p-3 rounded-xl border border-slate-100 bg-[#FBFDFF] hover:bg-slate-50 transition-colors flex flex-col gap-1.5"
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${badge.className} font-['Poppins']`}>
                          {badge.dot && (
                            <span className="w-1.5 h-1.5 rounded-full bg-[#003D58] animate-pulse" />
                          )}
                          {badge.label}
                        </span>
                        <span className="text-[11px] text-[#64748B] flex items-center gap-1 font-medium font-['Poppins']">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {act.startTime || '08:00'} – {act.endTime || 'Selesai'} WIB
                        </span>
                      </div>

                      <div>
                        <Link href={`/kegiatan/${act.id}`}>
                          <h3 className="text-xs sm:text-[13px] font-bold text-[#0F172A] leading-snug hover:text-[#003D58] transition-colors font-['Poppins']">
                            {act.title}
                          </h3>
                        </Link>
                        <p className="text-[11px] text-[#64748B] mt-0.5 font-['Poppins']">
                          {act.location || 'Kampus Polinela'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 text-xs">
                        <span className="font-medium text-[#334155] text-[11px] truncate max-w-[280px] font-['Poppins']" title={teamText}>
                          {teamText}
                        </span>
                        <div className="flex items-center gap-1 text-[#64748B] shrink-0 ml-2" title={equipmentText}>
                          <Camera className="w-3 h-3 text-slate-400" />
                          <span className="text-[10px] font-medium truncate max-w-[170px] font-['Poppins']">
                            {equipmentText}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Ringkasan Kegiatan */}
            <div className="mt-auto pt-2.5 border-t border-slate-100 flex items-center justify-between gap-2 text-[11px] font-['Poppins']">
              <span className="text-slate-500 font-medium">
                Menampilkan {Math.min(realActivities.length, 4)} dari {realActivities.length} kegiatan aktif
              </span>
              <Link
                href="/kegiatan"
                className="font-bold text-[#003D58] hover:underline inline-flex items-center gap-1"
              >
                <span>Semua Kegiatan</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

        </div>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* RIGHT COLUMN (DI SAMPING MAP): AGENDA KEGIATAN HUMAS      */}
        {/* ═════════════════════════════════════════════════════════ */}
        <div className="xl:col-span-5 flex flex-col gap-4">

          {/* 1. Agenda Humas per Bulan & Ringkasan Total */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-4.5 shadow-xs flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h2 className="text-sm font-bold text-[#0F172A] leading-snug font-['Poppins']">
                  Agenda Kegiatan Humas per Bulan
                </h2>
                <p className="text-[11px] text-[#64748B] mt-0.5 font-['Poppins']">
                  Periode {agenda.monthsRangeLabel || agenda.periodLabel} • Ringkasan agenda tercatat
                </p>
              </div>

              {/* Period Filter Pills */}
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 border border-slate-200/70 font-['Poppins'] shrink-0">
                {[
                  { key: '3m', label: '3B' },
                  { key: '6m', label: '6B' },
                  { key: 'year', label: 'Tahun' },
                  { key: 'all', label: 'Semua' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    disabled={agendaLoading}
                    onClick={() => handleAgendaPeriodChange(opt.key as '3m' | '6m' | 'year' | 'all')}
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${agendaPeriod === opt.key
                        ? 'bg-white text-[#003D58] shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                      }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Ringkasan Total (3 Compact Stat Boxes) */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl border border-sky-100 bg-[#F0F9FF] flex flex-col items-center justify-center text-center">
                <span className="text-[9px] font-bold tracking-wider text-[#64748B] uppercase font-['Poppins']">
                  TOTAL KEGIATAN
                </span>
                <span className="text-lg sm:text-xl font-black text-[#0F172A] mt-0.5 font-['Poppins']">
                  {agenda.totalActivities ?? 0}
                </span>
                <span className="text-[9px] text-[#64748B] font-['Poppins']">
                  agenda tercatat
                </span>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-100 bg-[#F8FAFC] flex flex-col items-center justify-center text-center">
                <span className="text-[9px] font-bold tracking-wider text-[#64748B] uppercase font-['Poppins']">
                  BULAN TERCAKUP
                </span>
                <span className="text-lg sm:text-xl font-black text-[#0F172A] mt-0.5 font-['Poppins']">
                  {agenda.monthsCovered ?? 0}
                </span>
                <span className="text-[9px] text-[#64748B] truncate max-w-full font-['Poppins']">
                  {agenda.monthsRangeLabel || '-'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl border border-blue-100 bg-[#EFF6FF] flex flex-col items-center justify-center text-center">
                <span className="text-[9px] font-bold tracking-wider text-[#003D58] uppercase font-['Poppins']">
                  BULAN TERPADAT
                </span>
                <span className="text-sm sm:text-base font-black text-[#003D58] mt-0.5 truncate max-w-full font-['Poppins']">
                  {agenda.busiestMonth?.month || '-'}
                </span>
                <span className="text-[9px] text-[#64748B] font-['Poppins']">
                  {agenda.busiestMonth?.count ?? 0} kegiatan
                </span>
              </div>
            </div>

            {/* Chart: Agenda Humas per Bulan */}
            <DashboardAgendaMonthlyChart data={monthlyAgendaData} loading={agendaLoading} />

            {/* Legend */}
            <div className="flex items-center justify-between gap-4 text-xs text-[#334155] pt-1.5 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#003D58]" />
                <span className="font-medium text-[11px] font-['Poppins']">Jumlah Kegiatan per Bulan</span>
              </div>
              <span className="text-[10px] text-[#64748B] font-medium font-['Poppins']">
                Total: {agenda.totalActivities ?? 0} Agenda
              </span>
            </div>
          </div>

          {/* 2. Frekuensi Jenis Layanan Humas */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-4.5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#0F172A] leading-snug font-['Poppins']">
                  Frekuensi Jenis Layanan Humas
                </h2>
                <p className="text-[11px] text-[#64748B] mt-0.5 font-['Poppins']">
                  Distribusi kategori layanan dokumentasi, publikasi, dan liputan
                </p>
              </div>
              <BarChart3 className="w-4 h-4 text-[#003D58] shrink-0" />
            </div>

            <DashboardServiceFreqChart data={serviceFreqData} loading={agendaLoading} />

            {/* Legend */}
            <div className="flex items-center gap-5 text-xs text-[#334155] pt-1.5 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#003D58]" />
                <span className="font-medium text-[11px] font-['Poppins']">Frekuensi Layanan</span>
              </div>
            </div>
          </div>

          {/* 3. Info Penting & Prioritas Operasional (Mengisi area kanan agar seimbang) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-4.5 shadow-xs flex flex-col justify-between gap-3 flex-1">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#0F172A] leading-snug font-['Poppins']">
                  Info Penting &amp; Prioritas Hari Ini
                </h2>
                <p className="text-[11px] text-[#64748B] mt-0.5 font-['Poppins']">
                  Ringkasan tindakan cepat, status alat, dan piket operasional
                </p>
              </div>
              <ShieldAlert className="w-4 h-4 text-[#003D58] shrink-0" />
            </div>

            {/* Quick Priority Status List */}
            <div className="space-y-2">
              <Link
                href="/persetujuan"
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-sky-50/60 hover:border-sky-200/70 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#0F172A] truncate font-['Poppins']">
                      Menunggu Persetujuan Kepala Humas
                    </p>
                    <p className="text-[10px] text-slate-500 truncate font-['Poppins']">
                      Pengajuan kegiatan &amp; pemeriksaan akhir
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[11px] font-bold shrink-0">
                  {stats.pendingApprovalActivities ?? 0}
                </span>
              </Link>

              <Link
                href="/peminjaman-alat"
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-sky-50/60 hover:border-sky-200/70 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                      (stats.overdueLoans ?? 0) > 0
                        ? 'bg-rose-50 text-rose-600'
                        : 'bg-sky-50 text-[#003D58]'
                    }`}
                  >
                    <Camera className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#0F172A] truncate font-['Poppins']">
                      {(stats.overdueLoans ?? 0) > 0
                        ? 'Peminjaman Alat Terlambat'
                        : 'Status Peminjaman Peralatan'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate font-['Poppins']">
                      {stats.activeLoans ?? 0} peminjaman aktif • {stats.unitsAvailable ?? 0} unit tersedia
                    </p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold shrink-0 ${
                    (stats.overdueLoans ?? 0) > 0
                      ? 'bg-rose-100 text-rose-700'
                      : 'bg-sky-100 text-[#003D58]'
                  }`}
                >
                  {(stats.overdueLoans ?? 0) > 0
                    ? `${stats.overdueLoans} Terlambat`
                    : 'Aman'}
                </span>
              </Link>

              <Link
                href="/live-location"
                className="flex items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-sky-50/60 hover:border-sky-200/70 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <Radio className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-[#0F172A] truncate font-['Poppins']">
                      Pemantauan GPS Tim Lapangan
                    </p>
                    <p className="text-[10px] text-slate-500 truncate font-['Poppins']">
                      Anggota humas aktif mengirim lokasi real-time
                    </p>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-bold shrink-0">
                  {locations.filter((l) => l.isOnline).length}/{locations.length} Online
                </span>
              </Link>
            </div>

            {/* Petugas Piket Terdekat */}
            <div className="pt-2.5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0F172A] font-['Poppins']">
                  <CalendarClock className="w-3.5 h-3.5 text-[#003D58]" />
                  Jadwal Piket Tim Humas
                </span>
                <Link
                  href="/jadwal-piket"
                  className="text-[11px] font-semibold text-[#003D58] hover:underline font-['Poppins']"
                >
                  Lihat Jadwal →
                </Link>
              </div>
              {Array.isArray(dashboardData?.todaySchedules) && dashboardData.todaySchedules.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {dashboardData.todaySchedules.slice(0, 4).map((sched: any, idx: number) => (
                    <div
                      key={sched.id || idx}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-50 border border-slate-100 min-w-0"
                    >
                      <p className="text-[11px] font-bold text-slate-800 truncate font-['Poppins']">
                        {sched.user?.fullName || sched.userName || 'Petugas Humas'}
                      </p>
                      <p className="text-[10px] text-slate-500 truncate font-['Poppins']">
                        {sched.shift || sched.dayOfWeek || 'Piket Operasional'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400 italic font-['Poppins']">
                  Belum ada petugas piket tercatat untuk hari ini.
                </p>
              )}
            </div>
          </div>

        </div>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* BALANCED CHART ROW: TREND OPERASIONAL & RINGKASAN LAYANAN */}
        {/* ═════════════════════════════════════════════════════════ */}
        <div className="xl:col-span-12 grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          {/* Trend Operasional (6 Bulan Terakhir) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-4.5 shadow-xs flex flex-col justify-between gap-3 h-full">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#0F172A] leading-snug font-['Poppins']">
                  Trend Operasional (6 Bulan Terakhir)
                </h2>
                <p className="text-[11px] text-[#64748B] mt-0.5 font-['Poppins']">
                  Grafik jumlah kegiatan dan content plan per bulan
                </p>
              </div>
              <TrendingUp className="w-4 h-4 text-[#003D58] shrink-0" />
            </div>

            <DashboardMonthlyChart data={monthlyData} maxVal={maxChartVal} />

            <div className="flex items-center gap-5 text-xs text-[#334155] pt-1.5 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#003D58]" />
                <span className="font-medium text-[11px] font-['Poppins']">Kegiatan Diliput</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#35C6D4]" />
                <span className="font-medium text-[11px] font-['Poppins']">Content Plan</span>
              </div>
            </div>
          </div>

          {/* Ringkasan Layanan Humas (Eksternal vs Internal) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-4.5 shadow-xs flex flex-col justify-between gap-3 h-full">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#0F172A] leading-snug font-['Poppins']">
                  Ringkasan Layanan Humas
                </h2>
                <p className="text-[11px] text-[#64748B] mt-0.5 font-['Poppins']">
                  Perbandingan agenda layanan Eksternal dan Internal per bulan
                </p>
              </div>
              <TrendingUp className="w-4 h-4 text-[#003D58] shrink-0" />
            </div>

            <DashboardServiceCompChart data={serviceComparisonData} loading={agendaLoading} />

            <div className="flex items-center gap-5 text-xs text-[#334155] pt-1.5 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#35C6D4]" />
                <span className="font-medium text-[11px] font-['Poppins']">
                  Layanan Eksternal ({agenda.totalEksternal ?? 0})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#003D58]" />
                <span className="font-medium text-[11px] font-['Poppins']">
                  Layanan Internal ({agenda.totalInternal ?? 0})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ═════════════════════════════════════════════════════════ */}
        {/* BOTTOM SECTION: METRIC CARDS & INVENTARIS PERALATAN       */}
        {/* ═════════════════════════════════════════════════════════ */}
        <div className="xl:col-span-12 flex flex-col gap-4">

          {/* 1. 4 Metric Cards (Original Clean Dashboard Cards) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Stat 1: Jumlah Tim Humas */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase font-['Poppins']">
                  JUMLAH TIM HUMAS
                </span>
                <Users className="w-3.5 h-3.5 text-[#94A3B8]" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-[#0F172A] font-['Poppins']">
                  {stats.timHumasUsers ?? 3}
                </div>
                <div className="text-[10px] text-[#94A3B8] mt-0.5 font-medium font-['Poppins']">
                  Total Personel : {stats.totalUsers ?? 5}
                </div>
              </div>
            </div>

            {/* Stat 2: Menunggu Persetujuan Kepala Humas */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase font-['Poppins'] truncate">
                  MENUNGGU PERSETUJUAN
                </span>
                <Clock className="w-3.5 h-3.5 text-[#94A3B8] shrink-0 ml-1" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-[#0F172A] font-['Poppins']">
                  {stats.pendingApprovalActivities ?? 0}
                </div>
                <div className="text-[10px] text-[#94A3B8] mt-0.5 font-medium font-['Poppins'] truncate">
                  Perlu review Kepala Humas
                </div>
              </div>
            </div>

            {/* Stat 3: Kegiatan Aktif */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase font-['Poppins']">
                  KEGIATAN AKTIF
                </span>
                <CalendarCheck2 className="w-3.5 h-3.5 text-[#94A3B8]" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-[#0F172A] font-['Poppins']">
                  {realActivities.length > 0 ? realActivities.length : (stats.activeActivities ?? 0)}
                </div>
                <div className="text-[10px] text-[#94A3B8] mt-0.5 font-medium font-['Poppins']">
                  Ditugaskan &amp; berlangsung
                </div>
              </div>
            </div>

            {/* Stat 4: Content Plan Aktif */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-3.5 shadow-xs flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase font-['Poppins']">
                  CONTENT PLAN AKTIF
                </span>
                <FileText className="w-3.5 h-3.5 text-[#94A3B8]" />
              </div>
              <div className="mt-2">
                <div className="text-2xl font-black text-[#0F172A] font-['Poppins']">
                  {stats.activeContentPlans ?? 1}
                </div>
                <div className="text-[10px] text-[#94A3B8] mt-0.5 font-medium font-['Poppins']">
                  Draft, proses &amp; revisi
                </div>
              </div>
            </div>
          </div>

          {/* 2. Ringkasan Inventaris Peralatan Humas (Original Clean Tiles) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-4.5 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-bold text-[#0F172A] leading-snug font-['Poppins']">
                  Ringkasan Inventaris Peralatan Humas
                </h2>
                <p className="text-[11px] text-[#64748B] mt-0.5 font-['Poppins']">
                  Status ketersediaan armada kamera, audio, dan drone kampus
                </p>
              </div>
              <Link
                href="/peminjaman-alat"
                className="text-xs font-bold text-[#003D58] hover:underline flex items-center gap-1.5 font-['Poppins']"
              >
                <span>Kelola Alat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {/* 4 Stat Tiles in 4-column horizontal grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
              <div className="p-3 rounded-xl border border-sky-100 bg-[#F0F9FF] flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase font-['Poppins']">
                  TOTAL JENIS ALAT
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#0F172A] mt-0.5 font-['Poppins']">
                  {stats.totalEquipmentTypes ?? 2}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-slate-100 bg-[#F8FAFC] flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold tracking-wider text-[#64748B] uppercase font-['Poppins']">
                  TOTAL UNIT
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#0F172A] mt-0.5 font-['Poppins']">
                  {stats.totalEquipmentUnits ?? 8}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-sky-100 bg-[#F0F9FF] flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold tracking-wider text-[#0284C7] uppercase font-['Poppins']">
                  UNIT TERSEDIA
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#0284C7] mt-0.5 font-['Poppins']">
                  {stats.unitsAvailable ?? 5}
                </span>
              </div>

              <div className="p-3 rounded-xl border border-blue-100 bg-[#EFF6FF] flex flex-col items-center justify-center text-center">
                <span className="text-[10px] font-bold tracking-wider text-[#003D58] uppercase font-['Poppins']">
                  UNIT SEDANG DIPINJAM
                </span>
                <span className="text-xl sm:text-2xl font-black text-[#003D58] mt-0.5 font-['Poppins']">
                  {stats.unitsBorrowed ?? 3}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </AdminLayout>
  );
}

