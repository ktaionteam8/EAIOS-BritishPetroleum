"""
Crude Shipment Data Generator
==============================
Generates synthetic crude oil shipment data with realistic anomalies
for testing the CrudeAgent risk detection pipeline.
"""

import pandas as pd
import numpy as np


def generate_crude_data(seed: int = 42) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 100

    countries = ["Saudi Arabia", "UAE", "Iraq", "Kuwait", "Nigeria", "Angola", "Norway", "USA"]
    ports = ["Ras Tanura", "Fujairah", "Basrah", "Mina Al Ahmadi", "Bonny Island", "Luanda", "Mongstad", "Houston"]

    country_picks = rng.choice(len(countries), n)
    quantities = rng.normal(500000, 120000, n).clip(100000, 900000).astype(int)
    costs = rng.normal(78, 10, n).clip(50, 130)

    arrival_offsets = rng.integers(3, 18, n)
    delay_mask = rng.random(n) < 0.08
    arrival_offsets[delay_mask] += rng.integers(10, 30, delay_mask.sum())

    spike_mask = rng.random(n) < 0.05
    costs[spike_mask] *= rng.uniform(1.35, 1.6, spike_mask.sum())

    base_date = pd.Timestamp("2025-01-01")
    arrival_dates = [base_date + pd.Timedelta(days=int(d) + i * 3) for i, d in enumerate(arrival_offsets)]

    return pd.DataFrame({
        "crude_id": [f"CRD-{i:04d}" for i in range(n)],
        "source_country": [countries[c] for c in country_picks],
        "quantity": quantities,
        "cost": np.round(costs, 2),
        "arrival_port": [ports[c] for c in country_picks],
        "arrival_date": arrival_dates,
    })
