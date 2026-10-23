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
  LocationPicker,
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
  RotateCcw,
  MapPin,
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

  // Form validation & UI states matching design reference
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showValidationErrorBanner, setShowValidationErrorBanner] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);

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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const updateFormField = (field: string, value: any) => {
    setLetterForm((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        if (Object.keys(next).length === 0) {
          setShowValidationErrorBanner(false);
        }
        return next;
      });
    }
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!letterForm.letterNumber.trim()) errors.letterNumber = 'Nomor surat wajib diisi';
    if (!letterForm.destination.trim()) errors.destination = 'Tujuan surat wajib diisi';
    if (!letterForm.letterDate) errors.letterDate = 'Tanggal surat wajib diisi';
    if (!letterForm.receivedDate) errors.receivedDate = 'Tanggal diterima wajib diisi';
    if (!letterForm.sender.trim()) errors.sender = 'Pengirim surat wajib diisi';
    if (!letterForm.institution.trim()) errors.institution = 'Instansi wajib diisi';
    if (!letterForm.subject.trim()) errors.subject = 'Perihal surat wajib diisi';
    if (!letterForm.eventLocation.trim()) errors.eventLocation = 'Lokasi kegiatan wajib diisi';
    if (!letterForm.eventDate) errors.eventDate = 'Wajib diisi';
    if (!letterForm.startTime) errors.startTime = 'Wajib diisi';
    if (letterForm.endTime && letterForm.endTime <= letterForm.startTime) {
      errors.endTime = 'Jam selesai tidak boleh lebih awal atau sama dengan jam mulai';
    }
    setFormErrors(errors);
    const isValid = Object.keys(errors).length === 0;
    setShowValidationErrorBanner(!isValid);
    return isValid;
  };

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
    setFormErrors({});
    setShowValidationErrorBanner(false);
    setShowMapPicker(false);
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
    setFormErrors({});
    setShowValidationErrorBanner(false);
    setShowMapPicker(false);
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
    if (!validateForm()) {
      toast.error('Beberapa kolom wajib bertanda bintang (*) belum diisi.');
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
    if (!validateForm()) {
      toast.error('Beberapa kolom wajib bertanda bintang (*) belum diisi.');
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
        maxWidth="6xl"
      >
        <form noValidate onSubmit={isEditOpen ? handleEditSubmit : handleCreateSubmit} className="space-y-4 text-[12px]">
          {showValidationErrorBanner && (
            <div className="bg-[rgba(254,242,242,0.9)] border border-[rgba(254,202,202,0.8)] text-[#B91C1C] rounded-[12px] p-[14px] text-[12px] font-[600] leading-[20px] shadow-xs">
              Gagal menyimpan: Beberapa kolom wajib bertanda bintang (*) belum diisi. Silakan lengkapi data terlebih dahulu.
            </div>
          )}

          {/* Row 1: Nomor Surat & Tujuan Surat */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">
                Nomor Surat <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Cth: 001/DINAS-DKP/VIII/2026"
                value={letterForm.letterNumber}
                onChange={(e) => updateFormField('letterNumber', e.target.value)}
                className={`w-full h-[36px] ${
                  formErrors.letterNumber
                    ? 'bg-[rgba(254,242,242,0.2)] border border-[#F87171] focus:ring-1 focus:ring-red-400'
                    : 'bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25'
                } rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all`}
              />
              {formErrors.letterNumber && (
                <div className="text-[11px] text-[#EF4444] mt-1 flex items-center gap-1 font-[500]">
                  <RotateCcw className="w-3 h-3 text-[#EF4444] shrink-0" />
                  <span>{formErrors.letterNumber}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">
                Tujuan Surat <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={letterForm.destination}
                onChange={(e) => updateFormField('destination', e.target.value)}
                placeholder="Kepala Bagian Humas Polinela"
                className={`w-full h-[36px] ${
                  formErrors.destination
                    ? 'bg-[rgba(254,242,242,0.2)] border border-[#F87171] focus:ring-1 focus:ring-red-400'
                    : 'bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25'
                } rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all`}
              />
              {formErrors.destination && (
                <div className="text-[11px] text-[#EF4444] mt-1 flex items-center gap-1 font-[500]">
                  <RotateCcw className="w-3 h-3 text-[#EF4444] shrink-0" />
                  <span>{formErrors.destination}</span>
                </div>
              )}
            </div>
          </div>

          {/* Row 2: Tanggal Surat & Tanggal Diterima */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">
                Tanggal Surat <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={letterForm.letterDate}
                onChange={(e) => updateFormField('letterDate', e.target.value)}
                className={`w-full h-[36px] ${
                  formErrors.letterDate
                    ? 'bg-[rgba(254,242,242,0.2)] border border-[#F87171] focus:ring-1 focus:ring-red-400'
                    : 'bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25'
                } rounded-[8px] px-3 text-[12px] text-[#334155] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all`}
              />
              {formErrors.letterDate && (
                <div className="text-[11px] text-[#EF4444] mt-1 flex items-center gap-1 font-[500]">
                  <RotateCcw className="w-3 h-3 text-[#EF4444] shrink-0" />
                  <span>{formErrors.letterDate}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">
                Tanggal Diterima <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={letterForm.receivedDate}
                onChange={(e) => updateFormField('receivedDate', e.target.value)}
                className={`w-full h-[36px] ${
                  formErrors.receivedDate
                    ? 'bg-[rgba(254,242,242,0.2)] border border-[#F87171] focus:ring-1 focus:ring-red-400'
                    : 'bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25'
                } rounded-[8px] px-3 text-[12px] text-[#334155] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all`}
              />
              {formErrors.receivedDate && (
                <div className="text-[11px] text-[#EF4444] mt-1 flex items-center gap-1 font-[500]">
                  <RotateCcw className="w-3 h-3 text-[#EF4444] shrink-0" />
                  <span>{formErrors.receivedDate}</span>
                </div>
              )}
            </div>
          </div>

          {/* Row 3: Pengirim & Instansi */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">
                Pengirim <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Cth: Kepala Dinas Kelautan"
                value={letterForm.sender}
                onChange={(e) => updateFormField('sender', e.target.value)}
                className={`w-full h-[36px] ${
                  formErrors.sender
                    ? 'bg-[rgba(254,242,242,0.2)] border border-[#F87171] focus:ring-1 focus:ring-red-400'
                    : 'bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25'
                } rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all`}
              />
              {formErrors.sender && (
                <div className="text-[11px] text-[#EF4444] mt-1 flex items-center gap-1 font-[500]">
                  <RotateCcw className="w-3 h-3 text-[#EF4444] shrink-0" />
                  <span>{formErrors.sender}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">
                Instansi <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Cth: Dinas Kelautan Provinsi Lampung"
                value={letterForm.institution}
                onChange={(e) => updateFormField('institution', e.target.value)}
                className={`w-full h-[36px] ${
                  formErrors.institution
                    ? 'bg-[rgba(254,242,242,0.2)] border border-[#F87171] focus:ring-1 focus:ring-red-400'
                    : 'bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25'
                } rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all`}
              />
              {formErrors.institution && (
                <div className="text-[11px] text-[#EF4444] mt-1 flex items-center gap-1 font-[500]">
                  <RotateCcw className="w-3 h-3 text-[#EF4444] shrink-0" />
                  <span>{formErrors.institution}</span>
                </div>
              )}
            </div>
          </div>

          {/* Row 4: Perihal Surat */}
          <div>
            <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">
              Perihal Surat <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Cth: Permohonan Peliputan Seminar"
              value={letterForm.subject}
              onChange={(e) => updateFormField('subject', e.target.value)}
              className={`w-full h-[36px] ${
                formErrors.subject
                  ? 'bg-[rgba(254,242,242,0.2)] border border-[#F87171] focus:ring-1 focus:ring-red-400'
                  : 'bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25'
              } rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all`}
            />
            {formErrors.subject && (
              <div className="text-[11px] text-[#EF4444] mt-1 flex items-center gap-1 font-[500]">
                <RotateCcw className="w-3 h-3 text-[#EF4444] shrink-0" />
                <span>{formErrors.subject}</span>
              </div>
            )}
          </div>

          {/* Row 5: Link File Surat */}
          <div>
            <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Link File Surat</label>
            <input
              type="url"
              placeholder="https://drive.google.com/..."
              value={letterForm.fileUrl}
              onChange={(e) => updateFormField('fileUrl', e.target.value)}
              className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
            />
          </div>

          {/* Row 6: Lokasi Kegiatan */}
          <div>
            <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">
              Lokasi Kegiatan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Masukkan lokasi kegiatan"
              value={letterForm.eventLocation}
              onChange={(e) => updateFormField('eventLocation', e.target.value)}
              className={`w-full h-[36px] ${
                formErrors.eventLocation
                  ? 'bg-[rgba(254,242,242,0.2)] border border-[#F87171] focus:ring-1 focus:ring-red-400'
                  : 'bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25'
              } rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all`}
            />
            {formErrors.eventLocation && (
              <div className="text-[11px] text-[#EF4444] mt-1 flex items-center gap-1 font-[500]">
                <RotateCcw className="w-3 h-3 text-[#EF4444] shrink-0" />
                <span>{formErrors.eventLocation}</span>
              </div>
            )}
          </div>

          {/* Row 7: Tanggal Pelaksanaan, Jam Mulai & Jam Selesai */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">
                Tanggal Pelaksanaan <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={letterForm.eventDate}
                onChange={(e) => updateFormField('eventDate', e.target.value)}
                className={`w-full h-[36px] ${
                  formErrors.eventDate
                    ? 'bg-[rgba(254,242,242,0.2)] border border-[#F87171] focus:ring-1 focus:ring-red-400'
                    : 'bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25'
                } rounded-[8px] px-3 text-[12px] text-[#334155] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all`}
              />
              {formErrors.eventDate && (
                <div className="text-[11px] text-[#EF4444] mt-1 flex items-center gap-1 font-[500]">
                  <RotateCcw className="w-3 h-3 text-[#EF4444] shrink-0" />
                  <span>{formErrors.eventDate}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">
                Jam Mulai <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                value={letterForm.startTime}
                onChange={(e) => updateFormField('startTime', e.target.value)}
                className={`w-full h-[36px] ${
                  formErrors.startTime
                    ? 'bg-[rgba(254,242,242,0.2)] border border-[#F87171] focus:ring-1 focus:ring-red-400'
                    : 'bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25'
                } rounded-[8px] px-3 text-[12px] text-[#334155] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all`}
              />
              {formErrors.startTime && (
                <div className="text-[11px] text-[#EF4444] mt-1 flex items-center gap-1 font-[500]">
                  <RotateCcw className="w-3 h-3 text-[#EF4444] shrink-0" />
                  <span>{formErrors.startTime}</span>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Jam Selesai (Opsional)</label>
              <input
                type="time"
                value={letterForm.endTime}
                onChange={(e) => updateFormField('endTime', e.target.value)}
                className={`w-full h-[36px] ${
                  formErrors.endTime
                    ? 'bg-[rgba(254,242,242,0.2)] border border-[#F87171] focus:ring-1 focus:ring-red-400'
                    : 'bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25'
                } rounded-[8px] px-3 text-[12px] text-[#334155] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all`}
              />
              {formErrors.endTime && (
                <div className="text-[11px] text-[#EF4444] mt-1 flex items-center gap-1 font-[500]">
                  <RotateCcw className="w-3 h-3 text-[#EF4444] shrink-0" />
                  <span>{formErrors.endTime}</span>
                </div>
              )}
            </div>
          </div>

          {/* Section: Koordinat GPS Box */}
          <div className="bg-[rgba(248,250,252,0.8)] border border-[rgba(226,232,240,0.9)] rounded-[12px] p-[14px] space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-[700] text-[#475569] tracking-[0.5px] uppercase">
                KOORDINAT GPS LOKASI & RADIUS ABSENSI (OPSIONAL)
              </span>
              <button
                type="button"
                onClick={() => setShowMapPicker(!showMapPicker)}
                className="text-[11px] text-[#0D9488] hover:text-[#0F766E] font-[600] flex items-center gap-1 underline underline-offset-2 transition-colors cursor-pointer"
              >
                <MapPin className="w-3.5 h-3.5" />
                {showMapPicker ? 'Tutup Peta' : 'Pilih dari Peta'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-[400] text-[#64748B] mb-1">Latitude</label>
                <input
                  type="text"
                  placeholder="-5.3582"
                  value={letterForm.latitude}
                  onChange={(e) => updateFormField('latitude', e.target.value)}
                  className="w-full h-[30px] bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25 rounded-[8px] px-3 text-[12px] text-[#334155] placeholder:text-[#94A3B8] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-[400] text-[#64748B] mb-1">Longitude</label>
                <input
                  type="text"
                  placeholder="--:--"
                  value={letterForm.longitude}
                  onChange={(e) => updateFormField('longitude', e.target.value)}
                  className="w-full h-[30px] bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25 rounded-[8px] px-3 text-[12px] text-[#334155] placeholder:text-[#94A3B8] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-[11px] font-[400] text-[#64748B] mb-1">Radius (Meter)</label>
                <input
                  type="number"
                  placeholder="100"
                  value={letterForm.radius}
                  onChange={(e) => updateFormField('radius', e.target.value)}
                  className="w-full h-[30px] bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25 rounded-[8px] px-3 text-[12px] text-[#334155] placeholder:text-[#94A3B8] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
                />
              </div>
            </div>

            {/* Collapsible Interactive Pinpoint & Campus Presets */}
            {showMapPicker && (
              <div className="pt-2 border-t border-slate-200 mt-2">
                <LocationPicker
                  location={letterForm.eventLocation}
                  latitude={letterForm.latitude || -5.3582}
                  longitude={letterForm.longitude || 105.2345}
                  radius={letterForm.radius || '100'}
                  onChange={(locData) => {
                    setLetterForm((prev) => ({
                      ...prev,
                      eventLocation: locData.location || prev.eventLocation,
                      latitude: locData.latitude,
                      longitude: locData.longitude,
                      radius: locData.radius,
                    }));
                  }}
                />
              </div>
            )}
          </div>

          {/* Row 8: Keterangan Tambahan */}
          <div>
            <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Keterangan Tambahan</label>
            <input
              type="text"
              placeholder="Catatan tambahan untuk tim peliputan..."
              value={letterForm.notes}
              onChange={(e) => updateFormField('notes', e.target.value)}
              className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end items-center gap-3 pt-3.5 border-t border-[#F1F5F9] bg-[#F8FAFC] -mx-5 -mb-5 px-6 py-3 rounded-b-2xl">
            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
              }}
              className="h-[34px] px-5 bg-white border border-[#CBD5E1] hover:bg-slate-50 text-[#475569] rounded-[8px] text-[12px] font-[500] cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="h-[34px] px-5 bg-[#32B0C5] hover:bg-[#289eb1] text-white rounded-[8px] text-[12px] font-[500] cursor-pointer shadow-[0_1px_2px_rgba(20,184,166,0.2)] transition-colors"
            >
              {isEditOpen ? 'Simpan Perubahan' : 'Simpan Surat'}
            </button>
          </div>
        </form>
      </CustomModal>

      {/* Create Activity From Letter Modal */}
      <CustomModal
        isOpen={isCreateActivityOpen}
        onClose={() => setIsCreateActivityOpen(false)}
        title="Buat Kegiatan dari Surat Masuk"
        subtitle={selectedLetter ? `Referensi Surat: ${selectedLetter.letterNumber}` : ''}
        maxWidth="3xl"
      >
        <form onSubmit={handleActivityFromLetterSubmit} className="space-y-4 text-[12px]">
          <div className="bg-teal-50 border border-teal-200 rounded-[10px] p-3.5 text-teal-900 space-y-1 text-[12px]">
            <p className="font-bold">Informasi Sumber Surat:</p>
            <p>• <strong>No. Surat:</strong> {selectedLetter?.letterNumber}</p>
            <p>• <strong>Pengirim:</strong> {selectedLetter?.sender} ({selectedLetter?.institution})</p>
            <p>• <strong>Perihal:</strong> {selectedLetter?.subject}</p>
          </div>

          <div>
            <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">
              Judul Kegiatan Peliputan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={activityForm.title}
              onChange={(e) => setActivityForm({ ...activityForm, title: e.target.value })}
              className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">
                Tanggal Pelaksanaan <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={activityForm.date}
                onChange={(e) => setActivityForm({ ...activityForm, date: e.target.value })}
                className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25 rounded-[8px] px-3 text-[12px] text-[#334155] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">
                Jam Mulai <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                value={activityForm.startTime}
                onChange={(e) => setActivityForm({ ...activityForm, startTime: e.target.value })}
                className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25 rounded-[8px] px-3 text-[12px] text-[#334155] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">
                Jam Selesai <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                required
                value={activityForm.endTime}
                onChange={(e) => setActivityForm({ ...activityForm, endTime: e.target.value })}
                className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25 rounded-[8px] px-3 text-[12px] text-[#334155] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">
              Lokasi Pelaksanaan <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={activityForm.location}
              onChange={(e) => setActivityForm({ ...activityForm, location: e.target.value })}
              className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">
              Deskripsi &amp; Rencana Pelaksanaan <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={activityForm.description}
              onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
              className="w-full min-h-[70px] bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25 rounded-[8px] p-3 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateActivityOpen(false)}
              className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] text-[12px] font-semibold rounded-[8px] transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-gradient-to-r from-[#0D9488] to-[#14B8A6] hover:from-[#0F766E] hover:to-[#0D9488] text-white text-[12px] font-semibold rounded-[8px] shadow-xs transition-all cursor-pointer"
            >
              Ajukan Kegiatan ke Kepala Humas
            </button>
          </div>
        </form>
      </CustomModal>

      {/* Detail Surat Masuk Modal */}
      <CustomModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Surat Masuk"
        subtitle={selectedLetter ? `Nomor: ${selectedLetter.letterNumber}` : undefined}
        maxWidth="3xl"
      >
        {selectedLetter && (
          <div className="space-y-4 text-xs">
            {/* Top Status & Date Banner */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-500">Status Surat:</span>
                <StatusBadge status={selectedLetter.status} />
              </div>
              <div className="flex items-center gap-1.5 text-slate-600 font-medium text-xs">
                <CalendarCheck2 className="w-4 h-4 text-teal-600 shrink-0" />
                <span>Diterima: <strong>{formatDateID(selectedLetter.receivedDate.split('T')[0])}</strong></span>
              </div>
            </div>

            {/* Perihal Highlight Card */}
            <div className="bg-teal-50/70 border border-teal-200/80 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-teal-800 text-[11px] font-bold uppercase tracking-wider mb-1.5">
                <FileText className="w-4 h-4 text-teal-600" />
                <span>Perihal Surat</span>
              </div>
              <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                {selectedLetter.subject}
              </h4>
            </div>

            {/* Core Information Grid */}
            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden text-xs">
              {/* Row 1: Nomor Surat & Tujuan */}
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
                    <Building className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    {selectedLetter.destination || 'Kepala Bagian Humas Polinela'}
                  </span>
                </div>
              </div>

              {/* Row 2: Pengirim & Instansi */}
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

              {/* Row 3: Tanggal Surat & Tanggal Diterima */}
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
                    <CalendarCheck2 className="w-3.5 h-3.5 text-teal-600 shrink-0" />
                    {formatDateID(selectedLetter.receivedDate.split('T')[0])}
                  </span>
                </div>
              </div>
            </div>

            {/* Jadwal & Lokasi Pelaksanaan Kegiatan */}
            {(selectedLetter.eventLocation || selectedLetter.eventDate) && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                  <span>Jadwal &amp; Lokasi Rencana Pelaksanaan</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Lokasi Kegiatan:</span>
                    <span className="font-semibold text-slate-800">
                      {selectedLetter.eventLocation || '-'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[11px] font-semibold text-slate-500 block mb-0.5">Waktu Pelaksanaan:</span>
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

                {/* Koordinat GPS & Radius */}
                {(selectedLetter.latitude || selectedLetter.longitude) && (
                  <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="text-slate-600">
                      <strong>Koordinat GPS:</strong> {selectedLetter.latitude}, {selectedLetter.longitude} (Radius: {selectedLetter.radius || 100}m)
                    </span>
                    <a
                      href={`https://www.google.com/maps?q=${selectedLetter.latitude},${selectedLetter.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-teal-700 hover:text-teal-800 font-semibold flex items-center gap-1 underline underline-offset-2"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Buka di Google Maps
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Catatan / Arahan Tambahan */}
            {selectedLetter.notes && (
              <div className="bg-amber-50/60 border border-amber-200/80 rounded-xl p-3.5 text-xs">
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block mb-1">
                  Catatan / Keterangan Tambahan
                </span>
                <p className="text-slate-700 leading-relaxed font-medium whitespace-pre-line">
                  {selectedLetter.notes}
                </p>
              </div>
            )}

            {/* Lampiran Berkas File Surat */}
            {selectedLetter.fileUrl ? (
              <a
                href={selectedLetter.fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-teal-200 hover:border-teal-400 hover:bg-teal-50/40 shadow-2xs transition-all group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 group-hover:text-teal-700 transition-colors">
                      Buka Berkas Digital Surat (Google Drive / Online Link)
                    </p>
                    <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                      {selectedLetter.fileUrl}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-teal-600 shrink-0">
                  <span>Buka Dokumen</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </div>
              </a>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                Tidak ada tautan berkas digital yang dilampirkan.
              </div>
            )}

            {/* Kegiatan Terkait Surat */}
            <div className="space-y-2 pt-1">
              <div className="flex items-center justify-between">
                <p className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                  <CalendarCheck2 className="w-4 h-4 text-teal-600 shrink-0" />
                  Kegiatan Terkait Surat Ini
                </p>
                {(!selectedLetter.activities || selectedLetter.activities.length === 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailOpen(false);
                      handleOpenCreateActivity(selectedLetter);
                    }}
                    className="text-[11px] text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Buat Kegiatan Sekarang
                  </button>
                )}
              </div>

              {(!selectedLetter.activities || selectedLetter.activities.length === 0) ? (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                  Belum ada kegiatan yang terhubung dengan surat masuk ini.
                </div>
              ) : (
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
                      <StatusBadge status={act.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setIsDetailOpen(false);
                  handleOpenEdit(selectedLetter);
                }}
                className="px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                Edit Surat
              </button>
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-5 py-2 bg-[#00838f] hover:bg-[#006876] text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs transition-colors"
              >
                Tutup
              </button>
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
