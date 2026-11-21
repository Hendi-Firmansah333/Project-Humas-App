'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { LocationData } from '@/types';
import { MapPin, Loader2, Navigation } from 'lucide-react';

export interface CampusMapProps {
  locations?: LocationData[];
  height?: string;
  center?: [number, number]; // [lng, lat] or [lat, lng]
  zoom?: number;
  selectedId?: number;
  onSelectMember?: (loc: LocationData) => void;
  recenterTrigger?: number;
  zoomInTrigger?: number;
  zoomOutTrigger?: number;
  onRefresh?: () => void;
  refreshing?: boolean;
}

// Dynamically import MapLibre inner map only when activated
const MapInner = dynamic(() => import('./CampusMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-slate-500 text-xs gap-3">
      <Loader2 className="w-6 h-6 text-[#35C6D4] animate-spin" />
      <span className="font-medium text-[#202938]">Memuat Peta Live Location...</span>
    </div>
  ),
});

export default function CampusMap({
  locations = [],
  height = 'h-96',
  center = [105.2345, -5.3585], // Default Politeknik Negeri Lampung campus coordinates [lng, lat]
  zoom = 16,
  selectedId,
  onSelectMember,
  recenterTrigger,
  zoomInTrigger,
  zoomOutTrigger,
  onRefresh,
  refreshing,
}: CampusMapProps) {
  const [mapReady, setMapReady] = useState(false);

  useEffect(() => {
    let activated = false;
    const activate = () => {
      if (activated) return;
      activated = true;
      setMapReady(true);
      cleanup();
    };

    const events = ['pointerdown', 'pointermove', 'touchstart', 'wheel', 'keydown'];
    const cleanup = () => {
      events.forEach((ev) => window.removeEventListener(ev, activate));
    };

    events.forEach((ev) => window.addEventListener(ev, activate, { passive: true, once: true }));
    const timer = window.setTimeout(activate, 5000);

    return () => {
      cleanup();
      window.clearTimeout(timer);
    };
  }, []);

  // Also activate immediately if user clicks zoom/recenter/refresh or selects a member
  useEffect(() => {
    if (selectedId || recenterTrigger || zoomInTrigger || zoomOutTrigger || refreshing) {
      setMapReady(true);
    }
  }, [selectedId, recenterTrigger, zoomInTrigger, zoomOutTrigger, refreshing]);

  return (
    <div
      onClick={() => setMapReady(true)}
      className={`w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative bg-[#EEF2F6] ${height}`}
    >
      {mapReady ? (
        <MapInner
          locations={locations}
          center={center}
          zoom={zoom}
          selectedId={selectedId}
          onSelectMember={onSelectMember}
          recenterTrigger={recenterTrigger}
          zoomInTrigger={zoomInTrigger}
          zoomOutTrigger={zoomOutTrigger}
          onRefresh={onRefresh}
          refreshing={refreshing}
        />
      ) : (
        <div className="w-full h-full relative overflow-hidden select-none cursor-pointer bg-[#E8EEF5]">
          {/* Lightweight SVG vector map backdrop of Polinela Campus */}
          <svg
            viewBox="0 0 800 450"
            preserveAspectRatio="xMidYMid slice"
            className="w-full h-full object-cover opacity-90"
            aria-hidden="true"
          >
            <rect width="800" height="450" fill="#EDF2F7" />
            {/* Green campus parks */}
            <path d="M80,60 L340,60 L360,220 L100,240 Z" fill="#DCFCE7" opacity="0.65" />
            <path d="M440,120 L700,100 L720,310 L460,300 Z" fill="#E0F2FE" opacity="0.55" />
            {/* Campus buildings */}
            <rect x="150" y="95" width="90" height="55" rx="6" fill="#CBD5E1" opacity="0.65" />
            <rect x="270" y="110" width="75" height="65" rx="6" fill="#CBD5E1" opacity="0.65" />
            <rect x="200" y="185" width="110" height="60" rx="6" fill="#CBD5E1" opacity="0.65" />
            <rect x="480" y="160" width="95" height="60" rx="6" fill="#CBD5E1" opacity="0.65" />
            {/* Main roads */}
            <path
              d="M0,310 Q260,255 520,300 T800,330"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="18"
            />
            <path
              d="M0,310 Q260,255 520,300 T800,330"
              fill="none"
              stroke="#CBD5E1"
              strokeWidth="2"
              strokeDasharray="8 6"
            />
            <path
              d="M390,0 Q370,180 340,450"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="14"
            />
            <path
              d="M110,160 L660,200"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="9"
            />
          </svg>

          {/* Campus label */}
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-xs border border-slate-200/80 rounded-lg px-2.5 py-1 shadow-2xs flex items-center gap-1.5 text-[11px] font-semibold text-[#003D58]">
            <Navigation className="w-3.5 h-3.5 text-[#35C6D4]" />
            <span>Kampus Politeknik Negeri Lampung</span>
          </div>

          {/* Render lightweight preview pins for personnel */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {locations.slice(0, 5).map((loc, idx) => {
              const offsets = [
                { left: '46%', top: '44%' },
                { left: '34%', top: '52%' },
                { left: '58%', top: '48%' },
                { left: '42%', top: '62%' },
                { left: '63%', top: '38%' },
              ];
              const pos = offsets[idx % offsets.length];
              const initials = (loc.user?.fullName || 'HM')
                .split(' ')
                .map((n: string) => n[0])
                .join('')
                .slice(0, 2)
                .toUpperCase();
              const isOnline = Boolean(loc.isOnline);
              return (
                <div
                  key={loc.id || idx}
                  style={{ left: pos.left, top: pos.top }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                >
                  <div
                    className={`w-9 h-9 rounded-full border-2 border-white shadow-md flex items-center justify-center text-[11px] font-bold text-white ${
                      isOnline ? 'bg-[#003D58]' : 'bg-slate-600'
                    }`}
                  >
                    {initials}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="absolute bottom-3 right-3 bg-white/90 border border-slate-200/80 rounded-lg px-2.5 py-1 text-[10px] font-medium text-slate-600 flex items-center gap-1.5 shadow-2xs">
            <MapPin className="w-3 h-3 text-[#35C6D4]" />
            <span>Sentuh / arahkan kursor untuk peta interaktif</span>
          </div>
        </div>
      )}
    </div>
  );
}
