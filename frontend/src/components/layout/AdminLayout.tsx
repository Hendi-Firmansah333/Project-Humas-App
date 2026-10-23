'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import PageTransition from './PageTransition';
import DashboardSkeleton from '@/components/common/DashboardSkeleton';
import { authService } from '@/services';
import { getStoredUser, syncUserSession, clearUserSession } from '@/utils/session';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import { Role } from '@/types';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  allowedRoles?: ('ADMIN' | 'SUPER_ADMIN')[];
}

export default function AdminLayout({ children, title, allowedRoles }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [isRoleAllowed, setIsRoleAllowed] = useState(true);
  const [deniedInfo, setDeniedInfo] = useState<{ currentRole?: string; requiredRoles?: string[] }>({});

  useEffect(() => {
    let cancelled = false;

    const verifyAuth = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('humass_token') : null;
      if (!token) {
        clearUserSession();
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      // Fast path: validate stored user
      const stored = getStoredUser();
      if (!stored) {
        clearUserSession();
        router.replace('/login?error=unauthorized');
        return;
      }

      // Anggota Humas (USER) cannot access web
      if (stored.role === 'USER') {
        clearUserSession();
        router.replace('/login?error=mobile_only');
        return;
      }

      // Web access is strictly for ADMIN and SUPER_ADMIN
      if (stored.role !== 'ADMIN' && stored.role !== 'SUPER_ADMIN') {
        clearUserSession();
        router.replace('/login?error=unauthorized');
        return;
      }

      // Check specific role requirement for the current page
      if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(stored.role)) {
        if (!cancelled) {
          setIsRoleAllowed(false);
          setDeniedInfo({
            currentRole: stored.roleLabel || stored.role,
            requiredRoles: allowedRoles.map((r) => (r === 'SUPER_ADMIN' ? 'Kepala Humas' : 'Admin Humas')),
          });
          setAuthChecked(true);
        }
        return;
      }

      if (!cancelled) {
        setIsRoleAllowed(true);
        setAuthChecked(true);
      }

      // Background server sync — non-blocking verification
      try {
        const profile = await authService.profile();
        if (cancelled) return;

        if (profile.role === 'USER') {
          clearUserSession();
          router.replace('/login?error=mobile_only');
          return;
        }

        if (profile.role !== 'ADMIN' && profile.role !== 'SUPER_ADMIN') {
          clearUserSession();
          router.replace('/login?error=unauthorized');
          return;
        }

        if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(profile.role)) {
          setIsRoleAllowed(false);
          setDeniedInfo({
            currentRole: profile.roleLabel || profile.role,
            requiredRoles: allowedRoles.map((r) => (r === 'SUPER_ADMIN' ? 'Kepala Humas' : 'Admin Humas')),
          });
          return;
        }

        syncUserSession(profile);
      } catch (err: any) {
        if (err?.response?.status === 401 || err?.response?.status === 403) {
          clearUserSession();
          router.replace('/login?error=session_expired');
          return;
        }
      }
    };

    verifyAuth();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, JSON.stringify(allowedRoles)]);

  if (!authChecked) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      <div className="hidden lg:block shrink-0">
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      </div>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs animate-in fade-in-0"
            onClick={() => setIsMobileOpen(false)}
          />
          <div className="relative z-50 flex h-full animate-in slide-in-from-left duration-300">
            <Sidebar isCollapsed={false} onCloseMobile={() => setIsMobileOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar title={title} onOpenMobileMenu={() => setIsMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto space-y-6">
            {!isRoleAllowed ? (
              <div className="flex flex-col items-center justify-center min-h-[55vh] text-center p-8 bg-white rounded-3xl border border-slate-100 shadow-sm">
                <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 mb-4 shadow-xs">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h2 className="text-xl font-bold text-slate-800 mb-2">Akses Halaman Dibatasi</h2>
                <p className="text-sm text-slate-500 max-w-md mb-2">
                  Halaman ini memerlukan hak akses khusus{' '}
                  <span className="font-semibold text-slate-700">
                    {deniedInfo.requiredRoles?.join(' atau ') || 'role tertentu'}
                  </span>
                  .
                </p>
                <p className="text-xs text-slate-400 mb-6">
                  Role Anda saat ini: <span className="font-medium text-slate-600">{deniedInfo.currentRole || 'Tidak diketahui'}</span>
                </p>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#179fa9] to-[#22b8c5] text-white text-sm font-semibold rounded-xl hover:opacity-95 transition-all shadow-sm cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Kembali ke Dashboard
                </button>
              </div>
            ) : (
              <PageTransition>{children}</PageTransition>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

