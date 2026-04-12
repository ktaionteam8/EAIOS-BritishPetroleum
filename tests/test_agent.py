"""Tests for CarbonCreditAgent."""

from src.agents.carbon_credit_agent import CarbonCreditAgent


def test_agent_returns_60_records():
    assert len(CarbonCreditAgent().run()) == 60


def test_recommendations_are_valid():
    results = CarbonCreditAgent().run()
    valid = {"BUY", "SELL", "HOLD"}
    assert all(r["recommendation"] in valid for r in results)


def test_confidence_bounded():
    for r in CarbonCreditAgent().run():
        assert 0.0 <= r["confidence"] <= 1.0
