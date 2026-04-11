"""
Inventory Data Generator
==========================
Generates synthetic warehouse inventory data with stockout and overstock
anomalies for testing the InventoryAgent pipeline.
"""

import pandas as pd
import numpy as np


def generate_inventory_data(seed: int = 44) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 100

    locations = [f"WH-{i:03d}" for i in range(20)]
    products = ["Gasoline", "Diesel", "Jet Fuel", "LPG", "Lubricant-5W30", "Lubricant-10W40"]

    location_picks = rng.choice(locations, n)
    product_picks = rng.choice(products, n)
    safety_stock = rng.integers(5000, 25000, n)
    stock = rng.normal(18000, 8000, n).clip(500, 50000).astype(int)

    low_mask = rng.random(n) < 0.12
    stock[low_mask] = (safety_stock[low_mask] * rng.uniform(0.15, 0.6, low_mask.sum())).astype(int)

    high_mask = rng.random(n) < 0.08
    stock[high_mask] = (safety_stock[high_mask] * rng.uniform(3.2, 5.0, high_mask.sum())).astype(int)

    return pd.DataFrame({
        "location_id": location_picks,
        "product_id": product_picks,
        "stock": stock,
        "safety_stock": safety_stock,
    })
