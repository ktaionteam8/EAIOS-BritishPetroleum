"""logistics_sample_data.py - EAIOS Logistics Agent Sample Data"""
import random
from datetime import date, timedelta

import numpy as np
import pandas as pd

SHIPMENT_IDS = [f"S{i}" for i in range(1001, 1021)]
ROUTE_IDS = ("R101", "R102", "R103", "R104", "R105", "R106", "R107", "R108")
LOCATIONS = ("Aberdeen", "London", "Rotterdam", "Dubai", "Houston", "Singapore", "Lagos", "Mumbai")

ROUTE_RISK_LEVELS = {
    "R101": "LOW", "R102": "MEDIUM", "R103": "HIGH", "R104": "CRITICAL",
    "R105": "LOW", "R106": "MEDIUM", "R107": "HIGH", "R108": "CRITICAL",
}
ROUTE_DISTANCES = {
    "R101": 320, "R102": 580, "R103": 1200, "R104": 950,
    "R105": 2400, "R106": 3100, "R107": 5200, "R108": 7800,
}
TRANSPORT_MODES = ("Truck", "Rail", "Sea", "Air")
CARRIERS = ("BP Logistics", "FastFreight", "GlobalShip", "QuickMove", "SeaLink")
DELAYED_SHIPMENTS = ("S1001", "S1002", "S1005", "S1008", "S1012")
CRITICAL_SHIPMENTS = ("S1004", "S1010", "S1015")


def generate_route_master():
    random.seed(42)
    locations = list(LOCATIONS)
    records = []
    speed_map = {"Air": 800, "Sea": 400, "Truck": 600, "Rail": 700}
    for route_id in ROUTE_IDS:
        origin, destination = random.sample(locations, 2)
        dist = ROUTE_DISTANCES[route_id]
        risk = ROUTE_RISK_LEVELS[route_id]
        mode = random.choice(TRANSPORT_MODES)
        transit = max(1, round(dist / speed_map[mode]))
        records.append({
            "route_id": route_id, "origin": origin, "destination": destination,
            "distance_km": dist, "risk_level": risk, "transport_mode": mode,
            "avg_transit_days": transit,
        })
    return pd.DataFrame(records)


def generate_shipment_master(route_master, seed=42):
    random.seed(seed)
    np.random.seed(seed)
    route_dict = route_master.set_index("route_id").to_dict("index")
    route_ids = list(route_dict.keys())
    today = date.today()
    base_date = today - timedelta(days=60)
    records = []
    for sid in SHIPMENT_IDS:
        route_id = random.choice(route_ids)
        route_info = route_dict[route_id]
        transit_days = route_info["avg_transit_days"]
        dispatch_date = base_date + timedelta(days=np.random.randint(0, 40))
        planned_date = dispatch_date + timedelta(days=transit_days)

        if sid in CRITICAL_SHIPMENTS:
            delay_days = np.random.randint(8, 18)
            status_flag = "DELAYED"
        elif sid in DELAYED_SHIPMENTS:
            delay_days = np.random.randint(3, 7)
            status_flag = "DELAYED"
        else:
            delay_days = np.random.randint(-1, 2)
            status_flag = "ON_TIME" if delay_days <= 0 else "DELAYED"

        actual_date = planned_date + timedelta(days=delay_days)
        records.append({
            "shipment_id": sid, "route_id": route_id,
            "carrier": random.choice(CARRIERS),
            "product_category": random.choice(("Lubricants", "Fuels", "Chemicals", "Equipment")),
            "shipment_value_usd": round(np.random.uniform(10000, 500000), 2),
            "planned_dispatch_date": dispatch_date.strftime("%Y-%m-%d"),
            "planned_delivery_date": planned_date.strftime("%Y-%m-%d"),
            "actual_delivery_date": actual_date.strftime("%Y-%m-%d"),
            "status_flag": status_flag,
        })
    return pd.DataFrame(records)


def generate_all(seed=42):
    routes = generate_route_master()
    shipments = generate_shipment_master(routes, seed)
    return {"shipment_master": shipments, "route_master": routes}


if __name__ == "__main__":
    tables = generate_all()
    for name, df in tables.items():
        print(f"{name}  -  {len(df)} rows  |  columns: {list(df.columns)}")
        print(df.to_string(index=False))
        print()
