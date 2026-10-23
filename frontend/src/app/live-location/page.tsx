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
  AlertCircle,
  Smartphone,
  Phone,
  MessageCircle,
  Briefcase,
  RotateCcw,
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
    id: 4,
    userId: 1,
    latitude: -5.3585,
    longitude: 105.2345,
    address: 'Posko Humas Rektorat Lt. 1',
    isOnline: true,
    updatedAt: new Date().toISOString(),
    user: {
      id: 1,
      fullName: 'Komang Ari',
      username: 'komang.ari',
      email: 'komang.ari@polinela.ac.id',
      joinedAt: '2026-01-01',
      roleLabel: 'Admin Humas',
      phone: '0812-3456-7890',
      role: 'ADMIN',
      status: 'AKTIF',
    },
  },
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
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'semua' | 'online' | 'offline' | 'bertugas'>('semua');
  const [refreshing, setRefreshing] = useState(false);

  const loadLocations = async (isManualRefresh = false) => {
    try {
      const data = await locationService.getAll();
      const rawList = Array.isArray(data) ? data : [];
      const normalized = rawList.map(normalizeLocation);

      if (normalized.length > 0) {
        setLocations(normalized);
        setIsOfflineFallback(false);
        setSelectedLocation((prev) => {
          if (!prev) return normalized[0];
          const exists = normalized.find((n) => n.id === prev.id);
          return exists ?? normalized[0];
        });
        if (isManualRefresh) {
          toast.success('Lokasi tim berhasil diperbarui dari server.');
        }
      } else {
        // Empty from server: use campus default
        setLocations(FALLBACK_CAMPUS_LOCATIONS);
        setSelectedLocation((prev) => prev ?? FALLBACK_CAMPUS_LOCATIONS[0]);
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
    await loadLocations(true);
    setRefreshing(false);
  };

  const handleSelectMember = (loc: LocationData) => {
    setSelectedLocation(loc);
    // [lng, lat]
    setMapCenter([loc.longitude, loc.latitude]);
    setMapZoom(17);
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
        <DashboardSkeleton />
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

      {/* Top Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-md text-xs inline-flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>{onlineList.length} Personel Aktif</span>
            </span>
          </div>
          <h1 className="text-lg font-bold text-slate-900 tracking-tight">Live Location Tracking Tim Humas</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitoring lokasi terkini anggota Tim Humas yang sedang bertugas di lingkungan Kampus Polinela & area kegiatan.
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
        {/* Left Column (Span 2): Map Area */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <Smartphone className="w-5 h-5 text-teal-600" />
              <h3 className="text-base font-bold text-slate-800">Peta Monitoring Kampus Polinela</h3>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setMapZoom((z) => Math.min(z + 1, 19))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={() => setMapZoom((z) => Math.max(z - 1, 12))}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => {
                  setMapCenter(DEFAULT_CENTER);
                  setMapZoom(16);
                }}
                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors cursor-pointer flex items-center gap-1 text-xs font-semibold"
                title="Pusatkan Peta ke Kampus Polinela"
              >
                <Navigation className="w-3.5 h-3.5 text-teal-600" />
                <span className="hidden sm:inline">Pusatkan</span>
              </button>
            </div>
          </div>

          {/* Map View */}
          <div className="w-full">
            <CampusMap
              locations={filteredLocations}
              center={mapCenter}
              zoom={mapZoom}
              selectedId={selectedLocation?.id}
              onSelectMember={handleSelectMember}
              height="h-[540px]"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                <span className="w-3 h-3 rounded-full bg-teal-600" />
                <span>Personel Online (Hijau/Teal)</span>
              </span>
              <span className="flex items-center gap-1.5 font-semibold text-slate-500">
                <span className="w-3 h-3 rounded-full bg-slate-400" />
                <span>Personel Offline (Abu-abu)</span>
              </span>
            </div>
            <span className="text-slate-400 italic">Klik marker untuk melihat detail profil & WhatsApp</span>
          </div>
        </div>

        {/* Right Column: Roster & Detail Panel */}
        <div className="lg:col-span-1 space-y-6">
          {/* Personnel Roster Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100">
              Daftar Personel Lapangan ({filteredLocations.length})
            </h3>

            <SearchBox
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Cari nama / nomor HP..."
              className="w-full"
            />

            {/* Filter Pills */}
            <div className="flex gap-1 border-b border-slate-100 pb-2">
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
                      ? 'bg-teal-600 text-white shadow-2xs'
                      : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Roster List */}
            {filteredLocations.length === 0 ? (
              <p className="text-xs text-slate-400 italic py-6 text-center">Belum ada lokasi anggota yang sesuai dengan filter.</p>
            ) : (
              <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                {filteredLocations.map((loc) => {
                  const isSelected = selectedLocation?.id === loc.id;
                  return (
                    <div
                      key={loc.id}
                      onClick={() => handleSelectMember(loc)}
                      className={`p-3 rounded-xl border transition-all cursor-pointer flex items-start gap-3 ${
                        isSelected
                          ? 'bg-teal-50 border-teal-500 shadow-2xs'
                          : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                      }`}
                    >
                      <UserAvatar src={loc.user?.avatar} name={loc.user?.fullName} size="md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="font-bold text-xs text-slate-800 truncate">{loc.user?.fullName}</h5>
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                              loc.isOnline ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {loc.isOnline ? 'Online' : 'Offline'}
                          </span>
                        </div>
                        <p className="text-[11px] font-semibold text-teal-600">{loc.user?.roleLabel}</p>
                        <p className="text-[10px] text-slate-500 truncate mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{loc.address}</span>
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Selected Location Profile Card */}
          {selectedLocation && (
            <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-teal-700/50">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-300">Profil Personel Terpilih</span>
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    selectedLocation.isOnline ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-500/30 text-slate-300'
                  }`}
                >
                  {selectedLocation.isOnline ? 'Online GPS' : 'Lokasi Terakhir'}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <UserAvatar src={selectedLocation.user?.avatar} name={selectedLocation.user?.fullName} size="lg" />
                <div>
                  <h4 className="font-bold text-sm text-teal-100">{selectedLocation.user?.fullName}</h4>
                  <p className="text-xs text-teal-300">{selectedLocation.user?.roleLabel}</p>
                  <p className="text-[11px] text-teal-200/80 mt-0.5 font-mono">
                    {selectedLocation.user?.phone || 'Nomor telepon belum tersedia.'}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-black/20 border border-white/10 space-y-1.5 text-xs">
                <p className="flex items-start gap-1.5 text-teal-100">
                  <MapPin className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                  <span>{selectedLocation.address}</span>
                </p>
                <p className="text-[11px] text-teal-300">
                  Waktu Terakhir Update: <strong>{new Date(selectedLocation.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</strong>
                </p>
              </div>

              {/* Current Assigned Activity */}
              <div className="p-3 rounded-xl bg-teal-800/40 border border-teal-600/30 space-y-1 text-xs">
                <p className="font-bold text-teal-300 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  Kegiatan Saat Ini:
                </p>
                {(selectedLocation as any).currentActivity ? (
                  <div className="text-teal-100 space-y-0.5">
                    <p className="font-bold">{(selectedLocation as any).currentActivity.title}</p>
                    <p className="text-[11px] text-teal-200">
                      Peran: <strong className="text-amber-300 font-bold">{(selectedLocation as any).currentActivity.userRoleInActivity}</strong> • Status: {(selectedLocation as any).currentActivity.status}
                    </p>
                    <p className="text-[11px] text-teal-200">Lokasi: {(selectedLocation as any).currentActivity.location}</p>
                  </div>
                ) : (
                  <p className="text-teal-200/70 italic text-[11px]">Tidak ada kegiatan aktif saat ini.</p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex items-center gap-2">
                {formatWhatsAppUrl(selectedLocation.user?.phone) ? (
                  <a
                    href={formatWhatsAppUrl(selectedLocation.user?.phone)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/30 text-emerald-300 font-semibold py-2 px-3 rounded-xl text-xs transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>Hubungi WhatsApp</span>
                  </a>
                ) : (
                  <span className="flex-1 text-center bg-slate-500/20 border border-slate-400/20 text-slate-400 font-semibold py-2 px-3 rounded-xl text-xs">
                    Nomor WhatsApp Kosong
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
