"""
master_agent.py - EAIOS Scalable Master Decision Agent (Claude-powered)
========================================================================
Central AI brain of the EAIOS (Enterprise AI Operating System) for
British Petroleum.

This agent:
* Loads structured JSON outputs from all worker agents
* Normalises records into a unified schema
* Classifies entities by domain
* Identifies critical entities and risk clusters
* Detects cascading risks across domains
* Builds a comprehensive prompt for Claude
* Calls the Anthropic API (or mocks the decision)
* Returns a structured master decision with recommended actions

Architecture
------------
Worker agents communicate with the Master Agent ONLY via JSON files
or REST API.  There are NO direct Python imports from worker agents.

    Sensor Data -> Predictive Maintenance Agent -> JSON output
    SAP PP Data -> Production Agent              -> JSON output
    Inspection  -> Quality Agent                 -> JSON output
    Demand Data -> Demand Agent                  -> JSON output
    Inventory   -> Inventory Agent               -> JSON output
    Shipments   -> Logistics Agent               -> JSON output
                         |
                         v
              Master Decision Agent
                    (this file)
                         |
                         v
              Unified Decision Report
"""
import collections
import json
import os
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

try:
    import anthropic
except ImportError:
    anthropic = None  # type: ignore[assignment]

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
DEFAULT_OUTPUTS_DIR = "outputs"
DEFAULT_OUTPUT_FILE = "master_decision_output.json"
DEFAULT_MODEL = "claude-sonnet-4-20250514"

STATUS_MAP: dict[str, str] = {
    "HIGH_RISK": "HIGH_RISK",
    "MEDIUM_RISK": "MEDIUM_RISK",
    "LOW_RISK": "LOW_RISK",
    "DELAYED": "HIGH_RISK",
    "AT_RISK": "MEDIUM_RISK",
    "LOW_EFFICIENCY": "MEDIUM_RISK",
    "ON_TRACK": "LOW_RISK",
    "CRITICAL": "HIGH_RISK",
    "MONITOR": "MEDIUM_RISK",
    "PASS": "LOW_RISK",
}

STATUS_DEFAULT_SCORE: dict[str, float] = {
    "HIGH_RISK": 0.90,
    "MEDIUM_RISK": 0.50,
    "LOW_RISK": 0.10,
}

STATUS_SEVERITY: dict[str, int] = {
    "CRITICAL": 4,
    "HIGH_RISK": 3,
    "AT_RISK": 2,
    "MONITOR": 1,
    "LOW_RISK": 0,
}


# ---------------------------------------------------------------------------
# 1. Load worker agent outputs
# ---------------------------------------------------------------------------
def load_all_outputs(folder: str = DEFAULT_OUTPUTS_DIR) -> dict[str, list[dict]]:
    """Load every *_output.json file from *folder* and return {filename: records}."""
    results: dict[str, list] = {}
    p = Path(folder)
    if not p.exists():
        print(f"[WARN] Output folder '{folder}' does not exist.", file=sys.stderr)
        return results
    for fp in sorted(p.glob("*_output.json")):
        try:
            data = json.loads(fp.read_text(encoding="utf-8"))
            if isinstance(data, list):
                results[fp.name] = data
        except Exception as exc:
            print(f"[WARN] Skipping {fp.name}: {exc}", file=sys.stderr)
    return results


# ---------------------------------------------------------------------------
# 2. Normalisation helpers
# ---------------------------------------------------------------------------
def _extract_entity_id(record: dict) -> str:
    for key in ("machine_id", "order_id", "inspection_lot_id",
                "entity_id", "shipment_id", "product_id"):
        if key in record:
            return str(record[key])
    return "unknown"


def _infer_entity_type(record: dict) -> str:
    agent = record.get("agent", "").lower()
    if "maintenance" in agent:
        return "machine"
    if "production" in agent:
        return "production_order"
    if "quality" in agent:
        return "inspection_lot"
    if "demand" in agent:
        return "product_demand"
    if "inventory" in agent:
        return "inventory_item"
    if "logistics" in agent:
        return "shipment"
    return "entity"


def _extract_risk_score(record: dict) -> float:
    for key in ("failure_probability", "risk_score",
                "defect_probability", "production_delay_score"):
        if key in record:
            return float(record[key])
    status = STATUS_MAP.get(record.get("status", ""), "LOW_RISK")
    return STATUS_DEFAULT_SCORE.get(status, 0.3)


def _extract_context(record: dict) -> dict:
    """Pull key contextual fields for the prompt."""
    ctx: dict[str, Any] = {}
    for k in ("reason", "status", "plant", "material", "product_type",
              "carrier", "origin", "destination", "condition"):
        if k in record:
            ctx[k] = record[k]
    return ctx


def normalize_record(record: dict) -> dict:
    return {
        "entity_id": _extract_entity_id(record),
        "entity_type": _infer_entity_type(record),
        "domain": record.get("agent", "unknown"),
        "risk_score": _extract_risk_score(record),
        "status": record.get("status", "UNKNOWN"),
        "reason": record.get("reason", ""),
        "context": _extract_context(record),
        "raw": record,
    }


def normalize_all(outputs: dict[str, list[dict]]) -> list[dict]:
    normalised: list[dict] = []
    for _file, records in outputs.items():
        for r in records:
            normalised.append(normalize_record(r))
    return normalised


# ---------------------------------------------------------------------------
# 3. Analysis / classification
# ---------------------------------------------------------------------------
def classify_by_domain(records: list[dict]) -> dict[str, list[dict]]:
    domains: dict[str, list] = collections.defaultdict(list)
    for r in records:
        domains[r["domain"]].append(r)
    return dict(domains)


def identify_critical_entities(records: list[dict], threshold: float = 0.6) -> list[dict]:
    return [r for r in records if r["risk_score"] >= threshold]


def detect_clusters(records: list[dict]) -> dict[str, list[dict]]:
    """Group critical entities by shared context (plant, material, etc.)."""
    clusters: dict[str, list] = collections.defaultdict(list)
    for r in records:
        ctx = r.get("context", {})
        for key in ("plant", "material", "carrier"):
            val = ctx.get(key)
            if val:
                clusters[f"{key}:{val}"].append(r)
    return {k: v for k, v in clusters.items() if len(v) >= 2}


def extract_reason_patterns(records: list[dict]) -> list[tuple[str, int]]:
    counter: dict[str, int] = collections.Counter()
    for r in records:
        words = re.findall(r"\b\w{4,}\b", r.get("reason", "").lower())
        for w in set(words):
            counter[w] += 1
    return counter.most_common(20)


def detect_cascading_risks(records: list[dict]) -> list[dict]:
    """Identify potential cascading failures across domains."""
    cascades = []
    critical = [r for r in records if r["risk_score"] >= 0.7]
    domains_hit = {r["domain"] for r in critical}
    if len(domains_hit) >= 2:
        cascades.append({
            "type": "cross_domain_risk",
            "domains": sorted(domains_hit),
            "entity_count": len(critical),
            "description": (
                f"Critical risks detected across {len(domains_hit)} domains: "
                f"{', '.join(sorted(domains_hit))}. "
                "Potential for cascading operational impact."
            ),
        })
    return cascades


# ---------------------------------------------------------------------------
# 4. Prompt construction
# ---------------------------------------------------------------------------
def _fmt(val: Any) -> str:
    if isinstance(val, float):
        return f"{val:.3f}"
    return str(val)


def _short(s: str, n: int = 80) -> str:
    return s[:n] + "..." if len(s) > n else s


def build_causal_chains(records: list[dict]) -> list[str]:
    """Build human-readable causal chain descriptions."""
    chains: list[str] = []
    high = sorted([r for r in records if r["risk_score"] >= 0.5],
                  key=lambda x: x["risk_score"], reverse=True)
    if not high:
        return chains
    for r in high[:5]:
        chains.append(
            f"{r['entity_type']}:{r['entity_id']} "
            f"(score={r['risk_score']:.3f}) -> {_short(r['reason'], 60)}"
        )
    return chains


def build_fleet_summary(records: list[dict]) -> dict:
    statuses = collections.Counter(r["status"] for r in records)
    types = collections.Counter(r["entity_type"] for r in records)
    scores = [r["risk_score"] for r in records]
    return {
        "total_entities": len(records),
        "status_distribution": dict(statuses),
        "entity_types": dict(types),
        "avg_risk_score": round(sum(scores) / max(len(scores), 1), 3),
        "max_risk_score": round(max(scores, default=0), 3),
    }


_SYSTEM_PROMPT = """You are the EAIOS Master Decision Agent for British Petroleum.
You receive structured intelligence from 6 manufacturing worker agents:
- MaintenanceAgent (equipment failure prediction)
- ProductionAgent (production delay and efficiency)
- QualityAgent (inspection defect analysis)
- DemandAgent (demand variance and forecasting)
- InventoryAgent (stock level and shortage detection)
- LogisticsAgent (shipment delay and route risk)

Your job is to:
1. Synthesise cross-domain insights
2. Identify the TOP 3-5 most critical actions
3. Detect cascading risk patterns
4. Provide clear, actionable recommendations

Respond in JSON with this schema:
{
    "executive_summary": "2-3 sentence overview",
    "critical_actions": [
        {"priority": 1, "action": "...", "domain": "...", "entity_id": "...", "rationale": "..."}
    ],
    "risk_clusters": ["description of correlated risks"],
    "cascading_risks": ["chain descriptions"],
    "overall_risk_level": "HIGH | MEDIUM | LOW"
}
"""


def build_prompt(records: list[dict], outputs_dir: str = DEFAULT_OUTPUTS_DIR) -> str:
    summary = build_fleet_summary(records)
    critical = sorted(
        [r for r in records if r["risk_score"] >= 0.5],
        key=lambda x: x["risk_score"], reverse=True,
    )[:15]
    clusters = detect_clusters(records)
    cascades = detect_cascading_risks(records)
    chains = build_causal_chains(records)
    reason_patterns = extract_reason_patterns(records)

    files = sorted(Path(outputs_dir).glob("*_output.json"))
    file_list = ", ".join(f.name for f in files) if files else "(none)"
    top_words = ", ".join(f"{w}({c})" for w, c in reason_patterns[:10])

    prompt = f"""
## Fleet Summary
{json.dumps(summary, indent=2)}

## Source Files
{file_list}

## Top {len(critical)} Critical Entities (score >= 0.5)
"""
    for r in critical:
        prompt += (
            f"- [{r['domain']}] {r['entity_type']}:{r['entity_id']} "
            f"score={r['risk_score']:.3f} status={r['status']} "
            f"reason=\"{_short(r['reason'], 60)}\"\n"
        )

    if clusters:
        prompt += "\n## Risk Clusters\n"
        for cluster_key, entities in clusters.items():
            ids = [e["entity_id"] for e in entities]
            prompt += f"- {cluster_key}: {ids}\n"

    if cascades:
        prompt += "\n## Cascading Risk Warnings\n"
        for c in cascades:
            prompt += f"- {c['description']}\n"

    if chains:
        prompt += "\n## Causal Chains\n"
        for ch in chains:
            prompt += f"- {ch}\n"

    prompt += f"\n## Recurring Reason Keywords\n{top_words}\n"
    prompt += "\nProvide your master decision as JSON."
    return prompt


# ---------------------------------------------------------------------------
# 5. Claude API call (or mock)
# ---------------------------------------------------------------------------
def parse_claude_response(text: str) -> dict:
    """Extract JSON from Claude response text."""
    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group())
        except json.JSONDecodeError:
            pass
    return {"raw_response": text}


def call_claude(prompt: str, model: str = DEFAULT_MODEL) -> dict:
    """Call the Anthropic API and return parsed decision."""
    if anthropic is None:
        raise RuntimeError("anthropic package not installed. pip install anthropic")
    client = anthropic.Anthropic()
    response = client.messages.create(
        model=model,
        max_tokens=3000,
        system=_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": prompt}],
    )
    text = response.content[0].text
    return parse_claude_response(text)


def mock_decision(records: list[dict]) -> dict:
    """Generate a structured decision without calling Claude."""
    critical = sorted(
        [r for r in records if r["risk_score"] >= 0.5],
        key=lambda x: x["risk_score"], reverse=True,
    )
    actions = []
    for i, r in enumerate(critical[:5], 1):
        actions.append({
            "priority": i,
            "action": f"Investigate {r['entity_type']} {r['entity_id']}",
            "domain": r["domain"],
            "entity_id": r["entity_id"],
            "rationale": _short(r["reason"], 60),
        })

    cascades = detect_cascading_risks(records)
    summary = build_fleet_summary(records)
    avg = summary["avg_risk_score"]
    level = "HIGH" if avg >= 0.5 else "MEDIUM" if avg >= 0.3 else "LOW"

    return {
        "executive_summary": (
            f"Fleet of {summary['total_entities']} entities analysed. "
            f"Average risk {avg:.2f}. {len(critical)} critical items require attention."
        ),
        "critical_actions": actions,
        "risk_clusters": [
            f"{k}: {[e['entity_id'] for e in v]}"
            for k, v in detect_clusters(records).items()
        ],
        "cascading_risks": [c["description"] for c in cascades],
        "overall_risk_level": level,
    }


# ---------------------------------------------------------------------------
# 6. Output and orchestration
# ---------------------------------------------------------------------------
def save_output(decision: dict, path: str = DEFAULT_OUTPUT_FILE) -> None:
    with open(path, "w", encoding="utf-8") as f:
        json.dump(decision, f, indent=2, default=str)


def run_master_agent(
    input_folder: str = DEFAULT_OUTPUTS_DIR,
    output_path: str = DEFAULT_OUTPUT_FILE,
    model: str = DEFAULT_MODEL,
    verbose: bool = True,
    mock: bool = False,
) -> dict:
    """
    Full orchestration pipeline:
    1. Load worker outputs
    2. Normalise
    3. Analyse
    4. Build prompt
    5. Call Claude (or mock)
    6. Save and return decision
    """
    def log(msg: str) -> None:
        if verbose:
            print(msg)

    log(f"[Master Agent] Loading outputs from '{input_folder}' ...")
    outputs = load_all_outputs(input_folder)
    if not outputs:
        log("[Master Agent] No worker outputs found.")
        return {"error": "No worker outputs found"}

    log(f"[Master Agent] Loaded {sum(len(v) for v in outputs.values())} records "
        f"from {len(outputs)} file(s).")

    records = normalize_all(outputs)
    log(f"[Master Agent] Normalised {len(records)} records.")

    if mock:
        log("[Master Agent] Running in MOCK mode (no API call).")
        decision = mock_decision(records)
    else:
        log("[Master Agent] Building prompt for Claude ...")
        prompt = build_prompt(records, input_folder)
        log(f"[Master Agent] Calling Claude ({model}) ...")
        decision = call_claude(prompt, model=model)

    # Enrich with metadata
    decision["metadata"] = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "model": model if not mock else "mock",
        "input_folder": input_folder,
        "total_records": len(records),
        "source_files": list(outputs.keys()),
    }

    save_output(decision, output_path)
    log(f"[Master Agent] Decision saved -> {output_path}")
    return decision


def print_decision_report(decision: dict) -> None:
    """Pretty-print the master decision."""
    print("\n" + "=" * 70)
    print("EAIOS MASTER DECISION REPORT")
    print("=" * 70)
    print(f"\nExecutive Summary: {decision.get('executive_summary', 'N/A')}")
    print(f"Overall Risk Level: {decision.get('overall_risk_level', 'N/A')}")

    actions = decision.get("critical_actions", [])
    if actions:
        print(f"\nCritical Actions ({len(actions)}):")
        for a in actions:
            print(f"  [{a['priority']}] {a['action']}")
            print(f"      Domain: {a['domain']}  Entity: {a['entity_id']}")
            print(f"      Rationale: {a['rationale']}")

    clusters = decision.get("risk_clusters", [])
    if clusters:
        print(f"\nRisk Clusters ({len(clusters)}):")
        for c in clusters:
            print(f"  - {c}")

    cascades = decision.get("cascading_risks", [])
    if cascades:
        print(f"\nCascading Risks ({len(cascades)}):")
        for c in cascades:
            print(f"  - {c}")

    print("\n" + "=" * 70)


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="EAIOS Master Decision Agent")
    parser.add_argument("--input", default=DEFAULT_OUTPUTS_DIR,
                        help=f"Input folder with *_output.json files (default: {DEFAULT_OUTPUTS_DIR})")
    parser.add_argument("--output", default=DEFAULT_OUTPUT_FILE,
                        help=f"Output file path (default: {DEFAULT_OUTPUT_FILE})")
    parser.add_argument("--model", default=DEFAULT_MODEL,
                        help=f"Claude model (default: {DEFAULT_MODEL})")
    parser.add_argument("--mock", action="store_true",
                        help="Run without calling Claude API")

    args = parser.parse_args()

    # Check for API key if not mocking
    if not args.mock and not os.environ.get("ANTHROPIC_API_KEY"):
        print("Error: ANTHROPIC_API_KEY not set. Use --mock for testing.",
              file=sys.stderr)
        sys.exit(1)

    decision = run_master_agent(
        input_folder=args.input,
        output_path=args.output,
        model=args.model,
        verbose=True,
        mock=args.mock,
    )
    print_decision_report(decision)
