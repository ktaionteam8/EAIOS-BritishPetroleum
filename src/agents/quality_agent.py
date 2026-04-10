"""
quality_agent.py - EAIOS Quality Intelligence Worker Agent
===========================================================
Analyses inspection lot data (QALS + QAMR), computes quality scores,
defect probabilities, root cause diagnosis, and returns structured insights.
"""
import json
import warnings
from datetime import datetime, timezone
from typing import Any

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

DEFECT_CRITICAL: float = 0.15
DEFECT_AT_RISK: float = 0.08
DEFECT_MONITOR: float = 0.03
WEIGHT_DEFECT_RATE: float = 0.40
WEIGHT_PARAM_FAIL: float = 0.35
WEIGHT_OVERALL_FAIL: float = 0.25
HIGH_RISK_QUALITY: float = 0.60


class QualityAgent:

    def __init__(self) -> None:
        self.qals: pd.DataFrame = pd.DataFrame()
        self.qamr: pd.DataFrame = pd.DataFrame()
        self._merged: pd.DataFrame = pd.DataFrame()

    def load_data(self, qals: pd.DataFrame, qamr: pd.DataFrame) -> None:
        self.qals = qals.copy()
        self.qamr = qamr.copy()

    def _compute_parameter_features(self) -> pd.DataFrame:
        df = self.qamr.copy()
        df["upper_limit"] = df["upper_limit"].replace(0, np.nan)
        df["lower_limit"] = df["lower_limit"].replace(0, np.nan)
        limit_range = df["upper_limit"] - df["lower_limit"]
        limit_range = limit_range.replace(0, np.nan)
        df["is_above_upper"] = df["measured_value"] > df["upper_limit"]
        df["is_below_lower"] = df["measured_value"] < df["lower_limit"]
        df["is_out_of_spec"] = df["is_above_upper"] | df["is_below_lower"]
        deviation = np.where(
            df["is_above_upper"],
            (df["measured_value"] - df["upper_limit"]) / limit_range * 100,
            np.where(
                df["is_below_lower"],
                (df["lower_limit"] - df["measured_value"]) / limit_range * 100,
                0.0,
            ),
        )
        df["deviation_pct"] = np.round(deviation, 4)
        return df

    def _merge_tables(self, qamr_enriched: pd.DataFrame) -> pd.DataFrame:
        return qamr_enriched.merge(
            self.qals[["inspection_lot_id", "material_id", "plant_id",
                       "lot_size", "inspection_date", "result_status", "defect_count"]],
            on="inspection_lot_id", how="left",
        )

    def engineer_features(self) -> None:
        qamr_enriched = self._compute_parameter_features()
        self._merged = self._merge_tables(qamr_enriched)

    @staticmethod
    def _compute_quality_score(defect_rate, param_fail_fraction, overall_fail) -> float:
        defect_component = (1 - min(defect_rate / DEFECT_CRITICAL, 1)) * WEIGHT_DEFECT_RATE
        param_component = (1 - param_fail_fraction) * WEIGHT_PARAM_FAIL
        result_component = (0.0 if overall_fail else 1.0) * WEIGHT_OVERALL_FAIL
        score = round(defect_component + param_component + result_component, 4)
        return float(np.clip(score, 0, 1))

    @staticmethod
    def _compute_defect_probability(quality_score, defect_rate, n_failed_params, overall_fail) -> float:
        base = 0.3 * (1 - quality_score)
        amp = min(defect_rate / DEFECT_CRITICAL, 1) * 6.0 * 0.2
        param = n_failed_params * 0.15
        fail = 0.35 if overall_fail else 0
        prob = round(min(base + amp + param + fail, 1.0), 4)
        return float(np.clip(prob, 0, 1))

    @staticmethod
    def _classify_status(defect_rate, quality_score, overall_fail, n_failed_params) -> str:
        if overall_fail or defect_rate >= DEFECT_CRITICAL:
            return "CRITICAL"
        if defect_rate >= DEFECT_AT_RISK or n_failed_params >= 2:
            return "AT_RISK"
        if defect_rate >= DEFECT_MONITOR or quality_score < HIGH_RISK_QUALITY:
            return "MONITOR"
        return "PASS"

    def _identify_root_cause(self, lot_id, failed_params, defect_rate, overall_fail) -> str:
        thermal_params = {"temperature"}
        fluid_params = {"pressure", "viscosity"}
        chem_params = {"ph_level"}
        env_params = {"moisture"}
        filter_params = {"particle_size"}
        fp_set = set(failed_params)
        if len(fp_set) >= 3:
            return ("Multiple simultaneous parameter failures indicate systemic "
                    "process instability - likely a batch-level process control deviation.")
        if fp_set & thermal_params and not (fp_set - thermal_params):
            return "Thermal control fault - temperature outside specification."
        if fp_set & fluid_params and not (fp_set - fluid_params):
            return "Fluid system fault - pressure/viscosity deviation."
        if fp_set & chem_params:
            return "Chemical imbalance - pH level deviation detected."
        if fp_set & env_params:
            return "Environmental / storage fault - moisture deviation."
        if fp_set & filter_params:
            return "Filtration / contamination issue - particle size deviation."
        if defect_rate >= DEFECT_AT_RISK:
            return "Elevated defect rate suggests upstream process variance."
        if overall_fail and len(fp_set) == 0:
            return "Overall lot FAIL with no parameter failure - likely incoming material issue."
        return "No specific root cause identified."

    @staticmethod
    def _build_reason(failed_params, defect_rate, quality_score, overall_fail) -> str:
        parts = []
        if overall_fail:
            parts.append("Lot-level inspection result: FAIL")
        if failed_params:
            listing = ", ".join(sorted(failed_params))
            parts.append(f"Parameters outside specification: {listing}")
        if defect_rate >= DEFECT_MONITOR:
            parts.append(f"Defect rate {defect_rate:.1%} exceeds acceptable threshold")
        if quality_score < HIGH_RISK_QUALITY:
            parts.append(f"Quality score {quality_score:.2f} below minimum threshold ({HIGH_RISK_QUALITY})")
        if not parts:
            parts.append(f"All characteristics within limits; quality score {quality_score:.2f}")
        return "; ".join(parts)

    def _aggregate_lot(self, lot_id: str, grp: pd.DataFrame) -> dict:
        header = grp.iloc[0]
        lot_size = int(header["lot_size"])
        defect_count = int(header["defect_count"])
        defect_rate = round(defect_count / lot_size, 4) if lot_size > 0 else 0

        failed_mask = grp["is_out_of_spec"]
        failed_params = sorted(grp.loc[failed_mask, "characteristic"].tolist())
        n_failed = len(failed_params)
        param_fail_frac = n_failed / max(len(grp), 1)
        overall_fail = str(header["result_status"]).upper() == "FAIL"

        quality_score = self._compute_quality_score(defect_rate, param_fail_frac, overall_fail)
        defect_prob = self._compute_defect_probability(quality_score, defect_rate, n_failed, overall_fail)
        status = self._classify_status(defect_rate, quality_score, overall_fail, n_failed)
        root_cause = self._identify_root_cause(lot_id, failed_params, defect_rate, overall_fail)
        reason = self._build_reason(failed_params, defect_rate, quality_score, overall_fail)

        param_details = []
        for _, row in grp.sort_values("characteristic").iterrows():
            param_details.append({
                "characteristic": row["characteristic"],
                "measured_value": float(row["measured_value"]),
                "lower_limit": float(row["lower_limit"]),
                "upper_limit": float(row["upper_limit"]),
                "unit": row["unit"],
                "deviation_pct": round(float(row["deviation_pct"]), 4),
                "result": row["result"],
            })

        return {
            "inspection_lot_id": lot_id,
            "material_id": str(header["material_id"]),
            "plant_id": str(header["plant_id"]),
            "lot_size": lot_size,
            "inspection_date": str(header["inspection_date"]),
            "defect_count": defect_count,
            "defect_rate": defect_rate,
            "quality_score": quality_score,
            "defect_probability": defect_prob,
            "overall_result": str(header["result_status"]),
            "status": status,
            "failed_parameters": failed_params,
            "parameter_details": param_details,
            "root_cause": root_cause,
            "reason": reason,
        }

    def run(self) -> list[dict[str, Any]]:
        self.engineer_features()
        ts = datetime.now(timezone.utc).isoformat()
        results = []
        for lot_id, grp in self._merged.groupby("inspection_lot_id"):
            data = self._aggregate_lot(str(lot_id), grp)
            data["agent"] = "QualityAgent"
            data["timestamp"] = ts
            results.append(data)
        return sorted(results, key=lambda r: r["defect_probability"], reverse=True)

    def run_for_lot(self, lot_id: str) -> dict:
        for result in self.run():
            if result["inspection_lot_id"] == lot_id:
                return result
        raise ValueError(f"Inspection lot '{lot_id}' not found in QALS table.")

    def run_json(self, indent: int = 2) -> str:
        return json.dumps(self.run(), indent=indent, default=str)


if __name__ == "__main__":
    import os, sys
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
    from data.quality_sample_data import generate_all

    tables = generate_all(seed=42)
    agent = QualityAgent()
    agent.load_data(tables["QALS"], tables["QAMR"])
    results = agent.run()

    print(f"Quality Inspection Insights - {len(results)} lots\n")
    for r in results:
        print(f"[{r['status']:>8}] {r['inspection_lot_id']}  prob={r['defect_probability']:.3f}"
              f"  score={r['quality_score']:.3f}  {r['reason'][:55]}")

    with open("quality_output.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, default=str)
    print("\nSaved -> quality_output.json")
