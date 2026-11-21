'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LabelList,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts';

export function DashboardAgendaMonthlyChart({
  data,
  loading = false,
}: {
  data: any[];
  loading?: boolean;
}) {
  return (
    <div className={`h-36 sm:h-40 w-full mt-0.5 transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 16, right: 12, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis
            dataKey="shortMonth"
            tick={{ fontSize: 10, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 10, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
          />
          <RechartsTooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              fontSize: 11,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
          />
          <Bar dataKey="count" name="Jumlah Kegiatan" fill="#003D58" radius={[6, 6, 0, 0]} maxBarSize={28}>
            <LabelList dataKey="count" position="top" style={{ fontSize: 10, fontWeight: 700, fill: '#0F172A' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DashboardServiceFreqChart({
  data,
  loading = false,
}: {
  data: any[];
  loading?: boolean;
}) {
  if (data.length === 0) {
    return (
      <div className="h-40 sm:h-44 w-full flex items-center justify-center text-xs text-slate-400 font-['Poppins']">
        Belum ada data jenis layanan pada periode ini
      </div>
    );
  }

  return (
    <div className={`h-40 sm:h-44 w-full mt-0.5 transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="name" width={110} tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
          <RechartsTooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              fontSize: 11,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
          />
          <Bar dataKey="count" name="Frekuensi Layanan" fill="#003D58" radius={[0, 6, 6, 0]} maxBarSize={18}>
            <LabelList dataKey="count" position="right" style={{ fontSize: 10, fontWeight: 700, fill: '#0F172A' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function DashboardServiceCompChart({
  data,
  loading = false,
}: {
  data: any[];
  loading?: boolean;
}) {
  if (data.length === 0) {
    return (
      <div className="h-44 sm:h-48 w-full flex items-center justify-center text-xs text-slate-400 font-['Poppins']">
        Belum ada data perbandingan layanan
      </div>
    );
  }

  return (
    <div className={`h-44 sm:h-48 w-full mt-0.5 transition-opacity ${loading ? 'opacity-50' : 'opacity-100'}`}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
          <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10, fill: '#94A3B8' }} axisLine={false} tickLine={false} />
          <YAxis type="category" dataKey="month" width={72} tick={{ fontSize: 10, fill: '#64748B' }} axisLine={false} tickLine={false} />
          <RechartsTooltip
            contentStyle={{
              borderRadius: 8,
              border: '1px solid #E2E8F0',
              fontSize: 11,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
          />
          <Bar dataKey="eksternal" name="Eksternal" fill="#35C6D4" radius={[0, 4, 4, 0]} maxBarSize={12}>
            <LabelList dataKey="eksternal" position="right" style={{ fontSize: 9, fontWeight: 600, fill: '#64748B' }} />
          </Bar>
          <Bar dataKey="internal" name="Internal" fill="#003D58" radius={[0, 4, 4, 0]} maxBarSize={12}>
            <LabelList dataKey="internal" position="right" style={{ fontSize: 9, fontWeight: 600, fill: '#64748B' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

