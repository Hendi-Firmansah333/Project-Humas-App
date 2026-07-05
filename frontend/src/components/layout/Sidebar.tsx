'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck2,
  Calendar,
  FileText,
  MapPin,
  Wrench,
  Users,
  BarChart3,
  User,
  LogOut,
  Building2,
  ChevronLeft,
  ChevronRight,
  History,
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Kegiatan', href: '/kegiatan', icon: CalendarCheck2 },
  { name: 'Riwayat Kegiatan', href: '/riwayat-kegiatan', icon: History },
  { name: 'Jadwal Piket', href: '/jadwal-piket', icon: Calendar },
  { name: 'Content Plan', href: '/content-plan', icon: FileText },
  { name: 'Live Location Tim', href: '/live-location', icon: MapPin },
  { name: 'Peminjaman Alat', href: '/peminjaman-alat', icon: Wrench },
  { name: 'Pengguna', href: '/pengguna', icon: Users },
  { name: 'Laporan', href: '/laporan', icon: BarChart3 },
  { name: 'Profil', href: '/profil', icon: User },
];

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
  className?: string;
}

export default function Sidebar({
  isCollapsed = false,
  onToggleCollapse,
  onCloseMobile,
  className = '',
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = () => {
    localStorage.removeItem('humass_token');
    localStorage.removeItem('humass_user');
    router.push('/login');
  };

  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col shrink-0 h-screen sticky top-0 z-40 transition-all duration-300 ${
        isCollapsed ? 'w-20' : 'w-64'
      } ${className}`}
    >
      {/* Logo Area */}
      <div
        className={`h-16 flex items-center border-b border-slate-100 shrink-0 transition-all ${
          isCollapsed ? 'justify-center px-2' : 'px-6 gap-3 justify-between'
        }`}
      >
        <Link href="/dashboard" className="flex items-center gap-3 overflow-hidden hover:opacity-90 transition-opacity" title="Kembali ke Dashboard">
          <div className="w-9 h-9 rounded-xl bg-teal-600 text-white flex items-center justify-center shadow-sm shrink-0">
            <Building2 className="w-5 h-5" />
          </div>
          {!isCollapsed && (
            <div className="truncate">
              <h1 className="font-bold text-sm text-slate-900 leading-tight">HUMAS POLINELA</h1>
              <p className="text-[11px] text-slate-400 font-medium leading-tight">Admin Humas</p>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Toggle */}
        {onToggleCollapse && !isCollapsed && (
          <button
            onClick={onToggleCollapse}
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Tutup Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto overflow-x-hidden">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onCloseMobile}
              title={isCollapsed ? item.name : undefined}
              className={`flex items-center rounded-xl text-sm transition-all relative ${
                isCollapsed ? 'justify-center py-3 px-0' : 'gap-3 px-4 py-2.5'
              } ${
                isActive
                  ? 'bg-teal-50/80 text-teal-700 font-semibold before:absolute before:left-0 before:top-1.5 before:bottom-1.5 before:w-1.5 before:bg-teal-600 before:rounded-r-full'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
              }`}
            >
              <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-teal-600' : 'text-slate-400'}`} />
              {!isCollapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Expand button when collapsed */}
      {onToggleCollapse && isCollapsed && (
        <div className="hidden lg:flex justify-center p-2 border-t border-slate-100">
          <button
            onClick={onToggleCollapse}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
            title="Buka Sidebar"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Footer Logout */}
      <div className="p-4 border-t border-slate-100/80 shrink-0">
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Keluar' : undefined}
          className={`w-full flex items-center rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center p-2.5' : 'gap-3 px-4 py-2.5'
          }`}
        >
          <LogOut className="w-5 h-5 shrink-0 rotate-180" />
          {!isCollapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  );
}
