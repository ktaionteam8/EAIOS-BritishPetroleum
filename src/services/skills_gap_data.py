"""Synthetic role/skill capability data."""

import pandas as pd
import numpy as np


def generate_skills_gap_data(seed: int = 62) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    n = 80

    roles = ["Process Engineer", "Reservoir Engineer", "Trader", "Data Scientist",
             "Safety Officer", "Cybersecurity Analyst", "Renewables Engineer",
             "Control Room Operator", "Pipeline Inspector", "HSE Manager"]
    skills = ["Python", "Process Simulation", "Hydrogen Systems", "Carbon Capture",
              "Risk Modeling", "SCADA", "Machine Learning", "Digital Twin",
              "Emissions Monitoring", "Power Trading", "PSM Compliance"]

    required = rng.uniform(3.0, 5.0, n)
    current = required * rng.uniform(0.5, 1.1, n)

    gap_mask = rng.random(n) < 0.35
    current[gap_mask] = required[gap_mask] * rng.uniform(0.3, 0.7, gap_mask.sum())

    return pd.DataFrame({
        "role_skill_id": [f"RS-{i:04d}" for i in range(n)],
        "role": rng.choice(roles, n),
        "skill": rng.choice(skills, n),
        "required_level": required,
        "current_level": current,
        "trainable_score": rng.uniform(0.2, 0.95, n),
        "headcount_affected": rng.integers(1, 80, n),
    })
