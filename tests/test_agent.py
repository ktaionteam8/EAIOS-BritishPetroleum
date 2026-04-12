"""Tests for ComplianceAgent."""

from src.agents.compliance_agent import ComplianceAgent


def test_agent_returns_100_records():
    assert len(ComplianceAgent().run()) == 100


def test_status_valid():
    valid = {"COMPLIANT", "GAP", "VIOLATION"}
    assert all(r["status"] in valid for r in ComplianceAgent().run())


def test_violation_critical():
    for r in ComplianceAgent().run():
        if r["status"] == "VIOLATION":
            assert r["priority"] == "CRITICAL"
