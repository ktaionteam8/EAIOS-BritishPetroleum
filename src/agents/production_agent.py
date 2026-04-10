"""
production_agent.py - EAIOS Production Intelligence Worker Agent
================================================================
Domain-specific worker agent for the EAIOS platform built for British Petroleum.

Ingests five SAP PP tables (AFKO, AFPO, AFVC, AFRU, CRHD), computes
production delay scores, efficiency metrics, and bottleneck analysis.
Returns structured JSON insights for the Master Agent.
"""
import json
import warnings
from datetime import datetime, timezone
from typing import Any

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

DELAY_CRITICAL_RATIO: float = 0.20
DELAY_AT_RISK_RATIO: float = 0.05
EFFICIENCY_LOW: float = 0.80
DELAY_SCORE_CAP: float = 2.0


class ProductionAgent:

    def __init__(self) -> None:
        self.afko: pd.DataFrame = pd.DataFrame()
        self.afpo: pd.DataFrame = pd.DataFrame()
        self.afvc: pd.DataFrame = pd.DataFrame()
        self.afru: pd.DataFrame = pd.DataFrame()
        self.crhd: pd.DataFrame = pd.DataFrame()
        self._ops_df: pd.DataFrame = pd.DataFrame()

    def load_data(self, afko, afpo, afvc, afru, crhd) -> None:
        """
        Accept the five source tables and store copies.

        Parameters
        ----------
        afko : AFKO Production Order Header  (AUFNR, MATNR, WERKS, AUFPL, GSTRP, GLTRP)
        afpo : AFPO Order Item               (AUFNR, PSMNG)
        afvc : AFVC Planned Operations       (AUFPL, VORNR, ARBID, VGW01, VGW02, VGW03)
        afru : AFRU Actual Confirmations     (AUFNR, VORNR, ARBID, ISM01, GMNGA, XMNGA)
        crhd : CRHD Work Center Master       (OBJID, ARBPL, KAPAZ)
        """
        self.afko = afko.copy()
        self.afpo = afpo.copy()
        self.afvc = afvc.copy()
        self.afru = afru.copy()
        self.crhd = crhd.copy()

    def _merge_tables(self) -> pd.DataFrame:
        """
        Join all five tables into a single operation-level DataFrame.
        """
        order_base = self.afko.merge(self.afpo[["AUFNR", "PSMNG"]], on="AUFNR", how="left")
        ops_planned = order_base.merge(
            self.afvc[["AUFPL", "VORNR", "ARBID", "VGW01", "VGW02", "VGW03"]],
            on="AUFPL", how="left",
        )
        ops_full = ops_planned.merge(
            self.afru[["AUFNR", "VORNR", "ARBID", "ISM01", "GMNGA", "XMNGA"]],
            on=("AUFNR", "VORNR", "ARBID"), how="left",
        )
        wc = self.crhd.rename(columns={"OBJID": "ARBID"})
        return ops_full.merge(wc, on="ARBID", how="left")

    def _compute_operation_metrics(self, merged: pd.DataFrame) -> pd.DataFrame:
        """Add per-operation derived columns."""
        df = merged.copy()
        df["VGW01"] = df["VGW01"].replace(0, np.nan)
        total_qty = df["GMNGA"] + df["XMNGA"]
        total_qty = total_qty.replace(0, np.nan)
        df["time_ratio"] = round(df["ISM01"] / df["VGW01"], 4)
        df["time_delta_hrs"] = round(df["ISM01"] - df["VGW01"], 3)
        df["op_efficiency"] = round(df["GMNGA"] / total_qty, 4)
        df["op_scrap_rate"] = round(df["XMNGA"] / total_qty, 4)
        df["is_delayed_op"] = df["time_ratio"] > 1 + DELAY_AT_RISK_RATIO
        return df

    def engineer_features(self) -> None:
        """Build the merged, feature-enriched operation-level DataFrame."""
        merged = self._merge_tables()
        self._ops_df = self._compute_operation_metrics(merged)

    def _aggregate_order(self, grp: pd.DataFrame) -> dict:
        """Reduce operations for one order into a single dict."""
        row = grp.iloc[0]
        total_planned = float(grp["VGW01"].sum())
        total_actual = float(grp["ISM01"].sum())
        overrun_fraction = (total_actual - total_planned) / total_planned if total_planned > 0 else 0
        delay_score = round(min(max(overrun_fraction, 0), DELAY_SCORE_CAP), 4)

        total_yield = float(grp["GMNGA"].sum())
        total_scrap = float(grp["XMNGA"].sum())
        total_prod = total_yield + total_scrap
        efficiency_score = round(total_yield / total_prod, 4) if total_prod > 0 else 1.0
        scrap_rate = round(total_scrap / total_prod, 4) if total_prod > 0 else 0.0

        bottleneck_row = grp.loc[grp["time_ratio"].idxmax()]
        bottleneck_op = bottleneck_row.get("VORNR", "")
        bottleneck_wc = bottleneck_row.get("ARBPL", "")
        bottleneck_tr = round(float(bottleneck_row.get("time_ratio", 1)), 2)

        try:
            start = pd.to_datetime(row["GSTRP"])
            end = pd.to_datetime(row["GLTRP"])
            planned_days = (end - start).days
        except Exception:
            planned_days = 0

        ops_breakdown = []
        for _, op_row in grp.sort_values("VORNR").iterrows():
            ops_breakdown.append({
                "operation": str(op_row["VORNR"]),
                "work_center": str(op_row.get("ARBPL", "")),
                "planned_hrs": round(float(op_row["VGW01"]), 2),
                "actual_hrs": round(float(op_row["ISM01"]), 2),
                "time_ratio": round(float(op_row["time_ratio"]), 3),
                "time_delta_hrs": round(float(op_row["time_delta_hrs"]), 3),
                "yield_qty": int(op_row["GMNGA"]),
                "scrap_qty": int(op_row["XMNGA"]),
                "op_efficiency": round(float(op_row["op_efficiency"]), 4),
                "is_delayed": bool(op_row["is_delayed_op"]),
            })

        return {
            "order_id": str(row["AUFNR"]),
            "material": str(row["MATNR"]),
            "plant": str(row["WERKS"]),
            "planned_quantity": int(row["PSMNG"]),
            "total_planned_hrs": round(total_planned, 2),
            "total_actual_hrs": round(total_actual, 2),
            "production_delay_score": delay_score,
            "efficiency_score": efficiency_score,
            "scrap_rate": scrap_rate,
            "bottleneck_operation": bottleneck_op,
            "bottleneck_work_center": bottleneck_wc,
            "bottleneck_time_ratio": bottleneck_tr,
            "planned_start": str(row["GSTRP"]),
            "planned_end": str(row["GLTRP"]),
            "planned_days": planned_days,
            "operations_breakdown": ops_breakdown,
        }

    @staticmethod
    def _classify_status(delay_score: float, efficiency_score: float) -> str:
        if delay_score >= DELAY_CRITICAL_RATIO:
            return "DELAYED"
        if delay_score >= DELAY_AT_RISK_RATIO:
            return "AT_RISK"
        if efficiency_score < EFFICIENCY_LOW:
            return "LOW_EFFICIENCY"
        return "ON_TRACK"

    @staticmethod
    def _build_reason(status, delay_score, efficiency_score, scrap_rate,
                      bottleneck_op, bottleneck_wc, bottleneck_tr,
                      total_planned, total_actual) -> str:
        parts = []
        if status in ("DELAYED", "AT_RISK"):
            overrun_hrs = round(total_actual - total_planned, 1)
            parts.append(
                f"Operation {bottleneck_op} ({bottleneck_wc}) ran at "
                f"{bottleneck_tr}x planned time, contributing {overrun_hrs:+.1f}h overrun"
            )
        if scrap_rate > 0.10:
            parts.append(
                f"High scrap rate: {scrap_rate:.1%} of output rejected "
                f"(efficiency {efficiency_score:.1%})"
            )
        if efficiency_score < EFFICIENCY_LOW:
            parts.append(f"Overall efficiency {efficiency_score:.1%} below {EFFICIENCY_LOW:.0%} threshold")
        if not parts:
            parts.append("Production on track")
        return "; ".join(parts)

    def run(self) -> list[dict[str, Any]]:
        """Execute the full pipeline and return order insight dicts."""
        self.engineer_features()
        results = []
        ts = datetime.now(timezone.utc).isoformat()
        for order_id, grp in self._ops_df.groupby("AUFNR"):
            data = self._aggregate_order(grp)
            status = self._classify_status(data["production_delay_score"], data["efficiency_score"])
            reason = self._build_reason(
                status, data["production_delay_score"], data["efficiency_score"],
                data["scrap_rate"], data["bottleneck_operation"],
                data["bottleneck_work_center"], data["bottleneck_time_ratio"],
                data["total_planned_hrs"], data["total_actual_hrs"],
            )
            data["status"] = status
            data["reason"] = reason
            data["agent"] = "ProductionAgent"
            data["timestamp"] = ts
            results.append(data)
        return sorted(results, key=lambda r: r["production_delay_score"], reverse=True)

    def run_for_order(self, order_id: str) -> dict:
        for result in self.run():
            if result["order_id"] == order_id:
                return result
        raise ValueError(f"Order '{order_id}' not found in AFKO table.")

    def run_json(self, indent: int = 2) -> str:
        return json.dumps(self.run(), indent=indent, default=str)


if __name__ == "__main__":
    import os, sys
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
    from data.production_sample_data import generate_all

    tables = generate_all(seed=42)
    for name, df in tables.items():
        print(f"  {name} : {len(df)} rows")

    agent = ProductionAgent()
    agent.load_data(tables["AFKO"], tables["AFPO"], tables["AFVC"],
                    tables["AFRU"], tables["CRHD"])
    results = agent.run()

    print(f"\nProduction Order Insights - {len(results)} orders\n")
    for r in results:
        print(f"[{r['status']:>14}] {r['order_id']}  delay={r['production_delay_score']:.3f}"
              f"  eff={r['efficiency_score']:.3f}  {r['reason'][:60]}")

    with open("production_output.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, default=str)
    print("\nSaved -> production_output.json")
