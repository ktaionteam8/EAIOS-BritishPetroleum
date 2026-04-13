"""DB-03a — Seed: Offshore, Castrol Blending, Digital Twin.

Run from backend/ directory:
    python seed_10a_specialty.py

Note: DB-01/DB-02 (Alembic migration + base seeds) must be run first.
      This script is idempotent — safe to run multiple times.
"""
import asyncio
import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from src.models.database import engine
from src.models.offshore import OffshorePlatform, SubseaAlert, WellIntegrity
from src.models.castrol import BlendSpecification, BlendRun, BlendQualityPrediction
from src.models.digital_twin import DigitalTwinAsset, OperatingEnvelopeParam, TwinScenario

AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# ── Offshore Platforms ──────────────────────────────────────────────────────
PLATFORMS = [
    dict(id="plat-magnus", name="Magnus Platform", field_name="Magnus Field",
         status="producing", production_bopd=18500.0, uptime_pct=97.2,
         active_wells=14, crew_count=120, latitude=61.6, longitude=1.5),
    dict(id="plat-forties", name="Forties Alpha", field_name="Forties Field",
         status="producing", production_bopd=42300.0, uptime_pct=94.8,
         active_wells=22, crew_count=185, latitude=57.7, longitude=0.5),
    dict(id="plat-schiehallion", name="Schiehallion FPSO", field_name="Schiehallion",
         status="maintenance", production_bopd=9800.0, uptime_pct=88.1,
         active_wells=8, crew_count=95, latitude=60.2, longitude=-3.1),
]

SUBSEA_ALERTS = [
    dict(id="sa-001", platform_id="plat-magnus",
         asset_name="Christmas Tree #7", asset_type="christmas_tree",
         issue_description="Annulus pressure rising beyond safe operating limit",
         failure_probability_pct=73.4, eta_days=2.1, severity="critical", status="active"),
    dict(id="sa-002", platform_id="plat-magnus",
         asset_name="Flowline Segment C", asset_type="flowline",
         issue_description="Corrosion wall-loss detected via inline inspection pig",
         failure_probability_pct=41.2, eta_days=14.0, severity="warning", status="acknowledged"),
    dict(id="sa-003", platform_id="plat-forties",
         asset_name="BOP Stack #2", asset_type="BOP",
         issue_description="Seal integrity degradation on lower annular preventer",
         failure_probability_pct=28.7, eta_days=30.0, severity="warning", status="active"),
    dict(id="sa-004", platform_id="plat-schiehallion",
         asset_name="Riser Joint 14", asset_type="riser",
         issue_description="VIV fatigue damage accumulation near design limit",
         failure_probability_pct=19.3, eta_days=60.0, severity="advisory", status="active"),
]

WELL_INTEGRITY = [
    dict(id="wi-001", platform_id="plat-magnus", well_name="M07",
         barrier_type="Primary Mechanical Barrier",
         annulus_pressure_bar=42.1, last_test_date=datetime(2026, 3, 10), status="WARN",
         notes="A-annulus pressure trending up 0.8 bar/day"),
    dict(id="wi-002", platform_id="plat-magnus", well_name="M12",
         barrier_type="Secondary Mechanical Barrier",
         annulus_pressure_bar=8.3, last_test_date=datetime(2026, 4, 1), status="OK",
         notes=None),
    dict(id="wi-003", platform_id="plat-forties", well_name="FA05",
         barrier_type="Primary Mechanical Barrier",
         annulus_pressure_bar=187.6, last_test_date=datetime(2026, 1, 15), status="CRIT",
         notes="Tubing hanger leak suspected; well shut-in pending inspection"),
    dict(id="wi-004", platform_id="plat-schiehallion", well_name="SC03",
         barrier_type="Annular Safety Valve",
         annulus_pressure_bar=None, last_test_date=datetime(2026, 2, 20), status="OK",
         notes=None),
]

# ── Castrol Blending ────────────────────────────────────────────────────────
BLEND_SPECS = [
    dict(id="spec-castrol5w30", grade_name="Castrol EDGE 5W-30",
         viscosity_target=70.3, viscosity_tol_low=67.5, viscosity_tol_high=73.1,
         pour_point_target=-40.0, tbn_target=10.5, density_target=868.0),
    dict(id="spec-castrol10w40", grade_name="Castrol Magnatec 10W-40",
         viscosity_target=99.2, viscosity_tol_low=96.0, viscosity_tol_high=102.4,
         pour_point_target=-30.0, tbn_target=9.0, density_target=871.0),
    dict(id="spec-castrol15w40", grade_name="Castrol CRB 15W-40",
         viscosity_target=106.8, viscosity_tol_low=103.0, viscosity_tol_high=110.6,
         pour_point_target=-25.0, tbn_target=12.0, density_target=878.0),
]

BLEND_RUNS = [
    dict(id="run-b2410", batch_code="B-2410", grade_name="Castrol EDGE 5W-30",
         site_id="site-rotterdam", tank_id="T-14A", target_volume_liters=45000.0,
         progress_pct=100.0, status="complete",
         started_at=datetime(2026, 4, 10, 6, 0), completed_at=datetime(2026, 4, 10, 14, 30)),
    dict(id="run-b2411", batch_code="B-2411", grade_name="Castrol Magnatec 10W-40",
         site_id="site-rotterdam", tank_id="T-15B", target_volume_liters=32000.0,
         progress_pct=67.5, status="in-progress",
         started_at=datetime(2026, 4, 13, 8, 0), completed_at=None),
    dict(id="run-b2412", batch_code="B-2412", grade_name="Castrol CRB 15W-40",
         site_id="site-rotterdam", tank_id="T-16A", target_volume_liters=28000.0,
         progress_pct=100.0, status="rework",
         started_at=datetime(2026, 4, 9, 7, 0), completed_at=datetime(2026, 4, 9, 15, 0)),
]

BLEND_PREDICTIONS = [
    dict(id="bp-001", blend_id="run-b2410", predicted_at=datetime(2026, 4, 10, 12, 0),
         viscosity_predicted=70.1, pour_point_predicted=-41.0, tbn_predicted=10.6,
         confidence_low=68.8, confidence_high=71.4, prediction_status="on-spec"),
    dict(id="bp-002", blend_id="run-b2411", predicted_at=datetime(2026, 4, 13, 14, 0),
         viscosity_predicted=98.7, pour_point_predicted=-31.0, tbn_predicted=8.9,
         confidence_low=97.0, confidence_high=100.4, prediction_status="borderline"),
    dict(id="bp-003", blend_id="run-b2412", predicted_at=datetime(2026, 4, 9, 13, 0),
         viscosity_predicted=112.4, pour_point_predicted=-24.0, tbn_predicted=11.8,
         confidence_low=110.0, confidence_high=114.8, prediction_status="off-spec"),
]

# ── Digital Twin ────────────────────────────────────────────────────────────
TWIN_ASSETS = [
    dict(id="twin-c101", equipment_id="eq-c101", twin_type="physics-informed",
         fidelity="High", last_sync="2026-04-13T10:42:00Z", sync_latency_ms=180, status="critical"),
    dict(id="twin-e212", equipment_id="eq-e212", twin_type="data-driven",
         fidelity="Medium", last_sync="2026-04-13T10:40:00Z", sync_latency_ms=240, status="warning"),
    dict(id="twin-p205", equipment_id="eq-p205", twin_type="hybrid",
         fidelity="High", last_sync="2026-04-13T10:44:00Z", sync_latency_ms=95, status="healthy"),
]

ENVELOPE_PARAMS = [
    dict(id="ep-001", twin_id="twin-c101", parameter_name="Discharge Pressure",
         current_value=42.8, normal_range_low=30.0, normal_range_high=40.0,
         unit="bar", status="alarm", sort_order=1),
    dict(id="ep-002", twin_id="twin-c101", parameter_name="Vibration (X-axis)",
         current_value=8.9, normal_range_low=0.0, normal_range_high=7.0,
         unit="mm/s", status="alarm", sort_order=2),
    dict(id="ep-003", twin_id="twin-e212", parameter_name="Shell-side Temperature",
         current_value=214.0, normal_range_low=180.0, normal_range_high=220.0,
         unit="°C", status="normal", sort_order=1),
    dict(id="ep-004", twin_id="twin-p205", parameter_name="Bearing Temperature",
         current_value=68.2, normal_range_low=20.0, normal_range_high=80.0,
         unit="°C", status="normal", sort_order=1),
]

TWIN_SCENARIOS = [
    dict(id="scen-001", twin_id="twin-c101", name="Reduce Speed 5% — RUL Impact",
         description="Model effect of reducing compressor speed from 3450 to 3278 RPM",
         parameter_changes={"speed_rpm": 3278},
         predicted_outcomes={"rul_hours": 96, "vibration_reduction_pct": 18},
         rul_delta_hours=48.0, impact="positive"),
    dict(id="scen-002", twin_id="twin-c101", name="Emergency Full-Load Run",
         description="Simulate compressor at 110% rated load for 4 hours",
         parameter_changes={"load_pct": 110},
         predicted_outcomes={"rul_hours": 12, "failure_probability_pct": 88},
         rul_delta_hours=-36.0, impact="negative"),
    dict(id="scen-003", twin_id="twin-e212", name="Bypass Fouled HEX Tubes",
         description="Route flow around fouled bundle; model temperature profile",
         parameter_changes={"bypass_pct": 30},
         predicted_outcomes={"outlet_temp_c": 198, "efficiency_pct": 81},
         rul_delta_hours=120.0, impact="positive"),
]


async def _upsert(session: AsyncSession, model, pk: str, data: dict) -> None:
    existing = await session.get(model, data[pk])
    if existing is None:
        session.add(model(**data))


async def seed():
    async with AsyncSessionLocal() as session:
        print("Seeding offshore platforms...")
        for row in PLATFORMS:
            await _upsert(session, OffshorePlatform, "id", row)

        print("Seeding subsea alerts...")
        for row in SUBSEA_ALERTS:
            await _upsert(session, SubseaAlert, "id", row)

        print("Seeding well integrity...")
        for row in WELL_INTEGRITY:
            await _upsert(session, WellIntegrity, "id", row)

        print("Seeding blend specifications...")
        for row in BLEND_SPECS:
            await _upsert(session, BlendSpecification, "id", row)

        print("Seeding blend runs...")
        for row in BLEND_RUNS:
            await _upsert(session, BlendRun, "id", row)

        print("Seeding blend quality predictions...")
        for row in BLEND_PREDICTIONS:
            await _upsert(session, BlendQualityPrediction, "id", row)

        print("Seeding digital twin assets...")
        for row in TWIN_ASSETS:
            await _upsert(session, DigitalTwinAsset, "id", row)

        print("Seeding operating envelope params...")
        for row in ENVELOPE_PARAMS:
            await _upsert(session, OperatingEnvelopeParam, "id", row)

        print("Seeding twin scenarios...")
        for row in TWIN_SCENARIOS:
            await _upsert(session, TwinScenario, "id", row)

        await session.commit()
        print("\n✅ DB-03a complete — offshore (3+4+4), castrol (3+3+3), digital twin (3+4+3) seeded.")


if __name__ == "__main__":
    asyncio.run(seed())
