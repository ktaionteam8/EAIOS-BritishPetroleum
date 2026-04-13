"""MICRO-09c — Seed: Alerts + SHAP signals + Analogues.

Run from backend/ directory:
    python seed_09c_alerts.py
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from src.models.database import engine, Base
from src.models.alerts import Alert, AlertShapSignal, AlertAnalogue
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

ALERTS = [
    dict(
        id="alt-001",
        alert_code="ALT-001",
        severity="critical",
        title="Bearing Failure Predicted — Compressor C-101",
        equipment_id="eq-c101",
        site_id="site-ruwais",
        details="Loop 4A · Vibration 8.4 mm/s",
        failure_mode="Inner Race Bearing Fault",
        probability=0.973,
        etf_days=2.0,
        etf_min=1.0,
        etf_max=4.0,
        recommendation="replace",
        status="active",
        shap_signals=[
            dict(signal_name="Bearing vibration (DE)", values=[1.2,1.4,1.8,2.5,3.1,4.2,5.8,8.4],
                 contribution=0.42, unit="mm/s", sort_order=0),
            dict(signal_name="Lube oil temp", values=[62,64,67,71,76,82,89,96],
                 contribution=0.28, unit="°C", sort_order=1),
            dict(signal_name="Discharge pressure", values=[42,42,43,44,46,49,52,55],
                 contribution=0.18, unit="bar", sort_order=2),
            dict(signal_name="Motor current", values=[310,311,312,314,317,322,328,335],
                 contribution=0.12, unit="A", sort_order=3),
        ],
        analogues=[
            dict(site_name="Rotterdam, NL", event_date="Mar 2024",
                 outcome="Bearing replaced, 6h downtime", days_to_failure=1, match_score=94),
            dict(site_name="Ruwais, UAE", event_date="Aug 2022",
                 outcome="Catastrophic failure, 72h downtime", days_to_failure=2, match_score=87),
            dict(site_name="Houston, USA", event_date="Nov 2023",
                 outcome="Preventive replacement, 4h downtime", days_to_failure=3, match_score=82),
        ],
    ),
    dict(
        id="alt-002",
        alert_code="ALT-002",
        severity="critical",
        title="Fouling Shutdown Risk — Heat Exchanger E-212",
        equipment_id="eq-e212",
        site_id="site-houston",
        details="VDU Train B · Efficiency -18%",
        failure_mode="Heat Exchanger Fouling",
        probability=0.918,
        etf_days=3.0,
        etf_min=2.0,
        etf_max=5.0,
        recommendation="inspect",
        status="active",
        shap_signals=[
            dict(signal_name="ΔP across tubes", values=[0.8,0.9,1.1,1.3,1.6,1.9,2.3,2.8],
                 contribution=0.38, unit="bar", sort_order=0),
            dict(signal_name="HTC degradation", values=[0,2,5,8,11,13,15,18],
                 contribution=0.31, unit="%", sort_order=1),
            dict(signal_name="Outlet temp", values=[185,187,190,194,199,205,212,219],
                 contribution=0.21, unit="°C", sort_order=2),
        ],
        analogues=[
            dict(site_name="Rotterdam, NL", event_date="Jan 2024",
                 outcome="Chemical cleaning, 8h offline", days_to_failure=3, match_score=91),
            dict(site_name="Ras Tanura, KSA", event_date="Jul 2023",
                 outcome="Tube bundle replaced", days_to_failure=4, match_score=84),
        ],
    ),
    dict(
        id="alt-003",
        alert_code="ALT-003",
        severity="warning",
        title="Vibration Anomaly — Pump P-205",
        equipment_id="eq-p205",
        site_id="site-houston",
        details="CDU Train B · Impeller imbalance",
        failure_mode="Pump Cavitation",
        probability=0.783,
        etf_days=8.0,
        etf_min=5.0,
        etf_max=11.0,
        recommendation="inspect",
        status="active",
        shap_signals=[
            dict(signal_name="Broadband vibration", values=[0.8,0.9,1.0,1.1,1.3,1.5,1.8,2.2],
                 contribution=0.35, unit="mm/s", sort_order=0),
            dict(signal_name="Flow pulsation", values=[1.2,1.4,1.8,2.4,3.1,4.0,4.8,5.3],
                 contribution=0.29, unit="%", sort_order=1),
        ],
        analogues=[
            dict(site_name="Ruwais, UAE", event_date="Apr 2023",
                 outcome="Bearings replaced, monitored", days_to_failure=10, match_score=78),
            dict(site_name="Houston, USA", event_date="Dec 2023",
                 outcome="Process adjustment resolved", days_to_failure=14, match_score=71),
        ],
    ),
    dict(
        id="alt-004",
        alert_code="ALT-004",
        severity="warning",
        title="Blade Erosion Detected — Turbine T-405",
        equipment_id="eq-t405",
        site_id="site-rastanura",
        details="Power Gen Unit 2 · Efficiency -3%",
        failure_mode="Turbine Blade Erosion",
        probability=0.716,
        etf_days=14.0,
        etf_min=10.0,
        etf_max=19.0,
        recommendation="monitor",
        status="active",
        shap_signals=[
            dict(signal_name="Exhaust temp spread", values=[18,21,24,28,33,37,40,44],
                 contribution=0.40, unit="°C", sort_order=0),
            dict(signal_name="Efficiency drop", values=[0.5,0.9,1.2,1.6,2.0,2.4,2.8,3.1],
                 contribution=0.33, unit="%", sort_order=1),
        ],
        analogues=[
            dict(site_name="Rotterdam, NL", event_date="Jan 2025",
                 outcome="Blade cleaning, 12h offline", days_to_failure=12, match_score=88),
        ],
    ),
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        for a in ALERTS:
            existing = await session.get(Alert, a["id"])
            if existing:
                print(f"  ~ Alert {a['alert_code']} exists, skipping")
                continue

            shap_data = a.pop("shap_signals")
            analogue_data = a.pop("analogues")

            alert = Alert(**a)
            session.add(alert)
            await session.flush()

            for s in shap_data:
                session.add(AlertShapSignal(alert_id=alert.id, **s))
            for an in analogue_data:
                session.add(AlertAnalogue(alert_id=alert.id, **an))

            print(f"  + Alert {a['alert_code']} — {a['severity'].upper()} — {len(shap_data)} signals, {len(analogue_data)} analogues")

        await session.commit()
        print("\n✅ MICRO-09c complete — 4 alerts seeded.")


if __name__ == "__main__":
    asyncio.run(seed())
