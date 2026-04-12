"""Synthetic carbon credit market data generator."""

import pandas as pd
import numpy as np


def generate_carbon_credit_data(seed: int = 52) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 60

    schemes = ["EU-ETS (EUA)", "California (CCA)", "UK-ETS", "VCM-Gold Standard", "VCM-Verra"]
    fair_value = rng.normal(85, 20, n).clip(30, 150)
    price_eur = fair_value * rng.normal(1.0, 0.1, n)

    under_mask = rng.random(n) < 0.2
    price_eur[under_mask] = fair_value[under_mask] * rng.uniform(0.82, 0.90, under_mask.sum())

    over_mask = rng.random(n) < 0.15
    price_eur[over_mask] = fair_value[over_mask] * rng.uniform(1.10, 1.20, over_mask.sum())

    return pd.DataFrame({
        "position_id": [f"CC-{i:04d}" for i in range(n)],
        "scheme": rng.choice(schemes, n),
        "price_eur": price_eur,
        "fair_value": fair_value,
        "demand_index": rng.uniform(0.2, 0.9, n),
        "policy_tightness": rng.uniform(0.1, 0.8, n),
    })
