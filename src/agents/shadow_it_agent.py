"""
Shadow IT Rationalization Agent
=================================
Detects unsanctioned SaaS/software usage across the organization.
Recommends SANCTION (formally adopt), REVIEW (evaluate compliance), or
BLOCK (remove/replace).
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.shadow_it_data import generate_shadow_it_data


class ShadowITAgent:
    AGENT_NAME = "ShadowITAgent"

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_shadow_it_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            user_count = row["active_users"]
            data_sensitivity = row["data_sensitivity"]
            compliance_risk = row["compliance_risk"]
            sanctioned_alternative = bool(row["sanctioned_alternative_exists"])
            vendor_risk = row["vendor_risk_score"]

            if compliance_risk >= 0.7 or data_sensitivity >= 0.8 or vendor_risk >= 0.75:
                action = "BLOCK"
                rationale = (f"High compliance/data/vendor risk "
                             f"(comp {compliance_risk:.2f}, data {data_sensitivity:.2f}, "
                             f"vendor {vendor_risk:.2f})")
                priority = "IMMEDIATE" if data_sensitivity >= 0.8 else "HIGH"
            elif user_count >= 50 and compliance_risk < 0.4 and vendor_risk < 0.5:
                action = "SANCTION"
                rationale = f"Widely used ({user_count} users), low risk — adopt officially"
                priority = "MEDIUM"
            elif sanctioned_alternative:
                action = "BLOCK"
                rationale = f"Sanctioned alternative exists; {user_count} users should migrate"
                priority = "MEDIUM"
            else:
                action = "REVIEW"
                rationale = f"{user_count} users; compliance risk {compliance_risk:.2f} — security review"
                priority = "MEDIUM"

            results.append({
                "entity_id": row["app_id"],
                "entity_type": "shadow_it_app",
                "app_name": row["app_name"],
                "category": row["category"],
                "active_users": int(user_count),
                "data_sensitivity": round(data_sensitivity, 2),
                "compliance_risk": round(compliance_risk, 2),
                "vendor_risk_score": round(vendor_risk, 2),
                "sanctioned_alternative_exists": sanctioned_alternative,
                "action": action,
                "priority": priority,
                "rationale": rationale,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results

    def decisions(self) -> list[dict]:
        return [r for r in self.run() if r["action"] != "REVIEW" or r["priority"] == "IMMEDIATE"]
