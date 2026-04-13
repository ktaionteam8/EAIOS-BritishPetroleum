"""MICRO-09a — Seed: Sites + Users.

Run from backend/ directory:
    python seed_09a_sites_users.py
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

from sqlalchemy import text
from src.models.database import engine, Base
from src.models.core import Site, User
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import sessionmaker

AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


SITES = [
    dict(
        id="site-ruwais",
        name="Ruwais Refinery",
        code="RUW",
        country="UAE",
        region="MENA",
        latitude=24.1117,
        longitude=52.7308,
        status="critical",
        refinery_type="Complex",
        capacity_kbpd=417.0,
    ),
    dict(
        id="site-houston",
        name="Houston Refinery",
        code="HOU",
        country="USA",
        region="NAM",
        latitude=29.7604,
        longitude=-95.3698,
        status="warning",
        refinery_type="Complex",
        capacity_kbpd=172.0,
    ),
    dict(
        id="site-rotterdam",
        name="Rotterdam Refinery",
        code="ROT",
        country="Netherlands",
        region="Europe",
        latitude=51.9244,
        longitude=4.4777,
        status="warning",
        refinery_type="Hydroskimming",
        capacity_kbpd=195.0,
    ),
    dict(
        id="site-rastanura",
        name="Ras Tanura Refinery",
        code="RST",
        country="Saudi Arabia",
        region="MENA",
        latitude=26.6410,
        longitude=50.1544,
        status="healthy",
        refinery_type="Complex",
        capacity_kbpd=550.0,
    ),
    dict(
        id="site-jamnagar",
        name="Jamnagar Refinery",
        code="JAM",
        country="India",
        region="APAC",
        latitude=22.4707,
        longitude=70.0577,
        status="healthy",
        refinery_type="Complex",
        capacity_kbpd=1240.0,
    ),
]

USERS = [
    dict(
        id="user-admin",
        email="admin@bp.com",
        full_name="System Admin",
        role="admin",
        site_id=None,
        department="IT",
    ),
    dict(
        id="user-eng-ruw",
        email="j.smith@bp.com",
        full_name="James Smith",
        role="engineer",
        site_id="site-ruwais",
        department="Reliability Engineering",
    ),
    dict(
        id="user-eng-hou",
        email="s.patel@bp.com",
        full_name="Sunita Patel",
        role="engineer",
        site_id="site-houston",
        department="Mechanical Engineering",
    ),
    dict(
        id="user-op-rot",
        email="m.vandijk@bp.com",
        full_name="Mark van Dijk",
        role="operator",
        site_id="site-rotterdam",
        department="Operations",
    ),
    dict(
        id="user-viewer",
        email="l.chen@bp.com",
        full_name="Li Chen",
        role="viewer",
        site_id="site-rastanura",
        department="Asset Management",
    ),
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Upsert sites
        for s in SITES:
            existing = await session.get(Site, s["id"])
            if existing is None:
                session.add(Site(**s))
                print(f"  + Site {s['code']} — {s['name']}")
            else:
                print(f"  ~ Site {s['code']} already exists, skipping")

        # Upsert users
        for u in USERS:
            existing = await session.get(User, u["id"])
            if existing is None:
                session.add(User(**u))
                print(f"  + User {u['email']}")
            else:
                print(f"  ~ User {u['email']} already exists, skipping")

        await session.commit()
        print("\n✅ MICRO-09a complete — 5 sites, 5 users seeded.")


if __name__ == "__main__":
    asyncio.run(seed())
