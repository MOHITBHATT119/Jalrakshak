"""
Database layer for JalRakshak AI 2.0.

Supports two backends selected at startup:
  • Postgres  — when DATABASE_URL env var is set (production / Neon / Supabase)
  • SQLite    — fallback for local dev when DATABASE_URL is not set

All agent code is unchanged — both backends return plain dicts with identical shapes.

To use Postgres:
  1. Create a free DB at https://neon.tech (no credit card needed)
  2. Add DATABASE_URL=postgresql://user:pass@host/dbname to .env
  3. On first run init_db() creates the schema and seeds from CSVs
  4. Data survives restarts — no more ephemeral /tmp SQLite wipe
"""
import os
import csv
import threading
import logging
from typing import Optional, Any

logger = logging.getLogger(__name__)

# ─────────────────────────────────────────────────────────────────────────────
# Backend detection
# ─────────────────────────────────────────────────────────────────────────────

DATABASE_URL: Optional[str] = os.environ.get("DATABASE_URL", "").strip() or None

# Neon / Railway sometimes gives `postgres://` — psycopg3 needs `postgresql://`
if DATABASE_URL and DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = "postgresql://" + DATABASE_URL[len("postgres://"):]

USE_POSTGRES = bool(DATABASE_URL)

# ─────────────────────────────────────────────────────────────────────────────
# Data directory
# ─────────────────────────────────────────────────────────────────────────────

def _resolve_data_dir() -> str:
    override = os.environ.get("DATA_DIR")
    if override and os.path.isdir(override):
        return override
    here = os.path.dirname(os.path.abspath(__file__))
    candidates = [
        os.path.normpath(os.path.join(here, "../../../data")),  # project root data/
        os.path.normpath(os.path.join(here, "../../data")),     # backend/data/ (if containerized)
        os.path.join(os.getcwd(), "data"),                      # cwd data/
    ]
    for c in candidates:
        if os.path.isdir(c) and os.listdir(c):
            return c
    return candidates[0]

DATA_DIR = _resolve_data_dir()

# ─────────────────────────────────────────────────────────────────────────────
# SQLite path (fallback only)
# ─────────────────────────────────────────────────────────────────────────────

def _default_db_path() -> str:
    # 1. Serverless environments with read-only filesystems (Vercel, AWS Lambda, Google Cloud Functions)
    if os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME") or os.environ.get("K_SERVICE"):
        tmp = "/tmp" if os.path.isdir("/tmp") else os.environ.get("TEMP", os.environ.get("TMP", os.getcwd()))
        return os.path.join(tmp, "jalrakshak.db")

    # 2. Local development: persist in data directory so data survives server restarts
    if os.path.isdir(DATA_DIR) and os.access(DATA_DIR, os.W_OK):
        return os.path.join(DATA_DIR, "jalrakshak.db")

    # 3. Fallback to system temp directory
    tmp = "/tmp" if os.path.isdir("/tmp") else os.environ.get("TEMP", os.environ.get("TMP", os.getcwd()))
    return os.path.join(tmp, "jalrakshak.db")

DB_PATH = os.environ.get("DB_PATH", _default_db_path())

_lock = threading.Lock()

# ─────────────────────────────────────────────────────────────────────────────
# Connection factory — returns a connection object with a common interface
# ─────────────────────────────────────────────────────────────────────────────

class _PgConn:
    """Thin wrapper so Postgres connections look like our SQLite usage."""

    def __init__(self, conn):
        self._conn = conn

    def execute(self, sql: str, params=()):
        sql = _pg_sql(sql)
        cur = self._conn.cursor()
        cur.execute(sql, params if params else None)
        return _PgCursor(cur)

    def executescript(self, script: str):
        """Run a multi-statement DDL script (Postgres doesn't have executescript)."""
        sql = _pg_sql(script)
        cur = self._conn.cursor()
        for stmt in _split_statements(sql):
            if stmt.strip():
                cur.execute(stmt)

    def commit(self):
        self._conn.commit()

    def close(self):
        self._conn.close()


class _PgCursor:
    def __init__(self, cur):
        self._cur = cur

    def fetchone(self):
        row = self._cur.fetchone()
        if row is None:
            return None
        return _PgRow(self._cur.description, row)

    def fetchall(self):
        rows = self._cur.fetchall()
        if not rows:
            return []
        desc = self._cur.description
        return [_PgRow(desc, r) for r in rows]

    def __getitem__(self, idx):
        return self.fetchone()[idx]


class _PgRow:
    """Makes psycopg rows behave like sqlite3.Row (subscript by name or index)."""

    def __init__(self, description, row):
        self._keys = [d[0] for d in description] if description else []
        self._row  = row

    def __getitem__(self, key):
        if isinstance(key, int):
            return self._row[key]
        return self._row[self._keys.index(key)]

    def keys(self):
        return self._keys

    def __iter__(self):
        return iter(self._row)


def _split_statements(script: str):
    """Split a SQL script on ';' boundaries, skipping blank results."""
    return [s.strip() for s in script.split(";") if s.strip()]


# SQL dialect translation: SQLite → Postgres
_PG_REPLACEMENTS = [
    ("INTEGER PRIMARY KEY AUTOINCREMENT", "SERIAL PRIMARY KEY"),
    ("datetime('now')",                   "NOW()"),
    ("INSERT OR IGNORE INTO",             "INSERT INTO"),
    # SQLite inline comments after DEFAULT values confuse psycopg
    ("DEFAULT 'demo',   -- 'demo' | 'estimated' | 'live'", "DEFAULT 'demo'"),
]

def _pg_sql(sql: str) -> str:
    """Translate SQLite dialect to Postgres."""
    for old, new in _PG_REPLACEMENTS:
        sql = sql.replace(old, new)
    # Replace ? positional params with $1, $2, … for psycopg3
    # Only needed for DML; DDL has no params so it's safe to run always.
    result, n = [], 0
    for ch in sql:
        if ch == "?":
            n += 1
            result.append(f"${n}")
        else:
            result.append(ch)
    return "".join(result)


def _get_conn():
    if USE_POSTGRES:
        try:
            import psycopg
            conn = psycopg.connect(DATABASE_URL)
            conn.autocommit = False
            return _PgConn(conn)
        except ImportError:
            logger.error(
                "DATABASE_URL is set but psycopg is not installed. "
                "Run: pip install psycopg[binary]   — falling back to SQLite."
            )
        except Exception as exc:
            logger.error("Postgres connection failed (%s) — falling back to SQLite.", exc)

    # SQLite fallback
    import sqlite3
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA foreign_keys=ON")
    return conn


# ─────────────────────────────────────────────────────────────────────────────
# SCHEMA  (SQLite dialect; _pg_sql() translates for Postgres at runtime)
# ─────────────────────────────────────────────────────────────────────────────

SCHEMA = """
CREATE TABLE IF NOT EXISTS villages (
    village_id            TEXT PRIMARY KEY,
    name                  TEXT NOT NULL,
    district              TEXT,
    taluka                TEXT,
    lgd_code              TEXT,
    lat                   REAL,
    lon                   REAL,
    population            INTEGER,
    agricultural_area_ha  INTEGER,
    primary_crops         TEXT,
    annual_rainfall_mm    INTEGER,
    groundwater_depth_m   REAL,
    aquifer_type          TEXT,
    data_source           TEXT DEFAULT 'demo',
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

CREATE TABLE IF NOT EXISTS users (
    id                    TEXT PRIMARY KEY,
    name                  TEXT NOT NULL,
    email                 TEXT UNIQUE,
    phone                 TEXT,
    password_hash         TEXT NOT NULL,
    role                  TEXT NOT NULL DEFAULT 'Farmer',
    village               TEXT,
    district              TEXT,
    land_area_ha          REAL DEFAULT 0.0,
    primary_crops         TEXT,
    status                TEXT NOT NULL DEFAULT 'Active',
    last_active           TEXT DEFAULT (datetime('now')),
    created_at            TEXT DEFAULT (datetime('now')),
    is_demo               INTEGER DEFAULT 0,
    notes                 TEXT
);
"""

# Postgres-specific schema (replaces AUTOINCREMENT + datetime syntax)
SCHEMA_PG = _pg_sql(SCHEMA) if USE_POSTGRES else None


# ─────────────────────────────────────────────────────────────────────────────
# INIT + SEED
# ─────────────────────────────────────────────────────────────────────────────

def _seed_table(conn, table: str, csv_file: str, unique_cols: list):
    """Seed a table from CSV only if it is empty."""
    count = conn.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
    if count > 0:
        return

    path = os.path.join(DATA_DIR, csv_file)
    if not os.path.exists(path):
        return

    with open(path, newline="", encoding="utf-8") as f:
        rows = list(csv.DictReader(f))

    if not rows:
        return

    cols = list(rows[0].keys())
    col_names = ",".join(cols)

    if USE_POSTGRES:
        placeholders = ",".join([f"${i+1}" for i in range(len(cols))])
        on_conflict = (
            f"ON CONFLICT ({','.join(unique_cols)}) DO NOTHING"
            if unique_cols else "ON CONFLICT DO NOTHING"
        )
        sql = f"INSERT INTO {table} ({col_names}) VALUES ({placeholders}) {on_conflict}"
    else:
        placeholders = ",".join(["?" for _ in cols])
        sql = f"INSERT OR IGNORE INTO {table} ({col_names}) VALUES ({placeholders})"

    for row in rows:
        vals = [row.get(c, None) or None for c in cols]
        # Convert empty strings to None for numeric columns
        conn.execute(sql, vals)

    conn.commit()


def _migrate_sqlite(conn):
    """Apply non-destructive schema migrations for existing SQLite databases."""
    import sqlite3 as _sqlite3
    if not isinstance(conn, _sqlite3.Connection):
        return  # Postgres handles schema via CREATE TABLE IF NOT EXISTS
    existing_cols = {row[1] for row in conn.execute("PRAGMA table_info(villages)").fetchall()}
    for col, ddl in [
        ("taluka",   "ALTER TABLE villages ADD COLUMN taluka TEXT"),
        ("lgd_code", "ALTER TABLE villages ADD COLUMN lgd_code TEXT"),
    ]:
        if col not in existing_cols:
            conn.execute(ddl)
    conn.commit()


def _migrate_postgres(conn):
    """Add new columns to Postgres if upgrading from an older schema."""
    if not USE_POSTGRES:
        return
    for col, ddl in [
        ("taluka",   "ALTER TABLE villages ADD COLUMN IF NOT EXISTS taluka TEXT"),
        ("lgd_code", "ALTER TABLE villages ADD COLUMN IF NOT EXISTS lgd_code TEXT"),
    ]:
        try:
            conn.execute(ddl)
        except Exception:
            pass  # column already exists
    conn.commit()


def _seed_users(conn):
    """Seed initial demo users and farmers if users table is empty."""
    try:
        count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
        if count > 0:
            return
    except Exception:
        return

    from app.core.security import hash_password

    admin_hash = hash_password("admin@123")
    farmer_hash = hash_password("farmer123")

    initial_users = [
        ("U001", "Arjun Patel", "arjun.patel@jalrakshak.gov", "+91 98250 11001", admin_hash, "Water Administrator", "Rajkot", "Rajkot", 0.0, "", "Active", 1, "Platform administrator"),
        ("U002", "Meena Sharma", "meena.sharma@village.in", "+91 98250 11002", farmer_hash, "Community", "Junagadh", "Junagadh", 0.0, "", "Active", 1, "Village coordinator"),
        ("U003", "Ravi Desai", "ravi.desai@khet.in", "+91 98250 11003", farmer_hash, "Farmer", "Amreli", "Amreli", 4.5, "Cotton, Groundnut", "Active", 1, "Progressive farmer"),
        ("U007", "Bhavesh Joshi", "bhavesh.joshi@khet.in", "+91 98250 11007", farmer_hash, "Farmer", "Surendranagar", "Surendranagar", 6.0, "Groundnut, Wheat", "Active", 1, "Water conservation adopter"),
        ("U009", "Dinesh Rathod", "dinesh.rathod@khet.in", "+91 98250 11009", farmer_hash, "Farmer", "Gir Somnath", "Gir Somnath", 3.2, "Wheat, Cumin", "Suspended", 1, "Account suspended for review"),
    ]

    for u in initial_users:
        if USE_POSTGRES:
            sql = """
                INSERT INTO users (id, name, email, phone, password_hash, role, village, district, land_area_ha, primary_crops, status, is_demo, notes)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
                ON CONFLICT (id) DO NOTHING
            """
        else:
            sql = """
                INSERT OR IGNORE INTO users (id, name, email, phone, password_hash, role, village, district, land_area_ha, primary_crops, status, is_demo, notes)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """
        conn.execute(sql, list(u))
    conn.commit()


def init_db():
    """Create schema and seed from CSVs. Safe to call multiple times."""
    with _lock:
        conn = _get_conn()
        try:
            if USE_POSTGRES:
                conn.executescript(SCHEMA_PG)
                conn.commit()
                _migrate_postgres(conn)
            else:
                conn.executescript(SCHEMA)
                conn.commit()
                _migrate_sqlite(conn)

            _seed_table(conn, "villages",     "villages.csv",     ["village_id"])
            _seed_table(conn, "groundwater",  "groundwater.csv",  ["village_id", "year", "month"])
            _seed_table(conn, "rainfall",     "rainfall.csv",     ["village_id", "year", "month"])
            _seed_table(conn, "water_demand", "water_demand.csv", ["village_id", "year"])
            _seed_table(conn, "recharge",     "recharge.csv",     [])
            _seed_table(conn, "crops",        "crops.csv",        ["crop_id"])
            _seed_users(conn)
        finally:
            conn.close()

    backend = "Postgres" if USE_POSTGRES else f"SQLite ({DB_PATH})"
    logger.info("Database initialised — backend: %s", backend)


# ─────────────────────────────────────────────────────────────────────────────
# READ helpers  (return plain dicts, same shape regardless of backend)
# ─────────────────────────────────────────────────────────────────────────────

def _rows(sql: str, params=()):
    conn = _get_conn()
    try:
        cur = conn.execute(sql, params)
        rows = cur.fetchall()
        return [dict(zip(r.keys(), r)) for r in rows]
    finally:
        conn.close()


def _row(sql: str, params=()):
    conn = _get_conn()
    try:
        r = conn.execute(sql, params).fetchone()
        if r is None:
            return None
        return dict(zip(r.keys(), r))
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
            total     = conn.execute(f"SELECT COUNT(*) FROM {tbl}").fetchone()[0]
            live      = conn.execute(
                f"SELECT COUNT(*) FROM {tbl} WHERE data_source='live'"
            ).fetchone()[0]
            estimated = conn.execute(
                f"SELECT COUNT(*) FROM {tbl} WHERE data_source='estimated'"
            ).fetchone()[0]
            last      = conn.execute(
                f"SELECT MAX(updated_at) FROM {tbl}"
            ).fetchone()[0]
            stats[key] = {
                "total_rows":      total,
                "live_rows":       live,
                "estimated_rows":  estimated,
                "demo_rows":       total - live - estimated,
                "has_live":        live > 0,
                "has_estimated":   estimated > 0,
                "last_updated":    last,
            }
        finally:
            conn.close()
    return stats


def data_note_for(village_id: str) -> str:
    """Return appropriate data_note depending on data tier (live / estimated / demo)."""
    conn = _get_conn()
    try:
        live = conn.execute(
            "SELECT COUNT(*) FROM groundwater WHERE village_id=? AND data_source='live'",
            (village_id,)
        ).fetchone()[0]
        if live > 0:
            return "Live data — verified by data administrator."

        village = conn.execute(
            "SELECT data_source FROM villages WHERE village_id=?",
            (village_id,)
        ).fetchone()
        if village and village[0] == "estimated":
            return (
                "Estimated data — derived from nearest CGWB district-level figures. "
                "Not official government measurements."
            )
        return "Synthetic demonstration data. Not official government measurements."
    finally:
        conn.close()


# ─────────────────────────────────────────────────────────────────────────────
# WRITE helpers — used by admin upload/CRUD API
# ─────────────────────────────────────────────────────────────────────────────

def _now_expr() -> str:
    return "NOW()" if USE_POSTGRES else "datetime('now')"


def upsert_village(row: dict):
    row["data_source"] = "live"
    row.setdefault("taluka", None)
    row.setdefault("lgd_code", None)
    now = _now_expr()
    conn = _get_conn()
    try:
        conn.execute(f"""
            INSERT INTO villages
                (village_id,name,district,taluka,lgd_code,lat,lon,population,
                 agricultural_area_ha,primary_crops,annual_rainfall_mm,
                 groundwater_depth_m,aquifer_type,data_source,updated_at)
            VALUES
                (?,?,?,?,?,?,?,?,?,?,?,?,?,?,{now})
            ON CONFLICT(village_id) DO UPDATE SET
                name=excluded.name,
                district=excluded.district,
                taluka=excluded.taluka,
                lgd_code=excluded.lgd_code,
                lat=excluded.lat,
                lon=excluded.lon,
                population=excluded.population,
                agricultural_area_ha=excluded.agricultural_area_ha,
                primary_crops=excluded.primary_crops,
                annual_rainfall_mm=excluded.annual_rainfall_mm,
                groundwater_depth_m=excluded.groundwater_depth_m,
                aquifer_type=excluded.aquifer_type,
                data_source='live',
                updated_at={now}
        """, [
            row["village_id"], row["name"], row.get("district"),
            row.get("taluka"), row.get("lgd_code"),
            row.get("lat"), row.get("lon"), row.get("population"),
            row.get("agricultural_area_ha"), row.get("primary_crops"),
            row.get("annual_rainfall_mm"), row.get("groundwater_depth_m"),
            row.get("aquifer_type"), row["data_source"],
        ])
        conn.commit()
    finally:
        conn.close()


def upsert_groundwater_rows(rows: list):
    now = _now_expr()
    conn = _get_conn()
    try:
        for r in rows:
            r["data_source"] = "live"
            conn.execute(f"""
                INSERT INTO groundwater
                    (village_id,year,month,depth_m,change_from_prev_year_m,quality,data_source,updated_at)
                VALUES (?,?,?,?,?,?,?,{now})
                ON CONFLICT(village_id,year,month) DO UPDATE SET
                    depth_m=excluded.depth_m,
                    change_from_prev_year_m=excluded.change_from_prev_year_m,
                    quality=excluded.quality,
                    data_source='live',
                    updated_at={now}
            """, [
                r["village_id"], r["year"], r["month"], r["depth_m"],
                r.get("change_from_prev_year_m", 0), r.get("quality", "unknown"),
                r["data_source"],
            ])
        conn.commit()
    finally:
        conn.close()


def upsert_rainfall_rows(rows: list):
    now = _now_expr()
    conn = _get_conn()
    try:
        for r in rows:
            r["data_source"] = "live"
            conn.execute(f"""
                INSERT INTO rainfall
                    (village_id,year,month,rainfall_mm,historical_avg_mm,deficit_pct,season,data_source,updated_at)
                VALUES (?,?,?,?,?,?,?,?,{now})
                ON CONFLICT(village_id,year,month) DO UPDATE SET
                    rainfall_mm=excluded.rainfall_mm,
                    historical_avg_mm=excluded.historical_avg_mm,
                    deficit_pct=excluded.deficit_pct,
                    season=excluded.season,
                    data_source='live',
                    updated_at={now}
            """, [
                r["village_id"], r["year"], r["month"], r.get("rainfall_mm"),
                r.get("historical_avg_mm"), r.get("deficit_pct"), r.get("season", ""),
                r["data_source"],
            ])
        conn.commit()
    finally:
        conn.close()


def upsert_water_demand_rows(rows: list):
    now = _now_expr()
    conn = _get_conn()
    try:
        for r in rows:
            r["data_source"] = "live"
            conn.execute(f"""
                INSERT INTO water_demand
                    (village_id,year,domestic_demand_mcm,agricultural_demand_mcm,
                     industrial_demand_mcm,total_demand_mcm,available_supply_mcm,deficit_mcm,
                     data_source,updated_at)
                VALUES (?,?,?,?,?,?,?,?,?,{now})
                ON CONFLICT(village_id,year) DO UPDATE SET
                    domestic_demand_mcm=excluded.domestic_demand_mcm,
                    agricultural_demand_mcm=excluded.agricultural_demand_mcm,
                    industrial_demand_mcm=excluded.industrial_demand_mcm,
                    total_demand_mcm=excluded.total_demand_mcm,
                    available_supply_mcm=excluded.available_supply_mcm,
                    deficit_mcm=excluded.deficit_mcm,
                    data_source='live',
                    updated_at={now}
            """, [
                r["village_id"], r["year"],
                r.get("domestic_demand_mcm", 0), r.get("agricultural_demand_mcm", 0),
                r.get("industrial_demand_mcm", 0), r["total_demand_mcm"],
                r["available_supply_mcm"], r["deficit_mcm"], r["data_source"],
            ])
        conn.commit()
    finally:
        conn.close()


def upsert_recharge_rows(rows: list):
    now = _now_expr()
    conn = _get_conn()
    try:
        for r in rows:
            r["data_source"] = "live"
            conn.execute(f"""
                INSERT INTO recharge
                    (village_id,year,structure_type,count,estimated_recharge_mcm,status,notes,data_source,updated_at)
                VALUES (?,?,?,?,?,?,?,?,{now})
            """, [
                r["village_id"], r["year"], r.get("structure_type"),
                r.get("count", 0), r.get("estimated_recharge_mcm"),
                r.get("status", ""), r.get("notes", ""), r["data_source"],
            ])
        conn.commit()
    finally:
        conn.close()


def delete_table_live_rows(table: str):
    """Reset a table back to demo-only (delete all live rows)."""
    allowed = {"villages", "groundwater", "rainfall", "water_demand", "recharge", "crops"}
    if table not in allowed:
        raise ValueError(f"Unknown table: {table}")
    conn = _get_conn()
    try:
        conn.execute(f"DELETE FROM {table} WHERE data_source='live'")
        conn.commit()
    finally:
        conn.close()


# ─────────────────────────────────────────────────────────────────────────────
# USER / FARMER DB HELPERS
# ─────────────────────────────────────────────────────────────────────────────

def db_get_users(role: Optional[str] = None, status: Optional[str] = None) -> list:
    """Return all users, optionally filtered by role or status (excludes password_hash)."""
    sql = """
        SELECT id, name, email, phone, role, village, district, land_area_ha, primary_crops,
               status, last_active, created_at, is_demo, notes
        FROM users
    """
    conditions = []
    params = []
    if role and role.upper() != "ALL":
        conditions.append("role=?")
        params.append(role)
    if status and status.upper() != "ALL":
        conditions.append("status=?")
        params.append(status)
    if conditions:
        sql += " WHERE " + " AND ".join(conditions)
    sql += " ORDER BY created_at DESC"
    return _rows(sql, params)


def db_get_user_by_id(user_id: str, include_password: bool = False) -> Optional[dict]:
    cols = "*" if include_password else "id, name, email, phone, role, village, district, land_area_ha, primary_crops, status, last_active, created_at, is_demo, notes"
    return _row(f"SELECT {cols} FROM users WHERE id=?", (user_id,))


def db_get_user_by_email_or_phone(identifier: str) -> Optional[dict]:
    clean = identifier.strip().lower()
    phone_clean = identifier.strip()
    return _row(
        "SELECT * FROM users WHERE LOWER(email)=? OR phone=?",
        (clean, phone_clean)
    )


def db_create_user(data: dict) -> dict:
    """Create a new user/farmer in the database."""
    conn = _get_conn()
    try:
        # Generate user id if missing
        user_id = data.get("id")
        if not user_id:
            order_col = "created_at" if USE_POSTGRES else "rowid"
            row = conn.execute(f"SELECT id FROM users ORDER BY {order_col} DESC LIMIT 1").fetchone()
            if row and row[0] and row[0].startswith("U"):
                try:
                    num = int(row[0][1:]) + 1
                    user_id = f"U{num:03d}"
                except ValueError:
                    import uuid
                    user_id = f"U_{uuid.uuid4().hex[:6]}"
            else:
                user_id = "U010"

        now = _now_expr()
        sql = f"""
            INSERT INTO users
                (id, name, email, phone, password_hash, role, village, district,
                 land_area_ha, primary_crops, status, last_active, created_at, is_demo, notes)
            VALUES
                (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, {now}, {now}, ?, ?)
        """
        params = [
            user_id,
            data.get("name", "").strip(),
            data.get("email", "").strip().lower(),
            data.get("phone", "").strip() or None,
            data.get("password_hash", ""),
            data.get("role", "Farmer"),
            data.get("village", "").strip(),
            data.get("district", "").strip(),
            float(data.get("land_area_ha") or 0.0),
            data.get("primary_crops", "").strip(),
            data.get("status", "Active"),
            1 if data.get("is_demo") else 0,
            data.get("notes", "").strip() or None,
        ]
        conn.execute(sql, params)
        conn.commit()
        return db_get_user_by_id(user_id) or {"id": user_id, **data}
    finally:
        conn.close()


def db_update_user(user_id: str, updates: dict) -> Optional[dict]:
    """Update user fields."""
    allowed = ["name", "email", "phone", "village", "district", "land_area_ha", "primary_crops", "status", "role", "notes"]
    set_clauses = []
    params = []
    for k in allowed:
        if k in updates:
            set_clauses.append(f"{k}=?")
            val = updates[k]
            if k == "email" and isinstance(val, str):
                val = val.strip().lower()
            elif k == "land_area_ha":
                val = float(val or 0.0)
            params.append(val)
    if not set_clauses:
        return db_get_user_by_id(user_id)

    set_clauses.append(f"last_active={_now_expr()}")
    params.append(user_id)
    sql = f"UPDATE users SET {', '.join(set_clauses)} WHERE id=?"

    conn = _get_conn()
    try:
        conn.execute(sql, params)
        conn.commit()
        return db_get_user_by_id(user_id)
    finally:
        conn.close()


def db_update_user_status(user_id: str, new_status: str) -> bool:
    conn = _get_conn()
    try:
        now = _now_expr()
        conn.execute(f"UPDATE users SET status=?, last_active={now} WHERE id=?", [new_status, user_id])
        conn.commit()
        return True
    finally:
        conn.close()


def db_delete_user(user_id: str) -> bool:
    conn = _get_conn()
    try:
        conn.execute("DELETE FROM users WHERE id=?", [user_id])
        conn.commit()
        return True
    finally:
        conn.close()

