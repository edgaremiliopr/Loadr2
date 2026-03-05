"use client";

import { useState, useEffect } from "react";

interface TickerItem {
  label: string;
  display: string;
  trend: "up" | "down" | "flat";
}

function makeItems(
  diesel: number,
  spot: number,
  ltr: number,
  fsc: number
): TickerItem[] {
  return [
    { label: "Diesel Avg (Natl)",   display: `$${diesel.toFixed(2)}/gal`,    trend: "flat" },
    { label: "FL Flatbed Spot",      display: `$${spot.toFixed(2)}/mi`,       trend: "up"   },
    { label: "Load / Truck Ratio",   display: ltr.toFixed(1),                 trend: "up"   },
    { label: "Fuel Surcharge",       display: `${fsc.toFixed(1)}%`,           trend: "flat" },
    { label: "Storm Disruptions",    display: "None Active",                  trend: "flat" },
    { label: "Tampa Corridor",       display: "Active ↑",                     trend: "up"   },
    { label: "Miami Port",           display: "Normal",                       trend: "flat" },
    { label: "Orlando Jobsite Mkt",  display: "Active ↑",                     trend: "up"   },
    { label: "I-4 Freight Activity", display: "High",                         trend: "up"   },
    { label: "I-75 S Corridor",      display: "Moderate",                     trend: "flat" },
  ];
}

const TREND_COLOR: Record<string, string> = {
  up:   "text-emerald-600",
  down: "text-rose-500",
  flat: "text-gray-400",
};
const TREND_ARROW: Record<string, string> = { up: "↑", down: "↓", flat: "" };

export function MarketTicker() {
  const [diesel, setDiesel] = useState(3.68);
  const [spot,   setSpot]   = useState(2.24);
  const [ltr,    setLtr]    = useState(3.4);
  const [fsc,    setFsc]    = useState(27.5);

  // Gently fluctuate values to feel live
  useEffect(() => {
    const id = setInterval(() => {
      setDiesel(v => parseFloat((v + (Math.random() - 0.5) * 0.03).toFixed(2)));
      setSpot(  v => parseFloat((v + (Math.random() - 0.5) * 0.05).toFixed(2)));
      setLtr(   v => parseFloat((v + (Math.random() - 0.5) * 0.15).toFixed(1)));
      setFsc(   v => parseFloat((v + (Math.random() - 0.5) * 0.20).toFixed(1)));
    }, 7000);
    return () => clearInterval(id);
  }, []);

  const items = makeItems(diesel, spot, ltr, fsc);
  // Duplicate for seamless loop
  const loop  = [...items, ...items];

  return (
    <div className="border-y border-gray-100 bg-gray-50/60 overflow-hidden">
      <div className="flex items-stretch">
        {/* Badge */}
        <div className="flex-shrink-0 flex items-center px-4 py-2.5 bg-gray-900 text-white z-10">
          <span className="text-[0.6875rem] font-bold tracking-[0.1em] uppercase whitespace-nowrap">
            Live Market
          </span>
        </div>

        {/* Scrolling content */}
        <div className="overflow-hidden flex-1 min-w-0">
          <div className="ticker-animate inline-flex whitespace-nowrap items-center">
            {loop.map((item, i) => (
              <div key={i} className="inline-flex items-center gap-1.5 px-5 py-2.5">
                <span className="text-[0.8125rem] text-gray-500 font-medium">{item.label}:</span>
                <span className="text-[0.8125rem] font-semibold text-gray-900">{item.display}</span>
                {TREND_ARROW[item.trend] && (
                  <span className={`text-[0.75rem] font-bold ${TREND_COLOR[item.trend]}`}>
                    {TREND_ARROW[item.trend]}
                  </span>
                )}
                <span className="ml-4 text-gray-200 select-none" aria-hidden>·</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
