"""Tests for ShadowITAgent."""

from src.agents.shadow_it_agent import ShadowITAgent


def test_agent_returns_85_records():
    assert len(ShadowITAgent().run()) == 85


def test_actions_valid():
    valid = {"SANCTION", "REVIEW", "BLOCK"}
    assert all(r["action"] in valid for r in ShadowITAgent().run())
