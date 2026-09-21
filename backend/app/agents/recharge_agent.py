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

    # 1. Check dam recommendations (suitable across seasonal stream drainage in Saurashtra)
    if annual_rainfall >= 350:
        priority = "HIGH" if severity in ["CRITICAL", "HIGH"] else "MEDIUM"
        existing_dams = existing_counts.get("check_dam", 0)
        target_dams = max(2, ag_area_ha // 600)
        estimated_additional = max(1 if severity in ["CRITICAL", "HIGH"] else 0, target_dams - existing_dams)
        if estimated_additional > 0 or existing_dams == 0:
            count = max(1, estimated_additional)
            potential = round(count * 0.45, 2)
            recommendations.append({
                "category": "check_dam",
                "display_name": "Check Dams",
                "priority": priority,
                "estimated_count": count,
                "potential_recharge_mcm": potential,
                "existing_count": existing_dams,
                "rationale": f"Check dams on drainage streams capture monsoon runoff and recharge {potential:.1f} MCM/year into local {aquifer_type} formations",
                "suitable_for_aquifer": aquifer_type,
                "cost_category": "medium",
            })

    # 2. Farm ponds (Khet Talavadi - applicable to all farm sizes in Gujarat)
    if ag_area_ha >= 400:
        priority = "HIGH" if severity in ["CRITICAL", "HIGH"] else "MEDIUM"
        existing_ponds = existing_counts.get("farm_pond", 0)
        target_ponds = max(6, ag_area_ha // 100)
        estimated_ponds = max(2, target_ponds - existing_ponds)
        potential_ponds = round(estimated_ponds * 0.04, 2)
        recommendations.append({
            "category": "farm_pond",
            "display_name": "Farm Ponds",
            "priority": priority,
            "estimated_count": estimated_ponds,
            "potential_recharge_mcm": potential_ponds,
            "existing_count": existing_ponds,
            "rationale": "On-farm ponds harvest direct rainfall and augment local groundwater through sub-surface seepage",
            "suitable_for_aquifer": "all",
            "cost_category": "low",
        })

    # 3. Recharge wells / Injection Borewells & Shafts
    existing_wells = existing_counts.get("recharge_well", 0) + existing_counts.get("recharge_borewell", 0)
    target_wells = max(5, ag_area_ha // 120)
    estimated_wells = max(2, target_wells - existing_wells)
    priority_wells = "HIGH" if severity in ["CRITICAL", "HIGH"] else ("HIGH" if aquifer_type == "hard_rock" else "MEDIUM")
    potential_wells = round(estimated_wells * 0.02, 2)
    recommendations.append({
        "category": "recharge_well",
        "display_name": "Recharge Borewells & Shafts",
        "priority": priority_wells,
        "estimated_count": estimated_wells,
        "potential_recharge_mcm": potential_wells,
        "existing_count": existing_wells,
        "rationale": f"Direct aquifer injection wells and filtration shafts recharge permeable strata ({aquifer_type}) during high-intensity monsoons",
        "suitable_for_aquifer": aquifer_type,
        "cost_category": "low",
    })

    # 4. Percolation tanks (community percolation storage)
    if annual_rainfall >= 400 and ag_area_ha >= 800:
        existing_tanks = existing_counts.get("percolation_tank", 0)
        target_tanks = max(1, ag_area_ha // 2000)
        estimated_tanks = max(1, target_tanks - existing_tanks)
        potential_tanks = round(estimated_tanks * 0.8, 2)
        recommendations.append({
            "category": "percolation_tank",
            "display_name": "Percolation Tanks",
            "priority": "MEDIUM",
            "estimated_count": estimated_tanks,
            "potential_recharge_mcm": potential_tanks,
            "existing_count": existing_tanks,
            "rationale": "Community percolation tanks retard surface discharge and promote deep infiltration over larger catchment areas",
            "suitable_for_aquifer": "all",
            "cost_category": "medium",
        })

    # 5. Contour bunds & trenches (catchment soil & water conservation)
    if ag_area_ha >= 500:
        existing_bunds = existing_counts.get("contour_bund", 0)
        target_bunds = max(4, ag_area_ha // 350)
        estimated_bunds = max(2, target_bunds - existing_bunds)
        potential_bunds = round(estimated_bunds * 0.12, 2)
        recommendations.append({
            "category": "contour_bund",
            "display_name": "Contour Bunds & Trenches",
            "priority": "MEDIUM",
            "estimated_count": estimated_bunds,
            "potential_recharge_mcm": potential_bunds,
            "existing_count": existing_bunds,
            "rationale": "Contour trenches and earthen bunds reduce runoff velocity and maximize field-scale percolation across undulating slopes",
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
