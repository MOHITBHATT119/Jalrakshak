"""
SQLite database layer for JalRakshak AI 2.0.

Replaces static CSV reads with a live database.
The database is seeded from CSV files on first run.
When real data is uploaded via the API, data_source becomes 'live'
and data_note changes from 'Demonstration data' to 'Live data'.

Schema mirrors the 6 CSV files exactly so no agent logic changes.
"""
import os
import csv
import sqlite3
import threading
from typing import Optional

def _resolve_data_dir() -> str:
    # Allow override via env var (useful in serverless/container environments)
    override = os.environ.get("DATA_DIR")
    if override and os.path.isdir(override):
        return override

    candidates = [
        # Local dev: backend/app/services/ → ../../../data
        os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../../data")),
        # Vercel serverless: /var/task/app/services/ → /var/task/data/
        os.path.normpath(os.path.join(os.path.dirname(os.path.abspath(__file__)), "../../data")),
        # Vercel alternate: project root /var/task/data
        "/var/task/data",
        # CWD-relative fallback
        os.path.join(os.getcwd(), "data"),
    ]
    for c in candidates:
        if os.path.isdir(c) and os.listdir(c):
            return c
    return candidates[0]  # best effort

DATA_DIR = _resolve_data_dir()

# Always use /tmp for the writable DB so it works on Vercel (read-only /var/task)
# and locally (where /tmp is also writable). The DB is seeded fresh from CSVs each
# cold start — this is fine since data is synthetic and read-mostly.
DB_PATH = os.environ.get("DB_PATH", "/tmp/jalrakshak.db")

_lock = threading.Lock()

# ─────────────────────────────────────────────────────────────────────────────
# CONNECTION
# ─────────────────────────────────────────────────────────────────────────────

def _get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


# ─────────────────────────────────────────────────────────────────────────────
# SCHEMA
# ─────────────────────────────────────────────────────────────────────────────

SCHEMA = """
CREATE TABLE IF NOT EXISTS villages (
    village_id            TEXT PRIMARY KEY,
    name                  TEXT NOT NULL,
    district              TEXT,
    lat                   REAL,
    lon                   REAL,
    population            INTEGER,
    agricultural_area_ha  INTEGER,
    primary_crops         TEXT,
    annual_rainfall_mm    INTEGER,
    groundwater_depth_m   REAL,
    aquifer_type          TEXT,
    data_source           TEXT DEFAULT 'demo',   -- 'demo' | 'live'
    updated_at            TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS groundwater (
    id                     INTEGER PRIMARY KEY AUTOINCREMENT,
    village_id             TEXT NOT NULL,
    year                   INTEGER NOT NULL,
    month                  INTEGER NOT NULL,
    depth_m                REAL NOT NULL,
    change_from_prev_year_m REAL DEFAULT 0,
    quality                TEXT DEFAULT 'unknown',
    data_source            TEXT DEFAULT 'demo',
    updated_at             TEXT DEFAULT (datetime('now')),
    UNIQUE(village_id, year, month)
);

CREATE TABLE IF NOT EXISTS rainfall (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    village_id          TEXT NOT NULL,
    year                INTEGER NOT NULL,
    month               INTEGER NOT NULL,
    rainfall_mm         REAL,
    historical_avg_mm   REAL,
    deficit_pct         REAL,
    season              TEXT,
    data_source         TEXT DEFAULT 'demo',
    updated_at          TEXT DEFAULT (datetime('now')),
    UNIQUE(village_id, year, month)
);

CREATE TABLE IF NOT EXISTS water_demand (
    id                        INTEGER PRIMARY KEY AUTOINCREMENT,
    village_id                TEXT NOT NULL,
    year                      INTEGER NOT NULL,
    domestic_demand_mcm       REAL,
    agricultural_demand_mcm   REAL,
    industrial_demand_mcm     REAL,
    total_demand_mcm          REAL,
    available_supply_mcm      REAL,
    deficit_mcm               REAL,
    data_source               TEXT DEFAULT 'demo',
    updated_at                TEXT DEFAULT (datetime('now')),
    UNIQUE(village_id, year)
);

CREATE TABLE IF NOT EXISTS recharge (
    id                        INTEGER PRIMARY KEY AUTOINCREMENT,
    village_id                TEXT NOT NULL,
    year                      INTEGER NOT NULL,
    structure_type            TEXT,
    count                     INTEGER,
    estimated_recharge_mcm    REAL,
    status                    TEXT,
    notes                     TEXT,
    data_source               TEXT DEFAULT 'demo',
    updated_at                TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS crops (
    crop_id                   TEXT PRIMARY KEY,
    name                      TEXT NOT NULL,
    water_requirement_mm      INTEGER,
    season                    TEXT,
    duration_days             INTEGER,
    drought_tolerance         TEXT,
    suitability_saurashtra    TEXT,
    water_saving_vs_cotton_pct REAL,
    notes                     TEXT,
    data_source               TEXT DEFAULT 'demo',
    updated_at                TEXT DEFAULT (datetime('now'))
);
"""


# ─────────────────────────────────────────────────────────────────────────────
# INIT + SEED
# ─────────────────────────────────────────────────────────────────────────────

def _seed_table(conn: sqlite3.Connection, table: str, csv_file: str, unique_cols: list):
    """Seed a table from CSV only if it is empty."""
    count = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
    if count > 0:
        return  # already seeded

    path = os.path.join(DATA_DIR, csv_file)
    if not os.path.exists(path):
        return

    with open(path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    if not rows:
        return

    cols = list(rows[0].keys())
    placeholders = ",".join(["?" for _ in cols])
    col_names = ",".join(cols)
    sql = f"INSERT OR IGNORE INTO {table} ({col_names}) VALUES ({placeholders})"

    for row in rows:
        vals = [row.get(c, None) for c in cols]
        conn.execute(sql, vals)

    conn.commit()


def init_db():
    """Create schema and seed from CSVs. Safe to call multiple times."""
    with _lock:
        conn = _get_conn()
        conn.executescript(SCHEMA)
        conn.commit()

        _seed_table(conn, "villages",     "villages.csv",     ["village_id"])
        _seed_table(conn, "groundwater",  "groundwater.csv",  ["village_id", "year", "month"])
        _seed_table(conn, "rainfall",     "rainfall.csv",     ["village_id", "year", "month"])
        _seed_table(conn, "water_demand", "water_demand.csv", ["village_id", "year"])
        _seed_table(conn, "recharge",     "recharge.csv",     [])
        _seed_table(conn, "crops",        "crops.csv",        ["crop_id"])

        conn.close()


# ─────────────────────────────────────────────────────────────────────────────
# READ helpers  (return plain dicts, same shape as old CSV rows)
# ─────────────────────────────────────────────────────────────────────────────

def _rows(sql: str, params=()):
    conn = _get_conn()
    try:
        rows = conn.execute(sql, params).fetchall()
        return [dict(r) for r in rows]
    finally:
        conn.close()


def _row(sql: str, params=()):
    conn = _get_conn()
    try:
        r = conn.execute(sql, params).fetchone()
        return dict(r) if r else None
    finally:
        conn.close()


def db_get_villages() -> list:
    return _rows("SELECT * FROM villages ORDER BY village_id")


def db_get_village(village_id: str) -> Optional[dict]:
    return _row("SELECT * FROM villages WHERE village_id=?", (village_id,))


def db_get_groundwater(village_id: str = None) -> list:
    if village_id:
        return _rows(
            "SELECT * FROM groundwater WHERE village_id=? ORDER BY year,month",
            (village_id,)
        )
    return _rows("SELECT * FROM groundwater ORDER BY village_id,year,month")


def db_get_rainfall(village_id: str = None) -> list:
    if village_id:
        return _rows(
            "SELECT * FROM rainfall WHERE village_id=? ORDER BY year,month",
            (village_id,)
        )
    return _rows("SELECT * FROM rainfall ORDER BY village_id,year,month")


def db_get_water_demand(village_id: str = None) -> list:
    if village_id:
        return _rows(
            "SELECT * FROM water_demand WHERE village_id=? ORDER BY year",
            (village_id,)
        )
    return _rows("SELECT * FROM water_demand ORDER BY village_id,year")


def db_get_recharge(village_id: str = None) -> list:
    if village_id:
        return _rows(
            "SELECT * FROM recharge WHERE village_id=? ORDER BY year",
            (village_id,)
        )
    return _rows("SELECT * FROM recharge ORDER BY village_id,year")


def db_get_crops() -> list:
    return _rows("SELECT * FROM crops ORDER BY crop_id")


# ─────────────────────────────────────────────────────────────────────────────
# DATA SOURCE STATUS
# ─────────────────────────────────────────────────────────────────────────────

def get_table_stats() -> dict:
    """Return row counts, data_source mix, and last update per table."""
    stats = {}
    tables = {
        "villages":    "villages",
        "groundwater": "groundwater",
        "rainfall":    "rainfall",
        "water_demand":"water_demand",
        "recharge":    "recharge",
        "crops":       "crops",
    }
    for key, tbl in tables.items():
        conn = _get_conn()
        try:
            total = conn.execute(f"SELECT COUNT(*) FROM {tbl}").fetchone()[0]
            live  = conn.execute(
                f"SELECT COUNT(*) FROM {tbl} WHERE data_source='live'"
            ).fetchone()[0]
            last  = conn.execute(
                f"SELECT MAX(updated_at) FROM {tbl}"
            ).fetchone()[0]
            stats[key] = {
                "total_rows":  total,
                "live_rows":   live,
                "demo_rows":   total - live,
                "has_live":    live > 0,
                "last_updated": last,
            }
        finally:
            conn.close()
    return stats


def data_note_for(village_id: str) -> str:
    """Return appropriate data_note depending on whether live data exists."""
    conn = _get_conn()
    try:
        live = conn.execute(
            "SELECT COUNT(*) FROM groundwater WHERE village_id=? AND data_source='live'",
            (village_id,)
        ).fetchone()[0]
        if live > 0:
            return "Live data — verified by data administrator."
        return "Synthetic demonstration data. Not official government measurements."
    finally:
        conn.close()


# ─────────────────────────────────────────────────────────────────────────────
# WRITE helpers — used by admin upload/CRUD API
# ─────────────────────────────────────────────────────────────────────────────

def upsert_village(row: dict):
    row["data_source"] = "live"
    conn = _get_conn()
    try:
        conn.execute("""
            INSERT INTO villages
                (village_id,name,district,lat,lon,population,
                 agricultural_area_ha,primary_crops,annual_rainfall_mm,
                 groundwater_depth_m,aquifer_type,data_source,updated_at)
            VALUES
                (:village_id,:name,:district,:lat,:lon,:population,
                 :agricultural_area_ha,:primary_crops,:annual_rainfall_mm,
                 :groundwater_depth_m,:aquifer_type,:data_source,datetime('now'))
            ON CONFLICT(village_id) DO UPDATE SET
                name=excluded.name,
                district=excluded.district,
                lat=excluded.lat,
                lon=excluded.lon,
                population=excluded.population,
                agricultural_area_ha=excluded.agricultural_area_ha,
                primary_crops=excluded.primary_crops,
                annual_rainfall_mm=excluded.annual_rainfall_mm,
                groundwater_depth_m=excluded.groundwater_depth_m,
                aquifer_type=excluded.aquifer_type,
                data_source='live',
                updated_at=datetime('now')
        """, row)
        conn.commit()
    finally:
        conn.close()


def upsert_groundwater_rows(rows: list):
    conn = _get_conn()
    try:
        for r in rows:
            r["data_source"] = "live"
            conn.execute("""
                INSERT INTO groundwater
                    (village_id,year,month,depth_m,change_from_prev_year_m,quality,data_source,updated_at)
                VALUES
                    (:village_id,:year,:month,:depth_m,:change_from_prev_year_m,:quality,:data_source,datetime('now'))
                ON CONFLICT(village_id,year,month) DO UPDATE SET
                    depth_m=excluded.depth_m,
                    change_from_prev_year_m=excluded.change_from_prev_year_m,
                    quality=excluded.quality,
                    data_source='live',
                    updated_at=datetime('now')
            """, r)
        conn.commit()
    finally:
        conn.close()


def upsert_rainfall_rows(rows: list):
    conn = _get_conn()
    try:
        for r in rows:
            r["data_source"] = "live"
            conn.execute("""
                INSERT INTO rainfall
                    (village_id,year,month,rainfall_mm,historical_avg_mm,deficit_pct,season,data_source,updated_at)
                VALUES
                    (:village_id,:year,:month,:rainfall_mm,:historical_avg_mm,:deficit_pct,:season,:data_source,datetime('now'))
                ON CONFLICT(village_id,year,month) DO UPDATE SET
                    rainfall_mm=excluded.rainfall_mm,
                    historical_avg_mm=excluded.historical_avg_mm,
                    deficit_pct=excluded.deficit_pct,
                    season=excluded.season,
                    data_source='live',
                    updated_at=datetime('now')
            """, r)
        conn.commit()
    finally:
        conn.close()


def upsert_water_demand_rows(rows: list):
    conn = _get_conn()
    try:
        for r in rows:
            r["data_source"] = "live"
            conn.execute("""
                INSERT INTO water_demand
                    (village_id,year,domestic_demand_mcm,agricultural_demand_mcm,
                     industrial_demand_mcm,total_demand_mcm,available_supply_mcm,deficit_mcm,
                     data_source,updated_at)
                VALUES
                    (:village_id,:year,:domestic_demand_mcm,:agricultural_demand_mcm,
                     :industrial_demand_mcm,:total_demand_mcm,:available_supply_mcm,:deficit_mcm,
                     :data_source,datetime('now'))
                ON CONFLICT(village_id,year) DO UPDATE SET
                    domestic_demand_mcm=excluded.domestic_demand_mcm,
                    agricultural_demand_mcm=excluded.agricultural_demand_mcm,
                    industrial_demand_mcm=excluded.industrial_demand_mcm,
                    total_demand_mcm=excluded.total_demand_mcm,
                    available_supply_mcm=excluded.available_supply_mcm,
                    deficit_mcm=excluded.deficit_mcm,
                    data_source='live',
                    updated_at=datetime('now')
            """, r)
        conn.commit()
    finally:
        conn.close()


def upsert_recharge_rows(rows: list):
    conn = _get_conn()
    try:
        for r in rows:
            r["data_source"] = "live"
            conn.execute("""
                INSERT INTO recharge
                    (village_id,year,structure_type,count,estimated_recharge_mcm,status,notes,data_source,updated_at)
                VALUES
                    (:village_id,:year,:structure_type,:count,:estimated_recharge_mcm,:status,:notes,:data_source,datetime('now'))
            """, r)
        conn.commit()
    finally:
        conn.close()


def delete_table_live_rows(table: str):
    """Reset a table back to demo-only (delete all live rows)."""
    allowed = {"villages","groundwater","rainfall","water_demand","recharge","crops"}
    if table not in allowed:
        raise ValueError(f"Unknown table: {table}")
    conn = _get_conn()
    try:
        conn.execute(f"DELETE FROM {table} WHERE data_source='live'")
        conn.commit()
    finally:
        conn.close()
