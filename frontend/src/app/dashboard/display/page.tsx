'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  Tv, Maximize2, Minimize2, RefreshCw, Play, Pause,
  Clock, Calendar, MapPin, Users, Radio, CheckCircle2,
  AlertTriangle, AlertCircle, Camera, TrendingUp,
  ArrowLeft, LocateFixed, ZoomIn, ZoomOut,
  CalendarCheck2, FileText, BarChart3, X,
} from 'lucide-react';
import { dashboardService, locationService, activityService, scheduleService } from '@/services';
import { getStoredUser, clearUserSession } from '@/utils/session';
import { LocationData } from '@/types';
import StatCard from '@/components/common/StatCard';
import { toast } from 'sonner';

const CampusMap = dynamic(() => import('@/components/common/CampusMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-50 animate-pulse rounded-xl" />,
});

const DashboardMonthlyChart = dynamic(
  () => import('@/components/dashboard/DashboardMonthlyChart'),
  {
    ssr: false,
    loading: () => <div className="h-36 sm:h-40 w-full bg-slate-50 rounded-xl animate-pulse" />,
  }
);

const DashboardAgendaMonthlyChart = dynamic(
  () => import('@/components/dashboard/DashboardAgendaCharts').then((m) => m.DashboardAgendaMonthlyChart),
  {
    ssr: false,
    loading: () => <div className="h-36 sm:h-40 w-full bg-slate-50 rounded-xl animate-pulse" />,
  }
);

const DashboardServiceFreqChart = dynamic(
  () => import('@/components/dashboard/DashboardAgendaCharts').then((m) => m.DashboardServiceFreqChart),
  {
    ssr: false,
    loading: () => <div className="h-36 sm:h-40 w-full bg-slate-50 rounded-xl animate-pulse" />,
  }
);

const DashboardServiceCompChart = dynamic(
  () => import('@/components/dashboard/DashboardAgendaCharts').then((m) => m.DashboardServiceCompChart),
  {
    ssr: false,
    loading: () => <div className="h-36 sm:h-40 w-full bg-slate-50 rounded-xl animate-pulse" />,
  }
);

/* ─── Default Campus Coordinates (Polinela) ─── */
const POLINELA_CAMPUS_CENTER: [number, number] = [105.2345, -5.3585];

const AVATAR_COLORS = [
  { bg: '#003D58', text: '#FFFFFF' },
  { bg: '#0F766E', text: '#FFFFFF' },
  { bg: '#0284C7', text: '#FFFFFF' },
  { bg: '#059669', text: '#FFFFFF' },
  { bg: '#475569', text: '#FFFFFF' },
  { bg: '#0891B2', text: '#FFFFFF' },
];

function getInitials(name?: string) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getAvatarColor(idx: number) {
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

function formatRegularTime(date: Date) {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function formatRegularDate(date: Date) {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function getActivityBadge(status?: string) {
  switch (status) {
    case 'MENUNGGU_PERSETUJUAN_AKHIR':
      return {
        label: 'Menunggu Persetujuan',
        bg: 'bg-sky-50 border border-sky-200',
        text: 'text-sky-700',
        dot: 'bg-sky-500',
      };
    case 'SEDANG_BERLANGSUNG':
      return {
        label: 'Sedang Berlangsung',
        bg: 'bg-[#C0FFEA]/70 border border-[#51FCE4]',
        text: 'text-[#0F766E]',
        dot: 'bg-[#0F766E]',
      };
    case 'DITUGASKAN':
      return {
        label: 'Ditugaskan',
        bg: 'bg-sky-50 border border-sky-200',
        text: 'text-[#003D58]',
        dot: 'bg-[#003D58]',
      };
    case 'DISETUJUI':
      return {
        label: 'Disetujui',
        bg: 'bg-emerald-50 border border-emerald-200',
        text: 'text-emerald-700',
        dot: 'bg-emerald-500',
      };
    case 'AKAN_DATANG':
      return {
        label: 'Akan Datang',
        bg: 'bg-amber-50 border border-amber-200',
        text: 'text-amber-700',
        dot: 'bg-amber-500',
      };
    case 'SELESAI':
      return {
        label: 'Selesai',
        bg: 'bg-slate-100 border border-slate-200',
        text: 'text-slate-600',
        dot: 'bg-slate-400',
      };
    default:
      return {
        label: status?.replace(/_/g, ' ') || 'Aktif',
        bg: 'bg-slate-100 border border-slate-200',
        text: 'text-slate-600',
        dot: 'bg-slate-400',
      };
  }
}

export default function DashboardDisplayPage() {
  const router = useRouter();

  // Core Data States (Synced with /dashboard)
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [realActivities, setRealActivities] = useState<any[]>([]);
  const [dutySchedules, setDutySchedules] = useState<any[]>([]);
  const [agendaAnalytics, setAgendaAnalytics] = useState<any>(null);
  const [agendaPeriod, setAgendaPeriod] = useState<'3m' | '6m' | 'year' | 'all'>('3m');
  const [agendaLoading, setAgendaLoading] = useState(false);

  // Time & Clock State
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // UI & Auto-refresh Controls
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [autoRefreshInterval] = useState<number>(30);
  const [countdown, setCountdown] = useState<number>(30);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showPersonnelModal, setShowPersonnelModal] = useState<boolean>(false);

  // Splash Screen States
  const [splashVisible, setSplashVisible] = useState<boolean>(true);
  const [splashRendered, setSplashRendered] = useState<boolean>(true);

  // Map Controls
  const [mapCenter, setMapCenter] = useState<[number, number]>(POLINELA_CAMPUS_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(16);
  const [recenterTrigger, setRecenterTrigger] = useState<number>(0);
  const [zoomInTrigger, setZoomInTrigger] = useState<number>(0);
  const [zoomOutTrigger, setZoomOutTrigger] = useState<number>(0);

  const loadData = useCallback(
    async (isSilent = false, periodOverride?: '3m' | '6m' | 'year' | 'all') => {
      if (!isSilent) setRefreshing(true);
      const activePeriod = periodOverride ?? agendaPeriod;
      try {
        const [sumRes, locRes, actRes, schedRes, agendaRes] = await Promise.allSettled([
          dashboardService.summary(),
          locationService.getAll(),
          activityService.getAll({ pageSize: 10 }),
          scheduleService.getAll(),
          dashboardService.agendaAnalytics(activePeriod),
        ]);

        if (sumRes.status === 'fulfilled') {
          const sumData = sumRes.value;
          setDashboardData(sumData);
          setError(false);

          if (Array.isArray(sumData.todaySchedules) && sumData.todaySchedules.length > 0) {
            setDutySchedules(sumData.todaySchedules);
          }
        }

        if (locRes.status === 'fulfilled' && Array.isArray(locRes.value)) {
          setLocations(locRes.value.filter((l: any) => l.user?.role === 'USER'));
        }

        if (actRes.status === 'fulfilled') {
          const list = Array.isArray(actRes.value)
            ? actRes.value
            : (actRes.value as any)?.data || [];
          const activeList = list.filter((a: any) =>
            ['SEDANG_BERLANGSUNG', 'DITUGASKAN', 'DISETUJUI', 'AKAN_DATANG', 'MENUNGGU_PERSETUJUAN_AKHIR'].includes(
              a.status
            )
          );
          setRealActivities(activeList);
        }

        if (schedRes.status === 'fulfilled') {
          const schedList = (schedRes.value as any)?.data || schedRes.value;
          if (Array.isArray(schedList) && schedList.length > 0) {
            setDutySchedules((prev) => (prev.length > 0 ? prev : (schedList as any[])));
          }
        }

        if (agendaRes.status === 'fulfilled') {
          setAgendaAnalytics(agendaRes.value);
        }
      } catch (err) {
        console.error('TV Display fetch error:', err);
        if (!isSilent) {
          setError(true);
          toast.error('Gagal memperbarui data monitoring TV');
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
        setCountdown(autoRefreshInterval);
      }
    },
    [autoRefreshInterval, agendaPeriod]
  );

  const handleAgendaPeriodChange = async (period: '3m' | '6m' | 'year' | 'all') => {
    setAgendaPeriod(period);
    setAgendaLoading(true);
    try {
      const res = await dashboardService.agendaAnalytics(period);
      setAgendaAnalytics(res);
    } catch {
      toast.error('Gagal memuat statistik agenda periode tersebut');
    } finally {
      setAgendaLoading(false);
    }
  };

  // Session & Auth Check
  useEffect(() => {
    const user = getStoredUser();
    if (!user) {
      router.replace('/login?redirect=/dashboard/display');
      return;
    }
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      clearUserSession();
      router.replace('/login?error=unauthorized');
      return;
    }
    loadData(false);
  }, [router, loadData]);

  // Clock Ticker
  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
    const clockInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(clockInterval);
  }, []);

  // Auto-refresh Countdown Timer
  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          loadData(true);
          return autoRefreshInterval;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isPaused, autoRefreshInterval, loadData]);

  // Fullscreen Listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard shortcuts: F fullscreen, R refresh, Space pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'r' || e.key === 'R') {
        loadData(false);
      } else if (e.key === ' ') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [loadData]);

  // Splash Screen Lifecycle
  useEffect(() => {
    if (!loading) {
      const tFade = setTimeout(() => {
        setSplashVisible(false);
        const tUnmount = setTimeout(() => {
          setSplashRendered(false);
        }, 450);
        return () => clearTimeout(tUnmount);
      }, 500);
      return () => clearTimeout(tFade);
    }
  }, [loading]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        toast.info('Gunakan tombol F11 pada keyboard untuk layar penuh');
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleZoomIn = () => setZoomInTrigger((prev) => prev + 1);
  const handleZoomOut = () => setZoomOutTrigger((prev) => prev + 1);
  const handleRecenter = () => {
    setMapCenter([...POLINELA_CAMPUS_CENTER]);
    setMapZoom(16);
    setRecenterTrigger((prev) => prev + 1);
  };

  // Parsed Data (Synced with /dashboard)
  const stats = dashboardData?.statistics || {};
  const overdueLoansCount = stats.overdueLoans || 0;
  const pendingApprovalCount = stats.pendingApprovalActivities ?? 0;
  const activeActivitiesCount =
    realActivities.length > 0 ? realActivities.length : (stats.activeActivities ?? 0);
  const activeContentCount = stats.activeContentPlans ?? 0;

  const onlinePersonnel = locations.filter((l) => l.isOnline);
  const offlinePersonnel = locations.filter((l) => !l.isOnline);

  const currentHourWIB = mounted
    ? parseInt(
        new Intl.DateTimeFormat('en-GB', {
          timeZone: 'Asia/Jakarta',
          hour: 'numeric',
          hour12: false,
        }).format(currentTime),
        10
      )
    : currentTime.getHours();

  const activeShiftName =
    currentHourWIB < 13 ? 'SHIFT 1 (07:30 - 12:30 WIB)' : 'SHIFT 2 (12:30 - 17:00 WIB)';

  const todaySchedules = dutySchedules.filter((s) => {
    if (!s.date) return false;
    const d = new Date(s.date);
    const now = new Date();
    return (
      d.getDate() === now.getDate() &&
      d.getMonth() === now.getMonth() &&
      d.getFullYear() === now.getFullYear()
    );
  });
  const displayDutySchedules = todaySchedules.length > 0 ? todaySchedules : dutySchedules;

  const monthlyData =
    dashboardData?.monthlyStats && dashboardData.monthlyStats.length > 0
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
          { month: 'Nov', kegiatan: realActivities.length, konten: activeContentCount },
        ];

  const maxChartVal = Math.max(
    4,
    ...monthlyData.map((d: any) => Math.max(d.kegiatan, d.konten))
  );

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

  const formattedTime = mounted ? formatRegularTime(currentTime) : '--:--:--';
  const formattedDate = mounted ? formatRegularDate(currentTime) : 'Memuat tanggal...';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-800 font-['Poppins'] selection:bg-[#003D58] selection:text-white relative">
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* SIMPLE SPLASH SCREEN (LOGO HUMAS + LOADING)                    */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {splashRendered && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F8FAFC] transition-opacity duration-500 ease-in-out select-none ${
            splashVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-humas.png"
              alt="Logo Humas Polinela"
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-sm animate-pulse"
            />
            <div className="flex items-center gap-2.5 mt-2">
              <div className="w-5 h-5 border-2 border-[#003D58] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
                Memuat...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 1. TOP NAVBAR / FULLSCREEN COMPACT STRIP (ORIGINAL WHITE BAR)  */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {isFullscreen ? (
        <header className="h-11 bg-white/95 backdrop-blur-md border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between shrink-0 shadow-xs z-40">
          <div className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-humas.png"
              alt="Logo Humas Polinela"
              className="w-6 h-6 object-contain"
            />
            <span className="font-extrabold text-xs sm:text-sm text-slate-900 tracking-tight">
              HUMAS POLINELA
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-1.5 font-mono font-bold text-xs text-[#003D58]"
              suppressHydrationWarning
            >
              <Clock className="w-3.5 h-3.5" />
              <span suppressHydrationWarning>{formattedTime} WIB</span>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600">
              <span className="font-semibold">{isPaused ? 'Jeda' : `${countdown}s`}</span>
              <button
                type="button"
                onClick={() => loadData(false)}
                disabled={refreshing}
                className="p-1 hover:text-[#003D58] text-slate-500 transition-colors cursor-pointer disabled:opacity-50"
                title="Perbarui data"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="h-4 w-px bg-slate-200" />

            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-[#003D58] text-xs font-bold transition-colors cursor-pointer border border-sky-200"
              title="Keluar dari Layar Penuh"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </header>
      ) : (
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-40 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 shadow-xs">
          {/* Left: Branding with Official Humas Logo & Breadcrumb Style */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 group cursor-pointer"
              title="Kembali ke Dashboard Utama"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo-humas.png"
                alt="Logo Humas Polinela"
                className="w-10 h-10 object-contain shrink-0 group-hover:scale-105 transition-transform"
              />
              <div>
                <h1 className="text-sm sm:text-base font-extrabold text-slate-900 leading-tight tracking-tight">
                  HUMAS POLINELA
                </h1>
                <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-normal mt-0.5">
                  <span>Beranda</span>
                  <span>&gt;</span>
                  <span>Dashboard</span>
                  <span>&gt;</span>
                  <span className="text-[#003D58] font-semibold">Monitoring</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Middle: Live Status Indicators */}
          <div className="hidden xl:flex items-center gap-3">
            <button
              type="button"
              onClick={() => setShowPersonnelModal(true)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-xs transition-colors cursor-pointer"
              title="Lihat detail status GPS tim humas"
            >
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span className="text-slate-600 font-medium">
                GPS Tim: <strong className="text-emerald-700">{onlinePersonnel.length} Online</strong>
              </span>
            </button>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <CalendarCheck2 className="w-3.5 h-3.5 text-[#003D58]" />
              <span className="text-slate-600 font-medium">
                Kegiatan Aktif: <strong className="text-[#003D58]">{activeActivitiesCount}</strong>
              </span>
            </div>

            {overdueLoansCount > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-[#B8484A] font-bold animate-pulse">
                <AlertTriangle className="w-3.5 h-3.5 text-[#B8484A]" />
                <span>{overdueLoansCount} Alat Terlambat</span>
              </div>
            )}
          </div>

          {/* Right: Digital Clock, Auto-refresh Controls & Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="text-right hidden sm:block" suppressHydrationWarning>
              <div
                className="text-base sm:text-lg font-black font-mono tracking-wider text-[#003D58] leading-tight"
                suppressHydrationWarning
              >
                {formattedTime}{' '}
                <span className="text-[10px] font-sans font-bold text-slate-400">WIB</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium" suppressHydrationWarning>
                {formattedDate}
              </div>
            </div>

            <div className="h-7 w-px bg-slate-200 hidden sm:block mx-1" />

            <div
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-medium text-slate-700"
              title="Hitung mundur pembaruan otomatis data"
            >
              <button
                type="button"
                onClick={() => setIsPaused((p) => !p)}
                className="p-1 rounded hover:bg-slate-200 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                title={isPaused ? 'Lanjutkan Auto-Refresh' : 'Jeda Auto-Refresh'}
              >
                {isPaused ? (
                  <Play className="w-3 h-3 text-amber-500" />
                ) : (
                  <Pause className="w-3 h-3 text-slate-500" />
                )}
              </button>
              <span className="text-[11px] font-semibold">
                {isPaused ? (
                  <span className="text-amber-600 font-bold">JEDA</span>
                ) : (
                  `${countdown}s`
                )}
              </span>
            </div>

            <button
              type="button"
              onClick={() => loadData(false)}
              disabled={refreshing}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#003D58] transition-all cursor-pointer disabled:opacity-50"
              title="Perbarui data sekarang (Tombol R)"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#003D58] hover:bg-[#002F44] active:bg-[#00263A] text-white text-xs font-bold shadow-xs shadow-[#003D58]/25 transition-all cursor-pointer"
              title="Layar Penuh TV (Tombol F atau F11)"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden md:inline">
                {isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh TV'}
              </span>
            </button>

            <Link
              href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold shadow-xs transition-colors"
              title="Kembali ke Dashboard Utama"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden lg:inline">Kembali</span>
            </Link>
          </div>
        </header>
      )}

      {/* ─── MAIN CONTENT (Balanced Widescreen TV Grid, 100% Synced with /dashboard) ─── */}
      <main className="flex-1 w-full max-w-[1920px] mx-auto px-4 sm:px-6 py-4 space-y-4">
        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-2.5 text-xs font-medium flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>Koneksi data monitoring sempat terganggu. Sistem akan mencoba menyinkronkan ulang otomatis.</span>
            </div>
            <button
              type="button"
              onClick={() => loadData(false)}
              className="px-2.5 py-1 rounded-lg bg-rose-600 text-white font-semibold text-[11px] hover:bg-rose-700 cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        )}

        {/* ROW 1: TOP 4 KPI WAVE CARDS (Synced with /dashboard) */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          <StatCard
            title="Jumlah Tim Humas"
            value={stats.timHumasUsers ?? 0}
            subtitle={`Total Personel : ${stats.totalUsers ?? 0}`}
            icon={Users}
          />
          <StatCard
            title="Menunggu Persetujuan"
            value={pendingApprovalCount}
            subtitle="Perlu review Kepala Humas"
            icon={Clock}
          />
          <StatCard
            title="Kegiatan Aktif"
            value={activeActivitiesCount}
            subtitle="Ditugaskan & berlangsung"
            icon={CalendarCheck2}
          />
          <StatCard
            title="Content Plan Aktif"
            value={activeContentCount}
            subtitle="Draft, proses & revisi"
            icon={FileText}
          />
        </section>

        {/* ROW 2: HERO MONITORING ROW (Equal-Height Map Left | Active Agenda + Piket Right) */}
        <section className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-stretch">
          {/* Left (7 cols): Peta Monitoring Kampus Polinela */}
          <div className="xl:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div>
                <h2 className="text-sm font-bold text-[#0F172A] leading-snug">
                  Peta Monitoring Kampus Polinela
                </h2>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Pantau posisi tim lapangan secara real-time di area Politeknik Negeri Lampung
                </p>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  title="Perbesar Peta"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer"
                  title="Perkecil Peta"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={handleRecenter}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-[11px] font-semibold text-[#003D58] hover:bg-slate-50 cursor-pointer"
                  title="Pusatkan ke Kampus Polinela"
                >
                  <LocateFixed className="w-3.5 h-3.5" />
                  <span>Pusatkan</span>
                </button>
              </div>
            </div>

            <div className="relative flex-1 min-h-[360px] xl:min-h-[430px] w-full rounded-xl overflow-hidden border border-slate-200/80">
              <CampusMap
                locations={locations}
                center={mapCenter}
                zoom={mapZoom}
                recenterTrigger={recenterTrigger}
                zoomInTrigger={zoomInTrigger}
                zoomOutTrigger={zoomOutTrigger}
              />
            </div>
          </div>

          {/* Right (5 cols): Kegiatan Sedang Berjalan + Jadwal Piket Hari Ini */}
          <div className="xl:col-span-5 flex flex-col gap-4">
            {/* Kegiatan Sedang Berjalan */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col gap-3 flex-1">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-sm font-bold text-[#0F172A] leading-snug">
                    Kegiatan Sedang Berjalan
                  </h2>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Agenda peliputan aktif, ditugaskan, dan menunggu persetujuan
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-[#C0FFEA] text-[#0F766E] text-[10px] font-bold shrink-0">
                  {realActivities.length} Agenda Aktif
                </span>
              </div>

              {realActivities.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60">
                  <Calendar className="w-7 h-7 text-slate-300 mb-1.5" />
                  <p className="text-xs font-semibold text-slate-500">
                    Belum ada kegiatan aktif saat ini
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 max-h-[265px] overflow-y-auto pr-1">
                  {realActivities.slice(0, 8).map((act: any) => {
                    const badge = getActivityBadge(act.status);
                    const dateLabel = act.date
                      ? new Date(act.date).toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })
                      : '-';
                    return (
                      <div
                        key={act.id}
                        className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 rounded-lg px-2 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#0F172A] truncate">
                            {act.title}
                          </p>
                          <div className="flex items-center gap-2.5 text-[11px] text-slate-500 mt-0.5 flex-wrap">
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3 text-[#003D58]" />
                              {dateLabel}
                            </span>
                            {act.startTime && (
                              <span className="inline-flex items-center gap-1">
                                <Clock className="w-3 h-3 text-[#003D58]" />
                                {act.startTime}
                                {act.endTime ? ` - ${act.endTime}` : ''} WIB
                              </span>
                            )}
                            {act.location && (
                              <span className="inline-flex items-center gap-1 truncate max-w-[180px]">
                                <MapPin className="w-3 h-3 text-[#0F766E] shrink-0" />
                                <span className="truncate">{act.location}</span>
                              </span>
                            )}
                          </div>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold shrink-0 ${badge.bg} ${badge.text}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          {badge.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Jadwal Piket Hari Ini */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col gap-2.5">
              <div className="flex items-center justify-between gap-2">
                <div>
                  <h2 className="text-sm font-bold text-[#0F172A] leading-snug">
                    Jadwal Piket Tim Humas
                  </h2>
                  <p className="text-[11px] text-[#64748B] mt-0.5">{activeShiftName}</p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full bg-[#C0FFEA] text-[#0F766E] text-[10px] font-bold shrink-0">
                  {displayDutySchedules.length} Petugas
                </span>
              </div>

              {displayDutySchedules.length === 0 ? (
                <p className="text-xs text-slate-400 py-3 text-center">
                  Belum ada jadwal piket tercatat hari ini.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {displayDutySchedules.slice(0, 4).map((sched: any, idx: number) => {
                    const personName = sched.user?.fullName || sched.userName || 'Petugas Humas';
                    const color = getAvatarColor(idx);
                    return (
                      <div
                        key={sched.id || idx}
                        className="flex items-center gap-2.5 p-2 rounded-xl border border-slate-100 bg-slate-50/70"
                      >
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0"
                          style={{ backgroundColor: color.bg, color: color.text }}
                        >
                          {getInitials(personName)}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-[#0F172A] truncate">{personName}</p>
                          <p className="text-[10px] text-slate-500 truncate">
                            {sched.shift || sched.dayOfWeek || 'Piket Operasional'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ROW 3: SYMMETRICAL 2×2 ANALYTICS GRID (All 4 Dashboard Charts, Equal Height) */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
          {/* Chart 1: Agenda Kegiatan Humas per Bulan */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between gap-3 h-full">
            <div className="flex items-start justify-between gap-2 flex-wrap">
              <div>
                <h2 className="text-sm font-bold text-[#0F172A] leading-snug">
                  Agenda Kegiatan Humas per Bulan
                </h2>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Periode {agenda.monthsRangeLabel || agenda.periodLabel} • Ringkasan agenda tercatat
                </p>
              </div>

              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-slate-100 border border-slate-200/70 shrink-0">
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
                    onClick={() =>
                      handleAgendaPeriodChange(opt.key as '3m' | '6m' | 'year' | 'all')
                    }
                    className={`px-2 py-0.5 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                      agendaPeriod === opt.key
                        ? 'bg-white text-[#003D58] shadow-2xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-xl border border-sky-100 bg-[#F0F9FF] flex flex-col items-center justify-center text-center">
                <span className="text-[9px] font-bold tracking-wider text-[#64748B] uppercase">
                  TOTAL KEGIATAN
                </span>
                <span className="text-lg font-black text-[#003D58] mt-0.5">
                  {agenda.totalActivities ?? 0}
                </span>
                <span className="text-[9px] text-[#64748B]">agenda tercatat</span>
              </div>

              <div className="p-2.5 rounded-xl border border-slate-100 bg-[#F8FAFC] flex flex-col items-center justify-center text-center">
                <span className="text-[9px] font-bold tracking-wider text-[#64748B] uppercase">
                  BULAN TERCAKUP
                </span>
                <span className="text-lg font-black text-[#003D58] mt-0.5">
                  {agenda.monthsCovered ?? 0}
                </span>
                <span className="text-[9px] text-[#64748B] truncate max-w-full">
                  {agenda.monthsRangeLabel || '-'}
                </span>
              </div>

              <div className="p-2.5 rounded-xl border border-[#51FCE4]/50 bg-[#C0FFEA]/30 flex flex-col items-center justify-center text-center">
                <span className="text-[9px] font-bold tracking-wider text-[#0F766E] uppercase">
                  BULAN TERPADAT
                </span>
                <span className="text-sm font-black text-[#003D58] mt-0.5 truncate max-w-full">
                  {agenda.busiestMonth?.month || '-'}
                </span>
                <span className="text-[9px] text-[#0F766E]">
                  {agenda.busiestMonth?.count ?? 0} kegiatan
                </span>
              </div>
            </div>

            <DashboardAgendaMonthlyChart data={monthlyAgendaData} loading={agendaLoading} />

            <div className="flex items-center justify-between gap-4 text-xs text-[#334155] pt-1.5 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#003D58]" />
                <span className="font-medium text-[11px]">Jumlah Kegiatan per Bulan</span>
              </div>
              <span className="text-[10px] text-[#64748B] font-medium">
                Total: {agenda.totalActivities ?? 0} Agenda
              </span>
            </div>
          </div>

          {/* Chart 2: Trend Operasional (6 Bulan Terakhir) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between gap-3 h-full">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#0F172A] leading-snug">
                  Trend Operasional (6 Bulan Terakhir)
                </h2>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Grafik jumlah kegiatan dan content plan per bulan
                </p>
              </div>
              <TrendingUp className="w-4 h-4 text-[#003D58] shrink-0" />
            </div>

            <div className="flex-1 flex items-center">
              <div className="w-full">
                <DashboardMonthlyChart data={monthlyData} maxVal={maxChartVal} />
              </div>
            </div>

            <div className="flex items-center gap-5 text-xs text-[#334155] pt-1.5 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#003D58]" />
                <span className="font-medium text-[11px]">Kegiatan Diliput</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#35C6D4]" />
                <span className="font-medium text-[11px]">Content Plan</span>
              </div>
            </div>
          </div>

          {/* Chart 3: Frekuensi Jenis Layanan Humas */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between gap-3 h-full">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#0F172A] leading-snug">
                  Frekuensi Jenis Layanan Humas
                </h2>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Distribusi kategori layanan dokumentasi, publikasi, dan liputan
                </p>
              </div>
              <BarChart3 className="w-4 h-4 text-[#003D58] shrink-0" />
            </div>

            <DashboardServiceFreqChart data={serviceFreqData} loading={agendaLoading} />

            <div className="flex items-center gap-5 text-xs text-[#334155] pt-1.5 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#003D58]" />
                <span className="font-medium text-[11px]">Frekuensi Layanan</span>
              </div>
            </div>
          </div>

          {/* Chart 4: Ringkasan Layanan Humas (Eksternal vs Internal) */}
          <div className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col justify-between gap-3 h-full">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-[#0F172A] leading-snug">
                  Ringkasan Layanan Humas
                </h2>
                <p className="text-[11px] text-[#64748B] mt-0.5">
                  Perbandingan agenda layanan Eksternal dan Internal per bulan
                </p>
              </div>
              <TrendingUp className="w-4 h-4 text-[#003D58] shrink-0" />
            </div>

            <DashboardServiceCompChart data={serviceComparisonData} loading={agendaLoading} />

            <div className="flex items-center gap-5 text-xs text-[#334155] pt-1.5 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#35C6D4]" />
                <span className="font-medium text-[11px]">
                  Layanan Eksternal ({agenda.totalEksternal ?? 0})
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-xs bg-[#003D58]" />
                <span className="font-medium text-[11px]">
                  Layanan Internal ({agenda.totalInternal ?? 0})
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ROW 4: BOTTOM FULL-WIDTH RINGKASAN INVENTARIS PERALATAN HUMAS (Wave Cards) */}
        <section className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div>
              <h2 className="text-sm font-bold text-[#0F172A] leading-snug">
                Ringkasan Inventaris Peralatan Humas
              </h2>
              <p className="text-[11px] text-[#64748B] mt-0.5">
                Status ketersediaan armada kamera, audio, dan drone kampus
              </p>
            </div>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#C0FFEA] text-[#0F766E] text-[10px] font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Sinkronisasi Realtime
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <StatCard
              compact
              title="Total Jenis Alat"
              value={stats.totalEquipmentTypes ?? 0}
              badge="Kategori Armada"
              icon={Camera}
            />
            <StatCard
              compact
              title="Total Unit"
              value={stats.totalEquipmentUnits ?? 0}
              badge="Semua Inventaris"
              icon={Camera}
            />
            <StatCard
              compact
              title="Unit Tersedia"
              value={stats.unitsAvailable ?? 0}
              badge="Siap Dipinjam"
              icon={CalendarCheck2}
            />
            <StatCard
              compact
              title="Unit Sedang Dipinjam"
              value={stats.unitsBorrowed ?? 0}
              badge="Dalam Pemakaian"
              icon={Clock}
            />
          </div>
        </section>
      </main>

      {/* ─── PERSONNEL GPS MODAL ─── */}
      {showPersonnelModal && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowPersonnelModal(false)}
        >
          <div
            className="bg-white rounded-2xl border border-slate-200 shadow-xl w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 bg-[#003D58] text-white flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold">Status GPS Anggota Humas</h3>
                <p className="text-[11px] text-white/75">
                  {onlinePersonnel.length} online • {offlinePersonnel.length} offline
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowPersonnelModal(false)}
                className="p-1.5 rounded-lg hover:bg-white/15 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
              {locations.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-6">
                  Belum ada data lokasi anggota humas.
                </p>
              ) : (
                locations.map((loc, idx) => {
                  const color = getAvatarColor(idx);
                  return (
                    <div key={loc.id || idx} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                          style={{ backgroundColor: color.bg, color: color.text }}
                        >
                          {getInitials(loc.user?.fullName)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-800 truncate">
                            {loc.user?.fullName || 'Anggota Humas'}
                          </p>
                          <p className="text-[11px] text-slate-500 truncate">
                            {loc.latitude.toFixed(5)}, {loc.longitude.toFixed(5)}
                          </p>
                        </div>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          loc.isOnline
                            ? 'bg-[#C0FFEA] text-[#0F766E]'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {loc.isOnline ? 'Online' : 'Offline'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
