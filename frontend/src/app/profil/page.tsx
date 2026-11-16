'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { CustomButton, StatusBadge } from '@/components/common';
import DashboardSkeleton from '@/components/common/DashboardSkeleton';
import {
  User,
  ShieldCheck,
  KeyRound,
  LogOut,
  Camera,
  CheckCircle2,
  Building2,
  Calendar,
  Save,
  Lock,
  Loader2,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { userService } from '@/services';
import { formatDateID, isValidImageSrc } from '@/utils/formatters';
import { uploadImageToCloudinary } from '@/utils/cloudinary';
import { syncUserSession } from '@/utils/session';

const DEFAULT_UNIT = 'Unit Kehumasan & Publikasi Politeknik Negeri Lampung';

function getApiErrorMessage(err: unknown, fallback: string): string {
  const responseData = (err as { response?: { data?: { message?: string | string[] } } })?.response
    ?.data;
  if (responseData?.message) {
    return Array.isArray(responseData.message)
      ? responseData.message.join(', ')
      : responseData.message;
  }
  if (err instanceof Error && err.message) {
    return err.message;
  }
  return fallback;
}

export default function ProfilePage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [accountStatus, setAccountStatus] = useState('AKTIF');
  const [stats, setStats] = useState({ activities: 0, contentPlans: 0, loans: 0 });

  // Profile State
  const [profileData, setProfileData] = useState({
    fullName: '',
    username: '',
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
        const user = await userService.getMe();
        syncUserSession(user);
        setProfileData({
          fullName: user.fullName,
          username: user.username,
          email: user.email,
          phone: user.phone || '',
          roleLabel: user.roleLabel,
          unit: DEFAULT_UNIT,
          joinedAt: formatDateID(user.joinedAt),
          avatar: user.avatar || '',
        });
        setAccountStatus(user.status);
        if (user.stats) {
          setStats(user.stats);
        }
      } catch (err) {
        toast.error(getApiErrorMessage(err, 'Gagal memuat profil dari server.'));
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileData.fullName.trim() || !profileData.username.trim() || !profileData.email.trim()) {
      toast.error('Harap lengkapi Nama Lengkap, Username, dan Email!');
      return;
    }
    if (profileData.fullName.trim().length < 3 || profileData.username.trim().length < 3) {
      toast.error('Nama Lengkap dan Username minimal 3 karakter!');
      return;
    }

    setSavingProfile(true);
    try {
      const updated = await userService.updateMe({
        fullName: profileData.fullName.trim(),
        username: profileData.username.trim(),
        email: profileData.email.trim(),
        phone: profileData.phone.trim(),
      });
      syncUserSession(updated);
      setProfileData((prev) => ({
        ...prev,
        fullName: updated.fullName,
        username: updated.username,
        email: updated.email,
        phone: updated.phone || '',
        avatar: updated.avatar || prev.avatar,
      }));
      toast.success('Informasi profil pribadi dan kontak berhasil disimpan ke server!');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal memperbarui informasi profil.'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      toast.error('Harap lengkapi kata sandi saat ini dan kata sandi baru!');
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast.error('Kata sandi baru minimal 8 karakter!');
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Konfirmasi kata sandi baru tidak cocok!');
      return;
    }
    if (passwordForm.newPassword === passwordForm.currentPassword) {
      toast.error('Kata sandi baru harus berbeda dari kata sandi saat ini!');
      return;
    }

    setSavingPassword(true);
    try {
      const res = await userService.changeMyPassword({
        currentPassword: passwordForm.currentPassword,
        password: passwordForm.newPassword,
        confirmPassword: passwordForm.confirmPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success(res.message || 'Kata sandi keamanan akun berhasil diperbarui!');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal memperbarui kata sandi.'));
    } finally {
      setSavingPassword(false);
    }
  };

  const handleAvatarClick = () => {
    if (uploadingAvatar) return;
    fileInputRef.current?.click();
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    setUploadingAvatar(true);
    try {
      const avatarUrl = await uploadImageToCloudinary(file);
      const updated = await userService.updateMe({ avatar: avatarUrl });
      syncUserSession(updated);
      setProfileData((prev) => ({ ...prev, avatar: updated.avatar || avatarUrl }));
      toast.success('Foto profil berhasil diunggah dan disimpan!');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal mengunggah foto profil.'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleRemoveAvatar = async () => {
    if (uploadingAvatar || !profileData.avatar) return;
    setUploadingAvatar(true);
    try {
      const updated = await userService.updateMe({ avatar: null });
      syncUserSession(updated);
      setProfileData((prev) => ({ ...prev, avatar: '' }));
      toast.success('Foto profil berhasil dihapus.');
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Gagal menghapus foto profil.'));
    } finally {
      setUploadingAvatar(false);
    }
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
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleAvatarFileChange}
            className="hidden"
          />
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
            <div
              className={`absolute inset-0 bg-slate-900/45 rounded-full flex items-center justify-center transition-opacity ${
                uploadingAvatar ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
              }`}
            >
              {uploadingAvatar ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </div>
            <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-teal-600 text-white flex items-center justify-center border-2 border-white shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          {isValidImageSrc(profileData.avatar) && (
            <button
              type="button"
              disabled={uploadingAvatar}
              onClick={handleRemoveAvatar}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-rose-600 hover:text-rose-700 disabled:opacity-50 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Hapus Foto Profil
            </button>
          )}

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
              <p className="text-sm font-extrabold text-slate-800">{stats.activities}</p>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">Liputan</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 text-center">
              <p className="text-sm font-extrabold text-teal-600">{stats.contentPlans}</p>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">Publikasi</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 text-center">
              <p className="text-sm font-extrabold text-slate-800">{stats.loans}</p>
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
              <span className="text-xs text-slate-400 italic">Data tersimpan langsung ke akun server</span>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4 text-[12px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={profileData.fullName}
                    onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                    className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Username Akun *</label>
                  <input
                    type="text"
                    required
                    value={profileData.username}
                    onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                    className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Email Institusi Polinela *</label>
                  <input
                    type="email"
                    required
                    value={profileData.email}
                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                    className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={profileData.phone}
                    onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                    className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Jabatan / Peran Sistem</label>
                  <input
                    type="text"
                    disabled
                    value={profileData.roleLabel}
                    className="w-full h-[36px] bg-slate-100 border border-[#E2E8F0] rounded-[8px] px-3.5 text-[12px] text-slate-500 shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Unit Kerja / Bagian</label>
                  <input
                    type="text"
                    disabled
                    value={profileData.unit}
                    className="w-full h-[36px] bg-slate-100 border border-[#E2E8F0] rounded-[8px] px-3.5 text-[12px] text-slate-500 shadow-[0_1px_2px_rgba(0,0,0,0.05)] cursor-not-allowed"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={savingProfile}
                  className="px-5 py-2 bg-gradient-to-r from-[#0D9488] to-[#14B8A6] hover:from-[#0F766E] hover:to-[#0D9488] disabled:opacity-60 text-white text-[12px] font-semibold rounded-[8px] shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  {savingProfile ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
                </button>
              </div>
            </form>
          </div>

          {/* Security & Password Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <KeyRound className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-bold text-slate-800">Pengaturan Keamanan & Kata Sandi</h3>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-[12px]">
              <div>
                <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Kata Sandi Saat Ini *</label>
                <div className="relative">
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Masukkan kata sandi lama Anda..."
                    className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25 rounded-[8px] pl-9 pr-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Kata Sandi Baru *</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Minimal 8 karakter"
                      className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25 rounded-[8px] pl-9 pr-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Konfirmasi Kata Sandi Baru *</label>
                  <div className="relative">
                    <input
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Ulangi kata sandi baru"
                      className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#0D9488] focus:ring-1 focus:ring-[#0D9488]/25 rounded-[8px] pl-9 pr-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={savingPassword}
                  className="px-5 py-2 bg-gradient-to-r from-[#0D9488] to-[#14B8A6] hover:from-[#0F766E] hover:to-[#0D9488] disabled:opacity-60 text-white text-[12px] font-semibold rounded-[8px] shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  {savingPassword ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  {savingPassword ? 'Memperbarui...' : 'Perbarui Kata Sandi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
