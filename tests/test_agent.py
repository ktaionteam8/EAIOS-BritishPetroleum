"""Tests for CostForecastAgent."""

from src.agents.cost_forecast_agent import CostForecastAgent


def test_agent_returns_60_records():
    assert len(CostForecastAgent().run()) == 60


def test_decisions_valid():
    valid = {"OVERRUN", "UNDERRUN", "STABLE"}
    assert all(r["decision"] in valid for r in CostForecastAgent().run())


def test_trend_valid():
    valid = {"INCREASING", "DECREASING", "STABLE"}
    assert all(r["trend"] in valid for r in CostForecastAgent().run())


def test_forecast_equals_sum_of_inputs():
    for r in CostForecastAgent().run():
        expected = r["manufacturing_cost"] + r["logistics_cost"] + r["workforce_cost"]
        assert abs(r["forecast_cost"] - expected) <= 1
