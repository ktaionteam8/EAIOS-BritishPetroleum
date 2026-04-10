"""
maintenance_agent.py - EAIOS Maintenance Intelligence Worker Agent
===================================================================
Domain-specific worker agent for the EAIOS (Enterprise AI Operating System)
platform built for British Petroleum.

Responsibilities
----------------
* Ingest three SAP-mirrored tables: EQUI, QMEL, IMRG
* Perform feature engineering (machine age, rolling sensor stats, spike detection)
* Detect sensor anomalies (z-score + threshold-based)
* Estimate per-machine failure probability (rule-based scoring)
* Return structured JSON insights for consumption by the Claude-based Master Agent

Design Constraints
------------------
* NO LLM calls - pure Python / pandas / numpy logic only
* Fully deterministic given the same input data
* Output schema is stable and documented below

Output Schema (per machine)
---------------------------
{
    "machine_id":           str,
    "machine_type":         str,
    "plant":                str,
    "machine_age_days":     int,
    "failure_probability":  float,   # 0.0-1.0
    "anomaly_score":        float,   # 0.0-1.0
    "status":               str,     # HIGH_RISK | MEDIUM_RISK | LOW_RISK
    "reason":               str,     # human-readable explanation
    "sensor_summary":       {
        "<sensor_type>": {
            "current":       float,
            "avg_7d":        float,
            "spike_24h":     float,
            "z_score":       float,
            "above_warning": bool,
            "above_critical": bool,
        }
    },
    "recent_failure_count": int,
    "total_failure_count":  int,
    "last_failure_date":    str | None,
    "agent":                "MaintenanceAgent",
    "timestamp":            str,
}
"""
import json
import warnings
from datetime import datetime, timedelta
from typing import Any

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

# Sensor thresholds: (warning, critical, spike_delta)
SENSOR_THRESHOLDS: dict[str, tuple[float, float, float]] = {
    "temperature": (92.0, 102.0, 12.0),
    "vibration":   (5.5,  6.8,   2.0),
    "pressure":    (154.0, 162.0, 10.0),
}

SENSOR_WEIGHTS: dict[str, float] = {
    "temperature": 0.30,
    "vibration":   0.45,
    "pressure":    0.25,
}

ROLLING_WINDOW_HOURS: int = 168       # 7 days
RECENT_FAILURE_WINDOW_DAYS: int = 90  # ~3 months
HIGH_AGE_THRESHOLD_DAYS: int = 1825   # ~5 years


class MaintenanceAgent:
    """Pure-Python / pandas / numpy maintenance intelligence agent."""

    def __init__(self) -> None:
        self.equi: pd.DataFrame = pd.DataFrame()
        self.qmel: pd.DataFrame = pd.DataFrame()
        self.imrg: pd.DataFrame = pd.DataFrame()
        self.features: pd.DataFrame = pd.DataFrame()
        self._sensor_detail: pd.DataFrame = pd.DataFrame()

    # ------------------------------------------------------------------
    # Data ingestion
    # ------------------------------------------------------------------
    def load_data(self, equi: pd.DataFrame, qmel: pd.DataFrame, imrg: pd.DataFrame) -> None:
        """
        Accept the three source tables as DataFrames and store copies.

        Parameters
        ----------
        equi : EQUI Equipment Master  (columns: EQUNR, EQART, ANSDT, WERK)
        qmel : QMEL Failure History   (columns: EQUNR, ERDAT, AUSVN)
        imrg : IMRG Sensor Readings   (columns: EQUNR, IDATE, ITIME, READG, UNIT)
        """
        self.equi = equi.copy()
        self.qmel = qmel.copy()
        self.imrg = imrg.copy()

    # ------------------------------------------------------------------
    # Feature engineering helpers
    # ------------------------------------------------------------------
    def _compute_machine_age(self) -> pd.Series:
        """Return a Series of machine age in days (today - installation date)."""
        today = pd.Timestamp.now().normalize()
        install = pd.to_datetime(self.equi["ANSDT"])
        return (today - install).dt.days

    def _compute_failure_features(self) -> pd.DataFrame:
        """
        Aggregate QMEL per machine into:
            total_failures    - lifetime count
            recent_failures   - count within RECENT_FAILURE_WINDOW_DAYS
            breakdown_count   - count of full breakdowns (AUSVN == 1)
            last_failure_date - most recent failure date
        """
        if self.qmel.empty:
            out = self.equi[["EQUNR"]].copy()
            out["total_failures"] = 0
            out["recent_failures"] = 0
            out["breakdown_count"] = 0
            out["last_failure_date"] = pd.NaT
            return out

        qmel = self.qmel.copy()
        qmel["ERDAT"] = pd.to_datetime(qmel["ERDAT"])
        cutoff = pd.Timestamp.now() - timedelta(days=RECENT_FAILURE_WINDOW_DAYS)

        agg = (
            qmel.groupby("EQUNR")
            .agg(
                total_failures=("ERDAT", "count"),
                breakdown_count=("AUSVN", "sum"),
                last_failure_date=("ERDAT", "max"),
            )
            .reset_index()
        )

        recent = qmel[qmel["ERDAT"] >= cutoff].groupby("EQUNR")["ERDAT"].count().reset_index()
        recent.columns = ["EQUNR", "recent_failures"]

        agg = agg.merge(recent, on="EQUNR", how="left")
        agg["recent_failures"] = agg["recent_failures"].fillna(0).astype(int)
        return agg

    def _compute_sensor_features(self) -> pd.DataFrame:
        """
        For each (machine, sensor_type) compute:
            current_val      - latest reading
            rolling_avg_7d   - 7-day rolling mean (last value)
            spike_24h        - max absolute consecutive diff in last 24 h
            z_score          - |z| of latest reading vs 7-day distribution
            above_warning    - 1 if current_val > warning threshold
            above_critical   - 1 if current_val > critical threshold
            spike_breach     - 1 if spike_24h > spike_delta threshold
        """
        imrg = self.imrg.copy()
        imrg["datetime"] = pd.to_datetime(imrg["IDATE"] + " " + imrg["ITIME"])
        imrg = imrg.sort_values(["EQUNR", "UNIT", "datetime"])

        now = imrg["datetime"].max()
        cutoff_24h = now - timedelta(hours=24)
        cutoff_7d = now - timedelta(days=7)

        records: list[dict] = []
        for (machine_id, sensor_type), grp in imrg.groupby(["EQUNR", "UNIT"]):
            grp = grp.set_index("datetime").sort_index()

            # Rolling mean over ROLLING_WINDOW_HOURS
            rolling_avg = grp["READG"].rolling(f"{ROLLING_WINDOW_HOURS}h", min_periods=1).mean().iloc[-1]
            current_val = float(grp["READG"].iloc[-1])

            # Spike in last 24 h
            recent_24h = grp.loc[grp.index >= cutoff_24h, "READG"]
            spike_24h = float(recent_24h.diff().abs().max()) if len(recent_24h) > 1 else 0.0
            if np.isnan(spike_24h):
                spike_24h = 0.0

            # Z-score against 7-day window
            window_7d = grp.loc[grp.index >= cutoff_7d, "READG"]
            std = float(window_7d.std())
            z_score = abs(current_val - float(window_7d.mean())) / std if std > 0 else 0.0

            # Threshold checks
            thr = SENSOR_THRESHOLDS.get(sensor_type, (999, 999, 999))
            above_warning = int(current_val > thr[0])
            above_critical = int(current_val > thr[1])
            spike_breach = int(spike_24h > thr[2])

            records.append({
                "EQUNR": machine_id,
                "sensor": sensor_type,
                "current_val": round(current_val, 3),
                "rolling_avg_7d": round(float(rolling_avg), 3),
                "spike_24h": round(spike_24h, 3),
                "z_score": round(z_score, 3),
                "above_warning": above_warning,
                "above_critical": above_critical,
                "spike_breach": spike_breach,
            })

        return pd.DataFrame(records)

    def engineer_features(self) -> None:
        """
        Build the master feature table (one row per machine) by joining
        equipment age, failure aggregates, and pivoted sensor statistics.
        Stores result in ``self.features``.
        """
        equi = self.equi.copy()
        equi["machine_age_days"] = self._compute_machine_age()

        fail_feats = self._compute_failure_features()
        equi = equi.merge(fail_feats, on="EQUNR", how="left").fillna(0)
        equi["total_failures"] = equi["total_failures"].astype(int)
        equi["recent_failures"] = equi["recent_failures"].astype(int)
        equi["breakdown_count"] = equi["breakdown_count"].astype(int)

        sensor_long = self._compute_sensor_features()
        self._sensor_detail = sensor_long

        if not sensor_long.empty:
            sensor_wide = sensor_long.pivot_table(
                index="EQUNR",
                columns="sensor",
                values=("current_val", "rolling_avg_7d", "spike_24h",
                        "z_score", "above_warning", "above_critical", "spike_breach"),
                aggfunc="first",
            )
            sensor_wide.columns = [f"{col[1]}_{col[0]}" for col in sensor_wide.columns]
            sensor_wide = sensor_wide.reset_index()
            equi = equi.merge(sensor_wide, on="EQUNR", how="left")

        self.features = equi

    # ------------------------------------------------------------------
    # Scoring
    # ------------------------------------------------------------------
    def _anomaly_score(self, row: pd.Series) -> float:
        """
        Compute a 0-1 anomaly score for a single machine row.

        For each sensor the sub-score blends:
            40% z-score contribution  (capped at z = 4)
            20% warning threshold breach
            25% critical threshold breach
            15% spike breach

        Sensor sub-scores are then blended by SENSOR_WEIGHTS.
        """
        total = 0.0
        for sensor, weight in SENSOR_WEIGHTS.items():
            z = float(row.get(f"{sensor}_z_score", 0))
            warn = int(row.get(f"{sensor}_above_warning", 0))
            crit = int(row.get(f"{sensor}_above_critical", 0))
            spike = int(row.get(f"{sensor}_spike_breach", 0))
            sub = 0.4 * (min(z, 4.0) / 4.0) + 0.2 * warn + 0.25 * crit + 0.15 * spike
            total += sub * weight
        return round(min(total, 1.0), 3)

    def _failure_probability(self, row: pd.Series, anomaly_score: float) -> float:
        """
        Rule-based failure probability (0-1).

        Component                   Max contribution
        Machine age (>= 5 yrs)      0.20
        Recent failures (90 d)      0.25
        Full breakdown count        0.10
        Anomaly score               0.45
        Total possible              1.00
        """
        score = 0.0
        age = float(row.get("machine_age_days", 0))
        if age >= HIGH_AGE_THRESHOLD_DAYS:
            score += 0.20
        else:
            score += 0.20 * min(age / 1095, 1.0)

        recent = int(row.get("recent_failures", 0))
        score += 0.25 * min(recent / 4, 1.0)

        breakdown = int(row.get("breakdown_count", 0))
        score += 0.10 * min(breakdown / 4, 1.0)

        score += 0.45 * anomaly_score
        return round(min(score, 1.0), 3)

    @staticmethod
    def _classify_status(probability: float) -> str:
        """Map failure probability to a human-readable risk tier."""
        if probability >= 0.7:
            return "HIGH_RISK"
        if probability >= 0.4:
            return "MEDIUM_RISK"
        return "LOW_RISK"

    def _build_reason(self, row: pd.Series) -> str:
        """
        Construct a concise, human-readable explanation of why a machine
        received its risk score.  Prioritises the most severe signals.
        """
        parts: list[str] = []
        for sensor in ("vibration", "temperature", "pressure"):
            curr = row.get(f"{sensor}_current_val", 0)
            spike = row.get(f"{sensor}_spike_24h", 0)
            if int(row.get(f"{sensor}_above_critical", 0)):
                parts.append(f"Critical {sensor.capitalize()} reading ({curr})")
            if int(row.get(f"{sensor}_spike_breach", 0)):
                parts.append(f"{sensor.capitalize()} spike +{spike}")

        recent = int(row.get("recent_failures", 0))
        if recent > 0:
            parts.append(f"{recent} failures in last {RECENT_FAILURE_WINDOW_DAYS} days")

        age = float(row.get("machine_age_days", 0))
        if age >= HIGH_AGE_THRESHOLD_DAYS:
            parts.append(f"Machine age {int(age)} days (>{HIGH_AGE_THRESHOLD_DAYS}d threshold)")

        return "; ".join(parts) if parts else "All readings nominal"

    def _build_sensor_summary(self, machine_id: str) -> dict[str, Any]:
        """Return per-sensor statistics dict for the output payload."""
        detail = self._sensor_detail
        summary: dict[str, Any] = {}
        for _, r in detail[detail["EQUNR"] == machine_id].iterrows():
            summary[r["sensor"]] = {
                "current": r["current_val"],
                "avg_7d": r["rolling_avg_7d"],
                "spike_24h": r["spike_24h"],
                "z_score": r["z_score"],
                "above_warning": bool(r["above_warning"]),
                "above_critical": bool(r["above_critical"]),
            }
        return summary

    # ------------------------------------------------------------------
    # Execution
    # ------------------------------------------------------------------
    def run(self) -> list[dict[str, Any]]:
        """
        Execute the full pipeline and return a list of machine insight dicts,
        sorted by failure_probability descending (highest risk first).

        The output list is directly consumable by the Claude-based Master Agent.
        """
        self.engineer_features()
        results: list[dict] = []
        for _, row in self.features.iterrows():
            machine_id = row["EQUNR"]
            anomaly = self._anomaly_score(row)
            probability = self._failure_probability(row, anomaly)
            status = self._classify_status(probability)
            reason = self._build_reason(row)
            sensor_summary = self._build_sensor_summary(machine_id)

            last_failure = row.get("last_failure_date")
            last_failure_str = (
                last_failure.strftime("%Y-%m-%d")
                if pd.notna(last_failure) else None
            )

            results.append({
                "machine_id": machine_id,
                "machine_type": row["EQART"],
                "plant": row["WERK"],
                "machine_age_days": int(row["machine_age_days"]),
                "failure_probability": float(probability),
                "anomaly_score": float(anomaly),
                "status": status,
                "reason": reason,
                "sensor_summary": sensor_summary,
                "recent_failure_count": int(row.get("recent_failures", 0)),
                "total_failure_count": int(row.get("total_failures", 0)),
                "last_failure_date": last_failure_str,
                "agent": "MaintenanceAgent",
                "timestamp": datetime.utcnow().isoformat(),
            })

        return sorted(results, key=lambda r: r["failure_probability"], reverse=True)

    def run_for_machine(self, machine_id: str) -> dict[str, Any]:
        """
        Run the full pipeline and return the insight dict for ``machine_id`` only.
        Raises ValueError if the machine is not found.
        """
        for result in self.run():
            if result["machine_id"] == machine_id:
                return result
        raise ValueError(f"Machine '{machine_id}' not found in EQUI table")

    def run_json(self, indent: int = 2) -> str:
        """Return the full results list as a formatted JSON string."""
        return json.dumps(self.run(), indent=indent, default=str)


if __name__ == "__main__":
    import os, sys
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
    from data.sample_data import generate_all

    print("Generating sample data ...")
    tables = generate_all(seed=42, days=30)
    print(f"  EQUI : {len(tables['EQUI'])} rows"
          f"   QMEL : {len(tables['QMEL'])} rows"
          f"   IMRG : {len(tables['IMRG']):,} rows")

    agent = MaintenanceAgent()
    agent.load_data(tables["EQUI"], tables["QMEL"], tables["IMRG"])

    if len(sys.argv) > 1:
        target = sys.argv[1].upper()
        result = agent.run_for_machine(target)
        print(f"\nMachine Insight - {target}")
        print("=" * 60)
        print(json.dumps(result, indent=2, default=str))
    else:
        results = agent.run()
        print(f"\nMaintenance Fleet Insights - {len(results)} machines\n")
        print("=" * 72)
        header = f"{'Status':>12}  {'ID':>5} {'Prob':>5} {'Anomaly':>7}  Reason"
        print(header)
        print("-" * 72)
        for r in results:
            print(f"[{r['status']:>11}]  {r['machine_id']} "
                  f"{r['failure_probability']:.2f}   {r['anomaly_score']:.3f}"
                  f"   {r['reason'][:52]}")

        print("\n\nDetailed JSON (top 2 machines):")
        print(json.dumps(results[:2], indent=2, default=str))

        with open("maintenance_output.json", "w") as f:
            json.dump(results, f, indent=2, default=str)
        print("\nSaved full results -> maintenance_output.json")
