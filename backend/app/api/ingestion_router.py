"""
Ingestion router — trigger live data pulls from government sources.
All endpoints require admin authentication.
"""
import logging
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import Optional

from app.core.security import require_admin
from app.services.ingestion.data_gov_connector import (
    fetch_rainfall_district,
    GUJARAT_RAINFALL_RESOURCE,
)
from app.services.database import upsert_rainfall_rows, get_table_stats

logger = logging.getLogger(__name__)

ingestion_router = APIRouter(
    prefix="/data/ingest",
    tags=["data-ingestion"],
    dependencies=[Depends(require_admin)],
)


class DataGovIngestRequest(BaseModel):
    resource_id: Optional[str] = None
    district_filter: Optional[str] = None


@ingestion_router.post("/data-gov")
def ingest_from_data_gov(req: DataGovIngestRequest = DataGovIngestRequest()):
    """
    Pull rainfall data from data.gov.in and upsert into the database.
    Rows are marked data_source='live' and attributed to a named government dataset.

    Requires admin JWT in Authorization header.

    Query params (all optional):
    - resource_id: override the default IMD Gujarat rainfall resource
    - district_filter: restrict to a single Saurashtra district (e.g. 'Rajkot')
    """
    resource_id = req.resource_id or GUJARAT_RAINFALL_RESOURCE

    try:
        rows = fetch_rainfall_district(
            resource_id=resource_id,
            district_filter=req.district_filter,
        )
    except Exception as exc:
        logger.exception("Ingestion failed")
        raise HTTPException(status_code=502, detail=f"data.gov.in fetch failed: {exc}")

    if not rows:
        return {
            "status": "no_data",
            "message": (
                "No Saurashtra-district records returned. "
                "Check DATA_GOV_API_KEY and the resource ID."
            ),
            "rows_inserted": 0,
        }

    # Strip internal fields not in the DB schema before upsert
    clean_rows = [
        {k: v for k, v in r.items() if k not in ("gov_source", "district")}
        for r in rows
    ]

    try:
        upsert_rainfall_rows(clean_rows)
    except Exception as exc:
        logger.exception("DB upsert failed after ingestion")
        raise HTTPException(status_code=500, detail=f"DB upsert failed: {exc}")

    stats = get_table_stats()
    return {
        "status": "ok",
        "rows_inserted": len(clean_rows),
        "source": "data.gov.in",
        "resource_id": resource_id,
        "district_filter": req.district_filter,
        "rainfall_table": stats.get("rainfall"),
    }
