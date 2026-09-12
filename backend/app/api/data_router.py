"""
Data Management API — upload CSVs, manual entry, reset, status.
All write operations mark rows as data_source='live'.
Write routes require admin JWT (Authorization: Bearer <token>).
"""
import csv
import io
from typing import Optional, List
from fastapi import APIRouter, HTTPException, UploadFile, File, Depends
from pydantic import BaseModel
from app.core.security import require_admin
from app.schemas.responses import DataStatusResponse
from app.services.database import (
    get_table_stats,
    upsert_village,
    upsert_groundwater_rows,
    upsert_rainfall_rows,
    upsert_water_demand_rows,
    upsert_recharge_rows,
    delete_table_live_rows,
    db_get_villages, db_get_groundwater, db_get_rainfall,
    db_get_water_demand, db_get_recharge,
)

data_router = APIRouter(prefix="/data", tags=["data-management"])


# ─────────────────────────────────────────────────────────────────────────────
# STATUS
# ─────────────────────────────────────────────────────────────────────────────

@data_router.get("/status", response_model=DataStatusResponse)
def data_status():
    """Overall data source status — row counts, live vs demo per table."""
    stats = get_table_stats()
    any_live = any(s["has_live"] for s in stats.values())
    return {
        "data_mode":    "live" if any_live else "demo",
        "tables":       stats,
        "description":  (
            "Live data is present — results reflect real measurements."
            if any_live else
            "All data is synthetic demonstration data. Upload real CSV files to switch to live mode."
        ),
    }


# ─────────────────────────────────────────────────────────────────────────────
# CSV UPLOAD  (one endpoint per table — keeps parsing clean)
# ─────────────────────────────────────────────────────────────────────────────

def _parse_csv_upload(content: bytes) -> list:
    text = content.decode("utf-8-sig")   # handle BOM
    reader = csv.DictReader(io.StringIO(text))
    rows = list(reader)
    if not rows:
        raise HTTPException(400, "CSV file is empty or has no data rows.")
    return rows


def _coerce_row(row: dict, float_cols: list, int_cols: list) -> dict:
    """Convert string CSV values to proper numeric types."""
    out = dict(row)
    for c in float_cols:
        if c in out and out[c] not in (None, ""):
            try:
                out[c] = float(out[c])
            except (ValueError, TypeError):
                out[c] = None
    for c in int_cols:
        if c in out and out[c] not in (None, ""):
            try:
                out[c] = int(float(out[c]))
            except (ValueError, TypeError):
                out[c] = None
    return out


@data_router.post("/upload/villages", dependencies=[Depends(require_admin)])
async def upload_villages(file: UploadFile = File(...)):
    """
    Upload villages.csv.
    Required columns: village_id, name, district, lat, lon, population,
                      agricultural_area_ha, primary_crops, annual_rainfall_mm,
                      groundwater_depth_m, aquifer_type
    """
    rows = _parse_csv_upload(await file.read())
    required = {"village_id", "name"}
    for i, r in enumerate(rows):
        if not required.issubset(r.keys()):
            raise HTTPException(400, f"Row {i+1} missing required columns: {required}")
        r = _coerce_row(r, ["lat","lon","groundwater_depth_m"], ["population","agricultural_area_ha","annual_rainfall_mm"])
        upsert_village(r)
    return {"message": f"Uploaded {len(rows)} village records.", "count": len(rows)}


@data_router.post("/upload/groundwater", dependencies=[Depends(require_admin)])
async def upload_groundwater(file: UploadFile = File(...)):
    """
    Upload groundwater.csv.
    Required columns: village_id, year, month, depth_m
    Optional: change_from_prev_year_m, quality
    """
    rows = _parse_csv_upload(await file.read())
    required = {"village_id", "year", "month", "depth_m"}
    coerced = []
    for i, r in enumerate(rows):
        if not required.issubset(r.keys()):
            raise HTTPException(400, f"Row {i+1} missing: {required - r.keys()}")
        r.setdefault("change_from_prev_year_m", 0)
        r.setdefault("quality", "unknown")
        coerced.append(_coerce_row(r, ["depth_m","change_from_prev_year_m"], ["year","month"]))
    upsert_groundwater_rows(coerced)
    return {"message": f"Uploaded {len(coerced)} groundwater records.", "count": len(coerced)}


@data_router.post("/upload/rainfall", dependencies=[Depends(require_admin)])
async def upload_rainfall(file: UploadFile = File(...)):
    """
    Upload rainfall.csv.
    Required columns: village_id, year, month, rainfall_mm
    Optional: historical_avg_mm, deficit_pct, season
    """
    rows = _parse_csv_upload(await file.read())
    required = {"village_id", "year", "month", "rainfall_mm"}
    coerced = []
    for i, r in enumerate(rows):
        if not required.issubset(r.keys()):
            raise HTTPException(400, f"Row {i+1} missing: {required - r.keys()}")
        r.setdefault("historical_avg_mm", None)
        r.setdefault("deficit_pct", None)
        r.setdefault("season", "")
        coerced.append(_coerce_row(r, ["rainfall_mm","historical_avg_mm","deficit_pct"], ["year","month"]))
    upsert_rainfall_rows(coerced)
    return {"message": f"Uploaded {len(coerced)} rainfall records.", "count": len(coerced)}


@data_router.post("/upload/water-demand", dependencies=[Depends(require_admin)])
async def upload_water_demand(file: UploadFile = File(...)):
    """
    Upload water_demand.csv.
    Required columns: village_id, year, domestic_demand_mcm, agricultural_demand_mcm,
                      industrial_demand_mcm, total_demand_mcm, available_supply_mcm, deficit_mcm
    """
    rows = _parse_csv_upload(await file.read())
    required = {"village_id", "year", "total_demand_mcm", "available_supply_mcm", "deficit_mcm"}
    coerced = []
    for i, r in enumerate(rows):
        if not required.issubset(r.keys()):
            raise HTTPException(400, f"Row {i+1} missing: {required - r.keys()}")
        r.setdefault("domestic_demand_mcm", 0)
        r.setdefault("agricultural_demand_mcm", 0)
        r.setdefault("industrial_demand_mcm", 0)
        coerced.append(_coerce_row(r,
            ["domestic_demand_mcm","agricultural_demand_mcm","industrial_demand_mcm",
             "total_demand_mcm","available_supply_mcm","deficit_mcm"],
            ["year"]))
    upsert_water_demand_rows(coerced)
    return {"message": f"Uploaded {len(coerced)} water demand records.", "count": len(coerced)}


@data_router.post("/upload/recharge", dependencies=[Depends(require_admin)])
async def upload_recharge(file: UploadFile = File(...)):
    """
    Upload recharge.csv.
    Required columns: village_id, year, structure_type, estimated_recharge_mcm
    Optional: count, status, notes
    """
    rows = _parse_csv_upload(await file.read())
    required = {"village_id", "year", "structure_type", "estimated_recharge_mcm"}
    coerced = []
    for i, r in enumerate(rows):
        if not required.issubset(r.keys()):
            raise HTTPException(400, f"Row {i+1} missing: {required - r.keys()}")
        r.setdefault("count", 0)
        r.setdefault("status", "")
        r.setdefault("notes", "")
        coerced.append(_coerce_row(r, ["estimated_recharge_mcm"], ["year","count"]))
    upsert_recharge_rows(coerced)
    return {"message": f"Uploaded {len(coerced)} recharge records.", "count": len(coerced)}


# ─────────────────────────────────────────────────────────────────────────────
# MANUAL SINGLE-ROW ENTRY
# ─────────────────────────────────────────────────────────────────────────────

class GroundwaterEntry(BaseModel):
    village_id: str
    year:       int
    month:      int
    depth_m:    float
    change_from_prev_year_m: float = 0.0
    quality:    str = "unknown"

class RainfallEntry(BaseModel):
    village_id:       str
    year:             int
    month:            int
    rainfall_mm:      float
    historical_avg_mm: Optional[float] = None
    deficit_pct:      Optional[float] = None
    season:           str = ""

class WaterDemandEntry(BaseModel):
    village_id:               str
    year:                     int
    domestic_demand_mcm:      float = 0.0
    agricultural_demand_mcm:  float = 0.0
    industrial_demand_mcm:    float = 0.0
    total_demand_mcm:         float
    available_supply_mcm:     float
    deficit_mcm:              float


@data_router.post("/entry/groundwater", dependencies=[Depends(require_admin)])
def add_groundwater_entry(entry: GroundwaterEntry):
    upsert_groundwater_rows([entry.model_dump()])
    return {"message": "Groundwater entry saved.", "data_source": "live"}


@data_router.post("/entry/rainfall", dependencies=[Depends(require_admin)])
def add_rainfall_entry(entry: RainfallEntry):
    upsert_rainfall_rows([entry.model_dump()])
    return {"message": "Rainfall entry saved.", "data_source": "live"}


@data_router.post("/entry/water-demand", dependencies=[Depends(require_admin)])
def add_water_demand_entry(entry: WaterDemandEntry):
    upsert_water_demand_rows([entry.model_dump()])
    return {"message": "Water demand entry saved.", "data_source": "live"}


# ─────────────────────────────────────────────────────────────────────────────
# RESET  (delete live rows → revert to demo seed)
# ─────────────────────────────────────────────────────────────────────────────

VALID_TABLES = {"villages","groundwater","rainfall","water_demand","recharge","crops"}

@data_router.delete("/reset/{table}", dependencies=[Depends(require_admin)])
def reset_table(table: str):
    """Delete all live rows for a table — reverts to demo/CSV seed data."""
    if table not in VALID_TABLES:
        raise HTTPException(400, f"Unknown table '{table}'. Valid: {VALID_TABLES}")
    delete_table_live_rows(table)
    return {"message": f"Live data deleted from '{table}'. Demo data is now active."}


# ─────────────────────────────────────────────────────────────────────────────
# READ current data (for admin preview)
# ─────────────────────────────────────────────────────────────────────────────

@data_router.get("/preview/villages")
def preview_villages():
    return {"rows": db_get_villages(), "count": len(db_get_villages())}

@data_router.get("/preview/groundwater")
def preview_groundwater(village_id: Optional[str] = None):
    rows = db_get_groundwater(village_id)
    return {"rows": rows[:100], "count": len(rows)}  # cap at 100

@data_router.get("/preview/rainfall")
def preview_rainfall(village_id: Optional[str] = None):
    rows = db_get_rainfall(village_id)
    return {"rows": rows[:100], "count": len(rows)}

@data_router.get("/preview/water-demand")
def preview_water_demand(village_id: Optional[str] = None):
    rows = db_get_water_demand(village_id)
    return {"rows": rows, "count": len(rows)}

@data_router.get("/preview/recharge")
def preview_recharge(village_id: Optional[str] = None):
    rows = db_get_recharge(village_id)
    return {"rows": rows, "count": len(rows)}
