"""
Contractor Management Agent
=============================
Tracks contractor efficiency, safety compliance, and cost performance.
Recommends RETAIN / REVIEW / REPLACE per contractor engagement.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.contractor_data import generate_contractor_data


class ContractorAgent:
    AGENT_NAME = "ContractorAgent"

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_contractor_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            efficiency = row["efficiency_score"]
            compliance = row["compliance_score"]
            cost_variance = row["cost_variance_pct"]
            incidents = row["safety_incidents_12m"]

            composite = (efficiency * 0.4 + compliance * 0.4 + max(0, 1 - cost_variance) * 0.2)

            if compliance < 0.7 or incidents >= 3:
                action = "REPLACE"
                rationale = f"Compliance {compliance:.2f} / {incidents} incidents — safety risk"
                priority = "IMMEDIATE"
            elif efficiency < 0.6 or cost_variance > 0.15:
                action = "REVIEW"
                rationale = f"Efficiency {efficiency:.2f}, cost variance {cost_variance:+.1%} — performance review"
                priority = "HIGH"
            elif composite >= 0.85:
                action = "RETAIN"
                rationale = f"Strong performer (composite {composite:.2f})"
                priority = "LOW"
            else:
                action = "MAINTAIN"
                rationale = f"Acceptable performance (composite {composite:.2f})"
                priority = "LOW"

            results.append({
                "entity_id": row["contractor_id"],
                "entity_type": "contractor_engagement",
                "contractor_name": row["contractor_name"],
                "scope": row["scope"],
                "efficiency_score": round(efficiency, 2),
                "compliance_score": round(compliance, 2),
                "cost_variance_pct": round(cost_variance, 3),
                "safety_incidents_12m": int(incidents),
                "composite_score": round(composite, 2),
                "action": action,
                "priority": priority,
                "rationale": rationale,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results

    def decisions(self) -> list[dict]:
        return [r for r in self.run() if r["action"] not in ("MAINTAIN", "RETAIN")]
