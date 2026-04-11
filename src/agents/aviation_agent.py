"""
Aviation Fuel Agent (SAFETY-CRITICAL)
======================================
Monitors aviation fuel supply at major airports worldwide.
Safety-critical domain: fuel shortages at airports require immediate action.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.aviation_data import generate_aviation_data


class AviationAgent:
    AGENT_NAME = "AviationAgent"

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_aviation_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            risk = 0.0
            reasons: list[str] = []

            stock = row["stock"]
            consumption = row["daily_consumption"]
            days_of_supply = stock / consumption if consumption > 0 else 0

            if days_of_supply < 2:
                risk += 0.7
                reasons.append(f"Critical — only {days_of_supply:.1f} days of supply at {row['airport_id']}")
            elif days_of_supply < 4:
                risk += 0.35
                reasons.append(f"Low supply — {days_of_supply:.1f} days remaining")
            elif days_of_supply < 7:
                risk += 0.15
                reasons.append(f"Below target — {days_of_supply:.1f} days (target 7+)")

            if consumption > 30000:
                risk += 0.2
                reasons.append(f"High consumption {consumption:,} bbl/day")

            risk = min(risk, 1.0)
            status = "critical" if risk >= 0.6 else "warning" if risk >= 0.3 else "normal"
            reason = "; ".join(reasons) if reasons else "Adequate aviation fuel supply"

            entity_id = f"{row['airport_id']}_{row['product_id']}"
            results.append({
                "entity_id": entity_id,
                "entity_type": "aviation_fuel",
                "status": status,
                "risk_score": round(risk, 2),
                "reason": reason,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results
