"""
Enterprise Gemini Master Agent Service
========================================
Python wrapper that sends aggregated domain outputs to Gemini and
returns a structured enterprise-level decision. Falls back to the
existing rule-based logic if the Gemini API call fails.

Usage:
    from backend.gemini_service import analyze_enterprise
    result = analyze_enterprise({"manufacturing": {...}, "supply_chain": {...}})

Returns:
    {
        "final_decision": str,
        "confidence": float,
        "reason": str,
        "actions": [str, ...],
        "source": "gemini" | "fallback",
        "model_used": str
    }
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone
from typing import Any

try:
    from google import genai  # type: ignore
    _HAS_GENAI = True
except ImportError:
    _HAS_GENAI = False

ENTERPRISE_PROMPT = """You are the enterprise AI decision system for a global oil & gas company (British Petroleum).

You receive multi-domain operational data from 6 domains:
- Manufacturing (plant operations, maintenance risk)
- Supply Chain (inventory, logistics)
- Commercial Trading (crude, LNG, carbon, arbitrage)
- HR & Safety (workforce, incident prediction)
- IT & Cybersecurity (threats, OT security)
- Finance (treasury, tax, revenue)

Analyze the data and produce a SINGLE enterprise-level decision.

Respond ONLY with valid JSON matching this exact shape:
{
  "final_decision": "SHORT_UPPERCASE_SNAKE_CASE_LABEL",
  "confidence": 0.85,
  "reason": "One concise sentence explaining the primary driver.",
  "actions": ["Actionable step 1", "Actionable step 2"]
}

Prioritization rules (in order):
1. Safety-critical signals (OT CRITICAL / HR ALERT) > everything
2. Regulatory / compliance violations > operational gains
3. Cross-domain cascades (e.g., maintenance + stockout) > single-domain signals
4. Commercial opportunity (e.g., BUY + INVEST alignment) only when no red flags

DATA:
"""


def _rule_based_fallback(data: dict[str, Any]) -> dict[str, Any]:
    """Deterministic fallback mirroring the production rule engine."""

    def _top(domain: str) -> str:
        d = data.get(domain, {})
        if isinstance(d, dict):
            for k in ("top_decision", "decision", "status"):
                if k in d:
                    return str(d[k]).upper()
        return "UNKNOWN"

    it_ot = _top("it_ot") or _top("it-cybersecurity")
    hr = _top("hr_safety") or _top("hr-safety")
    tax = _top("finance_tax") or _top("tax")
    mfg = _top("manufacturing")
    scm = _top("supply_chain") or _top("supply-chain")
    trade = _top("trading") or _top("commercial-trading")
    treasury = _top("finance_treasury") or _top("treasury")

    actions: list[str] = []

    if tax in ("NON_COMPLIANT", "VIOLATION"):
        return {
            "final_decision": "STOP_OPERATIONS_COMPLIANCE",
            "confidence": 0.95,
            "reason": f"Tax compliance flagged {tax}",
            "actions": ["Halt affected operations", "Engage tax/legal remediation"],
        }

    if it_ot in ("CRITICAL", "ALERT") or hr in ("ALERT", "CRITICAL"):
        return {
            "final_decision": "HALT_OPERATIONS_SAFETY",
            "confidence": 0.92,
            "reason": f"Safety/security critical (IT={it_ot}, HR={hr})",
            "actions": ["Isolate affected assets", "Activate HSE response"],
        }

    if mfg in ("HIGH_RISK", "CRITICAL") and scm in ("STOCKOUT_RISK", "CRITICAL", "WARNING"):
        return {
            "final_decision": "ORDER_PARTS_AND_SCHEDULE_MAINTENANCE",
            "confidence": 0.9,
            "reason": "Maintenance risk elevated while spare inventory is low",
            "actions": ["Order spare parts", "Schedule maintenance window"],
        }

    if trade == "BUY" and treasury == "INVEST":
        return {
            "final_decision": "EXECUTE_TRADE",
            "confidence": 0.88,
            "reason": "Trading BUY aligns with treasury INVEST",
            "actions": ["Execute crude BUY trade", "Deploy treasury surplus"],
        }

    return {
        "final_decision": "CONTINUE_NORMAL_OPS",
        "confidence": 0.78,
        "reason": "All domains within acceptable bands",
        "actions": [],
    }


def analyze_enterprise(data: dict[str, Any]) -> dict[str, Any]:
    """
    Send aggregated multi-domain data to Gemini and return a structured
    enterprise-level decision. Falls back to rule-based logic on failure.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    now = datetime.now(timezone.utc).isoformat()

    if not _HAS_GENAI or not api_key:
        fb = _rule_based_fallback(data)
        fb.update({"source": "fallback", "model_used": "rule-engine", "timestamp": now})
        return fb

    try:
        client = genai.Client(api_key=api_key)
        prompt = ENTERPRISE_PROMPT + json.dumps(data, default=str, indent=2)
        response = client.models.generate_content(
            model="gemini-2.0-flash",
            contents=prompt,
        )
        raw = response.text or ""
        start, end = raw.find("{"), raw.rfind("}") + 1
        payload = json.loads(raw[start:end])
        payload.setdefault("actions", [])
        payload["source"] = "gemini"
        payload["model_used"] = "gemini-2.0-flash"
        payload["timestamp"] = now
        return payload
    except Exception as exc:
        fb = _rule_based_fallback(data)
        fb.update({
            "source": "fallback",
            "model_used": "rule-engine",
            "fallback_reason": f"{exc.__class__.__name__}: {exc}",
            "timestamp": now,
        })
        return fb


if __name__ == "__main__":
    sample = {
        "manufacturing": {"top_decision": "HIGH_RISK"},
        "supply_chain": {"top_decision": "STOCKOUT_RISK"},
        "trading": {"top_decision": "BUY"},
        "finance_treasury": {"top_decision": "INVEST"},
        "finance_tax": {"top_decision": "COMPLIANT"},
        "it_ot": {"top_decision": "NORMAL"},
        "hr_safety": {"top_decision": "NORMAL"},
    }
    print(json.dumps(analyze_enterprise(sample), indent=2))
