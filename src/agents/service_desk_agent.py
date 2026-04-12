"""
IT Service Desk Agent
=======================
Classifies incoming IT tickets and recommends AUTO_RESOLVE (self-service /
known solution), ROUTE (assign to team), or ESCALATE (P1/P2 / VIP).
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.service_desk_data import generate_service_desk_data


class ServiceDeskAgent:
    AGENT_NAME = "ServiceDeskAgent"

    KNOWN_SOLUTIONS = {"password_reset", "vpn_connect", "printer", "mailbox_quota", "software_install"}

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_service_desk_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            severity = row["severity"]
            category = row["category"]
            vip = bool(row["vip_user"])
            sla_hours = row["sla_hours"]

            if severity in ("P1", "P2") or vip:
                action = "ESCALATE"
                assignee = "L3 Senior Engineer" if severity == "P1" else "L2 Engineer"
                rationale = f"{severity} ticket" + (" (VIP user)" if vip else "")
                eta_minutes = 15 if severity == "P1" else 60
            elif category in self.KNOWN_SOLUTIONS:
                action = "AUTO_RESOLVE"
                assignee = "AI Self-Service Bot"
                rationale = f"Known solution for '{category}' — automated resolution"
                eta_minutes = 5
            else:
                action = "ROUTE"
                assignee = {"network": "Network Team", "application": "App Support",
                            "security": "SecOps", "hardware": "Hardware Team"}.get(row["team"], "L1 Support")
                rationale = f"Routed to {assignee} (SLA {sla_hours}h)"
                eta_minutes = min(int(sla_hours * 60), 240)

            results.append({
                "entity_id": row["ticket_id"],
                "entity_type": "it_ticket",
                "category": category,
                "severity": severity,
                "team": row["team"],
                "vip_user": vip,
                "sla_hours": int(sla_hours),
                "action": action,
                "assignee": assignee,
                "eta_minutes": eta_minutes,
                "rationale": rationale,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results

    def decisions(self) -> list[dict]:
        return [r for r in self.run() if r["action"] != "AUTO_RESOLVE"]
