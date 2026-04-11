"""Tests for Castrol Distribution agent."""

from src.agents.lubricant_agent import LubricantAgent


def test_lubricant_agent_returns_results():
    agent = LubricantAgent()
    results = agent.run()
    assert len(results) == 80
    assert all("entity_id" in r for r in results)
    assert all(r["agent"] == "LubricantAgent" for r in results)


def test_lubricant_agent_detects_critical():
    agent = LubricantAgent()
    results = agent.run()
    critical = [r for r in results if r["status"] == "critical"]
    assert len(critical) > 0


def test_risk_scores_bounded():
    results = LubricantAgent().run()
    for r in results:
        assert 0.0 <= r["risk_score"] <= 1.0
