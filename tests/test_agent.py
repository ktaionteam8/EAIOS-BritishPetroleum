"""Tests for SkillsGapAgent."""

from src.agents.skills_gap_agent import SkillsGapAgent


def test_agent_returns_80_records():
    assert len(SkillsGapAgent().run()) == 80


def test_actions_are_valid():
    valid = {"TRAIN", "HIRE", "OK"}
    assert all(r["action"] in valid for r in SkillsGapAgent().run())


def test_priorities_are_valid():
    valid = {"HIGH", "MEDIUM", "LOW"}
    assert all(r["priority"] in valid for r in SkillsGapAgent().run())
