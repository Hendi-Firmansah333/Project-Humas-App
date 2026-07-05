'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  StatCard,
  DataTable,
  Column,
  StatusBadge,
  SearchBox,
  FilterDropdown,
  CustomButton,
  PaginationBar,
  UserAvatar,
} from '@/components/common';
import ActivityChart from '@/components/common/ActivityChart';
import DashboardSkeleton from '@/components/common/DashboardSkeleton';
import {
  FileText,
  FileSpreadsheet,
  CalendarCheck2,
  Share2,
  Wrench,
  TrendingUp,
  Download,
  Eye,
  Filter,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { toast } from 'sonner';
import { dashboardService, reportService } from '@/services';
import { ReportItem } from '@/types';
import { formatDateID } from '@/utils/formatters';

const categoryDistribution = [
  { name: 'Instagram Reels & Carousel', value: 45, color: '#0D9488' },
  { name: 'Berita Rilis Website Polinela', value: 25, color: '#38BDF8' },
  { name: 'TikTok Video Pendek', value: 20, color: '#F59E0B' },
  { name: 'YouTube Video Dokumenter', value: 10, color: '#EF4444' },
];

interface MonthlyChartPoint {
  month: string;
  kegiatan: number;
  konten: number;
}

export default function ReportPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState('TAHUN_2025');
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    totalActivities: 0,
    totalContentPlans: 0,
    activeLoans: 0,
    totalUsers: 0,
  });
  const [monthlyStats, setMonthlyStats] = useState<MonthlyChartPoint[]>([]);
  const itemsPerPage = 5;

  useEffect(() => {
    const loadReportData = async () => {
      setLoading(true);
      try {
        const [reportData, summary] = await Promise.all([
          reportService.getAll(),
          dashboardService.summary(),
        ]);
        setReports(Array.isArray(reportData) ? reportData : []);
        setStats(summary.statistics ?? {
          totalActivities: 0,
          totalContentPlans: 0,
          activeLoans: 0,
          totalUsers: 0,
        });
        setMonthlyStats(summary.monthlyStats ?? []);
      } catch {
        toast.error('Gagal memuat data laporan dari server.');
        setReports([]);
      } finally {
        setLoading(false);
      }
    };
    loadReportData();
  }, []);

  const handleExportPDF = () => {
    toast.success('Laporan Eksekutif berhasil diexport dalam format Dokumen PDF!');
  };

  const handleExportExcel = () => {
    toast.success('Rekapitulasi data statistik berhasil diunduh dalam format Excel (.xlsx)!');
  };

  const filteredReports = reports.filter((item) => {
    const periodLabel = formatDateID(item.date);
    return (
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      periodLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.pic?.fullName ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const columns: Column<ReportItem>[] = [
    {
      key: 'no',
      header: 'No',
      render: (_, idx) => (
        <span className="font-semibold text-slate-600">
          {(currentPage - 1) * itemsPerPage + idx + 1}
        </span>
      ),
      className: 'w-12 text-center',
    },
    {
      key: 'title',
      header: 'Judul Laporan',
      render: (item) => (
        <span className="font-bold text-slate-800 text-xs sm:text-sm">{item.title}</span>
      ),
    },
    {
      key: 'period',
      header: 'Periode / Tanggal',
      render: (item) => (
        <span className="font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg text-xs">
          {formatDateID(item.date)}
        </span>
      ),
    },
    {
      key: 'category',
      header: 'Kategori',
      render: (item) => (
        <span className="font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg text-xs">
          {item.category}
        </span>
      ),
    },
    {
      key: 'pic',
      header: 'PIC Laporan',
      render: (item) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <UserAvatar src={item.pic?.avatar} name={item.pic?.fullName ?? '-'} size="sm" />
          <div>
            <p className="font-medium text-slate-700 text-xs">{item.pic?.fullName ?? '-'}</p>
            <p className="text-[10px] text-slate-400">{item.pic?.roleLabel ?? '-'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (item) => (
        <div className="flex items-center gap-1.5 justify-center">
          <button
            onClick={() => toast.info(`Mengunduh rincian laporan "${item.title}"...`)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
            title="Unduh Laporan"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => toast.info(`Membuka ringkasan eksekutif: ${item.title}`)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
            title="Lihat Detail Statistik"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
      className: 'w-24 text-center',
    },
  ];

  if (loading) {
    return (
      <AdminLayout title="Laporan & Analisis Statistik Kehumasan">
        <DashboardSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Laporan & Analisis Statistik Kehumasan">
      {/* Top Banner & Export Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Laporan Eksekutif & Kinerja Kehumasan Polinela</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluasi produktivitas peliputan agenda, publikasi sosial media, peminjaman inventaris, dan kinerja personel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <FilterDropdown
            options={[
              { value: 'TAHUN_2025', label: 'Tahun 2025 (Full)' },
              { value: 'SEMESTER_1', label: 'Semester 1 (Jan-Jun)' },
              { value: 'BULAN_INI', label: 'Bulan Ini (Juni 2025)' },
            ]}
            value={periodFilter}
            onChange={setPeriodFilter}
            placeholder="Periode"
          />
          <CustomButton variant="outline" size="sm" icon={FileText} onClick={handleExportPDF}>
            Export PDF
          </CustomButton>
          <CustomButton variant="primary" size="sm" icon={FileSpreadsheet} onClick={handleExportExcel}>
            Export Excel
          </CustomButton>
        </div>
      </div>

      {/* Statistics Row: 4 StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Kegiatan Diliput"
          value={`${stats.totalActivities} Agenda`}
          subtitle="Liputan resmi & kemahasiswaan"
          icon={CalendarCheck2}
          iconBgClass="bg-teal-50"
          iconColorClass="text-teal-600"
        />
        <StatCard
          title="Total Konten Dipublikasi"
          value={`${stats.totalContentPlans} Konten`}
          subtitle="Reels, Carousel, Berita & TikTok"
          icon={Share2}
          iconBgClass="bg-sky-50"
          iconColorClass="text-sky-600"
        />
        <StatCard
          title="Peminjaman Alat"
          value={`${stats.activeLoans} Sesi`}
          subtitle="Peminjaman aktif saat ini"
          icon={Wrench}
          iconBgClass="bg-green-50"
          iconColorClass="text-green-600"
        />
        <StatCard
          title="Personel Aktif"
          value={`${stats.totalUsers} Orang`}
          subtitle="Tim kehumasan terdaftar aktif"
          icon={TrendingUp}
          iconBgClass="bg-amber-50"
          iconColorClass="text-amber-600"
        />
      </div>

      {/* Charts Row: 2 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (Span 2): Monthly Bar Chart */}
        <div className="lg:col-span-2">
          <ActivityChart
            data={monthlyStats.length > 0 ? monthlyStats : undefined}
            title="Grafik Publikasi Konten & Peliputan Bulanan (6 Bulan Terakhir)"
          />
        </div>

        {/* Right Column (Span 1): Category Distribution Pie Chart */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between h-full min-h-[360px]">
          <div>
            <h3 className="text-base font-bold text-slate-800 mb-2">Distribusi Platform Publikasi</h3>
            <p className="text-xs text-slate-400 mb-4">Persentase jenis media tayang humas</p>
          </div>

          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {categoryDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  formatter={(val: any) => [`${val ?? 0}%`, 'Porsi']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Legend */}
          <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
            {categoryDistribution.map((item) => (
              <div key={item.name} className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-slate-600 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="font-bold text-slate-800">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-800">Rincian Rekapitulasi Laporan Bulanan</h3>
            <p className="text-xs text-slate-400">Data detail jumlah peliputan, tayangan, dan utilisasi per periode.</p>
          </div>

          <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Cari judul, kategori, tanggal, atau PIC..." className="w-full sm:w-72" />
        </div>

        <div className="overflow-hidden rounded-xl border border-slate-200">
          <DataTable columns={columns} data={paginatedReports} emptyMessage="Tidak ada rekapitulasi yang sesuai dengan filter." />
        </div>

        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages || 1}
          totalItems={filteredReports.length}
          onPageChange={setCurrentPage}
          itemName="periode"
        />
      </div>
    </AdminLayout>
  );
}
