"""DB-04 — Validate all tables exist and have data in Supabase.

Run from backend/ directory:
    python validate_db.py

Connects to Supabase (or whatever DATABASE_URL points to), runs
SELECT COUNT(*) for every table registered in the SQLAlchemy metadata,
and prints a report showing pass/fail for each.

Exit code 0 = all tables have ≥ 1 row.
Exit code 1 = one or more tables are empty or missing.
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(__file__))

# Import all models so metadata is populated
import src.models  # noqa: F401 — side-effect: registers all tables
from src.models.database import engine, Base
from sqlalchemy import text


EXPECTED_MIN_ROWS = 1   # every table must have at least this many rows


async def validate() -> int:
    """Returns the number of tables that failed the ≥1 row check."""
    all_tables = sorted(Base.metadata.tables.keys())
    results: list[tuple[str, int | str, str]] = []

    async with engine.connect() as conn:
        for table_name in all_tables:
            try:
                row = await conn.execute(
                    text(f'SELECT COUNT(*) FROM "{table_name}"')  # noqa: S608
                )
                count = row.scalar_one()
                status = "PASS" if count >= EXPECTED_MIN_ROWS else "FAIL — EMPTY"
            except Exception as exc:
                count = f"ERROR: {exc}"
                status = "FAIL — ERROR"
            results.append((table_name, count, status))

    # Print aligned table
    col_table = max(len(r[0]) for r in results)
    col_count = max(len(str(r[1])) for r in results)

    header = f"{'table_name':<{col_table}}  {'row_count':>{col_count}}  status"
    print(header)
    print("-" * len(header))

    failures = 0
    for table_name, count, status in results:
        marker = "✅" if status == "PASS" else "❌"
        print(f"{marker} {table_name:<{col_table}}  {str(count):>{col_count}}  {status}")
        if status != "PASS":
            failures += 1

    print(f"\n{'─' * len(header)}")
    total = len(results)
    passed = total - failures
    print(f"Result: {passed}/{total} tables PASS  ({failures} failures)")

    if failures:
        print("\nFailed tables (need seeding or migration):")
        for table_name, count, status in results:
            if status != "PASS":
                print(f"  • {table_name} — {status}")

    return failures


async def main() -> None:
    print(f"Connecting to: {os.getenv('DATABASE_URL', '(from src.models.database)')}\n")
    failures = await validate()
    await engine.dispose()
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    asyncio.run(main())
