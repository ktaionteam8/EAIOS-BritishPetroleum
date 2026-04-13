import { NextResponse } from "next/server";
import { geminiJSON } from "@/lib/gemini";
import { fetchAllDomains } from "@/lib/api";

const PROMPT = `You are the enterprise AI decision system for a global oil & gas company (British Petroleum).

You will receive multi-domain operational snapshots. Analyze them and produce a SINGLE enterprise-level decision.

Respond ONLY with valid JSON in this exact shape:
{
  "final_decision": "SHORT_UPPERCASE_SNAKE_CASE_LABEL",
  "confidence": 0.85,
  "reason": "One concise sentence explaining the primary driver.",
  "actions": ["Actionable step 1", "Actionable step 2"]
}

Prioritize safety-critical and compliance signals above commercial gains.

DOMAIN DATA:
`;

export async function GET() {
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

  return NextResponse.json({
    ...data,
    source,
    model_used: model || "rule-engine",
    timestamp: new Date().toISOString(),
    domain_inputs: compact,
  });
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
