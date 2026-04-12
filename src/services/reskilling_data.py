"""Synthetic reskilling candidate data."""

import pandas as pd
import numpy as np


def generate_reskilling_data(seed: int = 66) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 100

    current_roles = ["Offshore Driller", "Refinery Operator", "Crude Trader",
                     "Petroleum Engineer", "Pipeline Technician", "Fuel Distribution Planner",
                     "Lubricant Sales Rep", "Downstream Analyst"]
    target_roles = ["Hydrogen Systems Engineer", "Carbon Capture Analyst",
                    "Renewables Trader", "EV Charging Planner", "Wind/Solar Technician",
                    "Biofuels Specialist", "Grid Integration Engineer", "Sustainability Analyst"]

    role_demand_trend = rng.normal(0.0, 0.10, n).clip(-0.35, 0.20)
    target_demand = rng.uniform(0.05, 0.35, n)
    transferable = rng.uniform(0.15, 0.85, n)
    learning_agility = rng.uniform(0.3, 0.95, n)

    decline_mask = rng.random(n) < 0.30
    role_demand_trend[decline_mask] = rng.uniform(-0.32, -0.18, decline_mask.sum())

    return pd.DataFrame({
        "employee_id": [f"EMP-R-{i:05d}" for i in range(n)],
        "current_role": rng.choice(current_roles, n),
        "target_role": rng.choice(target_roles, n),
        "role_demand_trend": role_demand_trend,
        "target_role_demand": target_demand,
        "transferable_skills_pct": transferable,
        "learning_agility": learning_agility,
    })
