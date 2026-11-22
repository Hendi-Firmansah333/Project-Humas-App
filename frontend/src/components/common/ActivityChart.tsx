'use client';

import React from 'react';
import dynamic from 'next/dynamic';
import type { ActivityChartProps } from './ActivityChartInner';

const ActivityChartInner = dynamic(() => import('./ActivityChartInner'), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs w-full">
      <div className="h-5 w-64 bg-slate-100 rounded animate-pulse mb-6" />
      <div className="h-72 w-full bg-slate-50 rounded-xl animate-pulse" />
    </div>
  ),
});

export default function ActivityChart(props: ActivityChartProps) {
  return <ActivityChartInner {...props} />;
}
