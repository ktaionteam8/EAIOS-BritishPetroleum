"""
Cross-Commodity Arbitrage Agent
=================================
Detects arbitrage opportunities across commodity pairs (crude/diesel,
crude/gasoline, diesel/gasoil, LNG/LPG, etc.) by comparing observed
spreads against historical means and transaction cost thresholds.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.arbitrage_data import generate_arbitrage_data


class ArbitrageAgent:
    AGENT_NAME = "ArbitrageAgent"

    SIGNIFICANCE_MULTIPLIER = 2.0  # z-score threshold

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_arbitrage_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            observed = row["observed_spread"]
            mean = row["mean_spread"]
            stdev = row["stdev_spread"]
            txn_cost = row["transaction_cost"]

            z_score = (observed - mean) / stdev if stdev > 0 else 0
            net_margin = abs(observed - mean) - txn_cost

            if abs(z_score) >= self.SIGNIFICANCE_MULTIPLIER and net_margin > 0:
                status = "DETECTED"
                direction = "LONG_A_SHORT_B" if z_score > 0 else "SHORT_A_LONG_B"
                rationale = f"Spread z={z_score:+.2f}; net margin ${net_margin:.2f} after txn cost"
                confidence = min(0.95, 0.5 + abs(z_score) * 0.1)
            else:
                status = "NONE"
                direction = "N/A"
                rationale = f"Spread within normal band (z={z_score:+.2f}, margin ${net_margin:.2f})"
                confidence = 0.3

            results.append({
                "entity_id": row["pair_id"],
                "entity_type": "arbitrage_pair",
                "leg_a": row["leg_a"],
                "leg_b": row["leg_b"],
                "observed_spread": round(observed, 3),
                "mean_spread": round(mean, 3),
                "stdev_spread": round(stdev, 3),
                "z_score": round(z_score, 2),
                "transaction_cost": round(txn_cost, 2),
                "net_margin": round(net_margin, 2),
                "status": status,
                "direction": direction,
                "confidence": round(confidence, 2),
                "rationale": rationale,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results

    def decisions(self) -> list[dict]:
        return [r for r in self.run() if r["status"] == "DETECTED"]
