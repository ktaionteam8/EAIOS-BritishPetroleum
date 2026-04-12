"""Tests for CastrolPricingAgent."""

from src.agents.castrol_pricing_agent import CastrolPricingAgent


def test_agent_returns_70_records():
    assert len(CastrolPricingAgent().run()) == 70


def test_actions_are_valid():
    results = CastrolPricingAgent().run()
    valid = {"PRICE_UP", "PRICE_DOWN", "HOLD"}
    assert all(r["action"] in valid for r in results)


def test_recommended_price_is_positive():
    for r in CastrolPricingAgent().run():
        assert r["recommended_price"] > 0
