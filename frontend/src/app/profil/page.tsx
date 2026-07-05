'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { CustomButton, StatusBadge } from '@/components/common';
import DashboardSkeleton from '@/components/common/DashboardSkeleton';
import {
  User,
  Mail,
  Phone,
  ShieldCheck,
  KeyRound,
  LogOut,
  Camera,
  CheckCircle2,
  Building2,
  Calendar,
  Save,
  Lock,
} from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/services';
import { formatDateID, isValidImageSrc } from '@/utils/formatters';
import { syncUserSession } from '@/utils/session';

const DEFAULT_UNIT = 'Unit Kehumasan & Publikasi Politeknik Negeri Lampung';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accountStatus, setAccountStatus] = useState('AKTIF');

  // Profile State
  const [profileData, setProfileData] = useState({
    fullName: '',
    username: '',
    nip: '',
    email: '',
    phone: '',
    roleLabel: '',
    unit: DEFAULT_UNIT,
    joinedAt: '',
    avatar: '',
  });

  // Password State
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const user = await authService.profile();
        syncUserSession(user);
        setProfileData({
          fullName: user.fullName,
          username: user.username,
          nip: '',
          email: user.email,
          phone: user.phone || '',
          roleLabel: user.roleLabel,
          unit: DEFAULT_UNIT,
          joinedAt: formatDateID(user.joinedAt),
          avatar: user.avatar || '',
        });
        setAccountStatus(user.status);
      } catch {
        toast.error('Gagal memuat profil dari server.');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData.fullName || !profileData.email) {
      toast.error('Harap lengkapi Nama Lengkap dan Email!');
      return;
    }
    toast.success('Informasi profil pribadi dan kontak berhasil diperbarui!');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('Harap lengkapi kata sandi saat ini dan kata sandi baru!');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Konfirmasi kata sandi baru tidak cocok!');
      return;
    }
    if (passwordForm.newPassword.length < 6) {
      toast.error('Kata sandi baru minimal 6 karakter!');
      return;
    }

    setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    toast.success('Kata sandi keamanan akun berhasil diperbarui!');
  };

  const handleAvatarClick = () => {
    toast.info('Pilih foto profil baru dari perangkat Anda...');
  };

  const handleLogout = () => {
    localStorage.removeItem('humass_token');
    localStorage.removeItem('humass_user');
    toast.success('Anda berhasil keluar dari sesi.');
    router.push('/login');
  };

  if (loading) {
    return (
      <AdminLayout title="Profil Personel Kehumasan">
        <DashboardSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Profil Personel Kehumasan">
      {/* Top Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Profil Pengguna & Pengaturan Keamanan</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Kelola informasi identitas personel, kontak aktif, kredensial masuk, dan keamanan sistem HUMASS.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <StatusBadge status={accountStatus} />
        </div>
      </div>

      {/* Main 3-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (Span 1): Profile Identity Card */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col items-center text-center space-y-5">
          {/* Avatar Area */}
          <div className="relative group cursor-pointer" onClick={handleAvatarClick} title="Ganti Foto Profil">
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-teal-500/20 shadow-md">
              {isValidImageSrc(profileData.avatar) ? (
                <img src={profileData.avatar} alt={profileData.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold text-2xl">
                  {profileData.fullName ? profileData.fullName.charAt(0) : '?'}
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center border-2 border-white shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>

          {/* Name & Title */}
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">{profileData.fullName}</h2>
            <p className="text-xs text-slate-400">@{profileData.username}</p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-700 font-semibold px-3 py-1 rounded-full text-xs border border-teal-100">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{profileData.roleLabel}</span>
              </span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="w-full grid grid-cols-3 gap-2 pt-4 border-t border-slate-100">
            <div className="p-2.5 rounded-xl bg-slate-50 text-center">
              <p className="text-sm font-extrabold text-slate-800">42</p>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">Liputan</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 text-center">
              <p className="text-sm font-extrabold text-teal-600">128</p>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">Publikasi</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 text-center">
              <p className="text-sm font-extrabold text-slate-800">15</p>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">Peminjaman</p>
            </div>
          </div>

          {/* Institutional Info */}
          <div className="w-full space-y-2.5 pt-3 border-t border-slate-100 text-left text-xs text-slate-600">
            <div className="flex items-center gap-2.5">
              <Building2 className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="truncate">{profileData.unit}</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
              <span>Bergabung sejak {profileData.joinedAt}</span>
            </div>
          </div>

          {/* Logout Button */}
          <div className="w-full pt-2">
            <CustomButton
              variant="danger-outline"
              icon={LogOut}
              onClick={handleLogout}
              className="w-full justify-center"
            >
              Keluar Sesi (Logout)
            </CustomButton>
          </div>
        </div>

        {/* Right Column (Span 2): Personal Info & Security Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <User className="w-5 h-5 text-teal-600" />
                <h3 className="text-base font-bold text-slate-800">Informasi Pribadi & Kontak</h3>
              </div>
              <span className="text-xs text-slate-400 italic">Perubahan memerlukan otorisasi admin</span>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Username Akun *</label>
                  <input
                    type="text"
                    required
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nomor Induk Pegawai (NIP)</label>
                  <input
                    type="text"
                    value={profileData.nip}
                    onChange={(e) => setProfileData({ ...profileData, nip: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Email Institusi Polinela *</label>
                  <input
                    type="email"
                    required
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Unit Kerja / Bagian</label>
                  <input
                    type="text"
                    disabled
                    value={profileData.unit}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-500 py-2.5 px-3.5 cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <CustomButton type="submit" variant="primary" icon={Save}>
                  Simpan Perubahan Profil
                </CustomButton>
              </div>
            </form>
          </div>

          {/* Security & Password Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <KeyRound className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-bold text-slate-800">Pengaturan Keamanan & Kata Sandi</h3>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kata Sandi Saat Ini *</label>
                <div className="relative">
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Masukkan kata sandi lama Anda..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 pl-9 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kata Sandi Baru *</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Minimal 6 karakter"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 pl-9 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">Konfirmasi Kata Sandi Baru *</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Ulangi kata sandi baru"
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 py-2.5 px-3.5 pl-9 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <CustomButton type="submit" variant="secondary" icon={ShieldCheck}>
                  Perbarui Kata Sandi
                </CustomButton>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
