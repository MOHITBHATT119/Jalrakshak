"""API Routes for JalRakshak AI 2.0"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.core.config import settings
from app.services.data_service import (
    get_all_villages, get_village,
    get_village_groundwater_series, get_rainfall_data
)
from app.agents.groundwater_agent import analyze_groundwater
from app.agents.drought_agent import assess_drought_risk
from app.agents.water_health_agent import calculate_water_health_score
from app.agents.water_budget_agent import calculate_water_budget
from app.agents.crop_agent import get_crop_advice
from app.agents.recharge_agent import get_recharge_advice
from app.agents.community_agent import rank_communities
from app.agents.scenario_agent import simulate_scenario
from app.agents.orchestrator import (
    run_full_village_analysis, get_trace,
    run_copilot, generate_action_plan, generate_report
)

router = APIRouter()


# ---- Pydantic models ----

class CropAdviceRequest(BaseModel):
    village_id: str
    season: str = "kharif"


class RechargeAdviceRequest(BaseModel):
    village_id: str


class ScenarioRequest(BaseModel):
    village_id: str
    rainfall_change_pct: float = 0.0
    extraction_change_pct: float = 0.0
    irrigation_efficiency_pct: float = 0.0
    crop_switching_pct: float = 0.0
    recharge_intervention_pct: float = 0.0


class CopilotRequest(BaseModel):
    message: str
    village_id: Optional[str] = None
    history: Optional[List[dict]] = None
    lang: Optional[str] = "en"


class ReportRequest(BaseModel):
    village_id: str


# ---- Health ----

@router.get("/health")
async def health():
    from app.services.database import get_table_stats
    stats = get_table_stats()
    any_live = any(s["has_live"] for s in stats.values())
    return {
        "status": "ok",
        "app": "JalRakshak AI 2.0",
        "watsonx_configured": settings.watsonx_configured,
        "granite_model": settings.watsonx_model_id,
        "demo_mode": settings.effective_demo_mode,
        "data_mode": "live" if any_live else "demo",
        "data_note": (
            "Live data active — real measurements loaded by administrator."
            if any_live else
            "Synthetic demonstration data. Not official government measurements."
        ),
    }


# ---- Villages ----

@router.get("/villages")
async def list_villages():
    villages = get_all_villages()
    return {"villages": villages, "count": len(villages)}


@router.get("/villages/{village_id}")
async def get_village_detail(village_id: str):
    v = get_village(village_id)
    if not v:
        raise HTTPException(status_code=404, detail=f"Village {village_id} not found")
    return v


@router.get("/villages/{village_id}/groundwater")
async def get_groundwater(village_id: str):
    v = get_village(village_id)
    if not v:
        raise HTTPException(status_code=404, detail=f"Village {village_id} not found")
    return analyze_groundwater(village_id)


@router.get("/villages/{village_id}/rainfall")
async def get_rainfall(village_id: str):
    data = get_rainfall_data(village_id)
    return {"village_id": village_id, "rainfall": data, "count": len(data)}


@router.get("/villages/{village_id}/risk")
async def get_drought_risk(village_id: str):
    v = get_village(village_id)
    if not v:
        raise HTTPException(status_code=404, detail=f"Village {village_id} not found")
    return assess_drought_risk(village_id)


@router.get("/villages/{village_id}/water-health")
async def get_water_health(village_id: str):
    v = get_village(village_id)
    if not v:
        raise HTTPException(status_code=404, detail=f"Village {village_id} not found")
    return calculate_water_health_score(village_id)


@router.get("/villages/{village_id}/water-budget")
async def get_water_budget(village_id: str):
    v = get_village(village_id)
    if not v:
        raise HTTPException(status_code=404, detail=f"Village {village_id} not found")
    return calculate_water_budget(village_id)


@router.get("/villages/{village_id}/analysis")
async def get_full_analysis(village_id: str):
    v = get_village(village_id)
    if not v:
        raise HTTPException(status_code=404, detail=f"Village {village_id} not found")
    return run_full_village_analysis(village_id)


# ---- Community Priority ----

@router.get("/community-priority")
async def get_community_priority():
    return rank_communities()


# ---- Crop Advisory ----

@router.post("/crop-advice")
async def post_crop_advice(req: CropAdviceRequest):
    v = get_village(req.village_id)
    if not v:
        raise HTTPException(status_code=404, detail=f"Village {req.village_id} not found")
    return get_crop_advice(req.village_id, req.season)


# ---- Recharge Advisory ----

@router.post("/recharge-advice")
async def post_recharge_advice(req: RechargeAdviceRequest):
    v = get_village(req.village_id)
    if not v:
        raise HTTPException(status_code=404, detail=f"Village {req.village_id} not found")
    return get_recharge_advice(req.village_id)


# ---- Scenario Simulator ----

@router.post("/scenario")
async def post_scenario(req: ScenarioRequest):
    v = get_village(req.village_id)
    if not v:
        raise HTTPException(status_code=404, detail=f"Village {req.village_id} not found")
    scenario_inputs = {
        "rainfall_change_pct": req.rainfall_change_pct,
        "extraction_change_pct": req.extraction_change_pct,
        "irrigation_efficiency_pct": req.irrigation_efficiency_pct,
        "crop_switching_pct": req.crop_switching_pct,
        "recharge_intervention_pct": req.recharge_intervention_pct,
    }
    result = simulate_scenario(req.village_id, scenario_inputs)
    return result


# ---- Water Copilot ----

@router.post("/copilot")
async def post_copilot(req: CopilotRequest):
    return run_copilot(req.message, req.village_id, req.history, req.lang or "en")


# ---- Action Plan ----

@router.post("/action-plan")
async def post_action_plan(req: ReportRequest):
    return generate_action_plan(req.village_id)


# ---- Reports ----

@router.post("/reports")
async def post_report(req: ReportRequest):
    v = get_village(req.village_id)
    if not v:
        raise HTTPException(status_code=404, detail=f"Village {req.village_id} not found")
    return generate_report(req.village_id)


# ---- Agent Trace ----

@router.get("/agent-trace/{trace_id}")
async def get_agent_trace(trace_id: str):
    trace = get_trace(trace_id)
    if not trace:
        raise HTTPException(status_code=404, detail=f"Trace {trace_id} not found")
    return trace
