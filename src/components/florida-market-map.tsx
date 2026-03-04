"use client";

import type { Company } from "@/types/freight";

const FLORIDA_BOUNDS = {
  minLat: 24.3,
  maxLat: 31.1,
  minLng: -87.7,
  maxLng: -80.0,
};

function markerPosition(lat: number, lng: number) {
  const x =
    ((lng - FLORIDA_BOUNDS.minLng) /
      (FLORIDA_BOUNDS.maxLng - FLORIDA_BOUNDS.minLng)) *
    100;
  const y =
    (1 -
      (lat - FLORIDA_BOUNDS.minLat) /
        (FLORIDA_BOUNDS.maxLat - FLORIDA_BOUNDS.minLat)) *
    100;

  return {
    left: `${Math.max(6, Math.min(94, x))}%`,
    top: `${Math.max(8, Math.min(92, y))}%`,
  };
}

export function FloridaMarketMap({
  companies,
  selectedId,
  onSelect,
}: {
  companies: Company[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="relative overflow-hidden rounded-[2rem] border border-white/60 bg-[linear-gradient(160deg,rgba(10,38,53,0.98),rgba(4,14,27,0.96))] p-6 shadow-[0_30px_90px_rgba(7,17,29,0.28)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-100/70">
            Florida Coverage
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-white">
            Carrier + shipper map
          </h3>
        </div>
        <div className="flex gap-3 text-xs text-white/75">
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-cyan-300" />
            Carriers
          </span>
          <span className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
            Shippers
          </span>
        </div>
      </div>

      <div className="relative min-h-[440px] rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.12),transparent_36%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))]">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:48px_48px] opacity-40" />
        <div className="florida-shape absolute inset-[8%_8%_7%_6%] rounded-[2rem] bg-[linear-gradient(180deg,rgba(15,118,110,0.42),rgba(8,47,73,0.82))] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08),0_0_80px_rgba(34,211,238,0.16)]" />

        {["Pensacola", "Jacksonville", "Orlando", "Tampa", "Miami"].map(
          (city) => {
            const cityLabelPosition: Record<
              string,
              { left: string; top: string }
            > = {
              Pensacola: { left: "13%", top: "18%" },
              Jacksonville: { left: "76%", top: "11%" },
              Orlando: { left: "61%", top: "39%" },
              Tampa: { left: "45%", top: "49%" },
              Miami: { left: "77%", top: "83%" },
            };

            return (
              <span
                key={city}
                className="absolute text-[11px] uppercase tracking-[0.28em] text-white/45"
                style={cityLabelPosition[city]}
              >
                {city}
              </span>
            );
          },
        )}

        {companies.map((company) => {
          const selected = company.id === selectedId;

          return (
            <button
              key={company.id}
              type="button"
              onClick={() => onSelect(company.id)}
              className="group absolute -translate-x-1/2 -translate-y-1/2"
              style={markerPosition(company.lat, company.lng)}
              aria-label={company.name}
            >
              <span
                className={`absolute inset-0 rounded-full blur-md transition ${
                  company.kind === "carrier"
                    ? "bg-cyan-300/45"
                    : "bg-amber-200/45"
                } ${selected ? "scale-[2.4]" : "scale-[1.7] opacity-65 group-hover:scale-[2.1]"}`}
              />
              <span
                className={`relative flex h-4 w-4 items-center justify-center rounded-full border ${
                  company.kind === "carrier"
                    ? "border-cyan-50 bg-cyan-300"
                    : "border-amber-50 bg-amber-300"
                } ${selected ? "scale-125" : "group-hover:scale-110"}`}
              >
                <span className="h-1.5 w-1.5 rounded-full bg-slate-950" />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
