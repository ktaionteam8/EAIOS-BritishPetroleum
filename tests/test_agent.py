"""Tests for TaxComplianceAgent."""

from src.agents.tax_compliance_agent import TaxComplianceAgent


def test_agent_returns_100_records():
    assert len(TaxComplianceAgent().run()) == 100


def test_decisions_valid():
    valid = {"COMPLIANT", "RISK", "NON_COMPLIANT"}
    assert all(r["decision"] in valid for r in TaxComplianceAgent().run())


def test_standard_output_shape():
    for r in TaxComplianceAgent().run():
        assert "decision" in r and "confidence" in r and "reason" in r
