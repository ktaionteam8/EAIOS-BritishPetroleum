"""Tests for SafetyAgent."""

from src.agents.safety_agent import SafetyAgent


def test_agent_returns_90_records():
    assert len(SafetyAgent().run()) == 90


def test_status_is_valid():
    valid = {"ALERT", "MONITOR", "NORMAL"}
    assert all(r["status"] in valid for r in SafetyAgent().run())


def test_risk_bounded():
    for r in SafetyAgent().run():
        assert 0.0 <= r["risk_score"] <= 1.0


def test_alerts_have_immediate_priority():
    for r in SafetyAgent().run():
        if r["status"] == "ALERT":
            assert r["priority"] == "IMMEDIATE"
