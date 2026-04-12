"""Tests for JVAccountingAgent."""

from src.agents.jv_accounting_agent import JVAccountingAgent


def test_agent_returns_80_records():
    assert len(JVAccountingAgent().run()) == 80


def test_decisions_valid():
    valid = {"BALANCED", "MISMATCH", "REVIEW"}
    assert all(r["decision"] in valid for r in JVAccountingAgent().run())


def test_output_has_standard_shape():
    for r in JVAccountingAgent().run():
        assert "decision" in r and "confidence" in r and "reason" in r
