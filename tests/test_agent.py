"""Tests for AviationForecastAgent."""

from src.agents.aviation_forecast_agent import AviationForecastAgent


def test_agent_returns_50_records():
    assert len(AviationForecastAgent().run()) == 50


def test_trends_are_valid():
    results = AviationForecastAgent().run()
    valid = {"INCREASING", "DECREASING", "STABLE"}
    assert all(r["trend"] in valid for r in results)


def test_ci_bounds_sensible():
    for r in AviationForecastAgent().run():
        ci = r["confidence_interval"]
        assert ci["lower"] <= r["forecast_volume_bbl"] <= ci["upper"]
