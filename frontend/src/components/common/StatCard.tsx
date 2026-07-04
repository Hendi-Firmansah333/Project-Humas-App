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
  iconBgClass = 'bg-teal-50',
  iconColorClass = 'text-teal-600',
  subtitle,
}: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between transition-all hover:shadow-md hover:-translate-y-0.5 duration-200">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          {title}
        </span>
        {Icon && (
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBgClass} ${iconColorClass}`}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
      </div>
      <div>
        <div className="text-2xl lg:text-3xl font-bold text-slate-900 tracking-tight">
          <AnimatedCounter end={value} />
        </div>
        {subtitle && <p className="text-xs text-slate-400 mt-1">{subtitle}</p>}
      </div>
    </div>
  );
}
