'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Eye, EyeOff, AlertCircle, ShieldAlert, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/services';
import CustomModal from '@/components/common/CustomModal';

export default function LoginPage() {
  const router = useRouter();
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashRendered, setSplashRendered] = useState(true);
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

  // Splash screen lifecycle: display gracefully when entering login page
  useEffect(() => {
    const timerFade = setTimeout(() => {
      setSplashVisible(false);
      const timerUnmount = setTimeout(() => {
        setSplashRendered(false);
      }, 650);
      return () => clearTimeout(timerUnmount);
    }, 1400);

    return () => clearTimeout(timerFade);
  }, []);

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
      className="min-h-screen w-full flex flex-col lg:flex-row items-stretch antialiased select-none text-[#102F37] relative overflow-x-hidden"
      style={{
        fontFamily: "'Poppins', sans-serif",
        background: 'linear-gradient(0deg, #002B70, #002B70), #FFFFFF',
      }}
    >
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── SPLASH SCREEN (PRIMA LOGO + SLEEK TRANSITION) ──────────── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {splashRendered && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#F8FAFC] transition-opacity duration-500 ease-in-out select-none ${
            splashVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex flex-col items-center justify-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-prima.png"
              alt="Logo PRIMA"
              className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-sm animate-pulse"
            />
            <div className="flex items-center gap-2.5 mt-2">
              <div className="w-5 h-5 border-2 border-[#003D58] border-t-transparent rounded-full animate-spin" />
              <span className="text-xs font-semibold text-slate-500 tracking-wider uppercase">
                Memuat...
              </span>
            </div>
          </div>
        </div>
      )}
      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── BACKGROUND LAYER: Figma Organic Flow & Ribbons Layer ─────── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden select-none">
        {/* Full-width authentic wave & radial gradient matching Figma 1920x1080 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/login-bg-pristine-v10.png?v=12"
          alt=""
          aria-hidden="true"
          className="w-full h-full object-cover object-left lg:object-center hidden lg:block"
        />
        {/* Smooth horizontal transition layer fading out to crisp white on the right half */}
        <div
          aria-hidden="true"
          className="absolute inset-0 hidden lg:block"
          style={{
            background: 'linear-gradient(90deg, rgba(255, 255, 255, 0) 0%, rgba(255, 255, 255, 0.05) 30%, rgba(255, 255, 255, 0.55) 50%, rgba(255, 255, 255, 0.92) 65%, #FFFFFF 78%, #FFFFFF 100%)',
          }}
        />
        {/* Mobile top-gradient fallback matching Figma radial base */}
        <div
          aria-hidden="true"
          className="w-full h-[380px] sm:h-[440px] lg:hidden"
          style={{
            background: 'radial-gradient(102.71% 182.6% at 10% 12%, #2ED8B6 0%, #17B3A4 20%, #0C73B0 50%, #003E99 80%, #002B70 100%)',
          }}
        />
      </div>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── LEFT BRANDING SECTION (Figma: width 1036.8px / 54%) ──────── */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <aside className="w-full lg:w-[54%] min-h-[460px] lg:min-h-screen flex flex-col justify-center items-center p-6 sm:p-10 lg:p-16 relative z-10 shrink-0">
        {/* Center Hero Content Container */}
        <div className="flex flex-col items-center text-center z-10 w-full max-w-[680px] mx-auto py-8">
          <div className="w-full flex flex-col items-center">
            
            {/* Simbol PRIMA (Figma: 126px x 126px, centered - no drop-shadow) */}
            <div className="flex items-center justify-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/prima-symbol-clean-v10.png"
                alt="Simbol PRIMA"
                className="w-[110px] h-[110px] sm:w-[126px] sm:h-[126px] object-contain transition-transform duration-300 hover:scale-105"
              />
            </div>

            {/* PRIMA Wordmark (Figma: width 479px, height 75.1px, top: 163px -> mt-[37px] - no drop-shadow) */}
            <div className="mt-[37px] flex items-center justify-center w-full px-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/prima-text-clean-v10.png"
                alt="PRIMA"
                className="w-full max-w-[340px] sm:max-w-[420px] lg:max-w-[479px] h-auto object-contain"
              />
            </div>

            {/* Tagline / Subtitle (Figma CSS: PUBLIC RELATION MANAGEMENT in 1 horizontal line) */}
            <h1
              className="mt-6 sm:mt-8 font-bold text-[16px] sm:text-[22px] lg:text-[28px] xl:text-[32px] leading-[23px] tracking-[0.04em] text-[#003D58] uppercase text-center whitespace-nowrap select-none"
              style={{ fontFamily: "'Inter', 'Poppins', sans-serif" }}
            >
              PUBLIC RELATION MANAGEMENT
            </h1>
          </div>
        </div>

        {/* Footer Copyright Left */}
        <div
          className="absolute bottom-6 sm:bottom-8 lg:bottom-10 left-6 sm:left-10 lg:left-16 font-normal text-[12px] leading-[16px] tracking-[0.3px] text-white/70 z-10"
          style={{ fontFamily: "'Poppins', sans-serif" }}
        >
          Copyright © 2026 Politeknik Negeri Lampung
        </div>
      </aside>

      {/* ═══════════════════════════════════════════════════════════════ */}
      {/* ── RIGHT AUTHENTICATION SECTION (Figma: width 883.19px / 46%) ─ */}
      {/* ═══════════════════════════════════════════════════════════════ */}
      <main className="w-full lg:w-[46%] min-h-screen relative flex flex-col justify-center items-center p-6 sm:p-10 lg:p-16 z-10 bg-white lg:bg-transparent">
        {/* Centered Login Card Form Container (Figma: width 400px / max-w 420px) */}
        <div className="w-full max-w-[400px] z-10 flex flex-col items-center py-4">
          
          {/* Simbol PRIMA (Figma: 64px x 62px - no drop-shadow) */}
          <div className="mb-8 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/prima-symbol-clean-v10.png"
              alt="Simbol PRIMA"
              className="w-[64px] h-[62px] object-contain"
            />
          </div>

          {/* Heading 2 & Subtitle (Figma: width 376.8px, pb 24px) */}
          <div className="text-center pb-6 w-full max-w-[376.8px]">
            {/* SELAMAT DATANG (Figma: 28px, 37px, -0.7px, #102F37, 800) */}
            <h2
              className="font-extrabold text-[26px] sm:text-[28px] leading-[37px] text-[#102F37] tracking-[-0.7px] uppercase"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
              SELAMAT DATANG
            </h2>
            {/* Subtitle (Figma: 14px, 20px, #7B9197, mt 6px) */}
            <p
              className="font-normal text-[14px] leading-[20px] text-[#7B9197] mt-1.5"
              style={{ fontFamily: "'Poppins', sans-serif" }}
            >
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

          {/* Form (Figma: width 400px, height 254px) */}
          <form onSubmit={handleLogin} className="w-full max-w-[400px]">
            
            {/* Username Field (Figma: height 68px, label 12px/16px #34525A, input 46px, border-radius 14px) */}
            <div className="w-full">
              <label
                htmlFor="username"
                className="block font-bold text-[12px] leading-[16px] text-[#34525A]"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Username
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-[14px] text-[#35C6D4]">
                  <User className="h-4 w-4 stroke-[1.8]" />
                </div>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username Anda"
                  className="block w-full h-[46px] rounded-[14px] border border-[#DCE8E9] bg-[#FBFDFD] py-3 pl-11 pr-4 text-[14px] text-[#34525A] placeholder:text-[#A6B6B9] shadow-[0px_4px_12px_rgba(22,76,85,0.03)] focus:border-[#35C6D4] focus:bg-white focus:ring-1 focus:ring-[#35C6D4]/30 focus:outline-none transition-all"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                />
              </div>
            </div>

            {/* Kata sandi Field (Figma: pt 16px, height 84px, label 12px/16px #34525A, input 46px) */}
            <div className="w-full pt-4">
              <label
                htmlFor="password"
                className="block font-bold text-[12px] leading-[16px] text-[#34525A]"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                Kata sandi
              </label>
              <div className="relative mt-1.5">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-[14px] text-[#35C6D4]">
                  <Lock className="h-4 w-4 stroke-[1.8]" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan kata sandi"
                  className="block w-full h-[46px] rounded-[14px] border border-[#DCE8E9] bg-[#FBFDFD] py-3 pl-11 pr-11 text-[14px] text-[#34525A] placeholder:text-[#A6B6B9] shadow-[0px_4px_12px_rgba(22,76,85,0.03)] focus:border-[#35C6D4] focus:bg-white focus:ring-1 focus:ring-[#35C6D4]/30 focus:outline-none transition-all"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                />
                <button
                  id="togglePassword"
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Tampilkan atau sembunyikan kata sandi"
                  className="absolute inset-y-0 right-0 flex items-center pr-[14px] text-[#8BA0A5] hover:text-[#34525A] transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="h-4 w-4 stroke-[1.8]" /> : <Eye className="h-4 w-4 stroke-[1.8]" />}
                </button>
              </div>
            </div>

            {/* Ingat saya (Figma: pt 18px, height 34px) */}
            <div className="flex items-center pt-[18px] w-full">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded-[4px] border border-[#003D58] text-[#003D58] focus:ring-[#003D58]/20 cursor-pointer accent-[#003D58]"
                />
                <span
                  className="font-medium text-[12px] leading-[16px] text-[#668087]"
                  style={{ fontFamily: "'Poppins', sans-serif" }}
                >
                  Ingat saya
                </span>
              </label>
            </div>

            {/* Submit Button (Figma: pt 24px, height 44px, bg #003D58, shadow #35C6D4) */}
            <div className="pt-6 w-full">
              <button
                type="submit"
                disabled={loading}
                className="w-full h-[44px] flex justify-center items-center gap-2 py-3 px-4 rounded-[14px] font-bold text-[14px] leading-[20px] text-white tracking-normal transition-all bg-[#003D58] hover:bg-[#002F44] active:bg-[#00263A] active:scale-[0.99] disabled:opacity-70 cursor-pointer shadow-[0px_8px_24px_rgba(53,198,212,0.35)]"
                style={{ fontFamily: "'Poppins', sans-serif" }}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <span>MASUK KE SISTEM</span>
                )}
              </button>
            </div>
          </form>

        </div>
      </main>

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
              <span className="text-[#003D58] font-bold">{modalData.roleLabel}</span>
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
              className="w-full py-2.5 px-6 rounded-xl text-white text-sm font-semibold bg-[#003D58] hover:bg-[#002F44] active:bg-[#00263A] transition-all shadow-[0px_4px_16px_rgba(0,61,88,0.25)] cursor-pointer"
            >
              Saya Mengerti
            </button>
          </div>
        </div>
      </CustomModal>
    </div>
  );
}
