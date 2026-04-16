"""Seed realistic AI audit log entries across all 6 EAIOS domains."""
import asyncio, uuid
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from src.config import settings
from src.models.ai_audit_log import AIAuditLog

ENTRIES = [
    # Finance & Accounting
    dict(agent_name="Financial Close Automation Agent", domain_id="01-finance-accounting",
         model_version="claude-opus-4-6", confidence_score=96.2, status="approved",
         triggered_by="james.hall@bp.com", action="Recommended automated accrual posting for Q1 close",
         input_context="Q1 trial balance shows 14 open accrual items totalling $4.2M. Historical close patterns from 2023-2025 provided.",
         output_summary="Post 12 of 14 accruals automatically. Flag 2 intercompany items exceeding $500K threshold for manual review. Estimated close acceleration: 2 days."),
    dict(agent_name="Cost Forecasting Agent", domain_id="01-finance-accounting",
         model_version="claude-opus-4-6", confidence_score=88.4, status="pending_review",
         triggered_by="sarah.chen@bp.com", action="Flagged OPEX overrun risk in North Sea assets",
         input_context="March actuals vs budget: maintenance costs $2.1M over plan. Weather downtime 18% above seasonal average.",
         output_summary="Project FY overrun of $8.4M (12% above budget) if trend continues. Recommend immediate review of 3 discretionary maintenance projects. Confidence moderate due to weather uncertainty."),

    # HR & Safety
    dict(agent_name="Safety Incident Prediction Agent", domain_id="02-human-resources-safety",
         model_version="claude-opus-4-6", confidence_score=91.7, status="auto_executed",
         triggered_by="system@eaios.bp.com", action="Issued high-risk fatigue alert for Night Shift B, Whiting Refinery",
         input_context="Overtime hours: 38% above baseline for 12 workers. 3 near-miss events logged in past 7 days. Temperature: 34°C.",
         output_summary="Probability of recordable incident in next 72h: 78%. Triggered mandatory rest period for 4 workers exceeding 60h threshold. Notified HSE supervisor."),
    dict(agent_name="Contractor Management Agent", domain_id="02-human-resources-safety",
         model_version="claude-opus-4-6", confidence_score=99.1, status="approved",
         triggered_by="linda.morrison@bp.com", action="Blocked contractor access — expired competency certificate",
         input_context="Contractor ID C-4821 attempted site access. Confined space entry certificate expired 3 days ago.",
         output_summary="Access automatically blocked. Notification sent to contractor and hiring manager. Re-certification booking link included. No manual override permitted for confined space work."),

    # IT & Cybersecurity
    dict(agent_name="Threat Detection Agent", domain_id="03-it-operations-cybersecurity",
         model_version="claude-opus-4-6", confidence_score=94.3, status="auto_executed",
         triggered_by="system@eaios.bp.com", action="Quarantined endpoint — lateral movement pattern detected",
         input_context="Host BPL-WS-0471 made 847 SMB connections in 4 minutes to 23 unique hosts. Normal baseline: <5 connections/hr.",
         output_summary="Quarantined host via NAC policy. Opened P1 incident INC0089234. SIEM correlation matched TTP T1021.002 (Remote Services: SMB/Windows Admin Shares). IR team notified."),
    dict(agent_name="Compliance Management Agent", domain_id="03-it-operations-cybersecurity",
         model_version="claude-opus-4-6", confidence_score=87.9, status="pending_review",
         triggered_by="david.okafor@bp.com", action="ISO 27001 gap identified — patch cadence below SLA",
         input_context="Vulnerability scan: 34 critical CVEs older than 30 days. SLA requires patching within 14 days for CVSS ≥9.",
         output_summary="Non-compliant with ISO 27001 A.12.6.1. Recommend exception request for 8 systems on change freeze. Remaining 26 systems: schedule emergency patching window this weekend."),

    # Commercial & Trading
    dict(agent_name="Artemis — Cross-Commodity Arbitrage", domain_id="04-commercial-trading",
         model_version="claude-opus-4-6", confidence_score=82.6, status="pending_review",
         triggered_by="trading-desk@bp.com", action="Identified $3.2M Brent/WTI arbitrage opportunity — awaiting trader approval",
         input_context="Brent-WTI spread widened to $6.40/bbl (12-month high). Freight differential: $1.20. Available capacity: 500k bbl VLCC.",
         output_summary="Net opportunity: $3.2M after freight and fees. Recommended trade: buy 500k WTI Cushing, sell Brent FOB. Risk: spread reversion probability 34% within 48h. Requires trader sign-off."),
    dict(agent_name="Artemis — Carbon Credit Trading", domain_id="04-commercial-trading",
         model_version="claude-opus-4-6", confidence_score=90.1, status="approved",
         triggered_by="emma.watts@bp.com", action="Executed EUA portfolio rebalancing — Q2 compliance shortfall mitigated",
         input_context="Q2 verified emissions: 1.24Mt CO2e. EUA holdings: 1.18Mt. Shortfall: 60,000 EUAs. Current price: €62.40.",
         output_summary="Purchased 65,000 EUAs at €62.40 (5,000 buffer). Total cost: €4.06M. Position now compliant with EU ETS. Transaction logged in compliance register."),

    # Manufacturing & Plant Ops
    dict(agent_name="Refiner AI — Predictive Maintenance", domain_id="05-manufacturing-plant-operations",
         model_version="claude-opus-4-6", confidence_score=93.8, status="auto_executed",
         triggered_by="system@eaios.bp.com", action="Scheduled emergency inspection — Compressor C-201 bearing failure predicted",
         input_context="Vibration RMS: 14.2 mm/s (ISO 10816 Zone D). Temperature delta: +18°C vs baseline. Oil particle count: 847 particles/ml.",
         output_summary="Predicted bearing failure within 72-96 hours (93.8% confidence). Work order WO-2024-8847 auto-created. Spare bearing confirmed in stock. Recommended maintenance window: Tuesday 02:00-06:00."),
    dict(agent_name="Refiner AI — Quality Control", domain_id="05-manufacturing-plant-operations",
         model_version="claude-opus-4-6", confidence_score=98.2, status="rejected",
         triggered_by="plant-control@bp.com", action="Recommended crude blend adjustment to maintain Jet A-1 smoke point",
         input_context="Crude blend: 60% Arab Light, 40% Forties. Current smoke point: 19mm (spec min 25mm). Naphtha cut point: 165°C.",
         output_summary="Increase naphtha cut point to 175°C and reduce Forties share to 30%. Predicted smoke point improvement to 27mm. Operator overrode: production schedule constraints cited."),

    # Supply Chain
    dict(agent_name="Demand-Supply Matching Agent", domain_id="06-supply-chain-logistics",
         model_version="claude-opus-4-6", confidence_score=85.5, status="approved",
         triggered_by="supply-ops@bp.com", action="Rerouted Rotterdam cargo to Antwerp — demand spike detected",
         input_context="Antwerp ullage: 340k bbl available. Rotterdam tankage: full. Demand forecast: +180k bbl/day this week.",
         output_summary="Redirect MV Nordic Tern (120k bbl jet) from Rotterdam R5 to Antwerp T14. Estimated saving: $180k vs spot purchase. ETA adjustment: +6 hours. Customs pre-cleared."),
    dict(agent_name="Inventory Management Agent", domain_id="06-supply-chain-logistics",
         model_version="claude-opus-4-6", confidence_score=77.3, status="pending_review",
         triggered_by="inventory@bp.com", action="Flagged potential stockout — Aviation Jet A-1 Heathrow T5",
         input_context="Current stock: 820k litres. Daily consumption: 420k litres. Lead time: 3 days. Safety stock: 500k litres.",
         output_summary="Stock falls below safety stock in 2.8 days. Recommend immediate replenishment order: 1.2M litres. Confidence 77% due to BA schedule uncertainty. Manual confirmation recommended before ordering."),
]


async def seed():
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        for i, entry in enumerate(ENTRIES):
            ts = datetime.utcnow() - timedelta(hours=i * 6 + 1)
            session.add(AIAuditLog(id=uuid.uuid4(), created_at=ts, updated_at=ts, **entry))
        await session.commit()
        print(f"Seeded {len(ENTRIES)} AI audit log entries.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
