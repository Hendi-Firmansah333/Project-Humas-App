'use client';

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Search, Calendar, Bell, Menu, User as UserIcon, Settings, LogOut, ChevronRight, CheckCircle2, Info, AlertTriangle, AlertCircle, X } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import UserAvatar from '@/components/common/UserAvatar';
import { authService, notificationService } from '@/services';
import { syncUserSession } from '@/utils/session';
import { Notification } from '@/types';
import { formatDateID } from '@/utils/formatters';

interface NavbarProps {
  title?: string;
  onOpenMobileMenu?: () => void;
}

const notifIcon = (type: string) => {
  switch (type) {
    case 'SUCCESS': return <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />;
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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
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
          <h2 className="text-sm sm:text-base font-bold text-teal-800 tracking-wide">{title}</h2>
          {pathParts.length > 0 && (
            <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-slate-400 capitalize font-medium mt-0.5">
              <span>Beranda</span>
              {pathParts.map((part, i) => (
                <React.Fragment key={part}>
                  <ChevronRight className="w-3 h-3 text-slate-300" />
                  <span className={i === pathParts.length - 1 ? 'text-slate-700 font-semibold' : ''}>
                    {part.replace(/-/g, ' ')}
                  </span>
                </React.Fragment>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="hidden md:flex items-center">
        <div className="w-64 lg:w-80 h-9 bg-slate-100/90 rounded-full px-4 flex items-center gap-2.5 text-slate-500 border border-transparent focus-within:border-teal-500 focus-within:bg-white focus-within:shadow-xs transition-all">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Cari kegiatan, dokumen, atau personel..."
            className="w-full bg-transparent text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-4">
        <div className="hidden xl:flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 border border-slate-200/50">
          <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
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
                      className="text-[10px] font-semibold text-teal-600 hover:text-teal-800 transition-colors cursor-pointer"
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
                          ? 'bg-teal-50/60 border border-teal-100'
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
                            className="p-0.5 rounded text-teal-600 hover:bg-teal-100 transition-colors cursor-pointer"
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
