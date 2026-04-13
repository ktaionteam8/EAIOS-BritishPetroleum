/**
 * Mock-live hybrid data generator for the Manufacturing AI cockpit.
 * Deterministic per-tick seeded values so the UI animates smoothly.
 */

export interface Refinery {
  id: string;
  name: string;
  country: string;
  lat: number;
  lng: number;
  status: "healthy" | "warning" | "critical";
  oee: number;
  throughput_bpd: number;
  alerts: number;
}

export interface FailurePrediction {
  equipment_id: string;
  equipment: string;
  site: string;
  predicted_failure_date: string;
  days_until: number;
  confidence: number;
  severity: "low" | "medium" | "high" | "critical";
}

export interface Benchmark {
  site: string;
  oee: number;
  mtbf_hours: number;
  mttr_hours: number;
  rank: number;
}

export interface AgentHealth {
  agent: string;
  calls_per_day: number;
  latency_ms: number;
  uptime_pct: number;
  status: "healthy" | "degraded" | "down";
}

export interface CrossDomainEvent {
  id: string;
  timestamp: string;
  trigger: string;
  impact: string;
  severity: "info" | "warning" | "critical";
}

const REFINERIES: Omit<Refinery, "status" | "oee" | "alerts">[] = [
  { id: "RF-001", name: "Whiting", country: "USA", lat: 41.67, lng: -87.49, throughput_bpd: 430_000 },
  { id: "RF-002", name: "Rotterdam", country: "NL", lat: 51.89, lng: 4.28, throughput_bpd: 400_000 },
  { id: "RF-003", name: "Gelsenkirchen", country: "DE", lat: 51.51, lng: 7.09, throughput_bpd: 265_000 },
  { id: "RF-004", name: "Cherry Point", country: "USA", lat: 48.85, lng: -122.75, throughput_bpd: 252_000 },
  { id: "RF-005", name: "Castellon", country: "ES", lat: 39.98, lng: -0.05, throughput_bpd: 110_000 },
  { id: "RF-006", name: "Kwinana", country: "AU", lat: -32.23, lng: 115.77, throughput_bpd: 146_000 },
  { id: "RF-007", name: "Mumbai West", country: "IN", lat: 19.02, lng: 72.88, throughput_bpd: 190_000 },
];

function seedVal(key: string, bucket = 15000): number {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) | 0;
  const t = Math.floor(Date.now() / bucket);
  return ((h ^ t) >>> 0) / 0xffffffff;
}

export function generateRefineries(): Refinery[] {
  return REFINERIES.map((r) => {
    const rnd = seedVal(`status-${r.id}`, 20_000);
    const status: Refinery["status"] =
      rnd < 0.1 ? "critical" : rnd < 0.3 ? "warning" : "healthy";
    const oee =
      status === "critical" ? 58 + seedVal(`oee-${r.id}`) * 6 :
      status === "warning" ? 70 + seedVal(`oee-${r.id}`) * 8 :
      82 + seedVal(`oee-${r.id}`) * 10;
    const alerts = status === "critical" ? 3 + Math.floor(seedVal(`al-${r.id}`) * 5) :
                   status === "warning" ? 1 + Math.floor(seedVal(`al-${r.id}`) * 3) :
                   Math.floor(seedVal(`al-${r.id}`) * 2);
    return { ...r, status, oee: Math.round(oee), alerts };
  });
}

export function generateFailurePredictions(): FailurePrediction[] {
  const equipment = [
    { id: "PMP-101", name: "Crude Feed Pump P-101", site: "Whiting" },
    { id: "HX-202", name: "Heat Exchanger HX-202", site: "Rotterdam" },
    { id: "CMP-305", name: "Compressor C-305", site: "Gelsenkirchen" },
    { id: "VLV-408", name: "Control Valve V-408", site: "Cherry Point" },
    { id: "TWR-510", name: "Distillation Tower T-510", site: "Castellon" },
    { id: "PMP-612", name: "Transfer Pump P-612", site: "Kwinana" },
    { id: "HX-708", name: "Shell & Tube HX-708", site: "Mumbai West" },
    { id: "TRB-812", name: "Steam Turbine ST-812", site: "Whiting" },
    { id: "RCT-907", name: "Reactor R-907", site: "Rotterdam" },
    { id: "CMP-1011", name: "Recycle Compressor C-1011", site: "Gelsenkirchen" },
  ];
  return equipment.map((e) => {
    const rnd = seedVal(`fp-${e.id}`, 30_000);
    const days_until = Math.floor(5 + rnd * 85);
    const confidence = 0.60 + rnd * 0.38;
    const severity: FailurePrediction["severity"] =
      days_until < 14 ? "critical" : days_until < 30 ? "high" : days_until < 60 ? "medium" : "low";
    const date = new Date(Date.now() + days_until * 86400_000);
    return {
      equipment_id: e.id,
      equipment: e.name,
      site: e.site,
      predicted_failure_date: date.toISOString().slice(0, 10),
      days_until,
      confidence: Math.round(confidence * 100) / 100,
      severity,
    };
  }).sort((a, b) => a.days_until - b.days_until);
}

export function generateBenchmarks(refineries: Refinery[]): Benchmark[] {
  return refineries
    .map((r) => {
      const rnd = seedVal(`bm-${r.id}`);
      return {
        site: r.name,
        oee: r.oee,
        mtbf_hours: Math.round(2800 + rnd * 2000),
        mttr_hours: Math.round(3 + rnd * 8),
        rank: 0,
      };
    })
    .sort((a, b) => b.oee - a.oee)
    .map((b, i) => ({ ...b, rank: i + 1 }));
}

export function generateAgentHealth(): AgentHealth[] {
  const agents = [
    "MaintenanceAgent", "ProductionAgent", "QualityAgent",
    "DowntimeAgent", "EnergyAgent", "DigitalTwinAgent",
  ];
  return agents.map((a) => {
    const rnd = seedVal(`ah-${a}`, 10_000);
    const calls = Math.round(800 + rnd * 4200);
    const latency = Math.round(40 + rnd * 140);
    const uptime = 99.0 + rnd * 0.99;
    const status: AgentHealth["status"] =
      uptime < 99.3 ? "degraded" : "healthy";
    return {
      agent: a,
      calls_per_day: calls,
      latency_ms: latency,
      uptime_pct: Math.round(uptime * 100) / 100,
      status,
    };
  });
}

export function generateCrossDomainEvents(): CrossDomainEvent[] {
  const templates = [
    { trigger: "MaintenanceAgent: HX-202 vibration anomaly", impact: "Opened work order, notified Supply Chain for spare parts", severity: "warning" as const },
    { trigger: "EnergyAgent: fuel gas pressure drop at Whiting", impact: "Rerouted supply, no throughput loss", severity: "info" as const },
    { trigger: "QualityAgent: RVP off-spec batch #B-4412", impact: "Batch held, downstream Trading alerted", severity: "warning" as const },
    { trigger: "DigitalTwinAgent: simulated yield uplift 2.3%", impact: "Recommended pushing FCC severity +0.5", severity: "info" as const },
    { trigger: "DowntimeAgent: unplanned outage predicted — C-305", impact: "Maintenance window booked for 48h out", severity: "critical" as const },
    { trigger: "ProductionAgent: tight oil blend optimisation", impact: "$180k/day incremental margin estimate", severity: "info" as const },
  ];
  return templates.map((t, i) => ({
    id: `CDE-${i}`,
    timestamp: new Date(Date.now() - i * 60_000 * (2 + (i % 5))).toISOString(),
    ...t,
  }));
}
