"use client";

import { useState, useEffect, useCallback } from "react";
import { MapContainer, TileLayer, useMapEvents, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import { Search, Loader2 } from "lucide-react";

export interface AddressFromMap {
  line1: string;
  line2?: string;
  city: string;
  state?: string;
  zip?: string;
  country: string;
}

const defaultCenter: [number, number] = [27.7172, 85.324];
const nominatimBase = "https://nominatim.openstreetmap.org";

function reverseGeocode(lat: number, lon: number): Promise<AddressFromMap | null> {
  return fetch(
    `${nominatimBase}/reverse?lat=${lat}&lon=${lon}&format=json`,
    { headers: { Accept: "application/json" } }
  )
    .then((r) => r.json())
    .then((data: { address?: Record<string, string> }) => {
      const a = data?.address;
      if (!a) return null;
      const road = a.road ?? "";
      const suburb = a.suburb ?? a.neighbourhood ?? a.village ?? "";
      const line1 = [road, suburb].filter(Boolean).join(", ") || a.address29 || "Address";
      const city = a.city ?? a.town ?? a.village ?? a.municipality ?? a.county ?? "";
      const state = a.state ?? "";
      const zip = a.postcode ?? "";
      const country = a.country ?? "";
      if (!line1 || !country) return null;
      return { line1, city, state, zip, country };
    })
    .catch(() => null);
}

interface SearchResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: Record<string, string>;
}

function searchPlace(query: string): Promise<SearchResult[]> {
  if (!query.trim()) return Promise.resolve([]);
  return fetch(
    `${nominatimBase}/search?q=${encodeURIComponent(query.trim())}&format=json&limit=5`,
    { headers: { Accept: "application/json" } }
  )
    .then((r) => r.json())
    .then((data: SearchResult[]) => (Array.isArray(data) ? data : []))
    .catch(() => []);
}

function MapClickHandler({
  onAddress,
  setLoading,
  setMarkerPosition,
}: {
  onAddress: (addr: AddressFromMap) => void;
  setLoading: (v: boolean) => void;
  setMarkerPosition: (p: [number, number] | null) => void;
}) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      setMarkerPosition([lat, lng]);
      setLoading(true);
      const addr = await reverseGeocode(lat, lng);
      setLoading(false);
      if (addr) onAddress(addr);
    },
  });
  return null;
}

function CenterOnMarker({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.setView(position, map.getZoom());
  }, [map, position]);
  return null;
}

const markerIcon = L.divIcon({
  className: "custom-marker",
  html: `<div style="width:28px;height:28px;background:#3b82f6;border:3px solid white;border-radius:50%;box-shadow:0 2px 8px rgba(0,0,0,0.35);"></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

export function AddressMapPicker({
  onAddress,
  initialCenter,
  hint,
  searchLabel,
  searchPlaceholder,
  searchButtonText,
  className = "",
}: {
  onAddress: (address: AddressFromMap) => void;
  initialCenter?: [number, number];
  hint?: string;
  searchLabel?: string;
  searchPlaceholder?: string;
  searchButtonText?: string;
  className?: string;
}) {
  const center = initialCenter ?? defaultCenter;
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showResults, setShowResults] = useState(false);

  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    const results = await searchPlace(searchQuery);
    setSearchResults(results);
    setShowResults(true);
    setSearching(false);
    if (results.length > 0) {
      const first = results[0];
      const lat = parseFloat(first.lat);
      const lon = parseFloat(first.lon);
      if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
        setMarkerPosition([lat, lon]);
        setLoading(true);
        const addr = await reverseGeocode(lat, lon);
        setLoading(false);
        if (addr) onAddress(addr);
      }
    }
  }, [searchQuery, onAddress]);

  const pickSearchResult = useCallback(
    async (result: SearchResult) => {
      const lat = parseFloat(result.lat);
      const lon = parseFloat(result.lon);
      if (Number.isNaN(lat) || Number.isNaN(lon)) return;
      setShowResults(false);
      setSearchQuery(result.display_name);
      setMarkerPosition([lat, lon]);
      setLoading(true);
      const addr = await reverseGeocode(lat, lon);
      setLoading(false);
      if (addr) onAddress(addr);
    },
    [onAddress]
  );

  return (
    <div className={`overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] shadow-lg ${className}`}>
      <div className="p-3 sm:p-4 border-b border-white/10 bg-white/[0.02]">
        <label className="block text-sm font-medium text-[var(--brand-white)] mb-2">{searchLabel ?? "Search location"}</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowResults(false);
              }}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              onBlur={() => setTimeout(() => setShowResults(false), 180)}
              placeholder={searchPlaceholder ?? "Address, city, or place name"}
              className="w-full rounded-xl border border-white/10 bg-white/[0.06] pl-10 pr-4 py-3 text-sm text-[var(--brand-white)] placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/50 focus:border-[var(--brand-blue)]/30"
            />
            {showResults && searchResults.length > 0 && (
              <ul
                className="absolute left-0 right-0 top-full mt-1 rounded-xl border border-white/10 bg-[var(--brand-black)] py-1 shadow-xl z-[1100] max-h-48 overflow-auto"
                onMouseDown={(e) => e.preventDefault()}
              >
                {searchResults.map((r, i) => (
                  <li key={i}>
                    <button
                      type="button"
                      onClick={() => pickSearchResult(r)}
                      className="w-full text-left px-4 py-2.5 text-sm text-[var(--brand-white)] hover:bg-white/10 truncate"
                    >
                      {r.display_name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="rounded-xl bg-[var(--brand-blue)] px-4 py-3 text-sm font-medium text-white hover:bg-[var(--brand-blue)]/90 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            {searching ? <Loader2 className="w-5 h-5 animate-spin" /> : (searchButtonText ?? "Search")}
          </button>
        </div>
      </div>

      <div className="relative">
        <div className="h-[380px] sm:h-[420px] w-full">
          <MapContainer
            center={center}
            zoom={13}
            className="h-full w-full z-0 rounded-b-2xl"
            scrollWheelZoom
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <MapClickHandler
              onAddress={onAddress}
              setLoading={setLoading}
              setMarkerPosition={setMarkerPosition}
            />
            {markerPosition && <Marker position={markerPosition} icon={markerIcon} />}
            <CenterOnMarker position={markerPosition} />
          </MapContainer>
        </div>

        {loading && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-[1000] rounded-b-2xl">
            <div className="flex flex-col items-center gap-3 rounded-xl bg-[var(--brand-black)]/90 px-6 py-4 border border-white/10">
              <Loader2 className="w-8 h-8 text-[var(--brand-blue)] animate-spin" />
              <span className="text-sm font-medium text-white">Getting address…</span>
            </div>
          </div>
        )}

        <div className="absolute bottom-3 left-3 right-3 z-[1000] rounded-xl bg-black/75 backdrop-blur-sm px-4 py-3 text-xs text-white/95 border border-white/10">
          {hint ?? "Search above or click on the map to set your delivery location. Address will be filled automatically."}
        </div>
      </div>
    </div>
  );
}
