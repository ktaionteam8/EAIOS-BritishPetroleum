"""
Refinery Operations Data Generator
====================================
Generates synthetic refinery utilization data with anomalies for
testing the RefineryAgent risk detection pipeline.
"""

import pandas as pd
import numpy as np


def generate_refinery_data(seed: int = 43) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 80

    refineries = ["Whiting", "Gelsenkirchen", "Cherry Point", "Rotterdam", "Castellon"]
    products = ["Gasoline", "Diesel", "Jet Fuel", "LPG", "Naphtha"]

    refinery_picks = rng.choice(len(refineries), n)
    crude_ids = [f"CRD-{rng.integers(0, 100):04d}" for _ in range(n)]
    input_qty = rng.normal(300000, 80000, n).clip(50000, 600000).astype(int)
    capacities = rng.normal(400000, 60000, n).clip(200000, 700000).astype(int)
    utilization = (input_qty / capacities).clip(0.1, 1.0)

    overload_mask = rng.random(n) < 0.10
    utilization[overload_mask] = rng.uniform(0.96, 1.0, overload_mask.sum())
    input_qty[overload_mask] = (capacities[overload_mask] * utilization[overload_mask]).astype(int)

    underload_mask = rng.random(n) < 0.07
    utilization[underload_mask] = rng.uniform(0.15, 0.39, underload_mask.sum())
    input_qty[underload_mask] = (capacities[underload_mask] * utilization[underload_mask]).astype(int)

    return pd.DataFrame({
        "refinery_id": [refineries[r] for r in refinery_picks],
        "crude_id": crude_ids,
        "input_quantity": input_qty,
        "output_product": rng.choice(products, n).tolist(),
        "capacity": capacities,
        "utilization": np.round(utilization, 3),
    })
