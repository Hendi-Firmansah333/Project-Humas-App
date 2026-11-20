'use client';

import React, { useState, useEffect, useRef } from 'react';
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
  CustomDatePicker,
  CustomTimePicker,
  TableSkeleton,
} from '@/components/common';
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
  Tag,
  Smartphone,
} from 'lucide-react';
import { formatDateID, isValidImageSrc } from '@/utils/formatters';
import { toast } from 'sonner';
import { contentService, userService, activityService } from '@/services';
import { contentPlanToItem, getFileViewUrl } from '@/utils/api-helpers';
import { User, Activity } from '@/types';

interface ContentItem {
  id: number;
  title: string;
  platform: string;
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
  rawMaterialUrl?: string;
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

const DEFAULT_PLATFORM_SUGGESTIONS = [
  'Instagram',
  'TikTok',
  'YouTube',
  'Website',
  'Facebook',
];

const PLATFORM_OPTIONS = [
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'TIKTOK', label: 'TikTok' },
  { value: 'YOUTUBE', label: 'YouTube' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'FACEBOOK', label: 'Facebook' },
];

function formatPlatformLabel(raw?: string): string {
  if (!raw) return '';
  const upper = raw.trim().toUpperCase();
  switch (upper) {
    case 'INSTAGRAM':
      return 'Instagram';
    case 'TIKTOK':
      return 'TikTok';
    case 'YOUTUBE':
      return 'YouTube';
    case 'WEBSITE':
      return 'Website';
    case 'FACEBOOK':
      return 'Facebook';
    default:
      return raw.trim();
  }
}

function normalizePlatformValue(raw?: string): string {
  if (!raw || !raw.trim()) return 'INSTAGRAM';
  const trimmed = raw.trim();
  const upper = trimmed.toUpperCase();
  if (['INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'WEBSITE', 'FACEBOOK'].includes(upper)) {
    return upper;
  }
  return trimmed;
}

const labelCls = 'block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5';
const inputCls =
  'w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#003D58] focus:ring-1 focus:ring-[#003D58]/25 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all';
const selectCls =
  'w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#003D58] focus:ring-1 focus:ring-[#003D58]/25 rounded-[8px] px-3 text-[12px] text-[#334155] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all';
const textareaCls =
  'w-full min-h-[70px] bg-white border border-[#E2E8F0] focus:border-[#003D58] focus:ring-1 focus:ring-[#003D58]/25 rounded-[8px] p-3 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all resize-none';

interface SuggestInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  historyItems: string[];
  defaultItems: string[];
  required?: boolean;
}

function SuggestInput({
  value,
  onChange,
  placeholder,
  historyItems,
  defaultItems,
  required = false,
}: SuggestInputProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, []);

  // Build deduplicated suggestions with history items prioritized at the top
  const allSuggestions = React.useMemo(() => {
    const seen = new Set<string>();
    const list: { label: string; isHistory: boolean }[] = [];

    for (const item of historyItems) {
      const clean = (item || '').trim();
      if (!clean) continue;
      const key = clean.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ label: clean, isHistory: true });
      }
    }

    for (const item of defaultItems) {
      const clean = (item || '').trim();
      if (!clean) continue;
      const key = clean.toLowerCase();
      if (!seen.has(key)) {
        seen.add(key);
        list.push({ label: clean, isHistory: false });
      }
    }

    return list;
  }, [historyItems, defaultItems]);

  const query = (value || '').trim().toLowerCase();
  const filtered = React.useMemo(() => {
    if (!query) return allSuggestions;
    const matches = allSuggestions.filter((s) => s.label.toLowerCase().includes(query));
    return matches;
  }, [allSuggestions, query]);

  return (
    <div className="relative" ref={wrapperRef}>
      <input
        type="text"
        required={required}
        autoComplete="off"
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        placeholder={placeholder}
        className={inputCls}
      />
      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-50 max-h-48 overflow-y-auto divide-y divide-slate-100">
          <div className="px-3 py-1 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
            <span>Rekomendasi</span>
            <span className="font-normal text-slate-400">Klik untuk memilih</span>
          </div>
          {filtered.map((item) => (
            <button
              key={item.label}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(item.label);
                setOpen(false);
              }}
              className="w-full text-left px-3 py-2 text-[12px] text-slate-700 hover:bg-sky-50 hover:text-[#003D58] transition-colors flex items-center justify-between cursor-pointer"
            >
              <span className="font-medium truncate">{item.label}</span>
              {item.isHistory && (
                <span className="shrink-0 ml-2 px-1.5 py-0.5 rounded text-[9px] font-semibold bg-blue-50 text-[#003D58] border border-blue-200">
                  Pernah Diketik
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
  const isInitializingRef = useRef(false);

  // Modals state
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [isWorkModalOpen, setIsWorkModalOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRevisionOpen, setIsRevisionOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [revisionText, setRevisionText] = useState('');

  // Work modal form state (for PIC Creator)
  const [workForm, setWorkForm] = useState({
    caption: '',
    videoUrl: '',
    thumbnailUrl: '',
  });

  // Admin Create / Edit Form state
  const [formData, setFormData] = useState({
    title: '',
    platform: '' as ContentItem['platform'],
    contentType: '',
    activityName: '',
    deadline: new Date().toISOString().split('T')[0],
    time: '16:00',
    picId: 0,
    rawMaterialUrl: '',
    caption: '',
    status: 'DITUGASKAN' as ContentItem['status'],
  });

  // Saved history of typed platforms & content types for smart recommendations
  const [typedPlatforms, setTypedPlatforms] = useState<string[]>([]);
  const [typedContentTypes, setTypedContentTypes] = useState<string[]>([]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const sp = localStorage.getItem('humas_typed_platforms_v1');
        if (sp) setTypedPlatforms(JSON.parse(sp));
        const sc = localStorage.getItem('humas_typed_content_types_v1');
        if (sc) setTypedContentTypes(JSON.parse(sc));
      } catch {
        // ignore
      }
    }
  }, []);

  const recordTypedValues = (plat: string, cType: string) => {
    const cleanPlat = formatPlatformLabel(plat);
    const cleanType = (cType || '').trim();

    if (cleanPlat) {
      setTypedPlatforms((prev) => {
        const next = [
          cleanPlat,
          ...prev.filter((p) => p.toLowerCase() !== cleanPlat.toLowerCase()),
        ].slice(0, 20);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('humas_typed_platforms_v1', JSON.stringify(next));
          } catch {}
        }
        return next;
      });
    }

    if (cleanType) {
      setTypedContentTypes((prev) => {
        const next = [
          cleanType,
          ...prev.filter((t) => t.toLowerCase() !== cleanType.toLowerCase()),
        ].slice(0, 20);
        if (typeof window !== 'undefined') {
          try {
            localStorage.setItem('humas_typed_content_types_v1', JSON.stringify(next));
          } catch {}
        }
        return next;
      });
    }
  };

  // Combine localStorage history + existing database items
  const platformHistorySuggestions = React.useMemo(() => {
    const fromDb = contents.map((c) => formatPlatformLabel(c.platform)).filter(Boolean);
    return [...typedPlatforms, ...fromDb];
  }, [typedPlatforms, contents]);

  const contentTypeHistorySuggestions = React.useMemo(() => {
    const fromDb = contents.map((c) => (c.contentType || '').trim()).filter(Boolean);
    return [...typedContentTypes, ...fromDb];
  }, [typedContentTypes, contents]);

  const isSuperAdmin = currentUser?.role === 'SUPER_ADMIN'; // Kepala Humas
  const isAdmin = currentUser?.role === 'ADMIN' || (!isSuperAdmin && currentUser?.role !== 'USER'); // Admin Humas
  const isTimHumas = currentUser?.role === 'USER'; // PIC / Anggota Tim Humas

  const picOptions = users.filter((u) => u.role === 'USER' && u.status === 'AKTIF');

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

  const normalizeOptionalUrl = (raw: string) => {
    const trimmed = raw.trim();
    if (!trimmed) return '';
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  useEffect(() => {
    if (isInitializingRef.current) return;
    isInitializingRef.current = true;

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
          activityService.getAll({ page: 1, pageSize: 20 }).catch(() => ({ items: [] })),
        ]);
        const userList = Array.isArray(staff) ? staff : [];
        setUsers(userList);
        setActivities(actRes?.items || []);
        const creators = userList.filter((u) => u.role === 'USER' && u.status === 'AKTIF');
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
        toast.success(`Hasil konten "${selectedItem.title}" berhasil dikirim untuk persetujuan Kepala Humas!`);
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

  // 8. Admin Humas: Open Create Modal with clean empty form
  const handleOpenCreate = () => {
    setSelectedItem(null);
    setFormData({
      title: '',
      platform: '',
      contentType: '',
      activityName: '',
      deadline: new Date().toISOString().split('T')[0],
      time: '16:00',
      picId: picOptions[0]?.id || 0,
      rawMaterialUrl: '',
      caption: '',
      status: 'DITUGASKAN',
    });
    setIsCreateOpen(true);
  };

  // 8B. Admin Humas: Edit Content Modal
  const handleOpenEdit = (item: ContentItem) => {
    setSelectedItem(item);
    const rawTime = (item.time || '16:00').replace(' WIB', '');
    const rawDate = item.deadline ? new Date(item.deadline).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
    const matchingUser = users.find((u) => u.fullName === item.picName || u.id === item.picId);

    setFormData({
      title: item.title,
      platform: formatPlatformLabel(item.platform),
      contentType: item.contentType,
      activityName: item.category || '',
      deadline: rawDate,
      time: rawTime,
      picId: matchingUser?.id || picOptions[0]?.id || 0,
      rawMaterialUrl: item.rawMaterialUrl || '',
      caption: item.caption,
      status: item.status,
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;
    if (!formData.platform.trim()) {
      toast.error('Harap isi platform konten!');
      return;
    }
    if (!formData.contentType.trim()) {
      toast.error('Harap isi jenis konten!');
      return;
    }

    const deadlineDate = new Date(formData.deadline);
    const timeMatch = formData.time.match(/(\d{2}):(\d{2})/);
    if (timeMatch) {
      deadlineDate.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), 0, 0);
    }
    const deadlineIso = deadlineDate.toISOString();
    const normalizedPlat = normalizePlatformValue(formData.platform);
    const cleanType = formData.contentType.trim();

    setSubmitting(true);
    try {
      await contentService.update(selectedItem.id, {
        title: formData.title,
        platform: normalizedPlat as any,
        contentType: cleanType,
        category: formData.activityName || undefined,
        picId: formData.picId || resolvePicId(),
        deadline: deadlineIso,
        status: formData.status as any,
        rawMaterialUrl: normalizeOptionalUrl(formData.rawMaterialUrl),
        description: formData.caption,
      });
      recordTypedValues(formData.platform, cleanType);
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
    if (!formData.title.trim()) {
      toast.error('Harap lengkapi judul konten!');
      return;
    }
    if (!formData.platform.trim()) {
      toast.error('Harap isi platform konten!');
      return;
    }
    if (!formData.contentType.trim()) {
      toast.error('Harap isi jenis konten!');
      return;
    }

    const deadlineDate = new Date(formData.deadline);
    const timeMatch = formData.time.match(/(\d{2}):(\d{2})/);
    if (timeMatch) {
      deadlineDate.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), 0, 0);
    }
    const deadlineIso = deadlineDate.toISOString();
    const normalizedPlat = normalizePlatformValue(formData.platform);
    const cleanType = formData.contentType.trim();

    setSubmitting(true);
    try {
      await contentService.create({
        title: formData.title.trim(),
        platform: normalizedPlat as any,
        contentType: cleanType,
        category: formData.activityName || undefined,
        picId: formData.picId || resolvePicId(),
        deadline: deadlineIso,
        status: 'PROSES', // Status DITUGASKAN
        rawMaterialUrl: normalizeOptionalUrl(formData.rawMaterialUrl) || undefined,
        description: formData.caption || '',
      });
      recordTypedValues(formData.platform, cleanType);
      setIsCreateOpen(false);
      setFormData({
        title: '',
        platform: '',
        contentType: '',
        activityName: '',
        deadline: new Date().toISOString().split('T')[0],
        time: '16:00',
        picId: picOptions[0]?.id || 0,
        rawMaterialUrl: '',
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
    switch ((platform || '').toUpperCase()) {
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
      case 'MENUNGGU_VERIFIKASI_ADMIN':
      case 'MENUNGGU':
        return <StatusBadge status="MENUNGGU_PERSETUJUAN_KEPALA_HUMAS" />;
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
            <span className="bg-blue-50 text-[#003D58] text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
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
          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1">{item.caption}</p>
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
          <p className="text-slate-600 text-[11px] mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3 text-slate-500" /> {item.time}</p>
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
            <p className="text-[10px] text-slate-600">{item.picRole || 'Tim Humas'}</p>
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
          className="group relative w-16 h-11 rounded-lg overflow-hidden border border-slate-200 shadow-2xs hover:border-[#003D58] transition-all cursor-pointer mx-auto block"
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
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-blue-50 text-[#003D58] hover:bg-blue-100 border border-blue-200 transition-colors cursor-pointer"
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
              <span>
                {item.status === 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS' ||
                item.status === 'MENUNGGU' ||
                item.status === 'MENUNGGU_VERIFIKASI_ADMIN'
                  ? 'Review'
                  : 'Detail'}
              </span>
            </button>
          )}

          {/* ADMIN HUMAS ACTIONS */}
          {isAdmin && (
            <>
              {item.status === 'DISETUJUI' && (
                <button
                  onClick={() => handlePublish(item)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-[#003D58] text-white hover:bg-[#002F44] active:bg-[#00263A] transition-all cursor-pointer shadow-xs shadow-[#003D58]/25"
                  title="Tandai Sudah Tayang / Publikasikan"
                >
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Publikasi</span>
                </button>
              )}
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
        <TableSkeleton rows={5} />
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
            <p className="text-xs text-slate-600 mt-0.5">{pageSubtitle}</p>
          </div>
          {/* Tombol Tambah HANYA untuk Admin Humas */}
          {isAdmin && (
            <CustomButton variant="primary" icon={Plus} onClick={handleOpenCreate}>
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
        maxWidth="3xl"
      >
        {selectedItem && (() => {
          const isWaitingSuperAdmin =
            selectedItem.status === 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS' ||
            selectedItem.status === 'MENUNGGU' ||
            selectedItem.status === 'MENUNGGU_VERIFIKASI_ADMIN';
          const isApproved = selectedItem.status === 'DISETUJUI' || selectedItem.status === 'SELESAI';
          const canWork = selectedItem.status === 'DITUGASKAN' || selectedItem.status === 'DALAM_PENGERJAAN' || selectedItem.status === 'REVISI' || selectedItem.status === 'PROSES' || selectedItem.status === 'DRAFT';

          return (
            <div className="space-y-4">

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
                  <span className="bg-blue-50 text-[#003D58] border border-blue-200 text-xs font-bold px-2.5 py-0.5 rounded">
                    {selectedItem.contentType}
                  </span>
                  {getWorkflowBadge(selectedItem)}
                </div>
              </div>

              {/* Main Content: 2-Kolom Layout (Kiri: Preview Portrait Mockup 9:16, Kanan: Metadata & Copywriting) */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-stretch pt-1">
                {/* Kolom Kiri: Visual / Thumbnail Preview Portrait Mockup */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <div className="w-full flex items-center justify-between mb-2">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5 text-[#003D58]" />
                      Preview Visual
                    </h5>
                    <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-2 py-0.5 rounded border border-sky-200">
                      9:16 Portrait
                    </span>
                  </div>

                  <div className="w-full flex-1 flex items-center justify-center p-3 bg-slate-50/80 rounded-2xl border border-slate-200 min-h-[360px]">
                    <div className="relative w-[200px] sm:w-[220px] aspect-[9/16] rounded-[26px] overflow-hidden bg-slate-950 border-[5px] border-slate-800 shadow-xl flex flex-col items-center justify-center ring-1 ring-slate-900/10">
                      {/* Dynamic Island / Speaker notch */}
                      <div className="absolute top-2.5 w-14 h-1.5 bg-slate-800 rounded-full z-20 shadow-xs" />

                      {isValidImageSrc(selectedItem.mediaUrl) ? (
                        <a
                          href={selectedItem.mediaUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group relative w-full h-full block cursor-zoom-in"
                          title="Klik untuk membuka ukuran penuh"
                        >
                          <img
                            src={selectedItem.mediaUrl}
                            alt={selectedItem.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 text-white text-xs font-medium backdrop-blur-[1px]">
                            <Eye className="w-4 h-4" /> Buka Penuh
                          </div>
                        </a>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-2.5 text-slate-400 p-4 text-center select-none">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shadow-inner">
                            <ImageIcon className="w-6 h-6 text-[#51FCE4]" />
                          </div>
                          <p className="text-xs font-semibold text-slate-200">Belum Ada Visual</p>
                          <p className="text-[11px] text-slate-400 leading-snug px-1">
                            File preview visual belum diunggah oleh PIC Kreator.
                          </p>
                          <span className="text-[10px] text-slate-500 font-mono mt-1 bg-white/5 px-2 py-0.5 rounded border border-white/10">
                            Format 9:16 (Portrait)
                          </span>
                        </div>
                      )}

                      {/* Home indicator bar */}
                      <div className="absolute bottom-2 w-16 h-1 bg-white/20 rounded-full z-20" />
                    </div>
                  </div>
                </div>

                {/* Kolom Kanan: Detail Jadwal, Link Drive, dan Caption & Copywriting */}
                <div className="md:col-span-7 flex flex-col gap-3.5 justify-between">
                  {/* Deadline & Kegiatan Terkait */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs text-slate-700">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-[#003D58] shrink-0" />
                      <span className="flex items-center gap-1.5 flex-wrap">
                        <strong>Deadline Tayang:</strong> {formatDateID(selectedItem.deadline)}
                        <span className="inline-flex items-center gap-1 text-slate-600 font-normal">
                          <Clock className="w-3 h-3 text-slate-500" /> {selectedItem.time}
                        </span>
                      </span>
                    </div>
                    {selectedItem.category && (
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-amber-600 shrink-0" />
                        <span><strong>Terkait Kegiatan:</strong> {selectedItem.category}</span>
                      </div>
                    )}
                  </div>

                  {/* Link Bahan Mentahan (jika disediakan Admin) */}
                  {selectedItem.rawMaterialUrl && (
                    <div>
                      <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                        <ExternalLink className="w-3.5 h-3.5 text-amber-600" />
                        Link Bahan Mentahan
                      </h5>
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between gap-2">
                        <span className="text-xs text-amber-900 font-semibold truncate max-w-[220px] sm:max-w-xs">
                          {selectedItem.rawMaterialUrl}
                        </span>
                        <a
                          href={getFileViewUrl(selectedItem.rawMaterialUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors shrink-0"
                        >
                          Buka Bahan <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Link Video / Google Drive Link */}
                  <div>
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                      <ExternalLink className="w-3.5 h-3.5 text-[#003D58]" />
                      Link Hasil Konten (Google Drive)
                    </h5>
                    {selectedItem.videoUrl ? (
                      <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 flex items-center justify-between gap-2">
                        <span className="text-xs text-sky-800 font-semibold truncate max-w-[220px] sm:max-w-xs">
                          {selectedItem.videoUrl}
                        </span>
                        <a
                          href={selectedItem.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-3 py-1 bg-sky-600 text-white rounded-lg text-xs font-bold hover:bg-sky-700 transition-colors shrink-0"
                        >
                          Buka Drive <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-600 italic">
                        Belum ada link hasil konten / Google Drive diunggah oleh PIC Kreator.
                      </div>
                    )}
                  </div>

                  {/* Caption & Copywriting */}
                  <div className="flex-1 flex flex-col min-h-[140px]">
                    <h5 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Caption & Copywriting
                    </h5>
                    <div className="flex-1 min-h-[140px] max-h-[220px] overflow-y-auto p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap">
                      {selectedItem.caption || 'Caption belum dilengkapi oleh PIC Kreator.'}
                    </div>
                  </div>
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
        maxWidth="xl"
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
              <div className="text-slate-600 flex items-center gap-1.5 flex-wrap">
                <span>Deadline: <strong>{formatDateID(selectedItem.deadline)}</strong></span>
                <span className="inline-flex items-center gap-1 text-slate-600 font-normal"><Clock className="w-3 h-3 text-slate-500" /> {selectedItem.time}</span>
              </div>
            </div>

            {selectedItem.revisionNote && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900">
                <p className="font-bold mb-0.5">Catatan Revisi dari Kepala Humas:</p>
                <p>{selectedItem.revisionNote}</p>
              </div>
            )}

            {selectedItem.rawMaterialUrl && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-xs">
                <div className="min-w-0 flex-1">
                  <p className="font-bold text-amber-900">Link Bahan Mentahan (Poster / Aset)</p>
                  <p className="text-amber-800 font-mono truncate mt-0.5">{selectedItem.rawMaterialUrl}</p>
                </div>
                <a
                  href={getFileViewUrl(selectedItem.rawMaterialUrl)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 text-white rounded-lg text-xs font-bold hover:bg-amber-700 transition-colors shrink-0"
                >
                  Buka Link <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}

            <div>
              <label className={labelCls}>
                Link Hasil Konten (Google Drive / Video Link) *
              </label>
              <input
                type="url"
                value={workForm.videoUrl}
                onChange={(e) => setWorkForm({ ...workForm, videoUrl: e.target.value })}
                placeholder="https://drive.google.com/drive/folders/... atau https://youtu.be/..."
                className={`${inputCls} font-mono`}
              />
              <p className="text-[11px] text-slate-600 mt-1">
                Pastikan link Google Drive atau video dapat diakses oleh reviewer.
              </p>
            </div>

            <div>
              <label className={labelCls}>
                Link Gambar Poster / Thumbnail Preview (Opsional)
              </label>
              <input
                type="url"
                value={workForm.thumbnailUrl}
                onChange={(e) => setWorkForm({ ...workForm, thumbnailUrl: e.target.value })}
                placeholder="https://images.unsplash.com/... atau link gambar publik"
                className={`${inputCls} font-mono`}
              />
            </div>

            <div>
              <label className={labelCls}>
                Draft Caption & Copywriting *
              </label>
              <textarea
                rows={5}
                value={workForm.caption}
                onChange={(e) => setWorkForm({ ...workForm, caption: e.target.value })}
                placeholder="Tuliskan teks caption lengkap beserta hashtag dan mention..."
                className={textareaCls}
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-[#003D58]/20 focus:border-[#003D58] transition-all"
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

      {/* ── MODAL 4: Create Content Plan (Admin Humas) ───────── */}
      <CustomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Tambah Content Plan Baru"
        subtitle="Rencanakan konten editorial, platform, deadline, dan tentukan PIC."
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} autoComplete="off" className="space-y-5 text-[12px]">
          <div>
            <label className={labelCls}>Judul Konten *</label>
            <input
              type="text"
              required
              autoComplete="off"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Dokumentasi PKKMB 2026"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Platform *</label>
              <SuggestInput
                required
                value={formData.platform}
                onChange={(val) => setFormData({ ...formData, platform: val })}
                placeholder="Ketik platform (cth: Instagram, TikTok)..."
                historyItems={platformHistorySuggestions}
                defaultItems={DEFAULT_PLATFORM_SUGGESTIONS}
              />
            </div>
            <div>
              <label className={labelCls}>Jenis Konten *</label>
              <SuggestInput
                required
                value={formData.contentType}
                onChange={(val) => setFormData({ ...formData, contentType: val })}
                placeholder="Ketik jenis konten (cth: Reels, Podcast)..."
                historyItems={contentTypeHistorySuggestions}
                defaultItems={JENIS_KONTEN_OPTIONS}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Terkait Kegiatan (Opsional)</label>
            <select
              value={formData.activityName}
              onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
              className={selectCls}
            >
              <option value="">-- Tidak Terkait Kegiatan Tertentu --</option>
              {activities.map((act) => (
                <option key={act.id} value={act.title}>
                  {act.title} ({act.category || 'Kegiatan'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomDatePicker
              label="Deadline Tayang"
              required
              value={formData.deadline}
              onChange={(val) => setFormData({ ...formData, deadline: val })}
            />
            <CustomTimePicker
              label="Jam Publish"
              required
              value={formData.time}
              onChange={(val) => setFormData({ ...formData, time: val })}
            />
          </div>

          <div>
            <label className={labelCls}>PIC / Creator *</label>
            <select
              value={formData.picId}
              onChange={(e) => setFormData({ ...formData, picId: Number(e.target.value) })}
              className={selectCls}
            >
              {picOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.roleLabel || 'Anggota Tim Humas'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Link Bahan Mentahan (Opsional)</label>
            <input
              type="text"
              autoComplete="off"
              value={formData.rawMaterialUrl}
              onChange={(e) => setFormData({ ...formData, rawMaterialUrl: e.target.value })}
              placeholder="Contoh: https://drive.google.com/drive/folders/... (aset foto, video, Canva, poster)"
              className={inputCls}
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Sertakan link bahan mentahan (Google Drive, Canva, dll.) jika ada arahan edit poster, video, atau aset lainnya.
            </p>
          </div>

          <div>
            <label className={labelCls}>Brief / Deskripsi Konten</label>
            <textarea
              rows={4}
              autoComplete="off"
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              placeholder="Tuliskan arahan konsep konten atau draft caption awal..."
              className={`${textareaCls} min-h-[110px]`}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] text-[12px] font-semibold rounded-[8px] transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#003D58] hover:bg-[#002F44] active:bg-[#00263A] text-white text-[12px] font-semibold rounded-[8px] shadow-xs shadow-[#003D58]/25 transition-all cursor-pointer"
            >
              Simpan Content Plan
            </button>
          </div>
        </form>
      </CustomModal>

      {/* ── MODAL 5: Edit Content Plan (Admin Humas) ───────── */}
      <CustomModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Content Plan"
        subtitle="Perbarui jadwal, platform, jenis, kegiatan terkait, atau ubah PIC."
        maxWidth="2xl"
      >
        <form onSubmit={handleEditSubmit} autoComplete="off" className="space-y-5 text-[12px]">
          <div>
            <label className={labelCls}>Judul Konten *</label>
            <input
              type="text"
              required
              autoComplete="off"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Platform *</label>
              <SuggestInput
                required
                value={formData.platform}
                onChange={(val) => setFormData({ ...formData, platform: val })}
                placeholder="Ketik platform (cth: Instagram, TikTok)..."
                historyItems={platformHistorySuggestions}
                defaultItems={DEFAULT_PLATFORM_SUGGESTIONS}
              />
            </div>
            <div>
              <label className={labelCls}>Jenis Konten *</label>
              <SuggestInput
                required
                value={formData.contentType}
                onChange={(val) => setFormData({ ...formData, contentType: val })}
                placeholder="Ketik jenis konten (cth: Reels, Podcast)..."
                historyItems={contentTypeHistorySuggestions}
                defaultItems={JENIS_KONTEN_OPTIONS}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Terkait Kegiatan (Opsional)</label>
            <select
              value={formData.activityName}
              onChange={(e) => setFormData({ ...formData, activityName: e.target.value })}
              className={selectCls}
            >
              <option value="">-- Tidak Terkait Kegiatan Tertentu --</option>
              {activities.map((act) => (
                <option key={act.id} value={act.title}>
                  {act.title} ({act.category || 'Kegiatan'})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomDatePicker
              label="Deadline Tayang"
              required
              value={formData.deadline}
              onChange={(val) => setFormData({ ...formData, deadline: val })}
            />
            <CustomTimePicker
              label="Jam Publish"
              required
              value={formData.time}
              onChange={(val) => setFormData({ ...formData, time: val })}
            />
          </div>

          <div>
            <label className={labelCls}>PIC / Creator *</label>
            <select
              value={formData.picId}
              onChange={(e) => setFormData({ ...formData, picId: Number(e.target.value) })}
              className={selectCls}
            >
              {picOptions.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.fullName} ({u.roleLabel || 'Anggota Tim Humas'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className={labelCls}>Link Bahan Mentahan (Opsional)</label>
            <input
              type="text"
              autoComplete="off"
              value={formData.rawMaterialUrl}
              onChange={(e) => setFormData({ ...formData, rawMaterialUrl: e.target.value })}
              placeholder="Contoh: https://drive.google.com/drive/folders/... (aset foto, video, Canva, poster)"
              className={inputCls}
            />
            <p className="text-[11px] text-slate-500 mt-1">
              Sertakan link bahan mentahan (Google Drive, Canva, dll.) jika ada arahan edit poster, video, atau aset lainnya.
            </p>
          </div>

          <div>
            <label className={labelCls}>Caption / Copywriting</label>
            <textarea
              rows={4}
              value={formData.caption}
              onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
              className={`${textareaCls} min-h-[110px]`}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditOpen(false)}
              className="px-4 py-2 bg-white border border-[#E2E8F0] text-[#64748B] hover:bg-[#F8FAFC] text-[12px] font-semibold rounded-[8px] transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-[#003D58] hover:bg-[#002F44] active:bg-[#00263A] text-white text-[12px] font-semibold rounded-[8px] shadow-xs shadow-[#003D58]/25 transition-all cursor-pointer"
            >
              Simpan Perubahan
            </button>
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
