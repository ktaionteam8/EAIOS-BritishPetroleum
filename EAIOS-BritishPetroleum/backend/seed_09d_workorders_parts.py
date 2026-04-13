"""MICRO-09d — Seed: Work Orders + Spare Parts.

Run from backend/ directory:
    python seed_09d_workorders_parts.py
"""
import asyncio
import os
import sys
from datetime import datetime, timedelta

sys.path.insert(0, os.path.dirname(__file__))

from src.models.database import engine, Base
from src.models.work_orders import WorkOrder, WoPart
from src.models.spare_parts import SparePart, SparePartStock, ProcurementOrder
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

now = datetime.utcnow()

WORK_ORDERS = [
    dict(id="wo-001", wo_number="WO-2026-001", title="Replace inner-race bearing C-101",
         equipment_id="eq-c101", site_id="site-ruwais", priority="critical",
         status="open", ai_generated=True, s4hana_ready=True,
         estimated_duration_hours=6.0, cost_estimate=18400.0,
         scheduled_start=now + timedelta(hours=4), due_date=now + timedelta(hours=10),
         description="AI-generated WO: 97.3% bearing failure probability. Replace MAN #7B-2241-ZZ bearing. Flush lube oil."),
    dict(id="wo-002", wo_number="WO-2026-002", title="Chemical clean E-212 tube bundle",
         equipment_id="eq-e212", site_id="site-houston", priority="high",
         status="open", ai_generated=True, s4hana_ready=True,
         estimated_duration_hours=8.0, cost_estimate=12500.0,
         scheduled_start=now + timedelta(hours=24), due_date=now + timedelta(hours=32),
         description="Fouling detected. ΔP 2.8 bar across tubes. Chemical cleaning required."),
    dict(id="wo-003", wo_number="WO-2026-003", title="Inspect P-205 impeller balance",
         equipment_id="eq-p205", site_id="site-houston", priority="medium",
         status="scheduled", ai_generated=True, s4hana_ready=False,
         estimated_duration_hours=4.0, cost_estimate=3200.0,
         scheduled_start=now + timedelta(days=3), due_date=now + timedelta(days=3, hours=4),
         description="Vibration anomaly detected. Inspect impeller for wear or imbalance."),
    dict(id="wo-004", wo_number="WO-2026-004", title="Turbine T-405 blade inspection",
         equipment_id="eq-t405", site_id="site-rastanura", priority="medium",
         status="scheduled", ai_generated=False, s4hana_ready=False,
         estimated_duration_hours=12.0, cost_estimate=28000.0,
         scheduled_start=now + timedelta(days=7), due_date=now + timedelta(days=7, hours=12),
         description="Scheduled blade erosion inspection. Borescope inspection of all 18 blades."),
]

SPARE_PARTS = [
    dict(id="sp-001", part_number="7B-2241-ZZ",
         description="Bearing Assembly MAN Series-7 — inner race bearing for MAN Turbomachinery Series-7",
         equipment_types=["Compressor"], supplier="MAN Turbomachinery",
         unit_cost=4200.0, lead_time_days=3, criticality_score=5),
    dict(id="sp-002", part_number="MS-400-KIT",
         description="Mechanical Seal Kit MS-400 — complete seal kit for KSB Multitec pumps",
         equipment_types=["Pump"], supplier="KSB",
         unit_cost=1850.0, lead_time_days=5, criticality_score=4),
    dict(id="sp-003", part_number="IP-100-8-SET",
         description="Impeller Set IP-100-8 — replacement impeller set for KSB Multitec 100-8",
         equipment_types=["Pump"], supplier="KSB",
         unit_cost=6400.0, lead_time_days=14, criticality_score=4),
    dict(id="sp-004", part_number="LF-7A",
         description="Lube Oil Filter LF-7A — high-performance filter for SGT-800 compressors",
         equipment_types=["Compressor"], supplier="Siemens",
         unit_cost=380.0, lead_time_days=2, criticality_score=3),
    dict(id="sp-005", part_number="CH-SGT8",
         description="Coupling Half CH-SGT8 — drive train coupling for Siemens SGT-800",
         equipment_types=["Compressor"], supplier="Siemens",
         unit_cost=9200.0, lead_time_days=21, criticality_score=4),
]

STOCKS = [
    dict(id="stk-001", part_id="sp-001", site_id="site-ruwais", on_hand_qty=0, min_qty=4, on_order_qty=4),
    dict(id="stk-002", part_id="sp-002", site_id="site-houston", on_hand_qty=2, min_qty=4, on_order_qty=0),
    dict(id="stk-003", part_id="sp-003", site_id="site-houston", on_hand_qty=1, min_qty=2, on_order_qty=0),
    dict(id="stk-004", part_id="sp-004", site_id="site-jamnagar", on_hand_qty=3, min_qty=4, on_order_qty=0),
    dict(id="stk-005", part_id="sp-005", site_id="site-jamnagar", on_hand_qty=0, min_qty=2, on_order_qty=0),
]

WO_PARTS = [
    dict(work_order_id="wo-001", part_id="sp-001",
         part_number="7B-2241-ZZ", description="MAN Series-7 bearing assembly",
         quantity=2, status="pending"),
    dict(work_order_id="wo-002", part_id="sp-002",
         part_number="MS-400-KIT", description="Mechanical seal kit",
         quantity=1, status="reserved"),
    dict(work_order_id="wo-003", part_id="sp-003",
         part_number="IP-100-8-SET", description="Impeller replacement set",
         quantity=1, status="pending"),
]

PROCUREMENT = [
    dict(id="po-001", po_number="PO-2026-001", part_id="sp-001", site_id="site-ruwais",
         quantity=4, unit_cost=4200.0, total_cost=16800.0,
         status="confirmed",
         ordered_date=now, expected_delivery=now + timedelta(days=3), urgency_days=3),
    dict(id="po-002", po_number="PO-2026-002", part_id="sp-004", site_id="site-jamnagar",
         quantity=6, unit_cost=380.0, total_cost=2280.0,
         status="ordered",
         ordered_date=now, expected_delivery=now + timedelta(days=2), urgency_days=7),
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        for wo in WORK_ORDERS:
            if not await session.get(WorkOrder, wo["id"]):
                session.add(WorkOrder(**wo))
                print(f"  + WO {wo['wo_number']} — {wo['priority'].upper()}")

        for sp in SPARE_PARTS:
            if not await session.get(SparePart, sp["id"]):
                session.add(SparePart(**sp))
                print(f"  + Part {sp['part_number']}")

        for stk in STOCKS:
            if not await session.get(SparePartStock, stk["id"]):
                session.add(SparePartStock(**stk))

        for wop in WO_PARTS:
            session.add(WoPart(**wop))

        for po in PROCUREMENT:
            if not await session.get(ProcurementOrder, po["id"]):
                session.add(ProcurementOrder(**po))
                print(f"  + PO {po['po_number']} — {po['status']}")

        await session.commit()
        print("\n✅ MICRO-09d complete — 4 WOs, 5 parts, 5 stocks, 2 POs seeded.")


if __name__ == "__main__":
    asyncio.run(seed())
