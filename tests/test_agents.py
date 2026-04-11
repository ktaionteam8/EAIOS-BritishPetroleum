"""Tests for Aviation Fuel Logistics agent."""

from src.agents.aviation_agent import AviationAgent


def test_aviation_agent_returns_results():
    agent = AviationAgent()
    results = agent.run()
    assert len(results) == 60
    assert all("entity_id" in r for r in results)
    assert all(r["agent"] == "AviationAgent" for r in results)
    assert all(r["entity_type"] == "aviation_fuel" for r in results)


def test_aviation_agent_detects_critical():
    agent = AviationAgent()
    results = agent.run()
    critical = [r for r in results if r["status"] == "critical"]
    assert len(critical) > 0


def test_risk_scores_bounded():
    results = AviationAgent().run()
    for r in results:
        assert 0.0 <= r["risk_score"] <= 1.0
