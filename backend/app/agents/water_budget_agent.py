"""
Water Budget Agent
Calculates water supply vs demand balance deterministically.
"""
from app.services.data_service import (
    get_village, get_water_demand_data, get_recharge_data, get_data_note,
    safe_int, safe_float
)
from app.agents.groundwater_agent import analyze_groundwater


def calculate_water_budget(village_id: str, year: int = 2023) -> dict:
    """
    Calculate water budget: supply vs demand.
    """
    village = get_village(village_id)
    demand_data = get_water_demand_data(village_id)
    recharge_data = get_recharge_data(village_id)
    gw_result = analyze_groundwater(village_id)

    if demand_data:
        year_data = [d for d in demand_data if safe_int(d.get("year")) == year]
        if not year_data:
            year_data = sorted(demand_data, key=lambda x: safe_int(x.get("year")))[-1:]
        latest = year_data[-1]
        domestic = safe_float(latest.get("domestic_demand_mcm"), 0.0)
        agricultural = safe_float(latest.get("agricultural_demand_mcm"), 0.0)
        industrial = safe_float(latest.get("industrial_demand_mcm"), 0.0)
        total_demand = safe_float(latest.get("total_demand_mcm"), domestic + agricultural + industrial)
        available_supply = safe_float(latest.get("available_supply_mcm"), 0.0)
        deficit = safe_float(latest.get("deficit_mcm"), available_supply - total_demand)
    else:
        # Estimate from village data
        pop = safe_int(village.get("population"), 100000) if village else 100000
        ag_ha = safe_int(village.get("agricultural_area_ha"), 30000) if village else 30000
        ann_rain = safe_int(village.get("annual_rainfall_mm"), 600) if village else 600

        domestic = round(pop * 0.00003, 1)  # ~30 L/person/day -> MCM/year
        agricultural = round(ag_ha * 0.0045, 1)  # ~4500 m3/ha -> MCM
        industrial = round(domestic * 0.4, 1)
        total_demand = domestic + agricultural + industrial

        # Supply from rainfall + groundwater
        catchment_sqkm = ag_ha / 100
        rain_supply = round(catchment_sqkm * ann_rain * 0.0002, 1)
        gw_supply = round(ag_ha * 0.001, 1)
        recharge_mcm = sum(safe_float(r.get("estimated_recharge_mcm"), 0.0) for r in recharge_data)
        available_supply = round(rain_supply + gw_supply + recharge_mcm, 1)
        deficit = round(available_supply - total_demand, 1)

    # Recharge contribution
    recharge_total = sum(safe_float(r.get("estimated_recharge_mcm"), 0.0) for r in recharge_data)

    balance_status = "SURPLUS" if deficit > 5 else ("BALANCED" if deficit >= -10 else ("DEFICIT" if deficit >= -40 else "SEVERE_DEFICIT"))
    risk = "LOW" if balance_status == "SURPLUS" else ("MODERATE" if balance_status == "BALANCED" else ("HIGH" if balance_status == "DEFICIT" else "SEVERE"))

    demand_breakdown = {
        "agricultural_mcm": round(agricultural, 1),
        "agricultural_pct": round(agricultural / max(total_demand, 1) * 100, 1),
        "domestic_mcm": round(domestic, 1),
        "domestic_pct": round(domestic / max(total_demand, 1) * 100, 1),
        "industrial_mcm": round(industrial, 1),
        "industrial_pct": round(industrial / max(total_demand, 1) * 100, 1),
    }

    potential_savings = []
    if agricultural > 0:
        potential_savings.append({
            "measure": "Drip/sprinkler irrigation (40% savings)",
            "saving_mcm": round(agricultural * 0.40, 1),
        })
        potential_savings.append({
            "measure": "Drought-tolerant crop switching (25% savings)",
            "saving_mcm": round(agricultural * 0.25, 1),
        })

    return {
        "village_id": village_id,
        "village_name": village["name"] if village else village_id,
        "year": year,
        "supply": {
            "total_mcm": round(available_supply, 1),
            "rainfall_contribution_pct": 60,
            "groundwater_pct": 30,
            "recharge_mcm": round(recharge_total, 1),
        },
        "demand": {
            "total_mcm": round(total_demand, 1),
            **demand_breakdown,
        },
        "balance": {
            "deficit_mcm": round(deficit, 1),
            "status": balance_status,
            "risk": risk,
        },
        "potential_savings": potential_savings,
        "groundwater_trend": gw_result.get("trend", "UNKNOWN"),
        "data_note": get_data_note(village_id),
    }
