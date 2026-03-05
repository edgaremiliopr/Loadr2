"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* -------------------------------------------------------------------------- */
/*  Load Calculator – compact version designed to sit beside the hero         */
/*  Light-theme Apple-inspired design                                         */
/* -------------------------------------------------------------------------- */

interface NominatimResult {
  display_name: string;
  lat: string;
  lon: string;
  place_id: number;
}

interface CalcResult {
  distanceMiles: number;
  baseRate: number;
  loadCharge: number;
  unloadCharge: number;
  weightSurcharge: number;
  oversizeSurcharge: number;
  pieceSurcharge: number;
  subtotal: number;
  total: number;
}

const TRUCK_TYPES = [
  { id: "flatbed",    label: "Flatbed",           ratePerMile: 2.85 },
  { id: "stepdeck",   label: "Step Deck",         ratePerMile: 3.15 },
  { id: "lowboy",     label: "Lowboy",            ratePerMile: 4.20 },
  { id: "moffett",    label: "Moffett",           ratePerMile: 3.65 },
  { id: "piggyback",  label: "Piggyback",         ratePerMile: 3.55 },
  { id: "hotshot",    label: "Hotshot",            ratePerMile: 2.45 },
] as const;

const MARGIN_RATE = 0.25;
const MINIMUM_LINEHAUL = 350;

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function estimateRoadMiles(straightMiles: number): number {
  return Math.round(straightMiles * 1.28);
}

function useDebounce(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/* ── Address Input ─────────────────────────────────────────────── */

function AddressInput({
  label, value, onChange, onSelect, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSelect: (lat: number, lon: number, display: string) => void;
  placeholder: string;
}) {
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(value, 400);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounced.length < 3) { setSuggestions([]); return; }
    let cancelled = false;
    setLoading(true);

    // Use Nominatim with structured query + viewbox bias for Florida
    const params = new URLSearchParams({
      format: "json",
      countrycodes: "us",
      limit: "6",
      q: debounced,
      viewbox: "-87.63,31.00,-80.03,24.40",
      bounded: "0",
      addressdetails: "1",
    });

    fetch(`https://nominatim.openstreetmap.org/search?${params}`, {
      headers: { "Accept-Language": "en", "User-Agent": "Loadr/1.0" },
    })
      .then((r) => r.json())
      .then((data: NominatimResult[]) => {
        if (!cancelled) {
          setSuggestions(data);
          setOpen(data.length > 0);
          setLoading(false);
        }
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debounced]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-[0.6875rem] font-bold text-gray-400 tracking-[0.07em] uppercase mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); }}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-[0.8125rem] text-gray-900 placeholder-gray-300 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        {loading && (
          <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
            <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500" />
          </div>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-xl overflow-hidden max-h-48 overflow-y-auto">
          {suggestions.map((s) => (
            <li key={s.place_id}>
              <button
                type="button"
                className="w-full px-3 py-2 text-left text-[0.75rem] text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition leading-snug"
                onClick={() => {
                  const short = s.display_name.split(",").slice(0, 3).join(",");
                  onChange(short);
                  onSelect(Number(s.lat), Number(s.lon), short);
                  setOpen(false);
                }}
              >
                {s.display_name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/* ── Main Calculator ─────────────────────────────────────────── */

export function LoadCalculator() {
  const [originText, setOriginText] = useState("");
  const [destText, setDestText] = useState("");
  const [originCoords, setOriginCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [selfLoad, setSelfLoad] = useState(false);
  const [selfUnload, setSelfUnload] = useState(false);
  const [weight, setWeight] = useState("");
  const [truckType, setTruckType] = useState("flatbed");
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState("");

  const calculate = useCallback(() => {
    setError("");
    setResult(null);

    if (!originCoords || !destCoords) {
      setError("Select both addresses from the dropdown suggestions.");
      return;
    }

    const straightMiles = haversine(originCoords.lat, originCoords.lon, destCoords.lat, destCoords.lon);
    const distanceMiles = estimateRoadMiles(straightMiles);

    if (distanceMiles < 1) { setError("Locations are too close together."); return; }

    const truck = TRUCK_TYPES.find((t) => t.id === truckType) ?? TRUCK_TYPES[0];
    const linehaul = Math.max(distanceMiles * truck.ratePerMile, MINIMUM_LINEHAUL);

    const loadCharge = selfLoad ? 185 : 0;
    const unloadCharge = selfUnload ? 185 : 0;

    const w = Number(weight) || 0;
    const weightSurcharge = w > 44000 ? Math.ceil((w - 44000) / 1000) * 35 : 0;

    const oversizeSurcharge = 0;
    const pieceSurcharge = 0;

    const subtotal = linehaul + loadCharge + unloadCharge + weightSurcharge + oversizeSurcharge + pieceSurcharge;
    const margin = Math.round(subtotal * MARGIN_RATE);
    const total = subtotal + margin;

    setResult({
      distanceMiles,
      baseRate: Math.round(linehaul),
      loadCharge, unloadCharge, weightSurcharge, oversizeSurcharge, pieceSurcharge,
      subtotal: Math.round(subtotal),
      total: Math.round(total),
    });
  }, [originCoords, destCoords, selfLoad, selfUnload, weight, truckType]);

  const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <div id="calculator" className="rounded-2xl border border-gray-100 bg-white p-5 shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
      <div className="text-[0.6875rem] font-bold text-blue-600 tracking-[0.07em] uppercase mb-1">
        Instant Estimate
      </div>
      <h3 className="text-[1.125rem] font-bold text-gray-900 tracking-tight mb-4">
        Load Calculator
      </h3>

      <div className="space-y-3">
        <AddressInput
          label="Pickup"
          value={originText}
          onChange={setOriginText}
          onSelect={(lat, lon, d) => { setOriginCoords({ lat, lon }); }}
          placeholder="City, address, or zip..."
        />
        <AddressInput
          label="Delivery"
          value={destText}
          onChange={setDestText}
          onSelect={(lat, lon, d) => { setDestCoords({ lat, lon }); }}
          placeholder="City, address, or zip..."
        />

        {/* Truck type */}
        <div>
          <label className="block text-[0.6875rem] font-bold text-gray-400 tracking-[0.07em] uppercase mb-1.5">
            Equipment
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {TRUCK_TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTruckType(t.id)}
                className={`rounded-lg border px-2 py-1.5 text-[0.6875rem] font-medium transition ${
                  truckType === t.id
                    ? "border-blue-400 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Self-load/unload + weight */}
        <div className="grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-2 cursor-pointer text-[0.75rem] hover:bg-gray-50 transition">
            <input type="checkbox" checked={selfLoad} onChange={(e) => setSelfLoad(e.target.checked)} className="accent-blue-600 h-3.5 w-3.5" />
            <span className="font-medium text-gray-700">Self-Load</span>
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-gray-200 px-2.5 py-2 cursor-pointer text-[0.75rem] hover:bg-gray-50 transition">
            <input type="checkbox" checked={selfUnload} onChange={(e) => setSelfUnload(e.target.checked)} className="accent-blue-600 h-3.5 w-3.5" />
            <span className="font-medium text-gray-700">Self-Unload</span>
          </label>
        </div>

        <div>
          <label className="block text-[0.6875rem] font-bold text-gray-400 tracking-[0.07em] uppercase mb-1.5">
            Weight (lbs) — optional
          </label>
          <input
            type="number"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="e.g. 24000"
            min="0"
            className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-[0.8125rem] text-gray-900 placeholder-gray-300 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <button
          type="button"
          onClick={calculate}
          className="w-full rounded-full bg-gray-900 py-3 text-[0.8125rem] font-semibold text-white transition hover:bg-gray-700 active:scale-[0.98]"
        >
          Get Quote Estimate
        </button>

        {error && <p className="text-[0.75rem] text-rose-500 font-medium">{error}</p>}

        {/* Result */}
        {result && (
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 mt-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[0.6875rem] font-bold text-blue-600 uppercase tracking-wide">Estimate</span>
              <span className="text-[0.6875rem] text-gray-400">{result.distanceMiles.toLocaleString()} mi</span>
            </div>
            <div className="space-y-1">
              <Row label="Linehaul" value={usd.format(result.baseRate)} />
              {result.loadCharge > 0 && <Row label="Self-load" value={usd.format(result.loadCharge)} />}
              {result.unloadCharge > 0 && <Row label="Self-unload" value={usd.format(result.unloadCharge)} />}
              {result.weightSurcharge > 0 && <Row label="Heavy freight" value={usd.format(result.weightSurcharge)} />}
            </div>
            <hr className="border-blue-200 my-2" />
            <div className="flex items-center justify-between">
              <span className="text-[0.8125rem] font-semibold text-gray-900">Total</span>
              <span className="text-[1.5rem] font-bold text-blue-700 tracking-tight">
                {usd.format(result.total)}
              </span>
            </div>
            <p className="text-[0.625rem] text-gray-400 mt-1">
              {usd.format(Math.round(result.total / result.distanceMiles))}/mi · {TRUCK_TYPES.find((t) => t.id === truckType)?.label}
            </p>
          </div>
        )}

        {/* Formula explanation */}
        <p className="text-[0.625rem] text-gray-300 leading-4 mt-1">
          Pricing is based on current FL market rates per mile by equipment type,
          plus applicable surcharges for self-load/unload equipment and overweight
          freight (&gt;44,000 lbs). Distance is estimated via road-adjusted routing.
          Final quotes may vary based on availability and special requirements.
        </p>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[0.75rem] text-gray-500">{label}</span>
      <span className="text-[0.75rem] font-semibold text-gray-800">{value}</span>
    </div>
  );
}
