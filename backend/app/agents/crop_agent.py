"""
Water-Efficient Crop Advisory Agent
Recommends water-efficient crops based on water availability and season.
"""
from app.services.data_service import get_crops_data, get_village
from app.agents.drought_agent import assess_drought_risk


def get_crop_advice(village_id: str, season: str = "kharif", include_rabi: bool = True) -> dict:
    """
    Return crop recommendations based on water availability and drought risk.
    """
    village = get_village(village_id)
    crops = get_crops_data()
    drought = assess_drought_risk(village_id)

    risk_level = drought.get("risk_level", "MODERATE")

    # Filter by season relevance
    suitable_crops = []
    for crop in crops:
        crop_season = crop.get("season", "kharif")
        suitability = crop.get("suitability_saurashtra", "moderate")
        drought_tol = crop.get("drought_tolerance", "moderate")
        water_req = int(crop.get("water_requirement_mm", 500))

        # Score each crop
        score = 0
        if suitability in ["very_high", "high"]:
            score += 30
        elif suitability == "moderate":
            score += 15

        if drought_tol in ["very_high", "high"]:
            score += 30
        elif drought_tol == "moderate":
            score += 15

        if water_req < 300:
            score += 25
        elif water_req < 500:
            score += 15
        elif water_req < 700:
            score += 5

        if risk_level in ["SEVERE", "HIGH"]:
            if drought_tol in ["low"]:
                score -= 30
            if water_req > 800:
                score -= 20

        water_saving = int(crop.get("water_saving_vs_cotton_pct", 0))

        suitable_crops.append({
            "crop_id": crop["crop_id"],
            "name": crop["name"],
            "water_requirement_mm": water_req,
            "season": crop_season,
            "drought_tolerance": drought_tol,
            "suitability": suitability,
            "water_saving_vs_cotton_pct": water_saving,
            "score": score,
            "reason": _get_crop_reason(crop, risk_level),
        })

    # Sort by score descending
    suitable_crops.sort(key=lambda x: x["score"], reverse=True)

    top_kharif = [c for c in suitable_crops if c["season"] == "kharif"][:5]
    top_rabi = [c for c in suitable_crops if c["season"] == "rabi"][:3]
    top_perennial = [c for c in suitable_crops if c["season"] == "annual"][:3]

    general_tips = _get_water_saving_tips(risk_level)

    return {
        "village_id": village_id,
        "village_name": village["name"] if village else village_id,
        "drought_risk_level": risk_level,
        "recommendations": {
            "kharif_crops": top_kharif,
            "rabi_crops": top_rabi,
            "perennial_crops": top_perennial,
        },
        "water_saving_tips": general_tips,
        "disclaimer": "AI-assisted recommendation. Local agricultural validation recommended.",
        "data_note": "Synthetic demonstration data. Not official government measurements.",
    }


def _get_crop_reason(crop: dict, risk_level: str) -> str:
    name = crop["name"]
    drought_tol = crop.get("drought_tolerance", "moderate")
    water_req = int(crop.get("water_requirement_mm", 500))
    saving = int(crop.get("water_saving_vs_cotton_pct", 0))

    if drought_tol in ["very_high", "high"] and water_req < 400:
        return f"{name} is highly drought-tolerant requiring only {water_req}mm water, saving ~{saving}% vs cotton"
    elif drought_tol == "high":
        return f"{name} has good drought tolerance with {water_req}mm water requirement"
    elif water_req < 350:
        return f"{name} has low water requirement of {water_req}mm"
    else:
        return f"{name} is suitable for Saurashtra conditions with {water_req}mm water requirement"


def _get_water_saving_tips(risk_level: str) -> list:
    tips = [
        "Use drip irrigation to reduce water use by 40-60%",
        "Mulching reduces soil moisture evaporation by 30-40%",
        "Schedule irrigation in early morning or evening",
        "Monitor soil moisture before irrigating",
        "Group crops with similar water needs together",
    ]
    if risk_level in ["SEVERE", "HIGH"]:
        tips = [
            "Switch immediately to drought-tolerant crops: Bajra, Moth Bean, Castor",
            "Reduce irrigated area - focus on drinking water security first",
            "Practice deficit irrigation - 70% of crop water requirement can often be sustained",
            "Harvest rainwater through farm ponds and storage tanks",
            "Consider fallowing part of the field this season to save water",
        ] + tips
    return tips[:6]
