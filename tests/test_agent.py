"""Tests for ReskillingAgent."""

from src.agents.reskilling_agent import ReskillingAgent


def test_agent_returns_100_records():
    assert len(ReskillingAgent().run()) == 100


def test_actions_are_valid():
    valid = {"RESKILL", "UPSKILL", "HOLD"}
    assert all(r["action"] in valid for r in ReskillingAgent().run())


def test_training_hours_non_negative():
    for r in ReskillingAgent().run():
        assert r["recommended_training_hours"] >= 0
