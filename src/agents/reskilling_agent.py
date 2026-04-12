"""
Energy Transition Reskilling Agent
====================================
Identifies employees in declining fossil-fuel roles and recommends
RESKILL (pivot to renewable/low-carbon roles), UPSKILL (extend current
role for transition), or HOLD.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.reskilling_data import generate_reskilling_data


class ReskillingAgent:
    AGENT_NAME = "ReskillingAgent"

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_reskilling_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            role_demand_trend = row["role_demand_trend"]
            target_demand = row["target_role_demand"]
            transferable = row["transferable_skills_pct"]
            learning_agility = row["learning_agility"]

            if role_demand_trend < -0.15 and transferable >= 0.5 and learning_agility >= 0.6:
                action = "RESKILL"
                training_hours = 120
                target_role = row["target_role"]
                rationale = (f"Current role declining ({role_demand_trend:+.1%}); "
                             f"{transferable:.0%} skill overlap with {target_role}")
                priority = "HIGH"
            elif role_demand_trend < 0 and target_demand > 0.1:
                action = "UPSKILL"
                training_hours = 60
                target_role = row["current_role"]
                rationale = (f"Role softening ({role_demand_trend:+.1%}); extend with low-carbon "
                             f"competencies for future demand ({target_demand:+.1%})")
                priority = "MEDIUM"
            else:
                action = "HOLD"
                training_hours = 0
                target_role = row["current_role"]
                rationale = f"Stable role demand ({role_demand_trend:+.1%})"
                priority = "LOW"

            results.append({
                "entity_id": row["employee_id"],
                "entity_type": "reskilling_candidate",
                "current_role": row["current_role"],
                "target_role": target_role,
                "role_demand_trend": round(role_demand_trend, 3),
                "target_role_demand": round(target_demand, 3),
                "transferable_skills_pct": round(transferable, 2),
                "learning_agility": round(learning_agility, 2),
                "action": action,
                "recommended_training_hours": training_hours,
                "priority": priority,
                "rationale": rationale,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results

    def decisions(self) -> list[dict]:
        return [r for r in self.run() if r["action"] != "HOLD"]
