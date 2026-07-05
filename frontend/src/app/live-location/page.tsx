'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { CampusMap, CustomButton, UserAvatar, SearchBox } from '@/components/common';
import DashboardSkeleton from '@/components/common/DashboardSkeleton';
import {
  MapPin,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Navigation,
  Radio,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Smartphone,
} from 'lucide-react';
import { LocationData } from '@/types';
import { locationService } from '@/services';
import { normalizeLocation } from '@/utils/api-helpers';
import { toast } from 'sonner';

const DEFAULT_CENTER: [number, number] = [-5.3585, 105.2345];

export default function LiveLocationPage() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(16);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const loadLocations = async () => {
    try {
      const data = await locationService.getAll();
      const normalized = (Array.isArray(data) ? data : []).map(normalizeLocation);
      setLocations(normalized);
      if (normalized.length > 0) {
        setSelectedLocation((prev) => prev ?? normalized[0]);
        setMapCenter([normalized[0].latitude, normalized[0].longitude]);
      }
    } catch {
      toast.error('Gagal memuat lokasi tim dari server.');
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadLocations();
      setLoading(false);
    };
    init();
    const interval = setInterval(loadLocations, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await loadLocations();
      toast.success('Lokasi tim diperbarui dari server.');
    } catch {
      toast.error('Gagal memperbarui lokasi.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleSelectMember = (loc: LocationData) => {
    setSelectedLocation(loc);
    setMapCenter([loc.latitude, loc.longitude]);
    setMapZoom(17);
    toast.info(`Fokus ke lokasi: ${loc.user?.fullName}`);
  };

  const filteredLocations = locations.filter((l) =>
    (l.user?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.address.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const onlineList = filteredLocations.filter((l) => l.isOnline);
  const offlineList = filteredLocations.filter((l) => !l.isOnline);

  if (loading) {
    return (
      <AdminLayout title="Pantau Lokasi Personel Kehumasan">
        <DashboardSkeleton />
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Pantau Lokasi Personel Kehumasan">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-teal-50 text-teal-700 font-bold px-2.5 py-0.5 rounded-md text-xs inline-flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Real-time GPS Sync</span>
            </span>
            <span className="bg-green-100 text-green-700 font-bold px-2.5 py-0.5 rounded-md text-xs">
              {onlineList.length} Personel Aktif
            </span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Live Location Tracking Tim Humas</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Pantau posisi petugas di kampus Politeknik Negeri Lampung secara real-time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <CustomButton
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={handleRefresh}
            className={refreshing ? 'animate-spin' : ''}
          >
            {refreshing ? 'Sinkronisasi...' : 'Refresh Lokasi'}
          </CustomButton>
        </div>
      </div>

      {/* Main 3-Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left Column (Span 2): Interactive Phone Mockup / Map View */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-bold text-slate-800">Peta Interaktif Kampus Polinela</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setMapZoom((z) => Math.min(z + 1, 18))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                title="Perbesar (Zoom In)"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMapZoom((z) => Math.max(z - 1, 13))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                title="Perkecil (Zoom Out)"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setMapCenter([-5.3585, 105.2345]);
                  setMapZoom(16);
                }}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                title="Pusatkan Peta"
              >
                <Navigation className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Leaflet Map Area */}
          <div className="w-full">
            <CampusMap locations={locations} center={mapCenter} zoom={mapZoom} height="h-[520px]" />
          </div>

          {/* Legend Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <span className="w-3 h-3 rounded-full bg-teal-600" />
                <span>Personel Online (Marker Teal)</span>
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-slate-500">
                <span className="w-3 h-3 rounded-full bg-slate-400" />
                <span>Personel Offline (Marker Abu)</span>
              </span>
            </div>
            <span className="text-slate-400 italic">Klik marker atau nama personel untuk detail</span>
          </div>
        </div>

        {/* Right Column (Span 1): Personnel Sidebar & Location Detail Box */}
        <div className="lg:col-span-1 space-y-6">
          {/* Personnel Roster */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100">
              Daftar Personel Lapangan ({locations.length})
            </h3>

            <SearchBox value={searchQuery} onChange={setSearchQuery} placeholder="Cari nama personel..." className="w-full" />

            {/* Online Members Section */}
            <div className="space-y-2.5">
              <h4 className="text-[11px] font-bold text-green-700 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping" />
                <span>Personel Online ({onlineList.length})</span>
              </h4>
              <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                {onlineList.map((loc) => {
                  const isSelected = selectedLocation?.id === loc.id;
                  return (
                    <div
                      key={loc.id}
                      onClick={() => handleSelectMember(loc)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'bg-teal-50/80 border-teal-500 shadow-2xs'
                          : 'bg-slate-50/50 border-slate-100 hover:bg-slate-50 hover:border-slate-200'
                      }`}
                    >
                      <UserAvatar src={loc.user?.avatar} name={loc.user?.fullName} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-xs text-slate-800 truncate">{loc.user?.fullName}</h5>
                          <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                            Online
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-teal-600">{loc.user?.roleLabel}</p>
                        <p className="text-[10px] text-slate-500 truncate mt-1">📍 {loc.address}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Offline Members Section */}
            <div className="space-y-2.5 pt-2 border-t border-slate-100">
              <h4 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                <span>Personel Offline ({offlineList.length})</span>
              </h4>
              <div className="space-y-2">
                {offlineList.map((loc) => {
                  const isSelected = selectedLocation?.id === loc.id;
                  return (
                    <div
                      key={loc.id}
                      onClick={() => handleSelectMember(loc)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 opacity-75 ${
                        isSelected
                          ? 'bg-slate-100 border-slate-400'
                          : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                      }`}
                    >
                      <UserAvatar src={loc.user?.avatar} name={loc.user?.fullName} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-xs text-slate-700 truncate">{loc.user?.fullName}</h5>
                          <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded">
                            Offline
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500">{loc.user?.roleLabel}</p>
                        <p className="text-[10px] text-slate-400 truncate mt-1">🕒 {loc.updatedAt}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Selected Location Detail Card */}
          {selectedLocation && (
            <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
              <div className="absolute -right-6 -bottom-6 w-32 h-32 rounded-full bg-teal-500/10 blur-xl pointer-events-none" />
              <div className="flex items-center justify-between pb-3 border-b border-teal-700/50">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-300">Detail Lokasi Terpilih</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedLocation.isOnline ? 'bg-green-500/20 text-green-300' : 'bg-slate-500/30 text-slate-300'
                  }`}
                >
                  {selectedLocation.isOnline ? 'Active GPS' : 'Offline'}
                </span>
              </div>

              <div className="pt-3 space-y-2 text-xs">
                <div>
                  <p className="text-teal-200 font-semibold">{selectedLocation.user?.fullName}</p>
                  <p className="text-[11px] text-teal-100/80">{selectedLocation.user?.roleLabel}</p>
                </div>
                <div className="p-3 rounded-xl bg-black/20 border border-white/10 space-y-1.5">
                  <p className="flex items-start gap-1.5 text-teal-100">
                    <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                    <span>{selectedLocation.address}</span>
                  </p>
                  <p className="text-[10px] text-teal-300">
                    Koordinat: {selectedLocation.latitude.toFixed(4)}, {selectedLocation.longitude.toFixed(4)}
                  </p>
                </div>
                <div className="flex items-center justify-between text-[11px] pt-1 text-teal-200/90">
                  <span>Jarak: {selectedLocation.distance}</span>
                  <span>Sync: {selectedLocation.updatedAt}</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
