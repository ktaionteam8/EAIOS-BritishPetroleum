"""Tests for ArbitrageAgent."""

from src.agents.arbitrage_agent import ArbitrageAgent


def test_agent_returns_100_records():
    assert len(ArbitrageAgent().run()) == 100


def test_status_is_valid():
    results = ArbitrageAgent().run()
    valid = {"DETECTED", "NONE"}
    assert all(r["status"] in valid for r in results)


def test_detects_opportunities():
    decisions = ArbitrageAgent().decisions()
    assert len(decisions) > 0
    for d in decisions:
        assert d["net_margin"] > 0
        assert abs(d["z_score"]) >= 2.0
