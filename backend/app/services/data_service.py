"""
Data Service - reads from SQLite DB (seeded from CSV on first run).
Drop-in replacement for the old CSV-only version.
All agents continue to call the same functions unchanged.
"""
from typing import Optional
from app.services.database import (
    init_db,
    db_get_villages, db_get_village,
    db_get_groundwater, db_get_rainfall,
    db_get_water_demand, db_get_recharge,
    db_get_crops,
    data_note_for,
)

# Initialise DB + seed from CSV on module import
init_db()


# ── public API (same signatures as before) ───────────────────────────────────

def get_all_villages() -> list:
    return db_get_villages()


def get_village(village_id: str) -> Optional[dict]:
    return db_get_village(village_id)


def get_groundwater_data(village_id: str = None) -> list:
    return db_get_groundwater(village_id)


def get_rainfall_data(village_id: str = None) -> list:
    return db_get_rainfall(village_id)


def get_crops_data() -> list:
    return db_get_crops()


def get_water_demand_data(village_id: str = None) -> list:
    return db_get_water_demand(village_id)


def get_recharge_data(village_id: str = None) -> list:
    return db_get_recharge(village_id)


def get_village_groundwater_series(village_id: str) -> list:
    """
    Groundwater timeseries for a village.
    Falls back to synthetic generation from village baseline
    if no rows exist in the DB (same logic as before).
    """
    raw = get_groundwater_data(village_id)
    village = get_village(village_id)
    if not raw and village:
        base = float(village.get("groundwater_depth_m", 15.0))
        series = []
        for year in range(2019, 2025):
            for month in [1, 6, 12]:
                years_elapsed = year - 2019
                depth = base + (years_elapsed * 0.8) + (2.5 if month == 6 else 0)
                series.append({
                    "village_id": village_id,
                    "year": str(year),
                    "month": str(month),
                    "depth_m": round(depth, 1),
                    "change_from_prev_year_m": "0.8",
                    "quality": "moderate" if depth > base + 2 else "good",
                    "data_source": "demo",
                })
        return series
    return raw


def get_data_note(village_id: str = None) -> str:
    """Return appropriate data_note for a village (live vs demo)."""
    if village_id:
        return data_note_for(village_id)
    return "Synthetic demonstration data. Not official government measurements."
