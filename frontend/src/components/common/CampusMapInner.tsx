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
  recenterTrigger?: number;
  zoomInTrigger?: number;
  zoomOutTrigger?: number;
  onRefresh?: () => void;
  refreshing?: boolean;
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

function MapController({
  center,
  zoom,
  recenterTrigger,
  zoomInTrigger,
  zoomOutTrigger,
}: {
  center: [number, number];
  zoom: number;
  recenterTrigger?: number;
  zoomInTrigger?: number;
  zoomOutTrigger?: number;
}) {
  const { map } = useMap();
  const prevRecenterRef = useRef<number | undefined>(recenterTrigger);
  const prevZoomInRef = useRef<number | undefined>(zoomInTrigger);
  const prevZoomOutRef = useRef<number | undefined>(zoomOutTrigger);

  useEffect(() => {
    if (!map) return;
    const [lng, lat] = toLngLat(center);

    // 1. Explicit Recenter Action (Pusatkan Kampus / Kembali ke Posisi Awal)
    if (recenterTrigger !== undefined && recenterTrigger !== prevRecenterRef.current) {
      prevRecenterRef.current = recenterTrigger;
      map.flyTo({
        center: [lng, lat],
        zoom: zoom ?? 16,
        bearing: 0,
        pitch: 0,
        duration: 900,
        essential: true,
      });
      return;
    }

    // 2. Explicit Zoom In Action
    if (zoomInTrigger !== undefined && zoomInTrigger !== prevZoomInRef.current) {
      prevZoomInRef.current = zoomInTrigger;
      map.zoomIn({ duration: 300 });
      return;
    }

    // 3. Explicit Zoom Out Action
    if (zoomOutTrigger !== undefined && zoomOutTrigger !== prevZoomOutRef.current) {
      prevZoomOutRef.current = zoomOutTrigger;
      map.zoomOut({ duration: 300 });
      return;
    }

    // 4. Prop update: Check actual distance from map's current camera center/zoom
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    const centerDiff = Math.abs(lng - currentCenter.lng) + Math.abs(lat - currentCenter.lat);
    const zoomDiff = Math.abs((zoom ?? 16) - currentZoom);

    if (centerDiff > 0.0002 || zoomDiff > 0.2) {
      map.flyTo({
        center: [lng, lat],
        zoom: zoom ?? 16,
        duration: 800,
        essential: true,
      });
    }
  }, [center, zoom, recenterTrigger, zoomInTrigger, zoomOutTrigger, map]);

  return null;
}

export default function CampusMapInner({
  locations,
  center,
  zoom,
  selectedId,
  onSelectMember,
  recenterTrigger,
  zoomInTrigger,
  zoomOutTrigger,
  onRefresh,
  refreshing,
}: CampusMapInnerProps) {
  const normalizedCenter = toLngLat(center);

  return (
    <div className="w-full h-full relative">
      <Map
        center={normalizedCenter}
        zoom={zoom}
        cooperativeGestures={true}
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
        <MapController
          center={normalizedCenter}
          zoom={zoom}
          recenterTrigger={recenterTrigger}
          zoomInTrigger={zoomInTrigger}
          zoomOutTrigger={zoomOutTrigger}
        />

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
                    <span className="absolute -inset-1.5 rounded-full bg-[#35C6D4]/35 animate-ping pointer-events-none" />
                  )}

                  {/* Marker Circle */}
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 transition-all ${
                      loc.isOnline
                        ? 'bg-gradient-to-tr from-[#007985] to-[#35C6D4] border-white shadow-[#35C6D4]/40'
                        : 'bg-slate-600 border-slate-200 shadow-slate-500/30'
                    } ${isSelected ? 'ring-4 ring-[#35C6D4] ring-offset-2' : ''}`}
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

              {/* Popup on click - completely borderless */}
              <MarkerPopup
                closeButton
                className="w-72 sm:w-80 p-4.5 rounded-2xl border-0 border-none shadow-[0_12px_40px_rgba(0,0,0,0.14)] bg-white text-[#202938]"
              >
                <div className="space-y-3 text-xs">
                  {/* Header: Avatar, Nama, Peran (borderless) */}
                  <div className="flex items-center gap-3 pb-2.5">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 overflow-hidden shadow-xs ${
                        loc.isOnline
                          ? 'bg-gradient-to-tr from-[#007985] to-[#35C6D4]'
                          : 'bg-gradient-to-tr from-slate-600 to-slate-500'
                      }`}
                    >
                      {loc.user?.avatar ? (
                        <img
                          src={loc.user.avatar}
                          alt={loc.user.fullName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span>{initials}</span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-bold text-[#202938] text-sm truncate leading-snug">
                        {loc.user?.fullName || 'Petugas Humas'}
                      </h4>
                      <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span className="text-[10px] font-semibold text-[#007985] bg-[#E0F7F9] px-2 py-0.5 rounded-md">
                          {loc.user?.roleLabel || 'Anggota Humas'}
                        </span>
                        {loc.user?.phone && (
                          <span className="text-[11px] text-slate-500 font-normal truncate">
                            {loc.user.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Status row: Online/Offline Badge & Timestamp (borderless) */}
                  <div className="flex items-center justify-between text-[11px]">
                    {loc.isOnline ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold bg-emerald-50 text-emerald-700">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Online di Lapangan</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-semibold bg-slate-100 text-slate-600">
                        <span className="w-2 h-2 rounded-full bg-slate-400" />
                        <span>Offline (Standby)</span>
                      </span>
                    )}
                    <span className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>
                        {new Date(loc.updatedAt).toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}{' '}
                        WIB
                      </span>
                    </span>
                  </div>

                  {/* Lokasi / Address Card (borderless) */}
                  <div className="bg-slate-50/90 p-2.5 rounded-xl text-[11px] text-slate-700 space-y-0.5">
                    <div className="flex items-start gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#35C6D4] shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">
                          {loc.isOnline ? 'Lokasi Presensi' : 'Posisi Terakhir'}
                        </span>
                        <span className="line-clamp-2 font-medium text-[#202938]">
                          {!loc.address ||
                          loc.address.trim().toLowerCase() === 'tidak aktif' ||
                          loc.address.trim().toLowerCase() === 'offline'
                            ? loc.isOnline
                              ? 'Area Kampus Polinela'
                              : 'Area Kampus Polinela (GPS Standby)'
                            : loc.address}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Current Activity if assigned (borderless) */}
                  {(loc as any).currentActivity && (
                    <div className="bg-[#E0F7F9] p-2.5 rounded-xl text-[11px] text-[#007985] space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-bold flex items-center gap-1 text-[#007985] text-[10px]">
                          <Briefcase className="w-3 h-3 text-[#007985]" />
                          Tugas Lapangan Aktif
                        </span>
                        <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-white text-[#007985]">
                          {(loc as any).currentActivity.userRoleInActivity}
                        </span>
                      </div>
                      <p className="font-semibold text-[#102F37] truncate">
                        {(loc as any).currentActivity.title}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons: Pilih Personel & Hubungi WhatsApp (borderless) */}
                  <div className="pt-1 flex items-center gap-2">
                    {onSelectMember && (
                      <button
                        type="button"
                        onClick={() => onSelectMember(loc)}
                        className="flex-1 py-2 px-3 bg-[#005CDB] hover:bg-[#004FBD] active:bg-[#0044A5] text-white rounded-xl text-xs font-bold text-center transition-all cursor-pointer shadow-xs shadow-[#005CDB]/25 border-0"
                      >
                        Pilih Personel
                      </button>
                    )}
                    {waUrl ? (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`${
                          onSelectMember ? 'px-3' : 'w-full'
                        } py-2 px-3 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors border-0`}
                        title={`Hubungi WhatsApp ${loc.user?.fullName || ''}`}
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-current shrink-0" />
                        <span>Hubungi via WhatsApp</span>
                      </a>
                    ) : loc.user?.phone ? (
                      <a
                        href={`tel:${loc.user.phone}`}
                        className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors border-0"
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>{loc.user.phone}</span>
                      </a>
                    ) : null}
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
