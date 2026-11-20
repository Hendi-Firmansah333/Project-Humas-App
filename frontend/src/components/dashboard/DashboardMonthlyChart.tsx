'use client';

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts';

interface MonthlyDataItem {
  month: string;
  kegiatan: number;
  konten: number;
}

interface DashboardMonthlyChartProps {
  data: MonthlyDataItem[];
  maxVal: number;
}

export default function DashboardMonthlyChart({
  data,
  maxVal,
}: DashboardMonthlyChartProps) {
  return (
    <div className="h-36 sm:h-40 w-full mt-0.5">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 15, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: '#94A3B8' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            domain={[0, maxVal]}
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
          <Line
            type="monotone"
            dataKey="kegiatan"
            name="Kegiatan Diliput"
            stroke="#003D58"
            strokeWidth={3}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="konten"
            name="Content Plan"
            stroke="#35C6D4"
            strokeWidth={2.5}
            dot={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

