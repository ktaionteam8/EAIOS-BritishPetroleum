"""Synthetic aviation fuel demand history data."""

import pandas as pd
import numpy as np


def generate_aviation_forecast_data(seed: int = 54) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 50

    airports = ["LHR", "JFK", "DXB", "SIN", "FRA", "CDG", "NRT", "LAX", "ORD", "AMS"]
    route_types = ["Long-haul Intl", "Short-haul Intl", "Domestic Trunk", "Regional"]

    return pd.DataFrame({
        "route_id": [f"AVR-{i:04d}" for i in range(n)],
        "airport": rng.choice(airports, n),
        "route": rng.choice(route_types, n),
        "avg_daily_demand": rng.normal(18000, 7000, n).clip(2000, 45000),
        "trend_pct": rng.normal(0.02, 0.06, n).clip(-0.15, 0.20),
        "seasonality_factor": rng.normal(1.0, 0.08, n).clip(0.80, 1.25),
        "volatility": rng.uniform(0.08, 0.35, n),
    })
