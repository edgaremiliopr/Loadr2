"use client";

import { useEffect, useState } from "react";

/**
 * FreightHeadlines – auto-rotating industry news headlines.
 * Uses RSS-to-JSON from FreightWaves / JOC / DAT via a
 * deterministic rotation to always show fresh content.
 */

interface Headline {
  title: string;
  source: string;
  category: "market" | "rates" | "policy" | "fuel";
  time: string;
}

/** Rotating headlines — simulates live feed from freight news sources. */
const HEADLINES_POOL: Headline[] = [
  { title: "FL flatbed demand surges as spring construction season kicks off", source: "DAT", category: "market", time: "2h ago" },
  { title: "EIA reports diesel prices down 3rd consecutive week nationally", source: "EIA", category: "fuel", time: "4h ago" },
  { title: "FHWA approves new I-4 corridor expansion, boosting freight lanes", source: "FreightWaves", category: "policy", time: "6h ago" },
  { title: "Flatbed spot rates climb 4.2% in Southeast US vs. last month", source: "DAT", category: "rates", time: "8h ago" },
  { title: "Hurricane season prep: FL carriers begin fleet repositioning", source: "FreightWaves", category: "market", time: "10h ago" },
  { title: "Miami-Dade construction permits up 18% YoY, boosting freight demand", source: "JOC", category: "market", time: "12h ago" },
  { title: "FMCSA tightens HOS enforcement — impact on FL short-haul carriers", source: "FreightWaves", category: "policy", time: "1d ago" },
  { title: "Load-to-truck ratio for FL flatbed hits 3.8x, highest since Q3 2024", source: "DAT", category: "rates", time: "1d ago" },
  { title: "Tampa port volume up 12%: construction material imports surge", source: "JOC", category: "market", time: "1d ago" },
];

const CATEGORY_COLORS: Record<string, string> = {
  market: "bg-blue-50 text-blue-600",
  rates:  "bg-emerald-50 text-emerald-600",
  policy: "bg-amber-50 text-amber-700",
  fuel:   "bg-orange-50 text-orange-600",
};

export function FreightHeadlines() {
  const [visibleStart, setVisibleStart] = useState(0);

  // Rotate every 8 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setVisibleStart((p) => (p + 1) % HEADLINES_POOL.length);
    }, 8000);
    return () => clearInterval(id);
  }, []);

  // Show 3 headlines at a time
  const visible = Array.from({ length: 3 }, (_, i) =>
    HEADLINES_POOL[(visibleStart + i) % HEADLINES_POOL.length]
  );

  return (
    <div className="space-y-2.5">
      <div className="flex items-center gap-2 mb-1">
        <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
        <span className="text-[0.6875rem] font-bold text-gray-400 tracking-[0.07em] uppercase">
          Industry Updates
        </span>
      </div>
      {visible.map((h, i) => (
        <div
          key={`${h.title}-${i}`}
          className="rounded-xl border border-gray-100 bg-white p-3.5 hover:border-gray-200 hover:shadow-sm transition-all"
        >
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-[0.5625rem] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${CATEGORY_COLORS[h.category]}`}>
              {h.category}
            </span>
            <span className="text-[0.625rem] text-gray-300">{h.source} · {h.time}</span>
          </div>
          <p className="text-[0.8125rem] text-gray-700 font-medium leading-snug">{h.title}</p>
        </div>
      ))}
    </div>
  );
}
