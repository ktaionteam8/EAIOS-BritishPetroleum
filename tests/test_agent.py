"""Tests for RevenueAnalyticsAgent."""

from src.agents.revenue_analytics_agent import RevenueAnalyticsAgent


def test_agent_returns_75_records():
    assert len(RevenueAnalyticsAgent().run()) == 75


def test_decisions_valid():
    valid = {"GROWTH", "STABLE", "DECLINE"}
    assert all(r["decision"] in valid for r in RevenueAnalyticsAgent().run())


def test_trend_valid():
    valid = {"INCREASING", "DECREASING", "STABLE"}
    assert all(r["revenue_trend"] in valid for r in RevenueAnalyticsAgent().run())


def test_current_equals_sum_of_streams():
    for r in RevenueAnalyticsAgent().run():
        expected = r["trading_revenue"] + r["retail_sales"]
        assert abs(r["current_revenue"] - expected) <= 1
