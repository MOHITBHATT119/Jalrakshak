"""
Pydantic response models for JalRakshak AI 2.0 API.

These models document the response contract for each endpoint in /docs,
replacing generic `{}` with typed, example-filled schemas.
"""
from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any


# ─────────────────────────────────────────────────────────────────────────────
# Villages
# ─────────────────────────────────────────────────────────────────────────────

class VillageSummary(BaseModel):
    model_config = {
        "populate_by_name": True,
        "json_schema_extra": {
            "example": {
                "village_id": "RKT001",
                "name": "Kothariya",
                "district": "Rajkot",
                "taluka": "Rajkot",
                "lgd_code": "581001",
                "lat": 22.2695,
                "lon": 70.7988,
                "population": 8420,
                "agricultural_area_ha": 3200,
                "primary_crops": "Cotton;Groundnut",
                "annual_rainfall_mm": 648,
                "groundwater_depth_m": 19.2,
                "aquifer_type": "alluvial",
                "data_source": "estimated",
            }
        }
    }

    village_id:           str
    name:                 str
    district:             Optional[str] = None
    taluka:               Optional[str] = None
    lgd_code:             Optional[str] = None
    lat:                  Optional[float] = None
    lon:                  Optional[float] = None
    population:           Optional[int]  = None
    agricultural_area_ha: Optional[int]  = None
    primary_crops:        Optional[str]  = None
    annual_rainfall_mm:   Optional[int]  = None
    groundwater_depth_m:  Optional[float] = None
    aquifer_type:         Optional[str]  = None
    data_source:          Optional[str]  = None


class VillageListResponse(BaseModel):
    villages: List[VillageSummary]
    count:    int

    model_config = {"json_schema_extra": {"example": {"count": 55}}}


# ─────────────────────────────────────────────────────────────────────────────
# Groundwater
# ─────────────────────────────────────────────────────────────────────────────

class GroundwaterResponse(BaseModel):
    model_config = {"extra": "allow"}

    village_id:      str
    village_name:    Optional[str]  = None
    current_depth_m: Optional[float] = None
    trend:           Optional[str]  = None
    annual_change_m: Optional[float] = None
    risk_level:      Optional[str]  = None
    series:          Optional[List[Dict[str, Any]]] = None
    data_note:       Optional[str]  = None


# ─────────────────────────────────────────────────────────────────────────────
# Drought Risk
# ─────────────────────────────────────────────────────────────────────────────

class DroughtRiskResponse(BaseModel):
    model_config = {"extra": "allow"}

    village_id:          str
    village_name:        Optional[str]   = None
    risk_level:          Optional[str]   = None
    risk_score:          Optional[float] = None
    recommended_actions: Optional[List[str]] = None
    data_note:           Optional[str]   = None


# ─────────────────────────────────────────────────────────────────────────────
# Water Health
# ─────────────────────────────────────────────────────────────────────────────

class WaterHealthResponse(BaseModel):
    model_config = {"extra": "allow"}

    village_id:    str
    village_name:  Optional[str]   = None
    overall_score: Optional[float] = None
    category:      Optional[str]   = None
    components:    Optional[Dict[str, Any]] = None
    data_note:     Optional[str]   = None


# ─────────────────────────────────────────────────────────────────────────────
# Water Budget
# ─────────────────────────────────────────────────────────────────────────────

class WaterBudgetResponse(BaseModel):
    model_config = {"extra": "allow"}

    village_id:   str
    village_name: Optional[str] = None
    supply:       Optional[Dict[str, Any]] = None
    demand:       Optional[Dict[str, Any]] = None
    balance:      Optional[Dict[str, Any]] = None
    data_note:    Optional[str] = None


# ─────────────────────────────────────────────────────────────────────────────
# Copilot
# ─────────────────────────────────────────────────────────────────────────────

class CopilotResponse(BaseModel):
    response:             str
    model:                Optional[str]  = None
    demo_mode:            bool
    error:                Optional[str]  = None
    village_context_used: bool

    model_config = {
        "json_schema_extra": {
            "example": {
                "response": "The groundwater in Rajkot has declined by 0.8m this year...",
                "model": "ibm/granite-4-h-small",
                "demo_mode": False,
                "error": None,
                "village_context_used": True,
            }
        }
    }


# ─────────────────────────────────────────────────────────────────────────────
# Action Plan
# ─────────────────────────────────────────────────────────────────────────────

class ActionPlanResponse(BaseModel):
    village_id:  str
    action_plan: str
    model:       Optional[str] = None
    demo_mode:   bool

    model_config = {
        "json_schema_extra": {
            "example": {
                "village_id": "V001",
                "action_plan": "Priority 1: Install check dams...",
                "model": "ibm/granite-4-h-small",
                "demo_mode": False,
            }
        }
    }


# ─────────────────────────────────────────────────────────────────────────────
# Reports
# ─────────────────────────────────────────────────────────────────────────────

class ReportResponse(BaseModel):
    village_id:  str
    report_text: str
    model:       Optional[str]    = None
    demo_mode:   bool
    report_data: Optional[Dict[str, Any]] = None


# ─────────────────────────────────────────────────────────────────────────────
# Data status
# ─────────────────────────────────────────────────────────────────────────────

class TableStats(BaseModel):
    total_rows:     int
    live_rows:      int
    estimated_rows: int
    demo_rows:      int
    has_live:       bool
    has_estimated:  bool
    last_updated:   Optional[str] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "total_rows": 55, "live_rows": 0, "estimated_rows": 45,
                "demo_rows": 10, "has_live": False, "has_estimated": True,
            }
        }
    }


class DataStatusResponse(BaseModel):
    data_mode:   str
    tables:      Dict[str, TableStats]
    description: str

    model_config = {
        "json_schema_extra": {
            "example": {
                "data_mode": "demo",
                "description": "All data is synthetic demonstration data.",
            }
        }
    }


# ─────────────────────────────────────────────────────────────────────────────
# Auth
# ─────────────────────────────────────────────────────────────────────────────

class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"

    model_config = {
        "json_schema_extra": {
            "example": {
                "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
                "token_type": "bearer",
            }
        }
    }


# ─────────────────────────────────────────────────────────────────────────────
# Health
# ─────────────────────────────────────────────────────────────────────────────

class HealthResponse(BaseModel):
    status:             str
    app:                str
    watsonx_configured: bool
    granite_model:      str
    demo_mode:          bool
    data_mode:          str
    data_note:          str

    model_config = {
        "json_schema_extra": {
            "example": {
                "status": "ok",
                "app": "JalRakshak AI 2.0",
                "watsonx_configured": True,
                "granite_model": "ibm/granite-4-h-small",
                "demo_mode": False,
                "data_mode": "demo",
                "data_note": "Synthetic demonstration data.",
            }
        }
    }


# ─────────────────────────────────────────────────────────────────────────────
# Ingestion
# ─────────────────────────────────────────────────────────────────────────────

class IngestionResponse(BaseModel):
    status:          str
    rows_inserted:   int
    source:          str
    resource_id:     str
    district_filter: Optional[str]    = None
    rainfall_table:  Optional[TableStats] = None

    model_config = {
        "json_schema_extra": {
            "example": {
                "status": "ok",
                "rows_inserted": 120,
                "source": "data.gov.in",
                "resource_id": "9ef84268-d588-465a-a308-a864a43d0070",
            }
        }
    }
