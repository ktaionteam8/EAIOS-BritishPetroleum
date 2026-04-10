"""
Production sample data generator for SAP PP (Production Planning) tables.

Generates realistic synthetic data for production order analysis,
mirroring SAP table structures: AFKO, AFPO, AFVC, AFRU, and CRHD.
"""

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ORDER_IDS = [f"ORD{i}" for i in range(1001, 1016)]  # 15 orders

OPERATIONS = ("OP10", "OP20", "OP30", "OP40")

MATERIALS = ("MAT-A", "MAT-B", "MAT-C", "MAT-D", "MAT-E", "MAT-F")

PLANTS = ("P001", "P002", "P003")

WORK_CENTERS: dict[str, dict] = {
    "WC001": {"name": "Cutting", "capacity_hr": 480},
    "WC002": {"name": "Welding", "capacity_hr": 400},
    "WC003": {"name": "Assembly", "capacity_hr": 520},
    "WC004": {"name": "Painting", "capacity_hr": 360},
    "WC005": {"name": "Quality Check", "capacity_hr": 240},
}

# Orders deliberately injected with high delay / low efficiency
DELAYED_ORDERS = ORDER_IDS[:5]          # ORD1001-ORD1005
LOW_EFFICIENCY_ORDERS = ORDER_IDS[5:8]  # ORD1006-ORD1008

PLANNED_TIME_RANGE = (2.0, 12.0)   # hours
SETUP_TIME_RANGE = (0.5, 3.0)      # hours
MACHINE_TIME_RANGE = (1.0, 8.0)    # hours

OPS_PER_ROUTING = (3, 4)


# ---------------------------------------------------------------------------
# Generators
# ---------------------------------------------------------------------------

def generate_afko(seed: int = 42) -> pd.DataFrame:
    """Generate production order header data (SAP AFKO equivalent).

    Returns a DataFrame with columns:
        AUFNR  - Production order number
        MATNR  - Material number
        WERKS  - Plant
        AUFPL  - Routing number / plan
        GSTRP  - Planned start date
        GLTRP  - Planned end date
    """
    rng = np.random.default_rng(seed)
    base_date = datetime(2026, 1, 5)

    rows = []
    for oid in ORDER_IDS:
        mat = rng.choice(list(MATERIALS))
        plant = rng.choice(list(PLANTS))
        aufpl = f"PL-{oid}"
        offset = int(rng.integers(0, 60))
        duration = int(rng.integers(3, 15))
        start = base_date + timedelta(days=offset)
        end = start + timedelta(days=duration)
        rows.append({
            "AUFNR": oid,
            "MATNR": mat,
            "WERKS": plant,
            "AUFPL": aufpl,
            "GSTRP": start.strftime("%Y-%m-%d"),
            "GLTRP": end.strftime("%Y-%m-%d"),
        })
    return pd.DataFrame(rows)


def generate_afpo(afko: pd.DataFrame, seed: int = 42) -> pd.DataFrame:
    """Generate order item data (SAP AFPO equivalent).

    Returns a DataFrame with columns:
        AUFNR  - Production order number
        PSMNG  - Planned order quantity
    """
    rng = np.random.default_rng(seed)
    rows = []
    for oid in afko["AUFNR"]:
        qty = int(rng.integers(100, 501))
        rows.append({"AUFNR": oid, "PSMNG": qty})
    return pd.DataFrame(rows)


def generate_afvc(afko: pd.DataFrame, seed: int = 42) -> pd.DataFrame:
    """Generate planned operation / routing data (SAP AFVC equivalent).

    Returns a DataFrame with columns:
        AUFPL  - Routing number
        VORNR  - Operation number
        ARBID  - Work center object ID
        VGW01  - Planned machine time (hrs)
        VGW02  - Planned setup time (hrs)
        VGW03  - Planned labour time (hrs)
    """
    rng = np.random.default_rng(seed)
    wc_ids = list(WORK_CENTERS.keys())

    rows = []
    for aufpl in afko["AUFPL"]:
        n_ops = int(rng.choice(list(OPS_PER_ROUTING)))
        ops = list(OPERATIONS[:n_ops])
        for op in ops:
            arbid = rng.choice(wc_ids)
            vgw01 = round(float(rng.uniform(*PLANNED_TIME_RANGE)), 2)
            vgw02 = round(float(rng.uniform(*SETUP_TIME_RANGE)), 2)
            vgw03 = round(float(rng.uniform(*MACHINE_TIME_RANGE)), 2)
            rows.append({
                "AUFPL": aufpl,
                "VORNR": op,
                "ARBID": arbid,
                "VGW01": vgw01,
                "VGW02": vgw02,
                "VGW03": vgw03,
            })
    return pd.DataFrame(rows)


def _actual_time_multiplier(
    order_id: str, operation: str, seed_val: int
) -> float:
    """Return a multiplier applied to planned time to derive actual time.

    Delayed orders receive a significantly higher multiplier (1.8-2.5x),
    with per-operation variation in the 1.3-1.6x range.
    Normal orders stay close to plan (0.85-1.15x).
    """
    rng = np.random.default_rng(seed_val)
    if order_id in DELAYED_ORDERS:
        base = float(rng.uniform(1.8, 2.5))
        # add per-operation jitter
        op_idx = OPERATIONS.index(operation) if operation in OPERATIONS else 0
        jitter = float(rng.uniform(1.3, 1.6)) - 1.0  # 0.3-0.6
        return round(base + jitter * 0.3, 4)
    return round(float(rng.uniform(0.85, 1.15)), 4)


def _scrap_rate(order_id: str, seed_val: int) -> float:
    """Return the fraction of output that is scrapped.

    Low-efficiency orders get 0.20-0.35 scrap, others 0.02-0.12.
    """
    rng = np.random.default_rng(seed_val)
    if order_id in LOW_EFFICIENCY_ORDERS:
        return round(float(rng.uniform(0.20, 0.35)), 4)
    return round(float(rng.uniform(0.02, 0.12)), 4)


def generate_afru(
    afko: pd.DataFrame,
    afvc: pd.DataFrame,
    afpo: pd.DataFrame,
    seed: int = 42,
) -> pd.DataFrame:
    """Generate actual confirmation data (SAP AFRU equivalent).

    Returns a DataFrame with columns:
        AUFNR  - Production order number
        VORNR  - Operation number
        ARBID  - Work center object ID
        ISM01  - Actual machine time (hrs)
        GMNGA  - Good quantity confirmed
        XMNGA  - Scrap quantity confirmed
    """
    rng = np.random.default_rng(seed)
    qty_map = dict(zip(afpo["AUFNR"], afpo["PSMNG"]))

    # Build AUFNR -> AUFPL mapping
    aufnr_to_aufpl = dict(zip(afko["AUFNR"], afko["AUFPL"]))
    aufpl_to_aufnr = {v: k for k, v in aufnr_to_aufpl.items()}

    rows = []
    for _, op_row in afvc.iterrows():
        aufpl = op_row["AUFPL"]
        order_id = aufpl_to_aufnr.get(aufpl)
        if order_id is None:
            continue

        vornr = op_row["VORNR"]
        arbid = op_row["ARBID"]
        planned_time = op_row["VGW01"]

        # Derive a deterministic seed per order-operation pair
        op_seed = abs(hash((order_id, vornr))) % (2**31)
        mult = _actual_time_multiplier(order_id, vornr, op_seed)
        actual_time = round(planned_time * mult, 2)

        total_qty = qty_map.get(order_id, 200)
        scrap = _scrap_rate(order_id, op_seed + 1)
        xmnga = round(total_qty * scrap)
        gmnga = total_qty - xmnga

        rows.append({
            "AUFNR": order_id,
            "VORNR": vornr,
            "ARBID": arbid,
            "ISM01": actual_time,
            "GMNGA": gmnga,
            "XMNGA": xmnga,
        })
    return pd.DataFrame(rows)


def generate_crhd() -> pd.DataFrame:
    """Generate work center master data (SAP CRHD equivalent).

    Returns a DataFrame with columns:
        OBJID  - Object ID (work center key)
        ARBPL  - Work center name
        KAPAZ  - Available capacity (hrs)
    """
    rows = []
    for objid, info in WORK_CENTERS.items():
        rows.append({
            "OBJID": objid,
            "ARBPL": info["name"],
            "KAPAZ": info["capacity_hr"],
        })
    return pd.DataFrame(rows)


def generate_all(seed: int = 42) -> dict[str, pd.DataFrame]:
    """Generate a complete set of production sample data.

    Returns:
        Dictionary with keys AFKO, AFPO, AFVC, AFRU, CRHD mapping
        to their respective DataFrames.
    """
    afko = generate_afko(seed)
    afpo = generate_afpo(afko, seed)
    afvc = generate_afvc(afko, seed)
    afru = generate_afru(afko, afvc, afpo, seed)
    crhd = generate_crhd()
    return {
        "AFKO": afko,
        "AFPO": afpo,
        "AFVC": afvc,
        "AFRU": afru,
        "CRHD": crhd,
    }


if __name__ == "__main__":
    data = generate_all()
    for name, df in data.items():
        print(f"\n{'=' * 50}")
        print(f"  {name}  ({len(df)} rows)")
        print(f"{'=' * 50}")
        print(df.head(10).to_string(index=False))
