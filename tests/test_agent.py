"""Tests for WorkforceAgent."""

from src.agents.workforce_agent import WorkforceAgent


def test_agent_returns_60_records():
    assert len(WorkforceAgent().run()) == 60


def test_actions_are_valid():
    valid = {"HIRE", "MAINTAIN", "REDEPLOY"}
    assert all(r["action"] in valid for r in WorkforceAgent().run())


def test_hire_count_non_negative():
    for r in WorkforceAgent().run():
        assert r["hires_needed"] >= 0
