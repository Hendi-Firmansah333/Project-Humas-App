import React from 'react';

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* 4 Stats Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {[1, 2, 3, 4].map((idx) => (
          <div key={idx} className="bg-white rounded-2xl border border-slate-200 p-5 h-32 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div className="w-24 h-4 bg-slate-200 rounded-md" />
              <div className="w-10 h-10 bg-slate-200 rounded-xl" />
            </div>
            <div>
              <div className="w-16 h-8 bg-slate-200 rounded-md mb-2" />
              <div className="w-32 h-3 bg-slate-100 rounded-md" />
            </div>
          </div>
        ))}
      </div>

      {/* Map & Upcoming Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 h-96">
          <div className="w-48 h-6 bg-slate-200 rounded-md mb-4" />
          <div className="w-full h-72 bg-slate-100 rounded-xl" />
        </div>
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 h-96">
          <div className="w-40 h-6 bg-slate-200 rounded-md mb-4" />
          <div className="space-y-4">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 space-y-2">
                <div className="w-32 h-4 bg-slate-200 rounded-md" />
                <div className="w-full h-3 bg-slate-100 rounded-md" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
