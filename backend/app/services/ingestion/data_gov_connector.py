"""
data.gov.in connector — fetches real government datasets and normalises them
to the JalRakshak rainfall schema.

Usage:
    from app.services.ingestion.data_gov_connector import fetch_rainfall_district

The function returns a list of dicts ready to pass to upsert_rainfall_rows().
"""
import os
import logging
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

DATA_GOV_API_KEY = os.environ.get("DATA_GOV_API_KEY", "")
DATA_GOV_BASE_URL = "https://api.data.gov.in/resource"

# ── Well-known resource IDs (Gujarat / Saurashtra) ───────────────────────────
# Rainfall data — Gujarat district-wise (IMD annual dataset on data.gov.in)
GUJARAT_RAINFALL_RESOURCE = os.environ.get(
    "DATA_GOV_RAINFALL_RESOURCE_ID",
    "9ef84268-d588-465a-a308-a864a43d0070",   # IMD district-wise rainfall (public)
)


def _get_api_key() -> str:
    return os.environ.get("DATA_GOV_API_KEY", "").strip()


def _build_url(resource_id: str, offset: int = 0, limit: int = 500) -> str:
    api_key = _get_api_key()
    return (
        f"{DATA_GOV_BASE_URL}/{resource_id}"
        f"?api-key={api_key}"
        f"&format=json"
        f"&offset={offset}"
        f"&limit={limit}"
    )


def _fetch_all_records(resource_id: str, timeout: int = 20) -> list:
    """Page through data.gov.in until all records are fetched."""
    records = []
    offset = 0
    limit = 500

    while True:
        url = _build_url(resource_id, offset=offset, limit=limit)
        try:
            resp = httpx.get(url, timeout=timeout)
            resp.raise_for_status()
        except httpx.HTTPError as exc:
            logger.error("data.gov.in fetch error at offset %d: %s", offset, exc)
            break

        body = resp.json()
        batch = body.get("records", [])
        if not batch:
            break

        records.extend(batch)
        total = int(body.get("total", 0))
        offset += limit
        if offset >= total:
            break

    return records


# ── Saurashtra district names (lowercase) that we care about ─────────────────
SAURASHTRA_DISTRICTS = {
    "rajkot", "junagadh", "amreli", "bhavnagar", "morbi",
    "jamnagar", "porbandar", "gir somnath", "devbhoomi dwarka",
    "surendranagar", "botad",
}


def _normalise_district(raw: str) -> Optional[str]:
    """Map raw district strings from data.gov.in to our canonical names."""
    cleaned = raw.strip().lower()
    for d in SAURASHTRA_DISTRICTS:
        if d in cleaned:
            return d.title()
    return None


# ── Rainfall normalisation ────────────────────────────────────────────────────

_MONTH_COLS = {
    1: ["jan", "january"],
    2: ["feb", "february"],
    3: ["mar", "march"],
    4: ["apr", "april"],
    5: ["may"],
    6: ["jun", "june"],
    7: ["jul", "july"],
    8: ["aug", "august"],
    9: ["sep", "september"],
    10: ["oct", "october"],
    11: ["nov", "november"],
    12: ["dec", "december"],
}


def _find_col(record: dict, candidates: list) -> Optional[float]:
    """Find a matching column from a list of name variants, return float or None."""
    lower_record = {k.strip().lower(): v for k, v in record.items()}
    for c in candidates:
        val = lower_record.get(c)
        if val not in (None, "", "-"):
            try:
                return float(str(val).replace(",", ""))
            except (ValueError, TypeError):
                pass
    return None


def _get_year(record: dict) -> Optional[int]:
    for key in ("year", "Year", "YEAR", "yr", "Yr"):
        v = record.get(key)
        if v not in (None, "", "-"):
            try:
                return int(float(str(v)))
            except (ValueError, TypeError):
                pass
    return None


def _get_annual(record: dict) -> Optional[float]:
    for key in ("annual", "Annual", "ANNUAL", "ann", "total", "Total"):
        v = record.get(key)
        if v not in (None, "", "-"):
            try:
                return float(str(v).replace(",", ""))
            except (ValueError, TypeError):
                pass
    return None


def fetch_rainfall_district(
    resource_id: str = GUJARAT_RAINFALL_RESOURCE,
    district_filter: Optional[str] = None,
) -> list[dict]:
    """
    Fetch rainfall records from data.gov.in and return normalised rows
    ready for upsert_rainfall_rows().

    Each row: village_id, year, month, rainfall_mm, historical_avg_mm,
              deficit_pct, season, data_source='live'

    Village IDs are synthesised as 'dist_<district_slug>' so they map
    to the closest existing demo village for the district.
    """
    api_key = _get_api_key()
    if not api_key:
        logger.warning(
            "DATA_GOV_API_KEY not set — cannot fetch live government data. "
            "Set the key in .env and retry."
        )
        return []

    raw_records = _fetch_all_records(resource_id)
    if not raw_records:
        logger.warning("No records returned from data.gov.in resource %s", resource_id)
        return []

    rows: list[dict] = []

    for rec in raw_records:
        # Identify district
        district_raw = (
            rec.get("district_name") or rec.get("District_Name") or
            rec.get("district") or rec.get("District") or
            rec.get("state_district") or ""
        )
        district = _normalise_district(str(district_raw))
        if district is None:
            continue  # not a Saurashtra district
        if district_filter and district.lower() != district_filter.lower():
            continue

        year = _get_year(rec)
        if year is None:
            continue

        annual_mm = _get_annual(rec)

        # village_id: use district-level synthetic ID
        village_id = f"dist_{district.lower().replace(' ', '_')}"

        # Emit one row per month if monthly columns exist
        has_monthly = False
        for month_num, col_names in _MONTH_COLS.items():
            val = _find_col(rec, col_names)
            if val is not None:
                has_monthly = True
                rows.append({
                    "village_id": village_id,
                    "year": year,
                    "month": month_num,
                    "rainfall_mm": val,
                    "historical_avg_mm": None,
                    "deficit_pct": None,
                    "season": _season_for_month(month_num),
                    "data_source": "live",
                    "gov_source": "data.gov.in",
                    "district": district,
                })

        # If no monthly breakdown, emit an annual summary in month 0 slot (month=13 sentinel)
        if not has_monthly and annual_mm is not None:
            rows.append({
                "village_id": village_id,
                "year": year,
                "month": 7,   # place annual figure in kharif peak month (July)
                "rainfall_mm": annual_mm,
                "historical_avg_mm": None,
                "deficit_pct": None,
                "season": "kharif",
                "data_source": "live",
                "gov_source": "data.gov.in",
                "district": district,
            })

    logger.info(
        "data.gov.in ingestion: %d raw records → %d normalised rainfall rows",
        len(raw_records), len(rows),
    )
    return rows


def _season_for_month(month: int) -> str:
    if month in (6, 7, 8, 9):
        return "kharif"
    if month in (10, 11, 12, 1, 2):
        return "rabi"
    return "summer"
