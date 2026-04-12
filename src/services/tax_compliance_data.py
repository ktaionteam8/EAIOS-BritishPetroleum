"""Synthetic tax compliance transaction data."""

import pandas as pd
import numpy as np


REGIONAL_RULES = {
    "UK": {"VAT": 0.20, "Corporate": 0.25, "Withholding": 0.20, "Carbon": 0.15},
    "US": {"VAT": 0.08, "Corporate": 0.21, "Withholding": 0.30, "Carbon": 0.08},
    "Germany": {"VAT": 0.19, "Corporate": 0.30, "Withholding": 0.26, "Carbon": 0.25},
    "India": {"VAT": 0.18, "Corporate": 0.25, "Withholding": 0.20, "Carbon": 0.05},
    "UAE": {"VAT": 0.05, "Corporate": 0.09, "Withholding": 0.00, "Carbon": 0.00},
    "Singapore": {"VAT": 0.09, "Corporate": 0.17, "Withholding": 0.15, "Carbon": 0.10},
    "Brazil": {"VAT": 0.17, "Corporate": 0.34, "Withholding": 0.15, "Carbon": 0.06},
}


def generate_tax_compliance_data(seed: int = 84) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 100

    regions = list(REGIONAL_RULES.keys())
    tax_types = ["VAT", "Corporate", "Withholding", "Carbon"]

    region_picks = rng.choice(regions, n)
    tax_picks = rng.choice(tax_types, n)
    expected = np.array([REGIONAL_RULES[r][t] for r, t in zip(region_picks, tax_picks)])
    applied = expected * rng.normal(1.0, 0.008, n)

    amounts = rng.uniform(5_000, 1_200_000, n)
    doc_ok = rng.random(n) >= 0.08

    non_comp_mask = rng.random(n) < 0.12
    applied[non_comp_mask] = expected[non_comp_mask] * rng.uniform(0.82, 0.95, non_comp_mask.sum())

    risk_mask = rng.random(n) < 0.12
    applied[risk_mask] = expected[risk_mask] * rng.uniform(1.008, 1.025, risk_mask.sum())

    return pd.DataFrame({
        "txn_id": [f"TX-{i:06d}" for i in range(n)],
        "region": region_picks,
        "tax_type": tax_picks,
        "transaction_amount": amounts,
        "expected_tax_rate": expected,
        "applied_tax_rate": applied,
        "documentation_complete": doc_ok,
    })
