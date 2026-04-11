"""
Demand Forecasting Data Generator
====================================
Generates synthetic demand forecast vs actual data for testing
demand-supply gap analysis.
"""

import pandas as pd
import numpy as np


def generate_demand_data(seed: int = 49) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 100

    products = ["Gasoline", "Diesel", "Jet Fuel", "LPG", "Lubricant-5W30", "Lubricant-10W40", "Naphtha"]
    regions = ["North America", "Europe", "Middle East", "Asia Pacific", "Africa", "South America"]

    product_picks = rng.choice(products, n)
    region_picks = rng.choice(regions, n)
    forecast = rng.normal(50000, 15000, n).clip(5000, 120000).astype(int)
    actual = (forecast * rng.normal(1.0, 0.12, n)).clip(2000, 150000).astype(int)

    spike_mask = rng.random(n) < 0.10
    actual[spike_mask] = (forecast[spike_mask] * rng.uniform(1.5, 2.5, spike_mask.sum())).astype(int)

    drop_mask = rng.random(n) < 0.08
    actual[drop_mask] = (forecast[drop_mask] * rng.uniform(0.2, 0.5, drop_mask.sum())).astype(int)

    return pd.DataFrame({
        "product_id": product_picks,
        "region": region_picks,
        "forecast": forecast,
        "actual": actual,
    })
