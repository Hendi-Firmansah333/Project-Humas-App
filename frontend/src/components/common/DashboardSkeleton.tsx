'use client';

import React from 'react';
import { getStoredUser } from '@/utils/session';

export default function DashboardSkeleton() {
  const user = typeof window !== 'undefined' ? getStoredUser() : null;
  const rawName = user?.fullName?.trim() || 'Komang Ari';
  const isKepalaHumas =
    user?.role === 'SUPER_ADMIN' ||
    user?.roleLabel?.toLowerCase().includes('kepala');
  const displayName = isKepalaHumas
    ? rawName
    : rawName.toLowerCase().startsWith('admin')
      ? rawName
      : rawName.split(' ')[0] || rawName;
  const roleBadge = user?.roleLabel || (isKepalaHumas ? 'KEPALA HUMAS' : 'ADMIN HUMAS');

  const hour = new Date().getHours();
  const greeting =
    hour >= 4 && hour < 11
      ? 'Selamat Pagi'
      : hour >= 11 && hour < 15
        ? 'Selamat Siang'
        : hour >= 15 && hour < 18
          ? 'Selamat Sore'
          : 'Selamat Malam';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start pb-6">
      {/* ── LEFT COLUMN ── */}
      <div className="xl:col-span-7 flex flex-col gap-4">
        {/* 1. Welcome Banner (Instant LCP) */}
        <div
          className="rounded-2xl px-5 sm:px-8 py-5 text-white relative overflow-hidden flex flex-col justify-center shadow-xs"
          style={{
            background: '#003D5B',
            minHeight: '134px',
          }}
        >
          <div className="relative z-10 flex items-center justify-between gap-3 mb-3">
            <span
              className="inline-flex items-center justify-center px-3 py-1 rounded-[9px] text-white text-[12px] leading-[18px] font-bold tracking-wide uppercase font-['Poppins']"
              style={{ background: 'rgba(255, 255, 255, 0.15)' }}
            >
              {roleBadge}
            </span>
          </div>

          <h1 className="relative z-10 text-xl sm:text-2xl font-bold text-white leading-9 font-['Poppins']">
            {greeting}, {displayName}!
          </h1>
        </div>

        {/* 2. Peta Shimmer Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-4.5 shadow-xs flex flex-col gap-3 shimmer-card">
          <div className="flex items-center justify-between">
            <div className="h-5 w-52 rounded-md animate-shimmer" />
            <div className="h-4 w-28 rounded-md animate-shimmer" />
          </div>
          <div className="h-72 w-full rounded-xl animate-shimmer" />
        </div>

        {/* 3. Kegiatan Shimmer Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-4.5 shadow-xs flex flex-col gap-3 shimmer-card">
          <div className="h-5 w-44 rounded-md animate-shimmer" />
          <div className="space-y-2.5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 w-full rounded-xl animate-shimmer" />
            ))}
          </div>
        </div>

        {/* 4. Trend Operasional Shimmer Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-4.5 shadow-xs flex flex-col gap-3 shimmer-card">
          <div className="h-5 w-48 rounded-md animate-shimmer" />
          <div className="h-40 w-full rounded-xl animate-shimmer" />
        </div>
      </div>

      {/* ── RIGHT COLUMN ── */}
      <div className="xl:col-span-5 flex flex-col gap-4">
        {/* 4 Stat Cards Shimmer */}
        <div className="grid grid-cols-2 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-28 bg-white border border-slate-200/90 rounded-2xl p-4 flex flex-col justify-between shadow-xs shimmer-card">
              <div className="h-4 w-20 rounded-md animate-shimmer" />
              <div className="h-7 w-16 rounded-md animate-shimmer" />
              <div className="h-3 w-28 rounded-md animate-shimmer" />
            </div>
          ))}
        </div>

        {/* Agenda Bulanan Shimmer Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-4.5 shadow-xs flex flex-col gap-3 shimmer-card">
          <div className="h-5 w-48 rounded-md animate-shimmer" />
          <div className="grid grid-cols-3 gap-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 rounded-xl animate-shimmer" />
            ))}
          </div>
          <div className="h-36 w-full rounded-xl animate-shimmer" />
        </div>

        {/* Frekuensi Layanan Shimmer Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-4.5 shadow-xs flex flex-col gap-3 shimmer-card">
          <div className="h-5 w-48 rounded-md animate-shimmer" />
          <div className="h-40 w-full rounded-xl animate-shimmer" />
        </div>

        {/* Komparasi Layanan Shimmer Card */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-4.5 shadow-xs flex flex-col gap-3 shimmer-card">
          <div className="h-5 w-48 rounded-md animate-shimmer" />
          <div className="h-40 w-full rounded-xl animate-shimmer" />
        </div>
      </div>
    </div>
  );
}
