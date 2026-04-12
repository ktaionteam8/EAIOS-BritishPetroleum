"""
Synthetic cost forecasting data.

Simulates cross-domain cost inputs INTERNALLY (no API calls to other
branches). Manufacturing, logistics, and workforce costs are generated
as mock signals representing what other domains would publish.
"""

import pandas as pd
import numpy as np


def generate_cost_forecast_data(seed: int = 83) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 60

    cost_centers = ["Whiting Refinery", "Rotterdam Terminal", "North Sea Ops",
                    "Castrol India", "Trading Desk London", "Renewables US",
                    "Azeri Operations", "Gelsenkirchen Plant", "Retail Europe",
                    "Aviation Supply", "Corporate HQ", "Cherry Point"]

    mfg = rng.normal(2_500_000, 700_000, n).clip(400_000, 6_000_000)
    log = rng.normal(800_000, 300_000, n).clip(100_000, 2_000_000)
    wf = rng.normal(1_200_000, 400_000, n).clip(250_000, 3_000_000)
    total = mfg + log + wf

    budget = total * rng.normal(0.98, 0.06, n)
    trend_3m = rng.normal(0.02, 0.04, n)

    overrun_mask = rng.random(n) < 0.18
    budget[overrun_mask] = total[overrun_mask] * rng.uniform(0.82, 0.90, overrun_mask.sum())
    trend_3m[overrun_mask] = rng.uniform(0.03, 0.10, overrun_mask.sum())

    underrun_mask = rng.random(n) < 0.12
    budget[underrun_mask] = total[underrun_mask] * rng.uniform(1.10, 1.20, underrun_mask.sum())

    return pd.DataFrame({
        "cost_center_id": [f"CC-{i:04d}" for i in range(n)],
        "cost_center": rng.choice(cost_centers, n),
        "manufacturing_cost": mfg,
        "logistics_cost": log,
        "workforce_cost": wf,
        "budget": budget,
        "trend_3m_pct": trend_3m,
    })
