"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* -------------------------------------------------------------------------- */
/*  Load Calculator — forklift-equipped freight estimator                     */
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
  subtotal: number;
  total: number;
}

/* ── Truck types — all include forklift/Moffett service ─────── */

const TRUCK_TYPES = [
  {
    id: "moffett-flatbed",
    label: "Flatbed + Moffett",
    ratePerMile: 3.65,
    maxLengthFt: 48,
    maxWidthFt: 8.5,
    maxHeightFt: 8.5,
    maxWeightLbs: 48000,
    note: "Standard — most common",
  },
  {
    id: "moffett-stepdeck",
    label: "Step Deck + Moffett",
    ratePerMile: 3.90,
    maxLengthFt: 53,
    maxWidthFt: 8.5,
    maxHeightFt: 10.5,
    maxWeightLbs: 46000,
    note: "Taller loads up to 10.5 ft",
  },
  {
    id: "piggyback-flatbed",
    label: "Flatbed + Piggyback",
    ratePerMile: 3.55,
    maxLengthFt: 48,
    maxWidthFt: 8.5,
    maxHeightFt: 8.5,
    maxWeightLbs: 46000,
    note: "Self-unload at jobsite",
  },
  {
    id: "hotshot-forklift",
    label: "Hotshot + Forklift",
    ratePerMile: 2.65,
    maxLengthFt: 40,
    maxWidthFt: 8.5,
    maxHeightFt: 8.0,
    maxWeightLbs: 16500,
    note: "Small urgent loads",
  },
] as const;

type TruckId = typeof TRUCK_TYPES[number]["id"];

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

function useDebounce(value: string, ms: number) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/* ── Address Input — calls /api/geocode (server-side proxy) ─── */

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
    if (debounced.length < 3) { setSuggestions([]); setOpen(false); return; }
    let cancelled = false;
    setLoading(true);

    fetch(`/api/geocode?q=${encodeURIComponent(debounced)}`)
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
          autoComplete="off"
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

/* ── Dimension Input ─────────────────────────────────────────── */

function DimInput({ label, value, onChange, placeholder }: {
  label: string; value: string;
  onChange: (v: string) => void; placeholder: string;
}) {
  return (
    <div>
      <label className="block text-[0.625rem] font-bold text-gray-400 tracking-[0.06em] uppercase mb-1">
        {label}
      </label>
      <input
        type="number"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min="0"
        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-2 text-[0.8125rem] text-gray-900 placeholder-gray-300 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
      />
    </div>
  );
}

/* ── Main Calculator ─────────────────────────────────────────── */

export function LoadCalculator() {
  const [originText, setOriginText] = useState("");
  const [destText, setDestText] = useState("");
  const [originCoords, setOriginCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [destCoords, setDestCoords] = useState<{ lat: number; lon: number } | null>(null);

  // Dimensions (ft / lbs)
  const [lenFt, setLenFt] = useState("");
  const [widFt, setWidFt] = useState("");
  const [htFt, setHtFt] = useState("");
  const [weight, setWeight] = useState("");

  const [truckType, setTruckType] = useState<TruckId>("moffett-flatbed");
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState("");

  // Determine which truck types are compatible with entered dimensions
  const l = Number(lenFt) || 0;
  const w = Number(widFt) || 0;
  const h = Number(htFt) || 0;
  const lbs = Number(weight) || 0;

  function isCompatible(t: typeof TRUCK_TYPES[number]) {
    if (l > 0 && l > t.maxLengthFt) return false;
    if (w > 0 && w > t.maxWidthFt) return false;
    if (h > 0 && h > t.maxHeightFt) return false;
    if (lbs > 0 && lbs > t.maxWeightLbs) return false;
    return true;
  }

  const calculate = useCallback(() => {
    setError("");
    setResult(null);

    if (!originCoords || !destCoords) {
      setError("Select both pickup and delivery from the dropdown.");
      return;
    }

    const truck = TRUCK_TYPES.find((t) => t.id === truckType) ?? TRUCK_TYPES[0];
    if (!isCompatible(truck)) {
      setError("Selected equipment doesn't fit these dimensions. Pick a compatible option.");
      return;
    }

    const straightMiles = haversine(originCoords.lat, originCoords.lon, destCoords.lat, destCoords.lon);
    const distanceMiles = Math.round(straightMiles * 1.28);

    if (distanceMiles < 1) { setError("Locations are too close together."); return; }

    const linehaul = Math.max(distanceMiles * truck.ratePerMile, MINIMUM_LINEHAUL);
    const weightSurcharge = lbs > 44000 ? Math.ceil((lbs - 44000) / 1000) * 35 : 0;
    const oversizeSurcharge = (w > 8.5 || h > truck.maxHeightFt) ? 250 : 0;

    const subtotal = linehaul + weightSurcharge + oversizeSurcharge;
    const total = Math.round(subtotal * (1 + MARGIN_RATE));

    setResult({
      distanceMiles,
      baseRate: Math.round(linehaul),
      loadCharge: 0,
      unloadCharge: 0,
      weightSurcharge,
      oversizeSurcharge,
      subtotal: Math.round(subtotal),
      total,
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [originCoords, destCoords, weight, truckType, lenFt, widFt, htFt]);

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
        {/* Addresses */}
        <AddressInput
          label="Pickup"
          value={originText}
          onChange={(v) => { setOriginText(v); setOriginCoords(null); }}
          onSelect={(lat, lon, d) => { setOriginCoords({ lat, lon }); setOriginText(d); }}
          placeholder="City, ZIP, or landmark..."
        />
        <AddressInput
          label="Delivery"
          value={destText}
          onChange={(v) => { setDestText(v); setDestCoords(null); }}
          onSelect={(lat, lon, d) => { setDestCoords({ lat, lon }); setDestText(d); }}
          placeholder="City, ZIP, or landmark..."
        />

        {/* Load dimensions */}
        <div>
          <p className="text-[0.6875rem] font-bold text-gray-400 tracking-[0.07em] uppercase mb-1.5">
            Load Dimensions (ft) &amp; Weight (lbs)
          </p>
          <div className="grid grid-cols-4 gap-1.5">
            <DimInput label="Length" value={lenFt} onChange={setLenFt} placeholder="48" />
            <DimInput label="Width"  value={widFt} onChange={setWidFt} placeholder="8.5" />
            <DimInput label="Height" value={htFt}  onChange={setHtFt}  placeholder="8" />
            <DimInput label="Lbs"    value={weight} onChange={setWeight} placeholder="24000" />
          </div>
        </div>

        {/* Truck type */}
        <div>
          <label className="block text-[0.6875rem] font-bold text-gray-400 tracking-[0.07em] uppercase mb-1.5">
            Equipment
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {TRUCK_TYPES.map((t) => {
              const ok = isCompatible(t);
              const selected = truckType === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => ok && setTruckType(t.id)}
                  title={!ok ? `Exceeds limits: max ${t.maxLengthFt}ft × ${t.maxWidthFt}ft × ${t.maxHeightFt}ft / ${(t.maxWeightLbs/1000).toFixed(0)}k lbs` : t.note}
                  className={`rounded-lg border px-2 py-2 text-left transition ${
                    !ok
                      ? "border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed opacity-50"
                      : selected
                        ? "border-blue-400 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  <div className="text-[0.6875rem] font-semibold leading-tight">{t.label}</div>
                  <div className={`text-[0.5625rem] mt-0.5 ${selected ? "text-blue-500" : "text-gray-400"}`}>{t.note}</div>
                </button>
              );
            })}
          </div>
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
          <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 mt-1 text-center">
            <span className="text-[0.6875rem] font-bold text-blue-600 uppercase tracking-wide">Estimated Price</span>
            <div className="mt-1">
              <span className="text-[2rem] font-bold text-blue-700 tracking-tight">
                {usd.format(result.total)}
              </span>
            </div>
            <p className="text-[0.6875rem] text-gray-400 mt-1">
              {result.distanceMiles.toLocaleString()} mi · {usd.format(Math.round(result.total / result.distanceMiles))}/mi · {TRUCK_TYPES.find((t) => t.id === truckType)?.label}
            </p>
          </div>
        )}

        <p className="text-[0.625rem] text-gray-300 leading-4 mt-1">
          Estimates based on current FL market rates. All equipment includes on-site forklift service.
          Final quotes may vary. <a href="tel:+1-800-000-0000" className="underline">Call for exact pricing.</a>
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
