'use client';

import React, { useState } from 'react';
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
  ChevronDown,
  ClipboardList,
  Package,
} from 'lucide-react';

/* ===================== NAV STRUCTURE ===================== */

type NavItem =
  | { type: 'item'; name: string; href: string; icon: React.ElementType }
  | {
      type: 'group';
      name: string;
      icon: React.ElementType;
      id: string;
      children: { name: string; href: string; icon: React.ElementType }[];
    };

const SECTIONS: {
  label: string;
  items: NavItem[];
}[] = [
  {
    label: '',
    items: [
      { type: 'item', name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    label: 'OPERASIONAL',
    items: [
      { type: 'item', name: 'Kegiatan', href: '/kegiatan', icon: CalendarCheck2 },
      { type: 'item', name: 'Content Plan', href: '/content-plan', icon: FileText },
      { type: 'item', name: 'Live Location Tim', href: '/live-location', icon: MapPin },
      { type: 'item', name: 'Peminjaman Alat', href: '/peminjaman-alat', icon: Wrench },
      { type: 'item', name: 'Jadwal Piket', href: '/jadwal-piket', icon: Calendar },
    ],
  },
  {
    label: 'MANAJEMEN',
    items: [
      { type: 'item', name: 'Pengguna', href: '/pengguna', icon: Users },
      {
        type: 'group',
        name: 'Riwayat',
        icon: History,
        id: 'riwayat',
        children: [
          { name: 'Riwayat Kegiatan', href: '/riwayat-kegiatan', icon: ClipboardList },
          { name: 'Riwayat Content Plan', href: '/riwayat-content-plan', icon: FileText },
          { name: 'Riwayat Peminjaman', href: '/riwayat-peminjaman', icon: Package },
        ],
      },
      { type: 'item', name: 'Laporan', href: '/laporan', icon: BarChart3 },
    ],
  },
  {
    label: 'AKUN',
    items: [
      { type: 'item', name: 'Profil', href: '/profil', icon: User },
    ],
  },
];

/* ===================== PROPS ===================== */

interface SidebarProps {
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onCloseMobile?: () => void;
  className?: string;
}

/* ===================== COMPONENT ===================== */

export default function Sidebar({
  isCollapsed = false,
  onToggleCollapse,
  onCloseMobile,
  className = '',
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();

  // Track open/closed state of collapsible groups
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() => {
    // Auto-open riwayat group if current path is a riwayat page
    const riwayatPaths = ['/riwayat-kegiatan', '/riwayat-content-plan', '/riwayat-peminjaman'];
    return { riwayat: riwayatPaths.some((p) => pathname.startsWith(p)) };
  });

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogout = () => {
    localStorage.removeItem('humass_token');
    localStorage.removeItem('humass_user');
    router.push('/login');
  };

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);

  const isGroupActive = (children: { href: string }[]) =>
    children.some((c) => isActive(c.href));

  return (
    <aside
      className={`bg-white border-r border-slate-200 flex flex-col shrink-0 h-screen sticky top-0 z-40 transition-all duration-300 ${
        isCollapsed ? 'w-[72px]' : 'w-64'
      } ${className}`}
    >
      {/* ── Logo Area ─────────────────────────────── */}
      <div
        className={`h-16 flex items-center border-b border-slate-100 shrink-0 transition-all ${
          isCollapsed ? 'justify-center px-2' : 'px-5 gap-3 justify-between'
        }`}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-3 overflow-hidden hover:opacity-90 transition-opacity"
          title="Kembali ke Dashboard"
        >
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
            className="hidden lg:flex p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
            title="Tutup Sidebar"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── Navigation Menu ───────────────────────── */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {SECTIONS.map((section, si) => (
          <div key={si} className={si > 0 ? 'mt-1' : ''}>
            {/* Section Header */}
            {section.label && !isCollapsed && (
              <p className="px-5 pt-4 pb-1.5 text-[10px] font-bold tracking-widest text-slate-400 uppercase select-none">
                {section.label}
              </p>
            )}
            {section.label && isCollapsed && (
              <div className="mx-3 my-2 h-px bg-slate-100" />
            )}

            <div className="px-2.5 space-y-0.5">
              {section.items.map((item) => {
                if (item.type === 'item') {
                  const active = isActive(item.href);
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={onCloseMobile}
                      title={isCollapsed ? item.name : undefined}
                      className={`flex items-center rounded-xl text-sm transition-all relative group ${
                        isCollapsed ? 'justify-center py-3 px-0' : 'gap-3 px-3.5 py-2.5'
                      } ${
                        active
                          ? 'bg-teal-50 text-teal-700 font-semibold shadow-xs before:absolute before:left-0 before:top-2 before:bottom-2 before:w-1 before:bg-teal-600 before:rounded-r-full'
                          : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                      }`}
                    >
                      <Icon
                        className={`w-[18px] h-[18px] shrink-0 ${
                          active ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'
                        }`}
                      />
                      {!isCollapsed && <span className="truncate leading-none">{item.name}</span>}
                    </Link>
                  );
                }

                if (item.type === 'group') {
                  const Icon = item.icon;
                  const groupActive = isGroupActive(item.children);
                  const isOpen = openGroups[item.id];

                  return (
                    <div key={item.id}>
                      {/* Group Header Button */}
                      <button
                        onClick={() => {
                          if (isCollapsed) return;
                          toggleGroup(item.id);
                        }}
                        title={isCollapsed ? item.name : undefined}
                        className={`w-full flex items-center rounded-xl text-sm transition-all relative group ${
                          isCollapsed ? 'justify-center py-3 px-0' : 'gap-3 px-3.5 py-2.5 justify-between'
                        } ${
                          groupActive
                            ? 'bg-teal-50 text-teal-700 font-semibold'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900 font-medium'
                        } cursor-pointer`}
                      >
                        <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
                          {groupActive && !isCollapsed && (
                            <span className="absolute left-0 top-2 bottom-2 w-1 bg-teal-600 rounded-r-full" />
                          )}
                          <Icon
                            className={`w-[18px] h-[18px] shrink-0 ${
                              groupActive ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'
                            }`}
                          />
                          {!isCollapsed && <span className="truncate leading-none">{item.name}</span>}
                        </div>
                        {!isCollapsed && (
                          <ChevronDown
                            className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 shrink-0 ${
                              isOpen ? 'rotate-180' : ''
                            }`}
                          />
                        )}
                      </button>

                      {/* Children */}
                      {!isCollapsed && isOpen && (
                        <div className="mt-0.5 ml-4 pl-3 border-l-2 border-slate-100 space-y-0.5">
                          {item.children.map((child) => {
                            const childActive = isActive(child.href);
                            const ChildIcon = child.icon;
                            return (
                              <Link
                                key={child.name}
                                href={child.href}
                                onClick={onCloseMobile}
                                className={`flex items-center gap-2.5 rounded-lg text-[13px] px-3 py-2 transition-all ${
                                  childActive
                                    ? 'bg-teal-50 text-teal-700 font-semibold'
                                    : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800 font-medium'
                                }`}
                              >
                                <ChildIcon
                                  className={`w-4 h-4 shrink-0 ${
                                    childActive ? 'text-teal-600' : 'text-slate-400'
                                  }`}
                                />
                                <span className="truncate">{child.name}</span>
                              </Link>
                            );
                          })}
                        </div>
                      )}

                      {/* Collapsed: show children as tooltips (simplified — just dots) */}
                      {isCollapsed && isGroupActive(item.children) && (
                        <div className="flex justify-center mt-0.5">
                          <span className="w-1 h-1 rounded-full bg-teal-500" />
                        </div>
                      )}
                    </div>
                  );
                }

                return null;
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* ── Expand button when collapsed ──────────── */}
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

      {/* ── Footer: Logout ────────────────────────── */}
      <div className="px-2.5 py-3 border-t border-slate-100 shrink-0">
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Keluar' : undefined}
          className={`w-full flex items-center rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center py-3 px-0' : 'gap-3 px-3.5 py-2.5'
          }`}
        >
          <LogOut className="w-[18px] h-[18px] shrink-0" />
          {!isCollapsed && <span>Keluar</span>}
        </button>
      </div>
    </aside>
  );
}
