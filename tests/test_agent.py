"""Tests for TalentAnalyticsAgent."""

from src.agents.talent_analytics_agent import TalentAnalyticsAgent


def test_agent_returns_120_records():
    assert len(TalentAnalyticsAgent().run()) == 120


def test_actions_are_valid():
    valid = {"PROMOTE", "RETAIN", "REVIEW", "MAINTAIN"}
    assert all(r["action"] in valid for r in TalentAnalyticsAgent().run())


def test_performance_bounded():
    for r in TalentAnalyticsAgent().run():
        assert 1.0 <= r["performance_score"] <= 5.0
