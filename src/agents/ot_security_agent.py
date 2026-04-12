"""
OT Security Monitoring Agent (SAFETY-CRITICAL)
================================================
Monitors OT/ICS/SCADA environments (PLCs, DCS, RTUs) for anomalous
communication, unauthorized firmware, and protocol violations on
Purdue Levels 1-3. Classifies CRITICAL / WARNING / NORMAL.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.ot_security_data import generate_ot_security_data


class OTSecurityAgent:
    AGENT_NAME = "OTSecurityAgent"

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_ot_security_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            protocol_anomaly = row["protocol_anomaly"]
            unauthorized_fw = bool(row["unauthorized_firmware"])
            lateral = bool(row["lateral_traffic"])
            purdue = row["purdue_level"]
            asset_criticality = row["asset_criticality"]

            risk = 0.0
            reasons: list[str] = []

            if unauthorized_fw:
                risk += 0.5
                reasons.append("Unauthorized firmware detected")
            if protocol_anomaly > 0.6:
                risk += 0.3
                reasons.append(f"Protocol anomaly {protocol_anomaly:.2f}")
            elif protocol_anomaly > 0.3:
                risk += 0.15
                reasons.append(f"Minor protocol drift {protocol_anomaly:.2f}")
            if lateral and purdue <= 2:
                risk += 0.3
                reasons.append(f"Lateral traffic at Purdue Level {purdue}")

            risk *= (0.8 + asset_criticality * 0.4)
            risk = min(risk, 1.0)

            if risk >= 0.6:
                status = "CRITICAL"
                action = "ISOLATE_AND_INVESTIGATE"
                priority = "IMMEDIATE"
            elif risk >= 0.3:
                status = "WARNING"
                action = "MONITOR"
                priority = "HIGH"
            else:
                status = "NORMAL"
                action = "LOG"
                priority = "LOW"

            rationale = "; ".join(reasons) if reasons else "OT traffic nominal"

            results.append({
                "entity_id": row["asset_id"],
                "entity_type": "ot_asset",
                "asset_type": row["asset_type"],
                "site": row["site"],
                "purdue_level": int(purdue),
                "asset_criticality": round(asset_criticality, 2),
                "protocol_anomaly": round(protocol_anomaly, 2),
                "unauthorized_firmware": unauthorized_fw,
                "lateral_traffic": lateral,
                "risk_score": round(risk, 2),
                "status": status,
                "action": action,
                "priority": priority,
                "rationale": rationale,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results

    def decisions(self) -> list[dict]:
        return [r for r in self.run() if r["status"] != "NORMAL"]
