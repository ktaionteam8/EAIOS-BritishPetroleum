"""Synthetic Castrol SKU/region pricing data."""

import pandas as pd
import numpy as np


def generate_castrol_pricing_data(seed: int = 53) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 70

    skus = ["5W-30 Synthetic", "10W-40 Semi", "0W-20 Full Syn", "15W-40 Mineral",
            "ATF Dexron", "Gear Oil 75W-90", "Hydraulic ISO 46"]
    regions = ["North America", "Europe", "Middle East", "Asia Pacific", "Africa", "South America"]

    unit_cost = rng.normal(14, 4, n).clip(6, 28)
    current_price = unit_cost * rng.uniform(1.20, 1.45, n)
    competitor_price = current_price * rng.normal(1.0, 0.08, n)

    low_margin_mask = rng.random(n) < 0.2
    current_price[low_margin_mask] = unit_cost[low_margin_mask] * rng.uniform(1.10, 1.18, low_margin_mask.sum())

    uncompetitive_mask = rng.random(n) < 0.15
    current_price[uncompetitive_mask] = competitor_price[uncompetitive_mask] * rng.uniform(1.10, 1.18, uncompetitive_mask.sum())

    return pd.DataFrame({
        "sku_region_id": [f"PR-{i:04d}" for i in range(n)],
        "sku": rng.choice(skus, n),
        "region": rng.choice(regions, n),
        "unit_cost": unit_cost,
        "current_price": current_price,
        "competitor_price": competitor_price,
        "demand_elasticity": rng.uniform(0.2, 0.9, n),
    })
