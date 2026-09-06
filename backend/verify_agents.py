import sys, os
os.chdir('d:/DARSHAK/IBM/PROJECT/jalrakshak-ai/backend')
sys.path.insert(0, '.')
from app.core.config import settings
from app.services.data_service import get_all_villages
from app.agents.groundwater_agent import analyze_groundwater
from app.agents.drought_agent import assess_drought_risk
from app.agents.water_health_agent import calculate_water_health_score
from app.agents.water_budget_agent import calculate_water_budget
from app.agents.crop_agent import get_crop_advice
from app.agents.recharge_agent import get_recharge_advice
from app.agents.community_agent import rank_communities
from app.agents.scenario_agent import simulate_scenario

villages = get_all_villages()
print(f"Villages loaded: {len(villages)}")

gw = analyze_groundwater('V001')
print(f"GW V001: depth={gw['current_depth_m']}m trend={gw['trend']} severity={gw['severity']}")

dr = assess_drought_risk('V007')
print(f"Drought V007: score={dr['risk_score']} level={dr['risk_level']}")

wh = calculate_water_health_score('V001')
print(f"Health V001: score={wh['overall_score']} cat={wh['category']}")

wb = calculate_water_budget('V001')
print(f"Budget V001: supply={wb['supply']['total_mcm']} demand={wb['demand']['total_mcm']} balance={wb['balance']['deficit_mcm']}")

crops = get_crop_advice('V001')
top = crops['recommendations']['kharif_crops'][0]
print(f"Top crop V001: {top['name']} water={top['water_requirement_mm']}mm")

recharge = get_recharge_advice('V007')
print(f"Recharge V007: {len(recharge['recommendations'])} recommendations")

comm = rank_communities()
top_v = comm['ranked_villages'][0]
print(f"Top priority village: {top_v['village_name']} score={top_v['priority_score']}")

scen = simulate_scenario('V001', {'rainfall_change_pct': -20, 'extraction_change_pct': 10})
print(f"Scenario: health {scen['current']['water_health_score']} -> {scen['scenario']['water_health_score']}")

print(f"Watsonx configured: {settings.watsonx_configured}")
print(f"Effective demo mode: {settings.effective_demo_mode}")
print(f"Model: {settings.watsonx_model_id}")
print("ALL AGENTS: PASS")
