"""Tests for governance engine."""

from src.agents.inventory_agent import InventoryAgent
from src.services.governance import Tier1Governance, Tier2Governance


def test_tier1_classifies_all():
    results = InventoryAgent().run()
    tier1 = Tier1Governance().run({"InventoryAgent": results})
    assert tier1["summary"]["total_processed"] == len(results)


def test_tier2_reviews_escalated():
    results = InventoryAgent().run()
    tier1 = Tier1Governance().run({"InventoryAgent": results})
    tier2 = Tier2Governance().run(tier1)
    assert tier2["summary"]["total_reviewed"] == tier1["summary"]["escalated_to_tier2"]
