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
  Image as ImageIcon,
  Video,
  Download,
  Share2,
  FileCheck,
  MapPinCheckInside,
  ShieldCheck,
  Check,
  ExternalLink,
  AlertCircle,
  Info,
  X,
  Lock,
  Camera,
  Play,
  FileSpreadsheet,
} from 'lucide-react';
import { toast } from 'sonner';
import { activityService } from '@/services';
import { Activity } from '@/types';
import { formatDateID, isValidImageSrc } from '@/utils/formatters';

export default function ActivityDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Auth states
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Validation modal state
  const [isValidationOpen, setIsValidationOpen] = useState(false);
  const [checkChecked, setCheckChecked] = useState(false);
  const [validationNotes, setValidationNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    const id = Number(params.id);
    if (!id) return;
    try {
      const data = await activityService.getById(id);
      setActivity(data);
    } catch {
      toast.error('Gagal memuat detail kegiatan.');
    }
  };

  useEffect(() => {
    // Check role from localStorage
    const userStr = localStorage.getItem('humass_user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setCurrentUser(u);
        setIsAdmin(u.role === 'ADMIN');
      } catch (e) {
        console.error('Error parsing user storage', e);
      }
    }

    const init = async () => {
      setLoading(true);
      await loadData();
      setLoading(false);
    };
    init();
  }, [params.id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Tautan detail kegiatan berhasil disalin!');
  };

  // Validation submit handler
  const handleValidateConfirm = async () => {
    if (!activity) return;
    if (!checkChecked) {
      toast.warning('Anda harus mencentang kotak pemeriksaan dokumentasi sebelum melakukan validasi.');
      return;
    }

    setIsSubmitting(true);
    try {
      await activityService.validate(activity.id, validationNotes);
      toast.success('Kegiatan berhasil divalidasi dan ditandai Selesai!');
      setIsValidationOpen(false);
      
      // Redirect to riwayat-kegiatan after validation
      router.push('/riwayat-kegiatan');
    } catch (error: any) {
      const errMsg = error.response?.data?.message || 'Gagal memvalidasi kegiatan.';
      toast.error(errMsg);
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

  // Checklist items
  const picMember = activity.members?.find((m) => m.userId === activity.picId);
  const isPicCheckedIn = !!picMember?.checkInTime;

  const regularMembers = activity.members?.filter((m) => m.userId !== activity.picId) || [];
  const allMembersCheckedIn = regularMembers.length === 0 ? true : regularMembers.every((m) => !!m.checkInTime);

  const driveMedia = (activity.media ?? []).filter((m) => m.fileType === 'application/link');
  const isDriveUploaded = driveMedia.length > 0;
  
  const isReadyForValidation = isPicCheckedIn && allMembersCheckedIn && isDriveUploaded;

  // Format date time helper
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return '-';
    const date = new Date(isoString);
    const dateStr = formatDateID(isoString);
    const timeStr = date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    return `${dateStr} pukul ${timeStr}`;
  };

  // Timeline check-in logs
  const checkInLogs = (activity.members ?? [])
    .filter((m) => m.checkInTime)
    .map((m) => {
      // Find corresponding attendance
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
      {/* Top Back Navigation & Actions Header */}
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
              <StatusBadge status={activity.status} />
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
          {activity.status !== 'SELESAI' && (
            <Link href="/kegiatan">
              <CustomButton variant="outline" size="sm" icon={Edit3}>
                Edit Kegiatan
              </CustomButton>
            </Link>
          )}
        </div>
      </div>

      {/* Row 2: Information Cards */}
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

      {/* Main 2-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Section 1: Progress Checklist (Only for Active Activities) */}
          {activity.status !== 'SELESAI' && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <FileCheck className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-800">Checklist Progress Validasi</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isPicCheckedIn ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                    {isPicCheckedIn ? <Check className="w-3.5 h-3.5 font-bold" /> : '1'}
                  </div>
                  <span className={`text-xs font-semibold ${isPicCheckedIn ? 'text-slate-850' : 'text-slate-400'}`}>PIC sudah Check-in</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${allMembersCheckedIn ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                    {allMembersCheckedIn ? <Check className="w-3.5 h-3.5 font-bold" /> : '2'}
                  </div>
                  <span className={`text-xs font-semibold ${allMembersCheckedIn ? 'text-slate-850' : 'text-slate-400'}`}>Semua anggota sudah Check-in</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isDriveUploaded ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                    {isDriveUploaded ? <Check className="w-3.5 h-3.5 font-bold" /> : '3'}
                  </div>
                  <span className={`text-xs font-semibold ${isDriveUploaded ? 'text-slate-850' : 'text-slate-400'}`}>Link Google Drive sudah diupload</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center ${isDriveUploaded ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                    {isDriveUploaded ? <Check className="w-3.5 h-3.5 font-bold" /> : '4'}
                  </div>
                  <span className={`text-xs font-semibold ${isDriveUploaded ? 'text-slate-850' : 'text-slate-400'}`}>Dokumentasi lengkap</span>
                </div>
              </div>

              {/* Status Validasi Admin Button */}
              {isAdmin && (
                <div className="pt-4 border-t border-slate-100">
                  {isReadyForValidation ? (
                    <div className="space-y-3">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-emerald-800">
                        <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Seluruh persyaratan telah terpenuhi!</p>
                          <p className="mt-0.5">Kegiatan siap divalidasi oleh Admin untuk dipindahkan ke Riwayat.</p>
                        </div>
                      </div>
                      <CustomButton
                        variant="primary"
                        onClick={() => setIsValidationOpen(true)}
                        className="w-full sm:w-auto"
                      >
                        Validasi Kegiatan
                      </CustomButton>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-800">
                        <AlertCircle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold">Belum dapat divalidasi.</p>
                          <p className="mt-0.5">Lengkapi seluruh persyaratan kegiatan di atas (Check-in Personel dan Google Drive dokumentasi) sebelum melakukan validasi.</p>
                        </div>
                      </div>
                      <button
                        disabled
                        className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 text-slate-400 border border-slate-200 rounded-xl text-xs font-bold cursor-not-allowed"
                      >
                        Validasi Kegiatan (Terkunci)
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Section 2: Bukti Kehadiran Tim */}
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
                // find attendance matching this member
                const att = activity.attendances?.find((a) => a.userId === m.userId);
                const hasGPS = att?.latitude != null && att?.longitude != null;

                return (
                  <div key={m.id} className="border border-slate-200 rounded-2xl p-4 flex gap-4 bg-slate-50/30 hover:bg-white hover:shadow-2xs transition-all">
                    {/* Selfie Box */}
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

                    {/* Details Box */}
                    <div className="flex-1 min-w-0 text-xs flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-1.5 justify-between">
                          <p className="font-bold text-slate-800 truncate">{m.user.fullName}</p>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded shrink-0 uppercase ${
                            hasCheckedIn ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-250'
                          }`}>
                            {hasCheckedIn ? 'Hadir' : 'Belum'}
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
                            {hasGPS && <span className="text-[9px] text-slate-400">({att?.latitude?.toFixed(4)}, {att?.longitude?.toFixed(4)})</span>}
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

          {/* Section 3: Dokumentasi Kegiatan */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Share2 className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-800">Dokumentasi Google Drive</h3>
              </div>
            </div>

            {(() => {
              const driveLinks = (activity.media ?? []).filter((m) => m.fileType === 'application/link');
              if (driveLinks.length === 0) {
                return (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center text-slate-400">
                    <Info className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-xs font-semibold">Belum ada dokumentasi.</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">PIC atau anggota pertama harus mengunggah link Google Drive dari aplikasi Android.</p>
                  </div>
                );
              }

              return (
                <div className="space-y-3">
                  {driveLinks.map((doc) => {
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
                              Link Drive Resmi
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
              );
            })()}
          </div>
          
          {/* Section 4: Verifikasi Penyelesaian */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-bold text-slate-800 font-sans uppercase tracking-wide">Verifikasi Penyelesaian</h3>
            </div>
            
            {activity.status === 'SELESAI' ? (
              <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-teal-950 text-white rounded-2xl p-5 shadow-xs flex gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-300/30 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5.5 h-5.5 text-teal-300" />
                </div>
                <div className="text-xs space-y-1 flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-black text-xs uppercase tracking-wider text-teal-200">Sudah Diverifikasi</span>
                    <span className="bg-teal-400/20 text-teal-200 text-[10px] font-bold px-2 py-0.5 rounded-full border border-teal-300/20 uppercase">Valid</span>
                  </div>
                  <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 font-medium text-teal-100/90">
                    <p>Diverifikasi oleh: <strong className="text-white">{activity.validatedBy?.fullName ?? 'Admin Humas'}</strong></p>
                    <p>Waktu Validasi: <strong className="text-white">{formatDateTime(activity.validatedAt)}</strong></p>
                  </div>
                  <p className="pt-2 text-[11px] text-teal-200 font-semibold border-t border-teal-100/10 mt-2">
                    Catatan Admin: <span className="text-white font-normal italic">"{activity.validationNotes}"</span>
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex gap-3 text-xs text-slate-600 font-medium">
                <AlertCircle className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-slate-800">Status: Belum Diverifikasi</p>
                  <p className="mt-0.5">Kegiatan ini masih aktif dan belum divalidasi oleh Administrator. Menunggu semua kru check-in dan PIC mengunggah bukti Google Drive.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (Span 1) */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Section 5: Personel Bertugas */}
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

          {/* Section 6: Log Kehadiran Timeline */}
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
                    {/* Circle Bullet */}
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

      {/* Validation Dialog popup modal */}
      <CustomModal
        isOpen={isValidationOpen}
        onClose={() => setIsValidationOpen(false)}
        title="Validasi Penyelesaian Kegiatan"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-800 flex items-start gap-2.5 font-medium leading-relaxed">
            <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-slate-900">Perhatian Sebelum Memvalidasi</p>
              <p className="mt-1">Pastikan seluruh dokumentasi kegiatan sudah benar. Setelah divalidasi, kegiatan akan dipindahkan secara permanen ke tab Riwayat Kegiatan.</p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block font-bold text-slate-700">Catatan Validasi (Opsional)</label>
            <textarea
              value={validationNotes}
              onChange={(e) => setValidationNotes(e.target.value)}
              placeholder="Masukkan catatan mengenai kelengkapan dokumentasi..."
              className="w-full border border-slate-200 rounded-xl p-3 h-20 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 text-xs font-medium"
            />
          </div>

          <div className="flex items-start gap-2.5 pt-2">
            <input
              type="checkbox"
              id="confirmCheck"
              checked={checkChecked}
              onChange={(e) => setCheckChecked(e.target.checked)}
              className="w-4 h-4 accent-teal-600 border border-slate-200 rounded shrink-0 mt-0.5 cursor-pointer"
            />
            <label htmlFor="confirmCheck" className="text-slate-600 select-none cursor-pointer font-bold leading-normal">
              Saya sudah memeriksa seluruh dokumentasi kegiatan.
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <CustomButton
              variant="outline"
              size="sm"
              onClick={() => {
                setIsValidationOpen(false);
                setCheckChecked(false);
              }}
              disabled={isSubmitting}
            >
              Batal
            </CustomButton>
            <CustomButton
              variant="primary"
              size="sm"
              onClick={handleValidateConfirm}
              disabled={!checkChecked || isSubmitting}
            >
              {isSubmitting ? 'Memproses...' : 'Validasi'}
            </CustomButton>
          </div>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
