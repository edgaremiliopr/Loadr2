"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { prShipments } from "@/data/pr-shipments";
import type { PRShipment, PRPort } from "@/types/freight";

// ─── Helpers ────────────────────────────────────────────────────

const fmt = new Intl.NumberFormat("en-US");
const fmtKg = (n: number) => `${fmt.format(n)} kg`;
const fmtLbs = (n: number) => `${fmt.format(n)} lbs`;

type Tone = "blue" | "amber" | "rose" | "emerald" | "gray" | "indigo" | "cyan";

function badge(tone: Tone) {
  const map: Record<Tone, string> = {
    blue: "border border-blue-200 bg-blue-50 text-blue-700",
    amber: "border border-amber-200 bg-amber-50 text-amber-700",
    rose: "border border-rose-200 bg-rose-50 text-rose-700",
    emerald: "border border-emerald-200 bg-emerald-50 text-emerald-700",
    gray: "border border-gray-200 bg-gray-50 text-gray-600",
    indigo: "border border-indigo-200 bg-indigo-50 text-indigo-700",
    cyan: "border border-cyan-200 bg-cyan-50 text-cyan-700",
  };
  return map[tone];
}

function portBadge(port: PRPort) {
  return port === "San Juan" ? badge("blue") : badge("indigo");
}

function billTypeBadge(bt: string) {
  return bt === "Master" ? badge("emerald") : bt === "House" ? badge("amber") : badge("gray");
}

// ─── Country flag helper ────────────────────────────────────────

const COUNTRY_FLAGS: Record<string, string> = {
  US: "🇺🇸", DO: "🇩🇴", CO: "🇨🇴", PA: "🇵🇦", BS: "🇧🇸",
  BR: "🇧🇷", JM: "🇯🇲", MX: "🇲🇽", CR: "🇨🇷", GT: "🇬🇹",
};

// ─── Filter types ───────────────────────────────────────────────

type PortFilter = "all" | PRPort;
type ViewMode = "table" | "cards";

// ─── Component ──────────────────────────────────────────────────

export function PRShipmentTracker() {
  const [portFilter, setPortFilter] = useState<PortFilter>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [selectedShipment, setSelectedShipment] = useState<PRShipment | null>(null);
  const [sortField, setSortField] = useState<"arrivalDate" | "weightKg" | "quantity">("arrivalDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const filtered = useMemo(() => {
    let result = prShipments;
    if (portFilter !== "all") result = result.filter(s => s.usPort === portFilter);
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(s =>
        s.masterBOL.toLowerCase().includes(q) ||
        s.houseBOL.toLowerCase().includes(q) ||
        s.vesselName.toLowerCase().includes(q) ||
        s.shipper.toLowerCase().includes(q) ||
        s.consignee.toLowerCase().includes(q) ||
        s.commodity.toLowerCase().includes(q) ||
        s.carrierName.toLowerCase().includes(q) ||
        s.foreignPort.toLowerCase().includes(q)
      );
    }
    result = [...result].sort((a, b) => {
      const av = a[sortField], bv = b[sortField];
      if (typeof av === "string" && typeof bv === "string") return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
      return sortDir === "asc" ? (av as number) - (bv as number) : (bv as number) - (av as number);
    });
    return result;
  }, [portFilter, searchTerm, sortField, sortDir]);

  // Stats
  const totalContainers = filtered.reduce((s, r) => s + r.containerCount, 0);
  const totalWeightKg = filtered.reduce((s, r) => s + r.weightKg, 0);
  const sanJuanCount = filtered.filter(s => s.usPort === "San Juan").length;
  const ponceCount = filtered.filter(s => s.usPort === "Ponce").length;
  const uniqueVessels = new Set(filtered.map(s => s.vesselName)).size;
  const uniqueCarriers = new Set(filtered.map(s => s.carrierCode)).size;

  const metrics = [
    { label: "Shipments", value: String(filtered.length), tone: "blue" as Tone },
    { label: "San Juan", value: String(sanJuanCount), tone: "emerald" as Tone },
    { label: "Ponce", value: String(ponceCount), tone: "indigo" as Tone },
    { label: "Containers", value: String(totalContainers), tone: "amber" as Tone },
    { label: "Total Weight", value: fmtLbs(totalWeightKg * 2.205), tone: "cyan" as Tone },
    { label: "Vessels", value: String(uniqueVessels), tone: "gray" as Tone },
  ];

  function toggleSort(field: typeof sortField) {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("desc"); }
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900 flex flex-col">
      {/* ─── Header ─────────────────────────────────────────── */}
      <header className="sticky top-0 z-30 border-b border-gray-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <Link href="/office" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="inline mr-1">
                <path d="M10 12L6 8l4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Dashboard
            </Link>
            <span className="text-gray-300">|</span>
            <h1 className="text-lg font-semibold tracking-tight">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" className="inline mr-2 -mt-0.5">
                <path d="M3 10h14M10 3c-4 3-4 11 0 14M10 3c4 3 4 11 0 14M3 7h14M3 13h14" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <circle cx="10" cy="10" r="8" stroke="currentColor" strokeWidth="1.3"/>
              </svg>
              PR Shipment Tracker
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2 py-0.5 rounded-full ${badge("emerald")}`}>
              Puerto Rico Ports
            </span>
          </div>
        </div>
      </header>

      {/* ─── Top metrics ────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-[1440px] px-6 pt-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          {metrics.map(m => (
            <div key={m.label} className={`rounded-lg px-4 py-3 ${badge(m.tone)}`}>
              <p className="text-[11px] font-medium uppercase tracking-wider opacity-70">{m.label}</p>
              <p className="text-xl font-bold">{m.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Filters ────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-[1440px] px-6 pt-4 pb-2">
        <div className="flex flex-wrap items-center gap-3">
          {/* Port filter */}
          <div className="flex items-center rounded-lg border border-gray-200 bg-white p-0.5 text-sm">
            {(["all", "San Juan", "Ponce"] as PortFilter[]).map(p => (
              <button
                key={p}
                onClick={() => setPortFilter(p)}
                className={`rounded-md px-3 py-1.5 transition-colors ${portFilter === p ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900"}`}
              >
                {p === "all" ? "All Ports" : p}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[240px]">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3" />
              <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
            </svg>
            <input
              type="text"
              placeholder="Search BOL, vessel, shipper, consignee, commodity..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm placeholder:text-gray-400 focus:border-gray-400 focus:outline-none"
            />
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-lg border border-gray-200 bg-white p-0.5 text-sm">
            <button
              onClick={() => setViewMode("table")}
              className={`rounded-md px-3 py-1.5 transition-colors ${viewMode === "table" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900"}`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="inline -mt-0.5">
                <rect x="1" y="1" width="12" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                <rect x="1" y="5.5" width="12" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
                <rect x="1" y="10" width="12" height="3" rx="0.5" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </button>
            <button
              onClick={() => setViewMode("cards")}
              className={`rounded-md px-3 py-1.5 transition-colors ${viewMode === "cards" ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-900"}`}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="inline -mt-0.5">
                <rect x="1" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                <rect x="8" y="1" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                <rect x="1" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
                <rect x="8" y="8" width="5" height="5" rx="1" stroke="currentColor" strokeWidth="1.2"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Content ────────────────────────────────────────── */}
      <div className="mx-auto w-full max-w-[1440px] flex-1 px-6 pb-8">
        {viewMode === "table" ? (
          <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  <th className="px-3 py-2.5">BOL</th>
                  <th className="px-3 py-2.5">Bill</th>
                  <th className="px-3 py-2.5 cursor-pointer select-none" onClick={() => toggleSort("arrivalDate")}>
                    Arrival {sortField === "arrivalDate" && (sortDir === "desc" ? "↓" : "↑")}
                  </th>
                  <th className="px-3 py-2.5">Vessel</th>
                  <th className="px-3 py-2.5">Carrier</th>
                  <th className="px-3 py-2.5">Port</th>
                  <th className="px-3 py-2.5">Origin</th>
                  <th className="px-3 py-2.5">Shipper</th>
                  <th className="px-3 py-2.5">Consignee</th>
                  <th className="px-3 py-2.5">Commodity</th>
                  <th className="px-3 py-2.5 cursor-pointer select-none text-right" onClick={() => toggleSort("quantity")}>
                    Qty {sortField === "quantity" && (sortDir === "desc" ? "↓" : "↑")}
                  </th>
                  <th className="px-3 py-2.5 cursor-pointer select-none text-right" onClick={() => toggleSort("weightKg")}>
                    Weight {sortField === "weightKg" && (sortDir === "desc" ? "↓" : "↑")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedShipment(s)}
                    className="border-b border-gray-50 transition-colors hover:bg-blue-50/40 cursor-pointer"
                  >
                    <td className="px-3 py-2.5 font-mono text-xs">
                      {s.masterBOL.slice(-8)}
                      {s.houseBOL && <span className="block text-[10px] text-gray-400">{s.houseBOL.slice(-8)}</span>}
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${billTypeBadge(s.billType)}`}>{s.billType}</span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap">{s.arrivalDate}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap font-medium">{s.vesselName}</td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs">{s.carrierName}</td>
                    <td className="px-3 py-2.5">
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${portBadge(s.usPort)}`}>{s.usPort}</span>
                    </td>
                    <td className="px-3 py-2.5 whitespace-nowrap text-xs">
                      {COUNTRY_FLAGS[s.foreignCountry] || ""} {s.foreignPort}
                    </td>
                    <td className="px-3 py-2.5 max-w-[160px] truncate text-xs">{s.shipper}</td>
                    <td className="px-3 py-2.5 max-w-[160px] truncate text-xs">{s.consignee}</td>
                    <td className="px-3 py-2.5 max-w-[180px] truncate text-xs text-gray-600">{s.commodity}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmt.format(s.quantity)} <span className="text-[10px] text-gray-400">{s.quantityUnit}</span></td>
                    <td className="px-3 py-2.5 text-right tabular-nums">{fmtLbs(s.weightLbs)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="py-12 text-center text-sm text-gray-400">No shipments match your filters.</div>
            )}
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map(s => (
              <div
                key={s.id}
                onClick={() => setSelectedShipment(s)}
                className="cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold">{s.vesselName}</p>
                    <p className="text-xs text-gray-500">{s.carrierName} — Voyage {s.voyageNumber}</p>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${portBadge(s.usPort)}`}>{s.usPort}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase">Arrival</p>
                    <p className="font-medium">{s.arrivalDate}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase">Origin</p>
                    <p className="font-medium">{COUNTRY_FLAGS[s.foreignCountry] || ""} {s.foreignPort}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase">BOL</p>
                    <p className="font-mono">{s.masterBOL.slice(-10)}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-[10px] uppercase">Bill Type</p>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${billTypeBadge(s.billType)}`}>{s.billType}</span>
                  </div>
                </div>
                <div className="border-t border-gray-100 pt-2 text-xs">
                  <p className="truncate"><span className="text-gray-400">Shipper:</span> {s.shipper}</p>
                  <p className="truncate"><span className="text-gray-400">Consignee:</span> {s.consignee}</p>
                </div>
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span className="truncate max-w-[60%]">{s.commodity}</span>
                  <span className="tabular-nums font-medium">{fmtLbs(s.weightLbs)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ─── Detail modal ───────────────────────────────────── */}
      {selectedShipment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={() => setSelectedShipment(null)}>
          <div className="m-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-2xl" onClick={e => e.stopPropagation()}>
            <ShipmentDetail shipment={selectedShipment} onClose={() => setSelectedShipment(null)} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Detail panel ──────────────────────────────────────────────

function ShipmentDetail({ shipment: s, onClose }: { shipment: PRShipment; onClose: () => void }) {
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold">{s.vesselName}</h2>
          <p className="text-sm text-gray-500">{s.carrierName} — IMO {s.imoNumber}</p>
        </div>
        <button onClick={onClose} className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M5 5l8 8M13 5l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </button>
      </div>

      {/* Voyage info */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <InfoBlock label="Arrival Date" value={s.arrivalDate} />
        <InfoBlock label="US Port" value={s.usPort} badge={portBadge(s.usPort)} />
        <InfoBlock label="Foreign Port" value={`${COUNTRY_FLAGS[s.foreignCountry] || ""} ${s.foreignPort}`} />
        <InfoBlock label="Voyage #" value={s.voyageNumber} />
      </div>

      {/* BOL info */}
      <SectionHeader title="Bill of Lading" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <InfoBlock label="Master BOL" value={s.masterBOL} mono />
        <InfoBlock label="House BOL" value={s.houseBOL || "—"} mono />
        <InfoBlock label="Bill Type" value={s.billType} badge={billTypeBadge(s.billType)} />
        <InfoBlock label="Carrier Code" value={s.carrierCode} mono />
      </div>

      {/* Cargo */}
      <SectionHeader title="Cargo" />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <InfoBlock label="Commodity" value={s.commodity} wide />
        <InfoBlock label="HS Code" value={s.harmonizedCode} mono />
        <InfoBlock label="Quantity" value={`${fmt.format(s.quantity)} ${s.quantityUnit}`} />
        <InfoBlock label="Weight" value={`${fmtLbs(s.weightLbs)} / ${fmtKg(s.weightKg)}`} />
        <InfoBlock label="Containers" value={s.containerCount > 0 ? `${s.containerCount}x ${s.containerType}` : s.containerType} />
        <InfoBlock label="Service" value={s.typeOfService} />
      </div>

      {/* Parties */}
      <SectionHeader title="Parties" />
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <PartyBlock label="Shipper" name={s.shipper} address={s.shipperAddress} />
        <PartyBlock label="Consignee" name={s.consignee} address={s.consigneeAddress} />
        <PartyBlock label="Notify Party" name={s.notifyParty} address={s.notifyPartyAddress} />
      </div>

      {/* Run date */}
      <div className="border-t border-gray-100 pt-3 text-xs text-gray-400 flex items-center justify-between">
        <span>Run Date: {s.runDate}</span>
        <span>ID: {s.id}</span>
      </div>
    </div>
  );
}

// ─── UI primitives ─────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2 border-b border-gray-100 pb-1">{title}</h3>
  );
}

function InfoBlock({ label, value, mono, badge: badgeCls, wide }: { label: string; value: string; mono?: boolean; badge?: string; wide?: boolean }) {
  return (
    <div className={wide ? "sm:col-span-2" : ""}>
      <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 mb-0.5">{label}</p>
      {badgeCls ? (
        <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${badgeCls}`}>{value}</span>
      ) : (
        <p className={`text-sm font-medium ${mono ? "font-mono text-xs" : ""}`}>{value}</p>
      )}
    </div>
  );
}

function PartyBlock({ label, name, address }: { label: string; name: string; address: string }) {
  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-3">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1">{label}</p>
      <p className="text-sm font-medium">{name}</p>
      <p className="text-xs text-gray-500 mt-0.5">{address}</p>
    </div>
  );
}
