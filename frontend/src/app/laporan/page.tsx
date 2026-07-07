'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  StatCard,
  DataTable,
  Column,
  StatusBadge,
  SearchBox,
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
  Calendar,
  Clock,
  ChevronDown,
  Users,
  Search,
  Award,
  Medal,
  Star,
  Target,
  CheckCircle2,
  Clock3,
  AlertCircle,
  BarChart2,
} from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from 'recharts';
import { toast } from 'sonner';
import { dashboardService, reportService } from '@/services';
import { formatDateID } from '@/utils/formatters';

interface ActivityItem {
  id: number;
  title: string;
  category: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  pic?: { fullName: string };
}

interface ContentPlanItem {
  id: number;
  title: string;
  contentType: string;
  platform: string;
  deadline: string;
  status: string;
  pic?: { fullName: string };
}

interface LoanItem {
  id: number;
  borrowerName: string;
  equipmentName: string;
  borrowDate: string;
  returnDate?: string;
  status: string;
}

interface UserItem {
  id: number;
  fullName: string;
  username: string;
  email: string;
  roleLabel: string;
  isActive: boolean;
  joinedAt: string;
}

interface UserEvaluationItem {
  id: number;
  fullName: string;
  username: string;
  avatar?: string;
  roleLabel: string;
  totalKegiatan: number;
  totalCheckin: number;
  totalTepatWaktu: number;
  totalTerlambat: number;
  persenKehadiran: number;
  totalDokumentasi: number;
  totalContentPlan: number;
  totalPeminjaman: number;
  nilaiKinerja: number;
}

export default function ReportPage() {
  const [activeTab, setActiveTab] = useState<'summary' | 'kegiatan' | 'content-plans' | 'loans' | 'users' | 'evaluasi'>('summary');
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Date Filters
  const [startDate, setStartDate] = useState(
    new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Stats Dashboard
  const [stats, setStats] = useState({
    totalActivities: 0,
    totalContentPlans: 0,
    activeLoans: 0,
    totalUsers: 0,
  });
  const [monthlyStats, setMonthlyStats] = useState<any[]>([]);

  // Detailed Datasets
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [contentPlans, setContentPlans] = useState<ContentPlanItem[]>([]);
  const [loans, setLoans] = useState<LoanItem[]>([]);
  const [usersData, setUsersData] = useState<UserItem[]>([]);
  const [evaluationData, setEvaluationData] = useState<UserEvaluationItem[]>([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Export state
  const [isExportOpen, setIsExportOpen] = useState(false);

  const fetchTabDataset = async () => {
    setLoading(true);
    try {
      const dateRange = { startDate, endDate };

      // Load generic dashboard statistics for summary stats cards
      const summary = await dashboardService.summary();
      setStats(summary.statistics ?? {
        totalActivities: 0,
        totalContentPlans: 0,
        activeLoans: 0,
        totalUsers: 0,
      });
      setMonthlyStats(summary.monthlyStats ?? []);

      // Fetch dynamic records based on filters
      if (activeTab === 'kegiatan' || activeTab === 'summary') {
        const actResult = await reportService.getActivities(dateRange);
        setActivities(Array.isArray(actResult) ? actResult : []);
      }
      if (activeTab === 'content-plans' || activeTab === 'summary') {
        const contentResult = await reportService.getContentPlans(dateRange);
        setContentPlans(Array.isArray(contentResult) ? contentResult : []);
      }
      if (activeTab === 'loans' || activeTab === 'summary') {
        const loanResult = await reportService.getLoans(dateRange);
        setLoans(Array.isArray(loanResult) ? loanResult : []);
      }
      if (activeTab === 'users' || activeTab === 'summary') {
        const userResult = await reportService.getUsers(dateRange);
        setUsersData(Array.isArray(userResult) ? userResult : []);
      }
      if (activeTab === 'evaluasi' || activeTab === 'summary') {
        const evalResult = await reportService.getUserEvaluation(dateRange);
        setEvaluationData(Array.isArray(evalResult) ? evalResult : []);
      }
    } catch {
      toast.error('Gagal memuat data rekapitulasi laporan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabDataset();
    setCurrentPage(1);
  }, [activeTab, startDate, endDate]);

  const applyShortcut = (shortcut: 'hari' | 'minggu' | 'bulan' | 'tahun') => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    let start = '';
    let end = fmt(now);

    if (shortcut === 'hari') {
      start = fmt(now);
    } else if (shortcut === 'minggu') {
      const day = now.getDay();
      const diffToMon = (day + 6) % 7;
      const mon = new Date(now);
      mon.setDate(now.getDate() - diffToMon);
      start = fmt(mon);
    } else if (shortcut === 'bulan') {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      start = fmt(startOfMonth);
    } else if (shortcut === 'tahun') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      start = fmt(startOfYear);
    }

    setStartDate(start);
    setEndDate(end);
    toast.success(`Filter periode disetel ke: ${shortcut === 'hari' ? 'Hari Ini' : shortcut === 'minggu' ? 'Minggu Ini' : shortcut === 'bulan' ? 'Bulan Ini' : 'Tahun Ini'}`);
  };

  const handleExportPDF = () => {
    toast.info('Mempersiapkan layout cetak PDF...', { duration: 2500 });
    setTimeout(() => {
      window.print();
    }, 1500);
  };

  const handleExportExcel = () => {
    handleExportCSV(); // We use CSV formatted file as lightweight excel file
  };

  const handleExportCSV = () => {
    let headers: string[] = [];
    let rows: any[][] = [];
    let filename = `laporan-humas-${activeTab}-${startDate}-to-${endDate}.csv`;

    if (activeTab === 'kegiatan') {
      headers = ['No', 'Judul Kegiatan', 'Kategori', 'Tanggal', 'Waktu', 'PIC', 'Status'];
      rows = filteredActivities.map((item, idx) => [
        idx + 1,
        `"${item.title.replace(/"/g, '""')}"`,
        `"${item.category}"`,
        formatDateID(item.date),
        `"${item.startTime} - ${item.endTime} WIB"`,
        `"${item.pic?.fullName ?? '-'}"`,
        item.status,
      ]);
    } else if (activeTab === 'content-plans') {
      headers = ['No', 'Judul Rencana Konten', 'Jenis Konten', 'Platform', 'PIC', 'Status'];
      rows = filteredContentPlans.map((item, idx) => [
        idx + 1,
        `"${item.title.replace(/"/g, '""')}"`,
        `"${item.contentType}"`,
        item.platform,
        `"${item.pic?.fullName ?? '-'}"`,
        item.status,
      ]);
    } else if (activeTab === 'loans') {
      headers = ['No', 'Peminjam', 'Inventaris', 'Tanggal Pinjam', 'Tanggal Pengembalian', 'Status'];
      rows = filteredLoans.map((item, idx) => [
        idx + 1,
        `"${item.borrowerName}"`,
        `"${item.equipmentName}"`,
        formatDateID(item.borrowDate),
        item.returnDate ? formatDateID(item.returnDate) : '-',
        item.status,
      ]);
    } else if (activeTab === 'users') {
      headers = ['No', 'Nama Lengkap', 'Username', 'Email', 'Peran', 'Status Akun'];
      rows = filteredUsers.map((item, idx) => [
        idx + 1,
        `"${item.fullName}"`,
        `"${item.username}"`,
        `"${item.email}"`,
        `"${item.roleLabel}"`,
        item.isActive ? 'Aktif' : 'Nonaktif',
      ]);
    } else {
      toast.warning('Silakan pilih salah satu tab rekap data untuk mengekspor detail tabel!');
      return;
    }

    const csvContent = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Laporan berhasil diekspor!');
  };

  // Local queries filtering
  const filteredActivities = activities.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.pic?.fullName ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredContentPlans = contentPlans.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.contentType.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.platform.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.pic?.fullName ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLoans = loans.filter((item) =>
    item.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.equipmentName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredUsers = usersData.filter((item) =>
    item.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.roleLabel.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Compute stats graphs
  const typeCounts = contentPlans.reduce((acc: Record<string, number>, item) => {
    acc[item.contentType] = (acc[item.contentType] || 0) + 1;
    return acc;
  }, {});

  const totalContentCount = contentPlans.length || 1;
  const pieColors = ['#0D9488', '#38BDF8', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#10B981', '#6B7280'];
  const typePieData = Object.keys(typeCounts).map((key, idx) => ({
    name: key,
    value: Math.round((typeCounts[key] / totalContentCount) * 100),
    color: pieColors[idx % pieColors.length],
  })).slice(0, 5);

  const defaultPieData = [
    { name: 'Instagram Reels', value: 45, color: '#0D9488' },
    { name: 'Rilis Berita Website', value: 25, color: '#38BDF8' },
    { name: 'TikTok Video', value: 20, color: '#F59E0B' },
    { name: 'YouTube Video', value: 10, color: '#EF4444' },
  ];

  const categoryDistribution = typePieData.length > 0 ? typePieData : defaultPieData;

  // Tabbed rendering columns
  const kegiatanColumns: Column<ActivityItem>[] = [
    {
      key: 'no',
      header: 'No',
      render: (_, idx) => <span className="font-semibold text-slate-600">{(currentPage - 1) * itemsPerPage + idx + 1}</span>,
      className: 'w-12 text-center',
    },
    {
      key: 'title',
      header: 'Judul Kegiatan',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-800 text-xs sm:text-sm">{item.title}</p>
          <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-1.5 py-0.5 rounded mt-1 inline-block">{item.category}</span>
        </div>
      ),
    },
    {
      key: 'date',
      header: 'Tanggal & Waktu',
      render: (item) => (
        <div className="text-xs text-slate-700 font-medium">
          <p>{formatDateID(item.date)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">⏰ {item.startTime} - {item.endTime} WIB</p>
        </div>
      ),
    },
    {
      key: 'pic',
      header: 'PIC Peliputan',
      render: (item) => <span className="text-xs font-semibold text-slate-800">{item.pic?.fullName ?? '-'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
  ];

  const contentColumns: Column<ContentPlanItem>[] = [
    {
      key: 'no',
      header: 'No',
      render: (_, idx) => <span className="font-semibold text-slate-600">{(currentPage - 1) * itemsPerPage + idx + 1}</span>,
      className: 'w-12 text-center',
    },
    {
      key: 'title',
      header: 'Judul Konten & Jenis',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-800 text-xs sm:text-sm">{item.title}</p>
          <span className="text-[10px] bg-teal-50 text-teal-700 border border-teal-200 font-bold px-1.5 py-0.5 rounded mt-1 inline-block">{item.contentType}</span>
        </div>
      ),
    },
    {
      key: 'platform',
      header: 'Platform',
      render: (item) => (
        <span className="inline-flex items-center gap-1.5 bg-slate-50 border border-slate-200 font-bold px-2 py-0.5 rounded-lg text-[10px] text-slate-700 uppercase">
          {item.platform}
        </span>
      ),
    },
    {
      key: 'deadline',
      header: 'Deadline Publish',
      render: (item) => <span className="text-xs font-semibold text-slate-700">{formatDateID(item.deadline)}</span>,
    },
    {
      key: 'pic',
      header: 'PIC Kreator',
      render: (item) => <span className="text-xs font-semibold text-slate-800">{item.pic?.fullName ?? '-'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
  ];

  const loanColumns: Column<LoanItem>[] = [
    {
      key: 'no',
      header: 'No',
      render: (_, idx) => <span className="font-semibold text-slate-600">{(currentPage - 1) * itemsPerPage + idx + 1}</span>,
      className: 'w-12 text-center',
    },
    {
      key: 'borrowerName',
      header: 'Nama Peminjam',
      render: (item) => <span className="font-bold text-slate-850 text-xs">{item.borrowerName}</span>,
    },
    {
      key: 'equipmentName',
      header: 'Nama Inventaris',
      render: (item) => <span className="text-xs font-semibold text-slate-700">{item.equipmentName}</span>,
    },
    {
      key: 'borrowDate',
      header: 'Tanggal Peminjaman',
      render: (item) => (
        <div className="text-xs font-medium text-slate-700">
          <p>Pinjam: {formatDateID(item.borrowDate)}</p>
          <p className="text-[10px] text-slate-400 mt-0.5">Kembali: {item.returnDate ? formatDateID(item.returnDate) : 'Belum Kembali'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status Alat',
      render: (item) => <StatusBadge status={item.status} />,
    },
  ];

  const userColumns: Column<UserItem>[] = [
    {
      key: 'no',
      header: 'No',
      render: (_, idx) => <span className="font-semibold text-slate-600">{(currentPage - 1) * itemsPerPage + idx + 1}</span>,
      className: 'w-12 text-center',
    },
    {
      key: 'fullName',
      header: 'Nama Lengkap',
      render: (item) => <span className="font-bold text-slate-850 text-xs">{item.fullName}</span>,
    },
    {
      key: 'username',
      header: 'Username',
      render: (item) => <span className="text-xs font-mono text-slate-500">{item.username}</span>,
    },
    {
      key: 'email',
      header: 'Alamat Email',
      render: (item) => <span className="text-xs text-slate-600">{item.email}</span>,
    },
    {
      key: 'roleLabel',
      header: 'Peran Akun',
      render: (item) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
          item.roleLabel.includes('Admin') ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-teal-50 text-teal-700 border border-teal-200'
        }`}>
          {item.roleLabel}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (item) => (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
          item.isActive ? 'bg-emerald-50 text-emerald-700 border border-emerald-250' : 'bg-red-50 text-red-700 border border-red-250'
        }`}>
          {item.isActive ? 'AKTIF' : 'NONAKTIF'}
        </span>
      ),
    },
  ];

  // Configure print variables
  let printHeaders: string[] = [];
  let printRows: any[][] = [];

  if (activeTab === 'kegiatan') {
    printHeaders = ['No', 'Judul Kegiatan', 'Kategori', 'Tanggal Pelaksanaan', 'PIC Peliputan', 'Status'];
    printRows = filteredActivities.map((item, idx) => [
      idx + 1,
      item.title,
      item.category,
      `${formatDateID(item.date)} (${item.startTime} - ${item.endTime} WIB)`,
      item.pic?.fullName ?? '-',
      item.status.replace('_', ' '),
    ]);
  } else if (activeTab === 'content-plans') {
    printHeaders = ['No', 'Judul Rencana Konten', 'Jenis Konten', 'Platform', 'PIC Kreator', 'Status'];
    printRows = filteredContentPlans.map((item, idx) => [
      idx + 1,
      item.title,
      item.contentType,
      item.platform,
      item.pic?.fullName ?? '-',
      item.status,
    ]);
  } else if (activeTab === 'loans') {
    printHeaders = ['No', 'Nama Peminjam', 'Nama Inventaris', 'Tanggal Pinjam', 'Tanggal Kembali', 'Status'];
    printRows = filteredLoans.map((item, idx) => [
      idx + 1,
      item.borrowerName,
      item.equipmentName,
      formatDateID(item.borrowDate),
      item.returnDate ? formatDateID(item.returnDate) : 'Sedang Dipinjam',
      item.status.replace('_', ' '),
    ]);
  } else if (activeTab === 'users') {
    printHeaders = ['No', 'Nama Lengkap', 'Username', 'Email', 'Peran', 'Status'];
    printRows = filteredUsers.map((item, idx) => [
      idx + 1,
      item.fullName,
      item.username,
      item.email,
      item.roleLabel,
      item.isActive ? 'Aktif' : 'Nonaktif',
    ]);
  } else {
    // For summary print all summary tables count
    printHeaders = ['No', 'Kategori Rekap Laporan', 'Jumlah Record', 'Keterangan Kinerja'];
    printRows = [
      [1, 'Kegiatan Peliputan Humas', `${stats.totalActivities} Agenda`, 'Agenda peliputan kehumasan resmi'],
      [2, 'Publikasi Content Plan', `${stats.totalContentPlans} Konten`, 'Produksi konten media sosial & website'],
      [3, 'Peminjaman Inventaris Alat', `${stats.activeLoans} Sesi Peminjaman`, 'Pemakaian perangkat operasional'],
      [4, 'Personel Anggota Aktif', `${stats.totalUsers} Personel`, 'Total kru kehumasan terdaftar'],
    ];
  }

  return (
    <AdminLayout title="Laporan & Analisis Statistik Kehumasan">
      {/* Printable Area - Hidden on Screen */}
      <div className="hidden print:block font-serif text-black p-8 bg-white" style={{ minWidth: '800px' }}>
        {/* Kop Surat */}
        <div className="flex items-center gap-6 border-b-4 border-black pb-3 mb-6">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/e/e0/Logo_Politeknik_Negeri_Lampung.png"
            alt="Logo Polinela"
            className="w-20 h-20 object-contain shrink-0"
          />
          <div className="text-center flex-1">
            <h2 className="text-xs font-bold tracking-wide uppercase">KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI</h2>
            <h1 className="text-base font-extrabold tracking-wide uppercase mt-0.5">POLITEKNIK NEGERI LAMPUNG</h1>
            <h3 className="text-sm font-bold tracking-wide uppercase mt-0.5">UPT HUMAS DAN KERJASAMA</h3>
            <p className="text-[10px] text-slate-650 mt-1">Jl. Soekarno Hatta No. 10 Rajabasa, Bandar Lampung | Telp: (0721) 703995</p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center space-y-1 mb-8">
          <h2 className="text-md font-bold underline uppercase">
            LAPORAN REKAPITULASI {activeTab === 'summary' ? 'GLOBAL' : activeTab.toUpperCase()} HUMAS
          </h2>
          <p className="text-xs">Periode Laporan: <strong>{formatDateID(startDate)}</strong> s.d. <strong>{formatDateID(endDate)}</strong></p>
          <p className="text-[10px] text-slate-500">Dicetak pada: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 border border-black p-4 mb-6 text-center text-xs">
          <div>
            <p className="font-semibold">Total Kegiatan</p>
            <p className="text-base font-bold mt-1">{stats.totalActivities}</p>
          </div>
          <div>
            <p className="font-semibold">Total Konten</p>
            <p className="text-base font-bold mt-1">{stats.totalContentPlans}</p>
          </div>
          <div>
            <p className="font-semibold">Peminjaman Alat</p>
            <p className="text-base font-bold mt-1">{stats.activeLoans}</p>
          </div>
          <div>
            <p className="font-semibold">Personel Aktif</p>
            <p className="text-base font-bold mt-1">{stats.totalUsers}</p>
          </div>
        </div>

        {/* Data Table */}
        <table className="w-full text-xs border-collapse border border-black mb-12">
          <thead>
            <tr className="bg-slate-100">
              {printHeaders.map((hdr) => (
                <th key={hdr} className="border border-black p-2.5 text-left font-bold">{hdr}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {printRows.length === 0 ? (
              <tr>
                <td colSpan={printHeaders.length} className="border border-black p-4 text-center italic">Tidak ada data rekapitulasi.</td>
              </tr>
            ) : (
              printRows.map((row, idx) => (
                <tr key={idx}>
                  {row.map((cell: any, cellIdx: number) => (
                    <td key={cellIdx} className="border border-black p-2">{cell}</td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Signature Block */}
        <div className="flex justify-end text-xs">
          <div className="text-center space-y-16">
            <div>
              <p>Bandar Lampung, {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}</p>
              <p className="font-bold">Kepala UPT Humas Polinela,</p>
            </div>
            <div>
              <p className="font-bold underline">Hendi Firmansah, M.Kom.</p>
              <p>NIP. 19890412 201803 1 002</p>
            </div>
          </div>
        </div>
      </div>

      {/* Screen Layout - Hidden on Print */}
      <div className="print:hidden space-y-6">
        {/* Top Banner Control */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Laporan Rekapitulasi & Analisis Humas</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Analisis data produktivitas peliputan, publikasi konten, peminjaman alat, dan status anggota secara real-time.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* EXPORT Dropdown */}
            <div className="relative">
              <CustomButton
                variant="primary"
                size="sm"
                icon={Download}
                onClick={() => setIsExportOpen(!isExportOpen)}
                className="flex items-center gap-1.5"
              >
                Export Data <ChevronDown className="w-3.5 h-3.5" />
              </CustomButton>
              {isExportOpen && (
                <div className="absolute right-0 mt-1.5 w-44 bg-white border border-slate-200 rounded-xl shadow-lg z-50 py-1 overflow-hidden">
                  <button
                    onClick={() => {
                      setIsExportOpen(false);
                      handleExportPDF();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4 text-red-500 shrink-0" />
                    Cetak Laporan PDF
                  </button>
                  <button
                    onClick={() => {
                      setIsExportOpen(false);
                      handleExportExcel();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                    Export Excel (.xlsx)
                  </button>
                  <button
                    onClick={() => {
                      setIsExportOpen(false);
                      handleExportCSV();
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-slate-700 hover:bg-slate-50 font-semibold flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4 text-blue-600 shrink-0" />
                    Export CSV
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filters and Shortcut Buttons */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="flex flex-col">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal Mulai</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition-all font-semibold"
              />
            </div>
            <div className="flex flex-col">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Tanggal Selesai</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 transition-all font-semibold"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => applyShortcut('hari')}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-teal-500 text-xs font-semibold text-slate-700 hover:text-teal-650 bg-slate-50 hover:bg-teal-50/20 transition-all cursor-pointer"
            >
              Hari Ini
            </button>
            <button
              onClick={() => applyShortcut('minggu')}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-teal-500 text-xs font-semibold text-slate-700 hover:text-teal-650 bg-slate-50 hover:bg-teal-50/20 transition-all cursor-pointer"
            >
              Minggu Ini
            </button>
            <button
              onClick={() => applyShortcut('bulan')}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-teal-500 text-xs font-semibold text-slate-700 hover:text-teal-650 bg-slate-50 hover:bg-teal-50/20 transition-all cursor-pointer"
            >
              Bulan Ini
            </button>
            <button
              onClick={() => applyShortcut('tahun')}
              className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:border-teal-500 text-xs font-semibold text-slate-700 hover:text-teal-650 bg-slate-50 hover:bg-teal-50/20 transition-all cursor-pointer"
            >
              Tahun Ini
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-6 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'summary'
                ? 'border-teal-600 text-teal-600 bg-teal-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📊 Ringkasan Eksekutif
          </button>
          <button
            onClick={() => setActiveTab('kegiatan')}
            className={`px-6 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'kegiatan'
                ? 'border-teal-600 text-teal-600 bg-teal-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📅 Rekap Kegiatan
          </button>
          <button
            onClick={() => setActiveTab('content-plans')}
            className={`px-6 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'content-plans'
                ? 'border-teal-600 text-teal-600 bg-teal-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📝 Rekap Content Plan
          </button>
          <button
            onClick={() => setActiveTab('loans')}
            className={`px-6 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'loans'
                ? 'border-teal-600 text-teal-600 bg-teal-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            📦 Rekap Peminjaman
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'border-teal-600 text-teal-600 bg-teal-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            👥 Rekap Pengguna
          </button>
          <button
            onClick={() => setActiveTab('evaluasi')}
            className={`px-6 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'evaluasi'
                ? 'border-amber-500 text-amber-600 bg-amber-50/30'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            🏆 Evaluasi Anggota
          </button>
        </div>

        {/* Render Tab Contents */}
        {loading ? (
          <DashboardSkeleton />
        ) : (
          <div className="space-y-6">
            {activeTab === 'summary' && (
              <>
                {/* Stats Dashboard cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                  <StatCard
                    title="Total Kegiatan Diliput"
                    value={`${stats.totalActivities} Agenda`}
                    subtitle="Liputan humas Polinela"
                    icon={CalendarCheck2}
                    iconBgClass="bg-teal-50"
                    iconColorClass="text-teal-600"
                  />
                  <StatCard
                    title="Rencana Konten Humas"
                    value={`${stats.totalContentPlans} Konten`}
                    subtitle="Instagram, TikTok, YouTube"
                    icon={Share2}
                    iconBgClass="bg-sky-50"
                    iconColorClass="text-sky-600"
                  />
                  <StatCard
                    title="Inventaris Dipinjam"
                    value={`${stats.activeLoans} Sesi`}
                    subtitle="Peralatan aktif dipinjam"
                    icon={Wrench}
                    iconBgClass="bg-green-50"
                    iconColorClass="text-green-600"
                  />
                  <StatCard
                    title="Kru Humas Terdaftar"
                    value={`${stats.totalUsers} Personel`}
                    subtitle="Akun aktif terdaftar"
                    icon={Users}
                    iconBgClass="bg-amber-50"
                    iconColorClass="text-amber-600"
                  />
                </div>

                {/* Graphs */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <ActivityChart
                      data={monthlyStats.length > 0 ? monthlyStats : undefined}
                      title="Grafik Produktivitas Humas Bulanan"
                    />
                  </div>

                  <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between h-full min-h-[360px]">
                    <div>
                      <h3 className="text-base font-bold text-slate-800 mb-2">Proporsi Jenis Konten</h3>
                      <p className="text-xs text-slate-400 mb-4">Persentase jenis format media terbit</p>
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
              </>
            )}

            {/* Evaluasi Anggota Tab */}
            {activeTab === 'evaluasi' && (
              <div className="space-y-6">
                {/* Top 3 Podium */}
                {evaluationData.length >= 3 && (
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl border border-amber-200 p-6">
                    <h3 className="text-base font-bold text-slate-800 mb-1 flex items-center gap-2">
                      <Award className="w-5 h-5 text-amber-500" /> Podium Kinerja Terbaik
                    </h3>
                    <p className="text-xs text-slate-400 mb-6">Berdasarkan formula: 60% Kehadiran + 25% Dokumentasi + 15% Content Plan</p>
                    <div className="flex flex-col sm:flex-row items-end justify-center gap-4">
                      {/* 2nd Place */}
                      <div className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full bg-slate-200 border-4 border-slate-300 flex items-center justify-center text-2xl mb-2">
                          {evaluationData[1]?.avatar ? (
                            <img src={evaluationData[1].avatar} className="w-full h-full rounded-full object-cover" />
                          ) : '👤'}
                        </div>
                        <div className="bg-slate-100 border border-slate-300 rounded-2xl px-4 pt-3 pb-2 text-center w-36 h-28 flex flex-col items-center justify-between">
                          <p className="text-xs font-bold text-slate-700 truncate w-full text-center">{evaluationData[1]?.fullName}</p>
                          <p className="text-2xl font-black text-slate-600">{evaluationData[1]?.nilaiKinerja}<span className="text-xs">%</span></p>
                          <span className="text-[10px] font-bold text-slate-500">🥈 Peringkat 2</span>
                        </div>
                      </div>
                      {/* 1st Place */}
                      <div className="flex flex-col items-center -mt-4">
                        <div className="text-3xl mb-1">👑</div>
                        <div className="w-18 h-18 w-16 h-16 rounded-full bg-amber-100 border-4 border-amber-400 flex items-center justify-center text-3xl mb-2">
                          {evaluationData[0]?.avatar ? (
                            <img src={evaluationData[0].avatar} className="w-full h-full rounded-full object-cover" />
                          ) : '👤'}
                        </div>
                        <div className="bg-gradient-to-b from-amber-400 to-amber-500 border border-amber-600 rounded-2xl px-4 pt-3 pb-2 text-center w-40 h-32 flex flex-col items-center justify-between shadow-lg">
                          <p className="text-xs font-bold text-white truncate w-full text-center">{evaluationData[0]?.fullName}</p>
                          <p className="text-3xl font-black text-white">{evaluationData[0]?.nilaiKinerja}<span className="text-sm">%</span></p>
                          <span className="text-[10px] font-bold text-amber-100">🥇 Peringkat 1</span>
                        </div>
                      </div>
                      {/* 3rd Place */}
                      <div className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full bg-orange-100 border-4 border-orange-300 flex items-center justify-center text-2xl mb-2">
                          {evaluationData[2]?.avatar ? (
                            <img src={evaluationData[2].avatar} className="w-full h-full rounded-full object-cover" />
                          ) : '👤'}
                        </div>
                        <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 pt-3 pb-2 text-center w-36 h-24 flex flex-col items-center justify-between">
                          <p className="text-xs font-bold text-orange-700 truncate w-full text-center">{evaluationData[2]?.fullName}</p>
                          <p className="text-2xl font-black text-orange-600">{evaluationData[2]?.nilaiKinerja}<span className="text-xs">%</span></p>
                          <span className="text-[10px] font-bold text-orange-400">🥉 Peringkat 3</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bar Chart */}
                {evaluationData.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-teal-600" /> Grafik Nilai Kinerja Seluruh Anggota
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">Perbandingan nilai kinerja anggota tim berdasarkan formula evaluasi</p>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={evaluationData.slice(0, 10)} margin={{ top: 10, right: 20, left: -10, bottom: 30 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis
                            dataKey="fullName"
                            tick={{ fontSize: 10, fill: '#64748b' }}
                            angle={-30}
                            textAnchor="end"
                            interval={0}
                          />
                          <YAxis tick={{ fontSize: 10, fill: '#64748b' }} domain={[0, 100]} />
                          <RechartsTooltip
                            formatter={(val: any) => [`${val}%`, 'Nilai Kinerja']}
                            contentStyle={{
                              backgroundColor: '#fff',
                              borderRadius: '12px',
                              border: '1px solid #E2E8F0',
                              fontSize: '12px',
                            }}
                          />
                          <Bar dataKey="nilaiKinerja" fill="#0D9488" radius={[6, 6, 0, 0]}>
                            {evaluationData.slice(0, 10).map((_, idx) => (
                              <Cell
                                key={idx}
                                fill={
                                  idx === 0 ? '#F59E0B' :
                                  idx === 1 ? '#94A3B8' :
                                  idx === 2 ? '#EA580C' : '#0D9488'
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* Full Ranking Table */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                  <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                    <Target className="w-4 h-4 text-indigo-600" /> Tabel Evaluasi Kinerja Anggota
                  </h3>
                  {evaluationData.length === 0 ? (
                    <div className="text-center py-12 text-slate-400">
                      <Award className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="text-sm font-semibold">Belum ada data evaluasi anggota</p>
                      <p className="text-xs mt-1">Sesuaikan filter periode untuk melihat data kinerja.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50 border-b border-slate-200">
                            <th className="py-3 px-3 text-left font-bold text-slate-500 uppercase tracking-wider w-12">No</th>
                            <th className="py-3 px-3 text-left font-bold text-slate-500 uppercase tracking-wider">Anggota</th>
                            <th className="py-3 px-3 text-center font-bold text-slate-500 uppercase tracking-wider">Kegiatan</th>
                            <th className="py-3 px-3 text-center font-bold text-slate-500 uppercase tracking-wider">Hadir</th>
                            <th className="py-3 px-3 text-center font-bold text-slate-500 uppercase tracking-wider">Tepat Waktu</th>
                            <th className="py-3 px-3 text-center font-bold text-slate-500 uppercase tracking-wider">Terlambat</th>
                            <th className="py-3 px-3 text-center font-bold text-slate-500 uppercase tracking-wider">Kehadiran %</th>
                            <th className="py-3 px-3 text-center font-bold text-slate-500 uppercase tracking-wider">Dok.</th>
                            <th className="py-3 px-3 text-center font-bold text-slate-500 uppercase tracking-wider">Konten</th>
                            <th className="py-3 px-3 text-center font-bold text-amber-600 uppercase tracking-wider">Nilai Kinerja</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {evaluationData.map((item, idx) => (
                            <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                              <td className="py-3 px-3">
                                <span className={`font-black text-sm ${
                                  idx === 0 ? 'text-amber-500' :
                                  idx === 1 ? 'text-slate-400' :
                                  idx === 2 ? 'text-orange-500' : 'text-slate-500'
                                }`}>
                                  {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center text-xs font-bold text-teal-700 shrink-0">
                                    {item.fullName.charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <p className="font-bold text-slate-800">{item.fullName}</p>
                                    <p className="text-[10px] text-slate-400 font-mono">@{item.username}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className="font-bold text-slate-700">{item.totalKegiatan}</span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className="inline-flex items-center gap-1 text-emerald-700 font-bold">
                                  <CheckCircle2 className="w-3 h-3" />{item.totalCheckin}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className="text-teal-600 font-bold">{item.totalTepatWaktu}</span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={`font-bold ${
                                  item.totalTerlambat > 0 ? 'text-orange-500' : 'text-slate-400'
                                }`}>
                                  {item.totalTerlambat > 0 ? (
                                    <span className="inline-flex items-center gap-1">
                                      <Clock3 className="w-3 h-3" />{item.totalTerlambat}
                                    </span>
                                  ) : '–'}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="w-16 bg-slate-100 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full ${
                                        item.persenKehadiran >= 80 ? 'bg-emerald-500' :
                                        item.persenKehadiran >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                      }`}
                                      style={{ width: `${item.persenKehadiran}%` }}
                                    />
                                  </div>
                                  <span className="font-bold text-slate-700 w-8">{item.persenKehadiran}%</span>
                                </div>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className="font-bold text-sky-600">{item.totalDokumentasi}</span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className="font-bold text-violet-600">{item.totalContentPlan}</span>
                              </td>
                              <td className="py-3 px-3 text-center">
                                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-black ${
                                  item.nilaiKinerja >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                  item.nilaiKinerja >= 60 ? 'bg-amber-100 text-amber-700' :
                                  item.nilaiKinerja >= 40 ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'
                                }`}>
                                  {item.nilaiKinerja}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                {/* Legend */}
                <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold text-slate-600 mb-2">📌 Keterangan Formula Evaluasi</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                      <span className="text-slate-600"><strong>60%</strong> — Kehadiran (check-in tepat waktu + terlambat / total kegiatan)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0" />
                      <span className="text-slate-600"><strong>25%</strong> — Dokumentasi (upload file kegiatan, maks. 5 upload = 100%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-violet-500 shrink-0" />
                      <span className="text-slate-600"><strong>15%</strong> — Content Plan (jumlah konten sebagai PIC, maks. 5 = 100%)</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* List Datatable view for non-summary tabs */}
            {activeTab !== 'summary' && activeTab !== 'evaluasi' && (
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-bold text-slate-800">
                      Tabel Rekapitulasi {activeTab === 'kegiatan' ? 'Kegiatan' : activeTab === 'content-plans' ? 'Content Plan' : activeTab === 'loans' ? 'Peminjaman Alat' : 'Pengguna'}
                    </h3>
                    <p className="text-xs text-slate-400">
                      Menampilkan data valid sesuai filter aktif.
                    </p>
                  </div>

                  <div className="w-full sm:w-72 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari kata kunci..."
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="overflow-hidden rounded-xl border border-slate-200">
                  {activeTab === 'kegiatan' && (
                    <DataTable
                      columns={kegiatanColumns}
                      data={filteredActivities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                      emptyMessage="Tidak ada rekap kegiatan untuk periode ini."
                    />
                  )}
                  {activeTab === 'content-plans' && (
                    <DataTable
                      columns={contentColumns}
                      data={filteredContentPlans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                      emptyMessage="Tidak ada rekap content plan untuk periode ini."
                    />
                  )}
                  {activeTab === 'loans' && (
                    <DataTable
                      columns={loanColumns}
                      data={filteredLoans.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                      emptyMessage="Tidak ada rekap peminjaman alat untuk periode ini."
                    />
                  )}
                  {activeTab === 'users' && (
                    <DataTable
                      columns={userColumns}
                      data={filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)}
                      emptyMessage="Tidak ada rekap pengguna."
                    />
                  )}
                </div>

                <PaginationBar
                  currentPage={currentPage}
                  totalPages={Math.ceil(
                    (activeTab === 'kegiatan' ? filteredActivities.length : activeTab === 'content-plans' ? filteredContentPlans.length : activeTab === 'loans' ? filteredLoans.length : filteredUsers.length) / itemsPerPage
                  ) || 1}
                  totalItems={activeTab === 'kegiatan' ? filteredActivities.length : activeTab === 'content-plans' ? filteredContentPlans.length : activeTab === 'loans' ? filteredLoans.length : filteredUsers.length}
                  onPageChange={setCurrentPage}
                  itemName="baris data"
                />
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
