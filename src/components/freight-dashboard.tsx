"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";

import { FloridaMarketMap } from "@/components/florida-market-map";
import { companiesCatalog as companies } from "@/data/company-catalog";
import {
  compliance,
  loads,
  metroFocus,
  quotes,
  researchQueue,
  tasks,
} from "@/data/freight-data";
import type { Company, Load, Quote } from "@/types/freight";

// ─── Data helpers ────────────────────────────────────────────────

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function loadQuotes(loadId: string)           { return quotes.filter(q => q.loadId === loadId); }
function shipperForLoad(load: Load)           { return companies.find(c => c.id === load.shipperId); }
function carrierForQuote(quote: Quote)        { return companies.find(c => c.id === quote.carrierId); }
function isScaffoldBranch(c: Company)         { return c.tags.includes("scaffold-branch"); }
function companyCount(f: (c: Company) => boolean) { return companies.filter(f).length; }
function scoreAverage(f: (c: Company) => boolean) {
  const arr = companies.filter(f);
  return Math.round(arr.reduce((s, c) => s + c.fitScore, 0) / arr.length);
}
function verifiedForkliftCount() {
  return companies.filter(c => c.kind === "carrier" && c.forkliftConfirmed && c.verification === "verified").length;
}

// ─── Badge helpers ───────────────────────────────────────────────

type Tone = "cyan" | "amber" | "rose" | "emerald" | "zinc";

function badge(tone: Tone) {
  const map: Record<Tone, string> = {
    cyan:    "border border-cyan-400/25    bg-cyan-400/10    text-cyan-300",
    amber:   "border border-amber-400/25   bg-amber-400/10   text-amber-300",
    rose:    "border border-rose-400/25    bg-rose-400/10    text-rose-300",
    emerald: "border border-emerald-400/25 bg-emerald-400/10 text-emerald-300",
    zinc:    "border border-white/10       bg-white/5        text-zinc-300",
  };
  return map[tone];
}

function priorityBadge(p: string) {
  return p === "high" ? badge("rose") : p === "medium" ? badge("amber") : badge("zinc");
}

function stageBadge(s: Load["stage"]) {
  return ["booked","delivered","invoiced"].includes(s) ? badge("emerald")
       : ["quoted","dispatched"].includes(s)           ? badge("cyan")
       : badge("amber");
}

function verificationBadge(v: Company["verification"]) {
  return v === "verified" ? badge("emerald") : v === "partial" ? badge("amber") : badge("zinc");
}

function complianceBadge(s: string) {
  return s === "ready" ? badge("emerald") : s === "expiring" ? badge("amber") : badge("rose");
}

// ─── Tabs ────────────────────────────────────────────────────────

type TabId = "command" | "research" | "map" | "tms";

const NAV_ITEMS: { id: TabId; label: string; icon: ReactNode }[] = [
  {
    id: "command",
    label: "Command",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="1" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="8.5" y="1" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="1" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <rect x="8.5" y="8.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    id: "research",
    label: "Research",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <circle cx="6.5" cy="6.5" r="4.5" stroke="currentColor" strokeWidth="1.3" />
        <path d="M10 10l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "map",
    label: "Map",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <path d="M7.5 1C5.015 1 3 3.015 3 5.5 3 8.5 7.5 14 7.5 14S12 8.5 12 5.5C12 3.015 9.985 1 7.5 1Z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <circle cx="7.5" cy="5.5" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
  {
    id: "tms",
    label: "TMS",
    icon: (
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
        <rect x="1" y="5" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1.3" />
        <path d="M11 7h2l2 3v2h-4" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
        <circle cx="4" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="10" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.3" />
        <circle cx="13" cy="13" r="1.5" stroke="currentColor" strokeWidth="1.3" />
      </svg>
    ),
  },
];

type CompanyFilter = "all" | Company["kind"] | "scaffold";

// ─── Main component ───────────────────────────────────────────────

export function FreightDashboard() {
  const [activeTab,        setActiveTab]        = useState<TabId>("command");
  const [companyFilter,    setCompanyFilter]    = useState<CompanyFilter>("all");
  const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0].id);

  const visibleCompanies = companies.filter(c => {
    if (companyFilter === "all")      return true;
    if (companyFilter === "scaffold") return isScaffoldBranch(c);
    if (companyFilter === "shipper")  return c.kind === "shipper" && !isScaffoldBranch(c);
    return c.kind === companyFilter;
  });

  const selectedCompany = companies.find(c => c.id === selectedCompanyId) ?? companies[0];
  const openTasks = tasks.filter(t => t.status !== "done");

  const topMetrics = [
    { label: "Carriers",        value: String(companyCount(c => c.kind === "carrier")),  tone: "cyan"    as Tone },
    { label: "Shippers",        value: String(companyCount(c => c.kind === "shipper")),  tone: "amber"   as Tone },
    { label: "Forklift ready",  value: String(verifiedForkliftCount()),                   tone: "emerald" as Tone },
    { label: "Open tasks",      value: String(openTasks.length),                          tone: "zinc"    as Tone },
  ];

  return (
    <div className="flex min-h-screen" style={{ background: "#08080B", color: "#F4F4F5" }}>

      {/* ── Sidebar ─────────────────────────────────────────── */}
      <aside
        className="hidden lg:flex flex-col w-[196px] flex-shrink-0 border-r"
        style={{ background: "#0D0D11", borderColor: "rgba(255,255,255,0.07)" }}
      >
        {/* Brand */}
        <div className="px-5 h-14 flex items-center border-b" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <span className="font-bold text-[0.875rem] text-zinc-100 tracking-tight">Loadr</span>
          <span className="ml-2 text-[0.6875rem] font-semibold text-zinc-600 tracking-wide uppercase">Office</span>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2.5 space-y-0.5">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              type="button"
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-[0.8125rem] font-medium transition-all ${
                activeTab === item.id
                  ? "bg-white/[0.08] text-zinc-100"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.04]"
              }`}
            >
              <span className={activeTab === item.id ? "text-cyan-400" : ""}>{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        {/* Back to site */}
        <div className="p-2.5 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <Link
            href="/"
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-[0.75rem] text-zinc-600 hover:text-zinc-400 transition-colors"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M7 2L3 6l4 4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back to site
          </Link>
        </div>
      </aside>

      {/* ── Main ────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Top bar */}
        <header
          className="h-14 flex items-center justify-between px-6 border-b flex-shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          {/* Mobile: logo + tabs */}
          <div className="lg:hidden flex items-center gap-4">
            <span className="font-bold text-sm text-zinc-100">Loadr Office</span>
            <div className="flex gap-1">
              {NAV_ITEMS.map(i => (
                <button
                  key={i.id}
                  onClick={() => setActiveTab(i.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    activeTab === i.id ? "bg-white/10 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
                  }`}
                >
                  {i.label}
                </button>
              ))}
            </div>
          </div>

          {/* Desktop: page title */}
          <div className="hidden lg:block">
            <span className="text-[0.75rem] font-semibold text-zinc-500 tracking-[0.08em] uppercase">
              {NAV_ITEMS.find(i => i.id === activeTab)?.label}
            </span>
          </div>

          {/* Metric pills (top-right) */}
          <div className="flex items-center gap-3">
            {topMetrics.map(m => (
              <div key={m.label} className="hidden sm:flex items-center gap-1.5">
                <span className="text-[0.6875rem] text-zinc-600 font-medium">{m.label}</span>
                <span className={`text-[0.6875rem] font-bold rounded-md px-1.5 py-0.5 ${badge(m.tone)}`}>
                  {m.value}
                </span>
              </div>
            ))}
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-5 lg:p-7">

          {/* ── Command ─────────────────────────────────────── */}
          {activeTab === "command" && (
            <div className="grid gap-5 xl:grid-cols-[1.5fr_1fr]">
              <div className="grid gap-5">
                <Panel
                  eyebrow="Launch Plan"
                  title="What this brokerage runs from day one"
                  description="The core one-person brokerage workflow: research, compliance, quotes, and daily execution — in one place."
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <ActionCard title="Research pipeline"    body="Every target has verification status, public sources, contacts, and notes on shipper-controlled freight." />
                    <ActionCard title="Carrier compliance"   body="Carrier packet, COI, MC verification, and readiness tracked. No more booking off memory." />
                    <ActionCard title="Quote desk"           body="Compare carrier quotes vs. shipper opportunities. Keep margin visible before awarding the load." />
                    <ActionCard title="Daily playbook"       body="Tasks, open loads, and next-call priorities keep a solo brokerage moving without extra tooling." />
                  </div>
                </Panel>

                <Panel
                  eyebrow="Market Focus"
                  title="Florida build-out priorities"
                  description="Start where shipper density and forklift delivery demand are strongest."
                >
                  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    {metroFocus.map(metro => (
                      <div
                        key={metro.name}
                        className="rounded-xl border p-4"
                        style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" }}
                      >
                        <p className="text-[0.6875rem] font-bold text-zinc-600 tracking-[0.1em] uppercase mb-2">
                          {metro.name}
                        </p>
                        <p className="text-[0.8125rem] leading-5 text-zinc-400">{metro.note}</p>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>

              <div className="grid gap-5">
                <Panel
                  eyebrow="Daily Playbook"
                  title="Highest-value calls today"
                  description="Actions that directly increase capacity or qualified shipper pipeline."
                >
                  <div className="space-y-2.5">
                    {openTasks.slice(0, 4).map(task => (
                      <div
                        key={task.id}
                        className="rounded-xl border p-4"
                        style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" }}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <p className="text-[0.875rem] font-semibold text-zinc-100">{task.title}</p>
                          <span className={`rounded-full px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider flex-shrink-0 ${priorityBadge(task.priority)}`}>
                            {task.priority}
                          </span>
                        </div>
                        <p className="text-[0.8125rem] text-zinc-500 leading-5">{task.notes}</p>
                        <p className="mt-2 text-[0.6875rem] font-semibold text-zinc-600 tracking-wider uppercase">
                          Due {task.due}
                        </p>
                      </div>
                    ))}
                  </div>
                </Panel>

                <Panel
                  eyebrow="Snapshot"
                  title="Network readiness"
                  description="Starter network seeded and usable from day one."
                >
                  <div className="space-y-2">
                    <ReadinessRow
                      label="Carrier fit score"
                      value={`${scoreAverage(c => c.kind === "carrier")}/100`}
                    />
                    <ReadinessRow
                      label="Shipper fit score"
                      value={`${scoreAverage(c => c.kind === "shipper" && !isScaffoldBranch(c))}/100`}
                    />
                    <ReadinessRow
                      label="Carrier packet ready"
                      value={`${compliance.filter(i => i.status === "ready").length}/${companyCount(c => c.kind === "carrier")}`}
                    />
                    <ReadinessRow
                      label="Florida metros covered"
                      value="Panhandle · North · Central · South"
                    />
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {/* ── Research ────────────────────────────────────── */}
          {activeTab === "research" && (
            <div className="grid gap-5 xl:grid-cols-[1.4fr_1fr]">
              <div className="grid gap-5">
                <Panel
                  eyebrow="Target Database"
                  title="Florida carrier + shipper research"
                  description="Filter by type to isolate carriers, parent shippers, scaffold branches, or the full prospect base."
                >
                  <div className="mb-5 flex flex-wrap gap-2">
                    {(["all","carrier","shipper","scaffold"] as const).map(f => (
                      <button
                        key={f}
                        type="button"
                        onClick={() => setCompanyFilter(f)}
                        className={`px-3 py-1.5 rounded-full text-[0.8125rem] font-medium transition-all ${
                          companyFilter === f
                            ? "border border-cyan-400/30 bg-cyan-400/10 text-cyan-300"
                            : "border border-white/10 bg-white/5 text-zinc-500 hover:text-zinc-300 hover:bg-white/8"
                        }`}
                      >
                        {{ all: "All companies", carrier: "Carriers", shipper: "Parent shippers", scaffold: "Scaffold branches" }[f]}
                      </button>
                    ))}
                  </div>

                  <div className="space-y-2.5">
                    {visibleCompanies
                      .slice()
                      .sort((a, b) => b.fitScore - a.fitScore)
                      .map(company => (
                        <button
                          key={company.id}
                          type="button"
                          onClick={() => setSelectedCompanyId(company.id)}
                          className={`w-full rounded-xl border p-4 text-left transition-all ${
                            selectedCompanyId === company.id
                              ? "border-cyan-400/30 bg-cyan-400/[0.06] shadow-[0_0_0_1px_rgba(34,211,238,0.1)]"
                              : "border-white/[0.08] bg-white/[0.025] hover:border-white/[0.14] hover:bg-white/[0.04]"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <p className="text-[0.6875rem] font-bold text-zinc-600 tracking-[0.1em] uppercase mb-1">
                                {isScaffoldBranch(company) ? "scaffold branch" : company.kind}
                              </p>
                              <h3 className="text-[0.9375rem] font-semibold text-zinc-100">{company.name}</h3>
                              <p className="text-[0.8125rem] text-zinc-500 mt-0.5">{company.sector} · {company.city}</p>
                            </div>
                            <div className="flex flex-wrap gap-2 flex-shrink-0">
                              <span className={`rounded-full px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider ${verificationBadge(company.verification)}`}>
                                {company.verification}
                              </span>
                              <span className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[0.625rem] font-bold text-zinc-300 tracking-wider uppercase">
                                Fit {company.fitScore}
                              </span>
                            </div>
                          </div>
                          <div className="grid gap-3 md:grid-cols-3 mb-3">
                            <InfoLine label="Coverage" value={company.coverage.join(", ")} />
                            <InfoLine label="Phone"    value={company.phone ?? "Need verification"} />
                            <InfoLine
                              label="Forklift"
                              value={company.kind === "carrier"
                                ? company.forkliftConfirmed ? "Confirmed" : "Needs confirmation"
                                : "N/A"}
                            />
                          </div>
                          <p className="text-[0.8125rem] leading-5 text-zinc-400">{company.opportunity}</p>
                        </button>
                      ))}
                  </div>
                </Panel>
              </div>

              <div className="grid gap-5">
                <Panel
                  eyebrow="Company Detail"
                  title={selectedCompany.name}
                  description={selectedCompany.notes}
                >
                  <div className="space-y-4">
                    <DetailGroup label="Address"      value={selectedCompany.address} />
                    <DetailGroup label="Capabilities" value={selectedCompany.capabilities.join(", ")} />
                    <DetailGroup label="Work types"   value={selectedCompany.workTypes.join(", ")} />
                    <DetailGroup label="Evidence"     value={selectedCompany.forkliftEvidence} />
                  </div>

                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {selectedCompany.tags.map(tag => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[0.6875rem] font-medium text-zinc-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <div className="mt-5 space-y-2.5">
                    {selectedCompany.contacts.map(contact => (
                      <div
                        key={`${selectedCompany.id}-${contact.name}`}
                        className="rounded-xl border p-4"
                        style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
                      >
                        <p className="text-[0.875rem] font-semibold text-zinc-100">{contact.name}</p>
                        <p className="text-[0.75rem] text-zinc-600 mt-0.5">{contact.title}</p>
                        <p className="text-[0.8125rem] text-zinc-300 mt-2">
                          {[contact.phone, contact.email].filter(Boolean).join(" · ") || "Need phone / email enrichment"}
                        </p>
                        {contact.notes && <p className="text-[0.8125rem] text-zinc-500 mt-2">{contact.notes}</p>}
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 space-y-2">
                    {selectedCompany.sources.map(source => (
                      <a
                        key={source.url}
                        href={source.url}
                        target="_blank"
                        rel="noreferrer"
                        className="block rounded-xl border p-4 transition-all hover:border-cyan-400/30"
                        style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
                      >
                        <p className="text-[0.875rem] font-semibold text-zinc-100">{source.label}</p>
                        <p className="mt-0.5 break-all text-[0.6875rem] text-cyan-400">{source.url}</p>
                        <p className="mt-2 text-[0.8125rem] text-zinc-500">{source.note}</p>
                      </a>
                    ))}
                  </div>
                </Panel>

                <Panel
                  eyebrow="Research Backlog"
                  title="Where to expand next"
                  description="North Florida and the Panhandle are the biggest coverage gaps for a statewide network."
                >
                  <div className="space-y-2.5">
                    {researchQueue.map(item => (
                      <div
                        key={item.id}
                        className="rounded-xl border p-4"
                        style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" }}
                      >
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <p className="text-[0.875rem] font-semibold text-zinc-100">{item.company}</p>
                            <p className="text-[0.6875rem] font-bold text-zinc-600 tracking-widest uppercase mt-0.5">{item.market}</p>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider flex-shrink-0 ${priorityBadge(item.priority)}`}>
                            {item.priority}
                          </span>
                        </div>
                        <p className="text-[0.8125rem] text-zinc-400">{item.nextAction}</p>
                        <p className="mt-1.5 text-[0.6875rem] text-zinc-600">{item.sourceHint}</p>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>
            </div>
          )}

          {/* ── Map ─────────────────────────────────────────── */}
          {activeTab === "map" && (
            <div className="grid gap-5 xl:grid-cols-[1.4fr_0.9fr]">
              <FloridaMarketMap
                companies={companies}
                selectedId={selectedCompany.id}
                onSelect={setSelectedCompanyId}
              />

              <div className="grid gap-5">
                <Panel
                  eyebrow="Selected"
                  title={selectedCompany.name}
                  description={`${selectedCompany.city} · ${selectedCompany.sector}`}
                >
                  <div className="space-y-4">
                    <DetailGroup label="Coverage"    value={selectedCompany.coverage.join(", ")} />
                    <DetailGroup label="Opportunity" value={selectedCompany.opportunity} />
                    <DetailGroup
                      label="Contact"
                      value={
                        selectedCompany.contacts[0]
                          ? [
                              selectedCompany.contacts[0].name,
                              selectedCompany.contacts[0].phone,
                              selectedCompany.contacts[0].email,
                            ].filter(Boolean).join(" · ")
                          : "Need contact enrichment"
                      }
                    />
                  </div>
                </Panel>

                <Panel eyebrow="Map Notes" title="Territory planning" description="Use this tab for lane matching and carrier clustering.">
                  <ul className="space-y-3 text-[0.8125rem] text-zinc-400 leading-5 list-disc list-inside">
                    <li>Use carriers as geographic anchors; build nearby shippers around each cluster.</li>
                    <li>South Florida and the I-4 corridor should produce the fastest initial freight volume.</li>
                    <li>The Panhandle remains the biggest capacity gap for a statewide promise.</li>
                  </ul>
                </Panel>
              </div>
            </div>
          )}

          {/* ── TMS ─────────────────────────────────────────── */}
          {activeTab === "tms" && (
            <div className="grid gap-5 xl:grid-cols-[1.35fr_1fr]">
              <Panel
                eyebrow="Load Board"
                title="Active brokerage pipeline"
                description="One-person TMS view: what needs a truck, what is booked, and what is ready to bill."
              >
                <div className="space-y-3">
                  {loads.map(load => {
                    const shipper = shipperForLoad(load);
                    const lqs = loadQuotes(load.id);
                    return (
                      <div
                        key={load.id}
                        className="rounded-xl border p-4"
                        style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" }}
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div>
                            <p className="text-[0.6875rem] font-bold text-zinc-600 tracking-[0.1em] uppercase mb-1">{load.id}</p>
                            <h3 className="text-[0.9375rem] font-semibold text-zinc-100">{load.origin} → {load.destination}</h3>
                            <p className="text-[0.8125rem] text-zinc-500 mt-0.5">{shipper?.name ?? "Unknown shipper"} · {load.commodity}</p>
                          </div>
                          <span className={`rounded-full px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider flex-shrink-0 ${stageBadge(load.stage)}`}>
                            {load.stage}
                          </span>
                        </div>
                        <div className="grid gap-3 md:grid-cols-4 mb-3">
                          <InfoLine label="Equipment"   value={load.equipment} />
                          <InfoLine label="Appointment" value={load.appointment} />
                          <InfoLine label="Revenue"     value={currency.format(load.revenue)} />
                          <InfoLine label="Margin"      value={currency.format(load.margin)} />
                        </div>
                        <p className="text-[0.8125rem] text-zinc-400 leading-5 mb-3">{load.notes}</p>
                        {lqs.length > 0 && (
                          <div className="grid gap-2 md:grid-cols-3">
                            {lqs.map(q => {
                              const carrier = carrierForQuote(q);
                              return (
                                <div
                                  key={q.id}
                                  className="rounded-lg border p-3"
                                  style={{ borderColor: "rgba(255,255,255,0.06)", background: "rgba(255,255,255,0.02)" }}
                                >
                                  <p className="text-[0.8125rem] font-semibold text-zinc-200">{carrier?.name ?? "Carrier"}</p>
                                  <p className="text-[0.75rem] text-zinc-500 mt-0.5">{currency.format(q.rate)} · {q.eta}</p>
                                  <p className="mt-1 text-[0.625rem] font-bold text-zinc-600 tracking-wider uppercase">{q.status}</p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </Panel>

              <div className="grid gap-5">
                <Panel
                  eyebrow="Carrier Compliance"
                  title="Book only from the ready list"
                  description="Replaces the spreadsheet + memory problem most solo brokerages rely on."
                >
                  <div className="space-y-2.5">
                    {compliance.map(item => {
                      const carrier = companies.find(c => c.id === item.carrierId);
                      return (
                        <div
                          key={item.id}
                          className="rounded-xl border p-4"
                          style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" }}
                        >
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div>
                              <p className="text-[0.875rem] font-semibold text-zinc-100">{carrier?.name ?? "Carrier"}</p>
                              <p className="text-[0.75rem] text-zinc-500 mt-0.5">{item.packetStatus}</p>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-[0.625rem] font-bold uppercase tracking-wider flex-shrink-0 ${complianceBadge(item.status)}`}>
                              {item.status}
                            </span>
                          </div>
                          <div className="grid gap-2">
                            <InfoLine label="MC verified"     value={item.mcVerified ? "Yes" : "No"} />
                            <InfoLine label="Cargo insurance" value={item.cargoInsurance} />
                            <InfoLine label="COI on file"     value={item.coiOnFile ? "Yes" : "No"} />
                          </div>
                          <p className="mt-3 text-[0.8125rem] text-zinc-400 leading-5">{item.notes}</p>
                        </div>
                      );
                    })}
                  </div>
                </Panel>

                <Panel
                  eyebrow="Solo Broker Ops"
                  title="Minimum viable controls"
                  description="These controls are non-negotiable if you want to scale cleanly from one person."
                >
                  <div className="space-y-2.5">
                    <ControlRow title="Shipper qualification"  body="Track whether the shipper controls freight, project type, urgency profile, and branch footprint." />
                    <ControlRow title="Carrier verification"   body="Verify MC, insurance, service radius, and whether forklift capability is owned or outsourced." />
                    <ControlRow title="Margin discipline"      body="Keep quote, award, and invoice on the same record so every load shows actual gross margin." />
                    <ControlRow title="POD and billing"        body="Don't let delivered loads stall. A one-person shop needs invoice follow-up built into the TMS." />
                  </div>
                </Panel>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}

// ─── UI sub-components ───────────────────────────────────────────

function Panel({
  eyebrow, title, description, children,
}: {
  eyebrow: string; title: string; description: string; children: ReactNode;
}) {
  return (
    <div
      className="rounded-2xl border overflow-hidden"
      style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.02)" }}
    >
      <div
        className="px-5 py-4 border-b"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <p className="text-[0.625rem] font-bold text-zinc-600 tracking-[0.1em] uppercase mb-1.5">{eyebrow}</p>
        <h2 className="text-[1.0625rem] font-semibold text-zinc-100 tracking-tight">{title}</h2>
        <p className="text-[0.8125rem] text-zinc-500 mt-1 leading-5">{description}</p>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function ActionCard({ title, body }: { title: string; body: string }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: "rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.025)" }}
    >
      <h3 className="text-[0.875rem] font-semibold text-zinc-100 mb-2">{title}</h3>
      <p className="text-[0.8125rem] text-zinc-500 leading-5">{body}</p>
    </div>
  );
}

function ReadinessRow({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex items-center justify-between gap-4 rounded-xl border px-4 py-3"
      style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
    >
      <span className="text-[0.8125rem] text-zinc-500">{label}</span>
      <span className="text-[0.8125rem] font-semibold text-zinc-200">{value}</span>
    </div>
  );
}

function DetailGroup({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.625rem] font-bold text-zinc-600 tracking-[0.1em] uppercase mb-1">{label}</p>
      <p className="text-[0.8125rem] text-zinc-300 leading-5">{value}</p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[0.625rem] font-bold text-zinc-600 tracking-[0.1em] uppercase mb-0.5">{label}</p>
      <p className="text-[0.8125rem] text-zinc-400">{value}</p>
    </div>
  );
}

function ControlRow({ title, body }: { title: string; body: string }) {
  return (
    <div
      className="rounded-xl border p-4"
      style={{ borderColor: "rgba(255,255,255,0.07)", background: "rgba(255,255,255,0.02)" }}
    >
      <p className="text-[0.875rem] font-semibold text-zinc-100 mb-1.5">{title}</p>
      <p className="text-[0.8125rem] text-zinc-500 leading-5">{body}</p>
    </div>
  );
}
