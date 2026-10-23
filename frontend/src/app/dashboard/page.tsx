'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/layout/AdminLayout';
import { CustomButton, StatusBadge } from '@/components/common';
import DashboardSkeleton from '@/components/common/DashboardSkeleton';
import {
  CalendarCheck2, FileText, Users, Clock, CheckCircle2,
  AlertCircle, TrendingUp, ArrowRight, Bell, Package,
  RotateCcw, MapPin, Calendar, ChevronRight, Info,
  Wrench, ExternalLink, Camera, Plus, CheckCircle,
  Radio, Wifi,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  Tooltip as RechartsTooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';
import { formatDateID } from '@/utils/formatters';
import { dashboardService } from '@/services';
import { getStoredUser } from '@/utils/session';
import { toast } from 'sonner';

/* ─── Palette ─── */
const BRAND = '#006876';
const PIE_COLORS = ['#006876', '#32B0C5', '#f59e0b', '#10b981', '#8b5cf6'];

/* ─── Helpers ─── */
function getInitials(name: string) {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  return parts.length === 1
    ? parts[0][0].toUpperCase()
    : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  { bg: '#006876', text: '#FFFFFF' },
  { bg: '#32B0C5', text: '#003E47' },
  { bg: '#49A9EE', text: '#003B5D' },
  { bg: '#DCE9FF', text: '#0B1C30' },
  { bg: '#CCE5FF', text: '#001D31' },
  { bg: '#E5EEFF', text: '#6D797C' },
];

function avatarColor(idx: number) {
  return AVATAR_COLORS[idx % AVATAR_COLORS.length];
}

/* ─── Avatar ─── */
function Avatar({ name, size = 28, idx = 0 }: { name: string; size?: number; idx?: number }) {
  const c = avatarColor(idx);
  return (
    <div
      className="rounded-full flex items-center justify-center font-semibold shrink-0 border-2 border-white"
      style={{ width: size, height: size, fontSize: size * 0.38, background: c.bg, color: c.text }}
    >
      {getInitials(name)}
    </div>
  );
}

/* ─── Avatar Stack ─── */
function AvatarStack({ names }: { names: string[] }) {
  return (
    <div className="flex items-center">
      {names.slice(0, 4).map((n, i) => (
        <div key={i} style={{ marginLeft: i === 0 ? 0 : -8, zIndex: 10 - i, position: 'relative' }}>
          <Avatar name={n} size={28} idx={i} />
        </div>
      ))}
    </div>
  );
}

/* ─── Metric Card (5 cards row) ─── */
function MetricCard({
  label, value, subtitle, icon: Icon,
}: { label: string; value: number | string; subtitle: string; icon: React.ElementType }) {
  return (
    <div className="flex-1 min-w-0 bg-white border border-[#BCC9CC]/40 rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold tracking-[0.55px] uppercase text-[#3D494B] leading-4">{label}</span>
        <div className="w-7 h-7 rounded-lg bg-[#F0F6FE] flex items-center justify-center shrink-0">
          <Icon className="w-3.5 h-3.5 text-[#7C8898]" />
        </div>
      </div>
      <div>
        <div className="text-[32px] font-bold leading-10 tracking-[-0.8px] text-[#0B1C30]">{value}</div>
        <div className="text-xs text-[#3D494B] mt-0.5">{subtitle}</div>
      </div>
    </div>
  );
}

/* ─── Alert Banner Card (gradient teal) ─── */
function AlertCard({ label, value, href }: { label: string; value: number; href: string }) {
  return (
    <Link href={href} className="flex-1 min-w-0">
      <div
        className="flex items-center justify-between px-4 py-4 rounded-xl cursor-pointer transition-opacity hover:opacity-90"
        style={{ background: 'linear-gradient(90deg, rgba(0,104,118,0.82) 0%, rgba(0,194,220,0.72) 100%)', minHeight: 76 }}
      >
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-bold tracking-[0.55px] uppercase text-white leading-4">{label}</span>
          <span className="text-[24px] font-bold tracking-[-0.48px] text-white leading-8">{value}</span>
        </div>
        <ArrowRight className="w-4 h-4 text-white/80 shrink-0" />
      </div>
    </Link>
  );
}

/* ─── Status Tag (chip on activity) ─── */
function StatusTag({ label, variant }: { label: string; variant: 'active' | 'upcoming' | 'special' }) {
  const styles: Record<string, string> = {
    active: 'bg-white text-[#006876]',
    upcoming: 'bg-[#DCE9FF] text-[#0B1C30]',
    special: 'bg-white text-[#006876]',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-[0.385px] ${styles[variant]}`}>
      {variant === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 animate-pulse" />}
      {label}
    </span>
  );
}

/* ─── GPS Badge ─── */
function GpsBadge({ verified }: { verified?: boolean }) {
  return verified ? (
    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700">
      <CheckCircle className="w-2.5 h-2.5" /> GPS: Terverifikasi (Radius 45m)
    </span>
  ) : null;
}

/* ─── Live badge ─── */
function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
      Live Location Aktif
    </span>
  );
}

/* ─── Activity Item Card ─── */
function ActivityItemCard({
  act, idx,
}: { act: any; idx: number }) {
  const isActive = idx < 2;
  const isSpecial = idx === 1;
  const isUpcoming = idx >= 2;

  const tagLabel = isUpcoming
    ? `Persiapan Segera • Mulai ${act.startTime || '—'}`
    : isSpecial
    ? 'Sedang Berjalan • Berita Khusus'
    : `Sedang Berjalan • Sisa 1 Jam`;

  const tagVariant: 'active' | 'upcoming' | 'special' = isUpcoming ? 'upcoming' : 'active';

  const members: string[] = act.members?.map((m: any) => m.fullName) ||
    (act.pic?.fullName ? [act.pic.fullName] : ['Tim Humas']);

  return (
    <div className={`flex flex-col gap-3 p-4 rounded-xl ${!isUpcoming ? 'bg-[#EFF4FF]/70' : 'bg-white border border-slate-100'}`}>
      {/* Row 1: tag + time */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <StatusTag label={tagLabel} variant={tagVariant} />
        <span className="flex items-center gap-1 text-[11px] font-medium text-[#3D494B]">
          <Clock className="w-3 h-3" /> {act.startTime || '—'} – {act.endTime || '—'} WIB
        </span>
      </div>

      {/* Row 2: title + location */}
      <div className="flex flex-col gap-1">
        <h3 className="text-[18px] font-semibold leading-6 tracking-[-0.18px] text-[#0B1C30]">{act.title}</h3>
        <div className="flex items-center gap-1.5 flex-wrap text-xs text-[#3D494B]">
          <MapPin className="w-3 h-3 text-[#6D797C] shrink-0" />
          <span>{act.location || 'Lokasi kampus'}</span>
          {idx === 0 && <GpsBadge verified />}
          {idx === 1 && <LiveBadge />}
        </div>
      </div>

      {/* Row 3: members + equipment */}
      <div className={`flex items-center justify-between px-2 py-2 rounded-lg ${!isUpcoming ? 'bg-white/80' : 'bg-[#EFF4FF]'}`}>
        <div className="flex items-center gap-2 min-w-0">
          <AvatarStack names={members} />
          <span className="text-xs font-semibold text-[#0B1C30] truncate">
            {members.slice(0, 2).map((m, i) => {
              const roles = act.members?.[i]?.role || (i === 0 ? '(Host)' : '(Audio)');
              return `${m} ${roles}`;
            }).join(', ')}
          </span>
        </div>
        {act.equipment && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-[#3D494B] shrink-0 ml-2">
            <Camera className="w-3 h-3 text-[#6D797C]" /> {act.equipment}
          </span>
        )}
        {!act.equipment && idx === 2 && (
          <span className="text-[11px] font-semibold text-[#006876]">Studio Ready</span>
        )}
      </div>
    </div>
  );
}

/* ─── Roster Member Row ─── */
function RosterRow({
  initials, name, role, task, status, statusColor, avatarIdx,
}: {
  initials: string; name: string; role?: string; task: string;
  status: string; statusColor: string; avatarIdx: number;
}) {
  const c = avatarColor(avatarIdx);
  const dotColor =
    statusColor === 'green' ? '#32B0C5' :
    statusColor === 'blue' ? '#006398' : '#BCC9CC';
  const textColor =
    statusColor === 'green' ? '#006876' :
    statusColor === 'blue' ? 'rgba(11,28,48,0.5)' : '#6D797C';
  const pillBg =
    statusColor === 'green' ? '#EFF4FF' :
    statusColor === 'blue' ? '#DCE9FF' : '#E5EEFF';

  return (
    <div className="flex items-center justify-between px-2 py-2 rounded-lg bg-white">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-[12px] font-semibold shrink-0"
          style={{ background: c.bg, color: c.text }}
        >
          {initials}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold tracking-[0.3px] text-[#0B1C30] truncate">{name}</span>
            {role && (
              <span className="px-1.5 py-0 text-[10px] font-medium text-[#3D494B] bg-[#D3E4FE] rounded shrink-0">{role}</span>
            )}
          </div>
          <p className="text-xs text-[#3D494B] mt-0.5 truncate">{task}</p>
        </div>
      </div>
      <span
        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold shrink-0 ml-2"
        style={{ background: pillBg, color: textColor }}
      >
        <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: dotColor }} />
        {status}
      </span>
    </div>
  );
}

/* ══════════════════════════════════════════════ */
/*              PAGE COMPONENT                    */
/* ══════════════════════════════════════════════ */
export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await dashboardService.summary();
      setDashboardData(data);
    } catch {
      setError(true);
      toast.error('Gagal memuat data statistik dashboard dari server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getStoredUser();
    setCurrentUser(user);
    loadDashboard();
  }, []);

  if (loading) return <AdminLayout title="Dashboard Operasional Humas"><DashboardSkeleton /></AdminLayout>;

  if (error || !dashboardData) {
    return (
      <AdminLayout title="Dashboard Operasional Humas">
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-4 max-w-md mx-auto my-12">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Gagal Memuat Statistik</h3>
            <p className="text-xs text-slate-500 mt-1">Terjadi kesalahan saat mengambil data dari server.</p>
          </div>
          <CustomButton variant="primary" icon={RotateCcw} onClick={loadDashboard}>Coba Lagi</CustomButton>
        </div>
      </AdminLayout>
    );
  }

  const isStaffOnly = currentUser?.role === 'USER';
  const stats = dashboardData.statistics || {};
  const actionItems = (dashboardData.actionItems || []).filter((a: any) => a.count > 0);
  const liveActivities = dashboardData.upcomingActivitiesList?.slice(0, 3) || [];

  const roleLabel =
    currentUser?.role === 'SUPER_ADMIN' ? 'Kepala Humas' :
    currentUser?.role === 'ADMIN' ? 'Admin Humas' : 'Tim Humas';

  const contentPlanPieData = [
    { name: 'Draft', value: stats.draftContent || 0 },
    { name: 'Proses', value: stats.processContent || 0 },
    { name: 'Revisi', value: stats.revisionContent || 0 },
    { name: 'Published', value: stats.publishedContent || 0 },
    { name: 'Selesai', value: stats.completedContent || 0 },
  ].filter((d) => d.value > 0);

  /* Demo roster (placeholder until API provides roster data) */
  const roster = dashboardData.rosterMembers?.length
    ? dashboardData.rosterMembers
    : [
        { initials: 'KA', name: currentUser?.fullName || 'Komang Ari', role: 'Koordi', task: 'Receptionis & Verifikasi Berkas', status: 'Hadir 07:15', statusColor: 'green', avatarIdx: 0 },
        { initials: 'NA', name: 'Nurul Azizah, S.Kom', role: '', task: 'Monitoring Media & Aduan Publik', status: 'Hadir 07:22', statusColor: 'green', avatarIdx: 1 },
        { initials: 'BS', name: 'Budi Santoso', role: '', task: 'Dokumentasi Foto • GSG Polinela', status: 'Tugas Lapangan', statusColor: 'blue', avatarIdx: 2 },
        { initials: 'AF', name: 'Ahmad Fauzi', role: 'Shift Sore', task: 'Editing & Video Post Produksi', status: '12:30 WIB', statusColor: 'gray', avatarIdx: 3 },
      ];

  return (
    <AdminLayout title="Dashboard Operasional Humas">
      <div className="flex flex-col gap-6" style={{ background: '#F8F9FF', minHeight: '100%' }}>

        {/* ══ 1. WELCOME BANNER ══ */}
        <div
          className="relative overflow-hidden rounded-2xl p-6 text-white shadow-sm"
          style={{ background: BRAND }}
        >
          {/* Decorative */}
          <div className="absolute right-0 top-0 bottom-0 w-64 pointer-events-none overflow-hidden">
            <div className="absolute -right-10 -top-10 w-64 h-64 rounded-full bg-white/5" />
            <div className="absolute right-6 -bottom-16 w-72 h-72 rounded-full bg-black/10" />
            <div className="absolute right-16 top-4 w-44 h-44 rounded-full bg-white/5" />
          </div>
          <div className="relative z-10 flex flex-col gap-2">
            <span className="inline-flex items-center px-2.5 py-[3px] rounded bg-white/20 text-white text-[11px] font-bold tracking-[0.55px] uppercase w-fit">
              {roleLabel}
            </span>
            <h1 className="text-[24px] font-bold tracking-[-0.6px] text-white mt-1">
              Selamat Datang, {currentUser?.fullName || 'Pengguna'}!
            </h1>
            <p className="text-[12px] font-normal max-w-xl leading-4" style={{ color: 'rgba(220,233,255,0.9)' }}>
              {isStaffOnly
                ? 'Pantau kegiatan yang ditugaskan, check-in tugas peliputan, dan unggah draf content plan.'
                : 'Pantau kondisi operasional kehumasan, persetujuan kegiatan, peminjaman alat, dan alur kerja tim secara real-time.'}
            </p>
          </div>
        </div>

        {/* ══ 2. KEY METRICS 5-CARD ══ */}
        <div className="flex flex-row gap-4 flex-wrap">
          {isStaffOnly ? (
            <>
              <MetricCard label="Kegiatan Ditugaskan" value={stats.myAssignedActivitiesCount || 0} subtitle="Ditugaskan & berlangsung" icon={CalendarCheck2} />
              <MetricCard label="Belum Check-In" value={stats.myPendingCheckInsCount || 0} subtitle="Menunggu kehadiran lokasi" icon={Clock} />
              <MetricCard label="Content Plan Saya" value={stats.myAssignedContentPlansCount || 0} subtitle="Draft, proses & revisi" icon={FileText} />
              <MetricCard label="Notifikasi" value={stats.unreadNotificationsCount || 0} subtitle="Pesan masuk belum dibaca" icon={Bell} />
            </>
          ) : (
            <>
              <MetricCard label="Kegiatan Aktif" value={stats.activeActivities || 0} subtitle="Ditugaskan & berlangsung" icon={CalendarCheck2} />
              <MetricCard label="Menunggu Persetujuan" value={stats.pendingApprovalActivities || 0} subtitle="Perlu review Kepala Humas" icon={Clock} />
              <MetricCard label="Menunggu Verifikasi" value={stats.pendingVerificationActivities || 0} subtitle="Verifikasi kelengkapan Admin" icon={CheckCircle2} />
              <MetricCard label="Content Plan Aktif" value={stats.activeContentPlans || 0} subtitle="Draft, proses & revisi" icon={FileText} />
              <MetricCard label="Jumlah Tim Humas" value={stats.timHumasUsers || 0} subtitle={`Total Personel: ${stats.totalUsers || 0}`} icon={Users} />
            </>
          )}
        </div>

        {/* ══ 3. ACTION REQUIRED BANNER ══ */}
        {actionItems.length > 0 && (
          <div className="bg-white border border-[#BCC9CC]/40 rounded-xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-[15px] h-[15px] text-[#F50B0B] shrink-0" />
              <span className="text-[12px] font-bold tracking-[0.6px] uppercase text-[#0B1C30]">
                Membutuhkan Tindakan
              </span>
            </div>
            <div className="flex flex-row gap-4 flex-wrap">
              {actionItems.map((item: any) => (
                <AlertCard key={item.id} label={item.label} value={item.count} href={item.link} />
              ))}
            </div>
          </div>
        )}

        {/* ══ 4. LIVE ACTIVITIES + DUTY ROSTER ══ */}
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_660px] gap-4">

          {/* WIDGET A — Kegiatan Sedang Berjalan */}
          <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-[18px] font-bold leading-6 tracking-[-0.18px] text-[#0B1C30]">
                  Kegiatan Sedang Berjalan
                </h2>
                <p className="text-xs text-[#3D494B] mt-0.5">
                  Pemantauan lokasi lapangan langsung dari lokasi kampus
                </p>
              </div>
              <Link
                href="/kegiatan"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-[#006876] shrink-0"
                style={{ background: '#EFF4FF' }}
              >
                <Plus className="w-3 h-3" /> Tambah Log
              </Link>
            </div>

            {/* Activity list */}
            <div className="flex flex-col gap-4">
              {liveActivities.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CalendarCheck2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">Belum ada kegiatan aktif hari ini.</p>
                </div>
              ) : (
                liveActivities.map((act: any, idx: number) => (
                  <ActivityItemCard key={act.id} act={act} idx={idx} />
                ))
              )}
            </div>
          </div>

          {/* WIDGET B — Jadwal Piket Hari Ini */}
          <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4">
            {/* Header */}
            <div className="flex items-start justify-between gap-4 pb-2 border-b border-slate-100">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: BRAND }}>
                  <Calendar className="w-[17px] h-[17px] text-white" />
                </div>
                <div>
                  <h2 className="text-[18px] font-bold leading-6 tracking-[-0.18px] text-[#0B1C30]">Jadwal Piket Hari Ini</h2>
                  <p className="text-xs text-[#3D494B] mt-0.5">
                    Shift Kerja Humas •{' '}
                    {new Date().toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                </div>
              </div>
              <Link href="/presensi" className="text-[11px] font-semibold text-[#006876] shrink-0 text-right leading-4">
                Roster<br />Lengkap
              </Link>
            </div>

            {/* Shift badge */}
            <div className="flex items-center justify-between px-3 py-2.5 rounded-lg" style={{ background: '#EFF4FF' }}>
              <div className="flex items-center gap-2">
                <Clock className="w-[18px] h-[18px]" style={{ color: BRAND }} />
                <span className="text-[11px] font-semibold tracking-[0.385px] text-[#0B1C30]">Shift Aktif Sekarang:</span>
              </div>
              <span className="px-2 py-0.5 rounded text-[11px] font-semibold tracking-[0.385px] text-[#001F25]"
                style={{ background: '#A1EFFF' }}>
                Shift 1 (07:30 – 12:30 WIB)
              </span>
            </div>

            {/* Roster members */}
            <div className="flex flex-col gap-2">
              {roster.map((m: any, i: number) => (
                <RosterRow
                  key={i}
                  initials={m.initials}
                  name={m.name}
                  role={m.role}
                  task={m.task}
                  status={m.status}
                  statusColor={m.statusColor}
                  avatarIdx={m.avatarIdx ?? i}
                />
              ))}
            </div>

            {/* SOP Reminder */}
            <div className="flex items-start gap-2.5 px-3 py-3 rounded-lg" style={{ background: '#EFF4FF' }}>
              <Info className="w-[15px] h-[15px] shrink-0 mt-0.5" style={{ color: BRAND }} />
              <p className="text-[12px] font-semibold text-[#0B1C30] leading-5">
                SOP Petugas: Pastikan checklist penyerahan kunci ruang podcast dan pengisian baterai peralatan tuntas sebelum pergantian pukul 12:30.
              </p>
            </div>
          </div>
        </div>

        {/* ══ 5. INVENTORY QUICK OVERVIEW ══ */}
        <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-[18px] font-bold leading-6 tracking-[-0.18px] text-[#0B1C30]">
              Ringkasan Inventaris Peralatan Humas
            </h2>
            <Link href="/peminjaman-alat" className="flex items-center gap-1 text-[12px] font-semibold tracking-[0.3px] text-[#006876]">
              Kelola Alat <ChevronRight className="w-[10.67px] h-[10.67px]" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="flex flex-col items-center gap-2 py-6 px-4 rounded-xl" style={{ background: '#EFF4FF' }}>
              <span className="text-[11px] font-semibold tracking-[0.55px] uppercase text-center text-[#3D494B]">Total Jenis Alat</span>
              <span className="text-[32px] font-bold tracking-[-0.8px] text-[#0B1C30]">{stats.totalEquipmentTypes || 0}</span>
            </div>
            <div className="flex flex-col items-center gap-2 py-6 px-4 rounded-xl" style={{ background: '#EFF4FF' }}>
              <span className="text-[11px] font-semibold tracking-[0.55px] uppercase text-center text-[#3D494B]">Total Unit</span>
              <span className="text-[32px] font-bold tracking-[-0.8px] text-[#0B1C30]">{stats.totalEquipmentUnits || 0}</span>
            </div>
            <div className="flex flex-col items-center gap-2 py-6 px-4 rounded-xl" style={{ background: 'rgba(204,229,255,0.4)' }}>
              <span className="text-[11px] font-semibold tracking-[0.55px] uppercase text-center text-[#006398]">Unit Sedang Dipinjam</span>
              <span className="text-[32px] font-bold tracking-[-0.8px] text-[#006398]">{stats.unitsBorrowed || 0}</span>
            </div>
            <div className="flex flex-col items-center gap-2 py-6 px-4 rounded-xl" style={{ background: '#ECFDF5' }}>
              <span className="text-[11px] font-semibold tracking-[0.55px] uppercase text-center text-[#047857]">Unit Tersedia</span>
              <span className="text-[32px] font-bold tracking-[-0.8px] text-[#047857]">{stats.unitsAvailable || 0}</span>
            </div>
          </div>
        </div>

        {/* ══ 6. CHARTS & ANALYTICS ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 pb-6">

          {/* Bar Chart — Trend Operasional */}
          <div className="bg-white rounded-xl border border-[#BCC9CC]/40 p-6 flex flex-col gap-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-[18px] font-bold leading-6 tracking-[-0.18px] text-[#0B1C30]">
                  Trend Operasional (6 Bulan Terakhir)
                </h2>
                <p className="text-xs text-[#3D494B] mt-0.5">Grafik jumlah kegiatan dan content plan per bulan</p>
              </div>
              <TrendingUp className="w-4 h-4 text-[#006876] mt-1 shrink-0" />
            </div>
            <div className="h-56 w-full mt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={dashboardData.monthlyStats || []}
                  margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="1 3" vertical={false} stroke="#EFF4FF" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6D797C' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#6D797C' }} allowDecimals={false} axisLine={false} tickLine={false} />
                  <RechartsTooltip
                    contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12, boxShadow: 'none' }}
                  />
                  <Bar dataKey="kegiatan" name="Kegiatan" fill={BRAND} radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Bar dataKey="konten" name="Content Plan" fill="#32B0C5" radius={[4, 4, 0, 0]} maxBarSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Donut Chart — Status Content Plan */}
          <div className="bg-white rounded-xl border border-[#BCC9CC]/40 p-6 flex flex-col gap-4">
            <div>
              <h2 className="text-[18px] font-bold leading-6 tracking-[-0.18px] text-[#0B1C30]">Status Content Plan</h2>
              <p className="text-xs text-[#3D494B] mt-0.5">Distribusi konten aktif &amp; riwayat</p>
            </div>

            {contentPlanPieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center flex-1 py-10 text-slate-400">
                <FileText className="w-8 h-8 opacity-30 mb-2" />
                <p className="text-xs">Belum ada data content plan.</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-4">
                {/* Donut */}
                <div className="w-44 h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={contentPlanPieData}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={48}
                        outerRadius={72}
                        strokeWidth={2.5}
                        stroke="#fff"
                      >
                        {contentPlanPieData.map((_, idx) => (
                          <Cell key={idx} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{ borderRadius: 8, border: '1px solid #E2E8F0', fontSize: 12 }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                {/* Legend */}
                <div className="flex flex-col gap-2 w-full">
                  {contentPlanPieData.map((item, idx) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: PIE_COLORS[idx % PIE_COLORS.length] }} />
                      <span className="text-xs text-[#3D494B] flex-1">{item.name}</span>
                      <span className="text-xs font-bold text-[#0B1C30]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}
