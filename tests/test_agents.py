"""Tests for Marine Bunkering agent."""

from src.agents.logistics_agent import LogisticsAgent


def test_logistics_agent_returns_results():
    agent = LogisticsAgent()
    results = agent.run()
    assert len(results) == 120
    assert all("entity_id" in r for r in results)
    assert all(r["agent"] == "LogisticsAgent" for r in results)


def test_logistics_agent_detects_critical():
    agent = LogisticsAgent()
    results = agent.run()
    critical = [r for r in results if r["status"] == "critical"]
    assert len(critical) > 0


def test_risk_scores_bounded():
    results = LogisticsAgent().run()
    for r in results:
        assert 0.0 <= r["risk_score"] <= 1.0
