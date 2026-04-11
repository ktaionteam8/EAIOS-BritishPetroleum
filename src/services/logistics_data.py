"""
Logistics Shipment Data Generator
====================================
Generates synthetic multimodal transport data with delay and route-risk
anomalies for testing the LogisticsAgent pipeline.
"""

import pandas as pd
import numpy as np


def generate_logistics_data(seed: int = 45) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 120

    products = ["Gasoline", "Diesel", "Jet Fuel", "LPG", "Lubricant-5W30"]
    sources = ["Whiting Refinery", "Rotterdam Terminal", "Gelsenkirchen Hub", "Cherry Point Depot"]
    destinations = ["Chicago Hub", "London Terminal", "Berlin Depot", "Seattle Port", "Dubai Terminal",
                     "Lagos Depot", "Mumbai Hub", "Singapore Terminal"]
    modes = ["Pipeline", "Tanker", "Rail", "Truck"]

    delay_days = rng.integers(0, 3, n)
    delay_mask = rng.random(n) < 0.15
    delay_days[delay_mask] = rng.integers(5, 20, delay_mask.sum())

    route_risk = rng.uniform(0.05, 0.4, n)
    risk_mask = rng.random(n) < 0.10
    route_risk[risk_mask] = rng.uniform(0.7, 0.95, risk_mask.sum())

    return pd.DataFrame({
        "shipment_id": [f"SHP-{i:05d}" for i in range(n)],
        "product_id": rng.choice(products, n).tolist(),
        "source": rng.choice(sources, n).tolist(),
        "destination": rng.choice(destinations, n).tolist(),
        "delay_days": delay_days,
        "mode": rng.choice(modes, n).tolist(),
        "route_risk": np.round(route_risk, 3),
    })
