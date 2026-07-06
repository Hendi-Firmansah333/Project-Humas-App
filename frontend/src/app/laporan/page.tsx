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
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
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

const PERIOD_OPTIONS = [
  { value: 'hari_ini', label: 'Hari Ini' },
  { value: 'minggu_ini', label: 'Minggu Ini' },
  { value: 'bulan_ini', label: 'Bulan Ini' },
  { value: 'bulan_lalu', label: 'Bulan Lalu' },
  { value: 'tahun_ini', label: 'Tahun Ini' },
  { value: 'semua', label: 'Semua Data' },
];

interface MonthlyChartPoint {
  month: string;
  kegiatan: number;
  konten: number;
}

function getDateRangeForPeriod(period: string): { startDate?: string; endDate?: string } {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  switch (period) {
    case 'hari_ini': {
      const s = fmt(now);
      return { startDate: s, endDate: s };
    }
    case 'minggu_ini': {
      const day = now.getDay();
      const diffToMon = (day + 6) % 7;
      const mon = new Date(now);
      mon.setDate(now.getDate() - diffToMon);
      return { startDate: fmt(mon), endDate: fmt(now) };
    }
    case 'bulan_ini': {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: fmt(start), endDate: fmt(now) };
    }
    case 'bulan_lalu': {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: fmt(start), endDate: fmt(end) };
    }
    case 'tahun_ini': {
      const start = new Date(now.getFullYear(), 0, 1);
      return { startDate: fmt(start), endDate: fmt(now) };
    }
    default:
      return {};
  }
}

export default function ReportPage() {
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [periodFilter, setPeriodFilter] = useState('bulan_ini');
  const [currentPage, setCurrentPage] = useState(1);
  const [stats, setStats] = useState({
    totalActivities: 0,
    totalContentPlans: 0,
    activeLoans: 0,
    totalUsers: 0,
  });
  const [monthlyStats, setMonthlyStats] = useState<MonthlyChartPoint[]>([]);
  const itemsPerPage = 5;

  const loadReportData = async (period: string) => {
    setLoading(true);
    try {
      const dateRange = getDateRangeForPeriod(period);
      const [reportData, summary] = await Promise.all([
        reportService.getAll(dateRange),
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

  useEffect(() => {
    loadReportData(periodFilter);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodFilter]);

  const handleExportPDF = () => {
    toast.info('Mempersiapkan ekspor laporan PDF...', { duration: 2000 });
    setTimeout(() => {
      window.print();
      toast.success('Laporan PDF siap dicetak / disimpan!');
    }, 1500);
  };

  const handleExportExcel = () => {
    // Generate CSV as lightweight Excel alternative
    const headers = ['No', 'Judul Laporan', 'Periode', 'Kategori', 'PIC', 'Status'];
    const rows = filteredReports.map((r, i) => [
      i + 1,
      r.title,
      formatDateID(r.date),
      r.category,
      r.pic?.fullName ?? '-',
      r.status,
    ]);
    const csvContent = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `laporan-humas-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data laporan berhasil diunduh sebagai file CSV/Excel!');
  };

  const filteredReports = reports.filter((item) => {
    const periodLabel = formatDateID(item.date);
    const matchSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      periodLabel.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.pic?.fullName ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = categoryFilter ? item.category === categoryFilter : true;
    return matchSearch && matchCat;
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
            onClick={() => {
              const csvRow = `"${item.title}","${formatDateID(item.date)}","${item.category}","${item.pic?.fullName ?? '-'}","${item.status}"`;
              navigator.clipboard?.writeText(csvRow).then(() =>
                toast.success(`Data laporan "${item.title}" disalin ke clipboard!`)
              ).catch(() =>
                toast.info(`Membuka ringkasan: ${item.title}`)
              );
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
            title="Salin Data Laporan"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => toast.info(`Rincian laporan: ${item.title} — ${formatDateID(item.date)}`)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
            title="Lihat Detail"
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
      {/* Top Banner & Filter/Export Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Laporan Eksekutif & Kinerja Kehumasan</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Evaluasi produktivitas peliputan, publikasi konten, peminjaman inventaris, dan kinerja personel.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-200 rounded-xl px-3 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-teal-600" />
            <FilterDropdown
              options={PERIOD_OPTIONS}
              value={periodFilter}
              onChange={(v) => { setPeriodFilter(v || 'semua'); setCurrentPage(1); }}
              placeholder="Pilih Periode"
            />
          </div>
          <CustomButton variant="outline" size="sm" icon={FileText} onClick={handleExportPDF}>
            Export PDF
          </CustomButton>
          <CustomButton variant="primary" size="sm" icon={FileSpreadsheet} onClick={handleExportExcel}>
            Export CSV/Excel
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
          title="Peminjaman Inventaris"
          value={`${stats.activeLoans} Sesi`}
          subtitle="Peminjaman alat tercatat"
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <div className="lg:col-span-2">
          <ActivityChart
            data={monthlyStats.length > 0 ? monthlyStats : undefined}
            title="Grafik Publikasi Konten & Peliputan Bulanan (6 Bulan Terakhir)"
          />
        </div>

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
            <h3 className="text-base font-bold text-slate-800">Rincian Rekapitulasi Laporan</h3>
            <p className="text-xs text-slate-400">
              {filteredReports.length} laporan ditemukan untuk periode: <strong>{PERIOD_OPTIONS.find((o) => o.value === periodFilter)?.label ?? 'Semua'}</strong>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <SearchBox value={searchQuery} onChange={(v) => { setSearchQuery(v); setCurrentPage(1); }} placeholder="Cari judul, kategori, PIC..." className="w-full sm:w-64" />
            <FilterDropdown
              options={[
                { value: 'Kegiatan', label: 'Kegiatan' },
                { value: 'Konten', label: 'Konten' },
                { value: 'Personel', label: 'Personel' },
                { value: 'Inventaris', label: 'Inventaris' },
              ]}
              value={categoryFilter}
              onChange={(v) => { setCategoryFilter(v); setCurrentPage(1); }}
              placeholder="Semua Kategori"
            />
          </div>
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
