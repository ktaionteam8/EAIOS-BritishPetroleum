"""Synthetic crude trading data generator."""

import pandas as pd
import numpy as np


def generate_crude_trading_data(seed: int = 51) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 80

    grades = ["Brent", "WTI", "Dubai", "Urals", "Bonny Light", "Arab Light"]
    grade_picks = rng.choice(grades, n)

    ma_20 = rng.normal(82, 6, n).clip(60, 110)
    spot_price = ma_20 * rng.normal(1.0, 0.06, n)
    volatility = rng.uniform(0.1, 0.5, n)
    volume = rng.integers(10000, 500000, n)

    # Inject arbitrage opportunities
    buy_mask = rng.random(n) < 0.15
    spot_price[buy_mask] = ma_20[buy_mask] * rng.uniform(0.88, 0.94, buy_mask.sum())

    sell_mask = rng.random(n) < 0.15
    spot_price[sell_mask] = ma_20[sell_mask] * rng.uniform(1.06, 1.12, sell_mask.sum())

    return pd.DataFrame({
        "trade_id": [f"CRT-{i:04d}" for i in range(n)],
        "grade": grade_picks,
        "spot_price": spot_price,
        "ma_20": ma_20,
        "volatility": volatility,
        "volume": volume,
    })
