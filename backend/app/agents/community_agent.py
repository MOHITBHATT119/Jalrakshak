"""
Community Priority Agent
Ranks villages by water stress urgency.
"""
from app.services.data_service import get_all_villages, get_data_note
from app.agents.water_health_agent import calculate_water_health_score
from app.agents.drought_agent import assess_drought_risk

# Defaults are hardcoded here so the API always returns paged results even
# when the client does not specify page/limit.
DEFAULT_PAGE = 1
DEFAULT_LIMIT = 10


def rank_communities(page: int = None, limit: int = None, level: str = None) -> dict:
    """
    Rank all villages by water priority (URGENT → LOW).
    Supports server-side filtering by level and pagination (page, limit).
    Pagination always applies; page/limit default to DEFAULT_PAGE/DEFAULT_LIMIT.
    """
    villages = get_all_villages()
    ranked = []

    for v in villages:
        vid = v["village_id"]
        try:
            health = calculate_water_health_score(vid)
            drought = assess_drought_risk(vid)

            # Priority score = inverse of health score
            health_score = health.get("overall_score", 50)
            priority_score = round(100 - health_score, 1)
            is_emer = health.get("is_emergency", False) or priority_score >= 40.0
            priority_level = _to_priority_level(priority_score, drought.get("risk_level", "MODERATE"), is_emer)

            ranked.append({
                "village_id": vid,
                "village_name": v["name"],
                "district": v.get("district", ""),
                "priority_score": priority_score,
                "priority_level": priority_level,
                "water_health_score": health_score,
                "water_health_category": health.get("category", "UNKNOWN"),
                "drought_risk": drought.get("risk_level", "UNKNOWN"),
                "groundwater_trend": health.get("groundwater_trend", "UNKNOWN"),
                "key_issues": health.get("explanation_factors", [])[:2],
                "is_emergency": is_emer or priority_level == "EMERGENCY",
            })
        except Exception as e:
            ranked.append({
                "village_id": vid,
                "village_name": v["name"],
                "district": v.get("district", ""),
                "priority_score": 50,
                "priority_level": "MEDIUM",
                "water_health_score": 50,
                "water_health_category": "UNKNOWN",
                "drought_risk": "UNKNOWN",
                "groundwater_trend": "UNKNOWN",
                "key_issues": ["Analysis unavailable"],
                "is_emergency": False,
            })

    ranked.sort(key=lambda x: x["priority_score"], reverse=True)

    emergency = [r for r in ranked if r["priority_level"] == "EMERGENCY" or r.get("is_emergency")]
    urgent = [r for r in ranked if r["priority_level"] == "URGENT"]
    high = [r for r in ranked if r["priority_level"] == "HIGH"]
    medium = [r for r in ranked if r["priority_level"] == "MEDIUM"]
    moderate = [r for r in ranked if r["priority_level"] == "MODERATE"]
    low = [r for r in ranked if r["priority_level"] == "LOW"]

    # Optional server-side filtering
    filtered = ranked
    if level and level.upper() != "ALL":
        lvl = level.upper()
        if lvl == "EMERGENCY":
            filtered = [r for r in ranked if r["priority_level"] == "EMERGENCY" or r.get("is_emergency")]
        else:
            filtered = [r for r in ranked if r["priority_level"] == lvl]

    total_matching = len(filtered)

    # Pagination is always applied using hardcoded defaults.
    page_num = max(1, page if page is not None else DEFAULT_PAGE)
    page_size = limit if limit is not None and limit > 0 else DEFAULT_LIMIT
    start = (page_num - 1) * page_size
    end = start + page_size
    paged_villages = filtered[start:end]
    total_pages = max(1, (total_matching + page_size - 1) // page_size)

    return {
        "total_villages": len(ranked),
        "emergency_count": len(emergency),
        "urgent_count": len(urgent),
        "high_count": len(high),
        "medium_count": len(medium),
        "moderate_count": len(moderate),
        "low_count": len(low),
        "page": page_num,
        "limit": page_size,
        "total_pages": total_pages,
        "total_matching": total_matching,
        "ranked_villages": paged_villages,
        "data_note": get_data_note(),
    }


def _to_priority_level(priority_score: float, drought_risk: str = "MODERATE", is_emergency: bool = False) -> str:
    if is_emergency or priority_score >= 40.0:
        return "EMERGENCY"
    elif priority_score >= 37.0 or drought_risk == "SEVERE":
        return "URGENT"
    elif priority_score >= 34.0 or drought_risk == "HIGH":
        return "HIGH"
    elif priority_score >= 25.0:
        return "MEDIUM"
    elif priority_score >= 18.0:
        return "MODERATE"
    else:
        return "LOW"
