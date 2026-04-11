"""
Governance Engine — Aviation Fuel Logistics (SAFETY-CRITICAL)
==============================================================
Tier 1: Automated rule-based classification.
Tier 2: Human intervention — aviation fuel critical items get APPROVED_URGENT immediately.
"""

from datetime import datetime, timezone


class Tier1Governance:
    def run(self, agent_results: dict[str, list[dict]]) -> dict:
        now = datetime.now(timezone.utc).isoformat()
        auto_approved, flagged, escalated = [], [], []

        for agent_name, records in agent_results.items():
            for record in records:
                enriched = {**record, "governance_tier": 1, "reviewed_at": now}
                risk = record.get("risk_score", 0.0)

                if record.get("status") == "critical" or risk >= 0.6:
                    enriched["governance_decision"] = "ESCALATED_TO_TIER2"
                    enriched["governance_reason"] = f"Critical risk ({risk:.2f}) requires human review"
                    escalated.append(enriched)
                elif record.get("status") == "warning" or risk >= 0.3:
                    enriched["governance_decision"] = "FLAGGED"
                    enriched["governance_reason"] = f"Warning level ({risk:.2f}) — flagged for monitoring"
                    flagged.append(enriched)
                else:
                    enriched["governance_decision"] = "AUTO_APPROVED"
                    enriched["governance_reason"] = "Within acceptable risk thresholds"
                    auto_approved.append(enriched)

        return {
            "tier": 1, "tier_name": "Automated Governance", "timestamp": now,
            "summary": {
                "total_processed": len(auto_approved) + len(flagged) + len(escalated),
                "auto_approved": len(auto_approved),
                "flagged_for_monitoring": len(flagged),
                "escalated_to_tier2": len(escalated),
            },
            "auto_approved": auto_approved, "flagged": flagged, "escalated_to_tier2": escalated,
        }


class Tier2Governance:
    """Aviation fuel is SAFETY-CRITICAL — all critical items get APPROVED_URGENT."""

    SAFETY_CRITICAL_TYPES = {"aviation_fuel"}

    def run(self, tier1_output: dict) -> dict:
        now = datetime.now(timezone.utc).isoformat()
        escalated = tier1_output.get("escalated_to_tier2", [])
        approved, conditional, deferred = [], [], []

        for item in escalated:
            reviewed = {**item, "governance_tier": 2, "human_reviewed_at": now}
            entity_type = item.get("entity_type", "")
            risk = item.get("risk_score", 0.0)

            if entity_type in self.SAFETY_CRITICAL_TYPES or item.get("agent") == "AviationAgent":
                reviewed["human_decision"] = "APPROVED_URGENT"
                reviewed["human_rationale"] = "Safety-critical aviation fuel — immediate action mandated"
                reviewed["action_deadline"] = "IMMEDIATE"
                approved.append(reviewed)
            elif risk >= 0.8:
                reviewed["human_decision"] = "APPROVED_URGENT"
                reviewed["human_rationale"] = f"Very high risk ({risk:.2f}) — immediate intervention"
                reviewed["action_deadline"] = "24_HOURS"
                approved.append(reviewed)
            elif risk >= 0.6:
                reviewed["human_decision"] = "CONDITIONALLY_APPROVED"
                reviewed["human_rationale"] = f"High risk ({risk:.2f}) — approved pending action plan"
                reviewed["action_deadline"] = "48_HOURS"
                conditional.append(reviewed)
            else:
                reviewed["human_decision"] = "DEFERRED"
                reviewed["human_rationale"] = "Requires further domain analysis"
                reviewed["action_deadline"] = "REVIEW_NEXT_CYCLE"
                deferred.append(reviewed)

        return {
            "tier": 2, "tier_name": "Human Intervention Review", "timestamp": now,
            "summary": {
                "total_reviewed": len(escalated), "approved_urgent": len(approved),
                "conditionally_approved": len(conditional), "deferred": len(deferred),
            },
            "approved": approved, "conditionally_approved": conditional, "deferred": deferred,
        }
