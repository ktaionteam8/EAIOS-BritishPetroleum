"""
Crude Trading Analytics Agent
===============================
Analyzes crude oil trading positions and produces BUY/SELL/HOLD
recommendations based on price vs moving average and volatility.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.crude_trading_data import generate_crude_trading_data


class CrudeTradingAgent:
    AGENT_NAME = "CrudeTradingAgent"

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_crude_trading_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            price = row["spot_price"]
            moving_avg = row["ma_20"]
            volatility = row["volatility"]
            volume = row["volume"]

            deviation = (price - moving_avg) / moving_avg if moving_avg > 0 else 0

            if deviation < -0.05 and volatility < 0.3:
                recommendation = "BUY"
                rationale = f"Price {deviation:.1%} below 20-day MA; low volatility ({volatility:.2f})"
                confidence = min(0.9, 0.5 + abs(deviation) * 4)
            elif deviation > 0.05 and volatility < 0.3:
                recommendation = "SELL"
                rationale = f"Price {deviation:.1%} above 20-day MA; low volatility ({volatility:.2f})"
                confidence = min(0.9, 0.5 + abs(deviation) * 4)
            elif volatility >= 0.4:
                recommendation = "HOLD"
                rationale = f"High volatility ({volatility:.2f}) — defer action"
                confidence = 0.4
            else:
                recommendation = "HOLD"
                rationale = f"Price within normal band ({deviation:+.1%} vs MA)"
                confidence = 0.5

            expected_pnl = round(volume * (moving_avg - price) * (1 if recommendation == "BUY" else -1 if recommendation == "SELL" else 0), 2)

            results.append({
                "entity_id": row["trade_id"],
                "entity_type": "crude_trade",
                "grade": row["grade"],
                "spot_price": round(price, 2),
                "ma_20": round(moving_avg, 2),
                "volatility": round(volatility, 3),
                "volume_bbl": int(volume),
                "recommendation": recommendation,
                "confidence": round(confidence, 2),
                "expected_pnl": expected_pnl,
                "rationale": rationale,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results

    def decisions(self) -> list[dict]:
        """Return only actionable (non-HOLD) decisions."""
        return [r for r in self.run() if r["recommendation"] != "HOLD"]
