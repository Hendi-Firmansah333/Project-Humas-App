'use client';

import React, { useId } from 'react';
import { Globe } from 'lucide-react';

interface PlatformLabelProps {
  platform?: string;
  className?: string;
}

export default function PlatformLabel({ platform, className = '' }: PlatformLabelProps) {
  const igGradId = useId();
  const normalized = (platform || '').trim().toUpperCase();

  if (normalized === 'INSTAGRAM' || normalized === 'IG') {
    return (
      <span className={`inline-flex items-center gap-2 text-xs font-semibold text-slate-700 whitespace-nowrap ${className}`}>
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0" aria-hidden="true">
          <defs>
            <linearGradient id={igGradId} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#FD5949" />
              <stop offset="45%" stopColor="#D6249F" />
              <stop offset="100%" stopColor="#285AEB" />
            </linearGradient>
          </defs>
          <rect x="2" y="2" width="20" height="20" rx="5.5" fill={`url(#${igGradId})`} />
          <circle cx="12" cy="12" r="4.2" fill="none" stroke="#FFFFFF" strokeWidth="1.9" />
          <circle cx="17.2" cy="6.8" r="1.25" fill="#FFFFFF" />
        </svg>
        <span>Instagram</span>
      </span>
    );
  }

  if (normalized === 'YOUTUBE' || normalized === 'YT') {
    return (
      <span className={`inline-flex items-center gap-2 text-xs font-semibold text-slate-700 whitespace-nowrap ${className}`}>
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0" aria-hidden="true">
          <path
            d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814z"
            fill="#FF0000"
          />
          <path d="M9.545 15.568V8.432L15.818 12l-6.273 3.568z" fill="#FFFFFF" />
        </svg>
        <span>YouTube</span>
      </span>
    );
  }

  if (normalized === 'TIKTOK') {
    return (
      <span className={`inline-flex items-center gap-2 text-xs font-semibold text-slate-700 whitespace-nowrap ${className}`}>
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0" aria-hidden="true">
          <path
            d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-2.96v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 0 1-2.59-2.59 2.59 2.59 0 0 1 2.59-2.59c.28 0 .54.04.79.12V9.8a5.55 5.55 0 0 0-.79-.06A5.55 5.55 0 0 0 4.44 15.3 5.55 5.55 0 0 0 10 20.85a5.55 5.55 0 0 0 5.55-5.55V9.01a7.21 7.21 0 0 0 4.21 1.35V7.4a4.28 4.28 0 0 1-3.16-1.58z"
            fill="#25F4EE"
            transform="translate(-0.7 -0.5)"
          />
          <path
            d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-2.96v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 0 1-2.59-2.59 2.59 2.59 0 0 1 2.59-2.59c.28 0 .54.04.79.12V9.8a5.55 5.55 0 0 0-.79-.06A5.55 5.55 0 0 0 4.44 15.3 5.55 5.55 0 0 0 10 20.85a5.55 5.55 0 0 0 5.55-5.55V9.01a7.21 7.21 0 0 0 4.21 1.35V7.4a4.28 4.28 0 0 1-3.16-1.58z"
            fill="#FE2C55"
            transform="translate(0.7 0.5)"
          />
          <path
            d="M16.6 5.82A4.28 4.28 0 0 1 15.54 3h-2.96v12.4a2.59 2.59 0 0 1-2.59 2.5 2.59 2.59 0 0 1-2.59-2.59 2.59 2.59 0 0 1 2.59-2.59c.28 0 .54.04.79.12V9.8a5.55 5.55 0 0 0-.79-.06A5.55 5.55 0 0 0 4.44 15.3 5.55 5.55 0 0 0 10 20.85a5.55 5.55 0 0 0 5.55-5.55V9.01a7.21 7.21 0 0 0 4.21 1.35V7.4a4.28 4.28 0 0 1-3.16-1.58z"
            fill="#0F172A"
          />
        </svg>
        <span>TikTok</span>
      </span>
    );
  }

  if (normalized === 'FACEBOOK' || normalized === 'FB') {
    return (
      <span className={`inline-flex items-center gap-2 text-xs font-semibold text-slate-700 whitespace-nowrap ${className}`}>
        <svg viewBox="0 0 24 24" className="w-[18px] h-[18px] shrink-0" aria-hidden="true">
          <circle cx="12" cy="12" r="11" fill="#1877F2" />
          <path
            d="M15.65 15.2l.48-3.12h-2.99v-2.02c0-.85.42-1.69 1.76-1.69h1.36V5.71s-1.23-.21-2.41-.21c-2.46 0-4.07 1.49-4.07 4.19v2.39H7.03v3.12h2.75V22.7a11.1 11.1 0 0 0 3.36 0v-7.5h2.51z"
            fill="#FFFFFF"
          />
        </svg>
        <span>Facebook</span>
      </span>
    );
  }

  if (normalized === 'WEBSITE' || normalized === 'WEB') {
    return (
      <span className={`inline-flex items-center gap-2 text-xs font-semibold text-slate-700 whitespace-nowrap ${className}`}>
        <Globe className="w-[18px] h-[18px] text-[#0284C7] shrink-0" />
        <span>Website</span>
      </span>
    );
  }

  if (normalized === 'X' || normalized === 'TWITTER') {
    return (
      <span className={`inline-flex items-center gap-2 text-xs font-semibold text-slate-700 whitespace-nowrap ${className}`}>
        <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" aria-hidden="true">
          <path
            d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
            fill="#0F172A"
          />
        </svg>
        <span>{normalized === 'TWITTER' ? 'Twitter / X' : 'X'}</span>
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 text-xs font-semibold text-slate-700 whitespace-nowrap ${className}`}>
      <Globe className="w-[17px] h-[17px] text-slate-400 shrink-0" />
      <span>{platform || '-'}</span>
    </span>
  );
}

