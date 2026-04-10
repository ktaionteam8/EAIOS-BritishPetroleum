"""
Sample data generator for the Manufacturing Quality-Control AI module.

Produces realistic QALS (Quality-Assurance Lot Summary) and QAMR
(Quality-Assurance Measurement Results) DataFrames that mirror SAP QM
table structures used by British Petroleum refineries.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

LOT_IDS: list[str] = [f"L{i}" for i in range(1001, 1021)]  # 20 lots

MATERIALS: tuple[str, ...] = ("MAT-A", "MAT-B", "MAT-C", "MAT-D", "MAT-E")

PLANTS: tuple[str, ...] = ("P001", "P002", "P003")

# Each characteristic carries statistical parameters for generation.
# Keys: mean, std, lower_limit, upper_limit, unit
CHARACTERISTICS: dict[str, dict] = {
    "viscosity": {
        "mean": 45.0,
        "std": 2.0,
        "lower": 40.0,
        "upper": 50.0,
        "unit": "cSt",
    },
    "temperature": {
        "mean": 78.0,
        "std": 3.0,
        "lower": 70.0,
        "upper": 85.0,
        "unit": "\u00b0C",
    },
    "pressure": {
        "mean": 140.0,
        "std": 5.0,
        "lower": 125.0,
        "upper": 155.0,
        "unit": "psi",
    },
    "ph_level": {
        "mean": 7.2,
        "std": 0.15,
        "lower": 6.8,
        "upper": 7.6,
        "unit": "pH",
    },
    "particle_size": {
        "mean": 18.0,
        "std": 3.0,
        "lower": 10.0,
        "upper": 25.0,
        "unit": "\u03bcm",
    },
    "moisture": {
        "mean": 2.5,
        "std": 0.5,
        "lower": 1.0,
        "upper": 4.0,
        "unit": "%",
    },
}

# Lots whose overall result_status is FAIL.
FAILED_LOTS: tuple[str, ...] = ("L1001", "L1003", "L1006", "L1007")

# Lots with elevated defect counts (defect rate 0.15 - 0.30).
HIGH_DEFECT_LOTS: tuple[str, ...] = ("L1001", "L1003", "L1006", "L1007", "L1010", "L1015")

# Lots that have specific parameters pushed out-of-spec.
PARAM_FAIL_LOTS: tuple[str, ...] = (
    "L1001", "L1003", "L1006", "L1007", "L1010", "L1012", "L1015", "L1018",
)

PARAM_FAIL_MAP: dict[str, list[str]] = {
    "L1001": ["temperature", "pressure", "viscosity"],
    "L1003": ["ph_level", "moisture"],
    "L1006": ["temperature", "pressure"],
    "L1007": ["viscosity", "particle_size", "moisture"],
    "L1010": ["pressure"],
    "L1012": ["ph_level"],
    "L1015": ["temperature", "viscosity"],
    "L1018": ["moisture"],
}


# ---------------------------------------------------------------------------
# Generators
# ---------------------------------------------------------------------------


def generate_qals(seed: int = 42) -> pd.DataFrame:
    """Generate the QALS (lot-header) DataFrame.

    Each row represents one inspection lot with an overall pass / fail
    result and an associated defect count.

    Parameters
    ----------
    seed : int
        Random seed for reproducibility.

    Returns
    -------
    pd.DataFrame
        Columns: inspection_lot_id, material_id, plant_id, lot_size,
        inspection_date, result_status, defect_count.
    """
    rng = np.random.default_rng(seed)
    rows: list[dict] = []

    base_date = pd.Timestamp("2025-01-15")

    for idx, lot_id in enumerate(LOT_IDS):
        lot_size = int(rng.integers(200, 1001))

        if lot_id in HIGH_DEFECT_LOTS:
            defect_rate = rng.uniform(0.15, 0.30)
        else:
            defect_rate = rng.uniform(0.01, 0.08)

        defect_count = max(1, int(round(lot_size * defect_rate)))
        result_status = "FAIL" if lot_id in FAILED_LOTS else "PASS"

        rows.append(
            {
                "inspection_lot_id": lot_id,
                "material_id": MATERIALS[idx % len(MATERIALS)],
                "plant_id": PLANTS[idx % len(PLANTS)],
                "lot_size": lot_size,
                "inspection_date": (base_date + pd.Timedelta(days=idx)).strftime(
                    "%Y-%m-%d"
                ),
                "result_status": result_status,
                "defect_count": defect_count,
            }
        )

    return pd.DataFrame(rows)


def _measured_value(
    characteristic: str,
    lot_id: str,
    seed_val: int,
) -> float:
    """Return a measured value for *characteristic* in *lot_id*.

    If the lot is listed in ``PARAM_FAIL_MAP`` for this characteristic the
    value is deliberately pushed outside the specification limits.

    Parameters
    ----------
    characteristic : str
        Name of the quality characteristic.
    lot_id : str
        Inspection lot identifier.
    seed_val : int
        Seed value for the random generator (ensures repeatability).

    Returns
    -------
    float
        Simulated measured value, rounded to 2 decimal places.
    """
    rng = np.random.default_rng(seed_val)
    spec = CHARACTERISTICS[characteristic]

    if lot_id in PARAM_FAIL_MAP and characteristic in PARAM_FAIL_MAP[lot_id]:
        # Push above upper or below lower limit.
        if rng.random() < 0.5:
            value = spec["upper"] + rng.uniform(0.5, 3.0) * spec["std"]
        else:
            value = spec["lower"] - rng.uniform(0.5, 3.0) * spec["std"]
    else:
        value = rng.normal(spec["mean"], spec["std"])

    return round(float(value), 2)


def generate_qamr(qals: pd.DataFrame, seed: int = 42) -> pd.DataFrame:
    """Generate the QAMR (measurement-results) DataFrame.

    For every lot in *qals* and every characteristic a single measurement
    row is created.

    Parameters
    ----------
    qals : pd.DataFrame
        Lot-header table (must contain ``inspection_lot_id``).
    seed : int
        Random seed for reproducibility.

    Returns
    -------
    pd.DataFrame
        Columns: inspection_lot_id, characteristic, measured_value,
        lower_limit, upper_limit, unit, result.
    """
    rows: list[dict] = []

    for lot_idx, lot_id in enumerate(qals["inspection_lot_id"]):
        for char_idx, (char_name, spec) in enumerate(CHARACTERISTICS.items()):
            seed_val = seed + lot_idx * 100 + char_idx
            mv = _measured_value(char_name, lot_id, seed_val)
            result = (
                "PASS"
                if spec["lower"] <= mv <= spec["upper"]
                else "FAIL"
            )

            rows.append(
                {
                    "inspection_lot_id": lot_id,
                    "characteristic": char_name,
                    "measured_value": mv,
                    "lower_limit": spec["lower"],
                    "upper_limit": spec["upper"],
                    "unit": spec["unit"],
                    "result": result,
                }
            )

    return pd.DataFrame(rows)


def generate_all(seed: int = 42) -> dict[str, pd.DataFrame]:
    """Generate both QALS and QAMR tables in one call.

    Parameters
    ----------
    seed : int
        Random seed for reproducibility.

    Returns
    -------
    dict[str, pd.DataFrame]
        ``{"QALS": <DataFrame>, "QAMR": <DataFrame>}``
    """
    qals = generate_qals(seed=seed)
    qamr = generate_qamr(qals, seed=seed)
    return {"QALS": qals, "QAMR": qamr}


# ---------------------------------------------------------------------------
# Quick sanity check
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    data = generate_all()
    print("QALS shape:", data["QALS"].shape)
    print(data["QALS"].head())
    print("\nQAMR shape:", data["QAMR"].shape)
    print(data["QAMR"].head(12))
