"""
Intervention Impact Agent & What-If Simulator
Deterministic scenario calculations - no LLM for numbers.
"""
from app.agents.water_health_agent import calculate_water_health_score
from app.agents.drought_agent import assess_drought_risk
from app.agents.water_budget_agent import calculate_water_budget


def simulate_scenario(village_id: str, scenario: dict) -> dict:
    """
    Simulate changes to rainfall, extraction, efficiency, crop switching, recharge.
    Returns current vs scenario comparison.
    All calculations are deterministic.

    scenario keys:
        rainfall_change_pct: float (-50 to +50)
        extraction_change_pct: float (-50 to +50)
        irrigation_efficiency_pct: float (0 to 50)
        crop_switching_pct: float (0 to 100)
        recharge_intervention_pct: float (0 to 100)
    """
    # Get baseline
    baseline_health = calculate_water_health_score(village_id)
    baseline_drought = assess_drought_risk(village_id)
    baseline_budget = calculate_water_budget(village_id)

    rainfall_chg = float(scenario.get("rainfall_change_pct", 0)) / 100
    extraction_chg = float(scenario.get("extraction_change_pct", 0)) / 100
    irrigation_eff = float(scenario.get("irrigation_efficiency_pct", 0)) / 100
    crop_switch = float(scenario.get("crop_switching_pct", 0)) / 100
    recharge_int = float(scenario.get("recharge_intervention_pct", 0)) / 100

    # ---- Supply adjustments ----
    base_supply = baseline_budget["supply"]["total_mcm"]
    rainfall_supply_delta = base_supply * 0.60 * rainfall_chg  # rainfall = 60% of supply
    recharge_delta = base_supply * 0.10 * recharge_int  # recharge adds up to 10%
    scenario_supply = max(0, base_supply + rainfall_supply_delta + recharge_delta)

    # ---- Demand adjustments ----
    base_demand = baseline_budget["demand"]["total_mcm"]
    ag_demand = baseline_budget["demand"]["agricultural_mcm"]

    extraction_reduction = ag_demand * (-extraction_chg)  # extraction_chg negative = reduction
    irrigation_saving = ag_demand * irrigation_eff * 0.45  # irrigation eff up to 45% ag saving
    crop_saving = ag_demand * crop_switch * 0.35  # crop switching up to 35% ag saving

    scenario_ag_demand = max(0, ag_demand - irrigation_saving - crop_saving - extraction_reduction)
    scenario_demand = max(0, base_demand - ag_demand + scenario_ag_demand)

    scenario_balance = scenario_supply - scenario_demand

    # ---- Health score adjustments ----
    base_health = baseline_health["overall_score"]
    health_delta = 0

    if rainfall_chg > 0:
        health_delta += rainfall_chg * 15  # +15 pts for +100% rainfall
    else:
        health_delta += rainfall_chg * 20  # -20 pts for -100% rainfall

    if extraction_chg < 0:
        health_delta += abs(extraction_chg) * 10
    elif extraction_chg > 0:
        health_delta -= extraction_chg * 12

    health_delta += irrigation_eff * 8
    health_delta += crop_switch * 6
    health_delta += recharge_int * 5

    scenario_health = max(0, min(100, base_health + health_delta))

    # ---- Drought risk adjustment ----
    base_risk_score = baseline_drought["risk_score"]
    risk_delta = 0
    if rainfall_chg < 0:
        risk_delta += abs(rainfall_chg) * 30
    elif rainfall_chg > 0:
        risk_delta -= rainfall_chg * 25
    if extraction_chg > 0:
        risk_delta += extraction_chg * 15
    elif extraction_chg < 0:
        risk_delta -= abs(extraction_chg) * 10
    risk_delta -= irrigation_eff * 8
    risk_delta -= crop_switch * 5
    risk_delta -= recharge_int * 4

    scenario_risk_score = max(0, min(100, base_risk_score + risk_delta))
    scenario_risk_level = _score_to_risk(scenario_risk_score)

    from app.agents.water_health_agent import _score_to_category
    scenario_health_cat = _score_to_category(scenario_health)

    return {
        "village_id": village_id,
        "scenario_inputs": scenario,
        "current": {
            "water_health_score": baseline_health["overall_score"],
            "water_health_category": baseline_health["category"],
            "drought_risk_score": baseline_drought["risk_score"],
            "drought_risk_level": baseline_drought["risk_level"],
            "water_supply_mcm": baseline_budget["supply"]["total_mcm"],
            "water_demand_mcm": baseline_budget["demand"]["total_mcm"],
            "water_balance_mcm": baseline_budget["balance"]["deficit_mcm"],
            "balance_status": baseline_budget["balance"]["status"],
        },
        "scenario": {
            "water_health_score": round(scenario_health, 1),
            "water_health_category": scenario_health_cat,
            "drought_risk_score": round(scenario_risk_score, 1),
            "drought_risk_level": scenario_risk_level,
            "water_supply_mcm": round(scenario_supply, 1),
            "water_demand_mcm": round(scenario_demand, 1),
            "water_balance_mcm": round(scenario_balance, 1),
            "balance_status": _balance_status(scenario_balance),
        },
        "changes": {
            "health_score_change": round(scenario_health - baseline_health["overall_score"], 1),
            "drought_risk_change": round(scenario_risk_score - baseline_drought["risk_score"], 1),
            "supply_change_mcm": round(scenario_supply - baseline_budget["supply"]["total_mcm"], 1),
            "demand_change_mcm": round(scenario_demand - baseline_budget["demand"]["total_mcm"], 1),
            "balance_change_mcm": round(scenario_balance - baseline_budget["balance"]["deficit_mcm"], 1),
        },
        "data_note": "Scenario simulation using deterministic calculations. Synthetic demonstration data.",
    }


def _score_to_risk(score: float) -> str:
    if score >= 75:
        return "SEVERE"
    elif score >= 55:
        return "HIGH"
    elif score >= 35:
        return "MODERATE"
    else:
        return "LOW"


def _balance_status(balance: float) -> str:
    if balance > 5:
        return "SURPLUS"
    elif balance >= -10:
        return "BALANCED"
    elif balance >= -40:
        return "DEFICIT"
    else:
        return "SEVERE_DEFICIT"
