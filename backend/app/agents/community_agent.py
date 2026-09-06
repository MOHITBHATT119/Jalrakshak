"""
Community Priority Agent
Ranks villages by water stress urgency.
"""
from app.services.data_service import get_all_villages
from app.agents.water_health_agent import calculate_water_health_score
from app.agents.drought_agent import assess_drought_risk


def rank_communities() -> dict:
    """
    Rank all villages by water priority (URGENT → LOW).
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
            priority_level = _to_priority_level(priority_score, drought.get("risk_level", "MODERATE"))

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
                "is_emergency": health.get("is_emergency", False),
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

    emergency = [r for r in ranked if r["is_emergency"]]
    urgent = [r for r in ranked if r["priority_level"] == "URGENT" and not r["is_emergency"]]
    high = [r for r in ranked if r["priority_level"] == "HIGH"]
    medium = [r for r in ranked if r["priority_level"] == "MEDIUM"]
    low = [r for r in ranked if r["priority_level"] == "LOW"]

    return {
        "total_villages": len(ranked),
        "emergency_count": len(emergency),
        "urgent_count": len(urgent),
        "high_count": len(high),
        "medium_count": len(medium),
        "low_count": len(low),
        "ranked_villages": ranked,
        "data_note": "Synthetic demonstration data. Not official government measurements.",
    }


def _to_priority_level(priority_score: float, drought_risk: str) -> str:
    if priority_score >= 70 or drought_risk == "SEVERE":
        return "URGENT"
    elif priority_score >= 50 or drought_risk == "HIGH":
        return "HIGH"
    elif priority_score >= 30:
        return "MEDIUM"
    else:
        return "LOW"
