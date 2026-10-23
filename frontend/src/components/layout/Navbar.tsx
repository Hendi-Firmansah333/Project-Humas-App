'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Search,
  Calendar,
  Bell,
  Menu,
  User as UserIcon,
  Settings,
  LogOut,
  ChevronRight,
  CheckCircle2,
  Info,
  AlertTriangle,
  AlertCircle,
  X,
  FileText,
  Mail,
  CalendarCheck2,
  Users,
  Compass,
  ArrowUpRight,
} from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import UserAvatar from '@/components/common/UserAvatar';
import { authService, notificationService, activityService, incomingLetterService, userService } from '@/services';
import { syncUserSession } from '@/utils/session';
import { Notification } from '@/types';
import { formatDateID } from '@/utils/formatters';

interface NavbarProps {
  title?: string;
  onOpenMobileMenu?: () => void;
}

const notifIcon = (type: string) => {
  switch (type) {
    case 'SUCCESS': return <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#006971' }} />;
    case 'WARNING': return <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />;
    case 'ALERT': return <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />;
    default: return <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />;
  }
};

export default function Navbar({ title = 'TIM HUMAS POLINELA', onOpenMobileMenu }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState('');
  const [user, setUser] = useState<{ fullName: string; roleLabel: string; avatar: string }>({
    fullName: '',
    roleLabel: '',
    avatar: '',
  });

  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Search functionality (active on main dashboard only)
  const isDashboard = pathname === '/dashboard' || pathname === '/';
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [searchResults, setSearchResults] = useState<{
    activities: { id: number; title: string; location?: string; date?: string; status?: string }[];
    letters: { id: number; letterNumber: string; subject: string; sender: string }[];
    users: { id: number; fullName: string; roleLabel?: string }[];
    menus: { title: string; path: string; desc: string }[];
  }>({
    activities: [],
    letters: [],
    users: [],
    menus: [],
  });
  const searchRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const SYSTEM_MENUS = [
    { title: 'Dashboard Operasional', path: '/dashboard', desc: 'Statistik, ringkasan peliputan & kehadiran hari ini' },
    { title: 'Surat Masuk Humas', path: '/surat-masuk', desc: 'Kelola & catat disposisi surat masuk dari luar/internal' },
    { title: 'Kegiatan & Peliputan', path: '/kegiatan', desc: 'Jadwal liputan, penugasan kru & dokumentasi' },
    { title: 'Content Plan & Media', path: '/content-plan', desc: 'Perencanaan konten media sosial & publikasi Humas' },
    { title: 'Live Location Tim', path: '/live-location', desc: 'Monitoring lokasi presensi kru di lapangan secara realtime' },
    { title: 'Inventaris & Alat Liputan', path: '/peminjaman-alat', desc: 'Peminjaman kamera, lensa, stabilizer & peralatan studio' },
    { title: 'Jadwal Piket Humas', path: '/jadwal-piket', desc: 'Daftar jadwal tugas & piket harian staf Humas' },
    { title: 'Persetujuan & Verifikasi', path: '/persetujuan', desc: 'Persetujuan surat masuk, penugasan & laporan kegiatan' },
    { title: 'Laporan Publikasi & Kinerja', path: '/laporan', desc: 'Rekapitulasi berkas laporan dan evaluasi kinerja' },
    { title: 'Profil & Pengaturan Akun', path: '/profil', desc: 'Informasi profil pengguna dan keamanan' },
  ];

  const performSearch = async (query: string) => {
    const q = query.trim().toLowerCase();
    if (!q) {
      setSearchResults({ activities: [], letters: [], users: [], menus: [] });
      setIsSearching(false);
      return;
    }

    setIsSearching(true);

    try {
      const matchingMenus = SYSTEM_MENUS.filter(
        (m) => m.title.toLowerCase().includes(q) || m.desc.toLowerCase().includes(q)
      );

      const [actRes, letterRes, userRes] = await Promise.allSettled([
        activityService.getAll({ pageSize: 15 }),
        incomingLetterService.getAll(),
        userService.getAll(),
      ]);

      let activities: any[] = [];
      if (actRes.status === 'fulfilled') {
        const items = (actRes.value as any)?.items || (Array.isArray(actRes.value) ? actRes.value : []);
        activities = items
          .filter((a: any) =>
            (a.title || '').toLowerCase().includes(q) ||
            (a.location || '').toLowerCase().includes(q) ||
            (a.category || '').toLowerCase().includes(q)
          )
          .slice(0, 4);
      }

      let letters: any[] = [];
      if (letterRes.status === 'fulfilled') {
        const items = Array.isArray(letterRes.value) ? letterRes.value : [];
        letters = items
          .filter((l: any) =>
            (l.letterNumber || '').toLowerCase().includes(q) ||
            (l.subject || '').toLowerCase().includes(q) ||
            (l.sender || '').toLowerCase().includes(q) ||
            (l.institution || '').toLowerCase().includes(q)
          )
          .slice(0, 4);
      }

      let users: any[] = [];
      if (userRes.status === 'fulfilled') {
        const items = Array.isArray(userRes.value) ? userRes.value : [];
        users = items
          .filter((u: any) =>
            (u.fullName || '').toLowerCase().includes(q) ||
            (u.email || '').toLowerCase().includes(q) ||
            (u.roleLabel || '').toLowerCase().includes(q)
          )
          .slice(0, 4);
      }

      setSearchResults({
        activities,
        letters,
        users,
        menus: matchingMenus.slice(0, 3),
      });
      setShowSearchResults(true);
    } catch {
      // ignore
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    if (!val.trim()) {
      setShowSearchResults(false);
      return;
    }
    searchTimeoutRef.current = setTimeout(() => {
      performSearch(val);
    }, 200);
  };

  const handleSelectResult = (url: string) => {
    setShowSearchResults(false);
    setSearchQuery('');
    router.push(url);
  };

  const handleSearchSubmit = () => {
    if (!searchQuery.trim()) return;
    if (searchResults.menus.length > 0) {
      handleSelectResult(searchResults.menus[0].path);
      return;
    }
    if (searchResults.activities.length > 0) {
      handleSelectResult(`/kegiatan?search=${encodeURIComponent(searchQuery)}`);
      return;
    }
    if (searchResults.letters.length > 0) {
      handleSelectResult(`/surat-masuk?search=${encodeURIComponent(searchQuery)}`);
      return;
    }
    handleSelectResult(`/kegiatan?search=${encodeURIComponent(searchQuery)}`);
  };

  const loadNotifications = useCallback(async () => {
    try {
      const result = await notificationService.getAll({ pageSize: 10 });
      const items = (result?.items ?? []) as Notification[];
      setNotifications(items);
      setUnreadCount(items.filter((n) => !n.isRead).length);
    } catch {
      // Silently fail — notifications are non-critical
    }
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // ignore
    }
  };

  const handleMarkRead = async (id: number) => {
    try {
      await notificationService.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {
      // ignore
    }
  };

  const handleDeleteNotif = async (id: number) => {
    try {
      await notificationService.remove(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      setUnreadCount((c) => {
        const removed = notifications.find((n) => n.id === id);
        return removed && !removed.isRead ? Math.max(0, c - 1) : c;
      });
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    const dateStr = new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
    setCurrentDate(dateStr);

    const loadUser = async () => {
      try {
        const profile = await authService.profile();
        syncUserSession(profile);
        setUser({
          fullName: profile.fullName,
          roleLabel: profile.roleLabel,
          avatar: profile.avatar || '',
        });
      } catch {
        const stored = localStorage.getItem('humass_user');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setUser({
              fullName: parsed.fullName || '',
              roleLabel: parsed.roleLabel || '',
              avatar: parsed.avatar || '',
            });
          } catch {
            // ignore parse errors
          }
        }
      }
    };

    loadUser();
    loadNotifications();

    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfileMenu(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };
  }, [pathname, loadNotifications]);

  const handleLogout = () => {
    localStorage.removeItem('humass_token');
    localStorage.removeItem('humass_user');
    router.push('/login');
  };

  const pathParts = pathname.split('/').filter(Boolean);

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 shadow-xs">
      <div className="flex items-center gap-3 sm:gap-4">
        {onOpenMobileMenu && (
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">{title}</h2>
          {pathParts.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-normal mt-0.5">
              <span>Beranda</span>
              {pathParts.map((part, i) => (
                <React.Fragment key={part}>
                  <span>&gt;</span>
                  <span className={i === pathParts.length - 1 ? 'text-slate-600 font-medium capitalize' : 'capitalize'}>
                    {part.replace(/-/g, ' ')}
                  </span>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Global Quick Search - Only rendered on Dashboard */}
      {isDashboard && (
        <div ref={searchRef} className="relative hidden md:flex items-center justify-center flex-1 max-w-sm lg:max-w-md mx-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearchSubmit();
            }}
            className="w-full"
          >
            <div className="w-full h-10 bg-slate-50 border border-slate-200/80 rounded-full px-4 flex items-center gap-2.5 text-slate-400 focus-within:bg-white focus-within:border-[#006971] focus-within:shadow-xs focus-within:ring-2 focus-within:ring-[#006971]/20 transition-all">
              <button
                type="submit"
                className="cursor-pointer text-slate-400 hover:text-[#006971] transition-colors"
                title="Cari"
              >
                <Search className="w-4 h-4 shrink-0" />
              </button>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim().length >= 1) setShowSearchResults(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') setShowSearchResults(false);
                }}
                placeholder="Cari kegiatan, surat masuk, atau modul..."
                className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
              />
              {isSearching && (
                <div className="w-3.5 h-3.5 border-2 border-[#006971] border-t-transparent rounded-full animate-spin shrink-0" />
              )}
              {searchQuery && !isSearching && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setShowSearchResults(false);
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </form>

          {/* Quick Search Dropdown */}
          {showSearchResults && (
            <div className="absolute top-12 left-0 right-0 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150 max-h-96 overflow-y-auto text-xs">
              <div className="p-3 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                <span>Hasil pencarian untuk: &quot;<strong className="text-slate-700">{searchQuery}</strong>&quot;</span>
                <span className="text-[10px] text-slate-400">Tekan Enter untuk cari</span>
              </div>

              {searchResults.menus.length === 0 &&
              searchResults.activities.length === 0 &&
              searchResults.letters.length === 0 &&
              searchResults.users.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs">
                  <p>Tidak ditemukan kegiatan, surat, atau modul yang cocok.</p>
                </div>
              ) : (
                <div className="p-2 space-y-3">
                  {/* Modul & Menu */}
                  {searchResults.menus.length > 0 && (
                    <div>
                      <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Compass className="w-3 h-3 text-teal-600" />
                        Modul &amp; Navigasi Halaman
                      </p>
                      <div className="space-y-1 mt-1">
                        {searchResults.menus.map((m) => (
                          <button
                            key={m.path}
                            type="button"
                            onClick={() => handleSelectResult(m.path)}
                            className="w-full text-left p-2 rounded-xl hover:bg-teal-50/60 flex items-center justify-between transition-colors group cursor-pointer"
                          >
                            <div>
                              <p className="font-bold text-slate-800 text-xs group-hover:text-teal-700 transition-colors">
                                {m.title}
                              </p>
                              <p className="text-[10px] text-slate-500">{m.desc}</p>
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 transition-colors" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Kegiatan Peliputan */}
                  {searchResults.activities.length > 0 && (
                    <div>
                      <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <CalendarCheck2 className="w-3 h-3 text-teal-600" />
                        Kegiatan &amp; Peliputan
                      </p>
                      <div className="space-y-1 mt-1">
                        {searchResults.activities.map((act) => (
                          <button
                            key={act.id}
                            type="button"
                            onClick={() => handleSelectResult(`/kegiatan?search=${encodeURIComponent(act.title)}`)}
                            className="w-full text-left p-2 rounded-xl hover:bg-teal-50/60 flex items-center justify-between transition-colors group cursor-pointer"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-bold text-slate-800 text-xs group-hover:text-teal-700 transition-colors truncate">
                                {act.title}
                              </p>
                              <p className="text-[10px] text-slate-500 truncate">
                                {act.location || 'Polinela'} {act.date ? `• ${formatDateID(act.date.split('T')[0])}` : ''}
                              </p>
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 transition-colors shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Surat Masuk */}
                  {searchResults.letters.length > 0 && (
                    <div>
                      <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Mail className="w-3 h-3 text-teal-600" />
                        Surat Masuk Humas
                      </p>
                      <div className="space-y-1 mt-1">
                        {searchResults.letters.map((letItem) => (
                          <button
                            key={letItem.id}
                            type="button"
                            onClick={() => handleSelectResult(`/surat-masuk?search=${encodeURIComponent(letItem.letterNumber)}`)}
                            className="w-full text-left p-2 rounded-xl hover:bg-teal-50/60 flex items-center justify-between transition-colors group cursor-pointer"
                          >
                            <div className="min-w-0 pr-2">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                                  {letItem.letterNumber}
                                </span>
                                <span className="font-semibold text-slate-800 text-xs group-hover:text-teal-700 transition-colors truncate">
                                  {letItem.subject}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-500 mt-0.5 truncate">
                                Pengirim: {letItem.sender}
                              </p>
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 transition-colors shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Personel / Tim */}
                  {searchResults.users.length > 0 && (
                    <div>
                      <p className="px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3 text-teal-600" />
                        Personel &amp; Tim Humas
                      </p>
                      <div className="space-y-1 mt-1">
                        {searchResults.users.map((u) => (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => handleSelectResult(`/jadwal-piket`)}
                            className="w-full text-left p-2 rounded-xl hover:bg-teal-50/60 flex items-center justify-between transition-colors group cursor-pointer"
                          >
                            <div>
                              <p className="font-bold text-slate-800 text-xs group-hover:text-teal-700 transition-colors">
                                {u.fullName}
                              </p>
                              <p className="text-[10px] text-slate-500">{u.roleLabel || 'Tim Humas'}</p>
                            </div>
                            <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-teal-600 transition-colors shrink-0" />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden xl:flex items-center gap-2 bg-slate-50 border border-slate-200/80 px-4 py-2 rounded-full text-xs font-normal text-slate-600">
          <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
          <span>{currentDate}</span>
        </div>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => {
              setShowNotifs(!showNotifs);
              if (!showNotifs) loadNotifications();
            }}
            className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <h3 className="font-bold text-sm text-slate-800">Notifikasi Sistem</h3>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <span className="text-[10px] font-semibold bg-red-100 text-red-700 px-2 py-0.5 rounded-full">
                      {unreadCount} Belum Dibaca
                    </span>
                  )}
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[10px] font-semibold hover:opacity-80 transition-colors cursor-pointer"
                      style={{ color: '#006971' }}
                    >
                      Tandai Semua
                    </button>
                  )}
                </div>
              </div>
              <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                {notifications.length === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p>Belum ada notifikasi baru.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-2.5 rounded-xl flex gap-3 text-xs transition-colors group ${
                        !n.isRead
                          ? 'bg-[#006971]/5 border border-[#006971]/10'
                          : 'hover:bg-slate-50 border border-transparent'
                      }`}
                    >
                      {notifIcon(n.type)}
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 leading-snug">{n.title}</p>
                        <p className="text-slate-500 text-[11px] mt-0.5 line-clamp-2">{n.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{formatDateID(n.createdAt)}</p>
                      </div>
                      <div className="flex flex-col items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        {!n.isRead && (
                          <button
                            onClick={() => handleMarkRead(n.id)}
                            title="Tandai sudah dibaca"
                            className="p-0.5 rounded hover:bg-[#006971]/10 transition-colors cursor-pointer"
                            style={{ color: '#006971' }}
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteNotif(n.id)}
                          title="Hapus notifikasi"
                          className="p-0.5 rounded text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="relative border-l border-slate-200 pl-2 sm:pl-3.5" ref={profileRef}>
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 cursor-pointer p-1 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 leading-tight">
                {user.fullName || 'Memuat...'}
              </p>
              <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                {user.roleLabel || 'Admin Humas'}
              </p>
            </div>
            <UserAvatar src={user.avatar} name={user.fullName || 'U'} size="md" />
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-3 py-2 border-b border-slate-100 sm:hidden">
                <p className="font-bold text-xs text-slate-800">{user.fullName}</p>
                <p className="text-[10px] text-slate-400">{user.roleLabel}</p>
              </div>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  router.push('/profil');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
              >
                <UserIcon className="w-4 h-4 text-slate-400" />
                <span>Lihat Profil</span>
              </button>
              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  router.push('/profil');
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
              >
                <Settings className="w-4 h-4 text-slate-400" />
                <span>Pengaturan Akun</span>
              </button>
              <div className="border-t border-slate-100 my-1" />
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-red-500 rotate-180" />
                <span>Keluar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
