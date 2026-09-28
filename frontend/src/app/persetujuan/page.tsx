'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  DataTable,
  Column,
  StatusBadge,
  CustomButton,
  CustomModal,
} from '@/components/common';
import DashboardSkeleton from '@/components/common/DashboardSkeleton';
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
} from 'lucide-react';
import { toast } from 'sonner';
import { incomingLetterService, activityService, userService, contentService, loanService } from '@/services';
import { IncomingLetter, Activity, User, ContentPlan } from '@/types';
import { formatDateID } from '@/utils/formatters';
import { getStoredUser } from '@/utils/session';

export default function PersetujuanPage() {
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'surat' | 'penugasan' | 'akhir' | 'konten'>('surat');

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
        cp.status === 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS' || cp.status === 'MENUNGGU'
      );
      setContentsPending(pendingCP);

      // 5. Fetch users for assignment dropdown
      const allUsers = await userService.getAll();
      setUsers(allUsers.filter((u: User) => u.role === 'USER'));
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
  }, [router]);

  // Tab change handler
  const handleTabChange = (tab: 'surat' | 'penugasan' | 'akhir' | 'konten') => {
    setActiveTab(tab);
  };

  // Letter actions
  const handleApproveLetter = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menyetujui surat ini?')) return;
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
  const handleApproveActivityFinish = async (id: number) => {
    if (!confirm('Apakah Anda yakin kegiatan ini telah selesai dan seluruh data telah diperiksa?')) return;
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
  const handleApproveContentPlan = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menyetujui Content Plan ini?')) return;
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
      <AdminLayout title="Persetujuan & Penugasan">
        <DashboardSkeleton />
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
          <p className="text-[11px] text-slate-400 font-medium">📍 {item.location}</p>
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
            <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded border border-teal-200">
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

  const inputCls =
    'w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all';

  return (
    <AdminLayout title="Pusat Keputusan Kepala Humas">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
          <ShieldCheck className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Pusat Persetujuan & Penugasan</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Lakukan peninjauan surat masuk, delegasikan anggota tim, dan verifikasi akhir kegiatan selesai.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 bg-white rounded-t-2xl p-2 px-4 gap-2">
        <button
          onClick={() => handleTabChange('surat')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
            activeTab === 'surat'
              ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          } cursor-pointer`}
        >
          <Mail className="w-4 h-4" />
          Persetujuan Surat ({lettersPending.length})
        </button>
        <button
          onClick={() => handleTabChange('penugasan')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
            activeTab === 'penugasan'
              ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          } cursor-pointer`}
        >
          <UserPlus className="w-4 h-4" />
          Penugasan Tim ({lettersApproved.length})
        </button>
        <button
          onClick={() => handleTabChange('akhir')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
            activeTab === 'akhir'
              ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          } cursor-pointer`}
        >
          <CheckCircle className="w-4 h-4" />
          Persetujuan Akhir Kegiatan ({activitiesPendingAkhir.length})
        </button>
        <button
          onClick={() => handleTabChange('konten')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
            activeTab === 'konten'
              ? 'bg-teal-50 border-teal-200 text-teal-700 shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          } cursor-pointer`}
        >
          <Camera className="w-4 h-4" />
          Persetujuan Content Plan ({contentsPending.length})
        </button>
      </div>

      {/* Tab Panels */}
      <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 overflow-hidden shadow-xs">
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
              <p><strong>Tujuan:</strong> {selectedLetter.destination}</p>
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

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <CustomButton variant="outline" onClick={() => setIsDetailLetterOpen(false)}>
                Tutup
              </CustomButton>
              <CustomButton
                variant="danger"
                icon={XCircle}
                onClick={() => setIsRejectLetterOpen(true)}
                disabled={isSubmitting}
              >
                Tolak
              </CustomButton>
              <CustomButton
                variant="primary"
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
        maxWidth="sm"
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
          <div className="flex justify-end gap-3">
            <CustomButton variant="outline" onClick={() => setIsRejectLetterOpen(false)}>Batal</CustomButton>
            <CustomButton variant="danger" onClick={handleRejectLetter} disabled={isSubmitting || !rejectReason.trim()}>
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
        maxWidth="lg"
      >
        <form onSubmit={handleAssignSubmit} className="space-y-4 text-xs">

          {/* INFORMASI SURAT & LOKASI KEGIATAN — read-only preview */}
          {selectedLetter && (
            <div className="border border-slate-200 rounded-xl bg-slate-50 p-3.5 space-y-1.5">
              <p className="font-extrabold text-slate-700 text-[10px] tracking-widest uppercase mb-2">INFORMASI SURAT & LOKASI KEGIATAN</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <p className="text-slate-600">📄 <strong>Nomor Surat:</strong> <span className="font-bold text-slate-800">{selectedLetter.letterNumber}</span></p>
                <p className="text-slate-600">🏢 <strong>Instansi Pengirim:</strong> <span className="font-bold text-slate-800">{selectedLetter.institution}</span></p>
                <p className="text-slate-600">📝 <strong>Perihal:</strong> <span className="font-medium text-slate-700">{selectedLetter.subject}</span></p>
                <p className="text-slate-600">📍 <strong>Lokasi Kegiatan:</strong> <span className="font-bold text-teal-800 bg-teal-100/60 px-2 py-0.5 rounded border border-teal-200">{selectedLetter.eventLocation || 'Lokasi belum ditentukan'}</span></p>
              </div>
            </div>
          )}

          {/* DETAIL PENUGASAN KEGIATAN */}
          <div className="space-y-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Judul Kegiatan Peliputan *</label>
              <input
                type="text"
                required
                value={assignForm.title}
                onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })}
                className={inputCls}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Kategori Kegiatan *</label>
                <input
                  type="text"
                  required
                  value={assignForm.category}
                  onChange={(e) => setAssignForm({ ...assignForm, category: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tanggal Pelaksanaan *</label>
                <input
                  type="date"
                  required
                  value={assignForm.date}
                  onChange={(e) => setAssignForm({ ...assignForm, date: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Jam Mulai *</label>
                <input
                  type="time"
                  required
                  value={assignForm.startTime}
                  onChange={(e) => setAssignForm({ ...assignForm, startTime: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Jam Selesai *</label>
                <input
                  type="time"
                  value={assignForm.endTime}
                  onChange={(e) => setAssignForm({ ...assignForm, endTime: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Lokasi Pelaksanaan Kegiatan *</label>
              <input
                type="text"
                required
                value={assignForm.location}
                onChange={(e) => setAssignForm({ ...assignForm, location: e.target.value })}
                placeholder="Contoh: Gedung Serbaguna Polinela / Aula Dinas"
                className={inputCls}
              />
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
                    value={assignForm.latitude}
                    onChange={(e) => setAssignForm({ ...assignForm, latitude: e.target.value })}
                    placeholder="-5.3582"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={assignForm.longitude}
                    onChange={(e) => setAssignForm({ ...assignForm, longitude: e.target.value })}
                    placeholder="105.2321"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-600 mb-1">Radius (Meter)</label>
                  <input
                    type="number"
                    value={assignForm.radius}
                    onChange={(e) => setAssignForm({ ...assignForm, radius: e.target.value })}
                    placeholder="100"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PENUGASAN — PIC, Anggota, Catatan */}
          <div className="border border-amber-200 rounded-xl bg-amber-50/30 p-3.5 space-y-3">
            <p className="font-extrabold text-amber-900 text-[10px] tracking-widest uppercase">PENUGASAN TIM</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">PIC Kegiatan (Tim Humas) *</label>
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
                  className={inputCls}
                >
                  <option value={0}>-- Pilih PIC --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.fullName}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Pilih Anggota Tim (Opsional)</label>
                <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-2 bg-white">
                  {users
                    .filter((u) => u.id !== assignForm.picId)
                    .map((u) => {
                      const isChecked = assignForm.memberIds.includes(u.id);
                      return (
                        <label key={u.id} className="flex items-center gap-2 cursor-pointer select-none">
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
                            className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                          />
                          <span>{u.fullName}</span>
                        </label>
                      );
                    })}
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Catatan Penugasan</label>
              <textarea
                rows={2}
                placeholder="Arahan khusus dari Kepala Humas untuk Tim..."
                value={assignForm.description}
                onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>

          {/* PERALATAN YANG DIPERLUKAN */}
          <div className="border border-teal-200 rounded-xl bg-teal-50/20 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-teal-700" />
                <p className="font-extrabold text-teal-900 text-[10px] tracking-widest uppercase">
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
                  className="w-full pl-8.5 pr-8 py-1.5 text-xs bg-white border border-teal-200/80 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-teal-500 focus:border-teal-500 placeholder:text-slate-400 shadow-sm transition-all"
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
                <div className="w-4 h-4 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
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
                      className="text-[11px] text-teal-600 hover:text-teal-700 font-semibold underline"
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
                            ? 'bg-teal-50/60 border-teal-300 ring-1 ring-teal-400/20'
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
                              className="mt-0.5 w-4 h-4 accent-teal-600 rounded cursor-pointer disabled:cursor-not-allowed"
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
                                    ✓ Tersedia: {eq.available} unit
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md">
                                    ✕ 0 Unit - Tidak Tersedia
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
                            <div className="flex items-center gap-1.5 bg-white border border-teal-200 rounded-lg p-1 shrink-0">
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
                                className="w-12 text-center text-xs font-bold border border-slate-200 rounded py-0.5 focus:outline-none focus:ring-1 focus:ring-teal-500"
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
        maxWidth="lg"
      >
        {selectedActivity && (
          <div className="space-y-5 text-xs">
            <div className="flex items-center justify-between">
              <span className="bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded text-[10px]">
                {selectedActivity.category}
              </span>
              <StatusBadge status={selectedActivity.status} />
            </div>

            <h3 className="font-extrabold text-slate-800 text-sm leading-snug">{selectedActivity.title}</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-700 font-medium">
              <p>📅 <strong>Pelaksanaan:</strong> {formatDateID(selectedActivity.date.split('T')[0])}</p>
              <p>⏰ <strong>Waktu:</strong> {selectedActivity.startTime} - {selectedActivity.endTime} WIB</p>
              <p>📍 <strong>Lokasi:</strong> {selectedActivity.location}</p>
              <p>👤 <strong>PIC Lapangan:</strong> {selectedActivity.pic?.fullName}</p>
            </div>

            {/* Checklist items */}
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/20 space-y-2">
              <p className="font-bold text-slate-800">Checklist Kelengkapan & Kehadiran:</p>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">✓</div>
                  <span className="font-semibold text-slate-700">Check-in PIC & Tim (Lengkap)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-[10px]">✓</div>
                  <span className="font-semibold text-slate-700">Dokumentasi Google Drive</span>
                </div>
              </div>
            </div>

            {/* Peralatan yang Digunakan */}
            {selectedActivity.loans && selectedActivity.loans.length > 0 && (
              <div className="space-y-2">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-teal-600" /> Peralatan yang Digunakan:
                </p>
                <div className="space-y-1.5 border border-slate-200 rounded-xl p-3 bg-slate-50/30">
                  {selectedActivity.loans.flatMap((loan: any) =>
                    (loan.items || []).map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between bg-white border border-slate-200 p-2.5 rounded-lg">
                        <div>
                          <p className="font-bold text-slate-800">{item.equipment?.name || 'Alat'}</p>
                          <p className="text-[10px] text-slate-400">Kode: {item.equipment?.code || '-'} • Jumlah: {item.quantity} Unit</p>
                        </div>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          item.returnedQuantity >= item.quantity || loan.status === 'SELESAI'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {item.returnedQuantity >= item.quantity || loan.status === 'SELESAI'
                            ? `Dikembalikan (${item.returnCondition || 'BAIK'})`
                            : 'Sedang Digunakan'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Google Drive links */}
            {selectedActivity.media && selectedActivity.media.filter(m => m.fileType === 'application/link').length > 0 && (
              <div className="space-y-2">
                <p className="font-bold text-slate-800">Link Google Drive Dokumentasi:</p>
                {selectedActivity.media.filter(m => m.fileType === 'application/link').map(doc => (
                  <a
                    key={doc.id}
                    href={doc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl border border-teal-200 bg-teal-50/30 text-teal-800 font-bold hover:underline"
                  >
                    <span className="truncate">{doc.fileUrl}</span>
                    <ExternalLink className="w-4 h-4 shrink-0" />
                  </a>
                ))}
              </div>
            )}

            {/* Riwayat Approval */}
            {selectedActivity.approvalHistory && selectedActivity.approvalHistory.length > 0 && (
              <div className="space-y-2">
                <p className="font-bold text-slate-800">Verifikasi Admin Sebelumnya:</p>
                {selectedActivity.approvalHistory
                  .filter((h) => h.stage === 'Verifikasi Kelengkapan')
                  .map((h, idx) => (
                    <div key={idx} className="border border-slate-100 bg-slate-50 p-3 rounded-xl">
                      <p className="text-[11px] text-slate-400">Oleh: <strong className="text-slate-600">{h.fullName}</strong> • {new Date(h.date).toLocaleString('id-ID')}</p>
                      {h.notes && <p className="italic text-slate-600 mt-1 font-semibold">&quot;{h.notes}&quot;</p>}
                    </div>
                  ))}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <CustomButton variant="outline" onClick={() => setIsDetailActivityOpen(false)}>
                Tutup
              </CustomButton>
              <CustomButton
                variant="outline"
                icon={RotateCcw}
                onClick={() => setIsRevisionOpen(true)}
                disabled={isSubmitting}
              >
                Kembalikan Perbaikan
              </CustomButton>
              <CustomButton
                variant="primary"
                icon={CheckCircle2}
                onClick={() => handleApproveActivityFinish(selectedActivity.id)}
                disabled={isSubmitting}
              >
                Setujui & Selesaikan
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>

      {/* ── MODAL: REVISI KEGIATAN ── */}
      <CustomModal
        isOpen={isRevisionOpen}
        onClose={() => setIsRevisionOpen(false)}
        title="Kembalikan Kegiatan untuk Perbaikan"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-500 font-medium">
            Masukkan catatan revisi/perbaikan yang wajib diselesaikan oleh Admin / Tim Humas sebelum kegiatan disetujui selesai.
          </p>
          <textarea
            required
            rows={3}
            placeholder="Catatan perbaikan..."
            value={revisionNotes}
            onChange={(e) => setRevisionNotes(e.target.value)}
            className="w-full border border-slate-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs"
          />
          <div className="flex justify-end gap-3">
            <CustomButton variant="outline" onClick={() => setIsRevisionOpen(false)}>Batal</CustomButton>
            <CustomButton variant="primary" onClick={handleReturnRevision} disabled={isSubmitting || !revisionNotes.trim()}>
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
                <p className="font-bold text-slate-700 mb-1.5">Visual / Thumbnail Preview:</p>
                <div className="rounded-xl overflow-hidden border border-slate-200 max-h-60 flex items-center justify-center bg-slate-900">
                  <img src={selectedContent.thumbnailUrl} alt={selectedContent.title} className="max-h-60 object-contain" />
                </div>
              </div>
            )}

            <div>
              <p className="font-bold text-slate-700 mb-1">Caption & Copywriting:</p>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 font-mono whitespace-pre-wrap">
                {selectedContent.description || 'Tidak ada caption.'}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <CustomButton variant="outline" onClick={() => setIsDetailContentOpen(false)}>
                Tutup
              </CustomButton>
              <CustomButton
                variant="outline"
                icon={RotateCcw}
                onClick={() => setIsContentRevisionOpen(true)}
                disabled={isSubmitting}
              >
                Minta Revisi
              </CustomButton>
              <CustomButton
                variant="primary"
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
        maxWidth="sm"
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
          <div className="flex justify-end gap-3">
            <CustomButton variant="outline" onClick={() => setIsContentRevisionOpen(false)}>Batal</CustomButton>
            <CustomButton variant="primary" onClick={handleReturnContentRevision} disabled={isSubmitting || !contentRevisionNotes.trim()}>
              Kirim Instruksi Revisi
            </CustomButton>
          </div>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
