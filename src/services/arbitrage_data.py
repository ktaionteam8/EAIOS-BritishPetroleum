"""Synthetic cross-commodity spread data."""

import pandas as pd
import numpy as np


def generate_arbitrage_data(seed: int = 56) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 100

    pairs = [
        ("Brent", "Diesel"),
        ("Brent", "Gasoline"),
        ("WTI", "Brent"),
        ("Gasoil", "Diesel"),
        ("LNG-JKM", "LNG-TTF"),
        ("Naphtha", "Gasoline"),
        ("Fuel Oil", "Gasoil"),
        ("LPG", "Gasoline"),
        ("Lubricant-5W30", "Lubricant-10W40"),
    ]
    pair_picks = rng.integers(0, len(pairs), n)

    mean_spread = rng.uniform(2.0, 15.0, n)
    stdev_spread = mean_spread * rng.uniform(0.08, 0.25, n)
    observed_spread = rng.normal(mean_spread, stdev_spread)
    transaction_cost = rng.uniform(0.3, 1.5, n)

    # Inject ~20% arbitrage opportunities
    arb_mask = rng.random(n) < 0.20
    direction = rng.choice([-1, 1], arb_mask.sum())
    observed_spread[arb_mask] = mean_spread[arb_mask] + direction * stdev_spread[arb_mask] * rng.uniform(2.2, 3.5, arb_mask.sum())

    return pd.DataFrame({
        "pair_id": [f"ARB-{i:04d}" for i in range(n)],
        "leg_a": [pairs[p][0] for p in pair_picks],
        "leg_b": [pairs[p][1] for p in pair_picks],
        "observed_spread": observed_spread,
        "mean_spread": mean_spread,
        "stdev_spread": stdev_spread,
        "transaction_cost": transaction_cost,
    })
