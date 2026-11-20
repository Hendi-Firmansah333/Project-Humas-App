'use client';

import React, { useState, useEffect } from 'react';
import { getStoredUser } from '@/utils/session';
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
  ConfirmModal,
  PaginationBar,
  UserAvatar,
  TableSkeleton,
} from '@/components/common';
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
  const [unauthorized, setUnauthorized] = useState(false);
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
  const [passwordMode, setPasswordMode] = useState<'default' | 'custom'>('default');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [createdCredentials, setCreatedCredentials] = useState<{ username: string; email: string } | null>(null);
  const [isCredsOpen, setIsCredsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isToggleStatusOpen, setIsToggleStatusOpen] = useState(false);
  const [userToToggle, setUserToToggle] = useState<User | null>(null);
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);

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
    const u = getStoredUser();
    if (!u || (u.role !== 'ADMIN' && u.role !== 'SUPER_ADMIN')) {
      setUnauthorized(true);
      setLoading(false);
      return;
    }
    loadUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const adminCount = users.filter((u) => u.role === 'ADMIN').length;
  const superAdminCount = users.filter((u) => u.role === 'SUPER_ADMIN').length;

  const getRoleLabel = (r: Role) => {
    switch (r) {
      case 'SUPER_ADMIN':
        return 'Kepala Humas';
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

    const finalUsername = formData.username || formData.fullName.toLowerCase().replace(/\s+/g, '.');

    try {
      await userService.create({
        fullName: formData.fullName,
        username: finalUsername,
        email: formData.email,
        phone: formData.phone,
        role: 'USER',
        roleLabel: 'Anggota Humas',
        status: formData.status,
        password: 'polinela123',
      });
      setIsCreateOpen(false);
      setCreatedCredentials({ username: finalUsername, email: formData.email });
      setIsCredsOpen(true);
      toast.success('Personel baru berhasil ditambahkan ke dalam sistem HUMASS!');
      await loadUsers();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Gagal menambahkan personel ke server.';
      toast.error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
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
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Gagal memperbarui data personel.';
      toast.error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    }
  };

  const handleToggleStatus = (user: User) => {
    setUserToToggle(user);
    setIsToggleStatusOpen(true);
  };

  const handleConfirmToggleStatus = async () => {
    if (!userToToggle) return;
    const nextStatus = userToToggle.status === 'AKTIF' ? 'NONAKTIF' : 'AKTIF';
    setIsTogglingStatus(true);
    try {
      await userService.update(userToToggle.id, { status: nextStatus });
      toast.info(`Akun "${userToToggle.fullName}" diubah menjadi ${nextStatus === 'AKTIF' ? 'Aktif' : 'Nonaktif'}.`);
      setIsToggleStatusOpen(false);
      setUserToToggle(null);
      await loadUsers();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Gagal mengubah status akun personel.';
      toast.error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    } finally {
      setIsTogglingStatus(false);
    }
  };

  const handleRemoveUser = (user: User) => {
    setUserToDelete(user);
    setIsDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await userService.remove(userToDelete.id);
      toast.success(`Personel "${userToDelete.fullName}" berhasil dihapus.`);
      setIsDeleteOpen(false);
      setUserToDelete(null);
      await loadUsers();
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Gagal menghapus personel.';
      toast.error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (passwordMode === 'custom') {
      if (newPassword.length < 8) {
        toast.error('Password baru minimal harus 8 karakter.');
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error('Password baru dan konfirmasi password tidak cocok.');
        return;
      }
    }

    const payload =
      passwordMode === 'default'
        ? { password: 'polinela123', confirmPassword: 'polinela123' }
        : { password: newPassword, confirmPassword };

    try {
      await userService.updatePassword(selectedUser.id, payload);
      setIsResetPwOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      toast.success(
        passwordMode === 'default'
          ? `Password untuk "${selectedUser.fullName}" berhasil direset menjadi "polinela123"!`
          : `Password baru untuk "${selectedUser.fullName}" berhasil disimpan!`
      );
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || 'Gagal memperbarui password.';
      toast.error(Array.isArray(errorMessage) ? errorMessage.join(', ') : errorMessage);
    }
  };

  const getRoleBadge = (role: Role, label: string) => {
    switch (role) {
      case 'SUPER_ADMIN':
        return (
          <span className="bg-purple-50 text-purple-800 font-bold px-2.5 py-1 rounded-lg text-xs border border-purple-200">
            {label}
          </span>
        );
      case 'ADMIN':
        return (
          <span className="bg-[#F0F9FF] text-[#003D58] font-bold px-2.5 py-1 rounded-lg text-xs border border-[#003D58]/30">
            {label}
          </span>
        );
      case 'USER':
      default:
        return (
          <span className="bg-sky-50 text-sky-800 font-bold px-2.5 py-1 rounded-lg text-xs border border-sky-200">
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
            <Mail className="w-3.5 h-3.5 text-[#003D58] shrink-0" />
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
      render: (item) => {
        const isProtectedRole =
          (item.role === 'SUPER_ADMIN' && superAdminCount <= 1) ||
          (item.role === 'ADMIN' && adminCount <= 1);
        return (
          <div className="flex items-center gap-1.5 justify-center">
            <button
              onClick={() => {
                setSelectedUser(item);
                setIsDetailOpen(true);
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#003D58] hover:bg-blue-50 transition-colors cursor-pointer"
              title="Lihat Detail, Edit & Reset Password"
            >
              <Eye className="w-4 h-4" />
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
              disabled={isProtectedRole}
              className={`p-1.5 rounded-lg transition-colors ${
                isProtectedRole
                  ? 'text-slate-300 opacity-40 cursor-not-allowed'
                  : 'text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer'
              }`}
              title={
                isProtectedRole
                  ? 'Satu-satunya akun Admin Humas / Kepala Humas tidak dapat dihapus'
                  : 'Hapus Personel'
              }
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        );
      },
      className: 'w-32 text-center',
    },
  ];

  if (unauthorized) {
    return (
      <AdminLayout title="Manajemen Personel & Hak Akses">
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-1">Akses Ditolak</h2>
          <p className="text-sm text-slate-400 max-w-xs">
            Halaman ini hanya dapat diakses oleh Admin Humas atau Kepala Humas.
          </p>
        </div>
      </AdminLayout>
    );
  }

  if (loading) {
    return (
      <AdminLayout title="Manajemen Personel & Hak Akses">
        <TableSkeleton statsCount={4} rows={5} />
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
          iconBgClass="bg-blue-50"
          iconColorClass="text-[#003D58]"
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
                { value: 'SUPER_ADMIN', label: 'Kepala Humas' },
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
        maxWidth="xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-5 text-[12px]">
          <div>
            <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Nama Lengkap *</label>
            <input
              type="text"
              required
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Contoh: Budi Santoso, S.I.Kom"
              className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-1 focus:ring-[#35C6D4]/30 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Username *</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="budi.s"
                className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-1 focus:ring-[#35C6D4]/30 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Email Polinela *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="budi@polinela.ac.id"
                className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-1 focus:ring-[#35C6D4]/30 rounded-[8px] px-3 text-[12px] text-[#334155] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Nomor Telepon / WhatsApp</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="0812-3456-7890"
                className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-1 focus:ring-[#35C6D4]/30 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Role / Hak Akses *</label>
              <select
                disabled
                value="USER"
                onChange={() => setFormData({ ...formData, role: 'USER' })}
                className="w-full h-[36px] bg-slate-50 border border-[#E2E8F0] rounded-[8px] px-3 text-[12px] text-slate-600 font-semibold shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none cursor-not-allowed"
              >
                <option value="USER">Anggota Humas</option>
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Hanya akun Anggota Humas yang dapat ditambahkan (Admin Humas &amp; Kepala Humas maksimal 1 akun).
              </p>
            </div>
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
              className="px-5 py-2 bg-[#003D58] hover:bg-[#002F44] active:bg-[#00263A] text-white text-[12px] font-semibold rounded-[8px] shadow-xs shadow-[#003D58]/25 transition-all cursor-pointer"
            >
              Simpan Personel
            </button>
          </div>
        </form>
      </CustomModal>

      {/* Edit User Modal */}
      <CustomModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Data Personel"
        subtitle={selectedUser ? `@${selectedUser.username}` : ''}
        maxWidth="xl"
      >
        <form onSubmit={handleEditSubmit} className="space-y-5 text-[12px]">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Nama Lengkap *</label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-1 focus:ring-[#35C6D4]/30 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Username *</label>
              <input
                type="text"
                required
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-1 focus:ring-[#35C6D4]/30 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Email Polinela *</label>
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-1 focus:ring-[#35C6D4]/30 rounded-[8px] px-3 text-[12px] text-[#334155] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Nomor WhatsApp</label>
              <input
                type="text"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-1 focus:ring-[#35C6D4]/30 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Role / Peran</label>
              {(() => {
                const canDemoteExtraAdmin = selectedUser?.role === 'ADMIN' && adminCount > 1;
                return (
                  <>
                    <select
                      disabled={!canDemoteExtraAdmin}
                      value={formData.role}
                      onChange={(e) => setFormData({ ...formData, role: e.target.value as Role })}
                      className={`w-full h-[36px] border border-[#E2E8F0] rounded-[8px] px-3 text-[12px] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all ${
                        canDemoteExtraAdmin
                          ? 'bg-white text-[#334155] focus:border-[#35C6D4] focus:ring-1 focus:ring-[#35C6D4]/30 cursor-pointer'
                          : 'bg-slate-50 text-slate-600 font-semibold cursor-not-allowed'
                      }`}
                    >
                      {canDemoteExtraAdmin ? (
                        <>
                          <option value="ADMIN">Admin Humas</option>
                          <option value="USER">Anggota Humas</option>
                        </>
                      ) : (
                        <>
                          <option value="SUPER_ADMIN">Kepala Humas</option>
                          <option value="ADMIN">Admin Humas</option>
                          <option value="USER">Anggota Humas</option>
                        </>
                      )}
                    </select>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {selectedUser?.role === 'SUPER_ADMIN'
                        ? 'Admin Humas dapat mengubah profil, username, password, dan status akun Kepala Humas.'
                        : canDemoteExtraAdmin
                        ? 'Terdapat lebih dari 1 Admin Humas. Anda dapat menurunkan akun ini ke Anggota Humas.'
                        : 'Role Admin Humas hanya dapat dimiliki oleh 1 akun.'}
                    </p>
                  </>
                );
              })()}
            </div>
            <div>
              <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Status Akun</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as UserStatus })}
                className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-1 focus:ring-[#35C6D4]/30 rounded-[8px] px-3 text-[12px] text-[#334155] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all cursor-pointer"
              >
                <option value="AKTIF">AKTIF</option>
                <option value="NONAKTIF">NONAKTIF</option>
              </select>
            </div>
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
              className="px-5 py-2 bg-[#003D58] hover:bg-[#002F44] active:bg-[#00263A] text-white text-[12px] font-semibold rounded-[8px] shadow-xs shadow-[#003D58]/25 transition-all cursor-pointer"
            >
              Simpan Perubahan
            </button>
          </div>
        </form>
      </CustomModal>

      {/* Detail User Modal */}
      <CustomModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        title="Detail Profil Personel"
        maxWidth="lg"
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200">
              <UserAvatar src={selectedUser.avatar} name={selectedUser.fullName} size="lg" />
              <div>
                <StatusBadge status={selectedUser.status} />
                <h4 className="font-bold text-base text-slate-900 mt-1">{selectedUser.fullName}</h4>
                <p className="text-xs text-[#003D58] font-semibold">{selectedUser.roleLabel}</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-700">
              <p><strong>Username:</strong> @{selectedUser.username}</p>
              <p><strong>Email Polinela:</strong> {selectedUser.email}</p>
              <p><strong>Nomor WhatsApp:</strong> {selectedUser.phone || '-'}</p>
              <p><strong>Tanggal Bergabung:</strong> {formatDateID(selectedUser.joinedAt)}</p>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <CustomButton variant="outline" size="sm" onClick={() => setIsDetailOpen(false)}>
                Tutup
              </CustomButton>
              <CustomButton
                variant="outline"
                size="sm"
                icon={KeyRound}
                onClick={() => {
                  setIsDetailOpen(false);
                  setPasswordMode('default');
                  setNewPassword('');
                  setConfirmPassword('');
                  setIsResetPwOpen(true);
                }}
              >
                Reset Password
              </CustomButton>
              <CustomButton
                variant="primary"
                size="sm"
                icon={Edit3}
                onClick={() => {
                  setIsDetailOpen(false);
                  handleOpenEdit(selectedUser);
                }}
              >
                Edit Personel
              </CustomButton>
            </div>
          </div>
        )}
      </CustomModal>
      {/* Reset / Update Password Modal */}
      <CustomModal
        isOpen={isResetPwOpen}
        onClose={() => { setIsResetPwOpen(false); }}
        title="Ubah / Reset Password Personel"
        subtitle={selectedUser ? `Akun: @${selectedUser.username}` : ''}
        maxWidth="md"
      >
        {selectedUser && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-250">
              <UserAvatar src={selectedUser.avatar} name={selectedUser.fullName} size="md" />
              <div>
                <p className="font-bold text-sm text-slate-800">{selectedUser.fullName}</p>
                <p className="text-xs text-[#003D58] font-semibold">{selectedUser.roleLabel}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
              <button
                type="button"
                onClick={() => setPasswordMode('default')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  passwordMode === 'default'
                    ? 'bg-white text-[#003D58] shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Reset ke Default
              </button>
              <button
                type="button"
                onClick={() => setPasswordMode('custom')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  passwordMode === 'custom'
                    ? 'bg-white text-[#003D58] shadow-xs'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Atur Password Baru
              </button>
            </div>

            {passwordMode === 'default' ? (
              <div className="py-1">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Password personel akan diatur kembali ke password default: <strong className="text-[#003D58] font-bold">polinela123</strong>.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">
                    Password Baru (min. 8 karakter) *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Masukkan password baru..."
                    className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-1 focus:ring-[#35C6D4]/30 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">
                    Konfirmasi Password Baru *
                  </label>
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru..."
                    className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-1 focus:ring-[#35C6D4]/30 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2.5 pt-3 border-t border-slate-100">
              <CustomButton type="button" size="sm" variant="outline" onClick={() => { setIsResetPwOpen(false); }}>
                Batal
              </CustomButton>
              <CustomButton type="submit" size="sm" variant="primary">
                {passwordMode === 'default' ? 'Ya, Reset Password' : 'Simpan Password Baru'}
              </CustomButton>
            </div>
          </form>
        )}
      </CustomModal>

      {/* Credentials Confirmation Dialog */}
      <CustomModal
        isOpen={isCredsOpen}
        onClose={() => setIsCredsOpen(false)}
        title="Personel Berhasil Ditambahkan"
        subtitle="Bagikan informasi kredensial login berikut."
        maxWidth="sm"
      >
        {createdCredentials && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <p><strong>Username:</strong> <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-150">{createdCredentials.username}</span></p>
              <p><strong>Password Default:</strong> <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-slate-150">polinela123</span></p>
              <p className="text-[11px] text-slate-400">Gunakan kredensial di atas untuk masuk ke sistem HUMASS.</p>
            </div>
            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <CustomButton
                type="button"
                variant="primary"
                className="w-full justify-center"
                onClick={() => {
                  navigator.clipboard.writeText(`Halo! Berikut kredensial login Anda untuk sistem HUMASS:\nUsername: ${createdCredentials.username}\nPassword Default: polinela123\nSilakan login di portal resmi.`);
                  toast.success('Kredensial disalin ke clipboard!');
                }}
              >
                Salin Kredensial
              </CustomButton>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`Halo! Berikut kredensial login Anda untuk sistem HUMASS:\nUsername: ${createdCredentials.username}\nPassword Default: polinela123`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-colors w-full"
              >
                Bagikan via WhatsApp
              </a>
            </div>
          </div>
        )}
      </CustomModal>
      {/* Toggle Account Status Confirmation Modal */}
      <ConfirmModal
        isOpen={isToggleStatusOpen}
        onClose={() => {
          setIsToggleStatusOpen(false);
          setUserToToggle(null);
        }}
        onConfirm={handleConfirmToggleStatus}
        title={userToToggle?.status === 'AKTIF' ? 'Konfirmasi Nonaktifkan Akun' : 'Konfirmasi Aktifkan Akun'}
        message={
          userToToggle?.status === 'AKTIF' ? (
            <>
              Apakah Anda yakin ingin menonaktifkan akun{' '}
              <strong className="text-slate-900">&quot;{userToToggle?.fullName}&quot;</strong>{' '}
              (@{userToToggle?.username})? Akun ini tidak akan dapat login maupun ditugaskan pada kegiatan atau content plan hingga diaktifkan kembali.
            </>
          ) : (
            <>
              Apakah Anda yakin ingin mengaktifkan kembali akun{' '}
              <strong className="text-slate-900">&quot;{userToToggle?.fullName}&quot;</strong>{' '}
              (@{userToToggle?.username})? Akun ini akan kembali memiliki akses ke sistem HUMASS.
            </>
          )
        }
        confirmText={userToToggle?.status === 'AKTIF' ? 'Ya, Nonaktifkan' : 'Ya, Aktifkan'}
        cancelText="Batal"
        variant={userToToggle?.status === 'AKTIF' ? 'warning' : 'primary'}
        isLoading={isTogglingStatus}
      />

      {/* Delete User Confirmation Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => {
          setIsDeleteOpen(false);
          setUserToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Konfirmasi Hapus Personel"
        message={
          <>
            Apakah Anda yakin ingin menghapus personel{' '}
            <strong className="text-slate-900">&quot;{userToDelete?.fullName}&quot;</strong>{' '}
            (@{userToDelete?.username}) dari sistem? Tindakan ini akan menghapus akses akun secara permanen.
          </>
        }
        confirmText="Ya, Hapus Personel"
        cancelText="Batal"
        variant="danger"
        isLoading={isDeleting}
      />
    </AdminLayout>
  );
}
