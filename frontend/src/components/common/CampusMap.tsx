'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { LocationData } from '@/types';
import { MapPin, Loader2 } from 'lucide-react';

export interface CampusMapProps {
  locations?: LocationData[];
  height?: string;
  center?: [number, number]; // [lng, lat] or [lat, lng]
  zoom?: number;
  selectedId?: number;
  onSelectMember?: (loc: LocationData) => void;
}

// Dynamically import MapLibre inner map to prevent SSR window issues
const MapInner = dynamic(() => import('./CampusMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-50 rounded-2xl flex flex-col items-center justify-center text-slate-500 text-xs gap-3">
      <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
      <span className="font-medium">Memuat Peta Live Location...</span>
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
}: CampusMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div
      className={`w-full rounded-2xl overflow-hidden border border-slate-200 shadow-inner relative bg-slate-100 ${height}`}
    >
      {mounted ? (
        <MapInner
          locations={locations}
          center={center}
          zoom={zoom}
          selectedId={selectedId}
          onSelectMember={onSelectMember}
        />
      ) : (
        <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-500 text-xs gap-2">
          <MapPin className="w-4 h-4 text-teal-600 animate-bounce" />
          <span>Inisialisasi Peta...</span>
        </div>
      )}
    </div>
  );
}
