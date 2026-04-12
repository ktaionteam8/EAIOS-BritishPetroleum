"""
Cost Forecasting Agent
========================
Aggregates simulated cost inputs from other domains (manufacturing,
logistics, workforce) and produces a rolled-up forecast with variance
vs budget and trend classification.

Cross-domain inputs are SIMULATED locally — no external API calls and
no imports from other branches.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.cost_forecast_data import generate_cost_forecast_data


class CostForecastAgent:
    AGENT_NAME = "CostForecastAgent"

    OVERRUN_THRESHOLD = 0.08
    UNDERRUN_THRESHOLD = -0.08

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_cost_forecast_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            mfg = row["manufacturing_cost"]
            log = row["logistics_cost"]
            wf = row["workforce_cost"]
            budget = row["budget"]
            trend_3m = row["trend_3m_pct"]

            forecast = mfg + log + wf
            variance = forecast - budget
            variance_pct = variance / budget if budget > 0 else 0

            if variance_pct > self.OVERRUN_THRESHOLD and trend_3m > 0:
                decision = "OVERRUN"
                confidence = min(0.95, 0.7 + variance_pct)
                reason = (f"Forecast ${forecast:,.0f} vs budget ${budget:,.0f} "
                          f"({variance_pct:+.1%}); trend {trend_3m:+.1%}")
                trend_label = "INCREASING"
            elif variance_pct < self.UNDERRUN_THRESHOLD:
                decision = "UNDERRUN"
                confidence = 0.8
                reason = f"Under budget by {abs(variance_pct):.1%} — potential reallocation"
                trend_label = "DECREASING" if trend_3m < 0 else "STABLE"
            else:
                decision = "STABLE"
                confidence = 0.85
                reason = f"Within ±{self.OVERRUN_THRESHOLD:.0%} of budget ({variance_pct:+.1%})"
                trend_label = "INCREASING" if trend_3m > 0.02 else "DECREASING" if trend_3m < -0.02 else "STABLE"

            results.append({
                "entity_id": row["cost_center_id"],
                "entity_type": "cost_center",
                "cost_center": row["cost_center"],
                "manufacturing_cost": round(mfg, 0),
                "logistics_cost": round(log, 0),
                "workforce_cost": round(wf, 0),
                "forecast_cost": round(forecast, 0),
                "budget": round(budget, 0),
                "variance": round(variance, 0),
                "variance_pct": round(variance_pct, 4),
                "trend": trend_label,
                "trend_3m_pct": round(trend_3m, 3),
                "decision": decision,
                "confidence": round(confidence, 2),
                "reason": reason,
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results

    def decisions(self) -> list[dict]:
        return [r for r in self.run() if r["decision"] != "STABLE"]
