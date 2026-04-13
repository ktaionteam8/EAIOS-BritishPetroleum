"""DB-03c — Seed: Compliance, Field Ops, Energy, OT Data, TAR, ROI.

Run from backend/ directory:
    python seed_10c_ops_compliance.py

Note: seed_09a (sites/users), seed_09e (ml_models, kpi_snapshots, energy_targets)
      must run first. This script is idempotent — safe to run multiple times.
"""
import asyncio
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from src.models.database import engine
from src.models.compliance import ComplianceStandard, ComplianceAudit, ComplianceAction
from src.models.field_ops import InspectionRoute, InspectionItem, Contractor
from src.models.energy import EnergyReading, EnergyTarget, EnergySavingEvent
from src.models.ot_data import OTDataSource, OTQualityIssue
from src.models.tar import TurnaroundEvent, TarTask, TarConstraint
from src.models.roi import KpiSnapshot, CostSavingEvent, RoiContribution

AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# ── Compliance ───────────────────────────────────────────────────────────────
COMPLIANCE_STANDARDS = [
    dict(id="std-iso55000", code="ISO-55000", name="ISO 55000 Asset Management",
         jurisdiction="Global", standard_body="ISO", is_active=True),
    dict(id="std-iec61511", code="IEC-61511", name="Functional Safety of SIS",
         jurisdiction="Global", standard_body="IEC", is_active=True),
    dict(id="std-api-580", code="API-580", name="Risk-Based Inspection",
         jurisdiction="USA/Global", standard_body="API", is_active=True),
]

COMPLIANCE_AUDITS = [
    dict(id="aud-001", standard_id="std-iso55000", site_id="site-ruwais",
         audit_date=datetime(2026, 2, 14), next_audit_date=datetime(2027, 2, 14),
         inspector_name="Hamid Al-Rashid", score_pct=91.4, status="compliant",
         days_until_due=307, findings={"observations": 2, "non_conformances": 0}),
    dict(id="aud-002", standard_id="std-iec61511", site_id="site-houston",
         audit_date=datetime(2026, 1, 20), next_audit_date=datetime(2026, 7, 20),
         inspector_name="Catherine Moore", score_pct=78.2, status="due_soon",
         days_until_due=98, findings={"observations": 5, "non_conformances": 1}),
    dict(id="aud-003", standard_id="std-api-580", site_id="site-rotterdam",
         audit_date=datetime(2025, 9, 10), next_audit_date=datetime(2026, 3, 10),
         inspector_name="Jan Bergkamp", score_pct=64.1, status="overdue",
         days_until_due=-34, findings={"observations": 8, "non_conformances": 3}),
]

COMPLIANCE_ACTIONS = [
    dict(id="ca-001", standard_id="std-iec61511", site_id="site-houston",
         action_description="Update SIL verification matrix for HV-2201 loop",
         due_date=datetime(2026, 5, 30), owner="Sunita Patel",
         status="in-progress", ai_generated=True),
    dict(id="ca-002", standard_id="std-api-580", site_id="site-rotterdam",
         action_description="Complete RBI study for all Tier-1 static equipment",
         due_date=datetime(2026, 6, 15), owner="Mark van Dijk",
         status="open", ai_generated=True),
    dict(id="ca-003", standard_id="std-iso55000", site_id="site-ruwais",
         action_description="Document asset hierarchy in CMMS to ISO 55000 taxonomy",
         due_date=datetime(2026, 8, 1), owner="James Smith",
         status="open", ai_generated=False),
]

# ── Field Ops ────────────────────────────────────────────────────────────────
INSPECTION_ROUTES = [
    dict(id="rt-001", route_code="RT-RUW-01", name="Ruwais Compressor Hall Daily Walk",
         priority="critical", site_id="site-ruwais",
         asset_sequence=["C-101", "K-302", "V-307"], distance_km=1.2,
         estimated_duration_min=45, inspector_id="user-eng-ruw",
         inspector_name="James Smith", status="scheduled",
         scheduled_date=datetime(2026, 4, 14, 7, 0)),
    dict(id="rt-002", route_code="RT-HOU-01", name="Houston Heat Exchanger Inspection",
         priority="high", site_id="site-houston",
         asset_sequence=["E-212", "E-501", "P-205"], distance_km=0.8,
         estimated_duration_min=60, inspector_id="user-eng-hou",
         inspector_name="Sunita Patel", status="completed",
         scheduled_date=datetime(2026, 4, 12, 8, 0),
         completed_at=datetime(2026, 4, 12, 9, 15)),
    dict(id="rt-003", route_code="RT-ROT-01", name="Rotterdam Fired Heater & Turbine Round",
         priority="high", site_id="site-rotterdam",
         asset_sequence=["F-101", "T-405"], distance_km=0.6,
         estimated_duration_min=30, inspector_id="user-op-rot",
         inspector_name="Mark van Dijk", status="scheduled",
         scheduled_date=datetime(2026, 4, 14, 9, 0)),
]

INSPECTION_ITEMS = [
    dict(id="ii-001", route_id="rt-001", equipment_id="eq-c101", asset_tag="C-101",
         check_description="Visual check discharge pressure gauge — target 30–40 bar",
         iso_standard="ISO 13709", sort_order=1, is_completed=False),
    dict(id="ii-002", route_id="rt-001", equipment_id="eq-v307", asset_tag="V-307",
         check_description="Check pressure relief valve seal; inspect for any weeping",
         iso_standard="API 576", sort_order=2, is_completed=False),
    dict(id="ii-003", route_id="rt-002", equipment_id="eq-e212", asset_tag="E-212",
         check_description="Measure shell-side inlet/outlet temperatures (target 180–220°C)",
         iso_standard=None, sort_order=1, is_completed=True,
         completed_at=datetime(2026, 4, 12, 8, 20), pass_fail="pass",
         observation_notes="Temperatures within range; slight fouling on tube sheet"),
]

CONTRACTORS = [
    dict(id="con-001", company_name="Petrofac Engineering", specialty="Rotating Equipment",
         site_id="site-ruwais", crew_size=12, status="on-site",
         availability_from=datetime(2026, 4, 10), availability_to=datetime(2026, 5, 31),
         contact_name="Ali Hassan", contact_email="a.hassan@petrofac.com"),
    dict(id="con-002", company_name="Bilfinger Industrial Services", specialty="Static Equipment",
         site_id="site-rotterdam", crew_size=8, status="available",
         availability_from=datetime(2026, 5, 1), availability_to=datetime(2026, 8, 31),
         contact_name="Lars Mueller", contact_email="l.mueller@bilfinger.com"),
    dict(id="con-003", company_name="Wood Group PLC", specialty="Instrument & Electrical",
         site_id="site-houston", crew_size=6, status="mobilising",
         availability_from=datetime(2026, 4, 20), availability_to=datetime(2026, 6, 30),
         contact_name="Mark Roberts", contact_email="m.roberts@woodgroup.com"),
]

# ── Energy ───────────────────────────────────────────────────────────────────
ENERGY_READINGS = [
    dict(id="er-ruw-01", site_id="site-ruwais", reading_date=datetime(2026, 3, 1),
         total_energy_gj=142800.0, throughput_tonnes=4060.0, energy_intensity_gj_per_t=35.2,
         power_mw=218.0, steam_t_per_h=340.0, co2_tonnes=12840.0, co2_intensity_per_tonne=10.3),
    dict(id="er-hou-01", site_id="site-houston", reading_date=datetime(2026, 3, 1),
         total_energy_gj=87300.0, throughput_tonnes=2950.0, energy_intensity_gj_per_t=29.6,
         power_mw=142.0, steam_t_per_h=210.0, co2_tonnes=7150.0, co2_intensity_per_tonne=7.9),
    dict(id="er-rot-01", site_id="site-rotterdam", reading_date=datetime(2026, 3, 1),
         total_energy_gj=74900.0, throughput_tonnes=2806.0, energy_intensity_gj_per_t=26.7,
         power_mw=118.0, steam_t_per_h=195.0, co2_tonnes=5920.0, co2_intensity_per_tonne=6.9),
    dict(id="er-rst-01", site_id="site-rastanura", reading_date=datetime(2026, 3, 1),
         total_energy_gj=198600.0, throughput_tonnes=5640.0, energy_intensity_gj_per_t=35.2,
         power_mw=312.0, steam_t_per_h=490.0, co2_tonnes=18200.0, co2_intensity_per_tonne=10.5),
    dict(id="er-jam-01", site_id="site-jamnagar", reading_date=datetime(2026, 3, 1),
         total_energy_gj=384000.0, throughput_tonnes=10900.0, energy_intensity_gj_per_t=35.2,
         power_mw=587.0, steam_t_per_h=920.0, co2_tonnes=34000.0, co2_intensity_per_tonne=9.8),
]

EXTRA_ENERGY_TARGETS = [
    dict(id="etgt-004", site_id="site-rastanura", fiscal_year=2026,
         target_gj_per_t=34.0, target_co2_per_t=9.5),
    dict(id="etgt-005", site_id="site-jamnagar", fiscal_year=2026,
         target_gj_per_t=33.8, target_co2_per_t=9.2),
]

ENERGY_SAVING_EVENTS = [
    dict(id="ese-001", site_id="site-ruwais", event_date=datetime(2026, 3, 10),
         cost_avoided_usd=84200.0, source="optimization",
         description="AI-driven steam header pressure reduction saved 840 GJ over 30 days"),
    dict(id="ese-002", site_id="site-houston", event_date=datetime(2026, 2, 28),
         cost_avoided_usd=31500.0, source="efficiency",
         description="Heat exchanger cleaning improved duty by 12%, reducing fuel gas"),
    dict(id="ese-003", site_id="site-rotterdam", event_date=datetime(2026, 3, 20),
         cost_avoided_usd=22800.0, source="process_change",
         description="Crude preheat train rerouting based on digital twin recommendation"),
]

# ── OT Data ──────────────────────────────────────────────────────────────────
OT_SOURCES = [
    dict(id="ot-ruw-pi", source_code="RUW-PI-01", source_type="OSIsoft PI",
         site_id="site-ruwais", tag_count=24800, latency_ms=120,
         status="connected", quality_score_pct=97.4,
         last_poll_at=datetime(2026, 4, 13, 10, 44),
         connection_notes="PI Server v2018 SP3; OSISoft AF version 2.10"),
    dict(id="ot-hou-dcs", source_code="HOU-DCS-01", source_type="DCS",
         site_id="site-houston", tag_count=11200, latency_ms=85,
         status="connected", quality_score_pct=94.1,
         last_poll_at=datetime(2026, 4, 13, 10, 43),
         connection_notes="Honeywell Experion PKS C300; OPC-DA bridge"),
    dict(id="ot-rot-scada", source_code="ROT-SCADA-01", source_type="SCADA",
         site_id="site-rotterdam", tag_count=8400, latency_ms=210,
         status="degraded", quality_score_pct=81.7,
         last_poll_at=datetime(2026, 4, 13, 8, 10),
         connection_notes="ABB 800xA v6; network packet loss 3.2% on subnet 10.12.0.0/24"),
]

OT_QUALITY_ISSUES = [
    dict(id="otq-001", source_id="ot-rot-scada",
         tag_name="FI-3401.PV", issue_type="frozen_value",
         description="Flow indicator frozen at 142.3 t/h for >4 hours",
         severity="critical", impact_on_models=["mdl-001"],
         resolution_status="investigating",
         detected_at=datetime(2026, 4, 13, 8, 5)),
    dict(id="otq-002", source_id="ot-hou-dcs",
         tag_name="TI-2201.PV", issue_type="out_of_range",
         description="Temperature tag reading -999 (engineering unit clamp failure)",
         severity="warning", impact_on_models=["mdl-001"],
         resolution_status="open",
         detected_at=datetime(2026, 4, 12, 14, 30)),
    dict(id="otq-003", source_id="ot-ruw-pi",
         tag_name="VI-1101.PV", issue_type="noise",
         description="Vibration tag signal-to-noise ratio degraded; suspect cable fault",
         severity="warning", impact_on_models=["mdl-001"],
         resolution_status="resolved",
         detected_at=datetime(2026, 4, 10, 9, 0),
         resolved_at=datetime(2026, 4, 11, 11, 30)),
]

# ── TAR ──────────────────────────────────────────────────────────────────────
TURNAROUNDS = [
    dict(id="tar-ruw-2026", tar_code="TAR-RUW-26", site_id="site-ruwais",
         unit_name="CDU / VDU / Reformer", start_date=datetime(2026, 9, 15),
         end_date=datetime(2026, 10, 27), duration_days=42,
         budget_usd=28_400_000.0, actual_cost_usd=None, status="planned",
         work_scope_count=847),
    dict(id="tar-hou-2026", tar_code="TAR-HOU-26", site_id="site-houston",
         unit_name="FCCU", start_date=datetime(2026, 6, 1),
         end_date=datetime(2026, 6, 25), duration_days=24,
         budget_usd=11_200_000.0, actual_cost_usd=11_680_000.0, status="completed",
         work_scope_count=312),
]

TAR_TASKS = [
    dict(id="tt-001", tar_id="tar-ruw-2026", equipment_id="eq-c101",
         description="Full overhaul C-101 compressor — impeller replacement",
         estimated_hours=320.0, estimated_cost=1_840_000.0, status="pending", sort_order=1),
    dict(id="tt-002", tar_id="tar-ruw-2026", equipment_id="eq-v307",
         description="V-307 vessel internal inspection and re-rating",
         estimated_hours=80.0, estimated_cost=420_000.0, status="pending", sort_order=2),
    dict(id="tt-003", tar_id="tar-hou-2026", equipment_id="eq-e212",
         description="E-212 tube bundle replacement — full re-tube",
         estimated_hours=160.0, estimated_cost=680_000.0, status="completed", sort_order=1),
    dict(id="tt-004", tar_id="tar-hou-2026", equipment_id=None,
         description="FCCU catalyst changeout and regenerator inspection",
         estimated_hours=240.0, estimated_cost=2_100_000.0, status="completed", sort_order=2),
]

TAR_CONSTRAINTS = [
    dict(id="tc-001", tar_id="tar-ruw-2026", constraint_type="permit",
         description="Hot work permit applications to ADNOC pending approval",
         status="pending", owner="James Smith"),
    dict(id="tc-002", tar_id="tar-ruw-2026", constraint_type="resource",
         description="Specialist compressor crew — Petrofac contract not yet signed",
         status="pending", owner="Procurement"),
    dict(id="tc-003", tar_id="tar-hou-2026", constraint_type="safety",
         description="Pre-TAR PSSR (Pre-Start Safety Review) completed and signed off",
         status="ready", owner="Sunita Patel",
         resolution_date=datetime(2026, 5, 28)),
]

# ── ROI ──────────────────────────────────────────────────────────────────────
EXTRA_KPI_SNAPSHOTS = [
    dict(id="kpi-005", site_id="site-rastanura", scope="site",
         snapshot_date=datetime(2026, 4, 1), mtbf_hours=520.0, mttr_hours=4.2,
         oee_pct=91.0, availability_pct=96.2, performance_pct=95.8,
         quality_pct=99.1, alerts_actioned=284, model_accuracy_pct=96.3),
    dict(id="kpi-006", site_id="site-jamnagar", scope="site",
         snapshot_date=datetime(2026, 4, 1), mtbf_hours=680.0, mttr_hours=3.4,
         oee_pct=93.4, availability_pct=97.8, performance_pct=96.2,
         quality_pct=99.4, alerts_actioned=412, model_accuracy_pct=97.1),
]

COST_SAVING_EVENTS = [
    dict(id="cse-001", equipment_id="eq-c101", site_id="site-ruwais",
         alert_id=None, event_date=datetime(2026, 3, 14),
         cost_avoided_usd=2_840_000.0, category="failure_prevention",
         description="C-101 compressor failure averted — impeller fatigue crack detected 48h early"),
    dict(id="cse-002", equipment_id="eq-e212", site_id="site-houston",
         alert_id=None, event_date=datetime(2026, 2, 22),
         cost_avoided_usd=380_000.0, category="downtime",
         description="Heat exchanger cleaning scheduled proactively vs emergency shutdown"),
    dict(id="cse-003", equipment_id=None, site_id="site-rotterdam",
         alert_id=None, event_date=datetime(2026, 3, 8),
         cost_avoided_usd=127_000.0, category="energy",
         description="Energy optimisation recommendation reduced fuel gas by 4.2%"),
]

ROI_CONTRIBUTIONS = [
    dict(id="roi-001", source="LSTM", value_usd=14_200_000.0,
         valuation_date=datetime(2026, 3, 31),
         methodology_notes="Failure prevention value across fleet (H1 2026 actuals)"),
    dict(id="roi-002", source="AI Advisor", value_usd=3_800_000.0,
         valuation_date=datetime(2026, 3, 31),
         methodology_notes="Maintenance scheduling optimisation, based on WO cost deltas"),
    dict(id="roi-003", source="Energy", value_usd=1_380_000.0,
         valuation_date=datetime(2026, 3, 31),
         methodology_notes="Fuel gas savings from process optimisation recommendations"),
]


async def _upsert(session: AsyncSession, model, pk: str, data: dict) -> None:
    existing = await session.get(model, data[pk])
    if existing is None:
        session.add(model(**data))


async def seed():
    async with AsyncSessionLocal() as session:
        print("Seeding compliance standards...")
        for row in COMPLIANCE_STANDARDS:
            await _upsert(session, ComplianceStandard, "id", row)

        print("Seeding compliance audits...")
        for row in COMPLIANCE_AUDITS:
            await _upsert(session, ComplianceAudit, "id", row)

        print("Seeding compliance actions...")
        for row in COMPLIANCE_ACTIONS:
            await _upsert(session, ComplianceAction, "id", row)

        print("Seeding inspection routes...")
        for row in INSPECTION_ROUTES:
            await _upsert(session, InspectionRoute, "id", row)

        print("Seeding inspection items...")
        for row in INSPECTION_ITEMS:
            await _upsert(session, InspectionItem, "id", row)

        print("Seeding contractors...")
        for row in CONTRACTORS:
            await _upsert(session, Contractor, "id", row)

        print("Seeding energy readings...")
        for row in ENERGY_READINGS:
            await _upsert(session, EnergyReading, "id", row)

        print("Seeding extra energy targets (sites 4-5)...")
        for row in EXTRA_ENERGY_TARGETS:
            await _upsert(session, EnergyTarget, "id", row)

        print("Seeding energy saving events...")
        for row in ENERGY_SAVING_EVENTS:
            await _upsert(session, EnergySavingEvent, "id", row)

        print("Seeding OT data sources...")
        for row in OT_SOURCES:
            await _upsert(session, OTDataSource, "id", row)

        print("Seeding OT quality issues...")
        for row in OT_QUALITY_ISSUES:
            await _upsert(session, OTQualityIssue, "id", row)

        print("Seeding turnaround events...")
        for row in TURNAROUNDS:
            await _upsert(session, TurnaroundEvent, "id", row)

        print("Seeding TAR tasks...")
        for row in TAR_TASKS:
            await _upsert(session, TarTask, "id", row)

        print("Seeding TAR constraints...")
        for row in TAR_CONSTRAINTS:
            await _upsert(session, TarConstraint, "id", row)

        print("Seeding additional KPI snapshots...")
        for row in EXTRA_KPI_SNAPSHOTS:
            await _upsert(session, KpiSnapshot, "id", row)

        print("Seeding cost saving events...")
        for row in COST_SAVING_EVENTS:
            await _upsert(session, CostSavingEvent, "id", row)

        print("Seeding ROI contributions...")
        for row in ROI_CONTRIBUTIONS:
            await _upsert(session, RoiContribution, "id", row)

        await session.commit()
        print("\n✅ DB-03c complete — compliance (3+3+3), field ops (3+3+3), "
              "energy (5+2+3), OT (3+3), TAR (2+4+3), ROI (2+3+3) seeded.")


if __name__ == "__main__":
    asyncio.run(seed())
