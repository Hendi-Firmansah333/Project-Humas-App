'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import {
  MapPin,
  Loader2,
  Sliders,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Layers,
  Crosshair,
  Check,
  Building,
} from 'lucide-react';

export interface LocationPickerProps {
  location: string;
  latitude: string | number;
  longitude: string | number;
  radius?: string | number;
  onChange: (values: {
    location: string;
    latitude: string;
    longitude: string;
    radius: string;
  }) => void;
  required?: boolean;
  label?: string;
  className?: string;
}

// Preset Kampus Polinela
const CAMPUS_PRESETS = [
  {
    name: 'GSG Polinela',
    label: 'GSG Polinela',
    address: 'Gedung Serba Guna (GSG) Polinela',
    lat: -5.3592,
    lng: 105.2338,
  },
  {
    name: 'Direktorat',
    label: 'Gedung Direktorat',
    address: 'Gedung Direktorat Kampus Polinela',
    lat: -5.3578,
    lng: 105.2341,
  },
  {
    name: 'Lab Humas & Multimedia',
    label: 'Lab Multimedia / Humas',
    address: 'Lab Multimedia & Ruang Humas Polinela',
    lat: -5.3582,
    lng: 105.2348,
  },
  {
    name: 'Gedung Sakura (FEB)',
    label: 'Gedung Sakura',
    address: 'Gedung Sakura Polinela (Ekonomi & Bisnis)',
    lat: -5.3601,
    lng: 105.235,
  },
  {
    name: 'Gedung TI / Akuntansi',
    label: 'Gedung TI & Akuntansi',
    address: 'Gedung Jurusan Teknologi Informasi & Akuntansi',
    lat: -5.3586,
    lng: 105.2355,
  },
  {
    name: 'Lapangan Utama',
    label: 'Lapangan Utama',
    address: 'Lapangan Olahraga & Upacara Polinela',
    lat: -5.3589,
    lng: 105.233,
  },
  {
    name: 'Poliklinik',
    label: 'Poliklinik Polinela',
    address: 'Poliklinik Kesehatan Polinela',
    lat: -5.3595,
    lng: 105.2325,
  },
];

const RADIUS_PRESETS = [50, 100, 150, 200, 500];

// Dynamic import for MapLibre container to avoid SSR issues
const LocationMapInner = dynamic(() => import('./LocationMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-72 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col items-center justify-center text-slate-500 text-xs gap-3">
      <Loader2 className="w-6 h-6 text-teal-600 animate-spin" />
      <span className="font-medium">Memuat Peta Lokasi Interaktif...</span>
    </div>
  ),
});

export default function LocationPicker({
  location,
  latitude,
  longitude,
  radius = '100',
  onChange,
  required = false,
  label = 'Lokasi & Titik Presensi Kegiatan',
  className = '',
}: LocationPickerProps) {
  const [mounted, setMounted] = useState(false);
  const [showManualCoords, setShowManualCoords] = useState(false);
  const [isMapCollapsed, setIsMapCollapsed] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Parse coordinates with safe default to Polinela Campus
  const parsedLat = parseFloat(String(latitude));
  const parsedLng = parseFloat(String(longitude));
  const parsedRadius = parseInt(String(radius), 10) || 100;

  const validLat = !isNaN(parsedLat) && parsedLat !== 0 ? parsedLat : -5.3585;
  const validLng = !isNaN(parsedLng) && parsedLng !== 0 ? parsedLng : 105.2345;
  const hasCustomCoordinates = !isNaN(parsedLat) && !isNaN(parsedLng) && parsedLat !== 0 && parsedLng !== 0;

  const handleLocationUpdate = (newLat: number, newLng: number) => {
    onChange({
      location,
      latitude: newLat.toFixed(6),
      longitude: newLng.toFixed(6),
      radius: String(parsedRadius),
    });
  };

  const handleAddressResolved = (resolvedAddress: string) => {
    // If current location is empty, auto-fill it
    if (!location || location.trim() === '') {
      onChange({
        location: resolvedAddress,
        latitude: String(latitude),
        longitude: String(longitude),
        radius: String(radius),
      });
    }
  };

  const handleSelectPreset = (preset: (typeof CAMPUS_PRESETS)[0]) => {
    onChange({
      location: preset.address,
      latitude: preset.lat.toFixed(6),
      longitude: preset.lng.toFixed(6),
      radius: String(parsedRadius),
    });
  };

  const handleRadiusChange = (newRadius: number) => {
    onChange({
      location,
      latitude: String(latitude),
      longitude: String(longitude),
      radius: String(newRadius),
    });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* ── Input Nama / Alamat Lokasi ── */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="block text-xs font-semibold text-slate-700">
            {label} {required && <span className="text-rose-500">*</span>}
          </label>
          <span className="text-[11px] text-teal-600 font-medium flex items-center gap-1">
            <Sparkles className="w-3 h-3" />
            Mode Pinpoint Peta
          </span>
        </div>

        <div className="relative">
          <input
            type="text"
            required={required}
            value={location}
            onChange={(e) =>
              onChange({
                location: e.target.value,
                latitude: String(latitude),
                longitude: String(longitude),
                radius: String(radius),
              })
            }
            placeholder="Contoh: Gedung Serbaguna Polinela / Ruang Sidang"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-9 pr-3.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-600 transition-all"
          />
          <MapPin className="w-4 h-4 text-teal-600 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* ── Shortcut Preset Gedung Kampus Polinela ── */}
      <div>
        <p className="text-[11px] text-slate-500 mb-1.5 flex items-center gap-1">
          <Building className="w-3 h-3 text-slate-400" />
          Pilihan Cepat Gedung Kampus Polinela:
        </p>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {CAMPUS_PRESETS.map((preset) => {
            const isSelected =
              Math.abs(validLat - preset.lat) < 0.0005 &&
              Math.abs(validLng - preset.lng) < 0.0005;

            return (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={`text-[11px] font-medium px-2.5 py-1 rounded-lg shrink-0 border transition-all flex items-center gap-1 ${
                  isSelected
                    ? 'bg-teal-50 text-teal-700 border-teal-300 shadow-xs ring-1 ring-teal-500/30'
                    : 'bg-white hover:bg-slate-50 text-slate-600 border-slate-200'
                }`}
              >
                <span>{preset.label}</span>
                {isSelected && <Check className="w-3 h-3 text-teal-600" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Box Peta Interaktif (Shopee Style) ── */}
      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-teal-100 flex items-center justify-center text-teal-700">
              <Crosshair className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">
                Peta Penentuan Titik & Radius Absensi
              </p>
              <p className="text-[10px] text-slate-500">
                {hasCustomCoordinates
                  ? 'Titik koordinat presensi telah disesuaikan'
                  : 'Geser pin atau klik peta untuk mengunci titik'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {hasCustomCoordinates ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Titik Aktif
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-100 text-amber-800">
                Titik Default
              </span>
            )}
            <button
              type="button"
              onClick={() => setIsMapCollapsed(!isMapCollapsed)}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
              title={isMapCollapsed ? 'Tampilkan Peta' : 'Sembunyikan Peta'}
            >
              {isMapCollapsed ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* ── The Map Component ── */}
        {!isMapCollapsed && (
          <div className="w-full h-72 sm:h-80 relative rounded-xl overflow-hidden shadow-inner">
            {mounted ? (
              <LocationMapInner
                latitude={validLat}
                longitude={validLng}
                radius={parsedRadius}
                onLocationChange={handleLocationUpdate}
                onAddressResolved={handleAddressResolved}
              />
            ) : (
              <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-400 text-xs">
                Inisialisasi Peta...
              </div>
            )}
          </div>
        )}

        {/* ── Pengaturan Radius Absensi ── */}
        <div className="bg-white border border-slate-200/90 rounded-xl p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-teal-600" />
              Batas Radius Absensi GPS
            </span>
            <span className="text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-0.5 rounded-lg border border-teal-200">
              {parsedRadius} Meter
            </span>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-slate-500 mr-1">Preset:</span>
            {RADIUS_PRESETS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => handleRadiusChange(r)}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                  parsedRadius === r
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                }`}
              >
                {r}m
              </button>
            ))}

            <div className="ml-auto flex items-center gap-1">
              <input
                type="number"
                min={10}
                max={5000}
                value={radius}
                onChange={(e) => handleRadiusChange(Number(e.target.value) || 100)}
                className="w-16 bg-slate-50 border border-slate-200 rounded-lg py-1 px-2 text-xs text-center font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500"
              />
              <span className="text-[11px] text-slate-500">m</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400">
            * Anggota tim diwajibkan berada di dalam lingkaran radius {parsedRadius}m saat melakukan presensi di lokasi liputan.
          </p>
        </div>

        {/* ── Summary & Accordion Koordinat Manual ── */}
        <div className="pt-1 border-t border-slate-200/60">
          <div className="flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-2 text-slate-500">
              <span className="font-mono bg-slate-200/70 px-1.5 py-0.5 rounded text-[10px] text-slate-700">
                Lat: {validLat.toFixed(5)}
              </span>
              <span className="font-mono bg-slate-200/70 px-1.5 py-0.5 rounded text-[10px] text-slate-700">
                Lng: {validLng.toFixed(5)}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setShowManualCoords(!showManualCoords)}
              className="text-[11px] font-semibold text-teal-600 hover:text-teal-700 flex items-center gap-1 transition-colors"
            >
              <Sliders className="w-3 h-3" />
              <span>{showManualCoords ? 'Sembunyikan Koordinat' : 'Atur Manual'}</span>
            </button>
          </div>

          {/* Form Input Manual (Collapsible) */}
          {showManualCoords && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mt-2.5 pt-2.5 border-t border-slate-200/50">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1">
                  Latitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) =>
                    onChange({
                      location,
                      latitude: e.target.value,
                      longitude: String(longitude),
                      radius: String(radius),
                    })
                  }
                  placeholder="-5.3582"
                  className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div>
                <label className="block text-[10px] text-slate-500 mb-1">
                  Longitude
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) =>
                    onChange({
                      location,
                      latitude: String(latitude),
                      longitude: e.target.value,
                      radius: String(radius),
                    })
                  }
                  placeholder="105.2321"
                  className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] text-slate-500 mb-1">
                  Radius (Meter)
                </label>
                <input
                  type="number"
                  value={radius}
                  onChange={(e) =>
                    onChange({
                      location,
                      latitude: String(latitude),
                      longitude: String(longitude),
                      radius: e.target.value,
                    })
                  }
                  placeholder="100"
                  className="w-full bg-white border border-slate-200 rounded-lg py-1 px-2 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
