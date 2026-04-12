"""Synthetic security event data."""

import pandas as pd
import numpy as np


def generate_threat_detection_data(seed: int = 72) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 150

    event_types = ["failed_login", "privilege_escalation", "lateral_movement",
                   "data_exfiltration", "dns_beaconing", "malware_detect",
                   "brute_force", "port_scan", "sql_injection", "phishing_click"]
    users = [f"user{i:04d}@bp.com" for i in range(30)]

    anomaly = rng.uniform(0.05, 0.6, n)
    ioc = rng.integers(0, 2, n)
    reputation = rng.uniform(0.5, 0.99, n)

    threat_mask = rng.random(n) < 0.12
    anomaly[threat_mask] = rng.uniform(0.72, 0.98, threat_mask.sum())
    ioc[threat_mask] = rng.integers(3, 10, threat_mask.sum())
    reputation[threat_mask] = rng.uniform(0.05, 0.3, threat_mask.sum())

    susp_mask = rng.random(n) < 0.18
    anomaly[susp_mask] = rng.uniform(0.45, 0.7, susp_mask.sum())

    return pd.DataFrame({
        "event_id": [f"EVT-{i:07d}" for i in range(n)],
        "event_type": rng.choice(event_types, n),
        "source_ip": [f"10.{rng.integers(0,255)}.{rng.integers(0,255)}.{rng.integers(0,255)}" for _ in range(n)],
        "user": rng.choice(users, n),
        "anomaly_score": anomaly,
        "ioc_matches": ioc,
        "source_reputation": reputation,
    })
