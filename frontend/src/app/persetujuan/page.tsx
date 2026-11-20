'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  DataTable,
  Column,
  StatusBadge,
  CustomButton,
  CustomModal,
  ConfirmModal,
  StreetSearchInput,
  CustomDatePicker,
  CustomTimePicker,
  TableSkeleton,
} from '@/components/common';
import {
  ShieldCheck,
  Mail,
  UserPlus,
  CheckCircle,
  Eye,
  CheckCircle2,
  XCircle,
  Clock,
  Calendar,
  MapPin,
  ExternalLink,
  RotateCcw,
  AlertTriangle,
  UserCheck,
  Camera,
  Package,
  Wrench,
  AlertCircle,
  Search,
  X,
  FileText,
  Building,
  Check,
  User as UserIcon,
  CalendarCheck2,
  Smartphone,
  Image as ImageIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { incomingLetterService, activityService, userService, contentService, loanService } from '@/services';
import { IncomingLetter, Activity, User, ContentPlan } from '@/types';
import { formatDateID } from '@/utils/formatters';
import { openFileInNewTab, getFileViewUrl } from '@/utils/api-helpers';
import { getStoredUser } from '@/utils/session';

function PersetujuanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'surat' | 'penugasan' | 'akhir' | 'konten'>('surat');

  // Synchronize tab with URL query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'surat' || tabParam === 'penugasan' || tabParam === 'akhir' || tabParam === 'konten') {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  // Data states
  const [lettersPending, setLettersPending] = useState<IncomingLetter[]>([]);
  const [lettersApproved, setLettersApproved] = useState<IncomingLetter[]>([]);
  const [activitiesPendingAkhir, setActivitiesPendingAkhir] = useState<Activity[]>([]);
  const [contentsPending, setContentsPending] = useState<ContentPlan[]>([]);
  const [users, setUsers] = useState<User[]>([]);

  // Selection states
  const [selectedLetter, setSelectedLetter] = useState<IncomingLetter | null>(null);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [selectedContent, setSelectedContent] = useState<ContentPlan | null>(null);

  // Modal controls
  const [isDetailLetterOpen, setIsDetailLetterOpen] = useState(false);
  const [isRejectLetterOpen, setIsRejectLetterOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isDetailActivityOpen, setIsDetailActivityOpen] = useState(false);
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');

  const [isDetailContentOpen, setIsDetailContentOpen] = useState(false);
  const [isContentRevisionOpen, setIsContentRevisionOpen] = useState(false);
  const [contentRevisionNotes, setContentRevisionNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAssignCatSuggestions, setShowAssignCatSuggestions] = useState(false);
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

  // Penugasan Form
  const [assignForm, setAssignForm] = useState({
    title: '',
    category: 'Liputan Eksternal',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '12:00',
    location: '',
    latitude: '',
    longitude: '',
    radius: '100',
    description: '',
    picId: 0,
    memberIds: [] as number[],
  });

  // Equipment selection state
  const [availableEquipment, setAvailableEquipment] = useState<any[]>([]);
  const [selectedEquipments, setSelectedEquipments] = useState<{ equipmentId: number; quantity: number }[]>([]);
  const [loadingEquipment, setLoadingEquipment] = useState(false);
  const [equipmentSearch, setEquipmentSearch] = useState('');

  const loadEquipmentAvailability = async (dateStr: string, startT: string, endT: string) => {
    if (!dateStr) return;
    setLoadingEquipment(true);
    try {
      const data = await loanService.getAvailability({
        date: dateStr,
        startTime: startT || '08:00',
        endTime: endT || '12:00',
      });
      setAvailableEquipment(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load equipment availability:', err);
    } finally {
      setLoadingEquipment(false);
    }
  };

  const loadData = async () => {
    try {
      // 1. Fetch pending letters for approval
      const allLetters = await incomingLetterService.getAll();
      setLettersPending(allLetters.filter((l: IncomingLetter) => 
        l.status === 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS' || 
        l.status === 'MENUNGGU_VERIFIKASI_ADMIN' || 
        l.status === 'MENUNGGU_PERSETUJUAN' || 
        l.status === 'BARU'
      ));
      
      // 2. Fetch approved letters awaiting assignment
      setLettersApproved(allLetters.filter((l: IncomingLetter) => l.status === 'DISETUJUI'));

      // 3. Fetch activities awaiting final approval
      const actResult = await activityService.getAll({ status: 'MENUNGGU_PERSETUJUAN_AKHIR' });
      setActivitiesPendingAkhir(actResult.items || []);

      // 4. Fetch content plans awaiting Kepala Humas approval
      const contentRes = await contentService.getAll({ page: 1, pageSize: 100 });
      const pendingCP = (contentRes.items || []).filter((cp: any) =>
        cp.status === 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS' ||
        cp.status === 'MENUNGGU' ||
        cp.status === 'MENUNGGU_VERIFIKASI_ADMIN'
      );
      setContentsPending(pendingCP);

      // 5. Fetch users for assignment dropdown
      const allUsers = await userService.getAll();
      setUsers(allUsers.filter((u: User) => u.role === 'USER' && u.status === 'AKTIF'));
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat data persetujuan.');
    }
  };

  useEffect(() => {
    const user = getStoredUser();
    setCurrentUser(user);
    if (user?.role !== 'SUPER_ADMIN') {
      toast.error('Akses ditolak. Halaman ini hanya untuk Kepala Humas.');
      router.push('/dashboard');
      return;
    }

    const init = async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    };
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tab change handler
  const handleTabChange = (tab: 'surat' | 'penugasan' | 'akhir' | 'konten') => {
    setActiveTab(tab);
    router.replace(`/persetujuan?tab=${tab}`, { scroll: false });
  };

  // Letter actions
  const handleApproveLetter = (id: number) => {
    setConfirmState({
      isOpen: true,
      title: 'Konfirmasi Persetujuan Surat',
      message: 'Apakah Anda yakin ingin menyetujui surat ini? Surat yang disetujui akan dipindahkan ke daftar penugasan peliputan.',
      confirmText: 'Ya, Setujui Surat',
      variant: 'primary',
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          await incomingLetterService.approve(id);
          toast.success('Surat telah disetujui!');
          setIsDetailLetterOpen(false);
          await loadData();
        } catch {
          toast.error('Gagal menyetujui surat.');
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  const handleRejectLetter = async () => {
    if (!selectedLetter) return;
    if (!rejectReason.trim()) {
      toast.warning('Alasan penolakan wajib diisi!');
      return;
    }
    setIsSubmitting(true);
    try {
      await incomingLetterService.reject(selectedLetter.id, rejectReason);
      toast.success('Surat telah ditolak.');
      setIsRejectLetterOpen(false);
      setIsDetailLetterOpen(false);
      setRejectReason('');
      await loadData();
    } catch {
      toast.error('Gagal menolak surat.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Open Assignment modal
  const handleOpenAssign = (letter: IncomingLetter) => {
    const lDate = letter.eventDate ? letter.eventDate.split('T')[0] : new Date().toISOString().split('T')[0];
    const sTime = letter.startTime || '08:00';
    const eTime = letter.endTime || '12:00';
    setSelectedLetter(letter);
    setSelectedEquipments([]);
    setEquipmentSearch('');
    setAssignForm({
      title: `Peliputan: ${letter.subject}`,
      category: 'Liputan Eksternal',
      date: lDate,
      startTime: sTime,
      endTime: eTime,
      location: letter.eventLocation || letter.institution || '', // Physical venue prefilled
      latitude: letter.latitude != null ? String(letter.latitude) : '',
      longitude: letter.longitude != null ? String(letter.longitude) : '',
      radius: letter.radius != null ? String(letter.radius) : '100',
      description: `Kegiatan tindak lanjut surat No. ${letter.letterNumber}. Perihal: ${letter.subject}. Instansi Pengirim: ${letter.institution}.`,
      picId: 0,
      memberIds: [],
    });
    setIsAssignOpen(true);
    loadEquipmentAvailability(lDate, sTime, eTime);
  };

  const handleAssignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLetter) return;
    if (!assignForm.location.trim()) {
      toast.warning('Lokasi kegiatan wajib diisi!');
      return;
    }
    if (!assignForm.picId) {
      toast.warning('PIC kegiatan wajib dipilih!');
      return;
    }
    setIsSubmitting(true);
    try {
      await incomingLetterService.createActivity(selectedLetter.id, {
        title: assignForm.title,
        category: assignForm.category,
        date: `${assignForm.date}T08:00:00Z`,
        startTime: assignForm.startTime,
        endTime: assignForm.endTime,
        location: assignForm.location.trim() || selectedLetter.eventLocation || selectedLetter.institution,
        latitude: assignForm.latitude ? parseFloat(assignForm.latitude) : undefined,
        longitude: assignForm.longitude ? parseFloat(assignForm.longitude) : undefined,
        radius: assignForm.radius ? parseFloat(assignForm.radius) : 100,
        description: assignForm.description,
        picId: assignForm.picId,
        memberIds: assignForm.memberIds,
        equipmentItems: selectedEquipments.filter((eq) => eq.quantity > 0),
      });
      toast.success('Penugasan berhasil dibuat dan peralatan dialokasikan ke Tim!');
      setIsAssignOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyimpan penugasan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Final Activity approvals
  const handleApproveActivityFinish = (id: number) => {
    setConfirmState({
      isOpen: true,
      title: 'Konfirmasi Selesai Kegiatan',
      message: 'Apakah Anda yakin kegiatan ini telah selesai dan seluruh hasil dokumentasi telah diperiksa?',
      confirmText: 'Ya, Selesaikan & Arsipkan',
      variant: 'primary',
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          await activityService.approveFinish(id);
          toast.success('Kegiatan berhasil diselesaikan & diarsipkan!');
          setIsDetailActivityOpen(false);
          await loadData();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal menyetujui kegiatan selesai.');
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  const handleReturnRevision = async () => {
    if (!selectedActivity) return;
    if (!revisionNotes.trim()) {
      toast.warning('Catatan perbaikan wajib diisi!');
      return;
    }
    setIsSubmitting(true);
    try {
      await activityService.returnRevision(selectedActivity.id, revisionNotes);
      toast.success('Kegiatan dikembalikan ke tim untuk perbaikan.');
      setIsRevisionOpen(false);
      setIsDetailActivityOpen(false);
      setRevisionNotes('');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengembalikan kegiatan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Content Plan Approvals
  const handleApproveContentPlan = (id: number) => {
    setConfirmState({
      isOpen: true,
      title: 'Konfirmasi Persetujuan Konten',
      message: 'Apakah Anda yakin ingin menyetujui Content Plan ini? Konten akan ditandai disetujui dan siap ditayangkan.',
      confirmText: 'Ya, Setujui Konten',
      variant: 'primary',
      onConfirm: async () => {
        setIsSubmitting(true);
        try {
          await contentService.approve(id);
          toast.success('Content Plan berhasil disetujui & siap ditayangkan!');
          setIsDetailContentOpen(false);
          await loadData();
        } catch (err: any) {
          toast.error(err.response?.data?.message || 'Gagal menyetujui Content Plan.');
        } finally {
          setIsSubmitting(false);
        }
      },
    });
  };

  const handleReturnContentRevision = async () => {
    if (!selectedContent) return;
    if (!contentRevisionNotes.trim()) {
      toast.warning('Catatan revisi wajib diisi!');
      return;
    }
    setIsSubmitting(true);
    try {
      await contentService.requestRevision(selectedContent.id, contentRevisionNotes);
      toast.success('Permintaan revisi berhasil dikirimkan ke PIC.');
      setIsContentRevisionOpen(false);
      setIsDetailContentOpen(false);
      setContentRevisionNotes('');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengirim revisi konten.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Persetujuan & Penugasan" allowedRoles={['SUPER_ADMIN']}>
        <TableSkeleton rows={5} />
      </AdminLayout>
    );
  }

  // Column definitions for Surat Pending Table
  const suratColumns: Column<IncomingLetter>[] = [
    {
      key: 'letterNumber',
      header: 'No. Surat & Pengirim',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-800">{item.letterNumber}</p>
          <p className="text-[11px] text-slate-400 font-medium">{item.sender} ({item.institution})</p>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Perihal',
      render: (item) => (
        <span className="text-slate-700 text-xs font-semibold truncate max-w-xs block" title={item.subject}>
          {item.subject}
        </span>
      ),
    },
    {
      key: 'receivedDate',
      header: 'Tgl. Diterima',
      render: (item) => (
        <span className="text-slate-500 font-medium text-xs whitespace-nowrap">
          {formatDateID(item.receivedDate.split('T')[0])}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Tindakan',
      render: (item) => (
        <div className="flex items-center gap-2">
          <CustomButton
            variant="outline"
            size="sm"
            icon={Eye}
            onClick={() => {
              setSelectedLetter(item);
              setIsDetailLetterOpen(true);
            }}
          >
            Review
          </CustomButton>
        </div>
      ),
      className: 'w-24 text-center',
    },
  ];

  // Column definitions for Surat Awaiting Assignment
  const penugasanColumns: Column<IncomingLetter>[] = [
    {
      key: 'letterNumber',
      header: 'No. Surat / Pengirim',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-800">{item.letterNumber}</p>
          <p className="text-[11px] text-slate-400 font-medium">{item.sender} ({item.institution})</p>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Perihal Surat',
      render: (item) => (
        <span className="text-slate-700 text-xs font-semibold truncate max-w-xs block" title={item.subject}>
          {item.subject}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Penugasan',
      render: (item) => (
        <CustomButton
          variant="primary"
          size="sm"
          icon={UserPlus}
          onClick={() => handleOpenAssign(item)}
        >
          Atur Penugasan
        </CustomButton>
      ),
      className: 'w-32 text-center',
    },
  ];

  // Column definitions for Activities Pending Final Approval
  const activityColumns: Column<Activity>[] = [
    {
      key: 'title',
      header: 'Judul Kegiatan & Lokasi',
      render: (item) => (
        <div>
          <p className="font-bold text-slate-800">{item.title}</p>
          <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1"><MapPin className="w-3 h-3 text-slate-400 shrink-0" /> {item.location}</p>
        </div>
      ),
    },
    {
      key: 'pic',
      header: 'PIC',
      render: (item) => (
        <span className="text-slate-700 text-xs font-semibold">
          {item.pic?.fullName ?? '-'}
        </span>
      ),
    },
    {
      key: 'date',
      header: 'Pelaksanaan',
      render: (item) => (
        <span className="text-slate-500 font-medium text-xs whitespace-nowrap">
          {formatDateID(item.date.split('T')[0])}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Keputusan',
      render: (item) => (
        <CustomButton
          variant="outline"
          size="sm"
          icon={Eye}
          onClick={() => {
            setSelectedActivity(item);
            setIsDetailActivityOpen(true);
          }}
        >
          Periksa Akhir
        </CustomButton>
      ),
      className: 'w-28 text-center',
    },
  ];

  // Column definitions for Content Plan Table
  const contentColumns: Column<ContentPlan>[] = [
    {
      key: 'title',
      header: 'Judul Konten & Platform',
      render: (item) => (
        <div>
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="bg-blue-50 text-[#003D58] text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
              {item.platform} • {item.contentType}
            </span>
          </div>
          <p className="font-bold text-slate-800 leading-snug">{item.title}</p>
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>
        </div>
      ),
    },
    {
      key: 'pic',
      header: 'PIC Kreator',
      render: (item) => (
        <span className="text-slate-700 text-xs font-semibold">
          {item.pic?.fullName ?? '-'}
        </span>
      ),
    },
    {
      key: 'deadline',
      header: 'Deadline Tayang',
      render: (item) => (
        <span className="text-slate-500 font-medium text-xs whitespace-nowrap">
          {formatDateID(item.deadline.split('T')[0])}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'action',
      header: 'Keputusan',
      render: (item) => (
        <CustomButton
          variant="outline"
          size="sm"
          icon={Eye}
          onClick={() => {
            setSelectedContent(item);
            setIsDetailContentOpen(true);
          }}
        >
          Review
        </CustomButton>
      ),
      className: 'w-28 text-center',
    },
  ];

  const categoriesList = [
    'Liputan Eksternal',
    'Liputan Internal',
    'Press Release',
    'Dokumentasi Acara',
    'Konferensi Pers',
    'Kunjungan Kerja',
    'Seminar / Workshop',
    'Wisuda / Dies Natalis',
  ];

  const labelCls = 'block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5';
  const inputCls =
    'w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-1 focus:ring-[#35C6D4]/30 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all';
  const selectCls =
    'w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-1 focus:ring-[#35C6D4]/30 rounded-[8px] px-3 text-[12px] text-[#334155] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all cursor-pointer';
  const textareaCls =
    'w-full min-h-[70px] bg-white border border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-1 focus:ring-[#35C6D4]/30 rounded-[8px] p-3 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all resize-none';

  const getTabHeader = () => {
    switch (activeTab) {
      case 'surat':
        return {
          title: `Persetujuan Surat Masuk (${lettersPending.length})`,
          desc: 'Tinjau disposisi dan berikan persetujuan atau penolakan surat masuk dari instansi mitra.',
        };
      case 'penugasan':
        return {
          title: `Penugasan Tim Humas (${lettersApproved.length})`,
          desc: 'Delegasikan personel penanggung jawab (PIC), anggota pelaksana liputan, serta alokasi alat.',
        };
      case 'akhir':
        return {
          title: `Persetujuan Akhir Kegiatan (${activitiesPendingAkhir.length})`,
          desc: 'Verifikasi kelengkapan dokumentasi, tautan publikasi, dan laporan kegiatan yang telah diselesaikan tim.',
        };
      case 'konten':
        return {
          title: `Persetujuan Content Plan (${contentsPending.length})`,
          desc: 'Tinjau dan setujui rancangan rencana publikasi konten media sosial kehumasan.',
        };
      default:
        return {
          title: 'Pusat Persetujuan & Penugasan',
          desc: 'Lakukan peninjauan surat masuk, delegasikan anggota tim, dan verifikasi akhir kegiatan selesai.',
        };
    }
  };

  return (
    <AdminLayout title="Pusat Keputusan Kepala Humas" allowedRoles={['SUPER_ADMIN']}>
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">{getTabHeader().title}</h1>
          <p className="text-xs text-slate-600 mt-0.5">
            {getTabHeader().desc}
          </p>
        </div>
      </div>

      {/* Tab Panels */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        {activeTab === 'surat' && (
          <DataTable
            columns={suratColumns}
            data={lettersPending}
            emptyMessage="Tidak ada surat masuk yang membutuhkan persetujuan Anda saat ini."
          />
        )}

        {activeTab === 'penugasan' && (
          <DataTable
            columns={penugasanColumns}
            data={lettersApproved}
            emptyMessage="Tidak ada surat yang disetujui yang menunggu penugasan saat ini."
          />
        )}

        {activeTab === 'akhir' && (
          <DataTable
            columns={activityColumns}
            data={activitiesPendingAkhir}
            emptyMessage="Tidak ada kegiatan selesai yang menunggu persetujuan akhir Anda saat ini."
          />
        )}

        {activeTab === 'konten' && (
          <DataTable
            columns={contentColumns}
            data={contentsPending}
            emptyMessage="Tidak ada Content Plan yang membutuhkan persetujuan Anda saat ini."
          />
        )}
      </div>

      {/* ── MODAL: DETAIL SURAT ── */}
      <CustomModal
        isOpen={isDetailLetterOpen}
        onClose={() => setIsDetailLetterOpen(false)}
        title="Detail Pengajuan Surat"
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
                <CalendarCheck2 className="w-4 h-4 text-[#003D58] shrink-0" />
                <span>Diterima: <strong>{formatDateID(selectedLetter.receivedDate.split('T')[0])}</strong></span>
              </div>
            </div>

            {/* Perihal Highlight Card */}
            <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-4">
              <div className="flex items-center gap-1.5 text-blue-900 text-[11px] font-bold uppercase tracking-wider mb-1.5">
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
                      className="text-[#003D58] hover:text-blue-900 font-semibold flex items-center gap-1 underline underline-offset-2"
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
            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <CustomButton variant="outline" size="sm" onClick={() => setIsDetailLetterOpen(false)}>
                Tutup
              </CustomButton>
              <CustomButton
                variant="danger"
                size="sm"
                icon={XCircle}
                onClick={() => setIsRejectLetterOpen(true)}
                disabled={isSubmitting}
              >
                Tolak
              </CustomButton>
              <CustomButton
                variant="primary"
                size="sm"
                icon={CheckCircle2}
                onClick={() => handleApproveLetter(selectedLetter.id)}
                disabled={isSubmitting}
              >
                Setujui Surat
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>

      {/* ── MODAL: TOLAK SURAT ── */}
      <CustomModal
        isOpen={isRejectLetterOpen}
        onClose={() => setIsRejectLetterOpen(false)}
        title="Alasan Penolakan Surat"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-500 font-medium">
            Masukkan catatan/alasan mengapa pengajuan surat ini ditolak. Alasan ini akan dikirimkan kepada Admin Humas.
          </p>
          <textarea
            required
            rows={3}
            placeholder="Alasan penolakan..."
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-red-500/20 text-xs"
          />
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <CustomButton variant="outline" size="sm" onClick={() => setIsRejectLetterOpen(false)}>Batal</CustomButton>
            <CustomButton variant="danger" size="sm" onClick={handleRejectLetter} disabled={isSubmitting || !rejectReason.trim()}>
              Tolak Surat
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ── MODAL: PENUGASAN ── */}
      <CustomModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        title="Atur Penugasan Kegiatan"
        subtitle={selectedLetter ? `Referensi Surat: ${selectedLetter.letterNumber}` : ''}
        maxWidth="6xl"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">

          {/* INFORMASI SURAT & LOKASI KEGIATAN — read-only preview */}
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
                    <span className="font-bold text-slate-800 truncate block mt-0.5">{selectedLetter.institution || selectedLetter.sender}</span>
                  </div>
                </div>
                <div className="bg-white/80 border border-slate-200/80 rounded-lg p-2.5 flex items-center gap-2 min-w-0">
                  <MapPin className="w-4 h-4 text-[#003D58] shrink-0" />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] text-[#003D58] uppercase font-semibold block leading-tight">Lokasi Acara</span>
                    <span className="font-bold text-blue-900 truncate block mt-0.5 bg-blue-50 px-2 py-0.5 rounded border border-blue-200/70 inline-block max-w-full">
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

          {/* DETAIL PENUGASAN KEGIATAN */}
          <div className="bg-slate-50/70 border border-slate-200/80 rounded-xl p-3.5 space-y-3.5">
            <div className="flex items-center gap-1.5 text-slate-700 font-bold text-[11px] uppercase tracking-wider border-b border-slate-200/60 pb-1.5">
              <CalendarCheck2 className="w-3.5 h-3.5 text-[#003D58]" />
              <span>Agenda Rencana &amp; Penugasan Kegiatan</span>
            </div>

            {/* Row 1: Judul Kegiatan */}
            <div>
              <label className={labelCls}>Judul Kegiatan *</label>
              <input
                type="text"
                required
                value={assignForm.title}
                onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })}
                placeholder="Contoh: Liputan Kunjungan Kerja Direktur"
                className={inputCls}
              />
            </div>

            {/* Row 2: Kategori & Personel PIC */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Kategori *</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={assignForm.category}
                    onChange={(e) => setAssignForm({ ...assignForm, category: e.target.value })}
                    onFocus={() => setShowAssignCatSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowAssignCatSuggestions(false), 200)}
                    placeholder="Ketik kategori kegiatan"
                    className={inputCls}
                  />
                  {showAssignCatSuggestions && categoriesList.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-[#E2E8F0] rounded-[8px] shadow-lg max-h-40 overflow-y-auto">
                      {categoriesList
                        .filter((cat) => cat.toLowerCase().includes(assignForm.category.toLowerCase()))
                        .map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onMouseDown={() => {
                              setAssignForm({ ...assignForm, category: cat });
                              setShowAssignCatSuggestions(false);
                            }}
                            className="w-full text-left px-4 py-2 text-[12px] hover:bg-slate-50 text-slate-700 transition-colors"
                          >
                            {cat}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className={labelCls}>Personel PIC *</label>
                <select
                  required
                  value={assignForm.picId}
                  onChange={(e) => {
                    const pid = Number(e.target.value);
                    setAssignForm({
                      ...assignForm,
                      picId: pid,
                      memberIds: assignForm.memberIds.filter((id) => id !== pid),
                    });
                  }}
                  className={selectCls}
                >
                  <option value={0} disabled>Pilih PIC Anggota</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.fullName} {u.roleLabel ? `(${u.roleLabel})` : '(Tim Humas)'}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Row 3: Tanggal Pelaksanaan, Mulai (WIB), Selesai (WIB) in 3 columns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <CustomDatePicker
                label="Tanggal Pelaksanaan"
                required
                value={assignForm.date}
                onChange={(val) => setAssignForm({ ...assignForm, date: val })}
              />
              <CustomTimePicker
                label="Mulai (WIB)"
                required
                value={assignForm.startTime}
                onChange={(val) => setAssignForm({ ...assignForm, startTime: val })}
              />
              <CustomTimePicker
                label="Selesai (WIB)"
                value={assignForm.endTime}
                onChange={(val) => setAssignForm({ ...assignForm, endTime: val })}
              />
            </div>

            {/* Pencarian Jalan & Lokasi Kegiatan (Persis seperti Input Surat) */}
            <StreetSearchInput
              label="Cari Jalan & Lokasi Kegiatan"
              required
              value={assignForm.location}
              placeholder="Ketik nama jalan, gedung, atau instansi (cth: Jl. Soekarno Hatta, GSG Polinela)..."
              latitude={assignForm.latitude}
              longitude={assignForm.longitude}
              radius={assignForm.radius}
              onRadiusChange={(rad) => setAssignForm((prev) => ({ ...prev, radius: rad }))}
              onChange={(loc, coords) => {
                setAssignForm((prev) => ({
                  ...prev,
                  location: loc,
                  ...(coords ? { latitude: coords.lat, longitude: coords.lng } : {}),
                }));
              }}
            />

            {/* Deskripsi / Catatan Tugas */}
            <div>
              <label className={labelCls}>Deskripsi / Catatan Tugas</label>
              <textarea
                rows={3}
                placeholder="Tuliskan catatan khusus peliputan..."
                value={assignForm.description}
                onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
                className={textareaCls}
              />
            </div>

            {/* Anggota Tim Section */}
            <div className="space-y-2">
              <label className={labelCls}>Pilih Anggota Tim (Opsional)</label>
              <div className="max-h-36 overflow-y-auto border border-[#E2E8F0] rounded-[8px] p-3 space-y-2 bg-white text-[12px]">
                {users
                  .filter((u) => u.id !== assignForm.picId)
                  .map((u) => {
                    const isChecked = assignForm.memberIds.includes(u.id);
                    return (
                      <label key={u.id} className="flex items-center gap-2.5 cursor-pointer select-none hover:bg-slate-50 p-1.5 rounded-md transition-colors">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssignForm({ ...assignForm, memberIds: [...assignForm.memberIds, u.id] });
                            } else {
                              setAssignForm({ ...assignForm, memberIds: assignForm.memberIds.filter((id) => id !== u.id) });
                            }
                          }}
                          className="w-4 h-4 accent-[#35C6D4] rounded cursor-pointer"
                        />
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-800">{u.fullName}</span>
                          {u.roleLabel && (
                            <span className="text-[11px] text-slate-400">({u.roleLabel})</span>
                          )}
                        </div>
                      </label>
                    );
                  })}
              </div>
            </div>
          </div>

          {/* PERALATAN YANG DIPERLUKAN */}
          <div className="border border-blue-200 rounded-xl bg-blue-50/20 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-[#003D58]" />
                <p className="font-extrabold text-blue-950 text-[10px] tracking-widest uppercase">
                  PERALATAN YANG DIPERLUKAN
                </p>
              </div>
              <span className="text-[11px] text-slate-500 font-semibold">
                {selectedEquipments.filter(e => e.quantity > 0).length} Alat Dipilih
              </span>
            </div>

            <p className="text-[11px] text-slate-500">
              Pilih peralatan dari master inventaris yang dialokasikan untuk kegiatan ini. Ketersediaan dicek otomatis berdasarkan tanggal dan jam pelaksanaan.
            </p>

            {/* Search Input for Equipment */}
            {availableEquipment.length > 0 && (
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Cari nama alat, kode (EQ-...), kategori, atau merk..."
                  value={equipmentSearch}
                  onChange={(e) => setEquipmentSearch(e.target.value)}
                  className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-white border border-blue-200/80 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#003D58] focus:border-[#003D58] placeholder:text-slate-400 shadow-sm transition-all"
                />
                {equipmentSearch && (
                  <button
                    type="button"
                    onClick={() => setEquipmentSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 transition-colors"
                    title="Hapus pencarian"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {loadingEquipment ? (
              <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2 bg-white rounded-xl border border-slate-200">
                <div className="w-4 h-4 border-2 border-[#003D58] border-t-transparent rounded-full animate-spin" />
                Memeriksa ketersediaan jadwal alat...
              </div>
            ) : availableEquipment.length === 0 ? (
              <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs text-slate-500 italic text-center">
                Belum ada data inventaris alat di sistem.
              </div>
            ) : (() => {
              const filtered = availableEquipment.filter((eq: any) => {
                if (!equipmentSearch.trim()) return true;
                const q = equipmentSearch.toLowerCase();
                return (
                  eq.name?.toLowerCase().includes(q) ||
                  eq.code?.toLowerCase().includes(q) ||
                  eq.category?.toLowerCase().includes(q) ||
                  eq.brand?.toLowerCase().includes(q)
                );
              });

              if (filtered.length === 0) {
                return (
                  <div className="p-4 bg-white border border-dashed border-slate-200 rounded-xl text-center space-y-1.5">
                    <p className="text-xs text-slate-500 font-medium">
                      Tidak ada alat yang cocok dengan kata kunci &quot;<span className="text-slate-700 font-semibold">{equipmentSearch}</span>&quot;
                    </p>
                    <button
                      type="button"
                      onClick={() => setEquipmentSearch('')}
                      className="text-[11px] text-[#003D58] hover:text-[#002F44] font-semibold underline"
                    >
                      Reset pencarian
                    </button>
                  </div>
                );
              }

              return (
                <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                  {filtered.map((eq: any) => {
                    const selected = selectedEquipments.find((s) => s.equipmentId === eq.id);
                    const isChecked = !!selected && selected.quantity > 0;
                    const isAvailable = eq.available > 0;
                    const conflict = eq.conflicts && eq.conflicts.length > 0 ? eq.conflicts[0] : null;

                    return (
                      <div
                        key={eq.id}
                        className={`p-3 rounded-xl border transition-all ${
                          isChecked
                            ? 'bg-blue-50/60 border-blue-300 ring-1 ring-[#003D58]/20'
                            : isAvailable
                              ? 'bg-white border-slate-200 hover:border-slate-300'
                              : 'bg-slate-50 border-slate-200 opacity-70'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <label className="flex items-start gap-2.5 cursor-pointer flex-1 select-none">
                            <input
                              type="checkbox"
                              disabled={!isAvailable && !isChecked}
                              checked={isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedEquipments([
                                    ...selectedEquipments.filter((s) => s.equipmentId !== eq.id),
                                    { equipmentId: eq.id, quantity: 1 },
                                  ]);
                                } else {
                                  setSelectedEquipments(selectedEquipments.filter((s) => s.equipmentId !== eq.id));
                                }
                              }}
                              className="mt-0.5 w-4 h-4 accent-[#003D58] rounded cursor-pointer disabled:cursor-not-allowed"
                            />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-slate-800 text-xs">{eq.name}</span>
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">
                                  {eq.code}
                                </span>
                                <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                                  {eq.category}
                                </span>
                              </div>

                              {/* Stock and Conflict Badges */}
                              <div className="mt-1 flex items-center gap-2 flex-wrap">
                                {isAvailable ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                    <Check className="w-3 h-3 text-emerald-600" /> Tersedia: {eq.available} unit
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                                    <X className="w-3 h-3 text-rose-600" /> 0 Unit - Tidak Tersedia
                                  </span>
                                )}

                                {conflict && (
                                  <span className="text-[10px] text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-md flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                                    Sedang digunakan: <strong>{conflict.activityTitle}</strong> (PIC: {conflict.picName})
                                  </span>
                                )}
                              </div>
                            </div>
                          </label>

                          {/* Quantity Selector */}
                          {isChecked && (
                            <div className="flex items-center gap-1.5 bg-white border border-blue-200 rounded-lg p-1 shrink-0">
                              <span className="text-[10px] text-slate-500 font-semibold px-1">Unit:</span>
                              <input
                                type="number"
                                min={1}
                                max={eq.available + (selected?.quantity || 0)}
                                value={selected?.quantity || 1}
                                onChange={(e) => {
                                  const q = Math.max(1, Math.min(eq.available + (selected?.quantity || 0), parseInt(e.target.value) || 1));
                                  setSelectedEquipments([
                                    ...selectedEquipments.filter((s) => s.equipmentId !== eq.id),
                                    { equipmentId: eq.id, quantity: q },
                                  ]);
                                }}
                                className="w-12 text-center text-xs font-bold border border-slate-200 rounded py-0.5 focus:outline-none focus:ring-1 focus:ring-[#003D58]"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <CustomButton variant="outline" type="button" onClick={() => setIsAssignOpen(false)}>Batal</CustomButton>
            <CustomButton variant="primary" type="submit" disabled={isSubmitting || !assignForm.picId}>
              Kirim Penugasan
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* ── MODAL: DETAIL PEMERIKSAAN AKHIR KEGIATAN ── */}
      <CustomModal
        isOpen={isDetailActivityOpen}
        onClose={() => setIsDetailActivityOpen(false)}
        title="Pemeriksaan Akhir Kegiatan Selesai"
        maxWidth="2xl"
      >
        {selectedActivity && (() => {
          const driveLinks = (selectedActivity.media || []).filter((m) => m.fileType === 'application/link');
          const hasDriveLink = driveLinks.length > 0;
          const members = selectedActivity.members || [];
          const attendances = selectedActivity.attendances || [];
          const checkedInMembers = members.filter(
            (m) => m.checkInTime || m.checkInStatus === 'SUCCESS' || m.checkInStatus === 'TERLAMBAT'
          );
          const totalCheckedIn = attendances.length > 0 ? attendances.length : checkedInMembers.length;
          const allCheckedIn =
            members.length > 0 ? checkedInMembers.length >= members.length : attendances.length > 0;
          const loanItems = (selectedActivity.loans || []).flatMap((loan: any) =>
            (loan.items || []).map((item: any) => ({
              ...item,
              loanStatus: loan.status,
              isReturned: item.returnedQuantity >= item.quantity || loan.status === 'SELESAI',
            }))
          );
          const allToolsReturned = loanItems.length === 0 || loanItems.every((it: any) => it.isReturned);
          const prevVerifications = (selectedActivity.approvalHistory || []).filter(
            (h) => h.stage === 'Verifikasi Kelengkapan'
          );

          return (
            <div className="space-y-5 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded text-[11px]">
                  {selectedActivity.category}
                </span>
                <StatusBadge status={selectedActivity.status} />
              </div>

              <h3 className="font-extrabold text-slate-800 text-sm leading-snug">{selectedActivity.title}</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 font-medium text-xs">
                <p className="flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span><strong>Pelaksanaan:</strong> {formatDateID(selectedActivity.date.split('T')[0])}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span><strong>Waktu:</strong> {selectedActivity.startTime} - {selectedActivity.endTime} WIB</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span><strong>Lokasi:</strong> {selectedActivity.location}</span>
                </p>
                <p className="flex items-center gap-1.5">
                  <UserIcon className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span><strong>PIC Lapangan:</strong> {selectedActivity.pic?.fullName}</span>
                </p>
              </div>

              {/* Checklist Live Kelengkapan & Kehadiran */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/40 space-y-2.5">
                <p className="font-bold text-slate-800">Checklist Kelengkapan & Kehadiran:</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                  <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-lg p-2.5">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        allCheckedIn ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {allCheckedIn ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    </div>
                    <span className="font-semibold text-slate-700 leading-tight">
                      {totalCheckedIn === 0
                        ? 'Belum ada check-in'
                        : `Check-in Tim (${totalCheckedIn}/${members.length || totalCheckedIn})`}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-lg p-2.5">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        hasDriveLink ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}
                    >
                      {hasDriveLink ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    </div>
                    <span className="font-semibold text-slate-700 leading-tight">
                      {hasDriveLink ? 'Link Drive tersedia' : 'Link Drive belum diunggah'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 bg-white border border-slate-200/80 rounded-lg p-2.5">
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                        allToolsReturned ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}
                    >
                      {allToolsReturned ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                    </div>
                    <span className="font-semibold text-slate-700 leading-tight">
                      {loanItems.length === 0
                        ? 'Tidak meminjam alat'
                        : allToolsReturned
                        ? 'Semua alat dikembalikan'
                        : 'Ada alat belum dikembalikan'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Presensi & Kehadiran Tim */}
              <div className="space-y-2">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <UserCheck className="w-3.5 h-3.5 text-[#003D58]" /> Presensi & Kehadiran Tim:
                </p>
                {attendances.length > 0 ? (
                  <div className="space-y-1.5 border border-slate-200 rounded-xl p-3 bg-slate-50/30">
                    {attendances.map((att, idx) => (
                      <div
                        key={att.id || idx}
                        className="flex items-center justify-between gap-2 bg-white border border-slate-200 p-2.5 rounded-lg"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">
                            {att.user?.fullName || `Anggota #${att.userId}`}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            Check-in:{' '}
                            {att.checkInTime
                              ? `${new Date(att.checkInTime).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })} WIB`
                              : att.checkInAt
                              ? `${new Date(att.checkInAt).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })} WIB`
                              : '-'}
                          </p>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-[#003D58] border border-blue-200 shrink-0">
                          {att.status || 'HADIR'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : members.length > 0 ? (
                  <div className="space-y-1.5 border border-slate-200 rounded-xl p-3 bg-slate-50/30">
                    {members.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between gap-2 bg-white border border-slate-200 p-2.5 rounded-lg"
                      >
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate">
                            {m.user?.fullName || `Anggota #${m.userId}`}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {m.role || 'Anggota Humas'} •{' '}
                            {m.checkInTime
                              ? `Check-in ${new Date(m.checkInTime).toLocaleTimeString('id-ID', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })} WIB`
                              : 'Belum check-in'}
                          </p>
                        </div>
                        <StatusBadge status={m.checkInStatus || 'MISSED'} />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 italic">
                    Belum ada rekaman presensi atau anggota tim tercatat.
                  </div>
                )}
              </div>

              {/* Peralatan yang Digunakan */}
              <div className="space-y-2">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#003D58]" /> Peralatan yang Digunakan:
                </p>
                {loanItems.length > 0 ? (
                  <div className="space-y-1.5 border border-slate-200 rounded-xl p-3 bg-slate-50/30">
                    {loanItems.map((item: any) => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between gap-2 bg-white border border-slate-200 p-2.5 rounded-lg"
                      >
                        <div>
                          <p className="font-bold text-slate-800">{item.equipment?.name || 'Alat'}</p>
                          <p className="text-[10px] text-slate-400">
                            Kode: {item.equipment?.code || '-'} • Jumlah: {item.quantity} Unit
                          </p>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${
                            item.isReturned
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {item.isReturned
                            ? `Dikembalikan (${item.returnCondition || 'BAIK'})`
                            : 'Sedang Digunakan'}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Tidak menggunakan peralatan.</span>
                  </div>
                )}
              </div>

              {/* Google Drive links */}
              <div className="space-y-2">
                <p className="font-bold text-slate-800">Link Google Drive Dokumentasi:</p>
                {hasDriveLink ? (
                  <div className="space-y-1.5">
                    {driveLinks.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-2 p-3 rounded-xl border border-blue-200 bg-blue-50/30 text-blue-900 font-bold hover:underline"
                      >
                        <span className="truncate">{doc.fileUrl}</span>
                        <ExternalLink className="w-4 h-4 shrink-0" />
                      </a>
                    ))}
                  </div>
                ) : (
                  <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>Tim belum mengunggah link folder dokumentasi Google Drive.</span>
                  </div>
                )}
              </div>

              {/* Riwayat Verifikasi Sebelumnya (hanya tampil jika ada catatan historis) */}
              {prevVerifications.length > 0 && (
                <div className="space-y-2">
                  <p className="font-bold text-slate-800">Verifikasi Admin Sebelumnya:</p>
                  {prevVerifications.map((h, idx) => (
                    <div key={idx} className="border border-slate-100 bg-slate-50 p-3 rounded-xl">
                      <p className="text-[11px] text-slate-400">
                        Oleh: <strong className="text-slate-600">{h.fullName}</strong> •{' '}
                        {new Date(h.date).toLocaleString('id-ID')}
                      </p>
                      {h.notes && <p className="italic text-slate-600 mt-1 font-semibold">&quot;{h.notes}&quot;</p>}
                    </div>
                  ))}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <CustomButton variant="outline" size="sm" onClick={() => setIsDetailActivityOpen(false)}>
                  Tutup
                </CustomButton>
                <CustomButton
                  variant="outline"
                  size="sm"
                  icon={RotateCcw}
                  onClick={() => setIsRevisionOpen(true)}
                  disabled={isSubmitting}
                >
                  Kembalikan Perbaikan
                </CustomButton>
                <CustomButton
                  variant="primary"
                  size="sm"
                  icon={CheckCircle2}
                  onClick={() => handleApproveActivityFinish(selectedActivity.id)}
                  disabled={isSubmitting}
                >
                  Setujui & Selesaikan
                </CustomButton>
              </div>
            </div>
          );
        })()}
      </CustomModal>

      {/* ── MODAL: REVISI KEGIATAN ── */}
      <CustomModal
        isOpen={isRevisionOpen}
        onClose={() => setIsRevisionOpen(false)}
        title="Kembalikan Kegiatan untuk Perbaikan"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-500 font-medium">
            Masukkan catatan revisi/perbaikan yang wajib diselesaikan oleh Tim Humas sebelum kegiatan disetujui selesai.
          </p>
          <textarea
            required
            rows={3}
            placeholder="Catatan perbaikan..."
            value={revisionNotes}
            onChange={(e) => setRevisionNotes(e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs"
          />
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <CustomButton variant="outline" size="sm" onClick={() => setIsRevisionOpen(false)}>Batal</CustomButton>
            <CustomButton variant="primary" size="sm" onClick={handleReturnRevision} disabled={isSubmitting || !revisionNotes.trim()}>
              Kirim Catatan Perbaikan
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ── MODAL: DETAIL & PERSETUJUAN CONTENT PLAN ── */}
      <CustomModal
        isOpen={isDetailContentOpen}
        onClose={() => setIsDetailContentOpen(false)}
        title="Review & Persetujuan Content Plan"
        subtitle={selectedContent ? `ID: #${selectedContent.id} • ${selectedContent.title}` : ''}
        maxWidth="2xl"
      >
        {selectedContent && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <StatusBadge status={selectedContent.status} />
              <span className="text-slate-400 font-semibold">
                Deadline: {formatDateID(selectedContent.deadline.split('T')[0])}
              </span>
            </div>

            {selectedContent.adminNotes && (
              <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-sky-900">
                <p className="font-bold flex items-center gap-1 text-sky-700 mb-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Catatan Verifikasi Admin Humas:
                </p>
                <p>{selectedContent.adminNotes}</p>
              </div>
            )}

            {selectedContent.revisionNote && (
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900">
                <p className="font-bold flex items-center gap-1 text-rose-700 mb-0.5">
                  <RotateCcw className="w-3.5 h-3.5" />
                  Catatan Revisi Sebelumnya:
                </p>
                <p>{selectedContent.revisionNote}</p>
              </div>
            )}

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-slate-700 font-medium">
              <p><strong>Judul Konten:</strong> {selectedContent.title}</p>
              <p><strong>Platform:</strong> {selectedContent.platform} ({selectedContent.contentType})</p>
              <p><strong>PIC Kreator:</strong> {selectedContent.pic?.fullName ?? '-'}</p>
            </div>

            {selectedContent.rawMaterialUrl && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                <p className="font-bold text-amber-800 mb-1 flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4 text-amber-600" />
                  Link Bahan Mentahan:
                </p>
                <a
                  href={getFileViewUrl(selectedContent.rawMaterialUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber-800 hover:text-amber-950 font-semibold underline break-all"
                >
                  {selectedContent.rawMaterialUrl}
                </a>
              </div>
            )}

            {selectedContent.videoUrl && (
              <div className="p-3 rounded-xl bg-sky-50 border border-sky-200">
                <p className="font-bold text-sky-800 mb-1 flex items-center gap-1.5">
                  <ExternalLink className="w-4 h-4 text-sky-600" />
                  Link Hasil Konten (Google Drive):
                </p>
                <a
                  href={selectedContent.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sky-700 hover:text-sky-900 font-semibold underline break-all"
                >
                  {selectedContent.videoUrl}
                </a>
              </div>
            )}

            {selectedContent.thumbnailUrl && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <p className="font-bold text-slate-700 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-[#003D58]" />
                    Visual / Thumbnail Preview (9:16 Portrait):
                  </p>
                </div>
                <div className="w-full flex justify-center py-2.5 bg-slate-50/80 rounded-2xl border border-slate-200">
                  <div className="relative w-[190px] sm:w-[210px] aspect-[9/16] rounded-[24px] overflow-hidden bg-slate-950 border-[4px] border-slate-800 shadow-xl flex items-center justify-center">
                    <div className="absolute top-2 w-12 h-1 bg-slate-700/80 rounded-full z-10" />
                    <a
                      href={selectedContent.thumbnailUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group relative w-full h-full block cursor-zoom-in"
                      title="Klik untuk membuka ukuran penuh"
                    >
                      <img
                        src={selectedContent.thumbnailUrl}
                        alt={selectedContent.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-medium">
                        <Eye className="w-4 h-4" /> Buka Penuh
                      </div>
                    </a>
                    <div className="absolute bottom-2 w-16 h-1 bg-white/20 rounded-full z-10" />
                  </div>
                </div>
              </div>
            )}

            <div>
              <p className="font-bold text-slate-700 mb-1">Caption & Copywriting:</p>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-mono whitespace-pre-wrap">
                {selectedContent.description || 'Tidak ada caption.'}
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <CustomButton variant="outline" size="sm" onClick={() => setIsDetailContentOpen(false)}>
                Tutup
              </CustomButton>
              <CustomButton
                variant="outline"
                size="sm"
                icon={RotateCcw}
                onClick={() => setIsContentRevisionOpen(true)}
                disabled={isSubmitting}
              >
                Minta Revisi
              </CustomButton>
              <CustomButton
                variant="primary"
                size="sm"
                icon={CheckCircle2}
                onClick={() => handleApproveContentPlan(selectedContent.id)}
                disabled={isSubmitting}
              >
                Setujui Content Plan
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>

      {/* ── MODAL: REVISI CONTENT PLAN ── */}
      <CustomModal
        isOpen={isContentRevisionOpen}
        onClose={() => setIsContentRevisionOpen(false)}
        title="Minta Revisi Content Plan"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-500 font-medium">
            Masukkan instruksi perbaikan yang harus diperbaiki oleh PIC sebelum konten disetujui.
          </p>
          <textarea
            required
            rows={3}
            placeholder="Catatan instruksi revisi..."
            value={contentRevisionNotes}
            onChange={(e) => setContentRevisionNotes(e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs"
          />
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            <CustomButton variant="outline" size="sm" onClick={() => setIsContentRevisionOpen(false)}>Batal</CustomButton>
            <CustomButton variant="primary" size="sm" onClick={handleReturnContentRevision} disabled={isSubmitting || !contentRevisionNotes.trim()}>
              Kirim Instruksi Revisi
            </CustomButton>
          </div>
        </div>
      </CustomModal>
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
        isLoading={isSubmitting}
      />
    </AdminLayout>
  );
}

export default function PersetujuanPage() {
  return (
    <Suspense fallback={<TableSkeleton rows={5} />}>
      <PersetujuanContent />
    </Suspense>
  );
}
