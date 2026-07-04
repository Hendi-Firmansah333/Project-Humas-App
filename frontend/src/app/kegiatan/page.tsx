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
import { Plus, Eye, Edit3, Trash2, MapPin, Calendar, Clock, User, FileText, AlertTriangle } from 'lucide-react';
import { Activity, ActivityStatus } from '@/types';
import { formatDateID } from '@/utils/formatters';
import { toast } from 'sonner';

const initialActivities: Activity[] = [
  {
    id: 1,
    title: 'Liputan Kunjungan Menteri Pendidikan',
    category: 'Liputan Resmi',
    date: '2025-05-21',
    startTime: '09:00',
    endTime: '12:00',
    location: 'Gedung Serbaguna Polinela',
    status: 'SEDANG_BERLANGSUNG',
    description: 'Dokumentasi foto dan video kedatangan tamu kementerian serta publikasi live di Instagram.',
    picId: 1,
    pic: {
      id: 1,
      fullName: 'Komang Ari',
      username: 'komang.ari',
      email: 'komang@polinela.ac.id',
      role: 'ADMIN',
      roleLabel: 'Admin Humas',
      status: 'AKTIF',
      joinedAt: '2025-01-01',
    },
  },
  {
    id: 2,
    title: 'Konferensi Pers Dies Natalis ke-41 Polinela',
    category: 'Konferensi Pers',
    date: '2025-05-22',
    startTime: '13:30',
    endTime: '15:30',
    location: 'Ruang Sidang Utama Rektorat',
    status: 'AKAN_DATANG',
    description: 'Persiapan media rilis dan wawancara pimpinan kampus dengan jurnalis mitra.',
    picId: 2,
    pic: {
      id: 2,
      fullName: 'Rina Wati',
      username: 'rina.wati',
      email: 'rina@polinela.ac.id',
      role: 'JURNALIS',
      roleLabel: 'Jurnalis',
      status: 'AKTIF',
      joinedAt: '2025-01-01',
    },
  },
  {
    id: 3,
    title: 'Podcast Campus Life Episode 12',
    category: 'Media Produksi',
    date: '2025-05-23',
    startTime: '10:00',
    endTime: '12:00',
    location: 'Studio Humas Polinela',
    status: 'AKAN_DATANG',
    description: 'Recording video podcast dengan BEM Polinela mengenai kegiatan mahasiswa baru.',
    picId: 3,
    pic: {
      id: 3,
      fullName: 'Budi Santoso',
      username: 'budi.s',
      email: 'budi@polinela.ac.id',
      role: 'VIDEOGRAFER',
      roleLabel: 'Videografer',
      status: 'AKTIF',
      joinedAt: '2025-01-01',
    },
  },
  {
    id: 4,
    title: 'Dokumentasi Penandatanganan MoU Industri',
    category: 'Kerjasama',
    date: '2025-05-19',
    startTime: '08:30',
    endTime: '11:00',
    location: 'Ruang VIP Rektorat Lantai 2',
    status: 'SELESAI',
    description: 'Pengambilan foto resmi penandatanganan kerja sama PT Charoen Pokphand dan arsip digital.',
    picId: 4,
    pic: {
      id: 4,
      fullName: 'Andi Saputra',
      username: 'andi.s',
      email: 'andi@polinela.ac.id',
      role: 'FOTOGRAFER',
      roleLabel: 'Fotografer',
      status: 'AKTIF',
      joinedAt: '2025-01-01',
    },
  },
  {
    id: 5,
    title: 'Publikasi Artikel Prestasi Mahasiswa Nasional',
    category: 'Rilis Berita',
    date: '2025-05-18',
    startTime: '14:00',
    endTime: '16:00',
    location: 'Online / Website Resmi',
    status: 'SELESAI',
    description: 'Penyusunan berita mahasiswa juara 1 Kompetisi Inovasi Pertanian Nasional.',
    picId: 2,
    pic: {
      id: 2,
      fullName: 'Rina Wati',
      username: 'rina.wati',
      email: 'rina@polinela.ac.id',
      role: 'JURNALIS',
      roleLabel: 'Jurnalis',
      status: 'AKTIF',
      joinedAt: '2025-01-01',
    },
  },
  {
    id: 6,
    title: 'Liputan Kuliah Umum Digital Marketing',
    category: 'Liputan Resmi',
    date: '2025-05-15',
    startTime: '08:00',
    endTime: '11:30',
    location: 'Aula Gedung Q Polinela',
    status: 'SELESAI',
    description: 'Peliputan seminar nasional wirausaha mahasiswa.',
    picId: 1,
    pic: {
      id: 1,
      fullName: 'Komang Ari',
      username: 'komang.ari',
      email: 'komang@polinela.ac.id',
      role: 'ADMIN',
      roleLabel: 'Admin Humas',
      status: 'AKTIF',
      joinedAt: '2025-01-01',
    },
  },
];

export default function ActivityManagementPage() {
  const [activities, setActivities] = useState<Activity[]>(initialActivities);
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
    picName: 'Komang Ari',
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Filter logic
  const filteredActivities = activities.filter((act) => {
    const matchSearch =
      act.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      act.pic.fullName.toLowerCase().includes(searchQuery.toLowerCase());
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
      picName: 'Komang Ari',
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (activity: Activity) => {
    setSelectedActivity(activity);
    setFormData({
      title: activity.title,
      category: activity.category,
      date: activity.date,
      startTime: activity.startTime,
      endTime: activity.endTime,
      location: activity.location,
      status: activity.status,
      description: activity.description || '',
      picName: activity.pic.fullName,
    });
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

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.location) {
      toast.error('Harap lengkapi Judul Kegiatan dan Lokasi!');
      return;
    }

    const newAct: Activity = {
      id: Date.now(),
      title: formData.title,
      category: formData.category,
      date: formData.date,
      startTime: formData.startTime,
      endTime: formData.endTime,
      location: formData.location,
      status: formData.status,
      description: formData.description,
      picId: 1,
      pic: {
        id: 1,
        fullName: formData.picName,
        username: formData.picName.toLowerCase().replace(/\s+/g, '.'),
        email: `${formData.picName.toLowerCase().replace(/\s+/g, '')}@polinela.ac.id`,
        role: 'ADMIN',
        roleLabel: 'Petugas Humas',
        status: 'AKTIF',
        joinedAt: '2025-01-01',
      },
    };

    setActivities([newAct, ...activities]);
    setIsCreateOpen(false);
    toast.success('Kegiatan berhasil ditambahkan ke dalam jadwal!');
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedActivity) return;

    const updated = activities.map((act) => {
      if (act.id === selectedActivity.id) {
        return {
          ...act,
          title: formData.title,
          category: formData.category,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          location: formData.location,
          status: formData.status,
          description: formData.description,
          pic: {
            ...act.pic,
            fullName: formData.picName,
          },
        };
      }
      return act;
    });

    setActivities(updated);
    setIsEditOpen(false);
    toast.success('Informasi kegiatan berhasil diperbarui!');
  };

  const handleDeleteConfirm = () => {
    if (!selectedActivity) return;
    setActivities(activities.filter((act) => act.id !== selectedActivity.id));
    setIsDeleteOpen(false);
    toast.success(`Kegiatan "${selectedActivity.title}" berhasil dihapus.`);
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
                value={formData.picName}
                onChange={(e) => setFormData({ ...formData, picName: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              >
                <option value="Komang Ari">Komang Ari (Koordinator)</option>
                <option value="Rina Wati">Rina Wati (Jurnalis)</option>
                <option value="Budi Santoso">Budi Santoso (Videografer)</option>
                <option value="Andi Saputra">Andi Saputra (Fotografer)</option>
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
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Deskripsi / Catatan Tugas</label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                <User className="w-4 h-4 text-teal-600 shrink-0" />
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

            <div className="pt-4 border-t border-slate-100 flex justify-end gap-2">
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
              <CustomButton variant="primary" size="sm" onClick={() => setIsDetailOpen(false)}>
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
