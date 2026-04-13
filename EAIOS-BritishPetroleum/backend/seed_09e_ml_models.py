"""MICRO-09e — Seed: ML Models + ROI KPIs + Energy targets.

Run from backend/ directory:
    python seed_09e_ml_models.py
"""
import asyncio
import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from src.models.database import engine, Base
from src.models.ml_models import MLModel, ShapFeatureImportance
from src.models.roi import KpiSnapshot
from src.models.energy import EnergyTarget
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

now = datetime.utcnow()

ML_MODELS = [
    dict(id="mdl-001", model_code="MDL-001", name="Bearing Fault LSTM",
         model_type="LSTM", version="v3.2.1", status="production",
         trained_on=datetime(2026, 4, 1), accuracy=0.963, precision=0.951,
         recall=0.948, f1_score=0.949, training_samples=128000,
         assets_monitored=40, drift_status="OK",
         approval_status="approved", is_champion=True),
    dict(id="mdl-002", model_code="MDL-002", name="Fouling Detection XGBoost",
         model_type="XGBoost", version="v2.8.0", status="production",
         trained_on=datetime(2026, 3, 15), accuracy=0.931, precision=0.924,
         recall=0.918, f1_score=0.921, training_samples=84000,
         assets_monitored=28, drift_status="OK",
         approval_status="approved", is_champion=False),
    dict(id="mdl-003", model_code="MDL-003", name="Cavitation CNN",
         model_type="CNN", version="v1.4.2", status="production",
         trained_on=datetime(2026, 2, 20), accuracy=0.912, precision=0.907,
         recall=0.899, f1_score=0.903, training_samples=96000,
         assets_monitored=35, drift_status="WARNING",
         approval_status="approved", is_champion=False),
    dict(id="mdl-004", model_code="MDL-004", name="Turbine Blade Erosion RF",
         model_type="RandomForest", version="v1.1.0", status="staging",
         trained_on=datetime(2026, 3, 28), accuracy=0.888, precision=0.881,
         recall=0.876, f1_score=0.878, training_samples=42000,
         assets_monitored=12, drift_status="OK",
         approval_status="pending", is_champion=False),
    dict(id="mdl-005", model_code="MDL-005", name="RUL Prediction Transformer",
         model_type="Transformer", version="v0.9.0", status="staging",
         trained_on=datetime(2026, 4, 5), accuracy=0.847, precision=0.839,
         recall=0.831, f1_score=0.835, training_samples=210000,
         assets_monitored=0, drift_status="OK",
         approval_status="pending", is_champion=False),
]

SHAP_FEATURES = [
    dict(model_id="mdl-001", feature_name="Bearing vibration (DE)",
         importance_score=0.42, direction="positive", sort_order=1),
    dict(model_id="mdl-001", feature_name="Lube oil temperature",
         importance_score=0.28, direction="positive", sort_order=2),
    dict(model_id="mdl-001", feature_name="Discharge pressure",
         importance_score=0.18, direction="positive", sort_order=3),
    dict(model_id="mdl-001", feature_name="Motor current draw",
         importance_score=0.12, direction="positive", sort_order=4),
]

KPI_SNAPSHOTS = [
    dict(id="kpi-001", site_id="site-ruwais", scope="site",
         snapshot_date=now, mtbf_hours=312.0, mttr_hours=6.2, oee_pct=78.4),
    dict(id="kpi-002", site_id="site-houston", scope="site",
         snapshot_date=now, mtbf_hours=480.0, mttr_hours=4.8, oee_pct=85.1),
    dict(id="kpi-003", site_id="site-rotterdam", scope="site",
         snapshot_date=now, mtbf_hours=520.0, mttr_hours=4.2, oee_pct=88.3),
    dict(id="kpi-004", site_id=None, scope="fleet",
         snapshot_date=now, mtbf_hours=437.0, mttr_hours=5.1, oee_pct=83.2),
]

ENERGY_TARGETS = [
    dict(id="etgt-001", site_id="site-ruwais", fiscal_year=2026,
         target_gj_per_t=35.2, target_co2_per_t=9.8),
    dict(id="etgt-002", site_id="site-houston", fiscal_year=2026,
         target_gj_per_t=29.6, target_co2_per_t=8.2),
    dict(id="etgt-003", site_id="site-rotterdam", fiscal_year=2026,
         target_gj_per_t=26.7, target_co2_per_t=7.4),
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        for m in ML_MODELS:
            if not await session.get(MLModel, m["id"]):
                session.add(MLModel(**m))
                print(f"  + MLModel {m['model_code']} {m['version']} — {m['status']}")

        for sf in SHAP_FEATURES:
            session.add(ShapFeatureImportance(**sf))

        for kpi in KPI_SNAPSHOTS:
            if not await session.get(KpiSnapshot, kpi["id"]):
                session.add(KpiSnapshot(**kpi))
                print(f"  + KPI {kpi['scope']} site={kpi['site_id']}")

        for etgt in ENERGY_TARGETS:
            if not await session.get(EnergyTarget, etgt["id"]):
                session.add(EnergyTarget(**etgt))
                print(f"  + EnergyTarget site {etgt['site_id']} {etgt['fiscal_year']}")

        await session.commit()
        print(f"\n✅ MICRO-09e complete — {len(ML_MODELS)} ML models, {len(SHAP_FEATURES)} SHAP features, {len(KPI_SNAPSHOTS)} KPIs, {len(ENERGY_TARGETS)} energy targets seeded.")


if __name__ == "__main__":
    asyncio.run(seed())
