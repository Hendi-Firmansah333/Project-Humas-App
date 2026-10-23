'use client';

import React, { useEffect, useRef } from 'react';
import {
  Map,
  MapMarker,
  MarkerContent,
  MarkerPopup,
  MarkerTooltip,
  MapControls,
  useMap,
} from '@/components/ui/map';
import { LocationData } from '@/types';
import { Phone, MessageCircle, MapPin, Briefcase, Clock, ShieldCheck } from 'lucide-react';

interface CampusMapInnerProps {
  locations: LocationData[];
  center: [number, number]; // [lng, lat] or [lat, lng]
  zoom: number;
  selectedId?: number;
  onSelectMember?: (loc: LocationData) => void;
}

// Helper to normalize coordinates to [longitude, latitude] for MapLibre GL
function toLngLat(coord: [number, number]): [number, number] {
  // If first number is negative (Indonesia lat ~ -5) and second is positive (lng ~ 105)
  if (coord[0] < 0 && coord[1] > 0) {
    return [coord[1], coord[0]];
  }
  return coord;
}

function formatWhatsAppUrl(phone?: string) {
  if (!phone) return undefined;
  let clean = phone.replace(/[^\d]/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  }
  return `https://wa.me/${clean}`;
}

function MapController({ center, zoom }: { center: [number, number]; zoom: number }) {
  const { map } = useMap();
  const prevCenterRef = useRef<[number, number]>(center);
  const prevZoomRef = useRef<number>(zoom);

  useEffect(() => {
    if (!map) return;
    const [lng, lat] = center;
    const [prevLng, prevLat] = prevCenterRef.current;

    const centerDiff = Math.abs(lng - prevLng) + Math.abs(lat - prevLat);
    const zoomDiff = Math.abs(zoom - prevZoomRef.current);

    if (centerDiff > 0.00005 || zoomDiff > 0.1) {
      prevCenterRef.current = center;
      prevZoomRef.current = zoom;
      map.flyTo({
        center: [lng, lat],
        zoom,
        duration: 800,
        essential: true,
      });
    }
  }, [center, zoom, map]);

  return null;
}

export default function CampusMapInner({
  locations,
  center,
  zoom,
  selectedId,
  onSelectMember,
}: CampusMapInnerProps) {
  const normalizedCenter = toLngLat(center);

  return (
    <div className="w-full h-full relative">
      <Map
        center={normalizedCenter}
        zoom={zoom}
        theme="light"
        styles={{
          light: {
            version: 8,
            sources: {
              "google-maps": {
                type: "raster",
                tiles: [
                  "https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=AIzaSyAspkC4V1-LjBsDLsWj06GrdkrPhXX2v8g",
                  "https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=AIzaSyAspkC4V1-LjBsDLsWj06GrdkrPhXX2v8g",
                  "https://mt2.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=AIzaSyAspkC4V1-LjBsDLsWj06GrdkrPhXX2v8g",
                  "https://mt3.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=AIzaSyAspkC4V1-LjBsDLsWj06GrdkrPhXX2v8g",
                ],
                tileSize: 256,
              },
            },
            layers: [
              {
                id: "google-maps-layer",
                type: "raster",
                source: "google-maps",
                minzoom: 0,
                maxzoom: 21,
              },
            ],
          } as any,
        }}
        className="w-full h-full"
      >
        <MapController center={normalizedCenter} zoom={zoom} />

        <MapControls
          position="top-right"
          showZoom={true}
          showCompass={true}
          showLocate={false}
          showFullscreen={true}
        />

        {locations.map((loc) => {
          const isSelected = selectedId === loc.id;
          const initials = loc.user?.fullName
            ? loc.user.fullName
                .split(' ')
                .map((n) => n[0])
                .join('')
                .substring(0, 2)
                .toUpperCase()
            : 'HM';

          const waUrl = formatWhatsAppUrl(loc.user?.phone);

          return (
            <MapMarker
              key={loc.id}
              longitude={loc.longitude}
              latitude={loc.latitude}
              onClick={() => onSelectMember?.(loc)}
            >
              <MarkerContent>
                <div
                  className={`relative flex items-center justify-center transition-all duration-300 ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-110 z-20'
                  }`}
                >
                  {/* Outer pulse effect for online users */}
                  {loc.isOnline && (
                    <span className="absolute -inset-1.5 rounded-full bg-teal-500/30 animate-ping pointer-events-none" />
                  )}

                  {/* Marker Circle */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 transition-all ${
                      loc.isOnline
                        ? 'bg-gradient-to-tr from-teal-700 to-teal-500 border-white shadow-teal-500/40'
                        : 'bg-slate-600 border-slate-200 shadow-slate-500/30'
                    } ${isSelected ? 'ring-4 ring-teal-400 ring-offset-2' : ''}`}
                  >
                    {loc.user?.avatar ? (
                      <img
                        src={loc.user.avatar}
                        alt={loc.user.fullName}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      <span>{initials}</span>
                    )}
                  </div>

                  {/* Online/Offline tiny badge */}
                  <span
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${
                      loc.isOnline ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}
                  />
                </div>
              </MarkerContent>

              {/* Tooltip on hover */}
              <MarkerTooltip>
                <div className="font-semibold text-xs flex items-center gap-1.5 whitespace-nowrap">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      loc.isOnline ? 'bg-emerald-400' : 'bg-slate-400'
                    }`}
                  />
                  <span>{loc.user?.fullName || 'Petugas Humas'}</span>
                </div>
              </MarkerTooltip>

              {/* Popup on click */}
              <MarkerPopup closeButton className="w-64 p-3.5 rounded-xl border border-slate-200 shadow-xl bg-white text-slate-800">
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                        loc.isOnline ? 'bg-teal-600' : 'bg-slate-500'
                      }`}
                    >
                      {initials}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-slate-900 truncate">
                        {loc.user?.fullName || 'Petugas Humas'}
                      </h4>
                      <p className="text-[11px] font-semibold text-teal-600">
                        {loc.user?.roleLabel || 'Tim Humas'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-1 font-semibold">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          loc.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                        }`}
                      />
                      <span className={loc.isOnline ? 'text-emerald-700' : 'text-slate-500'}>
                        {loc.isOnline ? 'Online di Lapangan' : 'Offline'}
                      </span>
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(loc.updatedAt).toLocaleTimeString('id-ID', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-lg text-[11px] text-slate-600 space-y-1">
                    <p className="flex items-start gap-1">
                      <MapPin className="w-3.5 h-3.5 text-teal-600 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{loc.address}</span>
                    </p>
                  </div>

                  {(loc as any).currentActivity && (
                    <div className="bg-teal-50 border border-teal-200 p-2 rounded-lg text-[10px] text-teal-800 space-y-0.5">
                      <p className="font-bold flex items-center gap-1 text-teal-900">
                        <Briefcase className="w-3 h-3 text-teal-700" />
                        {(loc as any).currentActivity.title}
                      </p>
                      <p className="text-teal-700">
                        Peran: <strong>{(loc as any).currentActivity.userRoleInActivity}</strong>
                      </p>
                    </div>
                  )}

                  <div className="pt-1 flex items-center gap-2">
                    {onSelectMember && (
                      <button
                        type="button"
                        onClick={() => onSelectMember(loc)}
                        className="flex-1 py-1.5 px-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-[11px] font-semibold text-center transition-colors cursor-pointer"
                      >
                        Pilih Personel
                      </button>
                    )}
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[11px] font-semibold flex items-center gap-1 transition-colors"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>WA</span>
                      </a>
                    )}
                  </div>
                </div>
              </MarkerPopup>
            </MapMarker>
          );
        })}
      </Map>
    </div>
  );
}
