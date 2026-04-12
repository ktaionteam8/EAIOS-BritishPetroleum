"""
Threat Detection Agent
========================
Scans security events (auth attempts, lateral movement, data exfil,
beaconing) and classifies as THREAT / SUSPICIOUS / BENIGN based on
anomaly score, indicator match count, and source reputation.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.threat_detection_data import generate_threat_detection_data


class ThreatDetectionAgent:
    AGENT_NAME = "ThreatDetectionAgent"

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_threat_detection_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            anomaly = row["anomaly_score"]
            ioc_hits = row["ioc_matches"]
            src_rep = row["source_reputation"]
            event_type = row["event_type"]

            score = anomaly * 0.5 + min(ioc_hits / 5, 1.0) * 0.3 + (1 - src_rep) * 0.2

            if score >= 0.7 or ioc_hits >= 3:
                classification = "THREAT"
                action = "BLOCK_AND_INVESTIGATE"
                priority = "CRITICAL"
                rationale = f"High threat score {score:.2f}; {ioc_hits} IOC matches on {event_type}"
            elif score >= 0.4 or ioc_hits >= 1:
                classification = "SUSPICIOUS"
                action = "INVESTIGATE"
                priority = "HIGH"
                rationale = f"Elevated score {score:.2f}; anomaly {anomaly:.2f}"
            else:
                classification = "BENIGN"
                action = "LOG"
                priority = "LOW"
                rationale = f"Normal activity (score {score:.2f})"

            results.append({
                "entity_id": row["event_id"],
                "entity_type": "security_event",
                "event_type": event_type,
                "source_ip": row["source_ip"],
                "user": row["user"],
                "anomaly_score": round(anomaly, 3),
                "ioc_matches": int(ioc_hits),
                "source_reputation": round(src_rep, 2),
                "threat_score": round(score, 3),
                "classification": classification,
                "action": action,
                "priority": priority,
                "rationale": rationale,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results

    def decisions(self) -> list[dict]:
        return [r for r in self.run() if r["classification"] != "BENIGN"]
