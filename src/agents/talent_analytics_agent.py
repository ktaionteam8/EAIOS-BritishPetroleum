"""
Talent Analytics Agent
========================
Combines performance, tenure, and attrition-risk signals per employee to
produce PROMOTE / RETAIN / REVIEW recommendations.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.talent_analytics_data import generate_talent_analytics_data


class TalentAnalyticsAgent:
    AGENT_NAME = "TalentAnalyticsAgent"

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_talent_analytics_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            perf = row["performance_score"]
            tenure = row["tenure_years"]
            attrition = row["attrition_risk"]
            engagement = row["engagement_score"]

            if perf >= 4.2 and attrition >= 0.6:
                action = "RETAIN"
                rationale = f"High performer (perf {perf:.1f}) at high attrition risk ({attrition:.2f}) — urgent retention"
                priority = "HIGH"
            elif perf >= 4.4 and tenure >= 3 and engagement >= 0.7:
                action = "PROMOTE"
                rationale = f"Top performer (perf {perf:.1f}, tenure {tenure:.0f}y, engagement {engagement:.2f})"
                priority = "HIGH"
            elif perf < 2.8:
                action = "REVIEW"
                rationale = f"Low performance (perf {perf:.1f}) — performance review required"
                priority = "MEDIUM"
            else:
                action = "MAINTAIN"
                rationale = f"Stable performer (perf {perf:.1f}, attrition {attrition:.2f})"
                priority = "LOW"

            results.append({
                "entity_id": row["employee_id"],
                "entity_type": "employee",
                "department": row["department"],
                "role": row["role"],
                "performance_score": round(perf, 2),
                "tenure_years": round(tenure, 1),
                "attrition_risk": round(attrition, 2),
                "engagement_score": round(engagement, 2),
                "action": action,
                "priority": priority,
                "rationale": rationale,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results

    def decisions(self) -> list[dict]:
        return [r for r in self.run() if r["action"] != "MAINTAIN"]
