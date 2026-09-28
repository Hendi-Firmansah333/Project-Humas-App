'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/layout/AdminLayout';
import DashboardSkeleton from '@/components/common/DashboardSkeleton';
import {
  StatusBadge,
  CustomButton,
  UserAvatar,
  CustomModal,
} from '@/components/common';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  Edit3,
  CheckCircle2,
  Share2,
  FileCheck,
  MapPinCheckInside,
  ShieldCheck,
  Check,
  ExternalLink,
  AlertCircle,
  Info,
  Camera,
  XCircle,
  UserPlus,
  RotateCcw,
  History,
  Mail,
  Package,
} from 'lucide-react';
import { toast } from 'sonner';
import { activityService, userService } from '@/services';
import { Activity, User } from '@/types';
import { formatDateID, isValidImageSrc } from '@/utils/formatters';

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);

  /* ── Display status — use backend status directly ── */
  const getDisplayStatus = (item: Activity | null) => {
    if (!item) return 'AKAN_DATANG';
    // Use the backend status directly — it's already managed by syncStatus()
    return item.status || 'AKAN_DATANG';
  };
  
  // Auth states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN';
  const isAdmin = currentUser?.role === 'ADMIN' || isSuperAdmin;

  // Users list for team assignment
  const [humasUsers, setHumasUsers] = useState<User[]>([]);

  // Workflow modals
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectNotes, setRejectNotes] = useState('');

  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedPicId, setSelectedPicId] = useState<number>(0);
  const [selectedMemberIds, setSelectedMemberIds] = useState<number[]>([]);

  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [checkChecked, setCheckChecked] = useState(false);

  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');

  // Super Admin Direct Edit Modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: '',
    category: '',
    date: '',
    startTime: '08:00',
    endTime: '12:00',
    location: '',
    latitude: '',
    longitude: '',
    radius: '100',
    picId: 0,
    description: '',
    memberIds: [] as number[],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    const id = Number(params.id);
    if (!id) return;
    try {
      const data = await activityService.getById(id);
      setActivity(data);
      if (data.picId) setSelectedPicId(data.picId);
      if (data.members) {
        setSelectedMemberIds(
          data.members
            .filter((m) => m.userId !== data.picId)
            .map((m) => m.userId)
        );
      }
    } catch {
      toast.error('Gagal memuat detail kegiatan.');
    }
  };

  useEffect(() => {
    const userStr = localStorage.getItem('humass_user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setCurrentUser(u);
      } catch (e) {
        console.error('Error parsing user storage', e);
      }
    }

    const init = async () => {
      setLoading(true);
      await loadData();
      try {
        const users = await userService.getAll();
        // Filter users to only TIM HUMAS (role USER)
        setHumasUsers(users.filter((u) => u.role === 'USER'));
      } catch {
        console.error('Gagal memuat pengguna');
      }
      setLoading(false);
    };
    init();
  }, [params.id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Tautan detail kegiatan berhasil disalin!');
  };

  // Workflow Handlers
  const handleApproveExecution = async () => {
    if (!activity) return;
    setIsSubmitting(true);
    try {
      await activityService.approveExecution(activity.id);
      toast.success('Kegiatan telah disetujui untuk dilaksanakan!');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyetujui kegiatan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectExecution = async () => {
    if (!activity || !rejectNotes.trim()) {
      toast.warning('Catatan penolakan wajib diisi!');
      return;
    }
    setIsSubmitting(true);
    try {
      await activityService.rejectExecution(activity.id, rejectNotes);
      toast.success('Kegiatan telah ditolak.');
      setIsRejectModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menolak kegiatan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAssignTeam = async () => {
    if (!activity || !selectedPicId) {
      toast.warning('PIC Kegiatan wajib dipilih!');
      return;
    }
    setIsSubmitting(true);
    try {
      await activityService.assignTeam(activity.id, selectedPicId, selectedMemberIds);
      toast.success('Penugasan tim berhasil diperbarui!');
      setIsAssignModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui tim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = () => {
    if (!activity) return;
    setEditFormData({
      title: activity.title || '',
      category: activity.category || '',
      date: activity.date ? activity.date.split('T')[0] : '',
      startTime: activity.startTime || '08:00',
      endTime: activity.endTime || '12:00',
      location: activity.location || '',
      latitude: activity.latitude != null ? String(activity.latitude) : '',
      longitude: activity.longitude != null ? String(activity.longitude) : '',
      radius: activity.radius != null ? String(activity.radius) : '100',
      picId: activity.picId || 0,
      description: activity.description || '',
      memberIds: (activity.members ?? [])
        .filter((m) => m.userId !== activity.picId)
        .map((m) => m.userId),
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activity) return;
    if (!editFormData.title.trim()) {
      toast.warning('Judul kegiatan wajib diisi!');
      return;
    }
    if (!editFormData.location.trim()) {
      toast.warning('Lokasi kegiatan wajib diisi!');
      return;
    }
    if (!editFormData.picId) {
      toast.warning('PIC kegiatan wajib dipilih!');
      return;
    }
    setIsSubmitting(true);
    try {
      await activityService.update(activity.id, {
        title: editFormData.title,
        category: editFormData.category,
        date: editFormData.date,
        startTime: editFormData.startTime,
        endTime: editFormData.endTime,
        location: editFormData.location,
        latitude: editFormData.latitude ? parseFloat(editFormData.latitude) : undefined,
        longitude: editFormData.longitude ? parseFloat(editFormData.longitude) : undefined,
        radius: editFormData.radius ? parseFloat(editFormData.radius) : 100,
        picId: editFormData.picId,
        description: editFormData.description,
        memberIds: editFormData.memberIds,
      } as any);
      toast.success('Data kegiatan berhasil diperbarui!');
      setIsEditModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memperbarui kegiatan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitVerification = async () => {
    if (!activity) return;
    if (!checkChecked) {
      toast.warning('Anda harus menyetujui kelengkapan checklist sebelum mengajukan verifikasi.');
      return;
    }
    setIsSubmitting(true);
    try {
      await activityService.submitVerification(activity.id, verificationNotes);
      toast.success('Pengajuan verifikasi kelengkapan berhasil dikirim ke Kepala Humas!');
      setIsVerificationModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengajukan verifikasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleApproveFinish = async () => {
    if (!activity) return;
    setIsSubmitting(true);
    try {
      await activityService.approveFinish(activity.id);
      toast.success('Kegiatan disetujui selesai dan dipindahkan ke Riwayat!');
      router.push('/riwayat-kegiatan');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal menyetujui penyelesaian.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnRevision = async () => {
    if (!activity || !revisionNotes.trim()) {
      toast.warning('Catatan perbaikan wajib diisi!');
      return;
    }
    setIsSubmitting(true);
    try {
      await activityService.returnRevision(activity.id, revisionNotes);
      toast.success('Kegiatan dikembalikan ke Admin & PIC untuk perbaikan.');
      setIsRevisionModalOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengembalikan kegiatan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Detail Kegiatan Kehumasan">
        <DashboardSkeleton />
      </AdminLayout>
    );
  }

  if (!activity) {
    return (
      <AdminLayout title="Detail Kegiatan Kehumasan">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 font-medium">
          Kegiatan tidak ditemukan.
        </div>
      </AdminLayout>
    );
  }

  // Checklist calculations
  const picMember = activity.members?.find((m) => m.userId === activity.picId);
  const isPicCheckedIn = !!picMember?.checkInTime;

  const regularMembers = activity.members?.filter((m) => m.userId !== activity.picId) || [];
  const allMembersCheckedIn = regularMembers.length === 0 ? true : regularMembers.every((m) => !!m.checkInTime);

  const driveMedia = (activity.media ?? []).filter((m) => m.fileType === 'application/link');
  const isDriveUploaded = driveMedia.length > 0;

  const equipmentItems = (activity.loans ?? []).flatMap((loan: any) =>
    (loan.items ?? []).map((item: any) => ({
      id: item.id,
      name: item.equipment?.name || 'Alat',
      code: item.equipment?.code || '-',
      category: item.equipment?.category || '-',
      brand: item.equipment?.brand,
      quantity: item.quantity,
      returnedQuantity: item.returnedQuantity,
      returnCondition: item.returnCondition,
      isReturned: item.returnedQuantity >= item.quantity || loan.status === 'SELESAI',
      loanStatus: loan.status,
    }))
  );
  
  const isReadyForVerification = isPicCheckedIn && allMembersCheckedIn && isDriveUploaded;

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    const dateStr = formatDateID(isoString);
    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    return `${dateStr} pukul ${timeStr}`;
  };

  const checkInLogs = (activity.members ?? [])
    .filter((m) => m.checkInTime)
    .map((m) => {
      const att = activity.attendances?.find((a) => a.userId === m.userId);
      return {
        userId: m.userId,
        name: m.user.fullName,
        time: m.checkInTime,
        role: m.userId === activity.picId ? 'PIC' : 'Anggota',
        latitude: att?.latitude,
        longitude: att?.longitude,
      };
    })
    .sort((a, b) => (a.time || '').localeCompare(b.time || ''));

  return (
    <AdminLayout title="Detail Kegiatan Kehumasan">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href={activity.status === 'SELESAI' ? '/riwayat-kegiatan' : '/kegiatan'}
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shrink-0"
            title="Kembali ke Daftar Kegiatan"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="bg-teal-50 text-teal-700 font-bold px-2.5 py-0.5 rounded-md text-xs">
                {activity.category}
              </span>
              <StatusBadge status={getDisplayStatus(activity)} />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {activity.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
          <CustomButton variant="outline" size="sm" icon={Share2} onClick={handleCopyLink}>
            Bagikan
          </CustomButton>
          {activity.status !== 'SELESAI' && isSuperAdmin && (
            <CustomButton variant="outline" size="sm" icon={Edit3} onClick={handleOpenEditModal}>
              Edit Kegiatan
            </CustomButton>
          )}
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tanggal Pelaksanaan</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5">{formatDateID(activity.date)}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Waktu Peliputan</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5">
              {activity.startTime} - {activity.endTime} WIB
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lokasi Kegiatan</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5 truncate max-w-[180px]" title={activity.location}>
              {activity.location}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">PIC Bertugas</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">{activity.pic?.fullName ?? '-'}</p>
          </div>
        </div>
      </div>

      {/* SUMBER SURAT CARD — only if linked to a letter */}
      {activity.surat && (
        <div className="bg-sky-50 border border-sky-200 rounded-2xl p-5 shadow-xs">
          <div className="flex items-center gap-2.5 mb-3">
            <div className="w-9 h-9 rounded-xl bg-sky-100 text-sky-700 flex items-center justify-center shrink-0">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-bold text-sky-700 uppercase tracking-wider">Sumber Surat Masuk</p>
              <p className="text-xs text-sky-600 font-medium">Kegiatan ini dibuat berdasarkan surat masuk berikut</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-xs font-medium text-sky-900">
            <div><span className="text-sky-500 font-semibold">No. Surat:</span> {activity.surat.letterNumber}</div>
            <div><span className="text-sky-500 font-semibold">Tgl. Surat:</span> {activity.surat.letterDate ? formatDateID(activity.surat.letterDate.split('T')[0]) : '-'}</div>
            <div><span className="text-sky-500 font-semibold">Pengirim:</span> {activity.surat.sender}</div>
            <div><span className="text-sky-500 font-semibold">Instansi:</span> {activity.surat.institution}</div>
            <div className="sm:col-span-2"><span className="text-sky-500 font-semibold">Perihal:</span> {activity.surat.subject}</div>
          </div>
          {activity.surat.fileUrl && (
            <a
              href={activity.surat.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-sky-700 hover:text-sky-900 underline"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Buka File Surat Asli
            </a>
          )}
        </div>
      )}

      {/* Workflow Controls Card per Role & Status */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
        <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
          <ShieldCheck className="w-5 h-5 text-teal-600" />
          <h3 className="text-base font-bold text-slate-800">Alur Persetujuan & Penugasan</h3>
        </div>

        {/* Status: MENUNGGU_PERSETUJUAN */}
        {activity.status === 'MENUNGGU_PERSETUJUAN' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-900">Menunggu Persetujuan Pelaksanaan (Kepala Humas)</p>
                <p className="text-xs text-amber-800 mt-0.5">
                  Kegiatan baru telah diajukan dan memerlukan persetujuan dari Kepala Humas sebelum penugasan personel.
                </p>
              </div>
            </div>

            {isSuperAdmin && (
              <div className="flex flex-wrap gap-3 pt-2 border-t border-amber-200/60">
                <CustomButton
                  variant="primary"
                  size="sm"
                  icon={CheckCircle2}
                  onClick={handleApproveExecution}
                  disabled={isSubmitting}
                >
                  Setujui Pelaksanaan
                </CustomButton>
                <CustomButton
                  variant="danger"
                  size="sm"
                  icon={XCircle}
                  onClick={() => setIsRejectModalOpen(true)}
                  disabled={isSubmitting}
                >
                  Tolak Kegiatan
                </CustomButton>
              </div>
            )}
          </div>
        )}

        {/* Status: DITOLAK */}
        {activity.status === 'DITOLAK' && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-red-900">Pelaksanaan Ditolak</p>
              <p className="text-xs text-red-700 mt-0.5">
                Kegiatan ini telah ditolak oleh Kepala Humas dan tidak dilaksanakan.
              </p>
            </div>
          </div>
        )}

        {/* Status: DISETUJUI */}
        {activity.status === 'DISETUJUI' && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-blue-900">Pelaksanaan Disetujui — Menunggu Penugasan Tim</p>
                <p className="text-xs text-blue-800 mt-0.5">
                  Kegiatan ini disetujui. Kepala Humas wajib memilih PIC & Anggota Tim (khusus akun Tim Humas).
                </p>
              </div>
            </div>

            {isSuperAdmin && (
              <div className="pt-2 border-t border-blue-200/60">
                <CustomButton
                  variant="primary"
                  size="sm"
                  icon={UserPlus}
                  onClick={() => setIsAssignModalOpen(true)}
                  disabled={isSubmitting}
                >
                  Tentukan PIC & Anggota Tim
                </CustomButton>
              </div>
            )}
          </div>
        )}

        {/* Status: DITUGASKAN / SEDANG_BERLANGSUNG / MENUNGGU_VERIFIKASI / DIKEMBALIKAN */}
        {['DITUGASKAN', 'SEDANG_BERLANGSUNG', 'MENUNGGU_VERIFIKASI', 'DIKEMBALIKAN'].includes(activity.status) && (
          <div className="space-y-4">
            {activity.status === 'DIKEMBALIKAN' && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
                <RotateCcw className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-amber-900">Kegiatan Dikembalikan untuk Perbaikan</p>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Kepala Humas mengembalikan kegiatan ini untuk dilengkapi kembali. Silakan periksa kelengkapan check-in & link Drive.
                  </p>
                </div>
              </div>
            )}

            {/* Checklist progress */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1">
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${isPicCheckedIn ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                  {isPicCheckedIn ? <Check className="w-4 h-4" /> : '1'}
                </div>
                <span className={`text-xs font-semibold ${isPicCheckedIn ? 'text-slate-800' : 'text-slate-400'}`}>PIC Check-in</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${allMembersCheckedIn ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                  {allMembersCheckedIn ? <Check className="w-4 h-4" /> : '2'}
                </div>
                <span className={`text-xs font-semibold ${allMembersCheckedIn ? 'text-slate-800' : 'text-slate-400'}`}>Semua Anggota Check-in</span>
              </div>
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${isDriveUploaded ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                  {isDriveUploaded ? <Check className="w-4 h-4" /> : '3'}
                </div>
                <span className={`text-xs font-semibold ${isDriveUploaded ? 'text-slate-800' : 'text-slate-400'}`}>Upload Google Drive</span>
              </div>
            </div>

            {activity.status === 'MENUNGGU_VERIFIKASI' && (
              <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
                <span>Kegiatan ini berstatus <strong>Menunggu Verifikasi Admin</strong>. Verifikasi kelengkapan dilakukan di menu <strong>Verifikasi Kelengkapan</strong>.</span>
                {isAdmin && (
                  <CustomButton
                    variant="secondary"
                    size="sm"
                    onClick={() => router.push('/verifikasi-kegiatan')}
                    className="shrink-0"
                  >
                    Buka Verifikasi Kelengkapan
                  </CustomButton>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-end gap-3 pt-3 border-t border-slate-100">
              {isSuperAdmin && (
                <CustomButton
                  variant="outline"
                  size="sm"
                  icon={UserPlus}
                  onClick={() => setIsAssignModalOpen(true)}
                >
                  Ubah Penugasan Tim
                </CustomButton>
              )}
            </div>
          </div>
        )}

        {/* Status: MENUNGGU_PERSETUJUAN_AKHIR */}
        {activity.status === 'MENUNGGU_PERSETUJUAN_AKHIR' && (
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-4 space-y-3">
            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-purple-900">Menunggu Persetujuan Akhir (Kepala Humas)</p>
                <p className="text-xs text-purple-800 mt-0.5">
                  Admin telah memverifikasi seluruh kelengkapan. Persetujuan akhir dilakukan oleh Kepala Humas di menu <strong>Persetujuan</strong>.
                </p>
              </div>
            </div>

            {isSuperAdmin && (
              <div className="flex justify-end pt-2 border-t border-purple-200/60">
                <CustomButton
                  variant="primary"
                  size="sm"
                  onClick={() => router.push('/persetujuan')}
                >
                  Buka Menu Persetujuan
                </CustomButton>
              </div>
            )}
          </div>
        )}

        {/* Status: SELESAI */}
        {activity.status === 'SELESAI' && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-900">Kegiatan Selesai & Terverifikasi</p>
              <p className="text-xs text-emerald-700 mt-0.5">
                Kegiatan telah disetujui selesai oleh Kepala Humas dan diarsipkan.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Main 2-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section: Bukti Kehadiran Tim */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Camera className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-800">Bukti Kehadiran Tim (Selfie & GPS)</h3>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {(activity.members ?? []).map((m) => {
                const hasCheckedIn = !!m.checkInTime;
                const att = activity.attendances?.find((a) => a.userId === m.userId);
                const hasGPS = att?.latitude != null && att?.longitude != null;

                return (
                  <div key={m.id} className="border border-slate-200 rounded-2xl p-4 flex gap-4 bg-slate-50/30 hover:bg-white hover:shadow-2xs transition-all">
                    <div className="w-20 h-24 shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center relative group">
                      {hasCheckedIn && m.selfieUrl ? (
                        <>
                          <img src={m.selfieUrl} className="w-full h-full object-cover" alt="Selfie" />
                          <button
                            onClick={() => setSelectedPhoto(m.selfieUrl ?? null)}
                            className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer"
                          >
                            Zoom
                          </button>
                        </>
                      ) : (
                        <div className="text-center p-2">
                          <Camera className="w-6 h-6 text-slate-300 mx-auto" />
                          <span className="text-[9px] text-slate-400 block mt-1">No Selfie</span>
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0 text-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 justify-between">
                          <p className="font-bold text-slate-800 truncate">{m.user.fullName}</p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 uppercase ${
                            hasCheckedIn
                              ? m.checkInStatus === 'TERLAMBAT'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-green-50 text-green-700 border border-green-200'
                              : 'bg-red-50 text-red-700 border border-red-200'
                          }`}>
                            {hasCheckedIn ? (m.checkInStatus === 'TERLAMBAT' ? 'Terlambat' : 'Hadir') : 'Belum'}
                          </span>
                        </div>
                        <p className="text-[10px] text-teal-600 font-bold mt-0.5">{m.userId === activity.picId ? 'PIC Lapangan' : m.role || 'Anggota'}</p>
                      </div>

                      {hasCheckedIn ? (
                        <div className="mt-2 space-y-1 text-slate-500 font-medium text-[11px]">
                          <p>⏰ Jam: <strong className="text-slate-700">{m.checkInTime}</strong></p>
                          <p className="truncate" title={activity.location}>📍 Lokasi: <strong className="text-slate-700">{activity.location}</strong></p>
                          <p className="flex items-center gap-1">
                            🌐 GPS: 
                            <span className={`font-bold uppercase text-[9px] px-1 rounded ${hasGPS ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                              {hasGPS ? 'Valid' : 'Tidak Valid'}
                            </span>
                            {hasGPS && <span className="text-[9px] text-slate-400">({att?.latitude?.toFixed(4)}, {att?.longitude?.toFixed(4)}{att?.distance != null ? ` • ${att.distance}m` : ''})</span>}
                          </p>
                        </div>
                      ) : (
                        <p className="text-red-500 italic text-[11px] mt-2">Belum melakukan check-in.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section: Dokumentasi Google Drive */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Share2 className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-800">Dokumentasi Google Drive (1 Link Maksimal)</h3>
              </div>
            </div>

            {driveMedia.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-400">
                <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold">Belum ada dokumentasi.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">PIC atau anggota bertugas dapat mengunggah link Google Drive dari aplikasi Android.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {driveMedia.map((doc) => {
                  const formattedDate = formatDateID(doc.createdAt);
                  const docDateObj = new Date(doc.createdAt);
                  const formattedTime = docDateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

                  return (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-2xs transition-all text-xs"
                    >
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                          <Share2 className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-slate-800 truncate">
                            Link Drive Resmi Kegiatan
                          </p>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-600 hover:underline truncate block text-[11px] mt-0.5 font-semibold"
                          >
                            {doc.fileUrl}
                          </a>
                          <p className="text-[10px] text-slate-400 mt-1 font-medium">
                            Pengunggah: <strong className="text-slate-600">{doc.uploader?.fullName ?? 'Tim Humas'}</strong> • Upload: {formattedDate} - {formattedTime}
                          </p>
                        </div>
                      </div>
                      <a
                        href={doc.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2.5 rounded-lg bg-white border border-slate-200 hover:bg-teal-50 hover:text-teal-600 text-slate-600 transition-colors shrink-0 cursor-pointer ml-3"
                        title="Buka Google Drive"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Section: Peralatan yang Digunakan */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Package className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-800">
                  Peralatan yang Digunakan ({equipmentItems.length})
                </h3>
              </div>
            </div>

            {equipmentItems.length === 0 ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-400">
                <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs font-semibold">Tidak ada peralatan yang ditugaskan untuk kegiatan ini.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {equipmentItems.map((eq: any) => (
                  <div
                    key={eq.id}
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 flex items-center justify-between gap-3 hover:bg-white hover:shadow-2xs transition-all"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 truncate">{eq.name}</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        {eq.category} {eq.brand ? `• ${eq.brand}` : ''} ({eq.code})
                      </p>
                      {eq.returnCondition && (
                        <span className="inline-block mt-1 text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                          Kondisi: {eq.returnCondition}
                        </span>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <span className="font-bold text-slate-800 block">{eq.quantity} Unit</span>
                      <span
                        className={`inline-block mt-1 text-[9px] font-bold px-1.5 py-0.5 rounded ${
                          eq.isReturned
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        {eq.isReturned ? 'Dikembalikan' : 'Sedang Digunakan'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section: Riwayat Persetujuan (Approval History Log) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <History className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-bold text-slate-800">Riwayat Persetujuan & Catatan</h3>
            </div>

            {(!activity.approvalHistory || activity.approvalHistory.length === 0) ? (
              <p className="text-xs text-slate-400 italic text-center py-4">Belum ada riwayat persetujuan.</p>
            ) : (
              <div className="space-y-3">
                {activity.approvalHistory.map((item, idx) => (
                  <div key={idx} className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{item.stage}</span>
                      <StatusBadge status={item.status} />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Oleh: <strong className="text-slate-700">{item.fullName}</strong> ({item.role}) • {formatDateTime(item.date)}
                    </p>
                    {item.notes && (
                      <p className="text-slate-600 italic bg-white p-2 rounded-lg border border-slate-100 mt-1">
                        "{item.notes}"
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Span 1) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Personel Bertugas */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Personel Bertugas ({activity.members?.length ?? 0})</h3>
              <span className="w-2.5 h-2.5 rounded-full bg-teal-500 animate-pulse" />
            </div>

            <div className="space-y-3.5">
              {(activity.members ?? []).map((m) => {
                const hasCheckedIn = !!m.checkInTime;

                return (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-start gap-3"
                  >
                    <UserAvatar src={m.user.avatar} name={m.user.fullName} size="md" />
                    <div className="min-w-0 flex-1 text-xs">
                      <div className="flex items-center justify-between gap-1.5">
                        <h4 className="font-bold text-slate-800 truncate">{m.user.fullName}</h4>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                          hasCheckedIn ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {hasCheckedIn ? '🟢 Hadir' : '🔴 Belum'}
                        </span>
                      </div>
                      <p className="text-[10px] font-bold text-teal-600 mt-0.5">{m.userId === activity.picId ? 'PIC Lapangan' : m.role || 'Anggota'}</p>
                      
                      {hasCheckedIn ? (
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">
                          Check-in: {m.checkInTime}
                        </p>
                      ) : (
                        <p className="text-[10px] text-slate-400 italic mt-1 font-medium">
                          Belum melakukan check-in.
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Timeline Check-in */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <MapPinCheckInside className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-bold text-slate-800">Log Kehadiran (Timeline)</h3>
            </div>

            {checkInLogs.length === 0 ? (
              <p className="text-xs text-slate-400 italic text-center py-4">Belum ada timeline check-in.</p>
            ) : (
              <div className="relative border-l-2 border-slate-100 pl-4 ml-2.5 space-y-4 py-1 text-xs">
                {checkInLogs.map((log, idx) => (
                  <div key={idx} className="relative">
                    <div className="absolute -left-6.5 top-0.5 w-3 h-3 rounded-full bg-teal-600 border-2 border-white shadow-xs" />
                    <div>
                      <span className="font-bold text-teal-700 bg-teal-50 px-1.5 py-0.2 rounded text-[10px]">
                        {log.time}
                      </span>
                      <p className="font-bold text-slate-800 mt-1.5">{log.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Berhasil Check-in sebagai <strong className="text-teal-600/90 font-bold">{log.role}</strong>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MODALS ──────────────────────────────────────────────────────── */}

      {/* Photo Preview Modal */}
      <CustomModal
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        title="Pratinjau Foto Selfie Check-in"
        maxWidth="xl"
      >
        {isValidImageSrc(selectedPhoto) && (
          <div className="space-y-4">
            <img src={selectedPhoto} alt="Pratinjau" className="w-full max-h-[70vh] object-contain rounded-xl border border-slate-100 shadow-sm" />
            <div className="flex justify-end">
              <CustomButton variant="outline" size="sm" onClick={() => setSelectedPhoto(null)}>
                Tutup
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>

      {/* Reject Execution Modal */}
      <CustomModal
        isOpen={isRejectModalOpen}
        onClose={() => setIsRejectModalOpen(false)}
        title="Tolak Pelaksanaan Kegiatan"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 font-medium">
            Masukkan catatan penolakan untuk kegiatan ini. Catatan akan tersimpan pada riwayat persetujuan.
          </p>
          <textarea
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
            placeholder="Alasan penolakan..."
            className="w-full border border-slate-200 rounded-xl p-3 h-24 focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-600 text-xs"
          />
          <div className="flex justify-end gap-3 pt-2">
            <CustomButton variant="outline" size="sm" onClick={() => setIsRejectModalOpen(false)}>
              Batal
            </CustomButton>
            <CustomButton variant="danger" size="sm" onClick={handleRejectExecution} disabled={isSubmitting}>
              Konfirmasi Tolak
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* Team Assignment Modal (Super Admin) */}
      <CustomModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Penugasan Tim Humas (Kepala Humas)"
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 font-medium">
            Pilih PIC dan Anggota Tim dari akun Tim Humas. PIC tidak akan muncul pada pilihan anggota.
          </p>

          {/* PIC Selection */}
          <div className="space-y-1.5">
            <label className="font-bold text-slate-800 block">Pilih PIC Kegiatan *</label>
            <select
              value={selectedPicId}
              onChange={(e) => {
                const picId = Number(e.target.value);
                setSelectedPicId(picId);
                // Remove PIC from selected members if present
                setSelectedMemberIds((prev) => prev.filter((id) => id !== picId));
              }}
              className="w-full border border-slate-200 rounded-xl p-2.5 bg-white text-xs font-semibold focus:ring-2 focus:ring-teal-500/20"
            >
              <option value={0}>-- Pilih PIC (Tim Humas) --</option>
              {humasUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} (@{u.username})
                </option>
              ))}
            </select>
          </div>

          {/* Member Selection */}
          <div className="space-y-1.5 pt-2">
            <label className="font-bold text-slate-800 block">Pilih Anggota Kegiatan (Opsional)</label>
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/50">
              {humasUsers
                .filter((u) => u.id !== selectedPicId) // Filter out PIC
                .map((u) => {
                  const isChecked = selectedMemberIds.includes(u.id);
                  return (
                    <label key={u.id} className="flex items-center gap-2.5 font-medium cursor-pointer hover:text-slate-900 select-none">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedMemberIds((prev) => [...prev, u.id]);
                          } else {
                            setSelectedMemberIds((prev) => prev.filter((id) => id !== u.id));
                          }
                        }}
                        className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                      />
                      <span>{u.fullName} (@{u.username})</span>
                    </label>
                  );
                })}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <CustomButton variant="outline" size="sm" onClick={() => setIsAssignModalOpen(false)}>
              Batal
            </CustomButton>
            <CustomButton variant="primary" size="sm" onClick={handleAssignTeam} disabled={isSubmitting || !selectedPicId}>
              Simpan Penugasan
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* Admin Verification Submission Modal */}
      <CustomModal
        isOpen={isVerificationModalOpen}
        onClose={() => setIsVerificationModalOpen(false)}
        title="Pengajuan Verifikasi Kelengkapan (Admin)"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="bg-teal-50 border border-teal-200 rounded-xl p-3.5 text-teal-800 flex items-start gap-2.5 font-medium">
            <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Verifikasi Kelengkapan Admin</p>
              <p className="mt-1">
                Pastikan PIC & Kru sudah check-in, link Google Drive sudah diupload, dan seluruh alat sudah dikembalikan.
              </p>
            </div>
          </div>

          <textarea
            value={verificationNotes}
            onChange={(e) => setVerificationNotes(e.target.value)}
            placeholder="Catatan verifikasi (opsional)..."
            className="w-full border border-slate-200 rounded-xl p-3 h-20 focus:outline-none focus:ring-2 focus:ring-teal-500/20 text-xs"
          />

          <label className="flex items-start gap-2.5 cursor-pointer select-none font-bold text-slate-700">
            <input
              type="checkbox"
              checked={checkChecked}
              onChange={(e) => setCheckChecked(e.target.checked)}
              className="w-4 h-4 accent-teal-600 border border-slate-200 rounded shrink-0 mt-0.5"
            />
            <span>Saya mengonfirmasi bahwa seluruh checklist kelengkapan telah valid.</span>
          </label>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <CustomButton variant="outline" size="sm" onClick={() => setIsVerificationModalOpen(false)}>
              Batal
            </CustomButton>
            <CustomButton variant="primary" size="sm" onClick={handleSubmitVerification} disabled={!checkChecked || isSubmitting}>
              Kirim Verifikasi
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* Return for Revision Modal (Super Admin) */}
      <CustomModal
        isOpen={isRevisionModalOpen}
        onClose={() => setIsRevisionModalOpen(false)}
        title="Kembalikan Kegiatan untuk Perbaikan"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <p className="text-slate-600 font-medium">
            Masukkan catatan perbaikan yang wajib ditindaklanjuti oleh Admin / Tim Humas.
          </p>
          <textarea
            value={revisionNotes}
            onChange={(e) => setRevisionNotes(e.target.value)}
            placeholder="Catatan perbaikan..."
            className="w-full border border-slate-200 rounded-xl p-3 h-24 focus:outline-none focus:ring-2 focus:ring-amber-500/20 text-xs"
          />
          <div className="flex justify-end gap-3 pt-2">
            <CustomButton variant="outline" size="sm" onClick={() => setIsRevisionModalOpen(false)}>
              Batal
            </CustomButton>
            <CustomButton variant="primary" size="sm" onClick={handleReturnRevision} disabled={isSubmitting || !revisionNotes.trim()}>
              Kembalikan untuk Revisi
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ── MODAL: EDIT KEGIATAN (SUPER ADMIN) ── */}
      <CustomModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Data Kegiatan"
        subtitle="Perbarui informasi judul, kategori, lokasi, jadwal, atau PIC kegiatan."
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Judul Kegiatan *</label>
            <input
              type="text"
              required
              value={editFormData.title}
              onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Kategori Kegiatan *</label>
              <input
                type="text"
                required
                value={editFormData.category}
                onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Lokasi Kegiatan *</label>
              <input
                type="text"
                required
                value={editFormData.location}
                onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                placeholder="Contoh: Gedung Serbaguna Polinela"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Tanggal Pelaksanaan *</label>
              <input
                type="date"
                required
                value={editFormData.date}
                onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Mulai (WIB) *</label>
              <input
                type="time"
                required
                value={editFormData.startTime}
                onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Selesai (WIB) *</label>
              <input
                type="time"
                value={editFormData.endTime}
                onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              />
            </div>
          </div>

          {/* GPS Coordinates in Edit Modal */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2.5">
            <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Koordinat GPS Lokasi & Radius Absensi (Opsional)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={editFormData.latitude}
                  onChange={(e) => setEditFormData({ ...editFormData, latitude: e.target.value })}
                  placeholder="-5.3582"
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={editFormData.longitude}
                  onChange={(e) => setEditFormData({ ...editFormData, longitude: e.target.value })}
                  placeholder="105.2321"
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-1">Radius (Meter)</label>
                <input
                  type="number"
                  value={editFormData.radius}
                  onChange={(e) => setEditFormData({ ...editFormData, radius: e.target.value })}
                  placeholder="100"
                  className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Personel PIC *</label>
              <select
                required
                value={editFormData.picId}
                onChange={(e) => {
                  const pid = Number(e.target.value);
                  setEditFormData({
                    ...editFormData,
                    picId: pid,
                    memberIds: editFormData.memberIds.filter((id) => id !== pid),
                  });
                }}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
              >
                <option value={0}>-- Pilih PIC (Tim Humas) --</option>
                {humasUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} (@{u.username})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Pilih Anggota Kegiatan (Opsional)</label>
              <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl p-3 space-y-2 bg-slate-50/50">
                {humasUsers
                  .filter((u) => u.id !== editFormData.picId)
                  .map((u) => {
                    const isChecked = editFormData.memberIds.includes(u.id);
                    return (
                      <label key={u.id} className="flex items-center gap-2 font-medium cursor-pointer hover:text-slate-900 select-none">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setEditFormData({ ...editFormData, memberIds: [...editFormData.memberIds, u.id] });
                            } else {
                              setEditFormData({ ...editFormData, memberIds: editFormData.memberIds.filter((id) => id !== u.id) });
                            }
                          }}
                          className="w-4 h-4 accent-teal-600 rounded cursor-pointer"
                        />
                        <span>{u.fullName} (@{u.username})</span>
                      </label>
                    );
                  })}
              </div>
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Deskripsi / Catatan Tugas</label>
            <textarea
              rows={2}
              value={editFormData.description}
              onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
              placeholder="Catatan arahan kegiatan..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs text-slate-800 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <CustomButton type="button" variant="outline" size="sm" onClick={() => setIsEditModalOpen(false)}>
              Batal
            </CustomButton>
            <CustomButton type="submit" variant="primary" size="sm" disabled={isSubmitting || !editFormData.picId}>
              Simpan Perubahan
            </CustomButton>
          </div>
        </form>
      </CustomModal>
    </AdminLayout>
  );
}
