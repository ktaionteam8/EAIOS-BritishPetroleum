"""
Revenue Analytics Agent
=========================
Combines simulated trading revenue, retail sales, and demand signals
from other domains to classify each revenue stream as GROWTH / STABLE /
DECLINE, with revenue_trend and growth_rate metrics.

Cross-domain inputs are SIMULATED locally — no external API calls and
no imports from other branches.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.revenue_analytics_data import generate_revenue_analytics_data


class RevenueAnalyticsAgent:
    AGENT_NAME = "RevenueAnalyticsAgent"

    GROWTH_THRESHOLD = 0.05
    DECLINE_THRESHOLD = -0.03

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_revenue_analytics_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            trading_rev = row["trading_revenue"]
            retail_sales = row["retail_sales"]
            demand_index = row["demand_index"]
            prev_revenue = row["prev_quarter_revenue"]

            current_revenue = trading_rev + retail_sales
            growth_rate = (current_revenue - prev_revenue) / prev_revenue if prev_revenue > 0 else 0

            if growth_rate > self.GROWTH_THRESHOLD and demand_index > 0.55:
                decision = "GROWTH"
                trend = "INCREASING"
                confidence = min(0.95, 0.6 + growth_rate * 4)
                insight = (f"Revenue up {growth_rate:+.1%} QoQ; demand index {demand_index:.2f} — "
                           f"sustain pricing and invest in capacity")
            elif growth_rate < self.DECLINE_THRESHOLD:
                decision = "DECLINE"
                trend = "DECREASING"
                confidence = min(0.92, 0.6 + abs(growth_rate) * 4)
                insight = (f"Revenue down {growth_rate:+.1%} QoQ — review pricing, "
                           f"promotions, and market positioning")
            else:
                decision = "STABLE"
                trend = "STABLE"
                confidence = 0.75
                insight = f"Flat revenue ({growth_rate:+.1%}); demand index {demand_index:.2f}"

            results.append({
                "entity_id": row["stream_id"],
                "entity_type": "revenue_stream",
                "revenue_stream": row["revenue_stream"],
                "region": row["region"],
                "trading_revenue": round(trading_rev, 0),
                "retail_sales": round(retail_sales, 0),
                "demand_index": round(demand_index, 2),
                "current_revenue": round(current_revenue, 0),
                "prev_quarter_revenue": round(prev_revenue, 0),
                "growth_rate": round(growth_rate, 4),
                "revenue_trend": trend,
                "decision": decision,
                "confidence": round(confidence, 2),
                "reason": insight,
                "insight": insight,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results

    def decisions(self) -> list[dict]:
        return [r for r in self.run() if r["decision"] != "STABLE"]
