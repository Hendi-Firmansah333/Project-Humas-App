'use client';

import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
} from 'recharts';

interface DisplayTrendChartProps {
  data: any[];
}

export default function DisplayTrendChart({ data }: DisplayTrendChartProps) {
  return (
    <div className="h-44 w-full mt-1">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
          <XAxis
            dataKey="month"
            tick={{ fontSize: 10, fill: '#64748B' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 10, fill: '#64748B' }}
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
          />
          <RechartsTooltip
            contentStyle={{
              borderRadius: 8,
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              fontSize: 12,
              boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
            }}
          />
          <Bar
            dataKey="kegiatan"
            name="Kegiatan Diliput"
            fill="#003D58"
            radius={[4, 4, 0, 0]}
            maxBarSize={18}
          />
          <Bar
            dataKey="konten"
            name="Content Plan"
            fill="#E99710"
            radius={[4, 4, 0, 0]}
            maxBarSize={18}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

