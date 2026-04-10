"""
inventory_agent.py - EAIOS Inventory Intelligence Worker Agent
==============================================================
Analyses inventory levels vs requirements, detects shortages/overstock,
computes risk scores and returns structured insights.
"""
import json
import warnings
from datetime import datetime, timezone
from typing import Any

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

SHORTAGE_RATIO: float = 0.80
OVERSTOCK_RATIO: float = 3.0
MONITOR_RATIO: float = 1.2
CRITICAL_COVERAGE: float = 0.30
HIGH_RISK_COVERAGE: float = 0.70
AT_RISK_COVERAGE: float = 1.0


class InventoryAgent:

    def __init__(self):
        self.inventory = pd.DataFrame()
        self.requirements = pd.DataFrame()
        self._merged = pd.DataFrame()

    def load_data(self, inventory, requirements):
        self.inventory = inventory.copy()
        self.requirements = requirements.copy()

    def _merge_and_compute(self):
        df = self.inventory.merge(
            self.requirements[["product_id", "required_quantity", "planning_horizon", "priority"]],
            on="product_id", how="left",
        )
        df["required_quantity"] = df["required_quantity"].fillna(0).astype(int)
        df["stock_gap"] = df["current_stock"] - df["required_quantity"]
        df["safety_buffer"] = df["current_stock"] - df["safety_stock"]

        safe_req = df["required_quantity"].replace(0, np.nan)
        df["coverage_ratio"] = round(df["current_stock"] / safe_req, 4)

        safe_sfty = df["safety_stock"].replace(0, np.nan)
        df["overstock_ratio"] = round(df["current_stock"] / safe_sfty, 4)
        df["inventory_value"] = round(df["current_stock"] * df["unit_cost"], 2)

        def _condition(row):
            if row["current_stock"] <= 0:
                return "STOCKOUT"
            if row.get("coverage_ratio", 1) < SHORTAGE_RATIO:
                return "SHORTAGE"
            if row.get("overstock_ratio", 1) > OVERSTOCK_RATIO:
                return "OVERSTOCK"
            return "BALANCED"

        df["condition"] = df.apply(_condition, axis=1)
        return df

    def engineer_features(self):
        self._merged = self._merge_and_compute()

    @staticmethod
    def _compute_risk_score(coverage_ratio, overstock_ratio, safety_buffer, condition, priority):
        pw_map = {"CRITICAL": 1.0, "HIGH": 0.85, "MEDIUM": 0.70, "LOW": 0.55}
        pw = pw_map.get(str(priority).upper(), 0.7)
        if condition in ("STOCKOUT", "SHORTAGE"):
            score = 1 - min(coverage_ratio, 1)
            if safety_buffer < 0:
                safety_penalty = min(abs(safety_buffer) / 8.0, 0.6)
                score += safety_penalty * 0.3
        elif condition == "OVERSTOCK":
            score = min((overstock_ratio - 1) / 8.0, 0.6)
        else:
            score = max(0, 1 - coverage_ratio) * 0.2
        score *= pw
        return round(float(np.clip(score, 0, 1)), 4)

    @staticmethod
    def _classify_status(coverage_ratio, overstock_ratio, condition, priority):
        if condition == "STOCKOUT" or (str(priority).upper() == "CRITICAL" and coverage_ratio < CRITICAL_COVERAGE):
            return "CRITICAL"
        if coverage_ratio < HIGH_RISK_COVERAGE or (condition == "SHORTAGE" and str(priority).upper() in ("CRITICAL", "HIGH")):
            return "HIGH_RISK"
        if coverage_ratio < AT_RISK_COVERAGE:
            return "AT_RISK"
        if condition == "OVERSTOCK" or overstock_ratio > MONITOR_RATIO:
            return "MONITOR"
        return "LOW_RISK"

    @staticmethod
    def _build_reason(condition, current_stock, safety_stock, required_quantity,
                      coverage_ratio, overstock_ratio, stock_gap, priority):
        parts = []
        if condition == "STOCKOUT":
            parts.append(f"Stock ({current_stock}) cannot meet requirement ({required_quantity}); "
                         f"gap of {abs(stock_gap)} units")
        elif condition == "SHORTAGE":
            parts.append(f"Stock ({current_stock}) below safety threshold ({safety_stock}); "
                         f"gap of {abs(stock_gap)} units")
        elif condition == "OVERSTOCK":
            excess = current_stock - safety_stock
            parts.append(f"Excess inventory: {excess} units above safety stock "
                         f"(overstock ratio {overstock_ratio:.1f}x)")
        if str(priority).upper() in ("CRITICAL", "HIGH") and condition not in ("BALANCED",):
            parts.append(f"{priority} priority item requires immediate attention")
        if not parts:
            parts.append(f"Inventory balanced; coverage {coverage_ratio:.1%}")
        return "; ".join(parts)

    def _build_record(self, row):
        condition = str(row.get("condition", "BALANCED"))
        current_stock = int(row["current_stock"])
        safety_stock = int(row["safety_stock"])
        required_qty = int(row["required_quantity"])
        coverage_ratio = round(float(row.get("coverage_ratio", 1)), 4)
        over_ratio = round(float(row.get("overstock_ratio", 1)), 4)
        stock_gap = int(row.get("stock_gap", 0))
        priority = str(row.get("priority", "MEDIUM"))

        risk_score = self._compute_risk_score(coverage_ratio, over_ratio,
                                              current_stock - safety_stock, condition, priority)
        status = self._classify_status(coverage_ratio, over_ratio, condition, priority)
        reason = self._build_reason(condition, current_stock, safety_stock,
                                    required_qty, coverage_ratio, over_ratio, stock_gap, priority)

        return {
            "entity_id": str(row["product_id"]),
            "product_type": str(row.get("product_type", "")),
            "current_stock": current_stock,
            "safety_stock": safety_stock,
            "required_quantity": required_qty,
            "coverage_ratio": coverage_ratio,
            "overstock_ratio": over_ratio,
            "stock_gap": stock_gap,
            "condition": condition,
            "risk_score": risk_score,
            "status": status,
            "reason": reason,
            "priority": priority,
            "planning_horizon_days": int(row.get("planning_horizon", 30)),
            "inventory_value": round(float(row.get("inventory_value", 0)), 2),
        }

    def run(self):
        self.engineer_features()
        ts = datetime.now(timezone.utc).isoformat()
        results = []
        for _, row in self._merged.iterrows():
            data = self._build_record(row)
            data["agent"] = "InventoryAgent"
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
    from data.inventory_sample_data import generate_all

    tables = generate_all(seed=42)
    agent = InventoryAgent()
    agent.load_data(tables["inventory_decision"], tables["material_requirement"])
    results = agent.run()

    print(f"Inventory Intelligence - {len(results)} products\n")
    for r in results:
        print(f"[{r['status']:>9}] {r['entity_id']}  risk={r['risk_score']:.3f}  {r['reason'][:55]}")

    os.makedirs("outputs", exist_ok=True)
    with open("outputs/inventory_output.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, default=str)
    print("\nSaved -> outputs/inventory_output.json")
