"""
Workforce Planning Agent
==========================
Compares workload vs current headcount per business unit and recommends
HIRE / MAINTAIN / REDEPLOY based on utilization and project pipeline.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.workforce_data import generate_workforce_data


class WorkforceAgent:
    AGENT_NAME = "WorkforceAgent"

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_workforce_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            headcount = row["headcount"]
            workload = row["workload_fte"]
            pipeline = row["pipeline_fte"]

            utilization = workload / headcount if headcount > 0 else 0
            projected_need = workload + pipeline
            gap = projected_need - headcount

            if gap > 0 and utilization > 1.05:
                action = "HIRE"
                hires_needed = int(round(gap))
                rationale = f"Utilization {utilization:.0%}; gap {gap:.1f} FTE incl. pipeline"
            elif utilization < 0.75 and gap < 0:
                action = "REDEPLOY"
                hires_needed = 0
                rationale = f"Under-utilized at {utilization:.0%}; {abs(gap):.1f} excess FTE"
            else:
                action = "MAINTAIN"
                hires_needed = 0
                rationale = f"Utilization {utilization:.0%} within target band"

            results.append({
                "entity_id": row["unit_id"],
                "entity_type": "business_unit",
                "business_unit": row["business_unit"],
                "region": row["region"],
                "headcount": int(headcount),
                "workload_fte": round(workload, 1),
                "pipeline_fte": round(pipeline, 1),
                "utilization": round(utilization, 2),
                "gap_fte": round(gap, 1),
                "action": action,
                "hires_needed": hires_needed,
                "rationale": rationale,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results

    def decisions(self) -> list[dict]:
        return [r for r in self.run() if r["action"] != "MAINTAIN"]
