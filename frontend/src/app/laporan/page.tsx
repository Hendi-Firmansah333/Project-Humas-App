'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  CustomDatePicker,
  TableSkeleton,
} from '@/components/common';
import ActivityChart from '@/components/common/ActivityChart';
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
  BarChart3,
  Package,
  Trophy,
  Crown,
  User,
  Info,
  Printer,
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
  equipmentName?: string;
  items?: any[];
  borrowDate: string;
  returnDate?: string;
  status: string;
}

const getLoanItemNames = (item: LoanItem) => {
  if (item.items && item.items.length > 0) {
    return item.items.map((i: any) => `${i.equipment?.name || 'Alat'} x${i.quantity}`).join(', ');
  }
  return item.equipmentName || '-';
};

const formatReportStatus = (raw?: string): string => {
  if (!raw) return '-';
  const map: Record<string, string> = {
    AKAN_DATANG: 'Akan Datang',
    DITUGASKAN: 'Ditugaskan',
    SEDANG_BERLANGSUNG: 'Sedang Berlangsung',
    MENUNGGU_VERIFIKASI: 'Menunggu Persetujuan Kepala Humas',
    MENUNGGU_PERSETUJUAN_AKHIR: 'Menunggu Persetujuan Kepala Humas',
    PERLU_PERBAIKAN: 'Perlu Perbaikan / Revisi',
    DIKEMBALIKAN: 'Dikembalikan / Revisi',
    SELESAI: 'Selesai',
    DIBATALKAN: 'Dibatalkan',
    DITOLAK: 'Ditolak',
    DISETUJUI: 'Disetujui',
    SEDANG_DIPINJAM: 'Sedang Dipinjam',
    DIKEMBALIKAN_LENGKAP: 'Telah Dikembalikan',
    TERLAMBAT: 'Terlambat',
    DIPUBLIKASIKAN: 'Dipublikasikan',
    PUBLISHED: 'Dipublikasikan',
    DALAM_PROSES: 'Dalam Proses Produksi',
    MENUNGGU_VERIFIKASI_ADMIN: 'Menunggu Persetujuan Kepala Humas',
    MENUNGGU_PERSETUJUAN_KEPALA_HUMAS: 'Menunggu Persetujuan Kepala Humas',
    REVISI: 'Perlu Revisi',
    AKTIF: 'Aktif',
    NONAKTIF: 'Nonaktif',
  };
  return (
    map[raw] ||
    raw
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase())
  );
};

const loadImageAsDataUrl = async (src: string): Promise<string | null> => {
  try {
    const res = await fetch(src, { cache: 'force-cache' });
    if (!res.ok) return null;
    const blob = await res.blob();
    return await new Promise<string | null>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(typeof reader.result === 'string' ? reader.result : null);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
};

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

  // Export state & outside click ref
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchTabDataset = async () => {
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      toast.error('Tanggal mulai tidak boleh lebih besar dari tanggal akhir.');
      return;
    }
    setLoading(true);
    try {
      const dateRange = { startDate, endDate };

      const [summary, actResult, contentResult, loanResult, userResult, evalResult] = await Promise.all([
        dashboardService.summary().catch(() => ({ statistics: null, monthlyStats: [] })),
        reportService.getActivities(dateRange).catch(() => []),
        reportService.getContentPlans(dateRange).catch(() => []),
        reportService.getLoans(dateRange).catch(() => []),
        reportService.getUsers(dateRange).catch(() => []),
        reportService.getUserEvaluation(dateRange).catch(() => []),
      ]);

      const actList = Array.isArray(actResult) ? actResult : [];
      const contentList = Array.isArray(contentResult) ? contentResult : [];
      const loanList = Array.isArray(loanResult) ? loanResult : [];
      const userList = Array.isArray(userResult) ? userResult : [];
      const evalList = Array.isArray(evalResult) ? evalResult : [];

      setActivities(actList);
      setContentPlans(contentList);
      setLoans(loanList);
      setUsersData(userList);
      setEvaluationData(evalList);

      setStats(
        summary?.statistics ?? {
          totalActivities: actList.length,
          totalContentPlans: contentList.length,
          activeLoans: loanList.length,
          totalUsers: userList.length,
        }
      );
      setMonthlyStats(summary?.monthlyStats ?? []);
    } catch {
      toast.error('Gagal memuat data rekapitulasi laporan.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTabDataset();
    setCurrentPage(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const applyShortcut = (shortcut: 'hari' | 'minggu' | 'bulan' | 'tahun') => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const fmt = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

    let start = '';
    const end = fmt(now);

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

  const handlePrintReport = () => {
    setIsExportOpen(false);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  const handleExportPDF = async () => {
    try {
      toast.info('Menyiapkan dokumen laporan PDF resmi...', { duration: 2500 });
      const [{ default: jsPDF }, { default: autoTable }, polinelaLogo, primaLogo] = await Promise.all([
        import('jspdf'),
        import('jspdf-autotable'),
        loadImageAsDataUrl('/logo-polinela.png'),
        loadImageAsDataUrl('/logo-prima.png'),
      ]);

      const doc = new jsPDF({ orientation: 'landscape', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth(); // 297 mm
      const pageHeight = doc.internal.pageSize.getHeight(); // 210 mm
      const marginX = 14;
      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
      const periodFormatted = `${formatDateID(startDate)} s.d. ${formatDateID(endDate)}`;
      const docCode = `LAP-PRIMA/HUMAS-POLINELA/${now.getFullYear()}/${String(now.getMonth() + 1).padStart(2, '0')}`;

      const tabTitleMap: Record<string, string> = {
        summary: 'LAPORAN REKAPITULASI EKSEKUTIF KEHUMASAN',
        kegiatan: 'LAPORAN REKAPITULASI KEGIATAN PELIPUTAN HUMAS',
        'content-plans': 'LAPORAN REKAPITULASI RENCANA KONTEN (CONTENT PLAN)',
        loans: 'LAPORAN REKAPITULASI PEMINJAMAN INVENTARIS ALAT',
        users: 'LAPORAN REKAPITULASI DATA PERSONEL & PENGGUNA SISTEM',
        evaluasi: 'LAPORAN EVALUASI KINERJA ANGGOTA TIM KEHUMASAN',
      };
      const reportMainTitle = tabTitleMap[activeTab] || 'LAPORAN REKAPITULASI KEHUMASAN';

      // Helper to draw official Kop Surat on top of the first page
      const drawKopSurat = () => {
        // Left Logo: Logo Resmi Polinela
        if (polinelaLogo) {
          doc.addImage(polinelaLogo, 'PNG', marginX + 2, 8, 22, 22);
        }
        // Right Logo: Logo Resmi PRIMA Humas
        if (primaLogo) {
          doc.addImage(primaLogo, 'PNG', pageWidth - marginX - 24, 8, 22, 22);
        }

        // Center Kop Surat Text
        doc.setTextColor(15, 23, 42);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9.5);
        doc.text(
          'KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI',
          pageWidth / 2,
          12,
          { align: 'center' }
        );

        doc.setTextColor(0, 61, 88); // Polinela & PRIMA Navy #003D58
        doc.setFontSize(14);
        doc.text('POLITEKNIK NEGERI LAMPUNG', pageWidth / 2, 18, { align: 'center' });

        doc.setTextColor(15, 23, 42);
        doc.setFontSize(10);
        doc.text(
          'UPT HUBUNGAN MASYARAKAT DAN KERJASAMA — SISTEM INFORMASI PRIMA',
          pageWidth / 2,
          23,
          { align: 'center' }
        );

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(71, 85, 105);
        doc.text(
          'Jl. Soekarno Hatta No. 10, Rajabasa Raya, Kec. Rajabasa, Kota Bandar Lampung, Lampung 35144',
          pageWidth / 2,
          27.5,
          { align: 'center' }
        );
        doc.text(
          'Telepon: (0721) 703995 | Faksimile: (0721) 787309 | Laman: www.polinela.ac.id | Email: humas@polinela.ac.id',
          pageWidth / 2,
          31.2,
          { align: 'center' }
        );

        // Garis Kop Surat Ganda (Thick + Thin Double Line)
        doc.setDrawColor(0, 61, 88);
        doc.setLineWidth(0.9);
        doc.line(marginX, 34.5, pageWidth - marginX, 34.5);
        doc.setLineWidth(0.25);
        doc.line(marginX, 35.7, pageWidth - marginX, 35.7);
      };

      drawKopSurat();

      // ── Judul Laporan & Metadata Box ──
      doc.setTextColor(0, 61, 88);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(reportMainTitle, pageWidth / 2, 42.5, { align: 'center' });

      // Metadata Bar
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.setLineWidth(0.25);
      doc.roundedRect(marginX, 45.5, pageWidth - marginX * 2, 9, 1.5, 1.5, 'FD');

      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(30, 41, 59);
      doc.text(`Kode Dokumen: ${docCode}`, marginX + 4, 51);
      doc.text(`Periode Laporan: ${periodFormatted}`, pageWidth / 2, 51, { align: 'center' });
      doc.text(`Dicetak: ${dateStr} (${timeStr})`, pageWidth - marginX - 4, 51, { align: 'right' });

      // ── 4 KPI Summary Cards Row ──
      const kpiItems = [
        { label: 'TOTAL KEGIATAN DILIPUT', val: `${stats.totalActivities} Agenda`, sub: `Periode terpilih: ${filteredActivities.length} kegiatan` },
        { label: 'RENCANA KONTEN HUMAS', val: `${stats.totalContentPlans} Konten`, sub: `Periode terpilih: ${filteredContentPlans.length} konten` },
        { label: 'PEMINJAMAN INVENTARIS', val: `${stats.activeLoans} Sesi Aktif`, sub: `Periode terpilih: ${filteredLoans.length} transaksi` },
        { label: 'PERSONEL KRU HUMAS', val: `${stats.totalUsers} Personel`, sub: `Dievaluasi: ${evaluationData.length} anggota` },
      ];
      const boxGap = 4;
      const totalWidth = pageWidth - marginX * 2;
      const boxW = (totalWidth - boxGap * 3) / 4;
      const boxY = 57;
      const boxH = 15.5;

      kpiItems.forEach((kpi, i) => {
        const bx = marginX + i * (boxW + boxGap);
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(203, 213, 225);
        doc.setLineWidth(0.25);
        doc.roundedRect(bx, boxY, boxW, boxH, 1.5, 1.5, 'FD');

        // Left accent strip
        doc.setFillColor(0, 61, 88);
        doc.rect(bx, boxY + 1.5, 1.4, boxH - 3, 'F');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.8);
        doc.setTextColor(100, 116, 139);
        doc.text(kpi.label, bx + 4, boxY + 4.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10.5);
        doc.setTextColor(0, 61, 88);
        doc.text(kpi.val, bx + 4, boxY + 9.8);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(6.8);
        doc.setTextColor(100, 116, 139);
        doc.text(kpi.sub, bx + 4, boxY + 13.7);
      });

      let currentY = boxY + boxH + 5;

      const commonTableOpts = {
        headStyles: {
          fillColor: [0, 61, 88] as [number, number, number],
          textColor: [255, 255, 255] as [number, number, number],
          fontStyle: 'bold' as const,
          fontSize: 8.5,
          halign: 'center' as const,
          valign: 'middle' as const,
          cellPadding: 2.5,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [30, 41, 59] as [number, number, number],
          valign: 'middle' as const,
          cellPadding: 2.2,
          lineColor: [226, 232, 240] as [number, number, number],
          lineWidth: 0.2,
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] as [number, number, number],
        },
        margin: { left: marginX, right: marginX, bottom: 20 },
      };

      const drawSectionHeading = (title: string, yPos: number): number => {
        if (yPos > pageHeight - 40) {
          doc.addPage();
          yPos = 18;
        }
        doc.setFillColor(240, 249, 255);
        doc.setDrawColor(186, 230, 253);
        doc.roundedRect(marginX, yPos, pageWidth - marginX * 2, 7, 1, 1, 'FD');
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(0, 61, 88);
        doc.text(title, marginX + 3, yPos + 4.8);
        return yPos + 8.5;
      };

      if (activeTab === 'summary') {
        // 1. Tabel Ringkasan Eksekutif
        currentY = drawSectionHeading('I. RINGKASAN INDIKATOR KINERJA UTAMA (KPI) KEHUMASAN', currentY);
        autoTable(doc, {
          ...commonTableOpts,
          startY: currentY,
          head: [['No', 'Indikator Kinerja Kehumasan', 'Total Kumulatif Sistem', 'Data Periode Laporan', 'Keterangan Operasional']],
          body: [
            ['1', 'Kegiatan Peliputan & Dokumentasi Humas', `${stats.totalActivities} Agenda`, `${filteredActivities.length} Agenda`, 'Agenda peliputan resmi surat masuk & kegiatan internal'],
            ['2', 'Perencanaan & Publikasi Konten (Content Plan)', `${stats.totalContentPlans} Konten`, `${filteredContentPlans.length} Konten`, 'Publikasi media sosial resmi (Instagram, TikTok, YouTube, Website)'],
            ['3', 'Sesi Peminjaman Inventaris Peralatan', `${stats.activeLoans} Sesi Aktif`, `${filteredLoans.length} Transaksi`, 'Peminjaman kamera, audio, dan perangkat liputan operasional'],
            ['4', 'Personel & Kru Humas Terdaftar', `${stats.totalUsers} Personel`, `${evaluationData.length} Anggota Tim`, 'Kepala Humas, Admin Humas, serta Anggota Pelaksana Lapangan'],
          ],
          columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            1: { fontStyle: 'bold', cellWidth: 72 },
            2: { halign: 'center', cellWidth: 38 },
            3: { halign: 'center', cellWidth: 38 },
          },
        });
        currentY = ((doc as any).lastAutoTable?.finalY || currentY) + 6;

        // 2. Tabel Rekap Kegiatan
        currentY = drawSectionHeading(`II. REKAPITULASI KEGIATAN PELIPUTAN (${filteredActivities.length} Data)`, currentY);
        autoTable(doc, {
          ...commonTableOpts,
          startY: currentY,
          head: [['No', 'Judul Kegiatan Peliputan', 'Kategori', 'Tanggal Pelaksanaan', 'Waktu (WIB)', 'PIC Lapangan', 'Status Kegiatan']],
          body:
            filteredActivities.length > 0
              ? filteredActivities.map((item, idx) => [
                  idx + 1,
                  item.title,
                  item.category || '-',
                  formatDateID(item.date),
                  `${item.startTime || '--:--'} - ${item.endTime || '--:--'}`,
                  item.pic?.fullName ?? '-',
                  formatReportStatus(item.status),
                ])
              : [['-', 'Tidak ada data kegiatan peliputan pada periode ini.', '-', '-', '-', '-', '-']],
          columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            2: { halign: 'center', cellWidth: 36 },
            3: { halign: 'center', cellWidth: 38 },
            4: { halign: 'center', cellWidth: 28 },
            5: { cellWidth: 42 },
            6: { halign: 'center', cellWidth: 38 },
          },
        });
        currentY = ((doc as any).lastAutoTable?.finalY || currentY) + 6;

        // 3. Tabel Rekap Content Plan
        currentY = drawSectionHeading(`III. REKAPITULASI CONTENT PLAN MEDIA SOSIAL (${filteredContentPlans.length} Data)`, currentY);
        autoTable(doc, {
          ...commonTableOpts,
          startY: currentY,
          head: [['No', 'Judul Rencana Konten', 'Jenis Format', 'Platform Publikasi', 'Deadline', 'PIC Kreator', 'Status Konten']],
          body:
            filteredContentPlans.length > 0
              ? filteredContentPlans.map((item, idx) => [
                  idx + 1,
                  item.title,
                  item.contentType || '-',
                  item.platform || '-',
                  item.deadline ? formatDateID(item.deadline) : '-',
                  item.pic?.fullName ?? '-',
                  formatReportStatus(item.status),
                ])
              : [['-', 'Tidak ada data rencana konten pada periode ini.', '-', '-', '-', '-', '-']],
          columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            2: { halign: 'center', cellWidth: 32 },
            3: { halign: 'center', cellWidth: 32 },
            4: { halign: 'center', cellWidth: 36 },
            5: { cellWidth: 42 },
            6: { halign: 'center', cellWidth: 38 },
          },
        });
        currentY = ((doc as any).lastAutoTable?.finalY || currentY) + 6;

        // 4. Tabel Rekap Peminjaman Alat
        currentY = drawSectionHeading(`IV. REKAPITULASI PEMINJAMAN INVENTARIS ALAT (${filteredLoans.length} Data)`, currentY);
        autoTable(doc, {
          ...commonTableOpts,
          startY: currentY,
          head: [['No', 'Nama Peminjam', 'Rincian Inventaris Alat', 'Tanggal Pinjam', 'Tanggal Kembali', 'Status Peminjaman']],
          body:
            filteredLoans.length > 0
              ? filteredLoans.map((item, idx) => [
                  idx + 1,
                  item.borrowerName,
                  getLoanItemNames(item),
                  formatDateID(item.borrowDate),
                  item.returnDate ? formatDateID(item.returnDate) : 'Belum Kembali',
                  formatReportStatus(item.status),
                ])
              : [['-', 'Tidak ada data peminjaman alat pada periode ini.', '-', '-', '-', '-']],
          columnStyles: {
            0: { halign: 'center', cellWidth: 12 },
            1: { cellWidth: 48 },
            3: { halign: 'center', cellWidth: 40 },
            4: { halign: 'center', cellWidth: 40 },
            5: { halign: 'center', cellWidth: 38 },
          },
        });
        currentY = ((doc as any).lastAutoTable?.finalY || currentY) + 6;

        // 5. Tabel Evaluasi Kinerja Anggota
        if (evaluationData.length > 0) {
          currentY = drawSectionHeading(`V. EVALUASI KINERJA ANGGOTA TIM HUMAS (${evaluationData.length} Personel)`, currentY);
          autoTable(doc, {
            ...commonTableOpts,
            startY: currentY,
            head: [['Peringkat', 'Nama Anggota', 'Username', 'Kegiatan', 'Hadir', 'Tepat Waktu', 'Terlambat', '% Kehadiran', 'Dok.', 'Konten', 'Nilai Kinerja']],
            body: evaluationData.map((item, idx) => [
              `#${idx + 1}`,
              item.fullName,
              `@${item.username}`,
              item.totalKegiatan,
              item.totalCheckin,
              item.totalTepatWaktu,
              item.totalTerlambat,
              `${item.persenKehadiran}%`,
              item.totalDokumentasi,
              item.totalContentPlan,
              `${item.nilaiKinerja} / 100`,
            ]),
            columnStyles: {
              0: { halign: 'center', fontStyle: 'bold', cellWidth: 18 },
              3: { halign: 'center', cellWidth: 18 },
              4: { halign: 'center', cellWidth: 16 },
              5: { halign: 'center', cellWidth: 22 },
              6: { halign: 'center', cellWidth: 18 },
              7: { halign: 'center', cellWidth: 22 },
              8: { halign: 'center', cellWidth: 16 },
              9: { halign: 'center', cellWidth: 16 },
              10: { halign: 'center', fontStyle: 'bold', cellWidth: 24 },
            },
          });
        }
      } else {
        // Tab Spesifik
        let head: string[][] = [];
        let body: any[][] = [];
        let colStyles: Record<number, any> = { 0: { halign: 'center', cellWidth: 12 } };

        if (activeTab === 'kegiatan') {
          head = [['No', 'Judul Kegiatan Peliputan', 'Kategori', 'Tanggal Pelaksanaan', 'Waktu (WIB)', 'PIC Lapangan', 'Status Kegiatan']];
          body =
            filteredActivities.length > 0
              ? filteredActivities.map((item, idx) => [
                  idx + 1,
                  item.title,
                  item.category || '-',
                  formatDateID(item.date),
                  `${item.startTime || '--:--'} - ${item.endTime || '--:--'}`,
                  item.pic?.fullName ?? '-',
                  formatReportStatus(item.status),
                ])
              : [['-', 'Tidak ada data kegiatan peliputan untuk periode ini.', '-', '-', '-', '-', '-']];
          colStyles = {
            0: { halign: 'center', cellWidth: 12 },
            2: { halign: 'center', cellWidth: 36 },
            3: { halign: 'center', cellWidth: 38 },
            4: { halign: 'center', cellWidth: 28 },
            5: { cellWidth: 42 },
            6: { halign: 'center', cellWidth: 38 },
          };
        } else if (activeTab === 'content-plans') {
          head = [['No', 'Judul Rencana Konten', 'Jenis Format', 'Platform Publikasi', 'Deadline Publish', 'PIC Kreator', 'Status Konten']];
          body =
            filteredContentPlans.length > 0
              ? filteredContentPlans.map((item, idx) => [
                  idx + 1,
                  item.title,
                  item.contentType || '-',
                  item.platform || '-',
                  item.deadline ? formatDateID(item.deadline) : '-',
                  item.pic?.fullName ?? '-',
                  formatReportStatus(item.status),
                ])
              : [['-', 'Tidak ada data rencana konten untuk periode ini.', '-', '-', '-', '-', '-']];
          colStyles = {
            0: { halign: 'center', cellWidth: 12 },
            2: { halign: 'center', cellWidth: 32 },
            3: { halign: 'center', cellWidth: 32 },
            4: { halign: 'center', cellWidth: 36 },
            5: { cellWidth: 42 },
            6: { halign: 'center', cellWidth: 38 },
          };
        } else if (activeTab === 'loans') {
          head = [['No', 'Nama Peminjam', 'Rincian Inventaris Alat', 'Tanggal Pinjam', 'Tanggal Kembali', 'Status Peminjaman']];
          body =
            filteredLoans.length > 0
              ? filteredLoans.map((item, idx) => [
                  idx + 1,
                  item.borrowerName,
                  getLoanItemNames(item),
                  formatDateID(item.borrowDate),
                  item.returnDate ? formatDateID(item.returnDate) : 'Belum Kembali',
                  formatReportStatus(item.status),
                ])
              : [['-', 'Tidak ada data peminjaman alat untuk periode ini.', '-', '-', '-', '-']];
          colStyles = {
            0: { halign: 'center', cellWidth: 12 },
            1: { cellWidth: 50 },
            3: { halign: 'center', cellWidth: 40 },
            4: { halign: 'center', cellWidth: 40 },
            5: { halign: 'center', cellWidth: 38 },
          };
        } else if (activeTab === 'users') {
          head = [['No', 'Nama Lengkap Personel', 'Username', 'Alamat Email Resmi', 'Jabatan / Peran', 'Status Akun']];
          body =
            filteredUsers.length > 0
              ? filteredUsers.map((item, idx) => [
                  idx + 1,
                  item.fullName,
                  item.username,
                  item.email,
                  item.roleLabel,
                  item.isActive ? 'Aktif' : 'Nonaktif',
                ])
              : [['-', 'Tidak ada data personel pengguna.', '-', '-', '-', '-']];
          colStyles = {
            0: { halign: 'center', cellWidth: 12 },
            2: { cellWidth: 38 },
            4: { halign: 'center', cellWidth: 44 },
            5: { halign: 'center', cellWidth: 28 },
          };
        } else if (activeTab === 'evaluasi') {
          head = [['Peringkat', 'Nama Lengkap Anggota', 'Username', 'Kegiatan', 'Hadir', 'Tepat Waktu', 'Terlambat', '% Kehadiran', 'Dokumentasi', 'Content Plan', 'Nilai Kinerja']];
          body =
            evaluationData.length > 0
              ? evaluationData.map((item, idx) => [
                  `#${idx + 1}`,
                  item.fullName,
                  `@${item.username}`,
                  item.totalKegiatan,
                  item.totalCheckin,
                  item.totalTepatWaktu,
                  item.totalTerlambat,
                  `${item.persenKehadiran}%`,
                  item.totalDokumentasi,
                  item.totalContentPlan,
                  `${item.nilaiKinerja} / 100`,
                ])
              : [['-', 'Tidak ada data evaluasi kinerja anggota untuk periode ini.', '-', '-', '-', '-', '-', '-', '-', '-', '-']];
          colStyles = {
            0: { halign: 'center', fontStyle: 'bold', cellWidth: 18 },
            3: { halign: 'center', cellWidth: 18 },
            4: { halign: 'center', cellWidth: 16 },
            5: { halign: 'center', cellWidth: 22 },
            6: { halign: 'center', cellWidth: 18 },
            7: { halign: 'center', cellWidth: 22 },
            8: { halign: 'center', cellWidth: 22 },
            9: { halign: 'center', cellWidth: 22 },
            10: { halign: 'center', fontStyle: 'bold', cellWidth: 25 },
          };
        }

        autoTable(doc, {
          ...commonTableOpts,
          startY: currentY,
          head,
          body,
          columnStyles: colStyles,
        });
      }

      // ── Footer Setiap Halaman ──
      const totalPages = (doc as any).internal.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.25);
        doc.line(marginX, pageHeight - 12, pageWidth - marginX, pageHeight - 12);

        doc.setFont('helvetica', 'italic');
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(
          `Dokumen Resmi Sistem Informasi Kehumasan PRIMA — Politeknik Negeri Lampung | Dicetak otomatis pada ${dateStr} ${timeStr}`,
          marginX,
          pageHeight - 7.5
        );
        doc.setFont('helvetica', 'bold');
        doc.text(`Halaman ${p} dari ${totalPages}`, pageWidth - marginX, pageHeight - 7.5, { align: 'right' });
      }

      doc.save(`Laporan-PRIMA-Polinela-${activeTab}-${startDate}-sd-${endDate}.pdf`);
      toast.success('Laporan PDF resmi berhasil diunduh!');
    } catch (err) {
      console.error(err);
      toast.error('Gagal membuat laporan PDF. Silakan coba lagi.');
    }
  };

  const handleExportExcel = async () => {
    try {
      toast.info('Menyiapkan buku kerja Excel (.xlsx) resmi...', { duration: 2500 });
      const [ExcelJS, polinelaLogo, primaLogo] = await Promise.all([
        import('exceljs'),
        loadImageAsDataUrl('/logo-polinela.png'),
        loadImageAsDataUrl('/logo-prima.png'),
      ]);

      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'Sistem Informasi Kehumasan PRIMA - Politeknik Negeri Lampung';
      workbook.created = new Date();

      let polinelaImgId: number | null = null;
      let primaImgId: number | null = null;

      if (polinelaLogo) {
        polinelaImgId = workbook.addImage({ base64: polinelaLogo, extension: 'png' });
      }
      if (primaLogo) {
        primaImgId = workbook.addImage({ base64: primaLogo, extension: 'png' });
      }

      const now = new Date();
      const dateStr = now.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
      const periodFormatted = `${formatDateID(startDate)} s.d. ${formatDateID(endDate)}`;

      const headerFill: any = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF003D58' } };
      const zebraFill: any = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
      const headerFont: any = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' }, size: 10 };
      const thinBorder: any = {
        top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
        right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
      };

      const addOfficialSheet = (
        sheetName: string,
        reportTitle: string,
        columns: string[],
        rows: any[][],
        colWidths?: number[]
      ) => {
        const sheet = workbook.addWorksheet(sheetName, {
          views: [{ showGridLines: true }],
        });

        const lastColIndex = Math.max(columns.length, 6);
        const lastColLetter = String.fromCharCode(64 + lastColIndex);

        // Kop Surat Rows (Rows 1 - 4)
        sheet.mergeCells(`A1:${lastColLetter}1`);
        sheet.getCell('A1').value = 'KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI';
        sheet.getCell('A1').font = { name: 'Calibri', bold: true, size: 10, color: { argb: 'FF334155' } };
        sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(1).height = 16;

        sheet.mergeCells(`A2:${lastColLetter}2`);
        sheet.getCell('A2').value = 'POLITEKNIK NEGERI LAMPUNG';
        sheet.getCell('A2').font = { name: 'Calibri', bold: true, size: 15, color: { argb: 'FF003D58' } };
        sheet.getCell('A2').alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(2).height = 22;

        sheet.mergeCells(`A3:${lastColLetter}3`);
        sheet.getCell('A3').value = 'UPT HUBUNGAN MASYARAKAT DAN KERJASAMA — SISTEM INFORMASI PRIMA';
        sheet.getCell('A3').font = { name: 'Calibri', bold: true, size: 11, color: { argb: 'FF0F172A' } };
        sheet.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(3).height = 18;

        sheet.mergeCells(`A4:${lastColLetter}4`);
        sheet.getCell('A4').value =
          'Jl. Soekarno Hatta No. 10, Rajabasa Raya, Bandar Lampung 35144 | Telp: (0721) 703995 | www.polinela.ac.id';
        sheet.getCell('A4').font = { name: 'Calibri', italic: true, size: 9, color: { argb: 'FF475569' } };
        sheet.getCell('A4').alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(4).height = 18;

        // Double Bottom Border on Row 4 (Garis Kop Surat)
        for (let c = 1; c <= lastColIndex; c++) {
          sheet.getRow(4).getCell(c).border = {
            bottom: { style: 'double', color: { argb: 'FF003D58' } },
          };
        }

        // Embed Logo Polinela (Left) & Logo PRIMA (Right)
        if (polinelaImgId !== null) {
          sheet.addImage(polinelaImgId, {
            tl: { col: 0.15, row: 0.2 },
            ext: { width: 64, height: 64 },
          });
        }
        if (primaImgId !== null) {
          sheet.addImage(primaImgId, {
            tl: { col: lastColIndex - 0.85, row: 0.2 },
            ext: { width: 64, height: 64 },
          });
        }

        // Title & Period (Rows 6 - 7)
        sheet.mergeCells(`A6:${lastColLetter}6`);
        sheet.getCell('A6').value = reportTitle.toUpperCase();
        sheet.getCell('A6').font = { name: 'Calibri', bold: true, size: 12, color: { argb: 'FF003D58' } };
        sheet.getCell('A6').alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(6).height = 20;

        sheet.mergeCells(`A7:${lastColLetter}7`);
        sheet.getCell('A7').value = `Periode Laporan: ${periodFormatted}   |   Tanggal Cetak: ${dateStr}`;
        sheet.getCell('A7').font = { name: 'Calibri', size: 9.5, color: { argb: 'FF475569' } };
        sheet.getCell('A7').alignment = { horizontal: 'center', vertical: 'middle' };
        sheet.getRow(7).height = 16;

        sheet.addRow([]);

        // Table Header (Row 9)
        const headerRow = sheet.addRow(columns);
        headerRow.height = 24;
        headerRow.eachCell((cell) => {
          cell.fill = headerFill;
          cell.font = headerFont;
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
          cell.border = thinBorder;
        });

        // Data Rows
        if (rows.length === 0) {
          const emptyRow = sheet.addRow(['-', 'Tidak ada data pada periode laporan ini.', ...Array(Math.max(0, columns.length - 2)).fill('-')]);
          emptyRow.height = 20;
          emptyRow.eachCell((cell) => {
            cell.font = { name: 'Calibri', italic: true, size: 9.5, color: { argb: 'FF64748B' } };
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
            cell.border = thinBorder;
          });
        } else {
          rows.forEach((r, idx) => {
            const row = sheet.addRow(r);
            row.height = 20;
            row.eachCell((cell, colNumber) => {
              if (idx % 2 === 1) {
                cell.fill = zebraFill;
              }
              cell.font = { name: 'Calibri', size: 9.5, color: { argb: 'FF1E293B' } };
              cell.border = thinBorder;
              cell.alignment = {
                horizontal: colNumber === 1 ? 'center' : 'left',
                vertical: 'middle',
                wrapText: true,
              };
            });
          });
        }

        // Column widths
        sheet.columns.forEach((col, i) => {
          if (col) {
            col.width = colWidths?.[i] ?? (i === 0 ? 8 : 25);
          }
        });
      };

      // Sheet 1: Ringkasan Eksekutif
      addOfficialSheet(
        'Ringkasan Eksekutif',
        'Laporan Ringkasan Eksekutif Indikator Kinerja Humas',
        ['No', 'Kategori Indikator Kinerja', 'Total Kumulatif Sistem', 'Data Periode Laporan', 'Keterangan Operasional', 'Status Evaluasi'],
        [
          [1, 'Kegiatan Peliputan & Dokumentasi Humas', `${stats.totalActivities} Agenda`, `${filteredActivities.length} Agenda`, 'Agenda peliputan surat masuk & kegiatan internal', 'Tercatat Sistem'],
          [2, 'Perencanaan & Publikasi Konten (Content Plan)', `${stats.totalContentPlans} Konten`, `${filteredContentPlans.length} Konten`, 'Publikasi media sosial resmi Polinela', 'Tercatat Sistem'],
          [3, 'Sesi Peminjaman Inventaris Peralatan', `${stats.activeLoans} Sesi Aktif`, `${filteredLoans.length} Transaksi`, 'Peminjaman perangkat operasional liputan', 'Tercatat Sistem'],
          [4, 'Personel & Kru Humas Terdaftar', `${stats.totalUsers} Personel`, `${evaluationData.length} Anggota Tim`, 'Personel aktif terdaftar pada Sistem PRIMA', 'Tercatat Sistem'],
        ],
        [8, 38, 22, 22, 42, 20]
      );

      // Sheet 2: Rekap Kegiatan
      addOfficialSheet(
        'Rekap Kegiatan',
        'Laporan Rekapitulasi Kegiatan Peliputan Humas',
        ['No', 'Judul Kegiatan Peliputan', 'Kategori Kegiatan', 'Tanggal Pelaksanaan', 'Waktu (WIB)', 'PIC Lapangan', 'Status Kegiatan'],
        filteredActivities.map((item, idx) => [
          idx + 1,
          item.title,
          item.category || '-',
          formatDateID(item.date),
          `${item.startTime || '--:--'} - ${item.endTime || '--:--'}`,
          item.pic?.fullName ?? '-',
          formatReportStatus(item.status),
        ]),
        [8, 42, 24, 24, 18, 26, 26]
      );

      // Sheet 3: Rekap Content Plan
      addOfficialSheet(
        'Rekap Content Plan',
        'Laporan Rekapitulasi Rencana Konten (Content Plan)',
        ['No', 'Judul Rencana Konten', 'Jenis Format', 'Platform Publikasi', 'Deadline Publish', 'PIC Kreator', 'Status Konten'],
        filteredContentPlans.map((item, idx) => [
          idx + 1,
          item.title,
          item.contentType || '-',
          item.platform || '-',
          item.deadline ? formatDateID(item.deadline) : '-',
          item.pic?.fullName ?? '-',
          formatReportStatus(item.status),
        ]),
        [8, 42, 22, 22, 24, 26, 26]
      );

      // Sheet 4: Rekap Peminjaman
      addOfficialSheet(
        'Rekap Peminjaman',
        'Laporan Rekapitulasi Peminjaman Inventaris Alat',
        ['No', 'Nama Peminjam', 'Rincian Inventaris Alat', 'Tanggal Pinjam', 'Tanggal Kembali', 'Status Peminjaman'],
        filteredLoans.map((item, idx) => [
          idx + 1,
          item.borrowerName,
          getLoanItemNames(item),
          formatDateID(item.borrowDate),
          item.returnDate ? formatDateID(item.returnDate) : 'Belum Kembali',
          formatReportStatus(item.status),
        ]),
        [8, 28, 44, 24, 24, 26]
      );

      // Sheet 5: Rekap Pengguna
      addOfficialSheet(
        'Rekap Pengguna',
        'Laporan Rekapitulasi Data Personel & Pengguna Sistem',
        ['No', 'Nama Lengkap Personel', 'Username', 'Alamat Email Resmi', 'Peran / Jabatan', 'Status Akun'],
        filteredUsers.map((item, idx) => [
          idx + 1,
          item.fullName,
          item.username,
          item.email,
          item.roleLabel,
          item.isActive ? 'Aktif' : 'Nonaktif',
        ]),
        [8, 34, 22, 34, 26, 18]
      );

      // Sheet 6: Evaluasi Kinerja
      addOfficialSheet(
        'Evaluasi Kinerja',
        'Laporan Evaluasi Kinerja Anggota Tim Kehumasan',
        ['Peringkat', 'Nama Lengkap Anggota', 'Username', 'Total Kegiatan', 'Total Hadir', 'Tepat Waktu', 'Terlambat', '% Kehadiran', 'Dokumentasi', 'Content Plan', 'Nilai Kinerja'],
        evaluationData.map((item, idx) => [
          `#${idx + 1}`,
          item.fullName,
          `@${item.username}`,
          item.totalKegiatan,
          item.totalCheckin,
          item.totalTepatWaktu,
          item.totalTerlambat,
          `${item.persenKehadiran}%`,
          item.totalDokumentasi,
          item.totalContentPlan,
          `${item.nilaiKinerja} / 100`,
        ]),
        [12, 32, 20, 16, 16, 16, 16, 16, 16, 16, 18]
      );

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Laporan-PRIMA-Polinela-${startDate}-sd-${endDate}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Laporan Excel (.xlsx) resmi berhasil diunduh!');
    } catch (err) {
      console.error(err);
      toast.error('Gagal membuat file Excel.');
    }
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
    getLoanItemNames(item).toLowerCase().includes(searchQuery.toLowerCase())
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
          <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" /> {item.startTime} - {item.endTime} WIB</p>
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
          <span className="text-[10px] bg-blue-50 text-[#003D58] border border-blue-200 font-bold px-1.5 py-0.5 rounded mt-1 inline-block">{item.contentType}</span>
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
      render: (item) => <span className="text-xs font-semibold text-slate-700">{getLoanItemNames(item)}</span>,
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
          item.roleLabel.includes('Admin') ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-blue-50 text-[#003D58] border border-blue-200'
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
    printHeaders = ['No', 'Judul Kegiatan Peliputan', 'Kategori', 'Tanggal & Waktu Pelaksanaan', 'PIC Lapangan', 'Status Kegiatan'];
    printRows = filteredActivities.map((item, idx) => [
      idx + 1,
      item.title,
      item.category || '-',
      `${formatDateID(item.date)} (${item.startTime || '--:--'} - ${item.endTime || '--:--'} WIB)`,
      item.pic?.fullName ?? '-',
      formatReportStatus(item.status),
    ]);
  } else if (activeTab === 'content-plans') {
    printHeaders = ['No', 'Judul Rencana Konten', 'Jenis Format', 'Platform', 'Deadline Publish', 'PIC Kreator', 'Status Konten'];
    printRows = filteredContentPlans.map((item, idx) => [
      idx + 1,
      item.title,
      item.contentType || '-',
      item.platform || '-',
      item.deadline ? formatDateID(item.deadline) : '-',
      item.pic?.fullName ?? '-',
      formatReportStatus(item.status),
    ]);
  } else if (activeTab === 'loans') {
    printHeaders = ['No', 'Nama Peminjam', 'Rincian Inventaris Alat', 'Tanggal Pinjam', 'Tanggal Kembali', 'Status Peminjaman'];
    printRows = filteredLoans.map((item, idx) => [
      idx + 1,
      item.borrowerName,
      getLoanItemNames(item),
      formatDateID(item.borrowDate),
      item.returnDate ? formatDateID(item.returnDate) : 'Belum Kembali',
      formatReportStatus(item.status),
    ]);
  } else if (activeTab === 'users') {
    printHeaders = ['No', 'Nama Lengkap Personel', 'Username', 'Alamat Email Resmi', 'Peran / Jabatan', 'Status Akun'];
    printRows = filteredUsers.map((item, idx) => [
      idx + 1,
      item.fullName,
      item.username,
      item.email,
      item.roleLabel,
      item.isActive ? 'Aktif' : 'Nonaktif',
    ]);
  } else if (activeTab === 'evaluasi') {
    printHeaders = ['Peringkat', 'Nama Lengkap Anggota', 'Username', 'Kegiatan', 'Hadir', 'Tepat Waktu', 'Terlambat', '% Kehadiran', 'Dok.', 'Konten', 'Nilai Kinerja'];
    printRows = evaluationData.map((item, idx) => [
      `#${idx + 1}`,
      item.fullName,
      `@${item.username}`,
      item.totalKegiatan,
      item.totalCheckin,
      item.totalTepatWaktu,
      item.totalTerlambat,
      `${item.persenKehadiran}%`,
      item.totalDokumentasi,
      item.totalContentPlan,
      `${item.nilaiKinerja} / 100`,
    ]);
  } else {
    printHeaders = ['No', 'Indikator Kinerja Kehumasan', 'Total Kumulatif Sistem', 'Data Periode Laporan', 'Keterangan Operasional'];
    printRows = [
      [1, 'Kegiatan Peliputan & Dokumentasi Humas', `${stats.totalActivities} Agenda`, `${filteredActivities.length} Agenda`, 'Agenda peliputan kehumasan resmi'],
      [2, 'Perencanaan & Publikasi Konten (Content Plan)', `${stats.totalContentPlans} Konten`, `${filteredContentPlans.length} Konten`, 'Produksi konten media sosial & website'],
      [3, 'Peminjaman Inventaris Peralatan', `${stats.activeLoans} Sesi Aktif`, `${filteredLoans.length} Transaksi`, 'Pemakaian perangkat operasional liputan'],
      [4, 'Personel & Kru Humas Terdaftar', `${stats.totalUsers} Personel`, `${evaluationData.length} Anggota Tim`, 'Total kru kehumasan terdaftar pada Sistem PRIMA'],
    ];
  }

  const printReportTitleMap: Record<string, string> = {
    summary: 'LAPORAN REKAPITULASI EKSEKUTIF KEHUMASAN',
    kegiatan: 'LAPORAN REKAPITULASI KEGIATAN PELIPUTAN HUMAS',
    'content-plans': 'LAPORAN REKAPITULASI RENCANA KONTEN (CONTENT PLAN)',
    loans: 'LAPORAN REKAPITULASI PEMINJAMAN INVENTARIS ALAT',
    users: 'LAPORAN REKAPITULASI DATA PERSONEL & PENGGUNA SISTEM',
    evaluasi: 'LAPORAN EVALUASI KINERJA ANGGOTA TIM KEHUMASAN',
  };

  return (
    <AdminLayout title="Laporan & Analisis Statistik Kehumasan">
      {/* Printable Area - Hidden on Screen */}
      <div className="hidden print:block font-serif text-black p-8 bg-white" style={{ minWidth: '800px' }}>
        {/* Kop Surat Resmi dengan Logo Polinela (Kiri) & Logo PRIMA (Kanan) */}
        <div className="flex items-center justify-between gap-6 border-b-4 border-double border-[#003D58] pb-4 mb-6">
          <img
            src="/logo-polinela.png"
            alt="Logo Politeknik Negeri Lampung"
            className="w-20 h-20 object-contain shrink-0"
          />
          <div className="text-center flex-1">
            <h2 className="text-xs font-bold tracking-wide uppercase text-slate-800">
              KEMENTERIAN PENDIDIKAN TINGGI, SAINS, DAN TEKNOLOGI
            </h2>
            <h1 className="text-lg font-extrabold tracking-wide uppercase text-[#003D58] mt-0.5">
              POLITEKNIK NEGERI LAMPUNG
            </h1>
            <h3 className="text-sm font-bold tracking-wide uppercase text-slate-900 mt-0.5">
              UPT HUBUNGAN MASYARAKAT DAN KERJASAMA — SISTEM INFORMASI PRIMA
            </h3>
            <p className="text-[10px] text-slate-600 mt-1">
              Jl. Soekarno Hatta No. 10, Rajabasa Raya, Kec. Rajabasa, Kota Bandar Lampung, Lampung 35144
            </p>
            <p className="text-[10px] text-slate-600">
              Telepon: (0721) 703995 | Faksimile: (0721) 787309 | Laman: www.polinela.ac.id | Email: humas@polinela.ac.id
            </p>
          </div>
          <img
            src="/logo-prima.png"
            alt="Logo PRIMA Humas Polinela"
            className="w-20 h-20 object-contain shrink-0"
          />
        </div>

        {/* Title */}
        <div className="text-center space-y-1 mb-6">
          <h2 className="text-base font-bold underline uppercase text-[#003D58]">
            {printReportTitleMap[activeTab] || 'LAPORAN REKAPITULASI KEHUMASAN'}
          </h2>
          <p className="text-xs">
            Periode Laporan: <strong>{formatDateID(startDate)}</strong> s.d. <strong>{formatDateID(endDate)}</strong>
          </p>
          <p className="text-[10px] text-slate-500">
            Dicetak pada: {new Date().toLocaleDateString('id-ID', { dateStyle: 'long' })}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-4 gap-4 border border-slate-400 rounded-lg p-3.5 mb-6 text-center text-xs bg-slate-50">
          <div>
            <p className="font-semibold text-slate-600">Total Kegiatan Diliput</p>
            <p className="text-base font-bold text-[#003D58] mt-1">{stats.totalActivities} Agenda</p>
          </div>
          <div>
            <p className="font-semibold text-slate-600">Rencana Konten Humas</p>
            <p className="text-base font-bold text-[#003D58] mt-1">{stats.totalContentPlans} Konten</p>
          </div>
          <div>
            <p className="font-semibold text-slate-600">Peminjaman Inventaris</p>
            <p className="text-base font-bold text-[#003D58] mt-1">{stats.activeLoans} Sesi</p>
          </div>
          <div>
            <p className="font-semibold text-slate-600">Personel Kru Humas</p>
            <p className="text-base font-bold text-[#003D58] mt-1">{stats.totalUsers} Personel</p>
          </div>
        </div>

        {/* Data Table */}
        <table className="w-full text-xs border-collapse border border-slate-400 mb-10">
          <thead>
            <tr className="bg-[#003D58] text-white">
              {printHeaders.map((hdr) => (
                <th key={hdr} className="border border-slate-400 p-2.5 text-left font-bold">
                  {hdr}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {printRows.length === 0 ? (
              <tr>
                <td colSpan={printHeaders.length} className="border border-slate-300 p-4 text-center italic">
                  Tidak ada data rekapitulasi untuk periode ini.
                </td>
              </tr>
            ) : (
              printRows.map((row, idx) => (
                <tr key={idx} className={idx % 2 === 1 ? 'bg-slate-50' : 'bg-white'}>
                  {row.map((cell: any, cellIdx: number) => (
                    <td key={cellIdx} className="border border-slate-300 p-2">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Screen Layout - Hidden on Print */}
      <div className="print:hidden space-y-5">
        {/* Unified Filters, Shortcut Buttons & Export Control Bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3 flex-1">
            <CustomDatePicker
              label="Tanggal Mulai"
              value={startDate}
              onChange={(val) => setStartDate(val)}
              className="w-full sm:w-56"
            />
            <CustomDatePicker
              label="Tanggal Selesai"
              value={endDate}
              onChange={(val) => setEndDate(val)}
              className="w-full sm:w-56"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => applyShortcut('hari')}
              className="h-[38px] px-3.5 rounded-lg border border-[#E2E8F0] hover:border-[#003D58] text-[12px] font-bold text-[#475569] hover:text-[#003D58] bg-white hover:bg-blue-50/50 shadow-2xs transition-all cursor-pointer flex items-center justify-center"
            >
              Hari Ini
            </button>
            <button
              type="button"
              onClick={() => applyShortcut('minggu')}
              className="h-[38px] px-3.5 rounded-lg border border-[#E2E8F0] hover:border-[#003D58] text-[12px] font-bold text-[#475569] hover:text-[#003D58] bg-white hover:bg-blue-50/50 shadow-2xs transition-all cursor-pointer flex items-center justify-center"
            >
              Minggu Ini
            </button>
            <button
              type="button"
              onClick={() => applyShortcut('bulan')}
              className="h-[38px] px-3.5 rounded-lg border border-[#E2E8F0] hover:border-[#003D58] text-[12px] font-bold text-[#475569] hover:text-[#003D58] bg-white hover:bg-blue-50/50 shadow-2xs transition-all cursor-pointer flex items-center justify-center"
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => applyShortcut('tahun')}
              className="h-[38px] px-3.5 rounded-lg border border-[#E2E8F0] hover:border-[#003D58] text-[12px] font-bold text-[#475569] hover:text-[#003D58] bg-white hover:bg-blue-50/50 shadow-2xs transition-all cursor-pointer flex items-center justify-center"
            >
              Tahun Ini
            </button>

            <div className="hidden sm:block w-px h-6 bg-slate-200 mx-1" />

            {/* EXPORT Dropdown */}
            <div className="relative" ref={exportMenuRef}>
              <button
                type="button"
                onClick={() => setIsExportOpen((prev) => !prev)}
                className="inline-flex items-center justify-center gap-2 whitespace-nowrap h-[38px] px-4 rounded-xl bg-[#003D58] hover:bg-[#002F44] active:bg-[#00263A] text-white text-xs font-bold shadow-xs shadow-[#003D58]/20 transition-all cursor-pointer"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>Export Data</span>
                <ChevronDown
                  className={`w-4 h-4 shrink-0 transition-transform duration-200 ${
                    isExportOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isExportOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden">
                  <div className="px-3.5 py-2 border-b border-slate-100 bg-slate-50/70">
                    <p className="text-[11px] font-bold text-[#003D58] uppercase tracking-wider">
                      Pilih Format Laporan Resmi
                    </p>
                    <p className="text-[10px] text-slate-400">
                      Dilengkapi Kop Surat Polinela &amp; Logo PRIMA
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportOpen(false);
                      handleExportPDF();
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs text-slate-700 hover:bg-sky-50/70 transition-colors flex items-start gap-2.5 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Unduh Laporan PDF (.pdf)</p>
                      <p className="text-[10px] text-slate-500">Dokumen resmi berlogo Polinela &amp; PRIMA</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsExportOpen(false);
                      handleExportExcel();
                    }}
                    className="w-full text-left px-3.5 py-2.5 text-xs text-slate-700 hover:bg-emerald-50/60 transition-colors flex items-start gap-2.5 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                      <FileSpreadsheet className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Export Excel (.xlsx)</p>
                      <p className="text-[10px] text-slate-500">Rekap lengkap 6 sheet berlogo resmi</p>
                    </div>
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    type="button"
                    onClick={handlePrintReport}
                    className="w-full text-left px-3.5 py-2.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors flex items-start gap-2.5 cursor-pointer"
                  >
                    <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#003D58] border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Printer className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">Cetak Dokumen (Print)</p>
                      <p className="text-[10px] text-slate-500">Cetak langsung halaman laporan aktif</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('summary')}
            className={`px-6 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'summary'
                ? 'border-[#003D58] text-[#003D58] bg-blue-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <BarChart3 className="w-4 h-4" /> Ringkasan Eksekutif
          </button>
          <button
            onClick={() => setActiveTab('kegiatan')}
            className={`px-6 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'kegiatan'
                ? 'border-[#003D58] text-[#003D58] bg-blue-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Calendar className="w-4 h-4" /> Rekap Kegiatan
          </button>
          <button
            onClick={() => setActiveTab('content-plans')}
            className={`px-6 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'content-plans'
                ? 'border-[#003D58] text-[#003D58] bg-blue-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-4 h-4" /> Rekap Content Plan
          </button>
          <button
            onClick={() => setActiveTab('loans')}
            className={`px-6 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'loans'
                ? 'border-[#003D58] text-[#003D58] bg-blue-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4" /> Rekap Peminjaman
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'users'
                ? 'border-[#003D58] text-[#003D58] bg-blue-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-4 h-4" /> Rekap Pengguna
          </button>
          <button
            onClick={() => setActiveTab('evaluasi')}
            className={`px-6 py-3 text-xs sm:text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
              activeTab === 'evaluasi'
                ? 'border-[#003D58] text-[#003D58] bg-blue-50/40'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Trophy className="w-4 h-4" /> Evaluasi Anggota
          </button>
        </div>

        {/* Render Tab Contents */}
        {loading ? (
          <TableSkeleton statsCount={4} rows={5} />
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
                    iconBgClass="bg-blue-50"
                    iconColorClass="text-[#003D58]"
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
                        <div className="w-14 h-14 rounded-full bg-slate-200 border-4 border-slate-300 flex items-center justify-center text-slate-500 mb-2">
                          {evaluationData[1]?.avatar ? (
                            <img src={evaluationData[1].avatar} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <User className="w-7 h-7 text-slate-400" />
                          )}
                        </div>
                        <div className="bg-slate-100 border border-slate-300 rounded-2xl px-4 pt-3 pb-2 text-center w-36 h-28 flex flex-col items-center justify-between">
                          <p className="text-xs font-bold text-slate-700 truncate w-full text-center">{evaluationData[1]?.fullName}</p>
                          <p className="text-2xl font-black text-slate-600">{evaluationData[1]?.nilaiKinerja}<span className="text-xs">%</span></p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-500">
                            <Medal className="w-3.5 h-3.5 text-slate-400" /> Peringkat 2
                          </span>
                        </div>
                      </div>
                      {/* 1st Place */}
                      <div className="flex flex-col items-center -mt-4">
                        <Crown className="w-8 h-8 text-amber-400 mb-1 drop-shadow-sm" />
                        <div className="w-16 h-16 rounded-full bg-amber-100 border-4 border-amber-400 flex items-center justify-center text-amber-600 mb-2">
                          {evaluationData[0]?.avatar ? (
                            <img src={evaluationData[0].avatar} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <User className="w-8 h-8 text-amber-500" />
                          )}
                        </div>
                        <div className="bg-gradient-to-b from-amber-400 to-amber-500 border border-amber-600 rounded-2xl px-4 pt-3 pb-2 text-center w-40 h-32 flex flex-col items-center justify-between shadow-lg">
                          <p className="text-xs font-bold text-white truncate w-full text-center">{evaluationData[0]?.fullName}</p>
                          <p className="text-3xl font-black text-white">{evaluationData[0]?.nilaiKinerja}<span className="text-sm">%</span></p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-100">
                            <Trophy className="w-3.5 h-3.5 text-amber-200" /> Peringkat 1
                          </span>
                        </div>
                      </div>
                      {/* 3rd Place */}
                      <div className="flex flex-col items-center">
                        <div className="w-14 h-14 rounded-full bg-orange-100 border-4 border-orange-300 flex items-center justify-center text-orange-600 mb-2">
                          {evaluationData[2]?.avatar ? (
                            <img src={evaluationData[2].avatar} className="w-full h-full rounded-full object-cover" />
                          ) : (
                            <User className="w-7 h-7 text-orange-400" />
                          )}
                        </div>
                        <div className="bg-orange-50 border border-orange-200 rounded-2xl px-4 pt-3 pb-2 text-center w-36 h-24 flex flex-col items-center justify-between">
                          <p className="text-xs font-bold text-orange-700 truncate w-full text-center">{evaluationData[2]?.fullName}</p>
                          <p className="text-2xl font-black text-orange-600">{evaluationData[2]?.nilaiKinerja}<span className="text-xs">%</span></p>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-orange-500">
                            <Medal className="w-3.5 h-3.5 text-orange-400" /> Peringkat 3
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bar Chart */}
                {evaluationData.length > 0 && (
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
                    <h3 className="text-sm font-bold text-slate-800 mb-1 flex items-center gap-2">
                      <BarChart2 className="w-4 h-4 text-[#003D58]" /> Grafik Nilai Kinerja Seluruh Anggota
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
                                <span className={`inline-flex items-center gap-1 font-black text-xs ${
                                  idx === 0 ? 'text-amber-500 font-bold' :
                                  idx === 1 ? 'text-slate-500 font-bold' :
                                  idx === 2 ? 'text-orange-500 font-bold' : 'text-slate-500'
                                }`}>
                                  {idx === 0 ? (
                                    <>
                                      <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                                      <span>#1</span>
                                    </>
                                  ) : idx === 1 ? (
                                    <>
                                      <Medal className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                      <span>#2</span>
                                    </>
                                  ) : idx === 2 ? (
                                    <>
                                      <Medal className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                                      <span>#3</span>
                                    </>
                                  ) : (
                                    `#${idx + 1}`
                                  )}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-[#003D58] shrink-0">
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
                                <span className="text-[#003D58] font-bold">{item.totalTepatWaktu}</span>
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
                  <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
                    <Info className="w-4 h-4 text-[#003D58]" /> Keterangan Formula Evaluasi
                  </p>
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
                    <p className="text-xs text-slate-600">
                      Menampilkan data valid sesuai filter aktif.
                    </p>
                  </div>

                  <div className="w-full sm:w-72 relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      aria-label="Cari kata kunci"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari kata kunci..."
                      className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#003D58]/20 focus:border-[#003D58] transition-all font-medium"
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
