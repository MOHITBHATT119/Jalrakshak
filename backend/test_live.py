"""
Live integration test - tests actual running backend
Run with backend active on port 8000
"""
import sys
import os
import json

sys.path.insert(0, os.path.dirname(__file__))

# Use requests for live testing
try:
    import requests
except ImportError:
    import subprocess
    subprocess.run([sys.executable, "-m", "pip", "install", "requests", "-q"])
    import requests

BASE = "http://localhost:8000/api/v1"
PASS = 0
FAIL = 0

def check(name, fn):
    global PASS, FAIL
    try:
        fn()
        print(f"  [PASS] {name}")
        PASS += 1
    except Exception as e:
        print(f"  [FAIL] {name}: {e}")
        FAIL += 1

def test_health():
    r = requests.get(f"{BASE}/health", timeout=10)
    assert r.status_code == 200
    d = r.json()
    assert d["status"] == "ok"
    assert "watsonx_configured" in d
    assert "granite_model" in d
    # Ensure no secrets
    assert "api_key" not in r.text.lower()
    assert "watsonx_api_key" not in r.text.lower()

def test_villages():
    r = requests.get(f"{BASE}/villages", timeout=10)
    assert r.status_code == 200
    assert len(r.json()["villages"]) == 10

def test_groundwater():
    r = requests.get(f"{BASE}/villages/V001/groundwater", timeout=10)
    assert r.status_code == 200
    d = r.json()
    assert d["trend"] in ["IMPROVING","STABLE","DECLINING","CRITICAL","UNKNOWN"]
    assert 0 < d["current_depth_m"] < 100

def test_drought():
    r = requests.get(f"{BASE}/villages/V007/risk", timeout=10)
    assert r.status_code == 200
    d = r.json()
    assert 0 <= d["risk_score"] <= 100
    assert d["risk_level"] in ["LOW","MODERATE","HIGH","SEVERE"]
    assert len(d["recommended_actions"]) > 0

def test_water_health():
    r = requests.get(f"{BASE}/villages/V001/water-health", timeout=10)
    assert r.status_code == 200
    d = r.json()
    assert 0 <= d["overall_score"] <= 100
    assert d["category"] in ["HEALTHY","WATCH","STRESSED","CRITICAL","EMERGENCY"]

def test_water_budget():
    r = requests.get(f"{BASE}/villages/V001/water-budget", timeout=10)
    assert r.status_code == 200
    d = r.json()
    assert d["supply"]["total_mcm"] > 0
    assert d["demand"]["total_mcm"] > 0

def test_crop_advice():
    r = requests.post(f"{BASE}/crop-advice", json={"village_id": "V001", "season": "kharif"}, timeout=10)
    assert r.status_code == 200
    d = r.json()
    assert len(d["recommendations"]["kharif_crops"]) > 0

def test_recharge():
    r = requests.post(f"{BASE}/recharge-advice", json={"village_id": "V001"}, timeout=10)
    assert r.status_code == 200
    assert len(r.json()["recommendations"]) > 0

def test_scenario():
    r = requests.post(f"{BASE}/scenario", json={
        "village_id": "V001",
        "rainfall_change_pct": -20,
        "extraction_change_pct": 10,
    }, timeout=10)
    assert r.status_code == 200
    d = r.json()
    assert "current" in d and "scenario" in d
    assert d["scenario"]["water_health_score"] < d["current"]["water_health_score"]

def test_community_priority():
    r = requests.get(f"{BASE}/community-priority", timeout=15)
    assert r.status_code == 200
    d = r.json()
    assert len(d["ranked_villages"]) == 10

def test_copilot():
    r = requests.post(f"{BASE}/copilot", json={"message": "Why is groundwater declining?"}, timeout=60)
    assert r.status_code == 200
    assert len(r.json()["response"]) > 10

def test_full_analysis():
    r = requests.get(f"{BASE}/villages/V001/analysis", timeout=90)
    assert r.status_code == 200
    d = r.json()
    assert "groundwater" in d
    assert "drought" in d
    assert "water_health" in d
    assert "trace_id" in d

if __name__ == "__main__":
    print("=" * 55)
    print("JalRakshak AI 2.0 - Live Integration Tests")
    print("=" * 55)

    check("Health endpoint", test_health)
    check("Villages list", test_villages)
    check("Groundwater analysis V001", test_groundwater)
    check("Drought risk V007 (HIGH/SEVERE expected)", test_drought)
    check("Water Health Score V001", test_water_health)
    check("Water Budget V001", test_water_budget)
    check("Crop Advice V001", test_crop_advice)
    check("Recharge Advice V001", test_recharge)
    check("Scenario Simulation (rainfall -20%)", test_scenario)
    check("Community Priority ranking", test_community_priority)
    check("Full Analysis + Agent Trace", test_full_analysis)
    check("Water Copilot (IBM Granite)", test_copilot)

    print()
    print("=" * 55)
    print(f"Results: {PASS} PASSED  {FAIL} FAILED")
    if FAIL == 0:
        print("ALL LIVE TESTS PASSED")
    else:
        print(f"ATTENTION: {FAIL} test(s) failed")
    print("=" * 55)
