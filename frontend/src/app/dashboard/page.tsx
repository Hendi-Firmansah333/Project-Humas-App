'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  StatCard,
  StatusBadge,
  DataTable,
  Column,
  CustomButton,
  PaginationBar,
  SearchBox,
  FilterDropdown,
  CustomModal,
} from '@/components/common';
import DashboardSkeleton from '@/components/common/DashboardSkeleton';
import {
  CalendarCheck2,
  FileText,
  Users,
  Wrench,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  UserCheck,
  Bell,
  Mail,
  Package,
  Plus,
  RotateCcw,
  BarChart2,
  Eye,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Activity } from '@/types';
import { formatDateID } from '@/utils/formatters';
import { dashboardService } from '@/services';
import { getStoredUser } from '@/utils/session';
import { toast } from 'sonner';

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
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-4 max-w-md mx-auto my-12">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-base">Gagal Memuat Statistik</h3>
            <p className="text-xs text-slate-500 mt-1">Terjadi kesalahan saat mengambil data statistik dari database server.</p>
          </div>
          <CustomButton variant="primary" icon={RotateCcw} onClick={loadDashboard}>
            Coba Lagi
          </CustomButton>
        </div>
      </AdminLayout>
    );
  }

  const isStaffOnly = currentUser?.role === 'USER';
  const stats = dashboardData.statistics || {};

  // Chart data definitions
  const pieColors = ['#0D9488', '#38BDF8', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const contentPlanPieData = [
    { name: 'Draft', value: stats.draftContent || 0 },
    { name: 'Proses', value: stats.processContent || 0 },
    { name: 'Revisi', value: stats.revisionContent || 0 },
    { name: 'Published', value: stats.publishedContent || 0 },
    { name: 'Selesai', value: stats.completedContent || 0 },
  ].filter((d) => d.value > 0);

  const loanPieData = [
    { name: 'Dipinjam', value: stats.activeLoans || 0 },
    { name: 'Terlambat', value: stats.overdueLoans || 0 },
    { name: 'Selesai', value: stats.completedLoans || 0 },
  ].filter((d) => d.value > 0);

  return (
    <AdminLayout title="Dashboard Operasional Humas">
      {/* ── Banner Sambutan ────────────────────────────────────────── */}
      <div className="bg-gradient-to-r from-teal-700 via-teal-800 to-teal-900 rounded-2xl p-6 text-white shadow-md">
        <div>
          <span className="bg-teal-600/60 text-teal-100 text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
            {currentUser?.role === 'SUPER_ADMIN' ? 'Kepala Humas' : currentUser?.role === 'ADMIN' ? 'Admin Humas' : 'Tim Humas'}
          </span>
          <h1 className="text-xl sm:text-2xl font-extrabold mt-2">
            Selamat Datang, {currentUser?.fullName || 'Personel Humas'}!
          </h1>
          <p className="text-xs text-teal-100/90 mt-1 max-w-2xl leading-relaxed">
            {isStaffOnly
              ? 'Pantau kegiatan yang ditugaskan kepada Anda, check-in tugas peliputan, dan unggah draf content plan.'
              : 'Pantau kondisi operasional kehumasan, persetujuan kegiatan, peminjaman alat, dan alur kerja tim secara real-time.'}
          </p>
        </div>
      </div>

      {/* ── Dashboard Personel / TIM HUMAS View ─────────────────────── */}
      {isStaffOnly ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Kegiatan Ditugaskan"
              value={stats.myAssignedActivitiesCount || 0}
              subtitle="Total kegiatan peliputan"
              icon={CalendarCheck2}
              iconBgClass="bg-teal-50"
              iconColorClass="text-teal-600"
            />
            <StatCard
              title="Belum Check-In"
              value={stats.myPendingCheckInsCount || 0}
              subtitle="Menunggu kehadiran lokasi"
              icon={Clock}
              iconBgClass="bg-amber-50"
              iconColorClass="text-amber-600"
            />
            <StatCard
              title="Content Plan Saya"
              value={stats.myAssignedContentPlansCount || 0}
              subtitle="Target kreator konten"
              icon={FileText}
              iconBgClass="bg-sky-50"
              iconColorClass="text-sky-600"
            />
            <StatCard
              title="Notifikasi"
              value={stats.unreadNotificationsCount || 0}
              subtitle="Pesan masuk belum dibaca"
              icon={Bell}
              iconBgClass="bg-purple-50"
              iconColorClass="text-purple-600"
            />
          </div>

          {/* Action Items - Tugas Saya */}
          {dashboardData.actionItems && dashboardData.actionItems.filter((a: any) => a.count > 0).length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                TUGAS SAYA — Membutuhkan Tindakan
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {dashboardData.actionItems.filter((a: any) => a.count > 0).map((item: any) => (
                  <Link key={item.id} href={item.link}>
                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 transition-all cursor-pointer flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-amber-700 font-bold uppercase tracking-wider">{item.label}</p>
                        <p className="text-2xl font-black text-amber-800 mt-1">{item.count}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-amber-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Agenda Kegiatan Saya */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <CalendarCheck2 className="w-4 h-4 text-teal-600" />
                  Kegiatan Ditugaskan Kepada Saya
                </h3>
                <Link href="/kegiatan" className="text-xs text-teal-600 font-bold hover:underline">Lihat Semua →</Link>
              </div>
              {(!dashboardData.upcomingActivitiesList || dashboardData.upcomingActivitiesList.length === 0) ? (
                <p className="text-xs text-slate-400 italic py-6 text-center">Belum ada kegiatan yang ditugaskan kepada Anda.</p>
              ) : (
                <div className="space-y-3">
                  {dashboardData.upcomingActivitiesList.map((act: any) => (
                    <div key={act.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-800 text-xs">{act.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">📍 {act.location} • 📅 {formatDateID(act.date.split('T')[0])}</p>
                      </div>
                      <Link href={`/kegiatan/${act.id}`}>
                        <CustomButton variant="outline" size="sm">Detail</CustomButton>
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Content Plan Saya */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-sky-600" />
                  Target Content Plan Saya
                </h3>
                <Link href="/content-plan" className="text-xs text-sky-600 font-bold hover:underline">Lihat Semua →</Link>
              </div>
              {(!dashboardData.upcomingContentPlansList || dashboardData.upcomingContentPlansList.length === 0) ? (
                <p className="text-xs text-slate-400 italic py-6 text-center">Belum ada content plan yang ditugaskan kepada Anda.</p>
              ) : (
                <div className="space-y-3">
                  {dashboardData.upcomingContentPlansList.map((cp: any) => (
                    <div key={cp.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-slate-800 text-xs">{cp.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">Platform: <strong>{cp.platform}</strong> • Deadline: {formatDateID(cp.deadline.split('T')[0])}</p>
                      </div>
                      <StatusBadge status={cp.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* ── Dashboard Operasional / Management (SUPER ADMIN & ADMIN) ── */
        <div className="space-y-6">
          {/* 5 Main Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <StatCard
              title="Kegiatan Aktif"
              value={stats.activeActivities || 0}
              subtitle="Ditugaskan & berlangsung"
              icon={CalendarCheck2}
              iconBgClass="bg-teal-50"
              iconColorClass="text-teal-600"
            />
            <StatCard
              title="Menunggu Persetujuan"
              value={stats.pendingApprovalActivities || 0}
              subtitle="Perlu review Kepala Humas"
              icon={Clock}
              iconBgClass="bg-amber-50"
              iconColorClass="text-amber-600"
            />
            <StatCard
              title="Menunggu Verifikasi"
              value={stats.pendingVerificationActivities || 0}
              subtitle="Verifikasi kelengkapan Admin"
              icon={CheckCircle2}
              iconBgClass="bg-sky-50"
              iconColorClass="text-sky-600"
            />
            <StatCard
              title="Content Plan Aktif"
              value={stats.activeContentPlans || 0}
              subtitle="Draft, proses & revisi"
              icon={FileText}
              iconBgClass="bg-indigo-50"
              iconColorClass="text-indigo-600"
            />
            <StatCard
              title="Jumlah Tim Humas"
              value={stats.timHumasUsers || 0}
              subtitle={`Total personel: ${stats.totalUsers || 0}`}
              icon={Users}
              iconBgClass="bg-emerald-50"
              iconColorClass="text-emerald-600"
            />
          </div>

          {/* Action Items - Membutuhkan Tindakan */}
          {dashboardData.actionItems && dashboardData.actionItems.filter((a: any) => a.count > 0).length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-500" />
                {currentUser?.role === 'SUPER_ADMIN' ? 'MEMBUTUHKAN TINDAKAN ANDA' : 'MEMBUTUHKAN TINDAKAN'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {dashboardData.actionItems.filter((a: any) => a.count > 0).map((item: any) => (
                  <Link key={item.id} href={item.link}>
                    <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-100/60 transition-all cursor-pointer flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-amber-700 font-bold uppercase tracking-wider">{item.label}</p>
                        <p className="text-2xl font-black text-amber-800 mt-1">{item.count}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-amber-400" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Ringkasan Inventaris Alat */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                <Package className="w-4 h-4 text-teal-600" />
                Ringkasan Inventaris Peralatan Humas
              </h3>
              <Link href="/peminjaman-alat" className="text-xs text-teal-600 font-bold hover:underline">Kelola Alat →</Link>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center py-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[11px] text-slate-400 font-semibold uppercase">Total Jenis Alat</p>
                <p className="text-lg font-bold text-slate-800 mt-0.5">{stats.totalEquipmentTypes || 0}</p>
              </div>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                <p className="text-[11px] text-slate-400 font-semibold uppercase">Total Unit</p>
                <p className="text-lg font-bold text-slate-800 mt-0.5">{stats.totalEquipmentUnits || 0}</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-100 text-blue-900">
                <p className="text-[11px] text-blue-600 font-semibold uppercase">Unit Sedang Dipinjam</p>
                <p className="text-lg font-bold mt-0.5">{stats.unitsBorrowed || 0}</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-emerald-900">
                <p className="text-[11px] text-emerald-600 font-semibold uppercase">Unit Tersedia</p>
                <p className="text-lg font-bold mt-0.5">{stats.unitsAvailable || 0}</p>
              </div>
            </div>
          </div>

          {/* Graphical Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Monthly Trend Chart */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">Trend Operasional (6 Bulan Terakhir)</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Grafik jumlah kegiatan dan content plan per bulan</p>
                </div>
                <TrendingUp className="w-5 h-5 text-teal-600" />
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dashboardData.monthlyStats || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} allowDecimals={false} />
                    <RechartsTooltip />
                    <Bar dataKey="kegiatan" name="Kegiatan" fill="#0D9488" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="konten" name="Content Plan" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Status Content Plan Pie Chart */}
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
              <div className="pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">Status Content Plan</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Distribusi konten aktif & riwayat</p>
              </div>
              {contentPlanPieData.length === 0 ? (
                <p className="text-xs text-slate-400 italic py-12 text-center">Belum ada data content plan.</p>
              ) : (
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={contentPlanPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} label>
                        {contentPlanPieData.map((_, idx) => (
                          <Cell key={idx} fill={pieColors[idx % pieColors.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
