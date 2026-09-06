import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BrainCircuit, Clock, GitCompare, ClipboardList,
  TrendingDown, TrendingUp, Minus, ChevronRight, X, Info,
  Droplets, CloudRain, AlertTriangle, Activity, Target,
  BarChart2, Shield,
} from 'lucide-react';
import { DashVillage } from '../../pages/admin/AdminDashboard';

// ─────────────────────────────────────────────────────────────────────────────
// EXTENDED VILLAGE TYPE
// ─────────────────────────────────────────────────────────────────────────────
interface VillageExt extends DashVillage {
  aiPriorityScore: number;
  aiAction: string;
  waterDeficit: number;
  rechargePotential: number;
  rechargeCat: string;
  confidence: number;
  recommendedAction: string;
  riskReason: string;
}

function calcAiScore(v: DashVillage): number {
  const gwScore   = Math.min(100, (v.gwDepth / 30) * 40);
  const drScore   = v.droughtScore * 0.35;
  const healthInv = (100 - v.waterHealthScore) * 0.25;
  return Math.round(Math.min(100, gwScore + drScore + healthInv));
}

function aiActionLabel(s: number) {
  return s >= 80 ? 'Immediate Action' : s >= 60 ? 'High Priority' : s >= 40 ? 'Monitor' : 'Stable';
}
function aiActionColor(s: number) {
  return s >= 80 ? '#ef4444' : s >= 60 ? '#f97316' : s >= 40 ? '#f59e0b' : '#22c55e';
}

function buildRiskReason(v: DashVillage): string {
  const p: string[] = [];
  if (v.gwTrend === 'DECLINING') p.push(`groundwater declining at ${v.gwAnnualChange}m/yr`);
  if (v.rainfallAnomaly < -15)   p.push(`rainfall deficit ${Math.abs(v.rainfallAnomaly)}% below 30-yr normal`);
  if (v.droughtScore > 70)       p.push(`drought score ${v.droughtScore}/100 (${v.droughtRisk})`);
  if (v.waterHealthScore < 45)   p.push(`water health critically low at ${v.waterHealthScore}/100`);
  if (!p.length)                 p.push('conditions within acceptable range');
  return p.join('; ').replace(/^./, c => c.toUpperCase()) + '.';
}

function enrichVillage(v: DashVillage): VillageExt {
  const aiPriorityScore   = calcAiScore(v);
  const waterDeficit      = +(v.rainfallAnomaly * -0.12).toFixed(1);
  const rechargePotential = Math.max(5, Math.round(100 - v.gwDepth * 2.5 - (v.rainfallAnomaly < 0 ? Math.abs(v.rainfallAnomaly) * 0.5 : 0)));
  const rechargeCat       = rechargePotential >= 60 ? 'HIGH' : rechargePotential >= 35 ? 'MEDIUM' : 'LOW';
  const confidence        = v.isDemo ? 74 : 82;
  const recommendedAction = aiPriorityScore >= 80
    ? 'Emergency recharge intervention + reduce extraction'
    : aiPriorityScore >= 60
    ? 'Plan check-dam / percolation tank before next kharif'
    : aiPriorityScore >= 40
    ? 'Weekly monitoring; issue crop advisory'
    : 'Maintain current practices; promote water conservation';
  return {
    ...v, aiPriorityScore, aiAction: aiActionLabel(aiPriorityScore),
    waterDeficit, rechargePotential, rechargeCat, confidence,
    recommendedAction, riskReason: buildRiskReason(v),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// LAYER SYSTEM
// ─────────────────────────────────────────────────────────────────────────────
type LayerKey = 'waterHealth' | 'groundwater' | 'drought' | 'waterDeficit' | 'recharge' | 'aiPriority';

const LAYERS: { key: LayerKey; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'waterHealth',  label: 'Water Health',        icon: <Droplets size={12}/>,    color: '#3b82f6' },
  { key: 'groundwater',  label: 'Groundwater Decline', icon: <TrendingDown size={12}/>, color: '#ef4444' },
  { key: 'drought',      label: 'Drought Risk',         icon: <CloudRain size={12}/>,   color: '#f97316' },
  { key: 'waterDeficit', label: 'Water Deficit',        icon: <Activity size={12}/>,    color: '#f59e0b' },
  { key: 'recharge',     label: 'Recharge Potential',   icon: <Target size={12}/>,      color: '#22c55e' },
  { key: 'aiPriority',   label: 'AI Priority',          icon: <BrainCircuit size={12}/>,color: '#8b5cf6' },
];

function layerValue(v: VillageExt, layer: LayerKey): number {
  switch (layer) {
    case 'waterHealth':  return v.waterHealthScore;
    case 'groundwater':  return Math.min(100, (v.gwDepth / 30) * 100);
    case 'drought':      return v.droughtScore;
    case 'waterDeficit': return Math.min(100, Math.abs(v.waterDeficit) * 15);
    case 'recharge':     return v.rechargePotential;
    case 'aiPriority':   return v.aiPriorityScore;
  }
}
function layerInvert(layer: LayerKey) { return layer === 'waterHealth' || layer === 'recharge'; }

function layerColor(v: VillageExt, layer: LayerKey): string {
  const val = layerValue(v, layer);
  const pct = layerInvert(layer) ? (100 - val) : val;
  if (pct >= 78) return '#ef4444';
  if (pct >= 58) return '#f97316';
  if (pct >= 38) return '#f59e0b';
  return '#22c55e';
}

// ─────────────────────────────────────────────────────────────────────────────
// TIME HORIZON
// ─────────────────────────────────────────────────────────────────────────────
type TimeHorizon = 'today' | 'season' | '1year' | '5year';
const TIME_HORIZONS: { key: TimeHorizon; label: string }[] = [
  { key: 'today',  label: 'Today'       },
  { key: 'season', label: 'This Season' },
  { key: '1year',  label: '1 Year'      },
  { key: '5year',  label: '5 Years'     },
];
const TIME_FACTOR: Record<TimeHorizon, number> = { today: 1, season: 1.12, '1year': 1.28, '5year': 1.65 };

function applyTimeFactor(v: VillageExt, t: TimeHorizon): VillageExt {
  const f = TIME_FACTOR[t];
  if (t === 'today') return v;
  const aiPriorityScore  = Math.min(100, Math.round(v.aiPriorityScore * f));
  return {
    ...v,
    gwDepth:            +(v.gwDepth * f).toFixed(1),
    droughtScore:       Math.min(100, Math.round(v.droughtScore * f)),
    waterHealthScore:   Math.max(5, Math.round(v.waterHealthScore / f)),
    rechargePotential:  Math.max(5, Math.round(v.rechargePotential / f)),
    aiPriorityScore,
    aiAction:           aiActionLabel(aiPriorityScore),
    waterDeficit:       +(v.waterDeficit * f).toFixed(1),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GEOGRAPHIC DATA — proper Saurashtra SVG at 800 × 560 viewBox
//
// Coordinate system: x increases east, y increases south.
// Origin roughly aligned to NW corner of the peninsula.
// All paths hand-traced from official district maps at approx. 1:2M scale.
// Labeled "Demo Boundaries — not official GIS data."
// ─────────────────────────────────────────────────────────────────────────────

// Outer Saurashtra peninsula coastline (clockwise from top-left)
const PENINSULA_OUTLINE =
  'M 155,30 L 240,18 L 320,14 L 400,18 L 470,28 L 530,45 L 575,68 ' +
  'L 605,95 L 618,128 L 620,160 L 610,192 L 590,222 L 565,252 ' +
  'L 535,280 L 500,305 L 468,325 L 435,345 L 400,362 L 368,378 ' +
  'L 335,390 L 302,398 L 268,400 L 235,394 L 202,382 L 172,365 ' +
  'L 145,342 L 122,315 L 104,285 L 92,252 L 86,218 L 85,182 ' +
  'L 90,148 L 100,116 L 118,88 L 138,64 Z';

// District polygon data — 11 Saurashtra districts
// Each path is a closed polygon fitting inside the peninsula outline
const DISTRICT_PATHS: { id: string; name: string; labelX: number; labelY: number; path: string }[] = [
  {
    id: 'Morbi',
    name: 'Morbi',
    labelX: 460, labelY: 72,
    path: 'M 330,14 L 420,14 L 475,28 L 520,44 L 510,80 L 488,100 L 458,108 L 425,102 L 395,88 L 368,70 L 345,52 Z',
  },
  {
    id: 'Surendranagar',
    name: 'Surendranagar',
    labelX: 340, labelY: 68,
    path: 'M 240,18 L 330,14 L 345,52 L 368,70 L 395,88 L 380,120 L 355,140 L 325,148 L 295,138 L 268,118 L 248,92 L 238,62 Z',
  },
  {
    id: 'Rajkot',
    name: 'Rajkot',
    labelX: 430, labelY: 158,
    path: 'M 395,88 L 425,102 L 458,108 L 488,100 L 510,80 L 535,90 L 558,115 L 570,148 L 565,180 L 545,202 L 518,215 L 490,218 L 462,210 L 438,192 L 418,170 L 408,148 L 405,122 L 380,120 Z',
  },
  {
    id: 'Jamnagar',
    name: 'Jamnagar',
    labelX: 190, labelY: 140,
    path: 'M 155,30 L 240,18 L 238,62 L 248,92 L 268,118 L 252,148 L 228,168 L 200,178 L 172,172 L 148,155 L 130,130 L 118,102 L 115,72 L 130,50 Z',
  },
  {
    id: 'Devbhumi Dwarka',
    name: 'Devbhumi\nDwarka',
    labelX: 108, labelY: 82,
    path: 'M 100,116 L 118,88 L 138,64 L 155,30 L 130,50 L 115,72 L 118,102 L 106,118 Z',
  },
  {
    id: 'Porbandar',
    name: 'Porbandar',
    labelX: 122, labelY: 195,
    path: 'M 86,182 L 90,148 L 100,116 L 106,118 L 118,102 L 130,130 L 148,155 L 145,182 L 135,210 L 116,228 L 96,225 L 84,210 Z',
  },
  {
    id: 'Junagadh',
    name: 'Junagadh',
    labelX: 218, labelY: 252,
    path: 'M 172,172 L 200,178 L 228,168 L 252,148 L 268,118 L 295,138 L 325,148 L 338,172 L 335,202 L 318,228 L 295,248 L 268,262 L 242,268 L 218,262 L 196,248 L 178,228 L 168,205 L 168,188 Z',
  },
  {
    id: 'Amreli',
    name: 'Amreli',
    labelX: 375, labelY: 255,
    path: 'M 408,148 L 418,170 L 438,192 L 462,210 L 490,218 L 498,248 L 488,275 L 465,292 L 440,298 L 415,290 L 390,272 L 370,248 L 362,222 L 368,198 L 385,178 L 405,162 Z',
  },
  {
    id: 'Bhavnagar',
    name: 'Bhavnagar',
    labelX: 510, labelY: 280,
    path: 'M 518,215 L 545,202 L 565,180 L 590,192 L 610,215 L 618,248 L 615,282 L 600,312 L 578,332 L 552,342 L 525,338 L 500,322 L 488,298 L 488,275 L 498,248 L 490,218 Z',
  },
  {
    id: 'Gir Somnath',
    name: 'Gir Somnath',
    labelX: 310, labelY: 330,
    path: 'M 218,262 L 242,268 L 268,262 L 295,248 L 318,228 L 335,202 L 338,172 L 362,222 L 368,248 L 370,270 L 358,298 L 340,318 L 315,335 L 290,348 L 262,355 L 238,350 L 215,338 L 198,318 L 195,295 L 202,272 Z',
  },
  {
    id: 'Botad',
    name: 'Botad',
    labelX: 420, labelY: 208,
    path: 'M 380,120 L 405,122 L 408,148 L 405,162 L 385,178 L 368,198 L 362,222 L 340,215 L 318,228 L 335,202 L 338,172 L 325,148 L 355,140 L 380,120 Z',
  },
];

// District → village node positions (on the 800×560 canvas)
const NODE_POS: Record<string, { x: number; y: number }> = {
  V001: { x: 432, y: 162 }, // Rajkot
  V002: { x: 228, y: 248 }, // Junagadh
  V003: { x: 380, y: 258 }, // Amreli
  V004: { x: 510, y: 278 }, // Bhavnagar
  V005: { x: 200, y: 148 }, // Jamnagar
  V006: { x: 122, y: 200 }, // Porbandar
  V007: { x: 320, y:  90 }, // Surendranagar
  V008: { x: 450, y:  80 }, // Morbi
  V009: { x: 308, y: 330 }, // Gir Somnath
  V010: { x: 108, y:  90 }, // Devbhumi Dwarka
};

// ─────────────────────────────────────────────────────────────────────────────
// COLOUR HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function riskColor(r?: string) {
  if (!r) return '#64748b';
  switch (r.toUpperCase()) {
    case 'CRITICAL': return '#ef4444';
    case 'HIGH':     return '#f97316';
    case 'MEDIUM':   return '#f59e0b';
    case 'LOW':      return '#22c55e';
    default:         return '#64748b';
  }
}
function healthColor(s?: number) {
  if (s == null) return '#64748b';
  if (s >= 70) return '#22c55e';
  if (s >= 50) return '#f59e0b';
  if (s >= 30) return '#f97316';
  return '#ef4444';
}
function trendColor(t: string) {
  if (t === 'IMPROVING') return '#22c55e';
  if (t === 'STABLE')    return '#3b82f6';
  return '#ef4444';
}
function trendIcon(t: string) {
  if (t === 'IMPROVING') return <TrendingUp size={11}/>;
  if (t === 'STABLE')    return <Minus size={11}/>;
  return <TrendingDown size={11}/>;
}

// ─────────────────────────────────────────────────────────────────────────────
// UI ATOMS
// ─────────────────────────────────────────────────────────────────────────────
function ScoreBar({ val, color }: { val: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${val}%`, background: color, borderRadius: 3, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: '0.72rem', fontWeight: 800, color, minWidth: 28, textAlign: 'right' }}>{val}</span>
    </div>
  );
}

function Badge({ text, color }: { text: string; color: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 20, fontSize: '0.66rem', fontWeight: 800, color, background: `${color}18`, border: `1px solid ${color}33`, whiteSpace: 'nowrap' }}>
      {text}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RISK EXPLAINER
// ─────────────────────────────────────────────────────────────────────────────
function RiskExplainer({ v }: { v: VillageExt }) {
  const items = [
    { tag: 'WHAT',       col: '#3b82f6', text: `${v.name} (${v.district}) — Water Health ${v.waterHealthScore}/100 (${v.waterHealthCat}), AI Priority ${v.aiPriorityScore}.` },
    { tag: 'WHY',        col: '#f97316', text: v.riskReason },
    { tag: 'DATA',       col: '#8b5cf6', text: `GW ${v.gwDepth}m bgl · ${v.gwAnnualChange > 0 ? '+' : ''}${v.gwAnnualChange}m/yr · Rain ${v.rainfallAnomaly > 0 ? '+' : ''}${v.rainfallAnomaly}% · Drought ${v.droughtScore}/100 · Recharge ${v.rechargePotential}/100.` },
    { tag: 'CONFIDENCE', col: '#22c55e', text: `${v.confidence}% — ${v.isDemo ? 'synthetic demo data' : 'official data'}.` },
    { tag: 'ACTION',     col: '#ef4444', text: v.recommendedAction },
  ];
  return (
    <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 10, padding: '12px 14px', marginTop: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 9, fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6' }}>
        <Info size={13} /> Why is this area risky?
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
        {items.map(({ tag, col, text }) => (
          <div key={tag} style={{ display: 'flex', gap: 7, alignItems: 'flex-start', fontSize: '0.76rem', lineHeight: 1.5 }}>
            <span style={{ flexShrink: 0, fontSize: '0.58rem', fontWeight: 900, color: col, background: `${col}18`, border: `1px solid ${col}30`, borderRadius: 3, padding: '2px 5px', marginTop: 1, letterSpacing: '0.04em' }}>{tag}</span>
            <span style={{ color: 'var(--text-main)', opacity: 0.9 }}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// INTELLIGENCE PANEL
// ─────────────────────────────────────────────────────────────────────────────
function IntelPanel({ village, onClose, onAgentTrace, onPlanIntervention }: {
  village: VillageExt;
  onClose: () => void;
  onAgentTrace: (v: VillageExt) => void;
  onPlanIntervention: (v: VillageExt) => void;
}) {
  const [showReason, setShowReason] = useState(false);
  const aiCol = aiActionColor(village.aiPriorityScore);

  const rows: { label: string; val: React.ReactNode }[] = [
    { label: 'Water Health',       val: <span style={{ fontWeight: 800, color: healthColor(village.waterHealthScore) }}>{village.waterHealthScore}/100 — {village.waterHealthCat}</span> },
    { label: 'GW Trend',           val: <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontWeight: 700, color: trendColor(village.gwTrend) }}>{trendIcon(village.gwTrend)} {village.gwTrend} ({village.gwAnnualChange > 0 ? '+' : ''}{village.gwAnnualChange}m/yr)</span> },
    { label: 'GW Depth',           val: <span style={{ fontWeight: 800, color: '#ef4444' }}>{village.gwDepth}m bgl</span> },
    { label: 'Rainfall Anomaly',   val: <span style={{ fontWeight: 700, color: village.rainfallAnomaly < 0 ? '#f59e0b' : '#22c55e' }}>{village.rainfallAnomaly > 0 ? '+' : ''}{village.rainfallAnomaly}%</span> },
    { label: 'Drought Risk',       val: <Badge text={village.droughtRisk} color={riskColor(village.droughtRisk)} /> },
    { label: 'Water Deficit',      val: <span style={{ fontWeight: 700, color: '#f59e0b' }}>{Math.abs(village.waterDeficit)} MCM</span> },
    { label: 'Recharge Potential', val: <span style={{ fontWeight: 700, color: village.rechargePotential >= 60 ? '#22c55e' : village.rechargePotential >= 35 ? '#f59e0b' : '#ef4444' }}>{village.rechargePotential}/100 ({village.rechargeCat})</span> },
    { label: 'AI Priority',        val: <span style={{ fontWeight: 900, fontSize: '1.05rem', color: aiCol }}>{village.aiPriorityScore} — {village.aiAction}</span> },
    { label: 'Recommended Action', val: <span style={{ fontWeight: 600, fontSize: '0.74rem', color: 'var(--text-main)', opacity: 0.9, lineHeight: 1.4 }}>{village.recommendedAction}</span> },
    { label: 'Confidence',         val: <span style={{ fontWeight: 700, color: '#22c55e' }}>{village.confidence}%{village.isDemo ? ' (Demo)' : ''}</span> },
  ];

  return (
    <div style={{ width: 290, flexShrink: 0, background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderLeft: `3px solid ${aiCol}`, borderRadius: 12, display: 'flex', flexDirection: 'column', overflow: 'hidden', animation: 'slideInRight 0.22s ease-out' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '12px 14px 10px', borderBottom: '1px solid var(--border-glass)', background: 'var(--bg-card-hover)' }}>
        <div>
          <div style={{ fontWeight: 900, fontSize: '0.93rem' }}>{village.name}</div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2, display: 'inline-flex', alignItems: 'center', gap: 4 }}>{village.district} · {village.isDemo ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#f59e0b' }}><AlertTriangle size={10} /> Demo Data</span> : 'Official Data'}</div>
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}><X size={15} /></button>
      </div>

      {/* AI Priority banner */}
      <div style={{ margin: '10px 14px 4px', background: `${aiCol}15`, border: `1px solid ${aiCol}40`, borderRadius: 8, padding: '8px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <BrainCircuit size={14} color={aiCol} />
          <span style={{ fontSize: '0.76rem', fontWeight: 800, color: aiCol }}>AI Priority Score</span>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 900, color: aiCol, lineHeight: 1 }}>{village.aiPriorityScore}</div>
          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: aiCol, opacity: 0.85 }}>{village.aiAction}</div>
        </div>
      </div>

      {/* Rows */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '6px 14px 4px' }}>
        {rows.map(({ label, val }) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.76rem', gap: 8 }}>
            <span style={{ color: 'var(--text-muted)', flexShrink: 0, fontWeight: 600, fontSize: '0.7rem', paddingTop: 2 }}>{label}</span>
            <span style={{ textAlign: 'right' }}>{val}</span>
          </div>
        ))}

        <button onClick={() => setShowReason(r => !r)}
          style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 8, background: 'none', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', color: '#3b82f6', fontSize: '0.74rem', fontWeight: 700, width: '100%', justifyContent: 'center' }}>
          <Info size={12} /> {showReason ? 'Hide explanation' : 'Why is this area risky?'}
        </button>
        {showReason && <RiskExplainer v={village} />}
      </div>

      {/* Action buttons */}
      <div style={{ padding: '10px 14px 12px', borderTop: '1px solid var(--border-glass)', display: 'flex', flexDirection: 'column', gap: 7 }}>
        <button onClick={() => onAgentTrace(village)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px', borderRadius: 8, border: '1px solid #8b5cf633', background: '#8b5cf610', color: '#8b5cf6', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', justifyContent: 'center' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#8b5cf625'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#8b5cf610'; }}>
          <BrainCircuit size={14} /> AI Action — Agent Trace
        </button>
        <button onClick={() => onPlanIntervention(village)}
          style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 12px', borderRadius: 8, border: '1px solid #3b82f633', background: '#3b82f610', color: '#3b82f6', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', justifyContent: 'center' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#3b82f625'; }}
          onMouseLeave={e => { e.currentTarget.style.background = '#3b82f610'; }}>
          <ClipboardList size={14} /> Plan Intervention
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPARISON PANEL
// ─────────────────────────────────────────────────────────────────────────────
function ComparePanel({ a, b, onClose }: { a: VillageExt; b: VillageExt; onClose: () => void }) {
  const fields = [
    { label: 'Water Health',       aVal: `${a.waterHealthScore}`, bVal: `${b.waterHealthScore}`, aCol: healthColor(a.waterHealthScore),  bCol: healthColor(b.waterHealthScore) },
    { label: 'GW Depth (m bgl)',   aVal: `${a.gwDepth}`,          bVal: `${b.gwDepth}`,          aCol: '#94a3b8', bCol: '#94a3b8' },
    { label: 'GW Change (m/yr)',   aVal: `+${a.gwAnnualChange}`,  bVal: `+${b.gwAnnualChange}`,  aCol: a.gwAnnualChange > 1 ? '#ef4444' : '#22c55e', bCol: b.gwAnnualChange > 1 ? '#ef4444' : '#22c55e' },
    { label: 'Drought Score',      aVal: `${a.droughtScore}`,     bVal: `${b.droughtScore}`,     aCol: riskColor(a.droughtRisk), bCol: riskColor(b.droughtRisk) },
    { label: 'Rainfall Anomaly',   aVal: `${a.rainfallAnomaly}%`, bVal: `${b.rainfallAnomaly}%`, aCol: a.rainfallAnomaly < 0 ? '#f59e0b' : '#22c55e', bCol: b.rainfallAnomaly < 0 ? '#f59e0b' : '#22c55e' },
    { label: 'Recharge Potential', aVal: `${a.rechargePotential}`,bVal: `${b.rechargePotential}`,aCol: a.rechargePotential > 50 ? '#22c55e' : '#f59e0b', bCol: b.rechargePotential > 50 ? '#22c55e' : '#f59e0b' },
    { label: 'AI Priority',        aVal: `${a.aiPriorityScore}`,  bVal: `${b.aiPriorityScore}`,  aCol: aiActionColor(a.aiPriorityScore), bCol: aiActionColor(b.aiPriorityScore) },
  ];

  return (
    <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 12, padding: '14px 16px', animation: 'fadeInUp 0.2s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 800, fontSize: '0.85rem' }}>
          <GitCompare size={15} color="#3b82f6" /> Compare: {a.name} vs {b.name}
        </div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={14} /></button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 0 }}>
        {['Metric', a.name, b.name].map((h, i) => (
          <div key={h} style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', paddingBottom: 6, borderBottom: '1px solid var(--border-glass)', textAlign: i > 0 ? 'center' : 'left' }}>{h}</div>
        ))}
        {fields.map(f => (
          <React.Fragment key={f.label}>
            <div style={{ padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>{f.label}</div>
            <div style={{ padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.8rem', fontWeight: 800, color: f.aCol, textAlign: 'center' }}>{f.aVal}</div>
            <div style={{ padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)', fontSize: '0.8rem', fontWeight: 800, color: f.bCol, textAlign: 'center' }}>{f.bVal}</div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REGIONAL SITUATION SUMMARY
// ─────────────────────────────────────────────────────────────────────────────
function RegionalSummary({ villages }: { villages: VillageExt[] }) {
  const tiles = [
    { label: 'Critical Zones',     val: villages.filter(v => v.droughtRisk === 'CRITICAL').length,           color: '#ef4444', icon: <AlertTriangle size={14} /> },
    { label: 'Improving Zones',    val: villages.filter(v => v.gwTrend === 'IMPROVING').length,              color: '#22c55e', icon: <TrendingUp size={14} /> },
    { label: 'GW Declining',       val: villages.filter(v => v.gwTrend === 'DECLINING').length,              color: '#f97316', icon: <TrendingDown size={14} /> },
    { label: 'High Water Deficit', val: villages.filter(v => Math.abs(v.waterDeficit) > 1).length,           color: '#f59e0b', icon: <Activity size={14} /> },
  ];
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
      {tiles.map(t => (
        <div key={t.label} style={{ background: 'var(--bg-card-hover)', border: `1px solid ${t.color}28`, borderLeft: `3px solid ${t.color}`, borderRadius: 8, padding: '9px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>{React.cloneElement(t.icon as React.ReactElement, { color: t.color })}<span style={{ fontSize: '0.64rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: 'var(--text-muted)' }}>{t.label}</span></div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: t.color, lineHeight: 1 }}>{t.val}</div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LEGEND
// ─────────────────────────────────────────────────────────────────────────────
function MapLegend({ activeLayer }: { activeLayer: LayerKey }) {
  const layerDef = LAYERS.find(l => l.key === activeLayer)!;
  const positive = layerInvert(activeLayer);
  const stops = positive
    ? [{ col: '#ef4444', label: 'Critical' }, { col: '#f97316', label: 'Poor' }, { col: '#f59e0b', label: 'Moderate' }, { col: '#22c55e', label: 'Good' }]
    : [{ col: '#22c55e', label: 'Low' }, { col: '#f59e0b', label: 'Medium' }, { col: '#f97316', label: 'High' }, { col: '#ef4444', label: 'Critical' }];
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
      <span style={{ fontSize: '0.68rem', fontWeight: 700, color: layerDef.color, display: 'flex', alignItems: 'center', gap: 4 }}>{layerDef.icon} {layerDef.label}</span>
      <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', width: 70 }}>
        {stops.map(s => <div key={s.col} style={{ flex: 1, background: s.col }} />)}
      </div>
      {stops.map(s => (
        <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
          <div style={{ width: 7, height: 7, borderRadius: '50%', background: s.col }} />
          <span style={{ fontSize: '0.64rem', color: 'var(--text-muted)', fontWeight: 600 }}>{s.label}</span>
        </div>
      ))}
      <span style={{ fontSize: '0.61rem', color: 'var(--text-muted)', opacity: 0.65 }}>• outer glow = risk heat · pulse ring = critical · inner circle = AI priority</span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG MAP CANVAS — 800 × 560 viewBox, proper Saurashtra geography
// ─────────────────────────────────────────────────────────────────────────────
function MapCanvas({ villages, layer, selectedId, compareIds, compareMode, onSelect, onCompareAdd }: {
  villages: VillageExt[];
  layer: LayerKey;
  selectedId: string | null;
  compareIds: string[];
  compareMode: boolean;
  onSelect: (v: VillageExt) => void;
  onCompareAdd: (v: VillageExt) => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const VB_W = 700, VB_H = 450;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      <svg
        width="100%"
        viewBox={`0 0 ${VB_W} ${VB_H}`}
        style={{ display: 'block', borderRadius: 12, background: 'linear-gradient(160deg, #080d18 0%, #0a1525 50%, #060e1c 100%)', border: '1px solid rgba(59,130,246,0.18)' }}
      >
        <defs>
          {/* Sea gradient */}
          <radialGradient id="seaGrad" cx="30%" cy="80%" r="70%">
            <stop offset="0%"   stopColor="#0c2a4a" stopOpacity="1" />
            <stop offset="100%" stopColor="#040d18" stopOpacity="1" />
          </radialGradient>

          {/* Land gradient */}
          <linearGradient id="landGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#0f1e32" />
            <stop offset="100%" stopColor="#0a1828" />
          </linearGradient>

          {/* Per-district heat gradients */}
          {villages.map(v => {
            const col = layerColor(v, layer);
            const pos = NODE_POS[v.id];
            if (!pos) return null;
            return (
              <radialGradient key={`hg-${v.id}`} id={`hg-${v.id}`} cx="50%" cy="50%" r="50%">
                <stop offset="0%"   stopColor={col} stopOpacity="0.35" />
                <stop offset="100%" stopColor={col} stopOpacity="0" />
              </radialGradient>
            );
          })}

          {/* Glow filter for critical nodes */}
          <filter id="critGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>

          {/* Subtle shadow for district fills */}
          <filter id="distShadow">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#000" floodOpacity="0.4" />
          </filter>

          {/* CSS animations */}
          <style>{`
            @keyframes cmdPulse {
              0%   { r: 20px; opacity: 0.3; }
              60%  { r: 34px; opacity: 0.08; }
              100% { r: 20px; opacity: 0.3; }
            }
            @keyframes rotateSlow {
              from { transform: rotate(0deg); }
              to   { transform: rotate(360deg); }
            }
            .map-pulse { animation: cmdPulse 2.4s ease-in-out infinite; }
          `}</style>
        </defs>

        {/* ── Sea background ── */}
        <rect width={VB_W} height={VB_H} fill="url(#seaGrad)" />

        {/* ── Graticule / grid lines ── */}
        {[100, 200, 300, 400, 500, 600].map(x => (
          <line key={`vg-${x}`} x1={x} y1={0} x2={x} y2={VB_H}
            stroke="rgba(59,130,246,0.06)" strokeWidth="0.8" strokeDasharray="4 8" />
        ))}
        {[80, 160, 240, 320, 400].map(y => (
          <line key={`hg-${y}`} x1={0} y1={y} x2={VB_W} y2={y}
            stroke="rgba(59,130,246,0.06)" strokeWidth="0.8" strokeDasharray="4 8" />
        ))}

        {/* ── Peninsula land fill (below districts) ── */}
        <path d={PENINSULA_OUTLINE} fill="url(#landGrad)" stroke="rgba(59,130,246,0.2)" strokeWidth="1.2" />

        {/* ── District fills — coloured by active layer ── */}
        {DISTRICT_PATHS.map(d => {
          const v = villages.find(vv => vv.district === d.id);
          const col = v ? layerColor(v, layer) : '#1e3a5f';
          return (
            <path key={d.id} d={d.path}
              fill={`${col}1a`}
              stroke={`${col}55`}
              strokeWidth="1.2"
              filter="url(#distShadow)"
            />
          );
        })}

        {/* ── District name labels ── */}
        {DISTRICT_PATHS.map(d => {
          const lines = d.name.split('\n');
          return lines.map((line, li) => (
            <text key={`${d.id}-l${li}`}
              x={d.labelX} y={d.labelY + li * 11}
              fontSize="8.5" fontWeight="600"
              fill="rgba(148,163,184,0.55)"
              textAnchor="middle"
              style={{ pointerEvents: 'none', fontFamily: 'inherit', letterSpacing: '0.03em' }}>
              {line}
            </text>
          ));
        })}

        {/* ── Heat / glow zones behind each node ── */}
        {villages.map(v => {
          const pos = NODE_POS[v.id];
          if (!pos) return null;
          const score = layerValue(v, layer);
          const intensity = layerInvert(layer) ? (100 - score) : score;
          const rx = 28 + intensity * 0.45;
          const ry = rx * 0.72;
          return (
            <ellipse key={`heat-${v.id}`}
              cx={pos.x} cy={pos.y} rx={rx} ry={ry}
              fill={`url(#hg-${v.id})`}
            />
          );
        })}

        {/* ── Water body labels ── */}
        <text x="62"  y="390" fontSize="10" fontWeight="700" fill="rgba(96,165,250,0.45)" textAnchor="middle" transform="rotate(-20,62,390)">Arabian Sea</text>
        <text x="640" y="390" fontSize="10" fontWeight="700" fill="rgba(96,165,250,0.38)" textAnchor="middle" transform="rotate(-12,640,390)">Gulf of Khambhat</text>
        <text x="95"  y="48"  fontSize="9"  fontWeight="700" fill="rgba(96,165,250,0.38)" textAnchor="middle">Gulf of Kutch</text>

        {/* ── Compass rose (top-right) ── */}
        <g transform="translate(656,42)">
          <circle cx="0" cy="0" r="18" fill="rgba(10,20,40,0.7)" stroke="rgba(59,130,246,0.3)" strokeWidth="1" />
          <polygon points="0,-14 3,-4 0,-8 -3,-4" fill="rgba(239,68,68,0.9)" />
          <polygon points="0,14 3,4 0,8 -3,4" fill="rgba(148,163,184,0.5)" />
          <polygon points="-14,0 -4,-3 -8,0 -4,3" fill="rgba(148,163,184,0.5)" />
          <polygon points="14,0 4,-3 8,0 4,3" fill="rgba(148,163,184,0.5)" />
          <text x="0" y="-16" fontSize="7" fontWeight="900" fill="rgba(239,68,68,0.9)" textAnchor="middle">N</text>
          <text x="0" y="23"  fontSize="6.5" fill="rgba(148,163,184,0.6)" textAnchor="middle">S</text>
          <text x="-19" y="3" fontSize="6.5" fill="rgba(148,163,184,0.6)" textAnchor="middle">W</text>
          <text x="19"  y="3" fontSize="6.5" fill="rgba(148,163,184,0.6)" textAnchor="middle">E</text>
        </g>

        {/* ── Scale bar (bottom-left) ── */}
        <g transform="translate(38,430)">
          <rect x="0" y="0" width="80" height="4" fill="rgba(148,163,184,0.35)" rx="2" />
          <rect x="0" y="0" width="40" height="4" fill="rgba(96,165,250,0.5)" rx="2" />
          <text x="0"  y="-3" fontSize="7" fill="rgba(148,163,184,0.5)">0</text>
          <text x="38" y="-3" fontSize="7" fill="rgba(148,163,184,0.5)">50</text>
          <text x="78" y="-3" fontSize="7" fill="rgba(148,163,184,0.5)">100 km</text>
          <text x="0"  y="14" fontSize="6.5" fill="rgba(245,158,11,0.55)">Demo Boundaries — not official GIS data</text>
        </g>

        {/* ── Village / district nodes ── */}
        {villages.map(v => {
          const pos = NODE_POS[v.id];
          if (!pos) return null;

          const col    = layerColor(v, layer);
          const aiCol  = aiActionColor(v.aiPriorityScore);
          const isHov  = hovered === v.id;
          const isSel  = selectedId === v.id;
          const inCmp  = compareIds.includes(v.id);
          const isCrit = v.droughtRisk === 'CRITICAL' || v.aiPriorityScore >= 80;
          const r      = isHov || isSel ? 15 : 12;

          // tooltip position — flip to left for right-edge nodes
          const tipX = pos.x > 560 ? pos.x - 95 : pos.x - 52;

          return (
            <g key={v.id}
              style={{ cursor: 'pointer' }}
              onMouseEnter={() => setHovered(v.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => compareMode ? onCompareAdd(v) : onSelect(v)}>

              {/* Critical animated pulse ring */}
              {isCrit && (
                <circle
                  cx={pos.x} cy={pos.y} r={20}
                  fill={col}
                  opacity="0.22"
                  className="map-pulse"
                  filter={isCrit ? 'url(#critGlow)' : undefined}
                />
              )}

              {/* Second outer glow ring for high-priority */}
              {v.aiPriorityScore >= 60 && (
                <circle cx={pos.x} cy={pos.y} r={r + 7}
                  fill="none"
                  stroke={col}
                  strokeWidth="1"
                  opacity="0.25"
                  strokeDasharray="3 3"
                />
              )}

              {/* Selection / compare outer ring */}
              {(isSel || inCmp) && (
                <circle cx={pos.x} cy={pos.y} r={r + 6}
                  fill="none"
                  stroke={inCmp ? '#8b5cf6' : '#ffffff'}
                  strokeWidth="2"
                  strokeDasharray={inCmp ? '4 3' : undefined}
                  opacity={0.9}
                />
              )}

              {/* Main disc */}
              <circle cx={pos.x} cy={pos.y} r={r}
                fill={col}
                opacity={isHov || isSel ? 1 : 0.88}
                stroke="rgba(0,0,0,0.45)"
                strokeWidth="0.8"
                filter={isCrit ? 'url(#critGlow)' : undefined}
              />

              {/* AI priority inner ring */}
              <circle cx={pos.x} cy={pos.y} r={r - 4.5}
                fill="rgba(0,0,0,0.3)"
                stroke={aiCol}
                strokeWidth="1.8"
                opacity={0.85}
              />

              {/* Health score inside disc */}
              <text x={pos.x} y={pos.y + 3.5}
                fontSize={isSel || isHov ? '8' : '7'}
                fontWeight="900"
                fill="#ffffff"
                textAnchor="middle"
                style={{ pointerEvents: 'none' }}>
                {v.waterHealthScore}
              </text>

              {/* Name label below (always visible) */}
              <text x={pos.x} y={pos.y + r + 12}
                fontSize="9"
                fontWeight="700"
                fill={isHov || isSel ? col : 'rgba(241,245,249,0.82)'}
                textAnchor="middle"
                style={{ pointerEvents: 'none', letterSpacing: '0.02em' }}>
                {v.name}
              </text>

              {/* AI priority label below name */}
              <text x={pos.x} y={pos.y + r + 23}
                fontSize="7.5"
                fontWeight="700"
                fill={aiCol}
                textAnchor="middle"
                opacity="0.85"
                style={{ pointerEvents: 'none' }}>
                AI {v.aiPriorityScore}
              </text>

              {/* Hover rich tooltip */}
              {isHov && (
                <g>
                  <rect x={tipX} y={pos.y - 52} width={104} height={38} rx="6"
                    fill="rgba(8,13,26,0.96)" stroke={col} strokeWidth="1" />
                  <text x={tipX + 52} y={pos.y - 37} fontSize="9" fontWeight="800"
                    fill={col} textAnchor="middle">{v.name}</text>
                  <text x={tipX + 52} y={pos.y - 26} fontSize="7.5"
                    fill="#94a3b8" textAnchor="middle">{v.district} · {v.droughtRisk}</text>
                  <text x={tipX + 52} y={pos.y - 17} fontSize="7.5" fontWeight="700"
                    fill={aiCol} textAnchor="middle">AI Priority {v.aiPriorityScore} — {v.aiAction}</text>
                </g>
              )}
            </g>
          );
        })}

        {/* ── "Demo data" watermark ── */}
        <text x={VB_W / 2} y={VB_H / 2}
          fontSize="52" fontWeight="900"
          fill="rgba(59,130,246,0.025)"
          textAnchor="middle"
          dominantBaseline="middle"
          transform={`rotate(-25,${VB_W / 2},${VB_H / 2})`}
          style={{ pointerEvents: 'none', userSelect: 'none', letterSpacing: '0.1em' }}>
          DEMO
        </text>
      </svg>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function SaurashtraCommandMap({ villages: rawVillages }: { villages: DashVillage[] }) {
  const nav = useNavigate();

  const allVillages = useMemo(() => rawVillages.map(enrichVillage), [rawVillages]);

  const [activeLayer, setActiveLayer]   = useState<LayerKey>('aiPriority');
  const [timeHorizon, setTimeHorizon]   = useState<TimeHorizon>('today');
  const [selected,    setSelected]      = useState<VillageExt | null>(null);
  const [compareMode, setCompareMode]   = useState(false);
  const [compareIds,  setCompareIds]    = useState<string[]>([]);

  const villages = useMemo(
    () => allVillages.map(v => applyTimeFactor(v, timeHorizon)),
    [allVillages, timeHorizon],
  );

  const handleSelect = useCallback((v: VillageExt) => {
    setSelected(v);
    setCompareMode(false);
  }, []);

  const handleCompareAdd = useCallback((v: VillageExt) => {
    setCompareIds(prev => {
      if (prev.includes(v.id)) return prev.filter(id => id !== v.id);
      if (prev.length >= 2)    return [prev[1], v.id];
      return [...prev, v.id];
    });
  }, []);

  const compareVillages = useMemo(
    () => villages.filter(v => compareIds.includes(v.id)),
    [villages, compareIds],
  );

  const handleAgentTrace       = useCallback(() => nav('/admin/agent-trace'), [nav]);
  const handlePlanIntervention = useCallback((v: VillageExt) => {
    sessionStorage.setItem('jalrakshak_prefill_village', JSON.stringify({ id: v.id, name: v.name, district: v.district }));
    nav('/admin/action-plan');
  }, [nav]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* ── Toolbar ── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
        {/* Layer switcher */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {LAYERS.map(l => {
            const active = activeLayer === l.key;
            return (
              <button key={l.key} onClick={() => setActiveLayer(l.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', background: active ? `${l.color}22` : 'transparent', border: active ? `1px solid ${l.color}66` : '1px solid var(--border-glass)', color: active ? l.color : 'var(--text-muted)' }}>
                {l.icon} {l.label}
              </button>
            );
          })}
        </div>

        {/* Time + Compare controls */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', border: '1px solid var(--border-glass)', borderRadius: 8, overflow: 'hidden' }}>
            {TIME_HORIZONS.map(t => (
              <button key={t.key} onClick={() => setTimeHorizon(t.key)}
                style={{ padding: '5px 10px', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'background 0.15s', background: timeHorizon === t.key ? 'rgba(59,130,246,0.18)' : 'transparent', border: 'none', borderRight: '1px solid var(--border-glass)', color: timeHorizon === t.key ? '#3b82f6' : 'var(--text-muted)' }}>
                {t.label}
              </button>
            ))}
          </div>
          <button onClick={() => { setCompareMode(m => !m); if (compareMode) setCompareIds([]); }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 11px', borderRadius: 8, fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s', background: compareMode ? 'rgba(139,92,246,0.18)' : 'transparent', border: compareMode ? '1px solid rgba(139,92,246,0.5)' : '1px solid var(--border-glass)', color: compareMode ? '#8b5cf6' : 'var(--text-muted)' }}>
            <GitCompare size={12} /> Compare {compareMode ? `(${compareIds.length}/2)` : ''}
          </button>
        </div>
      </div>

      {/* ── Notices ── */}
      {timeHorizon !== 'today' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', fontSize: '0.74rem', color: '#f59e0b', fontWeight: 600 }}>
          <Clock size={12} /> Projected conditions: <strong>{TIME_HORIZONS.find(t => t.key === timeHorizon)?.label}</strong> — trend-extrapolated estimates, not official forecasts.
        </div>
      )}
      {compareMode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 7, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.25)', fontSize: '0.74rem', color: '#8b5cf6', fontWeight: 600 }}>
          <GitCompare size={12} /> Click two districts to compare. Selected: {compareIds.map(id => villages.find(v => v.id === id)?.name).join(', ') || 'none yet'}
        </div>
      )}

      {/* ── Map + Intel panel ── */}
      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 380px', minWidth: 300 }}>
          <MapCanvas
            villages={villages}
            layer={activeLayer}
            selectedId={selected?.id ?? null}
            compareIds={compareIds}
            compareMode={compareMode}
            onSelect={handleSelect}
            onCompareAdd={handleCompareAdd}
          />
          <div style={{ marginTop: 8 }}>
            <MapLegend activeLayer={activeLayer} />
          </div>
        </div>

        {selected && !compareMode && (
          <IntelPanel
            village={selected}
            onClose={() => setSelected(null)}
            onAgentTrace={handleAgentTrace}
            onPlanIntervention={handlePlanIntervention}
          />
        )}
      </div>

      {/* ── Comparison table ── */}
      {compareMode && compareVillages.length === 2 && (
        <ComparePanel a={compareVillages[0]} b={compareVillages[1]} onClose={() => { setCompareMode(false); setCompareIds([]); }} />
      )}

      {/* ── Regional Situation ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
          <Shield size={12} /> Regional Situation
        </div>
        <RegionalSummary villages={villages} />
      </div>

      {/* ── AI Priority ranking ── */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8, fontSize: '0.73rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
          <BarChart2 size={12} /> AI Priority Ranking
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[...villages].sort((a, b) => b.aiPriorityScore - a.aiPriorityScore).map(v => {
            const col = aiActionColor(v.aiPriorityScore);
            const isSel = selected?.id === v.id;
            return (
              <div key={v.id} onClick={() => handleSelect(v)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', borderRadius: 8, cursor: 'pointer', border: `1px solid ${isSel ? col + '55' : 'transparent'}`, background: isSel ? `${col}0d` : 'transparent', transition: 'background 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = `${col}0a`; }}
                onMouseLeave={e => { e.currentTarget.style.background = isSel ? `${col}0d` : 'transparent'; }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: `${col}18`, border: `1.5px solid ${col}40`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <span style={{ fontSize: '1rem', fontWeight: 900, color: col, lineHeight: 1 }}>{v.aiPriorityScore}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, fontSize: '0.83rem' }}>{v.name}</div>
                  <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>{v.district}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 120 }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: col, marginBottom: 3 }}>{v.aiAction}</div>
                  <ScoreBar val={v.aiPriorityScore} color={col} />
                </div>
                <ChevronRight size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
