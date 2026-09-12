"""
Agent Orchestrator
Routes requests to appropriate specialized agents and aggregates results.
"""
import uuid
from datetime import datetime, timezone
from typing import Optional
from app.agents.groundwater_agent import analyze_groundwater
from app.agents.drought_agent import assess_drought_risk
from app.agents.water_health_agent import calculate_water_health_score
from app.agents.water_budget_agent import calculate_water_budget
from app.agents.crop_agent import get_crop_advice
from app.agents.recharge_agent import get_recharge_advice
from app.agents.community_agent import rank_communities
from app.agents.scenario_agent import simulate_scenario
from app.services import granite_service

# In-memory trace store (for demo)
_traces: dict = {}


def run_full_village_analysis(village_id: str) -> dict:
    """
    Orchestrate all agents for a complete village analysis.
    Returns aggregated results with agent trace.
    """
    trace_id = str(uuid.uuid4())[:8]
    trace_steps = []

    def run_agent(name, fn, *args, **kwargs):
        start = datetime.now(timezone.utc)
        try:
            result = fn(*args, **kwargs)
            status = "SUCCESS"
            error = None
        except Exception as e:
            result = {}
            status = "ERROR"
            error = str(e)
        elapsed = (datetime.now(timezone.utc) - start).total_seconds()
        trace_steps.append({
            "agent": name,
            "status": status,
            "elapsed_seconds": round(elapsed, 3),
            "error": error,
        })
        return result

    gw = run_agent("Groundwater Agent", analyze_groundwater, village_id)
    drought = run_agent("Drought Agent", assess_drought_risk, village_id)
    health = run_agent("Water Health Agent", calculate_water_health_score, village_id)
    budget = run_agent("Water Budget Agent", calculate_water_budget, village_id)
    crops = run_agent("Crop Advisory Agent", get_crop_advice, village_id)
    recharge = run_agent("Recharge Agent", get_recharge_advice, village_id)

    # Use Granite for explanation
    context = {
        "village": gw.get("village_name", village_id),
        "groundwater_trend": gw.get("trend", "UNKNOWN"),
        "groundwater_depth_m": gw.get("current_depth_m"),
        "groundwater_annual_change_m": gw.get("annual_change_m"),
        "drought_risk": drought.get("risk_level", "UNKNOWN"),
        "drought_score": drought.get("risk_score"),
        "water_health_score": health.get("overall_score"),
        "water_health_category": health.get("category"),
        "water_balance_mcm": budget.get("balance", {}).get("deficit_mcm"),
    }
    granite_exp = run_agent("Granite Explanation", granite_service.generate_explanation, context)
    explanation = granite_exp.get("text", "")
    demo_mode = granite_exp.get("demo_mode", True)

    trace_steps.append({
        "agent": "Agent Orchestrator",
        "status": "COMPLETE",
        "elapsed_seconds": 0,
        "error": None,
    })

    trace = {
        "trace_id": trace_id,
        "village_id": village_id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "steps": trace_steps,
        "demo_mode": demo_mode,
    }
    _traces[trace_id] = trace

    return {
        "trace_id": trace_id,
        "village_id": village_id,
        "groundwater": gw,
        "drought": drought,
        "water_health": health,
        "water_budget": budget,
        "crop_advisory": crops,
        "recharge": recharge,
        "explanation": explanation,
        "demo_mode": demo_mode,
        "agent_trace": trace,
    }


def get_trace(trace_id: str) -> Optional[dict]:
    return _traces.get(trace_id)


def run_copilot(message: str, village_id: Optional[str] = None, history: list = None, lang: str = "en") -> dict:
    """
    Route a copilot message to appropriate agents and Granite.
    """
    context = {}
    if village_id:
        try:
            health = calculate_water_health_score(village_id)
            drought = assess_drought_risk(village_id)
            gw = analyze_groundwater(village_id)
            context = {
                "village": health.get("village_name", village_id),
                "water_health_score": health.get("overall_score"),
                "water_health_category": health.get("category"),
                "drought_risk": drought.get("risk_level"),
                "groundwater_trend": gw.get("trend"),
                "groundwater_depth_m": gw.get("current_depth_m"),
            }
        except Exception:
            pass

    result = granite_service.chat(message, history=history, context=context if context else None, lang=lang)

    return {
        "response": result.get("text", ""),
        "model": result.get("model"),
        "demo_mode": result.get("demo_mode", True),
        "error": result.get("error"),
        "village_context_used": bool(context),
    }


def generate_action_plan(village_id: str) -> dict:
    """Generate a structured water action plan using Granite."""
    try:
        health = calculate_water_health_score(village_id)
        drought = assess_drought_risk(village_id)
        gw = analyze_groundwater(village_id)
        context = {
            "village": health.get("village_name", village_id),
            "water_health_score": health.get("overall_score"),
            "water_health_category": health.get("category"),
            "drought_risk": drought.get("risk_level"),
            "groundwater_trend": gw.get("trend"),
            "groundwater_annual_change_m": gw.get("annual_change_m"),
            "recommended_drought_actions": drought.get("recommended_actions", [])[:3],
        }
    except Exception:
        context = {"village": village_id}

    result = granite_service.generate_action_plan(context)
    return {
        "village_id": village_id,
        "action_plan": result.get("text", ""),
        "model": result.get("model"),
        "demo_mode": result.get("demo_mode", True),
    }


def generate_report(village_id: str) -> dict:
    """Generate a complete village water report using Granite."""
    try:
        analysis = run_full_village_analysis(village_id)
        report_data = {
            "village": analysis["groundwater"].get("village_name", village_id),
            "water_health_score": analysis["water_health"].get("overall_score"),
            "water_health_category": analysis["water_health"].get("category"),
            "groundwater_trend": analysis["groundwater"].get("trend"),
            "groundwater_depth_m": analysis["groundwater"].get("current_depth_m"),
            "drought_risk": analysis["drought"].get("risk_level"),
            "drought_risk_score": analysis["drought"].get("risk_score"),
            "water_balance_mcm": analysis["water_budget"].get("balance", {}).get("deficit_mcm"),
            "top_crops": [c["name"] for c in analysis["crop_advisory"].get("recommendations", {}).get("kharif_crops", [])[:3]],
            "recharge_priority": analysis["recharge"].get("recommendations", [{}])[0].get("category") if analysis["recharge"].get("recommendations") else "N/A",
        }
    except Exception as e:
        report_data = {"village": village_id, "error": str(e)}

    result = granite_service.generate_report(village_id, report_data)
    return {
        "village_id": village_id,
        "report_text": result.get("text", ""),
        "model": result.get("model"),
        "demo_mode": result.get("demo_mode", True),
        "report_data": report_data,
    }
