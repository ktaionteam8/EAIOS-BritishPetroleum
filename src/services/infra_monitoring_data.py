"""Synthetic infrastructure telemetry data."""

import pandas as pd
import numpy as np


def generate_infra_monitoring_data(seed: int = 75) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 120

    services = ["trading-api", "reserves-db", "scada-gateway", "auth-service",
                "pricing-engine", "data-lake-ingest", "ml-inference", "dashboard-web",
                "log-aggregator", "message-broker", "backup-service", "cdn-edge"]
    envs = ["prod", "staging", "dr"]

    cpu = rng.normal(50, 18, n).clip(5, 98)
    mem = rng.normal(55, 15, n).clip(10, 97)
    disk = rng.normal(55, 20, n).clip(10, 99)
    latency = rng.normal(180, 150, n).clip(20, 2500)
    errors = rng.uniform(0, 0.03, n)

    hot_mask = rng.random(n) < 0.15
    cpu[hot_mask] = rng.uniform(85, 99, hot_mask.sum())
    mem[hot_mask] = rng.uniform(80, 96, hot_mask.sum())

    cold_mask = rng.random(n) < 0.12
    cpu[cold_mask] = rng.uniform(5, 25, cold_mask.sum())
    mem[cold_mask] = rng.uniform(10, 22, cold_mask.sum())

    slo_breach_mask = rng.random(n) < 0.10
    errors[slo_breach_mask] = rng.uniform(0.06, 0.15, slo_breach_mask.sum())
    latency[slo_breach_mask] = rng.uniform(1100, 2400, slo_breach_mask.sum())

    return pd.DataFrame({
        "service_id": [f"SVC-{i:04d}" for i in range(n)],
        "service_name": rng.choice(services, n),
        "environment": rng.choice(envs, n, p=[0.6, 0.25, 0.15]),
        "cpu_pct": cpu,
        "mem_pct": mem,
        "disk_pct": disk,
        "latency_p95_ms": latency,
        "error_rate": errors,
    })
