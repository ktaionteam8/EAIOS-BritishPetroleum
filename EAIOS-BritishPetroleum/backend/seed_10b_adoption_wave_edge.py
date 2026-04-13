"""DB-03b — Seed: Adoption, Wave Tracker, Edge AI tables.

Run from backend/ directory:
    python seed_10b_adoption_wave_edge.py

Note: seed_09a (sites/users) and seed_09e (ml_models) must run first.
      This script is idempotent — safe to run multiple times.
"""
import asyncio
import os
import sys
from datetime import datetime

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker
from src.models.database import engine
from src.models.adoption import (
    AdoptionMetric, TrainingModule, AdoptionBarrier, ChangeChampion,
)
from src.models.wave_tracker import ImplementationWave, WaveMilestone, DeliveryRisk
from src.models.edge_ai import EdgeNode, EdgeModelDeployment, LatencyBenchmark

AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# ── Adoption Metrics ────────────────────────────────────────────────────────
ADOPTION_METRICS = [
    dict(id="adm-ruw-q1", site_id="site-ruwais", metric_date=datetime(2026, 3, 31),
         total_users=38, active_users=31, avg_response_time_min=14.2,
         avg_alert_action_rate_pct=84.7, training_completion_rate_pct=92.1,
         adoption_score=88.4),
    dict(id="adm-hou-q1", site_id="site-houston", metric_date=datetime(2026, 3, 31),
         total_users=29, active_users=21, avg_response_time_min=22.6,
         avg_alert_action_rate_pct=71.3, training_completion_rate_pct=78.5,
         adoption_score=74.2),
    dict(id="adm-rot-q1", site_id="site-rotterdam", metric_date=datetime(2026, 3, 31),
         total_users=34, active_users=28, avg_response_time_min=17.8,
         avg_alert_action_rate_pct=79.4, training_completion_rate_pct=88.0,
         adoption_score=82.1),
    dict(id="adm-rst-q1", site_id="site-rastanura", metric_date=datetime(2026, 3, 31),
         total_users=42, active_users=19, avg_response_time_min=38.4,
         avg_alert_action_rate_pct=56.8, training_completion_rate_pct=61.2,
         adoption_score=58.3),
    dict(id="adm-jam-q1", site_id="site-jamnagar", metric_date=datetime(2026, 3, 31),
         total_users=51, active_users=44, avg_response_time_min=11.3,
         avg_alert_action_rate_pct=91.2, training_completion_rate_pct=95.8,
         adoption_score=93.6),
]

TRAINING_MODULES = [
    dict(id="mod-eaios-101", code="EAIOS-101", name="EAIOS Platform Fundamentals",
         module_type="mandatory", description="Introduction to dashboards, alerts, and navigation",
         due_date=datetime(2026, 5, 1), estimated_duration_hours=2.0,
         target_completion_pct=100.0, is_active=True),
    dict(id="mod-eaios-201", code="EAIOS-201", name="Alert Triage & Response Workflow",
         module_type="mandatory", description="How to action critical and warning alerts",
         due_date=datetime(2026, 5, 15), estimated_duration_hours=1.5,
         target_completion_pct=100.0, is_active=True),
    dict(id="mod-eaios-301", code="EAIOS-301", name="Digital Twin Scenario Analysis",
         module_type="optional", description="Running what-if scenarios on the digital twin",
         due_date=None, estimated_duration_hours=3.0,
         target_completion_pct=60.0, is_active=True),
    dict(id="mod-eaios-401", code="EAIOS-401", name="ML Model Governance & Champion Challenger",
         module_type="optional", description="Approving models, reviewing drift, running A/B tests",
         due_date=None, estimated_duration_hours=2.5,
         target_completion_pct=40.0, is_active=True),
]

ADOPTION_BARRIERS = [
    dict(id="bar-001", theme="Alert Fatigue — Too Many Low-Priority Notifications",
         description="Operators are dismissing alerts without investigation due to volume",
         priority="high", vote_count=34, status="being-addressed"),
    dict(id="bar-002", theme="Language Barrier — UI Not Localised for Jamnagar Site",
         description="Non-English speaking operators struggle with English-only interface",
         priority="medium", vote_count=18, status="open"),
    dict(id="bar-003", theme="Shift Handover Gap — No Mobile Access to EAIOS",
         description="Operators cannot check alerts on mobile during shift handover",
         priority="high", vote_count=27, status="open"),
    dict(id="bar-004", theme="Training Relevance — Modules Too Theoretical",
         description="Training scenarios do not reflect real-world site conditions",
         priority="medium", vote_count=12, status="open"),
]

CHANGE_CHAMPIONS = [
    dict(id="cc-001", user_id="user-eng-ruw", site_id="site-ruwais",
         role="Site Lead Champion", sessions_count=284, alerts_actioned_count=167,
         training_completion_pct=100.0),
    dict(id="cc-002", user_id="user-eng-hou", site_id="site-houston",
         role="Reliability Champion", sessions_count=198, alerts_actioned_count=112,
         training_completion_pct=87.5),
    dict(id="cc-003", user_id="user-op-rot", site_id="site-rotterdam",
         role="Operator Champion", sessions_count=156, alerts_actioned_count=94,
         training_completion_pct=75.0),
]

# ── Implementation Waves ────────────────────────────────────────────────────
WAVES = [
    dict(id="wave-01", wave_number=1, wave_name="Foundation — Core Predictive Maintenance",
         period_start=datetime(2025, 10, 1), period_end=datetime(2026, 3, 31),
         status="completed", pct_complete=100.0, budget_usd=4_200_000.0,
         actual_spent_usd=4_080_000.0, forecast_usd=4_080_000.0,
         sites_in_scope=["site-ruwais", "site-houston"],
         modules=["predictive-maintenance", "live-alerts", "equipment-health"]),
    dict(id="wave-02", wave_number=2, wave_name="Expansion — Castrol, Digital Twin, Offshore",
         period_start=datetime(2026, 4, 1), period_end=datetime(2026, 9, 30),
         status="in-progress", pct_complete=18.5, budget_usd=6_100_000.0,
         actual_spent_usd=1_127_000.0, forecast_usd=6_350_000.0,
         sites_in_scope=["site-rotterdam", "site-rastanura"],
         modules=["castrol", "digital-twin", "offshore", "field-ops"]),
    dict(id="wave-03", wave_number=3, wave_name="Enterprise Scale — Edge AI & OT Integration",
         period_start=datetime(2026, 10, 1), period_end=datetime(2027, 3, 31),
         status="planned", pct_complete=0.0, budget_usd=5_800_000.0,
         actual_spent_usd=0.0, forecast_usd=None,
         sites_in_scope=["site-jamnagar"],
         modules=["edge-ai", "ot-data", "energy", "compliance"]),
]

WAVE_MILESTONES = [
    dict(id="ms-w1-01", milestone_code="W1-M1", wave_id="wave-01",
         description="Ruwais Site Go-Live — Predictive Maintenance",
         due_date=datetime(2026, 1, 15), owner="James Smith",
         owner_id="user-eng-ruw", status="done",
         completion_date=datetime(2026, 1, 12)),
    dict(id="ms-w1-02", milestone_code="W1-M2", wave_id="wave-01",
         description="Houston Site Go-Live — Equipment Health Dashboard",
         due_date=datetime(2026, 3, 1), owner="Sunita Patel",
         owner_id="user-eng-hou", status="done",
         completion_date=datetime(2026, 2, 28)),
    dict(id="ms-w2-01", milestone_code="W2-M1", wave_id="wave-02",
         description="Rotterdam — Castrol Blending AI Integration",
         due_date=datetime(2026, 6, 30), owner="Mark van Dijk",
         owner_id="user-op-rot", status="in-progress", completion_date=None),
    dict(id="ms-w3-01", milestone_code="W3-M1", wave_id="wave-03",
         description="Jamnagar — Edge Node Hardware Installation",
         due_date=datetime(2026, 12, 1), owner=None,
         owner_id=None, status="pending", completion_date=None),
]

DELIVERY_RISKS = [
    dict(id="dr-001", risk_code="R-001", wave_id="wave-02",
         description="OT network firewall rules delaying PI Historian integration",
         impact_description="Wave 2 OT Data module delayed by up to 8 weeks",
         probability="high",
         mitigation_plan="Engage IT/OT security team; use DMZ data diode approach",
         status="in-progress", owner_id="user-admin"),
    dict(id="dr-002", risk_code="R-002", wave_id="wave-02",
         description="Castrol LIMS API version incompatibility",
         impact_description="Real-time quality predictions cannot ingest LIMS data",
         probability="medium",
         mitigation_plan="Develop CSV file-drop fallback until LIMS upgrades to v4",
         status="open", owner_id="user-eng-hou"),
    dict(id="dr-003", risk_code="R-003", wave_id="wave-03",
         description="Jetson Orin hardware supply chain constraints",
         impact_description="Edge node delivery lead time extended to 18 weeks",
         probability="medium",
         mitigation_plan="Pre-order 12 units now; use GPU cloud as interim fallback",
         status="open", owner_id=None),
]

# ── Edge AI ─────────────────────────────────────────────────────────────────
EDGE_NODES = [
    dict(id="edge-ruw-01", node_code="EDGE-RUW-01", site_id="site-ruwais",
         hardware_spec="NVIDIA Jetson Orin NX 16GB", status="online",
         inference_offload_pct=68.4, avg_latency_ms=14.2,
         cpu_usage_pct=42.1, memory_usage_pct=61.8, disk_usage_pct=38.5,
         installed_at=datetime(2026, 2, 1), last_sync_at=datetime(2026, 4, 13, 10, 45),
         last_sync_label="2 min ago"),
    dict(id="edge-hou-01", node_code="EDGE-HOU-01", site_id="site-houston",
         hardware_spec="NVIDIA Jetson Orin NX 16GB", status="degraded",
         inference_offload_pct=31.2, avg_latency_ms=28.7,
         cpu_usage_pct=87.4, memory_usage_pct=91.2, disk_usage_pct=72.3,
         installed_at=datetime(2026, 2, 15), last_sync_at=datetime(2026, 4, 13, 9, 10),
         last_sync_label="98 min ago"),
    dict(id="edge-rot-01", node_code="EDGE-ROT-01", site_id="site-rotterdam",
         hardware_spec="NVIDIA Jetson AGX Orin 64GB", status="online",
         inference_offload_pct=82.6, avg_latency_ms=9.8,
         cpu_usage_pct=55.3, memory_usage_pct=48.7, disk_usage_pct=29.1,
         installed_at=datetime(2026, 3, 1), last_sync_at=datetime(2026, 4, 13, 10, 47),
         last_sync_label="30 sec ago"),
]

EDGE_DEPLOYMENTS = [
    dict(id="edep-001", model_id="mdl-001", node_id="edge-ruw-01",
         model_version="v3.2.1-quant", model_size_mb=42.8,
         quantization_method="INT8", deployment_status="deployed",
         deployed_at=datetime(2026, 2, 10),
         last_inference_at=datetime(2026, 4, 13, 10, 44)),
    dict(id="edep-002", model_id="mdl-001", node_id="edge-rot-01",
         model_version="v3.2.1-quant", model_size_mb=42.8,
         quantization_method="INT8", deployment_status="deployed",
         deployed_at=datetime(2026, 3, 5),
         last_inference_at=datetime(2026, 4, 13, 10, 47)),
    dict(id="edep-003", model_id="mdl-001", node_id="edge-hou-01",
         model_version="v3.1.0-quant", model_size_mb=44.1,
         quantization_method="INT8", deployment_status="failed",
         deployed_at=datetime(2026, 2, 20), last_inference_at=None),
]

LATENCY_BENCHMARKS = [
    dict(id="lb-001", scenario_description="Bearing fault classification (single reading)",
         edge_latency_ms=14.2, cloud_latency_ms=284.0, latency_saving_pct=95.0,
         benchmark_date=datetime(2026, 3, 15), node_id="edge-ruw-01"),
    dict(id="lb-002", scenario_description="Vibration FFT analysis (1024-point)",
         edge_latency_ms=18.7, cloud_latency_ms=412.0, latency_saving_pct=95.5,
         benchmark_date=datetime(2026, 3, 15), node_id="edge-ruw-01"),
    dict(id="lb-003", scenario_description="SHAP explanation generation",
         edge_latency_ms=31.4, cloud_latency_ms=680.0, latency_saving_pct=95.4,
         benchmark_date=datetime(2026, 3, 20), node_id="edge-rot-01"),
]


async def _upsert(session: AsyncSession, model, pk: str, data: dict) -> None:
    existing = await session.get(model, data[pk])
    if existing is None:
        session.add(model(**data))


async def seed():
    async with AsyncSessionLocal() as session:
        print("Seeding adoption metrics...")
        for row in ADOPTION_METRICS:
            await _upsert(session, AdoptionMetric, "id", row)

        print("Seeding training modules...")
        for row in TRAINING_MODULES:
            await _upsert(session, TrainingModule, "id", row)

        print("Seeding adoption barriers...")
        for row in ADOPTION_BARRIERS:
            await _upsert(session, AdoptionBarrier, "id", row)

        print("Seeding change champions...")
        for row in CHANGE_CHAMPIONS:
            await _upsert(session, ChangeChampion, "id", row)

        print("Seeding implementation waves...")
        for row in WAVES:
            await _upsert(session, ImplementationWave, "id", row)

        print("Seeding wave milestones...")
        for row in WAVE_MILESTONES:
            await _upsert(session, WaveMilestone, "id", row)

        print("Seeding delivery risks...")
        for row in DELIVERY_RISKS:
            await _upsert(session, DeliveryRisk, "id", row)

        print("Seeding edge nodes...")
        for row in EDGE_NODES:
            await _upsert(session, EdgeNode, "id", row)

        print("Seeding edge model deployments...")
        for row in EDGE_DEPLOYMENTS:
            await _upsert(session, EdgeModelDeployment, "id", row)

        print("Seeding latency benchmarks...")
        for row in LATENCY_BENCHMARKS:
            await _upsert(session, LatencyBenchmark, "id", row)

        await session.commit()
        print("\n✅ DB-03b complete — adoption (5+4+4+3), waves (3+4+3), edge (3+3+3) seeded.")


if __name__ == "__main__":
    asyncio.run(seed())
