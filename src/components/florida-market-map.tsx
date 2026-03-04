"use client";

import dynamic from "next/dynamic";

import type { Company } from "@/types/freight";

const FloridaMarketMapClient = dynamic(
  () =>
    import("@/components/florida-market-map-impl").then(
      (module) => module.FloridaMarketMap,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[640px] w-full items-center justify-center rounded-[1.45rem] border border-white/10 bg-slate-950/80 text-sm text-slate-300">
        Loading interactive map...
      </div>
    ),
  },
);

export function FloridaMarketMap({
  companies,
  selectedId,
  onSelect,
}: {
  companies: Company[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <FloridaMarketMapClient
      companies={companies}
      selectedId={selectedId}
      onSelect={onSelect}
    />
  );
}
