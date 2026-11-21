'use client';

import React from 'react';

export interface TableSkeletonProps {
  statsCount?: number;
  rows?: number;
  columns?: number;
  className?: string;
}

export default function TableSkeleton({
  statsCount = 0,
  rows = 5,
  columns = 5,
  className = '',
}: TableSkeletonProps) {
  return (
    <div className={`space-y-5 ${className}`}>
      {/* 1. Optional Stat Cards Shimmer */}
      {statsCount > 0 && (
        <div
          className={`grid grid-cols-1 ${
            statsCount === 3
              ? 'sm:grid-cols-3'
              : statsCount === 2
                ? 'sm:grid-cols-2'
                : 'sm:grid-cols-2 lg:grid-cols-4'
          } gap-3 sm:gap-4`}
        >
          {Array.from({ length: statsCount }, (_, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 flex items-center justify-between shadow-xs shimmer-card"
            >
              <div className="space-y-2 flex-1">
                <div className="h-3 w-28 rounded-md animate-shimmer" />
                <div className="h-7 w-16 rounded-md animate-shimmer" />
                <div className="h-2.5 w-36 rounded-md animate-shimmer" />
              </div>
              <div className="w-12 h-12 rounded-xl bg-slate-100 animate-shimmer shrink-0" />
            </div>
          ))}
        </div>
      )}

      {/* 2. Main Table & Filters Card Shimmer */}
      <div className="bg-white rounded-2xl border border-slate-200/90 shadow-xs overflow-hidden shimmer-card">
        {/* Header Search & Filter Bar */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
            <div className="h-10 w-full sm:w-72 rounded-xl bg-slate-100 animate-shimmer" />
            <div className="h-10 w-full sm:w-48 rounded-xl bg-slate-100 animate-shimmer" />
          </div>
          <div className="h-10 w-36 rounded-xl bg-slate-100 animate-shimmer hidden sm:block shrink-0" />
        </div>

        {/* Table Header Columns */}
        <div className="hidden sm:grid grid-cols-12 gap-4 px-6 py-3.5 bg-slate-50/70 border-b border-slate-200/70">
          <div className="col-span-1 h-3.5 w-6 rounded bg-slate-200/70 animate-shimmer" />
          <div className="col-span-4 h-3.5 w-32 rounded bg-slate-200/70 animate-shimmer" />
          <div className="col-span-3 h-3.5 w-24 rounded bg-slate-200/70 animate-shimmer" />
          <div className="col-span-2 h-3.5 w-20 rounded bg-slate-200/70 animate-shimmer" />
          <div className="col-span-2 h-3.5 w-16 rounded bg-slate-200/70 animate-shimmer ml-auto" />
        </div>

        {/* Table Rows Shimmer */}
        <div className="divide-y divide-slate-100">
          {Array.from({ length: rows }, (_, i) => (
            <div
              key={i}
              className="p-4 sm:px-6 sm:py-4 flex flex-col sm:grid sm:grid-cols-12 sm:items-center gap-3"
            >
              <div className="hidden sm:block col-span-1">
                <div className="h-4 w-5 rounded bg-slate-100 animate-shimmer" />
              </div>

              <div className="col-span-4 space-y-1.5">
                <div className="h-4 w-44 rounded bg-slate-100 animate-shimmer" />
                <div className="h-3 w-32 rounded bg-slate-100/70 animate-shimmer" />
              </div>

              <div className="col-span-3 space-y-1">
                <div className="h-3.5 w-36 rounded bg-slate-100 animate-shimmer" />
                <div className="h-3 w-24 rounded bg-slate-100/60 animate-shimmer" />
              </div>

              <div className="col-span-2">
                <div className="h-6 w-24 rounded-full bg-slate-100 animate-shimmer" />
              </div>

              <div className="col-span-2 flex items-center justify-end gap-2">
                <div className="h-8 w-20 rounded-xl bg-slate-100 animate-shimmer" />
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Bar Shimmer */}
        <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-200/70 flex items-center justify-between">
          <div className="h-4 w-44 rounded bg-slate-200/60 animate-shimmer" />
          <div className="flex items-center gap-1.5">
            <div className="h-8 w-8 rounded-lg bg-slate-200/60 animate-shimmer" />
            <div className="h-8 w-8 rounded-lg bg-slate-200/60 animate-shimmer" />
            <div className="h-8 w-8 rounded-lg bg-slate-200/60 animate-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}

