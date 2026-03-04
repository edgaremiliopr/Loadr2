"use client";

import { useState, type ReactNode } from "react";

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

const tabs = [
  { id: "command", label: "Command" },
  { id: "research", label: "Research" },
  { id: "map", label: "Map" },
  { id: "tms", label: "TMS" },
] as const;

type TabId = (typeof tabs)[number]["id"];
type CompanyFilter = "all" | Company["kind"] | "scaffold";

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

function loadQuotes(loadId: string) {
  return quotes.filter((quote) => quote.loadId === loadId);
}

function shipperForLoad(load: Load) {
  return companies.find((company) => company.id === load.shipperId);
}

function carrierForQuote(quote: Quote) {
  return companies.find((company) => company.id === quote.carrierId);
}

function tabClass(active: boolean) {
  return active
    ? "border border-cyan-400/40 bg-cyan-400/14 text-cyan-100 shadow-[0_10px_30px_rgba(6,182,212,0.18)]"
    : "border border-white/10 bg-white/5 text-slate-300 hover:border-white/20 hover:bg-white/9";
}

function badgeClass(tone: "cyan" | "amber" | "slate" | "rose" | "emerald") {
  if (tone === "cyan") {
    return "border border-cyan-400/30 bg-cyan-400/12 text-cyan-100";
  }

  if (tone === "amber") {
    return "border border-amber-300/30 bg-amber-300/12 text-amber-100";
  }

  if (tone === "rose") {
    return "border border-rose-400/30 bg-rose-400/12 text-rose-100";
  }

  if (tone === "emerald") {
    return "border border-emerald-400/30 bg-emerald-400/12 text-emerald-100";
  }

  return "border border-white/10 bg-white/8 text-slate-200";
}

function priorityClass(priority: string) {
  if (priority === "high") {
    return badgeClass("rose");
  }

  if (priority === "medium") {
    return badgeClass("amber");
  }

  return badgeClass("slate");
}

function stageClass(stage: Load["stage"]) {
  if (stage === "booked" || stage === "delivered" || stage === "invoiced") {
    return badgeClass("emerald");
  }

  if (stage === "quoted" || stage === "dispatched") {
    return badgeClass("cyan");
  }

  return badgeClass("amber");
}

function verificationClass(status: Company["verification"]) {
  if (status === "verified") {
    return badgeClass("emerald");
  }

  if (status === "partial") {
    return badgeClass("amber");
  }

  return badgeClass("slate");
}

function complianceClass(status: (typeof compliance)[number]["status"]) {
  if (status === "ready") {
    return badgeClass("emerald");
  }

  if (status === "expiring") {
    return badgeClass("amber");
  }

  return badgeClass("rose");
}

function isScaffoldBranch(company: Company) {
  return company.tags.includes("scaffold-branch");
}

function scoreAverage(filter: (company: Company) => boolean) {
  const filtered = companies.filter(filter);
  const total = filtered.reduce((sum, company) => sum + company.fitScore, 0);
  return Math.round(total / filtered.length);
}

function companyCount(filter: (company: Company) => boolean) {
  return companies.filter(filter).length;
}

function verifiedForkliftCarriers() {
  return companies.filter(
    (company) =>
      company.kind === "carrier" &&
      company.forkliftConfirmed &&
      company.verification === "verified",
  ).length;
}

export function FreightDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>("command");
  const [companyFilter, setCompanyFilter] = useState<CompanyFilter>("all");
  const [selectedCompanyId, setSelectedCompanyId] = useState(companies[0].id);

  const visibleCompanies = companies.filter((company) => {
    if (companyFilter === "all") {
      return true;
    }

    if (companyFilter === "scaffold") {
      return isScaffoldBranch(company);
    }

    if (companyFilter === "shipper") {
      return company.kind === "shipper" && !isScaffoldBranch(company);
    }

    return company.kind === companyFilter;
  });

  const resolvedSelectedCompanyId = visibleCompanies.some(
    (company) => company.id === selectedCompanyId,
  )
    ? selectedCompanyId
    : visibleCompanies[0]?.id ?? companies[0].id;

  const selectedCompany =
    visibleCompanies.find((company) => company.id === resolvedSelectedCompanyId) ??
    companies.find((company) => company.id === resolvedSelectedCompanyId) ??
    companies[0];

  const openTasks = tasks.filter((task) => task.status !== "done");

  return (
    <main className="relative min-h-screen overflow-hidden px-4 py-6 sm:px-6 lg:px-10">
      <div className="absolute inset-x-0 top-0 h-[28rem] bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.18),transparent_35%),radial-gradient(circle_at_top_right,rgba(251,191,36,0.12),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.16),transparent)]" />
      <div className="absolute inset-x-[10%] top-40 h-64 rounded-full bg-cyan-400/8 blur-3xl" />

      <div className="relative mx-auto flex w-full max-w-[1440px] flex-col gap-6">
        <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.72),rgba(7,17,31,0.9))] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.34)] backdrop-blur sm:p-8">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <p className="text-sm uppercase tracking-[0.42em] text-cyan-300">
                Florida Freight Broker OS
              </p>
              <h1 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.04em] text-slate-50 sm:text-5xl lg:text-6xl">
                Brokerage app for Florida jobsite freight with
                <span className="text-cyan-300"> Moffett / piggyback</span>
                <span className="text-slate-400"> delivery focus.</span>
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
                The product is structured around a one-person brokerage workflow:
                carrier research, shipper prospecting, Florida market mapping,
                compliance, quote tracking, dispatch follow-up and load margin
                visibility in one place.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <MetricCard
                label="Total carriers"
                value={String(companyCount((company) => company.kind === "carrier"))}
                tone="cyan"
                detail="All carrier records in app"
              />
              <MetricCard
                label="Total shippers"
                value={String(companyCount((company) => company.kind === "shipper"))}
                tone="amber"
                detail="Includes scaffold branches"
              />
              <MetricCard
                label="Verified forklift carriers"
                value={String(verifiedForkliftCarriers())}
                tone="slate"
                detail="Verified + forklift confirmed"
              />
              <MetricCard
                label="Open tasks"
                value={String(openTasks.length)}
                tone="emerald"
                detail="Prospecting + compliance"
              />
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${tabClass(activeTab === tab.id)}`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </section>

        {activeTab === "command" ? (
          <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
            <div className="grid gap-6">
              <Panel
                eyebrow="Launch Plan"
                title="What this brokerage should run from day one"
                description="The app includes the extra functions a one-person freight brokerage needs beyond a basic CRM."
              >
                <div className="grid gap-4 md:grid-cols-2">
                  <ActionCard
                    title="Research pipeline"
                    body="Every target carries verification status, public sources, contacts and notes about whether the freight is shipper-controlled."
                  />
                  <ActionCard
                    title="Carrier compliance"
                    body="Carrier packet, COI, MC verification and readiness are tracked so you do not book off memory."
                  />
                  <ActionCard
                    title="Quote desk"
                    body="Compare carrier quotes against shipper opportunities and keep margin visible before awarding the load."
                  />
                  <ActionCard
                    title="Daily playbook"
                    body="Tasks, open loads and next-call priorities keep a solo brokerage moving without a separate tool stack."
                  />
                </div>
              </Panel>

              <Panel
                eyebrow="Market Focus"
                title="Florida build-out priorities"
                description="Start where both shipper density and forklift-capable delivery demand are strongest."
              >
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  {metroFocus.map((metro) => (
                    <div
                      key={metro.name}
                      className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5"
                    >
                      <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                        {metro.name}
                      </p>
                      <p className="mt-3 text-sm leading-6 text-slate-300">
                        {metro.note}
                      </p>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>

            <div className="grid gap-6">
              <Panel
                eyebrow="Daily Playbook"
                title="Highest-value calls today"
                description="These are the actions that directly increase usable capacity or qualified shipper pipeline."
              >
                <div className="space-y-3">
                  {openTasks.slice(0, 4).map((task) => (
                    <div
                      key={task.id}
                      className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="text-sm font-medium text-slate-100">
                          {task.title}
                        </p>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${priorityClass(task.priority)}`}
                        >
                          {task.priority}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-400">{task.notes}</p>
                      <p className="mt-3 text-xs uppercase tracking-[0.2em] text-slate-400">
                        Due {task.due}
                      </p>
                    </div>
                  ))}
                </div>
              </Panel>

              <Panel
                eyebrow="Snapshot"
                title="Network readiness"
                description="A small but usable starter network is already seeded."
              >
                <div className="space-y-4">
                  <ReadinessRow
                    label="Carrier fit score"
                    value={`${scoreAverage((company) => company.kind === "carrier")}/100`}
                  />
                  <ReadinessRow
                    label="Shipper fit score"
                    value={`${scoreAverage((company) => company.kind === "shipper" && !isScaffoldBranch(company))}/100`}
                  />
                  <ReadinessRow
                    label="Carrier packet ready"
                    value={`${compliance.filter((item) => item.status === "ready").length}/${companyCount((company) => company.kind === "carrier")}`}
                  />
                  <ReadinessRow
                    label="Florida metros covered"
                    value="Panhandle / North / Central / South / SW"
                  />
                </div>
              </Panel>
            </div>
          </section>
        ) : null}

        {activeTab === "research" ? (
          <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
            <div className="grid gap-6">
              <Panel
                eyebrow="Target Database"
                title="Florida carrier + shipper research"
                description="Use the filter to isolate carriers, parent shippers, scaffold branches or the full Florida prospect base."
              >
                <div className="mb-5 flex flex-wrap gap-3">
                  {[
                    { id: "all", label: "All companies" },
                    { id: "carrier", label: "Carriers" },
                    { id: "shipper", label: "Parent shippers" },
                    { id: "scaffold", label: "Scaffold branches" },
                  ].map((filter) => (
                    <button
                      key={filter.id}
                      type="button"
                      onClick={() => setCompanyFilter(filter.id as CompanyFilter)}
                      className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                        companyFilter === filter.id
                          ? "border border-cyan-400/40 bg-cyan-400/14 text-cyan-100"
                          : "border border-white/10 bg-white/6 text-slate-300 hover:bg-white/10"
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>

                <div className="grid gap-4">
                  {visibleCompanies
                    .slice()
                    .sort((a, b) => b.fitScore - a.fitScore)
                    .map((company) => (
                      <button
                        key={company.id}
                        type="button"
                        onClick={() => setSelectedCompanyId(company.id)}
                        className={`rounded-[1.6rem] border p-5 text-left transition ${
                          selectedCompanyId === company.id
                            ? "border-cyan-400/40 bg-cyan-400/8 shadow-[0_18px_45px_rgba(8,145,178,0.18)]"
                            : "border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/7"
                        }`}
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                              {isScaffoldBranch(company) ? "scaffold branch" : company.kind}
                            </p>
                            <h3 className="mt-2 text-xl font-semibold text-slate-100">
                              {company.name}
                            </h3>
                            <p className="mt-2 text-sm text-slate-400">
                              {company.sector} • {company.city}
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${verificationClass(company.verification)}`}
                            >
                              {company.verification}
                            </span>
                            <span className="rounded-full border border-white/10 bg-slate-950/80 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-100">
                              Fit {company.fitScore}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm text-slate-400 md:grid-cols-3">
                          <InfoLine label="Coverage" value={company.coverage.join(", ")} />
                          <InfoLine label="Phone" value={company.phone ?? "Need verification"} />
                          <InfoLine
                            label="Forklift status"
                            value={
                              company.kind === "carrier"
                                ? company.forkliftConfirmed
                                  ? "Confirmed"
                                  : "Needs confirmation"
                                : "N/A"
                            }
                          />
                        </div>

                        <p className="mt-4 text-sm leading-6 text-slate-300">
                          {company.opportunity}
                        </p>
                      </button>
                    ))}
                </div>
              </Panel>
            </div>

            <div className="grid gap-6">
              <Panel
                eyebrow="Company Detail"
                title={selectedCompany.name}
                description={selectedCompany.notes}
              >
                <div className="space-y-4 text-sm text-slate-300">
                  <DetailGroup label="Address" value={selectedCompany.address} />
                  <DetailGroup
                    label="Capabilities"
                    value={selectedCompany.capabilities.join(", ")}
                  />
                  <DetailGroup
                    label="Work types"
                    value={selectedCompany.workTypes.join(", ")}
                  />
                  <DetailGroup
                    label="Evidence"
                    value={selectedCompany.forkliftEvidence}
                  />
                </div>

                <div className="mt-5 flex flex-wrap gap-2">
                  {selectedCompany.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-xs font-medium text-slate-200"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  {selectedCompany.contacts.map((contact) => (
                    <div
                      key={`${selectedCompany.id}-${contact.name}`}
                      className="rounded-[1.1rem] border border-white/10 bg-white/5 p-4"
                    >
                      <p className="font-medium text-slate-100">{contact.name}</p>
                      <p className="text-sm text-slate-500">{contact.title}</p>
                      <p className="mt-2 text-sm text-slate-300">
                        {[contact.phone, contact.email].filter(Boolean).join(" • ") ||
                          "Need phone / email enrichment"}
                      </p>
                      {contact.notes ? (
                        <p className="mt-2 text-sm text-slate-400">
                          {contact.notes}
                        </p>
                      ) : null}
                    </div>
                  ))}
                </div>

                <div className="mt-6 space-y-3">
                  {selectedCompany.sources.map((source) => (
                    <a
                      key={source.url}
                      href={source.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block rounded-[1.1rem] border border-white/10 bg-white/5 p-4 transition hover:border-cyan-400/40 hover:bg-white/7"
                    >
                      <p className="text-sm font-medium text-slate-100">
                        {source.label}
                      </p>
                      <p className="mt-1 break-all text-xs text-cyan-300">
                        {source.url}
                      </p>
                      <p className="mt-2 text-sm text-slate-400">{source.note}</p>
                    </a>
                  ))}
                </div>
              </Panel>

              <Panel
                eyebrow="Research Backlog"
                title="Where to expand next"
                description="The seed list is usable, but statewide coverage needs more sourcing in North Florida and the Panhandle."
              >
                <div className="space-y-3">
                  {researchQueue.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-100">
                            {item.company}
                          </p>
                          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
                            {item.market}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${priorityClass(item.priority)}`}
                        >
                          {item.priority}
                        </span>
                      </div>
                      <p className="mt-3 text-sm text-slate-300">{item.nextAction}</p>
                      <p className="mt-2 text-xs text-slate-500">
                        {item.sourceHint}
                      </p>
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </section>
        ) : null}

        {activeTab === "map" ? (
          <section className="grid gap-6 xl:grid-cols-[1.4fr_0.9fr]">
            <FloridaMarketMap
              companies={visibleCompanies}
              selectedId={resolvedSelectedCompanyId}
              onSelect={setSelectedCompanyId}
            />

            <div className="grid gap-6">
              <Panel
                eyebrow="Selected Company"
                title={selectedCompany.name}
                description={`${selectedCompany.city} • ${selectedCompany.sector}`}
              >
                <div className="space-y-4">
                  <DetailGroup
                    label="Coverage"
                    value={selectedCompany.coverage.join(", ")}
                  />
                  <DetailGroup
                    label="Opportunity"
                    value={selectedCompany.opportunity}
                  />
                  <DetailGroup
                    label="Contact"
                    value={
                      selectedCompany.contacts[0]
                        ? [
                            selectedCompany.contacts[0].name,
                            selectedCompany.contacts[0].phone,
                            selectedCompany.contacts[0].email,
                          ]
                            .filter(Boolean)
                            .join(" • ")
                        : "Need contact enrichment"
                    }
                  />
                </div>
              </Panel>

              <Panel
                eyebrow="Map Notes"
                title="How to use this tab"
                description="This is meant for territory planning, calling routes and quick lane matching."
              >
                <ul className="space-y-3 text-sm leading-6 text-slate-300">
                  <li>
                    Use carriers as geographic anchors and then build nearby
                    shippers around each cluster.
                  </li>
                  <li>
                    South Florida and the I-4 corridor should produce the
                    fastest initial freight volume.
                  </li>
                  <li>
                    The Panhandle remains the biggest capacity gap for a
                    statewide promise.
                  </li>
                </ul>
              </Panel>
            </div>
          </section>
        ) : null}

        {activeTab === "tms" ? (
          <section className="grid gap-6">
            <div className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
              <Panel
                eyebrow="Load Board"
                title="Active brokerage pipeline"
                description="This gives you the core one-person TMS view: what needs a truck, what is booked and what is ready to bill."
              >
                <div className="grid gap-4">
                  {loads.map((load) => {
                    const shipper = shipperForLoad(load);
                    const availableQuotes = loadQuotes(load.id);

                    return (
                      <div
                        key={load.id}
                        className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-[0.28em] text-slate-500">
                              {load.id}
                            </p>
                            <h3 className="mt-2 text-lg font-semibold text-slate-100">
                              {load.origin} → {load.destination}
                            </h3>
                            <p className="mt-2 text-sm text-slate-400">
                              {shipper?.name ?? "Unknown shipper"} • {load.commodity}
                            </p>
                          </div>
                          <span
                            className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${stageClass(load.stage)}`}
                          >
                            {load.stage}
                          </span>
                        </div>

                        <div className="mt-4 grid gap-3 text-sm text-slate-400 md:grid-cols-4">
                          <InfoLine label="Equipment" value={load.equipment} />
                          <InfoLine label="Appointment" value={load.appointment} />
                          <InfoLine
                            label="Revenue"
                            value={currency.format(load.revenue)}
                          />
                          <InfoLine
                            label="Margin"
                            value={currency.format(load.margin)}
                          />
                        </div>

                        <p className="mt-4 text-sm leading-6 text-slate-300">
                          {load.notes}
                        </p>

                        {availableQuotes.length > 0 ? (
                          <div className="mt-4 grid gap-3 md:grid-cols-3">
                            {availableQuotes.map((quote) => {
                              const carrier = carrierForQuote(quote);

                              return (
                                <div
                                  key={quote.id}
                                  className="rounded-[1.1rem] border border-white/10 bg-white/4 p-4"
                                >
                                  <p className="text-sm font-medium text-slate-100">
                                    {carrier?.name ?? "Carrier"}
                                  </p>
                                  <p className="mt-1 text-sm text-slate-400">
                                    {currency.format(quote.rate)} • {quote.eta}
                                  </p>
                                  <p className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-500">
                                    {quote.status}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              </Panel>

              <div className="grid gap-6">
                <Panel
                  eyebrow="Carrier Compliance"
                  title="Book only from the ready list"
                  description="This replaces the spreadsheet + memory problem most solo brokerages run into."
                >
                  <div className="space-y-3">
                    {compliance.map((item) => {
                      const carrier = companies.find(
                        (company) => company.id === item.carrierId,
                      );

                      return (
                        <div
                          key={item.id}
                          className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-sm font-medium text-slate-100">
                                {carrier?.name ?? "Carrier"}
                              </p>
                              <p className="mt-1 text-sm text-slate-400">
                                {item.packetStatus}
                              </p>
                            </div>
                            <span
                              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${complianceClass(item.status)}`}
                            >
                              {item.status}
                            </span>
                          </div>

                          <div className="mt-3 grid gap-2 text-sm text-slate-400">
                            <InfoLine
                              label="MC verified"
                              value={item.mcVerified ? "Yes" : "No"}
                            />
                            <InfoLine
                              label="Cargo insurance"
                              value={item.cargoInsurance}
                            />
                            <InfoLine
                              label="COI on file"
                              value={item.coiOnFile ? "Yes" : "No"}
                            />
                          </div>

                          <p className="mt-3 text-sm text-slate-300">{item.notes}</p>
                        </div>
                      );
                    })}
                  </div>
                </Panel>

                <Panel
                  eyebrow="Solo Broker Ops"
                  title="Minimum viable controls"
                  description="These controls are not optional if you want to scale cleanly from one person."
                >
                  <div className="space-y-3 text-sm leading-6 text-slate-300">
                    <ControlRow title="Shipper qualification" body="Track whether the shipper controls freight, project type, urgency profile and branch footprint." />
                    <ControlRow title="Carrier verification" body="Verify MC, insurance, service radius and whether forklift capability is owned or outsourced." />
                    <ControlRow title="Margin discipline" body="Keep quote, award and invoice on the same record so every load shows actual gross margin." />
                    <ControlRow title="POD and billing" body="Do not let delivered loads stall; a one-person shop needs invoice follow-up built into the TMS." />
                  </div>
                </Panel>
              </div>
            </div>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function Panel({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.74),rgba(9,16,30,0.92))] p-6 shadow-[0_24px_60px_rgba(0,0,0,0.28)] backdrop-blur">
      <p className="text-xs uppercase tracking-[0.32em] text-slate-500">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-2xl font-semibold tracking-[-0.03em] text-slate-100">
        {title}
      </h2>
      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
        {description}
      </p>
      <div className="mt-6">{children}</div>
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone: "cyan" | "amber" | "slate" | "emerald";
}) {
  const toneClass =
    tone === "cyan"
      ? "from-cyan-400/16 to-cyan-400/3"
      : tone === "amber"
        ? "from-amber-300/18 to-amber-300/4"
        : tone === "emerald"
          ? "from-emerald-400/18 to-emerald-400/4"
          : "from-slate-400/12 to-slate-300/3";

  return (
    <div
      className={`rounded-[1.5rem] border border-white/10 bg-gradient-to-br ${toneClass} p-4`}
    >
      <p className="text-xs uppercase tracking-[0.24em] text-slate-500">
        {label}
      </p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-slate-50">
        {value}
      </p>
      <p className="mt-2 text-sm text-slate-400">{detail}</p>
    </div>
  );
}

function ActionCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.5rem] border border-white/10 bg-white/5 p-5">
      <h3 className="text-lg font-medium text-slate-100">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-400">{body}</p>
    </div>
  );
}

function ReadinessRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3">
      <span className="text-sm text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-100">{value}</span>
    </div>
  );
}

function DetailGroup({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-2 leading-6 text-slate-300">{value}</p>
    </div>
  );
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{label}</p>
      <p className="mt-1 text-sm text-slate-300">{value}</p>
    </div>
  );
}

function ControlRow({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/10 bg-white/5 p-4">
      <p className="font-medium text-slate-100">{title}</p>
      <p className="mt-2 text-sm text-slate-400">{body}</p>
    </div>
  );
}
