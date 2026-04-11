"""Tests for aviation fuel governance (safety-critical)."""

from src.agents.aviation_agent import AviationAgent
from src.services.governance import Tier1Governance, Tier2Governance


def test_tier1_classifies_all():
    results = AviationAgent().run()
    tier1 = Tier1Governance().run({"AviationAgent": results})
    assert tier1["summary"]["total_processed"] == len(results)


def test_tier2_approves_aviation_critical_as_urgent():
    results = AviationAgent().run()
    tier1 = Tier1Governance().run({"AviationAgent": results})
    tier2 = Tier2Governance().run(tier1)
    for item in tier2["approved"]:
        assert item["human_decision"] == "APPROVED_URGENT"
        assert item["action_deadline"] == "IMMEDIATE"
