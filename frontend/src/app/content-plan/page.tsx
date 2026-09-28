'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Trash2,
  AlertTriangle,
  Edit3,
  Share2,
  ExternalLink,
  Send,
  FileCheck,
  ClipboardCheck,
  Tag,
} from 'lucide-react';
import { formatDateID, isValidImageSrc } from '@/utils/formatters';
import { toast } from 'sonner';
import { contentService, userService, activityService } from '@/services';
import { contentPlanToItem } from '@/utils/api-helpers';
import { User, Activity } from '@/types';

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
  picId?: number;
  status:
    | 'DRAFT'
    | 'DITUGASKAN'
    | 'DALAM_PENGERJAAN'
    | 'MENUNGGU_VERIFIKASI_ADMIN'
    | 'REVISI'
    | 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS'
    | 'DISETUJUI'
    | 'PUBLISHED'
    | 'SELESAI'
    | 'DIBATALKAN'
    | 'MENUNGGU'
    | 'PROSES';
  caption: string;
  category?: string;
  mediaUrl?: string;
  videoUrl?: string;
  draftUrl?: string;
  thumbnailUrl?: string;
  mediaType: 'image' | 'video';
  revisionNote?: string;
  adminNotes?: string;
  submittedAt?: string;
  media?: any[];
}

const JENIS_KONTEN_OPTIONS = [
  'Poster',
  'Foto',
  'Reels',
  'Video',
  'Story',
  'Carousel',
  'Infografis',
  'Artikel Website',
  'Berita Liputan',
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
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [platformFilter, setPlatformFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modals state
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const [isVerifyAdminOpen, setIsVerifyAdminOpen] = useState(false);
  const [isRequestFixOpen, setIsRequestFixOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [revisionText, setRevisionText] = useState('');
  const [adminNotesText, setAdminNotesText] = useState('');
  const [fixNotesText, setFixNotesText] = useState('');

  // Work modal form state (for PIC Creator)
  const [workForm, setWorkForm] = useState({
    caption: '',
    videoUrl: '',
    thumbnailUrl: '',
  });

  // Admin Create / Edit Form state
  const [formData, setFormData] = useState({
    title: '',
    platform: 'INSTAGRAM' as ContentItem['platform'],
    contentType: 'Poster',
    activityName: '',
    deadline: new Date().toISOString().split('T')[0],
    time: '16:00',
    picId: 0,
    caption: '',
    status: 'DITUGASKAN' as ContentItem['status'],
  });

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'; // Kepala Humas
  const isAdmin = currentUser?.role === 'ADMIN' || (!isSuperAdmin && currentUser?.role !== 'USER'); // Admin Humas
  const isTimHumas = currentUser?.role === 'USER'; // PIC / Anggota Tim Humas

  const picOptions = users.filter((u) => u.role === 'USER' || u.role === 'ADMIN');

  const loadContents = async () => {
    setLoading(true);
    try {
      const result = await contentService.getAll({ page: 1, pageSize: 100 });
      const items = (result.items ?? []).map((p) => {
        const item = contentPlanToItem(p) as unknown as ContentItem;
        item.picId = (p as any).picId || (p as any).pic?.id;
        item.category = p.category;
        return item;
      });
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
    const userStr = typeof window !== 'undefined'
      ? localStorage.getItem('humass_user') || localStorage.getItem('auth_user') || localStorage.getItem('user')
      : null;
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setCurrentUser(parsed);
      } catch (e) {
        console.error(e);
      }
    }

    const init = async () => {
      try {
        const [staff, actRes] = await Promise.all([
          userService.getAll(),
          activityService.getAll({ page: 1, pageSize: 100 }).catch(() => ({ items: [] })),
        ]);
        const userList = Array.isArray(staff) ? staff : [];
        setUsers(userList);
        setActivities(actRes?.items || []);
        const creators = userList.filter((u) => u.role === 'USER' || u.role === 'ADMIN');
        if (creators.length > 0) {
          setFormData((prev) => ({ ...prev, picId: creators[0].id }));
        }
      } catch {
        setUsers([]);
      }
      await loadContents();
    };
    init();
  }, []);

  // Filter content for display
  const filteredContents = contents.filter((item) => {
    // If PIC (USER), only show items assigned to them
    if (isTimHumas && currentUser?.id && item.picId && item.picId !== currentUser.id) {
      return false;
    }

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

  // ── WORKFLOW ACTION HANDLERS ──────────────────────────────────

  // 1. PIC: Open Work Modal
  const handleOpenWorkModal = (item: ContentItem) => {
    setSelectedItem(item);
    setWorkForm({
      caption: item.caption || '',
      videoUrl: item.videoUrl || '',
      thumbnailUrl: item.mediaUrl || '',
    });
    setIsWorkModalOpen(true);
  };

  // 2. PIC: Submit Work (Simpan Draft vs Kirim untuk Review)
  const handleSubmitWork = async (sendToReview: boolean) => {
    if (!selectedItem) return;

    if (sendToReview) {
      // Validasi kelengkapan wajib sebelum kirim untuk review
      const missingFields: string[] = [];
      if (!workForm.videoUrl.trim()) missingFields.push('Link hasil konten (Google Drive / Video Link)');
      if (!workForm.caption.trim()) missingFields.push('Caption / Copywriting');

      if (missingFields.length > 0) {
        toast.error(`Content Plan belum dapat dikirim untuk review. Lengkapi data berikut: ${missingFields.join(', ')}`);
        return;
      }
    }

    setSubmitting(true);
    try {
      await contentService.submitWork(selectedItem.id, {
        caption: workForm.caption,
        videoUrl: workForm.videoUrl,
        thumbnailUrl: workForm.thumbnailUrl,
        sendToReview,
      });

      setIsWorkModalOpen(false);
      setIsViewerOpen(false);
      if (sendToReview) {
        toast.success(`Hasil konten "${selectedItem.title}" berhasil dikirim untuk verifikasi Admin Humas!`);
      } else {
        toast.success(`Progress draf konten "${selectedItem.title}" berhasil disimpan.`);
      }
      await loadContents();
    } catch {
      toast.error('Gagal menyimpan hasil pekerjaan.');
    } finally {
      setSubmitting(false);
    }
  };

  // 2B. Admin Humas: Verifikasi Lengkap & Ajukan ke Kepala Humas
  const handleOpenVerifyAdmin = (item: ContentItem) => {
    setSelectedItem(item);
    setAdminNotesText(item.adminNotes || 'Verifikasi lengkap, visual & caption sesuai.');
    setIsVerifyAdminOpen(true);
  };

  const handleSubmitVerifyAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      await contentService.verifyAdmin(selectedItem.id, adminNotesText);
      toast.success(`Konten "${selectedItem.title}" telah diverifikasi lengkap dan diajukan ke Kepala Humas!`);
      setIsVerifyAdminOpen(false);
      setIsViewerOpen(false);
      await loadContents();
    } catch {
      toast.error('Gagal mengajukan konten ke Kepala Humas.');
    } finally {
      setSubmitting(false);
    }
  };

  // 2C. Admin Humas: Kembalikan untuk Perbaikan Internal ke PIC
  const handleOpenRequestFix = (item: ContentItem) => {
    setSelectedItem(item);
    setFixNotesText(item.revisionNote || '');
    setIsRequestFixOpen(true);
  };

  const handleSubmitRequestFix = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (!fixNotesText.trim()) {
      toast.error('Catatan perbaikan wajib diisi.');
      return;
    }
    setSubmitting(true);
    try {
      await contentService.requestFix(selectedItem.id, fixNotesText);
      toast.warning(`Permintaan perbaikan telah dikembalikan kepada PIC ${selectedItem.picName}.`);
      setIsRequestFixOpen(false);
      setIsViewerOpen(false);
      await loadContents();
    } catch {
      toast.error('Gagal mengirimkan catatan perbaikan.');
    } finally {
      setSubmitting(false);
    }
  };

  // 3. Kepala Humas: Request Revision
  const handleOpenRevisionModal = (item: ContentItem) => {
    setSelectedItem(item);
    setRevisionText(item.revisionNote || '');
    setIsRevisionOpen(true);
  };

  const handleSubmitRevision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (!revisionText.trim()) {
      toast.error('Harap tuliskan catatan instruksi revisi.');
      return;
    }

    setSubmitting(true);
    try {
      await contentService.requestRevision(selectedItem.id, revisionText);
      toast.warning(`Permintaan revisi dikirimkan kepada PIC ${selectedItem.picName}.`);
      setIsRevisionOpen(false);
      setIsViewerOpen(false);
      await loadContents();
    } catch {
      toast.error('Gagal mengirimkan instruksi revisi.');
    } finally {
      setSubmitting(false);
    }
  };

  // 4. Kepala Humas: Approve Final
  const handleApproveFinal = async (item: ContentItem) => {
    setSubmitting(true);
    try {
      await contentService.approve(item.id);
      setIsViewerOpen(false);
      toast.success(`Konten "${item.title}" berhasil DISETUJUI & siap dipublikasikan!`);
      await loadContents();
    } catch {
      toast.error('Gagal menyetujui konten.');
    } finally {
      setSubmitting(false);
    }
  };

  // 5. Admin / Kepala Humas: Publish (Sudah Dipublikasikan)
  const handlePublish = async (item: ContentItem) => {
    setSubmitting(true);
    try {
      await contentService.publish(item.id);
      setIsViewerOpen(false);
      toast.success(`Konten "${item.title}" telah dipublikasikan (Sudah Dipublikasikan)!`);
      await loadContents();
    } catch {
      toast.error('Gagal memperbarui status publikasi.');
    } finally {
      setSubmitting(false);
    }
  };

  // 6. Admin / Kepala Humas: Cancel Content
  const handleCancelContent = async (item: ContentItem) => {
    setSubmitting(true);
    try {
      await contentService.cancel(item.id);
      setIsViewerOpen(false);
      toast.error(`Konten "${item.title}" telah dibatalkan.`);
      await loadContents();
    } catch {
      toast.error('Gagal membatalkan konten.');
    } finally {
      setSubmitting(false);
    }
  };

  // 7. Admin Humas: Delete Content
  const handleOpenDelete = (item: ContentItem) => {
    setSelectedItem(item);
    setIsDeleteOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedItem) return;
    setSubmitting(true);
    try {
      await contentService.remove(selectedItem.id);
      setIsDeleteOpen(false);
      setIsViewerOpen(false);
      toast.success(`Content Plan "${selectedItem.title}" berhasil dihapus.`);
      await loadContents();
    } catch {
      toast.error('Gagal menghapus content plan.');
    } finally {
      setSubmitting(false);
    }
  };

  // 8. Admin Humas: Edit Content Modal
  const handleOpenEdit = (item: ContentItem) => {
    setSelectedItem(item);
    const rawTime = (item.time || '16:00').replace(' WIB', '');
    const rawDate = item.deadline ? new Date(item.deadline).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const matchingUser = users.find((u) => u.fullName === item.picName || u.id === item.picId);

    setFormData({
      title: item.title,
      platform: item.platform,
      contentType: item.contentType,
      activityName: item.category || '',
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

    setSubmitting(true);
    try {
      await contentService.update(selectedItem.id, {
        title: formData.title,
        platform: formData.platform as any,
        contentType: formData.contentType,
        category: formData.activityName || undefined,
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
    } finally {
      setSubmitting(false);
    }
  };

  // 9. Admin Humas: Create Content Plan
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

    setSubmitting(true);
    try {
      await contentService.create({
        title: formData.title,
        platform: formData.platform as any,
        contentType: formData.contentType,
        category: formData.activityName || undefined,
        picId: formData.picId || resolvePicId(),
        deadline: deadlineIso,
        status: 'PROSES', // Status DITUGASKAN
        description: formData.caption || '',
      });
      setIsCreateOpen(false);
      setFormData({
        title: '',
        platform: 'INSTAGRAM',
        contentType: 'Poster',
        activityName: '',
        deadline: new Date().toISOString().split('T')[0],
        time: '16:00',
        picId: picOptions[0]?.id || 0,
        caption: '',
        status: 'PROSES',
      });
      toast.success('Rencana konten baru berhasil dibuat dan ditugaskan ke PIC!');
      await loadContents();
    } catch {
      toast.error('Gagal menyimpan content plan ke server.');
    } finally {
      setSubmitting(false);
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

  const getWorkflowBadge = (item: ContentItem) => {
    switch (item.status) {
      case 'PUBLISHED':
        return <StatusBadge status="SUDAH_TAYANG" />;
      case 'SELESAI':
        return <StatusBadge status="SELESAI" />;
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
      case 'PROSES':
        return <StatusBadge status="SEDANG_DIKERJAKAN" />;
      case 'DITUGASKAN':
        return <StatusBadge status="DITUGASKAN" />;
      case 'DIBATALKAN':
        return <StatusBadge status="DIBATALKAN" />;
      default:
        return <StatusBadge status="DRAFT" />;
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
            setSelectedItem(item);
            setIsViewerOpen(true);
          }}
          className="group relative w-16 h-11 rounded-lg overflow-hidden border border-slate-200 shadow-2xs hover:border-teal-500 transition-all cursor-pointer mx-auto block"
          title="Lihat Detail & Media"
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
      header: 'Aksi',
      render: (item) => (
        <div className="flex items-center justify-center gap-1.5">
          {/* TIM HUMAS (PIC) ACTION */}
          {isTimHumas && (
            <button
              onClick={() => handleOpenWorkModal(item)}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 border border-teal-200 transition-colors cursor-pointer"
              title="Kerjakan & Kirim Draft"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Kerjakan</span>
            </button>
          )}

          {/* KEPALA HUMAS (SUPER ADMIN) ACTION */}
          {isSuperAdmin && (
            <button
              onClick={() => {
                setSelectedItem(item);
                setIsViewerOpen(true);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-colors cursor-pointer"
              title="Review & Persetujuan Content Plan"
            >
              <FileCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>{item.status === 'MENUNGGU' ? 'Review' : 'Detail'}</span>
            </button>
          )}

          {/* ADMIN HUMAS ACTIONS */}
          {isAdmin && (
            <>
              {item.status === 'DISETUJUI' && (
                <button
                  onClick={() => handlePublish(item)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-all cursor-pointer shadow-sm hover:shadow"
                  title="Tandai Sudah Tayang / Publikasikan"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Publikasi</span>
                </button>
              )}
              <button
                onClick={() => {
                  setSelectedItem(item);
                  setIsViewerOpen(true);
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
                title="Lihat Detail"
              >
                <Eye className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleOpenEdit(item)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
                title="Edit Rencana Konten"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleOpenDelete(item)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer"
                title="Hapus Content Plan"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      ),
      className: 'text-center w-40',
    },
  ];

  if (loading) {
    return (
      <AdminLayout title="Content Plan">
        <DashboardSkeleton />
      </AdminLayout>
    );
  }

  const pageTitle = isTimHumas
    ? 'Content Plan Saya'
    : isSuperAdmin
      ? 'Review & Approval Content Plan'
      : 'Manajemen Content Plan';

  const pageSubtitle = isTimHumas
    ? 'Daftar tugas pembuatan konten yang ditugaskan kepada Anda. Lengkapi visual, caption, dan link sebelum mengirim untuk review.'
    : isSuperAdmin
      ? 'Tinjau konten yang telah diselesaikan oleh PIC dan berikan persetujuan atau instruksi revisi.'
      : 'Kelola perencanaan konten, tentukan PIC Tim Humas, pantau progres pengerjaan, dan kelola publikasi konten.';

  return (
    <AdminLayout title={pageTitle}>
      {/* Header Banner & Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">{pageTitle}</h1>
            <p className="text-xs text-slate-400 mt-0.5">{pageSubtitle}</p>
          </div>
          {/* Tombol Tambah HANYA untuk Admin Humas */}
          {isAdmin && (
            <CustomButton variant="primary" icon={Plus} onClick={() => setIsCreateOpen(true)}>
              Tambah Content Plan
            </CustomButton>
          )}
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
                { value: 'DITUGASKAN', label: 'Ditugaskan' },
                { value: 'DALAM_PENGERJAAN', label: 'Sedang Dikerjakan' },
                { value: 'MENUNGGU_VERIFIKASI_ADMIN', label: 'Menunggu Verifikasi Admin' },
                { value: 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS', label: 'Menunggu Persetujuan' },
                { value: 'REVISI', label: 'Perlu Revisi' },
                { value: 'DISETUJUI', label: 'Disetujui' },
                { value: 'PUBLISHED', label: 'Sudah Tayang' },
                { value: 'DIBATALKAN', label: 'Dibatalkan' },
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
        <DataTable
          columns={columns}
          data={paginatedContents}
          emptyMessage={isTimHumas ? 'Belum ada tugas content plan yang diberikan kepada Anda.' : 'Tidak ada content plan aktif.'}
        />
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages || 1}
          totalItems={filteredContents.length}
          onPageChange={setCurrentPage}
          itemName="konten"
        />
      </div>

      {/* ── MODAL 1: Detail & Review Modal ───────────────────── */}
      <CustomModal
        isOpen={isViewerOpen}
        onClose={() => setIsViewerOpen(false)}
        title={isSuperAdmin ? 'Review & Persetujuan Content Plan' : 'Detail Content Plan'}
        subtitle={selectedItem ? `ID: #${selectedItem.id} • ${selectedItem.title}` : ''}
        maxWidth="2xl"
      >
        {selectedItem && (() => {
          const isWaitingAdmin = selectedItem.status === 'MENUNGGU_VERIFIKASI_ADMIN' || selectedItem.status === 'MENUNGGU';
          const isWaitingSuperAdmin = selectedItem.status === 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS' || selectedItem.status === 'MENUNGGU';
          const isApproved = selectedItem.status === 'DISETUJUI' || selectedItem.status === 'SELESAI';
          const canWork = selectedItem.status === 'DITUGASKAN' || selectedItem.status === 'DALAM_PENGERJAAN' || selectedItem.status === 'REVISI' || selectedItem.status === 'PROSES' || selectedItem.status === 'DRAFT';

          return (
            <div className="space-y-5">
              {/* Banner Panduan Verifikasi Admin Humas */}
              {isWaitingAdmin && isAdmin && (
                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-start gap-2.5">
                  <FileCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-amber-800">Menunggu Verifikasi Admin Humas</p>
                    <p className="text-amber-700 mt-0.5 leading-relaxed">
                      Periksa kelengkapan <strong>Visual Preview</strong>, <strong>Link Google Drive</strong>, dan <strong>Caption</strong> di bawah ini. Jika sudah lengkap, klik tombol <strong>"Verifikasi Lengkap & Ajukan ke Kepala Humas"</strong> di bagian bawah.
                    </p>
                  </div>
                </div>
              )}

              {/* Alert jika ada catatan revisi dari Kepala Humas / Admin */}
              {selectedItem.revisionNote && (
                <div className="p-3.5 bg-rose-50 rounded-xl border border-rose-200 text-xs text-rose-900">
                  <p className="font-bold flex items-center gap-1.5 mb-1 text-rose-700">
                    <RotateCcw className="w-4 h-4 text-rose-600" />
                    Catatan Revisi / Perbaikan:
                  </p>
                  <p className="leading-relaxed pl-5.5">{selectedItem.revisionNote}</p>
                </div>
              )}

              {/* Alert jika ada catatan verifikasi Admin */}
              {selectedItem.adminNotes && (
                <div className="p-3.5 bg-sky-50 rounded-xl border border-sky-200 text-xs text-sky-900">
                  <p className="font-bold flex items-center gap-1.5 mb-1 text-sky-700">
                    <CheckCircle2 className="w-4 h-4 text-sky-600" />
                    Catatan Verifikasi Admin Humas:
                  </p>
                  <p className="leading-relaxed pl-5.5">{selectedItem.adminNotes}</p>
                </div>
              )}

              {/* Creator and Status Info Header */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center gap-3">
                  <UserAvatar src={selectedItem.picAvatar} name={selectedItem.picName} size="md" />
                  <div>
                    <h4 className="font-bold text-sm text-slate-800">{selectedItem.title}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      PIC Kreator: <strong className="text-slate-700">{selectedItem.picName}</strong> ({selectedItem.picRole || 'Tim Humas'})
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {getPlatformBadge(selectedItem.platform)}
                  <span className="bg-teal-50 text-teal-700 border border-teal-200 text-xs font-bold px-2 py-0.5 rounded">
                    {selectedItem.contentType}
                  </span>
                  {getWorkflowBadge(selectedItem)}
                </div>
              </div>

              {/* Deadline & Kegiatan Terkait */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs text-slate-700 p-1">
                <div className="flex items-center gap-2.5">
                  <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                  <span><strong>Deadline Tayang:</strong> {formatDateID(selectedItem.deadline)} (⏰ {selectedItem.time})</span>
                </div>
                {selectedItem.category && (
                  <div className="flex items-center gap-2.5">
                    <Tag className="w-4 h-4 text-amber-600 shrink-0" />
                    <span><strong>Terkait Kegiatan:</strong> {selectedItem.category}</span>
                  </div>
                )}
              </div>

              {/* Link Video / Google Drive Link */}
              {selectedItem.videoUrl ? (
                <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200">
                  <h5 className="text-xs font-bold text-sky-800 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                    <ExternalLink className="w-4 h-4 text-sky-600" />
                    Link Hasil Konten (Google Drive / Video URL)
                  </h5>
                  <a
                    href={selectedItem.videoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-sky-700 hover:text-sky-900 break-all underline font-semibold flex items-center gap-1.5"
                  >
                    {selectedItem.videoUrl}
                  </a>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 italic">
                  Belum ada link hasil konten / Google Drive diunggah oleh PIC Kreator.
                </div>
              )}

              {/* Thumbnail / Poster Preview */}
              <div>
                <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Visual / Thumbnail Preview</h5>
                <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 max-h-[260px] flex items-center justify-center min-h-[140px]">
                  {isValidImageSrc(selectedItem.mediaUrl) ? (
                    <img src={selectedItem.mediaUrl} alt={selectedItem.title} className="w-full max-h-[260px] object-contain" />
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
                  {selectedItem.caption || 'Caption belum dilengkapi oleh PIC Kreator.'}
                </div>
              </div>

              {/* Role Specific Actions Toolbar */}
              <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-end gap-2.5">
                <CustomButton variant="outline" size="sm" onClick={() => setIsViewerOpen(false)}>
                  Tutup
                </CustomButton>

                {/* TIM HUMAS ACTIONS */}
                {isTimHumas && canWork && (
                  <CustomButton
                    variant="primary"
                    size="sm"
                    icon={Edit3}
                    onClick={() => {
                      setIsViewerOpen(false);
                      handleOpenWorkModal(selectedItem);
                    }}
                  >
                    Kerjakan / Edit Draft
                  </CustomButton>
                )}

                {/* ADMIN ACTIONS */}
                {isAdmin && (
                  <>
                    {isWaitingAdmin && (
                      <CustomButton
                        variant="secondary"
                        size="sm"
                        icon={ClipboardCheck}
                        onClick={() => {
                          setIsViewerOpen(false);
                          router.push('/verifikasi-kegiatan');
                        }}
                      >
                        Buka Menu Verifikasi Kelengkapan
                      </CustomButton>
                    )}
                    {isApproved && (
                      <CustomButton
                        variant="primary"
                        size="sm"
                        icon={CheckCircle2}
                        onClick={() => handlePublish(selectedItem)}
                        disabled={submitting}
                      >
                        Tandai Sudah Dipublikasikan
                      </CustomButton>
                    )}
                  </>
                )}

                {/* KEPALA HUMAS / SUPER ADMIN ACTIONS */}
                {isSuperAdmin && (
                  <>
                    {isWaitingSuperAdmin && (
                      <>
                        <CustomButton
                          variant="danger-outline"
                          size="sm"
                          icon={XCircle}
                          onClick={() => handleCancelContent(selectedItem)}
                          disabled={submitting}
                        >
                          Batalkan Konten
                        </CustomButton>
                        <CustomButton
                          variant="secondary"
                          size="sm"
                          icon={RotateCcw}
                          onClick={() => {
                            setIsViewerOpen(false);
                            handleOpenRevisionModal(selectedItem);
                          }}
                          disabled={submitting}
                        >
                          Minta Revisi
                        </CustomButton>
                        <CustomButton
                          variant="primary"
                          size="sm"
                          icon={CheckCircle2}
                          onClick={() => handleApproveFinal(selectedItem)}
                          disabled={submitting}
                        >
                          Setujui Content Plan
                        </CustomButton>
                      </>
                    )}
                    {isApproved && (
                      <CustomButton
                        variant="primary"
                        size="sm"
                        icon={CheckCircle2}
                        onClick={() => handlePublish(selectedItem)}
                        disabled={submitting}
                      >
                        Publikasikan (Sudah Tayang)
                      </CustomButton>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })()}
      </CustomModal>

      {/* ── MODAL 2: PIC Work / Submission Modal ─────────────── */}
      <CustomModal
        isOpen={isWorkModalOpen}
        onClose={() => setIsWorkModalOpen(false)}
        title="Pengerjaan & Pengiriman Konten"
        subtitle={selectedItem ? `Tugas: "${selectedItem.title}"` : ''}
        maxWidth="lg"
      >
        {selectedItem && (
          <div className="space-y-4">
            {/* Task Info Summary */}
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2">
                {getPlatformBadge(selectedItem.platform)}
                <span className="font-bold text-slate-700">{selectedItem.contentType}</span>
                {selectedItem.category && (
                  <span className="bg-amber-50 text-amber-700 text-[10px] px-2 py-0.5 rounded border border-amber-200">
                    {selectedItem.category}
                  </span>
                )}
              </div>
              <div className="text-slate-600">
                Deadline: <strong>{formatDateID(selectedItem.deadline)}</strong> (⏰ {selectedItem.time})
              </div>
            </div>

            {selectedItem.revisionNote && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                <p className="font-bold mb-0.5">Catatan Revisi dari Kepala Humas:</p>
                <p>{selectedItem.revisionNote}</p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Link Hasil Konten (Google Drive / Video Link) *
              </label>
              <input
                type="url"
                value={workForm.videoUrl}
                onChange={(e) => setWorkForm({ ...workForm, videoUrl: e.target.value })}
                placeholder="https://drive.google.com/drive/folders/... atau https://youtu.be/..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-mono"
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Pastikan link Google Drive atau video dapat diakses oleh reviewer.
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Link Gambar Poster / Thumbnail Preview (Opsional)
              </label>
              <input
                type="url"
                value={workForm.thumbnailUrl}
                onChange={(e) => setWorkForm({ ...workForm, thumbnailUrl: e.target.value })}
                placeholder="https://images.unsplash.com/... atau link gambar publik"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Draft Caption & Copywriting *
              </label>
              <textarea
                rows={5}
                value={workForm.caption}
                onChange={(e) => setWorkForm({ ...workForm, caption: e.target.value })}
                placeholder="Tuliskan teks caption lengkap beserta hashtag dan mention..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all leading-relaxed"
              />
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <CustomButton
                type="button"
                variant="outline"
                onClick={() => setIsWorkModalOpen(false)}
                disabled={submitting}
              >
                Batal
              </CustomButton>
              <CustomButton
                type="button"
                variant="secondary"
                onClick={() => handleSubmitWork(false)}
                disabled={submitting}
              >
                Simpan Progress
              </CustomButton>
              <CustomButton
                type="button"
                variant="primary"
                icon={Send}
                onClick={() => handleSubmitWork(true)}
                disabled={submitting}
              >
                {selectedItem.status === 'REVISI' ? 'Kirim Ulang untuk Review' : 'Kirim untuk Review'}
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>

      {/* ── MODAL 3: Revision Dialog (Kepala Humas Minta Revisi) ── */}
      <CustomModal
        isOpen={isRevisionOpen}
        onClose={() => setIsRevisionOpen(false)}
        title="Minta Revisi Konten"
        subtitle={selectedItem ? `Konten: "${selectedItem.title}"` : ''}
        maxWidth="md"
      >
        <form onSubmit={handleSubmitRevision} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan Revisi dari Kepala Humas *
            </label>
            <textarea
              rows={4}
              required
              value={revisionText}
              onChange={(e) => setRevisionText(e.target.value)}
              placeholder="Jelaskan secara detail bagian visual, caption, atau jadwal yang harus diperbaiki oleh PIC..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <CustomButton type="button" variant="outline" onClick={() => setIsRevisionOpen(false)}>
              Batal
            </CustomButton>
            <CustomButton type="submit" variant="primary" disabled={submitting}>
              Kirim Catatan Revisi
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* ── MODAL 3B: Admin Humas Verifikasi & Ajukan ke Kepala Humas ── */}
      <CustomModal
        isOpen={isVerifyAdminOpen}
        onClose={() => setIsVerifyAdminOpen(false)}
        title="Verifikasi Lengkap & Ajukan ke Kepala Humas"
        subtitle={selectedItem ? `Konten: "${selectedItem.title}"` : ''}
        maxWidth="md"
      >
        <form onSubmit={handleSubmitVerifyAdmin} className="space-y-4">
          <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-xs text-teal-800">
            <p className="font-bold mb-1">Konfirmasi Verifikasi Admin:</p>
            <p>Pastikan Anda telah memeriksa Visual Preview, Link Google Drive, dan Caption dari PIC Kreator sebelum mengajukan ke Kepala Humas.</p>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan Verifikasi Admin (Opsional)
            </label>
            <textarea
              rows={3}
              value={adminNotesText}
              onChange={(e) => setAdminNotesText(e.target.value)}
              placeholder="Contoh: Visual dan caption sudah diperiksa, siap disetujui Kepala Humas..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <CustomButton type="button" variant="outline" onClick={() => setIsVerifyAdminOpen(false)}>
              Batal
            </CustomButton>
            <CustomButton type="submit" variant="primary" icon={Send} disabled={submitting}>
              Ajukan ke Kepala Humas
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* ── MODAL 3C: Admin Humas Kembalikan untuk Perbaikan ── */}
      <CustomModal
        isOpen={isRequestFixOpen}
        onClose={() => setIsRequestFixOpen(false)}
        title="Kembalikan untuk Perbaikan Internal"
        subtitle={selectedItem ? `PIC: ${selectedItem.picName} • "${selectedItem.title}"` : ''}
        maxWidth="md"
      >
        <form onSubmit={handleSubmitRequestFix} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Catatan Perbaikan dari Admin Humas *
            </label>
            <textarea
              rows={4}
              required
              value={fixNotesText}
              onChange={(e) => setFixNotesText(e.target.value)}
              placeholder="Jelaskan bagian visual, copywriting, atau link yang belum lengkap atau perlu diperbaiki oleh PIC..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
          </div>
          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <CustomButton type="button" variant="outline" onClick={() => setIsRequestFixOpen(false)}>
              Batal
            </CustomButton>
            <CustomButton type="submit" variant="secondary" icon={RotateCcw} disabled={submitting}>
              Kembalikan ke PIC
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* ── MODAL 4: Create Content Plan (Admin Humas) ───────── */}
      <CustomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Tambah Content Plan Baru"
        subtitle="Rencanakan konten editorial, platform, deadline, dan tentukan PIC."
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
              placeholder="Contoh: Dokumentasi PKKMB 2026"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Platform *</label>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Terkait Kegiatan (Opsional)</label>
            <select
              value={formData.activityName}
              onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer"
            >
              <option value="">-- Tidak Terkait Kegiatan Tertentu --</option>
              {activities.map((act) => (
                <option key={act.id} value={act.title}>
                  {act.title} ({act.category || 'Kegiatan'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Deadline Tayang *</label>
              <input
                type="date"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jam Publish</label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">PIC / Creator *</label>
              <select
                value={formData.picId}
                onChange={(e) => setFormData({ ...formData, picId: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer font-semibold"
              >
                {picOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.role === 'USER' ? 'Anggota Tim Humas' : 'Admin Humas'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Brief / Deskripsi Konten</label>
            <textarea
              rows={3}
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              placeholder="Tuliskan arahan konsep konten atau draft caption awal..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <CustomButton type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Batal
            </CustomButton>
            <CustomButton type="submit" variant="primary" disabled={submitting}>
              Simpan Content Plan
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* ── MODAL 5: Edit Content Plan (Admin Humas) ─────────── */}
      <CustomModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Content Plan"
        subtitle="Perbarui jadwal, platform, jenis, kegiatan terkait, atau ubah PIC."
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Platform *</label>
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Terkait Kegiatan (Opsional)</label>
            <select
              value={formData.activityName}
              onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer"
            >
              <option value="">-- Tidak Terkait Kegiatan Tertentu --</option>
              {activities.map((act) => (
                <option key={act.id} value={act.title}>
                  {act.title} ({act.category || 'Kegiatan'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Deadline Tayang *</label>
              <input
                type="date"
                required
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Jam Publish</label>
              <input
                type="time"
                required
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">PIC / Creator *</label>
              <select
                value={formData.picId}
                onChange={(e) => setFormData({ ...formData, picId: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all cursor-pointer font-semibold"
              >
                {picOptions.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.role === 'USER' ? 'Anggota Tim Humas' : 'Admin Humas'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Caption / Copywriting</label>
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
            <CustomButton type="submit" variant="primary" disabled={submitting}>
              Simpan Perubahan
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* ── MODAL 6: Delete Confirmation Modal ──────────────── */}
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
              Tindakan ini akan menghapus content plan dari database.
            </p>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <CustomButton variant="outline" onClick={() => setIsDeleteOpen(false)}>
              Batal
            </CustomButton>
            <CustomButton variant="danger" onClick={handleDeleteConfirm} disabled={submitting}>
              Ya, Hapus
            </CustomButton>
          </div>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
