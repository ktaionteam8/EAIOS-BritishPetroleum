"""
Quality-Control Agent for the EAIOS Manufacturing AI platform.

Analyses SAP-QM-style inspection data (QALS lot headers and QAMR
measurement results) to compute quality scores, defect probabilities,
risk classifications, and root-cause diagnoses for every inspection lot.
"""

from __future__ import annotations

import json
import warnings
from datetime import datetime, timezone
from typing import Any

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

# ---------------------------------------------------------------------------
# Threshold constants
# ---------------------------------------------------------------------------

DEFECT_CRITICAL: float = 0.15
DEFECT_AT_RISK: float = 0.08
DEFECT_MONITOR: float = 0.03

# Scoring weights (must sum to 1.0)
WEIGHT_DEFECT_RATE: float = 0.4
WEIGHT_PARAM_FAIL: float = 0.35
WEIGHT_OVERALL_FAIL: float = 0.25

HIGH_RISK_QUALITY: float = 0.6


# ---------------------------------------------------------------------------
# Agent
# ---------------------------------------------------------------------------


class QualityAgent:
    """Stateful agent that ingests quality-inspection data, engineers
    features, and produces lot-level risk assessments."""

    def __init__(self) -> None:
        self.qals: pd.DataFrame = pd.DataFrame()
        self.qamr: pd.DataFrame = pd.DataFrame()
        self._merged: pd.DataFrame = pd.DataFrame()

    # ------------------------------------------------------------------ I/O
    def load_data(self, qals: pd.DataFrame, qamr: pd.DataFrame) -> None:
        """Load inspection lot headers (QALS) and measurement results (QAMR).

        Parameters
        ----------
        qals : pd.DataFrame
            Columns: inspection_lot_id, material_id, plant_id, lot_size,
            inspection_date, result_status, defect_count.
        qamr : pd.DataFrame
            Columns: inspection_lot_id, characteristic, measured_value,
            lower_limit, upper_limit, unit, result.
        """
        self.qals = qals.copy()
        self.qamr = qamr.copy()

    # ------------------------------------------------------- feature engineering
    def _compute_parameter_features(self) -> pd.DataFrame:
        """Enrich the QAMR table with deviation and out-of-spec indicators.

        Returns
        -------
        pd.DataFrame
            The enriched QAMR DataFrame with additional columns:
            ``limit_range``, ``deviation_pct``, ``is_above_upper``,
            ``is_below_lower``, ``is_out_of_spec``.
        """
        df = self.qamr.copy()

        df["limit_range"] = df["upper_limit"] - df["lower_limit"]

        df["is_above_upper"] = df["measured_value"] > df["upper_limit"]
        df["is_below_lower"] = df["measured_value"] < df["lower_limit"]
        df["is_out_of_spec"] = df["is_above_upper"] | df["is_below_lower"]

        # Percentage deviation beyond the breached limit.  Zero when within spec.
        deviation = np.where(
            df["is_above_upper"],
            (df["measured_value"] - df["upper_limit"]) / df["limit_range"],
            np.where(
                df["is_below_lower"],
                (df["lower_limit"] - df["measured_value"]) / df["limit_range"],
                0.0,
            ),
        )
        df["deviation_pct"] = pd.Series(deviation, index=df.index)
        df["deviation_pct"] = df["deviation_pct"].replace([np.inf, -np.inf], np.nan)
        df["deviation_pct"] = df["deviation_pct"].round(4)

        return df

    def _merge_tables(self, qamr_enriched: pd.DataFrame) -> pd.DataFrame:
        """Left-join QALS header columns onto the enriched QAMR table.

        Parameters
        ----------
        qamr_enriched : pd.DataFrame
            Output of :py:meth:`_compute_parameter_features`.

        Returns
        -------
        pd.DataFrame
            Merged DataFrame containing both lot-level header information
            and measurement-level detail.
        """
        qals_cols = [
            "inspection_lot_id",
            "material_id",
            "plant_id",
            "lot_size",
            "inspection_date",
            "result_status",
            "defect_count",
        ]
        return qamr_enriched.merge(
            self.qals[qals_cols],
            on="inspection_lot_id",
            how="left",
        )

    def engineer_features(self) -> None:
        """Run the full feature-engineering pipeline and store the result."""
        enriched = self._compute_parameter_features()
        self._merged = self._merge_tables(enriched)

    # ------------------------------------------------------- scoring helpers
    @staticmethod
    def _compute_quality_score(
        defect_rate: float,
        param_fail_fraction: float,
        overall_fail: bool,
    ) -> float:
        """Compute a composite quality score in [0, 1].

        Higher is better.

        Parameters
        ----------
        defect_rate : float
            Ratio of defective items to lot size.
        param_fail_fraction : float
            Fraction of measured characteristics that failed.
        overall_fail : bool
            Whether the lot's overall result is FAIL.

        Returns
        -------
        float
            Weighted quality score, clipped to [0, 1].
        """
        defect_component = (1 - min(defect_rate / DEFECT_CRITICAL, 1)) * WEIGHT_DEFECT_RATE
        param_component = (1 - param_fail_fraction) * WEIGHT_PARAM_FAIL
        result_component = (1.0 if not overall_fail else 0.0) * WEIGHT_OVERALL_FAIL

        score = defect_component + param_component + result_component
        return float(np.clip(round(score, 4), 0, 1))

    @staticmethod
    def _compute_defect_probability(
        quality_score: float,
        defect_rate: float,
        n_failed_params: int,
        overall_fail: bool,
    ) -> float:
        """Estimate the probability that the lot contains critical defects.

        Parameters
        ----------
        quality_score : float
            Output of :py:meth:`_compute_quality_score`.
        defect_rate : float
            Defect rate for the lot.
        n_failed_params : int
            Number of characteristics that failed.
        overall_fail : bool
            Whether the lot's overall result is FAIL.

        Returns
        -------
        float
            Estimated probability in [0, 1].
        """
        base = 0.3 * (1 - quality_score)
        amp = min(defect_rate / DEFECT_CRITICAL, 1) * 6.0 * 0.2
        param = n_failed_params * 0.15
        fail = 0.35 if overall_fail else 0.0

        prob = min(base + amp + param + fail, 1.0)
        return float(np.clip(round(prob, 4), 0, 1))

    @staticmethod
    def _classify_status(
        defect_rate: float,
        quality_score: float,
        overall_fail: bool,
        n_failed_params: int,
    ) -> str:
        """Classify the lot into a risk bucket.

        Returns
        -------
        str
            One of ``CRITICAL``, ``AT_RISK``, ``MONITOR``, or ``PASS``.
        """
        if overall_fail or defect_rate >= DEFECT_CRITICAL:
            return "CRITICAL"
        if defect_rate >= DEFECT_AT_RISK or n_failed_params >= 2:
            return "AT_RISK"
        if defect_rate >= DEFECT_MONITOR or quality_score < HIGH_RISK_QUALITY:
            return "MONITOR"
        return "PASS"

    # -------------------------------------------------------- root-cause
    def _identify_root_cause(
        self,
        lot_id: str,
        failed_params: list[str],
        defect_rate: float,
        overall_fail: bool,
    ) -> str:
        """Perform pattern-based root-cause diagnosis.

        Parameters
        ----------
        lot_id : str
            Inspection lot identifier (for context).
        failed_params : list[str]
            Names of characteristics that failed specification checks.
        defect_rate : float
            Lot defect rate.
        overall_fail : bool
            Whether the lot's overall result is FAIL.

        Returns
        -------
        str
            Human-readable root-cause hypothesis.
        """
        if not failed_params:
            return "No parameter failures detected."

        thermal_params = {"temperature"}
        fluid_params = {"pressure", "viscosity"}
        chem_params = {"ph_level"}
        env_params = {"moisture"}
        filter_params = {"particle_size"}

        fp_set = set(failed_params)

        if len(fp_set) >= 3:
            return (
                f"Process instability: {len(fp_set)} parameters out of spec "
                f"({', '.join(sorted(fp_set))}). Recommend full process audit."
            )
        if fp_set <= thermal_params:
            return "Thermal control fault: temperature excursion detected. Check heating/cooling systems."
        if fp_set <= fluid_params:
            return "Fluid system fault: pressure/viscosity deviation. Inspect pumps and flow controllers."
        if fp_set <= chem_params:
            return "Chemical imbalance: pH level out of range. Review additive dosing systems."
        if fp_set <= env_params:
            return "Environmental control issue: moisture deviation. Check drying and humidity controls."
        if fp_set <= filter_params:
            return "Filtration issue: particle size out of spec. Inspect filters and separators."

        return (
            f"Multi-factor deviation in {', '.join(sorted(fp_set))}. "
            "Cross-domain investigation recommended."
        )

    # -------------------------------------------------------- explanation
    @staticmethod
    def _build_reason(
        failed_params: list[str],
        defect_rate: float,
        quality_score: float,
        overall_fail: bool,
    ) -> str:
        """Compose a human-readable explanation for the lot assessment.

        Parameters
        ----------
        failed_params : list[str]
            Names of failed characteristics.
        defect_rate : float
            Lot defect rate.
        quality_score : float
            Composite quality score.
        overall_fail : bool
            Whether the lot result is FAIL.

        Returns
        -------
        str
            Multi-sentence explanation.
        """
        parts: list[str] = []

        if overall_fail:
            parts.append("Overall lot result is FAIL.")

        if failed_params:
            parts.append(
                f"Out-of-spec parameters: {', '.join(sorted(failed_params))}."
            )

        if defect_rate >= DEFECT_CRITICAL:
            parts.append(
                f"Defect rate ({defect_rate:.2%}) exceeds critical threshold "
                f"({DEFECT_CRITICAL:.0%})."
            )
        elif defect_rate >= DEFECT_AT_RISK:
            parts.append(
                f"Defect rate ({defect_rate:.2%}) exceeds at-risk threshold "
                f"({DEFECT_AT_RISK:.0%})."
            )
        elif defect_rate >= DEFECT_MONITOR:
            parts.append(
                f"Defect rate ({defect_rate:.2%}) exceeds monitoring threshold "
                f"({DEFECT_MONITOR:.0%})."
            )

        if quality_score < HIGH_RISK_QUALITY:
            parts.append(
                f"Quality score ({quality_score:.4f}) is below the high-risk "
                f"threshold ({HIGH_RISK_QUALITY})."
            )

        if not parts:
            parts.append("All parameters within specification. Lot quality is acceptable.")

        return " ".join(parts)

    # -------------------------------------------------------- aggregation
    def _aggregate_lot(self, lot_id: str, grp: pd.DataFrame) -> dict[str, Any]:
        """Aggregate measurement-level data into a single lot-level record.

        Parameters
        ----------
        lot_id : str
            Inspection lot identifier.
        grp : pd.DataFrame
            Subset of ``_merged`` for this lot.

        Returns
        -------
        dict[str, Any]
            Lot-level assessment dictionary.
        """
        header = grp.iloc[0]
        lot_size = int(header["lot_size"])
        defect_count = int(header["defect_count"])
        defect_rate = round(defect_count / lot_size, 4) if lot_size > 0 else 0.0
        overall_fail = header["result_status"] == "FAIL"

        failed_mask = grp["is_out_of_spec"]
        failed_params = grp.loc[failed_mask, "characteristic"].tolist()
        n_total = len(grp)
        n_failed = int(failed_mask.sum())
        param_fail_fraction = n_failed / n_total if n_total > 0 else 0.0

        quality_score = self._compute_quality_score(
            defect_rate, param_fail_fraction, overall_fail
        )
        defect_probability = self._compute_defect_probability(
            quality_score, defect_rate, n_failed, overall_fail
        )
        status = self._classify_status(
            defect_rate, quality_score, overall_fail, n_failed
        )
        root_cause = self._identify_root_cause(
            lot_id, failed_params, defect_rate, overall_fail
        )
        reason = self._build_reason(
            failed_params, defect_rate, quality_score, overall_fail
        )

        # Build per-parameter detail records.
        param_details: list[dict[str, Any]] = []
        for _, row in grp.iterrows():
            param_details.append(
                {
                    "characteristic": row["characteristic"],
                    "measured_value": round(float(row["measured_value"]), 2),
                    "lower_limit": float(row["lower_limit"]),
                    "upper_limit": float(row["upper_limit"]),
                    "unit": row["unit"],
                    "result": row["result"],
                    "deviation_pct": (
                        round(float(row["deviation_pct"]), 4)
                        if pd.notna(row["deviation_pct"])
                        else None
                    ),
                    "is_out_of_spec": bool(row["is_out_of_spec"]),
                }
            )

        return {
            "inspection_lot_id": lot_id,
            "material_id": header["material_id"],
            "plant_id": header["plant_id"],
            "lot_size": lot_size,
            "inspection_date": str(header["inspection_date"]),
            "defect_count": defect_count,
            "defect_rate": defect_rate,
            "quality_score": quality_score,
            "defect_probability": defect_probability,
            "overall_result": header["result_status"],
            "status": status,
            "failed_parameters": failed_params,
            "parameter_details": param_details,
            "root_cause": root_cause,
            "reason": reason,
        }

    # -------------------------------------------------------- public API
    def run(self) -> list[dict[str, Any]]:
        """Execute the full analysis pipeline across all lots.

        Returns
        -------
        list[dict[str, Any]]
            Sorted list of lot assessments (highest defect probability first).
        """
        self.engineer_features()
        results: list[dict[str, Any]] = []

        for lot_id, grp in self._merged.groupby("inspection_lot_id"):
            record = self._aggregate_lot(str(lot_id), grp)
            record["agent"] = "QualityAgent"
            record["timestamp"] = datetime.now(timezone.utc).isoformat()
            results.append(record)

        results.sort(key=lambda r: r["defect_probability"], reverse=True)
        return results

    def run_for_lot(self, lot_id: str) -> dict[str, Any]:
        """Run the analysis for a single lot.

        Parameters
        ----------
        lot_id : str
            The inspection lot identifier to analyse.

        Returns
        -------
        dict[str, Any]
            Lot-level assessment.

        Raises
        ------
        ValueError
            If *lot_id* is not present in the loaded data.
        """
        self.engineer_features()
        mask = self._merged["inspection_lot_id"] == lot_id
        if not mask.any():
            raise ValueError(f"Lot '{lot_id}' not found in loaded data.")

        grp = self._merged.loc[mask]
        record = self._aggregate_lot(lot_id, grp)
        record["agent"] = "QualityAgent"
        record["timestamp"] = datetime.now(timezone.utc).isoformat()
        return record

    def run_json(self, indent: int = 2) -> str:
        """Run the full pipeline and return JSON output.

        Parameters
        ----------
        indent : int
            JSON indentation level.

        Returns
        -------
        str
            JSON-encoded list of lot assessments.
        """
        return json.dumps(self.run(), indent=indent)


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    from src.data.quality_sample_data import generate_all

    data = generate_all()
    agent = QualityAgent()
    agent.load_data(data["QALS"], data["QAMR"])

    results = agent.run()

    print(f"\n{'='*70}")
    print("  QUALITY CONTROL AGENT  -  LOT ASSESSMENT SUMMARY")
    print(f"{'='*70}\n")
    print(f"Total lots analysed: {len(results)}\n")

    for r in results:
        print(
            f"  {r['inspection_lot_id']}  |  {r['status']:<10}  |  "
            f"QS={r['quality_score']:.4f}  |  DP={r['defect_probability']:.4f}  |  "
            f"Defects={r['defect_count']}/{r['lot_size']}"
        )

    print(f"\n{'='*70}\n")

    # Persist full output
    output_path = "quality_output.json"
    with open(output_path, "w", encoding="utf-8") as fp:
        json.dump(results, fp, indent=2)
    print(f"Full results written to {output_path}")
