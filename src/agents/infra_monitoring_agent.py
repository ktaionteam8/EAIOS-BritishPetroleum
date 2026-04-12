"""
Infrastructure Monitoring Agent
=================================
Tracks system health (CPU, memory, disk, latency, error rate) across
servers/services. Recommends SCALE_UP / SCALE_DOWN / STABLE / ALERT.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.infra_monitoring_data import generate_infra_monitoring_data


class InfraMonitoringAgent:
    AGENT_NAME = "InfraMonitoringAgent"

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_infra_monitoring_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            cpu = row["cpu_pct"]
            mem = row["mem_pct"]
            disk = row["disk_pct"]
            latency_ms = row["latency_p95_ms"]
            error_rate = row["error_rate"]

            pressure = (cpu + mem) / 2

            if error_rate > 0.05 or latency_ms > 1000 or disk > 92:
                action = "ALERT"
                priority = "IMMEDIATE"
                rationale = (f"SLO breach — CPU {cpu:.0f}% / mem {mem:.0f}% / disk {disk:.0f}% / "
                             f"latency {latency_ms:.0f}ms / errors {error_rate:.2%}")
            elif pressure > 80 or cpu > 85:
                action = "SCALE_UP"
                priority = "HIGH"
                rationale = f"High resource pressure (CPU {cpu:.0f}%, mem {mem:.0f}%)"
            elif pressure < 25 and cpu < 30:
                action = "SCALE_DOWN"
                priority = "LOW"
                rationale = f"Over-provisioned (CPU {cpu:.0f}%, mem {mem:.0f}%)"
            else:
                action = "STABLE"
                priority = "LOW"
                rationale = f"Healthy (CPU {cpu:.0f}%, mem {mem:.0f}%, latency {latency_ms:.0f}ms)"

            results.append({
                "entity_id": row["service_id"],
                "entity_type": "infra_service",
                "service_name": row["service_name"],
                "environment": row["environment"],
                "cpu_pct": round(cpu, 1),
                "mem_pct": round(mem, 1),
                "disk_pct": round(disk, 1),
                "latency_p95_ms": round(latency_ms, 0),
                "error_rate": round(error_rate, 4),
                "action": action,
                "priority": priority,
                "rationale": rationale,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results

    def decisions(self) -> list[dict]:
        return [r for r in self.run() if r["action"] != "STABLE"]
