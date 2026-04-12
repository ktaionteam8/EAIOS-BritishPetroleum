"""
Aviation Fuel Forecasting Agent
=================================
30-day jet fuel demand forecast per airport-route using historical demand,
seasonality, and trend. Produces forecast volume, trend direction, and a
confidence interval.
"""

from datetime import datetime, timezone

import pandas as pd

from src.services.aviation_forecast_data import generate_aviation_forecast_data


class AviationForecastAgent:
    AGENT_NAME = "AviationForecastAgent"

    FORECAST_HORIZON_DAYS = 30

    def __init__(self) -> None:
        self.data: pd.DataFrame = generate_aviation_forecast_data()

    def run(self) -> list[dict]:
        results: list[dict] = []
        now = datetime.now(timezone.utc).isoformat()

        for _, row in self.data.iterrows():
            avg = row["avg_daily_demand"]
            trend = row["trend_pct"]
            seasonality = row["seasonality_factor"]
            volatility = row["volatility"]

            daily_forecast = avg * (1 + trend) * seasonality
            volume_30d = int(daily_forecast * self.FORECAST_HORIZON_DAYS)

            ci_width = volume_30d * volatility
            lower_ci = int(max(0, volume_30d - ci_width))
            upper_ci = int(volume_30d + ci_width)
            confidence = max(0.3, 1.0 - volatility)

            if trend > 0.05:
                trend_dir = "INCREASING"
            elif trend < -0.05:
                trend_dir = "DECREASING"
            else:
                trend_dir = "STABLE"

            results.append({
                "entity_id": row["route_id"],
                "entity_type": "aviation_route_forecast",
                "airport": row["airport"],
                "route": row["route"],
                "avg_daily_demand_bbl": int(avg),
                "forecast_volume_bbl": volume_30d,
                "forecast_horizon_days": self.FORECAST_HORIZON_DAYS,
                "trend": trend_dir,
                "trend_pct": round(trend, 3),
                "confidence": round(confidence, 2),
                "confidence_interval": {"lower": lower_ci, "upper": upper_ci},
                "rationale": f"30-day forecast at {daily_forecast:,.0f} bbl/day; trend {trend_dir} ({trend:+.1%})",
                "agent": self.AGENT_NAME,
                "timestamp": now,
            })

        return results

    def decisions(self) -> list[dict]:
        """Return high-confidence directional forecasts."""
        return [r for r in self.run() if r["trend"] != "STABLE" and r["confidence"] >= 0.6]
