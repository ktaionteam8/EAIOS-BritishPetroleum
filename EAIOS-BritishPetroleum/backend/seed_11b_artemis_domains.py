"""MICRO-11b — Seed ARTEMIS Castrol, Aviation, and Carbon tables.

Run from backend/ directory:
    python seed_11b_artemis_domains.py
"""
import asyncio
import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from src.models.database import engine, Base
from src.models.artemis_castrol import ArtemisBaseOilPrice, ArtemisCastrolPricingRec
from src.models.artemis_aviation import (
    ArtemisAviationAirport, ArtemisAviationForecast, ArtemisAviationContract,
)
from src.models.artemis_carbon import ArtemisCarbonPosition, ArtemisCarbonRecommendation

AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
_now = datetime.utcnow


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        today = _now().replace(hour=0, minute=0, second=0, microsecond=0)

        # ── Base Oil Prices ───────────────────────────────────────────────────
        base_oils = [
            ArtemisBaseOilPrice(
                grade="Group I SN 150",
                price_per_mt=745.0, price_display="$745/MT",
                change_pct=0.2, change_display="+0.2%",
                alert_status="normal", price_date=today,
            ),
            ArtemisBaseOilPrice(
                grade="Group II 100N",
                price_per_mt=862.0, price_display="$862/MT",
                change_pct=0.4, change_display="+0.4%",
                alert_status="normal", price_date=today,
            ),
            ArtemisBaseOilPrice(
                grade="Group III 4cSt",
                price_per_mt=1124.0, price_display="$1,124/MT",
                change_pct=-0.6, change_display="-0.6%",
                alert_status="alert", price_date=today,
            ),
            ArtemisBaseOilPrice(
                grade="Group III 6cSt",
                price_per_mt=1198.0, price_display="$1,198/MT",
                change_pct=0.1, change_display="+0.1%",
                alert_status="normal", price_date=today,
            ),
        ]
        db.add_all(base_oils)

        # ── Castrol Pricing Recs ──────────────────────────────────────────────
        pricing = [
            ArtemisCastrolPricingRec(
                sku_code="MAGNATEC-5W30-4L",
                sku_name="Castrol MAGNATEC 5W-30 4L",
                segment="Passenger Car",
                geography="APAC",
                current_price_per_litre=3.42, recommended_price_per_litre=3.49,
                current_display="$3.42/L", recommended_display="$3.49/L",
                margin_impact_pct=2.1, margin_impact_display="+2.1%",
                rec_status="update_available", confidence_pct=94.1,
                competitor_benchmark="$3.51/L", is_intraday_update=False,
                generated_at=today,
            ),
            ArtemisCastrolPricingRec(
                sku_code="EDGE-0W40-5L",
                sku_name="Castrol EDGE 0W-40 5L",
                segment="Performance",
                geography="Europe",
                current_price_per_litre=6.85, recommended_price_per_litre=6.85,
                current_display="€6.85/L", recommended_display="€6.85/L",
                margin_impact_pct=0.0, margin_impact_display="0.0%",
                rec_status="at_recommended", confidence_pct=97.2,
                competitor_benchmark="€6.90/L", is_intraday_update=False,
                generated_at=today,
            ),
            ArtemisCastrolPricingRec(
                sku_code="OPTIGEAR-320-20L",
                sku_name="Castrol Optigear 320 20L",
                segment="Industrial B2B",
                geography="Middle East",
                current_price_per_litre=2.18, recommended_price_per_litre=2.30,
                current_display="$2.18/L", recommended_display="$2.30/L",
                margin_impact_pct=5.5, margin_impact_display="+5.5%",
                rec_status="update_available", confidence_pct=89.4,
                competitor_benchmark=None, is_intraday_update=True,
                generated_at=today,
            ),
        ]
        db.add_all(pricing)

        # ── Aviation Airports ─────────────────────────────────────────────────
        airports = [
            ArtemisAviationAirport(id="ap-lhr", iata_code="LHR", airport_name="London Heathrow",
                city="London", country="United Kingdom", region="Europe",
                primary_airlines="British Airways, Virgin Atlantic"),
            ArtemisAviationAirport(id="ap-sin", iata_code="SIN", airport_name="Singapore Changi",
                city="Singapore", country="Singapore", region="APAC",
                primary_airlines="Singapore Airlines, Scoot"),
            ArtemisAviationAirport(id="ap-dxb", iata_code="DXB", airport_name="Dubai International",
                city="Dubai", country="UAE", region="Middle East",
                primary_airlines="Emirates, flydubai"),
            ArtemisAviationAirport(id="ap-jfk", iata_code="JFK", airport_name="John F. Kennedy International",
                city="New York", country="USA", region="Americas",
                primary_airlines="American Airlines, Delta, JetBlue"),
            ArtemisAviationAirport(id="ap-cdg", iata_code="CDG", airport_name="Charles de Gaulle",
                city="Paris", country="France", region="Europe",
                primary_airlines="Air France, Transavia"),
        ]
        db.add_all(airports)

        # ── Aviation Forecasts ────────────────────────────────────────────────
        forecasts = [
            ArtemisAviationForecast(
                airport_id="ap-lhr", iata_code="LHR", forecast_date=today,
                d30_actual_ml=42.8, d30_display="42.8ML",
                d90_forecast_ml=41.2, d90_display="41.2ML",
                d90_delta_pct=-3.7, d90_delta_display="-3.7%",
                confidence_interval_pct=12.0, model_mape_pct=88.4,
            ),
            ArtemisAviationForecast(
                airport_id="ap-sin", iata_code="SIN", forecast_date=today,
                d30_actual_ml=38.1, d30_display="38.1ML",
                d90_forecast_ml=40.5, d90_display="40.5ML",
                d90_delta_pct=6.3, d90_delta_display="+6.3%",
                confidence_interval_pct=9.5, model_mape_pct=91.2,
            ),
            ArtemisAviationForecast(
                airport_id="ap-dxb", iata_code="DXB", forecast_date=today,
                d30_actual_ml=58.3, d30_display="58.3ML",
                d90_forecast_ml=61.9, d90_display="61.9ML",
                d90_delta_pct=6.2, d90_delta_display="+6.2%",
                confidence_interval_pct=11.0, model_mape_pct=87.8,
            ),
            ArtemisAviationForecast(
                airport_id="ap-jfk", iata_code="JFK", forecast_date=today,
                d30_actual_ml=35.6, d30_display="35.6ML",
                d90_forecast_ml=34.1, d90_display="34.1ML",
                d90_delta_pct=-4.2, d90_delta_display="-4.2%",
                confidence_interval_pct=13.0, model_mape_pct=86.5,
            ),
        ]
        db.add_all(forecasts)

        # ── Aviation Contracts ────────────────────────────────────────────────
        contracts = [
            ArtemisAviationContract(
                airport_id="ap-lhr", iata_code="LHR", airline="British Airways",
                contract_type="index_linked", status="renewal_due",
                expiry_date=today + timedelta(days=72), days_to_renewal=72,
                annual_volume_ml=480.0, contract_value_usd=420_000_000.0,
                recommended_structure="fixed_plus_index",
                scenario_baseline_usd=415_000_000.0,
                pack_generated_at=_now() - timedelta(days=18),
            ),
            ArtemisAviationContract(
                airport_id="ap-sin", iata_code="SIN", airline="Singapore Airlines",
                contract_type="fixed_price", status="active",
                expiry_date=today + timedelta(days=245), days_to_renewal=245,
                annual_volume_ml=390.0, contract_value_usd=380_000_000.0,
                recommended_structure=None, scenario_baseline_usd=None,
                pack_generated_at=None,
            ),
            ArtemisAviationContract(
                airport_id="ap-dxb", iata_code="DXB", airline="Emirates",
                contract_type="index_linked", status="negotiating",
                expiry_date=today + timedelta(days=15), days_to_renewal=15,
                annual_volume_ml=620.0, contract_value_usd=590_000_000.0,
                recommended_structure="volume_hedged",
                scenario_baseline_usd=585_000_000.0,
                pack_generated_at=_now() - timedelta(days=75),
            ),
        ]
        db.add_all(contracts)

        # ── Carbon Positions ──────────────────────────────────────────────────
        positions = [
            ArtemisCarbonPosition(
                credit_type="EU ETS Dec-25", credit_category="eu_ets", vintage_year=2025,
                holdings_tonnes=180_000, holdings_display="180,000t",
                obligation_tonnes=167_600, obligation_display="167,600t",
                net_position_tonnes=12_400, net_position_display="+12,400t",
                current_price=48.20, price_display="€48.20", price_currency="EUR",
                market_value_usd=10_425_840.0, position_date=today,
            ),
            ArtemisCarbonPosition(
                credit_type="EU ETS Dec-26", credit_category="eu_ets", vintage_year=2026,
                holdings_tonnes=95_000, holdings_display="95,000t",
                obligation_tonnes=None, obligation_display="—",
                net_position_tonnes=95_000, net_position_display="+95,000t",
                current_price=51.40, price_display="€51.40", price_currency="EUR",
                market_value_usd=5_232_300.0, position_date=today,
            ),
            ArtemisCarbonPosition(
                credit_type="VCS Forestry", credit_category="vcs", vintage_year=2024,
                holdings_tonnes=45_000, holdings_display="45,000t",
                obligation_tonnes=None, obligation_display="—",
                net_position_tonnes=45_000, net_position_display="+45,000t",
                current_price=8.75, price_display="$8.75", price_currency="USD",
                market_value_usd=393_750.0, position_date=today,
            ),
            ArtemisCarbonPosition(
                credit_type="Gold Standard", credit_category="gold_standard", vintage_year=2024,
                holdings_tonnes=20_000, holdings_display="20,000t",
                obligation_tonnes=None, obligation_display="—",
                net_position_tonnes=20_000, net_position_display="+20,000t",
                current_price=14.20, price_display="$14.20", price_currency="USD",
                market_value_usd=284_000.0, position_date=today,
            ),
        ]
        db.add_all(positions)

        # ── Carbon Recommendations ────────────────────────────────────────────
        recs = [
            ArtemisCarbonRecommendation(
                credit_type="EU ETS Dec-26",
                action="buy", urgency="high",
                quantity_tonnes=25_000, target_price=50.80,
                expected_cost_benefit_usd=380_000.0,
                rationale="Forward curve backwardation creates buy opportunity; "
                           "EU ETS reform tightens 2026 supply by est. 8%.",
                compliance_driver="EU ETS Phase IV 2026 obligation coverage",
                status="open",
                tcfd_category="transition_risk",
                expires_at=_now() + timedelta(days=5),
            ),
            ArtemisCarbonRecommendation(
                credit_type="VCS Forestry",
                action="hold", urgency="low",
                quantity_tonnes=None, target_price=None,
                expected_cost_benefit_usd=None,
                rationale="VCMI integrity standard adoption expected to lift VCS "
                           "quality premiums in H2 2025.",
                compliance_driver=None,
                status="open",
                tcfd_category="physical_risk",
                expires_at=None,
            ),
            ArtemisCarbonRecommendation(
                credit_type="EU ETS Dec-25",
                action="sell", urgency="medium",
                quantity_tonnes=8_000, target_price=49.50,
                expected_cost_benefit_usd=95_200.0,
                rationale="Surplus 12,400t exceeds optimal compliance buffer. "
                           "Realise gains before Q4 compliance surrender deadline.",
                compliance_driver="SOX reporting — P&L recognition timing",
                status="open",
                tcfd_category="transition_risk",
                expires_at=_now() + timedelta(days=21),
            ),
        ]
        db.add_all(recs)

        await db.commit()
        print("✅ seed_11b: Castrol, Aviation, Carbon data seeded.")


if __name__ == "__main__":
    asyncio.run(seed())
