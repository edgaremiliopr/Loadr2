"use client";

import { geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import statesAtlas from "us-atlas/states-10m.json";
import { feature } from "topojson-client";
import type { Topology } from "topojson-specification";

import type { Company } from "@/types/freight";

const VIEWBOX_WIDTH = 920;
const VIEWBOX_HEIGHT = 660;
const FLORIDA_ID = 12;

type AtlasGeometry = Topology["objects"][string];

const atlas = statesAtlas as unknown as Topology<Record<string, AtlasGeometry>>;
const stateFeatures = feature(
  atlas,
  atlas.objects.states,
) as FeatureCollection<Geometry>;

const florida = stateFeatures.features.find(
  (state) => Number(state.id) === FLORIDA_ID,
) as Feature<Geometry>;

const projection = geoMercator().fitExtent(
  [
    [84, 44],
    [VIEWBOX_WIDTH - 74, VIEWBOX_HEIGHT - 54],
  ],
  florida,
);

const floridaPath = geoPath(projection)(florida) ?? "";

const cityLabels = [
  { name: "Pensacola", lat: 30.4213, lng: -87.2169 },
  { name: "Jacksonville", lat: 30.3322, lng: -81.6557 },
  { name: "Orlando", lat: 28.5383, lng: -81.3792 },
  { name: "Tampa", lat: 27.9506, lng: -82.4572 },
  { name: "Miami", lat: 25.7617, lng: -80.1918 },
];

function projectPoint(lat: number, lng: number) {
  const projected = projection([lng, lat]);

  if (!projected) {
    return { x: 0, y: 0 };
  }

  return { x: projected[0], y: projected[1] };
}

function markerTone(kind: Company["kind"]) {
  return kind === "carrier"
    ? {
        fill: "#67e8f9",
        ring: "rgba(103, 232, 249, 0.28)",
        stroke: "#e0f2fe",
      }
    : {
        fill: "#facc15",
        ring: "rgba(250, 204, 21, 0.25)",
        stroke: "#fef3c7",
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
    <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(8,20,36,0.94),rgba(5,13,24,0.98))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.34)]">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.35em] text-cyan-200/60">
            Florida Coverage
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-slate-100">
            Carrier + shipper map
          </h3>
          <p className="mt-2 text-sm text-slate-400">
            Real Florida outline with lat/lng-based company markers.
          </p>
        </div>

        <div className="flex gap-4 text-xs text-white/75">
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

      <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.10),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))]">
        <svg
          viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
          className="h-full w-full"
          aria-label="Florida market map"
        >
          <defs>
            <linearGradient id="waterGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(34,211,238,0.12)" />
              <stop offset="100%" stopColor="rgba(15,23,42,0.02)" />
            </linearGradient>
            <linearGradient id="stateFill" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(16,185,129,0.22)" />
              <stop offset="70%" stopColor="rgba(8,145,178,0.30)" />
              <stop offset="100%" stopColor="rgba(14,116,144,0.38)" />
            </linearGradient>
            <filter id="stateShadow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow
                dx="0"
                dy="20"
                stdDeviation="24"
                floodColor="rgba(6,182,212,0.18)"
              />
            </filter>
          </defs>

          <rect
            x="0"
            y="0"
            width={VIEWBOX_WIDTH}
            height={VIEWBOX_HEIGHT}
            fill="url(#waterGlow)"
          />

          {Array.from({ length: 11 }).map((_, index) => (
            <line
              key={`v-${index}`}
              x1={70 + index * 78}
              y1="0"
              x2={70 + index * 78}
              y2={VIEWBOX_HEIGHT}
              stroke="rgba(255,255,255,0.045)"
            />
          ))}
          {Array.from({ length: 8 }).map((_, index) => (
            <line
              key={`h-${index}`}
              x1="0"
              y1={72 + index * 84}
              x2={VIEWBOX_WIDTH}
              y2={72 + index * 84}
              stroke="rgba(255,255,255,0.045)"
            />
          ))}

          <path
            d={floridaPath}
            fill="url(#stateFill)"
            stroke="rgba(180, 244, 255, 0.18)"
            strokeWidth="1.4"
            filter="url(#stateShadow)"
          />

          <text
            x={118}
            y={VIEWBOX_HEIGHT - 84}
            fill="rgba(148,163,184,0.4)"
            fontSize="18"
            letterSpacing="0.42em"
          >
            Gulf of Mexico
          </text>
          <text
            x={VIEWBOX_WIDTH - 228}
            y={VIEWBOX_HEIGHT - 116}
            fill="rgba(148,163,184,0.38)"
            fontSize="18"
            letterSpacing="0.42em"
          >
            Atlantic Ocean
          </text>

          {cityLabels.map((city) => {
            const point = projectPoint(city.lat, city.lng);

            return (
              <g key={city.name}>
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="3"
                  fill="rgba(255,255,255,0.44)"
                />
                <text
                  x={point.x + 10}
                  y={point.y - 10}
                  fill="rgba(203,213,225,0.58)"
                  fontSize="12"
                  letterSpacing="0.28em"
                >
                  {city.name.toUpperCase()}
                </text>
              </g>
            );
          })}

          {companies.map((company) => {
            const point = projectPoint(company.lat, company.lng);
            const tone = markerTone(company.kind);
            const selected = company.id === selectedId;

            return (
              <g
                key={company.id}
                role="button"
                tabIndex={0}
                aria-label={company.name}
                className="cursor-pointer outline-none"
                onClick={() => onSelect(company.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelect(company.id);
                  }
                }}
              >
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={selected ? 24 : 18}
                  fill={tone.ring}
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={selected ? 10 : 8}
                  fill={tone.fill}
                  stroke={tone.stroke}
                  strokeWidth={selected ? 3 : 2.5}
                />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r="3.2"
                  fill="#020617"
                />
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
