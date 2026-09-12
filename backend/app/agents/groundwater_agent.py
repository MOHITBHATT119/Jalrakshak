"""
Groundwater Depletion Monitoring Agent
Analyzes groundwater trends using deterministic calculations.
"""
from typing import Optional
from app.services.data_service import (
    get_village_groundwater_series, get_village, get_data_note,
    safe_int, safe_float
)


def analyze_groundwater(village_id: str) -> dict:
    """
    Analyze groundwater depletion for a village.
    Returns structured data with trend, severity, confidence, evidence.
    """
    series = get_village_groundwater_series(village_id)
    village = get_village(village_id)

    if not series:
        return _unknown_result(village_id)

    # Sort by year, month using safe_int
    series_sorted = sorted(series, key=lambda x: (safe_int(x.get("year")), safe_int(x.get("month"))))

    # Get most recent depth
    latest = series_sorted[-1]
    current_depth = safe_float(latest.get("depth_m"), 0.0)

    # Get depth from 5 years ago or earliest available
    earliest = series_sorted[0]
    historical_depth = safe_float(earliest.get("depth_m"), current_depth)

    # Get annual change (most recent year vs prior year, same month)
    latest_month = safe_int(latest.get("month"))
    recent_same_month = [s for s in series_sorted if safe_int(s.get("month")) == latest_month]
    if len(recent_same_month) >= 2:
        prior_year_depth = safe_float(recent_same_month[-2].get("depth_m"), current_depth)
        annual_change = current_depth - prior_year_depth
    else:
        annual_change = 0.0

    # Calculate change percentage (depth increasing = depletion)
    if historical_depth > 0:
        change_pct = ((current_depth - historical_depth) / historical_depth) * 100
    else:
        change_pct = 0.0

    # Determine trend
    trend = _determine_trend(annual_change, change_pct)
    severity = _determine_severity(current_depth, annual_change, change_pct)
    confidence = _calculate_confidence(series_sorted)

    # Evidence points
    evidence = []
    if annual_change > 0.5:
        evidence.append(f"Depth increased by {annual_change:.1f}m in past year (water table dropping)")
    if change_pct > 20:
        evidence.append(f"Cumulative depletion of {change_pct:.1f}% since 2019")
    if current_depth > 25:
        evidence.append(f"Current depth {current_depth:.1f}m exceeds safe extraction threshold")
    if not evidence:
        evidence.append(f"Current depth: {current_depth:.1f}m, annual change: {annual_change:+.1f}m")

    # Build timeseries for charts
    timeseries = [
        {
            "year": safe_int(s.get("year")),
            "month": safe_int(s.get("month")),
            "depth_m": safe_float(s.get("depth_m")),
            "quality": s.get("quality", "unknown"),
        }
        for s in series_sorted
    ]

    return {
        "village_id": village_id,
        "village_name": village["name"] if village else village_id,
        "current_depth_m": round(current_depth, 2),
        "historical_depth_m": round(historical_depth, 2),
        "annual_change_m": round(annual_change, 2),
        "change_pct_since_2019": round(change_pct, 1),
        "trend": trend,
        "severity": severity,
        "confidence": confidence,
        "evidence": evidence,
        "timeseries": timeseries,
        "data_note": get_data_note(village_id),
    }


def _determine_trend(annual_change: float, change_pct: float) -> str:
    if annual_change < -0.3:
        return "IMPROVING"
    elif annual_change <= 0.3:
        return "STABLE"
    elif annual_change <= 1.0:
        return "DECLINING"
    else:
        return "CRITICAL"


def _determine_severity(depth: float, annual_change: float, change_pct: float) -> str:
    if depth > 35 or (annual_change > 1.5 and change_pct > 30):
        return "CRITICAL"
    elif depth > 25 or (annual_change > 1.0 and change_pct > 20):
        return "HIGH"
    elif depth > 18 or annual_change > 0.5:
        return "MODERATE"
    else:
        return "LOW"


def _calculate_confidence(series: list) -> str:
    if len(series) >= 15:
        return "HIGH"
    elif len(series) >= 8:
        return "MODERATE"
    elif len(series) >= 3:
        return "LOW"
    return "VERY_LOW"


def _unknown_result(village_id: str) -> dict:
    return {
        "village_id": village_id,
        "village_name": village_id,
        "current_depth_m": None,
        "historical_depth_m": None,
        "annual_change_m": None,
        "change_pct_since_2019": None,
        "trend": "UNKNOWN",
        "severity": "UNKNOWN",
        "confidence": "VERY_LOW",
        "evidence": ["Insufficient data for analysis"],
        "timeseries": [],
        "data_note": "No data available for this village.",
    }
