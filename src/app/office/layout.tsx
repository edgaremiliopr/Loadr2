import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loadr Office — Operations Dashboard",
  description: "Internal brokerage operations dashboard",
};

export default function OfficeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] text-gray-900">
      {children}
    </div>
  );
}
