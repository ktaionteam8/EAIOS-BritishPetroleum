"""
Lubricant Distribution Agent (Castrol)
=======================================
Monitors Castrol lubricant distribution positions across global regions.
Detects shortage risks and overstock conditions.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.lubricant_data import generate_lubricant_data


class LubricantAgent:
    AGENT_NAME = "LubricantAgent"

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_lubricant_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for idx, row in self.data.iterrows():
            risk = 0.0
            reasons: list[str] = []

            demand = row["demand"]
            inventory = row["inventory"]
            ratio = inventory / demand if demand > 0 else 0

            if ratio < 0.5:
                risk += 0.55
                reasons.append(f"Shortage — inventory {inventory:,} vs demand {demand:,} ({ratio:.1%})")
            elif ratio < 0.8:
                risk += 0.25
                reasons.append(f"Low inventory ratio {ratio:.1%}")

            if ratio > 3.5:
                risk += 0.3
                reasons.append(f"Overstock — {ratio:.1f}x demand, working capital risk")

            risk = min(risk, 1.0)
            status = "critical" if risk >= 0.5 else "warning" if risk >= 0.25 else "normal"
            reason = "; ".join(reasons) if reasons else "Lubricant supply balanced"

            entity_id = f"{row['region']}_{row['sku']}_{idx}"
            results.append({
                "entity_id": entity_id,
                "entity_type": "lubricant_distribution",
                "status": status,
                "risk_score": round(risk, 2),
                "reason": reason,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results
