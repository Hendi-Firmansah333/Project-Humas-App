'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
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
  ConfirmModal,
  PaginationBar,
  StreetSearchInput,
  CustomDatePicker,
  CustomTimePicker,
  TableSkeleton,
} from '@/components/common';
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
  CalendarPlus,
  ExternalLink,
  AlertTriangle,
  Clock,
  CheckCircle2,
  RotateCcw,
  MapPin,
  Archive,
  XCircle,
  History,
} from 'lucide-react';
import { IncomingLetter, User } from '@/types';
import { formatDateID } from '@/utils/formatters';
import { toast } from 'sonner';
import { incomingLetterService, userService } from '@/services';
import { getStoredUser } from '@/utils/session';
import { openFileInNewTab, getFileViewUrl } from '@/utils/api-helpers';

export default function IncomingLettersPage() {
  const router = useRouter();
  const [letters, setLetters] = useState<IncomingLetter[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isCreateActivityOpen, setIsCreateActivityOpen] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<IncomingLetter | null>(null);

  // Form validation & UI states matching design reference
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [showValidationErrorBanner, setShowValidationErrorBanner] = useState(false);

  // File upload state (drag-and-drop berkas surat)
  const [uploadedFile, setUploadedFile] = useState<{ name: string; base64: string } | null>(null);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const dropZoneRef = useRef<HTMLLabelElement>(null);
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: React.ReactNode;
    confirmText: string;
    variant: 'primary' | 'warning' | 'danger';
    onConfirm: () => Promise<void>;
  }>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Ya, Lanjutkan',
    variant: 'primary',
    onConfirm: async () => {},
  });
  const [isConfirming, setIsConfirming] = useState(false);

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
    status: 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS',
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
    latitude: '',
    longitude: '',
    radius: '100',
    picId: 0,
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
    setCurrentUser(user as any);

    const init = async () => {
      setLoading(true);
      await Promise.all([
        loadLetters(),
        userService.getAll().then((data) => {
          const list = Array.isArray(data) ? data : (data as any)?.items || [];
          setUsers(list);
        }).catch(() => {}),
      ]);
      setLoading(false);
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Hanya surat masuk aktif (belum disetujui/ditolak) yang tampil di modul Surat Masuk.
  // Begitu disetujui oleh Kepala Humas, surat langsung berpindah ke Riwayat Surat!
  const activeLetters = letters.filter(
    (item) =>
      item.status === 'BARU' ||
      item.status === 'DRAFT' ||
      item.status === 'MENUNGGU_VERIFIKASI_ADMIN' ||
      item.status === 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS'
  );

  const filteredLetters = activeLetters.filter((item) => {
    const matchSearch =
      (item.letterNumber || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.sender || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.institution || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.subject || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.eventLocation || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = (() => {
      if (!statusFilter) return true;
      const st = (item.status || '').toUpperCase();
      if (statusFilter === 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS') {
        return st === 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS' || st === 'MENUNGGU_VERIFIKASI_ADMIN';
      }
      if (statusFilter === 'BARU') {
        return st === 'BARU' || st === 'DRAFT';
      }
      return st === statusFilter;
    })();
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
      status: 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS',
      eventLocation: '',
      eventDate: '',
      startTime: '',
      endTime: '',
      latitude: '',
      longitude: '',
      radius: '100',
    });
    setUploadedFile(null);
    setFormErrors({});
    setShowValidationErrorBanner(false);
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
    // If letter already has a file, show it as already uploaded
    setUploadedFile(letter.fileUrl ? { name: 'Berkas tersimpan', base64: letter.fileUrl } : null);
    setFormErrors({});
    setShowValidationErrorBanner(false);
    setIsEditOpen(true);
  };

  const handleOpenCreateActivity = (letter: IncomingLetter) => {
    if (currentUser?.role !== 'SUPER_ADMIN') {
      toast.error('Hanya Kepala Humas yang dapat membuat agenda kegiatan.');
      return;
    }
    setSelectedLetter(letter);
    setActivityForm({
      title: `Peliputan: ${letter.subject}`,
      category: 'Liputan Eksternal',
      date: letter.eventDate ? letter.eventDate.split('T')[0] : new Date().toISOString().split('T')[0],
      startTime: letter.startTime || '08:00',
      endTime: letter.endTime || '16:00',
      location: letter.eventLocation || letter.institution,
      description: `Kegiatan tindak lanjut dari Surat Masuk No. ${letter.letterNumber} (${letter.sender} - ${letter.institution}). Perihal: ${letter.subject}.`,
      latitude: letter.latitude != null ? String(letter.latitude) : '',
      longitude: letter.longitude != null ? String(letter.longitude) : '',
      radius: letter.radius != null ? String(letter.radius) : '100',
      picId: 0,
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

  const handleActivityFromLetterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLetter) return;
    try {
      const payload: any = {
        title: activityForm.title,
        category: activityForm.category,
        date: `${activityForm.date}T08:00:00Z`,
        startTime: activityForm.startTime,
        endTime: activityForm.endTime,
        location: activityForm.location,
        description: activityForm.description,
        radius: activityForm.radius ? parseFloat(activityForm.radius) : 100,
      };
      if (activityForm.latitude) payload.latitude = parseFloat(activityForm.latitude);
      if (activityForm.longitude) payload.longitude = parseFloat(activityForm.longitude);
      if (activityForm.picId && activityForm.picId > 0) payload.picId = Number(activityForm.picId);

      const act = await incomingLetterService.createActivity(selectedLetter.id, payload);
      setIsCreateActivityOpen(false);
      toast.success('Kegiatan berhasil diajukan ke Kepala Humas!');
      await loadLetters();
      router.push(`/kegiatan/${act.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengajukan kegiatan dari surat.');
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

  const handleApproveLetter = (id: number) => {
    setConfirmState({
      isOpen: true,
      title: 'Konfirmasi Persetujuan Surat',
      message: 'Apakah Anda yakin ingin menyetujui surat masuk ini? Surat yang disetujui akan langsung dipindahkan ke Riwayat Surat.',
      confirmText: 'Ya, Setujui Surat',
      variant: 'primary',
      onConfirm: async () => {
        setIsConfirming(true);
        try {
          await incomingLetterService.approve(id);
          toast.success('Surat masuk telah disetujui dan langsung dipindahkan ke Riwayat Surat.');
          setIsDetailOpen(false);
          await loadLetters();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal menyetujui surat masuk.');
        } finally {
          setIsConfirming(false);
        }
      },
    });
  };

  const handleRejectLetter = async () => {
    if (!selectedLetter) return;
    if (!rejectReason.trim()) {
      toast.error('Alasan penolakan surat wajib diisi.');
      return;
    }
    try {
      await incomingLetterService.reject(selectedLetter.id, rejectReason.trim());
      toast.success('Surat masuk ditolak dan dipindahkan ke Riwayat Surat.');
      setIsRejectModalOpen(false);
      setIsDetailOpen(false);
      setRejectReason('');
      await loadLetters();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menolak surat masuk.');
    }
  };

  const handleCompleteLetter = (id: number) => {
    setConfirmState({
      isOpen: true,
      title: 'Konfirmasi Selesaikan Surat',
      message: 'Tandai surat ini selesai dan simpan ke arsip Riwayat Surat?',
      confirmText: 'Ya, Tandai Selesai',
      variant: 'primary',
      onConfirm: async () => {
        setIsConfirming(true);
        try {
          await incomingLetterService.complete(id);
          toast.success('Surat berhasil ditandai selesai dan dipindahkan ke Riwayat Surat.');
          setIsDetailOpen(false);
          await loadLetters();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal menyelesaikan surat masuk.');
        } finally {
          setIsConfirming(false);
        }
      },
    });
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
        <div className="flex items-center gap-1.5 justify-center">
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

          {/* Persetujuan Langsung Kepala Humas */}
          {currentUser?.role === 'SUPER_ADMIN' && item.status === 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS' && (
            <>
              <button
                onClick={() => handleApproveLetter(item.id)}
                className="px-2 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                title="Setujui Surat Masuk Ini"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">Setujui</span>
              </button>
              <button
                onClick={() => {
                  setSelectedLetter(item);
                  setIsRejectModalOpen(true);
                }}
                className="p-1.5 rounded-lg border border-red-200 hover:bg-red-50 text-red-600 transition-colors cursor-pointer"
                title="Tolak Surat"
              >
                <XCircle className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Hapus tersedia di tombol tabel hanya untuk Admin; Kepala Humas hanya review/setujui/tolak */}
          {currentUser?.role !== 'SUPER_ADMIN' && (
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
          )}
        </div>
      ),
      className: 'text-center w-36',
    },
  ];

  if (loading) {
    return (
      <AdminLayout title="Modul Surat Masuk Humas">
        <TableSkeleton statsCount={4} rows={5} />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Modul Surat Masuk Humas">
      <div className="space-y-5">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          <StatCard
            title="Surat Masuk Aktif"
            value={activeLetters.length}
            subtitle="Belum disetujui / diproses"
            icon={Mail}
            iconBgClass="bg-sky-50"
            iconColorClass="text-[#003D58]"
          />
          <StatCard
            title="Menunggu Persetujuan"
            value={activeLetters.filter((l) => l.status === 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS' || l.status === 'MENUNGGU_VERIFIKASI_ADMIN' || l.status === 'BARU').length}
            subtitle="Perlu disposisi Kepala Humas"
            icon={Clock}
            iconBgClass="bg-amber-50"
            iconColorClass="text-amber-600"
          />
          <StatCard
            title="Sudah Ditugaskan"
            value={letters.filter((l) => l.status === 'DITUGASKAN' || l.status === 'SELESAI').length}
            subtitle="Sudah menjadi kegiatan peliputan"
            icon={CheckCircle2}
            iconBgClass="bg-blue-50"
            iconColorClass="text-[#003D58]"
          />
          <StatCard
            title="Surat di Riwayat"
            value={letters.filter((l) => l.status === 'DISETUJUI' || l.status === 'DITUGASKAN' || l.status === 'SELESAI' || l.status === 'DITOLAK').length}
            subtitle="Telah disetujui / diproses"
            icon={Archive}
            iconBgClass="bg-emerald-50"
            iconColorClass="text-emerald-600"
          />
        </div>

        {/* Header Banner & Controls */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight">Daftar Surat Masuk Aktif</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Kelola pencatatan surat masuk, berkas digital, dan pengajuan persetujuan Kepala Humas.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/riwayat-surat"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-2xs transition-colors"
                title="Lihat Surat yang Disetujui di Riwayat Surat"
              >
                <History className="w-4 h-4 text-[#003D58]" />
                <span>Buka Riwayat Surat</span>
              </Link>
              {currentUser?.role !== 'SUPER_ADMIN' && (
                <CustomButton variant="primary" icon={Plus} onClick={handleOpenCreate}>
                  Input Surat Masuk
                </CustomButton>
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
              placeholder="Cari no. surat, pengirim, instansi, atau perihal..."
              className="w-full sm:w-80 md:w-96"
            />
            <FilterDropdown
              placeholder="Semua Status Aktif"
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              options={[
                { label: 'Menunggu Persetujuan', value: 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS' },
                { label: 'Baru / Draft', value: 'BARU' },
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
            emptyMessage="Tidak ada surat masuk aktif saat ini. Seluruh surat yang telah disetujui otomatis masuk ke Riwayat Surat."
          />
          <PaginationBar
            currentPage={currentPage}
            totalPages={totalPages || 1}
            totalItems={filteredLetters.length}
            onPageChange={setCurrentPage}
            itemName="surat"
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
        subtitle="Kelola pencatatan surat masuk dan rencana tindak lanjut kegiatan."
        maxWidth="6xl"
      >
        <form noValidate onSubmit={isEditOpen ? handleEditSubmit : handleCreateSubmit} className="space-y-4 text-[12px]">
          {showValidationErrorBanner && (
            <div className="bg-[rgba(254,242,242,0.9)] border border-[rgba(254,202,202,0.8)] text-[#B91C1C] rounded-[10px] p-3 text-[12px] font-[600] leading-tight shadow-xs flex items-center gap-2">
              <RotateCcw className="w-4 h-4 shrink-0 text-red-500" />
              <span>Gagal menyimpan: Beberapa kolom wajib bertanda bintang (*) belum diisi. Silakan lengkapi data terlebih dahulu.</span>
            </div>
          )}

          {/* ── BAGIAN 1: INFORMASI SURAT MASUK ── */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200/60 pb-1.5">
              <FileText className="w-3.5 h-3.5 text-[#003D58]" />
              <span>Informasi Berkas Surat</span>
            </div>

            {/* Row 1: Nomor Surat & Tujuan Surat */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1">
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
                      : 'bg-white border border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-1 focus:ring-[#35C6D4]/30'
                  } rounded-[8px] px-3 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all`}
                />
                {formErrors.letterNumber && (
                  <div className="text-[11px] text-[#EF4444] mt-1 flex items-center gap-1 font-[500]">
                    <RotateCcw className="w-3 h-3 text-[#EF4444] shrink-0" />
                    <span>{formErrors.letterNumber}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1">
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
                      : 'bg-white border border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-1 focus:ring-[#35C6D4]/30'
                  } rounded-[8px] px-3 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all`}
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
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <CustomDatePicker
                label="Tanggal Surat"
                required
                value={letterForm.letterDate}
                error={formErrors.letterDate}
                placeholder="Pilih tanggal surat..."
                onChange={(val) => updateFormField('letterDate', val)}
              />
              <CustomDatePicker
                label="Tanggal Diterima"
                required
                value={letterForm.receivedDate}
                error={formErrors.receivedDate}
                placeholder="Pilih tanggal diterima..."
                onChange={(val) => updateFormField('receivedDate', val)}
              />
            </div>

            {/* Row 3: Pengirim & Instansi */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1">
                  Pengirim Surat <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Cth: Kepala Dinas Kelautan"
                  value={letterForm.sender}
                  onChange={(e) => updateFormField('sender', e.target.value)}
                  className={`w-full h-[36px] ${
                    formErrors.sender
                      ? 'bg-[rgba(254,242,242,0.2)] border border-[#F87171] focus:ring-1 focus:ring-red-400'
                      : 'bg-white border border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-1 focus:ring-[#35C6D4]/30'
                  } rounded-[8px] px-3 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all`}
                />
                {formErrors.sender && (
                  <div className="text-[11px] text-[#EF4444] mt-1 flex items-center gap-1 font-[500]">
                    <RotateCcw className="w-3 h-3 text-[#EF4444] shrink-0" />
                    <span>{formErrors.sender}</span>
                  </div>
                )}
              </div>
              <div>
                <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1">
                  Instansi / Lembaga <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Cth: Dinas Kelautan Provinsi Lampung"
                  value={letterForm.institution}
                  onChange={(e) => updateFormField('institution', e.target.value)}
                  className={`w-full h-[36px] ${
                    formErrors.institution
                      ? 'bg-[rgba(254,242,242,0.2)] border border-[#F87171] focus:ring-1 focus:ring-red-400'
                      : 'bg-white border border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-1 focus:ring-[#35C6D4]/30'
                  } rounded-[8px] px-3 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all`}
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
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1">
                Perihal Surat <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="Cth: Permohonan Peliputan Seminar Nasional Perikanan"
                value={letterForm.subject}
                onChange={(e) => updateFormField('subject', e.target.value)}
                className={`w-full h-[36px] ${
                  formErrors.subject
                    ? 'bg-[rgba(254,242,242,0.2)] border border-[#F87171] focus:ring-1 focus:ring-red-400'
                    : 'bg-white border border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-1 focus:ring-[#35C6D4]/30'
                } rounded-[8px] px-3 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all`}
              />
              {formErrors.subject && (
                <div className="text-[11px] text-[#EF4444] mt-1 flex items-center gap-1 font-[500]">
                  <RotateCcw className="w-3 h-3 text-[#EF4444] shrink-0" />
                  <span>{formErrors.subject}</span>
                </div>
              )}
            </div>

            {/* Row 5: Upload Berkas Surat */}
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1">
                Berkas / Dokumen Surat
                <span className="ml-1 text-[10px] font-normal text-slate-400">(PDF, JPG, PNG — maks. 5 MB)</span>
              </label>

              {uploadedFile ? (
                /* Preview card setelah file dipilih */
                <div className="space-y-2">
                  <div className="flex items-center gap-3 p-3 rounded-xl border border-blue-200 bg-blue-50">
                    <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                      {uploadedFile.base64.startsWith('data:image') ? (
                        <img
                          src={uploadedFile.base64}
                          alt="preview"
                          className="w-9 h-9 rounded-lg object-cover"
                        />
                      ) : (
                        <FileText className="w-4 h-4 text-[#003D58]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-blue-900 truncate">{uploadedFile.name}</p>
                      <p className="text-[10px] text-blue-600 mt-0.5">File siap diunggah</p>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Tombol Lihat Preview di Tab Baru */}
                      <a
                        href={getFileViewUrl(uploadedFile.base64)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold text-[#003D58] bg-white border border-blue-200 hover:bg-blue-50 shadow-2xs transition-colors cursor-pointer"
                        title="Buka berkas di tab baru"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Buka di Tab Baru
                      </a>
                      {/* Tombol Hapus */}
                      <button
                        type="button"
                        onClick={() => {
                          setUploadedFile(null);
                          updateFormField('fileUrl', '');
                        }}
                        className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer p-1"
                        title="Hapus file"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                  </div>

                  {/* Inline image preview (hanya untuk gambar) */}
                  {uploadedFile.base64.startsWith('data:image') && (
                    <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-h-48">
                      <img
                        src={uploadedFile.base64}
                        alt={uploadedFile.name}
                        className="w-full max-h-48 object-contain"
                      />
                    </div>
                  )}
                </div>
              ) : (
                /* Drop Zone via native <label> + <input type="file"> */
                <label
                  htmlFor="surat-file-input"
                  ref={dropZoneRef}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    const file = e.dataTransfer.files?.[0];
                    if (!file) return;
                    if (file.size > 5 * 1024 * 1024) { toast.error('Ukuran file maksimal 5 MB.'); return; }
                    const reader = new FileReader();
                    reader.onload = () => {
                      const base64 = reader.result as string;
                      setUploadedFile({ name: file.name, base64 });
                      updateFormField('fileUrl', base64);
                    };
                    reader.readAsDataURL(file);
                  }}
                  onDragOver={(e) => { e.preventDefault(); setIsDraggingFile(true); }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  className={`w-full rounded-xl border-2 border-dashed cursor-pointer transition-colors p-5 flex flex-col items-center justify-center gap-2 text-center select-none ${
                    isDraggingFile
                      ? 'border-[#35C6D4] bg-[#E0F7F9]'
                      : 'border-slate-200 bg-slate-50 hover:border-[#35C6D4] hover:bg-[#E0F7F9]/40'
                  }`}
                >
                  <input
                    id="surat-file-input"
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx"
                    className="sr-only hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      if (file.size > 5 * 1024 * 1024) { toast.error('Ukuran file maksimal 5 MB.'); return; }
                      const reader = new FileReader();
                      reader.onload = () => {
                        const base64 = reader.result as string;
                        setUploadedFile({ name: file.name, base64 });
                        updateFormField('fileUrl', base64);
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  <div className="w-9 h-9 rounded-full bg-[#E0F7F9] flex items-center justify-center pointer-events-none">
                    <FileText className="w-4 h-4 text-[#007985]" />
                  </div>
                  <div className="pointer-events-none">
                    <p className="text-[12px] font-semibold text-slate-700">
                      {isDraggingFile ? 'Lepas file di sini' : 'Seret & lepas file, atau klik untuk pilih'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">PDF, JPG, PNG, DOC — maks. 5 MB</p>
                  </div>
                </label>
              )}
            </div>
          </div>

          {/* ── BAGIAN 2: JADWAL & LOKASI KEGIATAN ── */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200/60 pb-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#003D58]" />
              <span>Agenda Waktu & Lokasi Kegiatan</span>
            </div>

            {/* Tanggal Pelaksanaan, Jam Mulai & Jam Selesai */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <CustomDatePicker
                label="Tanggal Acara"
                required
                value={letterForm.eventDate}
                error={formErrors.eventDate}
                placeholder="Pilih tanggal..."
                onChange={(val) => updateFormField('eventDate', val)}
              />
              <CustomTimePicker
                label="Jam Mulai"
                required
                value={letterForm.startTime}
                error={formErrors.startTime}
                placeholder="Contoh: 08:30"
                onChange={(val) => updateFormField('startTime', val)}
              />
              <CustomTimePicker
                label="Jam Selesai"
                value={letterForm.endTime}
                error={formErrors.endTime}
                placeholder="Contoh: 12:00"
                onChange={(val) => updateFormField('endTime', val)}
              />
            </div>

            {/* PENCARIAN JALAN & LOKASI KEGIATAN */}
            <StreetSearchInput
              label="Cari Jalan & Lokasi Kegiatan"
              required
              value={letterForm.eventLocation}
              error={formErrors.eventLocation}
              placeholder="Ketik nama jalan, gedung, atau instansi (cth: Jl. Soekarno Hatta, GSG Polinela)..."
              latitude={letterForm.latitude}
              longitude={letterForm.longitude}
              radius={letterForm.radius}
              onRadiusChange={(rad) => updateFormField('radius', rad)}
              onChange={(loc, coords) => {
                updateFormField('eventLocation', loc);
                if (coords) {
                  setLetterForm((prev) => ({
                    ...prev,
                    latitude: coords.lat,
                    longitude: coords.lng,
                  }));
                }
              }}
            />

            {/* Keterangan Tambahan */}
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1">Keterangan / Catatan Tambahan</label>
              <input
                type="text"
                placeholder="Catatan tambahan untuk tim peliputan (cth: Bawa tripod, dresscode batik)..."
                value={letterForm.notes}
                onChange={(e) => updateFormField('notes', e.target.value)}
                className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-1 focus:ring-[#35C6D4]/30 rounded-[8px] px-3 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Modal Footer */}
          <div className="flex justify-end items-center gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsCreateOpen(false);
                setIsEditOpen(false);
              }}
              className="h-[36px] px-4 bg-white border border-[#CBD5E1] hover:bg-slate-50 text-[#475569] rounded-full text-[12px] font-[600] cursor-pointer shadow-[0_1px_2px_rgba(0,0,0,0.05)] transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="h-[36px] px-5 bg-[#003D58] hover:bg-[#002F44] active:bg-[#00263A] text-white rounded-full text-[12px] font-[600] cursor-pointer shadow-xs shadow-[#003D58]/25 transition-all flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditOpen ? 'Simpan Perubahan' : 'Simpan Surat Masuk'}</span>
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
        maxWidth="6xl"
      >
        <form onSubmit={handleActivityFromLetterSubmit} className="space-y-4 text-[12px]">
          {/* Card 1: Informasi Sumber Rujukan Surat */}
          {selectedLetter && (
            <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200/60 pb-1.5">
                <FileText className="w-3.5 h-3.5 text-[#003D58] shrink-0" />
                <span>Informasi Rujukan Surat Masuk</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                <div className="bg-white/80 border border-slate-200/80 rounded-lg p-2.5 flex items-center gap-2 min-w-0">
                  <FileText className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block leading-tight">No. Surat</span>
                    <span className="font-bold text-slate-800 truncate block mt-0.5">{selectedLetter.letterNumber}</span>
                  </div>
                </div>
                <div className="bg-white/80 border border-slate-200/80 rounded-lg p-2.5 flex items-center gap-2 min-w-0">
                  <Building className="w-4 h-4 text-slate-400 shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block leading-tight">Pengirim / Instansi</span>
                    <span className="font-bold text-slate-800 truncate block mt-0.5">{selectedLetter.sender || selectedLetter.institution}</span>
                  </div>
                </div>
                <div className="bg-white/80 border border-slate-200/80 rounded-lg p-2.5 flex items-center gap-2 min-w-0">
                  <MapPin className="w-4 h-4 text-[#003D58] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-[#003D58] uppercase font-semibold block leading-tight">Lokasi Acara</span>
                    <span className="font-bold text-[#003D58] truncate block mt-0.5 bg-sky-50 px-2 py-0.5 rounded border border-sky-200/70 inline-block max-w-full">
                      {selectedLetter.eventLocation || 'Lokasi belum ditentukan'}
                    </span>
                  </div>
                </div>
              </div>
              {/* Row 2: Perihal Surat Full-Width (Never Overlaps) */}
              <div className="bg-white/80 border border-slate-200/80 rounded-lg p-2.5 flex items-start gap-2.5 min-w-0">
                <FileText className="w-4 h-4 text-[#003D58] shrink-0 mt-0.5" />
                <div className="min-w-0 flex-1">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block leading-tight mb-0.5">Perihal Surat</span>
                  <p className="font-medium text-slate-700 text-xs leading-relaxed break-words">
                    {selectedLetter.subject}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Card 2: Rencana Peliputan */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-3.5">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200/60 pb-1.5">
              <CalendarCheck2 className="w-3.5 h-3.5 text-[#003D58]" />
              <span>Rencana Agenda Kegiatan Peliputan</span>
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
                className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#003D58] focus:ring-1 focus:ring-[#003D58]/30 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <CustomDatePicker
                label="Tanggal Pelaksanaan"
                required
                value={activityForm.date}
                placeholder="Pilih tanggal..."
                onChange={(val) => setActivityForm({ ...activityForm, date: val })}
              />
              <CustomTimePicker
                label="Jam Mulai"
                required
                value={activityForm.startTime}
                placeholder="Contoh: 08:30"
                onChange={(val) => setActivityForm({ ...activityForm, startTime: val })}
              />
              <CustomTimePicker
                label="Jam Selesai"
                required
                value={activityForm.endTime}
                placeholder="Contoh: 12:00"
                onChange={(val) => setActivityForm({ ...activityForm, endTime: val })}
              />
            </div>

            {/* Personel PIC Lapangan (Opsional) */}
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">
                Personel PIC Lapangan <span className="text-slate-400 font-normal">(Opsional)</span>
              </label>
              <FilterDropdown
                value={activityForm.picId ? String(activityForm.picId) : ''}
                onChange={(val) => setActivityForm({ ...activityForm, picId: val ? Number(val) : 0 })}
                options={users
                  .filter((u) => u.role === 'USER' && u.status === 'AKTIF')
                  .map((u) => ({
                    value: String(u.id),
                    label: `${u.fullName} (${u.roleLabel || 'Anggota Humas'})`,
                  }))}
                placeholder="Otomatis Ditentukan Sistem / Disposisi Kepala Humas"
                icon={false}
                className="w-full"
              />
            </div>

            {/* Pencarian Jalan & Lokasi Kegiatan (Persis seperti Input Surat) */}
            <StreetSearchInput
              label="Cari Jalan & Lokasi Kegiatan"
              required
              value={activityForm.location}
              placeholder="Ketik nama jalan, gedung, atau instansi (cth: Jl. Soekarno Hatta, GSG Polinela)..."
              latitude={activityForm.latitude}
              longitude={activityForm.longitude}
              radius={activityForm.radius}
              onRadiusChange={(rad) => setActivityForm((prev) => ({ ...prev, radius: rad }))}
              onChange={(loc, coords) => {
                setActivityForm((prev) => ({
                  ...prev,
                  location: loc,
                  ...(coords ? { latitude: coords.lat, longitude: coords.lng } : {}),
                }));
              }}
            />

            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">
                Deskripsi &amp; Rencana Pelaksanaan <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                required
                value={activityForm.description}
                onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                className="w-full min-h-[70px] bg-white border border-[#E2E8F0] focus:border-[#003D58] focus:ring-1 focus:ring-[#003D58]/30 rounded-[8px] p-3 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateActivityOpen(false)}
              className="h-[36px] px-4 bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] text-[12px] font-[600] rounded-full transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              className="h-[36px] px-5 bg-[#003D58] hover:bg-[#002F44] active:bg-[#00263A] text-white text-[12px] font-[600] rounded-full shadow-xs shadow-[#003D58]/25 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Ajukan Kegiatan ke Kepala Humas</span>
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
        maxWidth="2xl"
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
                <CalendarCheck2 className="w-4 h-4 text-[#003D58] shrink-0" />
                <span>Diterima: <strong>{formatDateID(selectedLetter.receivedDate.split('T')[0])}</strong></span>
              </div>
            </div>

            {/* Banner Khusus: Surat Disetujui Kepala Humas */}
            {selectedLetter.status === 'DISETUJUI' && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-emerald-950">
                      Surat Masuk Telah Disetujui oleh Kepala Humas
                    </h5>
                    <p className="text-[11px] text-emerald-700 mt-0.5 leading-relaxed">
                      {currentUser?.role === 'SUPER_ADMIN'
                        ? 'Surat ini resmi disetujui. Silakan tindak lanjuti segera dengan membuat agenda kegiatan peliputan bagi tim, atau selesaikan dan arsipkan ke Riwayat Surat.'
                        : 'Surat ini resmi disetujui dan sedang menunggu penugasan kegiatan oleh Kepala Humas.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {currentUser?.role === 'SUPER_ADMIN' && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDetailOpen(false);
                        handleOpenCreateActivity(selectedLetter);
                      }}
                      className="px-4 py-2 bg-[#003D58] hover:bg-[#002f44] text-white rounded-full text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <CalendarPlus className="w-4 h-4" />
                      <span>Buat Agenda Kegiatan</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleCompleteLetter(selectedLetter.id)}
                    className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                    title="Arsipkan ke Riwayat Surat"
                  >
                    <Archive className="w-3.5 h-3.5 text-slate-500" />
                    <span>Selesaikan</span>
                  </button>
                </div>
              </div>
            )}

            {/* Quick Approval untuk Kepala Humas */}
            {currentUser?.role === 'SUPER_ADMIN' && selectedLetter.status === 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-amber-950">
                      Menunggu Keputusan Anda (Kepala Humas)
                    </h5>
                    <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                      Apakah Anda menyetujui surat masuk ini untuk diagendakan peliputan oleh tim?
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleApproveLetter(selectedLetter.id)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Setujui Surat</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsDetailOpen(false);
                      setIsRejectModalOpen(true);
                    }}
                    className="px-3 py-2 bg-white hover:bg-red-50 border border-red-300 text-red-600 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-2xs transition-colors cursor-pointer"
                  >
                    <XCircle className="w-3.5 h-3.5 text-red-500" />
                    <span>Tolak</span>
                  </button>
                </div>
              </div>
            )}

            {/* Perihal Highlight Card */}
            <div className="bg-sky-50/70 border border-sky-200/80 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-[#003D58] text-[11px] font-bold uppercase tracking-wider mb-1.5">
                <FileText className="w-4 h-4 text-[#003D58]" />
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
                    <Building className="w-3.5 h-3.5 text-[#003D58] shrink-0" />
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
                    <CalendarCheck2 className="w-3.5 h-3.5 text-[#003D58] shrink-0" />
                    {formatDateID(selectedLetter.receivedDate.split('T')[0])}
                  </span>
                </div>
              </div>
            </div>

            {/* Jadwal & Lokasi Pelaksanaan Kegiatan */}
            {(selectedLetter.eventLocation || selectedLetter.eventDate) && (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
                  <MapPin className="w-4 h-4 text-[#003D58] shrink-0" />
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

                {/* Tautan Lokasi di Peta */}
                {(selectedLetter.latitude || selectedLetter.longitude || selectedLetter.eventLocation) && (
                  <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px]">
                    <span className="text-slate-600 flex items-center gap-1 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-[#003D58]" />
                      <span>Lokasi Tersimpan di Sistem</span>
                    </span>
                    <a
                      href={
                        selectedLetter.latitude && selectedLetter.longitude
                          ? `https://www.google.com/maps?q=${selectedLetter.latitude},${selectedLetter.longitude}`
                          : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                              selectedLetter.eventLocation || 'Polinela Bandar Lampung'
                            )}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#003D58] hover:text-[#002F44] font-semibold flex items-center gap-1 underline underline-offset-2"
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
                href={getFileViewUrl(selectedLetter.fileUrl)}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-xl bg-white border border-blue-200 hover:border-blue-400 hover:bg-blue-50/40 shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group cursor-pointer"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#003D58] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <FileText className="w-5 h-5 text-[#003D58]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-[#003D58] transition-colors truncate">
                      Berkas Surat Digital
                    </p>
                    <p className="text-[11px] text-slate-400 truncate max-w-xs sm:max-w-md">
                      {selectedLetter.fileUrl.startsWith('data:') ? 'Dokumen Terunggah Langsung' : selectedLetter.fileUrl}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-semibold text-white bg-[#35C6D4] group-hover:bg-[#2CB4C1] px-3.5 py-1.5 rounded-lg shadow-xs shrink-0 transition-colors">
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Buka di Tab Baru</span>
                </div>
              </a>
            ) : (
              <div className="p-3 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-400">
                Tidak ada berkas digital yang dilampirkan.
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              {currentUser?.role !== 'SUPER_ADMIN' && (
                <CustomButton
                  variant="secondary"
                  size="sm"
                  icon={Edit3}
                  onClick={() => {
                    setIsDetailOpen(false);
                    handleOpenEdit(selectedLetter);
                  }}
                >
                  Edit Surat
                </CustomButton>
              )}
              <CustomButton
                variant="primary"
                size="sm"
                onClick={() => setIsDetailOpen(false)}
              >
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

      {/* Reject Confirmation Modal for Kepala Humas */}
      <CustomModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setRejectReason('');
        }}
        title="Tolak Surat Masuk"
        maxWidth="md"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-800 text-xs">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <span>Anda akan menolak surat <strong>{selectedLetter?.letterNumber}</strong>. Mohon berikan alasan penolakan.</span>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Alasan Penolakan <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Cth: Jadwal bertabrakan dengan agenda wisuda, atau berkas kurang lengkap..."
              className="w-full bg-white border border-slate-200 focus:border-red-400 focus:ring-1 focus:ring-red-400 rounded-lg p-2.5 text-xs text-slate-800 focus:outline-none"
            />
          </div>
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => {
                setIsRejectModalOpen(false);
                setRejectReason('');
              }}
              className="px-3.5 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleRejectLetter}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs cursor-pointer"
            >
              Konfirmasi Tolak Surat
            </button>
          </div>
        </div>
      </CustomModal>

      {/* Modal detail dan lainnya tetap */}

      {/* Universal Action Confirm Modal */}
      <ConfirmModal
        isOpen={confirmState.isOpen}
        onClose={() => setConfirmState((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={async () => {
          await confirmState.onConfirm();
          setConfirmState((prev) => ({ ...prev, isOpen: false }));
        }}
        title={confirmState.title}
        message={confirmState.message}
        confirmText={confirmState.confirmText}
        variant={confirmState.variant}
        isLoading={isConfirming}
      />
    </AdminLayout>
  );
}
