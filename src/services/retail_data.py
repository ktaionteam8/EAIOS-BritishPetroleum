"""
Retail Fuel Data Generator
============================
Generates synthetic retail station data with stockout and demand spike
anomalies for testing the RetailAgent pipeline.
"""

import pandas as pd
import numpy as np


def generate_retail_data(seed: int = 47) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 100

    regions = ["North America", "Europe", "Middle East", "Asia Pacific", "Africa", "South America"]
    products = ["Gasoline 95", "Gasoline 98", "Diesel", "AdBlue"]

    station_ids = [f"STN-{i:04d}" for i in range(n)]
    region_picks = rng.choice(regions, n)
    product_picks = rng.choice(products, n)
    sales = rng.normal(8000, 3000, n).clip(500, 25000).astype(int)
    stock = rng.normal(12000, 5000, n).clip(1000, 35000).astype(int)

    low_mask = rng.random(n) < 0.10
    stock[low_mask] = (sales[low_mask] * rng.uniform(0.1, 0.5, low_mask.sum())).astype(int)

    spike_mask = rng.random(n) < 0.06
    sales[spike_mask] = (sales[spike_mask] * rng.uniform(2.5, 4.0, spike_mask.sum())).astype(int)

    return pd.DataFrame({
        "station_id": station_ids,
        "region": region_picks,
        "product_id": product_picks,
        "stock": stock,
        "sales": sales,
    })
