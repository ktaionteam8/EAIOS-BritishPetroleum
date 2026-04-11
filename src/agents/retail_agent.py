"""
Retail Fuel Optimization Agent
================================
Monitors retail gas stations across global regions.
Detects imminent stockout conditions and demand spikes.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.retail_data import generate_retail_data


class RetailAgent:
    AGENT_NAME = "RetailAgent"

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_retail_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            risk = 0.0
            reasons: list[str] = []

            stock = row["stock"]
            sales = row["sales"]
            coverage = stock / sales if sales > 0 else 0

            if coverage < 0.5:
                risk += 0.6
                reasons.append(f"Imminent stockout at {row['station_id']} — coverage {coverage:.1%}")
            elif coverage < 1.0:
                risk += 0.3
                reasons.append(f"Low stock coverage {coverage:.1%}")

            if sales > 20000:
                risk += 0.25
                reasons.append(f"Demand spike — sales {sales:,} units at {row['region']}")

            risk = min(risk, 1.0)
            status = "critical" if risk >= 0.6 else "warning" if risk >= 0.3 else "normal"
            reason = "; ".join(reasons) if reasons else "Retail operations normal"

            results.append({
                "entity_id": row["station_id"],
                "entity_type": "retail_station",
                "status": status,
                "risk_score": round(risk, 2),
                "reason": reason,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results
