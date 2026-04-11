"""Tests for governance engine."""

from src.agents.retail_agent import RetailAgent
from src.services.governance import Tier1Governance, Tier2Governance


def test_tier1_classifies_all():
    results = RetailAgent().run()
    tier1 = Tier1Governance().run({"RetailAgent": results})
    assert tier1["summary"]["total_processed"] == len(results)


def test_tier2_reviews_escalated():
    results = RetailAgent().run()
    tier1 = Tier1Governance().run({"RetailAgent": results})
    tier2 = Tier2Governance().run(tier1)
    assert tier2["summary"]["total_reviewed"] == tier1["summary"]["escalated_to_tier2"]
