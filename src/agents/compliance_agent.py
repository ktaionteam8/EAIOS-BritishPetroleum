"""
Compliance Management Agent
=============================
Validates controls against frameworks (NIST CSF, ISO 27001, SOX, GDPR,
NERC CIP, IEC 62443). Classifies each control as COMPLIANT / GAP /
VIOLATION and recommends remediation.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.compliance_data import generate_compliance_data


class ComplianceAgent:
    AGENT_NAME = "ComplianceAgent"

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_compliance_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            coverage = row["control_coverage"]
            evidence_age = row["evidence_age_days"]
            finding_severity = row["finding_severity"]
            required = bool(row["required_by_regulator"])

            if finding_severity >= 4 or (required and coverage < 0.5):
                status = "VIOLATION"
                action = "REMEDIATE_IMMEDIATELY"
                priority = "CRITICAL"
                rationale = (f"Severity {finding_severity}/5, coverage {coverage:.0%}"
                             + (" — regulatory violation" if required else ""))
            elif coverage < 0.8 or evidence_age > 365 or finding_severity >= 2:
                status = "GAP"
                action = "REMEDIATE"
                priority = "HIGH" if required else "MEDIUM"
                rationale = (f"Control gap: coverage {coverage:.0%}, "
                             f"evidence age {evidence_age}d, severity {finding_severity}")
            else:
                status = "COMPLIANT"
                action = "NONE"
                priority = "LOW"
                rationale = f"Fully compliant (coverage {coverage:.0%}, fresh evidence)"

            results.append({
                "entity_id": row["control_id"],
                "entity_type": "compliance_control",
                "framework": row["framework"],
                "control_name": row["control_name"],
                "required_by_regulator": required,
                "control_coverage": round(coverage, 2),
                "evidence_age_days": int(evidence_age),
                "finding_severity": int(finding_severity),
                "status": status,
                "action": action,
                "priority": priority,
                "rationale": rationale,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results

    def decisions(self) -> list[dict]:
        return [r for r in self.run() if r["status"] != "COMPLIANT"]
