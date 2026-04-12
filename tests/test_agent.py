"""Tests for CrudeTradingAgent."""

from src.agents.crude_trading_agent import CrudeTradingAgent


def test_agent_returns_80_records():
    results = CrudeTradingAgent().run()
    assert len(results) == 80


def test_recommendations_are_valid():
    results = CrudeTradingAgent().run()
    valid = {"BUY", "SELL", "HOLD"}
    assert all(r["recommendation"] in valid for r in results)


def test_confidence_bounded():
    results = CrudeTradingAgent().run()
    for r in results:
        assert 0.0 <= r["confidence"] <= 1.0


def test_decisions_filters_hold():
    decisions = CrudeTradingAgent().decisions()
    assert all(d["recommendation"] != "HOLD" for d in decisions)
