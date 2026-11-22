'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  StatusBadge,
  CustomButton,
  UserAvatar,
  CustomModal,
  LocationPicker,
  CustomDatePicker,
  CustomTimePicker,
  FilterDropdown,
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
  MapPinCheckInside,
  ExternalLink,
  Info,
  Camera,
  XCircle,
  UserPlus,
  History,
  Mail,
  Package,
  Globe,
  FileText,
  Building2,
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
        // Filter users to only Anggota Humas aktif (role USER & status AKTIF)
        setHumasUsers(users.filter((u) => u.role === 'USER' && u.status === 'AKTIF'));
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

  if (loading) {
    return (
      <AdminLayout title="Detail Kegiatan Kehumasan">
        <div className="space-y-6">
          <div className="h-32 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs shimmer-card animate-shimmer" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 h-96 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs shimmer-card animate-shimmer" />
            <div className="lg:col-span-4 h-96 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs shimmer-card animate-shimmer" />
          </div>
        </div>
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

  const driveMedia = (activity.media ?? []).filter((m) => m.fileType === 'application/link');

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

  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    const dateStr = formatDateID(isoString);
    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    return `${dateStr} pukul ${timeStr}`;
  };

  // Gabungkan daftar members dengan PIC (jika PIC belum masuk ke array members)
  const assignedMembers = (() => {
    const list = [...(activity.members ?? [])];
    if (activity.pic && !list.some((m) => m.userId === activity.pic!.id)) {
      const picAtt = activity.attendances?.find((a) => a.userId === activity.pic!.id);
      list.unshift({
        id: -activity.pic.id,
        activityId: activity.id,
        userId: activity.pic.id,
        role: 'PIC Lapangan',
        checkInTime: picAtt?.checkInTime ?? undefined,
        checkInStatus: picAtt?.status ?? undefined,
        selfieUrl: picAtt?.selfieUrl ?? undefined,
        user: activity.pic,
      } as any);
    }
    return list;
  })();

  const checkInLogs = assignedMembers
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
      <div className="space-y-4 pb-10 font-['Poppins']">
        {/* 1. Top Header Bar */}
        <div className="bg-white rounded-2xl border border-slate-200/80 px-5 sm:px-6 py-4.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 min-w-0">
            <Link
              href={activity.status === 'SELESAI' ? '/riwayat-kegiatan' : '/kegiatan'}
              className="p-2 rounded-xl text-slate-600 hover:text-[#003D58] hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
              title="Kembali ke Daftar Kegiatan"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div className="min-w-0">
              <h1
                className="text-lg sm:text-xl font-extrabold text-[#003D58] uppercase tracking-tight truncate"
                title={activity.title}
              >
                {activity.title}
              </h1>
              {activity.category && (
                <p className="text-xs font-medium text-slate-400 mt-0.5 truncate">
                  {activity.category}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <StatusBadge status={getDisplayStatus(activity)} />

            {activity.status === 'MENUNGGU_PERSETUJUAN' && isSuperAdmin && (
              <>
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
                  Tolak
                </CustomButton>
              </>
            )}

            {activity.status === 'DISETUJUI' && isSuperAdmin && (
              <CustomButton
                variant="primary"
                size="sm"
                icon={UserPlus}
                onClick={() => setIsAssignModalOpen(true)}
                disabled={isSubmitting}
              >
                Tugaskan Tim
              </CustomButton>
            )}

            {activity.status !== 'SELESAI' && isSuperAdmin && (
              <CustomButton variant="outline" size="sm" icon={Edit3} onClick={handleOpenEditModal}>
                Edit Kegiatan
              </CustomButton>
            )}
          </div>
        </div>

        {/* 2. Row of 4 Info Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-2xl border border-slate-200/80 px-5 py-4 shadow-2xs flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Tanggal Pelaksanaan</p>
              <p className="text-sm sm:text-[15px] font-bold text-[#0F172A] mt-0.5 truncate">
                {formatDateID(activity.date)}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 px-5 py-4 shadow-2xs flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-sky-50 text-[#003D58] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Waktu Peliputan</p>
              <p className="text-sm sm:text-[15px] font-bold text-[#0F172A] mt-0.5 truncate">
                {activity.startTime} - {activity.endTime} WIB
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 px-5 py-4 shadow-2xs flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Lokasi Kegiatan</p>
              <p className="text-sm sm:text-[15px] font-bold text-[#0F172A] mt-0.5 truncate" title={activity.location}>
                {activity.location}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 px-5 py-4 shadow-2xs flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">PIC Bertugas</p>
              <p
                className="text-sm sm:text-[15px] font-bold text-[#0F172A] mt-0.5 truncate"
                title={activity.pic?.fullName ?? '-'}
              >
                {activity.pic?.fullName ?? '-'}
              </p>
            </div>
          </div>
        </div>

        {/* 3. Main Asymmetric Bento Grid (Exact 1-to-1 Figma Layout: Left 5 cols | Right 7 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch">
          {/* ─── LEFT COLUMN (5 cols): Sumber Surat + Bukti Kehadiran Tim ─── */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            {/* SUMBER SURAT MASUK (Exact match to reference card) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
              {/* Card Header */}
              <div className="flex items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-sky-50 text-[#003D58] flex items-center justify-center shrink-0">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xs sm:text-[13px] font-extrabold text-[#003D58] uppercase tracking-wide">
                      Sumber Surat Masuk
                    </h2>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      {activity.surat
                        ? 'Kegiatan ini dibuat berdasarkan surat masuk berikut'
                        : 'Informasi sumber pengajuan kegiatan kehumasan'}
                    </p>
                  </div>
                </div>
                {activity.surat && (
                  activity.surat.fileUrl ? (
                    <a
                      href={activity.surat.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#003D58] transition-colors shrink-0 whitespace-nowrap shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#003D58]" />
                      <span>Lihat Surat</span>
                    </a>
                  ) : (
                    <Link
                      href="/surat-masuk"
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#003D58] transition-colors shrink-0 whitespace-nowrap shadow-2xs"
                    >
                      <FileText className="w-3.5 h-3.5 text-[#003D58]" />
                      <span>Lihat Surat</span>
                    </Link>
                  )
                )}
              </div>

              {activity.surat ? (
                <>
                  {/* Perihal + Dokumen Resmi pill */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Perihal</p>
                      <p className="text-sm font-bold text-[#003D58] mt-0.5 leading-snug">
                        {activity.surat.subject}
                      </p>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-[#003D58] shrink-0 whitespace-nowrap shadow-2xs">
                      Dokumen Resmi
                    </span>
                  </div>

                  {/* 3-Col Meta Tiles: No Surat, Tgl Surat, Instansi */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="min-w-0 rounded-xl bg-slate-50/70 p-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No. Surat</p>
                      <p className="font-bold text-[#003D58] mt-1 break-words leading-snug">
                        {activity.surat.letterNumber}
                      </p>
                    </div>
                    <div className="min-w-0 rounded-xl bg-slate-50/70 p-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Tgl. Surat</span>
                      </p>
                      <p className="font-bold text-[#003D58] mt-1">
                        {activity.surat.letterDate ? formatDateID(activity.surat.letterDate.split('T')[0]) : '-'}
                      </p>
                    </div>
                    <div className="min-w-0 rounded-xl bg-slate-50/70 p-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider inline-flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Instansi</span>
                      </p>
                      <p className="font-bold text-[#003D58] mt-1 truncate" title={activity.surat.institution}>
                        {activity.surat.institution}
                      </p>
                    </div>
                  </div>

                  {/* Pengirim footer */}
                  <div className="pt-1 text-xs text-slate-400 flex items-center gap-2">
                    <span>Pengirim:</span>
                    <span className="font-bold text-[#003D58]">{activity.surat.sender}</span>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Perihal</p>
                      <p className="text-sm font-bold text-[#003D58] mt-0.5 leading-snug">
                        {activity.title}
                      </p>
                    </div>
                    <span className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-[#003D58] shrink-0 whitespace-nowrap shadow-2xs">
                      Agenda Langsung
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
                    <div className="min-w-0 rounded-xl bg-slate-50/70 p-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">No. Surat</p>
                      <p className="font-bold text-slate-400 mt-1">-</p>
                    </div>
                    <div className="min-w-0 rounded-xl bg-slate-50/70 p-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider inline-flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Tgl. Kegiatan</span>
                      </p>
                      <p className="font-bold text-[#003D58] mt-1">
                        {formatDateID(activity.date)}
                      </p>
                    </div>
                    <div className="min-w-0 rounded-xl bg-slate-50/70 p-3">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider inline-flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                        <span>Sumber</span>
                      </p>
                      <p className="font-bold text-[#003D58] mt-1 truncate">Internal Humas</p>
                    </div>
                  </div>

                  <div className="pt-1 text-xs text-slate-400 flex items-center gap-2">
                    <span>Catatan:</span>
                    <span className="font-medium text-slate-600 truncate">
                      {activity.description || 'Dibuat langsung tanpa surat masuk'}
                    </span>
                  </div>
                </>
              )}
            </div>

            {/* Deskripsi Kegiatan (only if surat exists AND description exists) */}
            {activity.surat && activity.description && (
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-2xs space-y-1.5">
                <h2 className="text-[11px] font-extrabold text-[#003D58] uppercase tracking-wide flex items-center gap-1.5">
                  <Info className="w-3.5 h-3.5 text-[#003D58]" />
                  Catatan Kegiatan
                </h2>
                <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap">
                  {activity.description}
                </p>
              </div>
            )}

            {/* Bukti Kehadiran Tim (Selfie & GPS) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs flex flex-col gap-4 flex-1">
              <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
                <div className="flex items-center gap-2.5 min-w-0">
                  <Camera className="w-5 h-5 text-[#003D58] shrink-0" />
                  <h2 className="text-sm sm:text-[15px] font-bold text-[#003D58] truncate">
                    Bukti Kehadiran Tim (Selfie &amp; GPS)
                  </h2>
                </div>
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full shrink-0">
                  {assignedMembers.filter((m) => m.checkInTime).length}/{assignedMembers.length} Hadir
                </span>
              </div>

              {assignedMembers.length === 0 ? (
                <div className="flex-1 bg-slate-50/70 border border-dashed border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center text-slate-400">
                  <Camera className="w-6 h-6 text-slate-300 mb-1.5" />
                  <p className="text-xs font-semibold text-slate-500">Belum ada personel yang ditugaskan.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {assignedMembers.map((m) => {
                    const hasCheckedIn = !!m.checkInTime;
                    const att = activity.attendances?.find((a) => a.userId === m.userId);
                    const hasGPS = att?.latitude != null && att?.longitude != null;

                    return (
                      <div
                        key={m.id}
                        className="rounded-xl p-2.5 flex items-center gap-3.5 hover:bg-slate-50/70 transition-colors"
                      >
                        <div className="w-16 h-16 shrink-0 rounded-2xl overflow-hidden bg-slate-100/90 border border-slate-200/70 flex items-center justify-center relative group">
                          {hasCheckedIn && m.selfieUrl ? (
                            <>
                              <img src={m.selfieUrl} className="w-full h-full object-cover" alt="Selfie" />
                              <button
                                type="button"
                                onClick={() => setSelectedPhoto(m.selfieUrl ?? null)}
                                className="absolute inset-0 bg-[#003D58]/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity cursor-pointer text-[11px] font-semibold"
                              >
                                Zoom
                              </button>
                            </>
                          ) : (
                            <div className="text-center px-1">
                              <Camera className="w-4.5 h-4.5 text-slate-400 mx-auto" />
                              <span className="text-[10px] text-slate-400 font-medium block mt-0.5">No Selfie</span>
                            </div>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-[#003D58] truncate">{m.user.fullName}</p>
                          <span className="inline-block text-[11px] font-semibold text-[#003D58] bg-sky-100 px-2.5 py-0.5 rounded-md mt-1">
                            {m.userId === activity.picId ? 'PIC Lapangan' : m.role || 'Anggota Tim'}
                          </span>
                          {hasCheckedIn ? (
                            <div className="mt-1.5 space-y-0.5 text-[11px] text-slate-500">
                              <p className="font-semibold text-emerald-700 truncate">
                                Hadir · {m.checkInTime} WIB
                              </p>
                              <p className="inline-flex items-center gap-1 truncate">
                                <Globe className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className={hasGPS ? 'text-emerald-600 font-semibold' : 'text-rose-500'}>
                                  {hasGPS ? `GPS Valid${att?.distance != null ? ` (${att.distance}m)` : ''}` : 'GPS Tidak Valid'}
                                </span>
                              </p>
                            </div>
                          ) : (
                            <p className="text-[11px] text-rose-500 italic mt-1.5 truncate">
                              Belum melakukan check-in.
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ─── RIGHT COLUMN (7 cols): Google Drive Top + 3-Col Sub-grid Bottom ─── */}
          <div className="lg:col-span-7 flex flex-col gap-4">
            {/* Dokumentasi Google Drive (1 Link Maksimal) */}
            <div className="bg-white rounded-2xl border border-slate-200/80 p-5 sm:p-6 shadow-2xs space-y-3.5">
              <h2 className="text-sm sm:text-[15px] font-bold text-[#0F172A]">
                Dokumentasi Google Drive (1 Link Maksimal)
              </h2>

              {driveMedia.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/70 py-6 px-4 text-center">
                  <p className="text-xs sm:text-[13px] font-semibold text-slate-500">Belum ada link dokumentasi Google Drive</p>
                  <p className="text-xs text-slate-400 mt-1">
                    PIC atau anggota bertugas dapat mengunggah link Google Drive dari aplikasi mobile.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {driveMedia.map((doc) => {
                    const formattedDate = formatDateID(doc.createdAt);
                    const docDateObj = new Date(doc.createdAt);
                    const formattedTime =
                      docDateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';

                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between gap-3.5 p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                          <div className="w-11 h-11 rounded-full bg-[#C0FFEA]/60 text-[#0F766E] flex items-center justify-center shrink-0">
                            <Share2 className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-bold text-slate-800 truncate">
                              Link Drive Resmi Kegiatan
                            </p>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-sky-600 hover:text-[#003D58] hover:underline truncate block mt-0.5 font-medium"
                            >
                              {doc.fileUrl}
                            </a>
                            <p className="text-[11px] text-slate-400 mt-1 truncate">
                              Pengunggah: <strong className="text-slate-600">{doc.uploader?.fullName ?? 'Tim Humas'}</strong> · Upload: {formattedDate} - {formattedTime}
                            </p>
                          </div>
                        </div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2.5 rounded-xl bg-white border border-slate-200 hover:border-[#003D58] hover:text-[#003D58] text-slate-500 transition-colors shrink-0 cursor-pointer"
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

            {/* Bottom 3-Column Sub-Grid (More Generous Sizing) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch flex-1">
              {/* Sub-Col 1: Personel Bertugas + Log Kehadiran (Timeline) */}
              <div className="flex flex-col gap-4 min-w-0">
                {/* Personel Bertugas */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="text-[13px] font-bold text-[#0F172A] truncate">
                      Personel Bertugas ({assignedMembers.length})
                    </h3>
                    {isSuperAdmin && activity.status !== 'SELESAI' && (
                      <button
                        type="button"
                        onClick={() => setIsAssignModalOpen(true)}
                        className="text-[11px] font-semibold text-[#003D58] hover:underline cursor-pointer shrink-0"
                      >
                        {assignedMembers.length > 0 ? 'Ubah' : 'Tugaskan'}
                      </button>
                    )}
                  </div>

                  {assignedMembers.length === 0 ? (
                    <p className="text-xs text-slate-400 italic text-center py-4">
                      Belum ada personel.
                    </p>
                  ) : (
                    <div className="space-y-2.5">
                      {assignedMembers.map((m) => {
                        const hasCheckedIn = !!m.checkInTime;
                        return (
                          <div key={m.id} className="flex items-center gap-2.5 min-w-0">
                            <UserAvatar src={m.user.avatar} name={m.user.fullName} size="md" />
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <p className="text-xs font-bold text-slate-800 truncate">{m.user.fullName}</p>
                                <span className="text-[10px] font-semibold text-[#0F766E] bg-[#C0FFEA]/60 px-2 py-0.5 rounded-full shrink-0">
                                  {m.userId === activity.picId ? 'PIC Lapangan' : m.role || 'Anggota'}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                                {hasCheckedIn ? `Check-in ${m.checkInTime} WIB` : 'Belum melakukan check-in'}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Log Kehadiran (Timeline) */}
                <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs flex flex-col gap-3 flex-1">
                  <div className="flex items-center gap-2">
                    <MapPinCheckInside className="w-4 h-4 text-[#003D58] shrink-0" />
                    <h3 className="text-[13px] font-bold text-[#0F172A] truncate">Log Kehadiran (Timeline)</h3>
                  </div>

                  {checkInLogs.length === 0 ? (
                    <div className="flex-1 min-h-[90px] rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-center p-4 text-center">
                      <p className="text-xs text-slate-400 italic">Belum ada timeline check-in.</p>
                    </div>
                  ) : (
                    <div className="relative border-l-2 border-slate-100 pl-3.5 ml-1.5 space-y-3 py-0.5 text-xs">
                      {checkInLogs.map((log, idx) => (
                        <div key={idx} className="relative">
                          <div className="absolute -left-[19px] top-1 w-2.5 h-2.5 rounded-full bg-[#003D58] border-2 border-white" />
                          <span className="text-[10px] font-bold text-[#003D58] bg-sky-50 px-2 py-0.5 rounded">
                            {log.time}
                          </span>
                          <p className="text-xs font-bold text-slate-800 mt-1 leading-tight truncate">{log.name}</p>
                          <p className="text-[11px] text-slate-400 truncate">{log.role}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Sub-Col 2: Peralatan yang Digunakan */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs flex flex-col gap-3 h-full min-w-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#C0FFEA]/60 text-[#0F766E] flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-[13px] font-bold text-[#0F172A] leading-tight truncate">
                      Peralatan yang Digunakan
                    </h3>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      Daftar perangkat operasional aktif
                    </p>
                  </div>
                </div>

                {equipmentItems.length === 0 ? (
                  <div className="flex-1 min-h-[150px] rounded-xl border border-slate-100 bg-slate-50/70 flex flex-col items-center justify-center p-4 text-center">
                    <Package className="w-6 h-6 text-slate-300 mb-1.5" />
                    <p className="text-xs text-slate-400 italic">
                      Tidak ada peralatan dipinjam.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2.5 flex-1">
                    {equipmentItems.map((eq: any) => (
                      <div
                        key={eq.id}
                        className="p-3 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-white border border-slate-200/80 flex items-center justify-center text-slate-500 shrink-0">
                              <Camera className="w-3.5 h-3.5" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-slate-800 truncate">{eq.name}</p>
                              <p className="text-[10px] text-slate-400 truncate">
                                {eq.category} ({eq.code})
                              </p>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-slate-700 shrink-0 whitespace-nowrap">
                            {eq.quantity} Unit
                          </span>
                        </div>

                        <div className="flex items-center justify-between gap-1.5 flex-wrap pt-1.5 border-t border-slate-100">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap ${
                              eq.isReturned
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                eq.isReturned ? 'bg-emerald-500' : 'bg-amber-500'
                              }`}
                            />
                            {eq.isReturned ? 'Dikembalikan' : 'Sedang Digunakan'}
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">
                            {eq.isReturned ? 'Status: Kembali' : 'Status: Check-out'}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Sub-Col 3: Riwayat Persetujuan & Catatan */}
              <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-2xs flex flex-col gap-3 h-full min-w-0">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-[#003D58] shrink-0" />
                  <h3 className="text-[13px] font-bold text-[#0F172A] truncate">Riwayat Persetujuan &amp; Catatan</h3>
                </div>

                {!activity.approvalHistory || activity.approvalHistory.length === 0 ? (
                  <div className="flex-1 min-h-[150px] rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-center p-4 text-center">
                    <p className="text-xs text-slate-400 italic">Belum ada riwayat persetujuan</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 flex-1">
                    {activity.approvalHistory.map((item, idx) => (
                      <div
                        key={idx}
                        className="border border-slate-100 rounded-xl p-3 bg-slate-50/60 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-800 text-xs truncate">{item.stage}</span>
                          <StatusBadge status={item.status} />
                        </div>
                        <p className="text-[11px] text-slate-500 truncate">
                          <strong className="text-slate-700">{item.fullName}</strong> · {formatDateTime(item.date)}
                        </p>
                        {item.notes && (
                          <p className="text-[11px] text-slate-600 italic bg-white p-2.5 rounded-lg border border-slate-100 mt-1 leading-relaxed">
                            &quot;{item.notes}&quot;
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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
            className="w-full min-h-[70px] bg-white border border-[#E2E8F0] focus:border-red-500 focus:ring-1 focus:ring-red-400 rounded-[8px] p-3 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all resize-none"
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
            <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Pilih PIC Kegiatan *</label>
            <FilterDropdown
              value={selectedPicId ? String(selectedPicId) : ''}
              onChange={(val) => {
                const picId = Number(val);
                setSelectedPicId(picId);
                // Remove PIC from selected members if present
                setSelectedMemberIds((prev) => prev.filter((id) => id !== picId));
              }}
              options={humasUsers.map((u) => ({
                value: String(u.id),
                label: `${u.fullName} (@${u.username})`,
              }))}
              placeholder="Pilih PIC (Tim Humas)"
              icon={false}
              allowClear={false}
              className="w-full"
            />
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
                        className="w-4 h-4 accent-[#003D58] rounded cursor-pointer"
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



      {/* ── MODAL: EDIT KEGIATAN (SUPER ADMIN) ── */}
      <CustomModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Data Kegiatan"
        subtitle="Perbarui informasi judul, kategori, lokasi, jadwal, atau PIC kegiatan."
        maxWidth="2xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-5 text-[12px]">
          <div>
            <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Judul Kegiatan *</label>
            <input
              type="text"
              required
              value={editFormData.title}
              onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
              className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Kategori Kegiatan *</label>
            <input
              type="text"
              required
              value={editFormData.category}
              onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
              className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
            />
          </div>

          <CustomDatePicker
            label="Tanggal Pelaksanaan"
            required
            value={editFormData.date}
            onChange={(val) => setEditFormData({ ...editFormData, date: val })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomTimePicker
              label="Mulai (WIB)"
              required
              value={editFormData.startTime}
              onChange={(val) => setEditFormData({ ...editFormData, startTime: val })}
            />
            <CustomTimePicker
              label="Selesai (WIB)"
              value={editFormData.endTime}
              onChange={(val) => setEditFormData({ ...editFormData, endTime: val })}
            />
          </div>

          {/* Shopee-Style Location & GPS Pinpoint Picker */}
          <LocationPicker
            required
            location={editFormData.location}
            latitude={editFormData.latitude}
            longitude={editFormData.longitude}
            radius={editFormData.radius}
            onChange={(locData) => setEditFormData({ ...editFormData, ...locData })}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Personel PIC *</label>
              <FilterDropdown
                value={editFormData.picId ? String(editFormData.picId) : ''}
                onChange={(val) => {
                  const pid = Number(val);
                  setEditFormData({
                    ...editFormData,
                    picId: pid,
                    memberIds: editFormData.memberIds.filter((id) => id !== pid),
                  });
                }}
                options={humasUsers.map((u) => ({
                  value: String(u.id),
                  label: `${u.fullName} (@${u.username})`,
                }))}
                placeholder="Pilih PIC (Tim Humas)"
                icon={false}
                allowClear={false}
                className="w-full"
              />
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
                          className="w-4 h-4 accent-[#003D58] rounded cursor-pointer"
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
