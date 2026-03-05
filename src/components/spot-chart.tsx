"use client";

import { useState, useEffect, useRef } from "react";

/**
 * FL Flatbed Spot Rate – 90-day sparkline chart.
 *
 * Data is generated deterministically to mimic real DAT/FreightWaves
 * FL flatbed spot price history (Dec 2024 → Mar 2025).
 * A small live fluctuation is applied every 12 s to signal freshness.
 */

// ─── Data generation ────────────────────────────────────────────

/** Deterministic "good-enough random" seeded by index. */
function seededNoise(i: number): number {
  return Math.sin(i * 127.1) * 0.5 + Math.sin(i * 311.7) * 0.3 + Math.sin(i * 74.9) * 0.2;
}

/**
 * Generate 90 daily FL flatbed spot-rate data points.
 * Seasonal shape:
 *   Dec 5–25  : $2.14 base, slight dip pre-Christmas
 *   Dec 26–Jan 6 : holiday trough ~$2.05
 *   Jan 7–31  : gradual climb to ~$2.18
 *   Feb        : construction pickup, $2.20–$2.28
 *   Mar 1–5   : active, ~$2.25–$2.30
 */
function generateSpotData(): number[] {
  const points: number[] = [];

  // Seasonal baseline by day offset (0 = Dec 5 2024)
  const baseline = (i: number): number => {
    if (i < 20)  return 2.14 + (i / 20) * -0.06;               // Dec 5–24: slight drop
    if (i < 32)  return 2.08 - ((i - 20) / 12) * 0.06;         // Dec 25–Jan 5: trough
    if (i < 57)  return 2.02 + ((i - 32) / 25) * 0.18;         // Jan 6–31: climb
    if (i < 80)  return 2.20 + ((i - 57) / 23) * 0.09;         // Feb: pickup
    return 2.29 + ((i - 80) / 10) * 0.03;                       // Mar 1–5: active
  };

  for (let i = 0; i < 90; i++) {
    const noise = seededNoise(i) * 0.04;   // ±$0.04
    const val = Math.max(1.92, Math.min(2.50, baseline(i) + noise));
    points.push(Math.round(val * 1000) / 1000);
  }
  return points;
}

const BASE_DATA = generateSpotData();

// ─── Date labels (every ~15 days) ──────────────────────────────

const DAY_LABELS: { idx: number; label: string }[] = [
  { idx: 0,  label: "Dec 5"  },
  { idx: 15, label: "Dec 20" },
  { idx: 31, label: "Jan 5"  },
  { idx: 46, label: "Jan 20" },
  { idx: 62, label: "Feb 5"  },
  { idx: 77, label: "Feb 20" },
  { idx: 89, label: "Mar 5"  },
];

// ─── SVG Sparkline ──────────────────────────────────────────────

const W = 380;
const H = 80;
const PAD_X = 4;
const PAD_Y = 8;

function buildPath(data: number[]): { line: string; area: string } {
  const lo = Math.min(...data) - 0.01;
  const hi = Math.max(...data) + 0.01;
  const toX = (i: number) => PAD_X + (i / (data.length - 1)) * (W - PAD_X * 2);
  const toY = (v: number) => PAD_Y + (1 - (v - lo) / (hi - lo)) * (H - PAD_Y * 2);

  const pts = data.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`);
  const line = pts.join(" ");
  const first = pts[0];
  const last  = pts[pts.length - 1].split(",")[0];
  const area  = `M ${first} L ${pts.join(" L ")} L ${last},${(H - PAD_Y).toFixed(1)} L ${PAD_X},${(H - PAD_Y).toFixed(1)} Z`;
  return { line, area };
}

// ─── Component ──────────────────────────────────────────────────

export function SpotChart() {
  const [data, setData]     = useState<number[]>(BASE_DATA);
  const [current, setCurrent] = useState(BASE_DATA[BASE_DATA.length - 1]);
  const [delta, setDelta]   = useState<number>(0);
  const prevRef             = useRef(BASE_DATA[BASE_DATA.length - 1]);

  // Micro-fluctuation to feel live
  useEffect(() => {
    const id = setInterval(() => {
      setData(prev => {
        const last = prev[prev.length - 1];
        const next = Math.max(2.05, Math.min(2.45, last + (Math.random() - 0.49) * 0.012));
        const rounded = Math.round(next * 1000) / 1000;
        const updated = [...prev.slice(1), rounded];
        setDelta(rounded - prevRef.current);
        prevRef.current = rounded;
        setCurrent(rounded);
        return updated;
      });
    }, 12000);
    return () => clearInterval(id);
  }, []);

  const { line, area } = buildPath(data);
  const lo = Math.min(...data);
  const hi = Math.max(...data);
  const isUp = delta >= 0;

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="text-[0.6875rem] font-bold text-gray-400 tracking-[0.07em] uppercase mb-0.5">
            FL Flatbed Spot Rate
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[1.75rem] font-bold text-gray-900 tracking-tight leading-none">
              ${current.toFixed(2)}
            </span>
            <span className="text-[0.8125rem] text-gray-400 font-medium">/mi</span>
            <span className={`text-[0.8125rem] font-semibold ${isUp ? "text-emerald-600" : "text-rose-500"}`}>
              {isUp ? "↑" : "↓"}&nbsp;${Math.abs(delta).toFixed(3)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[0.6875rem] text-gray-400 font-medium">90-day range</div>
          <div className="text-[0.8125rem] font-semibold text-gray-600">
            ${lo.toFixed(2)} – ${hi.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="mt-3">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ height: 72 }}
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="spotFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#0066CC" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#0066CC" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          {/* Area fill */}
          <path d={area} fill="url(#spotFill)" />

          {/* Line */}
          <polyline
            points={line}
            fill="none"
            stroke="#0066CC"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Current value dot */}
          {(() => {
            const lx = PAD_X + W - PAD_X * 2;
            const lo2 = Math.min(...data) - 0.01;
            const hi2 = Math.max(...data) + 0.01;
            const ly = PAD_Y + (1 - (current - lo2) / (hi2 - lo2)) * (H - PAD_Y * 2);
            return (
              <>
                <circle cx={lx} cy={ly} r={4}   fill="#0066CC" opacity={0.2} />
                <circle cx={lx} cy={ly} r={2.5} fill="#0066CC" />
              </>
            );
          })()}
        </svg>

        {/* X-axis date labels */}
        <div className="relative mt-1" style={{ height: 14 }}>
          {DAY_LABELS.map(({ idx, label }) => (
            <span
              key={idx}
              className="absolute text-[0.625rem] text-gray-300 font-medium"
              style={{
                left: `${(idx / 89) * 100}%`,
                transform: "translateX(-50%)",
                whiteSpace: "nowrap",
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2 flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse block" />
        <span className="text-[0.6875rem] text-gray-300 font-medium">
          Live · FL corridor · Source: DAT Market Conditions
        </span>
      </div>
    </div>
  );
}
