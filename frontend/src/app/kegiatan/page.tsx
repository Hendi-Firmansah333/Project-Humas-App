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
  CustomDrawer,
  PaginationBar,
} from '@/components/common';
import DashboardSkeleton from '@/components/common/DashboardSkeleton';
import {
  Plus,
  Eye,
  Edit3,
  Trash2,
  MapPin,
  Calendar,
  Clock,
  User as UserIcon,
  AlertTriangle,
  X,
  CheckCircle,
  ExternalLink,
  UserPlus,
  ChevronRight,
} from 'lucide-react';
import { Activity, ActivityInput, ActivityStatus, User } from '@/types';
import { formatDateID } from '@/utils/formatters';
import { toast } from 'sonner';
import { activityService, userService } from '@/services';

/* ── Types ── */
interface MemberAssignment {
  userId: number;
}

/* ── Component ── */
export default function ActivityManagementPage() {
  const router = useRouter();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const [showCreateSuggestions, setShowCreateSuggestions] = useState(false);
  const [showEditSuggestions, setShowEditSuggestions] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    category: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '12:00',
    location: '',
    status: 'AKAN_DATANG' as ActivityStatus,
    description: '',
    picId: 0,
  });
  const [memberAssignments, setMemberAssignments] = useState<MemberAssignment[]>([]);

  /* ── Loaders ── */
  const loadActivities = async () => {
    setLoading(true);
    try {
      const result = await activityService.getAll({ page: 1, pageSize: 100 });
      setActivities(result.items ?? []);
    } catch {
      toast.error('Gagal memuat data kegiatan dari server.');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const cats = await activityService.getCategories();
      setCategories(cats || []);
    } catch {
      setCategories([]);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const staff = await userService.getAll();
        setUsers(Array.isArray(staff) ? staff : []);
      } catch {
        setUsers([]);
      }
      await loadActivities();
      await loadCategories();
    };
    init();
  }, []);

  /* ── Computed ── */
  const picOptions = users.filter((u) => u.role === 'USER');
  const resolvePicId = () => formData.picId || picOptions[0]?.id || 0;

  /* Members available = role USER, not PIC, not already added */
  const availableForMember = users.filter(
    (u) =>
      u.role === 'USER' &&
      u.id !== resolvePicId() &&
      !memberAssignments.some((m) => m.userId === u.id),
  );

  /* ── Member Handlers ── */
  const handleAddMember = (userId: number) => {
    if (memberAssignments.some((m) => m.userId === userId)) return;
    setMemberAssignments((prev) => [...prev, { userId }]);
  };

  const removeMemberAssignment = (userId: number) => {
    setMemberAssignments((prev) => prev.filter((m) => m.userId !== userId));
  };

  /* ── Filter / Pagination ── */
  const filteredActivities = activities.filter((act) => {
    const matchSearch =
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (act.pic?.fullName ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStat = statusFilter ? act.status === statusFilter : true;
    return matchSearch && matchStat;
  });
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  /* ── Open Handlers ── */
  const handleOpenCreate = () => {
    setFormData({
      title: '',
      category: '',
      date: new Date().toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '12:00',
      location: '',
      status: 'AKAN_DATANG',
      description: '',
      picId: picOptions[0]?.id ?? 0,
    });
    setMemberAssignments([]);
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (activity: Activity) => {
    setSelectedActivity(activity);
    setFormData({
      title: activity.title,
      category: activity.category,
      date: activity.date.split('T')[0],
      startTime: activity.startTime,
      endTime: activity.endTime,
      location: activity.location,
      status: activity.status,
      description: activity.description || '',
      picId: activity.picId,
    });
    // Load existing members (exclude PIC)
    setMemberAssignments(
      (activity.members ?? [])
        .filter((m) => m.userId !== activity.picId)
        .map((m) => ({ userId: m.userId })),
    );
    setIsEditOpen(true);
  };

  const handleOpenDetail = (activity: Activity) => {
    router.push(`/kegiatan/${activity.id}`);
  };

  const handleOpenDelete = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsDeleteOpen(true);
  };

  /* ── Validation ── */
  const validateForm = (picId: number) => {
    if (!formData.category.trim()) {
      toast.error('Kategori kegiatan harus diisi!');
      return false;
    }
    if (!picId) {
      toast.error('Harap pilih PIC untuk kegiatan!');
      return false;
    }
    if (memberAssignments.some((m) => m.userId === picId)) {
      toast.error('PIC tidak boleh ditugaskan kembali sebagai anggota tim!');
      return false;
    }
    const ids = memberAssignments.map((m) => m.userId);
    if (new Set(ids).size !== ids.length) {
      toast.error('Anggota tim tidak boleh ditugaskan ganda!');
      return false;
    }
    return true;
  };

  /* ── Submit Handlers ── */
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.location) {
      toast.error('Harap lengkapi Judul Kegiatan dan Lokasi!');
      return;
    }
    const picId = resolvePicId();
    if (!validateForm(picId)) return;

    try {
      await activityService.create({
        title: formData.title,
        category: formData.category,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        status: formData.status,
        description: formData.description || '-',
        picId,
        memberIds: memberAssignments.map((m) => m.userId),
      } as ActivityInput & { memberIds: number[] });
      setIsCreateOpen(false);
      toast.success('Kegiatan berhasil ditambahkan ke dalam jadwal!');
      await loadActivities();
      await loadCategories();
    } catch {
      toast.error('Gagal menyimpan kegiatan ke server.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;
    const picId = resolvePicId();
    if (!validateForm(picId)) return;

    try {
      await activityService.update(selectedActivity.id, {
        title: formData.title,
        category: formData.category,
        date: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        location: formData.location,
        status: formData.status,
        description: formData.description,
        picId,
        memberIds: memberAssignments.map((m) => m.userId),
      } as ActivityInput & { memberIds: number[] });
      setIsEditOpen(false);
      toast.success('Informasi kegiatan berhasil diperbarui!');
      await loadActivities();
      await loadCategories();
    } catch {
      toast.error('Gagal memperbarui kegiatan.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!selectedActivity) return;
    try {
      await activityService.remove(selectedActivity.id);
      setIsDeleteOpen(false);
      toast.success(`Kegiatan "${selectedActivity.title}" berhasil dihapus.`);
      await loadActivities();
    } catch {
      toast.error('Gagal menghapus kegiatan.');
    }
  };

  const handleMarkSelesai = async () => {
    if (!selectedActivity) return;
    try {
      await activityService.update(selectedActivity.id, { status: 'SELESAI' });
      setIsDetailOpen(false);
      toast.success(`Kegiatan "${selectedActivity.title}" ditandai selesai dan masuk riwayat.`);
      await loadActivities();
    } catch {
      toast.error('Gagal mengubah status kegiatan.');
    }
  };

  /* ── Shared Member Section UI ── */
  const renderMemberSection = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-semibold text-slate-700">Anggota Tim</label>
        <button
          type="button"
          onClick={() => setIsAddMemberOpen(true)}
          disabled={availableForMember.length === 0}
          className="flex items-center gap-1.5 text-xs text-teal-600 font-semibold hover:text-teal-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <UserPlus className="w-3.5 h-3.5" />
          Tambah Anggota
        </button>
      </div>

      {memberAssignments.length === 0 ? (
        <p className="text-xs text-slate-400 italic bg-slate-50 p-3 rounded-xl border border-slate-100">
          Belum ada anggota yang ditugaskan.
        </p>
      ) : (
        <div className="space-y-2">
          {memberAssignments.map((assignment) => {
            const user = users.find((u) => u.id === assignment.userId);
            return (
              <div
                key={assignment.userId}
                className="flex items-center justify-between bg-teal-50 p-2.5 px-4 rounded-xl border border-teal-100"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                    {(user?.fullName ?? '?').substring(0, 2).toUpperCase()}
                  </div>
                  <span className="font-semibold text-slate-800 text-xs">{user?.fullName ?? '-'}</span>
                </div>
                <button
                  type="button"
                  onClick={() => removeMemberAssignment(assignment.userId)}
                  className="p-1.5 rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                  title="Hapus anggota"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  /* ── Input class helper ── */
  const inputCls =
    'w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all';

  /* ── Columns ── */
  const columns: Column<Activity>[] = [
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
      header: 'Judul Kegiatan',
      render: (item) => (
        <div className="max-w-xs">
          <p className="font-bold text-slate-800 leading-snug">{item.title}</p>
          <p className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">{item.description}</p>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Kategori',
      render: (item) => (
        <span className="bg-slate-100 text-slate-700 font-semibold px-2.5 py-1 rounded-lg text-xs whitespace-nowrap">
          {item.category}
        </span>
      ),
    },
    {
      key: 'dateTime',
      header: 'Tanggal & Waktu',
      render: (item) => (
        <div className="text-xs whitespace-nowrap">
          <p className="font-semibold text-slate-700">{formatDateID(item.date)}</p>
          <p className="text-slate-400 text-[11px] mt-0.5">
            {item.startTime} - {item.endTime} WIB
          </p>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Lokasi',
      render: (item) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-600 max-w-xs">
          <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span className="truncate">{item.location}</span>
        </div>
      ),
    },
    {
      key: 'pic',
      header: 'PIC',
      render: (item) => (
        <div className="flex items-center gap-2 whitespace-nowrap">
          <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
            {item.pic.fullName.substring(0, 2).toUpperCase()}
          </div>
          <span className="font-medium text-slate-700 text-xs">{item.pic.fullName}</span>
        </div>
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
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleOpenDetail(item)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
            title="Lihat Detail"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(item)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
            title="Edit Kegiatan"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenDelete(item)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            title="Hapus Kegiatan"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      className: 'text-center w-28',
    },
  ];

  if (loading) {
    return (
      <AdminLayout title="Manajemen Kegiatan Kehumasan">
        <DashboardSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Manajemen Kegiatan Kehumasan">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Daftar Kegiatan Kehumasan</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola penjadwalan, penugasan personel (PIC), dan status peliputan kegiatan tim humas.
            </p>
          </div>
          <CustomButton variant="primary" icon={Plus} onClick={handleOpenCreate}>
            Tambah Kegiatan
          </CustomButton>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <SearchBox
            value={searchQuery}
            onChange={(val) => { setSearchQuery(val); setCurrentPage(1); }}
            placeholder="Cari kegiatan, lokasi, kategori, atau PIC..."
            className="w-full sm:w-80"
          />
          <FilterDropdown
            options={[
              { value: 'SELESAI', label: 'Selesai' },
              { value: 'SEDANG_BERLANGSUNG', label: 'Sedang Berlangsung' },
              { value: 'AKAN_DATANG', label: 'Akan Datang' },
            ]}
            value={statusFilter}
            onChange={(val) => { setStatusFilter(val); setCurrentPage(1); }}
            placeholder="Semua Status"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <DataTable
          columns={columns}
          data={paginatedActivities}
          emptyMessage="Tidak ada kegiatan yang cocok dengan kriteria pencarian Anda."
        />
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages || 1}
          totalItems={filteredActivities.length}
          onPageChange={setCurrentPage}
          itemName="kegiatan"
        />
      </div>

      {/* ═══════════════ CREATE MODAL ═══════════════ */}
      <CustomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Tambah Kegiatan Baru"
        subtitle="Jadwalkan peliputan atau penugasan kegiatan tim humas."
        maxWidth="lg"
      >
        <form id="create-form" onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Judul Kegiatan *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Contoh: Liputan Kunjungan Kerja Direktur"
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Kategori — input manual, no dropdown icon */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kategori *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  onFocus={() => setShowCreateSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowCreateSuggestions(false), 200)}
                  placeholder="Ketik kategori kegiatan"
                  className={inputCls}
                />
                {showCreateSuggestions && categories.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {categories
                      .filter((cat) => cat.toLowerCase().includes(formData.category.toLowerCase()))
                      .map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => { setFormData({ ...formData, category: cat }); setShowCreateSuggestions(false); }}
                          className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 text-slate-700 transition-colors"
                        >
                          {cat}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status Initial</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ActivityStatus })}
                className={inputCls}
              >
                <option value="AKAN_DATANG">Akan Datang</option>
                <option value="SEDANG_BERLANGSUNG">Sedang Berlangsung</option>
                <option value="SELESAI">Selesai</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Pelaksanaan *</label>
              <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mulai (WIB)</label>
              <input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Selesai (WIB)</label>
              <input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Lokasi Kegiatan *</label>
              <input type="text" required value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} placeholder="Contoh: Gedung Serbaguna Polinela" className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Personel PIC *</label>
              <select value={formData.picId} onChange={(e) => setFormData({ ...formData, picId: Number(e.target.value) })} className={inputCls}>
                <option value={0} disabled>Pilih PIC Anggota</option>
                {picOptions.map((u) => (
                  <option key={u.id} value={u.id}>{u.fullName} ({u.roleLabel})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Deskripsi / Catatan Tugas</label>
            <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Tuliskan catatan khusus peliputan..." className={inputCls} />
          </div>

          {renderMemberSection()}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <CustomButton type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>Batal</CustomButton>
            <CustomButton type="submit" variant="primary">Simpan Kegiatan</CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* ═══════════════ EDIT MODAL ═══════════════ */}
      <CustomModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Data Kegiatan"
        subtitle="Perbarui informasi jadwal, status, atau PIC kegiatan."
        maxWidth="lg"
      >
        <form id="edit-form" onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Judul Kegiatan *</label>
            <input type="text" required value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className={inputCls} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kategori *</label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  onFocus={() => setShowEditSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowEditSuggestions(false), 200)}
                  placeholder="Ketik kategori kegiatan"
                  className={inputCls}
                />
                {showEditSuggestions && categories.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg max-h-40 overflow-y-auto">
                    {categories
                      .filter((cat) => cat.toLowerCase().includes(formData.category.toLowerCase()))
                      .map((cat) => (
                        <button key={cat} type="button" onClick={() => { setFormData({ ...formData, category: cat }); setShowEditSuggestions(false); }} className="w-full text-left px-4 py-2 text-xs hover:bg-slate-50 text-slate-700 transition-colors">
                          {cat}
                        </button>
                      ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status Peliputan</label>
              <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as ActivityStatus })} className={inputCls}>
                <option value="AKAN_DATANG">Akan Datang</option>
                <option value="SEDANG_BERLANGSUNG">Sedang Berlangsung</option>
                <option value="SELESAI">Selesai</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Pelaksanaan</label>
              <input type="date" required value={formData.date} onChange={(e) => setFormData({ ...formData, date: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mulai (WIB)</label>
              <input type="time" value={formData.startTime} onChange={(e) => setFormData({ ...formData, startTime: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Selesai (WIB)</label>
              <input type="time" value={formData.endTime} onChange={(e) => setFormData({ ...formData, endTime: e.target.value })} className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Lokasi Kegiatan</label>
              <input type="text" required value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Personel PIC *</label>
              <select value={formData.picId} onChange={(e) => setFormData({ ...formData, picId: Number(e.target.value) })} className={inputCls}>
                <option value={0} disabled>Pilih PIC Anggota</option>
                {picOptions.map((u) => (
                  <option key={u.id} value={u.id}>{u.fullName} ({u.roleLabel})</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Deskripsi / Catatan Tugas</label>
            <textarea rows={3} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className={inputCls} />
          </div>

          {renderMemberSection()}

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <CustomButton type="button" variant="outline" onClick={() => setIsEditOpen(false)}>Batal</CustomButton>
            <CustomButton type="submit" variant="primary">Simpan Perubahan</CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* ═══════════════ ADD MEMBER MODAL ═══════════════ */}
      <CustomModal
        isOpen={isAddMemberOpen}
        onClose={() => setIsAddMemberOpen(false)}
        title="Pilih Anggota Tim"
        subtitle="Pilih anggota yang akan ditugaskan pada kegiatan ini."
        maxWidth="sm"
      >
        <div className="space-y-2 max-h-72 overflow-y-auto">
          {availableForMember.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-6 italic">
              Semua anggota sudah ditambahkan atau tidak tersedia.
            </p>
          ) : (
            availableForMember.map((user) => (
              <button
                key={user.id}
                type="button"
                onClick={() => {
                  handleAddMember(user.id);
                  setIsAddMemberOpen(false);
                }}
                className="w-full flex items-center justify-between gap-3 p-3 rounded-xl border border-slate-200 hover:border-teal-400 hover:bg-teal-50 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-700 font-bold text-sm flex items-center justify-center shrink-0">
                    {user.fullName.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="text-left">
                    <p className="font-semibold text-slate-800 text-sm">{user.fullName}</p>
                    <p className="text-xs text-slate-400">{user.roleLabel}</p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-teal-500 transition-colors" />
              </button>
            ))
          )}
        </div>
        <div className="pt-3 border-t border-slate-100 flex justify-end">
          <CustomButton variant="outline" onClick={() => setIsAddMemberOpen(false)}>Tutup</CustomButton>
        </div>
      </CustomModal>

      {/* ═══════════════ DETAIL DRAWER ═══════════════ */}
      <CustomDrawer
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Kegiatan Kehumasan"
        subtitle={selectedActivity ? `ID: #${selectedActivity.id}` : ''}
      >
        {selectedActivity && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2.5 py-1 rounded-md">
                  {selectedActivity.category}
                </span>
                <StatusBadge status={selectedActivity.status} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 leading-snug">{selectedActivity.title}</h3>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3 text-xs">
              {[
                { icon: Calendar, label: 'Tanggal', value: formatDateID(selectedActivity.date) },
                { icon: Clock, label: 'Waktu', value: `${selectedActivity.startTime} - ${selectedActivity.endTime} WIB` },
                { icon: MapPin, label: 'Lokasi', value: selectedActivity.location },
                { icon: UserIcon, label: 'PIC Bertugas', value: `${selectedActivity.pic.fullName} (${selectedActivity.pic.roleLabel})` },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3 text-slate-700">
                  <Icon className="w-4 h-4 text-teal-600 shrink-0" />
                  <div><span className="font-semibold">{label}: </span><span>{value}</span></div>
                </div>
              ))}
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Deskripsi & Catatan Tugas</h4>
              <p className="text-xs sm:text-sm text-slate-700 bg-white p-4 rounded-xl border border-slate-200 leading-relaxed">
                {selectedActivity.description || 'Tidak ada catatan tambahan.'}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Anggota Tim</h4>
              {(selectedActivity.members ?? []).length > 0 ? (
                <div className="space-y-2">
                  {(selectedActivity.members ?? []).map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-3 rounded-xl bg-teal-50/50 border border-teal-100 text-xs">
                      <span className="font-semibold text-slate-800">{m.user.fullName}</span>
                      <span className="bg-teal-100 text-teal-700 font-semibold px-2.5 py-1 rounded-lg">{m.role}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Belum ada penugasan anggota.</p>
              )}
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Dokumentasi dari Tim</h4>
              {(() => {
                const docLinks = (selectedActivity.media ?? []).filter((m) => m.fileType === 'application/link');
                if (docLinks.length === 0) {
                  return <p className="text-xs text-slate-400 italic">Belum ada dokumentasi yang dikirim tim.</p>;
                }
                return (
                  <div className="space-y-2">
                    {docLinks.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs gap-2">
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">{doc.uploader?.fullName ?? 'Tim Lapangan'}</p>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:underline truncate block max-w-[220px]">{doc.fileUrl}</a>
                        </div>
                        <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="shrink-0 p-1.5 rounded-lg bg-teal-100 text-teal-700 hover:bg-teal-200 transition-colors" title="Buka Link">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>

            <div className="pt-4 border-t border-slate-100 flex flex-wrap justify-end gap-2">
              {selectedActivity.status !== 'SELESAI' && selectedActivity.status !== 'DIBATALKAN' && (
                <CustomButton variant="primary" size="sm" icon={CheckCircle} onClick={handleMarkSelesai}>
                  Tandai Selesai
                </CustomButton>
              )}
              <CustomButton variant="secondary" size="sm" onClick={() => { setIsDetailOpen(false); handleOpenEdit(selectedActivity); }}>
                Edit Kegiatan
              </CustomButton>
              <CustomButton variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>Tutup</CustomButton>
            </div>
          </div>
        )}
      </CustomDrawer>

      {/* ═══════════════ DELETE MODAL ═══════════════ */}
      <CustomModal isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)} title="Konfirmasi Hapus Kegiatan" maxWidth="sm">
        <div className="text-center py-2 space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Hapus &quot;{selectedActivity?.title}&quot;?</p>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">Tindakan ini akan menghapus jadwal kegiatan secara permanen dan tidak dapat dibatalkan.</p>
          </div>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <CustomButton variant="outline" onClick={() => setIsDeleteOpen(false)}>Batal</CustomButton>
            <CustomButton variant="danger" onClick={handleDeleteConfirm}>Ya, Hapus</CustomButton>
          </div>
        </div>
      </CustomModal>
    </AdminLayout>
  );
}
