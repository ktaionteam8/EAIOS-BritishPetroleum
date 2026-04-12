"""Synthetic OT/ICS asset telemetry data."""

import pandas as pd
import numpy as np


def generate_ot_security_data(seed: int = 73) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 90

    asset_types = ["PLC", "DCS Controller", "RTU", "HMI", "Historian",
                   "Safety Instrumented System", "Engineering Workstation"]
    sites = ["Whiting Refinery", "Rotterdam Terminal", "North Sea Platform",
             "Gelsenkirchen Plant", "Cherry Point", "Azeri Field"]

    protocol_anomaly = rng.uniform(0.0, 0.35, n)
    unauthorized_fw = rng.random(n) < 0.05
    lateral = rng.random(n) < 0.08
    purdue = rng.choice([1, 2, 3], n, p=[0.45, 0.35, 0.20])
    asset_crit = rng.uniform(0.3, 1.0, n)

    anomaly_mask = rng.random(n) < 0.15
    protocol_anomaly[anomaly_mask] = rng.uniform(0.55, 0.95, anomaly_mask.sum())

    return pd.DataFrame({
        "asset_id": [f"OT-{i:05d}" for i in range(n)],
        "asset_type": rng.choice(asset_types, n),
        "site": rng.choice(sites, n),
        "purdue_level": purdue,
        "asset_criticality": asset_crit,
        "protocol_anomaly": protocol_anomaly,
        "unauthorized_firmware": unauthorized_fw,
        "lateral_traffic": lateral,
    })
