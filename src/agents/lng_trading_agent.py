"""
LNG Trading Platform Agent
============================
Evaluates LNG cargoes for cross-hub arbitrage between TTF (Europe) and
JKM (Asia). Recommends BUY/SELL/HOLD and identifies the best destination
route when the spread minus shipping cost is profitable.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.lng_trading_data import generate_lng_trading_data


class LNGTradingAgent:
    AGENT_NAME = "LNGTradingAgent"

    MIN_ARBITRAGE_MARGIN = 0.50  # $/MMBtu

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_lng_trading_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            spot = row["spot_price"]
            ttf = row["ttf_price"]
            jkm = row["jkm_price"]
            ship_cost = row["shipping_cost"]

            ttf_margin = ttf - spot - ship_cost
            jkm_margin = jkm - spot - ship_cost

            if jkm_margin > ttf_margin and jkm_margin > self.MIN_ARBITRAGE_MARGIN:
                recommendation = "BUY"
                best_route = "Asia (JKM)"
                arbitrage_margin = round(jkm_margin, 2)
                rationale = f"JKM spread ${jkm_margin:.2f}/MMBtu after shipping — divert to Asia"
            elif ttf_margin > self.MIN_ARBITRAGE_MARGIN:
                recommendation = "BUY"
                best_route = "Europe (TTF)"
                arbitrage_margin = round(ttf_margin, 2)
                rationale = f"TTF spread ${ttf_margin:.2f}/MMBtu after shipping — route to Europe"
            elif spot > max(ttf, jkm):
                recommendation = "SELL"
                best_route = row["origin"]
                arbitrage_margin = round(spot - max(ttf, jkm), 2)
                rationale = f"Spot ${spot:.2f} above both hubs — sell at origin"
            else:
                recommendation = "HOLD"
                best_route = "None"
                arbitrage_margin = 0.0
                rationale = f"Margins insufficient (TTF ${ttf_margin:.2f}, JKM ${jkm_margin:.2f})"

            results.append({
                "entity_id": row["cargo_id"],
                "entity_type": "lng_cargo",
                "origin": row["origin"],
                "volume_mmbtu": int(row["volume_mmbtu"]),
                "spot_price": round(spot, 2),
                "ttf_price": round(ttf, 2),
                "jkm_price": round(jkm, 2),
                "shipping_cost": round(ship_cost, 2),
                "recommendation": recommendation,
                "best_route": best_route,
                "arbitrage_margin": arbitrage_margin,
                "expected_pnl": round(arbitrage_margin * row["volume_mmbtu"], 2),
                "rationale": rationale,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results

    def decisions(self) -> list[dict]:
        return [r for r in self.run() if r["recommendation"] != "HOLD"]
