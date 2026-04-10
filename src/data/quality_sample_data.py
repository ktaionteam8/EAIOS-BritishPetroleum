"""
quality_sample_data.py - EAIOS Quality Agent Sample Data
=========================================================
Simulates QALS (Inspection Lot) and QAMR (Inspection Results) tables.
"""
import random
from datetime import date, timedelta

import numpy as np
import pandas as pd

LOT_IDS = [f"L{i}" for i in range(1001, 1021)]
MATERIALS = ("MAT-A", "MAT-B", "MAT-C", "MAT-D", "MAT-E")
PLANTS = ("P001", "P002", "P003")

CHARACTERISTICS: dict[str, dict] = {
    "viscosity":      {"mean": 45.0,  "std": 2.0,  "lower": 40.0, "upper": 50.0,  "unit": "cSt"},
    "temperature":    {"mean": 78.0,  "std": 3.0,  "lower": 70.0, "upper": 85.0,  "unit": "°C"},
    "pressure":       {"mean": 140.0, "std": 5.0,  "lower": 125.0,"upper": 155.0, "unit": "psi"},
    "ph_level":       {"mean": 7.2,   "std": 0.15, "lower": 6.8,  "upper": 7.6,   "unit": "pH"},
    "particle_size":  {"mean": 18.0,  "std": 3.0,  "lower": 10.0, "upper": 25.0,  "unit": "um"},
    "moisture":       {"mean": 2.5,   "std": 0.5,  "lower": 1.0,  "upper": 4.0,   "unit": "%"},
}

FAILED_LOTS = ("L1001", "L1003", "L1006", "L1007")
HIGH_DEFECT_LOTS = ("L1001", "L1003", "L1006", "L1007")
PARAM_FAIL_LOTS = ("L1001", "L1003", "L1006")
PARAM_FAIL_MAP: dict[str, list[str]] = {
    "L1001": ["temperature", "pressure"],
    "L1003": ["viscosity", "ph_level", "moisture"],
    "L1006": ["particle_size"],
}


def generate_qals(seed: int = 42) -> pd.DataFrame:
    random.seed(seed)
    np.random.seed(seed)
    records = []
    base_date = date(2026, 1, 1)
    for lot_id in LOT_IDS:
        lot_size = np.random.randint(200, 1000)
        if lot_id in HIGH_DEFECT_LOTS:
            defect_rate = np.random.uniform(0.15, 0.30)
        else:
            defect_rate = np.random.uniform(0.01, 0.08)
        defect_count = max(1, round(lot_size * defect_rate))
        result_status = "FAIL" if lot_id in FAILED_LOTS else "PASS"
        insp_date = base_date + timedelta(days=np.random.randint(0, 90))
        records.append({
            "inspection_lot_id": lot_id,
            "material_id": np.random.choice(MATERIALS),
            "plant_id": np.random.choice(PLANTS),
            "lot_size": lot_size,
            "inspection_date": insp_date.strftime("%Y-%m-%d"),
            "result_status": result_status,
            "defect_count": defect_count,
        })
    return pd.DataFrame(records)


def _measured_value(characteristic: str, lot_id: str, seed_val: int) -> tuple[float, str]:
    np.random.seed(seed_val)
    cfg = CHARACTERISTICS[characteristic]
    failed_chars = PARAM_FAIL_MAP.get(lot_id, [])
    if characteristic in failed_chars:
        band = np.random.uniform(0.1, 0.35)
        if np.random.random() > 0.5:
            value = cfg["upper"] + band * (cfg["upper"] - cfg["lower"])
        else:
            value = cfg["lower"] - band * (cfg["upper"] - cfg["lower"])
    else:
        value = np.random.normal(cfg["mean"], cfg["std"])
    value = float(np.clip(round(value, 3), cfg["lower"] * 0.5, cfg["upper"] * 1.5))
    result = "FAIL" if value < cfg["lower"] or value > cfg["upper"] else "PASS"
    return value, result


def generate_qamr(qals: pd.DataFrame, seed: int = 42) -> pd.DataFrame:
    records = []
    for i, lot_row in enumerate(qals.itertuples(index=False)):
        lot_id = lot_row.inspection_lot_id
        for j, (char, cfg) in enumerate(CHARACTERISTICS.items()):
            sv = (hash(lot_id) * 31 + j * 7) % 100_997
            measured, result = _measured_value(char, lot_id, sv)
            records.append({
                "inspection_lot_id": lot_id,
                "characteristic": char,
                "measured_value": measured,
                "lower_limit": cfg["lower"],
                "upper_limit": cfg["upper"],
                "unit": cfg["unit"],
                "result": result,
            })
    return pd.DataFrame(records)


def generate_all(seed: int = 42) -> dict[str, pd.DataFrame]:
    qals = generate_qals(seed=seed)
    qamr = generate_qamr(qals, seed=seed)
    return {"QALS": qals, "QAMR": qamr}


if __name__ == "__main__":
    tables = generate_all()
    for name, df in tables.items():
        print(f"{name}  -  {len(df)} rows  |  columns: {list(df.columns)}")
        print(df.head().to_string(index=False))
        print()
