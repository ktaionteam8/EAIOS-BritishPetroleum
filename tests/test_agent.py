"""Tests for InfraMonitoringAgent."""

from src.agents.infra_monitoring_agent import InfraMonitoringAgent


def test_agent_returns_120_records():
    assert len(InfraMonitoringAgent().run()) == 120


def test_actions_valid():
    valid = {"ALERT", "SCALE_UP", "SCALE_DOWN", "STABLE"}
    assert all(r["action"] in valid for r in InfraMonitoringAgent().run())


def test_alert_immediate_priority():
    for r in InfraMonitoringAgent().run():
        if r["action"] == "ALERT":
            assert r["priority"] == "IMMEDIATE"
