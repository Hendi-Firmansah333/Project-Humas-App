'use client';

import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { LocationData } from '@/types';

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
}

const getCustomIcon = (loc: LocationData) => {
  const initials = loc.user?.fullName
    ? loc.user.fullName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .substring(0, 2)
        .toUpperCase()
    : '📍';
  const bgColor = loc.isOnline ? '#0D9488' : '#64748b';

  return L.divIcon({
    className: 'custom-map-marker',
    html: `<div style="background-color: ${bgColor}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 8px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: white; font-weight: 800; font-size: 11px;">${initials}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
};

interface MapInnerProps {
  locations: LocationData[];
  center: [number, number];
  zoom: number;
}

export default function CampusMapInner({ locations, center, zoom }: MapInnerProps) {
  return (
    <MapContainer center={center} zoom={zoom} scrollWheelZoom={true} className="w-full h-full z-10">
      <ChangeView center={center} zoom={zoom} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {locations.map((loc) => (
        <Marker key={loc.id} position={[loc.latitude, loc.longitude]} icon={getCustomIcon(loc)}>
          <Popup>
            <div className="p-1.5 text-xs">
              <p className="font-bold text-slate-800">{loc.user?.fullName || 'Petugas Humas'}</p>
              <p className="text-teal-600 font-semibold text-[11px]">{loc.user?.roleLabel || 'Tim Humas'}</p>
              <p className="text-slate-500 mt-1 leading-snug">📍 {loc.address}</p>
              <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-semibold">
                  <span className={`w-2 h-2 rounded-full ${loc.isOnline ? 'bg-green-500 animate-ping' : 'bg-slate-400'}`} />
                  <span className={loc.isOnline ? 'text-green-700' : 'text-slate-400'}>
                    {loc.isOnline ? 'Online di Lapangan' : 'Offline'}
                  </span>
                </span>
                <span className="text-[10px] text-slate-400">{loc.updatedAt}</span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
