"use client";

/**
 * Animated Florida SVG map — geographically accurate coordinates.
 *
 * Coordinate system  (viewBox "0 0 380 500"):
 *   x = (83.5 − lon) / 3.6 × 360 + 10
 *   y = (30.5 − lat) / 6.0 × 480 + 10
 *
 * Derived cities:
 *   Tampa   82.46 °W, 27.95 °N → (114, 214)
 *   Orlando 81.38 °W, 28.54 °N → (222, 167)
 *   Miami   80.19 °W, 25.77 °N → (341, 388)
 */

// Accurate Florida peninsula outline (clockwise from NW)
const FLORIDA_PATH = [
  "M 10,10",
  "L 210,10",
  "C 200,16 196,20 195,24",
  "Q 214,42 230,58",
  "Q 244,88 255,113",
  "Q 280,145 303,172",
  "Q 313,208 316,240",
  "Q 337,278 354,313",
  "Q 352,338 346,360",
  "Q 342,376 341,388",
  "L 312,412",
  "C 285,440 238,470 182,486",   // Keys arc → Key West
  "C 210,472 238,454 252,434",   // Keys inner → Cape Sable
  "L 210,378",                   // 10,000 Islands
  "Q 192,366 180,360",           // Naples
  "Q 175,336 173,319",           // Fort Myers
  "Q 162,306 155,296",           // Charlotte Harbor
  "Q 135,272 118,250",           // Manatee / Tampa Bay south entrance
  "L  87,240",                   // Pinellas tip (bay mouth)
  "Q  82,226  80,215",           // Clearwater / North Pinellas
  "Q  91,206 100,200",           // Hillsborough — N side of Tampa Bay
  "Q  94,182  90,168",           // Spring Hill / Weeki Wachee
  "Q  96,152 101,138",           // Crystal River
  "Q  80,128  65,120",           // Yankeetown / Levy County
  "Q  52,112  45,107",           // Suwannee River mouth
  "Q  36, 97  30, 90",           // Nature Coast
  "L  10, 90",                   // Back to W edge
  "Z",
].join(" ");

// Routes (cubic bezier)
const ROUTE_TPA_ORL = "M 114,214 C 150,196 185,176 222,167";
const ROUTE_ORL_MIA = "M 222,167 C 270,246 308,312 341,388";
const ROUTE_TPA_MIA = "M 114,214 C 185,292 268,342 341,388";

interface CityNodeProps {
  cx: number; cy: number;
  label: string;
  lx: number; ly: number;        // label position
  delay?: string; dur?: string;
}

function CityNode({ cx, cy, label, lx, ly, delay = "0s", dur = "3.2s" }: CityNodeProps) {
  return (
    <g>
      {/* Outer pulse */}
      <circle cx={cx} cy={cy} r={8} fill="#0066CC" opacity={0.07}>
        <animate attributeName="r"       values="6;18;6"         dur={dur} begin={delay} repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.07;0.02;0.07" dur={dur} begin={delay} repeatCount="indefinite" />
      </circle>
      {/* Mid ring */}
      <circle cx={cx} cy={cy} r={5}   fill="#0066CC" opacity={0.2} />
      {/* Core */}
      <circle cx={cx} cy={cy} r={3.5} fill="#0066CC" />
      {/* Label */}
      <text
        x={lx} y={ly}
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
  path: string; dur: string; begin?: string; r?: number; opacity?: number;
}
function MovingDot({ path, dur, begin = "0s", r = 3.5, opacity = 0.9 }: MovingDotProps) {
  return (
    <circle r={r} fill="#0066CC">
      <animateMotion dur={dur} repeatCount="indefinite" begin={begin} path={path} />
      <animate
        attributeName="opacity"
        values={`0;${opacity};${opacity};${opacity};0`}
        keyTimes="0;0.08;0.5;0.92;1"
        dur={dur} begin={begin} repeatCount="indefinite"
      />
    </circle>
  );
}

export function HeroMap() {
  return (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      {/* Dot grid background */}
      <div className="absolute inset-0 dot-grid opacity-25 rounded-3xl" aria-hidden />

      <svg
        viewBox="0 0 380 500"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="relative w-full max-w-[400px] h-auto"
        aria-label="Florida coverage map — Tampa, Orlando, Miami"
      >
        {/* ── Florida outline ─────────────────────── */}
        <path
          d={FLORIDA_PATH}
          stroke="#D1D5DB"
          strokeWidth="1.5"
          fill="#F9FAFB"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* ── Route lines ──────────────────────────── */}
        <path d={ROUTE_TPA_ORL} stroke="#0066CC" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.55" />
        <path d={ROUTE_ORL_MIA} stroke="#0066CC" strokeWidth="1.5" strokeDasharray="5 4" opacity="0.55" />
        <path d={ROUTE_TPA_MIA} stroke="#0066CC" strokeWidth="1"   strokeDasharray="3 7" opacity="0.22" />

        {/* ── Moving load dots ─────────────────────── */}
        <MovingDot path={ROUTE_TPA_ORL} dur="3.8s" begin="0s" />
        <MovingDot path={ROUTE_TPA_ORL} dur="3.8s" begin="2.0s" />
        <MovingDot path={ROUTE_ORL_MIA} dur="4.6s" begin="1.2s" />
        <MovingDot path={ROUTE_ORL_MIA} dur="4.6s" begin="3.4s" />
        <MovingDot path={ROUTE_TPA_MIA} dur="6.8s" begin="0.6s" r={2.8} opacity={0.6} />

        {/* ── City nodes ───────────────────────────── */}
        <CityNode cx={114} cy={214} label="Tampa"   lx={126} ly={212} delay="0s"   dur="3.2s" />
        <CityNode cx={222} cy={167} label="Orlando"  lx={234} ly={164} delay="0.6s" dur="3.7s" />
        <CityNode cx={341} cy={388} label="Miami"    lx={290} ly={384} delay="1.2s" dur="4.1s" />
      </svg>
    </div>
  );
}
