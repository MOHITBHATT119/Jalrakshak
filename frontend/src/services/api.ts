// API Service - All backend calls go through here
// API key is NEVER handled in the frontend - backend only
import axios from 'axios';

const API_BASE = '/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// ---- Types ----
export interface Village {
  village_id: string;
  name: string;
  district: string;
  lat: number;
  lon: number;
  population: number;
  agricultural_area_ha: number;
  primary_crops: string;
  annual_rainfall_mm: number;
  groundwater_depth_m: number;
  aquifer_type: string;
}

export interface GroundwaterResult {
  village_id: string;
  village_name: string;
  current_depth_m: number;
  historical_depth_m: number;
  annual_change_m: number;
  change_pct_since_2019: number;
  trend: string;
  severity: string;
  confidence: string;
  evidence: string[];
  timeseries: { year: number; month: number; depth_m: number; quality: string }[];
  data_note: string;
}

export interface DroughtResult {
  village_id: string;
  village_name: string;
  risk_score: number;
  risk_level: string;
  factors: string[];
  evidence: string[];
  recommended_actions: string[];
  confidence: string;
  components: { rainfall_score: number; groundwater_score: number; demand_score: number };
}

export interface WaterHealthResult {
  village_id: string;
  village_name: string;
  overall_score: number;
  category: string;
  is_emergency: boolean;
  components: {
    groundwater_score: number; groundwater_max: number;
    rainfall_score: number; rainfall_max: number;
    drought_score: number; drought_max: number;
    demand_score: number; demand_max: number;
    recharge_score: number; recharge_max: number;
  };
  explanation_factors: string[];
  drought_risk_level: string;
  groundwater_trend: string;
}

export interface WaterBudgetResult {
  village_id: string;
  village_name: string;
  year: number;
  supply: { total_mcm: number; rainfall_contribution_pct: number; groundwater_pct: number; recharge_mcm: number };
  demand: { total_mcm: number; agricultural_mcm: number; agricultural_pct: number; domestic_mcm: number; domestic_pct: number; industrial_mcm: number; industrial_pct: number };
  balance: { deficit_mcm: number; status: string; risk: string };
  potential_savings: { measure: string; saving_mcm: number }[];
}

export interface CropRecommendation {
  crop_id: string; name: string; water_requirement_mm: number;
  season: string; drought_tolerance: string; suitability: string;
  water_saving_vs_cotton_pct: number; score: number; reason: string;
}

export interface ScenarioResult {
  village_id: string;
  scenario_inputs: Record<string, number>;
  current: { water_health_score: number; water_health_category: string; drought_risk_score: number; drought_risk_level: string; water_supply_mcm: number; water_demand_mcm: number; water_balance_mcm: number; balance_status: string };
  scenario: { water_health_score: number; water_health_category: string; drought_risk_score: number; drought_risk_level: string; water_supply_mcm: number; water_demand_mcm: number; water_balance_mcm: number; balance_status: string };
  changes: { health_score_change: number; drought_risk_change: number; supply_change_mcm: number; demand_change_mcm: number; balance_change_mcm: number };
}

export interface HealthResponse {
  status: string;
  watsonx_configured: boolean;
  granite_model: string;
  demo_mode: boolean;
  data_mode: 'live' | 'demo';
  data_note: string;
}

export interface DataTableStat {
  total_rows: number;
  live_rows: number;
  demo_rows: number;
  has_live: boolean;
  last_updated: string | null;
}

export interface DataStatusResponse {
  data_mode: 'live' | 'demo';
  tables: Record<string, DataTableStat>;
  description: string;
}

// ---- API Calls ----

export const getHealth = () => api.get<HealthResponse>('/health').then(r => r.data);

export const getDataStatus = () => api.get<DataStatusResponse>('/data/status').then(r => r.data);

export const uploadDataCsv = (table: string, file: File) => {
  const form = new FormData();
  form.append('file', file);
  return api.post(`/data/upload/${table}`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }).then(r => r.data);
};

export const resetDataTable = (table: string) =>
  api.delete(`/data/reset/${table}`).then(r => r.data);

export const previewDataTable = (table: string, villageId?: string) => {
  const params = villageId ? `?village_id=${villageId}` : '';
  return api.get(`/data/preview/${table}${params}`).then(r => r.data);
};

export const getVillages = () => api.get<{ villages: Village[]; count: number }>('/villages').then(r => r.data);

export const getVillage = (id: string) => api.get<Village>(`/villages/${id}`).then(r => r.data);

export const getGroundwater = (id: string) => api.get<GroundwaterResult>(`/villages/${id}/groundwater`).then(r => r.data);

export const getDroughtRisk = (id: string) => api.get<DroughtResult>(`/villages/${id}/risk`).then(r => r.data);

export const getWaterHealth = (id: string) => api.get<WaterHealthResult>(`/villages/${id}/water-health`).then(r => r.data);

export const getWaterBudget = (id: string) => api.get<WaterBudgetResult>(`/villages/${id}/water-budget`).then(r => r.data);

export const getFullAnalysis = (id: string) => api.get(`/villages/${id}/analysis`).then(r => r.data);

export const getCommunityPriority = () => api.get('/community-priority').then(r => r.data);

export const getCropAdvice = (village_id: string, season = 'kharif') =>
  api.post('/crop-advice', { village_id, season }).then(r => r.data);

export const getRechargeAdvice = (village_id: string) =>
  api.post('/recharge-advice', { village_id }).then(r => r.data);

export const runScenario = (data: { village_id: string; [k: string]: number | string }) =>
  api.post<ScenarioResult>('/scenario', data).then(r => r.data);

export const sendCopilot = (message: string, village_id?: string, lang?: string) =>
  api.post('/copilot', { message, village_id, lang: lang || 'en' }).then(r => r.data);

export const generateReport = (village_id: string) =>
  api.post('/reports', { village_id }).then(r => r.data);

export const generateActionPlan = (village_id: string) =>
  api.post('/action-plan', { village_id }).then(r => r.data);

export const getAgentTrace = (trace_id: string) =>
  api.get(`/agent-trace/${trace_id}`).then(r => r.data);
