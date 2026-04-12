"""Synthetic month-end close data."""

import pandas as pd
import numpy as np


def generate_financial_close_data(seed: int = 81) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 70

    units = ["Upstream", "Downstream", "Trading", "Castrol", "Renewables",
             "Retail", "Corporate", "Shared Services"]
    periods = ["2026-01", "2026-02", "2026-03"]

    recon = rng.uniform(0.88, 1.0, n)
    pending = rng.integers(0, 4, n)
    unreconciled = rng.uniform(0, 18000, n)
    audit_flag = rng.random(n) < 0.06

    issue_mask = rng.random(n) < 0.10
    unreconciled[issue_mask] = rng.uniform(130000, 500000, issue_mask.sum())
    audit_flag[issue_mask] = True

    pending_mask = rng.random(n) < 0.15
    pending[pending_mask] = rng.integers(6, 18, pending_mask.sum())
    recon[pending_mask] = rng.uniform(0.82, 0.94, pending_mask.sum())

    return pd.DataFrame({
        "entity_id": [f"CLS-{i:04d}" for i in range(n)],
        "business_unit": rng.choice(units, n),
        "period": rng.choice(periods, n),
        "reconciled_pct": recon,
        "pending_entries": pending,
        "unreconciled_amount": unreconciled,
        "audit_flag": audit_flag,
    })
