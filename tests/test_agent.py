"""Tests for TreasuryAgent."""

from src.agents.treasury_agent import TreasuryAgent


def test_agent_returns_50_records():
    assert len(TreasuryAgent().run()) == 50


def test_decisions_valid():
    valid = {"INVEST", "HOLD", "ALERT"}
    assert all(r["decision"] in valid for r in TreasuryAgent().run())


def test_standard_output_shape():
    for r in TreasuryAgent().run():
        assert "decision" in r and "confidence" in r and "reason" in r
