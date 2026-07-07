'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  DataTable,
  Column,
  StatusBadge,
  SearchBox,
  FilterDropdown,
  CustomButton,
  CustomModal,
  PaginationBar,
  UserAvatar,
} from '@/components/common';
import DashboardSkeleton from '@/components/common/DashboardSkeleton';
import {
  Plus,
  Eye,
  CheckCircle2,
  RotateCcw,
  XCircle,
  Camera,
  Video,
  Globe,
  Film,
  Image as ImageIcon,
  Calendar,
  Clock,
  FileText,
  Trash2,
  AlertTriangle,
  Edit3,
  Share2,
  ExternalLink,
} from 'lucide-react';
import { formatDateID, isValidImageSrc } from '@/utils/formatters';
import { toast } from 'sonner';
import { contentService, userService } from '@/services';
import { contentPlanToItem } from '@/utils/api-helpers';
import { User } from '@/types';

interface ContentItem {
  id: number;
  title: string;
  platform: 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE' | 'WEBSITE' | 'FACEBOOK';
  contentType: string;
  deadline: string;
  time: string;
  picName: string;
  picRole: string;
  picAvatar?: string;
  status: 'DRAFT' | 'MENUNGGU' | 'PROSES' | 'REVISI' | 'PUBLISHED' | 'SELESAI' | 'DIBATALKAN';
  caption: string;
  mediaUrl?: string;
  videoUrl?: string;
  mediaType: 'image' | 'video';
  revisionNote?: string;
  media?: any[];
}

const JENIS_KONTEN_OPTIONS = [
  'Foto',
  'Video',
  'Reels',
  'Carousel',
  'Story',
  'TikTok',
  'YouTube',
  'Poster',
  'Infografis',
  'Artikel Website',
  'Berita',
  'Press Release',
  'Live Streaming',
  'Podcast',
];

const PLATFORM_OPTIONS = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'FACEBOOK', label: 'Facebook' },
];

export default function ContentPlanPage() {
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modals state
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [revisionText, setRevisionText] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    platform: 'INSTAGRAM' as ContentItem['platform'],
    contentType: 'Foto',
    deadline: new Date().toISOString().split('T')[0],
    time: '16:00',
    picId: 0,
    caption: '',
    status: 'DRAFT' as ContentItem['status'],
  });

  const picOptions = users.filter((u) => u.role === 'USER');

  const loadContents = async () => {
    setLoading(true);
    try {
      const result = await contentService.getAll({ page: 1, pageSize: 100 });
      const items = (result.items ?? []).map((p) => contentPlanToItem(p) as unknown as ContentItem);
      setContents(items);
    } catch {
      toast.error('Gagal memuat data content plan dari server.');
      setContents([]);
    } finally {
      setLoading(false);
    }
  };

  const resolvePicId = () => {
    if (formData.picId) return formData.picId;
    return picOptions[0]?.id || 1;
  };

  useEffect(() => {
    const init = async () => {
      try {
        const staff = await userService.getAll();
        const userList = Array.isArray(staff) ? staff : [];
        setUsers(userList);
        const activeUsers = userList.filter((u) => u.role === 'USER');
        if (activeUsers.length > 0) {
          setFormData((prev) => ({ ...prev, picId: activeUsers[0].id }));
        }
      } catch {
        setUsers([]);
      }
      await loadContents();
    };
    init();
  }, []);

  const filteredContents = contents.filter((item) => {
    const matchSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.picName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.caption.toLowerCase().includes(searchQuery.toLowerCase());
    const matchPlat = platformFilter ? item.platform === platformFilter : true;
    const matchStat = statusFilter ? item.status === statusFilter : true;
    return matchSearch && matchPlat && matchStat;
  });

  const totalPages = Math.ceil(filteredContents.length / itemsPerPage);
  const paginatedContents = filteredContents.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleApprove = async (item: ContentItem) => {
    try {
      await contentService.update(item.id, { status: 'PUBLISHED' });
      setIsViewerOpen(false);
      toast.success(`Konten "${item.title}" berhasil disetujui & dipublikasikan!`);
      await loadContents();
    } catch {
      toast.error('Gagal menyetujui konten.');
    }
  };

  const handleReject = async (item: ContentItem) => {
    try {
      await contentService.update(item.id, { status: 'DIBATALKAN' });
      setIsViewerOpen(false);
      toast.error(`Konten "${item.title}" dibatalkan.`);
      await loadContents();
    } catch {
      toast.error('Gagal membatalkan konten.');
    }
  };

  const handleOpenRevision = (item: ContentItem) => {
    setSelectedItem(item);
    setRevisionText(item.revisionNote || '');
    setIsRevisionOpen(true);
  };

  const handleOpenDelete = (item: ContentItem) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;
    try {
      await contentService.remove(selectedItem.id);
      setIsDeleteOpen(false);
      toast.success(`Content Plan "${selectedItem.title}" berhasil dihapus.`);
      await loadContents();
    } catch {
      toast.error('Gagal menghapus content plan.');
    }
  };

  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (!revisionText.trim()) {
      toast.error('Harap tuliskan catatan revisi untuk kreator.');
      return;
    }

    try {
      await contentService.update(selectedItem.id, {
        status: 'REVISI',
        revisionNote: revisionText,
      });
      setIsRevisionOpen(false);
      setIsViewerOpen(false);
      toast.info(`Permintaan revisi dikirimkan kepada ${selectedItem.picName}.`);
      await loadContents();
    } catch {
      toast.error('Gagal mengirim permintaan revisi.');
    }
  };

  const handleOpenEdit = (item: ContentItem) => {
    setSelectedItem(item);
    
    const rawTime = (item.time || '16:00').replace(' WIB', '');
    const rawDate = item.deadline ? new Date(item.deadline).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const matchingUser = users.find((u) => u.fullName === item.picName);

    setFormData({
      title: item.title,
      platform: item.platform,
      contentType: item.contentType,
      deadline: rawDate,
      time: rawTime,
      picId: matchingUser?.id || picOptions[0]?.id || 0,
      caption: item.caption,
      status: item.status,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    const deadlineDate = new Date(formData.deadline);
    const timeMatch = formData.time.match(/(\d{2}):(\d{2})/);
    if (timeMatch) {
      deadlineDate.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), 0, 0);
    }
    const deadlineIso = deadlineDate.toISOString();

    try {
      await contentService.update(selectedItem.id, {
        title: formData.title,
        platform: formData.platform as any,
        contentType: formData.contentType,
        picId: formData.picId || resolvePicId(),
        deadline: deadlineIso,
        status: formData.status as any,
        description: formData.caption,
      });
      setIsEditOpen(false);
      toast.success('Content plan berhasil diperbarui!');
      await loadContents();
    } catch {
      toast.error('Gagal memperbarui content plan.');
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error('Harap lengkapi judul konten!');
      return;
    }

    const deadlineDate = new Date(formData.deadline);
    const timeMatch = formData.time.match(/(\d{2}):(\d{2})/);
    if (timeMatch) {
      deadlineDate.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), 0, 0);
    }
    const deadlineIso = deadlineDate.toISOString();

    try {
      await contentService.create({
        title: formData.title,
        platform: formData.platform as any,
        contentType: formData.contentType,
        picId: formData.picId || resolvePicId(),
        deadline: deadlineIso,
        status: 'DRAFT',
        description: formData.caption || 'Draft caption belum dilengkapi.',
      });
      setIsCreateOpen(false);
      toast.success('Rencana konten baru berhasil ditambahkan sebagai Draft!');
      await loadContents();
    } catch {
      toast.error('Gagal menyimpan content plan ke server.');
    }
  };

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case 'INSTAGRAM':
        return (
          <span className="inline-flex items-center gap-1.5 bg-pink-50 text-pink-700 font-bold px-2.5 py-1 rounded-lg text-xs border border-pink-200">
            <Camera className="w-3.5 h-3.5 text-pink-600" />
            <span>Instagram</span>
          </span>
        );
      case 'TIKTOK':
        return (
          <span className="inline-flex items-center gap-1.5 bg-slate-950 text-white font-bold px-2.5 py-1 rounded-lg text-xs border border-slate-800">
            <Video className="w-3.5 h-3.5 text-white" />
            <span>TikTok</span>
          </span>
        );
      case 'YOUTUBE':
        return (
          <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-650 font-bold px-2.5 py-1 rounded-lg text-xs border border-red-200">
            <Film className="w-3.5 h-3.5 text-red-600" />
            <span>YouTube</span>
          </span>
        );
      case 'WEBSITE':
        return (
          <span className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-750 font-bold px-2.5 py-1 rounded-lg text-xs border border-sky-200">
            <Globe className="w-3.5 h-3.5" />
            <span>Website</span>
          </span>
        );
      case 'FACEBOOK':
        return (
          <span className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-750 font-bold px-2.5 py-1 rounded-lg text-xs border border-blue-200">
            <Share2 className="w-3.5 h-3.5" />
            <span>Facebook</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-700 font-bold px-2.5 py-1 rounded-lg text-xs border border-slate-200">
            <span>{platform}</span>
          </span>
        );
    }
  };

  const columns: Column<ContentItem>[] = [
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
      key: 'title',
      header: 'Judul Konten & Jenis',
      render: (item) => (
        <div className="max-w-xs">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="bg-teal-50 text-teal-700 text-[10px] font-bold px-2 py-0.5 rounded border border-teal-200">
              {item.contentType}
            </span>
          </div>
          <p className="font-bold text-slate-800 leading-snug">{item.title}</p>
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{item.caption}</p>
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
            <p className="text-[10px] text-slate-400">{item.picRole}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'preview',
      header: 'Preview',
      render: (item) => (
        <button
          onClick={() => {
            setSelectedItem(item);
            setIsViewerOpen(true);
          }}
          className="group relative w-16 h-11 rounded-lg overflow-hidden border border-slate-200 shadow-2xs hover:border-teal-500 transition-all cursor-pointer"
          title="Lihat Media Viewer"
        >
          {isValidImageSrc(item.mediaUrl) ? (
            <img src={item.mediaUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
          ) : (
            <div className="w-full h-full bg-slate-100 flex items-center justify-center">
              <ImageIcon className="w-4 h-4 text-slate-400" />
            </div>
          )}
          <div className="absolute inset-0 bg-slate-900/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Eye className="w-4 h-4 text-white" />
          </div>
        </button>
      ),
      className: 'text-center',
    },
    {
      key: 'actions',
      header: 'Aksi & Verifikasi',
      render: (item) => (
        <div className="flex items-center justify-center gap-1">
          <button
            onClick={() => {
              setSelectedItem(item);
              setIsViewerOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
            title="Lihat Detail & Verifikasi"
          >
            <Eye className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => handleOpenEdit(item)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
            title="Edit Konten"
          >
            <Edit3 className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => handleOpenDelete(item)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
            title="Hapus Permanen"
          >
            <Trash2 className="w-4.5 h-4.5" />
          </button>
        </div>
      ),
      className: 'text-center w-36',
    },
  ];

  if (loading) {
    return (
      <AdminLayout title="Perencanaan & Publikasi Konten">
        <DashboardSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Perencanaan & Publikasi Konten">
      {/* Header Banner & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Daftar Content Plan Aktif</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola jadwal tayang, draft visual, dan berikan verifikasi (Approve/Revisi/Cancel) untuk konten sosial media.
            </p>
          </div>
          <CustomButton variant="primary" icon={Plus} onClick={() => setIsCreateOpen(true)}>
            Tambah Content Plan
          </CustomButton>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <SearchBox
            value={searchQuery}
            onChange={(val) => {
              setSearchQuery(val);
              setCurrentPage(1);
            }}
            placeholder="Cari judul konten, caption, atau PIC..."
            className="w-full sm:w-80"
          />
          <div className="flex flex-wrap items-center gap-2.5">
            <FilterDropdown
              options={[
                { value: 'INSTAGRAM', label: 'Instagram' },
                { value: 'TIKTOK', label: 'TikTok' },
                { value: 'YOUTUBE', label: 'YouTube' },
                { value: 'WEBSITE', label: 'Website' },
                { value: 'FACEBOOK', label: 'Facebook' },
              ]}
              value={platformFilter}
              onChange={(val) => {
                setPlatformFilter(val);
                setCurrentPage(1);
              }}
              placeholder="Semua Platform"
            />
            <FilterDropdown
              options={[
                { value: 'DRAFT', label: 'Draft' },
                { value: 'MENUNGGU', label: 'Menunggu Review' },
                { value: 'PROSES', label: 'Dalam Proses' },
                { value: 'REVISI', label: 'Perlu Revisi' },
              ]}
              value={statusFilter}
              onChange={(val) => {
                setStatusFilter(val);
                setCurrentPage(1);
              }}
              placeholder="Semua Status"
            />
          </div>
        </div>
      </div>

      {/* Main Content Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <DataTable columns={columns} data={paginatedContents} emptyMessage="Tidak ada content plan aktif." />
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages || 1}
          totalItems={filteredContents.length}
          onPageChange={setCurrentPage}
          itemName="konten"
        />
      </div>

      {/* Media Viewer & Detail Modal */}
      <CustomModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        title="Detail & Verifikasi Rencana Konten"
        subtitle={selectedItem ? `ID Konten: #${selectedItem.id}` : ''}
        maxWidth="2xl"
      >
        {selectedItem && (() => {
          // Progress calculation
          const getProgress = (status: string) => {
            switch (status) {
              case 'DRAFT': return { val: 10, label: 'Draft Awal' };
              case 'PROSES': return { val: 40, label: 'Dalam Proses' };
              case 'REVISI': return { val: 50, label: 'Revisi Draf' };
              case 'MENUNGGU': return { val: 75, label: 'Menunggu Persetujuan' };
              case 'PUBLISHED': return { val: 100, label: 'Terpublikasi' };
              case 'SELESAI': return { val: 100, label: 'Selesai' };
              default: return { val: 0, label: 'Dibatalkan' };
            }
          };
          const progress = getProgress(selectedItem.status);

          return (
            <div className="space-y-6">
              {/* Creator and Status Info Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <UserAvatar src={selectedItem.picAvatar} name={selectedItem.picName} size="md" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{selectedItem.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      PIC Kreator: <strong className="text-slate-700">{selectedItem.picName}</strong> • {selectedItem.picRole}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getPlatformBadge(selectedItem.platform)}
                  <span className="bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold px-2 py-0.5 rounded">
                    {selectedItem.contentType}
                  </span>
                  <StatusBadge status={selectedItem.status} />
                </div>
              </div>

              {/* Deadline & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700 p-1">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                  <span><strong>Deadline Tayang:</strong> {formatDateID(selectedItem.deadline)}</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                  <span><strong>Jam Publish:</strong> {selectedItem.time}</span>
                </div>
              </div>

              {/* Progress Section */}
              <div className="space-y-2 p-1">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700">
                  <span>Progress Konten: <span className="text-teal-600 font-semibold">{progress.label}</span></span>
                  <span>{progress.val}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-teal-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress.val}%` }}
                  />
                </div>
              </div>

              {/* Link Video (Published Link) */}
              {selectedItem.videoUrl && (
                <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200">
                  <h5 className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-1.5">Link Video / Publikasi</h5>
                  <a
                    href={selectedItem.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-sky-800 break-all underline font-semibold flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-4 h-4 shrink-0" />
                    {selectedItem.videoUrl}
                  </a>
                </div>
              )}

              {/* File Hasil (Visual Preview) */}
              <div>
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">File Hasil / Thumbnail Preview</h5>
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 max-h-[300px] flex items-center justify-center min-h-[160px]">
                  {isValidImageSrc(selectedItem.mediaUrl) ? (
                    <img src={selectedItem.mediaUrl} alt={selectedItem.title} className="w-full max-h-[300px] object-contain" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-400 py-8 px-6 text-center">
                      <ImageIcon className="w-10 h-10" />
                      <p className="text-xs">
                        {selectedItem.videoUrl
                          ? 'Poster hasil belum diunggah ke server.'
                          : 'Belum ada draf visual atau file hasil diunggah.'}
                      </p>
                    </div>
                  )}
                  {selectedItem.mediaType === 'video' && isValidImageSrc(selectedItem.mediaUrl) && (
                    <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                      <div className="w-12 h-12 rounded-full bg-teal-600/90 text-white flex items-center justify-center shadow-lg border-2 border-white/40">
                        <Video className="w-5 h-5" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Caption & Notes */}
              <div className="space-y-3">
                <div>
                  <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Draft Caption & Copywriting</h5>
                  <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap">
                    {selectedItem.caption || 'Caption belum dilengkapi.'}
                  </div>
                </div>

                {selectedItem.revisionNote && (
                  <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                    <p className="font-bold flex items-center gap-1.5 mb-1">
                      <RotateCcw className="w-3.5 h-3.5 text-amber-600 animate-spin-reverse" />
                      Catatan Revisi Terakhir:
                    </p>
                    <p>{selectedItem.revisionNote}</p>
                  </div>
                )}
              </div>

              {/* Riwayat Upload Bukti */}
              <div>
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Riwayat Upload Bukti</h5>
                {selectedItem.media && selectedItem.media.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {selectedItem.media.map((med: any) => (
                      <div
                        key={med.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs"
                      >
                        <div className="min-w-0 flex-1 pr-4">
                          <p className="font-bold text-slate-800">
                            {med.uploader?.fullName || 'Kreator'} ({med.fileName})
                          </p>
                          <a
                            href={med.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-600 hover:underline truncate block max-w-sm font-semibold"
                          >
                            {med.fileUrl}
                          </a>
                        </div>
                        <div className="text-right shrink-0 flex items-center gap-2">
                          <span className="text-[10px] text-slate-400">
                            {new Date(med.createdAt).toLocaleString('id-ID', {
                              dateStyle: 'short',
                              timeStyle: 'short',
                            })}
                          </span>
                          <a
                            href={med.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg bg-teal-50 text-teal-600 hover:bg-teal-150 transition-colors"
                            title="Buka Drive"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic bg-slate-50 p-4 rounded-xl border border-slate-100 text-center">
                    Belum ada riwayat upload bukti draf/konten.
                  </p>
                )}
              </div>

              {/* Verification Actions Toolbar */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
                <CustomButton variant="outline" size="sm" onClick={() => setIsViewerOpen(false)}>
                  Tutup
                </CustomButton>
                {selectedItem.status !== 'PUBLISHED' && selectedItem.status !== 'SELESAI' && selectedItem.status !== 'DIBATALKAN' && (
                  <>
                    <CustomButton
                      variant="danger-outline"
                      size="sm"
                      icon={XCircle}
                      onClick={() => handleReject(selectedItem)}
                    >
                      Batalkan Konten
                    </CustomButton>
                    <CustomButton
                      variant="secondary"
                      size="sm"
                      icon={RotateCcw}
                      onClick={() => handleOpenRevision(selectedItem)}
                    >
                      Minta Revisi
                    </CustomButton>
                    <CustomButton
                      variant="primary"
                      size="sm"
                      icon={CheckCircle2}
                      onClick={() => handleApprove(selectedItem)}
                    >
                      Setujui & Terbitkan
                    </CustomButton>
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </CustomModal>

      {/* Revision Note Dialog */}
      <CustomModal
        isOpen={isRevisionOpen}
        onClose={() => setIsRevisionOpen(false)}
        title="Kirim Catatan Revisi"
        subtitle={selectedItem ? `Untuk konten: "${selectedItem.title}"` : ''}
        maxWidth="md"
      >
        <form onSubmit={handleSubmitRevision} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan & Instruksi Perbaikan *
            </label>
            <textarea
              rows={4}
              required
              value={revisionText}
              onChange={(e) => setRevisionText(e.target.value)}
              placeholder="Jelaskan bagian visual, caption, atau audio yang perlu diperbaiki oleh kreator..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <CustomButton type="button" variant="outline" onClick={() => setIsRevisionOpen(false)}>
              Batal
            </CustomButton>
            <CustomButton type="submit" variant="primary">
              Kirim Revisi
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* Create Content Plan Modal */}
      <CustomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Tambah Content Plan Baru"
        subtitle="Rencanakan publikasi visual untuk sosial media atau website."
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Judul Konten *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Teaser Pendaftaran Wisuda Periode II"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Platform Target *</label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value as ContentItem['platform'] })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer font-semibold"
              >
                {PLATFORM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jenis Konten *</label>
              <select
                value={formData.contentType}
                onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer font-semibold"
              >
                {JENIS_KONTEN_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Deadline Tanggal *</label>
              <input
                type="date"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jam Publish *</label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">PIC Kreator *</label>
              <select
                value={formData.picId}
                onChange={(e) => setFormData({ ...formData, picId: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer font-semibold"
              >
                {picOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.roleLabel})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Draft Caption / Copywriting</label>
            <textarea
              rows={3}
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              placeholder="Tuliskan draft caption beserta hashtag..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <CustomButton type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Batal
            </CustomButton>
            <CustomButton type="submit" variant="primary">
              Simpan Content Plan
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* Edit Content Plan Modal */}
      <CustomModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Rencana Konten"
        subtitle="Perbarui jadwal tayang, platform, caption, atau PIC."
        maxWidth="lg"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Judul Konten *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Platform Target *</label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value as ContentItem['platform'] })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer font-semibold"
              >
                {PLATFORM_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jenis Konten *</label>
              <select
                value={formData.contentType}
                onChange={(e) => setFormData({ ...formData, contentType: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer font-semibold"
              >
                {JENIS_KONTEN_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ContentItem['status'] })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer font-semibold"
              >
                <option value="DRAFT">Draft</option>
                <option value="PROSES">Dalam Proses</option>
                <option value="MENUNGGU">Menunggu Review</option>
                <option value="REVISI">Revisi</option>
                <option value="PUBLISHED">Published</option>
                <option value="SELESAI">Selesai</option>
                <option value="DIBATALKAN">Dibatalkan</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Deadline Tanggal *</label>
              <input
                type="date"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jam Publish *</label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">PIC Kreator *</label>
              <select
                value={formData.picId}
                onChange={(e) => setFormData({ ...formData, picId: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer font-semibold"
              >
                {picOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.roleLabel})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Draft Caption & Copywriting</label>
            <textarea
              rows={3}
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <CustomButton type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
              Batal
            </CustomButton>
            <CustomButton type="submit" variant="primary">
              Simpan Perubahan
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* Delete Confirmation Modal */}
      <CustomModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Konfirmasi Hapus Content Plan"
        maxWidth="sm"
      >
        <div className="text-center py-2 space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              Hapus &quot;{selectedItem?.title}&quot;?
            </p>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Tindakan ini akan menghapus content plan secara permanen dan tidak dapat dibatalkan.
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
