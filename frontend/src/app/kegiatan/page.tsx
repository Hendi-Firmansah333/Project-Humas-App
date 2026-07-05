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
  CustomDrawer,
  CustomInput,
  PaginationBar,
} from '@/components/common';
import DashboardSkeleton from '@/components/common/DashboardSkeleton';
import { Plus, Eye, Edit3, Trash2, MapPin, Calendar, Clock, User as UserIcon, AlertTriangle, X, CheckCircle, ExternalLink } from 'lucide-react';
import { Activity, ActivityInput, ActivityStatus, User } from '@/types';
import { formatDateID } from '@/utils/formatters';
import { toast } from 'sonner';
import { activityService, userService } from '@/services';
import { JOB_DESK_OPTIONS } from '@/constants';

interface MemberAssignment {
  userId: number;
  role: string;
}

export default function ActivityManagementPage() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modals & Drawer State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    title: '',
    category: 'Liputan Resmi',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '12:00',
    location: '',
    status: 'AKAN_DATANG' as ActivityStatus,
    description: '',
    picId: 0,
  });
  const [memberAssignments, setMemberAssignments] = useState<MemberAssignment[]>([]);

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

  const staffUsers = users.filter((u) => u.role === 'USER' || u.role === 'ADMIN');

  const resolvePicId = () => formData.picId || staffUsers[0]?.id || 1;

  const addMemberAssignment = () => {
    const available = staffUsers.find(
      (u) => !memberAssignments.some((m) => m.userId === u.id),
    );
    if (!available) {
      toast.error('Semua anggota sudah ditugaskan.');
      return;
    }
    setMemberAssignments((prev) => [
      ...prev,
      { userId: available.id, role: JOB_DESK_OPTIONS[0] },
    ]);
  };

  const updateMemberAssignment = (index: number, patch: Partial<MemberAssignment>) => {
    setMemberAssignments((prev) =>
      prev.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  };

  const removeMemberAssignment = (index: number) => {
    setMemberAssignments((prev) => prev.filter((_, i) => i !== index));
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
    };
    init();
  }, []);

  // Filter logic
  const filteredActivities = activities.filter((act) => {
    const matchSearch =
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (act.pic?.fullName ?? '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = categoryFilter ? act.category === categoryFilter : true;
    const matchStat = statusFilter ? act.status === statusFilter : true;
    return matchSearch && matchCat && matchStat;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const handleOpenCreate = () => {
    setFormData({
      title: '',
      category: 'Liputan Resmi',
      date: new Date().toISOString().split('T')[0],
      startTime: '08:00',
      endTime: '12:00',
      location: '',
      status: 'AKAN_DATANG',
      description: '',
      picId: staffUsers[0]?.id ?? 0,
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
    setMemberAssignments(
      (activity.members ?? []).map((m) => ({ userId: m.userId, role: m.role })),
    );
    setIsEditOpen(true);
  };

  const handleOpenDetail = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsDetailOpen(true);
  };

  const handleOpenDelete = (activity: Activity) => {
    setSelectedActivity(activity);
    setIsDeleteOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.location) {
      toast.error('Harap lengkapi Judul Kegiatan dan Lokasi!');
      return;
    }

    try {
      const picId = resolvePicId();
      const members =
        memberAssignments.length > 0
          ? memberAssignments
          : picId
            ? [{ userId: picId, role: 'PIC Lapangan' }]
            : [];

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
        members,
      });
      setIsCreateOpen(false);
      toast.success('Kegiatan berhasil ditambahkan ke dalam jadwal!');
      await loadActivities();
    } catch {
      toast.error('Gagal menyimpan kegiatan ke server.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;

    try {
      const picId = resolvePicId();
      const members =
        memberAssignments.length > 0
          ? memberAssignments.some((m) => m.userId === picId)
            ? memberAssignments
            : [{ userId: picId, role: 'PIC Lapangan' }, ...memberAssignments]
          : picId
            ? [{ userId: picId, role: 'PIC Lapangan' }]
            : [];

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
        members,
      });
      setIsEditOpen(false);
      toast.success('Informasi kegiatan berhasil diperbarui!');
      await loadActivities();
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
      {/* Header Banner & Controls */}
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

        {/* Search Bar and Filter Dropdowns */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <SearchBox
            value={searchQuery}
            onChange={(val) => {
              setSearchQuery(val);
              setCurrentPage(1);
            }}
            placeholder="Cari kegiatan, lokasi, atau PIC..."
            className="w-full sm:w-80"
          />
          <div className="flex flex-wrap items-center gap-2.5">
            <FilterDropdown
              options={[
                { value: 'Liputan Resmi', label: 'Liputan Resmi' },
                { value: 'Konferensi Pers', label: 'Konferensi Pers' },
                { value: 'Media Produksi', label: 'Media Produksi' },
                { value: 'Kerjasama', label: 'Kerjasama' },
                { value: 'Rilis Berita', label: 'Rilis Berita' },
              ]}
              value={categoryFilter}
              onChange={(val) => {
                setCategoryFilter(val);
                setCurrentPage(1);
              }}
              placeholder="Semua Kategori"
            />
            <FilterDropdown
              options={[
                { value: 'SELESAI', label: 'Selesai' },
                { value: 'SEDANG_BERLANGSUNG', label: 'Sedang Berlangsung' },
                { value: 'AKAN_DATANG', label: 'Akan Datang' },
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

      {/* Main Table Card */}
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

      {/* Create Activity Modal */}
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
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kategori</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              >
                <option value="Liputan Resmi">Liputan Resmi</option>
                <option value="Konferensi Pers">Konferensi Pers</option>
                <option value="Media Produksi">Media Produksi</option>
                <option value="Kerjasama">Kerjasama</option>
                <option value="Rilis Berita">Rilis Berita</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status Initial</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ActivityStatus })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
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
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mulai (WIB)</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Selesai (WIB)</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Lokasi Kegiatan *</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                placeholder="Contoh: Gedung Serbaguna Polinela"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Personel Penanggung Jawab (PIC)</label>
              <select
                value={formData.picId}
                onChange={(e) => setFormData({ ...formData, picId: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              >
                {staffUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.roleLabel})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Deskripsi / Catatan Tugas</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Tuliskan catatan khusus peliputan..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">Penugasan Job Desk</label>
              <CustomButton type="button" variant="outline" size="sm" icon={Plus} onClick={addMemberAssignment}>
                Tambah Anggota
              </CustomButton>
            </div>
            {memberAssignments.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Belum ada anggota yang ditugaskan.</p>
            ) : (
              <div className="space-y-2">
                {memberAssignments.map((assignment, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                    <select
                      value={assignment.userId}
                      onChange={(e) => updateMemberAssignment(index, { userId: Number(e.target.value) })}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                    >
                      {staffUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName}
                        </option>
                      ))}
                    </select>
                    <select
                      value={assignment.role}
                      onChange={(e) => updateMemberAssignment(index, { role: e.target.value })}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                    >
                      {JOB_DESK_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeMemberAssignment(index)}
                      className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                      title="Hapus penugasan"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <CustomButton type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Batal
            </CustomButton>
            <CustomButton type="submit" variant="primary">
              Simpan Kegiatan
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* Edit Activity Modal */}
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
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kategori</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              >
                <option value="Liputan Resmi">Liputan Resmi</option>
                <option value="Konferensi Pers">Konferensi Pers</option>
                <option value="Media Produksi">Media Produksi</option>
                <option value="Kerjasama">Kerjasama</option>
                <option value="Rilis Berita">Rilis Berita</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status Peliputan</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as ActivityStatus })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              >
                <option value="AKAN_DATANG">Akan Datang</option>
                <option value="SEDANG_BERLANGSUNG">Sedang Berlangsung</option>
                <option value="SELESAI">Selesai</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Tanggal Pelaksanaan</label>
              <input
                type="date"
                required
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mulai (WIB)</label>
              <input
                type="time"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Selesai (WIB)</label>
              <input
                type="time"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Lokasi Kegiatan</label>
              <input
                type="text"
                required
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Personel PIC</label>
              <select
                value={formData.picId}
                onChange={(e) => setFormData({ ...formData, picId: Number(e.target.value) })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              >
                {staffUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName} ({u.roleLabel})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Deskripsi / Catatan Tugas</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700">Penugasan Job Desk</label>
              <CustomButton type="button" variant="outline" size="sm" icon={Plus} onClick={addMemberAssignment}>
                Tambah Anggota
              </CustomButton>
            </div>
            {memberAssignments.length === 0 ? (
              <p className="text-xs text-slate-400 italic">Belum ada anggota yang ditugaskan.</p>
            ) : (
              <div className="space-y-2">
                {memberAssignments.map((assignment, index) => (
                  <div key={index} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                    <select
                      value={assignment.userId}
                      onChange={(e) => updateMemberAssignment(index, { userId: Number(e.target.value) })}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                    >
                      {staffUsers.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.fullName}
                        </option>
                      ))}
                    </select>
                    <select
                      value={assignment.role}
                      onChange={(e) => updateMemberAssignment(index, { role: e.target.value })}
                      className="flex-1 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                    >
                      {JOB_DESK_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => removeMemberAssignment(index)}
                      className="p-2.5 rounded-xl text-red-500 hover:bg-red-50 transition-colors"
                      title="Hapus penugasan"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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

      {/* View Detail Drawer */}
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
              <div className="flex items-center gap-3 text-slate-700">
                <Calendar className="w-4 h-4 text-teal-600 shrink-0" />
                <div>
                  <span className="font-semibold">Tanggal: </span>
                  <span>{formatDateID(selectedActivity.date)}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <Clock className="w-4 h-4 text-teal-600 shrink-0" />
                <div>
                  <span className="font-semibold">Waktu Pelaksanaan: </span>
                  <span>
                    {selectedActivity.startTime} - {selectedActivity.endTime} WIB
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <MapPin className="w-4 h-4 text-teal-600 shrink-0" />
                <div>
                  <span className="font-semibold">Lokasi: </span>
                  <span>{selectedActivity.location}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <UserIcon className="w-4 h-4 text-teal-600 shrink-0" />
                <div>
                  <span className="font-semibold">PIC Bertugas: </span>
                  <span>{selectedActivity.pic.fullName} ({selectedActivity.pic.roleLabel})</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Deskripsi & Catatan Tugas
              </h4>
              <p className="text-xs sm:text-sm text-slate-700 bg-white p-4 rounded-xl border border-slate-200 leading-relaxed">
                {selectedActivity.description || 'Tidak ada catatan tambahan untuk kegiatan ini.'}
              </p>
            </div>

            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Penugasan Job Desk
              </h4>
              {(selectedActivity.members ?? []).length > 0 ? (
                <div className="space-y-2">
                  {(selectedActivity.members ?? []).map((m) => (
                    <div
                      key={m.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-teal-50/50 border border-teal-100 text-xs"
                    >
                      <span className="font-semibold text-slate-800">{m.user.fullName}</span>
                      <span className="bg-teal-100 text-teal-700 font-semibold px-2.5 py-1 rounded-lg">
                        {m.role}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">Belum ada penugasan anggota.</p>
              )}
            </div>

            {/* Dokumentasi dari Tim Mobile */}
            <div>
              <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Dokumentasi dari Tim
              </h4>
              {(() => {
                const docLinks = (selectedActivity.media ?? []).filter(
                  (m) => m.fileType === 'application/link',
                );
                if (docLinks.length === 0) {
                  return (
                    <p className="text-xs text-slate-400 italic">
                      Belum ada dokumentasi yang dikirim tim.
                    </p>
                  );
                }
                return (
                  <div className="space-y-2">
                    {docLinks.map((doc) => (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs gap-2"
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-800 truncate">
                            {doc.uploader?.fullName ?? 'Tim Lapangan'}
                          </p>
                          <a
                            href={doc.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-600 hover:underline truncate block max-w-[220px]"
                          >
                            {doc.fileUrl}
                          </a>
                        </div>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 p-1.5 rounded-lg bg-teal-100 text-teal-700 hover:bg-teal-200 transition-colors"
                          title="Buka Link"
                        >
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
                <CustomButton
                  variant="primary"
                  size="sm"
                  icon={CheckCircle}
                  onClick={handleMarkSelesai}
                >
                  Tandai Selesai
                </CustomButton>
              )}
              <CustomButton
                variant="secondary"
                size="sm"
                onClick={() => {
                  setIsDetailOpen(false);
                  handleOpenEdit(selectedActivity);
                }}
              >
                Edit Kegiatan
              </CustomButton>
              <CustomButton variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
                Tutup
              </CustomButton>
            </div>
          </div>
        )}
      </CustomDrawer>

      {/* Delete Confirmation Modal */}
      <CustomModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Konfirmasi Hapus Kegiatan"
        maxWidth="sm"
      >
        <div className="text-center py-2 space-y-4">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">
              Hapus &quot;{selectedActivity?.title}&quot;?
            </p>
            <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
              Tindakan ini akan menghapus jadwal kegiatan secara permanen dan tidak dapat dibatalkan.
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
