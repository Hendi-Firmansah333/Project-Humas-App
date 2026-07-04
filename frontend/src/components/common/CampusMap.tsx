'use client';

import React, { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { LocationData } from '@/types';
import { MapPin } from 'lucide-react';

interface CampusMapProps {
  locations?: LocationData[];
  height?: string;
  center?: [number, number];
  zoom?: number;
}

// Dynamically import inner leaflet map to prevent SSR window issues
const MapInner = dynamic(() => import('./CampusMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 text-xs gap-2">
      <div className="w-5 h-5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
      Memuat Peta Lokasi Tim...
    </div>
  ),
});

export default function CampusMap({
  locations = [],
  height = 'h-96',
  center = [-5.3585, 105.2345], // Default Politeknik Negeri Lampung campus coordinates
  zoom = 16,
}: CampusMapProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`w-full rounded-2xl overflow-hidden border border-slate-200 relative ${height}`}>
      {mounted ? (
        <MapInner locations={locations} center={center} zoom={zoom} />
      ) : (
        <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs gap-2">
          <MapPin className="w-4 h-4 text-teal-600 animate-bounce" />
          Memuat Peta...
        </div>
      )}
    </div>
  );
}
