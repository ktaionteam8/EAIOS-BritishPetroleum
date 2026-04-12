"""Tests for ServiceDeskAgent."""

from src.agents.service_desk_agent import ServiceDeskAgent


def test_agent_returns_100_records():
    assert len(ServiceDeskAgent().run()) == 100


def test_actions_are_valid():
    valid = {"AUTO_RESOLVE", "ROUTE", "ESCALATE"}
    assert all(r["action"] in valid for r in ServiceDeskAgent().run())


def test_p1_always_escalated():
    for r in ServiceDeskAgent().run():
        if r["severity"] == "P1":
            assert r["action"] == "ESCALATE"
