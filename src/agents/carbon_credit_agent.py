"""
Carbon Credit Trading Agent
=============================
Analyzes carbon credit positions (EUA, CCA, VCM) and produces BUY/SELL/HOLD
recommendations based on price vs demand gap and policy tightening signals.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.carbon_credit_data import generate_carbon_credit_data


class CarbonCreditAgent:
    AGENT_NAME = "CarbonCreditAgent"

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_carbon_credit_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            price = row["price_eur"]
            fair_value = row["fair_value"]
            demand_index = row["demand_index"]
            policy_tightness = row["policy_tightness"]

            price_gap = (fair_value - price) / fair_value if fair_value > 0 else 0
            target_price = round(fair_value * (1 + 0.1 * policy_tightness), 2)

            if price_gap > 0.08 and demand_index > 0.6:
                recommendation = "BUY"
                rationale = f"Undervalued by {price_gap:.1%}; strong demand ({demand_index:.2f})"
                confidence = min(0.9, 0.6 + price_gap)
            elif price_gap < -0.08 and demand_index < 0.4:
                recommendation = "SELL"
                rationale = f"Overvalued by {-price_gap:.1%}; weak demand ({demand_index:.2f})"
                confidence = min(0.9, 0.6 + abs(price_gap))
            else:
                recommendation = "HOLD"
                rationale = f"Price within fair value band ({price_gap:+.1%})"
                confidence = 0.5

            results.append({
                "entity_id": row["position_id"],
                "entity_type": "carbon_credit",
                "scheme": row["scheme"],
                "price_eur": round(price, 2),
                "fair_value": round(fair_value, 2),
                "target_price": target_price,
                "demand_index": round(demand_index, 2),
                "policy_tightness": round(policy_tightness, 2),
                "recommendation": recommendation,
                "confidence": round(confidence, 2),
                "rationale": rationale,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results

    def decisions(self) -> list[dict]:
        return [r for r in self.run() if r["recommendation"] != "HOLD"]
