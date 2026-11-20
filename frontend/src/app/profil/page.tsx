'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/layout/AdminLayout';
import { CustomButton, StatusBadge } from '@/components/common';
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
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { authService, userService, dashboardService } from '@/services';
import { formatDateID, isValidImageSrc } from '@/utils/formatters';
import { getStoredUser, syncUserSession } from '@/utils/session';

const DEFAULT_UNIT = 'Unit Kehumasan & Publikasi Politeknik Negeri Lampung';

export default function ProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [accountStatus, setAccountStatus] = useState('AKTIF');

  // Stats State
  const [stats, setStats] = useState({
    liputan: 0,
    publikasi: 0,
    peminjaman: 0,
  });

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
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form Validation & Loading States
  const [formErrors, setFormErrors] = useState<{ email?: string; phone?: string; fullName?: string; username?: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const formatPhoneNumber = (val: string) => {
    let digits = val.replace(/\D/g, '');
    if (digits.startsWith('62')) {
      digits = '0' + digits.slice(2);
    }
    if (digits.length <= 4) return digits;
    if (digits.length <= 8) return `${digits.slice(0, 4)}-${digits.slice(4)}`;
    return `${digits.slice(0, 4)}-${digits.slice(4, 8)}-${digits.slice(8, 13)}`;
  };

  const handlePhoneChange = (val: string) => {
    const formatted = formatPhoneNumber(val);
    setProfileData((prev) => ({ ...prev, phone: formatted }));
    if (formErrors.phone) {
      setFormErrors((prev) => ({ ...prev, phone: undefined }));
    }
  };

  const handleEmailChange = (val: string) => {
    setProfileData((prev) => ({ ...prev, email: val }));
    if (formErrors.email) {
      setFormErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const [userRes, summaryRes] = await Promise.allSettled([
          authService.profile(),
          dashboardService.summary(),
        ]);

        if (userRes.status === 'fulfilled') {
          const user = userRes.value;
          syncUserSession(user);
          setProfileData({
            fullName: user.fullName || '',
            username: user.username || '',
            nip: user.nip || '',
            email: user.email || '',
            phone: user.phone || '',
            roleLabel: user.roleLabel,
            unit: DEFAULT_UNIT,
            joinedAt: formatDateID(user.joinedAt),
            avatar: user.avatar || '',
          });
          setAccountStatus(user.status);

          if (user.stats) {
            setStats(user.stats);
          } else if (summaryRes.status === 'fulfilled') {
            const sum = summaryRes.value;
            if (user.role === 'USER') {
              setStats({
                liputan: sum.statistics?.myAssignedActivitiesCount ?? 0,
                publikasi: sum.statistics?.myAssignedContentPlansCount ?? 0,
                peminjaman: sum.actionItems?.find((a: any) => a.id === 'pinjam-aktif')?.count ?? 0,
              });
            } else {
              setStats({
                liputan: sum.statistics?.totalActivities ?? 0,
                publikasi: sum.statistics?.totalContentPlans ?? 0,
                peminjaman: sum.statistics?.totalLoans ?? 0,
              });
            }
          }
        }
      } catch {
        toast.error('Gagal memuat profil dari server.');
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, []);

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: { email?: string; phone?: string; fullName?: string; username?: string } = {};

    if (!profileData.fullName.trim()) {
      errors.fullName = 'Nama lengkap wajib diisi!';
    }

    if (!profileData.username.trim()) {
      errors.username = 'Username akun wajib diisi!';
    } else if (profileData.username.trim().length < 3) {
      errors.username = 'Username minimal 3 karakter!';
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!profileData.email.trim()) {
      errors.email = 'Email institusi wajib diisi!';
    } else if (!emailRegex.test(profileData.email.trim())) {
      errors.email = 'Format email tidak valid (contoh: user@polinela.ac.id)';
    }

    // Phone format validation (if provided)
    if (profileData.phone.trim()) {
      const cleanDigits = profileData.phone.replace(/\D/g, '');
      if (!cleanDigits.startsWith('08') || cleanDigits.length < 10 || cleanDigits.length > 13) {
        errors.phone = 'Nomor telepon harus diawali 08 dengan 10-13 digit (contoh: 0812-3456-7890)';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Periksa kembali format isian formulir profil.');
      return;
    }

    setFormErrors({});
    setIsSubmitting(true);
    try {
      const updatedUser = await authService.updateProfile({
        fullName: profileData.fullName.trim(),
        username: profileData.username.trim(),
        nip: profileData.nip.trim(),
        email: profileData.email.trim(),
        phone: profileData.phone.trim(),
      });

      syncUserSession(updatedUser);
      setProfileData((prev) => ({
        ...prev,
        fullName: updatedUser.fullName,
        username: updatedUser.username,
        nip: updatedUser.nip || '',
        email: updatedUser.email,
        phone: updatedUser.phone || '',
        avatar: updatedUser.avatar || prev.avatar,
      }));

      // Trigger custom storage event so other components (Navbar etc) refresh user name
      window.dispatchEvent(new Event('storage'));
      toast.success('Informasi profil pribadi dan kontak berhasil disimpan ke server!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal menyimpan profil ke server.';
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
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

    setIsChangingPassword(true);
    try {
      await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      toast.success('Kata sandi keamanan akun berhasil diperbarui!');
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gagal memperbarui kata sandi.';
      toast.error(msg);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2 MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Ukuran foto maksimal 2 MB.');
      return;
    }

    const storedUser = getStoredUser();
    if (!storedUser?.id) {
      toast.error('Session tidak ditemukan, silakan login ulang.');
      return;
    }

    // Convert to base64 data URL
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const updated = await authService.updateProfile({ avatar: base64 });
        const avatarUrl = updated.avatar || base64;
        setProfileData((prev) => ({ ...prev, avatar: avatarUrl }));
        syncUserSession({ ...storedUser, avatar: avatarUrl });
        window.dispatchEvent(new Event('storage'));
        toast.success('Foto profil berhasil diperbarui!');
      } catch (err: any) {
        const msg = err.response?.data?.message || 'Gagal menyimpan foto profil ke server.';
        toast.error(msg);
      }
    };
    reader.readAsDataURL(file);
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
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-8">
          <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs flex flex-col items-center gap-4 shimmer-card">
            <div className="w-28 h-28 rounded-full bg-slate-100 animate-shimmer" />
            <div className="h-5 w-36 rounded bg-slate-100 animate-shimmer" />
            <div className="h-4 w-24 rounded bg-slate-100/70 animate-shimmer" />
            <div className="w-full h-20 rounded-xl bg-slate-50 animate-shimmer mt-2" />
          </div>
          <div className="lg:col-span-8 bg-white rounded-2xl border border-slate-200/90 p-6 shadow-xs space-y-4 shimmer-card">
            <div className="h-6 w-48 rounded bg-slate-100 animate-shimmer mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="h-10 rounded-xl bg-slate-50 animate-shimmer" />
              <div className="h-10 rounded-xl bg-slate-50 animate-shimmer" />
              <div className="h-10 rounded-xl bg-slate-50 animate-shimmer" />
              <div className="h-10 rounded-xl bg-slate-50 animate-shimmer" />
            </div>
            <div className="h-10 rounded-xl bg-slate-50 animate-shimmer mt-4" />
          </div>
        </div>
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
            <div className="w-28 h-28 rounded-full overflow-hidden border-4 border-[#003D58]/20 shadow-md">
              {isValidImageSrc(profileData.avatar) ? (
                <img src={profileData.avatar} alt={profileData.fullName} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-blue-100 flex items-center justify-center text-[#003D58] font-bold text-2xl">
                  {profileData.fullName ? profileData.fullName.charAt(0) : '?'}
                </div>
              )}
            </div>
            <div className="absolute inset-0 bg-slate-900/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <div className="absolute bottom-1 right-1 w-7 h-7 rounded-full bg-[#003D58] text-white flex items-center justify-center border-2 border-white shadow-sm">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <input type="file" accept="image/*" ref={fileInputRef} className="hidden" onChange={handleAvatarChange} />

          {/* Name & Title */}
          <div className="space-y-1">
            <h2 className="text-base font-bold text-slate-900">{profileData.fullName}</h2>
            <p className="text-xs text-slate-400">@{profileData.username}</p>
            <div className="pt-2">
              <span className="inline-flex items-center gap-1.5 bg-[#F0F9FF] text-[#003D58] font-semibold px-3 py-1 rounded-full text-xs border border-blue-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>{profileData.roleLabel}</span>
              </span>
            </div>
          </div>

          {/* Quick Stats Grid */}
          <div className="w-full grid grid-cols-3 gap-2 pt-4 border-t border-slate-100">
            <div className="p-2.5 rounded-xl bg-slate-50 text-center">
              <p className="text-sm font-extrabold text-slate-800">{stats.liputan}</p>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">Liputan</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 text-center">
              <p className="text-sm font-extrabold text-[#003D58]">{stats.publikasi}</p>
              <p className="text-[10px] font-medium text-slate-400 mt-0.5">Publikasi</p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 text-center">
              <p className="text-sm font-extrabold text-slate-800">{stats.peminjaman}</p>
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
                <User className="w-5 h-5 text-[#003D58]" />
                <h3 className="text-base font-bold text-slate-800">Informasi Pribadi & Kontak</h3>
              </div>
              <span className="text-xs text-slate-400 italic">Perubahan memerlukan otorisasi admin</span>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4 text-[12px]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Nama Lengkap *</label>
                  <input
                    type="text"
                    required
                    value={profileData.fullName}
                    onChange={(e) => {
                      setProfileData({ ...profileData, fullName: e.target.value });
                      if (formErrors.fullName) setFormErrors((p) => ({ ...p, fullName: undefined }));
                    }}
                    className={`w-full h-[36px] bg-white border ${
                      formErrors.fullName ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-[#35C6D4]/30'
                    } focus:ring-1 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all`}
                  />
                  {formErrors.fullName && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {formErrors.fullName}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Username Akun *</label>
                  <input
                    type="text"
                    required
                    value={profileData.username}
                    onChange={(e) => {
                      setProfileData({ ...profileData, username: e.target.value });
                      if (formErrors.username) setFormErrors((p) => ({ ...p, username: undefined }));
                    }}
                    className={`w-full h-[36px] bg-white border ${
                      formErrors.username ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-[#35C6D4]/30'
                    } focus:ring-1 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all`}
                  />
                  {formErrors.username && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {formErrors.username}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Nomor Induk Pegawai (NIP)</label>
                  <input
                    type="text"
                    value={profileData.nip}
                    onChange={(e) => setProfileData({ ...profileData, nip: e.target.value })}
                    className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-1 focus:ring-[#35C6D4]/30 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Nomor Telepon / WhatsApp</label>
                  <input
                    type="text"
                    value={profileData.phone}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    placeholder="Contoh: 0812-3456-7890"
                    className={`w-full h-[36px] bg-white border ${
                      formErrors.phone ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-[#35C6D4]/30'
                    } focus:ring-1 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all`}
                  />
                  {formErrors.phone && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {formErrors.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Email Institusi Polinela *</label>
                  <input
                    type="email"
                    required
                    value={profileData.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    placeholder="nama@polinela.ac.id"
                    className={`w-full h-[36px] bg-white border ${
                      formErrors.email ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500/20' : 'border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-[#35C6D4]/30'
                    } focus:ring-1 rounded-[8px] px-3.5 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all`}
                  />
                  {formErrors.email && (
                    <p className="mt-1 flex items-center gap-1 text-[11px] text-rose-500 font-medium">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                      {formErrors.email}
                    </p>
                  )}
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
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#003D58] hover:bg-[#002F44] active:bg-[#00263A] disabled:opacity-50 text-white text-[12px] font-semibold rounded-[8px] shadow-xs shadow-[#003D58]/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5" />
                  )}
                  {isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan Profil'}
                </button>
              </div>
            </form>
          </div>

          {/* Security & Password Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
              <KeyRound className="w-5 h-5 text-[#003D58]" />
              <h3 className="text-base font-bold text-slate-800">Pengaturan Keamanan & Kata Sandi</h3>
            </div>

            <form onSubmit={handlePasswordSubmit} className="space-y-4 text-[12px]">
              <div>
                <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Kata Sandi Saat Ini *</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                    placeholder="Masukkan kata sandi lama Anda..."
                    className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-1 focus:ring-[#35C6D4]/30 rounded-[8px] pl-9 pr-10 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
                  />
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded transition-colors cursor-pointer"
                    title={showCurrentPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                    aria-label={showCurrentPassword ? "Sembunyikan kata sandi saat ini" : "Lihat kata sandi saat ini"}
                  >
                    {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Kata Sandi Baru *</label>
                  <div className="relative">
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      value={passwordForm.newPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      placeholder="Minimal 6 karakter"
                      className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-1 focus:ring-[#35C6D4]/30 rounded-[8px] pl-9 pr-10 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded transition-colors cursor-pointer"
                      title={showNewPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                      aria-label={showNewPassword ? "Sembunyikan kata sandi baru" : "Lihat kata sandi baru"}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-[600] leading-[16px] text-[#334155] mb-1.5">Konfirmasi Kata Sandi Baru *</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={passwordForm.confirmPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      placeholder="Ulangi kata sandi baru"
                      className="w-full h-[36px] bg-white border border-[#E2E8F0] focus:border-[#35C6D4] focus:ring-1 focus:ring-[#35C6D4]/30 rounded-[8px] pl-9 pr-10 text-[12px] text-[#334155] placeholder:text-[#CBD5E1] shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-2.5 top-2 text-slate-400 hover:text-slate-600 focus:outline-none p-1 rounded transition-colors cursor-pointer"
                      title={showConfirmPassword ? "Sembunyikan kata sandi" : "Lihat kata sandi"}
                      aria-label={showConfirmPassword ? "Sembunyikan konfirmasi kata sandi baru" : "Lihat konfirmasi kata sandi baru"}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-3 border-t border-slate-100">
                <button
                  type="submit"
                  disabled={isChangingPassword}
                  className="px-5 py-2 bg-[#003D58] hover:bg-[#002F44] active:bg-[#00263A] disabled:opacity-50 text-white text-[12px] font-semibold rounded-[8px] shadow-xs shadow-[#003D58]/25 transition-all flex items-center gap-1.5 cursor-pointer disabled:cursor-not-allowed"
                >
                  {isChangingPassword ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <ShieldCheck className="w-3.5 h-3.5" />
                  )}
                  {isChangingPassword ? 'Memperbarui...' : 'Perbarui Kata Sandi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
