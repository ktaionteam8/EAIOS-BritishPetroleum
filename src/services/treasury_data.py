"""Synthetic treasury account data."""

import pandas as pd
import numpy as np


def generate_treasury_data(seed: int = 85) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 50

    entities = ["BP UK Ltd", "BP America", "BP Singapore", "BP Germany",
                "Castrol India", "BP Azerbaijan", "BP Trading Geneva",
                "BP Gas & Power", "BP Renewables", "BP Aviation"]
    currencies = ["USD", "GBP", "EUR", "SGD", "INR", "AZN", "JPY"]

    cash = rng.uniform(5_000_000, 250_000_000, n)
    inflow = rng.normal(30_000_000, 20_000_000, n)
    obligations = rng.uniform(15_000_000, 200_000_000, n)
    fx_exposure = rng.uniform(0.05, 0.55, n)

    shortfall_mask = rng.random(n) < 0.15
    obligations[shortfall_mask] = (cash[shortfall_mask] + inflow[shortfall_mask]) * rng.uniform(1.05, 1.4, shortfall_mask.sum())

    surplus_mask = rng.random(n) < 0.20
    obligations[surplus_mask] = (cash[surplus_mask] + inflow[surplus_mask]) * rng.uniform(0.40, 0.55, surplus_mask.sum())

    return pd.DataFrame({
        "account_id": [f"TRE-{i:04d}" for i in range(n)],
        "entity_name": rng.choice(entities, n),
        "currency": rng.choice(currencies, n),
        "cash_balance": cash,
        "net_inflow_30d": inflow,
        "obligations_30d": obligations,
        "fx_exposure": fx_exposure,
    })
