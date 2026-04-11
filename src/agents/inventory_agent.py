"""
Inventory Management Agent
============================
Monitors warehouse inventory positions across 20 locations and 6 product types.
Detects stockout risk (below safety stock) and overstock (excess working capital).
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.inventory_data import generate_inventory_data


class InventoryAgent:
    AGENT_NAME = "InventoryAgent"

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_inventory_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            risk = 0.0
            reasons: list[str] = []

            stock = row["stock"]
            safety = row["safety_stock"]
            ratio = stock / safety if safety > 0 else 0

            if ratio < 0.5:
                risk += 0.6
                reasons.append(f"Critical stockout risk — stock {stock:,} vs safety {safety:,} ({ratio:.1%})")
            elif ratio < 0.8:
                risk += 0.3
                reasons.append(f"Below safety stock — ratio {ratio:.1%}")

            if ratio > 3.0:
                risk += 0.25
                reasons.append(f"Overstock — {ratio:.1f}x safety stock, capital at risk")

            risk = min(risk, 1.0)
            status = "critical" if risk >= 0.6 else "warning" if risk >= 0.3 else "normal"
            reason = "; ".join(reasons) if reasons else "Stock levels healthy"

            entity_id = f"{row['location_id']}_{row['product_id']}"
            results.append({
                "entity_id": entity_id,
                "entity_type": "inventory_position",
                "status": status,
                "risk_score": round(risk, 2),
                "reason": reason,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results
