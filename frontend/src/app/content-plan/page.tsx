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
import { formatDateID } from '@/utils/formatters';
import { toast } from 'sonner';

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
  mediaUrl: string;
  mediaType: 'image' | 'video';
  revisionNote?: string;
}

const initialContents: ContentItem[] = [
  {
    id: 1,
    title: 'Teaser Video Dies Natalis Polinela ke-41',
    category: 'Kampanye Resmi',
    platform: 'Instagram Reels',
    deadline: '2025-05-23',
    time: '16:00 WIB',
    picName: 'Budi Santoso',
    picRole: 'Videografer Utama',
    picAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'MENUNGGU_REVIEW',
    caption: 'Semangat baru di usia ke-41 tahun! Saksikan kemeriahan Dies Natalis Politeknik Negeri Lampung. #Polinela41 #BanggaPolinela',
    mediaUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=80',
    mediaType: 'video',
  },
  {
    id: 2,
    title: 'Infografis Jalur Penerimaan Mahasiswa Baru 2025',
    category: 'PMB 2025',
    platform: 'Instagram Carousel',
    deadline: '2025-05-24',
    time: '12:00 WIB',
    picName: 'Rina Wati',
    picRole: 'Jurnalis & Kreator',
    picAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
    status: 'DISETUJUI',
    caption: 'Catat tanggal penting pendaftaran jalur SNBP, SNBT, dan Mandiri Politeknik Negeri Lampung 2025. Geser untuk detail lengkapnya! 👉',
    mediaUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&auto=format&fit=crop&q=80',
    mediaType: 'image',
  },
  {
    id: 3,
    title: 'A-Day-In-My-Life Mahasiswa D4 Teknologi Benih',
    category: 'Life At Polinela',
    platform: 'TikTok Video',
    deadline: '2025-05-25',
    time: '19:00 WIB',
    picName: 'Budi Santoso',
    picRole: 'Videografer Utama',
    picAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    status: 'REVISI',
    caption: 'Serunya praktikum di green house dan laboratorium benih modern Polinela! Mau kuliah di sini? Komen di bawah ya! 🌱',
    mediaUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600&auto=format&fit=crop&q=80',
    mediaType: 'video',
    revisionNote: 'Audio backsound sedikit terlalu keras di detik 15-25, tolong disesuaikan dengan suara talent.',
  },
  {
    id: 4,
    title: 'Rilis Resmi Peresmian Lab Inovasi Digital Terpadu',
    category: 'Berita Website',
    platform: 'Website Rilis',
    deadline: '2025-05-21',
    time: '15:00 WIB',
    picName: 'Komang Ari',
    picRole: 'Koordinator Humas',
    picAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    status: 'DISETUJUI',
    caption: 'Bandar Lampung – Politeknik Negeri Lampung resmi mengoperasikan Laboratorium Inovasi Digital Terpadu untuk mendukung pembelajaran vokasi 4.0.',
    mediaUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&auto=format&fit=crop&q=80',
    mediaType: 'image',
  },
  {
    id: 5,
    title: 'Dokumenter Singkat Inovasi Pertanian Berkelanjutan',
    category: 'Riset & Inovasi',
    platform: 'YouTube Video',
    deadline: '2025-05-30',
    time: '10:00 WIB',
    picName: 'Andi Saputra',
    picRole: 'Fotografer & Kreator',
    picAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    status: 'MENUNGGU_REVIEW',
    caption: 'Menyelami inovasi riset dosen dan mahasiswa Polinela dalam mewujudkan ketahanan pangan nasional melalui pertanian organik terpadu.',
    mediaUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=80',
    mediaType: 'video',
  },
];

export default function ContentPlanPage() {
  const [contents, setContents] = useState<ContentItem[]>(initialContents);
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
    picName: 'Komang Ari',
    caption: '',
    mediaUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&auto=format&fit=crop&q=80',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
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

  const handleApprove = (item: ContentItem) => {
    setContents(contents.map((c) => (c.id === item.id ? { ...c, status: 'DISETUJUI', revisionNote: undefined } : c)));
    setIsViewerOpen(false);
    toast.success(`Konten "${item.title}" berhasil DISETUJUI untuk dipublikasikan!`);
  };

  const handleReject = (item: ContentItem) => {
    setContents(contents.map((c) => (c.id === item.id ? { ...c, status: 'DITOLAK' } : c)));
    setIsViewerOpen(false);
    toast.error(`Konten "${item.title}" DITOLAK.`);
  };

  const handleOpenRevision = (item: ContentItem) => {
    setSelectedItem(item);
    setRevisionText(item.revisionNote || '');
    setIsRevisionOpen(true);
  };

  const handleSubmitRevision = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (!revisionText.trim()) {
      toast.error('Harap tuliskan catatan revisi untuk kreator.');
      return;
    }

    setContents(
      contents.map((c) =>
        c.id === selectedItem.id ? { ...c, status: 'REVISI', revisionNote: revisionText } : c,
      ),
    );
    setIsRevisionOpen(false);
    setIsViewerOpen(false);
    toast.info(`Permintaan revisi dikirimkan kepada ${selectedItem.picName}.`);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) {
      toast.error('Harap lengkapi judul konten!');
      return;
    }

    const newItem: ContentItem = {
      id: Date.now(),
      title: formData.title,
      category: formData.category,
      platform: formData.platform,
      deadline: formData.deadline,
      time: formData.time,
      picName: formData.picName,
      picRole: 'Petugas Humas',
      status: 'MENUNGGU_REVIEW',
      caption: formData.caption || 'Draft caption belum dilengkapi.',
      mediaUrl: formData.mediaUrl,
      mediaType: formData.platform.includes('Video') || formData.platform.includes('Reels') ? 'video' : 'image',
    };

    setContents([newItem, ...contents]);
    setIsCreateOpen(false);
    toast.success('Rencana konten baru berhasil ditambahkan untuk direview!');
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
          <img src={item.mediaUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
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

            {/* Visual Preview Box */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 max-h-[380px] flex items-center justify-center">
              <img src={selectedItem.mediaUrl} alt={selectedItem.title} className="w-full max-h-[380px] object-contain" />
              {selectedItem.mediaType === 'video' && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full bg-teal-600/90 text-white flex items-center justify-center shadow-lg border-2 border-white/40 cursor-pointer hover:scale-110 transition-transform">
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
                <option value="Komang Ari">Komang Ari</option>
                <option value="Rina Wati">Rina Wati</option>
                <option value="Budi Santoso">Budi Santoso</option>
                <option value="Andi Saputra">Andi Saputra</option>
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
