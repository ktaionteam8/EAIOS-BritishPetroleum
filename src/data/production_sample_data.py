"""
production_sample_data.py - EAIOS Production Agent Sample Data
==============================================================
Simulates five SAP PP tables for the Production Intelligence Worker Agent:
  AFKO, AFPO, AFVC, AFRU, CRHD
"""
import random
from datetime import date, timedelta

import numpy as np
import pandas as pd

ORDER_IDS = [f"ORD{i}" for i in range(1001, 1016)]
OPERATIONS = ("OP10", "OP20", "OP30", "OP40")
MATERIALS = ("MAT-A", "MAT-B", "MAT-C", "MAT-D", "MAT-E", "MAT-F")
PLANTS = ("P001", "P002", "P003")

WORK_CENTERS: dict[str, dict] = {
    "WC001": {"name": "Cutting",       "capacity_hr": 24},
    "WC002": {"name": "Welding",       "capacity_hr": 20},
    "WC003": {"name": "Assembly",      "capacity_hr": 16},
    "WC004": {"name": "Painting",      "capacity_hr": 8},
    "WC005": {"name": "Quality Check", "capacity_hr": 6},
}

DELAYED_ORDERS = ORDER_IDS[:5]
LOW_EFFICIENCY_ORDERS = ORDER_IDS[2:5]
PLANNED_TIME_RANGE = (2.0, 8.0)
SETUP_TIME_RANGE = (0.5, 2.0)
MACHINE_TIME_RANGE = (1.0, 6.0)
OPS_PER_ROUTING = 3


def generate_afko(seed: int = 42) -> pd.DataFrame:
    """Production Order Header."""
    random.seed(seed)
    np.random.seed(seed)
    records = []
    base_date = date(2026, 1, 1)
    for order_id in ORDER_IDS:
        planned_start = base_date + timedelta(days=np.random.randint(0, 80))
        duration = np.random.randint(3, 14)
        planned_end = planned_start + timedelta(days=duration)
        records.append({
            "AUFNR": order_id,
            "MATNR": np.random.choice(MATERIALS),
            "WERKS": np.random.choice(PLANTS),
            "AUFPL": order_id,
            "GSTRP": planned_start.strftime("%Y-%m-%d"),
            "GLTRP": planned_end.strftime("%Y-%m-%d"),
        })
    return pd.DataFrame(records)


def generate_afpo(afko: pd.DataFrame, seed: int = 42) -> pd.DataFrame:
    """Order item - planned quantity."""
    random.seed(seed)
    records = []
    for _, row in afko.iterrows():
        records.append({
            "AUFNR": row["AUFNR"],
            "PSMNG": random.randint(100, 500),
        })
    return pd.DataFrame(records)


def generate_afvc(afko: pd.DataFrame, seed: int = 42) -> pd.DataFrame:
    """Planned operations per order routing."""
    random.seed(seed)
    wc_ids = list(WORK_CENTERS.keys())
    ops_seq = OPERATIONS[:OPS_PER_ROUTING]
    records = []
    for _, row in afko.iterrows():
        routing_id = row["AUFPL"]
        wc_sample = random.sample(wc_ids, min(OPS_PER_ROUTING, len(wc_ids)))
        for op, wc in zip(ops_seq, wc_sample):
            records.append({
                "AUFPL": routing_id,
                "VORNR": op,
                "ARBID": wc,
                "VGW01": round(random.uniform(*PLANNED_TIME_RANGE), 2),
                "VGW02": round(random.uniform(*SETUP_TIME_RANGE), 2),
                "VGW03": round(random.uniform(*MACHINE_TIME_RANGE), 2),
            })
    return pd.DataFrame(records)


def _actual_time_multiplier(order_id: str, operation: str, seed_val: int) -> float:
    np.random.seed(seed_val)
    if order_id in DELAYED_ORDERS:
        return np.random.uniform(1.8, 2.5)
    if operation in ("OP30", "OP40"):
        return np.random.uniform(1.3, 1.6)
    return np.random.uniform(0.85, 1.15)


def _scrap_rate(order_id: str, seed_val: int) -> float:
    np.random.seed(seed_val)
    if order_id in LOW_EFFICIENCY_ORDERS:
        return np.random.uniform(0.20, 0.35)
    return np.random.uniform(0.02, 0.12)


def generate_afru(afko: pd.DataFrame, afvc: pd.DataFrame,
                  afpo: pd.DataFrame, seed: int = 42) -> pd.DataFrame:
    """Actual confirmations."""
    random.seed(seed)
    np.random.seed(seed)
    ops = afvc.merge(afpo[["AUFNR", "PSMNG"]], left_on="AUFPL", right_on="AUFNR")
    records = []
    for i, row in ops.iterrows():
        order_id = row["AUFNR"]
        operation = row["VORNR"]
        planned = row["VGW01"]
        qty = int(row["PSMNG"])
        local_seed = (hash(order_id) + i * 7) % 100_997
        multiplier = _actual_time_multiplier(order_id, operation, local_seed)
        actual_time = round(planned * multiplier, 2)
        sr = _scrap_rate(order_id, local_seed)
        scrap_qty = max(1, round(qty * sr))
        yield_qty = qty - scrap_qty
        records.append({
            "AUFNR": order_id,
            "VORNR": operation,
            "ARBID": row["ARBID"],
            "ISM01": actual_time,
            "GMNGA": yield_qty,
            "XMNGA": scrap_qty,
        })
    return pd.DataFrame(records)


def generate_crhd() -> pd.DataFrame:
    """Work center master."""
    records = []
    for wc_id, info in WORK_CENTERS.items():
        records.append({"OBJID": wc_id, "ARBPL": info["name"], "KAPAZ": info["capacity_hr"]})
    return pd.DataFrame(records)


def generate_all(seed: int = 42) -> dict[str, pd.DataFrame]:
    afko = generate_afko(seed=seed)
    afpo = generate_afpo(afko, seed=seed)
    afvc = generate_afvc(afko, seed=seed)
    afru = generate_afru(afko, afvc, afpo, seed=seed)
    crhd = generate_crhd()
    return {"AFKO": afko, "AFPO": afpo, "AFVC": afvc, "AFRU": afru, "CRHD": crhd}


if __name__ == "__main__":
    tables = generate_all()
    for name, df in tables.items():
        print(f"{name}  -  {len(df)} rows  |  columns: {list(df.columns)}")
        print(df.head().to_string(index=False))
        print()
