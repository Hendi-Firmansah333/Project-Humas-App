'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { getStoredUser, isSuperAdmin } from '@/utils/session';
import { User as UserType } from '@/types';
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
  Mail,
  ShieldCheck,
} from 'lucide-react';

/* ===================== NAV STRUCTURE ===================== */

type NavItem =
  | { type: 'item'; name: string; href: string; icon: React.ElementType; badge?: number }
  | {
      type: 'group';
      name: string;
      icon: React.ElementType;
      id: string;
      children: { name: string; href: string; icon: React.ElementType }[];
    };

function getSidebarSections(role?: string): { label: string; items: NavItem[] }[] {
  const dashboardItem: NavItem = { type: 'item', name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard };
  const profilItem: NavItem = { type: 'item', name: 'Profil', href: '/profil', icon: User };

  if (role === 'SUPER_ADMIN') {
    return [
      {
        label: '',
        items: [dashboardItem],
      },
      {
        label: 'OPERASIONAL',
        items: [
          { type: 'item', name: 'Persetujuan', href: '/persetujuan', icon: ShieldCheck, badge: -2 } as NavItem,
          { type: 'item', name: 'Kegiatan', href: '/kegiatan', icon: CalendarCheck2 } as NavItem,
          { type: 'item', name: 'Content Plan', href: '/content-plan', icon: FileText } as NavItem,
          { type: 'item', name: 'Inventaris & Peminjaman', href: '/peminjaman-alat', icon: Wrench } as NavItem,
          { type: 'item', name: 'Jadwal Piket', href: '/jadwal-piket', icon: Calendar } as NavItem,
        ],
      },
      {
        label: 'MONITORING',
        items: [
          { type: 'item', name: 'Live Location Tim', href: '/live-location', icon: MapPin } as NavItem,
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
          } as NavItem,
          { type: 'item', name: 'Laporan', href: '/laporan', icon: BarChart3 } as NavItem,
        ],
      },
      {
        label: 'MANAJEMEN',
        items: [
          { type: 'item', name: 'Pengguna', href: '/pengguna', icon: Users } as NavItem,
        ],
      },
      {
        label: 'AKUN',
        items: [profilItem],
      },
    ];
  }

  // ADMIN (Default Web Role)
  return [
    {
      label: '',
      items: [dashboardItem],
    },
    {
      label: 'OPERASIONAL',
      items: [
        { type: 'item', name: 'Surat Masuk', href: '/surat-masuk', icon: Mail } as NavItem,
        { type: 'item', name: 'Kegiatan', href: '/kegiatan', icon: CalendarCheck2 } as NavItem,
        { type: 'item', name: 'Content Plan', href: '/content-plan', icon: FileText } as NavItem,
        { type: 'item', name: 'Live Location Tim', href: '/live-location', icon: MapPin } as NavItem,
        { type: 'item', name: 'Inventaris & Peminjaman', href: '/peminjaman-alat', icon: Wrench } as NavItem,
        { type: 'item', name: 'Jadwal Piket', href: '/jadwal-piket', icon: Calendar } as NavItem,
      ],
    },
    {
      label: 'VERIFIKASI',
      items: [
        { type: 'item', name: 'Verifikasi Kelengkapan', href: '/verifikasi-kegiatan', icon: ClipboardList, badge: -1 } as NavItem,
      ],
    },
    {
      label: 'MONITORING',
      items: [
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
        } as NavItem,
        { type: 'item', name: 'Laporan', href: '/laporan', icon: BarChart3 } as NavItem,
      ],
    },
    {
      label: 'AKUN',
      items: [profilItem],
    },
  ];
}

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
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [verificationBadgeCount, setVerificationBadgeCount] = useState(0);
  const [approvalBadgeCount, setApprovalBadgeCount] = useState(0);

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  // Fetch pending counts for badges
  useEffect(() => {
    if (!currentUser) return;

    const fetchBadgeCounts = async () => {
      try {
        const { activityService, contentService, incomingLetterService } = await import('@/services');

        if (currentUser.role === 'ADMIN') {
          const [actRes, cpRes] = await Promise.all([
            activityService.getAll({ status: 'MENUNGGU_VERIFIKASI', page: 1, pageSize: 1 }).catch(() => ({ total: 0, items: [] })),
            contentService.getAll({ page: 1, pageSize: 100 }).catch(() => ({ total: 0, items: [] })),
          ]);

          const actCount = (actRes as any)?.total ?? (actRes as any)?.items?.length ?? 0;
          const cpItems = (cpRes as any)?.items ?? [];
          const cpCount = cpItems.filter((item: any) =>
            item.status === 'MENUNGGU_VERIFIKASI_ADMIN' || item.status === 'MENUNGGU'
          ).length;

          setVerificationBadgeCount(actCount + cpCount);
        }

        if (currentUser.role === 'SUPER_ADMIN') {
          const [letterRes, actRes, cpRes] = await Promise.all([
            incomingLetterService.getAll().catch(() => []),
            activityService.getAll({ status: 'MENUNGGU_PERSETUJUAN_AKHIR', page: 1, pageSize: 1 }).catch(() => ({ total: 0, items: [] })),
            contentService.getAll({ page: 1, pageSize: 100 }).catch(() => ({ total: 0, items: [] })),
          ]);

          const letters = Array.isArray(letterRes) ? letterRes : [];
          const letterCount = letters.filter((l: any) =>
            l.status === 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS' ||
            l.status === 'MENUNGGU_PERSETUJUAN' ||
            l.status === 'BARU'
          ).length;

          const actCount = (actRes as any)?.total ?? (actRes as any)?.items?.length ?? 0;
          const cpItems = (cpRes as any)?.items ?? [];
          const cpCount = cpItems.filter((item: any) =>
            item.status === 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS' || item.status === 'MENUNGGU'
          ).length;

          setApprovalBadgeCount(letterCount + actCount + cpCount);
        }
      } catch (err) {
        console.error('Error fetching sidebar badges:', err);
      }
    };

    fetchBadgeCounts();
    const interval = setInterval(fetchBadgeCounts, 15000); // Check every 15s
    return () => clearInterval(interval);
  }, [currentUser]);

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
              <p className="text-[11px] text-slate-400 font-medium leading-tight">
                {currentUser?.role === 'SUPER_ADMIN' ? 'Kepala Humas' : 'Admin Humas'}
              </p>
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
        {getSidebarSections(currentUser?.role).map((section, si) => (
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
              {section.items
                .map((item) => {
                if (item.type === 'item') {
                  const active = isActive(item.href || '');
                  const Icon = item.icon;
                  // Resolve dynamic badge count
                  const itemBadge = (item as { badge?: number }).badge;
                  const badgeCount = itemBadge === -1 ? verificationBadgeCount : itemBadge === -2 ? approvalBadgeCount : (itemBadge || 0);
                  return (
                    <Link
                      key={item.name}
                      href={item.href || '#'}
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
                      <div className="relative shrink-0">
                        <Icon
                          className={`w-[18px] h-[18px] ${
                            active ? 'text-teal-600' : 'text-slate-400 group-hover:text-slate-600'
                          }`}
                        />
                        {badgeCount > 0 && isCollapsed && (
                          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-bold px-1 ring-2 ring-white animate-pulse">
                            {badgeCount > 99 ? '99+' : badgeCount}
                          </span>
                        )}
                      </div>
                      {!isCollapsed && (
                        <>
                          <span className="truncate leading-none flex-1">{item.name}</span>
                          {badgeCount > 0 && (
                            <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 shrink-0 animate-pulse">
                              {badgeCount > 99 ? '99+' : badgeCount}
                            </span>
                          )}
                        </>
                      )}
                    </Link>
                  );
                }

                if (item.type === 'group') {
                  const Icon = item.icon;
                  const groupActive = isGroupActive(item.children || []);
                  const isOpen = item.id ? openGroups[item.id] : false;

                  return (
                    <div key={item.id || item.name}>
                      {/* Group Header Button */}
                      <button
                        onClick={() => {
                          if (isCollapsed) return;
                          if (item.id) toggleGroup(item.id);
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
                          {(item.children || []).map((child) => {
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

                      {/* Collapsed: show children indicator */}
                      {isCollapsed && isGroupActive(item.children || []) && (
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
