"""inventory_sample_data.py - EAIOS Inventory Agent Sample Data"""
import random
import numpy as np
import pandas as pd

PRODUCT_IDS = [f"P{i}" for i in range(1001, 1016)]
PRODUCT_TYPES = ("Lubricant", "Fuel", "Chemical", "Polymer", "Additive")
SHORTAGE_PRODUCTS = ("P1004", "P1005")
OVERSTOCK_PRODUCTS = ("P1006",)
CRITICAL_PRODUCTS = ("P1003",)


def generate_inventory_decision(seed=42):
    random.seed(seed)
    np.random.seed(seed)
    records = []
    for pid in PRODUCT_IDS:
        ptype = np.random.choice(PRODUCT_TYPES)
        safety_stock = np.random.randint(100, 400)
        reorder_pt = np.random.randint(50, 150)
        unit_cost = round(np.random.uniform(5.0, 80.0), 2)
        if pid in CRITICAL_PRODUCTS:
            current_stock = np.random.randint(10, 20)
        elif pid in SHORTAGE_PRODUCTS:
            current_stock = np.random.randint(20, int(safety_stock * 0.4))
        elif pid in OVERSTOCK_PRODUCTS:
            current_stock = int(safety_stock * 4)
        else:
            current_stock = np.random.randint(int(safety_stock * 0.8), int(safety_stock * 1.5))
        records.append({
            "product_id": pid, "product_type": ptype,
            "current_stock": current_stock, "safety_stock": safety_stock,
            "reorder_point": reorder_pt, "unit_cost": unit_cost,
        })
    return pd.DataFrame(records)


def generate_material_requirement(inventory, seed=42):
    random.seed(seed)
    np.random.seed(seed)
    records = []
    for _, row in inventory.iterrows():
        pid = row["product_id"]
        if pid in CRITICAL_PRODUCTS:
            required = np.random.randint(400, 600)
            priority = "CRITICAL"
        elif pid in SHORTAGE_PRODUCTS:
            required = np.random.randint(250, 450)
            priority = "HIGH"
        elif pid in OVERSTOCK_PRODUCTS:
            required = np.random.randint(20, 80)
            priority = "LOW"
        else:
            required = np.random.randint(80, 300)
            priority = np.random.choice(["HIGH", "MEDIUM", "MEDIUM", "LOW"])
        records.append({
            "product_id": pid, "required_quantity": required,
            "planning_horizon": 30, "priority": priority,
        })
    return pd.DataFrame(records)


def generate_all(seed=42):
    inventory = generate_inventory_decision(seed)
    requirements = generate_material_requirement(inventory, seed)
    return {"inventory_decision": inventory, "material_requirement": requirements}


if __name__ == "__main__":
    tables = generate_all()
    for name, df in tables.items():
        print(f"{name}  -  {len(df)} rows  |  columns: {list(df.columns)}")
        print(df.to_string(index=False))
        print()
