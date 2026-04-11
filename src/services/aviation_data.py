"""
Aviation Fuel Data Generator
==============================
Generates synthetic aviation fuel supply data at major airports
with critically low stock and consumption spike anomalies.
"""

import pandas as pd
import numpy as np


def generate_aviation_data(seed: int = 46) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 60

    airports = ["LHR", "JFK", "DXB", "SIN", "FRA", "CDG", "NRT", "LAX", "ORD", "AMS"]
    products = ["Jet A-1", "Jet A", "Avgas 100LL"]

    airport_picks = rng.choice(airports, n)
    product_picks = rng.choice(products, n, p=[0.6, 0.3, 0.1])
    daily_consumption = rng.normal(15000, 5000, n).clip(3000, 40000).astype(int)
    stock = rng.normal(60000, 25000, n).clip(5000, 200000).astype(int)

    low_mask = rng.random(n) < 0.10
    stock[low_mask] = (daily_consumption[low_mask] * rng.uniform(0.3, 1.8, low_mask.sum())).astype(int)

    spike_mask = rng.random(n) < 0.05
    daily_consumption[spike_mask] = (daily_consumption[spike_mask] * rng.uniform(2.0, 3.5, spike_mask.sum())).astype(int)

    return pd.DataFrame({
        "airport_id": airport_picks,
        "product_id": product_picks,
        "stock": stock,
        "daily_consumption": daily_consumption,
    })
