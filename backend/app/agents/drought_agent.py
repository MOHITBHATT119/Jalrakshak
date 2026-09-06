"""
Drought Early Warning Agent
Deterministic drought risk calculation based on rainfall deficit,
groundwater depth, and water demand.
"""
from app.services.data_service import (
    get_rainfall_data, get_village, get_water_demand_data, get_data_note
)
from app.agents.groundwater_agent import analyze_groundwater


def assess_drought_risk(village_id: str) -> dict:
    """
    Calculate drought risk for a village.
    Returns risk_score (0-100), risk_level, factors, evidence, recommended_actions, confidence.
    """
    village = get_village(village_id)
    gw_result = analyze_groundwater(village_id)
    rainfall_data = get_rainfall_data(village_id)
    demand_data = get_water_demand_data(village_id)

    # ---- Rainfall component (0-40 points) ----
    rainfall_score = 0
    rainfall_evidence = []
    if rainfall_data:
        recent_rainfall = [r for r in rainfall_data if int(r["year"]) >= 2022]
        if recent_rainfall:
            deficits = [float(r["deficit_pct"]) for r in recent_rainfall]
            avg_deficit = sum(deficits) / len(deficits)
            if avg_deficit < -50:
                rainfall_score = 40
                rainfall_evidence.append(f"Severe rainfall deficit: {avg_deficit:.0f}% below average")
            elif avg_deficit < -30:
                rainfall_score = 30
                rainfall_evidence.append(f"High rainfall deficit: {avg_deficit:.0f}% below average")
            elif avg_deficit < -15:
                rainfall_score = 20
                rainfall_evidence.append(f"Moderate rainfall deficit: {avg_deficit:.0f}% below average")
            elif avg_deficit < 0:
                rainfall_score = 10
                rainfall_evidence.append(f"Below-average rainfall: {avg_deficit:.0f}%")
            else:
                rainfall_score = 0
                rainfall_evidence.append("Rainfall near or above average")
        else:
            # Use village baseline annual rainfall
            if village:
                ann_rain = int(village.get("annual_rainfall_mm", 650))
                if ann_rain < 450:
                    rainfall_score = 35
                    rainfall_evidence.append(f"Low annual rainfall baseline: {ann_rain}mm")
                elif ann_rain < 600:
                    rainfall_score = 20
                    rainfall_evidence.append(f"Below-average annual rainfall: {ann_rain}mm")
                else:
                    rainfall_score = 10
    else:
        if village:
            ann_rain = int(village.get("annual_rainfall_mm", 650))
            if ann_rain < 450:
                rainfall_score = 30
                rainfall_evidence.append(f"Low annual rainfall area: {ann_rain}mm")
            elif ann_rain < 600:
                rainfall_score = 20

    # ---- Groundwater component (0-40 points) ----
    gw_score = 0
    gw_evidence = []
    severity = gw_result.get("severity", "UNKNOWN")
    trend = gw_result.get("trend", "UNKNOWN")
    annual_change = gw_result.get("annual_change_m") or 0

    if severity == "CRITICAL" or trend == "CRITICAL":
        gw_score = 40
        gw_evidence.append("Critically depleted groundwater levels")
    elif severity == "HIGH":
        gw_score = 30
        gw_evidence.append(f"High groundwater depletion: {annual_change:.1f}m/year decline")
    elif severity == "MODERATE":
        gw_score = 20
        gw_evidence.append(f"Moderate groundwater stress: {annual_change:.1f}m/year decline")
    elif severity == "LOW":
        gw_score = 5
    else:
        gw_score = 15

    # ---- Demand pressure component (0-20 points) ----
    demand_score = 0
    demand_evidence = []
    if demand_data:
        recent_demand = sorted(demand_data, key=lambda x: int(x["year"]))[-1]
        deficit = float(recent_demand.get("deficit_mcm", 0))
        if deficit < -80:
            demand_score = 20
            demand_evidence.append(f"Severe water demand deficit: {abs(deficit):.0f} MCM")
        elif deficit < -30:
            demand_score = 15
            demand_evidence.append(f"Significant water deficit: {abs(deficit):.0f} MCM")
        elif deficit < 0:
            demand_score = 8
            demand_evidence.append(f"Water deficit: {abs(deficit):.0f} MCM")
        else:
            demand_evidence.append("Water supply meeting demand")
    else:
        if village:
            pop = int(village.get("population", 100000))
            ag_area = int(village.get("agricultural_area_ha", 30000))
            if ag_area > 45000:
                demand_score = 15
                demand_evidence.append(f"Large agricultural area: {ag_area}ha creates high demand")
            elif ag_area > 30000:
                demand_score = 10

    risk_score = min(100, rainfall_score + gw_score + demand_score)
    risk_level = _score_to_level(risk_score)

    all_evidence = rainfall_evidence + gw_evidence + demand_evidence
    if not all_evidence:
        all_evidence = ["Insufficient data for detailed analysis"]

    recommended_actions = _get_recommended_actions(risk_level, trend)

    confidence = "HIGH" if (rainfall_data and demand_data) else ("MODERATE" if village else "LOW")

    return {
        "village_id": village_id,
        "village_name": village["name"] if village else village_id,
        "risk_score": risk_score,
        "risk_level": risk_level,
        "components": {
            "rainfall_score": rainfall_score,
            "groundwater_score": gw_score,
            "demand_score": demand_score,
        },
        "factors": all_evidence,
        "evidence": all_evidence,
        "recommended_actions": recommended_actions,
        "confidence": confidence,
        "data_note": get_data_note(village_id),
    }


def _score_to_level(score: int) -> str:
    if score >= 75:
        return "SEVERE"
    elif score >= 55:
        return "HIGH"
    elif score >= 35:
        return "MODERATE"
    else:
        return "LOW"


def _get_recommended_actions(risk_level: str, trend: str) -> list:
    base = {
        "SEVERE": [
            "Declare drought preparedness - activate emergency water protocols",
            "Immediately restrict non-essential groundwater extraction",
            "Prioritise drinking water supply for all communities",
            "Activate recharge structure maintenance and new construction",
            "Switch remaining crops to drought-tolerant varieties",
            "Coordinate with district water board for emergency support",
        ],
        "HIGH": [
            "Alert Gram Panchayat and water committee for action",
            "Reduce agricultural groundwater extraction by 30%",
            "Begin crop substitution planning for next season",
            "Survey and repair existing recharge structures",
            "Implement micro-irrigation for water-intensive crops",
        ],
        "MODERATE": [
            "Monitor groundwater levels weekly",
            "Promote water-efficient irrigation methods",
            "Plan new recharge structures before next monsoon",
            "Encourage drought-tolerant crop adoption",
            "Review water allocation among user groups",
        ],
        "LOW": [
            "Continue regular monitoring of groundwater levels",
            "Maintain existing recharge structures",
            "Plan for upcoming season water requirements",
        ],
    }
    return base.get(risk_level, base["MODERATE"])
