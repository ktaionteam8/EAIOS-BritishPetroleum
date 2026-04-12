"""Tests for ContractorAgent."""

from src.agents.contractor_agent import ContractorAgent


def test_agent_returns_75_records():
    assert len(ContractorAgent().run()) == 75


def test_actions_are_valid():
    valid = {"RETAIN", "MAINTAIN", "REVIEW", "REPLACE"}
    assert all(r["action"] in valid for r in ContractorAgent().run())


def test_replace_has_immediate_priority():
    for r in ContractorAgent().run():
        if r["action"] == "REPLACE":
            assert r["priority"] == "IMMEDIATE"
