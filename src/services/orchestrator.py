"""
Domain Orchestrator
=====================
Calls one representative microservice per domain's /api/decision
endpoint. If a domain service is unreachable, falls back to a
deterministic mock response so the master layer can still produce a
decision in dev/offline environments.
"""

import os
from typing import Any

import httpx


# Representative endpoints per domain (one service per domain)
DOMAIN_ENDPOINTS: dict[str, str] = {
    "manufacturing": os.getenv("MFG_URL", "http://localhost:8001/api/decision"),
    "supply_chain":  os.getenv("SCM_URL", "http://localhost:8016/api/decision"),
    "trading":       os.getenv("TRADING_URL", "http://localhost:8021/api/decision"),
    "finance_treasury": os.getenv("TREASURY_URL", "http://localhost:8055/api/decision"),
    "finance_tax":   os.getenv("TAX_URL", "http://localhost:8054/api/decision"),
    "it_ot":         os.getenv("IT_OT_URL", "http://localhost:8043/api/decision"),
    "hr_safety":     os.getenv("HR_SAFETY_URL", "http://localhost:8034/api/decision"),
}

REQUEST_TIMEOUT_S = 2.0


# ---- Mock responses per domain (used when a service is unreachable) ----

_MOCK_RESPONSES: dict[str, dict[str, Any]] = {
    "manufacturing": {
        "agent": "MaintenanceAgent",
        "actionable_count": 4,
        "top_decision": "HIGH_RISK",
        "summary": {"critical": 4, "warning": 9, "normal": 47},
    },
    "supply_chain": {
        "agent": "InventoryAgent",
        "actionable_count": 12,
        "top_decision": "STOCKOUT_RISK",
        "summary": {"critical": 12, "warning": 20, "normal": 68},
    },
    "trading": {
        "agent": "CrudeTradingAgent",
        "actionable_count": 18,
        "top_decision": "BUY",
        "summary": {"buy": 14, "sell": 4, "hold": 62},
    },
    "finance_treasury": {
        "agent": "TreasuryAgent",
        "actionable_count": 10,
        "top_decision": "INVEST",
        "summary": {"invest": 8, "hold": 30, "alert": 12},
    },
    "finance_tax": {
        "agent": "TaxComplianceAgent",
        "actionable_count": 6,
        "top_decision": "COMPLIANT",
        "summary": {"compliant": 82, "risk": 12, "non_compliant": 6},
    },
    "it_ot": {
        "agent": "OTSecurityAgent",
        "actionable_count": 3,
        "top_decision": "NORMAL",
        "summary": {"critical": 0, "warning": 3, "normal": 87},
    },
    "hr_safety": {
        "agent": "SafetyAgent",
        "actionable_count": 2,
        "top_decision": "NORMAL",
        "summary": {"alert": 0, "monitor": 2, "normal": 88},
    },
}


def _derive_top_decision(payload: dict) -> str:
    """
    Extract the dominant decision label from a domain response.

    Domain services return either a summary block with counts, or an
    explicit `top_decision`. We normalise to an uppercase string.
    """
    if "top_decision" in payload:
        return str(payload["top_decision"]).upper()

    summary = payload.get("summary") or {}
    if summary:
        # Pick the key whose count is highest (ignoring total_* fields)
        counts = {k: v for k, v in summary.items() if isinstance(v, (int, float))
                  and not k.startswith("total_")}
        if counts:
            top = max(counts, key=counts.get)
            return top.upper()

    decisions = payload.get("decisions")
    if isinstance(decisions, list) and decisions:
        first = decisions[0]
        for key in ("decision", "classification", "status", "action", "recommendation"):
            if key in first:
                return str(first[key]).upper()

    return "UNKNOWN"


def _call_domain(name: str, url: str, client: httpx.Client) -> dict[str, Any]:
    """Call a single domain endpoint; fall back to mock on error."""
    try:
        resp = client.get(url, timeout=REQUEST_TIMEOUT_S)
        resp.raise_for_status()
        payload = resp.json()
        return {
            "source": "live",
            "url": url,
            "top_decision": _derive_top_decision(payload),
            "actionable_count": payload.get("actionable_count", 0),
            "raw": payload,
        }
    except Exception as exc:
        mock = _MOCK_RESPONSES[name]
        return {
            "source": "mock",
            "url": url,
            "error": str(exc.__class__.__name__),
            "top_decision": mock["top_decision"],
            "actionable_count": mock["actionable_count"],
            "raw": mock,
        }


def gather_domain_decisions() -> dict[str, dict[str, Any]]:
    """Fetch /api/decision from every configured domain (with mock fallback)."""
    results: dict[str, dict[str, Any]] = {}
    with httpx.Client() as client:
        for name, url in DOMAIN_ENDPOINTS.items():
            results[name] = _call_domain(name, url, client)
    return results
