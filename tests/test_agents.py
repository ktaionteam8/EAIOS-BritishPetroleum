"""Tests for Inventory Management agent."""

from src.agents.inventory_agent import InventoryAgent


def test_inventory_agent_returns_results():
    agent = InventoryAgent()
    results = agent.run()
    assert len(results) == 100
    assert all("entity_id" in r for r in results)
    assert all(r["agent"] == "InventoryAgent" for r in results)


def test_inventory_agent_detects_critical():
    agent = InventoryAgent()
    results = agent.run()
    critical = [r for r in results if r["status"] == "critical"]
    assert len(critical) > 0


def test_risk_scores_bounded():
    results = InventoryAgent().run()
    for r in results:
        assert 0.0 <= r["risk_score"] <= 1.0
