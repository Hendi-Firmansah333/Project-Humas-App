'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { getStoredUser, isSuperAdmin } from '@/utils/session';
import { User as UserType } from '@/types';
import {
  LayoutDashboard,
  LayoutGrid,
  CalendarCheck2,
  Calendar,
  FileText,
  MapPin,
  Wrench,
  Users,
  BarChart3,
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
  UserPlus,
  CheckCircle2,
  Camera,
} from 'lucide-react';

/* ===================== NAV STRUCTURE ===================== */

type NavItem =
  | { type: 'item'; name: string; href: string; icon: React.ElementType; badge?: number }
  | {
      type: 'group';
      name: string;
      icon: React.ElementType;
      id: string;
      badge?: number;
      children: { name: string; href: string; icon: React.ElementType; badgeKey?: string }[];
    };

function getSidebarSections(role?: string): { label: string; items: NavItem[] }[] {
  const dashboardItem: NavItem = { type: 'item', name: 'Dashboard', href: '/dashboard', icon: LayoutGrid };

  if (role === 'SUPER_ADMIN') {
    return [
      {
        label: '',
        items: [dashboardItem],
      },
      {
        label: 'OPERASIONAL',
        items: [
          {
            type: 'group',
            name: 'Persetujuan',
            icon: ShieldCheck,
            id: 'persetujuan',
            badge: -2,
            children: [
              { name: 'Persetujuan Surat', href: '/persetujuan?tab=surat', icon: Mail, badgeKey: 'surat' },
              { name: 'Penugasan Tim', href: '/persetujuan?tab=penugasan', icon: UserPlus, badgeKey: 'penugasan' },
              { name: 'Persetujuan Akhir', href: '/persetujuan?tab=akhir', icon: CheckCircle2, badgeKey: 'akhir' },
              { name: 'Persetujuan Content Plan', href: '/persetujuan?tab=konten', icon: Camera, badgeKey: 'konten' },
            ],
          } as NavItem,
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
              { name: 'Riwayat Surat Masuk', href: '/riwayat-surat', icon: Mail },
              { name: 'Riwayat Kegiatan', href: '/riwayat-kegiatan', icon: ClipboardList },
              { name: 'Riwayat Content Plan', href: '/riwayat-content-plan', icon: FileText },
              { name: 'Riwayat Peminjaman', href: '/riwayat-peminjaman', icon: Package },
            ],
          } as NavItem,
          { type: 'item', name: 'Laporan', href: '/laporan', icon: BarChart3 } as NavItem,
        ],
      },
    ];
  }

  if (role === 'ADMIN') {
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
        label: 'MONITORING',
        items: [
          {
            type: 'group',
            name: 'Riwayat',
            icon: History,
            id: 'riwayat',
            children: [
              { name: 'Riwayat Surat Masuk', href: '/riwayat-surat', icon: Mail },
              { name: 'Riwayat Kegiatan', href: '/riwayat-kegiatan', icon: ClipboardList },
              { name: 'Riwayat Content Plan', href: '/riwayat-content-plan', icon: FileText },
              { name: 'Riwayat Peminjaman', href: '/riwayat-peminjaman', icon: Package },
            ],
          } as NavItem,
          { type: 'item', name: 'Laporan', href: '/laporan', icon: BarChart3 } as NavItem,
          { type: 'item', name: 'Pengguna', href: '/pengguna', icon: Users } as NavItem,
        ],
      },
    ];
  }

  // Web is strictly for SUPER_ADMIN and ADMIN. Other roles (USER/Anggota Humas) only use mobile.
  return [];
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
  const searchParams = useSearchParams();
  const router = useRouter();
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [approvalBadgeCount, setApprovalBadgeCount] = useState(0);
  const [badgeDetail, setBadgeDetail] = useState({
    surat: 0,
    penugasan: 0,
    akhir: 0,
    konten: 0,
  });

  useEffect(() => {
    setCurrentUser(getStoredUser());
  }, []);

  // Fetch pending counts for badges
  useEffect(() => {
    if (!currentUser) return;

    const fetchBadgeCounts = async () => {
      try {
        const { activityService, contentService, incomingLetterService } = await import('@/services');

        if (currentUser.role === 'SUPER_ADMIN') {
          const [letterRes, actRes, cpRes] = await Promise.all([
            incomingLetterService.getAll().catch(() => []),
            activityService.getAll({ status: 'MENUNGGU_PERSETUJUAN_AKHIR', page: 1, pageSize: 1 }).catch(() => ({ total: 0, items: [] })),
            contentService.getAll({ page: 1, pageSize: 100 }).catch(() => ({ total: 0, items: [] })),
          ]);

          const letters = Array.isArray(letterRes) ? letterRes : [];
          const letterCount = letters.filter((l: any) =>
            l.status === 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS' ||
            l.status === 'MENUNGGU_VERIFIKASI_ADMIN' ||
            l.status === 'MENUNGGU_PERSETUJUAN' ||
            l.status === 'BARU'
          ).length;

          const penugasanCount = letters.filter((l: any) => l.status === 'DISETUJUI').length;

          const actCount = (actRes as any)?.total ?? (actRes as any)?.items?.length ?? 0;
          const cpItems = (cpRes as any)?.items ?? [];
          const cpCount = cpItems.filter((item: any) =>
            item.status === 'MENUNGGU_PERSETUJUAN_KEPALA_HUMAS' ||
            item.status === 'MENUNGGU' ||
            item.status === 'MENUNGGU_VERIFIKASI_ADMIN'
          ).length;

          setApprovalBadgeCount(letterCount + actCount + cpCount);
          setBadgeDetail({
            surat: letterCount,
            penugasan: penugasanCount,
            akhir: actCount,
            konten: cpCount,
          });
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
    const riwayatPaths = ['/riwayat-surat', '/riwayat-kegiatan', '/riwayat-content-plan', '/riwayat-peminjaman'];
    const isRiwayat = riwayatPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`));
    const isPersetujuan = pathname === '/persetujuan' || pathname.startsWith('/persetujuan/');
    return {
      riwayat: isRiwayat,
      persetujuan: isPersetujuan,
    };
  });

  // Keep accordion opened when on matching routes
  useEffect(() => {
    const riwayatPaths = ['/riwayat-surat', '/riwayat-kegiatan', '/riwayat-content-plan', '/riwayat-peminjaman'];
    if (riwayatPaths.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
      setOpenGroups((prev) => ({ ...prev, riwayat: true }));
    }
    if (pathname === '/persetujuan' || pathname.startsWith('/persetujuan/')) {
      setOpenGroups((prev) => ({ ...prev, persetujuan: true }));
    }
  }, [pathname]);

  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleLogout = () => {
    localStorage.removeItem('humass_token');
    localStorage.removeItem('humass_user');
    router.push('/login');
  };

  const isActive = (href: string) => {
    if (href.includes('?')) {
      const [path, query] = href.split('?');
      if (pathname !== path) return false;
      const targetTab = new URLSearchParams(query).get('tab');
      const currentTab = searchParams?.get('tab') || 'surat';
      return currentTab === targetTab;
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const isGroupActive = (children: { href: string }[]) =>
    children.some((c) => {
      const path = c.href.split('?')[0];
      return pathname === path || pathname.startsWith(`${path}/`);
    });

  return (
    <aside
      className={`bg-white border-r border-slate-200/80 flex flex-col shrink-0 h-screen sticky top-0 z-40 transition-all duration-300 ${
        isCollapsed ? 'w-[72px]' : 'w-[280px]'
      } ${className}`}
    >
      {/* ── Logo Area ─────────────────────────────── */}
      <div
        className={`h-[78px] flex items-center border-b border-[#F1F5F9] shrink-0 transition-all ${
          isCollapsed ? 'justify-center px-2' : 'px-4 justify-between'
        }`}
      >
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 overflow-hidden hover:opacity-95 transition-opacity"
          title="Kembali ke Dashboard"
        >
          <Image
            src="/prima-symbol-clean-v10.png"
            alt="PRIMA"
            width={30}
            height={30}
            priority
            className="w-[30px] h-[30px] object-contain shrink-0"
          />
          {!isCollapsed && (
            <div className="flex flex-col justify-center min-w-0">
              <span className="font-extrabold text-[12px] text-[#0F172A] tracking-[0.3px] uppercase leading-[14px] font-['Poppins']">
                PUBLIC RELATION
              </span>
              <span className="font-extrabold text-[12px] text-[#0F172A] tracking-[0.3px] uppercase leading-[14px] font-['Poppins']">
                MANAGEMENT
              </span>
              <span className="font-medium text-[11px] text-[#8E9CAE] leading-[14px] mt-0.5 font-['Poppins']">
                {currentUser?.role === 'SUPER_ADMIN' ? 'Kepala Humas' : 'Admin Humas'}
              </span>
            </div>
          )}
        </Link>

        {/* Desktop Collapse Toggle */}
        {onToggleCollapse && !isCollapsed && (
          <button
            type="button"
            onClick={onToggleCollapse}
            className="hidden lg:flex w-7 h-7 items-center justify-center rounded-lg text-[#8E9CAE] hover:text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer shrink-0 ml-1"
            title="Tutup Sidebar"
          >
            <ChevronLeft className="w-5 h-5 stroke-[2]" />
          </button>
        )}
      </div>

      {/* ── Navigation Menu ───────────────────────── */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden min-h-0">
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
                  const badgeCount = itemBadge === -2 ? approvalBadgeCount : (itemBadge || 0);
                  return (
                    <Link
                      key={item.name}
                      href={item.href || '#'}
                      onClick={onCloseMobile}
                      title={isCollapsed ? item.name : undefined}
                      style={
                        active
                          ? {
                              background: '#003D58',
                              boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                            }
                          : undefined
                      }
                      className={`flex items-center text-xs sm:text-[13px] transition-all relative group cursor-pointer ${
                        isCollapsed ? 'justify-center py-2.5 px-0 rounded-xl mx-1' : 'gap-3 px-3.5 py-2.5 rounded-xl'
                      } ${
                        active
                          ? 'text-[#FFF9F9] font-bold'
                          : 'text-[#64748B] hover:bg-slate-100/70 hover:text-[#0F172A] font-medium'
                      }`}
                    >
                      <div className="relative shrink-0 flex items-center justify-center">
                        <Icon
                          className={`w-[18px] h-[18px] transition-colors ${
                            active ? 'text-[#FFF9F9]' : 'text-[#67686D] group-hover:text-slate-900'
                          }`}
                        />
                        {badgeCount > 0 && isCollapsed && (
                          <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-[#E11D48] text-white text-[9px] font-bold px-1 ring-2 ring-white animate-pulse">
                            {badgeCount > 99 ? '99+' : badgeCount}
                          </span>
                        )}
                      </div>
                      {!isCollapsed && (
                        <>
                          <span className="truncate leading-5 flex-1 font-['Poppins'] whitespace-nowrap">{item.name}</span>
                          {badgeCount > 0 && (
                            <span
                              className={`min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] font-bold px-1.5 shrink-0 ${
                                active
                                  ? 'bg-[#E11D48] text-white'
                                  : 'bg-[#E11D48] text-white'
                              }`}
                            >
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
                  const groupBadge = item.id === 'persetujuan' ? approvalBadgeCount : 0;

                  return (
                    <div key={item.id || item.name}>
                      {/* Group Header Button */}
                      <button
                        onClick={() => {
                          if (isCollapsed) {
                            if (item.id === 'riwayat') {
                              router.push('/riwayat-surat');
                            } else if (item.id === 'persetujuan') {
                              router.push('/persetujuan?tab=surat');
                            }
                            return;
                          }
                          if (item.id) toggleGroup(item.id);
                        }}
                        title={
                          isCollapsed
                            ? `${item.name} (${item.id === 'persetujuan' ? 'Buka Persetujuan Surat' : 'Buka Riwayat Surat'})`
                            : undefined
                        }
                        style={
                          groupActive && !isOpen
                            ? {
                                background: '#003D58',
                                boxShadow: '0px 4px 4px rgba(0, 0, 0, 0.25)',
                              }
                            : undefined
                        }
                        className={`w-full flex items-center text-xs sm:text-[13px] transition-all relative group cursor-pointer ${
                          isCollapsed ? 'justify-center py-2.5 px-0 rounded-xl mx-1' : 'gap-3 px-3.5 py-2.5 rounded-xl justify-between'
                        } ${
                          groupActive && !isOpen
                            ? 'text-[#FFF9F9] font-bold'
                            : groupActive && isOpen
                            ? 'bg-[#F0F9FF] text-[#003D58] font-bold'
                            : 'text-[#64748B] hover:bg-slate-100/70 hover:text-[#0F172A] font-medium'
                        }`}
                      >
                        <div className={`flex items-center ${isCollapsed ? '' : 'gap-3'}`}>
                          <div className="relative shrink-0 flex items-center justify-center">
                            <Icon
                              className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                                groupActive && !isOpen
                                  ? 'text-[#FFF9F9]'
                                  : groupActive && isOpen
                                  ? 'text-[#003D58]'
                                  : 'text-[#67686D] group-hover:text-slate-900'
                              }`}
                            />
                            {groupBadge > 0 && isCollapsed && (
                              <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-[#E11D48] text-white text-[9px] font-bold px-1 ring-2 ring-white animate-pulse">
                                {groupBadge > 99 ? '99+' : groupBadge}
                              </span>
                            )}
                          </div>
                          {!isCollapsed && <span className="truncate leading-5 font-['Poppins'] whitespace-nowrap">{item.name}</span>}
                        </div>
                        {!isCollapsed && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            {groupBadge > 0 && (
                              <span className="min-w-[20px] h-5 flex items-center justify-center rounded-full text-[10px] font-bold px-1.5 shrink-0 bg-[#E11D48] text-white">
                                {groupBadge > 99 ? '99+' : groupBadge}
                              </span>
                            )}
                            <ChevronDown
                              className={`w-3.5 h-3.5 transition-transform duration-200 shrink-0 ${
                                groupActive && !isOpen
                                  ? 'text-white'
                                  : 'text-slate-400'
                              } ${isOpen ? 'rotate-180' : ''}`}
                            />
                          </div>
                        )}
                      </button>

                      {/* Children */}
                      {!isCollapsed && isOpen && (
                        <div className="mt-1 ml-4 pl-3 border-l-2 border-slate-100 space-y-1">
                          {(item.children || []).map((child) => {
                            const childActive = isActive(child.href);
                            const ChildIcon = child.icon;
                            const childCount = child.badgeKey ? badgeDetail[child.badgeKey as keyof typeof badgeDetail] : 0;

                            return (
                              <Link
                                key={child.name}
                                href={child.href}
                                onClick={onCloseMobile}
                                style={
                                  childActive
                                    ? {
                                        background: '#003D58',
                                        boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.2)',
                                      }
                                    : undefined
                                }
                                className={`flex items-center gap-2.5 rounded-xl text-xs px-3.5 py-2 transition-all ${
                                  childActive
                                    ? 'text-[#FFF9F9] font-bold'
                                    : 'text-[#64748B] hover:bg-slate-100/70 hover:text-[#0F172A] font-medium'
                                }`}
                              >
                                <ChildIcon
                                  className={`w-3.5 h-3.5 shrink-0 transition-colors ${
                                    childActive ? 'text-[#FFF9F9]' : 'text-slate-400'
                                  }`}
                                />
                                <span className="truncate leading-5 font-['Poppins'] whitespace-nowrap flex-1">{child.name}</span>
                                {childCount > 0 && (
                                  <span className="min-w-[18px] h-4.5 flex items-center justify-center rounded-full text-[9px] font-bold px-1.5 shrink-0 bg-[#E11D48] text-white ml-auto">
                                    {childCount}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                      )}

                      {/* Collapsed: show children indicator */}
                      {isCollapsed && isGroupActive(item.children || []) && (
                        <div className="flex justify-center mt-0.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#003D58]" />
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
      <div className="px-3 py-3 border-t border-slate-100 shrink-0">
        <button
          onClick={handleLogout}
          title={isCollapsed ? 'Keluar' : undefined}
          className={`w-full flex items-center rounded-xl text-sm font-medium text-[#EF4444] hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer ${
            isCollapsed ? 'justify-center py-2.5 px-0' : 'gap-3 px-3.5 py-2.5'
          }`}
        >
          <LogOut className="w-5 h-5 text-[#EF4444] shrink-0 stroke-[2]" />
          {!isCollapsed && <span className="font-['Poppins'] font-medium leading-5">Keluar</span>}
        </button>
      </div>
    </aside>
  );
}
