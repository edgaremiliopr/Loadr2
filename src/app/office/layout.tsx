import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Loadr Office — Operations Dashboard",
  description: "Internal brokerage operations dashboard",
};

/**
 * Dark-themed layout wrapper for the /office route.
 * Restores the original dark background so the FreightDashboard
 * renders correctly regardless of the root body background.
 */
export default function OfficeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        background: "#07111f",
        color: "#e5eefb",
        minHeight: "100vh",
        backgroundImage:
          "radial-gradient(circle at top left, rgba(34,211,238,0.11), transparent 30%), " +
          "radial-gradient(circle at top right, rgba(245,158,11,0.08), transparent 24%), " +
          "linear-gradient(180deg, #08111d 0%, #07111f 34%, #050d18 100%)",
      }}
    >
      {children}
    </div>
  );
}
