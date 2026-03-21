import type { Metadata } from "next";
import { PRShipmentTracker } from "@/components/pr-shipment-tracker";

export const metadata: Metadata = {
  title: "PR Shipment Tracker — San Juan & Ponce Ports",
  description: "Track maritime shipments entering Puerto Rico through San Juan and Ponce ports",
};

export default function PRShipmentsPage() {
  return <PRShipmentTracker />;
}
