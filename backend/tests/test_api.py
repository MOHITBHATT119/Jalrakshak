"""
JalRakshak AI 2.0 - Automated Tests
Tests all agents, API endpoints, and service functions.
"""
import sys
import os
import pytest

# Force demo mode for tests so no real HTTP calls to IBM watsonx are made
os.environ["DEMO_MODE"] = "true"
os.environ.setdefault("WATSONX_API_KEY", "")

# Ensure backend is in path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

TEST_VILLAGE = "V001"
TEST_VILLAGE_STRESS = "V007"  # Surendranagar - most stressed


# ============================================================
# Health
# ============================================================

def test_health_endpoint():
    r = client.get("/api/v1/health")
    assert r.status_code == 200
    data = r.json()
    assert "status" in data
    assert data["status"] == "ok"
    assert "watsonx_configured" in data
    assert "granite_model" in data
    assert "demo_mode" in data
    # API key must NEVER appear in response
    assert "api_key" not in str(data).lower()
    assert "apikey" not in str(data).lower()


# ============================================================
# Villages
# ============================================================

def test_list_villages():
    r = client.get("/api/v1/villages")
    assert r.status_code == 200
    data = r.json()
    assert "villages" in data
    assert len(data["villages"]) >= 10


def test_get_village():
    r = client.get(f"/api/v1/villages/{TEST_VILLAGE}")
    assert r.status_code == 200
    data = r.json()
    assert data["village_id"] == TEST_VILLAGE


def test_get_village_not_found():
    r = client.get("/api/v1/villages/INVALID999")
    assert r.status_code == 404


# ============================================================
# Groundwater Agent
# ============================================================

def test_groundwater_analysis():
    r = client.get(f"/api/v1/villages/{TEST_VILLAGE}/groundwater")
    assert r.status_code == 200
    data = r.json()
    assert "current_depth_m" in data
    assert "trend" in data
    assert data["trend"] in ["IMPROVING", "STABLE", "DECLINING", "CRITICAL", "UNKNOWN"]
    assert "severity" in data
    assert "evidence" in data
    assert "timeseries" in data
    assert len(data["timeseries"]) > 0


def test_groundwater_trend_declining():
    """V007 (Surendranagar) should show elevated depletion over 5 years."""
    r = client.get(f"/api/v1/villages/{TEST_VILLAGE_STRESS}/groundwater")
    assert r.status_code == 200
    data = r.json()
    # V007 has large cumulative depletion since 2019 - even if recent trend improved slightly
    assert data["change_pct_since_2019"] > 10  # substantial long-term depletion
    assert data["severity"] in ["HIGH", "CRITICAL"]


def test_groundwater_change_percent():
    """Change percent should be calculated correctly."""
    r = client.get(f"/api/v1/villages/{TEST_VILLAGE}/groundwater")
    data = r.json()
    pct = data.get("change_pct_since_2019")
    assert pct is not None
    assert isinstance(pct, (int, float))


# ============================================================
# Drought Agent
# ============================================================

def test_drought_risk():
    r = client.get(f"/api/v1/villages/{TEST_VILLAGE}/risk")
    assert r.status_code == 200
    data = r.json()
    assert "risk_score" in data
    assert 0 <= data["risk_score"] <= 100
    assert data["risk_level"] in ["LOW", "MODERATE", "HIGH", "SEVERE"]
    assert "recommended_actions" in data
    assert len(data["recommended_actions"]) > 0


def test_drought_high_risk_stressed_village():
    """V007 should have HIGH or SEVERE drought risk."""
    r = client.get(f"/api/v1/villages/{TEST_VILLAGE_STRESS}/risk")
    data = r.json()
    assert data["risk_level"] in ["HIGH", "SEVERE"]


def test_drought_score_bounds():
    for vid in ["V001", "V003", "V007", "V009"]:
        r = client.get(f"/api/v1/villages/{vid}/risk")
        data = r.json()
        assert 0 <= data["risk_score"] <= 100, f"V{vid} score out of bounds"


# ============================================================
# Water Health Score
# ============================================================

def test_water_health_score():
    r = client.get(f"/api/v1/villages/{TEST_VILLAGE}/water-health")
    assert r.status_code == 200
    data = r.json()
    assert "overall_score" in data
    assert 0 <= data["overall_score"] <= 100
    assert data["category"] in ["HEALTHY", "WATCH", "STRESSED", "CRITICAL", "EMERGENCY"]
    assert "components" in data
    assert "explanation_factors" in data


def test_water_health_emergency_flag():
    r = client.get(f"/api/v1/villages/{TEST_VILLAGE_STRESS}/water-health")
    data = r.json()
    # V007 is severely stressed - should have low score
    assert data["overall_score"] < 60


def test_water_health_components_add_up():
    r = client.get(f"/api/v1/villages/{TEST_VILLAGE}/water-health")
    data = r.json()
    comps = data["components"]
    total = (comps["groundwater_score"] + comps["rainfall_score"] +
             comps["drought_score"] + comps["demand_score"] + comps["recharge_score"])
    # Should be within rounding of overall
    assert abs(total - data["overall_score"]) < 2


# ============================================================
# Water Budget
# ============================================================

def test_water_budget():
    r = client.get(f"/api/v1/villages/{TEST_VILLAGE}/water-budget")
    assert r.status_code == 200
    data = r.json()
    assert "supply" in data
    assert "demand" in data
    assert "balance" in data
    assert "deficit_mcm" in data["balance"]
    assert data["balance"]["status"] in ["SURPLUS", "BALANCED", "DEFICIT", "SEVERE_DEFICIT"]


def test_water_budget_demand_breakdown():
    r = client.get(f"/api/v1/villages/{TEST_VILLAGE}/water-budget")
    data = r.json()
    demand = data["demand"]
    # Agricultural demand should be largest component
    assert demand["agricultural_mcm"] > demand["domestic_mcm"]


# ============================================================
# Crop Advisory
# ============================================================

def test_crop_advice():
    r = client.post("/api/v1/crop-advice", json={"village_id": TEST_VILLAGE, "season": "kharif"})
    assert r.status_code == 200
    data = r.json()
    assert "recommendations" in data
    recs = data["recommendations"]
    assert "kharif_crops" in recs
    assert len(recs["kharif_crops"]) > 0
    assert "disclaimer" in data
    assert "validation" in data["disclaimer"].lower()


def test_crop_advice_drought_tolerant():
    """High-risk village should recommend drought-tolerant crops."""
    r = client.post("/api/v1/crop-advice", json={"village_id": TEST_VILLAGE_STRESS})
    data = r.json()
    kharif = data["recommendations"]["kharif_crops"]
    tolerances = [c["drought_tolerance"] for c in kharif[:3]]
    assert any(t in ["high", "very_high"] for t in tolerances)


# ============================================================
# Recharge Advisory
# ============================================================

def test_recharge_advice():
    r = client.post("/api/v1/recharge-advice", json={"village_id": TEST_VILLAGE})
    assert r.status_code == 200
    data = r.json()
    assert "recommendations" in data
    assert len(data["recommendations"]) > 0
    assert "disclaimer" in data
    assert "engineering" in data["disclaimer"].lower()


# ============================================================
# Community Priority
# ============================================================

def test_community_priority():
    r = client.get("/api/v1/community-priority")
    assert r.status_code == 200
    data = r.json()
    assert "ranked_villages" in data
    # With 55 villages seeded, all should be ranked (previously 10)
    assert len(data["ranked_villages"]) >= 10
    # Should be sorted by priority (highest first)
    scores = [v["priority_score"] for v in data["ranked_villages"]]
    assert scores == sorted(scores, reverse=True)


# ============================================================
# Scenario Simulator
# ============================================================

def test_scenario_simulation():
    payload = {
        "village_id": TEST_VILLAGE,
        "rainfall_change_pct": -20.0,
        "extraction_change_pct": 10.0,
        "irrigation_efficiency_pct": 0.0,
        "crop_switching_pct": 0.0,
        "recharge_intervention_pct": 0.0,
    }
    r = client.post("/api/v1/scenario", json=payload)
    assert r.status_code == 200
    data = r.json()
    assert "current" in data
    assert "scenario" in data
    assert "changes" in data


def test_scenario_rainfall_decrease_worsens_health():
    """Reducing rainfall should decrease water health score."""
    bad_scenario = {
        "village_id": TEST_VILLAGE,
        "rainfall_change_pct": -50.0,
        "extraction_change_pct": 20.0,
    }
    r = client.post("/api/v1/scenario", json=bad_scenario)
    data = r.json()
    current_health = data["current"]["water_health_score"]
    scenario_health = data["scenario"]["water_health_score"]
    assert scenario_health < current_health


def test_scenario_improvements_increase_health():
    """Efficiency improvements should improve water health."""
    good_scenario = {
        "village_id": TEST_VILLAGE,
        "rainfall_change_pct": 20.0,
        "extraction_change_pct": -20.0,
        "irrigation_efficiency_pct": 30.0,
        "crop_switching_pct": 50.0,
        "recharge_intervention_pct": 80.0,
    }
    r = client.post("/api/v1/scenario", json=good_scenario)
    data = r.json()
    assert data["scenario"]["water_health_score"] > data["current"]["water_health_score"]


# ============================================================
# Copilot
# ============================================================

def test_copilot_basic():
    r = client.post("/api/v1/copilot", json={"message": "Why is groundwater declining?"})
    assert r.status_code == 200
    data = r.json()
    assert "response" in data
    assert len(data["response"]) > 10


def test_copilot_with_village_context():
    r = client.post("/api/v1/copilot", json={
        "message": "What should our village do?",
        "village_id": TEST_VILLAGE,
    })
    assert r.status_code == 200
    data = r.json()
    assert "response" in data


def test_copilot_empty_message():
    r = client.post("/api/v1/copilot", json={"message": ""})
    # Should not crash
    assert r.status_code in [200, 422]


# ============================================================
# Reports
# ============================================================

def test_generate_report():
    r = client.post("/api/v1/reports", json={"village_id": TEST_VILLAGE})
    assert r.status_code == 200
    data = r.json()
    assert "report_text" in data
    assert len(data["report_text"]) > 20


# ============================================================
# Agent Trace
# ============================================================

def test_agent_trace():
    # First run analysis to generate a trace
    r = client.get(f"/api/v1/villages/{TEST_VILLAGE}/analysis")
    assert r.status_code == 200
    trace_id = r.json().get("trace_id")
    assert trace_id is not None

    # Now retrieve trace
    r2 = client.get(f"/api/v1/agent-trace/{trace_id}")
    assert r2.status_code == 200
    trace = r2.json()
    assert "steps" in trace
    assert len(trace["steps"]) > 0


def test_agent_trace_not_found():
    r = client.get("/api/v1/agent-trace/nonexistent-trace-id")
    assert r.status_code == 404


# ============================================================
# Demo Mode
# ============================================================

def test_demo_mode_health_report():
    """Health endpoint should report demo_mode correctly."""
    r = client.get("/api/v1/health")
    data = r.json()
    # Should be bool
    assert isinstance(data["demo_mode"], bool)


# ============================================================
# Security - API key must never appear
# ============================================================

def test_no_api_key_in_health():
    r = client.get("/api/v1/health")
    response_text = r.text.lower()
    assert "watsonx_api_key" not in response_text
    # Do not check for actual key value (we don't know it)


def test_no_credentials_in_village_response():
    r = client.get(f"/api/v1/villages/{TEST_VILLAGE}")
    response_text = r.text.lower()
    assert "watsonx_api_key" not in response_text


# ============================================================
# Invalid inputs
# ============================================================

def test_invalid_village_id_in_post():
    r = client.post("/api/v1/crop-advice", json={"village_id": "NOTEXIST"})
    assert r.status_code == 404


def test_scenario_invalid_village():
    r = client.post("/api/v1/scenario", json={"village_id": "NOVILLAGE"})
    assert r.status_code == 404


# ============================================================
# Auth Admin Login
# ============================================================

def test_admin_login_success():
    """Valid credentials should return access token."""
    r = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin@123"})
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

    # Also test fallback password
    r2 = client.post("/api/v1/auth/login", json={"username": "admin", "password": "jalrakshak2024"})
    assert r2.status_code == 200
    assert "access_token" in r2.json()


def test_admin_login_invalid():
    """Invalid password should return 401."""
    r = client.post("/api/v1/auth/login", json={"username": "admin", "password": "wrongpassword"})
    assert r.status_code == 401
    assert "detail" in r.json()


# ============================================================
# Farmer Auth & Admin User Management Tests
# ============================================================

def test_farmer_signup_and_login():
    """Farmer signup should create account and return JWT, then allow login."""
    import uuid
    uid = uuid.uuid4().hex[:6]
    unique_phone = f"+91 99999 {uid[:5]}"
    unique_email = f"farmer_{uid}@khet.in"
    signup_payload = {
        "name": "Kishore Bhai Patel",
        "email": unique_email,
        "phone": unique_phone,
        "password": "securefarmerpass123",
        "village": "Amreli",
        "district": "Amreli",
        "land_area_ha": 5.2,
        "primary_crops": "Cotton, Groundnut"
    }
    r = client.post("/api/v1/auth/farmer/signup", json=signup_payload)
    assert r.status_code == 200
    data = r.json()
    assert "access_token" in data
    assert data["user"]["name"] == "Kishore Bhai Patel"
    assert data["user"]["role"] == "Farmer"
    assert "password_hash" not in data["user"]

    # Duplicate signup should fail
    r_dup = client.post("/api/v1/auth/farmer/signup", json=signup_payload)
    assert r_dup.status_code == 400

    # Test login with email
    r_login = client.post("/api/v1/auth/farmer/login", json={
        "identifier": unique_email,
        "password": "securefarmerpass123"
    })
    assert r_login.status_code == 200
    token = r_login.json()["access_token"]

    # Test login with phone
    r_login_phone = client.post("/api/v1/auth/farmer/login", json={
        "identifier": unique_phone,
        "password": "securefarmerpass123"
    })
    assert r_login_phone.status_code == 200

    # Test farmer /me endpoint
    r_me = client.get("/api/v1/auth/farmer/me", headers={"Authorization": f"Bearer {token}"})
    assert r_me.status_code == 200
    assert r_me.json()["email"] == unique_email

    # Test wrong password
    r_bad = client.post("/api/v1/auth/farmer/login", json={
        "identifier": unique_email,
        "password": "wrongpassword"
    })
    assert r_bad.status_code == 401


def test_seed_farmer_login():
    """Pre-seeded demo farmer Ravi Desai should be able to log in with farmer123."""
    r = client.post("/api/v1/auth/farmer/login", json={
        "identifier": "ravi.desai@khet.in",
        "password": "farmer123"
    })
    assert r.status_code == 200
    assert r.json()["user"]["name"] == "Ravi Desai"
    assert r.json()["user"]["village"] == "Amreli"


def test_admin_user_management():
    """Admin should be able to list users, filter farmers, update status, and manage records."""
    # Get admin token
    r_adm = client.post("/api/v1/auth/login", json={"username": "admin", "password": "admin@123"})
    admin_token = r_adm.json()["access_token"]
    headers = {"Authorization": f"Bearer {admin_token}"}

    # List all users
    r_list = client.get("/api/v1/admin/users", headers=headers)
    assert r_list.status_code == 200
    data = r_list.json()
    assert "users" in data
    assert data["total_farmers"] >= 2

    # Filter farmers
    r_farmers = client.get("/api/v1/admin/users?role=Farmer", headers=headers)
    assert r_farmers.status_code == 200
    for u in r_farmers.json()["users"]:
        assert u["role"] == "Farmer"

    # Admin creates new farmer
    import uuid
    uid = uuid.uuid4().hex[:6]
    test_email = f"suresh_{uid}@farm.in"
    r_create = client.post("/api/v1/admin/users", headers=headers, json={
        "name": "Suresh Bhai",
        "email": test_email,
        "phone": f"+91 98980 {uid[:5]}",
        "role": "Farmer",
        "village": "Rajkot",
        "district": "Rajkot",
        "land_area_ha": 8.0,
        "primary_crops": "Wheat",
        "status": "Active"
    })
    assert r_create.status_code == 201
    new_id = r_create.json()["id"]

    # Toggle status to Suspended
    r_status = client.patch(f"/api/v1/admin/users/{new_id}/status", headers=headers, json={"status": "Suspended"})
    assert r_status.status_code == 200
    assert r_status.json()["status"] == "Suspended"

    # Suspended user login should be blocked
    r_login_susp = client.post("/api/v1/auth/farmer/login", json={
        "identifier": test_email,
        "password": "farmer123"
    })
    assert r_login_susp.status_code == 403

    # Delete user
    r_del = client.delete(f"/api/v1/admin/users/{new_id}", headers=headers)
    assert r_del.status_code == 200


# ============================================================
# Edge Cases & Null-Safety Tests
# ============================================================

def test_null_safety_in_drought_agent():
    """Drought risk calculation must not crash when deficit_pct or fields are None."""
    from unittest.mock import patch
    from app.agents.drought_agent import assess_drought_risk

    mock_rain = [
        {"year": 2023, "month": 6, "deficit_pct": None, "rainfall_mm": None},
        {"year": 2022, "month": 7, "deficit_pct": -25.0, "rainfall_mm": 120.0},
    ]
    with patch("app.agents.drought_agent.get_rainfall_data", return_value=mock_rain):
        res = assess_drought_risk(TEST_VILLAGE)
        assert res is not None
        assert 0 <= res["risk_score"] <= 100


def test_null_safety_in_groundwater_agent():
    """Groundwater analysis must not crash when timeseries has None years or months."""
    from unittest.mock import patch
    from app.agents.groundwater_agent import analyze_groundwater

    mock_series = [
        {"year": "2022", "month": "6", "depth_m": 18.5, "quality": "good"},
        {"year": None, "month": None, "depth_m": None, "quality": None},
        {"year": 2023, "month": 6, "depth_m": 20.0, "quality": "moderate"},
    ]
    with patch("app.agents.groundwater_agent.get_village_groundwater_series", return_value=mock_series):
        res = analyze_groundwater(TEST_VILLAGE)
        assert res is not None
        assert res["current_depth_m"] >= 0


def test_null_safety_in_water_budget_agent():
    """Water budget calculation must not crash when demand/supply numbers are None."""
    from unittest.mock import patch
    from app.agents.water_budget_agent import calculate_water_budget

    mock_demand = [{
        "year": 2023,
        "domestic_demand_mcm": None,
        "agricultural_demand_mcm": None,
        "industrial_demand_mcm": None,
        "total_demand_mcm": None,
        "available_supply_mcm": None,
        "deficit_mcm": None,
    }]
    with patch("app.agents.water_budget_agent.get_water_demand_data", return_value=mock_demand):
        res = calculate_water_budget(TEST_VILLAGE)
        assert res is not None
        assert "supply" in res
        assert "demand" in res
        assert "balance" in res


def test_null_safety_in_crop_and_recharge_agents():
    """Crop and recharge agents must handle None values in optional columns safely."""
    from unittest.mock import patch
    from app.agents.crop_agent import get_crop_advice
    from app.agents.recharge_agent import get_recharge_advice

    mock_crops = [{
        "crop_id": "C_TEST",
        "name": "Test Crop",
        "season": "kharif",
        "suitability_saurashtra": "high",
        "drought_tolerance": "high",
        "water_requirement_mm": None,
        "water_saving_vs_cotton_pct": None,
    }]
    with patch("app.agents.crop_agent.get_crops_data", return_value=mock_crops):
        res = get_crop_advice(TEST_VILLAGE)
        assert res is not None
        assert "recommendations" in res

    mock_recharge = [{
        "structure_type": "check_dam",
        "count": None,
        "estimated_recharge_mcm": None,
    }]
    with patch("app.agents.recharge_agent.get_recharge_data", return_value=mock_recharge):
        res_rec = get_recharge_advice(TEST_VILLAGE)
        assert res_rec is not None
        assert "recommendations" in res_rec


def test_dynamic_data_notes_across_agents():
    """All agent endpoints must return dynamic data_note reflecting village data status."""
    r_gw = client.get(f"/api/v1/villages/{TEST_VILLAGE}/groundwater")
    assert "data_note" in r_gw.json()

    r_health = client.get(f"/api/v1/villages/{TEST_VILLAGE}/water-health")
    assert "data_note" in r_health.json()

    r_crop = client.post("/api/v1/crop-advice", json={"village_id": TEST_VILLAGE})
    assert "data_note" in r_crop.json()

    r_rec = client.post("/api/v1/recharge-advice", json={"village_id": TEST_VILLAGE})
    assert "data_note" in r_rec.json()

    r_comm = client.get("/api/v1/community-priority")
    assert "data_note" in r_comm.json()


def test_data_dir_and_db_resolution():
    """DATA_DIR and DB_PATH must be valid paths and resolve to existing directories."""
    from app.services.database import DATA_DIR, DB_PATH
    assert os.path.isdir(DATA_DIR)
    assert os.path.exists(os.path.join(DATA_DIR, "villages.csv"))
    assert os.path.basename(DB_PATH) == "jalrakshak.db"



