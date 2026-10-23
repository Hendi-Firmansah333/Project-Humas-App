import React from 'react';
import { LucideIcon } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

interface StatCardProps {
  title: string;
  value: string | number;
  icon?: LucideIcon;
  iconBgClass?: string;
  iconColorClass?: string;
  subtitle?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  iconBgClass = 'bg-[#006971]/10',
  iconColorClass = 'text-[#006971]',
  subtitle,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col justify-between transition-all hover:shadow-sm duration-150">
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider leading-snug">
          {title}
        </span>
        {Icon && (
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${iconBgClass} ${iconColorClass}`}
          >
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div>
        <div className="text-3xl font-black text-slate-900 tracking-tight">
          <AnimatedCounter end={value} />
        </div>
        {subtitle && <p className="text-xs text-slate-400 mt-1 leading-normal">{subtitle}</p>}
      </div>
    </div>
  );
}
