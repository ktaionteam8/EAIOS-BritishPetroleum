"""
Marine Bunkering & Logistics Agent
=====================================
Monitors multimodal transport shipments (pipeline, tanker, rail, truck).
Detects delivery delays, high-risk routes, and logistics disruptions.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.logistics_data import generate_logistics_data


class LogisticsAgent:
    AGENT_NAME = "LogisticsAgent"

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_logistics_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            risk = 0.0
            reasons: list[str] = []

            delay = row["delay_days"]
            if delay >= 10:
                risk += 0.5
                reasons.append(f"Severe delay of {delay} days")
            elif delay >= 5:
                risk += 0.3
                reasons.append(f"Moderate delay of {delay} days")
            elif delay >= 3:
                risk += 0.1
                reasons.append(f"Minor delay of {delay} days")

            route_risk = row["route_risk"]
            if route_risk > 0.7:
                risk += 0.4
                reasons.append(f"High-risk route ({route_risk:.2f})")
            elif route_risk > 0.4:
                risk += 0.15
                reasons.append(f"Elevated route risk ({route_risk:.2f})")

            risk = min(risk, 1.0)
            status = "critical" if risk >= 0.6 else "warning" if risk >= 0.3 else "normal"
            reason = "; ".join(reasons) if reasons else "On schedule, low risk"

            results.append({
                "entity_id": row["shipment_id"],
                "entity_type": "logistics_shipment",
                "status": status,
                "risk_score": round(risk, 2),
                "reason": reason,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results
