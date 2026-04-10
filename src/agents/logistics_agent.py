"""
logistics_agent.py - EAIOS Logistics Intelligence Worker Agent

Analyses shipment and route data to identify delivery delays, compute
risk scores, classify shipment health, and produce per-shipment
assessments with human-readable explanations.
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
DELAY_CRITICAL = 7          # days late -> CRITICAL status
DELAY_HIGH = 3              # days late -> HIGH_RISK status
DELAY_AT_RISK = 1           # days late -> AT_RISK status

ROUTE_RISK_WEIGHT: dict[str, float] = {
    "LOW": 0.05,
    "MEDIUM": 0.15,
    "HIGH": 0.30,
    "CRITICAL": 0.50,
}

DELAY_SCORE_CAP_DAYS = 14   # max days used in risk-score normalisation


class LogisticsAgent:
    """Evaluate shipment health from logistics and route data.

    Workflow
    --------
    1. ``load_data``           -- ingest shipment and route master tables.
    2. ``engineer_features``   -- merge and compute delivery metrics.
    3. ``run``                 -- classify each shipment, build explanations,
                                  and return sorted results.
    """

    def __init__(self) -> None:
        self.shipments: pd.DataFrame = pd.DataFrame()
        self.routes: pd.DataFrame = pd.DataFrame()
        self._merged: pd.DataFrame = pd.DataFrame()

    # ------------------------------------------------------------------
    # Data loading
    # ------------------------------------------------------------------

    def load_data(
        self,
        shipments: pd.DataFrame,
        routes: pd.DataFrame,
    ) -> None:
        """Store copies of the shipment and route input tables.

        Parameters
        ----------
        shipments : DataFrame
            Shipment-level data with columns: shipment_id, route_id,
            carrier, product_category, shipment_value_usd,
            planned_delivery_date, actual_delivery_date, status_flag.
        routes : DataFrame
            Route master data with columns: route_id, origin, destination,
            distance_km, risk_level, transport_mode, avg_transit_days.
        """
        self.shipments = shipments.copy()
        self.routes = routes.copy()

    # ------------------------------------------------------------------
    # Merge & feature engineering
    # ------------------------------------------------------------------

    def _merge_and_compute(self) -> pd.DataFrame:
        """Join shipments with routes and compute delivery metrics.

        New columns
        -----------
        delivery_delay_days : (actual - planned) in calendar days
        delay_ratio         : delay_days / avg_transit_days
        is_delayed          : True when delay >= DELAY_AT_RISK
        route_risk_weight   : numeric weight derived from risk_level
        """
        route_cols = [
            "route_id", "origin", "destination", "distance_km",
            "risk_level", "transport_mode", "avg_transit_days",
        ]
        df = self.shipments.merge(
            self.routes[route_cols],
            on="route_id",
            how="left",
        )

        # Ensure date columns are datetime
        df["planned_delivery_date"] = pd.to_datetime(
            df["planned_delivery_date"], errors="coerce",
        )
        df["actual_delivery_date"] = pd.to_datetime(
            df["actual_delivery_date"], errors="coerce",
        )

        df["delivery_delay_days"] = (
            df["actual_delivery_date"] - df["planned_delivery_date"]
        ).dt.days

        df["avg_transit_days"] = pd.to_numeric(
            df["avg_transit_days"], errors="coerce",
        ).fillna(0)

        df["delay_ratio"] = np.where(
            df["avg_transit_days"] > 0,
            (df["delivery_delay_days"] / df["avg_transit_days"]).round(4),
            0.0,
        )

        df["is_delayed"] = df["delivery_delay_days"] >= DELAY_AT_RISK

        df["route_risk_weight"] = (
            df["risk_level"]
            .str.upper()
            .map(ROUTE_RISK_WEIGHT)
            .fillna(0.1)
        )

        return df

    def engineer_features(self) -> None:
        """Merge tables and compute shipment-level metrics (in-place)."""
        self._merged = self._merge_and_compute()

    # ------------------------------------------------------------------
    # Scoring & classification helpers
    # ------------------------------------------------------------------

    @staticmethod
    def _compute_risk_score(
        delay_days: float,
        route_risk_weight: float,
        shipment_value: float,
    ) -> float:
        """Compute a composite risk score in [0, 1].

        Components
        ----------
        delay_component  : normalised delay (60 % weight)
        route_component  : route risk weight (max 0.50 * 0.80 = 0.40)
        value_uplift     : high-value shipment uplift (10 % weight)

        Returns
        -------
        float
            Risk score clipped to [0, 1], rounded to 4 decimal places.
        """
        delay_component = min(max(delay_days, 0) / DELAY_SCORE_CAP_DAYS, 1.0) * 0.6
        route_component = route_risk_weight * 0.8
        value_uplift = min(shipment_value / 200_000, 1.0) * 0.1

        raw = delay_component + route_component + value_uplift
        return round(float(np.clip(raw, 0.0, 1.0)), 4)

    @staticmethod
    def _classify_status(delay_days: float, route_risk_level: str) -> str:
        """Classify the shipment into a status bucket.

        Categories
        ----------
        CRITICAL   : delay >= DELAY_CRITICAL, or delay >= DELAY_HIGH with
                     CRITICAL route risk.
        HIGH_RISK  : delay >= DELAY_HIGH, or delay >= DELAY_AT_RISK with
                     HIGH / CRITICAL route risk.
        AT_RISK    : delay >= DELAY_AT_RISK, or CRITICAL route risk.
        MONITOR    : route risk is HIGH or MEDIUM.
        LOW_RISK   : everything within thresholds.
        """
        rr = str(route_risk_level).upper()

        if delay_days >= DELAY_CRITICAL or (
            delay_days >= DELAY_HIGH and rr == "CRITICAL"
        ):
            return "CRITICAL"

        if delay_days >= DELAY_HIGH or (
            delay_days >= DELAY_AT_RISK and rr in ("HIGH", "CRITICAL")
        ):
            return "HIGH_RISK"

        if delay_days >= DELAY_AT_RISK or rr == "CRITICAL":
            return "AT_RISK"

        if rr in ("HIGH", "MEDIUM"):
            return "MONITOR"

        return "LOW_RISK"

    @staticmethod
    def _build_reason(
        delay_days: float,
        route_risk_level: str,
        origin: str,
        destination: str,
        carrier: str,
        transport_mode: str,
        distance_km: float,
    ) -> str:
        """Build a human-readable explanation for the shipment status.

        Parameters
        ----------
        delay_days : float
            Number of calendar days the shipment is late (negative = early).
        route_risk_level, origin, destination, carrier,
        transport_mode, distance_km : mixed
            Context fields used to enrich the explanation text.

        Returns
        -------
        str
            Multi-sentence explanation string.
        """
        parts: list[str] = []

        if delay_days > 0:
            parts.append(f"Delivery delayed by {int(delay_days)} day(s).")
        elif delay_days < 0:
            parts.append(
                f"Delivered {abs(int(delay_days))} day(s) ahead of schedule."
            )
        else:
            parts.append("On-time delivery.")

        rr = str(route_risk_level).upper()
        if rr in ("HIGH", "CRITICAL"):
            parts.append(
                f"Route {origin} -> {destination} classified as {rr} risk."
            )

        return " ".join(parts)

    # ------------------------------------------------------------------
    # Record builder
    # ------------------------------------------------------------------

    def _build_record(self, row: pd.Series) -> dict[str, Any]:
        """Convert a single merged row into an insight dictionary.

        Returns
        -------
        dict
            Flat dictionary containing all relevant shipment fields,
            the computed risk_score, classified status, and reason.
        """
        delay_days = float(row.get("delivery_delay_days", 0) or 0)
        route_risk_weight = float(row.get("route_risk_weight", 0.1) or 0.1)
        shipment_value = float(row.get("shipment_value_usd", 0) or 0)
        route_risk_level = str(row.get("risk_level", "LOW"))

        risk_score = self._compute_risk_score(
            delay_days, route_risk_weight, shipment_value,
        )
        status = self._classify_status(delay_days, route_risk_level)
        reason = self._build_reason(
            delay_days,
            route_risk_level,
            str(row.get("origin", "")),
            str(row.get("destination", "")),
            str(row.get("carrier", "")),
            str(row.get("transport_mode", "")),
            float(row.get("distance_km", 0) or 0),
        )

        return {
            "entity_id": str(row["shipment_id"]),
            "route_id": str(row["route_id"]),
            "carrier": str(row.get("carrier", "")),
            "product_category": str(row.get("product_category", "")),
            "origin": str(row.get("origin", "")),
            "destination": str(row.get("destination", "")),
            "distance_km": float(row.get("distance_km", 0) or 0),
            "transport_mode": str(row.get("transport_mode", "")),
            "planned_delivery": str(row.get("planned_delivery_date", "")),
            "actual_delivery": str(row.get("actual_delivery_date", "")),
            "delivery_delay_days": delay_days,
            "delay_ratio": float(row.get("delay_ratio", 0) or 0),
            "avg_transit_days": float(row.get("avg_transit_days", 0) or 0),
            "shipment_value_usd": shipment_value,
            "route_risk_level": route_risk_level,
            "risk_score": risk_score,
            "status": status,
            "reason": reason,
        }

    # ------------------------------------------------------------------
    # Public run methods
    # ------------------------------------------------------------------

    def run(self) -> list[dict[str, Any]]:
        """Execute the full logistics analysis pipeline.

        Returns
        -------
        list[dict]
            One dict per shipment, sorted by risk_score descending.
            Each dict includes classification, reasoning, and key metrics.
        """
        self.engineer_features()

        results: list[dict[str, Any]] = []
        for _, row in self._merged.iterrows():
            record = self._build_record(row)
            record["agent"] = "LogisticsAgent"
            record["timestamp"] = datetime.now(timezone.utc).isoformat()
            results.append(record)

        # Sort by risk_score descending (worst first)
        results.sort(key=lambda r: r["risk_score"], reverse=True)
        return results

    def run_for_shipment(self, shipment_id: str) -> dict[str, Any]:
        """Run the pipeline and return the result for a single shipment.

        Parameters
        ----------
        shipment_id : str
            The shipment identifier to retrieve.

        Raises
        ------
        ValueError
            If the shipment is not found in the dataset.
        """
        all_results = self.run()
        for r in all_results:
            if r["entity_id"] == shipment_id:
                return r
        raise ValueError(
            f"Shipment '{shipment_id}' not found. "
            f"Available shipments: {[r['entity_id'] for r in all_results]}"
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
    sys.path.insert(
        0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")),
    )

    from src.data.logistics_sample_data import generate_all

    print("Generating sample logistics data (seed=42) ...")
    data = generate_all(seed=42)

    agent = LogisticsAgent()
    agent.load_data(
        shipments=data["shipment_master"],
        routes=data["route_master"],
    )

    results = agent.run()

    # Console summary
    print(f"\n{'=' * 72}")
    print(f"  Logistics Agent  --  {len(results)} shipments analysed")
    print(f"{'=' * 72}")

    for r in results:
        print(
            f"  {r['entity_id']:>6s}  |  {r['status']:<12s}  |  "
            f"risk={r['risk_score']:.4f}  "
            f"delay={r['delivery_delay_days']:.0f}d  "
            f"value=${r['shipment_value_usd']:,.0f}"
        )

    print(f"{'=' * 72}\n")

    # Persist to JSON
    output_path = os.path.join(
        os.path.dirname(__file__), "..", "..", "outputs", "logistics_output.json",
    )
    output_path = os.path.normpath(output_path)
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "w", encoding="utf-8") as fh:
        json.dump(results, fh, indent=2, default=str)

    print(f"Results saved to {output_path}")
