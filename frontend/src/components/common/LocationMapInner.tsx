'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Map,
  MapMarker,
  MarkerContent,
  MapControls,
  useMap,
} from '@/components/ui/map';
import {
  MapPin,
  Locate,
  Loader2,
  Search,
  X,
  Navigation,
  Compass,
  Check,
  Lightbulb,
} from 'lucide-react';
import type * as GeoJSON from 'geojson';

export interface LocationMapInnerProps {
  latitude: number;
  longitude: number;
  radius: number;
  onLocationChange: (lat: number, lng: number) => void;
  onAddressResolved?: (address: string) => void;
}

// Generate circular GeoJSON polygon for radius visualization
function createGeoJSONCircle(
  center: [number, number], // [lng, lat]
  radiusInMeters: number,
  points = 64
): GeoJSON.Feature<GeoJSON.Polygon> {
  const [lng, lat] = center;
  const coords: [number, number][] = [];
  const distanceX = radiusInMeters / (111320 * Math.cos((lat * Math.PI) / 180));
  const distanceY = radiusInMeters / 110540;

  for (let i = 0; i < points; i++) {
    const theta = (i / points) * (2 * Math.PI);
    const x = distanceX * Math.cos(theta);
    const y = distanceY * Math.sin(theta);
    coords.push([lng + x, lat + y]);
  }
  coords.push(coords[0]); // Close polygon

  return {
    type: 'Feature',
    geometry: {
      type: 'Polygon',
      coordinates: [coords],
    },
    properties: {},
  };
}

// Helper component to handle map click events
function MapClickHandler({
  onMapClick,
}: {
  onMapClick: (coords: { lng: number; lat: number }) => void;
}) {
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;
    const handler = (e: any) => {
      onMapClick({ lng: e.lngLat.lng, lat: e.lngLat.lat });
    };

    map.on('click', handler);
    return () => {
      map.off('click', handler);
    };
  }, [map, onMapClick]);

  return null;
}

// Helper to smoothly fly map to new coordinates
function MapFlyTo({
  center,
  zoom = 16,
}: {
  center: [number, number];
  zoom?: number;
}) {
  const { map } = useMap();
  const prevCenterRef = useRef<[number, number]>(center);

  useEffect(() => {
    if (!map) return;
    const [lng, lat] = center;
    const [prevLng, prevLat] = prevCenterRef.current;

    const diff = Math.abs(lng - prevLng) + Math.abs(lat - prevLat);
    if (diff > 0.00002) {
      prevCenterRef.current = center;
      map.flyTo({
        center: [lng, lat],
        zoom,
        duration: 800,
        essential: true,
      });
    }
  }, [map, center, zoom]);

  return null;
}

// Component to render geofence circle on MapLibre
function RadiusGeofenceLayer({
  center,
  radius,
}: {
  center: [number, number];
  radius: number;
}) {
  const { map, isLoaded } = useMap();
  const sourceId = 'geofence-radius-source';
  const fillLayerId = 'geofence-radius-fill';
  const lineLayerId = 'geofence-radius-line';

  useEffect(() => {
    if (!map || !isLoaded) return;
    const [lng, lat] = center;
    if (!lng || !lat || isNaN(lng) || isNaN(lat) || !radius || radius <= 0) return;

    const circleGeo = createGeoJSONCircle([lng, lat], radius);

    const updateOrAdd = () => {
      try {
        const source = map.getSource(sourceId) as any;
        if (source) {
          source.setData(circleGeo);
        } else {
          map.addSource(sourceId, {
            type: 'geojson',
            data: circleGeo,
          });

          if (!map.getLayer(fillLayerId)) {
            map.addLayer({
              id: fillLayerId,
              type: 'fill',
              source: sourceId,
              paint: {
                'fill-color': '#0d9488', // teal-600
                'fill-opacity': 0.18,
              },
            });
          }

          if (!map.getLayer(lineLayerId)) {
            map.addLayer({
              id: lineLayerId,
              type: 'line',
              source: sourceId,
              paint: {
                'line-color': '#0f766e', // teal-700
                'line-width': 2,
                'line-dasharray': [2, 2],
              },
            });
          }
        }
      } catch (e) {
        // Suppress benign layer update errors during style reloads
      }
    };

    if (map.isStyleLoaded()) {
      updateOrAdd();
    } else {
      map.once('style.load', updateOrAdd);
    }

    return () => {
      try {
        if (map) {
          if (map.getLayer(lineLayerId)) map.removeLayer(lineLayerId);
          if (map.getLayer(fillLayerId)) map.removeLayer(fillLayerId);
          if (map.getSource(sourceId)) map.removeSource(sourceId);
        }
      } catch (_) {}
    };
  }, [map, isLoaded, center, radius]);

  return null;
}

export default function LocationMapInner({
  latitude,
  longitude,
  radius,
  onLocationChange,
  onAddressResolved,
}: LocationMapInnerProps) {
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);

  // Debounced search via OpenStreetMap Nominatim
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.length < 3) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const queryWithContext = `${searchQuery.trim()}, Lampung, Indonesia`;
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
            queryWithContext
          )}&limit=5&addressdetails=1`
        );
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data || []);
          setShowResults(true);
        }
      } catch (err) {
        // Fallback silently if offline or blocked
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle GPS location click
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung geolokasi GPS.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude: lat, longitude: lng } = pos.coords;
        onLocationChange(lat, lng);

        // Reverse geocode optionally
        reverseGeocode(lat, lng);
      },
      (err) => {
        setIsLocating(false);
        alert('Gagal mendeteksi lokasi: ' + (err.message || 'Izin akses lokasi ditolak.'));
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // Reverse geocoding helper
  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`
      );
      if (res.ok) {
        const data = await res.json();
        if (data?.display_name && onAddressResolved) {
          // Provide clean readable name
          const parts = data.display_name.split(',');
          const cleanName = parts.slice(0, 3).join(',').trim();
          onAddressResolved(cleanName || data.display_name);
        }
      }
    } catch (_) {}
  };

  const handleSelectSearchResult = (item: any) => {
    const lat = parseFloat(item.lat);
    const lon = parseFloat(item.lon);
    if (!isNaN(lat) && !isNaN(lon)) {
      onLocationChange(lat, lon);
      if (onAddressResolved) {
        const parts = (item.display_name || '').split(',');
        const cleanName = parts.slice(0, 3).join(',').trim();
        onAddressResolved(cleanName || item.display_name);
      }
      setShowResults(false);
      setSearchQuery('');
    }
  };

  return (
    <div className="w-full h-full relative rounded-2xl overflow-hidden border border-slate-200">
      {/* ── Search Bar Overlay (Shopee Style) ── */}
      <div className="absolute top-3 left-3 right-14 z-20">
        <div className="relative shadow-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchResults.length > 0 && setShowResults(true)}
            placeholder="Cari jalan / gedung / alamat di peta..."
            className="w-full bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-xl pl-9 pr-8 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-600 shadow-sm transition-all"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setShowResults(false);
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}

          {isSearching && (
            <div className="absolute right-8 top-1/2 -translate-y-1/2">
              <Loader2 className="w-3.5 h-3.5 text-teal-600 animate-spin" />
            </div>
          )}

          {/* Search Dropdown Results */}
          {showResults && searchResults.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto divide-y divide-slate-100 z-50">
              {searchResults.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full text-left px-3.5 py-2.5 text-xs hover:bg-teal-50 text-slate-700 hover:text-teal-900 flex items-start gap-2.5 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="truncate">
                    <p className="font-semibold text-slate-800 truncate">
                      {item.display_name?.split(',')[0]}
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {item.display_name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Main MapLibre Map ── */}
      <Map
        center={[longitude, latitude]}
        zoom={16}
        theme="light"
        styles={{
          light: {
            version: 8,
            sources: {
              'google-maps': {
                type: 'raster',
                tiles: [
                  'https://mt0.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=AIzaSyAspkC4V1-LjBsDLsWj06GrdkrPhXX2v8g',
                  'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=AIzaSyAspkC4V1-LjBsDLsWj06GrdkrPhXX2v8g',
                  'https://mt2.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=AIzaSyAspkC4V1-LjBsDLsWj06GrdkrPhXX2v8g',
                  'https://mt3.google.com/vt/lyrs=m&x={x}&y={y}&z={z}&key=AIzaSyAspkC4V1-LjBsDLsWj06GrdkrPhXX2v8g',
                ],
                tileSize: 256,
              },
            },
            layers: [
              {
                id: 'google-maps-layer',
                type: 'raster',
                source: 'google-maps',
                minzoom: 0,
                maxzoom: 21,
              },
            ],
          } as any,
        }}
        className="w-full h-full cursor-crosshair"
      >
        <MapFlyTo center={[longitude, latitude]} zoom={16} />
        <MapClickHandler
          onMapClick={({ lng, lat }) => {
            onLocationChange(lat, lng);
            reverseGeocode(lat, lng);
          }}
        />
        <RadiusGeofenceLayer center={[longitude, latitude]} radius={radius} />

        <MapControls
          position="bottom-left"
          showZoom={true}
          showCompass={true}
          showFullscreen={false}
        />

        {/* ── Shopee-Style Draggable Pin ── */}
        <MapMarker
          longitude={longitude}
          latitude={latitude}
          draggable={true}
          onDragEnd={({ lng, lat }) => {
            onLocationChange(lat, lng);
            reverseGeocode(lat, lng);
          }}
        >
          <MarkerContent>
            <div className="relative flex flex-col items-center group -translate-y-full cursor-grab active:cursor-grabbing select-none">
              {/* Badge label above pin */}
              <div className="bg-slate-900/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-lg border border-slate-700/60 mb-1 flex items-center gap-1.5 whitespace-nowrap animate-bounce">
                <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-ping" />
                <span>Titik Presensi Humas</span>
              </div>

              {/* Pin Head & Icon */}
              <div className="relative filter drop-shadow-md">
                <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-rose-600 via-rose-500 to-red-500 border-2 border-white shadow-xl flex items-center justify-center text-white font-bold transition-transform group-hover:scale-110">
                  <MapPin className="w-5 h-5 fill-white text-rose-600" />
                </div>
                <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-rose-600 mx-auto -mt-0.5" />
              </div>

              {/* Ground target shadow */}
              <div className="w-4 h-1.5 bg-black/40 rounded-full blur-[1px] -mt-1 group-hover:scale-125 transition-transform" />
            </div>
          </MarkerContent>
        </MapMarker>
      </Map>

      {/* ── Floating Locate Me Button ── */}
      <button
        type="button"
        onClick={handleGetLocation}
        disabled={isLocating}
        title="Gunakan Lokasi GPS Saya Saat Ini"
        className="absolute top-3 right-3 z-20 bg-white/95 hover:bg-white text-slate-700 hover:text-teal-700 border border-slate-200/90 p-2.5 rounded-xl shadow-md transition-all active:scale-95 flex items-center justify-center disabled:opacity-50"
      >
        {isLocating ? (
          <Loader2 className="w-4 h-4 text-teal-600 animate-spin" />
        ) : (
          <Locate className="w-4 h-4 text-teal-600" />
        )}
      </button>

      {/* ── Floating Helper Guide (Shopee Style) ── */}
      <div className="absolute bottom-2.5 left-14 right-3 z-10 pointer-events-none">
        <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 px-3 py-1.5 rounded-xl shadow-sm flex items-center justify-between text-[11px] text-slate-600">
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-teal-600 font-bold inline-flex items-center gap-1">
              <Lightbulb className="w-3.5 h-3.5 shrink-0" /> Tips:
            </span>
            <span className="truncate">Klik peta atau geser pin merah untuk memindahkan titik.</span>
          </div>
          <span className="hidden sm:inline-block font-mono font-medium text-slate-500 shrink-0 text-[10px] pl-2">
            Radius: {radius}m
          </span>
        </div>
      </div>
    </div>
  );
}
