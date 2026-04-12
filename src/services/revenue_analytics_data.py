"""
Synthetic revenue analytics data.

Simulates cross-domain revenue inputs INTERNALLY (no API calls to other
branches). Trading revenue, retail sales, and demand signals are
generated as mock signals representing what other domains would publish.
"""

import pandas as pd
import numpy as np


def generate_revenue_analytics_data(seed: int = 86) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 75

    streams = ["Crude Trading", "Refined Products", "LNG Trading", "Castrol Lubricants",
               "Retail Fuel", "Aviation Fuel", "Marine Fuel", "Renewables",
               "Carbon Credits", "Gas & Power"]
    regions = ["North America", "Europe", "Middle East", "Asia Pacific", "Africa", "South America"]

    trading = rng.normal(15_000_000, 6_000_000, n).clip(500_000, 40_000_000)
    retail = rng.normal(8_000_000, 3_500_000, n).clip(200_000, 25_000_000)
    demand = rng.uniform(0.3, 0.85, n)
    prev_quarter = (trading + retail) * rng.normal(1.0, 0.08, n)

    growth_mask = rng.random(n) < 0.22
    prev_quarter[growth_mask] = (trading[growth_mask] + retail[growth_mask]) * rng.uniform(0.80, 0.92, growth_mask.sum())
    demand[growth_mask] = rng.uniform(0.60, 0.90, growth_mask.sum())

    decline_mask = rng.random(n) < 0.18
    prev_quarter[decline_mask] = (trading[decline_mask] + retail[decline_mask]) * rng.uniform(1.06, 1.18, decline_mask.sum())

    return pd.DataFrame({
        "stream_id": [f"REV-{i:04d}" for i in range(n)],
        "revenue_stream": rng.choice(streams, n),
        "region": rng.choice(regions, n),
        "trading_revenue": trading,
        "retail_sales": retail,
        "demand_index": demand,
        "prev_quarter_revenue": prev_quarter,
    })
