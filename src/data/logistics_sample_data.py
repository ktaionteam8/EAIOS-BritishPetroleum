"""
Sample data generator for the EAIOS Logistics Intelligence module.

Produces realistic synthetic shipment and route master DataFrames that
model British Petroleum supply-chain logistics scenarios, including
deliberately delayed and high-value critical shipments.
"""

from __future__ import annotations

import numpy as np
import pandas as pd
from datetime import datetime, timedelta

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

SHIPMENT_IDS: list[str] = [f"S{i}" for i in range(1001, 1021)]  # 20 shipments

ROUTE_IDS: tuple[str, ...] = (
    "R101", "R102", "R103", "R104", "R105", "R106", "R107", "R108",
)

LOCATIONS: tuple[str, ...] = (
    "Aberdeen", "London", "Rotterdam", "Dubai",
    "Houston", "Singapore", "Lagos", "Mumbai",
)

ROUTE_RISK_LEVELS: dict[str, str] = {
    "R101": "LOW",
    "R102": "MEDIUM",
    "R103": "HIGH",
    "R104": "CRITICAL",
    "R105": "LOW",
    "R106": "MEDIUM",
    "R107": "HIGH",
    "R108": "CRITICAL",
}

ROUTE_DISTANCES: dict[str, int] = {
    "R101": 320,
    "R102": 580,
    "R103": 1200,
    "R104": 950,
    "R105": 2400,
    "R106": 3100,
    "R107": 5200,
    "R108": 7800,
}

TRANSPORT_MODES: tuple[str, ...] = ("Truck", "Rail", "Sea", "Air")

CARRIERS: tuple[str, ...] = (
    "BP Logistics", "FastFreight", "GlobalShip", "QuickMove", "SeaLink",
)

# Shipments that are deliberately injected with delivery delays
DELAYED_SHIPMENTS: tuple[str, ...] = (
    "S1001", "S1002", "S1005", "S1008", "S1012", "S1016",
)

# High-value shipments (value > $200k)
CRITICAL_SHIPMENTS: tuple[str, ...] = (
    "S1003", "S1004", "S1009", "S1014", "S1019",
)

# Approximate transport speeds (km/day) used for avg_transit_days
_SPEED_BY_MODE: dict[str, float] = {
    "Truck": 600.0,
    "Rail": 700.0,
    "Sea": 400.0,
    "Air": 800.0,
}


# ---------------------------------------------------------------------------
# Generators
# ---------------------------------------------------------------------------

def generate_route_master(seed: int = 42) -> pd.DataFrame:
    """Generate the route master table (8 routes).

    Each route has a randomly selected origin/destination pair, a fixed
    distance, risk level, transport mode, and an estimated average transit
    time derived from distance / modal speed.

    Returns
    -------
    pd.DataFrame
        Columns: route_id, origin, destination, distance_km, risk_level,
        transport_mode, avg_transit_days.
    """
    rng = np.random.default_rng(seed)
    rows: list[dict] = []

    for rid in ROUTE_IDS:
        # Pick two distinct locations for origin and destination
        pair = rng.choice(list(LOCATIONS), size=2, replace=False)
        origin, destination = str(pair[0]), str(pair[1])

        distance_km = ROUTE_DISTANCES[rid]
        risk_level = ROUTE_RISK_LEVELS[rid]
        transport_mode = str(rng.choice(list(TRANSPORT_MODES)))

        speed = _SPEED_BY_MODE.get(transport_mode, 500.0)
        avg_transit_days = round(distance_km / speed)
        # Ensure minimum of 1 day
        avg_transit_days = max(avg_transit_days, 1)

        rows.append({
            "route_id": rid,
            "origin": origin,
            "destination": destination,
            "distance_km": distance_km,
            "risk_level": risk_level,
            "transport_mode": transport_mode,
            "avg_transit_days": avg_transit_days,
        })

    return pd.DataFrame(rows)


def generate_shipment_master(
    route_master: pd.DataFrame,
    seed: int = 42,
) -> pd.DataFrame:
    """Generate 20 shipment records linked to the route master.

    Parameters
    ----------
    route_master : pd.DataFrame
        The route master table (from ``generate_route_master``).
    seed : int
        Random seed for reproducibility.

    Returns
    -------
    pd.DataFrame
        Columns: shipment_id, route_id, carrier, product_category,
        shipment_value_usd, planned_delivery_date, actual_delivery_date,
        status_flag.
    """
    rng = np.random.default_rng(seed)
    available_routes = route_master["route_id"].tolist()

    product_categories = (
        "Crude Oil", "Refined Fuel", "LNG", "Lubricants", "Chemicals",
    )

    base_date = datetime(2026, 2, 1)
    rows: list[dict] = []

    for sid in SHIPMENT_IDS:
        route_id = str(rng.choice(available_routes))
        carrier = str(rng.choice(list(CARRIERS)))
        category = str(rng.choice(list(product_categories)))

        # Shipment value
        if sid in CRITICAL_SHIPMENTS:
            value = int(rng.integers(250_000, 500_001))
        else:
            value = int(rng.integers(10_000, 200_001))

        # Planned delivery: 10-60 days from base date
        planned_offset = int(rng.integers(10, 61))
        planned_date = base_date + timedelta(days=planned_offset)

        # Actual delivery: delayed shipments get extra days
        if sid in DELAYED_SHIPMENTS:
            if sid in CRITICAL_SHIPMENTS:
                delay_days = int(rng.integers(8, 19))   # 8-18 day delay
            else:
                delay_days = int(rng.integers(3, 8))    # 3-7 day delay
            actual_date = planned_date + timedelta(days=delay_days)
            status_flag = "LATE"
        else:
            # On-time or slightly early (-2 to +0 days)
            offset = int(rng.integers(-2, 1))
            actual_date = planned_date + timedelta(days=offset)
            status_flag = "ON_TIME"

        rows.append({
            "shipment_id": sid,
            "route_id": route_id,
            "carrier": carrier,
            "product_category": category,
            "shipment_value_usd": value,
            "planned_delivery_date": planned_date.strftime("%Y-%m-%d"),
            "actual_delivery_date": actual_date.strftime("%Y-%m-%d"),
            "status_flag": status_flag,
        })

    return pd.DataFrame(rows)


def generate_all(seed: int = 42) -> dict[str, pd.DataFrame]:
    """Generate a complete set of logistics sample data.

    Returns
    -------
    dict[str, pd.DataFrame]
        Dictionary with keys ``route_master`` and ``shipment_master``
        mapping to their respective DataFrames.
    """
    route_master = generate_route_master(seed)
    shipment_master = generate_shipment_master(route_master, seed)
    return {
        "route_master": route_master,
        "shipment_master": shipment_master,
    }


# ---------------------------------------------------------------------------
# CLI entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    data = generate_all()
    for name, df in data.items():
        print(f"\n{'=' * 60}")
        print(f"  {name}  ({len(df)} rows)")
        print(f"{'=' * 60}")
        print(df.head(10).to_string(index=False))
