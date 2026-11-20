'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import {
  Tv, Maximize2, Minimize2, RefreshCw, Play, Pause,
  Clock, Calendar, MapPin, Users, Radio, CheckCircle2,
  AlertTriangle, AlertCircle, Camera, Package, TrendingUp,
  ArrowLeft, ChevronDown, LocateFixed, ZoomIn, ZoomOut,
  CalendarCheck2, FileText, CheckCircle, Info, ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { dashboardService, locationService, scheduleService } from '@/services';
import { getStoredUser, clearUserSession } from '@/utils/session';
import { LocationData } from '@/types';
import { toast } from 'sonner';

const CampusMap = dynamic(() => import('@/components/common/CampusMap'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-slate-50 animate-pulse rounded-xl" />,
});

const DisplayTrendChart = dynamic(() => import('@/components/dashboard/DisplayTrendChart'), {
  ssr: false,
  loading: () => <div className="h-44 w-full mt-1 bg-slate-50 rounded-xl animate-pulse" />,
});

/* ─── Default Campus Coordinates (Polinela) ─── */
const POLINELA_CAMPUS_CENTER: [number, number] = [105.2345, -5.3585];

/* ─── Avatar Palette (Harmonized with main Dashboard) ─── */
const AVATAR_COLORS = [
  { bg: '#006876', text: '#FFFFFF' },
  { bg: '#6366F1', text: '#FFFFFF' },
  { bg: '#059669', text: '#FFFFFF' },
  { bg: '#D97706', text: '#FFFFFF' },
  { bg: '#64748B', text: '#FFFFFF' },
  { bg: '#24BAC4', text: '#FFFFFF' },
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

/* ─── Jam Waktu Biasa (Local Clock Helper) ─── */
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

export default function DashboardDisplayPage() {
  const router = useRouter();

  // Core Data States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [dutySchedules, setDutySchedules] = useState<any[]>([]);

  // Time & Clock State
  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // UI & Auto-refresh Controls
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [autoRefreshInterval] = useState<number>(30); // 30 seconds
  const [countdown, setCountdown] = useState<number>(30);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [showPersonnelModal, setShowPersonnelModal] = useState<boolean>(false);

  // Splash Screen States (Simple Logo + Loading)
  const [splashVisible, setSplashVisible] = useState<boolean>(true);
  const [splashRendered, setSplashRendered] = useState<boolean>(true);

  // Map Controls
  const [mapCenter, setMapCenter] = useState<[number, number]>(POLINELA_CAMPUS_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(16);
  const [recenterTrigger, setRecenterTrigger] = useState<number>(0);
  const [zoomInTrigger, setZoomInTrigger] = useState<number>(0);
  const [zoomOutTrigger, setZoomOutTrigger] = useState<number>(0);

  // Load Dashboard Data
  const loadData = useCallback(async (isSilent = false) => {
    if (!isSilent) setRefreshing(true);
    try {
      const [sumRes, locRes, schedRes] = await Promise.allSettled([
        dashboardService.summary(),
        locationService.getAll(),
        scheduleService.getAll(),
      ]);

      if (sumRes.status === 'fulfilled') {
        const sumData = sumRes.value;
        setDashboardData(sumData);
        setError(false);

        if (Array.isArray(sumData.todaySchedules) && sumData.todaySchedules.length > 0) {
          setDutySchedules(sumData.todaySchedules);
        }
      } else {
        console.warn('Dashboard summary rejected:', sumRes.reason);
      }

      if (locRes.status === 'fulfilled' && Array.isArray(locRes.value)) {
        setLocations(locRes.value.filter((l: any) => l.user?.role === 'USER'));
      }

      if (schedRes.status === 'fulfilled') {
        const schedList = (schedRes.value as any)?.data || schedRes.value;
        if (Array.isArray(schedList) && schedList.length > 0) {
          setDutySchedules((prev) => (prev.length > 0 ? prev : (schedList as any[])));
        }
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
  }, [autoRefreshInterval]);

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
    setCurrentUser(user);
    loadData(false);
  }, [router, loadData]);

  // Clock Ticker (Runs every 1s, synced to current client time)
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

  // Keyboard shortcut: F11 / F for fullscreen, R for refresh, Space for pause
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

  // Simple Splash Screen Lifecycle (Logo + Loading)
  useEffect(() => {
    if (!loading) {
      const tFade = setTimeout(() => {
        setSplashVisible(false);
        const tUnmount = setTimeout(() => {
          setSplashRendered(false);
        }, 500);
      }, 700);

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

  // Calculations & Parsing
  const stats = dashboardData?.statistics || {};
  const liveActivities: any[] = dashboardData?.upcomingActivitiesList || [];
  const overdueLoansCount = stats.overdueLoans || 0;
  const pendingVerificationsCount = stats.pendingVerificationActivities || 0;
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

  const activeShiftName = currentHourWIB < 13 ? 'SHIFT 1 (07:30 - 12:30 WIB)' : 'SHIFT 2 (12:30 - 17:00 WIB)';

  // Filter duty schedules for today
  const todaySchedules = dutySchedules.filter((s) => {
    if (!s.date) return false;
    const d = new Date(s.date);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const displayDutySchedules = todaySchedules.length > 0 ? todaySchedules : dutySchedules;

  const totalContent = stats.totalContentPlans || 0;
  const activeContent = stats.activeContentPlans || 0;
  const contentPct = totalContent > 0 ? Math.round((activeContent / totalContent) * 100) : (activeContent > 0 ? 100 : 0);

  const monthlyData = dashboardData?.monthlyStats?.length
    ? dashboardData.monthlyStats
    : [
        { month: 'Mei', kegiatan: 0, konten: 0 },
        { month: 'Jun', kegiatan: 0, konten: 0 },
        { month: 'Jul', kegiatan: 0, konten: 0 },
        { month: 'Agu', kegiatan: 0, konten: 0 },
        { month: 'Sep', kegiatan: 0, konten: 0 },
        { month: 'Okt', kegiatan: 0, konten: 0 },
      ];

  // Jam & tanggal waktu biasa (langsung dari waktu lokal perangkat)
  const formattedTime = mounted ? formatRegularTime(currentTime) : '--:--:--';
  const formattedDate = mounted ? formatRegularDate(currentTime) : 'Memuat tanggal...';

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col text-slate-800 selection:bg-[#005CDB] selection:text-white relative">
      
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
            {/* Simple Loading Spinner */}
            <div className="flex items-center gap-2.5 mt-2">
              <div className="w-5 h-5 border-2 border-[#005CDB] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
                Memuat...
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 1. TOP NAVBAR / FULLSCREEN COMPACT STRIP                       */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {isFullscreen ? (
        /* Fullscreen Minimal Strip (Hanya menampilkan yang dibutuhkan) */
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
            {/* Digital Clock */}
            <div className="flex items-center gap-1.5 font-mono font-bold text-xs text-[#005CDB]" suppressHydrationWarning>
              <Clock className="w-3.5 h-3.5" />
              <span suppressHydrationWarning>{formattedTime} WIB</span>
            </div>

            <div className="h-4 w-[1px] bg-slate-200" />

            {/* Refresh Countdown & Button */}
            <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600">
              <span className="font-semibold">{isPaused ? 'Jeda' : `${countdown}s`}</span>
              <button
                type="button"
                onClick={() => loadData(false)}
                disabled={refreshing}
                className="p-1 hover:text-[#005CDB] text-slate-500 transition-colors cursor-pointer disabled:opacity-50"
                title="Perbarui data"
              >
                <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="h-4 w-[1px] bg-slate-200" />

            {/* Exit Fullscreen */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-[#005CDB] text-xs font-bold transition-colors cursor-pointer border border-blue-200"
              title="Keluar dari Layar Penuh"
            >
              <Minimize2 className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </header>
      ) : (
        /* Standard Navbar when not in Fullscreen */
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
                  <span className="text-[#005CDB] font-semibold">Monitoring</span>
                </div>
              </div>
            </Link>
          </div>

          {/* Middle: Live Status Indicators (Clean Pills, No Emojis) */}
          <div className="hidden xl:flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span className="text-slate-600 font-medium">
                GPS Tim: <strong className="text-emerald-700">{onlinePersonnel.length} Online</strong>
              </span>
            </div>

            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <CalendarCheck2 className="w-3.5 h-3.5 text-[#005CDB]" />
              <span className="text-slate-600 font-medium">
                Kegiatan Aktif: <strong className="text-[#005CDB]">{stats.activeActivities || 0}</strong>
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
            
            {/* Digital Clock Box */}
            <div className="text-right hidden sm:block" suppressHydrationWarning>
              <div className="text-base sm:text-lg font-black font-mono tracking-wider text-[#005CDB] leading-tight" suppressHydrationWarning>
                {formattedTime} <span className="text-[10px] font-sans font-bold text-slate-400">WIB</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium" suppressHydrationWarning>
                {formattedDate}
              </div>
            </div>

            <div className="h-7 w-[1px] bg-slate-200 hidden sm:block mx-1" />

            {/* Auto Refresh Countdown Pill */}
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
                {isPaused ? <Play className="w-3 h-3 text-[#E99710]" /> : <Pause className="w-3 h-3 text-slate-500" />}
              </button>
              <span className="text-[11px] font-semibold">
                {isPaused ? (
                  <span className="text-[#E99710] font-bold">JEDA</span>
                ) : (
                  `${countdown}s`
                )}
              </span>
            </div>

            {/* Manual Refresh Button */}
            <button
              type="button"
              onClick={() => loadData(false)}
              disabled={refreshing}
              className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[#005CDB] transition-all cursor-pointer disabled:opacity-50"
              title="Perbarui data sekarang (Tombol R)"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            </button>

            {/* Fullscreen Button */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#005CDB] hover:bg-[#004FBD] active:bg-[#0044A5] text-white text-xs font-bold shadow-xs shadow-[#005CDB]/25 transition-all cursor-pointer"
              title="Layar Penuh TV (Tombol F atau F11)"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden md:inline">{isFullscreen ? 'Keluar Layar Penuh' : 'Layar Penuh TV'}</span>
            </button>

            {/* Exit / Return to standard Dashboard */}
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

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* 2. MAIN TV MONITORING BODY                                      */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <main className="flex-1 p-3 sm:p-5 flex flex-col gap-4 max-w-[2100px] mx-auto w-full">

        {/* ─── ROW 1: TOP 5 KPI SUMMARY CARDS ─── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
          
          {/* KPI 1: Status Tindakan / Alert Banner */}
          <div
            className={`col-span-2 md:col-span-1 rounded-2xl p-4 border flex flex-col justify-between transition-all ${
              overdueLoansCount > 0 || pendingVerificationsCount > 0
                ? 'bg-rose-50/90 border-rose-200 text-[#B8484A] shadow-xs'
                : 'bg-emerald-50/90 border-emerald-200 text-emerald-900 shadow-xs'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold uppercase tracking-wider">
                Status Operasional
              </span>
              {overdueLoansCount > 0 || pendingVerificationsCount > 0 ? (
                <AlertTriangle className="w-4 h-4 text-[#B8484A] animate-pulse" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              )}
            </div>
            <div className="mt-2">
              <div className="text-2xl sm:text-3xl font-black">
                {overdueLoansCount + pendingVerificationsCount}
              </div>
              <p className="text-[11px] font-semibold mt-0.5 truncate">
                {overdueLoansCount > 0
                  ? `${overdueLoansCount} Peminjaman Terlambat`
                  : pendingVerificationsCount > 0
                  ? `${pendingVerificationsCount} Menunggu Verifikasi`
                  : 'Semua Operasional Terkendali'}
              </p>
            </div>
          </div>

          {/* KPI 2: Presensi Tim Lapangan (GPS) */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                Tim Lapangan Aktif
              </span>
              <Radio className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {onlinePersonnel.length}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  / {locations.length || stats.timHumasUsers || 0} Personel
                </span>
              </div>
              <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 truncate flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live GPS Radar Terhubung
              </p>
            </div>
          </div>

          {/* KPI 3: Kegiatan Sedang Berjalan */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                Kegiatan Aktif Hari Ini
              </span>
              <Calendar className="w-4 h-4 text-[#005CDB]" />
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {liveActivities.length || stats.activeActivities || 0}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  Acara
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
                {stats.ongoingActivities || 0} Sedang Berjalan • {stats.assignedActivities || 0} Ditugaskan
              </p>
            </div>
          </div>

          {/* KPI 4: Kesiapan Armada Alat */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                Armada Alat Tersedia
              </span>
              <Camera className="w-4 h-4 text-[#005CDB]" />
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {stats.unitsAvailable || 0}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  / {stats.totalEquipmentUnits || 0} Unit
                </span>
              </div>
              <p className="text-[11px] font-semibold text-[#005CDB] mt-0.5 truncate">
                {stats.unitsBorrowed || 0} Unit Sedang Dipinjam
              </p>
            </div>
          </div>

          {/* KPI 5: Content Plan & Media */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider">
                Content Plan Berjalan
              </span>
              <FileText className="w-4 h-4 text-[#E99710]" />
            </div>
            <div className="mt-2">
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl sm:text-3xl font-black text-slate-900">
                  {stats.activeContentPlans || 0}
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  / {stats.totalContentPlans || 0} Total
                </span>
              </div>
              <p className="text-[11px] font-medium text-slate-500 mt-0.5 truncate">
                {contentPct}% Dalam Siklus Produksi
              </p>
            </div>
          </div>

        </div>

        {/* ─── ROW 2: DUAL COLUMN WORKFLOW & MAP MONITORING ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 items-start">
          
          {/* ─────────────────────────────────────────────────────────── */}
          {/* LEFT 7 COLS: CAMPUS GPS MAP & LIVE ACTIVITIES               */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            
            {/* 1. Interactive Campus GPS Map Card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col gap-3">
              
              {/* Header */}
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#202938] leading-snug">
                    Peta Monitoring Tim
                  </h2>
                  <p className="text-xs text-[#67686D] mt-0.5">
                    Tracking geolokasi tim liputan dan verifikasi radius GPS secara real-time.
                  </p>
                </div>

                {/* Map Controls */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setShowPersonnelModal((p) => !p)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                      showPersonnelModal
                        ? 'bg-[#F0F9FF] border-[#005CDB] text-[#005CDB]'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                    <span>Status Tim ({onlinePersonnel.length})</span>
                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${showPersonnelModal ? 'rotate-180' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#202938] shadow-xs transition-colors cursor-pointer"
                    title="Perbesar Peta"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className="p-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-[#202938] shadow-xs transition-colors cursor-pointer"
                    title="Perkecil Peta"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Personnel List Overlay Drawer */}
              {showPersonnelModal && (
                <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-2 max-h-52 overflow-y-auto animate-in fade-in duration-150">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-600 pb-1 border-b border-slate-200">
                    <span>Nama Personel Humas</span>
                    <span>Status &amp; Lokasi Terkini</span>
                  </div>
                  {locations.length === 0 ? (
                    <div className="text-center py-2 text-xs text-slate-500 italic">
                      Belum ada data presensi GPS aktif saat ini.
                    </div>
                  ) : (
                    locations.map((loc) => {
                      const isOnline = loc.isOnline;
                      return (
                        <div
                          key={loc.id}
                          onClick={() => {
                            setMapCenter([loc.longitude, loc.latitude]);
                            setMapZoom(18);
                            setRecenterTrigger((p) => p + 1);
                            setShowPersonnelModal(false);
                            toast.info(`Fokus ke lokasi: ${loc.user?.fullName || 'Petugas'}`);
                          }}
                          className="flex items-center justify-between p-2 rounded-lg text-xs hover:bg-white transition-colors cursor-pointer border border-transparent hover:border-slate-200"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            <div className="truncate">
                              <span className="font-bold text-slate-900 block truncate">{loc.user?.fullName || 'Petugas Humas'}</span>
                              <span className="text-[10px] text-slate-500">{loc.user?.roleLabel || 'Tim Humas'}</span>
                            </div>
                          </div>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                            isOnline ? 'bg-[#F0F9FF] text-[#005CDB]' : 'bg-slate-200 text-slate-600'
                          }`}>
                            {isOnline ? (loc.address || 'Area Kampus Polinela') : 'Offline'}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {/* Map Render Box */}
              <div className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner">
                <CampusMap
                  locations={locations}
                  center={mapCenter}
                  zoom={mapZoom}
                  recenterTrigger={recenterTrigger}
                  zoomInTrigger={zoomInTrigger}
                  zoomOutTrigger={zoomOutTrigger}
                  height="h-[300px] sm:h-[340px] 2xl:h-[400px]"
                />
              </div>

              {/* Map Legend */}
              <div className="flex items-center justify-between text-xs text-slate-500 pt-1 flex-wrap gap-2">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#005CDB]" />
                    <span className="font-medium text-slate-700">Personel Online ({onlinePersonnel.length})</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                    <span className="font-medium text-slate-700">Personel Offline ({offlinePersonnel.length})</span>
                  </span>
                </div>
                <span className="text-[11px] text-[#67686D] italic">
                  Radius Geofence Polinela: Terpantau 24 Jam
                </span>
              </div>

            </div>

            {/* 2. Kegiatan Sedang Berjalan & Agenda Liputan */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col gap-3">
              
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#202938] leading-snug">
                    Kegiatan Sedang Berjalan &amp; Liputan Lapangan
                  </h2>
                  <p className="text-xs text-[#67686D] mt-0.5">
                    Pemantauan penugasan kru liputan dan status dokumentasi
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-md text-xs font-bold text-[#005CDB] bg-[#F0F9FF]">
                  {liveActivities.length} Jadwal Aktif
                </span>
              </div>

              {/* Activity Cards List */}
              <div className="flex flex-col gap-3">
                {liveActivities.length === 0 ? (
                  <div className="py-8 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 flex flex-col items-center justify-center">
                    <CalendarCheck2 className="w-8 h-8 text-slate-300 mb-1.5" />
                    <p className="font-bold text-xs text-slate-700">Belum Ada Kegiatan Aktif Saat Ini</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Semua tim stand-by untuk peliputan kampus berikutnya.
                    </p>
                  </div>
                ) : (
                  liveActivities.slice(0, 3).map((act, idx) => {
                    const isOngoing = act.status === 'SEDANG_BERLANGSUNG';
                    const isAssigned = act.status === 'DITUGASKAN';
                    const statusLabel = isOngoing ? 'Sedang Berjalan' : isAssigned ? 'Ditugaskan • Peliputan' : act.status || 'Aktif';

                    const memberUsers = (act.members || []).map((m: any) => m.user?.fullName).filter(Boolean);
                    const allPersonnel = act.pic?.fullName
                      ? [act.pic.fullName, ...memberUsers.filter((n: string) => n !== act.pic?.fullName)]
                      : memberUsers.length > 0 ? memberUsers : ['Tim Humas'];

                    const equipmentList = (act.loans || [])
                      .flatMap((l: any) => (l.items || []).map((it: any) => it.equipment?.name))
                      .filter(Boolean);
                    const equipmentText = equipmentList.length > 0 ? equipmentList.join(', ') : (act.category || 'Armada Standar Humas');

                    return (
                      <div
                        key={act.id || idx}
                        className={`p-3.5 rounded-xl border transition-all flex flex-col gap-2.5 ${
                          isOngoing
                            ? 'bg-[#F0F9FF] border-[#005CDB]/30 shadow-xs'
                            : 'bg-slate-50/60 border-slate-200/80 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                            isOngoing
                              ? 'bg-[#E0F2FE] text-[#005CDB]'
                              : 'bg-blue-50 text-blue-700'
                          }`}>
                            {isOngoing && <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />}
                            {statusLabel}
                          </span>
                          <span className="text-xs text-slate-500 flex items-center gap-1 font-medium">
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                            {act.startTime || '08:00'} – {act.endTime || 'Selesai'} WIB
                          </span>
                        </div>

                        <div>
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                            {act.title}
                          </h3>
                          <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 flex-wrap">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-[#005CDB]" />
                              {act.location || 'Kampus Polinela'}
                            </span>
                            {act.latitude && act.longitude && (
                              <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 text-[10px] bg-emerald-100/70 px-2 py-0.5 rounded">
                                <CheckCircle className="w-2.5 h-2.5 text-emerald-600" /> GPS Terverifikasi (Radius {act.radius || 45}m)
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Footer: PIC & Equipment */}
                        <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs flex-wrap gap-2">
                          <div className="flex items-center gap-2">
                            <div className="flex items-center -space-x-1.5">
                              {allPersonnel.slice(0, 3).map((name: string, pIdx: number) => (
                                <div
                                  key={pIdx}
                                  className="w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] border border-white text-white"
                                  style={{ background: getAvatarColor(pIdx).bg }}
                                >
                                  {getInitials(name)}
                                </div>
                              ))}
                            </div>
                            <span className="font-semibold text-slate-800 text-xs">
                              {allPersonnel.slice(0, 2).join(', ')}
                            </span>
                          </div>

                          <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                            <Camera className="w-3.5 h-3.5 text-slate-400" />
                            <span className="truncate max-w-[220px] font-medium">{equipmentText}</span>
                          </div>
                        </div>

                      </div>
                    );
                  })
                )}
              </div>

            </div>

          </div>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* RIGHT 5 COLS: SHIFT ROSTER, INVENTARIS & CHART              */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* 1. Jadwal Piket & Shift Operasional Humas */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col gap-3">
              
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#202938] leading-snug">
                    Jadwal Piket Hari Ini
                  </h2>
                  <p className="text-xs text-[#67686D] mt-0.5" suppressHydrationWarning>
                    Shift Kerja Humas • {formattedDate}
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-md text-[10px] font-bold text-white bg-[#005CDB]">
                  Shift Aktif
                </span>
              </div>

              {/* Active Shift Indicator Bar */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/60 border border-blue-100">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Clock className="w-4 h-4 text-[#005CDB]" />
                  <span>Shift Aktif Sekarang:</span>
                </div>
                <span
                  className="px-2.5 py-1 rounded-md text-[10px] font-bold text-white bg-[#005CDB]"
                  suppressHydrationWarning
                >
                  {activeShiftName}
                </span>
              </div>

              {/* Duty Roster List */}
              <div className="flex flex-col gap-2">
                {displayDutySchedules.length === 0 ? (
                  <div className="py-6 text-center rounded-xl border border-dashed border-slate-200 bg-slate-50/60 flex flex-col items-center justify-center">
                    <Users className="w-7 h-7 text-slate-300 mb-1" />
                    <p className="font-bold text-xs text-slate-700">Belum Ada Roster Terjadwal</p>
                    <p className="text-[11px] text-slate-400">Semua staf mengikuti jam operasional reguler Humas.</p>
                  </div>
                ) : (
                  displayDutySchedules.slice(0, 4).map((sched, sIdx) => {
                    const initials = getInitials(sched.user?.fullName || sched.name);
                    const color = getAvatarColor(sIdx);
                    const isOnline = sched.status === 'SEDANG_BERLANGSUNG' || sched.status === 'HADIR';

                    return (
                      <div
                        key={sched.id || sIdx}
                        className="flex items-center justify-between p-2 rounded-xl hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className="w-8 h-8 rounded-full text-white flex items-center justify-center font-bold text-xs shrink-0"
                            style={{ background: color.bg }}
                          >
                            {initials}
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-xs text-slate-900 block truncate">
                              {sched.user?.fullName || sched.name || 'Petugas Humas'}
                            </span>
                            <span className="text-[10px] text-slate-500 block truncate">
                              {sched.notes || sched.task || (sched.shiftName ? `Shift ${sched.shiftName} • Piket Humas` : 'Piket Operasional Humas')}
                            </span>
                          </div>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border flex items-center gap-1 shrink-0 ${
                          isOnline
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200/60'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {isOnline ? 'Bertugas' : 'Terjadwal'}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* SOP Notice */}
              <div className="p-3 rounded-xl bg-[#F0FDF4] border border-emerald-200/60 flex items-start gap-2.5 text-xs text-slate-700">
                <Info className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <p className="leading-relaxed font-medium">
                  SOP Petugas: Pastikan baterai peralatan terisi penuh dan checklist ruang podcast terselesaikan sebelum pergantian shift.
                </p>
              </div>

            </div>

            {/* 2. Ringkasan Inventaris Peralatan Humas */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col gap-3">
              
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#202938] leading-snug">
                    Ringkasan Inventaris Peralatan Humas
                  </h2>
                  <p className="text-xs text-[#67686D] mt-0.5">
                    Status armada kamera, audio, dan drone kampus
                  </p>
                </div>
                <Package className="w-4 h-4 text-[#005CDB]" />
              </div>

              {/* 4 Mini Stat Boxes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl border border-slate-100 bg-[#F8FAFC] flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] font-bold tracking-wider uppercase text-slate-500">Jenis Alat</span>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">{stats.totalEquipmentTypes || 0}</div>
                </div>

                <div className="p-3 rounded-xl border border-slate-100 bg-[#F8FAFC] flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] font-bold tracking-wider uppercase text-slate-500">Total Unit</span>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">{stats.totalEquipmentUnits || 0}</div>
                </div>

                <div className="p-3 rounded-xl border border-[#005CDB]/20 bg-[#F0F9FF] flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] font-bold tracking-wider uppercase text-[#005CDB]">Dipinjam</span>
                  <div className="text-xl font-extrabold text-[#005CDB] mt-1">{stats.unitsBorrowed || 0}</div>
                </div>

                <div className="p-3 rounded-xl border border-emerald-200/70 bg-emerald-50/50 flex flex-col items-center justify-center text-center">
                  <span className="text-[9px] font-bold tracking-wider uppercase text-emerald-700">Tersedia</span>
                  <div className="text-xl font-extrabold text-emerald-600 mt-1">{stats.unitsAvailable || 0}</div>
                </div>
              </div>

              {overdueLoansCount > 0 && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-2 text-[#B8484A] text-xs font-semibold">
                  <AlertCircle className="w-4 h-4 text-[#B8484A] shrink-0" />
                  <span>
                    Perhatian: {overdueLoansCount} unit peralatan telah melewati batas waktu pengembalian.
                  </span>
                </div>
              )}

            </div>

            {/* 3. Trend Operasional 6 Bulan Terakhir */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-xs flex flex-col gap-3">
              
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[#202938] leading-snug">
                    Trend Operasional (6 Bulan Terakhir)
                  </h2>
                  <p className="text-xs text-[#67686D] mt-0.5">
                    Grafik jumlah kegiatan dan content plan per bulan
                  </p>
                </div>
                <TrendingUp className="w-5 h-5 text-[#005CDB]" />
              </div>

              {/* Bar Chart Container */}
              <DisplayTrendChart data={monthlyData} />

              {/* Legend & Summary */}
              <div className="flex items-center justify-center gap-6 text-xs text-slate-600 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-xs bg-[#005CDB]" />
                  <span className="font-medium text-[#202938]">Kegiatan Diliput</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-xs bg-[#E99710]" />
                  <span className="font-medium text-[#202938]">Content Plan</span>
                </div>
              </div>

            </div>

          </div>

        </div>

      </main>

    </div>
  );
}
