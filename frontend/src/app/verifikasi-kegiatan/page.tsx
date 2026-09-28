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
  SearchBox,
  PaginationBar,
  UserAvatar,
} from '@/components/common';
import DashboardSkeleton from '@/components/common/DashboardSkeleton';
import {
  ClipboardCheck,
  Eye,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  Calendar,
  MapPin,
  Clock,
  UserCheck,
  FileText,
  FileCheck,
  Send,
  Camera,
  Video,
  Film,
  Globe,
  Share2,
  ImageIcon,
  Tag,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { activityService, contentService } from '@/services';
import { Activity, ContentPlan } from '@/types';
import { formatDateID } from '@/utils/formatters';
import { getStoredUser } from '@/utils/session';
import { contentPlanToItem, isValidImageSrc } from '@/utils/api-helpers';

interface ContentItem {
  id: number;
  title: string;
  platform: string;
  contentType: string;
  category?: string;
  deadline: string;
  time: string;
  picName: string;
  picRole: string;
  picAvatar?: string;
  status: string;
  caption?: string;
  mediaUrl?: string;
  videoUrl?: string;
  draftUrl?: string;
  revisionNote?: string;
  adminNotes?: string;
  submittedAt?: string;
}

export default function VerifikasiKelengkapanPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'kegiatan' | 'konten'>('kegiatan');

  // Tab 1: Kegiatan States
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [isDetailActivityOpen, setIsDetailActivityOpen] = useState(false);
  const [isReturnActivityOpen, setIsReturnActivityOpen] = useState(false);
  const [returnActivityNotes, setReturnActivityNotes] = useState('');

  // Tab 2: Content Plan States
  const [contentPlans, setContentPlans] = useState<ContentItem[]>([]);
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null);
  const [isDetailContentOpen, setIsDetailContentOpen] = useState(false);
  const [isReturnContentOpen, setIsReturnContentOpen] = useState(false);
  const [isVerifyContentOpen, setIsVerifyContentOpen] = useState(false);
  const [returnContentNotes, setReturnContentNotes] = useState('');
  const [verifyContentNotes, setVerifyContentNotes] = useState('');

  // Common UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const [resVerifAct, resContent] = await Promise.all([
        activityService.getAll({ status: 'MENUNGGU_VERIFIKASI' }).catch(() => ({ items: [] })),
        contentService.getAll({ page: 1, pageSize: 100 }).catch(() => ({ items: [] })),
      ]);

      // Hanya tampilkan kegiatan yang tim sudah submit (presensi + link dokumentasi)
      setActivities(resVerifAct.items || []);

      const mappedContents = (resContent.items || []).map((p: ContentPlan) => {
        return contentPlanToItem(p) as unknown as ContentItem;
      });
      // Hanya tampilkan content plan yang PIC sudah kirim untuk review
      const pendingReview = mappedContents.filter(
        (item: ContentItem) => item.status === 'MENUNGGU_VERIFIKASI_ADMIN' || item.status === 'MENUNGGU'
      );
      setContentPlans(pendingReview);
    } catch (err) {
      console.error(err);
      toast.error('Gagal memuat data verifikasi.');
    }
  };

  useEffect(() => {
    const user = getStoredUser();
    if (user?.role !== 'ADMIN' && user?.role !== 'SUPER_ADMIN') {
      toast.error('Akses ditolak. Halaman ini hanya untuk Admin Humas.');
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

  // ── KEGIATAN ACTIONS ──────────────────────────────────────────

  const handleVerifyActivityComplete = async (id: number) => {
    if (!confirm('Apakah Anda yakin kelengkapan dokumentasi kegiatan ini sudah lengkap dan sesuai?')) return;
    setIsSubmitting(true);
    try {
      await activityService.submitVerification(id, 'Verifikasi lengkap oleh Admin Humas');
      toast.success('Kegiatan telah diverifikasi dan diteruskan ke Kepala Humas untuk persetujuan akhir.');
      setIsDetailActivityOpen(false);
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal memverifikasi kegiatan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnActivityRevision = async () => {
    if (!selectedActivity) return;
    if (!returnActivityNotes.trim()) {
      toast.warning('Catatan perbaikan wajib diisi!');
      return;
    }
    setIsSubmitting(true);
    try {
      await activityService.returnRevision(selectedActivity.id, returnActivityNotes);
      toast.success('Kegiatan dikembalikan ke Tim Humas untuk perbaikan.');
      setIsReturnActivityOpen(false);
      setIsDetailActivityOpen(false);
      setReturnActivityNotes('');
      await loadData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Gagal mengembalikan kegiatan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── CONTENT PLAN ACTIONS ──────────────────────────────────────

  const handleVerifyContentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContent) return;
    setIsSubmitting(true);
    try {
      await contentService.verifyAdmin(selectedContent.id, verifyContentNotes);
      toast.success(`Content Plan "${selectedContent.title}" telah diverifikasi lengkap dan diajukan ke Kepala Humas!`);
      setIsVerifyContentOpen(false);
      setIsDetailContentOpen(false);
      setVerifyContentNotes('');
      await loadData();
    } catch {
      toast.error('Gagal mengajukan konten ke Kepala Humas.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReturnContentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContent) return;
    if (!returnContentNotes.trim()) {
      toast.warning('Catatan perbaikan wajib diisi!');
      return;
    }
    setIsSubmitting(true);
    try {
      await contentService.requestFix(selectedContent.id, returnContentNotes);
      toast.warning(`Permintaan perbaikan telah dikembalikan kepada PIC ${selectedContent.picName}.`);
      setIsReturnContentOpen(false);
      setIsDetailContentOpen(false);
      setReturnContentNotes('');
      await loadData();
    } catch {
      toast.error('Gagal mengirimkan catatan perbaikan.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <AdminLayout title="Verifikasi Kelengkapan">
        <DashboardSkeleton />
      </AdminLayout>
    );
  }

  // ── FILTERING & DATA PREPARATION ──────────────────────────────

  const filteredActivities = activities.filter((item) => {
    return (
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.pic?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  // Data sudah difilter hanya MENUNGGU_VERIFIKASI_ADMIN / MENUNGGU di loadData
  const pendingContentPlans = contentPlans;

  const waitingAdminContentCount = contentPlans.length;

  const filteredContents = pendingContentPlans.filter((item) => {
    return (
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.picName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.caption || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'INSTAGRAM':
        return (
          <span className="inline-flex items-center gap-1.5 bg-pink-50 text-pink-700 font-bold px-2 py-0.5 rounded text-[11px] border border-pink-200">
            <Camera className="w-3 h-3 text-pink-600" />
            <span>Instagram</span>
          </span>
        );
      case 'TIKTOK':
        return (
          <span className="inline-flex items-center gap-1.5 bg-slate-950 text-white font-bold px-2 py-0.5 rounded text-[11px] border border-slate-800">
            <Video className="w-3 h-3 text-white" />
            <span>TikTok</span>
          </span>
        );
      case 'YOUTUBE':
        return (
          <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-650 font-bold px-2 py-0.5 rounded text-[11px] border border-red-200">
            <Film className="w-3 h-3 text-red-600" />
            <span>YouTube</span>
          </span>
        );
      case 'WEBSITE':
        return (
          <span className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-750 font-bold px-2 py-0.5 rounded text-[11px] border border-sky-200">
            <Globe className="w-3 h-3" />
            <span>Website</span>
          </span>
        );
      case 'FACEBOOK':
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-750 font-bold px-2 py-0.5 rounded text-[11px] border border-blue-200">
            <Share2 className="w-3 h-3" />
            <span>Facebook</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-700 font-bold px-2 py-0.5 rounded text-[11px] border border-slate-200">
            <span>{platform}</span>
          </span>
        );
    }
  };

  const getWorkflowBadge = (item: ContentItem) => {
    switch (item.status) {
      case 'PUBLISHED':
        return <StatusBadge status="SUDAH_TAYANG" />;
      case 'SELESAI':
      case 'DISETUJUI':
        return <StatusBadge status="DISETUJUI" />;
      case 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS':
        return <StatusBadge status="MENUNGGU_PERSETUJUAN_KEPALA_HUMAS" />;
      case 'MENUNGGU_VERIFIKASI_ADMIN':
      case 'MENUNGGU':
        return <StatusBadge status="MENUNGGU_VERIFIKASI_ADMIN" />;
      case 'REVISI':
        return <StatusBadge status="PERLU_REVISI" />;
      case 'DALAM_PENGERJAAN':
        return <StatusBadge status="SEDANG_DIKERJAKAN" />;
      case 'DITUGASKAN':
      case 'PROSES':
      default:
        return <StatusBadge status="DITUGASKAN" />;
    }
  };

  // ── COLUMNS DEFINITION ────────────────────────────────────────

  const activityColumns: Column<Activity>[] = [
    {
      key: 'title',
      header: 'Judul Kegiatan',
      render: (item) => (
        <div className="max-w-xs">
          <p className="font-bold text-slate-800 leading-snug">{item.title}</p>
          <p className="text-[11px] text-slate-400 font-medium flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3" /> {item.location}
          </p>
        </div>
      ),
    },
    {
      key: 'pic',
      header: 'PIC Lapangan',
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
      key: 'members',
      header: 'Anggota',
      render: (item) => (
        <span className="text-slate-500 text-xs font-medium">
          {item.members?.length ? `${item.members.length} Orang` : '-'}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (item) => (
        <div className="flex items-center justify-center">
          <button
            onClick={() => {
              setSelectedActivity(item);
              setIsDetailActivityOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
            title="Lihat Detail & Verifikasi"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
      className: 'text-center w-20',
    },
  ];

  const contentColumns: Column<ContentItem>[] = [
    {
      key: 'title',
      header: 'Judul & Kategori Konten',
      render: (item) => (
        <div className="max-w-xs">
          <div className="flex items-center gap-1.5 mb-1 flex-wrap">
            <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded border border-teal-200">
              {item.contentType}
            </span>
            {item.category && (
              <span className="bg-amber-50 text-amber-700 text-[10px] font-medium px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1">
                <Tag className="w-2.5 h-2.5" />
                {item.category}
              </span>
            )}
          </div>
          <p className="font-bold text-slate-800 leading-snug">{item.title}</p>
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{item.caption || 'Tidak ada deskripsi caption.'}</p>
        </div>
      ),
    },
    {
      key: 'platform',
      header: 'Platform',
      render: (item) => getPlatformBadge(item.platform),
    },
    {
      key: 'deadline',
      header: 'Deadline Tayang',
      render: (item) => (
        <div className="text-xs whitespace-nowrap">
          <p className="font-semibold text-slate-700">{formatDateID(item.deadline)}</p>
          <p className="text-slate-400 text-[11px] mt-0.5">⏰ {item.time}</p>
        </div>
      ),
    },
    {
      key: 'pic',
      header: 'PIC Kreator',
      render: (item) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <UserAvatar src={item.picAvatar} name={item.picName} size="sm" />
          <div>
            <p className="font-medium text-slate-700 text-xs">{item.picName}</p>
            <p className="text-[10px] text-slate-400">{item.picRole || 'Tim Humas'}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => getWorkflowBadge(item),
    },
    {
      key: 'preview',
      header: 'Preview',
      render: (item) => (
        <button
          onClick={() => {
            setSelectedContent(item);
            setIsDetailContentOpen(true);
          }}
          className="group relative w-14 h-10 rounded-lg overflow-hidden border border-slate-200 shadow-2xs hover:border-teal-500 transition-all cursor-pointer mx-auto block"
          title="Lihat Visual Preview"
        >
          {isValidImageSrc(item.mediaUrl) ? (
            <img src={item.mediaUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
              <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Eye className="w-3.5 h-3.5 text-white" />
          </div>
        </button>
      ),
      className: 'text-center',
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (item) => (
        <div className="flex items-center justify-center">
          <button
            onClick={() => {
              setSelectedContent(item);
              setIsDetailContentOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors cursor-pointer"
            title="Lihat Detail & Verifikasi"
          >
            <Eye className="w-4 h-4" />
          </button>
        </div>
      ),
      className: 'text-center w-20',
    },
  ];

  const currentData = activeTab === 'kegiatan' ? filteredActivities : filteredContents;
  const totalPages = Math.ceil(currentData.length / itemsPerPage);
  const paginatedData = currentData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <AdminLayout title="Verifikasi Kelengkapan">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-200">
            <ClipboardCheck className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Pusat Verifikasi Kelengkapan</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Periksa kelengkapan dokumentasi kegiatan dan materi content plan dari tim sebelum diajukan untuk persetujuan Kepala Humas.
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex flex-wrap border-b border-slate-200 bg-white rounded-t-2xl p-2 px-4 gap-2 mt-4">
        <button
          onClick={() => {
            setActiveTab('kegiatan');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
            activeTab === 'kegiatan'
              ? 'bg-amber-50 border-amber-200 text-amber-800 shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          } cursor-pointer`}
        >
          <ClipboardCheck className="w-4 h-4" />
          Verifikasi Dokumentasi Kegiatan ({activities.length})
        </button>

        <button
          onClick={() => {
            setActiveTab('konten');
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${
            activeTab === 'konten'
              ? 'bg-amber-50 border-amber-200 text-amber-800 shadow-xs'
              : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
          } cursor-pointer`}
        >
          <FileText className="w-4 h-4" />
          Verifikasi Content Plan ({waitingAdminContentCount > 0 ? `${waitingAdminContentCount} Pending` : pendingContentPlans.length})
        </button>
      </div>

      {/* Controls & Search */}
      <div className="bg-white border-x border-slate-200 p-4 border-b">
        <SearchBox
          value={searchQuery}
          onChange={(val) => {
            setSearchQuery(val);
            setCurrentPage(1);
          }}
          placeholder={
            activeTab === 'kegiatan'
              ? 'Cari nama kegiatan, lokasi, atau PIC lapangan...'
              : 'Cari judul konten, caption, atau PIC kreator...'
          }
          className="w-full sm:w-80"
        />
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-b-2xl border-x border-b border-slate-200 shadow-xs overflow-hidden">
        {activeTab === 'kegiatan' ? (
          <DataTable
            columns={activityColumns}
            data={paginatedData as Activity[]}
            emptyMessage="Tidak ada kegiatan yang memerlukan verifikasi kelengkapan saat ini."
          />
        ) : (
          <DataTable
            columns={contentColumns}
            data={paginatedData as ContentItem[]}
            emptyMessage="Tidak ada content plan yang memerlukan verifikasi kelengkapan saat ini."
          />
        )}

        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages || 1}
          totalItems={currentData.length}
          onPageChange={setCurrentPage}
          itemName={activeTab === 'kegiatan' ? 'kegiatan' : 'konten'}
        />
      </div>

      {/* ── MODAL 1: Detail & Verifikasi Kegiatan ────────────────── */}
      <CustomModal
        isOpen={isDetailActivityOpen}
        onClose={() => setIsDetailActivityOpen(false)}
        title="Detail Verifikasi Kegiatan"
        subtitle={selectedActivity ? `ID: #${selectedActivity.id} • ${selectedActivity.title}` : ''}
        maxWidth="2xl"
      >
        {selectedActivity && (
          <div className="space-y-5">
            {/* Warning jika ada catatan perbaikan */}
            {selectedActivity.status === 'PERLU_PERBAIKAN' && (
              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900">
                <span className="font-bold block mb-1">Catatan Perbaikan Sebelumnya:</span>
                <p>{selectedActivity.notes || 'Harap lengkapi bukti dokumentasi yang sesuai.'}</p>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Tanggal & Waktu:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-teal-600" />
                  {formatDateID(selectedActivity.date.split('T')[0])} ({selectedActivity.startTime || '08:00'} - {selectedActivity.endTime || 'Selesai'})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Lokasi Kegiatan:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-600" />
                  {selectedActivity.location}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">PIC Lapangan:</span>
                <span className="font-semibold text-slate-800 flex items-center gap-1">
                  <UserCheck className="w-3.5 h-3.5 text-sky-600" />
                  {selectedActivity.pic?.fullName || '-'} ({selectedActivity.pic?.phone || 'No Phone'})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Status Saat Ini:</span>
                <StatusBadge status={selectedActivity.status} />
              </div>
            </div>

            {/* Presensi & Bukti Kehadiran */}
            <div>
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Presensi & Kehadiran Anggota Tim</h5>
              {selectedActivity.attendances && selectedActivity.attendances.length > 0 ? (
                <div className="space-y-2">
                  {selectedActivity.attendances.map((att: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl text-xs">
                      <div>
                        <p className="font-semibold text-slate-800">{att.user?.fullName || `Anggota #${att.userId}`}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          Check-in: {att.checkInTime ? new Date(att.checkInTime).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-'} WIB
                        </p>
                      </div>
                      <span className="bg-teal-50 text-teal-700 font-bold px-2 py-0.5 rounded text-[10px] border border-teal-200">
                        {att.status || 'HADIR'}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 italic">
                  Belum ada rekaman presensi mandiri tercatat di sistem.
                </div>
              )}
            </div>

            {/* Link Dokumentasi Google Drive */}
            <div>
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Tautan Dokumentasi (Google Drive)</h5>
              {selectedActivity.documentationUrl ? (
                <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200 flex items-center justify-between">
                  <span className="text-xs text-sky-800 font-semibold truncate max-w-sm">
                    {selectedActivity.documentationUrl}
                  </span>
                  <a
                    href={selectedActivity.documentationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-sky-600 text-white rounded-lg text-xs font-bold hover:bg-sky-700 transition-colors shrink-0"
                  >
                    Buka Drive <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-800 font-semibold">
                  ⚠️ Tim belum mengunggah link folder dokumentasi Google Drive!
                </div>
              )}
            </div>

            {/* Status Pengembalian Peralatan */}
            <div>
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                Status Pengembalian Peralatan
              </h5>
              {(() => {
                const loans = selectedActivity.loans ?? [];
                const items = loans.flatMap((l: any) =>
                  (l.items ?? []).map((it: any) => ({
                    ...it,
                    loanStatus: l.status,
                    isReturned: it.returnedQuantity >= it.quantity || l.status === 'SELESAI',
                  }))
                );

                if (items.length === 0) {
                  return (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Tidak menggunakan peralatan (Syarat alat otomatis terpenuhi).</span>
                    </div>
                  );
                }

                const allReturned = items.every((it: any) => it.isReturned);

                return (
                  <div className="space-y-2">
                    <div
                      className={`p-2.5 rounded-xl border text-xs font-medium flex items-center justify-between ${
                        allReturned
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-amber-50 border-amber-200 text-amber-800'
                      }`}
                    >
                      <span className="flex items-center gap-1.5">
                        {allReturned ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <ShieldCheck className="w-4 h-4 text-amber-600" />
                        )}
                        {allReturned
                          ? 'Seluruh peralatan telah dikembalikan & diverifikasi Admin.'
                          : 'Terdapat peralatan yang belum selesai proses pengembaliannya.'}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      {items.map((it: any) => (
                        <div
                          key={it.id}
                          className="flex items-center justify-between p-2.5 bg-white border border-slate-200 rounded-xl text-xs"
                        >
                          <div>
                            <p className="font-semibold text-slate-800">
                              {it.equipment?.name || 'Alat'} ({it.equipment?.code || '-'})
                            </p>
                            <p className="text-[10px] text-slate-400">
                              Jumlah: {it.quantity} Unit {it.returnCondition ? `• Kondisi: ${it.returnCondition}` : ''}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              it.isReturned
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {it.isReturned ? 'Sudah Kembali' : 'Belum Kembali'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            {/* Action Buttons */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
              <CustomButton variant="outline" size="sm" onClick={() => setIsDetailActivityOpen(false)}>
                Tutup
              </CustomButton>
              <CustomButton
                variant="secondary"
                size="sm"
                icon={RotateCcw}
                onClick={() => {
                  setReturnActivityNotes(selectedActivity.notes || '');
                  setIsReturnActivityOpen(true);
                }}
                disabled={isSubmitting}
              >
                Kembalikan untuk Perbaikan
              </CustomButton>
              <CustomButton
                variant="primary"
                size="sm"
                icon={Send}
                onClick={() => handleVerifyActivityComplete(selectedActivity.id)}
                disabled={isSubmitting || !selectedActivity.documentationUrl}
              >
                Verifikasi Lengkap & Ajukan ke Kepala Humas
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>

      {/* ── MODAL 1B: Form Catatan Perbaikan Kegiatan ─────────────── */}
      <CustomModal
        isOpen={isReturnActivityOpen}
        onClose={() => setIsReturnActivityOpen(false)}
        title="Kembalikan Kegiatan untuk Perbaikan"
        subtitle="Berikan instruksi hal-hal yang perlu dilengkapi oleh PIC/Tim."
        maxWidth="md"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan Instruksi Perbaikan *
            </label>
            <textarea
              rows={4}
              value={returnActivityNotes}
              onChange={(e) => setReturnActivityNotes(e.target.value)}
              placeholder="Contoh: Foto dokumentasi sambutan direktur belum ada di Drive, tolong dilengkapi..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
            />
          </div>
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <CustomButton variant="outline" size="sm" onClick={() => setIsReturnActivityOpen(false)}>
              Batal
            </CustomButton>
            <CustomButton
              variant="primary"
              size="sm"
              onClick={handleReturnActivityRevision}
              disabled={isSubmitting}
            >
              Kirim ke Tim Humas
            </CustomButton>
          </div>
        </div>
      </CustomModal>

      {/* ── MODAL 2: Detail & Verifikasi Content Plan ─────────────── */}
      <CustomModal
        isOpen={isDetailContentOpen}
        onClose={() => setIsDetailContentOpen(false)}
        title="Detail Verifikasi Content Plan"
        subtitle={selectedContent ? `ID: #${selectedContent.id} • ${selectedContent.title}` : ''}
        maxWidth="2xl"
      >
        {selectedContent && (
          <div className="space-y-5">
            {/* Banner info verifikasi */}
            <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
              <FileCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-amber-800">Verifikasi Kelengkapan Content Plan</p>
                <p className="text-amber-700 mt-0.5 leading-relaxed">
                  Periksa visual preview, link hasil karya di Google Drive, dan caption di bawah. Jika sudah sesuai, klik tombol <strong>"Verifikasi Lengkap"</strong> untuk mengajukan ke Kepala Humas.
                </p>
              </div>
            </div>

            {/* Alert jika ada catatan revisi */}
            {selectedContent.revisionNote && (
              <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900">
                <span className="font-bold block mb-1">Catatan Revisi / Perbaikan Sebelumnya:</span>
                <p>{selectedContent.revisionNote}</p>
              </div>
            )}

            {/* Metadata Ringkas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Platform & Format:</span>
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  {selectedContent.platform} • {selectedContent.contentType}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Jadwal & Deadline Tayang:</span>
                <span className="font-semibold text-slate-800">
                  {formatDateID(selectedContent.deadline)} ({selectedContent.time})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">PIC Kreator:</span>
                <span className="font-semibold text-slate-800">
                  {selectedContent.picName} ({selectedContent.picRole || 'Tim Humas'})
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Status Saat Ini:</span>
                {getWorkflowBadge(selectedContent)}
              </div>
            </div>

            {/* Link Google Drive */}
            <div>
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Link Hasil Konten (Google Drive)</h5>
              {selectedContent.videoUrl ? (
                <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200 flex items-center justify-between">
                  <span className="text-xs text-sky-800 font-semibold truncate max-w-sm">
                    {selectedContent.videoUrl}
                  </span>
                  <a
                    href={selectedContent.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-3 py-1 bg-sky-600 text-white rounded-lg text-xs font-bold hover:bg-sky-700 transition-colors shrink-0"
                  >
                    Buka Drive <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-500 italic">
                  Belum ada link hasil konten / Google Drive diunggah oleh PIC.
                </div>
              )}
            </div>

            {/* Visual / Thumbnail Preview */}
            <div>
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Visual / Thumbnail Preview</h5>
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 max-h-[260px] flex items-center justify-center min-h-[140px]">
                {isValidImageSrc(selectedContent.mediaUrl) ? (
                  <img src={selectedContent.mediaUrl} alt={selectedContent.title} className="w-full max-h-[260px] object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-slate-400 py-6 px-4 text-center">
                    <ImageIcon className="w-8 h-8" />
                    <p className="text-xs">Belum ada file preview visual diunggah.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Caption & Copywriting */}
            <div>
              <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Caption & Copywriting</h5>
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap">
                {selectedContent.caption || 'Caption belum dilengkapi oleh PIC Kreator.'}
              </div>
            </div>

            {/* Validasi Kelengkapan Konten */}
            {(() => {
              const isContentComplete = Boolean(
                selectedContent.videoUrl &&
                selectedContent.videoUrl.trim() !== '' &&
                selectedContent.caption &&
                selectedContent.caption.trim() !== ''
              );

              return (
                <>
                  {!isContentComplete && (
                    <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900 flex items-start gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-rose-800">Materi Konten Belum Lengkap</p>
                        <p className="text-rose-700 mt-0.5 leading-relaxed">
                          Konten ini belum dapat diverifikasi / diajukan karena{' '}
                          <strong>
                            {!selectedContent.videoUrl?.trim() ? 'Link Google Drive' : ''}
                            {!selectedContent.videoUrl?.trim() && !selectedContent.caption?.trim() ? ' dan ' : ''}
                            {!selectedContent.caption?.trim() ? 'Caption & Copywriting' : ''}
                          </strong>{' '}
                          belum dilengkapi oleh PIC. Silakan klik <strong>"Kembalikan untuk Perbaikan"</strong> untuk menginstruksikan PIC.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                    <CustomButton variant="outline" size="sm" onClick={() => setIsDetailContentOpen(false)}>
                      Tutup
                    </CustomButton>
                    <CustomButton
                      variant="secondary"
                      size="sm"
                      icon={RotateCcw}
                      onClick={() => {
                        setReturnContentNotes(selectedContent.revisionNote || '');
                        setIsReturnContentOpen(true);
                      }}
                      disabled={isSubmitting}
                    >
                      Kembalikan untuk Perbaikan
                    </CustomButton>
                    <CustomButton
                      variant="primary"
                      size="sm"
                      icon={Send}
                      onClick={() => {
                        setVerifyContentNotes(selectedContent.adminNotes || '');
                        setIsVerifyContentOpen(true);
                      }}
                      disabled={isSubmitting || !isContentComplete}
                    >
                      Verifikasi Lengkap
                    </CustomButton>
                  </div>
                </>
              );
            })()}
          </div>
        )}
      </CustomModal>

      {/* ── MODAL 2B: Konfirmasi Verifikasi Content Plan ───────────── */}
      <CustomModal
        isOpen={isVerifyContentOpen}
        onClose={() => setIsVerifyContentOpen(false)}
        title="Verifikasi Lengkap & Ajukan ke Kepala Humas"
        subtitle={selectedContent ? `Konten: "${selectedContent.title}"` : ''}
        maxWidth="md"
      >
        <form onSubmit={handleVerifyContentSubmit} className="space-y-4">
          <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 leading-relaxed">
            <p className="font-bold mb-1">Konfirmasi Verifikasi Kelengkapan</p>
            <p>
              Dengan memverifikasi konten ini, status akan diteruskan ke <strong>Kepala Humas</strong> untuk persetujuan akhir sebelum dipublikasikan.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan Verifikasi Admin (Opsional)
            </label>
            <textarea
              rows={3}
              value={verifyContentNotes}
              onChange={(e) => setVerifyContentNotes(e.target.value)}
              placeholder="Contoh: Format video dan copywriting sudah sesuai brief dan siap ditayangkan..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <CustomButton variant="outline" size="sm" onClick={() => setIsVerifyContentOpen(false)}>
              Batal
            </CustomButton>
            <CustomButton variant="primary" size="sm" icon={Send} type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Mengajukan...' : 'Ajukan ke Kepala Humas'}
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* ── MODAL 2C: Catatan Perbaikan Content Plan ───────────────── */}
      <CustomModal
        isOpen={isReturnContentOpen}
        onClose={() => setIsReturnContentOpen(false)}
        title="Kembalikan Konten untuk Perbaikan"
        subtitle={selectedContent ? `PIC: ${selectedContent.picName}` : ''}
        maxWidth="md"
      >
        <form onSubmit={handleReturnContentSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan Instruksi Perbaikan *
            </label>
            <textarea
              rows={4}
              value={returnContentNotes}
              onChange={(e) => setReturnContentNotes(e.target.value)}
              placeholder="Tuliskan bagian yang perlu diperbaiki oleh PIC (misal: penulisan hashtag, resolusi thumbnail, dll)..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all"
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <CustomButton variant="outline" size="sm" onClick={() => setIsReturnContentOpen(false)}>
              Batal
            </CustomButton>
            <CustomButton variant="secondary" size="sm" icon={RotateCcw} type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Mengirimkan...' : 'Kembalikan ke PIC'}
            </CustomButton>
          </div>
        </form>
      </CustomModal>
    </AdminLayout>
  );
}
