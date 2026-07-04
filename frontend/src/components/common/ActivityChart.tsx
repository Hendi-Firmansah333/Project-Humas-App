'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';

interface ChartDataPoint {
  month: string;
  kegiatan: number;
  konten: number;
}

interface ActivityChartProps {
  data?: ChartDataPoint[];
  title?: string;
}

const defaultData: ChartDataPoint[] = [
  { month: 'Jan', kegiatan: 12, konten: 8 },
  { month: 'Feb', kegiatan: 19, konten: 14 },
  { month: 'Mar', kegiatan: 15, konten: 22 },
  { month: 'Apr', kegiatan: 28, konten: 18 },
  { month: 'Mei', kegiatan: 34, konten: 29 },
  { month: 'Jun', kegiatan: 24, konten: 19 },
];

export default function ActivityChart({
  data = defaultData,
  title = 'Grafik Kegiatan & Konten (6 Bulan Terakhir)',
}: ActivityChartProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs w-full">
      {title && <h3 className="text-base font-bold text-slate-800 mb-6">{title}</h3>}

      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
            <XAxis dataKey="month" tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                fontSize: '12px',
              }}
            />
            <Legend
              verticalAlign="top"
              align="right"
              iconType="circle"
              wrapperStyle={{ paddingBottom: '20px', fontSize: '12px' }}
            />
            <Bar dataKey="kegiatan" name="Kegiatan" fill="#0D9488" radius={[6, 6, 0, 0]} barSize={24} />
            <Bar dataKey="konten" name="Content Plan" fill="#38BDF8" radius={[6, 6, 0, 0]} barSize={24} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
