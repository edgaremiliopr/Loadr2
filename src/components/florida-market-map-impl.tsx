"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Circle,
  CircleMarker,
  MapContainer,
  Polygon,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";

import type { Company } from "@/types/freight";

const FLORIDA_CENTER: [number, number] = [27.8, -81.7];
const FLORIDA_BOUNDS: [[number, number], [number, number]] = [
  [24.3, -87.8],
  [31.2, -79.7],
];

const coveragePointsByLabel: Record<string, [number, number]> = {
  florida: [27.8, -81.7],
  "florida statewide": [27.8, -81.7],
  statewide: [27.8, -81.7],
  "south florida": [26.1, -80.3],
  "central florida": [28.3, -81.7],
  "west florida": [27.95, -82.55],
  "north florida": [30.35, -82.35],
  panhandle: [30.45, -86.35],
  tampa: [27.9506, -82.4572],
  "tampa bay": [27.95, -82.53],
  "st. petersburg": [27.7676, -82.6403],
  clearwater: [27.9659, -82.8001],
  largo: [27.9095, -82.7873],
  sarasota: [27.3364, -82.5307],
  palmetto: [27.5214, -82.5723],
  miami: [25.7617, -80.1918],
  doral: [25.8195, -80.3553],
  hialeah: [25.8576, -80.2781],
  medley: [25.8407, -80.3264],
  "fort myers": [26.6406, -81.8723],
  naples: [26.142, -81.7948],
  "north fort myers": [26.6673, -81.8801],
  jacksonville: [30.3322, -81.6557],
  orlando: [28.5383, -81.3792],
  apopka: [28.6934, -81.5322],
  kissimmee: [28.2919, -81.4076],
  longwood: [28.7031, -81.3384],
  "lake mary": [28.7589, -81.3178],
  "st. augustine": [29.9012, -81.3124],
  ocala: [29.1872, -82.1401],
  "west palm beach": [26.7153, -80.0534],
  "palm beach": [26.7056, -80.0364],
  "boynton beach": [26.5318, -80.0905],
  "riviera beach": [26.7753, -80.0581],
  yulee: [30.6319, -81.6065],
  "orange county": [28.4845, -81.2519],
  orange: [28.4845, -81.2519],
  seminole: [28.71, -81.23],
  marion: [29.2103, -82.0569],
  osceola: [28.059, -81.1393],
  lake: [28.7616, -81.7112],
  volusia: [29.0275, -81.0755],
  polk: [27.9438, -81.6974],
  brevard: [28.2639, -80.7214],
};

function normalizeCoverageLabel(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();
}

function companyStyle(kind: Company["kind"], selected: boolean) {
  if (kind === "carrier") {
    return {
      radius: selected ? 10 : 7,
      fillColor: "#0066CC",
      color: selected ? "#003d7a" : "#4d94db",
      weight: selected ? 3 : 2,
      fillOpacity: selected ? 0.95 : 0.82,
    };
  }

  return {
    radius: selected ? 10 : 7,
    fillColor: "#D97706",
    color: selected ? "#92400e" : "#f59e0b",
    weight: selected ? 3 : 2,
    fillOpacity: selected ? 0.93 : 0.8,
  };
}

function inferCoverageRadiusMeters(coverage: string[]) {
  const text = coverage.join(" ").toLowerCase();
  const miles = text.match(/(\d+)\s*(?:-|to|–)?\s*mile/);
  if (miles) {
    return Number(miles[1]) * 1609.34;
  }

  if (text.includes("statewide") || text.includes("all florida")) {
    return 320000;
  }

  if (
    text.includes("south florida") ||
    text.includes("central florida") ||
    text.includes("west florida") ||
    text.includes("north florida") ||
    text.includes("panhandle")
  ) {
    return 170000;
  }

  if (coverage.length >= 6) {
    return 130000;
  }

  return 85000;
}

function dedupePoints(points: [number, number][]) {
  const unique = new Map<string, [number, number]>();
  for (const point of points) {
    const key = `${point[0].toFixed(4)}:${point[1].toFixed(4)}`;
    unique.set(key, point);
  }
  return [...unique.values()];
}

function resolveCoveragePoints(coverage: string[]) {
  const points: [number, number][] = [];

  for (const entry of coverage) {
    const segments = entry.split(/[;,/]/g).map((segment) => normalizeCoverageLabel(segment));
    for (const segment of segments) {
      if (!segment) {
        continue;
      }

      const direct = coveragePointsByLabel[segment];
      if (direct) {
        points.push(direct);
        continue;
      }

      for (const [label, coords] of Object.entries(coveragePointsByLabel)) {
        if (label.length >= 5 && segment.includes(label)) {
          points.push(coords);
        }
      }
    }
  }

  return dedupePoints(points);
}

function cross(o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

function convexHull(points: [number, number][]) {
  if (points.length < 3) {
    return points;
  }

  const sorted = [...points]
    .map(([lat, lng]) => ({ x: lng, y: lat }))
    .sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));

  const lower: { x: number; y: number }[] = [];
  for (const point of sorted) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) {
      lower.pop();
    }
    lower.push(point);
  }

  const upper: { x: number; y: number }[] = [];
  for (let index = sorted.length - 1; index >= 0; index -= 1) {
    const point = sorted[index];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) {
      upper.pop();
    }
    upper.push(point);
  }

  const full = [...lower.slice(0, -1), ...upper.slice(0, -1)];
  return full.map((point) => [point.y, point.x] as [number, number]);
}

type CoverageShape =
  | { type: "polygon"; points: [number, number][] }
  | { type: "circle"; center: [number, number]; radius: number };

function coverageShapeForCompany(company: Company): CoverageShape {
  const points = resolveCoveragePoints(company.coverage);

  if (points.length >= 3) {
    return { type: "polygon", points: convexHull(points) };
  }

  return {
    type: "circle",
    center: [company.lat, company.lng],
    radius: inferCoverageRadiusMeters(company.coverage),
  };
}

function FitMapToMarkers({ points }: { points: [number, number][] }) {
  const map = useMap();
  const signature = useMemo(
    () => points.map(([lat, lng]) => `${lat.toFixed(4)}:${lng.toFixed(4)}`).join("|"),
    [points],
  );

  useEffect(() => {
    if (points.length === 0) {
      map.setView(FLORIDA_CENTER, 6);
      return;
    }

    if (points.length === 1) {
      map.setView(points[0], 9);
      return;
    }

    map.fitBounds(points, { padding: [44, 44], maxZoom: 9 });
  }, [map, signature, points]);

  return null;
}

function ClearCoverageOnMapClick({ onClear }: { onClear: () => void }) {
  useMapEvents({
    click: () => {
      onClear();
    },
  });

  return null;
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
  const [showCarriers, setShowCarriers] = useState(true);
  const [showShippers, setShowShippers] = useState(true);
  const [activeCarrierCoverageId, setActiveCarrierCoverageId] = useState<string | null>(null);

  const mapCompanies = useMemo(() => {
    return companies.filter((company) => {
      if (company.kind === "carrier" && showCarriers) {
        return true;
      }

      if (company.kind === "shipper" && showShippers) {
        return true;
      }

      return false;
    });
  }, [companies, showCarriers, showShippers]);

  const markerCompanies = useMemo(() => {
    const sorted = [...mapCompanies].sort((left, right) => {
      if (left.kind === right.kind) {
        return 0;
      }

      return left.kind === "shipper" ? -1 : 1;
    });

    const seen = new Map<string, number>();

    return sorted.map((company) => {
      const key = `${company.lat.toFixed(5)}:${company.lng.toFixed(5)}`;
      const overlapIndex = seen.get(key) ?? 0;
      seen.set(key, overlapIndex + 1);

      if (overlapIndex === 0) {
        return {
          company,
          markerLat: company.lat,
          markerLng: company.lng,
        };
      }

      const ring = Math.ceil(overlapIndex / 6);
      const angleDeg = (overlapIndex % 6) * 60;
      const angle = (angleDeg * Math.PI) / 180;
      const delta = 0.012 * ring;

      return {
        company,
        markerLat: company.lat + Math.sin(angle) * delta,
        markerLng: company.lng + Math.cos(angle) * delta,
      };
    });
  }, [mapCompanies]);

  const markerPoints = useMemo<[number, number][]>(
    () => markerCompanies.map((item) => [item.markerLat, item.markerLng]),
    [markerCompanies],
  );

  const selectedCarrier = companies.find(
    (company) => company.id === activeCarrierCoverageId && company.kind === "carrier",
  );
  const selectedCoverage =
    selectedCarrier && showCarriers
      ? coverageShapeForCompany(selectedCarrier)
      : null;

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setShowCarriers((value) => !value)}
            className={`rounded-full border px-3 py-1.5 font-medium transition ${
              showCarriers
                ? "border-blue-400 bg-blue-50 text-blue-700"
                : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"
            }`}
          >
            Carriers
          </button>
          <button
            type="button"
            onClick={() => setShowShippers((value) => !value)}
            className={`rounded-full border px-3 py-1.5 font-medium transition ${
              showShippers
                ? "border-amber-400 bg-amber-50 text-amber-700"
                : "border-gray-200 bg-white text-gray-400 hover:border-gray-300"
            }`}
          >
            Shippers
          </button>
          <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-gray-500 font-medium">
            {mapCompanies.length} visible
          </span>
        </div>
      </div>

      <div className="overflow-hidden">
        <MapContainer
          center={FLORIDA_CENTER}
          zoom={6}
          minZoom={5}
          maxZoom={13}
          maxBounds={FLORIDA_BOUNDS}
          scrollWheelZoom
          className="h-[calc(100vh-200px)] min-h-[500px] w-full"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; CARTO'
          />

          <ClearCoverageOnMapClick onClear={() => setActiveCarrierCoverageId(null)} />
          <FitMapToMarkers points={markerPoints} />

          {selectedCoverage?.type === "polygon" ? (
            <Polygon
              positions={selectedCoverage.points}
              pathOptions={{
                color: "#0066CC",
                fillColor: "#0066CC",
                fillOpacity: 0.16,
                weight: 2,
                dashArray: "6 6",
              }}
            />
          ) : null}

          {selectedCoverage?.type === "circle" ? (
            <Circle
              center={selectedCoverage.center}
              radius={selectedCoverage.radius}
              pathOptions={{
                color: "#0066CC",
                fillColor: "#0066CC",
                fillOpacity: 0.14,
                weight: 2,
                dashArray: "6 6",
              }}
            />
          ) : null}

          {markerCompanies.map(({ company, markerLat, markerLng }) => (
            <CircleMarker
              key={company.id}
              center={[markerLat, markerLng]}
              pathOptions={companyStyle(company.kind, company.id === selectedId)}
              bubblingMouseEvents={false}
              eventHandlers={{
                click: () => {
                  onSelect(company.id);
                  setActiveCarrierCoverageId(
                    company.kind === "carrier" ? company.id : null,
                  );
                },
              }}
            >
              <Popup>
                <div className="space-y-1 text-xs">
                  <p className="font-semibold">{company.name}</p>
                  <p>{company.kind.toUpperCase()}</p>
                  <p>{company.address}</p>
                  <p>{company.city}</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
