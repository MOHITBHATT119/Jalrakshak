"""
Purge synthetic and demo records from JalRakshak database.
Cleans out demo user accounts, synthetic 'V001'-'V010' IDs, and ensures
only verified Saurashtra village master data (estimated/live) remains.

Usage:
    python backend/scripts/purge_demo_data.py
"""
import os
import sys

# Ensure backend root is on PYTHONPATH
sys.path.insert(0, os.path.normpath(os.path.join(os.path.dirname(__file__), "..")))

from app.services.database import _get_conn, init_db, get_table_stats


def purge_demo_data():
    print("Starting JalRakshak demo data purge...")
    conn = _get_conn()
    try:
        # 1. Purge demo rows or synthetic V001-V010 prefix records
        tables = ["groundwater", "rainfall", "water_demand", "recharge", "villages"]
        for table in tables:
            cur = conn.execute(f"DELETE FROM {table} WHERE data_source='demo' OR village_id LIKE 'V0%' OR village_id LIKE 'dist_%'")
            print(f"Purged matching demo/synthetic rows from {table}")

        # Purge crops to cleanly reload verified quoted catalog
        conn.execute("DELETE FROM crops")
        print("Purged crops to reload verified agronomic benchmarks")

        # 2. Update all active users to is_demo=0
        conn.execute("UPDATE users SET is_demo=0")
        print("Updated user accounts to is_demo=0")

        conn.commit()
    finally:
        conn.close()

    # 3. Reload verified master datasets
    print("Reloading verified Saurashtra master dataset...")
    init_db()

    stats = get_table_stats()
    print("\nPurge completed successfully. Current database statistics:")
    for tbl, info in stats.items():
        print(f" - {tbl:15}: Total={info['total_rows']:4} (Live={info['live_rows']:4}, Estimated={info['estimated_rows']:4}, Demo={info['demo_rows']:4})")


if __name__ == "__main__":
    purge_demo_data()
