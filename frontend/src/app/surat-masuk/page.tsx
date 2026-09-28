'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  StatCard,
  DataTable,
  Column,
  StatusBadge,
  SearchBox,
  FilterDropdown,
  CustomButton,
  CustomModal,
  PaginationBar,
} from '@/components/common';
import DashboardSkeleton from '@/components/common/DashboardSkeleton';
import {
  Mail,
  Plus,
  Eye,
  Edit3,
  Trash2,
  Calendar,
  Building,
  FileText,
  CalendarCheck2,
  ExternalLink,
  AlertTriangle,
  Clock,
  CheckCircle2,
} from 'lucide-react';
import { IncomingLetter } from '@/types';
import { formatDateID } from '@/utils/formatters';
import { toast } from 'sonner';
import { incomingLetterService } from '@/services';
import { getStoredUser } from '@/utils/session';

export default function IncomingLettersPage() {
  const router = useRouter();
  const [letters, setLetters] = useState<IncomingLetter[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isCreateActivityOpen, setIsCreateActivityOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<IncomingLetter | null>(null);

  // Letter Form State
  const [letterForm, setLetterForm] = useState({
    letterNumber: '',
    letterDate: new Date().toISOString().split('T')[0],
    receivedDate: new Date().toISOString().split('T')[0],
    sender: '',
    institution: '',
    subject: '',
    destination: 'Kepala Bagian Humas Polinela',
    fileUrl: '',
    notes: '',
    status: 'MENUNGGU_VERIFIKASI_ADMIN',
    eventLocation: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    latitude: '',
    longitude: '',
    radius: '100',
  });

  // Activity from Letter Form State
  const [activityForm, setActivityForm] = useState({
    title: '',
    category: 'Liputan Eksternal',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '16:00',
    location: '',
    description: '',
  });

  const loadLetters = async () => {
    try {
      const data = await incomingLetterService.getAll();
      setLetters(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Gagal memuat data surat masuk dari server.');
      setLetters([]);
    }
  };

  useEffect(() => {
    const user = getStoredUser();
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      toast.error('Akses ditolak. Hanya Admin & Kepala Humas yang dapat mengelola Surat Masuk.');
      router.push('/dashboard');
      return;
    }

    const init = async () => {
      setLoading(true);
      await loadLetters();
      setLoading(false);
    };
    init();
  }, [router]);

  const filteredLetters = letters.filter((item) => {
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

  const handleOpenCreate = () => {
    setLetterForm({
      letterNumber: '',
      letterDate: new Date().toISOString().split('T')[0],
      receivedDate: new Date().toISOString().split('T')[0],
      sender: '',
      institution: '',
      subject: '',
      destination: 'Kepala Bagian Humas Polinela',
      fileUrl: '',
      notes: '',
      status: 'MENUNGGU_VERIFIKASI_ADMIN',
      eventLocation: '',
      eventDate: '',
      startTime: '',
      endTime: '',
      latitude: '',
      longitude: '',
      radius: '100',
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (letter: IncomingLetter) => {
    setSelectedLetter(letter);
    setLetterForm({
      letterNumber: letter.letterNumber,
      letterDate: letter.letterDate.split('T')[0],
      receivedDate: letter.receivedDate.split('T')[0],
      sender: letter.sender,
      institution: letter.institution,
      subject: letter.subject,
      destination: letter.destination,
      fileUrl: letter.fileUrl || '',
      notes: letter.notes || '',
      status: letter.status,
      eventLocation: letter.eventLocation || '',
      eventDate: letter.eventDate ? letter.eventDate.split('T')[0] : '',
      startTime: letter.startTime || '',
      endTime: letter.endTime || '',
      latitude: letter.latitude != null ? String(letter.latitude) : '',
      longitude: letter.longitude != null ? String(letter.longitude) : '',
      radius: letter.radius != null ? String(letter.radius) : '100',
    });
    setIsEditOpen(true);
  };

  const handleOpenCreateActivity = (letter: IncomingLetter) => {
    setSelectedLetter(letter);
    setActivityForm({
      title: `Peliputan: ${letter.subject}`,
      category: 'Liputan Eksternal',
      date: new Date().toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '16:00',
      location: letter.institution,
      description: `Kegiatan tindak lanjut dari Surat Masuk No. ${letter.letterNumber} (${letter.sender} - ${letter.institution}). Perihal: ${letter.subject}.`,
    });
    setIsCreateActivityOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!letterForm.eventLocation.trim()) { toast.error('Lokasi kegiatan wajib diisi.'); return; }
    if (!letterForm.eventDate) { toast.error('Tanggal pelaksanaan wajib diisi.'); return; }
    if (!letterForm.startTime) { toast.error('Jam mulai wajib diisi.'); return; }
    if (letterForm.endTime && letterForm.endTime <= letterForm.startTime) {
      toast.error('Jam selesai tidak boleh lebih awal atau sama dengan jam mulai.');
      return;
    }
    try {
      await incomingLetterService.create({
        ...letterForm,
        status: 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS',
        letterDate: `${letterForm.letterDate}T08:00:00Z`,
        receivedDate: `${letterForm.receivedDate}T08:00:00Z`,
        eventDate: `${letterForm.eventDate}T08:00:00Z`,
      });
      setIsCreateOpen(false);
      toast.success('Surat masuk berhasil dicatat dan diajukan ke Kepala Humas!');
      await loadLetters();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mencatat surat masuk.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLetter) return;
    if (!letterForm.eventLocation.trim()) { toast.error('Lokasi kegiatan wajib diisi.'); return; }
    if (!letterForm.eventDate) { toast.error('Tanggal pelaksanaan wajib diisi.'); return; }
    if (!letterForm.startTime) { toast.error('Jam mulai wajib diisi.'); return; }
    if (letterForm.endTime && letterForm.endTime <= letterForm.startTime) {
      toast.error('Jam selesai tidak boleh lebih awal atau sama dengan jam mulai.');
      return;
    }
    try {
      await incomingLetterService.update(selectedLetter.id, {
        ...letterForm,
        letterDate: `${letterForm.letterDate}T08:00:00Z`,
        receivedDate: `${letterForm.receivedDate}T08:00:00Z`,
        eventDate: `${letterForm.eventDate}T08:00:00Z`,
      });
      setIsEditOpen(false);
      toast.success('Surat masuk berhasil diperbarui!');
      await loadLetters();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui surat masuk.');
    }
  };

  const handleVerifyAdmin = async (letter: IncomingLetter) => {
    if (!confirm(`Verifikasi kelengkapan surat No. ${letter.letterNumber} dan kirim ke Kepala Humas untuk disetujui?`)) return;
    try {
      await incomingLetterService.verifyAdmin(letter.id);
      toast.success('Surat telah diverifikasi dan dikirim ke Kepala Humas!');
      await loadLetters();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memverifikasi surat.');
    }
  };

  const handleActivityFromLetterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLetter) return;
    try {
      const act = await incomingLetterService.createActivity(selectedLetter.id, {
        ...activityForm,
        date: `${activityForm.date}T08:00:00Z`,
      });
      setIsCreateActivityOpen(false);
      toast.success('Kegiatan berhasil dibuat dan dikirim ke Kepala Humas untuk persetujuan!');
      await loadLetters();
      router.push(`/kegiatan/${act.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal membuat kegiatan dari surat.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedLetter) return;
    try {
      await incomingLetterService.remove(selectedLetter.id);
      setIsDeleteOpen(false);
      toast.success('Surat masuk berhasil dihapus.');
      await loadLetters();
    } catch {
      toast.error('Gagal menghapus surat masuk.');
    }
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
          <p className="font-bold text-slate-800">{item.letterNumber}</p>
          <p className="text-[11px] text-slate-400 font-medium">Tgl: {formatDateID(item.letterDate.split('T')[0])}</p>
        </div>
      ),
    },
    {
      key: 'sender',
      header: 'Pengirim & Instansi',
      render: (item) => (
        <div>
          <p className="font-semibold text-slate-800">{item.sender}</p>
          <p className="text-[11px] text-slate-500">{item.institution}</p>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Perihal',
      render: (item) => (
        <span className="text-slate-700 text-xs font-medium truncate max-w-[200px] block" title={item.subject}>
          {item.subject}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status Surat',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'action',
      header: 'Aksi',
      render: (item) => (
        <div className="flex items-center gap-1.5 justify-end">
          <button
            onClick={() => {
              setSelectedLetter(item);
              setIsDetailOpen(true);
            }}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
            title="Lihat Detail"
          >
            <Eye className="w-4 h-4" />
          </button>
          {(item.status === 'BARU' || item.status === 'DRAFT' || item.status === 'MENUNGGU_VERIFIKASI_ADMIN' || item.status === 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS') && (
            <>
              <button
                onClick={() => handleOpenEdit(item)}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                title="Edit Surat"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setSelectedLetter(item);
                  setIsDeleteOpen(true);
                }}
                className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                title="Hapus Surat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
      className: 'text-right',
    },
  ];

  if (loading) {
    return (
      <AdminLayout title="Modul Surat Masuk Humas">
        <DashboardSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Modul Surat Masuk Humas">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
        <StatCard
          title="Total Surat Masuk"
          value={letters.length}
          subtitle="Tercatat dalam sistem"
          icon={Mail}
          iconBgClass="bg-teal-50"
          iconColorClass="text-teal-600"
        />
        <StatCard
          title="Surat Baru / Diproses"
          value={letters.filter((l) => l.status === 'BARU' || l.status === 'DIPROSES').length}
          subtitle="Menunggu tindak lanjut"
          icon={Clock}
          iconBgClass="bg-amber-50"
          iconColorClass="text-amber-600"
        />
        <StatCard
          title="Sudah Ditindaklanjuti"
          value={letters.filter((l) => l.status === 'DITINDAKLANJUTI' || l.status === 'SELESAI').length}
          subtitle="Terhubung dengan kegiatan"
          icon={CheckCircle2}
          iconBgClass="bg-emerald-50"
          iconColorClass="text-emerald-600"
        />
      </div>

      {/* Main Content Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs">
        <div className="p-5 sm:p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <SearchBox
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Cari no. surat / pengirim / perihal..."
              className="w-full sm:w-72"
            />
            <FilterDropdown
              placeholder="Semua Status"
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { label: 'Menunggu Verifikasi', value: 'MENUNGGU_VERIFIKASI_ADMIN' },
                { label: 'Menunggu Persetujuan', value: 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS' },
                { label: 'Disetujui', value: 'DISETUJUI' },
                { label: 'Ditolak', value: 'DITOLAK' },
                { label: 'Ditugaskan', value: 'DITUGASKAN' },
              ]}
              className="w-full sm:w-48"
            />
          </div>
          <CustomButton variant="primary" icon={Plus} onClick={handleOpenCreate}>
            Input Surat Masuk
          </CustomButton>
        </div>

        <DataTable
          columns={columns}
          data={paginatedLetters}
          emptyMessage="Belum ada pencatatan surat masuk."
        />

        <div className="p-4 border-t border-slate-100">
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredLetters.length}
            onPageChange={setCurrentPage}
          />
        </div>
      </div>

      {/* Input / Edit Surat Modal */}
      <CustomModal
        isOpen={isCreateOpen || isEditOpen}
        onClose={() => {
          setIsCreateOpen(false);
          setIsEditOpen(false);
        }}
        title={isEditOpen ? 'Edit Surat Masuk' : 'Input Surat Masuk Baru'}
        maxWidth="lg"
      >
        <form onSubmit={isEditOpen ? handleEditSubmit : handleCreateSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Nomor Surat *</label>
              <input
                type="text"
                required
                placeholder="Cth: 001/DINAS-DKP/VIII/2026"
                value={letterForm.letterNumber}
                onChange={(e) => setLetterForm({ ...letterForm, letterNumber: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tujuan Surat *</label>
              <input
                type="text"
                required
                value={letterForm.destination}
                onChange={(e) => setLetterForm({ ...letterForm, destination: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Surat *</label>
              <input
                type="date"
                required
                value={letterForm.letterDate}
                onChange={(e) => setLetterForm({ ...letterForm, letterDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Diterima *</label>
              <input
                type="date"
                required
                value={letterForm.receivedDate}
                onChange={(e) => setLetterForm({ ...letterForm, receivedDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Pengirim *</label>
              <input
                type="text"
                required
                placeholder="Cth: Kepala Dinas Kelautan"
                value={letterForm.sender}
                onChange={(e) => setLetterForm({ ...letterForm, sender: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Instansi *</label>
              <input
                type="text"
                required
                placeholder="Cth: Dinas Kelautan Provinsi Lampung"
                value={letterForm.institution}
                onChange={(e) => setLetterForm({ ...letterForm, institution: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Perihal Surat *</label>
            <input
              type="text"
              required
              placeholder="Cth: Permohonan Peliputan Seminar"
              value={letterForm.subject}
              onChange={(e) => setLetterForm({ ...letterForm, subject: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Link File Surat</label>
            <input
              type="url"
              placeholder="https://drive.google.com/..."
              value={letterForm.fileUrl}
              onChange={(e) => setLetterForm({ ...letterForm, fileUrl: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Lokasi Kegiatan *</label>
            <input
              type="text"
              required
              placeholder="Masukkan lokasi kegiatan"
              value={letterForm.eventLocation}
              onChange={(e) => setLetterForm({ ...letterForm, eventLocation: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Pelaksanaan *</label>
              <input
                type="date"
                required
                value={letterForm.eventDate}
                onChange={(e) => setLetterForm({ ...letterForm, eventDate: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jam Mulai *</label>
              <input
                type="time"
                required
                value={letterForm.startTime}
                onChange={(e) => setLetterForm({ ...letterForm, startTime: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jam Selesai (Opsional)</label>
              <input
                type="time"
                value={letterForm.endTime}
                onChange={(e) => setLetterForm({ ...letterForm, endTime: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          {/* GPS Coordinates & Radius */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Koordinat GPS Lokasi & Radius Absensi (Opsional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={letterForm.latitude}
                  onChange={(e) => setLetterForm({ ...letterForm, latitude: e.target.value })}
                  placeholder="-5.3582"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={letterForm.longitude}
                  onChange={(e) => setLetterForm({ ...letterForm, longitude: e.target.value })}
                  placeholder="105.2321"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Radius (Meter)</label>
                <input
                  type="number"
                  value={letterForm.radius}
                  onChange={(e) => setLetterForm({ ...letterForm, radius: e.target.value })}
                  placeholder="100"
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Keterangan Tambahan</label>
            <textarea
              rows={2}
              placeholder="Catatan arahan / lampiran..."
              value={letterForm.notes}
              onChange={(e) => setLetterForm({ ...letterForm, notes: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <CustomButton
              type="button"
              variant="outline"
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
              }}
            >
              Batal
            </CustomButton>
            <CustomButton type="submit" variant="primary">
              {isEditOpen ? 'Simpan Perubahan' : 'Simpan Surat Masuk'}
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* Create Activity From Letter Modal */}
      <CustomModal
        isOpen={isCreateActivityOpen}
        onClose={() => setIsCreateActivityOpen(false)}
        title="Buat Kegiatan dari Surat Masuk"
        subtitle={selectedLetter ? `Referensi Surat: ${selectedLetter.letterNumber}` : ''}
        maxWidth="lg"
      >
        <form onSubmit={handleActivityFromLetterSubmit} className="space-y-4 text-xs">
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5 text-teal-900 space-y-1">
            <p className="font-bold">Informasi Sumber Surat:</p>
            <p>• <strong>No. Surat:</strong> {selectedLetter?.letterNumber}</p>
            <p>• <strong>Pengirim:</strong> {selectedLetter?.sender} ({selectedLetter?.institution})</p>
            <p>• <strong>Perihal:</strong> {selectedLetter?.subject}</p>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Judul Kegiatan Peliputan *</label>
            <input
              type="text"
              required
              value={activityForm.title}
              onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Tanggal Pelaksanaan *</label>
              <input
                type="date"
                required
                value={activityForm.date}
                onChange={(e) => setActivityForm({ ...activityForm, date: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jam Mulai *</label>
              <input
                type="time"
                required
                value={activityForm.startTime}
                onChange={(e) => setActivityForm({ ...activityForm, startTime: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Jam Selesai *</label>
              <input
                type="time"
                required
                value={activityForm.endTime}
                onChange={(e) => setActivityForm({ ...activityForm, endTime: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Lokasi Pelaksanaan *</label>
            <input
              type="text"
              required
              value={activityForm.location}
              onChange={(e) => setActivityForm({ ...activityForm, location: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Deskripsi & Rencana Pelaksanaan *</label>
            <textarea
              rows={3}
              required
              value={activityForm.description}
              onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:ring-2 focus:ring-teal-500/20"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <CustomButton type="button" variant="outline" onClick={() => setIsCreateActivityOpen(false)}>
              Batal
            </CustomButton>
            <CustomButton type="submit" variant="primary">
              Ajukan Kegiatan ke Kepala Humas
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* Detail Surat Modal */}
      <CustomModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Surat Masuk"
        maxWidth="md"
      >
        {selectedLetter && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <StatusBadge status={selectedLetter.status} />
              <span className="text-slate-400 font-semibold">Tgl Diterima: {formatDateID(selectedLetter.receivedDate.split('T')[0])}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-slate-700 font-medium">
              <p><strong>Nomor Surat:</strong> {selectedLetter.letterNumber}</p>
              <p><strong>Tanggal Surat:</strong> {formatDateID(selectedLetter.letterDate.split('T')[0])}</p>
              <p><strong>Pengirim:</strong> {selectedLetter.sender}</p>
              <p><strong>Instansi:</strong> {selectedLetter.institution}</p>
              <p><strong>Tujuan Surat:</strong> {selectedLetter.destination}</p>
              <p><strong>Perihal:</strong> {selectedLetter.subject}</p>
              {selectedLetter.notes && <p><strong>Keterangan:</strong> {selectedLetter.notes}</p>}
            </div>

            {selectedLetter.fileUrl && (
              <a
                href={selectedLetter.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-xl bg-teal-50 border border-teal-200 text-teal-800 font-bold hover:bg-teal-100 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span>Buka File Surat (Google Drive / Document)</span>
              </a>
            )}

            {/* Linked Activities */}
            <div className="space-y-2">
              <p className="font-bold text-slate-800">Kegiatan Terkait Surat Ini:</p>
              {(!selectedLetter.activities || selectedLetter.activities.length === 0) ? (
                <p className="text-slate-400 italic">Belum ada kegiatan yang terhubung dengan surat ini.</p>
              ) : (
                <div className="space-y-2">
                  {selectedLetter.activities.map((act) => (
                    <div key={act.id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-white">
                      <div>
                        <p className="font-bold text-slate-800">{act.title}</p>
                        <p className="text-[10px] text-slate-500">Tanggal: {formatDateID(act.date.split('T')[0])}</p>
                      </div>
                      <StatusBadge status={act.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <CustomButton variant="primary" size="sm" onClick={() => setIsDetailOpen(false)}>
                Tutup
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>

      {/* Delete Confirmation Modal */}
      <CustomModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Konfirmasi Hapus Surat Masuk"
        maxWidth="sm"
      >
        <div className="text-center py-2 space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              Hapus surat masuk &quot;{selectedLetter?.letterNumber}&quot;?
            </p>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Tindakan ini akan menghapus catatan surat masuk dari sistem.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <CustomButton variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Batal
            </CustomButton>
            <CustomButton variant="danger" onClick={handleDeleteConfirm}>
              Ya, Hapus
            </CustomButton>
          </div>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
