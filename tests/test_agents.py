"""Tests for Demand-Supply Matching agents."""

from src.agents.crude_agent import CrudeAgent
from src.agents.refinery_agent import RefineryAgent


def test_crude_agent_returns_results():
    agent = CrudeAgent()
    results = agent.run()
    assert len(results) == 100
    assert all("entity_id" in r for r in results)
    assert all("risk_score" in r for r in results)
    assert all(r["agent"] == "CrudeAgent" for r in results)


def test_crude_agent_detects_critical():
    agent = CrudeAgent()
    results = agent.run()
    critical = [r for r in results if r["status"] == "critical"]
    assert len(critical) > 0


def test_refinery_agent_returns_results():
    agent = RefineryAgent()
    results = agent.run()
    assert len(results) == 80
    assert all("entity_id" in r for r in results)
    assert all(r["agent"] == "RefineryAgent" for r in results)


def test_refinery_agent_detects_critical():
    agent = RefineryAgent()
    results = agent.run()
    critical = [r for r in results if r["status"] == "critical"]
    assert len(critical) > 0


def test_risk_scores_bounded():
    crude = CrudeAgent().run()
    refinery = RefineryAgent().run()
    for r in crude + refinery:
        assert 0.0 <= r["risk_score"] <= 1.0
