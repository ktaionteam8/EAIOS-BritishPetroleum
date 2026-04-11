"""Tests for Retail Fuel Optimization agent."""

from src.agents.retail_agent import RetailAgent


def test_retail_agent_returns_results():
    agent = RetailAgent()
    results = agent.run()
    assert len(results) == 100
    assert all("entity_id" in r for r in results)
    assert all(r["agent"] == "RetailAgent" for r in results)


def test_retail_agent_detects_critical():
    agent = RetailAgent()
    results = agent.run()
    critical = [r for r in results if r["status"] == "critical"]
    assert len(critical) > 0


def test_risk_scores_bounded():
    results = RetailAgent().run()
    for r in results:
        assert 0.0 <= r["risk_score"] <= 1.0
