"""
logistics_agent.py - EAIOS Logistics Intelligence Worker Agent
==============================================================
Analyses shipment data, detects delays, computes route risk scores,
and returns structured insights for the Master Agent.
"""
import json
import warnings
from datetime import datetime, timezone
from typing import Any

import numpy as np
import pandas as pd

warnings.filterwarnings("ignore")

DELAY_CRITICAL: int = 7
DELAY_HIGH: int = 3
DELAY_AT_RISK: int = 1
ROUTE_RISK_WEIGHT: dict[str, float] = {
    "LOW": 0.05, "MEDIUM": 0.15, "HIGH": 0.30, "CRITICAL": 0.50,
}
DELAY_SCORE_CAP_DAYS: int = 14


class LogisticsAgent:

    def __init__(self):
        self.shipments = pd.DataFrame()
        self.routes = pd.DataFrame()
        self._merged = pd.DataFrame()

    def load_data(self, shipments, routes):
        self.shipments = shipments.copy()
        self.routes = routes.copy()

    def _merge_and_compute(self):
        df = self.shipments.merge(
            self.routes[["route_id", "origin", "destination", "distance_km",
                         "risk_level", "transport_mode", "avg_transit_days"]],
            on="route_id", how="left",
        )
        df["planned_delivery_date"] = pd.to_datetime(df["planned_delivery_date"])
        df["actual_delivery_date"] = pd.to_datetime(df["actual_delivery_date"])
        df["delivery_delay_days"] = (df["actual_delivery_date"] - df["planned_delivery_date"]).dt.days

        safe_transit = df["avg_transit_days"].fillna(1).astype(int).replace(0, 1)
        df["delay_ratio"] = round(df["delivery_delay_days"] / safe_transit, 4)
        df["is_delayed"] = df["delivery_delay_days"] >= DELAY_AT_RISK
        df["route_risk_weight"] = df["risk_level"].map(ROUTE_RISK_WEIGHT).fillna(0.1)
        return df

    def engineer_features(self):
        self._merged = self._merge_and_compute()

    @staticmethod
    def _compute_risk_score(delay_days, route_risk_weight, shipment_value):
        delay_component = min(max(delay_days, 0) / DELAY_SCORE_CAP_DAYS, 1) * 0.6
        route_component = route_risk_weight * 0.8
        value_uplift = min(shipment_value / 200_000, 1) * 0.1
        return round(float(np.clip(delay_component + route_component + value_uplift, 0, 1)), 4)

    @staticmethod
    def _classify_status(delay_days, route_risk_level):
        rr = str(route_risk_level).upper()
        if delay_days >= DELAY_CRITICAL or (delay_days >= DELAY_HIGH and rr == "CRITICAL"):
            return "CRITICAL"
        if delay_days >= DELAY_HIGH or (delay_days >= DELAY_AT_RISK and rr in ("HIGH", "CRITICAL")):
            return "HIGH_RISK"
        if delay_days >= DELAY_AT_RISK or rr == "CRITICAL":
            return "AT_RISK"
        if rr in ("HIGH", "MEDIUM"):
            return "MONITOR"
        return "LOW_RISK"

    @staticmethod
    def _build_reason(delay_days, route_risk_level, origin, destination,
                      carrier, transport_mode, distance_km):
        parts = []
        rr = str(route_risk_level).upper()
        if delay_days >= DELAY_AT_RISK:
            parts.append(f"Delivery delayed by {delay_days} day(s)")
        elif delay_days < 0:
            parts.append(f"Delivered {abs(delay_days)} day(s) ahead of schedule")
        else:
            parts.append("On-time delivery")
        if rr in ("HIGH", "CRITICAL"):
            parts.append(f"Route {origin} -> {destination} classified as {rr} risk")
        return "; ".join(parts)

    def _build_record(self, row):
        delay_days = int(row["delivery_delay_days"])
        route_risk = str(row.get("risk_level", "MEDIUM"))
        value = float(row.get("shipment_value_usd", 0))

        risk_score = self._compute_risk_score(delay_days, float(row.get("route_risk_weight", 0.1)), value)
        status = self._classify_status(delay_days, route_risk)
        reason = self._build_reason(
            delay_days, route_risk, row.get("origin", ""),
            row.get("destination", ""), row.get("carrier", ""),
            row.get("transport_mode", ""), row.get("distance_km", 0),
        )

        return {
            "entity_id": str(row["shipment_id"]),
            "route_id": str(row["route_id"]),
            "carrier": str(row.get("carrier", "")),
            "product_category": str(row.get("product_category", "")),
            "origin": str(row.get("origin", "")),
            "destination": str(row.get("destination", "")),
            "distance_km": int(row.get("distance_km", 0)),
            "transport_mode": str(row.get("transport_mode", "")),
            "planned_delivery": row["planned_delivery_date"].strftime("%Y-%m-%d"),
            "actual_delivery": row["actual_delivery_date"].strftime("%Y-%m-%d"),
            "delivery_delay_days": delay_days,
            "delay_ratio": round(float(row.get("delay_ratio", 0)), 4),
            "avg_transit_days": int(row.get("avg_transit_days", 0)),
            "shipment_value_usd": round(value, 2),
            "route_risk_level": route_risk,
            "risk_score": risk_score,
            "status": status,
            "reason": reason,
        }

    def run(self):
        self.engineer_features()
        ts = datetime.now(timezone.utc).isoformat()
        results = []
        for _, row in self._merged.iterrows():
            data = self._build_record(row)
            data["agent"] = "LogisticsAgent"
            data["timestamp"] = ts
            results.append(data)
        return sorted(results, key=lambda r: r["risk_score"], reverse=True)

    def run_for_shipment(self, shipment_id):
        for r in self.run():
            if r["entity_id"] == shipment_id:
                return r
        raise ValueError(f"Shipment '{shipment_id}' not found.")

    def run_json(self, indent=2):
        return json.dumps(self.run(), indent=indent, default=str)


if __name__ == "__main__":
    import os, sys
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
    from data.logistics_sample_data import generate_all

    tables = generate_all(seed=42)
    agent = LogisticsAgent()
    agent.load_data(tables["shipment_master"], tables["route_master"])
    results = agent.run()

    print(f"Logistics Intelligence - {len(results)} shipments\n")
    for r in results:
        print(f"[{r['status']:>9}] {r['entity_id']}  risk={r['risk_score']:.3f}"
              f"  delay={r['delivery_delay_days']}d  {r['reason'][:50]}")

    os.makedirs("outputs", exist_ok=True)
    with open("outputs/logistics_output.json", "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, default=str)
    print("\nSaved -> outputs/logistics_output.json")
