"""
demand_agent.py - EAIOS Demand Intelligence Worker Agent
=========================================================
Analyses demand forecast vs actuals, detects spikes/drops/volatility,
computes risk scores, and returns structured insights for the Master Agent.
"""
import json
import warnings
from datetime import datetime, timezone
from typing import Any

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

SPIKE_THRESHOLD: float = 0.25
DROP_THRESHOLD: float = -0.25
VOLATILE_CV_THRESH: float = 0.30
RISK_HIGH: float = 0.40
RISK_AT_RISK: float = 0.20
RISK_MONITOR: float = 0.10


class DemandAgent:

    def __init__(self):
        self.customers = pd.DataFrame()
        self.demand_plan = pd.DataFrame()
        self.unified_order = pd.DataFrame()
        self.product_master = pd.DataFrame()
        self._period_df = pd.DataFrame()

    def load_data(self, customers, demand_plan, unified_order, product_master):
        self.customers = customers.copy()
        self.demand_plan = demand_plan.copy()
        self.unified_order = unified_order.copy()
        self.product_master = product_master.copy()

    def _aggregate_actuals(self):
        orders = self.unified_order.copy()
        orders["order_date"] = pd.to_datetime(orders["order_date"])
        orders["period"] = orders["order_date"].dt.to_period("M").dt.start_time.dt.strftime("%Y-%m-01")
        return (orders.groupby(["product_id", "period"])["quantity"]
                .sum().reset_index()
                .rename(columns={"quantity": "actual_quantity"}))

    def _build_period_comparison(self):
        plan = self.demand_plan.rename(columns={"forecast_date": "period"})
        actuals = self._aggregate_actuals()
        merged = plan.merge(actuals, on=["product_id", "period"], how="left")
        merged["actual_quantity"] = merged["actual_quantity"].fillna(0).astype(int)
        safe_forecast = merged["forecast_quantity"].replace(0, np.nan)
        merged["demand_variance"] = merged["actual_quantity"] - merged["forecast_quantity"]
        merged["demand_variance_pct"] = round(merged["demand_variance"] / safe_forecast, 4)
        merged["over_forecast"] = merged["demand_variance_pct"] >= SPIKE_THRESHOLD
        merged["under_forecast"] = merged["demand_variance_pct"] <= DROP_THRESHOLD
        return merged.sort_values(["product_id", "period"])

    def engineer_features(self):
        self._period_df = self._build_period_comparison()

    @staticmethod
    def _compute_volatility(variance_pcts):
        if len(variance_pcts) < 2:
            return False, 0.0
        cv = float(variance_pcts.std() / (abs(variance_pcts.mean()) + 1e-9))
        return cv >= VOLATILE_CV_THRESH, round(cv, 4)

    @staticmethod
    def _compute_risk_score(avg_variance_pct, spike_detected, drop_detected,
                            volatile, spike_periods, drop_periods, total_periods):
        magnitude = min(abs(avg_variance_pct) / RISK_HIGH, 1) * 0.5
        breach_freq = (spike_periods + drop_periods) / max(total_periods, 1)
        frequency = breach_freq * 0.3
        vol_score = 0.2 if volatile else 0
        return round(min(magnitude + frequency + vol_score, 1.0), 4)

    @staticmethod
    def _classify_status(avg_variance_pct, spike_detected, drop_detected, volatile):
        abs_var = abs(avg_variance_pct)
        if abs_var >= RISK_HIGH or ((spike_detected or drop_detected) and abs_var >= RISK_AT_RISK):
            return "HIGH_RISK"
        if abs_var >= RISK_AT_RISK or volatile:
            return "AT_RISK"
        if abs_var >= RISK_MONITOR:
            return "MONITOR"
        return "LOW_RISK"

    @staticmethod
    def _build_reason(product_id, avg_variance_pct, spike_detected, drop_detected,
                      volatile, spike_periods, drop_periods, total_periods):
        parts = []
        pct = avg_variance_pct * 100
        if spike_detected:
            parts.append(f"Demand exceeded forecast by avg {pct:+.1f}% "
                         f"({spike_periods} periods above threshold)")
        if drop_detected:
            parts.append(f"Demand fell below forecast by avg {pct:+.1f}% "
                         f"({drop_periods} periods below threshold)")
        if volatile:
            parts.append("High demand volatility - inconsistent order patterns across periods")
        if not parts:
            parts.append(f"Demand tracking forecast closely (avg variance {pct:+.1f}%)")
        return "; ".join(parts)

    def _aggregate_product(self, product_id, grp):
        pm_row = self.product_master[self.product_master["product_id"] == str(product_id)]
        product_name = str(pm_row.iloc[0]["product_name"]) if not pm_row.empty else "Unknown"
        product_type = str(pm_row.iloc[0]["product_type"]) if not pm_row.empty else "Unknown"

        total_actual = int(grp["actual_quantity"].sum())
        total_forecast = int(grp["forecast_quantity"].sum())
        n_periods = len(grp)
        avg_actual = round(total_actual / max(n_periods, 1), 2)
        avg_forecast = round(total_forecast / max(n_periods, 1), 2)
        avg_var_pct = round(float(grp["demand_variance_pct"].mean()), 4)

        spike_periods = int(grp["over_forecast"].sum())
        drop_periods = int(grp["under_forecast"].sum())
        spike_detected = spike_periods > 0
        drop_detected = drop_periods > 0
        volatile, cv = self._compute_volatility(grp["demand_variance_pct"])

        risk_score = self._compute_risk_score(
            avg_var_pct, spike_detected, drop_detected,
            volatile, spike_periods, drop_periods, n_periods,
        )
        status = self._classify_status(avg_var_pct, spike_detected, drop_detected, volatile)
        reason = self._build_reason(
            product_id, avg_var_pct, spike_detected, drop_detected,
            volatile, spike_periods, drop_periods, n_periods,
        )

        period_breakdown = []
        for _, row in grp.sort_values("period").iterrows():
            period_breakdown.append({
                "period": row["period"],
                "forecast_qty": int(row["forecast_quantity"]),
                "actual_qty": int(row["actual_quantity"]),
                "demand_variance": int(row["demand_variance"]),
                "variance_pct": round(float(row["demand_variance_pct"]), 4) * 100,
                "spike": bool(row["over_forecast"]),
                "drop": bool(row["under_forecast"]),
            })

        return {
            "entity_id": str(product_id),
            "product_name": product_name,
            "product_type": product_type,
            "total_actual": total_actual,
            "total_forecast": total_forecast,
            "avg_actual_per_period": avg_actual,
            "avg_forecast_per_period": avg_forecast,
            "avg_variance_pct": round(avg_var_pct * 100, 2),
            "risk_score": risk_score,
            "status": status,
            "reason": reason,
            "spike_detected": spike_detected,
            "drop_detected": drop_detected,
            "volatile": volatile,
            "volatility_cv": cv,
            "spike_periods": spike_periods,
            "drop_periods": drop_periods,
            "periods_analyzed": n_periods,
            "period_breakdown": period_breakdown,
        }

    def run(self):
        self.engineer_features()
        ts = datetime.now(timezone.utc).isoformat()
        results = []
        for product_id, grp in self._period_df.groupby("product_id"):
            data = self._aggregate_product(str(product_id), grp)
            data["agent"] = "DemandAgent"
            data["timestamp"] = ts
            results.append(data)
        return sorted(results, key=lambda r: r["risk_score"], reverse=True)

    def run_for_product(self, product_id):
        for r in self.run():
            if r["entity_id"] == product_id:
                return r
        raise ValueError(f"Product '{product_id}' not found.")

    def run_json(self, indent=2):
        return json.dumps(self.run(), indent=indent, default=str)


if __name__ == "__main__":
    import os, sys
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
    from data.demand_sample_data import generate_all

    tables = generate_all(seed=42)
    agent = DemandAgent()
    agent.load_data(**tables)
    results = agent.run()

    print(f"Demand Intelligence - {len(results)} products\n")
    for r in results:
        print(f"[{r['status']:>9}] {r['entity_id']}  risk={r['risk_score']:.3f}  {r['reason'][:55]}")

    os.makedirs("outputs", exist_ok=True)
    with open("outputs/demand_output.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, default=str)
    print("\nSaved -> outputs/demand_output.json")
