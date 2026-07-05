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
  Share2,
} from 'lucide-react';
import { formatDateID, isValidImageSrc } from '@/utils/formatters';
import { toast } from 'sonner';
import { contentService, userService } from '@/services';
import { contentPlanToItem, mapContentStatusToApi, mapPlatformToApi } from '@/utils/api-helpers';
import { User } from '@/types';

interface ContentItem {
  id: number;
  title: string;
  category: string;
  platform: 'Instagram Reels' | 'Instagram Carousel' | 'TikTok Video' | 'Website Rilis' | 'YouTube Video';
  deadline: string;
  time: string;
  picName: string;
  picRole: string;
  picAvatar?: string;
  status: 'MENUNGGU_REVIEW' | 'DISETUJUI' | 'REVISI' | 'DITOLAK';
  caption: string;
  mediaUrl?: string;
  videoUrl?: string;
  mediaType: 'image' | 'video';
  revisionNote?: string;
}

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
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const [revisionText, setRevisionText] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    category: 'Kampanye Resmi',
    platform: 'Instagram Reels' as ContentItem['platform'],
    deadline: new Date().toISOString().split('T')[0],
    time: '16:00 WIB',
    picName: '',
    caption: '',
    mediaUrl: '',
  });

  const loadContents = async () => {
    setLoading(true);
    try {
      const result = await contentService.getAll({ page: 1, pageSize: 100 });
      const items = (result.items ?? []).map(contentPlanToItem);
      setContents(items);
    } catch {
      toast.error('Gagal memuat data content plan dari server.');
      setContents([]);
    } finally {
      setLoading(false);
    }
  };

  const resolvePicId = () => {
    const match = users.find((u) => u.fullName === formData.picName);
    return match?.id ?? users[0]?.id ?? 1;
  };

  useEffect(() => {
    const init = async () => {
      try {
        const staff = await userService.getAll();
        const userList = Array.isArray(staff) ? staff : [];
        setUsers(userList);
        if (userList.length > 0) {
          setFormData((prev) => ({ ...prev, picName: userList[0].fullName }));
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
      await contentService.update(item.id, { status: 'SELESAI' });
      setIsViewerOpen(false);
      toast.success(`Konten "${item.title}" berhasil DISETUJUI untuk dipublikasikan!`);
      await loadContents();
    } catch {
      toast.error('Gagal menyetujui konten.');
    }
  };

  const handleReject = async (item: ContentItem) => {
    try {
      await contentService.update(item.id, { status: 'DITOLAK' });
      setIsViewerOpen(false);
      toast.error(`Konten "${item.title}" DITOLAK.`);
      await loadContents();
    } catch {
      toast.error('Gagal menolak konten.');
    }
  };

  const handleOpenRevision = (item: ContentItem) => {
    setSelectedItem(item);
    setRevisionText(item.revisionNote || '');
    setIsRevisionOpen(true);
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
        status: 'REVISI' as 'PROSES',
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

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error('Harap lengkapi judul konten!');
      return;
    }

    const { platform, contentType } = mapPlatformToApi(formData.platform);

    try {
      await contentService.create({
        title: formData.title,
        category: formData.category,
        platform: platform as 'INSTAGRAM' | 'TIKTOK' | 'YOUTUBE',
        contentType: contentType as 'REELS' | 'VIDEO_PENDEK' | 'VIDEO_DOKUMENTER',
        picId: resolvePicId(),
        deadline: formData.deadline,
        status: 'TERENCANA',
        description: formData.caption || 'Draft caption belum dilengkapi.',
      });
      setIsCreateOpen(false);
      toast.success('Rencana konten baru berhasil ditambahkan untuk direview!');
      await loadContents();
    } catch {
      toast.error('Gagal menyimpan content plan ke server.');
    }
  };

  const getPlatformBadge = (platform: ContentItem['platform']) => {
    if (platform.includes('Instagram')) {
      return (
        <span className="inline-flex items-center gap-1.5 bg-pink-50 text-pink-700 font-semibold px-2.5 py-1 rounded-lg text-xs">
          <Camera className="w-3.5 h-3.5" />
          <span>{platform}</span>
        </span>
      );
    }
    if (platform.includes('TikTok')) {
      return (
        <span className="inline-flex items-center gap-1.5 bg-slate-900 text-white font-semibold px-2.5 py-1 rounded-lg text-xs">
          <Video className="w-3.5 h-3.5" />
          <span>{platform}</span>
        </span>
      );
    }
    if (platform.includes('YouTube')) {
      return (
        <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-600 font-semibold px-2.5 py-1 rounded-lg text-xs">
          <Film className="w-3.5 h-3.5" />
          <span>{platform}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 bg-sky-50 text-sky-700 font-semibold px-2.5 py-1 rounded-lg text-xs">
        <Globe className="w-3.5 h-3.5" />
        <span>{platform}</span>
      </span>
    );
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
      header: 'Judul Konten & Kategori',
      render: (item) => (
        <div className="max-w-xs">
          <div className="flex items-center gap-1.5 mb-1">
            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded">
              {item.category}
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
      key: 'verification',
      header: 'Verifikasi & Aksi',
      render: (item) => (
        <div className="flex items-center justify-center gap-1.5">
          <button
            onClick={() => handleApprove(item)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              item.status === 'DISETUJUI'
                ? 'bg-green-100 text-green-700 cursor-default'
                : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
            }`}
            title="Setujui Konten (Approve)"
          >
            <CheckCircle2 className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => handleOpenRevision(item)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              item.status === 'REVISI'
                ? 'bg-amber-100 text-amber-700 cursor-default'
                : 'text-slate-400 hover:text-amber-600 hover:bg-amber-50'
            }`}
            title="Minta Revisi (Revision)"
          >
            <RotateCcw className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => handleReject(item)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              item.status === 'DITOLAK'
                ? 'bg-red-100 text-red-600 cursor-default'
                : 'text-slate-400 hover:text-red-600 hover:bg-red-50'
            }`}
            title="Tolak Konten (Reject)"
          >
            <XCircle className="w-4.5 h-4.5" />
          </button>
        </div>
      ),
      className: 'text-center w-32',
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
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Daftar Content Plan & Jadwal Publikasi</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola jadwal tayang, review draft visual, dan berikan verifikasi (Approve/Revisi/Reject) untuk konten sosial media.
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
                { value: 'Instagram Reels', label: 'Instagram Reels' },
                { value: 'Instagram Carousel', label: 'Instagram Carousel' },
                { value: 'TikTok Video', label: 'TikTok Video' },
                { value: 'Website Rilis', label: 'Website Rilis' },
                { value: 'YouTube Video', label: 'YouTube Video' },
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
                { value: 'MENUNGGU_REVIEW', label: 'Menunggu Review' },
                { value: 'DISETUJUI', label: 'Disetujui' },
                { value: 'REVISI', label: 'Perlu Revisi' },
                { value: 'DITOLAK', label: 'Ditolak' },
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
        <DataTable columns={columns} data={paginatedContents} emptyMessage="Tidak ada content plan yang sesuai dengan pencarian Anda." />
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages || 1}
          totalItems={filteredContents.length}
          onPageChange={setCurrentPage}
          itemName="konten"
        />
      </div>

      {/* Media Viewer & Verification Modal */}
      <CustomModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        title="Media Viewer & Verifikasi Konten"
        subtitle={selectedItem ? `ID Konten: #${selectedItem.id}` : ''}
        maxWidth="2xl"
      >
        {selectedItem && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-3">
                <UserAvatar src={selectedItem.picAvatar} name={selectedItem.picName} size="md" />
                <div>
                  <h4 className="font-bold text-sm text-slate-800">{selectedItem.title}</h4>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kreator: <strong className="text-slate-700">{selectedItem.picName}</strong> • Deadline: {formatDateID(selectedItem.deadline)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getPlatformBadge(selectedItem.platform)}
                <StatusBadge status={selectedItem.status} />
              </div>
            </div>

            {selectedItem.videoUrl && (
              <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200">
                <h5 className="text-xs font-bold text-sky-700 uppercase tracking-wider mb-1.5">Link Video dari Kreator</h5>
                <a
                  href={selectedItem.videoUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-sky-800 break-all underline font-medium"
                >
                  {selectedItem.videoUrl}
                </a>
              </div>
            )}

            {/* Visual Preview Box */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 max-h-[380px] flex items-center justify-center min-h-[200px]">
              {isValidImageSrc(selectedItem.mediaUrl) ? (
                <img src={selectedItem.mediaUrl} alt={selectedItem.title} className="w-full max-h-[380px] object-contain" />
              ) : (
                <div className="flex flex-col items-center gap-2 text-slate-400 py-12 px-6 text-center">
                  <ImageIcon className="w-10 h-10" />
                  <p className="text-xs">
                    {selectedItem.videoUrl
                      ? 'Poster belum tersedia di server. Buka link video di atas untuk melihat konten.'
                      : 'Belum ada bukti konten dari kreator.'}
                  </p>
                </div>
              )}
              {selectedItem.mediaType === 'video' && isValidImageSrc(selectedItem.mediaUrl) && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center pointer-events-none">
                  <div className="w-14 h-14 rounded-full bg-teal-600/90 text-white flex items-center justify-center shadow-lg border-2 border-white/40">
                    <Video className="w-6 h-6" />
                  </div>
                </div>
              )}
            </div>

            {/* Caption & Notes */}
            <div className="space-y-3">
              <div>
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">Draft Caption & Hashtags</h5>
                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-mono">
                  {selectedItem.caption}
                </div>
              </div>

              {selectedItem.revisionNote && (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900">
                  <p className="font-bold flex items-center gap-1.5 mb-1">
                    <RotateCcw className="w-3.5 h-3.5 text-amber-600" />
                    Catatan Revisi Sebelumnya:
                  </p>
                  <p>{selectedItem.revisionNote}</p>
                </div>
              )}
            </div>

            {/* Verification Actions Toolbar */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
              <CustomButton variant="outline" size="sm" onClick={() => setIsViewerOpen(false)}>
                Tutup
              </CustomButton>
              {selectedItem.status === 'MENUNGGU_REVIEW' && (
                <>
                  <CustomButton
                    variant="danger-outline"
                    size="sm"
                    icon={XCircle}
                    onClick={() => handleReject(selectedItem)}
                  >
                    Tolak (Reject)
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
                    Setujui (Approve)
                  </CustomButton>
                </>
              )}
            </div>
          </div>
        )}
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
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              >
                <option value="Instagram Reels">Instagram Reels</option>
                <option value="Instagram Carousel">Instagram Carousel</option>
                <option value="TikTok Video">TikTok Video</option>
                <option value="Website Rilis">Website Rilis</option>
                <option value="YouTube Video">YouTube Video</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kategori Konten</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              >
                <option value="Kampanye Resmi">Kampanye Resmi</option>
                <option value="PMB 2025">PMB 2025</option>
                <option value="Life At Polinela">Life At Polinela</option>
                <option value="Berita Website">Berita Website</option>
                <option value="Riset & Inovasi">Riset & Inovasi</option>
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jam Tayang *</label>
              <input
                type="text"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">PIC Kreator</label>
              <select
                value={formData.picName}
                onChange={(e) => setFormData({ ...formData, picName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              >
                {users.length > 0 ? (
                  users.map((u) => (
                    <option key={u.id} value={u.fullName}>
                      {u.fullName}
                    </option>
                  ))
                ) : (
                  <option value="">Memuat data anggota...</option>
                )}
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
    </AdminLayout>
  );
}
