"""
Safety Incident Prediction Agent (SAFETY-CRITICAL)
====================================================
Predicts safety incident risk per site using hazard scores, near-miss
rates, training recency, and equipment age. Issues ALERT / MONITOR / NORMAL.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.safety_data import generate_safety_data


class SafetyAgent:
    AGENT_NAME = "SafetyAgent"

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_safety_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            hazard = row["hazard_score"]
            near_miss = row["near_miss_rate"]
            training_age = row["days_since_training"]
            equipment_age = row["equipment_age_years"]

            risk = 0.0
            reasons: list[str] = []

            if hazard > 0.7:
                risk += 0.4
                reasons.append(f"High hazard score ({hazard:.2f})")
            elif hazard > 0.5:
                risk += 0.2
                reasons.append(f"Elevated hazard score ({hazard:.2f})")

            if near_miss >= 5:
                risk += 0.3
                reasons.append(f"{near_miss} near-misses in 90 days")
            elif near_miss >= 2:
                risk += 0.15
                reasons.append(f"{near_miss} near-misses in 90 days")

            if training_age > 365:
                risk += 0.2
                reasons.append(f"Training overdue ({training_age} days)")

            if equipment_age > 15:
                risk += 0.15
                reasons.append(f"Aging equipment ({equipment_age:.0f}y)")

            risk = min(risk, 1.0)

            if risk >= 0.6:
                status = "ALERT"
                priority = "IMMEDIATE"
            elif risk >= 0.3:
                status = "MONITOR"
                priority = "HIGH"
            else:
                status = "NORMAL"
                priority = "LOW"

            rationale = "; ".join(reasons) if reasons else "All safety indicators within normal ranges"

            results.append({
                "entity_id": row["site_id"],
                "entity_type": "safety_site",
                "site_name": row["site_name"],
                "facility_type": row["facility_type"],
                "hazard_score": round(hazard, 2),
                "near_miss_90d": int(near_miss),
                "days_since_training": int(training_age),
                "equipment_age_years": round(equipment_age, 1),
                "risk_score": round(risk, 2),
                "status": status,
                "priority": priority,
                "rationale": rationale,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results

    def decisions(self) -> list[dict]:
        """Return only ALERT / MONITOR sites (safety-critical actions)."""
        return [r for r in self.run() if r["status"] != "NORMAL"]
