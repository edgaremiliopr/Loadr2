"use client";

/**
 * Animated SVG map of Florida with Tampa, Orlando, and Miami
 * connected by animated freight route lines and moving load dots.
 *
 * Florida outline coordinates (simplified, viewBox 380×460):
 *   Panhandle runs across the top; peninsula hangs south.
 *   Tampa  ≈ (82, 248)   — west coast, ~55% down peninsula
 *   Orlando ≈ (192, 210) — center-inland, ~43% down
 *   Miami  ≈ (308, 362)  — SE corner, ~85% down
 */

const FLORIDA_PATH =
  "M 5,22 L 215,12 L 232,58 L 275,58 L 298,88 " +
  "L 318,150 L 330,205 L 335,258 L 332,305 L 322,342 " +
  "L 304,368 L 282,388 L 248,402 L 195,412 L 135,405 " +
  "L 88,390 L 62,358 L 42,320 L 38,288 L 52,268 " +
  "L 70,252 L 48,232 L 28,205 L 18,155 L 14,90 L 8,55 Z";

// Cubic bezier routes between cities
const ROUTE_TPA_ORL  = "M 82,248 C 120,230 158,215 192,210";
const ROUTE_ORL_MIA  = "M 192,210 C 248,252 288,308 308,362";
const ROUTE_TPA_MIA  = "M 82,248 C 138,308 228,340 308,362";

interface CityProps {
  cx: number;
  cy: number;
  label: string;
  labelDx?: number;
  labelDy?: number;
  delay?: string;
  pulseDur?: string;
}

function CityNode({ cx, cy, label, labelDx = 10, labelDy = 4, delay = "0s", pulseDur = "3s" }: CityProps) {
  return (
    <g>
      {/* Outer pulse ring */}
      <circle cx={cx} cy={cy} r="8" fill="#0066CC" opacity="0.07">
        <animate attributeName="r"       values="6;18;6"          dur={pulseDur} begin={delay} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.07;0.02;0.07"  dur={pulseDur} begin={delay} repeatCount="indefinite" />
      </circle>
      {/* Mid ring */}
      <circle cx={cx} cy={cy} r="5" fill="#0066CC" opacity="0.18" />
      {/* Core dot */}
      <circle cx={cx} cy={cy} r="3.5" fill="#0066CC" />
      {/* Label */}
      <text
        x={cx + labelDx}
        y={cy + labelDy}
        fontSize="10.5"
        fill="#374151"
        fontFamily="-apple-system, BlinkMacSystemFont, sans-serif"
        fontWeight="600"
        letterSpacing="0.2"
      >
        {label}
      </text>
    </g>
  );
}

interface MovingDotProps {
  path: string;
  dur: string;
  begin?: string;
  r?: number;
  opacity?: number;
}

function MovingDot({ path, dur, begin = "0s", r = 3.5, opacity = 0.9 }: MovingDotProps) {
  return (
    <circle r={r} fill="#0066CC">
      <animateMotion dur={dur} repeatCount="indefinite" begin={begin} path={path} />
      <animate
        attributeName="opacity"
        values={`0;${opacity};${opacity};${opacity};0`}
        keyTimes="0;0.08;0.5;0.92;1"
        dur={dur}
        begin={begin}
        repeatCount="indefinite"
      />
    </circle>
  );
}

export function HeroMap() {
  return (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      {/* Dot grid background */}
      <div
        className="absolute inset-0 dot-grid opacity-30 rounded-3xl"
        aria-hidden="true"
      />

      <svg
        viewBox="0 0 380 460"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative w-full max-w-[420px] h-auto"
        aria-label="Florida coverage map showing Tampa, Orlando, and Miami"
      >
        {/* ── Florida state outline ───────────────────── */}
        <path
          d={FLORIDA_PATH}
          stroke="#D1D5DB"
          strokeWidth="1.5"
          fill="#F9FAFB"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* ── Route lines (dashed) ────────────────────── */}
        {/* Tampa → Orlando */}
        <path d={ROUTE_TPA_ORL} stroke="#0066CC" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.55" />
        {/* Orlando → Miami */}
        <path d={ROUTE_ORL_MIA} stroke="#0066CC" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.55" />
        {/* Tampa → Miami (secondary) */}
        <path d={ROUTE_TPA_MIA} stroke="#0066CC" strokeWidth="1"   strokeDasharray="3 7" opacity="0.22" />

        {/* ── Moving load dots ────────────────────────── */}
        <MovingDot path={ROUTE_TPA_ORL} dur="3.8s" begin="0s" />
        <MovingDot path={ROUTE_TPA_ORL} dur="3.8s" begin="2.0s" />
        <MovingDot path={ROUTE_ORL_MIA} dur="4.6s" begin="1.2s" />
        <MovingDot path={ROUTE_ORL_MIA} dur="4.6s" begin="3.4s" />
        <MovingDot path={ROUTE_TPA_MIA} dur="6.8s" begin="0.6s" r={2.8} opacity={0.65} />

        {/* ── City nodes ──────────────────────────────── */}
        <CityNode cx={82}  cy={248} label="Tampa"   labelDx={10}  labelDy={4}  delay="0s"    pulseDur="3.2s" />
        <CityNode cx={192} cy={210} label="Orlando"  labelDx={10}  labelDy={-6} delay="0.6s"  pulseDur="3.7s" />
        <CityNode cx={308} cy={362} label="Miami"    labelDx={10}  labelDy={4}  delay="1.2s"  pulseDur="4.1s" />
      </svg>
    </div>
  );
}
