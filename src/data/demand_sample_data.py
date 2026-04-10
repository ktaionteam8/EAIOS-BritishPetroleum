"""
demand_sample_data.py - EAIOS Demand Agent Sample Data
=======================================================
"""
import random
from datetime import date, timedelta

import numpy as np
import pandas as pd

PRODUCT_IDS = [f"P{i}" for i in range(1001, 1013)]
CUSTOMER_IDS = [f"C{i}" for i in range(2001, 2031)]
REGIONS = ("North", "South", "East", "West", "Central")
SEGMENTS = ("Retail", "Industrial", "Export", "Government")
PRODUCT_TYPES = ("Lubricant", "Fuel", "Chemical", "Polymer", "Additive")
SPIKE_PRODUCTS = ("P1004", "P1005")
DROP_PRODUCTS = ("P1003", "P1006")
VOLATILE_PRODUCTS = ("P1003",)

FORECAST_BASE: dict[str, int] = {
    "P1001": 500, "P1002": 320, "P1003": 410, "P1004": 280,
    "P1005": 600, "P1006": 150, "P1007": 380, "P1008": 470,
    "P1009": 230, "P1010": 310, "P1011": 540, "P1012": 400,
}
MONTHS_BACK = 6


def generate_customers(seed=42):
    random.seed(seed)
    records = [{"customer_id": cid, "region": random.choice(REGIONS),
                "segment": random.choice(SEGMENTS)} for cid in CUSTOMER_IDS]
    return pd.DataFrame(records)


def generate_product_master(seed=42):
    random.seed(seed)
    records = []
    for pid in PRODUCT_IDS:
        ptype = random.choice(PRODUCT_TYPES)
        records.append({"product_id": pid, "product_name": f"Product {pid}", "product_type": ptype})
    return pd.DataFrame(records)


def generate_demand_plan(seed=42):
    np.random.seed(seed)
    records = []
    today = date.today().replace(day=1)
    for pid in PRODUCT_IDS:
        base = FORECAST_BASE[pid]
        for m in range(MONTHS_BACK):
            forecast_date = today - timedelta(days=30 * m)
            qty = max(10, int(base * np.random.uniform(0.92, 1.08)))
            records.append({
                "product_id": pid, "forecast_quantity": qty,
                "forecast_date": forecast_date.strftime("%Y-%m-01"),
            })
    df = pd.DataFrame(records).sort_values(["product_id", "forecast_date"]).reset_index(drop=True)
    return df


def _order_quantity(product_id, base_forecast, seed_val):
    np.random.seed(seed_val)
    if product_id in SPIKE_PRODUCTS:
        multiplier = np.random.uniform(1.4, 1.8)
    elif product_id in DROP_PRODUCTS:
        multiplier = np.random.uniform(0.35, 0.6)
    elif product_id in VOLATILE_PRODUCTS:
        multiplier = np.random.uniform(0.08, 0.18)
    else:
        multiplier = np.random.uniform(0.85, 1.15)
    return max(1, int(base_forecast * multiplier))


def generate_unified_order(demand_plan, customers, seed=42):
    random.seed(seed)
    np.random.seed(seed)
    cust_ids = customers["customer_id"].tolist()
    records = []
    order_counter = 3001
    for pid in PRODUCT_IDS:
        base = FORECAST_BASE[pid]
        product_plan = demand_plan[demand_plan["product_id"] == pid]
        for _, plan_row in product_plan.iterrows():
            fdate = pd.to_datetime(plan_row["forecast_date"])
            n_orders = np.random.randint(3, 8)
            for j in range(n_orders):
                day_offset = np.random.randint(0, 27)
                order_date = fdate + timedelta(days=int(day_offset))
                sv = (order_counter * 18 + j) % 100_997
                qty = _order_quantity(pid, base // max(n_orders, 1), sv)
                records.append({
                    "order_id": f"ORD{order_counter}",
                    "product_id": pid,
                    "customer_id": np.random.choice(cust_ids),
                    "quantity": qty,
                    "order_date": order_date.strftime("%Y-%m-%d"),
                })
                order_counter += 1
    df = pd.DataFrame(records).sort_values("order_date").reset_index(drop=True)
    return df


def generate_all(seed=42):
    customers = generate_customers(seed)
    product_master = generate_product_master(seed)
    demand_plan = generate_demand_plan(seed)
    unified_order = generate_unified_order(demand_plan, customers, seed)
    return {"customers": customers, "demand_plan": demand_plan,
            "unified_order": unified_order, "product_master": product_master}


if __name__ == "__main__":
    tables = generate_all()
    for name, df in tables.items():
        print(f"{name}  -  {len(df)} rows  |  columns: {list(df.columns)}")
        print(df.head().to_string(index=False))
        print()
