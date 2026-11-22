'use client';

import React from 'react';
import { Clapperboard, Mic, Image as ImageIcon, FileText, Radio, Layers } from 'lucide-react';

interface ContentTypeBadgeProps {
  type?: string;
  className?: string;
}

function formatContentTypeLabel(raw?: string): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return 'Konten';
  const upper = trimmed.toUpperCase();
  if (upper === 'REELS') return 'Reels';
  if (upper === 'VIDEO_PENDEK') return 'Video Pendek';
  if (upper === 'VIDEO_DOKUMENTER') return 'Video Dokumenter';
  if (upper === 'BERITA_RILIS') return 'Berita Rilis';
  if (upper === 'INFOGRAFIS') return 'Infografis';
  if (upper === 'PODCAST') return 'Podcast';
  if (upper === 'FOTO') return 'Foto';
  if (upper === 'CAROUSEL') return 'Carousel';
  if (upper === 'STORY' || upper === 'STORIES') return 'Story';
  // Convert SNAKE_CASE or ALL CAPS gracefully to Title Case
  if (trimmed === upper || trimmed.includes('_')) {
    return trimmed
      .toLowerCase()
      .split(/[_\s]+/)
      .filter(Boolean)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
  }
  return trimmed;
}

export default function ContentTypeBadge({ type, className = '' }: ContentTypeBadgeProps) {
  const label = formatContentTypeLabel(type);
  const lower = label.toLowerCase();

  let pillClass = 'bg-slate-100 text-[#003D58]';
  let Icon = Layers;

  if (lower.includes('podcast') || lower.includes('audio')) {
    pillClass = 'bg-teal-50 text-teal-700';
    Icon = Mic;
  } else if (lower.includes('reel') || lower.includes('video') || lower.includes('tiktok') || lower.includes('short')) {
    pillClass = 'bg-violet-50 text-violet-700';
    Icon = Clapperboard;
  } else if (lower.includes('live') || lower.includes('stream')) {
    pillClass = 'bg-rose-50 text-rose-700';
    Icon = Radio;
  } else if (
    lower.includes('foto') ||
    lower.includes('photo') ||
    lower.includes('infografis') ||
    lower.includes('carousel') ||
    lower.includes('poster') ||
    lower.includes('story') ||
    lower.includes('feed')
  ) {
    pillClass = 'bg-sky-50 text-[#003D58]';
    Icon = ImageIcon;
  } else if (lower.includes('berita') || lower.includes('artikel') || lower.includes('rilis') || lower.includes('press')) {
    pillClass = 'bg-emerald-50 text-emerald-700';
    Icon = FileText;
  }

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-[2.5px] text-[10.5px] font-semibold leading-none whitespace-nowrap ${pillClass} ${className}`}
    >
      <Icon className="w-3 h-3 shrink-0 stroke-[2.2]" />
      <span>{label}</span>
    </span>
  );
}

