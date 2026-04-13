"""MICRO-09b — Seed: Equipment + Sensor Readings.

Run from backend/ directory:
    python seed_09b_equipment.py
"""
import asyncio
import os
import sys
from datetime import datetime, timedelta
import random

sys.path.insert(0, os.path.dirname(__file__))

from src.models.database import engine, Base
from src.models.core import Equipment, SensorReading
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

EQUIPMENT = [
    dict(id="eq-c101", tag="C-101", name="Centrifugal Compressor · MAN Turbomachinery Series-7",
         equipment_type="Compressor", site_id="site-ruwais",
         manufacturer="MAN Turbomachinery", model_number="Series-7",
         health_score=38.0, rul_hours=48.0, ai_status="critical"),
    dict(id="eq-e212", tag="E-212", name="Shell & Tube Exchanger · Lummus 400v Series",
         equipment_type="Heat Exchanger", site_id="site-houston",
         manufacturer="Lummus", model_number="400v",
         health_score=52.0, rul_hours=72.0, ai_status="critical"),
    dict(id="eq-p205", tag="P-205", name="Centrifugal Pump · KSB Multitec 100-8",
         equipment_type="Pump", site_id="site-houston",
         manufacturer="KSB", model_number="Multitec 100-8",
         health_score=64.0, rul_hours=192.0, ai_status="warning"),
    dict(id="eq-t405", tag="T-405", name="Gas Turbine · GE Onsite-100A",
         equipment_type="Turbine", site_id="site-rastanura",
         manufacturer="GE", model_number="Onsite-100A",
         health_score=72.0, rul_hours=336.0, ai_status="warning"),
    dict(id="eq-k302", tag="K-302", name="Screw Compressor · Siemens SGT-800",
         equipment_type="Compressor", site_id="site-jamnagar",
         manufacturer="Siemens", model_number="SGT-800",
         health_score=91.0, rul_hours=1080.0, ai_status="healthy"),
    dict(id="eq-f101", tag="F-101", name="Fired Heater · Foster Wheeler",
         equipment_type="Heater", site_id="site-rotterdam",
         manufacturer="Foster Wheeler", model_number="FW-400",
         health_score=79.0, rul_hours=984.0, ai_status="healthy"),
    dict(id="eq-v307", tag="V-307", name="Pressure Vessel · ASME VIII Div 1",
         equipment_type="Vessel", site_id="site-ruwais",
         manufacturer="ASME", model_number="VIII-D1",
         health_score=84.0, rul_hours=2160.0, ai_status="healthy"),
    dict(id="eq-e501", tag="E-501", name="Pre-heater · Alfa Laval M30",
         equipment_type="Heat Exchanger", site_id="site-rotterdam",
         manufacturer="Alfa Laval", model_number="M30",
         health_score=93.0, rul_hours=1872.0, ai_status="healthy"),
    dict(id="eq-t103", tag="T-103", name="Storage Tank · API 650",
         equipment_type="Tank", site_id="site-ruwais",
         manufacturer="API", model_number="650",
         health_score=96.0, rul_hours=2040.0, ai_status="healthy"),
]

# Sensor types per equipment type
SENSOR_MAP = {
    "Compressor": [("vibration", "VIB", "mm/s"), ("temperature", "TEMP", "°C"), ("pressure", "PRES", "bar")],
    "Heat Exchanger": [("temperature", "TEMP_IN", "°C"), ("temperature", "TEMP_OUT", "°C"), ("pressure", "DP", "bar")],
    "Pump": [("vibration", "VIB", "mm/s"), ("flow", "FLOW", "m3/h"), ("pressure", "SUCT_P", "bar")],
    "Turbine": [("vibration", "VIB", "mm/s"), ("temperature", "EXH_TEMP", "°C"), ("current", "SPEED", "rpm")],
    "Heater": [("temperature", "FLUE_TEMP", "°C"), ("pressure", "DRAFT", "mmH2O"), ("flow", "FUEL_FLOW", "kg/h")],
    "Vessel": [("pressure", "PRES", "bar"), ("temperature", "TEMP", "°C")],
    "Tank": [("pressure", "LEVEL", "m"), ("temperature", "TEMP", "°C")],
}


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        for eq in EQUIPMENT:
            existing = await session.get(Equipment, eq["id"])
            if existing is None:
                session.add(Equipment(**eq))
                print(f"  + Equipment {eq['tag']} — {eq['ai_status'].upper()}")
            else:
                print(f"  ~ Equipment {eq['tag']} exists, skipping")

        await session.commit()

        # Add 24h of hourly sensor readings for critical equipment
        critical = ["eq-c101", "eq-e212", "eq-p205"]
        now = datetime.utcnow()
        readings_added = 0
        for eq_id in critical:
            eq_obj = next(e for e in EQUIPMENT if e["id"] == eq_id)
            sensors = SENSOR_MAP.get(eq_obj["equipment_type"], [("vibration", "VIB", "mm/s")])
            for hours_ago in range(24, 0, -1):
                ts = now - timedelta(hours=hours_ago)
                for sensor_type, tag_name, unit in sensors:
                    val = round(random.uniform(1.5, 9.5), 2)
                    session.add(SensorReading(
                        equipment_id=eq_id,
                        tag_name=f"{eq_obj['tag']}-{tag_name}",
                        sensor_type=sensor_type,
                        value=val,
                        unit=unit,
                        timestamp=ts,
                    ))
                    readings_added += 1

        await session.commit()
        print(f"\n✅ MICRO-09b complete — {len(EQUIPMENT)} equipment, {readings_added} sensor readings seeded.")


if __name__ == "__main__":
    asyncio.run(seed())
