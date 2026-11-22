'use client';

import React, { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import {
  Search,
  MapPin,
  Loader2,
  X,
  Navigation,
  Globe,
  Building2,
  Sparkles,
} from 'lucide-react';
import { KNOWN_LOCATIONS, PlaceLocation } from '@/utils/campusLocations';

export interface StreetSearchInputProps {
  value: string;
  onChange: (address: string, coords?: { lat: string; lng: string }) => void;
  error?: string;
  label?: string;
  placeholder?: string;
  required?: boolean;
  latitude?: string | number;
  longitude?: string | number;
  radius?: string | number;
  onRadiusChange?: (radius: string) => void;
  className?: string;
}

const RADIUS_PRESETS = [25, 50, 100, 200, 500];
const GOOGLE_API_KEY = 'AIzaSyAspkC4V1-LjBsDLsWj06GrdkrPhXX2v8g';

const LocationMapInner = dynamic(() => import('./LocationMapInner'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-56 bg-slate-50 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-slate-500 text-xs gap-2">
      <Loader2 className="w-5 h-5 text-[#003D58] animate-spin" />
      <span className="font-medium">Memuat Peta Lokasi...</span>
    </div>
  ),
});

interface PlaceSuggestion {
  placeId?: string;
  name: string;
  address: string;
  lat?: string;
  lon?: string;
  category?: string;
  categoryLabel?: string;
  isCampus?: boolean;
}

const CAMPUS_PRESETS = [
  { label: 'GSG Polinela', name: 'Gedung Serba Guna (GSG Polinela)', address: 'Gedung Serba Guna (GSG) Polinela, Jl. Soekarno Hatta No. 10, Rajabasa, Bandar Lampung', lat: -5.3592, lng: 105.2338 },
  { label: 'Gedung Direktorat', name: 'Gedung Direktorat / Rektorat Polinela', address: 'Gedung Direktorat Kampus Polinela, Jl. Soekarno Hatta No. 10, Rajabasa', lat: -5.3578, lng: 105.2341 },
  { label: 'Ruang Humas', name: 'Ruang Humas & Protokoler Polinela', address: 'Ruang Unit Kehumasan & Publikasi, Gedung Direktorat Lt. 1 Polinela', lat: -5.3580, lng: 105.2343 },
  { label: 'Lab Humas', name: 'Lab Humas & Studio Multimedia Polinela', address: 'Laboratorium Multimedia & Studio Podcast Humas Polinela', lat: -5.3582, lng: 105.2348 },
  { label: 'Gedung JTI', name: 'Gedung Jurusan Teknologi Informasi (JTI)', address: 'Gedung Jurusan Teknologi Informasi & Akuntansi Polinela', lat: -5.3586, lng: 105.2355 },
  { label: 'Gedung Sakura (FEB)', name: 'Gedung Sakura (Ekonomi & Bisnis / FEB)', address: 'Gedung Sakura, Jurusan Ekonomi dan Bisnis Polinela', lat: -5.3601, lng: 105.2350 },
  { label: 'Ruang Sidang Utama', name: 'Ruang Sidang Utama Direktorat Polinela', address: 'Ruang Sidang Utama, Gedung Direktorat Lt. 2 Polinela', lat: -5.3577, lng: 105.2342 },
];

const SEARCH_CACHE = new Map<string, PlaceSuggestion[]>();

async function searchPlacesGoogleAndFallback(
  rawQuery: string,
  signal?: AbortSignal
): Promise<PlaceSuggestion[]> {
  const trimmed = rawQuery.trim();
  if (trimmed.length < 2) return [];

  const cacheKey = trimmed.toLowerCase();
  if (SEARCH_CACHE.has(cacheKey)) {
    return SEARCH_CACHE.get(cacheKey)!;
  }

  // Check sessionStorage cache to save quota across refreshes
  if (typeof window !== 'undefined') {
    try {
      const saved = sessionStorage.getItem(`humas_gmaps_${cacheKey}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          SEARCH_CACHE.set(cacheKey, parsed);
          return parsed;
        }
      }
    } catch {
      // ignore storage errors
    }
  }

  const saveToCache = (items: PlaceSuggestion[]) => {
    if (items.length > 0) {
      SEARCH_CACHE.set(cacheKey, items);
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.setItem(`humas_gmaps_${cacheKey}`, JSON.stringify(items));
        } catch {
          // ignore
        }
      }
    }
  };

  // 1. Primary: Google Places Text Search API (New) — returns exact businesses, warungs, depots, streets + coordinates in 1 call
  try {
    const textRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
        'X-Goog-FieldMask':
          'places.id,places.displayName,places.formattedAddress,places.location',
      },
      body: JSON.stringify({
        textQuery: trimmed,
        languageCode: 'id',
        regionCode: 'ID',
        locationBias: {
          circle: {
            center: { latitude: -5.3585, longitude: 105.2345 },
            radius: 50000.0,
          },
        },
      }),
    });

    if (textRes.ok) {
      const data = await textRes.json();
      const places = (data.places || [])
        .filter((p: any) => p.location?.latitude && p.location?.longitude)
        .map((p: any) => ({
          placeId: p.id,
          name: p.displayName?.text || trimmed,
          address: p.formattedAddress || '',
          lat: String(p.location.latitude),
          lon: String(p.location.longitude),
          category: 'Google Maps',
          isCampus: false,
        }));
      if (places.length > 0) {
        saveToCache(places);
        return places;
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
  }

  // 2. Secondary: Google Places Autocomplete API
  try {
    const autoRes = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      signal,
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': GOOGLE_API_KEY,
      },
      body: JSON.stringify({
        input: trimmed,
        languageCode: 'id',
        regionCode: 'ID',
        locationBias: {
          circle: {
            center: { latitude: -5.3585, longitude: 105.2345 },
            radius: 50000.0,
          },
        },
      }),
    });

    if (autoRes.ok) {
      const data = await autoRes.json();
      const predictions = (data.suggestions || [])
        .map((s: any) => s.placePrediction)
        .filter(Boolean)
        .map((p: any) => ({
          placeId: p.placeId,
          name: p.structuredFormat?.mainText?.text || p.text?.text || trimmed,
          address: p.structuredFormat?.secondaryText?.text || '',
          category: 'Google Maps',
          isCampus: false,
        }));
      if (predictions.length > 0) {
        saveToCache(predictions);
        return predictions;
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
  }

  // 3. Fallback: Nominatim OpenStreetMap (strictly Indonesia)
  try {
    const nomRes = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&countrycodes=id&limit=6&q=${encodeURIComponent(
        trimmed
      )}`,
      {
        signal,
        headers: { 'Accept-Language': 'id' },
      }
    );
    if (nomRes.ok) {
      const nomData = await nomRes.json();
      if (Array.isArray(nomData) && nomData.length > 0) {
        const nomItems: PlaceSuggestion[] = nomData.map((item: any) => {
          const parts = (item.display_name || '').split(',').map((s: string) => s.trim());
          return {
            name: item.name || parts[0] || trimmed,
            address: parts.slice(1).join(', ') || item.display_name || '',
            lat: String(item.lat),
            lon: String(item.lon),
            category: 'Peta Lokasi',
            isCampus: false,
          };
        });
        saveToCache(nomItems);
        return nomItems;
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
  }

  // 4. Fallback: Photon API bounded strictly to Indonesia (bbox=94.5,-11.2,141.1,6.2)
  try {
    const pRes = await fetch(
      `https://photon.komoot.io/api/?q=${encodeURIComponent(
        trimmed
      )}&lat=-5.3585&lon=105.2345&bbox=94.5,-11.2,141.1,6.2&limit=8`,
      { signal }
    );
    if (pRes.ok) {
      const pData = await pRes.json();
      const photonItems: PlaceSuggestion[] = (pData.features || []).map((f: any) => {
        const p = f.properties || {};
        const coords = f.geometry?.coordinates || [0, 0];
        const parts = [p.street, p.district, p.city, p.state, p.country].filter(Boolean);
        return {
          name: p.name || parts[0] || trimmed,
          address: parts.join(', '),
          lat: String(coords[1]),
          lon: String(coords[0]),
          category: 'Peta Lokasi',
          isCampus: false,
        };
      });
      return photonItems;
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
  }

  return [];
}

export default function StreetSearchInput({
  value,
  onChange,
  error,
  label = 'Lokasi / Alamat Kegiatan',
  placeholder = 'Ketik nama jalan, gedung, atau tempat (cth: DAMRI, Monas, GSG Polinela)...',
  required = false,
  latitude,
  longitude,
  radius = '100',
  onRadiusChange,
  className = '',
}: StreetSearchInputProps) {
  const [query, setQuery] = useState(value || '');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<PlaceSuggestion[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const lastGeocodedRef = useRef<string>('');
  const isUserTypingRef = useRef<boolean>(false);

  const parsedRadius = Number(radius) > 0 ? Number(radius) : 100;

  const handleRadiusSelect = (newRad: number) => {
    if (onRadiusChange) {
      onRadiusChange(String(newRad));
    }
  };

  useEffect(() => {
    const nextVal = value || '';
    if (!isUserTypingRef.current) {
      setQuery((prev) => (prev === nextVal ? prev : nextVal));
    }
  }, [value]);

  // Click outside listener to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
        isUserTypingRef.current = false;
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Safe coordinates
  const parsedLat = parseFloat(String(latitude));
  const parsedLng = parseFloat(String(longitude));
  const currentLat = !isNaN(parsedLat) && parsedLat !== 0 ? parsedLat : -5.3585;
  const currentLng = !isNaN(parsedLng) && parsedLng !== 0 ? parsedLng : 105.2345;

  // Auto-geocode initial saved value ONLY when loaded externally (never while user is actively typing)
  useEffect(() => {
    if (isUserTypingRef.current) return;

    const trimmedVal = (value || '').trim();
    if (trimmedVal.length < 3) return;

    const hasValidCoords =
      latitude != null &&
      latitude !== '' &&
      !isNaN(Number(latitude)) &&
      Number(latitude) !== 0 &&
      longitude != null &&
      longitude !== '' &&
      !isNaN(Number(longitude)) &&
      Number(longitude) !== 0;

    if (hasValidCoords) {
      return;
    }

    if (lastGeocodedRef.current === trimmedVal) {
      return;
    }
    lastGeocodedRef.current = trimmedVal;

    let isCancelled = false;
    const fetchCoords = async () => {
      try {
        setIsSearching(true);
        const found = await searchPlacesGoogleAndFallback(trimmedVal);
        if (!isCancelled && found.length > 0) {
          const first = found[0];
          if (first.lat && first.lon) {
            onChange(trimmedVal, {
              lat: String(first.lat),
              lng: String(first.lon),
            });
          }
        }
      } catch {
        // Fallback silently
      } finally {
        if (!isCancelled) {
          setIsSearching(false);
        }
      }
    };

    fetchCoords();

    return () => {
      isCancelled = true;
    };
  }, [value, latitude, longitude, onChange]);

  // Filter Polinela campus locations from local database
  const getCampusSuggestions = (text: string): PlaceSuggestion[] => {
    const q = text.toLowerCase().trim();
    const campusItems = KNOWN_LOCATIONS.filter((l) => l.category === 'KAMPUS_POLINELA');
    if (!q) {
      return campusItems.slice(0, 8).map((l) => ({
        name: l.name,
        address: l.address,
        lat: String(l.lat),
        lon: String(l.lng),
        category: l.categoryLabel || 'Kampus Polinela',
        isCampus: true,
      }));
    }
    return campusItems
      .filter((l) => {
        return (
          l.name.toLowerCase().includes(q) ||
          l.label.toLowerCase().includes(q) ||
          l.address.toLowerCase().includes(q) ||
          l.keywords.some((k) => k.toLowerCase().includes(q))
        );
      })
      .map((l) => ({
        name: l.name,
        address: l.address,
        lat: String(l.lat),
        lon: String(l.lng),
        category: l.categoryLabel || 'Kampus Polinela',
        isCampus: true,
      }));
  };

  const handleInputFocus = () => {
    const trimmed = query.trim();
    if (trimmed.length >= 2 && results.length > 0) {
      setShowDropdown(true);
      return;
    }
    const campusResults = getCampusSuggestions(query);
    setResults(campusResults);
    setShowDropdown(true);
  };

  const handlePresetClick = (preset: typeof CAMPUS_PRESETS[0]) => {
    isUserTypingRef.current = false;
    setQuery(preset.name);
    setShowDropdown(false);
    lastGeocodedRef.current = preset.name;
    onChange(preset.name, {
      lat: String(preset.lat),
      lng: String(preset.lng),
    });
  };

  // Live search as user types
  const handleInputChange = (text: string) => {
    isUserTypingRef.current = true;
    setQuery(text);
    onChange(text);

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const trimmed = text.trim();
    const campusMatches = getCampusSuggestions(trimmed);

    if (trimmed.length < 2) {
      setResults(campusMatches);
      setShowDropdown(true);
      setIsSearching(false);
      return;
    }

    // Immediately display local campus matches while Google search is fetching
    if (campusMatches.length > 0) {
      setResults(campusMatches);
      setShowDropdown(true);
    }

    setIsSearching(true);
    debounceTimerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      try {
        const googlePredictions = await searchPlacesGoogleAndFallback(
          trimmed,
          controller.signal
        );
        const combined = [...campusMatches, ...googlePredictions];
        setResults(combined);
        setShowDropdown(true);
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          setResults(campusMatches);
        }
      } finally {
        if (abortControllerRef.current === controller) {
          setIsSearching(false);
        }
      }
    }, 350);
  };

  const handleSelectResult = async (item: PlaceSuggestion) => {
    isUserTypingRef.current = false;
    setIsSearching(true);

    const namePart = (item.name || '').trim();
    const addrPart = (item.address || '').trim();
    let finalAddress = namePart;
    if (addrPart) {
      if (addrPart.toLowerCase().startsWith(namePart.toLowerCase())) {
        finalAddress = addrPart;
      } else {
        finalAddress = `${namePart}, ${addrPart}`;
      }
    }

    let finalLat = item.lat || '';
    let finalLng = item.lon || '';

    // If Google Place ID exists and coordinates are not yet populated, fetch place details
    if (item.placeId && (!finalLat || !finalLng)) {
      try {
        const detailRes = await fetch(
          `https://places.googleapis.com/v1/places/${item.placeId}?fields=id,displayName,formattedAddress,location`,
          {
            headers: {
              'X-Goog-Api-Key': GOOGLE_API_KEY,
            },
          }
        );
        if (detailRes.ok) {
          const detail = await detailRes.json();
          if (detail.formattedAddress) {
            const dispName = detail.displayName?.text || namePart;
            finalAddress = detail.formattedAddress.toLowerCase().startsWith(dispName.toLowerCase())
              ? detail.formattedAddress
              : `${dispName}, ${detail.formattedAddress}`;
          } else if (detail.displayName?.text) {
            finalAddress = detail.displayName.text;
          }
          if (detail.location?.latitude && detail.location?.longitude) {
            finalLat = String(detail.location.latitude);
            finalLng = String(detail.location.longitude);
          }
        }
      } catch {
        // Fallback to what we have
      }
    }

    setQuery(finalAddress);
    setShowDropdown(false);
    setIsSearching(false);
    lastGeocodedRef.current = finalAddress;

    onChange(finalAddress, {
      lat: finalLat,
      lng: finalLng,
    });
  };

  const handleKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (results.length > 0) {
        handleSelectResult(results[0]);
      } else if (query.trim().length >= 2) {
        setIsSearching(true);
        try {
          const found = await searchPlacesGoogleAndFallback(query.trim());
          if (found.length > 0) {
            await handleSelectResult(found[0]);
          }
        } finally {
          setIsSearching(false);
        }
      }
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setShowDropdown(false);
    lastGeocodedRef.current = '';
    onChange('', { lat: '', lng: '' });
  };

  const handleMapLocationChange = (newLat: number, newLng: number) => {
    onChange(query, {
      lat: newLat.toFixed(6),
      lng: newLng.toFixed(6),
    });
  };

  const handleAddressResolved = (resolvedAddress: string) => {
    setQuery(resolvedAddress);
    onChange(resolvedAddress);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {/* Label & Active Map Indicator */}
      <div className="flex items-center justify-between">
        <label className="block text-[12px] font-[600] leading-[16px] text-[#334155]">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      </div>

      {/* Main Street Search Input */}
      <div className="relative" ref={dropdownRef}>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4 text-[#003D58]" />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleInputFocus}
            onBlur={() => {
              isUserTypingRef.current = false;
            }}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={`w-full h-[38px] pl-9 pr-9 ${error
                ? 'bg-[#F9E9E9] border border-[#B8484A] text-[#B8484A] focus:ring-1 focus:ring-[#B8484A]/40'
                : 'bg-white border border-[#E2E8F0] focus:border-[#003D58] focus:ring-1 focus:ring-[#003D58]/30'
              } rounded-[8px] text-[12px] text-[#202938] placeholder:text-[#67686D]/60 shadow-[0_1px_2px_rgba(0,0,0,0.05)] focus:outline-none transition-all`}
          />
          <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center gap-1">
            {isSearching && <Loader2 className="w-3.5 h-3.5 text-[#003D58] animate-spin" />}
            {query && !isSearching && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[#67686D] hover:text-[#202938] p-0.5 rounded cursor-pointer transition-colors"
                title="Hapus pencarian"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Live Search Suggestions Dropdown */}
        {showDropdown && (
          <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-64 overflow-y-auto divide-y divide-slate-100 animate-in fade-in zoom-in-95 duration-100">
            <div className="px-3.5 py-1.5 bg-slate-50 text-[10px] font-bold text-[#67686D] uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-[#003D58]" />
                Hasil Rekomendasi Lokasi ({results.length})
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Klik untuk memilih</span>
            </div>

            {results.length > 0 ? (
              results.map((item, idx) => (
                <button
                  key={item.placeId || `${item.name}-${idx}`}
                  type="button"
                  onClick={() => handleSelectResult(item)}
                  className="w-full text-left px-3.5 py-2.5 hover:bg-sky-50/80 transition-colors flex items-start gap-2.5 cursor-pointer group"
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors ${item.isCampus
                        ? 'bg-blue-50 group-hover:bg-blue-100 text-[#003D58]'
                        : 'bg-red-50 group-hover:bg-red-100 text-rose-600'
                      }`}
                  >
                    {item.isCampus ? (
                      <Building2 className="w-4 h-4 text-[#003D58]" />
                    ) : (
                      <MapPin className="w-4 h-4 text-rose-600" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-[12px] font-bold text-slate-800 group-hover:text-[#003D58] truncate">
                        {item.name}
                      </p>
                      {item.isCampus ? (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-blue-50 text-[#003D58] border border-blue-200">
                          Kampus Polinela
                        </span>
                      ) : (
                        <span className="shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                          {item.category || 'Google Maps'}
                        </span>
                      )}
                    </div>
                    {item.address && (
                      <p className="text-[11px] text-slate-500 group-hover:text-slate-700 truncate mt-0.5">
                        {item.address}
                      </p>
                    )}
                  </div>
                </button>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-slate-400">
                <p className="font-semibold text-slate-600">Tempat tidak ditemukan</p>
                <p className="text-[11px] mt-0.5">
                  Anda dapat menekan opsi di bawah untuk memakai teks ini.
                </p>
              </div>
            )}

            {/* Opsi Pakai Teks Kustom */}
            {query.trim().length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setShowDropdown(false);
                  onChange(query);
                }}
                className="w-full text-left px-3.5 py-2 bg-slate-50/70 hover:bg-slate-100 text-xs font-semibold text-[#003D58] flex items-center gap-2 transition-colors border-t border-slate-100 cursor-pointer"
              >
                <Navigation className="w-3.5 h-3.5 text-[#35C6D4]" />
                <span>Gunakan nama lokasi: &ldquo;{query}&rdquo;</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Quick Campus Preset Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
        <span className="text-[11px] font-semibold text-slate-500 mr-1 flex items-center gap-1">
          <Building2 className="w-3 h-3 text-[#003D58]" />
          Rekomendasi Polinela:
        </span>
        {CAMPUS_PRESETS.map((p) => (
          <button
            key={p.name}
            type="button"
            onClick={() => handlePresetClick(p)}
            className="px-2 py-0.5 text-[10.5px] font-medium rounded-md bg-white hover:bg-blue-50 text-slate-700 hover:text-[#003D58] border border-slate-200 hover:border-[#35C6D4] transition-all cursor-pointer shadow-2xs"
          >
            {p.label || p.name}
          </button>
        ))}
      </div>

      {error && (
        <div className="text-[11px] text-[#B8484A] mt-1 flex items-center gap-1 font-[500]">
          <span>{error}</span>
        </div>
      )}

      {/* Pengaturan Radius Verifikasi / Presensi GPS */}
      <div className="bg-slate-50/80 border border-slate-200/90 rounded-xl p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#003D58] animate-pulse" />
            Batas Radius Verifikasi Presensi GPS:
          </span>
          <span className="text-[11px] font-bold text-[#003D58] bg-blue-50 px-2.5 py-0.5 rounded-lg border border-blue-200">
            {parsedRadius} Meter
          </span>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-slate-500 mr-1">Preset:</span>
          {RADIUS_PRESETS.map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => handleRadiusSelect(r)}
              className={`text-[11px] px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${parsedRadius === r
                  ? 'bg-[#003D58] text-white shadow-xs font-semibold'
                  : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200'
                }`}
            >
              {r}m
            </button>
          ))}
          <div className="ml-auto flex items-center gap-1 text-[11px] text-slate-500">
            <input
              type="number"
              min="10"
              max="5000"
              value={parsedRadius}
              onChange={(e) => {
                const val = parseInt(e.target.value) || 0;
                if (val >= 0) handleRadiusSelect(val);
              }}
              className="w-16 h-7 px-2 border border-slate-200 rounded-md text-right text-xs font-semibold bg-white focus:outline-none focus:border-[#003D58]"
            />
            <span>m</span>
          </div>
        </div>

        <p className="text-[10px] text-slate-400">
          * Lingkaran biru pada peta menunjukkan batas toleransi radius presensi ({parsedRadius}m) untuk tim lapangan.
        </p>
      </div>

      {/* Peta Interaktif */}
      <div className="relative w-full h-[280px] sm:h-[320px] rounded-xl overflow-hidden border border-slate-200 shadow-xs">
        <LocationMapInner
          latitude={currentLat}
          longitude={currentLng}
          radius={parsedRadius}
          onLocationChange={handleMapLocationChange}
          onAddressResolved={handleAddressResolved}
          hideInternalSearch={true}
          pinLabel="Lokasi Kegiatan"
        />
      </div>
    </div>
  );
}
