'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import {
  StatCard,
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
  Edit3,
  Trash2,
  Users,
  UserCheck,
  Radio,
  UserX,
  Mail,
  Phone,
  Calendar,
  Shield,
  Power,
  KeyRound,
} from 'lucide-react';
import { User, Role, UserStatus } from '@/types';
import { formatDateID } from '@/utils/formatters';
import { toast } from 'sonner';
import { userService } from '@/services';

export default function UserManagementPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isResetPwOpen, setIsResetPwOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
    email: '',
    phone: '',
    role: 'USER' as Role,
    status: 'AKTIF' as UserStatus,
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await userService.getAll();
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      toast.error('Gagal memuat data personel dari server.');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = users.filter((u) => {
    const matchSearch =
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchRole = roleFilter ? u.role === roleFilter : true;
    const matchStatus = statusFilter ? u.status === statusFilter : true;
    return matchSearch && matchRole && matchStatus;
  });

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const paginatedUsers = filteredUsers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const getRoleLabel = (r: Role) => {
    switch (r) {
      case 'ADMIN':
        return 'Admin Humas';
      case 'USER':
      default:
        return 'Anggota Humas';
    }
  };

  const handleOpenCreate = () => {
    setFormData({
      fullName: '',
      username: '',
      email: '',
      phone: '',
      role: 'USER',
      status: 'AKTIF',
    });
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setFormData({
      fullName: user.fullName,
      username: user.username,
      email: user.email,
      phone: user.phone || '',
      role: user.role,
      status: user.status,
    });
    setIsEditOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email) {
      toast.error('Harap lengkapi Nama Lengkap dan Email!');
      return;
    }

    try {
      await userService.create({
        fullName: formData.fullName,
        username: formData.username || formData.fullName.toLowerCase().replace(/\s+/g, '.'),
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        roleLabel: getRoleLabel(formData.role),
        status: formData.status,
        password: 'humas123',
      });
      setIsCreateOpen(false);
      toast.success('Personel baru berhasil ditambahkan ke dalam sistem HUMASS!');
      await loadUsers();
    } catch {
      toast.error('Gagal menambahkan personel ke server.');
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      await userService.update(selectedUser.id, {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        role: formData.role,
        roleLabel: getRoleLabel(formData.role),
        status: formData.status,
      });
      setIsEditOpen(false);
      toast.success('Informasi profil personel berhasil diperbarui!');
      await loadUsers();
    } catch {
      toast.error('Gagal memperbarui data personel.');
    }
  };

  const handleToggleStatus = async (user: User) => {
    const nextStatus = user.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
    try {
      await userService.update(user.id, { status: nextStatus });
      toast.info(`Akun "${user.fullName}" diubah menjadi ${nextStatus === 'AKTIF' ? 'Aktif' : 'Nonaktif'}.`);
      await loadUsers();
    } catch {
      toast.error('Gagal mengubah status akun personel.');
    }
  };

  const handleRemoveUser = async (user: User) => {
    if (!window.confirm(`Hapus personel "${user.fullName}" dari sistem?`)) return;
    try {
      await userService.remove(user.id);
      toast.success(`Personel "${user.fullName}" berhasil dihapus.`);
      await loadUsers();
    } catch {
      toast.error('Gagal menghapus personel.');
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    if (newPassword.length < 6) {
      toast.error('Password minimal 6 karakter!');
      return;
    }
    try {
      await userService.update(selectedUser.id, { password: newPassword } as Partial<User>);
      setIsResetPwOpen(false);
      setNewPassword('');
      toast.success(`Password untuk "${selectedUser.fullName}" berhasil direset!`);
    } catch {
      toast.error('Gagal mereset password.');
    }
  };

  const getRoleBadge = (role: Role, label: string) => {
    switch (role) {
      case 'ADMIN':
        return (
          <span className="bg-teal-50 text-teal-800 font-bold px-2.5 py-1 rounded-lg text-xs border border-teal-200">
            {label}
          </span>
        );
      case 'USER':
        return (
          <span className="bg-sky-50 text-sky-800 font-bold px-2.5 py-1 rounded-lg text-xs border border-sky-200">
            {label}
          </span>
        );
      default:
        return (
          <span className="bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-lg text-xs border border-slate-200">
            {label}
          </span>
        );
    }
  };

  const columns: Column<User>[] = [
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
      key: 'profil',
      header: 'Profil Personel',
      render: (item) => (
        <div className="flex items-center gap-3">
          <UserAvatar src={item.avatar} name={item.fullName} size="md" />
          <div>
            <p className="font-bold text-slate-800 leading-snug">{item.fullName}</p>
            <p className="text-[11px] text-slate-400">@{item.username}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email & Kontak',
      render: (item) => (
        <div className="text-xs">
          <p className="font-semibold text-slate-700 flex items-center gap-1.5">
            <Mail className="w-3.5 h-3.5 text-teal-600 shrink-0" />
            <span>{item.email}</span>
          </p>
          {item.phone && (
            <p className="text-slate-400 text-[11px] mt-0.5 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span>{item.phone}</span>
            </p>
          )}
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role / Peran',
      render: (item) => getRoleBadge(item.role, item.roleLabel),
    },
    {
      key: 'status',
      header: 'Status Akun',
      render: (item) => <StatusBadge status={item.status} />,
    },
    {
      key: 'joinedAt',
      header: 'Tanggal Bergabung',
      render: (item) => (
        <span className="text-xs text-slate-600 font-medium">{formatDateID(item.joinedAt)}</span>
      ),
    },
    {
      key: 'actions',
      header: 'Aksi',
      render: (item) => (
        <div className="flex items-center gap-1.5 justify-center">
          <button
            onClick={() => {
              setSelectedUser(item);
              setIsDetailOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-600 hover:bg-teal-50 transition-colors cursor-pointer"
            title="Lihat Detail Personel"
          >
            <Eye className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleOpenEdit(item)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-sky-600 hover:bg-sky-50 transition-colors cursor-pointer"
            title="Edit Data Personel"
          >
            <Edit3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setSelectedUser(item);
              setNewPassword('');
              setIsResetPwOpen(true);
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-purple-600 hover:bg-purple-50 transition-colors cursor-pointer"
            title="Reset Password"
          >
            <KeyRound className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleToggleStatus(item)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              item.status === 'AKTIF'
                ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                : 'text-slate-400 hover:text-green-600 hover:bg-green-50'
            }`}
            title={item.status === 'AKTIF' ? 'Nonaktifkan Akun' : 'Aktifkan Akun'}
          >
            <Power className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleRemoveUser(item)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
            title="Hapus Personel"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      ),
      className: 'w-32 text-center',
    },
  ];

  if (loading) {
    return (
      <AdminLayout title="Manajemen Personel & Hak Akses">
        <DashboardSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Manajemen Personel & Hak Akses">
      {/* Statistics Row: 4 StatCards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Personel"
          value={`${users.length} Orang`}
          subtitle="Tim Humas Politeknik Negeri Lampung"
          icon={Users}
          iconBgClass="bg-teal-50"
          iconColorClass="text-teal-600"
        />
        <StatCard
          title="Personel Aktif"
          value={`${users.filter((u) => u.status === 'AKTIF').length} Orang`}
          subtitle="Memiliki hak akses sistem HUMASS"
          icon={UserCheck}
          iconBgClass="bg-green-50"
          iconColorClass="text-green-600"
        />
        <StatCard
          title="Bertugas Lapangan"
          value={`${users.filter((u) => u.role === 'USER').length} Orang`}
          subtitle="Anggota Humas terdaftar"
          icon={Radio}
          iconBgClass="bg-sky-50"
          iconColorClass="text-sky-600"
        />
        <StatCard
          title="Nonaktif / Cuti"
          value={`${users.filter((u) => u.status === 'NONAKTIF').length} Orang`}
          subtitle="Akun dinonaktifkan sementara"
          icon={UserX}
          iconBgClass="bg-orange-50"
          iconColorClass="text-orange-600"
        />
      </div>

      {/* Header Banner & Table Controls */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight">Daftar Personel Kehumasan</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Kelola data profil, peran (Role Access Control), dan status keaktifan akun petugas humas.
            </p>
          </div>
          <CustomButton variant="primary" icon={Plus} onClick={handleOpenCreate}>
            Tambah Personel
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
            placeholder="Cari nama personel, username, atau email..."
            className="w-full sm:w-80"
          />
          <div className="flex flex-wrap items-center gap-2.5">
            <FilterDropdown
              options={[
                { value: 'ADMIN', label: 'Admin Humas' },
                { value: 'USER', label: 'Anggota Humas' },
              ]}
              value={roleFilter}
              onChange={(val) => {
                setRoleFilter(val);
                setCurrentPage(1);
              }}
              placeholder="Semua Role"
            />
            <FilterDropdown
              options={[
                { value: 'AKTIF', label: 'Aktif' },
                { value: 'NONAKTIF', label: 'Nonaktif' },
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

      {/* Main Personnel Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <DataTable columns={columns} data={paginatedUsers} emptyMessage="Tidak ada personel yang sesuai dengan kriteria." />
        <PaginationBar
          currentPage={currentPage}
          totalPages={totalPages || 1}
          totalItems={filteredUsers.length}
          onPageChange={setCurrentPage}
          itemName="personel"
        />
      </div>

      {/* Create User Modal */}
      <CustomModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Tambah Personel Baru"
        subtitle="Daftarkan akun petugas kehumasan untuk hak akses sistem."
        maxWidth="md"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Contoh: Budi Santoso, S.I.Kom"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Username *</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="budi.s"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Polinela *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="budi@polinela.ac.id"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nomor Telepon / WhatsApp</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0812-3456-7890"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Role / Hak Akses *</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              >
                <option value="ADMIN">Admin Humas</option>
                <option value="USER">Anggota Humas</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <CustomButton type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Batal
            </CustomButton>
            <CustomButton type="submit" variant="primary">
              Simpan Personel
            </CustomButton>
          </div>
        </form>
      </CustomModal>

      {/* Edit User Modal */}
      <CustomModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Data Personel"
        subtitle={selectedUser ? `@${selectedUser.username}` : ''}
        maxWidth="md"
      >
        <form onSubmit={handleEditSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Polinela *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nomor WhatsApp</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Role / Peran</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              >
                <option value="ADMIN">Admin Humas</option>
                <option value="USER">Anggota Humas</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Status Akun</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
              >
                <option value="AKTIF">AKTIF</option>
                <option value="NONAKTIF">NONAKTIF</option>
              </select>
            </div>
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

      {/* Detail User Modal */}
      <CustomModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Profil Personel"
        maxWidth="sm"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <UserAvatar src={selectedUser.avatar} name={selectedUser.fullName} size="lg" />
              <div>
                <StatusBadge status={selectedUser.status} />
                <h4 className="font-bold text-base text-slate-900 mt-1">{selectedUser.fullName}</h4>
                <p className="text-xs text-teal-600 font-semibold">{selectedUser.roleLabel}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <p><strong>Username:</strong> @{selectedUser.username}</p>
              <p><strong>Email Polinela:</strong> {selectedUser.email}</p>
              <p><strong>Nomor WhatsApp:</strong> {selectedUser.phone || '-'}</p>
              <p><strong>Tanggal Bergabung:</strong> {formatDateID(selectedUser.joinedAt)}</p>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <CustomButton variant="primary" size="sm" onClick={() => setIsDetailOpen(false)}>
                Tutup
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>
      {/* Reset Password Modal */}
      <CustomModal
        isOpen={isResetPwOpen}
        onClose={() => { setIsResetPwOpen(false); setNewPassword(''); }}
        title="Reset Password Personel"
        subtitle={selectedUser ? `Akun: @${selectedUser.username}` : ''}
        maxWidth="sm"
      >
        {selectedUser && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-purple-50 border border-purple-100">
              <UserAvatar src={selectedUser.avatar} name={selectedUser.fullName} size="md" />
              <div>
                <p className="font-bold text-sm text-slate-800">{selectedUser.fullName}</p>
                <p className="text-xs text-teal-600 font-semibold">{selectedUser.roleLabel}</p>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">Password Baru *</label>
              <input
                type="password"
                required
                minLength={6}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-600 transition-all"
              />
              <p className="text-[11px] text-slate-400 mt-1">Password akan dienkripsi (bcrypt) secara otomatis oleh server.</p>
            </div>
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <CustomButton type="button" variant="outline" onClick={() => { setIsResetPwOpen(false); setNewPassword(''); }}>
                Batal
              </CustomButton>
              <CustomButton type="submit" variant="primary">
                Reset Password
              </CustomButton>
            </div>
          </form>
        )}
      </CustomModal>
    </AdminLayout>
  );
}
