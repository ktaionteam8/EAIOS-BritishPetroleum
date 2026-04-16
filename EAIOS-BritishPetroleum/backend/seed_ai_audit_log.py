"""Seed AI audit log entries — all EAIOS agents, domains 01-04 (part 1 of 2)."""
import asyncio, uuid
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from src.config import settings
from src.models.ai_audit_log import AIAuditLog

ENTRIES = [
    # ── Domain 01: Finance & Accounting ────────────────────────────────────
    dict(agent_name="Financial Close Automation Agent", domain_id="01-finance-accounting",
         model_version="claude-opus-4-6", confidence_score=96.2, status="approved",
         triggered_by="james.hall@bp.com", action="Recommended automated accrual posting for Q1 close",
         input_context="Q1 trial balance: 14 open accrual items totalling $4.2M. Historical close patterns 2023-2025 provided.",
         output_summary="Post 12 of 14 accruals automatically. Flag 2 intercompany items >$500K for manual review. Close acceleration: 2 days."),
    dict(agent_name="JV Accounting Agent", domain_id="01-finance-accounting",
         model_version="claude-opus-4-6", confidence_score=88.7, status="pending_review",
         triggered_by="richard.blake@bp.com", action="Detected $1.4M billing discrepancy — Azeri Light JV Q1 cash call",
         input_context="BP 36% share. Invoice received $12.8M; expected $11.4M per agreed AFE. Overhead allocation method disputed.",
         output_summary="Overhead discrepancy $1.4M. Formal query raised to JV operator. Payment held pending clarification. Resolution ETA: 5 business days."),
    dict(agent_name="Cost Forecasting Agent", domain_id="01-finance-accounting",
         model_version="claude-opus-4-6", confidence_score=88.4, status="pending_review",
         triggered_by="sarah.chen@bp.com", action="Flagged OPEX overrun risk — North Sea assets FY2026",
         input_context="March actuals vs budget: maintenance $2.1M over plan. Weather downtime 18% above seasonal average.",
         output_summary="FY overrun projected $8.4M (12% above budget). Recommend review of 3 discretionary maintenance projects. Confidence moderate due to weather uncertainty."),
    dict(agent_name="Tax Compliance Agent", domain_id="01-finance-accounting",
         model_version="claude-opus-4-6", confidence_score=97.5, status="auto_executed",
         triggered_by="system@eaios.bp.com", action="Filed quarterly VAT returns — UK, Netherlands, Germany",
         input_context="Q1 VAT data reconciled: £4.2M (UK via MTD), €2.8M (NL), €1.1M (DE). Filing deadlines: April 30.",
         output_summary="All 3 returns filed on time. Refund claim €440K submitted for Netherlands. No penalties triggered. Audit trail archived."),
    dict(agent_name="Treasury Management Agent", domain_id="01-finance-accounting",
         model_version="claude-opus-4-6", confidence_score=91.3, status="approved",
         triggered_by="treasury@bp.com", action="Recommended FX hedge — $250M USD/GBP 6-month forward",
         input_context="North Sea USD revenues; 60% GBP operating costs. USD/GBP spot 0.792; 6-month forward 0.788.",
         output_summary="Recommend $250M forward at 0.788. Hedging cost $1M vs $6.2M downside risk at 1σ. Approved by Treasury Director."),
    dict(agent_name="Revenue Analytics Agent", domain_id="01-finance-accounting",
         model_version="claude-opus-4-6", confidence_score=84.6, status="approved",
         triggered_by="fin-analytics@bp.com", action="Identified 14 negative-margin Castrol SKUs requiring urgent pricing action",
         input_context="Q1 Castrol lubricants revenue -8% YoY. 14 SKUs negative contribution margin. Group II base oil feedstock +22%.",
         output_summary="14 SKUs generating -£2.1M total. Recommend 8-12% uplift on 11 SKUs; discontinue 3 low-volume lines. Recovery £1.8M annualised."),

    # ── Domain 02: Human Resources & Safety ───────────────────────────────
    dict(agent_name="Workforce Planning Agent", domain_id="02-human-resources-safety",
         model_version="claude-opus-4-6", confidence_score=82.1, status="pending_review",
         triggered_by="hr-analytics@bp.com", action="Forecast 47-person refinery technician shortfall by Q3 2026",
         input_context="Attrition 14% YTD (target 9%). Active projects require 180 technicians; current headcount 133.",
         output_summary="47-person gap projected Q3. Recommend expedite 23 open requisitions, extend 12 contractor contracts, launch apprenticeship cohort."),
    dict(agent_name="Skills Gap Analysis Agent", domain_id="02-human-resources-safety",
         model_version="claude-opus-4-6", confidence_score=86.9, status="approved",
         triggered_by="learning@bp.com", action="Mapped 142 engineers against net-zero transition skill requirements",
         input_context="Net-zero 2050 roadmap: 60% of engineering roles need renewable competencies by 2028. Baseline: 18%.",
         output_summary="Gap: 42% of 142 engineers need upskilling. Priority: offshore wind (38 roles), hydrogen safety (21), carbon capture (17). Investment £1.4M over 18 months."),
    dict(agent_name="Talent Analytics Agent", domain_id="02-human-resources-safety",
         model_version="claude-opus-4-6", confidence_score=79.4, status="pending_review",
         triggered_by="hr-director@bp.com", action="High flight-risk alert — 9 senior engineers, Commercial Trading division",
         input_context="Engagement scores -18% QoQ. 9 engineers >10y tenure showing withdrawal signals. External market premium: 34%.",
         output_summary="Flight-risk >70% for 9 individuals. Recommend targeted retention conversations, comp benchmarking, accelerated promotion for 3 high performers."),
    dict(agent_name="Safety Incident Prediction Agent", domain_id="02-human-resources-safety",
         model_version="claude-opus-4-6", confidence_score=91.7, status="auto_executed",
         triggered_by="system@eaios.bp.com", action="Issued fatigue alert — Night Shift B, Whiting Refinery",
         input_context="Overtime 38% above baseline for 12 workers. 3 near-miss events in 7 days. Ambient temperature: 34°C.",
         output_summary="Incident probability next 72h: 78%. Mandatory rest for 4 workers >60h threshold. HSE supervisor notified. Work orders reassigned."),
    dict(agent_name="Contractor Management Agent", domain_id="02-human-resources-safety",
         model_version="claude-opus-4-6", confidence_score=99.1, status="approved",
         triggered_by="linda.morrison@bp.com", action="Blocked site access — contractor confined space certificate expired",
         input_context="Contractor C-4821 attempted site access. Confined space entry cert expired 3 days ago.",
         output_summary="Access blocked automatically. Re-certification booking link sent to contractor and hiring manager. No manual override permitted for confined space work."),
    dict(agent_name="Energy Transition Reskilling Agent", domain_id="02-human-resources-safety",
         model_version="claude-opus-4-6", confidence_score=88.3, status="approved",
         triggered_by="net-zero@bp.com", action="Generated 34 personalised learning pathways — upstream engineers to offshore wind",
         input_context="34 upstream engineers targeted for offshore wind. Current skills: subsea, well engineering, HSE. Target: turbine, HVDC, marine ops.",
         output_summary="34 pathways generated, avg 14 months. 12 fast-track eligible (80%+ skills overlap). Estimated saving vs external hire: £2.3M."),

    # ── Domain 03: IT Operations & Cybersecurity ──────────────────────────
    dict(agent_name="IT Service Desk Agent", domain_id="03-it-operations-cybersecurity",
         model_version="claude-opus-4-6", confidence_score=94.8, status="auto_executed",
         triggered_by="system@eaios.bp.com", action="Auto-resolved 847 password reset tickets via self-service automation",
         input_context="Queue: 1,204 open tickets. 847 classified P3 password reset. SLA breach risk within 4h.",
         output_summary="847 resets completed automatically. SLA maintained. 12 P1 incidents escalated to on-call. 345 P3/P4 queued for morning shift."),
    dict(agent_name="Threat Detection Agent", domain_id="03-it-operations-cybersecurity",
         model_version="claude-opus-4-6", confidence_score=94.3, status="auto_executed",
         triggered_by="system@eaios.bp.com", action="Quarantined endpoint — lateral movement pattern detected (TTP T1021.002)",
         input_context="BPL-WS-0471: 847 SMB connections in 4 min to 23 unique hosts. Normal baseline: <5 connections/hr.",
         output_summary="Host quarantined via NAC. P1 incident INC0089234 opened. SIEM correlation matched T1021.002. Forensic image scheduled 02:00."),
    dict(agent_name="OT Security Monitoring Agent", domain_id="03-it-operations-cybersecurity",
         model_version="claude-opus-4-6", confidence_score=96.4, status="auto_executed",
         triggered_by="system@eaios.bp.com", action="Blocked anomalous PLC write command — Rotterdam CDU control network",
         input_context="Modbus FC16 (write multiple registers) from unexpected workstation EWS-04 targeting CDU setpoint registers.",
         output_summary="Command blocked at OT firewall. EWS-04 isolated from control network. ICS security team investigating — likely misconfigured HMI update script."),
    dict(agent_name="Shadow IT Rationalization Agent", domain_id="03-it-operations-cybersecurity",
         model_version="claude-opus-4-6", confidence_score=87.2, status="pending_review",
         triggered_by="ciso@bp.com", action="Discovered 23 unsanctioned SaaS applications across 3 business units",
         input_context="CASB scan: 23 unapproved SaaS tools. 7 handling sensitive data; 4 with data outside approved residency regions.",
         output_summary="Risk HIGH (4 tools, data residency breach), MEDIUM (3), LOW (16). Recommend: block 4, migrate 3 to sanctioned alternatives, govern 16. Saving: £180K/yr."),
    dict(agent_name="Infrastructure Monitoring Agent", domain_id="03-it-operations-cybersecurity",
         model_version="claude-opus-4-6", confidence_score=92.7, status="auto_executed",
         triggered_by="system@eaios.bp.com", action="Predicted disk failure — production DB server BPL-DB-PROD-02 within 18 days",
         input_context="SMART data: reallocated sectors +12%/week. Health score: 67%. Failure projection: 14-21 days at current rate.",
         output_summary="Replacement volume provisioned in Supabase. Hot-standby sync initiated. Physical disk replacement in next scheduled maintenance window."),
    dict(agent_name="Compliance Management Agent", domain_id="03-it-operations-cybersecurity",
         model_version="claude-opus-4-6", confidence_score=87.9, status="pending_review",
         triggered_by="david.okafor@bp.com", action="ISO 27001 A.12.6.1 gap — 34 critical CVEs unpatched beyond SLA",
         input_context="Vuln scan: 34 critical CVEs older than 30 days. SLA requires CVSS ≥9 patched within 14 days.",
         output_summary="Non-compliant. Exception request for 8 change-freeze systems. Emergency patching window this weekend for remaining 26. CAB approval required."),

    # ── Domain 04: Commercial & Trading ───────────────────────────────────
    dict(agent_name="Crude Trading Analytics Agent", domain_id="04-commercial-trading",
         model_version="claude-opus-4-6", confidence_score=85.9, status="approved",
         triggered_by="crude-desk@bp.com", action="Recommended Basrah Light purchase — Middle East OSP cut opportunity",
         input_context="Middle East OSP cut $1.20/bbl vs Brent. Basrah Light supply at 6-year high. Asian refinery demand softer than forecast.",
         output_summary="Buy 2 cargoes Basrah Light May loading at Brent -$2.80. Net opportunity $3.8M. Execution window 48h before next OSP revision."),
    dict(agent_name="Carbon Credit Trading Agent", domain_id="04-commercial-trading",
         model_version="claude-opus-4-6", confidence_score=90.1, status="approved",
         triggered_by="emma.watts@bp.com", action="Executed EUA portfolio rebalancing — Q2 compliance shortfall mitigated",
         input_context="Q2 verified emissions: 1.24Mt CO2e. EUA holdings: 1.18Mt. Shortfall: 60,000 EUAs. EUA spot: €62.40.",
         output_summary="Purchased 65,000 EUAs at €62.40 (5,000 buffer). Total cost €4.06M. Position now compliant. Transaction logged in compliance register."),
    dict(agent_name="Castrol Pricing Engine Agent", domain_id="04-commercial-trading",
         model_version="claude-opus-4-6", confidence_score=88.1, status="approved",
         triggered_by="castrol-pricing@bp.com", action="Generated margin-optimised price list — 14 APAC markets Q2 2026",
         input_context="Group II base oil feedstock +8% QoQ. Competitor intelligence: Shell Helix and Mobil 1 unchanged in 9 of 14 markets.",
         output_summary="Recommend 4-7% price increase across 14 markets. Projected margin improvement £4.2M annualised. Estimated volume impact: -3%."),
    dict(agent_name="Aviation Fuel Forecasting Agent", domain_id="04-commercial-trading",
         model_version="claude-opus-4-6", confidence_score=86.4, status="approved",
         triggered_by="aviation@bp.com", action="Forecast Jet A-1 demand uplift — Q3 European summer peak",
         input_context="IATA: European seat capacity +14% Q3 vs 2024. BP market share: 23% across 18 airports. Refinery Jet output constrained.",
         output_summary="Demand uplift: 380k MT Jet A-1 across 18 airports Q3. Recommend advance 3rd-party purchase 120k MT. Forward price lock at $780/MT."),
    dict(agent_name="LNG Trading Platform Agent", domain_id="04-commercial-trading",
         model_version="claude-opus-4-6", confidence_score=83.7, status="pending_review",
         triggered_by="lng-desk@bp.com", action="Flagged JKM-TTF spread opportunity — $2.1M net diversion value",
         input_context="JKM spot: $12.40/MMBtu. TTF: $10.30. Diversion cost Sabine Pass→Asia: $1.50/MMBtu. Net spread: $0.60/MMBtu.",
         output_summary="Diverted cargo opportunity: 3.4 TBtu × $0.60 = $2.1M net. JKM liquidity thin; recommend partial execution 1.5 TBtu only."),
    dict(agent_name="Cross-Commodity Arbitrage Agent", domain_id="04-commercial-trading",
         model_version="claude-opus-4-6", confidence_score=82.6, status="pending_review",
         triggered_by="trading-desk@bp.com", action="Identified $3.2M Brent/WTI arbitrage — awaiting trader sign-off",
         input_context="Brent-WTI spread: $6.40/bbl (12-month high). Freight differential: $1.20. VLCC available: 500k bbl.",
         output_summary="Net opportunity $3.2M: buy 500k bbl WTI Cushing, sell Brent FOB. Spread reversion probability 34% within 48h. Requires trader approval."),
]


async def seed():
    engine = create_async_engine(settings.database_url, echo=False)
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

    async with async_session() as session:
        for i, entry in enumerate(ENTRIES):
            ts = datetime.utcnow() - timedelta(hours=i * 4 + 1)
            session.add(AIAuditLog(id=uuid.uuid4(), created_at=ts, updated_at=ts, **entry))
        await session.commit()
        print(f"Seeded {len(ENTRIES)} AI audit log entries (domains 01-04).")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(seed())
