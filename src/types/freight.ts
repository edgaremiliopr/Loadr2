export type CompanyKind = "carrier" | "shipper";

export type VerificationStatus = "verified" | "partial" | "research";

export type LoadStage =
  | "sourcing"
  | "quoted"
  | "booked"
  | "dispatched"
  | "delivered"
  | "invoiced";

export type TaskPriority = "high" | "medium" | "low";

export interface CompanyContact {
  name: string;
  title: string;
  phone?: string;
  email?: string;
  notes?: string;
}

export interface CompanySource {
  label: string;
  url: string;
  note: string;
}

export interface Company {
  id: string;
  kind: CompanyKind;
  name: string;
  sector: string;
  address: string;
  city: string;
  region: string;
  phone?: string;
  email?: string;
  website: string;
  coverage: string[];
  lat: number;
  lng: number;
  capabilities: string[];
  forkliftConfirmed: boolean | null;
  forkliftEvidence: string;
  workTypes: string[];
  tags: string[];
  fitScore: number;
  verification: VerificationStatus;
  contacts: CompanyContact[];
  notes: string;
  opportunity: string;
  sources: CompanySource[];
}

export interface Load {
  id: string;
  shipperId: string;
  origin: string;
  destination: string;
  equipment: string;
  commodity: string;
  stage: LoadStage;
  revenue: number;
  margin: number;
  appointment: string;
  notes: string;
}

export interface Task {
  id: string;
  title: string;
  owner: string;
  due: string;
  priority: TaskPriority;
  status: "open" | "blocked" | "done";
  notes: string;
}

export interface Quote {
  id: string;
  loadId: string;
  carrierId: string;
  rate: number;
  eta: string;
  status: "pending" | "approved" | "backup";
  notes: string;
}

export interface ComplianceItem {
  id: string;
  carrierId: string;
  status: "ready" | "missing" | "expiring";
  mcVerified: boolean;
  cargoInsurance: string;
  coiOnFile: boolean;
  packetStatus: string;
  notes: string;
}

export interface ResearchQueueItem {
  id: string;
  segment: "carrier" | "shipper";
  company: string;
  market: string;
  nextAction: string;
  priority: TaskPriority;
  sourceHint: string;
}
