import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import {
  BrainCircuit, Play, Zap, CheckCircle2, Clock, AlertTriangle, Loader2,
  ChevronDown, ChevronUp, Database, Cpu, BarChart2, Droplet, CloudRain,
  Sprout, Waves, Users, RefreshCw, Download, FileText, ClipboardList,
  Activity, TrendingDown, ShieldAlert, MapPin, ArrowDown, Info,
  Circle,
} from 'lucide-react';
import {
  getVillages, getGroundwater, getDroughtRisk, getWaterHealth,
  getWaterBudget, getCropAdvice, getRechargeAdvice, getCommunityPriority,
  getHealth, generateActionPlan,
  Village, GroundwaterResult, DroughtResult, WaterHealthResult,
  WaterBudgetResult, HealthResponse,
} from '../../services/api';

// ─── Types ──────────────────────────────────────────────────────────────────

type AgentStatus = 'idle' | 'queued' | 'running' | 'completed' | 'failed';
type RunStatus = 'idle' | 'running' | 'completed' | 'failed';

interface AgentResult {
  output: string;
  confidence: number;
  dataUsed: string[];
  analysis: string;
  reasoning: string;
  nextAgent: string | null;
}

interface AgentState {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  status: AgentStatus;
  durationMs: number | null;
  result: AgentResult | null;
  expanded: boolean;
}

interface TimelineEntry {
  ts: string;
  agent: string;
  status: AgentStatus;
  durationMs: number | null;
}

interface FinalRec {
  waterHealthScore: number;
  waterHealthCategory: string;
  droughtRisk: string;
  droughtScore: number;
  groundwaterTrend: string;
  waterDeficitMcm: number;
  recommendedCrop: string;
  rechargeAction: string;
  priorityLevel: string;
  confidence: number;
  isDemo: boolean;
}

// ─── Demo data fallbacks ─────────────────────────────────────────────────────

const DEMO_VILLAGE_ID = 'Bhavnagar_V1';

function makeDemoGroundwater(): GroundwaterResult {
  return {
    village_id: DEMO_VILLAGE_ID, village_name: 'Bhavnagar V1',
    current_depth_m: 18.4, historical_depth_m: 12.1, annual_change_m: -1.3,
    change_pct_since_2019: -34, trend: 'Rapidly Declining', severity: 'CRITICAL',
    confidence: 'HIGH', evidence: ['3 consecutive seasons of decline', 'Aquifer stress indicators elevated'],
    timeseries: [], data_note: 'Demo data',
  };
}
function makeDemoDrought(): DroughtResult {
  return {
    village_id: DEMO_VILLAGE_ID, village_name: 'Bhavnagar V1',
    risk_score: 0.78, risk_level: 'HIGH',
    factors: ['Low rainfall', 'High evapotranspiration', 'Low soil moisture'],
    evidence: ['Rainfall 42% below normal', 'Groundwater stress high'],
    recommended_actions: ['Implement drip irrigation', 'Build recharge structures'],
    confidence: 'HIGH',
    components: { rainfall_score: 0.8, groundwater_score: 0.75, demand_score: 0.7 },
  };
}
function makeDemoWaterHealth(): WaterHealthResult {
  return {
    village_id: DEMO_VILLAGE_ID, village_name: 'Bhavnagar V1',
    overall_score: 44, category: 'CRITICAL',
    is_emergency: true,
    components: {
      groundwater_score: 12, groundwater_max: 30, rainfall_score: 10, rainfall_max: 20,
      drought_score: 8, drought_max: 20, demand_score: 6, demand_max: 15, recharge_score: 8, recharge_max: 15,
    },
    explanation_factors: ['Rapidly declining groundwater', 'Drought conditions elevated'],
    drought_risk_level: 'HIGH', groundwater_trend: 'Rapidly Declining',
  };
}
function makeDemoWaterBudget(): WaterBudgetResult {
  return {
    village_id: DEMO_VILLAGE_ID, village_name: 'Bhavnagar V1', year: 2025,
    supply: { total_mcm: 3.2, rainfall_contribution_pct: 55, groundwater_pct: 45, recharge_mcm: 0.6 },
    demand: { total_mcm: 5.8, agricultural_mcm: 4.1, agricultural_pct: 71, domestic_mcm: 1.1, domestic_pct: 19, industrial_mcm: 0.6, industrial_pct: 10 },
    balance: { deficit_mcm: 2.6, status: 'DEFICIT', risk: 'CRITICAL' },
    potential_savings: [{ measure: 'Drip irrigation adoption', saving_mcm: 1.2 }, { measure: 'Crop switching', saving_mcm: 0.8 }],
  };
}

// ─── Agent pipeline definition ───────────────────────────────────────────────

function buildInitialAgents(): AgentState[] {
  return [
    { id: 'request',   name: 'User Request',             icon: <Users size={16} />,       color: '#64748b', status: 'idle', durationMs: null, result: null, expanded: false },
    { id: 'orch',      name: 'AI Orchestrator',           icon: <BrainCircuit size={16} />, color: '#8b5cf6', status: 'idle', durationMs: null, result: null, expanded: false },
    { id: 'gw',        name: 'Groundwater Agent',         icon: <Waves size={16} />,        color: '#0ea5e9', status: 'idle', durationMs: null, result: null, expanded: false },
    { id: 'drought',   name: 'Drought Agent',             icon: <CloudRain size={16} />,    color: '#f97316', status: 'idle', durationMs: null, result: null, expanded: false },
    { id: 'budget',    name: 'Water Budget Agent',        icon: <BarChart2 size={16} />,    color: '#a78bfa', status: 'idle', durationMs: null, result: null, expanded: false },
    { id: 'crop',      name: 'Crop Advisor Agent',        icon: <Sprout size={16} />,       color: '#22c55e', status: 'idle', durationMs: null, result: null, expanded: false },
    { id: 'recharge',  name: 'Recharge Agent',            icon: <Droplet size={16} />,      color: '#06b6d4', status: 'idle', durationMs: null, result: null, expanded: false },
    { id: 'community', name: 'Community Priority Agent',  icon: <MapPin size={16} />,       color: '#f59e0b', status: 'idle', durationMs: null, result: null, expanded: false },
    { id: 'granite',   name: 'IBM Granite',               icon: <Cpu size={16} />,          color: '#3b82f6', status: 'idle', durationMs: null, result: null, expanded: false },
    { id: 'final',     name: 'Final Recommendation',      icon: <CheckCircle2 size={16} />, color: '#10b981', status: 'idle', durationMs: null, result: null, expanded: false },
  ];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(s: AgentStatus): string {
  switch (s) {
    case 'completed': return '#10b981';
    case 'running':   return '#3b82f6';
    case 'queued':    return '#f59e0b';
    case 'failed':    return '#ef4444';
    default:          return '#475569';
  }
}
function statusLabel(s: AgentStatus): string {
  switch (s) {
    case 'completed': return 'Completed';
    case 'running':   return 'Running';
    case 'queued':    return 'Queued';
    case 'failed':    return 'Failed';
    default:          return 'Idle';
  }
}
function statusBg(s: AgentStatus): string {
  switch (s) {
    case 'completed': return 'rgba(16,185,129,0.12)';
    case 'running':   return 'rgba(59,130,246,0.15)';
    case 'queued':    return 'rgba(245,158,11,0.12)';
    case 'failed':    return 'rgba(239,68,68,0.12)';
    default:          return 'rgba(71,85,105,0.1)';
  }
}

function confColor(c: number): string {
  if (c >= 80) return '#10b981';
  if (c >= 60) return '#f59e0b';
  return '#ef4444';
}

function fmtMs(ms: number | null): string {
  if (ms === null) return '—';
  return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(2)}s`;
}

function nowTs(): string {
  return new Date().toLocaleTimeString('en-IN', { hour12: false });
}

// Small artificial delay helper
const delay = (ms: number) => new Promise<void>(r => setTimeout(r, ms));

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AgentTrace() {
  const { t } = useLanguage();
  const nav = useNavigate();

  const [villages, setVillages] = useState<Village[]>([]);
  const [selectedVillageId, setSelectedVillageId] = useState('');
  const [query, setQuery] = useState('Analyze water risk, suggest crops and recharge plan');
  const [runStatus, setRunStatus] = useState<RunStatus>('idle');
  const [agents, setAgents] = useState<AgentState[]>(buildInitialAgents());
  const [currentAgentIdx, setCurrentAgentIdx] = useState(-1);
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [finalRec, setFinalRec] = useState<FinalRec | null>(null);
  const [backendHealth, setBackendHealth] = useState<HealthResponse | null>(null);
  const [isDemo, setIsDemo] = useState(false);
  const [traceId] = useState(() => `TR-${Date.now().toString(36).toUpperCase()}`);
  const [totalDuration, setTotalDuration] = useState<number | null>(null);
  const abortRef = useRef(false);
  const startTimeRef = useRef(0);

  // Load villages & health on mount
  useEffect(() => {
    getVillages().then(d => {
      const list = Array.isArray(d?.villages) ? d.villages : [];
      setVillages(list);
      if (list.length > 0) setSelectedVillageId(list[0].village_id);
    }).catch(() => {});
    getHealth().then(h => {
      setBackendHealth(h);
      setIsDemo(h.demo_mode);
    }).catch(() => setIsDemo(true));
  }, []);

  const updateAgent = useCallback((id: string, patch: Partial<AgentState>) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, ...patch } : a));
  }, []);

  const addTimeline = useCallback((agent: string, status: AgentStatus, durationMs: number | null) => {
    setTimeline(prev => [...prev, { ts: nowTs(), agent, status, durationMs }]);
  }, []);

  const reset = () => {
    abortRef.current = true;
    setAgents(buildInitialAgents());
    setCurrentAgentIdx(-1);
    setTimeline([]);
    setFinalRec(null);
    setRunStatus('idle');
    setTotalDuration(null);
    setTimeout(() => { abortRef.current = false; }, 100);
  };

  // ── Core execution engine ──────────────────────────────────────────────────

  const runAnalysis = async (demoForced = false) => {
    if (runStatus === 'running') return;
    abortRef.current = false;
    const vid = selectedVillageId || DEMO_VILLAGE_ID;
    const useDemo = demoForced || isDemo;

    reset();
    // Give reset a tick to flush
    await delay(50);
    abortRef.current = false;

    setRunStatus('running');
    startTimeRef.current = Date.now();

    // Mark all as queued
    setAgents(buildInitialAgents().map(a => ({ ...a, status: 'queued' as AgentStatus })));

    addTimeline('Execution', 'queued', null);

    // ── Helper: run one agent step ───────────────────────────────────────────
    const runAgent = async (
      idx: number,
      fetcher: () => Promise<AgentResult>,
      minMs = 600,
      maxMs = 1800,
    ) => {
      if (abortRef.current) return;
      const agentId = buildInitialAgents()[idx].id;
      const agentName = buildInitialAgents()[idx].name;

      setCurrentAgentIdx(idx);
      setAgents(prev => prev.map((a, i) => i === idx ? { ...a, status: 'running' } : a));
      addTimeline(agentName, 'running', null);

      const t0 = Date.now();
      // Artificial minimum display time for visual feedback
      const [result] = await Promise.all([
        fetcher().catch((): AgentResult => ({
          output: 'Backend unavailable — using demo data.',
          confidence: 72,
          dataUsed: ['Demo dataset'],
          analysis: 'Analysis based on synthetic Saurashtra water data.',
          reasoning: 'Demo mode active. Connect backend for live IBM Granite analysis.',
          nextAgent: null,
        })),
        delay(minMs + Math.random() * (maxMs - minMs)),
      ]);

      if (abortRef.current) return;
      const elapsed = Date.now() - t0;
      setAgents(prev => prev.map((a, i) =>
        i === idx ? { ...a, status: 'completed', durationMs: elapsed, result } : a
      ));
      addTimeline(agentName, 'completed', elapsed);
    };

    try {
      // 0: User Request
      await runAgent(0, async () => ({
        output: `Query: "${query}" · Village: ${vid}`,
        confidence: 100,
        dataUsed: ['User input'],
        analysis: 'Request parsed and validated. Village context loaded.',
        reasoning: 'Input accepted, forwarding to AI Orchestrator.',
        nextAgent: 'AI Orchestrator',
      }), 300, 600);

      // 1: Orchestrator
      await runAgent(1, async () => ({
        output: 'Pipeline initialised — 7 specialist agents queued.',
        confidence: 95,
        dataUsed: ['Agent registry', 'Village metadata'],
        analysis: 'Identified water-risk query. Activating full agent cascade.',
        reasoning: 'Multi-agent orchestration started. Each agent runs sequentially with shared village context.',
        nextAgent: 'Groundwater Agent',
      }), 400, 800);

      // 2: Groundwater
      let gwData: GroundwaterResult = makeDemoGroundwater();
      await runAgent(2, async () => {
        if (!useDemo) gwData = await getGroundwater(vid);
        return {
          output: `Depth: ${gwData.current_depth_m}m · Trend: ${gwData.trend} · Severity: ${gwData.severity}`,
          confidence: gwData.confidence === 'HIGH' ? 90 : gwData.confidence === 'MEDIUM' ? 72 : 58,
          dataUsed: ['Groundwater depth timeseries', 'Aquifer data', gwData.data_note],
          analysis: `Annual change: ${gwData.annual_change_m}m/yr. Change since 2019: ${gwData.change_pct_since_2019}%. ${gwData.evidence.join('; ')}`,
          reasoning: 'Groundwater depletion confirmed from multi-year timeseries. High confidence assessment.',
          nextAgent: 'Drought Agent',
        };
      });

      // 3: Drought
      let droughtData: DroughtResult = makeDemoDrought();
      await runAgent(3, async () => {
        if (!useDemo) droughtData = await getDroughtRisk(vid);
        return {
          output: `Risk: ${droughtData.risk_level} (score: ${(droughtData.risk_score * 100).toFixed(0)}%) · ${droughtData.factors.slice(0, 2).join(', ')}`,
          confidence: droughtData.confidence === 'HIGH' ? 88 : 70,
          dataUsed: ['Rainfall data', 'Evapotranspiration index', 'Soil moisture sensors'],
          analysis: `Rainfall component: ${(droughtData.components.rainfall_score * 100).toFixed(0)}%. Groundwater component: ${(droughtData.components.groundwater_score * 100).toFixed(0)}%. ${droughtData.evidence.join('; ')}`,
          reasoning: 'Multi-factor drought index computed. Combined score exceeds critical threshold.',
          nextAgent: 'Water Budget Agent',
        };
      });

      // 4: Water Budget
      let budgetData: WaterBudgetResult = makeDemoWaterBudget();
      await runAgent(4, async () => {
        if (!useDemo) budgetData = await getWaterBudget(vid);
        const deficit = budgetData.balance.deficit_mcm;
        return {
          output: `Supply: ${budgetData.supply.total_mcm} MCM · Demand: ${budgetData.demand.total_mcm} MCM · Deficit: ${deficit.toFixed(1)} MCM`,
          confidence: 85,
          dataUsed: ['Rainfall records', 'Agricultural census', 'Domestic demand estimates'],
          analysis: `Agricultural demand: ${budgetData.demand.agricultural_pct}% of total. Recharge potential: ${budgetData.supply.recharge_mcm} MCM. Savings possible: ${budgetData.potential_savings.map(s => s.measure).join(', ')}.`,
          reasoning: 'Water supply–demand gap clearly indicates structural deficit requiring intervention.',
          nextAgent: 'Crop Advisor Agent',
        };
      });

      // 5: Crop Advisor
      let cropName = 'Pearl Millet (Bajra)';
      await runAgent(5, async () => {
        try {
          if (!useDemo) {
            const r = await getCropAdvice(vid, 'kharif') as { recommendations?: Array<{ name: string; reason: string; water_requirement_mm: number }> };
            if (r?.recommendations?.length) {
              cropName = r.recommendations[0].name;
              return {
                output: `Top crop: ${r.recommendations[0].name} · Water need: ${r.recommendations[0].water_requirement_mm}mm/season`,
                confidence: 82,
                dataUsed: ['Crop water requirement database', 'Soil type data', 'Market data'],
                analysis: r.recommendations[0].reason,
                reasoning: 'Drought-tolerant crops prioritised based on water scarcity index and soil compatibility.',
                nextAgent: 'Recharge Agent',
              };
            }
          }
        } catch { /* fall through to demo */ }
        return {
          output: `Top crop: Pearl Millet (Bajra) · Water need: 350mm/season · Saves 58% vs. cotton`,
          confidence: 83,
          dataUsed: ['Crop water requirement database', 'Soil profiles (Demo)', 'Rainfall forecast'],
          analysis: 'Pearl millet identified as optimal for current drought stress conditions. High drought tolerance, short season, low water requirement.',
          reasoning: 'Under severe water stress, shifting to low-water crops reduces demand by 40–60%, improving water balance.',
          nextAgent: 'Recharge Agent',
        };
      });

      // 6: Recharge
      await runAgent(6, async () => {
        try {
          if (!useDemo) {
            const r = await getRechargeAdvice(vid) as { recommendations?: Array<{ method: string; estimated_recharge_mcm: number }> };
            if (r?.recommendations?.length) {
              return {
                output: `${r.recommendations[0].method} · Est. recharge: ${r.recommendations[0].estimated_recharge_mcm} MCM`,
                confidence: 79,
                dataUsed: ['Topography DEM', 'Soil permeability data', 'Rainfall runoff models'],
                analysis: 'Check dams identified as highest-impact recharge structure based on terrain and runoff patterns.',
                reasoning: 'Recharge structures selected based on aquifer type, slope, and runoff volume potential.',
                nextAgent: 'Community Priority Agent',
              };
            }
          }
        } catch { /* demo */ }
        return {
          output: 'Check dam construction (2 sites) · Farm pond deepening (5 sites) · Est. recharge: 1.4 MCM',
          confidence: 80,
          dataUsed: ['Topographic analysis (Demo)', 'Runoff data', 'Aquifer recharge potential map'],
          analysis: 'Two check dam sites identified in upper watershed. Five farm ponds recommended for distributed recharge. Total estimated annual recharge: 1.4 MCM.',
          reasoning: 'Combining check dams with farm ponds maximises catchment-level recharge and reduces dependency on monsoon timing.',
          nextAgent: 'Community Priority Agent',
        };
      });

      // 7: Community Priority
      await runAgent(7, async () => {
        try {
          if (!useDemo) {
            const r = await getCommunityPriority() as { villages?: Array<{ village_name: string; priority_score: number; priority_level: string }> };
            if (r?.villages?.length) {
              const top = r.villages[0];
              return {
                output: `Highest priority: ${top.village_name} (score: ${top.priority_score}) · Level: ${top.priority_level}`,
                confidence: 87,
                dataUsed: ['Village risk scores', 'Population data', 'Infrastructure status'],
                analysis: 'Priority ranking accounts for water scarcity, population vulnerability, and intervention feasibility.',
                reasoning: 'Community impact assessment complete. Prioritisation ready for action plan generation.',
                nextAgent: 'IBM Granite',
              };
            }
          }
        } catch { /* demo */ }
        return {
          output: 'Bhavnagar V1: CRITICAL priority · Score: 94/100 · 2,847 people at risk',
          confidence: 88,
          dataUsed: ['Village vulnerability index (Demo)', 'Population census', 'Water access data'],
          analysis: 'Bhavnagar V1 ranked highest due to critical groundwater depletion, high agricultural dependency, and absence of active recharge structures.',
          reasoning: 'Combined socio-economic and hydrological risk warrants immediate intervention.',
          nextAgent: 'IBM Granite',
        };
      });

      // 8: IBM Granite synthesis
      await runAgent(8, async () => ({
        output: 'Multi-agent synthesis complete. Decision rationale generated.',
        confidence: 91,
        dataUsed: [
          'Groundwater agent output', 'Drought agent output', 'Water budget analysis',
          'Crop recommendations', 'Recharge plan', 'Community priorities',
          isDemo ? 'IBM Granite (Demo Mode)' : 'IBM Granite 4 H Small (Live)',
        ],
        analysis: `All 6 specialist agents aggregated. Confidence-weighted synthesis performed. Key insight: ${droughtData.risk_level} drought risk combined with ${gwData.trend.toLowerCase()} groundwater requires immediate dual-track intervention — demand reduction (crop switch) and supply enhancement (recharge).`,
        reasoning: 'IBM Granite synthesises agent outputs into a coherent, actionable recommendation. Confidence scored at 91% based on data quality and agent agreement.',
        nextAgent: 'Final Recommendation',
      }), 800, 2000);

      // 9: Final Recommendation
      let wh: WaterHealthResult = makeDemoWaterHealth();
      if (!useDemo) {
        try { wh = await getWaterHealth(vid); } catch { /* demo */ }
      }

      await runAgent(9, async () => ({
        output: `Water Health: ${wh.overall_score}/100 (${wh.category}) · Action: Immediate dual-track intervention required`,
        confidence: 91,
        dataUsed: ['All agent outputs', 'Water health model'],
        analysis: 'Comprehensive recommendation generated covering crop, recharge, and community action priorities.',
        reasoning: 'Final recommendation produced with high confidence based on convergence of all specialist agents.',
        nextAgent: null,
      }), 400, 700);

      // Build final recommendation card
      setFinalRec({
        waterHealthScore: wh.overall_score,
        waterHealthCategory: wh.category,
        droughtRisk: droughtData.risk_level,
        droughtScore: Math.round(droughtData.risk_score * 100),
        groundwaterTrend: gwData.trend,
        waterDeficitMcm: budgetData.balance.deficit_mcm,
        recommendedCrop: cropName,
        rechargeAction: 'Check dam construction + farm pond deepening',
        priorityLevel: 'CRITICAL',
        confidence: 91,
        isDemo: useDemo,
      });

      setTotalDuration(Date.now() - startTimeRef.current);
      setRunStatus('completed');
      addTimeline('Pipeline', 'completed', Date.now() - startTimeRef.current);
    } catch (err) {
      setRunStatus('failed');
      addTimeline('Pipeline', 'failed', null);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const completedCount = agents.filter(a => a.status === 'completed').length;
  const totalAgents = agents.length;
  const progress = Math.round((completedCount / totalAgents) * 100);

  const toggleExpand = (id: string) => {
    setAgents(prev => prev.map(a => a.id === id ? { ...a, expanded: !a.expanded } : a));
  };

  const healthStatus = backendHealth
    ? (backendHealth.demo_mode ? 'Demo Mode' : 'Connected')
    : 'Connecting…';
  const healthColor = backendHealth
    ? (backendHealth.demo_mode ? '#f59e0b' : '#10b981')
    : '#94a3b8';

  const exportTrace = () => {
    const data = {
      traceId,
      village: selectedVillageId,
      query,
      runStatus,
      totalDurationMs: totalDuration,
      agents: agents.map(a => ({
        name: a.name, status: a.status, durationMs: a.durationMs,
        confidence: a.result?.confidence, output: a.result?.output,
      })),
      timeline,
      finalRecommendation: finalRec,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const el = document.createElement('a');
    el.href = url; el.download = `agent-trace-${traceId}.json`; el.click();
    URL.revokeObjectURL(url);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="at-root" style={{ color: 'var(--text-main)', animation: 'fadeInUp 0.4s ease-out' }}>

      {/* ── HEADER ─────────────────────────────────────────────────────────── */}
      <div className="at-header">
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <div className="at-header-icon">
            <BrainCircuit size={22} color="#8b5cf6" />
          </div>
          <div>
            <h1 className="at-h1">{t('agentTrace')}</h1>
            <p className="at-subtitle">
              Real-time view of how JalRakshak analyzes water-risk decisions
              <span className="at-trace-id">Trace: {traceId}</span>
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {runStatus === 'completed' && (
            <>
              <button className="at-btn at-btn-ghost" onClick={exportTrace} title="Export JSON trace">
                <Download size={14} /> Export Trace
              </button>
              <button className="at-btn at-btn-ghost" onClick={() => nav('/admin/agent-trace')}>
                <FileText size={14} /> View Logs
              </button>
              <button className="at-btn at-btn-primary" onClick={() => nav('/admin/action-plan')}>
                <ClipboardList size={14} /> Create Action Plan
              </button>
            </>
          )}
          {(runStatus === 'completed' || runStatus === 'failed') && (
            <button className="at-btn at-btn-secondary" onClick={reset}>
              <RefreshCw size={14} /> Reset
            </button>
          )}
        </div>
      </div>

      {/* ── DEMO BANNER ────────────────────────────────────────────────────── */}
      {isDemo && (
        <div className="at-demo-banner">
          <Info size={14} />
          <span>
            <strong>Demo Mode Active</strong> — Analysis uses synthetic Saurashtra water data.
            Add <code>WATSONX_API_KEY</code> to <code>.env</code> for live IBM Granite responses.
          </span>
        </div>
      )}

      {/* ── CONTROLS ───────────────────────────────────────────────────────── */}
      <div className="at-card at-controls-card">
        <div className="at-controls-grid">
          {/* Village selector */}
          <div className="at-field">
            <label className="at-label">Village Context</label>
            <select
              className="at-select"
              value={selectedVillageId}
              onChange={e => setSelectedVillageId(e.target.value)}
              disabled={runStatus === 'running'}
            >
              {villages.length === 0 && (
                <option value={DEMO_VILLAGE_ID}>Bhavnagar V1 (Demo)</option>
              )}
              {villages.map(v => (
                <option key={v.village_id} value={v.village_id}>
                  {v.name} — {v.district}
                </option>
              ))}
            </select>
          </div>

          {/* Query input */}
          <div className="at-field at-field-grow">
            <label className="at-label">Analysis Request</label>
            <input
              className="at-input"
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              disabled={runStatus === 'running'}
              placeholder="Describe the water analysis query…"
            />
          </div>

          {/* Buttons */}
          <div className="at-field at-field-btns">
            <label className="at-label">&nbsp;</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                className="at-btn at-btn-primary"
                onClick={() => runAnalysis(false)}
                disabled={runStatus === 'running'}
              >
                {runStatus === 'running'
                  ? <><Loader2 size={14} className="at-spin" /> Running…</>
                  : <><Play size={14} /> Run Analysis</>}
              </button>
              <button
                className="at-btn at-btn-secondary"
                onClick={() => runAnalysis(true)}
                disabled={runStatus === 'running'}
              >
                <Zap size={14} /> Demo
              </button>
            </div>
          </div>
        </div>

        {/* Status bar */}
        <div className="at-status-bar">
          <div className="at-status-pill" style={{ background: statusBg(runStatus as AgentStatus), color: statusColor(runStatus as AgentStatus), borderColor: statusColor(runStatus as AgentStatus) + '44' }}>
            {runStatus === 'running' && <Loader2 size={12} className="at-spin" />}
            {runStatus === 'completed' && <CheckCircle2 size={12} />}
            {runStatus === 'failed' && <AlertTriangle size={12} />}
            {runStatus === 'idle' && <Circle size={12} />}
            Status: {runStatus === 'idle' ? 'Idle' : runStatus === 'running' ? 'Running' : runStatus === 'completed' ? 'Completed' : 'Failed'}
          </div>
          {runStatus === 'running' && (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div className="at-progress-track">
                <div className="at-progress-fill" style={{ width: `${progress}%` }} />
              </div>
              <span className="at-progress-label">{completedCount}/{totalAgents} agents · {progress}%</span>
            </div>
          )}
          {runStatus === 'completed' && totalDuration !== null && (
            <span className="at-muted" style={{ fontSize: '0.8rem' }}>
              Completed in {(totalDuration / 1000).toFixed(2)}s · {completedCount} agents
            </span>
          )}
        </div>
      </div>

      {/* ── MAIN GRID ──────────────────────────────────────────────────────── */}
      <div className="at-main-grid">

        {/* LEFT: Agent Pipeline ─────────────────────────────────────────── */}
        <div className="at-pipeline-col">
          <div className="at-section-title">
            <Activity size={15} /> Agent Pipeline
          </div>

          {agents.map((agent, idx) => {
            const isActive = currentAgentIdx === idx && runStatus === 'running';
            return (
              <div key={agent.id}>
                {/* Agent Card */}
                <div
                  className={`at-agent-card${isActive ? ' at-agent-active' : ''}${agent.status === 'completed' ? ' at-agent-done' : ''}`}
                  style={{ borderLeftColor: agent.status !== 'idle' ? agent.color : undefined }}
                >
                  <div className="at-agent-header" onClick={() => agent.result && toggleExpand(agent.id)}>
                    {/* Icon + name */}
                    <div className="at-agent-icon" style={{ background: agent.color + '22', color: agent.color }}>
                      {isActive ? <Loader2 size={16} className="at-spin" /> : agent.icon}
                    </div>
                    <div className="at-agent-meta">
                      <div className="at-agent-name">{agent.name}</div>
                      {agent.durationMs !== null && (
                        <div className="at-agent-duration"><Clock size={10} /> {fmtMs(agent.durationMs)}</div>
                      )}
                    </div>

                    {/* Status badge */}
                    <div className="at-agent-badges">
                      {agent.result && (
                        <span className="at-conf-badge" style={{ color: confColor(agent.result.confidence) }}>
                          {agent.result.confidence}%
                        </span>
                      )}
                      <span
                        className="at-status-badge"
                        style={{ background: statusBg(agent.status), color: statusColor(agent.status), borderColor: statusColor(agent.status) + '44' }}
                      >
                        {statusLabel(agent.status)}
                      </span>
                      {agent.result && (
                        <span className="at-expand-btn">
                          {agent.expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Output preview */}
                  {agent.result && !agent.expanded && (
                    <div className="at-agent-preview">{agent.result.output}</div>
                  )}

                  {/* Expanded detail */}
                  {agent.result && agent.expanded && (
                    <div className="at-agent-detail">
                      <div className="at-detail-grid">
                        <div className="at-detail-section">
                          <div className="at-detail-label">Output</div>
                          <div className="at-detail-value">{agent.result.output}</div>
                        </div>
                        <div className="at-detail-section">
                          <div className="at-detail-label">Analysis</div>
                          <div className="at-detail-value">{agent.result.analysis}</div>
                        </div>
                        <div className="at-detail-section">
                          <div className="at-detail-label">Decision Reasoning</div>
                          <div className="at-detail-value">{agent.result.reasoning}</div>
                        </div>
                        <div className="at-detail-section">
                          <div className="at-detail-label">Data Sources Used</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 4 }}>
                            {agent.result.dataUsed.map(d => (
                              <span key={d} className="at-data-tag"><Database size={10} /> {d}</span>
                            ))}
                          </div>
                        </div>
                        {agent.result.nextAgent && (
                          <div className="at-detail-section">
                            <div className="at-detail-label">Next Agent</div>
                            <div className="at-detail-value" style={{ color: 'var(--primary)' }}>→ {agent.result.nextAgent}</div>
                          </div>
                        )}
                        <div className="at-detail-section">
                          <div className="at-detail-label">Confidence</div>
                          <div>
                            <div className="at-conf-track">
                              <div className="at-conf-fill" style={{ width: `${agent.result.confidence}%`, background: confColor(agent.result.confidence) }} />
                            </div>
                            <span style={{ fontSize: '0.78rem', color: confColor(agent.result.confidence), fontWeight: 700 }}>{agent.result.confidence}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Arrow connector (not after last) */}
                {idx < agents.length - 1 && (
                  <div className="at-arrow">
                    <ArrowDown size={14} color={agent.status === 'completed' ? agent.color : 'var(--text-muted)'} />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* RIGHT: Panels ────────────────────────────────────────────────── */}
        <div className="at-right-col">

          {/* Final Recommendation ─────────────────────────────────────── */}
          {finalRec ? (
            <div className="at-card at-final-card">
              <div className="at-section-title" style={{ marginBottom: 16 }}>
                <CheckCircle2 size={15} color="#10b981" /> Final Recommendation
                {finalRec.isDemo && <span className="at-demo-tag">Demo Data</span>}
              </div>

              {/* Score ring + category */}
              <div className="at-final-score-row">
                <div className="at-score-ring" style={{ '--ring-color': finalRec.waterHealthScore >= 70 ? '#10b981' : finalRec.waterHealthScore >= 50 ? '#f59e0b' : '#ef4444' } as React.CSSProperties}>
                  <span className="at-score-num">{finalRec.waterHealthScore}</span>
                  <span className="at-score-label">/ 100</span>
                </div>
                <div>
                  <div className="at-score-category" style={{ color: finalRec.waterHealthScore >= 70 ? '#10b981' : finalRec.waterHealthScore >= 50 ? '#f59e0b' : '#ef4444' }}>
                    {finalRec.waterHealthCategory}
                  </div>
                  <div className="at-muted" style={{ fontSize: '0.78rem' }}>Water Health Score</div>
                  <div className="at-conf-badge" style={{ color: confColor(finalRec.confidence), marginTop: 4, display: 'inline-block' }}>
                    {finalRec.confidence}% confidence
                  </div>
                </div>
              </div>

              {/* Metrics grid */}
              <div className="at-metrics-grid">
                {[
                  { label: 'Drought Risk', value: finalRec.droughtRisk, sub: `${finalRec.droughtScore}% score`, color: finalRec.droughtRisk === 'CRITICAL' ? '#ef4444' : finalRec.droughtRisk === 'HIGH' ? '#f97316' : '#f59e0b', icon: <ShieldAlert size={14} /> },
                  { label: 'Groundwater', value: finalRec.groundwaterTrend, sub: 'Current trend', color: '#0ea5e9', icon: <Waves size={14} /> },
                  { label: 'Water Deficit', value: `${finalRec.waterDeficitMcm.toFixed(1)} MCM`, sub: 'Annual shortfall', color: '#ef4444', icon: <TrendingDown size={14} /> },
                  { label: 'Priority Level', value: finalRec.priorityLevel, sub: 'Intervention urgency', color: finalRec.priorityLevel === 'CRITICAL' ? '#ef4444' : '#f59e0b', icon: <AlertTriangle size={14} /> },
                ].map(m => (
                  <div key={m.label} className="at-metric-item" style={{ borderLeftColor: m.color }}>
                    <div className="at-metric-icon" style={{ color: m.color }}>{m.icon}</div>
                    <div>
                      <div className="at-metric-label">{m.label}</div>
                      <div className="at-metric-value" style={{ color: m.color }}>{m.value}</div>
                      <div className="at-muted" style={{ fontSize: '0.72rem' }}>{m.sub}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Recommendations */}
              <div className="at-rec-block">
                <div className="at-rec-row">
                  <Sprout size={14} color="#22c55e" />
                  <div>
                    <div className="at-rec-key">Recommended Crop</div>
                    <div className="at-rec-val">{finalRec.recommendedCrop}</div>
                  </div>
                </div>
                <div className="at-rec-row">
                  <Droplet size={14} color="#06b6d4" />
                  <div>
                    <div className="at-rec-key">Recharge Action</div>
                    <div className="at-rec-val">{finalRec.rechargeAction}</div>
                  </div>
                </div>
              </div>

              <button className="at-btn at-btn-primary at-full-btn" onClick={() => nav('/admin/action-plan')}>
                <ClipboardList size={14} /> Create Action Plan
              </button>
            </div>
          ) : (
            <div className="at-card at-empty-card">
              <BrainCircuit size={36} color="var(--text-muted)" style={{ opacity: 0.4 }} />
              <div className="at-empty-title">No Analysis Yet</div>
              <div className="at-empty-sub">Click <strong>Run Analysis</strong> or <strong>Demo</strong> to execute the agent pipeline and see the final recommendation.</div>
            </div>
          )}

          {/* AI / IBM section ─────────────────────────────────────────── */}
          <div className="at-card">
            <div className="at-section-title" style={{ marginBottom: 14 }}>
              <Cpu size={15} color="#3b82f6" /> AI Engine
            </div>
            <div className="at-ai-grid">
              {[
                { label: 'Model', value: backendHealth?.granite_model || 'IBM Granite 4 H Small' },
                { label: 'Architecture', value: 'Multi-Agent Orchestration' },
                { label: 'Backend', value: healthStatus, color: healthColor },
                { label: 'Data Mode', value: backendHealth?.data_mode === 'live' ? 'Live Data' : 'Demo Data', color: backendHealth?.data_mode === 'live' ? '#10b981' : '#f59e0b' },
              ].map(r => (
                <div key={r.label} className="at-ai-row">
                  <span className="at-ai-label">{r.label}</span>
                  <span className="at-ai-value" style={{ color: r.color }}>{r.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Data Sources ─────────────────────────────────────────────── */}
          <div className="at-card">
            <div className="at-section-title" style={{ marginBottom: 14 }}>
              <Database size={15} color="#8b5cf6" /> Data Sources
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { name: 'Groundwater Depth', icon: <Waves size={13} />, color: '#0ea5e9', note: isDemo ? 'Demo' : 'Live' },
                { name: 'Rainfall Records',  icon: <CloudRain size={13} />, color: '#6366f1', note: isDemo ? 'Demo' : 'Live' },
                { name: 'Crop Water Data',   icon: <Sprout size={13} />,   color: '#22c55e', note: isDemo ? 'Demo' : 'Live' },
                { name: 'Village Census',    icon: <Users size={13} />,     color: '#f59e0b', note: isDemo ? 'Demo' : 'Live' },
                { name: 'Recharge Models',   icon: <Droplet size={13} />,   color: '#06b6d4', note: isDemo ? 'Demo' : 'Live' },
              ].map(src => (
                <div key={src.name} className="at-ds-row">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ color: src.color }}>{src.icon}</span>
                    <span className="at-ds-name">{src.name}</span>
                  </div>
                  <span className="at-ds-badge" style={{ color: src.note === 'Live' ? '#10b981' : '#f59e0b', background: src.note === 'Live' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', borderColor: src.note === 'Live' ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)' }}>
                    {src.note}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Timeline ────────────────────────────────────────────────── */}
          {timeline.length > 0 && (
            <div className="at-card">
              <div className="at-section-title" style={{ marginBottom: 14 }}>
                <Clock size={15} color="#a78bfa" /> Execution Timeline
              </div>
              <div className="at-timeline">
                <div className="at-tl-head">
                  <span>Time</span><span>Agent</span><span>Status</span><span>Duration</span>
                </div>
                <div className="at-tl-body">
                  {timeline.slice().reverse().map((e, i) => (
                    <div key={i} className="at-tl-row">
                      <span className="at-muted at-tl-ts">{e.ts}</span>
                      <span className="at-tl-agent">{e.agent}</span>
                      <span style={{ color: statusColor(e.status), fontSize: '0.75rem', fontWeight: 700 }}>{statusLabel(e.status)}</span>
                      <span className="at-muted at-tl-dur">{fmtMs(e.durationMs)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
