'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Eye, EyeOff, AlertCircle, ShieldAlert, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/services';
import CustomModal from '@/components/common/CustomModal';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [modalData, setModalData] = useState<{
    isOpen: boolean;
    title: string;
    fullName?: string;
    roleLabel?: string;
    message: string;
    isMobileAdvice?: boolean;
  }>({
    isOpen: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    // If already logged in with valid web admin credentials, redirect to dashboard
    const token = typeof window !== 'undefined' ? localStorage.getItem('humass_token') : null;
    const stored = typeof window !== 'undefined' ? localStorage.getItem('humass_user') : null;
    if (token && stored) {
      try {
        const user = JSON.parse(stored);
        if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
          router.replace('/dashboard');
          return;
        } else {
          localStorage.removeItem('humass_token');
          localStorage.removeItem('humass_user');
        }
      } catch {
        localStorage.removeItem('humass_token');
        localStorage.removeItem('humass_user');
      }
    }

    const params = new URLSearchParams(window.location.search);
    const err = params.get('error');
    if (err === 'mobile_only' || err === 'admin_only') {
      const msg = 'Akses Web hanya untuk Admin Humas & Kepala Humas. Anggota Humas hanya dapat mengakses melalui aplikasi mobile.';
      setError(msg);
      toast.error('Akses Web Ditolak', {
        description: 'Hanya Admin Humas dan Kepala Humas yang dapat mengakses sistem Web. Anggota Humas silakan gunakan aplikasi mobile.',
        duration: 6000,
      });
      setModalData({
        isOpen: true,
        title: 'Akses Khusus Web Admin',
        roleLabel: 'Anggota Humas',
        message: 'Akun Anda merupakan Anggota Humas. Sistem Web ini hanya diperuntukkan bagi Admin Humas dan Kepala Humas. Seluruh aktivitas penugasan dan laporan anggota silakan diakses melalui aplikasi mobile Humas Polinela.',
        isMobileAdvice: true,
      });
    } else if (err === 'unauthorized') {
      const msg = 'Akses ditolak. Pengguna tanpa autentikasi atau role yang tidak sesuai tidak dapat mengakses halaman terproteksi.';
      setError(msg);
      toast.error('Akses Terproteksi Ditolak', {
        description: 'Anda harus masuk menggunakan akun Admin Humas atau Kepala Humas.',
        duration: 5000,
      });
    } else if (err === 'forbidden') {
      const msg = 'Akses ditolak. Role akun Anda tidak memiliki izin untuk mengakses halaman tersebut.';
      setError(msg);
      toast.error('Akses Dibatasi', {
        description: msg,
        duration: 5000,
      });
    } else if (err === 'session_expired') {
      const msg = 'Sesi Anda telah berakhir atau tidak valid. Silakan masuk kembali.';
      setError(msg);
      toast.warning('Sesi Berakhir', {
        description: msg,
        duration: 4000,
      });
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authService.login(username, password);
      const token = data.accessToken || data.token;
      if (token) {
        // Not Admin Humas and Not Kepala Humas
        if (data.user?.role === 'USER') {
          const userFullName = data.user?.fullName || username;
          const userRoleLabel = data.user?.roleLabel || 'Anggota Humas';
          const msg = 'Akses Web ditolak. Anggota Humas hanya dapat mengakses sistem melalui aplikasi mobile.';
          setError(msg);

          toast.error('Akses Web Ditolak: Bukan Admin / Kepala Humas', {
            description: `Halo ${userFullName}, akun Anda terdaftar sebagai ${userRoleLabel}. Web ini khusus untuk Admin Humas dan Kepala Humas. Silakan gunakan aplikasi mobile.`,
            duration: 8000,
          });

          setModalData({
            isOpen: true,
            title: 'Akses Web Ditolak',
            fullName: userFullName,
            roleLabel: userRoleLabel,
            message: 'Aplikasi Web ini khusus digunakan oleh Admin Humas dan Kepala Humas untuk monitoring, verifikasi, dan persetujuan. Anggota Humas dapat mengakses tugas, absensi, dan riwayat kegiatan melalui aplikasi mobile Humas Polinela.',
            isMobileAdvice: true,
          });
          return;
        }

        if (data.user?.role !== 'ADMIN' && data.user?.role !== 'SUPER_ADMIN') {
          const userFullName = data.user?.fullName || username;
          const userRoleLabel = data.user?.roleLabel || data.user?.role || 'Pengguna Tidak Dikenal';
          const msg = 'Akses ditolak. Akun Anda bukan Admin Humas atau Kepala Humas.';
          setError(msg);

          toast.error('Akses Ditolak: Role Tidak Sesuai', {
            description: `Akun (${userRoleLabel}) tidak memiliki hak akses ke Web Admin Humas.`,
            duration: 7000,
          });

          setModalData({
            isOpen: true,
            title: 'Akses Ditolak',
            fullName: userFullName,
            roleLabel: userRoleLabel,
            message: 'Akun Anda tidak memiliki izin untuk masuk ke dalam sistem Web Admin Kehumasan Polinela. Hanya personel dengan hak akses Admin Humas dan Kepala Humas yang dapat mengakses sistem ini.',
            isMobileAdvice: false,
          });
          return;
        }

        localStorage.setItem('humass_token', token);
        localStorage.setItem('humass_user', JSON.stringify(data.user));
        toast.success('Login berhasil! Selamat datang, ' + (data.user?.fullName || 'Admin Humas'));
        router.push('/dashboard');
      }
    } catch (err: any) {
      const errorMsg = err?.response?.data?.message || 'Username atau password salah.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex flex-col lg:flex-row antialiased select-none text-[#102F37] bg-white overflow-x-hidden"
      style={{ fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" }}
    >
      {/* ── LEFT SIDE: Brand Showcase Hero Panel ("humas") ── */}
      <aside
        className="relative w-full lg:w-1/2 min-h-[500px] lg:min-h-screen flex flex-col justify-between p-8 sm:p-12 lg:p-14 text-white overflow-hidden shrink-0"
        style={{
          background: 'radial-gradient(107.72% 128.65% at 83% 18%, rgba(116, 236, 226, 0.25) 0%, rgba(116, 236, 226, 0) 25%), linear-gradient(140.1deg, #063F4C 0%, #075965 54%, #0B7C87 100%)',
          mixBlendMode: 'normal',
        }}
      >
        {/* Exact Figma Background Decorative Shapes from the design */}
        {/* Top Overlay+Blur (Pill) */}
        <div
          className="absolute pointer-events-none rounded-[168.75px]"
          style={{
            height: '337.5px',
            left: '34%',
            right: '32.52%',
            top: '-187.5px',
            background: 'rgba(104, 228, 222, 0.16)',
            filter: 'blur(0.625px)',
          }}
        />

        {/* Border+Blur circle at top-right */}
        <div
          className="absolute pointer-events-none rounded-[68.75px]"
          style={{
            left: '75.36%',
            right: '11%',
            top: '27%',
            bottom: '56.71%',
            border: '1.25px solid rgba(139, 235, 231, 0.15)',
            filter: 'blur(0.625px)',
          }}
        />

        {/* Large concentric border circle with multi-layer shadow at bottom-right */}
        <div
          className="absolute pointer-events-none rounded-[337.5px]"
          style={{
            width: '675px',
            height: '675px',
            right: '-180px',
            bottom: '-200px',
            border: '1.25px solid rgba(255, 255, 255, 0.14)',
            boxShadow: '0px 0px 0px 87.5px rgba(255, 255, 255, 0.035), 0px 0px 0px 175px rgba(255, 255, 255, 0.024)',
          }}
        />

        {/* Subtle mid-left circular arc */}
        <div className="absolute top-1/2 -left-20 w-80 h-80 rounded-full border border-white/[0.05] pointer-events-none" />

        {/* Top spacer (top-left logo and 'POLINELA HUMAS' text removed) */}
        <div className="h-4" />

        {/* Center Main Branding Content */}
        <div className="flex flex-col items-center text-center my-auto py-10 z-10 max-w-md mx-auto">
          {/* Logo */}
          <div className="mb-6 relative group">
            <div className="absolute inset-0 bg-teal-300/20 blur-xl rounded-full scale-110" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-humas.png"
              alt="Tim Humas Polinela"
              className="relative w-28 h-28 sm:w-32 sm:h-32 object-contain drop-shadow-[0_16px_30px_rgba(0,0,0,0.35)] transition-transform duration-500 hover:scale-105"
            />
          </div>

          {/* Heading 1 → TIM HUMAS POLINELA */}
          <h1 className="text-2xl sm:text-3xl lg:text-[32px] font-extrabold tracking-[-1px] text-white mb-2 uppercase drop-shadow-sm">
            TIM HUMAS POLINELA
          </h1>

          {/* Heading 2 → Sistem Informasi Kehumasan Berbasis Mobile dan Website */}
          <h2 className="text-base sm:text-lg lg:text-[20px] font-semibold leading-snug text-white/95 max-w-sm mb-2.5 drop-shadow-xs">
            Sistem Informasi Kehumasan Berbasis<br />Mobile dan Website
          </h2>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[rgba(240,255,255,0.72)] max-w-sm leading-relaxed font-normal">
            Kelola kegiatan, dokumentasi, dan koordinasi tim kehumasan secara<br className="hidden sm:inline" /> digital.
          </p>
        </div>

        {/* Bottom Left Copyright */}
        <div className="text-center font-normal text-[11px] sm:text-xs text-[rgba(236,255,255,0.52)] z-10">
          Copyright © 2026 Politeknik Negeri Lampung
        </div>
      </aside>

      {/* ── RIGHT SIDE: Login Form Panel ("login nya") ── */}
      <main
        className="w-full lg:w-1/2 min-h-screen relative flex flex-col justify-between items-center p-6 sm:p-10 lg:p-12 overflow-hidden"
        style={{
          background: 'linear-gradient(132.78deg, rgba(67, 206, 211, 0.19) 0%, rgba(67, 206, 211, 0) 15%), linear-gradient(312.78deg, rgba(44, 190, 200, 0.2) 0%, rgba(44, 190, 200, 0) 14%), #FFFFFF',
        }}
      >
        {/* Figma Ambient Glow: Background+Blur */}
        <div
          className="absolute pointer-events-none rounded-[131.25px]"
          style={{
            width: '262.5px',
            height: '262.5px',
            right: '-40px',
            bottom: '-40px',
            background: '#25BDC7',
            opacity: 0.22,
            filter: 'blur(28.125px)',
          }}
        />

        {/* Centered Login Form Container (original compact max-w-[400px]) */}
        <div className="my-auto w-full max-w-[400px] z-10 flex flex-col items-center">
          {/* Logo Humas: 56px */}
          <div className="mb-3.5 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-humas.png"
              alt="Logo Humas"
              className="w-14 h-14 object-contain drop-shadow-[0_8px_16px_rgba(35,178,189,0.18)]"
            />
          </div>

          {/* Heading 2 → Selamat Datang */}
          <div className="text-center mb-6">
            <h2 className="text-2xl sm:text-[28px] font-extrabold text-[#102F37] tracking-tight">
              Selamat Datang
            </h2>
            <p className="text-xs sm:text-sm text-[#7B9197] mt-1.5 font-normal">
              Silakan masuk menggunakan akun Admin Humas Polinela.
            </p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="w-full mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2.5 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="w-full space-y-4">
            {/* Username Field */}
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-bold text-[#34525A] mb-1.5"
              >
                Username
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#23B2BD]">
                  <User className="h-4 w-4 stroke-[2.2]" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username Anda"
                  className="block w-full rounded-xl border border-[#DCE8E9] bg-[#FBFDFD] py-3 pl-10 pr-4 text-xs sm:text-sm text-[#34525A] placeholder:text-[#A6B6B9] focus:border-[#23B2BD] focus:bg-white focus:ring-3 focus:ring-[#23B2BD]/15 focus:outline-none transition-all shadow-[0_4px_12px_rgba(22,76,85,0.03)]"
                />
              </div>
            </div>

            {/* Kata sandi Field */}
            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-[#34525A] mb-1.5"
              >
                Kata sandi
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#23B2BD]">
                  <Lock className="h-4 w-4 stroke-[2.2]" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="block w-full rounded-xl border border-[#DCE8E9] bg-[#FBFDFD] py-3 pl-10 pr-10 text-xs sm:text-sm text-[#34525A] placeholder:text-[#A6B6B9] focus:border-[#23B2BD] focus:bg-white focus:ring-3 focus:ring-[#23B2BD]/15 focus:outline-none transition-all shadow-[0_4px_12px_rgba(22,76,85,0.03)]"
                />
                <button
                  id="togglePassword"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Tampilkan atau sembunyikan kata sandi"
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#8BA0A5] hover:text-[#34525A] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Ingat saya & Lupa kata sandi */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-[#0E9EAA] focus:ring-[#0E9EAA]/30 cursor-pointer accent-[#0E9EAA]"
                />
                <span className="text-xs text-[#668087] font-medium">Ingat saya</span>
              </label>
              <button
                type="button"
                onClick={() => toast.info('Silakan hubungi Super Admin Humas untuk mengatur ulang kata sandi.')}
                className="text-xs font-bold text-[#0E9EAA] hover:underline transition-colors cursor-pointer"
              >
                Lupa kata sandi?
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold text-white transition-all active:scale-[0.99] disabled:opacity-70 cursor-pointer shadow-[0_8px_22px_rgba(12,157,169,0.25)] hover:shadow-[0_10px_26px_rgba(12,157,169,0.35)]"
                style={{
                  background: 'linear-gradient(92.51deg, #1BB7C2 0%, #0794A2 100%)',
                }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Masuk ke sistem</span>
                    <svg
                      className="w-4 h-4"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="#FFFFFF"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Divider & Footer */}
          <div className="w-full border-t border-[#EDF2F2] mt-7 pt-4 text-center">
            <p className="text-xs text-[#8A9DA2]">
              Mengalami kendala?{' '}
              <button
                type="button"
                onClick={() => toast.info('Silakan hubungi Bagian Kehumasan Polinela di Gedung Direktorat / Lab Humas.')}
                className="font-bold text-[#0E9EAA] hover:underline cursor-pointer"
              >
                Hubungi admin
              </button>
            </p>
          </div>
        </div>

        {/* Bottom Footer: Copyright */}
        <div className="text-center pt-6 pb-2 text-[11px] text-[#A0AFB2] z-10">
          © 2026 Politeknik Negeri Lampung
        </div>
      </main>
      {/* END: RightLoginFormSection */}

      {/* Role Restriction Notification Modal */}
      <CustomModal
        isOpen={modalData.isOpen}
        onClose={() => setModalData((prev) => ({ ...prev, isOpen: false }))}
        title={modalData.title}
        maxWidth="md"
      >
        <div className="flex flex-col items-center text-center p-2 sm:p-4">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
            {modalData.isMobileAdvice ? (
              <Smartphone className="w-8 h-8" />
            ) : (
              <ShieldAlert className="w-8 h-8" />
            )}
          </div>

          <h4 className="text-lg font-bold text-slate-800 mb-2">
            Pemberitahuan Hak Akses
          </h4>

          {modalData.fullName && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold mb-3">
              <span>{modalData.fullName}</span>
              <span className="text-slate-400">•</span>
              <span className="text-teal-700 font-bold">{modalData.roleLabel}</span>
            </div>
          )}

          <p className="text-sm text-slate-600 leading-relaxed mb-6">
            {modalData.message}
          </p>

          <div className="w-full bg-slate-50 border border-slate-200/80 rounded-xl p-3 mb-6 text-left flex items-start gap-3">
            <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-slate-500 leading-relaxed">
              <strong>Catatan:</strong> Web Admin hanya dapat diakses oleh akun dengan role <strong>Admin Humas</strong> atau <strong>Kepala Humas</strong>.
            </p>
          </div>

          <div className="w-full flex justify-center">
            <button
              type="button"
              onClick={() => setModalData((prev) => ({ ...prev, isOpen: false }))}
              className="w-full py-2.5 px-6 rounded-xl bg-gradient-to-r from-[#179fa9] to-[#22b8c5] text-white text-sm font-semibold hover:opacity-95 transition-all shadow-sm cursor-pointer"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}

