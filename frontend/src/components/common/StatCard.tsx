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
  badge?: string;
  compact?: boolean;
  className?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  iconBgClass = 'bg-[#C0FFEA]/60',
  iconColorClass = 'text-[#0F766E]',
  subtitle,
  badge,
  compact = false,
  className = '',
}: StatCardProps) {
  const pillLabel = badge ?? subtitle;

  return (
    <div
      className={`relative overflow-hidden bg-white rounded-[14px] border border-slate-200/80 shadow-[0_2px_10px_rgba(0,61,88,0.05)] hover:shadow-[0_6px_18px_rgba(0,61,88,0.09)] transition-all duration-200 flex flex-col justify-between font-['Poppins'] ${
        compact ? 'min-h-[108px] pl-[58px] pr-3.5 py-3' : 'min-h-[132px] pl-[68px] sm:pl-[72px] pr-4 py-4'
      } ${className}`}
    >
      {/* Left Decorative Dual-Layer Wave (#51FCE4 outer + #003D58 inner) */}
      <svg
        aria-hidden="true"
        viewBox="0 0 60 140"
        preserveAspectRatio="none"
        className={`pointer-events-none select-none absolute inset-y-0 left-0 h-full ${
          compact ? 'w-[46px]' : 'w-[54px] sm:w-[58px]'
        }`}
      >
        <path
          d="M 0 0 L 44 0 C 59 24, 58 54, 46 80 C 35 103, 38 122, 58 140 L 0 140 Z"
          fill="#51FCE4"
        />
        <path
          d="M 0 0 L 31 0 C 46 24, 45 54, 33 80 C 22 103, 25 122, 44 140 L 0 140 Z"
          fill="#003D58"
        />
      </svg>

      {/* Top Row: Title + Optional Subtle Icon */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <span
          className={`font-semibold text-slate-500 uppercase tracking-wider leading-snug ${
            compact ? 'text-[10px]' : 'text-[11px]'
          }`}
        >
          {title}
        </span>
        {Icon && (
          <div
            className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${iconBgClass} ${iconColorClass}`}
          >
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Middle Row: Main Value */}
      <div className="relative z-10 mt-1.5">
        <div
          className={`font-bold text-[#003D58] tracking-[-0.75px] leading-[36px] ${
            compact ? 'text-[26px]' : 'text-[28px] sm:text-[30px]'
          }`}
        >
          <AnimatedCounter end={value} />
        </div>
      </div>

      {/* Bottom-Right Pill Badge */}
      {pillLabel && (
        <div className="relative z-10 mt-2 flex justify-end">
          <span
            className="inline-flex items-center px-2.5 py-[2.5px] rounded-full bg-[#C0FFEA] text-[#0F766E] font-medium text-[10px] leading-[15px] max-w-full truncate"
            title={pillLabel}
          >
            {pillLabel}
          </span>
        </div>
      )}
    </div>
  );
}
