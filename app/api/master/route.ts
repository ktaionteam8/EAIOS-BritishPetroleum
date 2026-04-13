import { NextResponse } from "next/server";
import { geminiJSON } from "@/lib/gemini";
import { fetchAllDomains } from "@/lib/api";

/**
 * Cached master decision.
 *
 * Design: Gemini is NOT called on every poll. The master decision is computed
 * at most once every CACHE_TTL_MS. Dashboard polls at 8s but only refreshes
 * the Gemini call every 60s — rule-based result used in between.
 */

const CACHE_TTL_MS = 60_000;

declare global {
  // eslint-disable-next-line no-var
  var __master_cache: { data: any; at: number } | undefined;
}

const PROMPT = `You are the enterprise AI decision system for British Petroleum.

Analyze the multi-domain snapshot and produce a SINGLE enterprise-level decision.
Respond ONLY with valid JSON:
{
  "final_decision": "SHORT_UPPERCASE_LABEL",
  "confidence": 0.85,
  "reason": "One concise sentence.",
  "actions": ["Action 1", "Action 2"]
}

Priority: safety/compliance > ops > commercial.

DATA:
`;

export async function GET() {
  const now = Date.now();
  const cached = globalThis.__master_cache;

  if (cached && now - cached.at < CACHE_TTL_MS) {
    return NextResponse.json({ ...cached.data, cached: true, cache_age_ms: now - cached.at });
  }

  const domains = await fetchAllDomains();
  const compact = domains.map((d) => ({
    domain: d.name,
    status: d.status,
    top_decision: d.topDecision,
    confidence: Number(d.confidence.toFixed(2)),
    alert_count: d.alertCount,
  }));

  const fallback = buildFallback(domains);
  const { data, source, model } = await geminiJSON(PROMPT + JSON.stringify(compact, null, 2), fallback);

  const result = {
    ...data,
    source,
    model_used: model || "rule-engine",
    timestamp: new Date().toISOString(),
    domain_inputs: compact,
  };

  globalThis.__master_cache = { data: result, at: now };

  return NextResponse.json({ ...result, cached: false });
}

function buildFallback(domains: any[]): { final_decision: string; confidence: number; reason: string; actions: string[] } {
  const anyCritical = domains.some((d) => d.status === "critical");
  const mfg = domains.find((d) => d.slug === "manufacturing");
  const scm = domains.find((d) => d.slug === "supply-chain");
  const trd = domains.find((d) => d.slug === "commercial-trading");
  const fin = domains.find((d) => d.slug === "finance");
  const it = domains.find((d) => d.slug === "it-cybersecurity");

  if (it?.status === "critical") {
    return { final_decision: "HALT_OPERATIONS_SAFETY", confidence: 0.94, reason: "OT security flags critical threat", actions: ["Isolate affected OT assets", "Escalate to SOC"] };
  }
  if (mfg?.status === "critical" && scm && scm.status !== "normal") {
    return { final_decision: "ORDER_PARTS_AND_SCHEDULE_MAINTENANCE", confidence: 0.9, reason: "Maintenance risk elevated while spare inventory is low", actions: ["Order spare parts", "Schedule maintenance window"] };
  }
  if (trd?.topDecision === "BUY" && fin?.topDecision === "INVEST") {
    return { final_decision: "EXECUTE_TRADE", confidence: 0.88, reason: "Trading BUY aligns with treasury INVEST", actions: ["Execute crude BUY trade", "Deploy treasury surplus"] };
  }
  if (anyCritical) {
    return { final_decision: "INVESTIGATE_CRITICAL_DOMAIN", confidence: 0.85, reason: "At least one domain reporting critical status", actions: ["Drill into critical domain for root cause"] };
  }
  return { final_decision: "CONTINUE_NORMAL_OPS", confidence: 0.78, reason: "All domains within acceptable bands", actions: [] };
}
