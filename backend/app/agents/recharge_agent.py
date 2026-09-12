"""
Recharge Structure Planning Agent
Recommends groundwater recharge interventions based on available data.
"""
from app.services.data_service import (
    get_village, get_recharge_data, get_rainfall_data, get_data_note,
    safe_int, safe_float
)
from app.agents.groundwater_agent import analyze_groundwater


def get_recharge_advice(village_id: str) -> dict:
    """
    Recommend recharge structures for a village.
    Returns categorized recommendations with rationale.
    """
    village = get_village(village_id)
    gw_result = analyze_groundwater(village_id)
    existing_recharge = get_recharge_data(village_id)
    rainfall_data = get_rainfall_data(village_id)

    aquifer_type = (village.get("aquifer_type") or "alluvial") if village else "alluvial"
    annual_rainfall = safe_int(village.get("annual_rainfall_mm"), 600) if village else 600
    ag_area_ha = safe_int(village.get("agricultural_area_ha"), 30000) if village else 30000

    severity = gw_result.get("severity", "MODERATE")
    trend = gw_result.get("trend", "DECLINING")

    # Count existing structures
    existing_counts = {}
    for r in existing_recharge:
        st = r.get("structure_type", "unknown")
        existing_counts[st] = existing_counts.get(st, 0) + safe_int(r.get("count"), 0)

    recommendations = []

    # Check dam recommendations
    if aquifer_type in ["alluvial", "coastal"] and annual_rainfall >= 400:
        priority = "HIGH" if severity in ["CRITICAL", "HIGH"] else "MEDIUM"
        existing_dams = existing_counts.get("check_dam", 0)
        estimated_additional = max(0, (ag_area_ha // 2500) - existing_dams)
        if estimated_additional > 0:
            recommendations.append({
                "category": "check_dam",
                "display_name": "Check Dams",
                "priority": priority,
                "estimated_count": estimated_additional,
                "potential_recharge_mcm": round(estimated_additional * 0.8, 1),
                "existing_count": existing_dams,
                "rationale": f"Check dams on seasonal streams can recharge {estimated_additional * 0.8:.1f} MCM/year in alluvial aquifers",
                "suitable_for_aquifer": aquifer_type,
                "cost_category": "medium",
            })

    # Farm ponds
    if ag_area_ha > 10000:
        priority = "HIGH" if severity in ["CRITICAL", "HIGH"] else "MEDIUM"
        existing_ponds = existing_counts.get("farm_pond", 0)
        estimated_ponds = max(0, (ag_area_ha // 500) - existing_ponds)
        recommendations.append({
            "category": "farm_pond",
            "display_name": "Farm Ponds",
            "priority": priority,
            "estimated_count": min(estimated_ponds, 200),
            "potential_recharge_mcm": round(min(estimated_ponds, 200) * 0.05, 1),
            "existing_count": existing_ponds,
            "rationale": "Farm ponds store monsoon runoff and recharge groundwater through seepage",
            "suitable_for_aquifer": "all",
            "cost_category": "low",
        })

    # Recharge wells (hard rock areas)
    if aquifer_type == "hard_rock":
        priority = "HIGH" if severity in ["CRITICAL", "HIGH"] else "MEDIUM"
        existing_wells = existing_counts.get("recharge_well", 0)
        estimated_wells = max(0, (ag_area_ha // 150) - existing_wells)
        recommendations.append({
            "category": "recharge_well",
            "display_name": "Recharge Wells",
            "priority": priority,
            "estimated_count": min(estimated_wells, 500),
            "potential_recharge_mcm": round(min(estimated_wells, 500) * 0.01, 1),
            "existing_count": existing_wells,
            "rationale": "Recharge wells directly inject rainwater/runoff into hard rock aquifer fractures",
            "suitable_for_aquifer": "hard_rock",
            "cost_category": "low",
        })

    # Percolation tanks
    if annual_rainfall >= 500:
        recommendations.append({
            "category": "percolation_tank",
            "display_name": "Percolation Tanks",
            "priority": "MEDIUM",
            "estimated_count": max(1, ag_area_ha // 8000),
            "potential_recharge_mcm": round((ag_area_ha // 8000) * 2.5, 1),
            "existing_count": existing_counts.get("percolation_tank", 0),
            "rationale": "Percolation tanks slow runoff and allow groundwater recharge over large areas",
            "suitable_for_aquifer": "all",
            "cost_category": "medium",
        })

    # Contour bunds (watershed)
    if aquifer_type in ["hard_rock"] or ag_area_ha > 25000:
        recommendations.append({
            "category": "contour_bund",
            "display_name": "Contour Bunds & Trenches",
            "priority": "MEDIUM",
            "estimated_count": max(5, ag_area_ha // 1000),
            "potential_recharge_mcm": round((ag_area_ha // 1000) * 0.3, 1),
            "existing_count": existing_counts.get("contour_bund", 0),
            "rationale": "Contour bunds reduce runoff velocity, increase infiltration across watershed",
            "suitable_for_aquifer": "all",
            "cost_category": "low",
        })

    total_potential = sum(r.get("potential_recharge_mcm", 0) for r in recommendations)

    return {
        "village_id": village_id,
        "village_name": village["name"] if village else village_id,
        "aquifer_type": aquifer_type,
        "groundwater_severity": severity,
        "groundwater_trend": trend,
        "annual_rainfall_mm": annual_rainfall,
        "recommendations": sorted(recommendations, key=lambda x: {"HIGH": 0, "MEDIUM": 1, "LOW": 2}.get(x["priority"], 1)),
        "total_potential_recharge_mcm": round(total_potential, 1),
        "existing_structures": existing_counts,
        "disclaimer": "Preliminary AI recommendation. Field survey and engineering validation required.",
        "data_note": get_data_note(village_id),
    }
