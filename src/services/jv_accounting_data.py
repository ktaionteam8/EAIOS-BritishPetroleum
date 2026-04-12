"""Synthetic joint venture partner transaction data."""

import pandas as pd
import numpy as np


def generate_jv_accounting_data(seed: int = 82) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 80

    jvs = ["Azeri-Chirag-Gunashli (ACG)", "Tangguh LNG", "Shah Deniz",
           "Clair Ridge", "Khazzan", "Atlantis", "Mad Dog", "Thunder Horse",
           "Rumaila", "In Salah", "Shunzhou Wind", "Archaea Bio"]
    partners = ["SOCAR", "Pertamina", "Shell", "Chevron", "ConocoPhillips",
                "TotalEnergies", "Equinor", "Aramco", "CNPC"]

    bp_share = rng.uniform(0.15, 0.60, n)
    gross = rng.uniform(500_000, 15_000_000, n)
    expected = gross * bp_share
    reported = expected * rng.normal(1.0, 0.008, n)

    mismatch_mask = rng.random(n) < 0.12
    reported[mismatch_mask] = expected[mismatch_mask] * rng.uniform(0.88, 0.94, mismatch_mask.sum())

    over_mask = rng.random(n) < 0.08
    reported[over_mask] = expected[over_mask] * rng.uniform(1.06, 1.15, over_mask.sum())

    return pd.DataFrame({
        "jv_id": [f"JV-{i:04d}" for i in range(n)],
        "jv_name": rng.choice(jvs, n),
        "partner": rng.choice(partners, n),
        "bp_share_pct": bp_share,
        "expected_bp_share": expected,
        "reported_bp_share": reported,
    })
