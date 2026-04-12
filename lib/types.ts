export type Status = "normal" | "warning" | "critical";

export interface ServiceSummary {
  service: string;
  agent: string;
  port: number;
  status: Status;
  decision: string;
  confidence: number;
  actionable_count: number;
}

export interface DomainSummary {
  slug: string;
  name: string;
  color: string;
  status: Status;
  topDecision: string;
  confidence: number;
  activeServices: number;
  alertCount: number;
  services: ServiceSummary[];
}

export interface MasterDecision {
  final_decision: string;
  confidence: number;
  reason: string;
  actions: string[];
  triggered_rules?: string[];
  timestamp: string;
  domain_inputs?: Record<string, { source: string; top_decision: string; actionable_count: number }>;
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  domain: string;
  severity: Status;
  title: string;
  detail: string;
}
