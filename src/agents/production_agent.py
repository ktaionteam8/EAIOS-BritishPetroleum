"""
Production Agent for SAP PP (Production Planning) order analysis.

Analyses production orders by merging SAP-style tables (AFKO, AFPO, AFVC,
AFRU, CRHD), computing operation-level metrics, and producing per-order
delay / efficiency assessments with human-readable explanations.
"""

import json
import warnings
from datetime import datetime, timezone
from typing import Any

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

# ---------------------------------------------------------------------------
# Thresholds
# ---------------------------------------------------------------------------
DELAY_CRITICAL_RATIO = 0.2
DELAY_AT_RISK_RATIO = 0.05
EFFICIENCY_LOW = 0.8
DELAY_SCORE_CAP = 2.0


class ProductionAgent:
    """Evaluate production-order health from SAP PP tables.

    Workflow
    --------
    1. ``load_data``   -- ingest copies of the five SAP tables.
    2. ``engineer_features`` -- merge and compute operation metrics.
    3. ``run``         -- aggregate per order, classify, and return results.
    """

    def __init__(self) -> None:
        self.afko: pd.DataFrame = pd.DataFrame()
        self.afpo: pd.DataFrame = pd.DataFrame()
        self.afvc: pd.DataFrame = pd.DataFrame()
        self.afru: pd.DataFrame = pd.DataFrame()
        self.crhd: pd.DataFrame = pd.DataFrame()
        self._ops_df: pd.DataFrame = pd.DataFrame()

    # ------------------------------------------------------------------
    # Data loading
    # ------------------------------------------------------------------

    def load_data(
        self,
        afko: pd.DataFrame,
        afpo: pd.DataFrame,
        afvc: pd.DataFrame,
        afru: pd.DataFrame,
        crhd: pd.DataFrame,
    ) -> None:
        """Store copies of the five SAP PP input tables.

        Parameters
        ----------
        afko : DataFrame
            Production Order Header (AUFNR, MATNR, WERKS, AUFPL, GSTRP, GLTRP).
        afpo : DataFrame
            Order Item with planned quantity (AUFNR, PSMNG).
        afvc : DataFrame
            Planned Operations / Routing (AUFPL, VORNR, ARBID, VGW01, VGW02, VGW03).
        afru : DataFrame
            Actual Confirmations (AUFNR, VORNR, ARBID, ISM01, GMNGA, XMNGA).
        crhd : DataFrame
            Work Center Master (OBJID, ARBPL, KAPAZ).
        """
        self.afko = afko.copy()
        self.afpo = afpo.copy()
        self.afvc = afvc.copy()
        self.afru = afru.copy()
        self.crhd = crhd.copy()

    # ------------------------------------------------------------------
    # Merge & feature engineering
    # ------------------------------------------------------------------

    def _merge_tables(self) -> pd.DataFrame:
        """Join the five SAP tables into a single operations-level DataFrame."""
        # Order header + item
        order_base = self.afko.merge(self.afpo, on="AUFNR", how="left")

        # Attach planned operations via routing key
        ops_planned = order_base.merge(self.afvc, on="AUFPL", how="left")

        # Attach actual confirmations
        ops_full = ops_planned.merge(
            self.afru,
            on=["AUFNR", "VORNR", "ARBID"],
            how="left",
        )

        # Attach work-center master (OBJID is the join key for ARBID)
        crhd_renamed = self.crhd.rename(columns={"OBJID": "ARBID"})
        merged = ops_full.merge(crhd_renamed, on="ARBID", how="left")

        return merged

    def _compute_operation_metrics(self, merged: pd.DataFrame) -> pd.DataFrame:
        """Add derived operation-level metric columns.

        New columns
        -----------
        time_ratio      : ISM01 / VGW01  (actual / planned time)
        time_delta_hrs  : ISM01 - VGW01  (absolute overrun in hours)
        total_qty       : GMNGA + XMNGA
        op_efficiency   : GMNGA / total_qty
        op_scrap_rate   : XMNGA / total_qty
        is_delayed_op   : True when time_ratio > 1 + DELAY_AT_RISK_RATIO
        """
        df = merged.copy()

        df["VGW01"] = pd.to_numeric(df["VGW01"], errors="coerce").fillna(0)
        df["ISM01"] = pd.to_numeric(df["ISM01"], errors="coerce").fillna(0)
        df["GMNGA"] = pd.to_numeric(df["GMNGA"], errors="coerce").fillna(0)
        df["XMNGA"] = pd.to_numeric(df["XMNGA"], errors="coerce").fillna(0)

        df["time_ratio"] = np.where(
            df["VGW01"] > 0,
            (df["ISM01"] / df["VGW01"]).round(4),
            np.nan,
        )

        df["time_delta_hrs"] = (df["ISM01"] - df["VGW01"]).round(3)

        df["total_qty"] = df["GMNGA"] + df["XMNGA"]

        df["op_efficiency"] = np.where(
            df["total_qty"] > 0,
            (df["GMNGA"] / df["total_qty"]).round(4),
            np.nan,
        )

        df["op_scrap_rate"] = np.where(
            df["total_qty"] > 0,
            (df["XMNGA"] / df["total_qty"]).round(4),
            0.0,
        )

        df["is_delayed_op"] = df["time_ratio"] > (1 + DELAY_AT_RISK_RATIO)

        return df

    def engineer_features(self) -> None:
        """Merge tables and compute operation-level metrics (in-place)."""
        merged = self._merge_tables()
        self._ops_df = self._compute_operation_metrics(merged)

    # ------------------------------------------------------------------
    # Per-order aggregation
    # ------------------------------------------------------------------

    def _aggregate_order(self, grp: pd.DataFrame) -> dict[str, Any]:
        """Reduce all operations for a single production order into a summary dict."""
        first = grp.iloc[0]

        total_planned = grp["VGW01"].sum()
        total_actual = grp["ISM01"].sum()

        if total_planned > 0:
            overrun_fraction = (total_actual - total_planned) / total_planned
        else:
            overrun_fraction = 0.0

        delay_score = round(min(max(overrun_fraction, 0), DELAY_SCORE_CAP), 4)

        # Efficiency / scrap aggregates
        total_good = grp["GMNGA"].sum()
        total_scrap = grp["XMNGA"].sum()
        total_output = total_good + total_scrap

        efficiency_score = round(total_good / total_output, 4) if total_output > 0 else 1.0
        scrap_rate = round(total_scrap / total_output, 4) if total_output > 0 else 0.0

        # Bottleneck: operation with highest time_ratio
        valid_ops = grp.dropna(subset=["time_ratio"])
        if not valid_ops.empty:
            bn = valid_ops.loc[valid_ops["time_ratio"].idxmax()]
            bottleneck_op = str(bn["VORNR"])
            bottleneck_wc = str(bn.get("ARBPL", ""))
            bottleneck_tr = round(float(bn["time_ratio"]), 4)
        else:
            bottleneck_op = ""
            bottleneck_wc = ""
            bottleneck_tr = 0.0

        # Per-operation breakdown
        ops_breakdown = []
        for _, row in grp.iterrows():
            ops_breakdown.append({
                "operation": str(row["VORNR"]),
                "work_center": str(row.get("ARBPL", "")),
                "planned_hrs": round(float(row["VGW01"]), 3),
                "actual_hrs": round(float(row["ISM01"]), 3),
                "time_ratio": round(float(row["time_ratio"]), 4) if pd.notna(row["time_ratio"]) else None,
                "good_qty": int(row["GMNGA"]),
                "scrap_qty": int(row["XMNGA"]),
            })

        # Planned date span
        planned_start = str(first.get("GSTRP", ""))
        planned_end = str(first.get("GLTRP", ""))
        try:
            p_start = pd.Timestamp(planned_start)
            p_end = pd.Timestamp(planned_end)
            planned_days = (p_end - p_start).days
        except Exception:
            planned_days = 0

        return {
            "order_id": str(first["AUFNR"]),
            "material": str(first["MATNR"]),
            "plant": str(first["WERKS"]),
            "planned_quantity": int(first.get("PSMNG", 0)),
            "total_planned_hrs": round(float(total_planned), 3),
            "total_actual_hrs": round(float(total_actual), 3),
            "production_delay_score": delay_score,
            "efficiency_score": efficiency_score,
            "scrap_rate": scrap_rate,
            "bottleneck_operation": bottleneck_op,
            "bottleneck_work_center": bottleneck_wc,
            "bottleneck_time_ratio": bottleneck_tr,
            "planned_start": planned_start,
            "planned_end": planned_end,
            "planned_days": planned_days,
            "operations_breakdown": ops_breakdown,
        }

    # ------------------------------------------------------------------
    # Classification helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _classify_status(delay_score: float, efficiency_score: float) -> str:
        """Classify the production order into a status bucket.

        Categories
        ----------
        DELAYED         : delay_score >= DELAY_CRITICAL_RATIO
        AT_RISK         : delay_score >= DELAY_AT_RISK_RATIO
        LOW_EFFICIENCY  : efficiency_score < EFFICIENCY_LOW
        ON_TRACK        : everything within thresholds
        """
        if delay_score >= DELAY_CRITICAL_RATIO:
            return "DELAYED"
        if delay_score >= DELAY_AT_RISK_RATIO:
            return "AT_RISK"
        if efficiency_score < EFFICIENCY_LOW:
            return "LOW_EFFICIENCY"
        return "ON_TRACK"

    @staticmethod
    def _build_reason(
        status: str,
        delay_score: float,
        efficiency_score: float,
        scrap_rate: float,
        bottleneck_op: str,
        bottleneck_wc: str,
        bottleneck_tr: float,
        total_planned: float,
        total_actual: float,
    ) -> str:
        """Build a human-readable explanation for the order status."""
        parts: list[str] = []

        if status in ("DELAYED", "AT_RISK"):
            overrun = round(total_actual - total_planned, 2)
            parts.append(
                f"Order is {status.replace('_', ' ')} with a delay score of "
                f"{delay_score:.2%}. Actual hours ({total_actual:.1f}h) exceeded "
                f"planned ({total_planned:.1f}h) by {overrun:.1f}h."
            )
            if bottleneck_op:
                parts.append(
                    f"Bottleneck at operation {bottleneck_op} "
                    f"(work center: {bottleneck_wc}) with time ratio "
                    f"{bottleneck_tr:.2f}x."
                )

        if scrap_rate >= 0.10:
            parts.append(
                f"Scrap rate is elevated at {scrap_rate:.2%}, "
                f"indicating potential quality issues."
            )

        if efficiency_score < EFFICIENCY_LOW:
            parts.append(
                f"Efficiency score ({efficiency_score:.2%}) is below the "
                f"{EFFICIENCY_LOW:.0%} threshold."
            )

        if not parts:
            parts.append(
                f"Order is ON TRACK. Delay score {delay_score:.2%}, "
                f"efficiency {efficiency_score:.2%}."
            )

        return " ".join(parts)

    # ------------------------------------------------------------------
    # Public run methods
    # ------------------------------------------------------------------

    def run(self) -> list[dict[str, Any]]:
        """Execute the full production analysis pipeline.

        Returns
        -------
        list[dict]
            One dict per production order, sorted by production_delay_score
            descending. Each dict includes classification, reasoning, and
            an operations breakdown.
        """
        self.engineer_features()

        results: list[dict[str, Any]] = []
        for _, grp in self._ops_df.groupby("AUFNR"):
            agg = self._aggregate_order(grp)

            status = self._classify_status(
                agg["production_delay_score"],
                agg["efficiency_score"],
            )
            reason = self._build_reason(
                status,
                agg["production_delay_score"],
                agg["efficiency_score"],
                agg["scrap_rate"],
                agg["bottleneck_operation"],
                agg["bottleneck_work_center"],
                agg["bottleneck_time_ratio"],
                agg["total_planned_hrs"],
                agg["total_actual_hrs"],
            )

            agg["status"] = status
            agg["reason"] = reason
            agg["agent"] = "ProductionAgent"
            agg["timestamp"] = datetime.now(timezone.utc).isoformat()

            results.append(agg)

        # Sort by delay score descending (worst first)
        results.sort(key=lambda r: r["production_delay_score"], reverse=True)
        return results

    def run_for_order(self, order_id: str) -> dict[str, Any]:
        """Run the pipeline and return the result for a single order.

        Parameters
        ----------
        order_id : str
            The production order number (AUFNR) to retrieve.

        Raises
        ------
        ValueError
            If the order is not found in the dataset.
        """
        all_results = self.run()
        for r in all_results:
            if r["order_id"] == order_id:
                return r
        raise ValueError(
            f"Order '{order_id}' not found. "
            f"Available orders: {[r['order_id'] for r in all_results]}"
        )

    def run_json(self, indent: int = 2) -> str:
        """Run the pipeline and return the results as a JSON string."""
        return json.dumps(self.run(), indent=indent, default=str)


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import sys
    import os

    # Ensure project root is on the path
    sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

    from src.data.production_sample_data import generate_all

    print("Generating sample production data (seed=42) ...")
    data = generate_all(seed=42)

    agent = ProductionAgent()
    agent.load_data(
        afko=data["AFKO"],
        afpo=data["AFPO"],
        afvc=data["AFVC"],
        afru=data["AFRU"],
        crhd=data["CRHD"],
    )

    results = agent.run()

    # Console summary
    print(f"\n{'=' * 60}")
    print(f"  Production Agent  --  {len(results)} orders analysed")
    print(f"{'=' * 60}")

    for r in results:
        print(
            f"  {r['order_id']:>8s}  |  {r['status']:<16s}  |  "
            f"delay={r['production_delay_score']:.4f}  "
            f"eff={r['efficiency_score']:.4f}  "
            f"scrap={r['scrap_rate']:.4f}"
        )

    print(f"{'=' * 60}\n")

    # Persist to JSON
    output_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "production_output.json"
    )
    output_path = os.path.normpath(output_path)
    with open(output_path, "w", encoding="utf-8") as fh:
        json.dump(results, fh, indent=2, default=str)

    print(f"Results saved to {output_path}")
