"""
Joint Venture Accounting Agent
================================
Reconciles partner-share transactions for 80 JV positions.
Produces BALANCED / MISMATCH / REVIEW decisions based on BP's expected
share versus reported share and material variance thresholds.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.jv_accounting_data import generate_jv_accounting_data


class JVAccountingAgent:
    AGENT_NAME = "JVAccountingAgent"

    TOLERANCE_PCT = 0.01   # 1% tolerance
    MATERIAL_USD = 50000

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_jv_accounting_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            expected = row["expected_bp_share"]
            reported = row["reported_bp_share"]
            variance = reported - expected
            variance_pct = variance / expected if expected != 0 else 0

            if abs(variance) > self.MATERIAL_USD and abs(variance_pct) > 0.05:
                decision = "MISMATCH"
                confidence = 0.9
                reason = f"Material variance ${variance:+,.0f} ({variance_pct:+.1%}) vs partner report"
            elif abs(variance_pct) > self.TOLERANCE_PCT or abs(variance) > self.MATERIAL_USD / 2:
                decision = "REVIEW"
                confidence = 0.7
                reason = f"Variance ${variance:+,.0f} ({variance_pct:+.2%}) exceeds tolerance"
            else:
                decision = "BALANCED"
                confidence = 0.95
                reason = f"Within tolerance (${variance:+,.0f}, {variance_pct:+.2%})"

            results.append({
                "entity_id": row["jv_id"],
                "entity_type": "jv_transaction",
                "jv_name": row["jv_name"],
                "partner": row["partner"],
                "bp_share_pct": round(row["bp_share_pct"], 2),
                "expected_bp_share": round(expected, 2),
                "reported_bp_share": round(reported, 2),
                "variance": round(variance, 2),
                "variance_pct": round(variance_pct, 4),
                "decision": decision,
                "confidence": confidence,
                "reason": reason,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results

    def decisions(self) -> list[dict]:
        return [r for r in self.run() if r["decision"] != "BALANCED"]
