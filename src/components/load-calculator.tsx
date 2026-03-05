"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/* -------------------------------------------------------------------------- */
/*  Load Calculator – quote estimation with address autocomplete              */
/*  Light-theme Apple-inspired design to match Loadr landing page             */
/* -------------------------------------------------------------------------- */

interface AddressSuggestion {
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
  margin: number;
  total: number;
}

const TRUCK_TYPES = [
  { id: "flatbed",    label: "Flatbed",              ratePerMile: 2.85 },
  { id: "stepdeck",   label: "Step Deck",            ratePerMile: 3.15 },
  { id: "lowboy",     label: "Lowboy",               ratePerMile: 4.20 },
  { id: "moffett",    label: "Flatbed + Moffett",    ratePerMile: 3.65 },
  { id: "piggyback",  label: "Flatbed + Piggyback",  ratePerMile: 3.55 },
  { id: "hotshot",    label: "Hotshot",               ratePerMile: 2.45 },
] as const;

const MARGIN_RATE = 0.25;
const MINIMUM_LINEHAUL = 350;

/* Haversine distance (miles) */
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

/* Road factor ~1.28× for Florida */
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

/* ── Address Input with autocomplete ─────────────────────────── */

function AddressInput({
  label, value, onChange, onSelect, placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  onSelect: (s: AddressSuggestion) => void;
  placeholder: string;
}) {
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounced = useDebounce(value, 350);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (debounced.length < 3) { setSuggestions([]); return; }
    let cancelled = false;
    setLoading(true);
    fetch(
      `https://nominatim.openstreetmap.org/search?format=json&countrycodes=us&limit=5&q=${encodeURIComponent(debounced)}`,
      { headers: { "Accept-Language": "en" } },
    )
      .then((r) => r.json())
      .then((data: AddressSuggestion[]) => {
        if (!cancelled) { setSuggestions(data); setOpen(data.length > 0); setLoading(false); }
      })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [debounced]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  return (
    <div ref={wrapperRef} className="relative">
      <label className="block text-[0.6875rem] font-bold text-gray-400 tracking-[0.07em] uppercase mb-2">
        {label}
      </label>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => suggestions.length > 0 && setOpen(true)}
          placeholder={placeholder}
          className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-[0.875rem] text-gray-900 placeholder-gray-300 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-200 border-t-blue-500" />
          </div>
        )}
      </div>
      {open && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-1 w-full rounded-xl border border-gray-200 bg-white shadow-xl overflow-hidden">
          {suggestions.map((s) => (
            <li key={s.place_id}>
              <button
                type="button"
                className="w-full px-4 py-3 text-left text-[0.8125rem] text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition"
                onClick={() => { onChange(s.display_name); onSelect(s); setOpen(false); }}
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
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [height, setHeight] = useState("");
  const [pieces, setPieces] = useState("1");
  const [weight, setWeight] = useState("");
  const [truckType, setTruckType] = useState("flatbed");
  const [result, setResult] = useState<CalcResult | null>(null);
  const [error, setError] = useState("");

  const calculate = useCallback(() => {
    setError("");
    setResult(null);

    if (!originCoords || !destCoords) {
      setError("Please select both origin and destination from the suggestions.");
      return;
    }

    const straightMiles = haversine(originCoords.lat, originCoords.lon, destCoords.lat, destCoords.lon);
    const distanceMiles = estimateRoadMiles(straightMiles);

    if (distanceMiles < 1) { setError("Origin and destination are too close together."); return; }

    const truck = TRUCK_TYPES.find((t) => t.id === truckType) ?? TRUCK_TYPES[0];
    const linehaul = Math.max(distanceMiles * truck.ratePerMile, MINIMUM_LINEHAUL);

    const loadCharge = selfLoad ? 185 : 0;
    const unloadCharge = selfUnload ? 185 : 0;

    const w = Number(weight) || 0;
    const weightSurcharge = w > 44000 ? Math.ceil((w - 44000) / 1000) * 35 : 0;

    const l = Number(length) || 0;
    const wi = Number(width) || 0;
    const h = Number(height) || 0;
    let oversizeSurcharge = 0;
    if (l > 48) oversizeSurcharge += 150;
    if (wi > 8.5) oversizeSurcharge += 100;
    if (h > 8.5) oversizeSurcharge += 100;

    const p = Math.max(1, Number(pieces) || 1);
    const pieceSurcharge = p > 1 ? (p - 1) * 45 : 0;

    const subtotal = linehaul + loadCharge + unloadCharge + weightSurcharge + oversizeSurcharge + pieceSurcharge;
    const margin = Math.round(subtotal * MARGIN_RATE);
    const total = subtotal + margin;

    setResult({
      distanceMiles,
      baseRate: Math.round(linehaul),
      loadCharge, unloadCharge, weightSurcharge, oversizeSurcharge, pieceSurcharge,
      subtotal: Math.round(subtotal),
      margin,
      total: Math.round(total),
    });
  }, [originCoords, destCoords, selfLoad, selfUnload, length, width, height, pieces, weight, truckType]);

  const usd = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-6 md:p-8 shadow-[0_4px_20px_rgba(0,0,0,0.06)]">
      <div className="text-[0.6875rem] font-bold text-gray-400 tracking-[0.07em] uppercase mb-1">
        Quote Estimator
      </div>
      <h2 className="text-[1.5rem] font-bold text-gray-900 tracking-tight mb-2">
        Load Calculator
      </h2>
      <p className="text-[0.875rem] text-gray-500 leading-relaxed mb-8 max-w-2xl">
        Get an instant freight quote estimate. Enter addresses, load details, and equipment type.
      </p>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* ── Left: inputs ── */}
        <div className="space-y-5">
          <AddressInput
            label="Origin"
            value={originText}
            onChange={setOriginText}
            onSelect={(s) => setOriginCoords({ lat: Number(s.lat), lon: Number(s.lon) })}
            placeholder="Start typing an address..."
          />
          <AddressInput
            label="Destination"
            value={destText}
            onChange={setDestText}
            onSelect={(s) => setDestCoords({ lat: Number(s.lat), lon: Number(s.lon) })}
            placeholder="Start typing an address..."
          />

          {/* Truck type */}
          <div>
            <label className="block text-[0.6875rem] font-bold text-gray-400 tracking-[0.07em] uppercase mb-2">
              Truck Type
            </label>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {TRUCK_TYPES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTruckType(t.id)}
                  className={`rounded-xl border px-3 py-2.5 text-[0.8125rem] font-medium transition ${
                    truckType === t.id
                      ? "border-blue-400 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Load / Unload toggles */}
          <div className="grid grid-cols-2 gap-3">
            <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 cursor-pointer transition hover:bg-gray-50">
              <input type="checkbox" checked={selfLoad} onChange={(e) => setSelfLoad(e.target.checked)} className="accent-blue-600 h-4 w-4" />
              <div>
                <p className="text-[0.8125rem] font-semibold text-gray-900">Self-Load</p>
                <p className="text-[0.6875rem] text-gray-400">Truck loads itself</p>
              </div>
            </label>
            <label className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 cursor-pointer transition hover:bg-gray-50">
              <input type="checkbox" checked={selfUnload} onChange={(e) => setSelfUnload(e.target.checked)} className="accent-blue-600 h-4 w-4" />
              <div>
                <p className="text-[0.8125rem] font-semibold text-gray-900">Self-Unload</p>
                <p className="text-[0.6875rem] text-gray-400">Truck unloads itself</p>
              </div>
            </label>
          </div>

          {/* Dimensions */}
          <div>
            <label className="block text-[0.6875rem] font-bold text-gray-400 tracking-[0.07em] uppercase mb-2">
              Dimensions (ft)
            </label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { val: length, set: setLength, ph: "Length" },
                { val: width,  set: setWidth,  ph: "Width"  },
                { val: height, set: setHeight, ph: "Height" },
              ].map(({ val, set, ph }) => (
                <input
                  key={ph}
                  type="number"
                  value={val}
                  onChange={(e) => set(e.target.value)}
                  placeholder={ph}
                  min="0"
                  className="rounded-xl border border-gray-200 bg-white px-3 py-3 text-[0.875rem] text-gray-900 placeholder-gray-300 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                />
              ))}
            </div>
          </div>

          {/* Pieces + Weight */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[0.6875rem] font-bold text-gray-400 tracking-[0.07em] uppercase mb-2">
                Pieces / Bundles
              </label>
              <input type="number" value={pieces} onChange={(e) => setPieces(e.target.value)} placeholder="1" min="1"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-[0.875rem] text-gray-900 placeholder-gray-300 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
            <div>
              <label className="block text-[0.6875rem] font-bold text-gray-400 tracking-[0.07em] uppercase mb-2">
                Weight (lbs)
              </label>
              <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 24000" min="0"
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-[0.875rem] text-gray-900 placeholder-gray-300 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100" />
            </div>
          </div>

          {/* Calculate */}
          <button
            type="button"
            onClick={calculate}
            className="w-full rounded-full bg-gray-900 py-3.5 text-[0.875rem] font-semibold text-white transition hover:bg-gray-700 active:scale-[0.98]"
          >
            Calculate Quote
          </button>

          {error && <p className="text-[0.8125rem] text-rose-500 font-medium">{error}</p>}
        </div>

        {/* ── Right: result ── */}
        <div className="flex flex-col">
          {result ? (
            <div className="rounded-2xl border border-blue-100 bg-blue-50/50 p-6 flex-1">
              <div className="text-[0.6875rem] font-bold text-blue-600 tracking-[0.07em] uppercase mb-4">
                Quote Estimate
              </div>

              <div className="space-y-2.5">
                <Row label="Distance" value={`${result.distanceMiles.toLocaleString()} miles`} />
                <Row label="Base linehaul" value={usd.format(result.baseRate)} />
                {result.loadCharge > 0 && <Row label="Self-load charge" value={usd.format(result.loadCharge)} />}
                {result.unloadCharge > 0 && <Row label="Self-unload charge" value={usd.format(result.unloadCharge)} />}
                {result.weightSurcharge > 0 && <Row label="Overweight surcharge" value={usd.format(result.weightSurcharge)} />}
                {result.oversizeSurcharge > 0 && <Row label="Oversize surcharge" value={usd.format(result.oversizeSurcharge)} />}
                {result.pieceSurcharge > 0 && <Row label="Multi-piece handling" value={usd.format(result.pieceSurcharge)} />}

                <hr className="border-gray-200" />
                <Row label="Carrier cost" value={usd.format(result.subtotal)} muted />
                <Row label="Service fee (25%)" value={usd.format(result.margin)} muted />
                <hr className="border-blue-200" />

                <div className="flex items-center justify-between pt-1">
                  <span className="text-[0.9375rem] font-semibold text-gray-900">Total Quote</span>
                  <span className="text-[2rem] font-bold text-blue-700 tracking-tight">
                    {usd.format(result.total)}
                  </span>
                </div>
                <p className="text-[0.75rem] text-gray-400">
                  Rate: {usd.format(Math.round(result.total / result.distanceMiles))}/mile · Truck: {TRUCK_TYPES.find((t) => t.id === truckType)?.label}
                </p>
              </div>

              <p className="mt-6 text-[0.75rem] text-gray-400 leading-5">
                This is an estimate based on current market rates. Final pricing may vary based on availability, exact route, and special requirements.
              </p>
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-100 bg-gray-50 p-6 flex-1 flex items-center justify-center min-h-[280px]">
              <div className="text-center">
                <p className="text-[0.875rem] text-gray-400">
                  Fill in the load details and click <span className="font-semibold text-gray-900">Calculate Quote</span> to get an instant estimate.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, muted = false }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className={`text-[0.8125rem] ${muted ? "text-gray-400" : "text-gray-600"}`}>{label}</span>
      <span className={`text-[0.8125rem] font-semibold ${muted ? "text-gray-400" : "text-gray-900"}`}>{value}</span>
    </div>
  );
}
