"""Tests for MasterAgent orchestrator."""

from src.agents.master_agent import MasterAgent


def test_run_returns_final_decision():
    result = MasterAgent().run()
    assert "final_decision" in result
    assert "confidence" in result
    assert "reason" in result
    assert "actions" in result


def test_confidence_bounded():
    result = MasterAgent().run()
    assert 0.0 <= result["confidence"] <= 1.0


def test_domain_inputs_covered():
    result = MasterAgent().run()
    expected_domains = {
        "manufacturing", "supply_chain", "trading",
        "finance_treasury", "finance_tax", "it_ot", "hr_safety",
    }
    assert set(result["domain_inputs"].keys()) == expected_domains


def test_decision_only_shape():
    result = MasterAgent().decision_only()
    assert set(result.keys()) == {"final_decision", "confidence", "reason", "actions", "timestamp"}


def test_falls_back_to_mock_when_services_down():
    """With no services running, every domain_input should be marked 'mock'."""
    result = MasterAgent().run()
    sources = {d["source"] for d in result["domain_inputs"].values()}
    assert "mock" in sources
