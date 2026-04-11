"""
Lubricant Distribution Data Generator
=======================================
Generates synthetic Castrol lubricant distribution data with shortage
and overstock anomalies for testing the LubricantAgent pipeline.
"""

import pandas as pd
import numpy as np


def generate_lubricant_data(seed: int = 48) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 80

    regions = ["North America", "Europe", "Middle East", "Asia Pacific", "Africa", "South America"]
    skus = ["5W-30 Synthetic", "10W-40 Semi", "0W-20 Full Syn", "15W-40 Mineral",
            "ATF Dexron", "Gear Oil 75W-90", "Hydraulic ISO 46"]

    region_picks = rng.choice(regions, n)
    sku_picks = rng.choice(skus, n)
    demand = rng.normal(5000, 2000, n).clip(500, 15000).astype(int)
    inventory = rng.normal(6000, 2500, n).clip(200, 20000).astype(int)

    short_mask = rng.random(n) < 0.12
    inventory[short_mask] = (demand[short_mask] * rng.uniform(0.1, 0.45, short_mask.sum())).astype(int)

    over_mask = rng.random(n) < 0.08
    inventory[over_mask] = (demand[over_mask] * rng.uniform(3.5, 6.0, over_mask.sum())).astype(int)

    return pd.DataFrame({
        "region": region_picks,
        "sku": sku_picks,
        "demand": demand,
        "inventory": inventory,
    })
