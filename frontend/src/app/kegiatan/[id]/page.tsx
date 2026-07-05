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

  useEffect(() => {
    const load = async () => {
      const id = Number(params.id);
      if (!id) return;
      setLoading(true);
      try {
        const data = await activityService.getById(id);
        setActivity(data);
      } catch {
        toast.error('Gagal memuat detail kegiatan.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params.id]);

  const detailActivity = activity
    ? {
        id: activity.id,
        title: activity.title,
        category: activity.category,
        date: activity.date,
        dateFormatted: formatDateID(activity.date),
        startTime: activity.startTime,
        endTime: activity.endTime,
        location: activity.location,
        status: activity.status,
        pic: { name: activity.pic?.fullName ?? '-', role: activity.pic?.roleLabel ?? '-', avatar: activity.pic?.avatar },
        description: activity.description,
        objectives: activity.description
          ? activity.description.split(/[.\n]/).map((s) => s.trim()).filter(Boolean).slice(0, 3)
          : [],
        assignedMembers: (activity.members ?? []).map((m) => ({
          id: m.user.id,
          name: m.user.fullName,
          role: m.role,
          avatar: m.user.avatar,
          status: m.checkInStatus === 'SUCCESS' ? 'ONLINE' : 'OFFLINE',
          task: m.role,
        })),
        attendance: (activity.members ?? [])
          .filter((m) => m.checkInTime)
          .map((m) => ({
            name: m.user.fullName,
            checkIn: m.checkInTime ?? '-',
            location: activity.location,
            status: m.checkInStatus === 'SUCCESS' ? 'VERIFIED' : 'PENDING',
          })),
        photos: (activity.media ?? [])
          .filter((m) => m.fileType.startsWith('image/'))
          .map((m) => ({
            id: m.id,
            title: m.fileName,
            url: m.fileUrl,
          })),
        videos: (activity.media ?? [])
          .filter((m) => m.fileType.startsWith('video/'))
          .map((m) => ({
            id: m.id,
            title: m.fileName,
            size: m.fileSize ? `${(m.fileSize / (1024 * 1024)).toFixed(1)} MB` : '0 MB',
            duration: '0:00',
            status: 'SELESAI',
          })),
        verification: {
          verifiedBy: activity.pic?.fullName ?? 'PIC Kegiatan',
          verifiedAt: formatDateID(activity.date),
          statusLabel: activity.status === 'SELESAI' ? 'Dokumentasi Lengkap & Disetujui' : 'Menunggu Verifikasi',
          note: 'Data kegiatan diambil langsung dari database terpusat HUMAS.',
        },
      }
    : null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Tautan detail kegiatan berhasil disalin!');
  };

  if (loading) {
    return (
      <AdminLayout title="Detail Kegiatan Kehumasan">
        <DashboardSkeleton />
      </AdminLayout>
    );
  }

  if (!detailActivity) {
    return (
      <AdminLayout title="Detail Kegiatan Kehumasan">
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
          Kegiatan tidak ditemukan.
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Detail Kegiatan Kehumasan">
      {/* Top Back Navigation & Actions Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/kegiatan"
            className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shrink-0"
            title="Kembali ke Daftar Kegiatan"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <span className="bg-teal-50 text-teal-700 font-bold px-2.5 py-0.5 rounded-md text-xs">
                {detailActivity.category}
              </span>
              <StatusBadge status={detailActivity.status} />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {detailActivity.title}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
          <CustomButton variant="outline" size="sm" icon={Share2} onClick={handleCopyLink}>
            Bagikan
          </CustomButton>
          <CustomButton
            variant="primary"
            size="sm"
            icon={Edit3}
            onClick={() => {
              toast.info('Membuka mode pengeditan kegiatan...');
              router.push('/kegiatan');
            }}
          >
            Edit Kegiatan
          </CustomButton>
        </div>
      </div>

      {/* Row 2: 4 Information KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">
            <Calendar className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Tanggal Pelaksanaan</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5">{detailActivity.dateFormatted}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center shrink-0">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Waktu Peliputan</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5">
              {detailActivity.startTime} - {detailActivity.endTime} WIB
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
            <MapPin className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Lokasi Kegiatan</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5 truncate max-w-[180px]" title={detailActivity.location}>
              {detailActivity.location}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <UserCheck className="w-6 h-6" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">PIC Bertugas</p>
            <p className="text-sm font-bold text-slate-800 mt-0.5 truncate">{detailActivity.pic.name}</p>
          </div>
        </div>
      </div>

      {/* Main 2-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (Span 2): Description, Documentation (Gallery & Video), Verification */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Description & Objectives */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <FileCheck className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-bold text-slate-800">Deskripsi & Tujuan Kegiatan</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{detailActivity.description}</p>

            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2.5">
                Target Output Peliputan
              </h4>
              <ul className="space-y-2">
                {detailActivity.objectives.map((obj, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700">
                    <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Section 2: Documentation (Gallery Photos & Video Recordings) */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-800">Dokumentasi Peliputan</h3>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 font-bold px-3 py-1 rounded-full">
                {(activity?.media ?? []).length} File Tersedia
              </span>
            </div>

            {/* Photo Gallery Grid */}
            {detailActivity.photos.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span>📸 Galeri Foto Resmi</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {detailActivity.photos.filter((photo) => isValidImageSrc(photo.url)).map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => setSelectedPhoto(photo.url)}
                      className="group relative rounded-xl overflow-hidden border border-slate-200 cursor-pointer shadow-2xs hover:shadow-md transition-all"
                    >
                      <img
                        src={photo.url}
                        alt={photo.title}
                        className="w-full h-36 object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-slate-900/80 via-slate-900/40 to-transparent p-2.5">
                        <p className="text-[11px] font-bold text-white truncate">{photo.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Video Recordings Archive */}
            {detailActivity.videos.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <span>🎥 Arsip Video Liputan</span>
                </h4>
                <div className="space-y-3">
                  {detailActivity.videos.map((vid) => (
                    <div
                      key={vid.id}
                      className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-2xs transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 font-bold">
                          <Video className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="text-xs sm:text-sm font-bold text-slate-800">{vid.title}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            Ukuran: {vid.size} • Durasi: {vid.duration}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => toast.success(`Mengunduh berkas ${vid.title}...`)}
                        className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-teal-50 hover:text-teal-600 text-slate-600 transition-colors cursor-pointer"
                        title="Unduh Berkas"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Google Drive Links Section */}
            <div className="pt-2">
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <span>🔗 Tautan Dokumentasi (Google Drive)</span>
              </h4>
              {(() => {
                const docLinks = (activity?.media ?? []).filter(
                  (m) => m.fileType === 'application/link',
                );
                if (docLinks.length === 0) {
                  return (
                    <p className="text-xs text-slate-400 italic">
                      Belum ada tautan Google Drive yang diunggah untuk kegiatan ini.
                    </p>
                  );
                }
                return (
                  <div className="space-y-3">
                    {docLinks.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-2xs transition-all text-xs"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center shrink-0 font-bold">
                            <Share2 className="w-5 h-5" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-slate-800 truncate">
                              Dokumentasi Drive ({doc.uploader?.fullName ?? 'Tim Lapangan'})
                            </p>
                            <a
                              href={doc.fileUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-teal-600 hover:underline truncate block text-[11px] mt-0.5"
                            >
                              {doc.fileUrl}
                            </a>
                          </div>
                        </div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg bg-white border border-slate-200 hover:bg-teal-50 hover:text-teal-600 text-slate-600 transition-colors shrink-0 cursor-pointer ml-2"
                          title="Buka Tautan"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Section 3: Official Verification Panel */}
          <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-teal-950 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <div className="absolute -right-10 -top-10 w-44 h-44 rounded-full bg-teal-500/10 blur-2xl pointer-events-none" />
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 border border-teal-300/30 flex items-center justify-center shrink-0 text-teal-300">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="bg-teal-400/20 text-teal-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider border border-teal-300/20">
                    {detailActivity.verification.statusLabel}
                  </span>
                </div>
                <h3 className="text-base font-bold text-white pt-1">Verifikasi Pimpinan Redaksi</h3>
                <p className="text-xs text-teal-100/90 leading-relaxed">
                  {detailActivity.verification.note}
                </p>
                <div className="pt-2 text-[11px] text-teal-200 flex flex-wrap items-center gap-3">
                  <span>Diverifikasi oleh: <strong className="text-white">{detailActivity.verification.verifiedBy}</strong></span>
                  <span>•</span>
                  <span>Waktu: <strong className="text-white">{detailActivity.verification.verifiedAt}</strong></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (Span 1): Assigned Members & Attendance Check-in */}
        <div className="lg:col-span-1 space-y-6">
          {/* Section 4: Assigned Members List */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-800">Personel Bertugas ({detailActivity.assignedMembers.length})</h3>
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>

            <div className="space-y-3.5">
              {detailActivity.assignedMembers.map((member) => (
                <div
                  key={member.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-start gap-3"
                >
                  <UserAvatar src={member.avatar} name={member.name} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs sm:text-sm text-slate-800 truncate">{member.name}</h4>
                      <span className="text-[10px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        Aktif
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-teal-600 mt-0.5">{member.role}</p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-snug">{member.task}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 5: Attendance / Check-in Logs */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <MapPinCheckInside className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-bold text-slate-800">Log Kehadiran & Check-in</h3>
            </div>

            <div className="space-y-3">
              {detailActivity.attendance.map((att, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 text-xs">
                  <div>
                    <p className="font-bold text-slate-800">{att.name}</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">📍 {att.location}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded-md text-[11px]">
                      {att.checkIn}
                    </span>
                    <p className="text-[10px] text-green-600 font-semibold mt-1 flex items-center justify-end gap-1">
                      <Check className="w-3 h-3" /> Terverifikasi
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Photo Preview Modal */}
      <CustomModal
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        title="Pratinjau Galeri Foto"
        maxWidth="2xl"
      >
        {isValidImageSrc(selectedPhoto) && (
          <div className="space-y-4">
            <img src={selectedPhoto} alt="Pratinjau" className="w-full max-h-[70vh] object-contain rounded-xl" />
            <div className="flex justify-end">
              <CustomButton variant="primary" onClick={() => setSelectedPhoto(null)}>
                Tutup
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>
    </AdminLayout>
  );
}
