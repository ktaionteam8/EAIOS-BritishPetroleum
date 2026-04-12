"""Synthetic employee performance and retention data."""

import pandas as pd
import numpy as np


def generate_talent_analytics_data(seed: int = 63) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 120

    departments = ["Upstream", "Downstream", "Trading", "Castrol", "Renewables",
                   "Corporate IT", "HSE", "Finance", "Legal", "HR"]
    roles = ["Engineer", "Analyst", "Manager", "Senior Engineer", "Director",
             "Specialist", "Technician", "Lead", "Consultant"]

    perf = rng.normal(3.5, 0.7, n).clip(1.0, 5.0)
    tenure = rng.uniform(0.5, 18.0, n)
    attrition = rng.uniform(0.05, 0.85, n)
    engagement = rng.uniform(0.3, 0.95, n)

    top_mask = rng.random(n) < 0.15
    perf[top_mask] = rng.uniform(4.4, 5.0, top_mask.sum())

    flight_risk_mask = rng.random(n) < 0.18
    attrition[flight_risk_mask] = rng.uniform(0.65, 0.92, flight_risk_mask.sum())

    return pd.DataFrame({
        "employee_id": [f"EMP-{i:05d}" for i in range(n)],
        "department": rng.choice(departments, n),
        "role": rng.choice(roles, n),
        "performance_score": perf,
        "tenure_years": tenure,
        "attrition_risk": attrition,
        "engagement_score": engagement,
    })
