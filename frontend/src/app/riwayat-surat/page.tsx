'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  StatCard,
  DataTable,
  Column,
  StatusBadge,
  SearchBox,
  FilterDropdown,
  PaginationBar,
  CustomModal,
  TableSkeleton,
} from '@/components/common';
import {
  Mail,
  Eye,
  FileText,
  Calendar,
  Building,
  CalendarCheck2,
  ExternalLink,
  Clock,
  CheckCircle2,
  Archive,
  Download,
  MapPin,
  ArrowRight,
} from 'lucide-react';
import { IncomingLetter } from '@/types';
import { formatDateID } from '@/utils/formatters';
import { toast } from 'sonner';
import { incomingLetterService } from '@/services';
import { getStoredUser } from '@/utils/session';
import { getFileViewUrl } from '@/utils/api-helpers';

export default function RiwayatSuratPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [letters, setLetters] = useState<IncomingLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Modals
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<IncomingLetter | null>(null);

  const loadHistoryLetters = async () => {
    setLoading(true);
    try {
      const data = await incomingLetterService.getAll();
      const all = Array.isArray(data) ? data : [];
      setLetters(all);
    } catch {
      toast.error('Gagal memuat arsip riwayat surat masuk.');
      setLetters([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const user = getStoredUser();
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      toast.error('Akses ditolak. Riwayat Surat hanya dapat diakses Admin & Kepala Humas.');
      router.push('/dashboard');
      return;
    }
    setCurrentUser(user);
    loadHistoryLetters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Filtered dataset: Riwayat comprises letters that are DISETUJUI, DITUGASKAN, SELESAI, or DITOLAK
  const historyList = letters.filter((l) =>
    l.status === 'DISETUJUI' ||
    l.status === 'DITUGASKAN' ||
    l.status === 'SELESAI' ||
    l.status === 'DITOLAK'
  );

  const filteredLetters = historyList.filter((item) => {
    const matchSearch =
      (item.letterNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sender || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.institution || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.eventLocation || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  const totalPages = Math.ceil(filteredLetters.length / itemsPerPage);
  const paginatedLetters = filteredLetters.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Statistics
  const countApproved = historyList.filter((l) => l.status === 'DISETUJUI').length;
  const countAssigned = historyList.filter((l) => l.status === 'DITUGASKAN').length;
  const countFinished = historyList.filter((l) => l.status === 'SELESAI').length;

  const handleExportCSV = () => {
    if (filteredLetters.length === 0) {
      toast.error('Tidak ada data surat untuk diekspor.');
      return;
    }
    const headers = ['No', 'Nomor Surat', 'Tanggal Surat', 'Pengirim', 'Instansi', 'Perihal', 'Status', 'Lokasi Acara'];
    const rows = filteredLetters.map((l, idx) => [
      idx + 1,
      `"${l.letterNumber.replace(/"/g, '""')}"`,
      `"${formatDateID(l.letterDate.split('T')[0])}"`,
      `"${(l.sender || '').replace(/"/g, '""')}"`,
      `"${(l.institution || '').replace(/"/g, '""')}"`,
      `"${(l.subject || '').replace(/"/g, '""')}"`,
      `"${l.status}"`,
      `"${(l.eventLocation || '-').replace(/"/g, '""')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `riwayat-surat-humas-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Rekap riwayat surat berhasil diekspor ke CSV.');
  };

  const columns: Column<IncomingLetter>[] = [
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
      key: 'letterNumber',
      header: 'No. Surat & Tanggal',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-800 font-mono text-xs">{item.letterNumber}</p>
          <p className="text-[11px] text-slate-400 font-medium mt-0.5">
            Terbit: {formatDateID(item.letterDate.split('T')[0])}
          </p>
        </div>
      ),
    },
    {
      key: 'sender',
      header: 'Pengirim & Instansi',
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs">{item.sender}</p>
          <p className="text-[11px] text-slate-500">{item.institution}</p>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Perihal Surat',
      render: (item) => (
        <span className="text-slate-700 text-xs font-medium truncate max-w-[200px] block" title={item.subject}>
          {item.subject}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status Persetujuan',
      render: (item) => (
        <div className="space-y-1">
          <StatusBadge status={item.status} />
          {item.status === 'DISETUJUI' && (
            <span className="block text-[10px] text-emerald-700 font-semibold">
              Disetujui Kepala Humas
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'activities',
      header: 'Tindak Lanjut Peliputan',
      render: (item) => {
        if (!item.activities || item.activities.length === 0) {
          if (item.status === 'DISETUJUI') {
            return (
              <span className="text-[11px] text-amber-600 font-medium italic">
                Belum diagendakan
              </span>
            );
          }
          return <span className="text-xs text-slate-400 italic">Tanpa agenda</span>;
        }
        return (
          <div className="space-y-1">
            {item.activities.map((act) => (
              <Link
                key={act.id}
                href={`/kegiatan/${act.id}`}
                className="text-[11px] font-semibold text-[#003D58] hover:text-[#002f44] hover:underline flex items-center gap-1 truncate max-w-[180px]"
                title={act.title}
              >
                <CalendarCheck2 className="w-3 h-3 shrink-0 text-[#35C6D4]" />
                <span className="truncate">{act.title}</span>
              </Link>
            ))}
          </div>
        );
      },
    },
    {
      key: 'action',
      header: 'Detail',
      render: (item) => (
        <div className="flex items-center justify-end">
          <button
            onClick={() => {
              setSelectedLetter(item);
              setIsDetailOpen(true);
            }}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Lihat Detail Riwayat Surat"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
      className: 'text-right',
    },
  ];

  if (loading) {
    return (
      <AdminLayout title="Riwayat Surat Masuk Humas">
        <TableSkeleton statsCount={3} rows={5} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Riwayat Surat Masuk Humas">
      <div className="space-y-5">
        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <StatCard
            title="Total Riwayat Surat"
            value={historyList.length}
            subtitle="Arsip surat masuk tercatat"
            icon={Mail}
            iconBgClass="bg-sky-50"
            iconColorClass="text-[#003D58]"
          />
          <StatCard
            title="Disetujui Kepala Humas"
            value={countApproved}
            subtitle="Telah disetujui & siap diagendakan"
            icon={CheckCircle2}
            iconBgClass="bg-emerald-50"
            iconColorClass="text-emerald-600"
          />
          <StatCard
            title="Ditugaskan Jadi Kegiatan"
            value={countAssigned}
            subtitle="Terhubung ke tim peliputan"
            icon={CalendarCheck2}
            iconBgClass="bg-blue-50"
            iconColorClass="text-[#003D58]"
          />
          <StatCard
            title="Selesai & Diarsipkan"
            value={countFinished}
            subtitle="Tindak lanjut selesai paripurna"
            icon={Archive}
            iconBgClass="bg-slate-100"
            iconColorClass="text-slate-700"
          />
        </div>

        {/* Header & Filter Card (Selaras dengan halaman lain) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Arsip Riwayat Surat Masuk</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Daftar riwayat surat masuk yang telah diproses, disetujui, ditugaskan, atau ditolak.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <button
                onClick={handleExportCSV}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                title="Ekspor Arsip ke CSV"
              >
                <Download className="w-4 h-4 text-slate-500" />
                <span>Ekspor CSV</span>
              </button>
              {currentUser?.role !== 'SUPER_ADMIN' && (
                <Link
                  href="/surat-masuk"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#003D58] hover:bg-[#002f44] text-white text-xs font-semibold shadow-xs transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  <span>Surat Masuk Aktif</span>
                </Link>
              )}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <SearchBox
              value={searchQuery}
              onChange={(val) => {
                setSearchQuery(val);
                setCurrentPage(1);
              }}
              placeholder="Cari arsip nomor surat / pengirim / perihal..."
              className="w-full sm:w-80 md:w-96"
            />
            <FilterDropdown
              placeholder="Semua Status Riwayat"
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { label: 'Disetujui Kepala Humas', value: 'DISETUJUI' },
                { label: 'Ditugaskan Peliputan', value: 'DITUGASKAN' },
                { label: 'Selesai & Diarsipkan', value: 'SELESAI' },
                { label: 'Ditolak', value: 'DITOLAK' },
              ]}
              className="w-full sm:w-56"
            />
          </div>
        </div>

        {/* Main Table Card */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <DataTable
            columns={columns}
            data={paginatedLetters}
            emptyMessage="Belum ada arsip riwayat surat masuk yang tersimpan. Surat yang telah disetujui akan otomatis tampil di sini."
          />

          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredLetters.length}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Detail Riwayat Surat Modal */}
      <CustomModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Arsip Riwayat Surat Masuk"
        subtitle={selectedLetter ? `Nomor Surat: ${selectedLetter.letterNumber}` : undefined}
        maxWidth="2xl"
      >
        {selectedLetter && (
          <div className="space-y-4 text-xs font-['Poppins']">
            {/* Status & Received info */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500">Status Arsip:</span>
                <StatusBadge status={selectedLetter.status} />
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 font-medium text-xs">
                <CalendarCheck2 className="w-4 h-4 text-[#003D58] shrink-0" />
                <span>Diterima: <strong>{formatDateID(selectedLetter.receivedDate.split('T')[0])}</strong></span>
              </div>
            </div>

            {/* Perihal Card */}
            <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-[#003D58] text-[11px] font-bold uppercase tracking-wider mb-1.5">
                <FileText className="w-4 h-4 text-[#003D58]" />
                <span>Perihal Surat</span>
              </div>
              <h4 className="text-sm font-bold text-slate-900 leading-snug">
                {selectedLetter.subject}
              </h4>
            </div>

            {/* Core Info */}
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 p-3.5 gap-4 bg-slate-50/40">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Nomor Surat
                  </span>
                  <span className="font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-md inline-block shadow-2xs">
                    {selectedLetter.letterNumber}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Tujuan Surat
                  </span>
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-[#003D58] shrink-0" />
                    {selectedLetter.destination || 'Kepala Bagian Humas Polinela'}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 p-3.5 gap-4">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Pengirim Surat
                  </span>
                  <span className="font-semibold text-slate-800 text-sm block">
                    {selectedLetter.sender}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Instansi Asal
                  </span>
                  <span className="font-semibold text-slate-800 text-sm block">
                    {selectedLetter.institution}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 p-3.5 gap-4 bg-slate-50/40">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Tanggal Surat Terbit
                  </span>
                  <span className="font-medium text-slate-700 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    {formatDateID(selectedLetter.letterDate.split('T')[0])}
                  </span>
                </div>
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block mb-1">
                    Tanggal Diterima Humas
                  </span>
                  <span className="font-medium text-slate-700 flex items-center gap-1.5">
                    <CalendarCheck2 className="w-3.5 h-3.5 text-[#003D58] shrink-0" />
                    {formatDateID(selectedLetter.receivedDate.split('T')[0])}
                  </span>
                </div>
              </div>
            </div>

            {/* Lokasi & Pelaksanaan */}
            {(selectedLetter.eventLocation || selectedLetter.eventDate) && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2.5">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <MapPin className="w-4 h-4 text-[#003D58] shrink-0" />
                  <span>Jadwal &amp; Lokasi yang Dimohonkan</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Lokasi Acara:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedLetter.eventLocation || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Waktu:</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      {selectedLetter.eventDate ? formatDateID(selectedLetter.eventDate.split('T')[0]) : '-'}
                      {(selectedLetter.startTime || selectedLetter.endTime) && (
                        <span className="text-slate-600 font-normal">
                          • {selectedLetter.startTime || '--:--'} s/d {selectedLetter.endTime || 'Selesai'}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Catatan / Alasan Penolakan */}
            {selectedLetter.notes && (
              <div className={`border rounded-xl p-3.5 text-xs ${selectedLetter.status === 'DITOLAK'
                  ? 'bg-red-50/70 border-red-200 text-red-900'
                  : 'bg-amber-50/70 border-amber-200 text-amber-900'
                }`}>
                <span className="text-[11px] font-bold uppercase tracking-wider block mb-1">
                  {selectedLetter.status === 'DITOLAK' ? 'Alasan Penolakan Kepala Humas' : 'Catatan / Arahan Tambahan'}
                </span>
                <p className="leading-relaxed font-medium whitespace-pre-line">
                  {selectedLetter.notes}
                </p>
              </div>
            )}

            {/* Lampiran Berkas File */}
            {selectedLetter.fileUrl ? (
              <a
                href={getFileViewUrl(selectedLetter.fileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-xl bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50/40 transition-all flex items-center justify-between gap-3 group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#003D58] flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-[#003D58]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-[#003D58] transition-colors truncate">
                      Berkas Surat Digital Resmi
                    </p>
                    <p className="text-[11px] text-slate-400 truncate max-w-sm">
                      Klik untuk melihat dokumen lampiran asli
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#003D58] px-3.5 py-1.5 rounded-full shadow-xs shrink-0">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka Berkas</span>
                </div>
              </a>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                Tidak ada berkas digital yang dilampirkan.
              </div>
            )}

            {/* Kegiatan Terkait */}
            {selectedLetter.activities && selectedLetter.activities.length > 0 && (
              <div className="space-y-2 pt-1">
                <p className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <CalendarCheck2 className="w-4 h-4 text-[#003D58] shrink-0" />
                  Agenda Kegiatan Peliputan yang Dihasilkan
                </p>
                <div className="space-y-2">
                  {selectedLetter.activities.map((act) => (
                    <div
                      key={act.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition-colors"
                    >
                      <div>
                        <p className="font-bold text-xs text-slate-800">{act.title}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Pelaksanaan: {formatDateID(act.date.split('T')[0])}
                        </p>
                      </div>
                      <Link
                        href={`/kegiatan/${act.id}`}
                        className="text-xs font-bold text-[#003D58] hover:underline flex items-center gap-1"
                      >
                        <span>Lihat Kegiatan</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Modal Actions Footer */}
            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        )}
      </CustomModal>
    </AdminLayout>
  );
}
