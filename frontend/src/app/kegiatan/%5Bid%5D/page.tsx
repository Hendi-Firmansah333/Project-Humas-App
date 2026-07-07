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
  Users,
  Eye,
  Trash2,
  Upload,
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

  const loadData = async () => {
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

  useEffect(() => {
    loadData();
  }, [params.id]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    toast.success('Tautan detail kegiatan berhasil disalin!');
  };

  const handleMarkSelesai = async () => {
    if (!activity) return;
    try {
      await activityService.update(activity.id, { status: 'SELESAI' });
      toast.success(`Kegiatan "${activity.title}" ditandai SELESAI.`);
      await loadData();
    } catch {
      toast.error('Gagal mengubah status kegiatan.');
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
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500">
          Kegiatan tidak ditemukan.
        </div>
      </AdminLayout>
    );
  }

  // Calculate Progress Kehadiran
  const totalMembers = activity.members?.length ?? 0;
  const presentMembers = activity.members?.filter(
    (m) => m.checkInStatus === 'SUCCESS' || m.checkInStatus === 'TERLAMBAT'
  ).length ?? 0;
  const attendancePercentage = totalMembers > 0 ? Math.round((presentMembers / totalMembers) * 100) : 0;

  // Filter Photos & Videos
  const photos = (activity.media ?? [])
    .filter((m) => m.fileType.startsWith('image/'))
    .map((m) => ({ id: m.id, title: m.fileName, url: m.fileUrl }));

  const videos = (activity.media ?? [])
    .filter((m) => m.fileType.startsWith('video/'))
    .map((m) => ({
      id: m.id,
      title: m.fileName,
      size: m.fileSize ? `${(m.fileSize / (1024 * 1024)).toFixed(1)} MB` : '0 MB',
      url: m.fileUrl,
    }));

  // Google Drive Documentation Link
  const driveDoc = (activity.media ?? []).find((m) => m.fileType === 'application/link');

  // Timeline Events Builder
  const getTimelineEvents = () => {
    const events: { time: string; title: string; desc?: string; type: string }[] = [];

    // 1. Check in events
    (activity.members ?? []).forEach((m) => {
      if (m.checkInTime) {
        const isPic = m.userId === activity.picId;
        events.push({
          time: m.checkInTime,
          title: isPic ? 'PIC Check In' : `${m.user.fullName} Check In`,
          desc: m.checkInStatus === 'TERLAMBAT' ? 'Terlambat' : 'Tepat Waktu',
          type: 'checkin',
        });
      }
    });

    // 2. Documentation Upload
    (activity.media ?? []).forEach((med) => {
      if (med.fileType === 'application/link') {
        const uploadTime = new Date(med.createdAt).toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
        });
        events.push({
          time: uploadTime.replace(':', '.'),
          title: 'Upload Dokumentasi',
          desc: med.uploader?.fullName ? `Oleh: ${med.uploader.fullName}` : undefined,
          type: 'upload',
        });
      }
    });

    // 3. Mark Selesai
    if (activity.status === 'SELESAI') {
      const completionTime = new Date(activity.updatedAt).toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
      });
      events.push({
        time: completionTime.replace(':', '.'),
        title: 'Admin Tandai Selesai',
        desc: 'Kegiatan berhasil diselesaikan',
        type: 'complete',
      });
    }

    // Sort by time
    return events.sort((a, b) => a.time.localeCompare(b.time));
  };

  const timelineEvents = getTimelineEvents();

  return (
    <AdminLayout title="Detail Kegiatan Kehumasan">
      {/* Top Header & Action Buttons */}
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
          {activity.status !== 'SELESAI' && activity.status !== 'DIBATALKAN' && (
            <CustomButton
              variant="primary"
              size="sm"
              icon={CheckCircle2}
              onClick={handleMarkSelesai}
            >
              Tandai Selesai
            </CustomButton>
          )}
        </div>
      </div>

      {/* Row of KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[
          { icon: Calendar, color: 'text-teal-650 bg-teal-50', label: 'Tanggal Pelaksanaan', val: formatDateID(activity.date) },
          { icon: Clock, color: 'text-sky-600 bg-sky-50', label: 'Waktu Peliputan', val: `${activity.startTime} - ${activity.endTime} WIB` },
          { icon: MapPin, color: 'text-emerald-600 bg-emerald-50', label: 'Lokasi Kegiatan', val: activity.location },
          { icon: UserCheck, color: 'text-amber-600 bg-amber-50', label: 'PIC Bertugas', val: activity.pic?.fullName ?? '-' },
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex items-center gap-4">
              <div className={`w-12 h-12 rounded-2xl ${kpi.color} flex items-center justify-center shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{kpi.label}</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5 truncate" title={kpi.val}>{kpi.val}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Grid: Detail Content vs Media Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Span 2 Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Section 1: Deskripsi & Target Output */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <FileCheck className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-bold text-slate-800">Deskripsi & Tujuan Kegiatan</h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{activity.description}</p>
          </div>

          {/* Section 2: Kehadiran Tim */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Users className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-800">Kehadiran Tim</h3>
              </div>
              <span className="text-xs font-bold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-lg">
                Status Kehadiran
              </span>
            </div>

            {/* Progress Kehadiran */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                <span>Progress Kehadiran</span>
                <span>{presentMembers} / {totalMembers} Anggota ({attendancePercentage}%)</span>
              </div>
              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-teal-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${attendancePercentage}%` }}
                />
              </div>
            </div>

            {/* Tabel Anggota Kehadiran */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold">
                    <th className="py-2.5">Nama</th>
                    <th className="py-2.5">Status Check In</th>
                    <th className="py-2.5">Jam Check In</th>
                    <th className="py-2.5">Lokasi</th>
                    <th className="py-2.5">Foto Selfie</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {(activity.members ?? []).map((m) => {
                    // Find attendance record to get location coordinates
                    const att = activity.attendances?.find((a) => a.userId === m.userId);
                    const coordinates = att?.latitude ? `${att.latitude.toFixed(4)}, ${att.longitude?.toFixed(4)}` : '-';
                    const isPic = m.userId === activity.picId;

                    return (
                      <tr key={m.id} className="text-slate-700 font-medium">
                        <td className="py-3 flex items-center gap-2">
                          <UserAvatar src={m.user.avatar} name={m.user.fullName} size="sm" />
                          <div>
                            <p className="font-bold text-slate-800">{m.user.fullName}</p>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              {isPic ? 'PIC Lapangan' : 'Anggota Humas'}
                            </p>
                          </div>
                        </td>
                        <td className="py-3">
                          {(() => {
                            switch (m.checkInStatus) {
                              case 'SUCCESS':
                                return <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded text-[10px] font-bold">Tepat Waktu</span>;
                              case 'TERLAMBAT':
                                return <span className="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded text-[10px] font-bold">Terlambat</span>;
                              default:
                                return <span className="bg-slate-100 text-slate-450 px-2 py-0.5 rounded text-[10px] font-bold">Belum Check In</span>;
                            }
                          })()}
                        </td>
                        <td className="py-3 text-slate-600">{m.checkInTime || '-'}</td>
                        <td className="py-3 text-slate-600">{coordinates}</td>
                        <td className="py-3">
                          {m.selfieUrl ? (
                            <button
                              onClick={() => setSelectedPhoto(m.selfieUrl!)}
                              className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 hover:shadow-xs transition-shadow cursor-pointer block"
                            >
                              <img src={m.selfieUrl} alt="Selfie" className="w-full h-full object-cover" />
                            </button>
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Dokumentasi Tim */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Share2 className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-bold text-slate-800">Dokumentasi Google Drive</h3>
            </div>

            {driveDoc ? (
              <div className="p-4 rounded-xl bg-emerald-50/50 border border-emerald-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                <div className="space-y-1">
                  <p className="font-bold text-slate-800">Tautan Dokumentasi Resmi</p>
                  <p className="text-[11px] text-slate-500">
                    Diunggah oleh: <strong className="text-slate-700">{driveDoc.uploader?.fullName ?? 'Tim Humas'}</strong> •{' '}
                    {new Date(driveDoc.createdAt).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                  </p>
                  <a
                    href={driveDoc.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-teal-600 font-semibold hover:underline block truncate max-w-md"
                  >
                    {driveDoc.fileUrl}
                  </a>
                </div>
                <a
                  href={driveDoc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-teal-600 text-white font-bold hover:bg-teal-700 transition-colors shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                  Buka Link
                </a>
              </div>
            ) : (
              <div className="p-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-100 italic text-xs">
                Belum ada dokumentasi.
              </div>
            )}
          </div>

          {/* Section 4: Timeline */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <Clock className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-bold text-slate-800">Timeline Aktivitas</h3>
            </div>

            {timelineEvents.length > 0 ? (
              <div className="relative pl-6 border-l border-slate-200 space-y-6 ml-3 py-2 text-xs">
                {timelineEvents.map((evt, idx) => (
                  <div key={idx} className="relative">
                    {/* Bullet circle */}
                    <div className="absolute -left-[30px] top-0.5 w-4 h-4 rounded-full bg-white border-2 border-teal-600 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-teal-600" />
                    </div>
                    <div>
                      <span className="font-bold text-slate-400 tracking-wide block">{evt.time} WIB</span>
                      <p className="font-bold text-slate-800 text-sm mt-0.5">{evt.title}</p>
                      {evt.desc && <p className="text-slate-500 font-medium text-[11px] mt-0.5">{evt.desc}</p>}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400 italic text-xs">
                Belum ada aktivitas tercatat.
              </div>
            )}
          </div>
        </div>

        {/* Right Span 1 Sidebar Column: Gallery */}
        <div className="lg:col-span-1 space-y-6">
          {/* Section 5: Media Gallery */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <ImageIcon className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-800">Galeri Media</h3>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 font-bold px-2.5 py-0.5 rounded-full">
                {photos.length + videos.length} File
              </span>
            </div>

            {/* Photos */}
            {photos.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">📸 Galeri Foto</h4>
                <div className="grid grid-cols-2 gap-2.5">
                  {photos.filter((p) => isValidImageSrc(p.url)).map((p) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedPhoto(p.url)}
                      className="group relative aspect-video rounded-xl overflow-hidden border border-slate-200 cursor-pointer shadow-2xs hover:shadow-md transition-all"
                    >
                      <img
                        src={p.url}
                        alt={p.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Videos */}
            {videos.length > 0 && (
              <div className="space-y-2 pt-2">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">🎥 Arsip Video Liputan</h4>
                <div className="space-y-2">
                  {videos.map((vid) => (
                    <div
                      key={vid.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white transition-all text-xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Video className="w-4 h-4 text-teal-600 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 truncate" title={vid.title}>{vid.title}</p>
                          <p className="text-[10px] text-slate-400">{vid.size}</p>
                        </div>
                      </div>
                      <a
                        href={vid.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-white border border-slate-200 hover:bg-teal-50 hover:text-teal-600 text-slate-600 transition-colors cursor-pointer shrink-0"
                        title="Buka Berkas"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {photos.length === 0 && videos.length === 0 && (
              <p className="text-center text-slate-400 italic text-xs py-4">Belum ada file media diunggah.</p>
            )}
          </div>
        </div>
      </div>

      {/* Photo Preview Modal */}
      <CustomModal
        isOpen={!!selectedPhoto}
        onClose={() => setSelectedPhoto(null)}
        title="Pratinjau Foto"
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
