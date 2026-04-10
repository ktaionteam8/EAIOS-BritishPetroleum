"""
sample_data.py - EAIOS Maintenance Agent Sample Data Generator
==============================================================
Simulates the three SAP-mirrored source tables used by the Maintenance
Intelligence Worker Agent:

  EQUI  - Equipment Master
  QMEL  - Failure / Notification History
  IMRG  - Sensor / Measurement Readings

All generators accept a ``seed`` argument for full reproducibility.
"""
import random
from datetime import datetime, timedelta

import numpy as np
import pandas as pd

MACHINE_IDS: list[str] = [f"M{str(i).zfill(3)}" for i in range(1, 11)]

MACHINE_TYPES = ("Compressor", "Pump", "Turbine", "Motor", "Heat Exchanger")
PLANTS = ("P001", "P002", "P003")

SENSOR_CONFIG: dict[str, dict] = {
    "temperature": {"mean": 78.0, "std": 4.5, "unit": "°C", "spike_delta": 18.0},
    "vibration":   {"mean": 3.0,  "std": 0.55, "unit": "mm/s", "spike_delta": 3.0},
    "pressure":    {"mean": 142.0, "std": 4.0, "unit": "psi", "spike_delta": 20.0},
}

ANOMALOUS_MACHINES = ("M001", "M002", "M003", "M004", "M005", "M006")
ANOMALOUS_SENSORS = ("temperature", "vibration", "pressure")


def generate_equi(seed: int = 42) -> pd.DataFrame:
    """Equipment master - one row per machine."""
    np.random.seed(seed)
    records = []
    for machine_id in MACHINE_IDS:
        age_days = np.random.randint(365, 4380)
        install_date = datetime.now() - timedelta(days=int(age_days))
        records.append({
            "EQUNR": machine_id,
            "EQART": np.random.choice(MACHINE_TYPES),
            "ANSDT": install_date.strftime("%Y-%m-%d"),
            "WERK":  np.random.choice(PLANTS),
        })
    return pd.DataFrame(records)


_FAILURE_MAP: dict[str, int] = {
    "M001": 8, "M002": 6, "M003": 5, "M004": 4, "M005": 3,
    "M006": 3, "M007": 2, "M008": 1, "M009": 1, "M010": 0,
}


def generate_qmel(
    machines: list[str] | None = None,
    seed: int = 42,
    days_back: int = 30,
) -> pd.DataFrame:
    """Failure / notification history."""
    np.random.seed(seed)
    machines = machines or MACHINE_IDS
    records = []
    for machine_id in machines:
        fail_count = _FAILURE_MAP.get(machine_id, np.random.randint(0, 4))
        for _ in range(fail_count):
            failure_days_ago = np.random.randint(1, days_back * 12)
            failure_date = datetime.now() - timedelta(days=int(failure_days_ago))
            breakdown_flag = int(np.random.random() < 0.7)
            records.append({
                "EQUNR": machine_id,
                "ERDAT": failure_date.strftime("%Y-%m-%d"),
                "AUSVN": breakdown_flag,
            })
    df = pd.DataFrame(records)
    if not df.empty:
        df = df.sort_values("ERDAT").reset_index(drop=True)
    return df


def _sensor_series(
    n_hours: int,
    sensor_type: str,
    anomalous: bool,
    seed: int,
) -> np.ndarray:
    """Generate a sensor reading series, optionally with injected spikes."""
    np.random.seed(seed)
    cfg = SENSOR_CONFIG[sensor_type]
    readings = np.random.normal(cfg["mean"], cfg["std"], size=n_hours)
    readings = np.clip(readings, cfg["mean"] - 3 * cfg["std"], cfg["mean"] + 3 * cfg["std"])
    if anomalous:
        spike_window = min(48, n_hours)
        spike_start = np.random.randint(0, max(n_hours - spike_window, 1))
        n_spikes = 6
        spike_idx = np.random.choice(range(spike_start, spike_start + spike_window), size=n_spikes, replace=True)
        for idx in spike_idx:
            readings[idx] += cfg["spike_delta"]
    return np.round(readings, 2)


def generate_imrg(
    machines: list[str] | None = None,
    days: int = 30,
    seed: int = 42,
) -> pd.DataFrame:
    """Sensor / measurement readings - hourly per machine per sensor."""
    machines = machines or MACHINE_IDS
    n_hours = days * 24
    base_dt = datetime.now().replace(minute=0, second=0, microsecond=0) - timedelta(hours=n_hours)
    records = []
    for i, machine_id in enumerate(machines):
        is_anomalous = machine_id in ANOMALOUS_MACHINES
        for sensor_type, cfg in SENSOR_CONFIG.items():
            inject_spike = is_anomalous and sensor_type in ANOMALOUS_SENSORS
            readings = _sensor_series(
                n_hours, sensor_type, anomalous=inject_spike,
                seed=(hash(machine_id) + hash(sensor_type) + seed) % 100_997,
            )
            for h in range(n_hours):
                dt = base_dt + timedelta(hours=h)
                records.append({
                    "EQUNR": machine_id,
                    "IDATE": dt.strftime("%Y-%m-%d"),
                    "ITIME": dt.strftime("%H:%M:%S"),
                    "READG": float(readings[h]),
                    "UNIT":  sensor_type,
                })
    return pd.DataFrame(records)


def generate_all(seed: int = 42, days: int = 30) -> dict[str, pd.DataFrame]:
    """Return {'EQUI': df, 'QMEL': df, 'IMRG': df}."""
    equi = generate_equi(seed=seed)
    machines = equi["EQUNR"].tolist()
    qmel = generate_qmel(machines=machines, seed=seed)
    imrg = generate_imrg(machines=machines, days=days, seed=seed)
    return {"EQUI": equi, "QMEL": qmel, "IMRG": imrg}


if __name__ == "__main__":
    tables = generate_all()
    for name, df in tables.items():
        print(f"{name}  -  {len(df)} rows  |  columns: {list(df.columns)}")
        print(df.head().to_string(index=False))
        print()
