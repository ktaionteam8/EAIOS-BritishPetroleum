"""MICRO-11a — Seed ARTEMIS core, arbitrage, and compliance tables.

Run from backend/ directory:
    python seed_11a_artemis_core.py
"""
import asyncio
import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from src.models.database import engine
from src.models.artemis_core import (
    ArtemisAgentStatus, ArtemisModelRegistry,
    ArtemisAuditLog, ArtemisComplianceEvent,
)
from src.models.artemis_arbitrage import (
    ArtemisArbitrageOpportunity, ArtemisArbitrageMetric,
)

AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
_now = datetime.utcnow


async def seed():
    async with AsyncSessionLocal() as db:
        # ── Agent Status ──────────────────────────────────────────────────────
        agents = [
            ArtemisAgentStatus(
                id="agent-trade",
                agent_key="artemis-trade",
                agent_name="Trade Intelligence Agent",
                scope="Global crude, gas, power & carbon spreads",
                status="active",
                signals_today=14,
                last_signal_at=_now() - timedelta(minutes=23),
                primary_metric_value="$2.4M",
                primary_metric_label="P&L identified today",
            ),
            ArtemisAgentStatus(
                id="agent-castrol",
                agent_key="artemis-castrol",
                agent_name="Castrol Pricing Agent",
                scope="B2B lubricant pricing across 120+ markets",
                status="active",
                signals_today=37,
                last_signal_at=_now() - timedelta(minutes=8),
                primary_metric_value="94%",
                primary_metric_label="Recommendation confidence",
            ),
            ArtemisAgentStatus(
                id="agent-aviation",
                agent_key="artemis-aviation",
                agent_name="Aviation Fuel Agent",
                scope="Jet A-1 demand forecasting & contract pipeline",
                status="active",
                signals_today=8,
                last_signal_at=_now() - timedelta(hours=1),
                primary_metric_value="88.4%",
                primary_metric_label="Forecast accuracy (MAPE)",
            ),
            ArtemisAgentStatus(
                id="agent-carbon",
                agent_key="artemis-carbon",
                agent_name="Carbon Portfolio Agent",
                scope="EU ETS, VCS, Gold Standard & CORSIA credits",
                status="active",
                signals_today=5,
                last_signal_at=_now() - timedelta(minutes=45),
                primary_metric_value="+12,400t",
                primary_metric_label="EU ETS net surplus",
            ),
        ]
        db.add_all(agents)

        # ── Model Registry ────────────────────────────────────────────────────
        models = [
            ArtemisModelRegistry(
                id="model-spread-xgb",
                model_name="SpreadPredictor-XGBoost",
                version="v3.2.1",
                status="production",
                accuracy_pct=91.4,
                drift_status="stable",
                next_review_days=12,
                agent_key="artemis-trade",
                last_validated_at=_now() - timedelta(days=18),
            ),
            ArtemisModelRegistry(
                id="model-castrol-lstm",
                model_name="CastrolPricing-LSTM",
                version="v2.1.0",
                status="production",
                accuracy_pct=94.1,
                drift_status="stable",
                next_review_days=28,
                agent_key="artemis-castrol",
                last_validated_at=_now() - timedelta(days=2),
            ),
            ArtemisModelRegistry(
                id="model-aviation-prophet",
                model_name="AviationDemand-Prophet",
                version="v1.8.3",
                status="production",
                accuracy_pct=88.4,
                drift_status="review",
                next_review_days=5,
                agent_key="artemis-aviation",
                last_validated_at=_now() - timedelta(days=25),
            ),
            ArtemisModelRegistry(
                id="model-carbon-gp",
                model_name="CarbonPrice-GaussianProcess",
                version="v1.3.0",
                status="production",
                accuracy_pct=86.7,
                drift_status="stable",
                next_review_days=19,
                agent_key="artemis-carbon",
                last_validated_at=_now() - timedelta(days=11),
            ),
        ]
        db.add_all(models)

        # ── Audit Log ─────────────────────────────────────────────────────────
        audits = [
            ArtemisAuditLog(
                id="audit-001",
                action_type="recommendation_generated",
                agent_key="artemis-trade",
                recommendation_summary="Buy Brent Dec-25 / Sell WTI Dec-25 spread",
                estimated_pnl_usd=480000.0,
                confidence_pct=87.3,
                regulatory_tier="tier2_human_review",
                approver_id=None,
                created_at=_now() - timedelta(hours=2),
            ),
            ArtemisAuditLog(
                id="audit-002",
                action_type="recommendation_approved",
                agent_key="artemis-trade",
                recommendation_summary="Buy Brent Dec-25 / Sell WTI Dec-25 spread",
                estimated_pnl_usd=480000.0,
                confidence_pct=87.3,
                regulatory_tier="tier2_human_review",
                approver_id="trader.smith@bp.com",
                created_at=_now() - timedelta(hours=1, minutes=45),
            ),
            ArtemisAuditLog(
                id="audit-003",
                action_type="recommendation_generated",
                agent_key="artemis-castrol",
                recommendation_summary="Update 14 SKUs in APAC: avg +2.3% margin improvement",
                estimated_pnl_usd=92000.0,
                confidence_pct=94.1,
                regulatory_tier="tier1_automated",
                approver_id=None,
                created_at=_now() - timedelta(minutes=30),
            ),
        ]
        db.add_all(audits)

        # ── Compliance Events ─────────────────────────────────────────────────
        compliance = [
            ArtemisComplianceEvent(
                id="comp-sox-001",
                framework="SOX",
                status="active",
                detail="Quarterly SOX 302/906 AI decision log certification due",
                jurisdiction="NYSE",
                agent_key=None,
            ),
            ArtemisComplianceEvent(
                id="comp-fca-001",
                framework="FCA SYSC 10A",
                status="active",
                detail="Algorithm change notification — SpreadPredictor v3.2.1 deployed",
                jurisdiction="UK",
                agent_key="artemis-trade",
            ),
            ArtemisComplianceEvent(
                id="comp-euai-001",
                framework="EU AI Act",
                status="active",
                detail="Tier 2 high-risk AI annual conformity assessment window opens",
                jurisdiction="EU",
                agent_key=None,
            ),
        ]
        db.add_all(compliance)

        # ── Arbitrage Opportunities ───────────────────────────────────────────
        opps = [
            ArtemisArbitrageOpportunity(
                id="arb-001",
                spread_name="Brent-WTI Dec-25",
                spread_type="crude_differential",
                leg_a="ICE Brent Dec-25",
                leg_b="NYMEX WTI Dec-25",
                current_level="$5.40/bbl",
                current_level_numeric=5.40,
                percentile_rank=84,
                estimated_pnl_usd=480000.0,
                execution_window="48h",
                confidence_pct=87.3,
                status="open",
                regulatory_tier="tier2_human_review",
                approved_by=None,
                approved_at=None,
            ),
            ArtemisArbitrageOpportunity(
                id="arb-002",
                spread_name="TTF-NBP Q1-26",
                spread_type="gas_basis",
                leg_a="TTF Q1-26",
                leg_b="NBP Q1-26",
                current_level="€1.82/MWh",
                current_level_numeric=1.82,
                percentile_rank=91,
                estimated_pnl_usd=310000.0,
                execution_window="24h",
                confidence_pct=92.1,
                status="open",
                regulatory_tier="tier2_human_review",
                approved_by=None,
                approved_at=None,
            ),
            ArtemisArbitrageOpportunity(
                id="arb-003",
                spread_name="EUA Dec-25 vs Spot",
                spread_type="carbon_calendar",
                leg_a="EUA Dec-25 Futures",
                leg_b="EUA Spot",
                current_level="€2.10/tonne",
                current_level_numeric=2.10,
                percentile_rank=76,
                estimated_pnl_usd=185000.0,
                execution_window="72h",
                confidence_pct=81.5,
                status="open",
                regulatory_tier="tier2_human_review",
                approved_by=None,
                approved_at=None,
            ),
        ]
        db.add_all(opps)

        # ── Arbitrage Metrics (last 7 days) ───────────────────────────────────
        for i in range(7):
            db.add(ArtemisArbitrageMetric(
                metric_date=_now().replace(hour=0, minute=0, second=0) - timedelta(days=i),
                spreads_monitored=142 + i,
                opportunities_detected=12 + (i % 4),
                opportunities_approved=8 + (i % 3),
                total_pnl_identified_usd=1_800_000.0 + i * 120_000,
                total_pnl_realised_usd=1_200_000.0 + i * 80_000,
                avg_signal_latency_seconds=2.3 - i * 0.05,
            ))

        await db.commit()
        print("✅ seed_11a: agents, models, audit log, compliance, arbitrage seeded.")


if __name__ == "__main__":
    asyncio.run(seed())
