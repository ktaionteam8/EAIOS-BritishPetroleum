"""Synthetic contractor performance data."""

import pandas as pd
import numpy as np


def generate_contractor_data(seed: int = 65) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 75

    contractors = ["Halliburton", "Schlumberger", "Baker Hughes", "Weatherford",
                   "McDermott", "Fluor", "TechnipFMC", "Bechtel", "Saipem",
                   "Wood Group", "Petrofac", "KBR"]
    scopes = ["Drilling Services", "Well Intervention", "EPC", "Turnaround Maintenance",
              "Pipeline Construction", "Platform Inspection", "HSE Audit", "IT Services"]

    efficiency = rng.uniform(0.4, 0.95, n)
    compliance = rng.uniform(0.6, 0.98, n)
    cost_variance = rng.normal(0.02, 0.08, n).clip(-0.1, 0.35)
    incidents = rng.integers(0, 2, n)

    under_mask = rng.random(n) < 0.15
    efficiency[under_mask] = rng.uniform(0.35, 0.55, under_mask.sum())

    non_comp_mask = rng.random(n) < 0.10
    compliance[non_comp_mask] = rng.uniform(0.45, 0.68, non_comp_mask.sum())
    incidents[non_comp_mask] = rng.integers(3, 7, non_comp_mask.sum())

    return pd.DataFrame({
        "contractor_id": [f"CTR-{i:04d}" for i in range(n)],
        "contractor_name": rng.choice(contractors, n),
        "scope": rng.choice(scopes, n),
        "efficiency_score": efficiency,
        "compliance_score": compliance,
        "cost_variance_pct": cost_variance,
        "safety_incidents_12m": incidents,
    })
