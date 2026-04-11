"""
Crude Supply Agent
==================
Monitors crude oil shipments and detects cost spikes, delivery delays,
and low-volume risks across global procurement routes.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.crude_data import generate_crude_data


class CrudeAgent:
    AGENT_NAME = "CrudeAgent"

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_crude_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            risk = 0.0
            reasons: list[str] = []

            if row["cost"] > 100:
                risk += 0.4
                reasons.append(f"High crude cost ${row['cost']}/bbl")

            arrival = pd.Timestamp(row["arrival_date"])
            base = pd.Timestamp("2025-01-01")
            offset = (arrival - base).days
            if offset > 60:
                risk += 0.3
                reasons.append(f"Arrival delayed to {row['arrival_date'].date()}")

            if row["quantity"] < 200000:
                risk += 0.2
                reasons.append(f"Low volume {row['quantity']:,} bbl")

            risk = min(risk, 1.0)
            status = "critical" if risk >= 0.6 else "warning" if risk >= 0.3 else "normal"
            reason = "; ".join(reasons) if reasons else "Within normal parameters"

            results.append({
                "entity_id": row["crude_id"],
                "entity_type": "crude_shipment",
                "status": status,
                "risk_score": round(risk, 2),
                "reason": reason,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results
