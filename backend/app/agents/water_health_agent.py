"""
Water Health Score Agent
Computes a 0-100 composite Water Health Score from multiple indicators.
All calculations are deterministic - no LLM for numbers.
"""
from app.agents.groundwater_agent import analyze_groundwater
from app.agents.drought_agent import assess_drought_risk
from app.services.data_service import get_village, get_water_demand_data, get_recharge_data


def calculate_water_health_score(village_id: str) -> dict:
    """
    Calculate the Water Health Score (0-100).
    Higher = healthier water situation.
    """
    village = get_village(village_id)
    gw_result = analyze_groundwater(village_id)
    drought_result = assess_drought_risk(village_id)
    demand_data = get_water_demand_data(village_id)
    recharge_data = get_recharge_data(village_id)

    # ---- Groundwater Score (0-25 points) ----
    gw_score = _groundwater_sub_score(gw_result)

    # ---- Rainfall Score (0-20 points) ----
    rainfall_score = _rainfall_sub_score(drought_result, village)

    # ---- Drought Score (0-25 points) ----
    drought_sub = _drought_sub_score(drought_result)

    # ---- Demand Score (0-20 points) ----
    demand_sub = _demand_sub_score(demand_data)

    # ---- Recharge Score (0-10 points) ----
    recharge_sub = _recharge_sub_score(recharge_data)

    total = gw_score + rainfall_score + drought_sub + demand_sub + recharge_sub
    total = max(0, min(100, total))

    category = _score_to_category(total)
    is_emergency = total <= 29 or drought_result.get("risk_level") == "SEVERE"

    explanation_factors = []
    if gw_score < 12:
        explanation_factors.append("Groundwater depletion is reducing water availability")
    if rainfall_score < 10:
        explanation_factors.append("Rainfall deficit is constraining natural recharge")
    if drought_sub < 12:
        explanation_factors.append("High drought risk is stressing the water system")
    if demand_sub < 10:
        explanation_factors.append("Water demand is exceeding available supply")
    if recharge_sub < 5:
        explanation_factors.append("Insufficient recharge structures to replenish aquifers")
    if not explanation_factors:
        explanation_factors.append("Water resources are relatively stable in this area")

    return {
        "village_id": village_id,
        "village_name": village["name"] if village else village_id,
        "overall_score": round(total, 1),
        "category": category,
        "is_emergency": is_emergency,
        "components": {
            "groundwater_score": round(gw_score, 1),
            "groundwater_max": 25,
            "rainfall_score": round(rainfall_score, 1),
            "rainfall_max": 20,
            "drought_score": round(drought_sub, 1),
            "drought_max": 25,
            "demand_score": round(demand_sub, 1),
            "demand_max": 20,
            "recharge_score": round(recharge_sub, 1),
            "recharge_max": 10,
        },
        "explanation_factors": explanation_factors,
        "drought_risk_level": drought_result.get("risk_level", "UNKNOWN"),
        "groundwater_trend": gw_result.get("trend", "UNKNOWN"),
        "data_note": "Synthetic demonstration data. Not official government measurements.",
    }


def _groundwater_sub_score(gw: dict) -> float:
    severity = gw.get("severity", "MODERATE")
    trend = gw.get("trend", "STABLE")
    base = {"LOW": 22, "MODERATE": 15, "HIGH": 8, "CRITICAL": 3, "UNKNOWN": 10}.get(severity, 10)
    bonus = {"IMPROVING": 3, "STABLE": 2, "DECLINING": 0, "CRITICAL": -3}.get(trend, 0)
    return max(0, min(25, base + bonus))


def _rainfall_sub_score(drought: dict, village: dict) -> float:
    rf_comp = drought.get("components", {}).get("rainfall_score", 15)
    # rainfall_score in drought is 0-40 where 40=worst
    # Invert: healthy = high score
    inv = 40 - rf_comp
    return max(0, min(20, inv * 0.5))


def _drought_sub_score(drought: dict) -> float:
    risk = drought.get("risk_level", "MODERATE")
    return {"LOW": 23, "MODERATE": 14, "HIGH": 7, "SEVERE": 2}.get(risk, 10)


def _demand_sub_score(demand_data: list) -> float:
    if not demand_data:
        return 12  # neutral if no data
    recent = sorted(demand_data, key=lambda x: int(x["year"]))[-1]
    deficit = float(recent.get("deficit_mcm", 0))
    if deficit > 20:
        return 18
    elif deficit >= -10:
        return 15
    elif deficit >= -40:
        return 10
    elif deficit >= -80:
        return 6
    else:
        return 2


def _recharge_sub_score(recharge_data: list) -> float:
    if not recharge_data:
        return 4
    # Count distinct structure types as a proxy for recharge investment
    types = set(r.get("structure_type") for r in recharge_data)
    return min(10, len(types) * 2 + 2)


def _score_to_category(score: float) -> str:
    if score >= 85:
        return "HEALTHY"
    elif score >= 70:
        return "WATCH"
    elif score >= 50:
        return "STRESSED"
    elif score >= 30:
        return "CRITICAL"
    else:
        return "EMERGENCY"
