"""Tests for FinancialCloseAgent."""

from src.agents.financial_close_agent import FinancialCloseAgent


def test_agent_returns_70_records():
    assert len(FinancialCloseAgent().run()) == 70


def test_decisions_valid():
    valid = {"CLOSE_READY", "PENDING", "ISSUE"}
    assert all(r["decision"] in valid for r in FinancialCloseAgent().run())


def test_confidence_bounded():
    for r in FinancialCloseAgent().run():
        assert 0.0 <= r["confidence"] <= 1.0


def test_output_has_standard_shape():
    for r in FinancialCloseAgent().run():
        assert "decision" in r and "confidence" in r and "reason" in r
