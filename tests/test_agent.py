"""Tests for LNGTradingAgent."""

from src.agents.lng_trading_agent import LNGTradingAgent


def test_agent_returns_40_records():
    assert len(LNGTradingAgent().run()) == 40


def test_recommendations_are_valid():
    results = LNGTradingAgent().run()
    valid = {"BUY", "SELL", "HOLD"}
    assert all(r["recommendation"] in valid for r in results)


def test_best_route_populated():
    for r in LNGTradingAgent().run():
        assert r["best_route"] in ("Asia (JKM)", "Europe (TTF)", "None") or r["recommendation"] == "SELL"
