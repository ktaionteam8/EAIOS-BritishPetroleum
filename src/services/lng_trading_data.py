"""Synthetic LNG cargo and hub price data."""

import pandas as pd
import numpy as np


def generate_lng_trading_data(seed: int = 55) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 40

    origins = ["Ras Laffan (Qatar)", "Sabine Pass (US)", "Gladstone (AUS)",
               "Bonny (Nigeria)", "Yamal (Russia)", "Damietta (Egypt)"]

    base = rng.normal(11.5, 1.5, n).clip(6, 18)
    spot_price = base
    ttf_price = base + rng.normal(1.0, 1.2, n)
    jkm_price = base + rng.normal(1.3, 1.5, n)
    shipping_cost = rng.uniform(0.4, 1.4, n)
    volume = rng.integers(2_500_000, 4_200_000, n)

    # Inject arbitrage opportunities
    jkm_arb = rng.random(n) < 0.25
    jkm_price[jkm_arb] = spot_price[jkm_arb] + shipping_cost[jkm_arb] + rng.uniform(0.8, 2.5, jkm_arb.sum())

    ttf_arb = rng.random(n) < 0.20
    ttf_price[ttf_arb] = spot_price[ttf_arb] + shipping_cost[ttf_arb] + rng.uniform(0.7, 2.0, ttf_arb.sum())

    return pd.DataFrame({
        "cargo_id": [f"LNG-{i:04d}" for i in range(n)],
        "origin": rng.choice(origins, n),
        "volume_mmbtu": volume,
        "spot_price": spot_price,
        "ttf_price": ttf_price,
        "jkm_price": jkm_price,
        "shipping_cost": shipping_cost,
    })
