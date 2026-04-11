"""Tests for governance engine."""

from src.agents.crude_agent import CrudeAgent
from src.services.governance import Tier1Governance, Tier2Governance


def test_tier1_classifies_all_records():
    results = CrudeAgent().run()
    tier1 = Tier1Governance().run({"CrudeAgent": results})
    total = tier1["summary"]["total_processed"]
    assert total == len(results)


def test_tier1_escalates_critical():
    results = CrudeAgent().run()
    tier1 = Tier1Governance().run({"CrudeAgent": results})
    assert tier1["summary"]["escalated_to_tier2"] > 0


def test_tier2_reviews_escalated():
    results = CrudeAgent().run()
    tier1 = Tier1Governance().run({"CrudeAgent": results})
    tier2 = Tier2Governance().run(tier1)
    assert tier2["summary"]["total_reviewed"] == tier1["summary"]["escalated_to_tier2"]
