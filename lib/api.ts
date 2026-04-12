import axios from "axios";
import { DOMAINS } from "./domains";
import type { DomainSummary, MasterDecision, ServiceSummary, Status, ActivityEvent } from "./types";

const MASTER_URL = process.env.NEXT_PUBLIC_MASTER_URL || "http://localhost:8000";

const client = axios.create({ timeout: 1500 });

// ---------- Helpers ----------

function pickStatus(rnd: number): Status {
  if (rnd < 0.08) return "critical";
  if (rnd < 0.3) return "warning";
  return "normal";
}

function seedFromString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  // Oscillating so status varies per refresh tick
  const t = Math.floor(Date.now() / 10000);
  return ((h ^ t) >>> 0) / 0xffffffff;
}

const SAMPLE_DECISIONS: Record<string, string[]> = {
  manufacturing: ["NORMAL", "HIGH_RISK", "SCHEDULE_MAINTENANCE", "MONITOR"],
  "supply-chain": ["NORMAL", "STOCKOUT_RISK", "REPLENISH", "OVERSTOCK"],
  "commercial-trading": ["BUY", "SELL", "HOLD", "ARBITRAGE_DETECTED"],
  "hr-safety": ["NORMAL", "MONITOR", "ALERT", "RETAIN"],
  "it-cybersecurity": ["NORMAL", "THREAT", "SUSPICIOUS", "SCALE_UP"],
  finance: ["STABLE", "GROWTH", "INVEST", "COMPLIANT"],
};

// ---------- Mock builders ----------

function buildMockDomain(slug: string, name: string, color: string, services: readonly { service: string; agent: string; port: number }[]): DomainSummary {
  const svcs: ServiceSummary[] = services.map((s) => {
    const r = seedFromString(s.service);
    const status = pickStatus(r);
    const pool = SAMPLE_DECISIONS[slug] || ["NORMAL"];
    const decision = pool[Math.floor(r * pool.length)];
    return {
      service: s.service,
      agent: s.agent,
      port: s.port,
      status,
      decision,
      confidence: 0.6 + r * 0.35,
      actionable_count: Math.floor(r * 20),
    };
  });

  const worst = svcs.reduce<Status>((acc, s) => {
    if (s.status === "critical" || acc === "critical") return "critical";
    if (s.status === "warning") return "warning";
    return acc;
  }, "normal");

  const top = svcs.slice().sort((a, b) => b.confidence - a.confidence)[0];

  return {
    slug,
    name,
    color,
    status: worst,
    topDecision: top.decision,
    confidence: top.confidence,
    activeServices: svcs.length,
    alertCount: svcs.filter((s) => s.status !== "normal").reduce((a, s) => a + s.actionable_count, 0),
    services: svcs,
  };
}

function buildMockMaster(domains: DomainSummary[]): MasterDecision {
  const anyCritical = domains.some((d) => d.status === "critical");
  const anyWarning = domains.some((d) => d.status === "warning");

  let final = "CONTINUE_NORMAL_OPS";
  let confidence = 0.78;
  let reason = "All domains within acceptable bands";
  const actions: string[] = [];

  const mfg = domains.find((d) => d.slug === "manufacturing");
  const scm = domains.find((d) => d.slug === "supply-chain");
  const trd = domains.find((d) => d.slug === "commercial-trading");
  const fin = domains.find((d) => d.slug === "finance");
  const it = domains.find((d) => d.slug === "it-cybersecurity");

  if (it?.status === "critical") {
    final = "HALT_OPERATIONS_SAFETY";
    confidence = 0.94;
    reason = "OT security flags critical threat";
    actions.push("Isolate affected OT assets; escalate to SOC");
  } else if (mfg?.status === "critical" && scm?.status !== "normal") {
    final = "ORDER_PARTS_AND_SCHEDULE_MAINTENANCE";
    confidence = 0.9;
    reason = "Maintenance risk elevated while spare inventory is low";
    actions.push("Order spare parts", "Schedule maintenance window");
  } else if (trd?.topDecision === "BUY" && fin?.topDecision === "INVEST") {
    final = "EXECUTE_TRADE";
    confidence = 0.88;
    reason = "Trading BUY aligns with treasury INVEST";
    actions.push("Execute crude BUY trade", "Deploy treasury surplus");
  } else if (anyCritical) {
    final = "INVESTIGATE_CRITICAL_DOMAIN";
    confidence = 0.85;
    reason = "At least one domain reporting critical status";
    actions.push("Drill into critical domain for root cause");
  } else if (anyWarning) {
    final = "MONITOR_CLOSELY";
    confidence = 0.8;
    reason = "Warning signals in one or more domains";
    actions.push("Increase polling frequency on warning domains");
  }

  return {
    final_decision: final,
    confidence,
    reason,
    actions,
    triggered_rules: [],
    timestamp: new Date().toISOString(),
  };
}

function buildMockActivity(domains: DomainSummary[]): ActivityEvent[] {
  const events: ActivityEvent[] = [];
  domains.forEach((d) => {
    d.services
      .filter((s) => s.status !== "normal")
      .slice(0, 2)
      .forEach((s, i) =>
        events.push({
          id: `${d.slug}-${s.service}-${i}`,
          timestamp: new Date(Date.now() - Math.floor(Math.random() * 1000 * 60 * 10)).toISOString(),
          domain: d.name,
          severity: s.status,
          title: `${s.agent}: ${s.decision}`,
          detail: `${s.actionable_count} actionable items in ${s.service}`,
        }),
      );
  });
  return events.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)).slice(0, 10);
}

// ---------- Public API ----------

export async function fetchAllDomains(): Promise<DomainSummary[]> {
  return DOMAINS.map((d) => buildMockDomain(d.slug, d.name, d.color, d.services));
}

export async function fetchDomain(slug: string): Promise<DomainSummary | null> {
  const meta = DOMAINS.find((d) => d.slug === slug);
  if (!meta) return null;
  return buildMockDomain(meta.slug, meta.name, meta.color, meta.services);
}

export async function fetchMasterDecision(): Promise<MasterDecision> {
  try {
    const { data } = await client.get<MasterDecision>(`${MASTER_URL}/api/decision`);
    return data;
  } catch {
    const domains = await fetchAllDomains();
    return buildMockMaster(domains);
  }
}

export async function fetchActivity(): Promise<ActivityEvent[]> {
  const domains = await fetchAllDomains();
  return buildMockActivity(domains);
}

export async function fetchDomainTimeseries(slug: string): Promise<{ t: string; value: number; baseline: number }[]> {
  // Generate a 24-point timeseries seeded per domain
  const base = DOMAINS.find((d) => d.slug === slug);
  if (!base) return [];
  const r0 = seedFromString(slug);
  const points = [] as { t: string; value: number; baseline: number }[];
  for (let i = 23; i >= 0; i--) {
    const r = seedFromString(`${slug}-${i}`);
    const value = 40 + Math.sin((i + r0 * 10) / 3) * 20 + r * 25;
    const baseline = 55 + Math.sin((i + r0 * 10) / 3) * 10;
    const t = new Date(Date.now() - i * 60 * 60 * 1000).toISOString().slice(11, 16);
    points.push({ t, value: Math.round(value), baseline: Math.round(baseline) });
  }
  return points;
}
