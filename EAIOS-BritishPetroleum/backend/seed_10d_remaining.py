"""DB-05 — Seed the 19 remaining empty tables.

Run from backend/ directory:
    python3.11 seed_10d_remaining.py

Tables covered (19):
    active_learning_queue, alert_decisions, audit_log,
    blend_sensor_readings, budget_actuals, compliance_evidence,
    crew_assignments, crew_members, lims_results,
    maintenance_schedule_recommendations, model_drift_metrics,
    model_feedback, regulatory_changes, retraining_runs,
    sap_bapi_records, schema_normalization_log,
    training_enrollments, vessel_schedules, weather_forecasts
"""
import asyncio
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))

import src.models  # noqa: F401
from src.models.database import SessionLocal
from src.models.alerts import AlertDecision, AuditLog
from src.models.ml_models import (
    ActiveLearningQueue, ModelDriftMetric, ModelFeedback, RetrainingRun,
)
from src.models.castrol import BlendSensorReading, LimsResult
from src.models.roi import BudgetActual
from src.models.compliance import ComplianceEvidence, RegulatoryChange
from src.models.work_orders import CrewMember, CrewAssignment, SapBapiRecord
from src.models.tar import MaintenanceScheduleRecommendation
from src.models.ot_data import SchemaNormalizationLog
from src.models.adoption import TrainingEnrollment
from src.models.offshore import VesselSchedule, WeatherForecast

_NOW = datetime(2026, 4, 13, 8, 0, 0)


async def _upsert(session, model, pk_field: str, records: list[dict]) -> int:
    inserted = 0
    for data in records:
        pk_val = data[pk_field]
        existing = await session.get(model, pk_val)
        if existing is None:
            session.add(model(**data))
            inserted += 1
    await session.flush()
    return inserted


async def seed() -> None:
    async with SessionLocal() as session:
        async with session.begin():

            # ── alert_decisions (1 per alert, unique constraint) ──────────────
            n = await _upsert(session, AlertDecision, "id", [
                dict(id="adec-001", alert_id="alt-001", user_id="user-eng-ruw",
                     decision="accept", reason_code="SHAP signals confirm bearing fault",
                     modified_action=None, modified_timing=None,
                     work_order_id="wo-001", wo_number="WO-2026-001",
                     decided_at=datetime(2026, 4, 10, 9, 15)),
                dict(id="adec-002", alert_id="alt-002", user_id="user-eng-hou",
                     decision="defer", reason_code="Planned shutdown in 14 days",
                     modified_action="defer", modified_timing="Next planned outage",
                     work_order_id="wo-002", wo_number="WO-2026-002",
                     decided_at=datetime(2026, 4, 10, 11, 30)),
                dict(id="adec-003", alert_id="alt-003", user_id="user-eng-hou",
                     decision="reject", reason_code="False positive — sensor calibration error",
                     modified_action=None, modified_timing=None,
                     work_order_id=None, wo_number=None,
                     decided_at=datetime(2026, 4, 11, 8, 0)),
            ])
            print(f"  alert_decisions: +{n}")

            # ── audit_log ─────────────────────────────────────────────────────
            n = await _upsert(session, AuditLog, "id", [
                dict(id="alog-001", alert_id="alt-001", alert_title="C-101 Bearing Fault",
                     decision="accept", user_id="user-eng-ruw",
                     user_name="Ruwais Engineer", reason_code="SHAP confirmed",
                     wo_number="WO-2026-001", timestamp=datetime(2026, 4, 10, 9, 15)),
                dict(id="alog-002", alert_id="alt-002", alert_title="E-212 Fouling Detected",
                     decision="defer", user_id="user-eng-hou",
                     user_name="Houston Engineer", reason_code="Planned outage in 14 days",
                     wo_number="WO-2026-002", timestamp=datetime(2026, 4, 10, 11, 30)),
                dict(id="alog-003", alert_id="alt-003", alert_title="P-205 Cavitation Risk",
                     decision="reject", user_id="user-eng-hou",
                     user_name="Houston Engineer",
                     reason_code="Sensor calibration error — false positive",
                     wo_number=None, timestamp=datetime(2026, 4, 11, 8, 0)),
            ])
            print(f"  audit_log: +{n}")

            # ── blend_sensor_readings ─────────────────────────────────────────
            n = await _upsert(session, BlendSensorReading, "id", [
                dict(id="bsr-001", blend_id="run-b2410",
                     timestamp=datetime(2026, 4, 1, 6, 0),
                     temperature_c=62.5, viscosity_cst=96.4,
                     density_kg_m3=872.3, dosing_rate_kg_min=4.2),
                dict(id="bsr-002", blend_id="run-b2410",
                     timestamp=datetime(2026, 4, 1, 8, 0),
                     temperature_c=63.1, viscosity_cst=97.1,
                     density_kg_m3=873.0, dosing_rate_kg_min=4.3),
                dict(id="bsr-003", blend_id="run-b2411",
                     timestamp=datetime(2026, 4, 2, 7, 0),
                     temperature_c=58.0, viscosity_cst=108.5,
                     density_kg_m3=881.0, dosing_rate_kg_min=3.8),
                dict(id="bsr-004", blend_id="run-b2412",
                     timestamp=datetime(2026, 4, 3, 9, 0),
                     temperature_c=70.2, viscosity_cst=115.0,
                     density_kg_m3=889.5, dosing_rate_kg_min=5.1),
            ])
            print(f"  blend_sensor_readings: +{n}")

            # ── lims_results (unique per blend_id) ───────────────────────────
            n = await _upsert(session, LimsResult, "id", [
                dict(id="lims-b2410", blend_id="run-b2410",
                     test_date=datetime(2026, 4, 1, 14, 0),
                     viscosity_measured=96.8, pour_point_measured=-24.0,
                     tbn_measured=9.1, water_content_ppm=42.0,
                     particle_count=8.3, result_status="PASS",
                     rework_required=False,
                     lab_notes="All parameters within spec"),
                dict(id="lims-b2411", blend_id="run-b2411",
                     test_date=datetime(2026, 4, 2, 15, 0),
                     viscosity_measured=109.2, pour_point_measured=-30.0,
                     tbn_measured=8.8, water_content_ppm=38.0,
                     particle_count=6.1, result_status="PASS",
                     rework_required=False,
                     lab_notes="Viscosity slightly high but within tolerance"),
                dict(id="lims-b2412", blend_id="run-b2412",
                     test_date=datetime(2026, 4, 3, 16, 0),
                     viscosity_measured=116.4, pour_point_measured=-18.0,
                     tbn_measured=11.2, water_content_ppm=55.0,
                     particle_count=12.7, result_status="FAIL",
                     rework_required=True,
                     lab_notes="Water content exceeds 50 ppm — rework required"),
            ])
            print(f"  lims_results: +{n}")

            # ── budget_actuals ────────────────────────────────────────────────
            n = await _upsert(session, BudgetActual, "id", [
                dict(id="ba-ruw-mar", site_id="site-ruwais",
                     period_month="2026-03", budgeted_usd=1_250_000.0,
                     actual_usd=1_183_400.0, variance_usd=-66_600.0,
                     cost_category="maintenance"),
                dict(id="ba-hou-mar", site_id="site-houston",
                     period_month="2026-03", budgeted_usd=980_000.0,
                     actual_usd=1_042_800.0, variance_usd=62_800.0,
                     cost_category="maintenance"),
                dict(id="ba-rot-mar", site_id="site-rotterdam",
                     period_month="2026-03", budgeted_usd=760_000.0,
                     actual_usd=714_900.0, variance_usd=-45_100.0,
                     cost_category="maintenance"),
                dict(id="ba-ruw-apr", site_id="site-ruwais",
                     period_month="2026-04", budgeted_usd=1_250_000.0,
                     actual_usd=0.0, variance_usd=-1_250_000.0,
                     cost_category="maintenance"),
            ])
            print(f"  budget_actuals: +{n}")

            # ── compliance_evidence ───────────────────────────────────────────
            n = await _upsert(session, ComplianceEvidence, "id", [
                dict(id="ce-001", audit_id="aud-001",
                     document_type="Inspection Report",
                     document_name="ISO-55000-Ruwais-2026-Q1.pdf",
                     file_url=None,
                     uploaded_date=datetime(2026, 3, 15, 10, 0),
                     uploaded_by_user_id="user-eng-ruw"),
                dict(id="ce-002", audit_id="aud-002",
                     document_type="SIS Test Certificate",
                     document_name="IEC61511-Houston-SIL2-Cert.pdf",
                     file_url=None,
                     uploaded_date=datetime(2026, 3, 20, 14, 0),
                     uploaded_by_user_id="user-eng-hou"),
                dict(id="ce-003", audit_id="aud-003",
                     document_type="RBI Study",
                     document_name="API580-Rotterdam-RBI-2026.pdf",
                     file_url=None,
                     uploaded_date=datetime(2026, 3, 25, 9, 30),
                     uploaded_by_user_id="user-op-rot"),
            ])
            print(f"  compliance_evidence: +{n}")

            # ── regulatory_changes ────────────────────────────────────────────
            n = await _upsert(session, RegulatoryChange, "id", [
                dict(id="rc-001",
                     effective_date=datetime(2026, 7, 1),
                     regulation_code="UK-HSE-PSSR-2026",
                     change_description="Updated Pressure Systems Safety Regulations — "
                                        "annual inspection frequency increased for Class A vessels",
                     impact_assessment="15 vessels at Rotterdam and Ruwais require "
                                       "re-scheduling of annual inspection windows",
                     internal_actions=["Update inspection schedules", "Brief site HSE teams"],
                     status="pending"),
                dict(id="rc-002",
                     effective_date=datetime(2026, 10, 1),
                     regulation_code="EU-ETS-REV-2026",
                     change_description="EU Emissions Trading System revision — "
                                        "new CO2 reporting obligations for refinery flare stacks",
                     impact_assessment="Rotterdam site requires new telemetry on 3 flare stacks; "
                                       "estimated $180k CAPEX",
                     internal_actions=["CAPEX request submitted", "Vendor evaluation in progress"],
                     status="in-progress"),
                dict(id="rc-003",
                     effective_date=datetime(2026, 1, 1),
                     regulation_code="UAE-ADNOC-OPS-2025-12",
                     change_description="ADNOC updated SIL certification requirements "
                                        "for safety instrumented functions at onshore sites",
                     impact_assessment="Ruwais SIL assessments last done in 2023; "
                                       "full re-certification required",
                     internal_actions=["SIL study commissioned", "Completed Q1 2026"],
                     status="completed"),
            ])
            print(f"  regulatory_changes: +{n}")

            # ── model_drift_metrics ───────────────────────────────────────────
            n = await _upsert(session, ModelDriftMetric, "id", [
                dict(id="drft-001", model_id="mdl-001",
                     measured_at=datetime(2026, 4, 1, 0, 0),
                     feature_drift_score=0.08, concept_drift_score=0.04,
                     psi_score=0.06, alert_level="OK"),
                dict(id="drft-002", model_id="mdl-002",
                     measured_at=datetime(2026, 4, 1, 0, 0),
                     feature_drift_score=0.21, concept_drift_score=0.18,
                     psi_score=0.19, alert_level="WARNING"),
                dict(id="drft-003", model_id="mdl-003",
                     measured_at=datetime(2026, 4, 1, 0, 0),
                     feature_drift_score=0.05, concept_drift_score=0.03,
                     psi_score=0.04, alert_level="OK"),
                dict(id="drft-004", model_id="mdl-004",
                     measured_at=datetime(2026, 4, 1, 0, 0),
                     feature_drift_score=0.34, concept_drift_score=0.29,
                     psi_score=0.31, alert_level="CRITICAL"),
            ])
            print(f"  model_drift_metrics: +{n}")

            # ── model_feedback ────────────────────────────────────────────────
            n = await _upsert(session, ModelFeedback, "id", [
                dict(id="mfb-001", model_id="mdl-001", alert_id="alt-001",
                     feedback_type="true_positive",
                     provided_by_user_id="user-eng-ruw",
                     notes="Bearing failed within predicted ETF window — correct alert"),
                dict(id="mfb-002", model_id="mdl-002", alert_id="alt-002",
                     feedback_type="true_positive",
                     provided_by_user_id="user-eng-hou",
                     notes="Fouling confirmed by borescope inspection"),
                dict(id="mfb-003", model_id="mdl-003", alert_id="alt-003",
                     feedback_type="false_positive",
                     provided_by_user_id="user-eng-hou",
                     notes="Sensor calibration drift caused erroneous cavitation signal"),
            ])
            print(f"  model_feedback: +{n}")

            # ── retraining_runs ───────────────────────────────────────────────
            n = await _upsert(session, RetrainingRun, "id", [
                dict(id="rtr-001", model_id="mdl-002",
                     trigger="drift",
                     started_at=datetime(2026, 4, 5, 2, 0),
                     completed_at=datetime(2026, 4, 5, 4, 30),
                     new_accuracy=0.934, new_f1=0.921,
                     status="completed",
                     changelog="Retrained on 6-month rolling window; "
                               "added 1,200 new fouling samples from Houston",
                     training_samples_used=18400),
                dict(id="rtr-002", model_id="mdl-004",
                     trigger="drift",
                     started_at=datetime(2026, 4, 12, 3, 0),
                     completed_at=None,
                     new_accuracy=None, new_f1=None,
                     status="running",
                     changelog=None,
                     training_samples_used=None),
                dict(id="rtr-003", model_id="mdl-001",
                     trigger="scheduled",
                     started_at=datetime(2026, 3, 1, 1, 0),
                     completed_at=datetime(2026, 3, 1, 3, 15),
                     new_accuracy=0.961, new_f1=0.954,
                     status="completed",
                     changelog="Quarterly scheduled retraining; "
                               "accuracy improved +0.4 pp with new vibration feature",
                     training_samples_used=22600),
            ])
            print(f"  retraining_runs: +{n}")

            # ── active_learning_queue ─────────────────────────────────────────
            n = await _upsert(session, ActiveLearningQueue, "id", [
                dict(id="alq-001", model_id="mdl-001", equipment_id="eq-c101",
                     confidence_score=0.51,
                     sensor_snapshot={"vibration_de": 8.9, "lube_temp": 78.2,
                                       "discharge_pressure": 12.4},
                     status="pending", reviewer_id=None,
                     reviewed_at=None, label=None),
                dict(id="alq-002", model_id="mdl-003", equipment_id="eq-p205",
                     confidence_score=0.47,
                     sensor_snapshot={"flow_rate": 342.1, "inlet_pressure": 6.8,
                                       "noise_db": 87.3},
                     status="reviewed", reviewer_id="user-eng-hou",
                     reviewed_at=datetime(2026, 4, 11, 10, 0),
                     label="false_positive"),
                dict(id="alq-003", model_id="mdl-002", equipment_id="eq-e212",
                     confidence_score=0.53,
                     sensor_snapshot={"differential_pressure": 1.82, "outlet_temp": 142.3,
                                       "fouling_factor": 0.00021},
                     status="pending", reviewer_id=None,
                     reviewed_at=None, label=None),
            ])
            print(f"  active_learning_queue: +{n}")

            # ── sap_bapi_records ──────────────────────────────────────────────
            n = await _upsert(session, SapBapiRecord, "id", [
                dict(id="sap-001", work_order_id="wo-001",
                     record_type="PM01",
                     sap_reference_id="4500876123",
                     description="Preventive maintenance order — bearing replacement C-101",
                     asset_tag="C-101-RUW", s4hana_ready=True),
                dict(id="sap-002", work_order_id="wo-002",
                     record_type="PM02",
                     sap_reference_id="4500876144",
                     description="Corrective maintenance — heat exchanger E-212 chemical clean",
                     asset_tag="E-212-HOU", s4hana_ready=True),
                dict(id="sap-003", work_order_id="wo-003",
                     record_type="PM03",
                     sap_reference_id="4500876161",
                     description="Predictive maintenance — pump P-205 impeller inspection",
                     asset_tag="P-205-HOU", s4hana_ready=True),
            ])
            print(f"  sap_bapi_records: +{n}")

            # ── crew_members ──────────────────────────────────────────────────
            n = await _upsert(session, CrewMember, "id", [
                dict(id="crew-001", name="James Blackwood",
                     role="Rotating Equipment Technician",
                     site_id="site-ruwais", availability="available",
                     skills=["compressors", "pumps", "vibration analysis"],
                     contractor_company=None, is_active=True),
                dict(id="crew-002", name="Maria Santos",
                     role="Instrument & Control Technician",
                     site_id="site-houston", availability="on-job",
                     skills=["SIS", "HART", "PLC programming"],
                     contractor_company=None, is_active=True),
                dict(id="crew-003", name="Erik Andersen",
                     role="Mechanical Inspector",
                     site_id="site-rotterdam", availability="available",
                     skills=["NDT", "RBI", "PSSR inspections"],
                     contractor_company="BV Technical Services", is_active=True),
            ])
            print(f"  crew_members: +{n}")

            # ── crew_assignments ──────────────────────────────────────────────
            n = await _upsert(session, CrewAssignment, "id", [
                dict(id="ca-001", crew_member_id="crew-001",
                     work_order_id="wo-001",
                     assigned_at=datetime(2026, 4, 10, 8, 0),
                     start_date=datetime(2026, 4, 15, 7, 0),
                     end_date=datetime(2026, 4, 15, 17, 0),
                     status="assigned"),
                dict(id="ca-002", crew_member_id="crew-002",
                     work_order_id="wo-002",
                     assigned_at=datetime(2026, 4, 10, 9, 0),
                     start_date=datetime(2026, 4, 22, 7, 0),
                     end_date=datetime(2026, 4, 22, 15, 0),
                     status="assigned"),
                dict(id="ca-003", crew_member_id="crew-003",
                     work_order_id="wo-003",
                     assigned_at=datetime(2026, 4, 11, 10, 0),
                     start_date=datetime(2026, 4, 18, 8, 0),
                     end_date=datetime(2026, 4, 18, 12, 0),
                     status="assigned"),
            ])
            print(f"  crew_assignments: +{n}")

            # ── maintenance_schedule_recommendations ──────────────────────────
            n = await _upsert(session, MaintenanceScheduleRecommendation, "id", [
                dict(id="msr-001", tar_id="tar-ruw-2026",
                     equipment_id="eq-c101",
                     recommended_action="Full overhaul including impeller, seals and bearings",
                     recommended_window="TAR-RUW-26 (May–Jun 2026)",
                     risk_level="high",
                     constraints=["spare parts lead time 6 weeks", "OEM specialist required"],
                     ai_confidence_pct=91.5,
                     status="accepted",
                     accepted_by_user_id="user-eng-ruw",
                     accepted_at=datetime(2026, 3, 20, 14, 0)),
                dict(id="msr-002", tar_id="tar-ruw-2026",
                     equipment_id="eq-v307",
                     recommended_action="Internal inspection and re-certification per PSSR",
                     recommended_window="TAR-RUW-26 (May–Jun 2026)",
                     risk_level="medium",
                     constraints=["certified inspector required"],
                     ai_confidence_pct=87.3,
                     status="pending",
                     accepted_by_user_id=None,
                     accepted_at=None),
                dict(id="msr-003", tar_id="tar-hou-2026",
                     equipment_id="eq-e212",
                     recommended_action="Full bundle replacement — fouling beyond chemical clean threshold",
                     recommended_window="TAR-HOU-26 (Aug 2026)",
                     risk_level="high",
                     constraints=["bundle delivery 8 weeks", "hot work permit required"],
                     ai_confidence_pct=94.0,
                     status="pending",
                     accepted_by_user_id=None,
                     accepted_at=None),
            ])
            print(f"  maintenance_schedule_recommendations: +{n}")

            # ── schema_normalization_log ──────────────────────────────────────
            n = await _upsert(session, SchemaNormalizationLog, "id", [
                dict(id="snl-001",
                     action_type="tag_rename",
                     target_tags=["FIC-101.PV", "FIC101_PV"],
                     detail="Normalised PI tag FIC101_PV to IEC 61346 format FIC-101.PV "
                            "across 14 historian connections",
                     status="success",
                     applied_at=datetime(2026, 3, 10, 3, 0),
                     applied_by_user_id="user-admin"),
                dict(id="snl-002",
                     action_type="unit_conversion",
                     target_tags=["TI-201.PV", "TI-202.PV", "TI-203.PV"],
                     detail="Converted temperature tags from °F to °C for consistency with "
                            "EAIOS ML feature pipeline",
                     status="success",
                     applied_at=datetime(2026, 3, 15, 2, 30),
                     applied_by_user_id="user-admin"),
                dict(id="snl-003",
                     action_type="dead_tag_removal",
                     target_tags=["PI-009.SV", "FT-004.BADPV"],
                     detail="Removed 2 decommissioned tags from active polling list; "
                            "model inputs unaffected",
                     status="success",
                     applied_at=datetime(2026, 4, 1, 4, 0),
                     applied_by_user_id="user-admin"),
            ])
            print(f"  schema_normalization_log: +{n}")

            # ── training_enrollments ──────────────────────────────────────────
            n = await _upsert(session, TrainingEnrollment, "id", [
                dict(id="te-001", user_id="user-eng-ruw",
                     module_id="mod-eaios-101",
                     enrolled_at=datetime(2026, 2, 1, 8, 0),
                     completed_at=datetime(2026, 2, 3, 16, 0),
                     assessment_score_pct=88.5,
                     certification_earned=True, status="completed"),
                dict(id="te-002", user_id="user-eng-ruw",
                     module_id="mod-eaios-201",
                     enrolled_at=datetime(2026, 2, 5, 8, 0),
                     completed_at=datetime(2026, 2, 6, 12, 0),
                     assessment_score_pct=92.0,
                     certification_earned=True, status="completed"),
                dict(id="te-003", user_id="user-eng-hou",
                     module_id="mod-eaios-101",
                     enrolled_at=datetime(2026, 2, 1, 8, 0),
                     completed_at=datetime(2026, 2, 4, 17, 0),
                     assessment_score_pct=79.0,
                     certification_earned=False, status="completed"),
                dict(id="te-004", user_id="user-op-rot",
                     module_id="mod-eaios-101",
                     enrolled_at=datetime(2026, 3, 1, 8, 0),
                     completed_at=None,
                     assessment_score_pct=None,
                     certification_earned=False, status="in-progress"),
                dict(id="te-005", user_id="user-eng-hou",
                     module_id="mod-eaios-301",
                     enrolled_at=datetime(2026, 3, 15, 8, 0),
                     completed_at=None,
                     assessment_score_pct=None,
                     certification_earned=False, status="not-started"),
            ])
            print(f"  training_enrollments: +{n}")

            # ── vessel_schedules ──────────────────────────────────────────────
            n = await _upsert(session, VesselSchedule, "id", [
                dict(id="vs-001", vessel_name="MV Shetland Supplier",
                     vessel_type="PSV",
                     platform_id="plat-magnus",
                     departure_time=datetime(2026, 4, 14, 6, 0),
                     arrival_time=datetime(2026, 4, 14, 18, 0),
                     cargo_description="Drill string, cement sacks, potable water 200T",
                     status="scheduled"),
                dict(id="vs-002", vessel_name="MV Forties Pioneer",
                     vessel_type="AHTS",
                     platform_id="plat-forties",
                     departure_time=datetime(2026, 4, 15, 4, 0),
                     arrival_time=datetime(2026, 4, 15, 12, 0),
                     cargo_description="Anchor handling and tow-out support",
                     status="scheduled"),
                dict(id="vs-003", vessel_name="MV Atlantic Scout",
                     vessel_type="PSV",
                     platform_id="plat-schiehallion",
                     departure_time=datetime(2026, 4, 13, 10, 0),
                     arrival_time=datetime(2026, 4, 14, 2, 0),
                     cargo_description="Production chemicals, spare parts pallet x3",
                     status="en-route"),
            ])
            print(f"  vessel_schedules: +{n}")

            # ── weather_forecasts ─────────────────────────────────────────────
            n = await _upsert(session, WeatherForecast, "id", [
                dict(id="wf-001", platform_id="plat-magnus",
                     forecast_date=datetime(2026, 4, 14),
                     wave_height_m=1.8, wind_speed_kt=18.0,
                     visibility_nm=10.0, is_workable=True),
                dict(id="wf-002", platform_id="plat-magnus",
                     forecast_date=datetime(2026, 4, 15),
                     wave_height_m=3.5, wind_speed_kt=32.0,
                     visibility_nm=4.0, is_workable=False),
                dict(id="wf-003", platform_id="plat-forties",
                     forecast_date=datetime(2026, 4, 14),
                     wave_height_m=2.1, wind_speed_kt=22.0,
                     visibility_nm=8.0, is_workable=True),
                dict(id="wf-004", platform_id="plat-schiehallion",
                     forecast_date=datetime(2026, 4, 14),
                     wave_height_m=2.8, wind_speed_kt=25.0,
                     visibility_nm=6.0, is_workable=True),
            ])
            print(f"  weather_forecasts: +{n}")

        print("\nAll 19 tables seeded successfully.")


async def main() -> None:
    print("Seeding remaining 19 empty tables...\n")
    await seed()


if __name__ == "__main__":
    asyncio.run(main())
