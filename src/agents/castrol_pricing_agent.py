"""
Castrol Pricing Engine Agent
==============================
Dynamic pricing recommendations for Castrol lubricant SKUs across regions.
Balances margin targets against competitor pricing and demand elasticity.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.castrol_pricing_data import generate_castrol_pricing_data


class CastrolPricingAgent:
    AGENT_NAME = "CastrolPricingAgent"

    TARGET_MARGIN = 0.28

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_castrol_pricing_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            cost = row["unit_cost"]
            current = row["current_price"]
            competitor = row["competitor_price"]
            elasticity = row["demand_elasticity"]

            current_margin = (current - cost) / current if current > 0 else 0
            competitive_gap = (current - competitor) / competitor if competitor > 0 else 0

            if current_margin < self.TARGET_MARGIN - 0.05 and competitive_gap < 0.03:
                action = "PRICE_UP"
                recommended = round(cost / (1 - self.TARGET_MARGIN), 2)
                rationale = f"Margin {current_margin:.1%} below target; room vs competitor ({competitive_gap:+.1%})"
            elif current_margin > self.TARGET_MARGIN + 0.08 and elasticity > 0.6:
                action = "PRICE_DOWN"
                recommended = round(competitor * 0.98, 2)
                rationale = f"Margin {current_margin:.1%} above target; elastic demand ({elasticity:.2f})"
            elif competitive_gap > 0.10:
                action = "PRICE_DOWN"
                recommended = round(competitor * 1.01, 2)
                rationale = f"Priced {competitive_gap:.1%} above competitor — losing share"
            else:
                action = "HOLD"
                recommended = round(current, 2)
                rationale = f"Margin {current_margin:.1%}, gap {competitive_gap:+.1%} — hold"

            delta = round(recommended - current, 2)
            margin_impact = round((recommended - cost) / recommended - current_margin, 4) if recommended > 0 else 0

            results.append({
                "entity_id": row["sku_region_id"],
                "entity_type": "pricing_point",
                "sku": row["sku"],
                "region": row["region"],
                "unit_cost": round(cost, 2),
                "current_price": round(current, 2),
                "competitor_price": round(competitor, 2),
                "recommended_price": recommended,
                "delta": delta,
                "current_margin": round(current_margin, 4),
                "margin_impact": margin_impact,
                "action": action,
                "rationale": rationale,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results

    def decisions(self) -> list[dict]:
        return [r for r in self.run() if r["action"] != "HOLD"]
