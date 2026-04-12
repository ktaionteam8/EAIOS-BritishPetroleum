"""Tests for ThreatDetectionAgent."""

from src.agents.threat_detection_agent import ThreatDetectionAgent


def test_agent_returns_150_records():
    assert len(ThreatDetectionAgent().run()) == 150


def test_classifications_valid():
    valid = {"THREAT", "SUSPICIOUS", "BENIGN"}
    assert all(r["classification"] in valid for r in ThreatDetectionAgent().run())


def test_threat_has_critical_priority():
    for r in ThreatDetectionAgent().run():
        if r["classification"] == "THREAT":
            assert r["priority"] == "CRITICAL"
