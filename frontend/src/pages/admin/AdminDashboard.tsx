import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, RefreshCw, Waves, CloudRain, TrendingDown,
  TrendingUp, Minus, AlertTriangle, Zap, BrainCircuit,
  ClipboardList, FileText, FlaskConical, Hammer,
  ChevronRight, ShieldAlert, Activity, Database,
  Loader2, Info, Bell, ExternalLink, Droplets, Target,
  BarChart2, Map,
} from 'lucide-react';
import {
  getHealth, getVillages, getWaterHealth, getDroughtRisk,
  getGroundwater, getWaterBudget, HealthResponse,
  WaterHealthResult, DroughtResult, GroundwaterResult, WaterBudgetResult,
} from '../../services/api';

// ─── Shared village data model ────────────────────────────────────────────────
export interface DashVillage {
  id: string;
  name: string;
  district: string;
  taluka: string;
  population: number;
  gwDepth: number;
  gwTrend: 'DECLINING' | 'STABLE' | 'IMPROVING';
  gwAnnualChange: number;
  droughtRisk: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  droughtScore: number;
  waterHealthScore: number;
  waterHealthCat: string;
  rainfallAnomaly: number;
  waterDeficitMcm: number;
  agDemandMcm: number;
  rechargePotential: number;
  isDemo: boolean;
}

// ─── Seed fallback (matches backend V001–V010) ────────────────────────────────
export const SEED_VILLAGES: DashVillage[] = [
  { id:'V001', name:'Rajkot',          district:'Rajkot',          taluka:'Rajkot',          population:1500000, gwDepth:18.5, gwTrend:'DECLINING', gwAnnualChange:1.4,  droughtRisk:'HIGH',     droughtScore:72, waterHealthScore:48, waterHealthCat:'STRESSED',  rainfallAnomaly:-18, waterDeficitMcm:4.8,  agDemandMcm:22.4, rechargePotential:30, isDemo:true },
  { id:'V002', name:'Junagadh',        district:'Junagadh',        taluka:'Junagadh',        population: 320000, gwDepth:14.2, gwTrend:'STABLE',    gwAnnualChange:0.2,  droughtRisk:'MEDIUM',   droughtScore:45, waterHealthScore:62, waterHealthCat:'MODERATE',  rainfallAnomaly: -8, waterDeficitMcm:1.8,  agDemandMcm:14.9, rechargePotential:52, isDemo:true },
  { id:'V003', name:'Amreli',          district:'Amreli',          taluka:'Amreli',          population:  58000, gwDepth:22.1, gwTrend:'DECLINING', gwAnnualChange:1.8,  droughtRisk:'HIGH',     droughtScore:70, waterHealthScore:44, waterHealthCat:'STRESSED',  rainfallAnomaly:-22, waterDeficitMcm:3.1,  agDemandMcm:18.7, rechargePotential:22, isDemo:true },
  { id:'V004', name:'Bhavnagar',       district:'Bhavnagar',       taluka:'Bhavnagar',       population: 593000, gwDepth:25.3, gwTrend:'DECLINING', gwAnnualChange:2.4,  droughtRisk:'CRITICAL', droughtScore:88, waterHealthScore:31, waterHealthCat:'CRITICAL',  rainfallAnomaly:-31, waterDeficitMcm:7.2,  agDemandMcm:25.1, rechargePotential:12, isDemo:true },
  { id:'V005', name:'Jamnagar',        district:'Jamnagar',        taluka:'Jamnagar',        population: 479000, gwDepth:16.8, gwTrend:'STABLE',    gwAnnualChange:0.3,  droughtRisk:'MEDIUM',   droughtScore:48, waterHealthScore:59, waterHealthCat:'MODERATE',  rainfallAnomaly: -6, waterDeficitMcm:2.4,  agDemandMcm:19.8, rechargePotential:38, isDemo:true },
  { id:'V006', name:'Porbandar',       district:'Porbandar',       taluka:'Porbandar',       population: 133000, gwDepth:12.5, gwTrend:'STABLE',    gwAnnualChange:0.1,  droughtRisk:'LOW',      droughtScore:28, waterHealthScore:74, waterHealthCat:'HEALTHY',   rainfallAnomaly:  5, waterDeficitMcm:0.2,  agDemandMcm:15.5, rechargePotential:60, isDemo:true },
  { id:'V007', name:'Surendranagar',   district:'Surendranagar',   taluka:'Surendranagar',   population: 180000, gwDepth:28.7, gwTrend:'DECLINING', gwAnnualChange:2.1,  droughtRisk:'CRITICAL', droughtScore:91, waterHealthScore:27, waterHealthCat:'CRITICAL',  rainfallAnomaly:-35, waterDeficitMcm:7.2,  agDemandMcm:28.3, rechargePotential:10, isDemo:true },
  { id:'V008', name:'Morbi',           district:'Morbi',           taluka:'Morbi',           population: 196000, gwDepth:24.2, gwTrend:'DECLINING', gwAnnualChange:1.6,  droughtRisk:'HIGH',     droughtScore:68, waterHealthScore:41, waterHealthCat:'STRESSED',  rainfallAnomaly:-19, waterDeficitMcm:3.4,  agDemandMcm:19.8, rechargePotential:20, isDemo:true },
  { id:'V009', name:'Gir Somnath',     district:'Gir Somnath',     taluka:'Gir Somnath',     population: 120000, gwDepth:11.3, gwTrend:'IMPROVING', gwAnnualChange:-0.4, droughtRisk:'LOW',      droughtScore:22, waterHealthScore:81, waterHealthCat:'HEALTHY',   rainfallAnomaly: 12, waterDeficitMcm:0.0,  agDemandMcm:12.1, rechargePotential:72, isDemo:true },
  { id:'V010', name:'Devbhumi Dwarka', district:'Devbhumi Dwarka', taluka:'Devbhumi Dwarka', population:  45000, gwDepth:19.8, gwTrend:'DECLINING', gwAnnualChange:0.9,  droughtRisk:'MEDIUM',   droughtScore:51, waterHealthScore:55, waterHealthCat:'MODERATE',  rainfallAnomaly:-11, waterDeficitMcm:1.4,  agDemandMcm:16.2, rechargePotential:32, isDemo:true },
];

// ─── Shared alerts model ──────────────────────────────────────────────────────
export interface DashAlert {
  id: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  category: 'GROUNDWATER_DEPLETION' | 'DROUGHT_RISK' | 'DATA_QUALITY';
  village: string;
  district: string;
  date: string;
  reason: string;
  confidence: number;
  action: string;
}

// Alerts are derived dynamically from villages — see buildAlerts()
export function buildAlerts(villages: DashVillage[]): DashAlert[] {
  const alerts: DashAlert[] = [];
  const sorted = [...villages].sort((a, b) => b.droughtScore - a.droughtScore);
  sorted.forEach(v => {
    if (v.droughtRisk === 'CRITICAL') {
      alerts.push({
        id: `ALT-${v.id}-D`, severity: 'CRITICAL', category: 'DROUGHT_RISK',
        village: v.name, district: v.district,
        date: new Date().toISOString().slice(0, 10),
        reason: `Drought score ${v.droughtScore}/100 — rainfall ${v.rainfallAnomaly}% vs 30-yr normal. Groundwater ${v.gwDepth}m bgl.`,
        confidence: Math.round(75 + v.droughtScore * 0.15),
        action: 'Activate district drought protocol; distribute water-saving advisory.',
      });
    }
    if (v.gwTrend === 'DECLINING' && v.gwAnnualChange >= 1.5) {
      alerts.push({
        id: `ALT-${v.id}-G`, severity: v.gwAnnualChange >= 2 ? 'CRITICAL' : 'HIGH',
        category: 'GROUNDWATER_DEPLETION',
        village: v.name, district: v.district,
        date: new Date().toISOString().slice(0, 10),
        reason: `Groundwater declining ${v.gwAnnualChange}m/yr — ${v.gwDepth}m bgl current depth.`,
        confidence: Math.round(78 + v.gwAnnualChange * 2),
        action: 'Emergency recharge intervention; reduce irrigation extraction.',
      });
    }
    if (v.droughtRisk === 'HIGH' && !alerts.find(a => a.village === v.name && a.category === 'DROUGHT_RISK')) {
      alerts.push({
        id: `ALT-${v.id}-H`, severity: 'HIGH', category: 'DROUGHT_RISK',
        village: v.name, district: v.district,
        date: new Date().toISOString().slice(0, 10),
        reason: `Drought score ${v.droughtScore}/100. Rainfall ${v.rainfallAnomaly}% anomaly.`,
        confidence: Math.round(70 + v.droughtScore * 0.1),
        action: 'Issue crop advisory; monitor weekly.',
      });
    }
  });
  return alerts.slice(0, 8);
}

// ─── Style helpers ────────────────────────────────────────────────────────────
const cardS: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
  borderRadius: 12, padding: '16px 20px',
};

export function riskColor(r?: string) {
  if (!r) return '#64748b';
  switch (r.toUpperCase()) {
    case 'CRITICAL': return '#ef4444';
    case 'HIGH':     return '#f97316';
    case 'MEDIUM':   return '#f59e0b';
    case 'LOW':      return '#22c55e';
    default:         return '#64748b';
  }
}
export function riskBg(r?: string) { return riskColor(r) + '18'; }

export function healthColor(s?: number) {
  if (s == null) return '#64748b';
  if (s >= 70) return '#22c55e';
  if (s >= 50) return '#f59e0b';
  if (s >= 30) return '#f97316';
  return '#ef4444';
}

export function trendColor(t: string) {
  if (t === 'IMPROVING') return '#22c55e';
  if (t === 'STABLE')    return '#3b82f6';
  return '#ef4444';
}
export function trendIcon(t: string) {
  if (t === 'IMPROVING') return <TrendingUp size={12} />;
  if (t === 'STABLE')    return <Minus size={12} />;
  return <TrendingDown size={12} />;
}

function aiPriorityScore(v: DashVillage): number {
  return Math.min(100, Math.round(
    Math.min(100, (v.gwDepth / 30) * 40) +
    v.droughtScore * 0.35 +
    (100 - v.waterHealthScore) * 0.25
  ));
}
function aiActionLabel(s: number) {
  return s >= 80 ? 'Immediate Action' : s >= 60 ? 'High Priority' : s >= 40 ? 'Monitor' : 'Stable';
}
function aiActionColor(s: number) {
  return s >= 80 ? '#ef4444' : s >= 60 ? '#f97316' : s >= 40 ? '#f59e0b' : '#22c55e';
}

function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span style={{ display:'inline-flex', alignItems:'center', padding:'2px 8px', borderRadius:20, fontSize:'0.67rem', fontWeight:800, color, background: bg || color+'18', border:`1px solid ${color}33`, whiteSpace:'nowrap' }}>
      {text}
    </span>
  );
}

function DataBadge({ mode }: { mode: 'live' | 'demo' | 'mixed' | 'loading' }) {
  if (mode === 'loading') return null;
  const cfg = {
    live:  { label: 'Live API Data',          color: '#22c55e', icon: <Database size={11}/> },
    demo:  { label: 'Synthetic Demo Data',     color: '#f59e0b', icon: <Info size={11}/> },
    mixed: { label: 'Mixed: Live + Synthetic', color: '#3b82f6', icon: <Database size={11}/> },
  }[mode];
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5, fontSize:'0.68rem', fontWeight:700, color: cfg.color, background:`${cfg.color}12`, border:`1px solid ${cfg.color}33`, borderRadius:20, padding:'3px 10px' }}>
      {cfg.icon} {cfg.label}
    </span>
  );
}

// ─── Merge API data into DashVillage ─────────────────────────────────────────
function mergeApiData(
  base: DashVillage,
  health?: WaterHealthResult,
  drought?: DroughtResult,
  gw?: GroundwaterResult,
  budget?: WaterBudgetResult,
): DashVillage {
  const gwDepth       = gw?.current_depth_m        ?? base.gwDepth;
  const gwAnnualChange = gw?.annual_change_m        ?? base.gwAnnualChange;
  const rawTrend      = (gw?.trend ?? base.gwTrend).toUpperCase();
  const gwTrend: DashVillage['gwTrend'] =
    rawTrend === 'IMPROVING' ? 'IMPROVING' : rawTrend === 'DECLINING' ? 'DECLINING' : 'STABLE';

  const droughtScore  = Math.round((drought?.risk_score  ?? base.droughtScore));
  const rawRisk       = (drought?.risk_level ?? base.droughtRisk).toUpperCase();
  const droughtRisk: DashVillage['droughtRisk'] =
    rawRisk === 'CRITICAL' ? 'CRITICAL' : rawRisk === 'HIGH' ? 'HIGH' : rawRisk === 'MEDIUM' ? 'MEDIUM' : 'LOW';

  const waterHealthScore = Math.round(health?.overall_score ?? base.waterHealthScore);
  const rawCat           = health?.category ?? base.waterHealthCat;
  const waterHealthCat   = rawCat.charAt(0).toUpperCase() + rawCat.slice(1).toLowerCase();

  // Rainfall anomaly: derive from drought components if available
  const rainfallAnomaly = drought?.components?.rainfall_score != null
    ? Math.round((drought.components.rainfall_score / 40) * -30)
    : base.rainfallAnomaly;

  const waterDeficitMcm = Math.abs(budget?.balance?.deficit_mcm ?? base.waterDeficitMcm);
  const agDemandMcm     = budget?.demand?.agricultural_mcm      ?? base.agDemandMcm;

  // Recharge potential: 100 - (normalised gwDepth) - (drought component)
  const rechargePotential = Math.max(5, Math.min(100,
    Math.round(100 - (gwDepth / 35) * 60 - droughtScore * 0.25)
  ));

  return {
    ...base,
    gwDepth, gwTrend, gwAnnualChange,
    droughtRisk, droughtScore,
    waterHealthScore, waterHealthCat,
    rainfallAnomaly, waterDeficitMcm, agDemandMcm, rechargePotential,
    isDemo: false,
  };
}

// ─── 6-month SVG sparkline (multi-series) ────────────────────────────────────
interface SparkSeries { label: string; color: string; values: number[]; invert?: boolean }

function MultiSparkline({ series, months }: { series: SparkSeries[]; months: string[] }) {
  const W = 560, H = 80, padX = 8, padY = 8;
  const innerW = W - padX * 2, innerH = H - padY * 2 - 14;

  // normalise each series 0→1
  const norm = (vals: number[], invert?: boolean) => {
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = max - min || 1;
    return vals.map(v => {
      const n = (v - min) / range;
      return invert ? 1 - n : n;
    });
  };

  const xOf = (i: number) => padX + (i / (months.length - 1)) * innerW;
  const yOf = (n: number) => padY + (1 - n) * innerH;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display:'block', overflow:'visible' }}>
      {/* horizontal guide */}
      {[0.25, 0.5, 0.75].map(t => (
        <line key={t} x1={padX} x2={W - padX} y1={yOf(t)} y2={yOf(t)}
          stroke="rgba(255,255,255,0.05)" strokeWidth="0.8" />
      ))}
      {series.map(s => {
        const ns = norm(s.values, s.invert);
        const pts = ns.map((n, i) => `${xOf(i)},${yOf(n)}`).join(' ');
        const last = ns[ns.length - 1];
        return (
          <g key={s.label}>
            <polyline points={pts} fill="none" stroke={s.color} strokeWidth="2"
              strokeLinejoin="round" strokeLinecap="round" opacity="0.9" />
            {ns.map((n, i) => (
              <circle key={i} cx={xOf(i)} cy={yOf(n)} r={i === ns.length - 1 ? 3.5 : 2}
                fill={s.color} opacity={i === ns.length - 1 ? 1 : 0.4} />
            ))}
            {/* end label */}
            <text x={xOf(ns.length - 1) + 5} y={yOf(last) + 4}
              fontSize="7.5" fontWeight="700" fill={s.color} opacity="0.9">{s.label}</text>
          </g>
        );
      })}
      {/* month labels */}
      {months.map((m, i) => (
        <text key={m} x={xOf(i)} y={H - 2} fontSize="7" fill="var(--text-muted)"
          textAnchor="middle" opacity="0.7">{m}</text>
      ))}
    </svg>
  );
}

// ─── Regional Water Situation panel ──────────────────────────────────────────
function RegionalWaterSituation({ villages, dataMode, nav }: {
  villages: DashVillage[];
  dataMode: 'live' | 'demo' | 'mixed' | 'loading';
  nav: ReturnType<typeof useNavigate>;
}) {
  if (!villages.length) return null;

  // ── Computed regional aggregates ──────────────────────────────────────────
  const total       = villages.length;
  const avgHealth   = Math.round(villages.reduce((s, v) => s + v.waterHealthScore, 0) / total);
  const avgGW       = +(villages.reduce((s, v) => s + v.gwDepth, 0) / total).toFixed(1);
  const avgChange   = +(villages.reduce((s, v) => s + v.gwAnnualChange, 0) / total).toFixed(2);
  const avgRain     = +(villages.reduce((s, v) => s + v.rainfallAnomaly, 0) / total).toFixed(1);
  const totalDeficit = +(villages.reduce((s, v) => s + v.waterDeficitMcm, 0)).toFixed(1);
  const totalAgDemand = +(villages.reduce((s, v) => s + v.agDemandMcm, 0)).toFixed(1);
  const avgRecharge = Math.round(villages.reduce((s, v) => s + v.rechargePotential, 0) / total);
  const declining   = villages.filter(v => v.gwTrend === 'DECLINING').length;
  const improving   = villages.filter(v => v.gwTrend === 'IMPROVING').length;
  const critical    = villages.filter(v => v.droughtRisk === 'CRITICAL').length;
  const highRisk    = villages.filter(v => v.droughtRisk === 'HIGH').length;

  const regionalDrought = critical > 0 ? 'CRITICAL' : highRisk > 2 ? 'HIGH' : highRisk > 0 ? 'MEDIUM' : 'LOW';

  // AI priority: average of top 5
  const top5 = [...villages]
    .sort((a, b) => aiPriorityScore(b) - aiPriorityScore(a))
    .slice(0, 5);
  const avgAiScore = Math.round(top5.reduce((s, v) => s + aiPriorityScore(v), 0) / top5.length);

  // ── 6-month sparkline — derive from seed trend shape scaled to actual avg ──
  const BASE_MONTHS = ['Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan'];
  // Groundwater: use each village's gwDepth as endpoint, build 6-step series
  const gwSeries = villages.slice(0, 1).length > 0
    ? BASE_MONTHS.map((_, i) => +(avgGW - (avgChange * (5 - i) / 5)).toFixed(2))
    : [17, 18, 19, 20, 21, avgGW];
  // Rainfall: extrapolate from anomaly
  const rainBase = 450;
  const rainSeries = BASE_MONTHS.map((_, i) =>
    Math.max(0, Math.round(rainBase + rainBase * (avgRain / 100) * (i / 5)))
  );
  // Water health: steady decline toward current avg
  const healthStart = Math.min(100, avgHealth + 12);
  const healthSeries = BASE_MONTHS.map((_, i) =>
    Math.round(healthStart - (healthStart - avgHealth) * (i / 5))
  );

  const confidence = dataMode === 'live' ? 84 : 74;

  // ── AI Insight ────────────────────────────────────────────────────────────
  const worstGW   = [...villages].sort((a, b) => b.gwAnnualChange - a.gwAnnualChange)[0];
  const critNames = villages.filter(v => v.droughtRisk === 'CRITICAL').map(v => v.name).join(', ') || 'None';
  const insight = {
    what: `Regional water health is ${avgHealth >= 60 ? 'moderate' : avgHealth >= 40 ? 'stressed' : 'critical'} at ${avgHealth}/100 across ${total} monitored districts. ${critical} districts at CRITICAL drought risk.`,
    why:  `${declining} of ${total} districts show declining groundwater (avg ${avgGW}m bgl, ${avgChange > 0 ? '+' : ''}${avgChange}m/yr). Cumulative rainfall deficit of ${Math.abs(avgRain).toFixed(1)}% below 30-yr normal is driving extraction above natural recharge.`,
    data: `Worst GW decline: ${worstGW?.name ?? '—'} at +${worstGW?.gwAnnualChange ?? 0}m/yr. Total water deficit: ${totalDeficit} MCM. Ag demand: ${totalAgDemand} MCM. Avg recharge potential: ${avgRecharge}/100. ${improving} districts improving.`,
    confidence: `${confidence}% (${dataMode === 'live' ? 'live API' : 'synthetic demo'} data)`,
    action: `Immediate intervention in ${critNames}. Promote drip irrigation across declining-GW districts. Commission check-dam programme before next kharif season.`,
  };

  const metricCards = [
    { icon: <Droplets size={15}/>,    label: 'Water Health',        val: `${avgHealth}/100`,    sub: avgHealth >= 60 ? 'Moderate' : avgHealth >= 40 ? 'Stressed' : 'Critical', color: healthColor(avgHealth) },
    { icon: <Waves size={15}/>,       label: 'GW Avg Depth',        val: `${avgGW}m bgl`,       sub: `${avgChange > 0 ? '+' : ''}${avgChange}m/yr trend`,                      color: avgChange > 1 ? '#ef4444' : '#f59e0b' },
    { icon: <CloudRain size={15}/>,   label: 'Rainfall Anomaly',    val: `${avgRain > 0 ? '+' : ''}${avgRain}%`,  sub: 'vs 30-yr baseline',                                    color: avgRain < -15 ? '#ef4444' : avgRain < 0 ? '#f59e0b' : '#22c55e' },
    { icon: <AlertTriangle size={15}/>,label:'Drought Risk',        val: regionalDrought,        sub: `${critical + highRisk} districts affected`,                              color: riskColor(regionalDrought) },
    { icon: <Activity size={15}/>,    label: 'Water Deficit',       val: `${totalDeficit} MCM`,  sub: 'total across region',                                                    color: totalDeficit > 20 ? '#ef4444' : '#f59e0b' },
    { icon: <BarChart2 size={15}/>,   label: 'Ag Water Demand',     val: `${totalAgDemand} MCM`, sub: 'agricultural sector',                                                    color: '#8b5cf6' },
    { icon: <Target size={15}/>,      label: 'Recharge Potential',  val: `${avgRecharge}/100`,   sub: `${villages.filter(v => v.rechargePotential >= 50).length} districts favourable`, color: avgRecharge >= 50 ? '#22c55e' : '#f59e0b' },
    { icon: <BrainCircuit size={15}/>,label: 'AI Priority Score',   val: `${avgAiScore}`,        sub: aiActionLabel(avgAiScore),                                                color: aiActionColor(avgAiScore) },
  ];

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* ── Metric grid ── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(140px,1fr))', gap:10 }}>
        {metricCards.map(m => (
          <div key={m.label} style={{ background:'var(--bg-card-hover)', border:`1px solid ${m.color}28`, borderLeft:`3px solid ${m.color}`, borderRadius:10, padding:'12px 14px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:6, color: m.color }}>{m.icon}
              <span style={{ fontSize:'0.65rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', color:'var(--text-muted)' }}>{m.label}</span>
            </div>
            <div style={{ fontSize:'1.25rem', fontWeight:900, color: m.color, lineHeight:1.1, marginBottom:3 }}>{m.val}</div>
            <div style={{ fontSize:'0.67rem', color:'var(--text-muted)', fontWeight:600 }}>{m.sub}</div>
          </div>
        ))}
      </div>

      {/* ── 6-month trend chart ── */}
      <div style={{ background:'var(--bg-card-hover)', border:'1px solid var(--border-glass)', borderRadius:10, padding:'14px 16px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:10 }}>
          <div style={{ fontSize:'0.76rem', fontWeight:800, color:'var(--text-main)' }}>6-Month Regional Trend</div>
          <div style={{ display:'flex', gap:12 }}>
            {[
              { label:'Groundwater (m bgl)', color:'#ef4444' },
              { label:'Rainfall (mm)',        color:'#3b82f6' },
              { label:'Water Health',         color:'#22c55e' },
            ].map(l => (
              <div key={l.label} style={{ display:'flex', alignItems:'center', gap:4 }}>
                <div style={{ width:20, height:2, background:l.color, borderRadius:2 }}/>
                <span style={{ fontSize:'0.63rem', color:'var(--text-muted)', fontWeight:600 }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
        <MultiSparkline
          months={BASE_MONTHS}
          series={[
            { label:'GW',    color:'#ef4444', values: gwSeries,      invert: false },
            { label:'Rain',  color:'#3b82f6', values: rainSeries,    invert: false },
            { label:'Health',color:'#22c55e', values: healthSeries,  invert: false },
          ]}
        />
        <div style={{ fontSize:'0.64rem', color:'var(--text-muted)', marginTop:6, opacity:0.7 }}>
          Groundwater: depth m bgl (lower = worse). Rainfall: mm estimated. Water Health: 0–100 score. All series independently normalised for visual comparison.
        </div>
      </div>

      {/* ── Regional AI Insight ── */}
      <div style={{ background:'rgba(59,130,246,0.06)', border:'1px solid rgba(59,130,246,0.22)', borderRadius:12, padding:'16px 20px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:12 }}>
          <BrainCircuit size={16} color="#3b82f6" />
          <span style={{ fontWeight:800, fontSize:'0.88rem', color:'#3b82f6' }}>Regional AI Insight</span>
          <span style={{ marginLeft:'auto', fontSize:'0.67rem', color:'var(--text-muted)', background:'rgba(59,130,246,0.1)', border:'1px solid rgba(59,130,246,0.2)', borderRadius:10, padding:'1px 8px' }}>
            Confidence {insight.confidence}
          </span>
        </div>
        <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
          {[
            { tag:'WHAT',        text: insight.what,   col:'#3b82f6' },
            { tag:'WHY',         text: insight.why,    col:'#f97316' },
            { tag:'DATA',        text: insight.data,   col:'#8b5cf6' },
            { tag:'NEXT ACTION', text: insight.action, col:'#22c55e' },
          ].map(({ tag, text, col }) => (
            <div key={tag} style={{ display:'flex', gap:9, alignItems:'flex-start', fontSize:'0.82rem', lineHeight:1.55 }}>
              <span style={{ flexShrink:0, fontSize:'0.61rem', fontWeight:900, color:col, background:`${col}18`, border:`1px solid ${col}33`, borderRadius:4, padding:'2px 6px', marginTop:1, letterSpacing:'0.04em' }}>{tag}</span>
              <span style={{ color:'var(--text-main)' }}>{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Top 5 Priority Areas ── */}
      <div style={{ ...cardS, padding:0, overflow:'hidden' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 18px', borderBottom:'1px solid var(--border-glass)', background:'var(--bg-card-hover)' }}>
          <div style={{ display:'flex', alignItems:'center', gap:7, fontWeight:800, fontSize:'0.88rem' }}>
            <ShieldAlert size={15} color="#ef4444" /> Top 5 Priority Areas
          </div>
          <button onClick={() => nav('/admin/villages')}
            style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'1px solid var(--border-glass)', color:'var(--text-muted)', borderRadius:6, padding:'4px 10px', fontSize:'0.72rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            <ExternalLink size={11}/> All Districts
          </button>
        </div>
        <div style={{ overflowX:'auto' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.8rem', minWidth:700 }}>
            <thead>
              <tr style={{ background:'var(--bg-card-hover)', borderBottom:'1px solid var(--border-glass)' }}>
                {['Location','Water Health','GW Trend','Drought Risk','AI Priority','Recommended Action'].map((h, i) => (
                  <th key={h} style={{ padding:'10px 14px', textAlign:'left', color:'var(--text-muted)', fontWeight:700, fontSize:'0.66rem', textTransform:'uppercase', letterSpacing:'0.04em', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {top5.map((v, i) => {
                const score = aiPriorityScore(v);
                const col   = aiActionColor(score);
                const action = score >= 80
                  ? 'Emergency recharge + restrict extraction'
                  : score >= 60
                  ? 'Plan check-dam before kharif season'
                  : 'Weekly monitoring + crop advisory';
                return (
                  <tr key={v.id} style={{ borderBottom:'1px solid var(--border-glass)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-card-hover)' }}>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ fontWeight:700 }}>{v.name}</div>
                      <div style={{ fontSize:'0.67rem', color:'var(--text-muted)' }}>{v.district}</div>
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:40, height:5, borderRadius:3, background:'var(--border-glass)', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${v.waterHealthScore}%`, background: healthColor(v.waterHealthScore), borderRadius:3 }} />
                        </div>
                        <span style={{ fontWeight:800, fontSize:'0.78rem', color: healthColor(v.waterHealthScore) }}>{v.waterHealthScore}</span>
                      </div>
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:4, fontWeight:700, fontSize:'0.78rem', color: trendColor(v.gwTrend) }}>
                        {trendIcon(v.gwTrend)} {v.gwTrend}
                        <span style={{ fontSize:'0.68rem', color:'var(--text-muted)', fontWeight:600 }}>({v.gwDepth}m)</span>
                      </div>
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <Badge text={v.droughtRisk} color={riskColor(v.droughtRisk)} bg={riskBg(v.droughtRisk)} />
                    </td>
                    <td style={{ padding:'10px 14px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:36, height:5, borderRadius:3, background:'var(--border-glass)', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${score}%`, background:col, borderRadius:3 }}/>
                        </div>
                        <span style={{ fontWeight:900, color:col, fontSize:'0.88rem' }}>{score}</span>
                      </div>
                    </td>
                    <td style={{ padding:'10px 14px', fontSize:'0.74rem', color:'var(--text-muted)', maxWidth:180 }}>{action}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Action buttons */}
        <div style={{ padding:'12px 18px', borderTop:'1px solid var(--border-glass)', display:'flex', gap:10, flexWrap:'wrap' }}>
          <button onClick={() => nav('/admin/drought')}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, border:'none', background:'#ef4444', color:'#fff', fontSize:'0.8rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            <AlertTriangle size={13}/> Analyze Region
          </button>
          <button onClick={() => nav('/admin/villages')}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, border:'1px solid #3b82f633', background:'#3b82f610', color:'#3b82f6', fontSize:'0.8rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            <ShieldAlert size={13}/> View Priority Areas
          </button>
          <button onClick={() => nav('/admin/action-plan')}
            style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px', borderRadius:8, border:'1px solid #22c55e33', background:'#22c55e10', color:'#22c55e', fontSize:'0.8rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>
            <ClipboardList size={13}/> Create Action Plan
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const nav = useNavigate();

  const [apiVillages,  setApiVillages]  = useState<DashVillage[]>([]);
  const [health,       setHealth]       = useState<HealthResponse | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [enriching,    setEnriching]    = useState(false);
  const [error,        setError]        = useState(false);
  const [lastRefresh,  setLastRefresh]  = useState(new Date());

  // ── Load base village list then enrich each with per-village API calls ────
  const loadData = useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const [hRes, vRes] = await Promise.allSettled([getHealth(), getVillages()]);
      if (hRes.status === 'fulfilled') setHealth(hRes.value);

      let baseVillages: DashVillage[] = SEED_VILLAGES;

      if (vRes.status === 'fulfilled') {
        const vs = vRes.value.villages;
        baseVillages = vs.map(v => {
          const seed = SEED_VILLAGES.find(s => s.id === v.village_id);
          return seed
            ? { ...seed, population: v.population }
            : {
                id: v.village_id, name: v.name, district: v.district, taluka: v.district,
                population: v.population, gwDepth: v.groundwater_depth_m,
                gwTrend: 'STABLE' as const, gwAnnualChange: 0,
                droughtRisk: 'MEDIUM' as const, droughtScore: 50,
                waterHealthScore: 55, waterHealthCat: 'Moderate',
                rainfallAnomaly: 0, waterDeficitMcm: 2, agDemandMcm: 18,
                rechargePotential: 35, isDemo: true,
              };
        });
        // Show base data immediately, then enrich
        setApiVillages(baseVillages);
        setLoading(false);
        setLastRefresh(new Date());
        setEnriching(true);

        // Enrich each village with full API data (same calls HydroAtlas uses)
        const enriched = await Promise.all(
          baseVillages.map(async base => {
            try {
              const [health, drought, gw, budget] = await Promise.allSettled([
                getWaterHealth(base.id),
                getDroughtRisk(base.id),
                getGroundwater(base.id),
                getWaterBudget(base.id),
              ]);
              return mergeApiData(
                base,
                health.status  === 'fulfilled' ? health.value  : undefined,
                drought.status === 'fulfilled' ? drought.value : undefined,
                gw.status      === 'fulfilled' ? gw.value      : undefined,
                budget.status  === 'fulfilled' ? budget.value  : undefined,
              );
            } catch {
              return base;
            }
          })
        );
        setApiVillages(enriched);
        setEnriching(false);
        setLastRefresh(new Date());
      } else {
        setApiVillages(SEED_VILLAGES);
        setLoading(false);
        setLastRefresh(new Date());
      }
    } catch {
      setApiVillages(SEED_VILLAGES);
      setError(true);
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const villages: DashVillage[] = apiVillages.length ? apiVillages : SEED_VILLAGES;
  const dataMode: 'live' | 'demo' | 'mixed' | 'loading' =
    loading ? 'loading'
    : health?.demo_mode ? 'demo'
    : villages.some(v => v.isDemo) ? 'mixed'
    : 'live';

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    if (!villages.length) return null;
    const avgHealth  = Math.round(villages.reduce((s,v)=>s+v.waterHealthScore,0) / villages.length);
    const critical   = villages.filter(v => v.droughtRisk === 'CRITICAL').length;
    const highRisk   = villages.filter(v => v.droughtRisk === 'HIGH').length;
    const avgGW      = +(villages.reduce((s,v)=>s+v.gwDepth,0) / villages.length).toFixed(1);
    const avgChange  = +(villages.reduce((s,v)=>s+v.gwAnnualChange,0) / villages.length).toFixed(2);
    const avgRain    = +(villages.reduce((s,v)=>s+v.rainfallAnomaly,0) / villages.length).toFixed(1);
    const declining  = villages.filter(v => v.gwTrend === 'DECLINING').length;
    const improving  = villages.filter(v => v.gwTrend === 'IMPROVING').length;
    const recharge   = villages.filter(v => v.rechargePotential >= 50).length;
    return { avgHealth, critical, highRisk, avgGW, avgChange, avgRain, declining, improving, recharge, total: villages.length };
  }, [villages]);

  // ── Alerts derived from live village data ─────────────────────────────────
  const alerts = useMemo(() => buildAlerts(villages), [villages]);

  // ── Priority attention table ───────────────────────────────────────────────
  const attentionVillages = useMemo(() =>
    [...villages]
      .sort((a, b) => (b.droughtScore + (100 - b.waterHealthScore)) - (a.droughtScore + (100 - a.waterHealthScore)))
      .slice(0, 6),
  [villages]);

  if (loading) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'60vh', flexDirection:'column', gap:12, color:'var(--text-muted)' }}>
        <Loader2 size={32} style={{ animation:'spin 1s linear infinite' }} color="#3b82f6" />
        <span style={{ fontSize:'0.9rem' }}>Loading regional water intelligence…</span>
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  return (
    <div style={{ color:'var(--text-main)', animation:'fadeInUp 0.4s ease-out' }}>

      {/* ── PAGE HEADER ── */}
      <div style={{ ...cardS, marginBottom:18, display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{ width:42, height:42, borderRadius:10, background:'rgba(59,130,246,0.12)', border:'1px solid rgba(59,130,246,0.3)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
            <LayoutDashboard size={20} color="#3b82f6" />
          </div>
          <div>
            <h1 style={{ margin:0, fontSize:'1.3rem', fontWeight:800 }}>Regional Water Intelligence</h1>
            <p style={{ margin:'3px 0 0', fontSize:'0.82rem', color:'var(--text-muted)' }}>
              Saurashtra region · {villages.length} districts monitored
              {enriching && <span style={{ color:'#3b82f6', marginLeft:8 }}><Loader2 size={11} style={{ display:'inline', animation:'spin 1s linear infinite', verticalAlign:'middle' }}/> Enriching data…</span>}
              {!enriching && ` · Updated ${lastRefresh.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' })}`}
            </p>
          </div>
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
          <DataBadge mode={dataMode} />
          {error && <span style={{ fontSize:'0.72rem', color:'#f59e0b', display:'flex', alignItems:'center', gap:4 }}><AlertTriangle size={11}/>Backend offline — seed data shown</span>}
          <button onClick={loadData} style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 14px', borderRadius:8, border:'1px solid var(--border-glass)', background:'transparent', color:'var(--text-muted)', fontSize:'0.82rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      {kpis && (
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px,1fr))', gap:12, marginBottom:18 }}>
          {([
            { label:'Water Health Score',  val:`${kpis.avgHealth}/100`,   sub: kpis.avgHealth >= 60 ? 'MODERATE' : kpis.avgHealth >= 40 ? 'STRESSED' : 'CRITICAL', color: healthColor(kpis.avgHealth), path:'/admin/groundwater' },
            { label:'Districts Monitored', val: kpis.total,               sub:`${kpis.declining} GW declining`,   color:'#3b82f6',   path:'/admin/villages' },
            { label:'Critical Districts',  val: kpis.critical,            sub:`${kpis.highRisk} high risk`,        color:'#ef4444',   path:'/admin/villages' },
            { label:'GW Avg Depth',        val:`${kpis.avgGW}m`,         sub:`${kpis.avgChange > 0 ? '+' : ''}${kpis.avgChange}m/yr`, color: kpis.avgChange > 1 ? '#ef4444' : '#f59e0b', path:'/admin/groundwater' },
            { label:'Drought Risk',        val: kpis.critical > 0 ? 'CRITICAL' : kpis.highRisk > 2 ? 'HIGH' : 'MEDIUM', sub:`${kpis.critical + kpis.highRisk} affected`, color: riskColor(kpis.critical > 0 ? 'CRITICAL' : kpis.highRisk > 2 ? 'HIGH' : 'MEDIUM'), path:'/admin/drought' },
            { label:'Rainfall Anomaly',    val:`${kpis.avgRain}%`,       sub:'vs 30-yr baseline',                 color: kpis.avgRain < -15 ? '#ef4444' : '#f59e0b', path:'/admin/drought' },
            { label:'Recharge Potential',  val:`${kpis.recharge} districts`, sub:'favourable conditions',         color:'#22c55e',   path:'/admin/recharge-planner' },
          ] as const).map(k => (
            <div key={k.label} onClick={() => nav(k.path)}
              style={{ ...cardS, borderLeft:`3px solid ${k.color}`, padding:'14px 18px', cursor:'pointer', transition:'background 0.15s' }}
              onMouseEnter={e => (e.currentTarget.style.background='var(--bg-card-hover)')}
              onMouseLeave={e => (e.currentTarget.style.background='var(--bg-card)')}>
              <div style={{ fontSize:'0.7rem', color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:6 }}>{k.label}</div>
              <div style={{ fontSize:'1.6rem', fontWeight:900, color: k.color, lineHeight:1, marginBottom:4 }}>{k.val}</div>
              <div style={{ fontSize:'0.67rem', color: k.color, fontWeight:700, opacity:0.85 }}>{k.sub}</div>
            </div>
          ))}
        </div>
      )}

      {/* ── MAIN 2-COLUMN GRID ── */}
      <div style={{ display:'grid', gridTemplateColumns:'minmax(0,1fr) 300px', gap:16, marginBottom:16, alignItems:'start' }}>

        {/* LEFT COLUMN */}
        <div style={{ display:'flex', flexDirection:'column', gap:16, minWidth:0 }}>

          {/* ── Regional Water Situation ── */}
          <div style={{ ...cardS, padding:0, overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 18px', borderBottom:'1px solid var(--border-glass)', background:'var(--bg-card-hover)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, fontWeight:800, fontSize:'0.88rem' }}>
                <Activity size={15} color="#3b82f6" /> Regional Water Situation
                {enriching && <span style={{ fontSize:'0.65rem', color:'#3b82f6', marginLeft:6, display:'flex', alignItems:'center', gap:4 }}><Loader2 size={10} style={{ animation:'spin 1s linear infinite' }}/> Updating…</span>}
              </div>
              <button onClick={() => nav('/admin/hydro-atlas')}
                style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'1px solid var(--border-glass)', color:'var(--text-muted)', borderRadius:6, padding:'4px 10px', fontSize:'0.72rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                <Map size={11}/> Hydro Atlas
              </button>
            </div>
            <div style={{ padding:'16px 18px' }}>
              <RegionalWaterSituation villages={villages} dataMode={dataMode} nav={nav} />
            </div>
          </div>

          {/* ── Groundwater Intelligence ── */}
          <div style={{ ...cardS, padding:0, overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 18px', borderBottom:'1px solid var(--border-glass)', background:'var(--bg-card-hover)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, fontWeight:800, fontSize:'0.88rem' }}>
                <Waves size={15} color="#3b82f6" /> Groundwater Intelligence
              </div>
              <button onClick={() => nav('/admin/groundwater')} style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'1px solid var(--border-glass)', color:'var(--text-muted)', borderRadius:6, padding:'4px 10px', fontSize:'0.72rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                <ExternalLink size={11}/> Explorer
              </button>
            </div>
            <div style={{ padding:'16px 18px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(110px,1fr))', gap:10, marginBottom:14 }}>
                {[
                  { label:'Avg Depth',     val:`${kpis?.avgGW ?? '—'}m bgl`,        color:'#ef4444' },
                  { label:'Annual Change', val:`${kpis?.avgChange !== undefined ? (kpis.avgChange > 0 ? '+' : '') + kpis.avgChange : '—'}m/yr`, color:'#f97316' },
                  { label:'Declining',     val:`${kpis?.declining ?? '—'} districts`, color:'#ef4444' },
                  { label:'Stable',        val:`${villages.filter(v=>v.gwTrend==='STABLE').length} districts`,   color:'#3b82f6' },
                  { label:'Improving',     val:`${kpis?.improving ?? '—'} districts`, color:'#22c55e' },
                ].map(s => (
                  <div key={s.label} style={{ background:'var(--bg-card-hover)', border:'1px solid var(--border-glass)', borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:4 }}>{s.label}</div>
                    <div style={{ fontSize:'0.92rem', fontWeight:800, color:s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>
              {/* Largest declines — from live data */}
              <div>
                <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:8 }}>Largest Annual Declines</div>
                {[...villages].filter(v=>v.gwAnnualChange>0).sort((a,b)=>b.gwAnnualChange-a.gwAnnualChange).slice(0,5).map(v => (
                  <div key={v.id} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background: riskColor(v.droughtRisk), flexShrink:0 }} />
                    <span style={{ fontSize:'0.78rem', flex:1 }}>{v.name}</span>
                    <span style={{ fontSize:'0.78rem', fontWeight:800, color:'#ef4444' }}>+{v.gwAnnualChange}m/yr</span>
                    <div style={{ width:60, height:5, borderRadius:3, background:'var(--border-glass)', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${Math.min(100,(v.gwAnnualChange/2.5)*100)}%`, background:'#ef4444', borderRadius:3 }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Drought Monitor ── */}
          <div style={{ ...cardS, padding:0, overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 18px', borderBottom:'1px solid var(--border-glass)', background:'var(--bg-card-hover)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, fontWeight:800, fontSize:'0.88rem' }}>
                <CloudRain size={15} color="#f97316" /> Drought Monitor
              </div>
              <button onClick={() => nav('/admin/drought')} style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'1px solid var(--border-glass)', color:'var(--text-muted)', borderRadius:6, padding:'4px 10px', fontSize:'0.72rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                <ExternalLink size={11}/> Intelligence
              </button>
            </div>
            <div style={{ padding:'16px 18px' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(120px,1fr))', gap:10, marginBottom:14 }}>
                {[
                  { label:'Regional Risk',     val: kpis && kpis.critical > 0 ? 'CRITICAL' : 'HIGH', color: kpis && kpis.critical > 0 ? '#ef4444' : '#f97316' },
                  { label:'Avg Rainfall Def.', val:`${Math.abs(kpis?.avgRain ?? 0).toFixed(1)}%`,     color:'#f59e0b' },
                  { label:'At-Risk Districts', val:`${(kpis?.critical ?? 0) + (kpis?.highRisk ?? 0)}`, color:'#ef4444' },
                  { label:'Low / Stable',      val:`${villages.filter(v=>v.droughtRisk==='LOW').length}`, color:'#22c55e' },
                ].map(s => (
                  <div key={s.label} style={{ background:'var(--bg-card-hover)', border:`1px solid ${s.color}33`, borderRadius:8, padding:'10px 12px' }}>
                    <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:4 }}>{s.label}</div>
                    <div style={{ fontSize:'0.92rem', fontWeight:800, color:s.color }}>{s.val}</div>
                  </div>
                ))}
              </div>
              {/* Drought bars from live data */}
              <div style={{ fontSize:'0.72rem', fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', letterSpacing:'0.04em', marginBottom:8 }}>Drought Score by District</div>
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {[...villages].sort((a,b)=>b.droughtScore-a.droughtScore).slice(0,6).map(v => (
                  <div key={v.id} style={{ display:'flex', alignItems:'center', gap:8 }}>
                    <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', width:96, flexShrink:0, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{v.name}</span>
                    <div style={{ flex:1, height:7, borderRadius:4, background:'var(--border-glass)', overflow:'hidden' }}>
                      <div style={{ height:'100%', width:`${v.droughtScore}%`, background: riskColor(v.droughtRisk), borderRadius:4, transition:'width 0.4s' }} />
                    </div>
                    <span style={{ fontSize:'0.7rem', fontWeight:800, color: riskColor(v.droughtRisk), width:28, textAlign:'right', flexShrink:0 }}>{v.droughtScore}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Villages Requiring Attention ── */}
          <div style={{ ...cardS, padding:0, overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 18px', borderBottom:'1px solid var(--border-glass)', background:'var(--bg-card-hover)' }}>
              <div style={{ display:'flex', alignItems:'center', gap:7, fontWeight:800, fontSize:'0.88rem' }}>
                <ShieldAlert size={15} color="#ef4444" /> Districts Requiring Attention
              </div>
              <button onClick={() => nav('/admin/villages')} style={{ display:'flex', alignItems:'center', gap:5, background:'none', border:'1px solid var(--border-glass)', color:'var(--text-muted)', borderRadius:6, padding:'4px 10px', fontSize:'0.72rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                <ExternalLink size={11}/> All Districts
              </button>
            </div>
            <div style={{ overflowX:'auto' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:'0.8rem', minWidth:680 }}>
                <thead>
                  <tr style={{ background:'var(--bg-card-hover)', borderBottom:'1px solid var(--border-glass)' }}>
                    {['District','GW Depth','Drought Risk','Water Health','AI Priority','Action'].map((h,i) => (
                      <th key={h} style={{ padding:'10px 14px', textAlign: i>=5 ? 'center':'left', color:'var(--text-muted)', fontWeight:700, fontSize:'0.67rem', textTransform:'uppercase', letterSpacing:'0.04em', whiteSpace:'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {attentionVillages.map((v, i) => {
                    const priority = aiPriorityScore(v);
                    const col = aiActionColor(priority);
                    const analyzeNav = v.droughtRisk === 'CRITICAL' || v.droughtRisk === 'HIGH' ? '/admin/drought' : '/admin/groundwater';
                    return (
                      <tr key={v.id} style={{ borderBottom:'1px solid var(--border-glass)', background: i%2===0 ? 'transparent' : 'var(--bg-card-hover)' }}>
                        <td style={{ padding:'10px 14px' }}>
                          <div style={{ fontWeight:700 }}>{v.name}</div>
                          <div style={{ fontSize:'0.68rem', color:'var(--text-muted)' }}>{v.district}</div>
                        </td>
                        <td style={{ padding:'10px 14px' }}>
                          <div style={{ fontWeight:700, color:'#ef4444' }}>{v.gwDepth}m</div>
                          <div style={{ fontSize:'0.68rem', display:'flex', alignItems:'center', gap:3, color: trendColor(v.gwTrend) }}>{trendIcon(v.gwTrend)}{v.gwTrend}</div>
                        </td>
                        <td style={{ padding:'10px 14px' }}>
                          <Badge text={v.droughtRisk} color={riskColor(v.droughtRisk)} bg={riskBg(v.droughtRisk)} />
                        </td>
                        <td style={{ padding:'10px 14px' }}>
                          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                            <div style={{ width:36, height:5, borderRadius:3, background:'var(--border-glass)', overflow:'hidden' }}>
                              <div style={{ height:'100%', width:`${v.waterHealthScore}%`, background: healthColor(v.waterHealthScore), borderRadius:3 }} />
                            </div>
                            <span style={{ fontWeight:800, fontSize:'0.78rem', color: healthColor(v.waterHealthScore) }}>{v.waterHealthScore}</span>
                          </div>
                        </td>
                        <td style={{ padding:'10px 14px' }}>
                          <div style={{ fontWeight:900, fontSize:'0.88rem', color: col }}>{priority}</div>
                          <div style={{ fontSize:'0.65rem', color:col, opacity:0.8 }}>{aiActionLabel(priority)}</div>
                        </td>
                        <td style={{ padding:'10px 14px' }}>
                          <div style={{ display:'flex', gap:4, justifyContent:'center' }}>
                            <button onClick={() => nav(analyzeNav)} style={{ padding:'4px 9px', borderRadius:5, border:'none', background:'#3b82f6', color:'#fff', fontSize:'0.72rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Analyze</button>
                            <button onClick={() => {
                              sessionStorage.setItem('jalrakshak_prefill_village', JSON.stringify({ id: v.id, name: v.name, district: v.district }));
                              nav('/admin/action-plan');
                            }} style={{ padding:'4px 9px', borderRadius:5, border:'1px solid #3b82f6', background:'transparent', color:'#3b82f6', fontSize:'0.72rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit' }}>Plan</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Quick Actions */}
          <div style={{ ...cardS, padding:0, overflow:'hidden' }}>
            <div style={{ padding:'13px 18px', borderBottom:'1px solid var(--border-glass)', background:'var(--bg-card-hover)', fontWeight:800, fontSize:'0.88rem', display:'flex', alignItems:'center', gap:7 }}>
              <Zap size={15} color="#3b82f6" /> Quick Actions
            </div>
            <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:8 }}>
              {([
                { label:'Create Action Plan',        icon:<ClipboardList size={14}/>, path:'/admin/action-plan',       color:'#3b82f6' },
                { label:'Generate Water Report',     icon:<FileText size={14}/>,      path:'/admin/reports',           color:'#8b5cf6' },
                { label:'Run What-If Simulation',    icon:<FlaskConical size={14}/>,  path:'/admin/what-if',           color:'#f59e0b' },
                { label:'Plan Recharge',             icon:<Hammer size={14}/>,        path:'/admin/recharge-planner',  color:'#22c55e' },
                { label:'Review AI Recommendations', icon:<BrainCircuit size={14}/>,  path:'/admin/approvals',         color:'#3b82f6' },
                { label:'View Critical Districts',   icon:<ShieldAlert size={14}/>,   path:'/admin/villages',          color:'#ef4444' },
              ] as const).map(a => (
                <button key={a.label} onClick={() => nav(a.path)}
                  style={{ display:'flex', alignItems:'center', gap:9, padding:'9px 12px', borderRadius:8, border:`1px solid ${a.color}28`, background:`${a.color}0d`, color: a.color, fontSize:'0.82rem', fontWeight:700, cursor:'pointer', fontFamily:'inherit', textAlign:'left', transition:'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background=`${a.color}20`)}
                  onMouseLeave={e => (e.currentTarget.style.background=`${a.color}0d`)}>
                  {a.icon}{a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Critical Alerts — derived from live data */}
          <div style={{ ...cardS, padding:0, overflow:'hidden' }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'13px 18px', borderBottom:'1px solid var(--border-glass)', background:'var(--bg-card-hover)' }}>
              <div style={{ fontWeight:800, fontSize:'0.88rem', display:'flex', alignItems:'center', gap:7 }}>
                <Bell size={15} color="#ef4444" /> Critical Alerts
                <span style={{ fontSize:'0.65rem', fontWeight:800, color:'#ef4444', background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.28)', borderRadius:10, padding:'1px 7px' }}>
                  {alerts.filter(a=>a.severity==='CRITICAL').length} critical
                </span>
              </div>
            </div>
            <div style={{ padding:'10px 14px', display:'flex', flexDirection:'column', gap:8 }}>
              {alerts.slice(0,4).map(alert => (
                <div key={alert.id} style={{ background:'var(--bg-card-hover)', border:`1px solid ${riskColor(alert.severity)}33`, borderLeft:`3px solid ${riskColor(alert.severity)}`, borderRadius:8, padding:'10px 12px' }}>
                  <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
                    <Badge text={alert.severity} color={riskColor(alert.severity)} bg={riskBg(alert.severity)} />
                    <span style={{ fontSize:'0.72rem', color:'var(--text-muted)' }}>{alert.village}</span>
                  </div>
                  <div style={{ fontSize:'0.75rem', color:'var(--text-main)', lineHeight:1.45, marginBottom:4 }}>
                    {alert.reason.length > 90 ? alert.reason.slice(0,90) + '…' : alert.reason}
                  </div>
                  <div style={{ fontSize:'0.68rem', color:'var(--text-muted)', display:'flex', justifyContent:'space-between' }}>
                    <span>{new Date(alert.date).toLocaleDateString('en-IN',{day:'numeric',month:'short'})}</span>
                    <span>Confidence: <span style={{ color:'#22c55e', fontWeight:700 }}>{alert.confidence}%</span></span>
                  </div>
                </div>
              ))}
              <button onClick={() => nav('/admin/alerts')}
                style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'8px', borderRadius:7, border:'1px solid var(--border-glass)', background:'transparent', color:'var(--text-muted)', fontSize:'0.78rem', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                View All Alerts <ChevronRight size={13}/>
              </button>
            </div>
          </div>

          {/* Regional Summary */}
          <div style={{ ...cardS, padding:0, overflow:'hidden' }}>
            <div style={{ padding:'13px 18px', borderBottom:'1px solid var(--border-glass)', background:'var(--bg-card-hover)', fontWeight:800, fontSize:'0.88rem', display:'flex', alignItems:'center', gap:7 }}>
              <Activity size={15} color="#8b5cf6" /> Regional Summary
            </div>
            <div style={{ padding:'14px 16px', display:'flex', flexDirection:'column', gap:0 }}>
              {[
                { label:'Total Districts',  val: villages.length,                                              color:'#3b82f6' },
                { label:'Critical Risk',    val: villages.filter(v=>v.droughtRisk==='CRITICAL').length,        color:'#ef4444' },
                { label:'High Risk',        val: villages.filter(v=>v.droughtRisk==='HIGH').length,            color:'#f97316' },
                { label:'Medium Risk',      val: villages.filter(v=>v.droughtRisk==='MEDIUM').length,          color:'#f59e0b' },
                { label:'Low / Stable',     val: villages.filter(v=>v.droughtRisk==='LOW').length,             color:'#22c55e' },
                { label:'GW Declining',     val: villages.filter(v=>v.gwTrend==='DECLINING').length,           color:'#ef4444' },
                { label:'GW Stable',        val: villages.filter(v=>v.gwTrend==='STABLE').length,              color:'#3b82f6' },
                { label:'GW Improving',     val: villages.filter(v=>v.gwTrend==='IMPROVING').length,           color:'#22c55e' },
                { label:'Avg Water Health', val:`${kpis?.avgHealth ?? '—'}/100`,                               color: healthColor(kpis?.avgHealth) },
              ].map(row => (
                <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'7px 0', borderBottom:'1px solid var(--border-glass)', fontSize:'0.8rem' }}>
                  <span style={{ color:'var(--text-muted)', fontWeight:600 }}>{row.label}</span>
                  <span style={{ fontWeight:800, color: row.color }}>{row.val}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes fadeInUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }
        @keyframes spin     { from { transform:rotate(0deg); }             to   { transform:rotate(360deg); } }
      `}</style>
    </div>
  );
}
