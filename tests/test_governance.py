"""Tests for governance engine."""

from src.agents.lubricant_agent import LubricantAgent
from src.services.governance import Tier1Governance, Tier2Governance


def test_tier1_classifies_all():
    results = LubricantAgent().run()
    tier1 = Tier1Governance().run({"LubricantAgent": results})
    assert tier1["summary"]["total_processed"] == len(results)


def test_tier2_reviews_escalated():
    results = LubricantAgent().run()
    tier1 = Tier1Governance().run({"LubricantAgent": results})
    tier2 = Tier2Governance().run(tier1)
    assert tier2["summary"]["total_reviewed"] == tier1["summary"]["escalated_to_tier2"]
