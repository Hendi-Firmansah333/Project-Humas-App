'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import { CampusMap, UserAvatar, SearchBox } from '@/components/common';
import {
  MapPin,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Navigation,
  Smartphone,
  MessageCircle,
  Briefcase,
  WifiOff,
} from 'lucide-react';
import { LocationData } from '@/types';
import { locationService } from '@/services';
import { normalizeLocation } from '@/utils/api-helpers';
import { toast } from 'sonner';

// Default Politeknik Negeri Lampung campus coordinates: [lng, lat]
const DEFAULT_CENTER: [number, number] = [105.2345, -5.3585];

const FALLBACK_CAMPUS_LOCATIONS: LocationData[] = [
  {
    id: 1,
    userId: 2,
    latitude: -5.3582,
    longitude: 105.2321,
    address: 'Gedung Serbaguna POLINELA',
    isOnline: true,
    updatedAt: new Date().toISOString(),
    user: {
      id: 2,
      fullName: 'Budi Santoso',
      username: 'budi.fotografer',
      email: 'budi@polinela.ac.id',
      joinedAt: '2026-01-01',
      roleLabel: 'Anggota Humas',
      phone: '0812-1111-2222',
      role: 'USER',
      status: 'AKTIF',
    },
  },
  {
    id: 3,
    userId: 4,
    latitude: -5.359,
    longitude: 105.2335,
    address: 'Posko Media Sosial',
    isOnline: false,
    updatedAt: new Date().toISOString(),
    user: {
      id: 4,
      fullName: 'Budi Santoso',
      username: 'budi.s',
      email: 'budi.s@polinela.ac.id',
      joinedAt: '2026-01-01',
      roleLabel: 'Anggota Humas',
      phone: '0852-1122-3344',
      role: 'USER',
      status: 'AKTIF',
    },
  },
  {
    id: 2,
    userId: 3,
    latitude: -5.3592,
    longitude: 105.2358,
    address: 'Gedung Rektorat Lantai 1',
    isOnline: false,
    updatedAt: new Date().toISOString(),
    user: {
      id: 3,
      fullName: 'Rina Wati',
      username: 'rina.wati',
      email: 'rina.wati@polinela.ac.id',
      joinedAt: '2026-01-01',
      roleLabel: 'Anggota Humas',
      phone: '0813-9876-5432',
      role: 'USER',
      status: 'AKTIF',
    },
  },
];

export default function LiveLocationPage() {
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOfflineFallback, setIsOfflineFallback] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationData | null>(null);
  const [mapCenter, setMapCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [mapZoom, setMapZoom] = useState<number>(16);
  const [recenterCount, setRecenterCount] = useState<number>(0);
  const [zoomInCount, setZoomInCount] = useState<number>(0);
  const [zoomOutCount, setZoomOutCount] = useState<number>(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'online' | 'offline' | 'bertugas'>('semua');
  const [refreshing, setRefreshing] = useState(false);

  const loadLocations = async (isManualRefresh = false) => {
    try {
      const data = await locationService.getAll();
      const rawList = Array.isArray(data) ? data : [];
      const normalized = rawList
        .map(normalizeLocation)
        .filter((l) => l.user?.role === 'USER');

      if (normalized.length > 0) {
        setLocations(normalized);
        setIsOfflineFallback(false);
        setSelectedLocation((prev) => {
          if (isManualRefresh) return null;
          if (!prev) return normalized[0];
          const exists = normalized.find((n) => n.id === prev.id);
          return exists ?? normalized[0];
        });
        if (isManualRefresh) {
          toast.success('Lokasi tim diperbarui & peta dikembalikan ke posisi awal.');
        }
      } else {
        // Empty from server: use campus default
        setLocations(FALLBACK_CAMPUS_LOCATIONS);
        setSelectedLocation((prev) => (isManualRefresh ? null : prev ?? FALLBACK_CAMPUS_LOCATIONS[0]));
      }
    } catch (err) {
      console.warn('Backend live location sync failed, using fallback data:', err);
      setIsOfflineFallback(true);
      setLocations((prev) => (prev.length > 0 ? prev : FALLBACK_CAMPUS_LOCATIONS));
      setSelectedLocation((prev) => prev ?? FALLBACK_CAMPUS_LOCATIONS[0]);
      if (isManualRefresh) {
        toast.error('Gagal terhubung ke backend. Menampilkan koordinat offline.');
      }
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadLocations();
      setLoading(false);
    };
    init();
    const interval = setInterval(() => loadLocations(false), 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Kembalikan peta ke posisi & zoom awal (Kampus Polinela)
    setMapCenter([...DEFAULT_CENTER]);
    setMapZoom(16);
    setSelectedLocation(null);
    setRecenterCount((c) => c + 1);
    await loadLocations(true);
    setRefreshing(false);
  };

  const handleSelectMember = (loc: LocationData) => {
    setSelectedLocation(loc);
    // [lng, lat]
    setMapCenter([loc.longitude, loc.latitude]);
    setMapZoom(17);
  };

  const handleRecenter = () => {
    setMapCenter([...DEFAULT_CENTER]);
    setMapZoom(16);
    setSelectedLocation(null);
    setRecenterCount((c) => c + 1);
  };

  const handleZoomIn = () => {
    setMapZoom((z) => Math.min(z + 1, 19));
    setZoomInCount((c) => c + 1);
  };

  const handleZoomOut = () => {
    setMapZoom((z) => Math.max(z - 1, 12));
    setZoomOutCount((c) => c + 1);
  };

  const formatWhatsAppUrl = (phone?: string) => {
    if (!phone) return undefined;
    let clean = phone.replace(/[^\d]/g, '');
    if (clean.startsWith('0')) {
      clean = '62' + clean.slice(1);
    }
    return `https://wa.me/${clean}`;
  };

  const filteredLocations = locations.filter((l) => {
    const matchSearch =
      (l.user?.fullName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (l.user?.phone || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.address.toLowerCase().includes(searchQuery.toLowerCase());

    let matchStatus = true;
    if (statusFilter === 'online') matchStatus = l.isOnline;
    if (statusFilter === 'offline') matchStatus = !l.isOnline;
    if (statusFilter === 'bertugas') matchStatus = !!(l as any).currentActivity;

    return matchSearch && matchStatus;
  });

  const onlineList = filteredLocations.filter((l) => l.isOnline);

  if (loading) {
    return (
      <AdminLayout title="Pantau Lokasi Personel Kehumasan">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-8 h-[550px] bg-white rounded-2xl border border-slate-200/90 shadow-xs shimmer-card animate-shimmer" />
          <div className="lg:col-span-4 h-[550px] bg-white rounded-2xl border border-slate-200/90 shadow-xs shimmer-card animate-shimmer" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Pantau Lokasi Personel Kehumasan">
      {/* Offline banner if server is not reachable */}
      {isOfflineFallback && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 mb-4 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              Menampilkan data koordinat kampus offline. Koneksi ke backend sedang disinkronisasi ulang.
            </span>
          </div>
          <button
            onClick={() => handleRefresh()}
            className="font-bold underline hover:text-amber-800 transition-colors ml-2 shrink-0 cursor-pointer"
          >
            Coba Sinkron Ulang
          </button>
        </div>
      )}

      {/* Main 3-Column Grid (Sama Rata Atas & Bawah) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        {/* Left Column (Span 2): Map Area */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-800">
                  Peta Monitoring Personel Humas
                </h3>
                <span className="bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold px-2.5 py-0.5 rounded-full text-xs inline-flex items-center gap-1.5 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span>{onlineList.length} Personel Aktif</span>
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Monitoring lokasi real-time personel Humas di lingkungan Kampus Polinela &amp; area kegiatan.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {/* Tombol Refresh Lokasi Tim */}
              <button
                type="button"
                onClick={handleRefresh}
                disabled={refreshing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#003D58] text-xs font-semibold transition-all cursor-pointer shadow-2xs disabled:opacity-60"
                title="Perbarui Lokasi Personel"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-[#003D58] ${refreshing ? 'animate-spin' : ''}`} />
                <span>{refreshing ? 'Memuat...' : 'Refresh'}</span>
              </button>

              {/* Zoom Controls */}
              <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden shadow-2xs bg-white">
                <button
                  type="button"
                  onClick={handleZoomIn}
                  className="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer border-r border-slate-200"
                  title="Perbesar Peta (Zoom In)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleZoomOut}
                  className="p-1.5 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                  title="Perkecil Peta (Zoom Out)"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Map View */}
          <div className="w-full flex-1 my-4 min-h-[540px]">
            <CampusMap
              locations={filteredLocations}
              center={mapCenter}
              zoom={mapZoom}
              selectedId={selectedLocation?.id}
              onSelectMember={handleSelectMember}
              recenterTrigger={recenterCount}
              zoomInTrigger={zoomInCount}
              zoomOutTrigger={zoomOutCount}
              onRefresh={handleRefresh}
              refreshing={refreshing}
              height="h-full min-h-[540px]"
            />
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <span className="w-3 h-3 rounded-full bg-[#003D58]" />
                <span>Personel Online (Hijau/Teal)</span>
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-slate-500">
                <span className="w-3 h-3 rounded-full bg-slate-400" />
                <span>Personel Offline (Abu-abu)</span>
              </span>
            </div>
            <span className="text-slate-400 italic">Klik marker untuk melihat detail profil &amp; WhatsApp</span>
          </div>
        </div>

        {/* Right Column: Roster Panel */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-800">
                Daftar Personel Lapangan
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Pilih personel untuk fokus lokasi di peta
              </p>
            </div>
            <span className="bg-sky-50 border border-sky-200 text-[#003D58] font-bold px-2.5 py-0.5 rounded-full text-xs shadow-2xs shrink-0">
              {filteredLocations.length} Personel
            </span>
          </div>

          <div className="mt-4">
            <SearchBox
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Cari nama / nomor HP..."
              className="w-full"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex gap-1 border-b border-slate-100 pb-2 mt-3">
            {[
              { value: 'semua', label: 'Semua' },
              { value: 'online', label: 'Online' },
              { value: 'offline', label: 'Offline' },
              { value: 'bertugas', label: 'Bertugas' },
            ].map((pill) => (
              <button
                key={pill.value}
                onClick={() => setStatusFilter(pill.value as any)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer flex-1 text-center ${
                  statusFilter === pill.value
                    ? 'bg-[#003D58] text-white shadow-2xs'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {pill.label}
              </button>
            ))}
          </div>

          {/* Roster List */}
          {filteredLocations.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs italic flex flex-col items-center justify-center gap-2 flex-1">
              <MapPin className="w-8 h-8 text-slate-300 stroke-[1.5]" />
              <span>Tidak ada personel yang sesuai filter pencarian.</span>
            </div>
          ) : (
            <div className="space-y-2.5 flex-1 max-h-[430px] overflow-y-auto pr-1 my-4">
              {filteredLocations.map((loc) => {
                const isSelected = selectedLocation?.id === loc.id;
                const waUrl = formatWhatsAppUrl(loc.user?.phone);
                return (
                  <div
                    key={loc.id}
                    onClick={() => handleSelectMember(loc)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-2 ${
                      isSelected
                        ? 'bg-sky-50/70 border-[#003D58] shadow-xs ring-1 ring-[#003D58]/30'
                        : 'bg-slate-50/70 border-slate-200/80 hover:bg-slate-100/70 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <UserAvatar src={loc.user?.avatar} name={loc.user?.fullName} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-1">
                          <h5 className="font-bold text-xs text-slate-800 truncate">{loc.user?.fullName}</h5>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0 ${
                              loc.isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full ${loc.isOnline ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
                            {loc.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-[#003D58]">{loc.user?.roleLabel || 'Anggota Humas'}</p>
                        <p className="text-[10px] text-slate-500 truncate mt-0.5 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{loc.address}</span>
                        </p>
                      </div>
                    </div>

                    {/* Quick Info: Activity or Standby + WhatsApp Button */}
                    <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-slate-200/60 text-[10px]">
                      {(loc as any).currentActivity ? (
                        <span
                          className="text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded-md font-medium truncate flex items-center gap-1 max-w-[190px]"
                          title={(loc as any).currentActivity.title}
                        >
                          <Briefcase className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">{(loc as any).currentActivity.title}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Standby</span>
                      )}

                      {waUrl ? (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold border border-emerald-200 transition-colors shrink-0"
                          title={`Kirim pesan WhatsApp ke ${loc.user?.fullName || 'Personel'}`}
                        >
                          <MessageCircle className="w-3 h-3 text-emerald-600" />
                          <span>WhatsApp</span>
                        </a>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          {new Date(loc.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer Card */}
          <div className="mt-auto pt-3 border-t border-slate-100 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Menampilkan {filteredLocations.length} dari {locations.length} personel</span>
            {selectedLocation && (
              <span className="text-[#003D58] font-semibold truncate max-w-[140px]">
                Fokus: {selectedLocation.user?.fullName?.split(' ')[0]}
              </span>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
              );
}
