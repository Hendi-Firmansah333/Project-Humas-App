'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Search, Calendar, Bell, Menu, User as UserIcon, Settings, LogOut, ChevronRight, CheckCircle2 } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

interface NavbarProps {
  title?: string;
  onOpenMobileMenu?: () => void;
}

export default function Navbar({ title = 'TIM HUMAS POLINELA', onOpenMobileMenu }: NavbarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState('Rabu, 21 Mei 2025');
  const [user, setUser] = useState<{ fullName: string; roleLabel: string; avatar: string }>({
    fullName: 'Komang Ari',
    roleLabel: 'Admin Humas',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  });

  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dateStr = new Intl.DateTimeFormat('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date());
    setCurrentDate(dateStr);

    const storedUser = localStorage.getItem('humass_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser({
          fullName: parsed.fullName || 'Komang Ari',
          roleLabel: parsed.roleLabel || 'Admin Humas',
          avatar:
            parsed.avatar ||
            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        });
      } catch (e) {}
    }

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
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('humass_token');
    localStorage.removeItem('humass_user');
    router.push('/login');
  };

  // Generate dynamic breadcrumb items
  const pathParts = pathname.split('/').filter(Boolean);

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between shrink-0 shadow-xs">
      {/* Left Title & Breadcrumbs */}
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

      {/* Center Search */}
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

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-4">
        {/* Date Pill Badge */}
        <div className="hidden xl:flex items-center gap-2 bg-slate-100/80 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 border border-slate-200/50">
          <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
          <span>{currentDate}</span>
        </div>

        {/* Notification Bell with Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
              3
            </span>
          </button>

          {showNotifs && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
                <h3 className="font-bold text-sm text-slate-800">Notifikasi System</h3>
                <span className="text-[10px] font-semibold bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full">
                  3 Baru
                </span>
              </div>
              <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                <div className="p-2.5 rounded-xl bg-teal-50/60 border border-teal-100 flex gap-3 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800">Jadwal Piket Mei Dipublikasikan</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Anda dijadwalkan bertugas pada 21 Mei & 28 Mei 2025.</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex gap-3 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800">Peminjaman Kamera Sony A7III</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Pengajuan pinjaman alat telah disetujui untuk kegiatan Wisuda.</p>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl hover:bg-slate-50 transition-colors flex gap-3 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold text-slate-800">Review Draft Content Plan</p>
                    <p className="text-slate-500 text-[11px] mt-0.5">Reels Profil Kampus membutuhkan konfirmasi Anda.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Pill with Dropdown */}
        <div className="relative border-l border-slate-200 pl-2 sm:pl-3.5" ref={profileRef}>
          <div
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2.5 cursor-pointer p-1 rounded-xl hover:bg-slate-50 transition-colors"
          >
            <div className="text-right hidden sm:block">
              <p className="text-xs font-semibold text-slate-800 leading-tight">{user.fullName}</p>
              <p className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">{user.roleLabel}</p>
            </div>
            <img
              src={user.avatar}
              alt={user.fullName}
              className="w-9 h-9 rounded-full object-cover border border-teal-200 shadow-xs shrink-0"
            />
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
