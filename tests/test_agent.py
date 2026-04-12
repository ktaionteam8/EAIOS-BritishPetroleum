"""Tests for OTSecurityAgent."""

from src.agents.ot_security_agent import OTSecurityAgent


def test_agent_returns_90_records():
    assert len(OTSecurityAgent().run()) == 90


def test_status_valid():
    valid = {"CRITICAL", "WARNING", "NORMAL"}
    assert all(r["status"] in valid for r in OTSecurityAgent().run())


def test_critical_immediate_priority():
    for r in OTSecurityAgent().run():
        if r["status"] == "CRITICAL":
            assert r["priority"] == "IMMEDIATE"


def test_purdue_levels_valid():
    for r in OTSecurityAgent().run():
        assert r["purdue_level"] in (1, 2, 3)
