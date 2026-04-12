"""Synthetic site safety indicator data."""

import pandas as pd
import numpy as np


def generate_safety_data(seed: int = 64) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 90

    facilities = ["Offshore Platform", "Refinery", "Pipeline", "Retail Station",
                  "Petrochemical Plant", "LNG Terminal", "Drilling Rig", "Tank Farm"]
    sites = [f"BP-Site-{i:03d}" for i in range(n)]

    hazard = rng.uniform(0.1, 0.6, n)
    near_miss = rng.integers(0, 3, n)
    training_age = rng.integers(30, 400, n)
    equipment_age = rng.uniform(1, 25, n)

    hotspot_mask = rng.random(n) < 0.15
    hazard[hotspot_mask] = rng.uniform(0.72, 0.95, hotspot_mask.sum())

    nearmiss_mask = rng.random(n) < 0.18
    near_miss[nearmiss_mask] = rng.integers(4, 12, nearmiss_mask.sum())

    training_lapse_mask = rng.random(n) < 0.20
    training_age[training_lapse_mask] = rng.integers(380, 720, training_lapse_mask.sum())

    return pd.DataFrame({
        "site_id": sites,
        "site_name": sites,
        "facility_type": rng.choice(facilities, n),
        "hazard_score": hazard,
        "near_miss_rate": near_miss,
        "days_since_training": training_age,
        "equipment_age_years": equipment_age,
    })
