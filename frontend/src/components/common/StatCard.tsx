import React, { useId } from 'react';
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
  badgeClassName?: string;
  compact?: boolean;
  className?: string;
}

export default function StatCard({
  title,
  value,
  icon: Icon,
  subtitle,
  badge,
  badgeClassName = 'bg-[#E0E7FF] text-[#4338CA]',
  compact = false,
  className = '',
}: StatCardProps) {
  const uid = useId().replace(/:/g, '');

  return (
    <div
      className={`relative overflow-hidden bg-white rounded-[16px] border border-slate-200/75 shadow-[0_2px_12px_rgba(0,61,88,0.05)] hover:shadow-[0_6px_20px_rgba(0,61,88,0.09)] transition-all duration-200 flex flex-col justify-between font-['Poppins'] ${
        compact ? 'min-h-[110px] pl-[50px] pr-3.5 py-3' : 'min-h-[140px] pl-[60px] sm:pl-[66px] pr-4 py-4'
      } ${className}`}
    >
      {/* Background Soft Blue Wash Gradients (Figma Spec) */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-0"
        style={{
          background:
            'linear-gradient(103.21deg, rgba(168, 216, 240, 0.52) 6.07%, rgba(212, 238, 250, 0.28) 35.7%, rgba(255, 255, 255, 0) 65.32%)',
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-0"
        style={{
          background:
            'linear-gradient(78.35deg, rgba(155, 209, 238, 0.45) 8.29%, rgba(207, 234, 248, 0.22) 41.39%, rgba(255, 255, 255, 0) 68.48%)',
        }}
      />

      {/* Subtle Translucent Curved Ribbons Across Center */}
      <svg
        aria-hidden="true"
        viewBox="0 0 350 140"
        preserveAspectRatio="none"
        className="pointer-events-none select-none absolute inset-0 w-full h-full"
      >
        <defs>
          <linearGradient id={`rib1-${uid}`} x1="0%" y1="0%" x2="25%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
            <stop offset="52%" stopColor="#BBE1F6" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#A8D8F0" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id={`rib2-${uid}`} x1="0%" y1="0%" x2="25%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.68" />
            <stop offset="54%" stopColor="#D7EEFA" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#BFE3F6" stopOpacity="0.18" />
          </linearGradient>
          <linearGradient id={`rib3-${uid}`} x1="0%" y1="0%" x2="25%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.85" />
            <stop offset="64%" stopColor="#EAF6FD" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <path
          d="M 118 0 C 126 48, 146 98, 182 140 L 210 140 C 176 98, 158 48, 150 0 Z"
          fill={`url(#rib1-${uid})`}
        />
        <path
          d="M 155 0 C 164 48, 184 98, 222 140 L 246 140 C 210 98, 192 48, 184 0 Z"
          fill={`url(#rib2-${uid})`}
        />
        <path
          d="M 192 0 C 202 48, 224 98, 264 140 L 296 140 C 258 98, 236 48, 226 0 Z"
          fill={`url(#rib3-${uid})`}
        />
      </svg>

      {/* Left Decorative Triple-Layer Organic Wave */}
      <svg
        aria-hidden="true"
        viewBox="0 0 66 140"
        preserveAspectRatio="none"
        className={`pointer-events-none select-none absolute inset-y-0 left-0 h-full ${
          compact ? 'w-[44px]' : 'w-[54px] sm:w-[60px]'
        }`}
      >
        <defs>
          <linearGradient id={`w1-${uid}`} x1="0%" y1="0%" x2="12%" y2="100%">
            <stop offset="3%" stopColor="#B3DDF3" />
            <stop offset="100%" stopColor="#A8D8F0" />
          </linearGradient>
          <linearGradient id={`w2-${uid}`} x1="0%" y1="0%" x2="10%" y2="100%">
            <stop offset="1%" stopColor="#27779B" />
            <stop offset="55%" stopColor="#1F6B8C" />
            <stop offset="100%" stopColor="#165775" />
          </linearGradient>
          <linearGradient id={`w3-${uid}`} x1="0%" y1="0%" x2="8%" y2="100%">
            <stop offset="0%" stopColor="#004969" />
            <stop offset="50%" stopColor="#003D58" />
            <stop offset="100%" stopColor="#003D58" />
          </linearGradient>
        </defs>
        {/* Outer Light Blue Wave */}
        <path
          d="M 0 0 L 49 0 C 60 22, 60 48, 44 74 C 32 95, 34 116, 62 140 L 0 140 Z"
          fill={`url(#w1-${uid})`}
        />
        {/* Middle Steel Blue Wave */}
        <path
          d="M 0 0 L 34 0 C 46 22, 46 48, 30 74 C 19 95, 22 116, 52 140 L 0 140 Z"
          fill={`url(#w2-${uid})`}
        />
        {/* Inner Deep Navy Wave */}
        <path
          d="M 0 0 L 18 0 C 31 22, 31 48, 17 74 C 7 95, 11 116, 42 140 L 0 140 Z"
          fill={`url(#w3-${uid})`}
        />
      </svg>

      {/* Top Row: Title + Clean Frameless Primary Icon */}
      <div className="relative z-10 flex items-start justify-between gap-2">
        <span
          className={`font-medium text-[#003D58] uppercase tracking-[0.55px] leading-[15px] ${
            compact ? 'text-[10.5px]' : 'text-[12px]'
          }`}
        >
          {title}
        </span>
        {Icon && (
          <div className="w-8 h-8 -mt-1.5 -mr-1 rounded-[10px] flex items-center justify-center shrink-0 text-[#003D58]">
            <Icon className="w-[18px] h-[18px] stroke-[1.75]" />
          </div>
        )}
      </div>

      {/* Middle Row: Main Value */}
      <div className="relative z-10 my-1">
        <div
          className={`font-bold text-[#003D58] tracking-[-0.75px] leading-[36px] ${
            compact ? 'text-[26px]' : 'text-[30px]'
          }`}
        >
          <AnimatedCounter end={value} />
        </div>
      </div>

      {/* Bottom Row: Subtitle Left + Optional Pill Badge Right */}
      {(subtitle || badge) && (
        <div className="relative z-10 flex items-center justify-between gap-2 pt-0.5">
          {subtitle ? (
            <span
              className={`font-medium text-[#003D58] leading-[18px] truncate ${
                compact ? 'text-[11px]' : 'text-[12px]'
              }`}
              title={subtitle}
            >
              {subtitle}
            </span>
          ) : (
            <span />
          )}
          {badge && (
            <span
              className={`inline-flex items-center px-2.5 py-[2px] rounded-full font-medium text-[10px] leading-[15px] whitespace-nowrap shrink-0 ${badgeClassName}`}
              title={badge}
            >
              {badge}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
