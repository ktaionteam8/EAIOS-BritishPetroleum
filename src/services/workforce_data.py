"""Synthetic workforce planning data."""

import pandas as pd
import numpy as np


def generate_workforce_data(seed: int = 61) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 60

    units = ["Upstream Drilling", "Downstream Refining", "Trading Desk", "Retail Ops",
             "Castrol Lubricants", "Renewables", "Corporate IT", "Safety & Compliance"]
    regions = ["North America", "Europe", "Middle East", "Asia Pacific", "Africa", "South America"]

    headcount = rng.integers(40, 600, n)
    workload = headcount * rng.normal(1.0, 0.18, n)
    pipeline = rng.normal(15, 10, n).clip(-5, 60)

    overload_mask = rng.random(n) < 0.25
    workload[overload_mask] = headcount[overload_mask] * rng.uniform(1.12, 1.35, overload_mask.sum())

    under_mask = rng.random(n) < 0.15
    workload[under_mask] = headcount[under_mask] * rng.uniform(0.55, 0.72, under_mask.sum())

    return pd.DataFrame({
        "unit_id": [f"WU-{i:04d}" for i in range(n)],
        "business_unit": rng.choice(units, n),
        "region": rng.choice(regions, n),
        "headcount": headcount,
        "workload_fte": workload,
        "pipeline_fte": pipeline,
    })
