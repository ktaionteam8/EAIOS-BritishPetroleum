"""
Refinery Operations Agent
=========================
Monitors refinery utilization and throughput to detect over-utilization
(equipment stress), under-utilization (idle capacity), and low throughput.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.refinery_data import generate_refinery_data


class RefineryAgent:
    AGENT_NAME = "RefineryAgent"

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_refinery_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            risk = 0.0
            reasons: list[str] = []

            util = row["utilization"]

            if util > 0.95:
                risk += 0.5
                reasons.append(f"Over-utilized at {util:.1%} — equipment stress")
            elif util > 0.85:
                risk += 0.2
                reasons.append(f"High utilization {util:.1%}")

            if util < 0.40:
                risk += 0.35
                reasons.append(f"Under-utilized at {util:.1%} — idle capacity")

            if row["input_quantity"] < 100000:
                risk += 0.15
                reasons.append(f"Low throughput {row['input_quantity']:,} bbl")

            risk = min(risk, 1.0)
            status = "critical" if risk >= 0.6 else "warning" if risk >= 0.3 else "normal"
            reason = "; ".join(reasons) if reasons else "Operating within normal range"

            entity_id = f"{row['refinery_id']}_{row['crude_id']}"
            results.append({
                "entity_id": entity_id,
                "entity_type": "refinery_operation",
                "status": status,
                "risk_score": round(risk, 2),
                "reason": reason,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results
