'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import DashboardSkeleton from '@/components/common/DashboardSkeleton';
import { authService } from '@/services';
import { getStoredUser, isAdminUser, syncUserSession } from '@/utils/session';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function AdminLayout({ children, title }: AdminLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    const verifyAuth = async () => {
      const token = localStorage.getItem('humass_token');
      if (!token) {
        router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
        return;
      }

      try {
        const profile = await authService.profile();
        syncUserSession(profile);
        if (!isAdminUser(profile)) {
          localStorage.removeItem('humass_token');
          localStorage.removeItem('humass_user');
          router.replace('/login?error=admin_only');
          return;
        }
      } catch {
        const stored = getStoredUser();
        if (!isAdminUser(stored)) {
          router.replace('/login?error=admin_only');
          return;
        }
      }

      setAuthChecked(true);
    };

    verifyAuth();
  }, [router, pathname]);

  if (!authChecked) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <DashboardSkeleton />
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden lg:block shrink-0">
        <Sidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={() => setIsCollapsed(!isCollapsed)}
        />
      </div>

      {/* Responsive Mobile Overlay & Slide-over Drawer */}
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

      {/* Main Content Shell */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Navbar title={title} onOpenMobileMenu={() => setIsMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-[1600px] mx-auto space-y-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
