'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Eye, EyeOff, Building2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/services';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('error') === 'admin_only') {
      setError('Akses Web Admin hanya untuk Admin Humas. Anggota Humas menggunakan aplikasi mobile.');
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authService.login(username, password);
      const token = data.accessToken || data.token;
      if (token) {
        if (data.user?.role !== 'ADMIN') {
          setError('Akses Web Admin hanya untuk Admin Humas. Anggota Humas menggunakan aplikasi mobile.');
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
    <div className="min-h-screen w-full flex">
      {/* Left Promotional Banner - 45% Width */}
      <div className="hidden lg:flex lg:w-[45%] bg-gradient-to-br from-teal-600 via-teal-700 to-teal-800 text-white flex-col justify-between p-12 relative overflow-hidden">
        {/* Subtle decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-teal-900/20 blur-3xl pointer-events-none" />

        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold tracking-wider text-sm uppercase text-teal-100">POLINELA HUMAS</span>
        </div>

        <div className="text-center my-auto px-6 max-w-md mx-auto">
          {/* Logo Box */}
          <div className="w-32 h-32 bg-teal-500/30 backdrop-blur-md rounded-3xl border border-teal-300/30 flex items-center justify-center shadow-2xl mx-auto mb-8 relative">
            <div className="w-16 h-16 bg-teal-400/20 rounded-2xl flex items-center justify-center border border-teal-200/40">
              <Building2 className="w-9 h-9 text-white" />
            </div>
          </div>

          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">TIM HUMAS POLINELA</h1>
          <p className="text-lg font-medium text-teal-100 mb-4">
            Sistem Informasi Kehumasan Berbasis Mobile dan Website
          </p>
          <p className="text-sm text-teal-200/90 leading-relaxed">
            Mengelola Kegiatan, Dokumentasi, dan Koordinasi Tim Kehumasan Secara Digital
          </p>
        </div>

        <div className="text-center text-xs text-teal-300/80 leading-relaxed">
          <p>Versi 1.0.0</p>
          <p>Copyright © 2025 Politeknik Negeri Lampung</p>
        </div>
      </div>

      {/* Right Login Form - 55% Width */}
      <div className="w-full lg:w-[55%] flex items-center justify-center bg-white p-6 sm:p-12">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-teal-50 text-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-teal-100/50">
              <Building2 className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight mb-1">Selamat Datang</h2>
            <p className="text-sm text-slate-500">Silakan masuk menggunakan akun Admin Humas Polinela.</p>
          </div>

          {/* Error Alert */}
          {error && (
            <div className="mb-6 p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  id="username"
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username Anda"
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password Anda"
                  className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between pt-1 pb-2">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-600 select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500"
                />
                <span>Ingat Saya</span>
              </label>
              <a href="#" className="text-xs font-semibold text-teal-600 hover:text-teal-700 transition-colors">
                Lupa Password?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 disabled:opacity-70 text-white font-semibold rounded-xl shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>Masuk</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
