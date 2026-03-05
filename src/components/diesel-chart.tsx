"use client";

/**
 * US Avg Diesel Price – 90-day sparkline chart.
 * Matches the SpotChart visual style (light theme, Apple-inspired).
 * Static data — no live fluctuation.
 */

/* ── Data: EIA-style weekly diesel prices, last ~90 days ─────── */

/** Deterministic seasonal noise. */
function seededNoise(i: number): number {
  return Math.sin(i * 113.3) * 0.4 + Math.sin(i * 271.9) * 0.35 + Math.sin(i * 67.1) * 0.25;
}

function generateDieselData(): number[] {
  const points: number[] = [];
  const baseline = (i: number): number => {
    if (i < 15) return 3.72 + (i / 15) * -0.04;        // Dec early: slight dip
    if (i < 30) return 3.68 - ((i - 15) / 15) * 0.06;  // Dec late: holiday drop
    if (i < 55) return 3.62 + ((i - 30) / 25) * 0.04;  // Jan: stable-to-slight-rise
    if (i < 75) return 3.66 - ((i - 55) / 20) * 0.08;  // Feb: seasonal decline
    return 3.58 - ((i - 75) / 15) * 0.04;               // Mar: continued easing
  };
  for (let i = 0; i < 90; i++) {
    const noise = seededNoise(i) * 0.025;
    const val = Math.max(3.35, Math.min(3.85, baseline(i) + noise));
    points.push(Math.round(val * 1000) / 1000);
  }
  return points;
}

const DATA = generateDieselData();

const DAY_LABELS: { idx: number; label: string }[] = [
  { idx: 0,  label: "Dec 5"  },
  { idx: 15, label: "Dec 20" },
  { idx: 31, label: "Jan 5"  },
  { idx: 46, label: "Jan 20" },
  { idx: 62, label: "Feb 5"  },
  { idx: 77, label: "Feb 20" },
  { idx: 89, label: "Mar 5"  },
];

const W = 380;
const H = 80;
const PAD_X = 4;
const PAD_Y = 8;

function buildPath(data: number[]) {
  const lo = Math.min(...data) - 0.01;
  const hi = Math.max(...data) + 0.01;
  const toX = (i: number) => PAD_X + (i / (data.length - 1)) * (W - PAD_X * 2);
  const toY = (v: number) => PAD_Y + (1 - (v - lo) / (hi - lo)) * (H - PAD_Y * 2);

  const pts = data.map((v, i) => `${toX(i).toFixed(1)},${toY(v).toFixed(1)}`);
  const line = pts.join(" ");
  const last = pts[pts.length - 1].split(",")[0];
  const area = `M ${pts[0]} L ${pts.join(" L ")} L ${last},${(H - PAD_Y).toFixed(1)} L ${PAD_X},${(H - PAD_Y).toFixed(1)} Z`;
  return { line, area };
}

export function DieselChart() {
  const current = DATA[DATA.length - 1];
  const prev = DATA[DATA.length - 2];
  const delta = current - prev;
  const isUp = delta >= 0;
  const lo = Math.min(...DATA);
  const hi = Math.max(...DATA);
  const { line, area } = buildPath(DATA);

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-1">
        <div>
          <div className="text-[0.6875rem] font-bold text-gray-400 tracking-[0.07em] uppercase mb-0.5">
            US Avg Diesel Price
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-[1.75rem] font-bold text-gray-900 tracking-tight leading-none">
              ${current.toFixed(2)}
            </span>
            <span className="text-[0.8125rem] text-gray-400 font-medium">/gal</span>
            <span className={`text-[0.8125rem] font-semibold ${isUp ? "text-rose-500" : "text-emerald-600"}`}>
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
            <linearGradient id="dieselFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%"   stopColor="#D97706" stopOpacity="0.14" />
              <stop offset="100%" stopColor="#D97706" stopOpacity="0.01" />
            </linearGradient>
          </defs>

          <path d={area} fill="url(#dieselFill)" />

          <polyline
            points={line}
            fill="none"
            stroke="#D97706"
            strokeWidth="1.8"
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Current value dot – pulsing "live" indicator */}
          {(() => {
            const lx = PAD_X + W - PAD_X * 2;
            const lo2 = Math.min(...DATA) - 0.01;
            const hi2 = Math.max(...DATA) + 0.01;
            const ly = PAD_Y + (1 - (current - lo2) / (hi2 - lo2)) * (H - PAD_Y * 2);
            return (
              <>
                <circle cx={lx} cy={ly} r={2.5} fill="none" stroke="#D97706" strokeWidth="1">
                  <animate attributeName="r" values="2.5;12;12" dur="2.4s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.5;0;0" dur="2.4s" repeatCount="indefinite" />
                </circle>
                <circle cx={lx} cy={ly} r={2.5} fill="none" stroke="#D97706" strokeWidth="0.8">
                  <animate attributeName="r" values="2.5;16;16" dur="2.4s" begin="0.6s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.3;0;0" dur="2.4s" begin="0.6s" repeatCount="indefinite" />
                </circle>
                <circle cx={lx} cy={ly} r={5} fill="#D97706" opacity={0.12}>
                  <animate attributeName="r" values="4;7;4" dur="2s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.12;0.06;0.12" dur="2s" repeatCount="indefinite" />
                </circle>
                <circle cx={lx} cy={ly} r={2.5} fill="#D97706" />
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
        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full block" />
        <span className="text-[0.6875rem] text-gray-300 font-medium">
          Weekly · National avg · Source: EIA
        </span>
      </div>
    </div>
  );
}
