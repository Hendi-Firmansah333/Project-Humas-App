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

interface MonthlyReportItem {
  id: number;
  period: string;
  kegiatanCount: number;
  kontenCount: number;
  loanCount: number;
  picName: string;
  picRole: string;
  picAvatar?: string;
  status: string;
}

const initialReports: MonthlyReportItem[] = [
  {
    id: 1,
    period: 'Juni 2025',
    kegiatanCount: 24,
    kontenCount: 68,
    loanCount: 16,
    picName: 'Komang Ari',
    picRole: 'Koordinator Humas',
    picAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'SELESAI',
  },
  {
    id: 2,
    period: 'Mei 2025',
    kegiatanCount: 34,
    kontenCount: 82,
    loanCount: 22,
    picName: 'Budi Santoso',
    picRole: 'Videografer Utama',
    picAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'SELESAI',
  },
  {
    id: 3,
    period: 'April 2025',
    kegiatanCount: 28,
    kontenCount: 64,
    loanCount: 18,
    picName: 'Rina Wati',
    picRole: 'Jurnalis Lapangan',
    picAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    status: 'SELESAI',
  },
  {
    id: 4,
    period: 'Maret 2025',
    kegiatanCount: 15,
    kontenCount: 45,
    loanCount: 10,
    picName: 'Andi Saputra',
    picRole: 'Fotografer Resmi',
    picAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'SELESAI',
  },
  {
    id: 5,
    period: 'Februari 2025',
    kegiatanCount: 19,
    kontenCount: 52,
    loanCount: 12,
    picName: 'Komang Ari',
    picRole: 'Koordinator Humas',
    picAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'SELESAI',
  },
  {
    id: 6,
    period: 'Januari 2025',
    kegiatanCount: 12,
    kontenCount: 38,
    loanCount: 8,
    picName: 'Budi Santoso',
    picRole: 'Videografer Utama',
    picAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'SELESAI',
  },
];

const categoryDistribution = [
  { name: 'Instagram Reels & Carousel', value: 45, color: '#0D9488' },
  { name: 'Berita Rilis Website Polinela', value: 25, color: '#38BDF8' },
  { name: 'TikTok Video Pendek', value: 20, color: '#F59E0B' },
  { name: 'YouTube Video Dokumenter', value: 10, color: '#EF4444' },
];

export default function ReportPage() {
  const [reports] = useState<MonthlyReportItem[]>(initialReports);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState('TAHUN_2025');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const handleExportPDF = () => {
    toast.success('Laporan Eksekutif berhasil diexport dalam format Dokumen PDF!');
  };

  const handleExportExcel = () => {
    toast.success('Rekapitulasi data statistik berhasil diunduh dalam format Excel (.xlsx)!');
  };

  const filteredReports = reports.filter((item) =>
    item.period.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.picName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const columns: Column<MonthlyReportItem>[] = [
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
      key: 'period',
      header: 'Periode / Bulan',
      render: (item) => (
        <span className="font-bold text-slate-800 text-xs sm:text-sm">{item.period}</span>
      ),
    },
    {
      key: 'kegiatan',
      header: 'Kegiatan Diliput',
      render: (item) => (
        <span className="font-semibold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-lg text-xs">
          {item.kegiatanCount} Agenda
        </span>
      ),
    },
    {
      key: 'konten',
      header: 'Konten Dipublikasi',
      render: (item) => (
        <span className="font-semibold text-sky-700 bg-sky-50 px-2.5 py-1 rounded-lg text-xs">
          {item.kontenCount} Media
        </span>
      ),
    },
    {
      key: 'loan',
      header: 'Alat Dipinjam',
      render: (item) => (
        <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg text-xs">
          {item.loanCount} Sesi
        </span>
      ),
    },
    {
      key: 'pic',
      header: 'PIC Teraktif',
      render: (item) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <UserAvatar src={item.picAvatar} name={item.picName} size="sm" />
          <div>
            <p className="font-medium text-slate-700 text-xs">{item.picName}</p>
            <p className="text-[10px] text-slate-400">{item.picRole}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status Target',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (item) => (
        <div className="flex items-center gap-1.5 justify-center">
          <button
            onClick={() => toast.info(`Mengunduh rincian laporan periode ${item.period}...`)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
            title="Unduh Laporan Periode Ini"
          >
            <Download className="w-4 h-4" />
          </button>
          <button
            onClick={() => toast.info(`Membuka ringkasan eksekutif ${item.period}`)}
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
          value="142 Agenda"
          subtitle="Liputan resmi & kemahasiswaan"
          icon={CalendarCheck2}
          iconBgClass="bg-teal-50"
          iconColorClass="text-teal-600"
        />
        <StatCard
          title="Total Konten Dipublikasi"
          value="384 Konten"
          subtitle="Reels, Carousel, Berita & TikTok"
          icon={Share2}
          iconBgClass="bg-sky-50"
          iconColorClass="text-sky-600"
        />
        <StatCard
          title="Peminjaman Alat"
          value="86 Sesi"
          subtitle="Pemanfaatan kamera & drone"
          icon={Wrench}
          iconBgClass="bg-green-50"
          iconColorClass="text-green-600"
        />
        <StatCard
          title="Tingkat Kehadiran Tim"
          value="98.5%"
          subtitle="Produktivitas & check-in GPS"
          icon={TrendingUp}
          iconBgClass="bg-amber-50"
          iconColorClass="text-amber-600"
        />
      </div>

      {/* Charts Row: 2 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (Span 2): Monthly Bar Chart */}
        <div className="lg:col-span-2">
          <ActivityChart title="Grafik Publikasi Konten & Peliputan Bulanan (Semester 1 2025)" />
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

          <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Cari periode bulan atau PIC..." className="w-full sm:w-72" />
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
