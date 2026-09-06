import React, { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Zap, Droplets, TrendingUp, TrendingDown, Users, DollarSign,
  BarChart2, CheckCircle, XCircle, AlertTriangle, BrainCircuit,
  ClipboardList, RotateCcw, Save, ChevronRight, Info, Award,
  Activity, Target, Layers, Map as MapIcon, Clock, RefreshCw,
  ThumbsUp, MessageSquare, Shield, Dam, Waves, ArrowDownCircle,
  Pickaxe, Mountain, Wheat, CloudRain, Sprout, Megaphone,
  Hammer, X, Droplet, BarChart3, Check,
} from 'lucide-react';

function renderInterventionIcon(id: string, size = 18) {
  switch (id) {
    case 'check_dam':
      return <Dam size={size} color="#3b82f6" />;
    case 'farm_pond':
      return <Waves size={size} color="#06b6d4" />;
    case 'recharge_well':
      return <ArrowDownCircle size={size} color="#3b82f6" />;
    case 'percolation_tank':
      return <Layers size={size} color="#0284c7" />;
    case 'recharge_pit':
      return <Pickaxe size={size} color="#f59e0b" />;
    case 'contour_trench':
      return <Mountain size={size} color="#10b981" />;
    case 'drip_irrigation':
      return <Wheat size={size} color="#eab308" />;
    case 'sprinkler':
      return <CloudRain size={size} color="#38bdf8" />;
    case 'crop_switch':
      return <Sprout size={size} color="#22c55e" />;
    case 'conservation':
      return <Megaphone size={size} color="#a855f7" />;
    default:
      return <Hammer size={size} color="#3b82f6" />;
  }
}

// ─── DEMO DATA ────────────────────────────────────────────────────────────────

const VILLAGES = [
  { id: 'V001', name: 'Rajkot', district: 'Rajkot', taluka: 'Rajkot', gw: 18.5, drought: 65, health: 43, deficit: -4.8, recharge: 30, demand: 22.4 },
  { id: 'V002', name: 'Amreli_V4', district: 'Amreli', taluka: 'Amreli', gw: 15.2, drought: 58, health: 51, deficit: -3.1, recharge: 38, demand: 18.7 },
  { id: 'V003', name: 'Bhavnagar_V1', district: 'Bhavnagar', taluka: 'Bhavnagar', gw: 20.1, drought: 72, health: 38, deficit: -5.6, recharge: 22, demand: 25.1 },
  { id: 'V004', name: 'Morbi', district: 'Morbi', taluka: 'Morbi', gw: 14.8, drought: 49, health: 55, deficit: -2.4, recharge: 45, demand: 16.2 },
  { id: 'V005', name: 'Junagadh_V2', district: 'Junagadh', taluka: 'Junagadh', gw: 12.3, drought: 41, health: 61, deficit: -1.8, recharge: 52, demand: 14.9 },
  { id: 'V006', name: 'Jamnagar', district: 'Jamnagar', taluka: 'Jamnagar', gw: 16.7, drought: 55, health: 48, deficit: -3.4, recharge: 35, demand: 19.8 },
  { id: 'V007', name: 'Porbandar', district: 'Porbandar', taluka: 'Porbandar', gw: 13.5, drought: 45, health: 58, deficit: -2.1, recharge: 48, demand: 15.5 },
  { id: 'V008', name: 'Surendranagar', district: 'Surendranagar', taluka: 'Surendranagar', gw: 22.4, drought: 78, health: 31, deficit: -7.2, recharge: 18, demand: 28.3 },
];

interface Intervention {
  id: string; label: string; icon: string; desc: string; useCase: string;
  waterBenefit: string; complexity: 'LOW' | 'MEDIUM' | 'HIGH';
  costRange: string; costLakh: number;
  gwFactor: number; droughtFactor: number; waterFactor: number; healthFactor: number;
  households: number; farmers: number; area: number; timeToImpact: string;
  maintenance: 'Low' | 'Medium' | 'High'; category: string;
}

const INTERVENTIONS: Intervention[] = [
  { id: 'check_dam', label: 'Check Dam', icon: '', desc: 'Recharge groundwater through runoff capture.', useCase: 'High runoff potential areas', waterBenefit: 'HIGH', complexity: 'MEDIUM', costRange: '₹15–40 Lakh', costLakh: 20, gwFactor: 1.6, droughtFactor: 17, waterFactor: 18.4, healthFactor: 24, households: 2450, farmers: 620, area: 380, timeToImpact: '6–12 months', maintenance: 'Medium', category: 'Recharge' },
  { id: 'farm_pond', label: 'Farm Pond', icon: '', desc: 'Store rainfall/runoff for irrigation use.', useCase: 'Small farm irrigation storage', waterBenefit: 'MEDIUM-HIGH', complexity: 'LOW', costRange: '₹3–10 Lakh', costLakh: 8, gwFactor: 0.9, droughtFactor: 9, waterFactor: 9.2, healthFactor: 14, households: 980, farmers: 310, area: 160, timeToImpact: '3–6 months', maintenance: 'Low', category: 'Recharge' },
  { id: 'recharge_well', label: 'Recharge Well', icon: '', desc: 'Direct surface water into aquifer.', useCase: 'Urban/peri-urban areas', waterBenefit: 'MEDIUM', complexity: 'LOW', costRange: '₹1–5 Lakh', costLakh: 3, gwFactor: 0.7, droughtFactor: 6, waterFactor: 5.8, healthFactor: 10, households: 580, farmers: 140, area: 80, timeToImpact: '2–4 months', maintenance: 'Low', category: 'Recharge' },
  { id: 'percolation_tank', label: 'Percolation Tank', icon: '', desc: 'Allow slow percolation to recharge groundwater.', useCase: 'Flat terrain with clay soils', waterBenefit: 'MEDIUM', complexity: 'MEDIUM', costRange: '₹8–25 Lakh', costLakh: 15, gwFactor: 1.1, droughtFactor: 11, waterFactor: 11.3, healthFactor: 16, households: 1200, farmers: 380, area: 220, timeToImpact: '6–18 months', maintenance: 'Medium', category: 'Recharge' },
  { id: 'recharge_pit', label: 'Recharge Pit', icon: '', desc: 'Small pits for localized groundwater recharge.', useCase: 'Dispersed farm locations', waterBenefit: 'LOW-MEDIUM', complexity: 'LOW', costRange: '₹0.5–2 Lakh', costLakh: 1, gwFactor: 0.4, droughtFactor: 4, waterFactor: 3.1, healthFactor: 6, households: 280, farmers: 90, area: 45, timeToImpact: '1–3 months', maintenance: 'Low', category: 'Recharge' },
  { id: 'contour_trench', label: 'Contour Trench', icon: '', desc: 'Reduce runoff and improve soil moisture.', useCase: 'Sloped terrain, watershed areas', waterBenefit: 'MEDIUM', complexity: 'MEDIUM', costRange: '₹5–15 Lakh', costLakh: 10, gwFactor: 0.8, droughtFactor: 8, waterFactor: 7.4, healthFactor: 12, households: 720, farmers: 240, area: 200, timeToImpact: '4–8 months', maintenance: 'Low', category: 'Recharge' },
  { id: 'drip_irrigation', label: 'Drip Irrigation', icon: '', desc: 'Reduce agricultural water consumption by 30–50%.', useCase: 'Irrigated crop areas', waterBenefit: 'HIGH', complexity: 'MEDIUM', costRange: '₹8–20 Lakh', costLakh: 12, gwFactor: 0.4, droughtFactor: 12, waterFactor: 15.7, healthFactor: 19, households: 1680, farmers: 520, area: 450, timeToImpact: '1–3 months', maintenance: 'Medium', category: 'Agricultural' },
  { id: 'sprinkler', label: 'Sprinkler Irrigation', icon: '', desc: 'Reduce water use with overhead sprinklers.', useCase: 'Broad-acre crops, medium budget', waterBenefit: 'MEDIUM-HIGH', complexity: 'LOW', costRange: '₹5–12 Lakh', costLakh: 7, gwFactor: 0.3, droughtFactor: 9, waterFactor: 11.2, healthFactor: 14, households: 980, farmers: 340, area: 310, timeToImpact: '1–2 months', maintenance: 'Low', category: 'Agricultural' },
  { id: 'crop_switch', label: 'Crop Switching', icon: '', desc: 'Shift to water-efficient crop varieties.', useCase: 'High water-demand crop villages', waterBenefit: 'MEDIUM', complexity: 'LOW', costRange: '₹1–4 Lakh', costLakh: 2, gwFactor: 0.2, droughtFactor: 7, waterFactor: 8.6, healthFactor: 10, households: 820, farmers: 430, area: 520, timeToImpact: '3–6 months', maintenance: 'Low', category: 'Agricultural' },
  { id: 'conservation', label: 'Water Conservation Campaign', icon: '', desc: 'Community-wide awareness and behavior change.', useCase: 'All village types', waterBenefit: 'LOW-MEDIUM', complexity: 'LOW', costRange: '₹0.5–3 Lakh', costLakh: 1.5, gwFactor: 0.15, droughtFactor: 5, waterFactor: 4.2, healthFactor: 7, households: 2100, farmers: 480, area: 0, timeToImpact: '1–6 months', maintenance: 'Low', category: 'Community' },
];

const SEASONS = ['Kharif', 'Rabi', 'Zaid', 'Annual'];
const HORIZONS = ['6 Months', '1 Year', '2 Years', '5 Years'];

// ─── CALCULATION ENGINE ───────────────────────────────────────────────────────

function calcImpact(village: typeof VILLAGES[0], iv: Intervention, cap: number, area: number, impl: number, budget: number) {
  const f = (impl / 100) * (area / (iv.area || 1)) * Math.min(cap / 10000, 1.2);
  const gwAfter = Math.max(village.gw - iv.gwFactor * f, village.gw * 0.75);
  const droughtAfter = Math.max(village.drought - iv.droughtFactor * f, 20);
  const waterSaved = iv.waterFactor * f;
  const healthAfter = Math.min(village.health + iv.healthFactor * f, 95);
  const deficitAfter = Math.min(village.deficit + waterSaved * 0.6, 0);
  const rechargeAfter = Math.min(village.recharge + 20 * f, 95);
  const costPerMcm = budget / Math.max(waterSaved, 0.1);

  const scores = {
    waterSaving: Math.min(Math.round((waterSaved / village.demand) * 100 * 1.2 + 30), 100),
    gwBenefit: Math.min(Math.round(((village.gw - gwAfter) / village.gw) * 200 + 40), 100),
    droughtReduction: Math.min(Math.round(((village.drought - droughtAfter) / village.drought) * 150 + 35), 100),
    communityBenefit: Math.min(Math.round((iv.households / 3000) * 80 + 30), 100),
    feasibility: iv.complexity === 'LOW' ? 88 : iv.complexity === 'MEDIUM' ? 74 : 58,
    costEffectiveness: Math.min(Math.round(100 - (costPerMcm / 5)), 95),
  };
  const impactScore = Math.round(
    scores.waterSaving * 0.22 + scores.gwBenefit * 0.22 + scores.droughtReduction * 0.18 +
    scores.communityBenefit * 0.15 + scores.feasibility * 0.12 + scores.costEffectiveness * 0.11
  );

  return { gwAfter, droughtAfter, waterSaved, healthAfter, deficitAfter, rechargeAfter, costPerMcm, scores, impactScore };
}

// ─── SUB-COMPONENTS ───────────────────────────────────────────────────────────

const S: Record<string, React.CSSProperties> = {
  card: { background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 10, padding: 20 },
  section: { background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 10, marginBottom: 20 },
  sectionHead: { padding: '16px 20px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: 10 },
  sectionBody: { padding: 20 },
  label: { fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.06em', fontWeight: 700, marginBottom: 4 },
  value: { fontSize: '1.5rem', fontWeight: 800, lineHeight: 1 },
};

function SecHead({ icon, title, badge }: { icon: React.ReactNode; title: string; badge?: React.ReactNode }) {
  return (
    <div style={S.sectionHead}>
      {icon}
      <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>{title}</span>
      {badge}
    </div>
  );
}

function KpiCard({ label, value, sub, color, icon }: { label: string; value: string; sub?: string; color: string; icon: React.ReactNode }) {
  return (
    <div style={{ background: 'var(--bg-card)', border: `1px solid var(--border-glass)`, borderTop: `3px solid ${color}`, borderRadius: 10, padding: '16px 18px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <span style={{ color, opacity: 0.8 }}>{icon}</span>
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 900, color }}>{value}</div>
      {sub && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

function ScoreBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color }}>{score}</span>
      </div>
      <div style={{ height: 6, borderRadius: 3, background: 'var(--border-glass)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${score}%`, borderRadius: 3, background: `linear-gradient(90deg, ${color}88, ${color})`, transition: 'width 0.7s ease' }} />
      </div>
    </div>
  );
}

function CompareRow({ label, before, after, unit = '', betterLow = false }: { label: string; before: number; after: number; unit?: string; betterLow?: boolean }) {
  const improved = betterLow ? after < before : after > before;
  const delta = after - before;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.04)', alignItems: 'center' }}>
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{label}</span>
      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)' }}>{before.toFixed(1)}{unit}</span>
      <span style={{ fontSize: '0.95rem', fontWeight: 700, color: improved ? '#22c55e' : '#f59e0b' }}>{after.toFixed(1)}{unit}</span>
      <span style={{ fontSize: '0.82rem', fontWeight: 700, color: improved ? '#22c55e' : '#f59e0b', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
        {improved ? <TrendingUp size={13} /> : <TrendingDown size={13} />} {Math.abs(delta).toFixed(1)}{unit}
      </span>
    </div>
  );
}

// ─── INLINE SVG CHARTS ────────────────────────────────────────────────────────

function GwTrendChart({ baseline, projected }: { baseline: number; projected: number }) {
  const years = [0, 1, 2, 3, 4];
  const baseY = years.map(y => baseline + y * 0.4);
  const projY = years.map(y => {
    const improvement = (baseline - projected) * (y / 4);
    return baseline - improvement + y * 0.15;
  });
  const minV = Math.min(...baseY, ...projY) - 0.5;
  const maxV = Math.max(...baseY, ...projY) + 0.5;
  const range = maxV - minV;
  const toY = (v: number) => 8 + ((v - minV) / range) * 64;
  const toX = (i: number) => 20 + i * 40;

  const basePts = baseY.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
  const projPts = projY.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');

  return (
    <svg width="200" height="80" viewBox="0 0 200 80" style={{ display: 'block', overflow: 'visible' }}>
      {[minV, (minV + maxV) / 2, maxV].map((v, i) => (
        <text key={i} x={14} y={toY(v) + 3} fontSize={7} fill="var(--text-muted)" textAnchor="end">{v.toFixed(1)}</text>
      ))}
      <polyline points={basePts} fill="none" stroke="#ef4444" strokeWidth={1.8} strokeDasharray="4,2" opacity={0.6} />
      <polyline points={projPts} fill="none" stroke="#22c55e" strokeWidth={2} />
      {projY.map((v, i) => <circle key={i} cx={toX(i)} cy={toY(v)} r={2.5} fill="#22c55e" opacity={i === 4 ? 1 : 0.5} />)}
      <text x={155} y={14} fontSize={7.5} fill="#ef4444" opacity={0.7}>Baseline</text>
      <text x={155} y={24} fontSize={7.5} fill="#22c55e">With IV</text>
    </svg>
  );
}

function WaterBars({ current, saved }: { current: number; saved: number }) {
  const after = current - saved;
  const maxV = current * 1.1;
  const h = 70;
  const toH = (v: number) => Math.max((v / maxV) * h, 2);
  return (
    <svg width="140" height="88" viewBox="0 0 140 88">
      <rect x={10} y={h - toH(current) + 5} width={40} height={toH(current)} fill="#ef4444" opacity={0.7} rx={3} />
      <text x={30} y={h + 18} fontSize={8} fill="var(--text-muted)" textAnchor="middle">Current</text>
      <text x={30} y={h + 26} fontSize={7} fill="#ef4444" textAnchor="middle">{current.toFixed(1)}</text>
      <rect x={60} y={h - toH(after) + 5} width={40} height={toH(after)} fill="#22c55e" opacity={0.7} rx={3} />
      <text x={80} y={h + 18} fontSize={8} fill="var(--text-muted)" textAnchor="middle">After IV</text>
      <text x={80} y={h + 26} fontSize={7} fill="#22c55e" textAnchor="middle">{after.toFixed(1)}</text>
    </svg>
  );
}

function DroughtGauge({ before, after }: { before: number; after: number }) {
  const arc = (val: number, color: string) => {
    const angle = (val / 100) * 180 - 180;
    const rad = (angle * Math.PI) / 180;
    const r = 38;
    const x = 50 + r * Math.cos(rad);
    const y = 50 + r * Math.sin(rad);
    const largeArc = val > 50 ? 1 : 0;
    const startX = 50 - r;
    return `M ${startX} 50 A ${r} ${r} 0 ${largeArc} 1 ${x} ${y}`;
  };
  return (
    <svg width="100" height="60" viewBox="0 0 100 55">
      <path d={`M 12 50 A 38 38 0 0 1 88 50`} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
      <path d={arc(before, '#ef4444')} fill="none" stroke="#ef4444" strokeWidth={8} opacity={0.4} strokeLinecap="round" />
      <path d={arc(after, '#22c55e')} fill="none" stroke="#22c55e" strokeWidth={8} opacity={0.8} strokeLinecap="round" />
      <text x={50} y={45} fontSize={9} fill="var(--text-muted)" textAnchor="middle">{before}→{after}</text>
    </svg>
  );
}

// ─── ACTION PLAN MODAL ────────────────────────────────────────────────────────

function ActionPlanModal({ village, intervention, onClose, onSave }: {
  village: typeof VILLAGES[0]; intervention: Intervention;
  onClose: () => void; onSave: () => void;
}) {
  const [form, setForm] = useState({
    name: `${village.name} ${intervention.label} – Action Plan`,
    owner: 'District Water Officer', priority: 'HIGH',
    budget: intervention.costLakh.toString(), startDate: '2026-10-01',
    targetDate: '2027-03-31', notes: '',
  });
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const fld = (label: string, key: keyof typeof form, type = 'text', opts?: string[]) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      {opts ? (
        <select value={form[key]} onChange={e => set(key, e.target.value)}
          style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', borderRadius: 6, padding: '8px 10px', fontSize: '0.88rem' }}>
          {opts.map(o => <option key={o}>{o}</option>)}
        </select>
      ) : (
        <input type={type} value={form[key]} onChange={e => set(key, e.target.value)}
          style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', borderRadius: 6, padding: '8px 10px', fontSize: '0.88rem', outline: 'none' }} />
      )}
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 12, width: '100%', maxWidth: 520, maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><ClipboardList size={16} color="#3b82f6" /> Create Action Plan</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}>✕</button>
        </div>
        <div style={{ padding: 22 }}>
          <div style={{ background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '10px 14px', marginBottom: 18, fontSize: '0.88rem' }}>
            {intervention.icon} <strong>{intervention.label}</strong> — {village.name}
          </div>
          {fld('Action Plan Name', 'name')}
          {fld('Assigned To', 'owner')}
          {fld('Priority', 'priority', 'text', ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'])}
          {fld('Budget (₹ Lakh)', 'budget')}
          {fld('Start Date', 'startDate', 'date')}
          {fld('Target Date', 'targetDate', 'date')}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4, textTransform: 'uppercase' }}>Notes</div>
            <textarea value={form.notes} onChange={e => set('notes', e.target.value)} rows={3}
              style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', borderRadius: 6, padding: '8px 10px', fontSize: '0.88rem', outline: 'none', resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={onSave} style={{ flex: 1, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
              Create Action Plan
            </button>
            <button onClick={onClose} style={{ flex: 1, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-glass)', borderRadius: 8, padding: '10px', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' }}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── DECISION MODAL ───────────────────────────────────────────────────────────

function DecisionModal({ type, onClose, onConfirm }: { type: 'approve' | 'review' | 'reject'; onClose: () => void; onConfirm: (note: string) => void }) {
  const [note, setNote] = useState('');
  const configs = {
    approve: { title: 'Approve Intervention', color: '#22c55e', btn: 'Approve', placeholder: 'Optional approval note…' },
    review: { title: 'Request Technical Review', color: '#f59e0b', btn: 'Send for Review', placeholder: 'Describe the review required…' },
    reject: { title: 'Reject Intervention', color: '#ef4444', btn: 'Reject', placeholder: 'Reason for rejection (required)…' },
  };
  const cfg = configs[type];
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20 }}>
      <div style={{ background: 'var(--bg-card)', border: `1px solid ${cfg.color}44`, borderRadius: 12, width: '100%', maxWidth: 420 }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-glass)' }}>
          <span style={{ fontWeight: 700, color: cfg.color }}>{cfg.title}</span>
        </div>
        <div style={{ padding: 20 }}>
          <textarea value={note} onChange={e => setNote(e.target.value)} rows={4} placeholder={cfg.placeholder}
            style={{ width: '100%', background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', borderRadius: 6, padding: '10px', fontSize: '0.88rem', outline: 'none', resize: 'vertical', marginBottom: 14 }} />
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={() => onConfirm(note)} style={{ flex: 1, background: cfg.color, color: '#fff', border: 'none', borderRadius: 8, padding: '10px', fontWeight: 700, cursor: 'pointer' }}>{cfg.btn}</button>
            <button onClick={onClose} style={{ flex: 1, background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border-glass)', borderRadius: 8, padding: '10px', cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── SAVED SCENARIOS ──────────────────────────────────────────────────────────

interface SavedScenario {
  id: string; name: string; village: string; intervention: string; score: number; date: string; status: string;
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

export default function InterventionImpact() {
  const nav = useNavigate();

  // selectors
  const [villageId, setVillageId] = useState('V001');
  const [ivId, setIvId] = useState('check_dam');
  const [season, setSeason] = useState('Rabi');
  const [horizon, setHorizon] = useState('1 Year');

  // scenario inputs
  const [capacity, setCapacity] = useState(10000);
  const [area, setArea] = useState(380);
  const [implPct, setImplPct] = useState(100);
  const [budget, setBudget] = useState(20);
  const [rfChange, setRfChange] = useState(0);
  const [extractionPct, setExtractionPct] = useState(0);
  const [efficiencyPct, setEfficiencyPct] = useState(0);

  // ui state
  const [simRun, setSimRun] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [decisionModal, setDecisionModal] = useState<'approve' | 'review' | 'reject' | null>(null);
  const [decisionDone, setDecisionDone] = useState<{ type: string; note: string } | null>(null);
  const [actionPlanCreated, setActionPlanCreated] = useState(false);
  const [savedScenarios, setSavedScenarios] = useState<SavedScenario[]>([
    { id: 's1', name: 'Rajkot Check Dam – Rabi 2026', village: 'Rajkot', intervention: 'Check Dam', score: 86, date: 'Today', status: 'APPROVED' },
    { id: 's2', name: 'Bhavnagar Farm Pond – Kharif', village: 'Bhavnagar_V1', intervention: 'Farm Pond', score: 71, date: 'Yesterday', status: 'UNDER REVIEW' },
  ]);
  const [auditTrail, setAuditTrail] = useState<{ time: string; event: string; actor: string }[]>([
    { time: '08:30', event: 'Scenario created', actor: 'Admin' },
  ]);

  const village = VILLAGES.find(v => v.id === villageId)!;
  const iv = INTERVENTIONS.find(i => i.id === ivId)!;

  const result = calcImpact(village, iv, capacity, area, implPct, budget);

  const impactLabel = result.impactScore >= 80 ? 'HIGH IMPACT' : result.impactScore >= 60 ? 'MODERATE IMPACT' : 'LOW IMPACT';
  const impactColor = result.impactScore >= 80 ? '#22c55e' : result.impactScore >= 60 ? '#f59e0b' : '#ef4444';

  const runSim = () => {
    setSimLoading(true);
    setTimeout(() => {
      setSimRun(true);
      setSimLoading(false);
      setAuditTrail(a => [...a, { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), event: `Simulation run: ${iv.label} @ ${village.name}`, actor: 'Admin' }]);
    }, 1200);
  };

  const doReset = () => {
    setSimRun(false);
    setCapacity(iv.area * 26);
    setArea(iv.area);
    setImplPct(100);
    setBudget(iv.costLakh);
    setRfChange(0);
    setExtractionPct(0);
    setEfficiencyPct(0);
    setDecisionDone(null);
  };

  const saveScenario = () => {
    const sc: SavedScenario = {
      id: `s${Date.now()}`, name: `${village.name} ${iv.label} – ${season}`,
      village: village.name, intervention: iv.label, score: result.impactScore,
      date: 'Just now', status: 'PROPOSED',
    };
    setSavedScenarios(s => [sc, ...s]);
    setAuditTrail(a => [...a, { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), event: `Scenario saved: ${sc.name}`, actor: 'Admin' }]);
    alert(`Scenario "${sc.name}" saved.`);
  };

  const handleDecisionConfirm = (note: string) => {
    if (!decisionModal) return;
    setDecisionDone({ type: decisionModal, note });
    setDecisionModal(null);
    setAuditTrail(a => [...a, {
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      event: decisionModal === 'approve' ? 'Intervention Approved' : decisionModal === 'review' ? 'Technical Review Requested' : 'Intervention Rejected',
      actor: 'Admin',
    }]);
  };

  // comparison table
  const comparisons = INTERVENTIONS.slice(0, 6).map(i => {
    const r = calcImpact(village, i, i.area * 26, i.area, 100, i.costLakh);
    return { ...i, result: r };
  }).sort((a, b) => b.result.impactScore - a.result.impactScore);

  const bestIv = comparisons[0];

  const sel = (style: React.CSSProperties, active: boolean): React.CSSProperties => ({
    ...style,
    border: active ? '2px solid #3b82f6' : '1px solid var(--border-glass)',
    background: active ? 'rgba(59,130,246,0.12)' : 'var(--bg-card)',
  });

  const Btn = ({ onClick, color = '#3b82f6', children, style = {} }: { onClick: () => void; color?: string; children: React.ReactNode; style?: React.CSSProperties }) => (
    <button onClick={onClick} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', background: `${color}22`, color, border: `1px solid ${color}44`, transition: 'all 0.15s', ...style }}>
      {children}
    </button>
  );

  const SliderRow = ({ label, value, min, max, step = 1, unit, onChange }: {
    label: string; value: number; min: number; max: number; step?: number; unit: string; onChange: (v: number) => void;
  }) => (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{label}</span>
        <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#60a5fa' }}>{value > 0 && unit !== '%' ? '' : ''}{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ width: '100%', accentColor: '#3b82f6', cursor: 'pointer' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );

  return (
    <div style={{ color: 'var(--text-main)' }}>
      {/* ── MODALS ── */}
      {showActionModal && (
        <ActionPlanModal village={village} intervention={iv} onClose={() => setShowActionModal(false)} onSave={() => {
          setShowActionModal(false);
          setActionPlanCreated(true);
          setAuditTrail(a => [...a, { time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), event: 'Action Plan Created', actor: 'Admin' }]);
          setTimeout(() => nav('/admin/action-plan'), 1200);
        }} />
      )}
      {decisionModal && (
        <DecisionModal type={decisionModal} onClose={() => setDecisionModal(null)} onConfirm={handleDecisionConfirm} />
      )}

      {/* ── HEADER ── */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 12, padding: '20px 24px', marginBottom: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Zap size={18} color="#60a5fa" />
              </div>
              <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>Intervention Impact & Decision Center</h1>
            </div>
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Compare water interventions and estimate their potential impact before implementation.</p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Btn onClick={doReset} color="var(--text-muted)"><RotateCcw size={13} /> Reset</Btn>
            <Btn onClick={saveScenario} color="#f59e0b"><Save size={13} /> Save Scenario</Btn>
            <Btn onClick={() => setShowActionModal(true)} color="#22c55e" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)' }}><ClipboardList size={13} /> Create Action Plan</Btn>
          </div>
        </div>
        <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.25)', borderRadius: 6, padding: '4px 12px', fontSize: '0.75rem', color: '#eab308', fontWeight: 700 }}>
          <Info size={12} /> DEMONSTRATION DATA — Not official government predictions
        </div>
      </div>

      {actionPlanCreated && (
        <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '10px 16px', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.88rem', color: '#22c55e' }}>
          <CheckCircle size={15} /> Intervention added to Action Plan. Navigating…
        </div>
      )}

      {/* ── SELECTOR BAR ── */}
      <div style={{ ...S.section, marginBottom: 20 }}>
        <SecHead icon={<MapIcon size={16} color="#3b82f6" />} title="Select Area & Scenario" />
        <div style={{ padding: '16px 20px', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          {[
            { label: 'Village', val: villageId, opts: VILLAGES.map(v => ({ v: v.id, l: v.name })), set: (v: string) => { setVillageId(v); setSimRun(false); } },
          ].map(({ label, val, opts, set }) => (
            <div key={label}>
              <div style={S.label}>{label}</div>
              <select value={val} onChange={e => set(e.target.value)}
                style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', borderRadius: 6, padding: '8px 12px', fontSize: '0.88rem', cursor: 'pointer' }}>
                {opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
              </select>
            </div>
          ))}
          <div>
            <div style={S.label}>District</div>
            <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', borderRadius: 6, padding: '8px 12px', fontSize: '0.88rem', color: 'var(--text-muted)', minWidth: 110 }}>{village.district}</div>
          </div>
          <div>
            <div style={S.label}>Season</div>
            <select value={season} onChange={e => setSeason(e.target.value)}
              style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', borderRadius: 6, padding: '8px 12px', fontSize: '0.88rem', cursor: 'pointer' }}>
              {SEASONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <div style={S.label}>Time Horizon</div>
            <select value={horizon} onChange={e => setHorizon(e.target.value)}
              style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', borderRadius: 6, padding: '8px 12px', fontSize: '0.88rem', cursor: 'pointer' }}>
              {HORIZONS.map(h => <option key={h}>{h}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* ── KPI CARDS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: 14, marginBottom: 20 }}>
        <KpiCard label="Water Saved" value={simRun ? `${result.waterSaved.toFixed(1)} MCM` : '—'} sub="Potential annual saving" color="#3b82f6" icon={<Droplets size={18} />} />
        <KpiCard label="Groundwater Benefit" value={simRun ? `+${(village.gw - result.gwAfter).toFixed(1)}m` : '—'} sub="Estimated improvement" color="#06b6d4" icon={<TrendingDown size={18} />} />
        <KpiCard label="Drought Risk Reduction" value={simRun ? `-${(village.drought - result.droughtAfter).toFixed(0)}%` : '—'} sub="Estimated risk reduction" color="#f59e0b" icon={<Activity size={18} />} />
        <KpiCard label="Affected Households" value={simRun ? iv.households.toLocaleString() : '—'} sub="Potentially benefited" color="#a78bfa" icon={<Users size={18} />} />
        <KpiCard label="Estimated Cost" value={`₹${budget} Lakh`} sub="Estimated intervention cost" color="#f97316" icon={<DollarSign size={18} />} />
        <KpiCard label="Impact Score" value={simRun ? `${result.impactScore}/100` : '—'} sub={simRun ? impactLabel : 'Run simulation first'} color={simRun ? impactColor : 'var(--text-muted)'} icon={<Award size={18} />} />
      </div>

      {/* ── INTERVENTION SELECTOR ── */}
      <div style={S.section}>
        <SecHead icon={<Layers size={16} color="#3b82f6" />} title="Select Intervention" />
        <div style={{ padding: '16px 20px' }}>
          {(['Recharge', 'Agricultural', 'Community'] as const).map(cat => (
            <div key={cat} style={{ marginBottom: 16 }}>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{cat}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 10 }}>
                {INTERVENTIONS.filter(i => i.category === cat).map(i => (
                  <div key={i.id} onClick={() => { setIvId(i.id); setCapacity(i.area * 26); setArea(i.area); setBudget(i.costLakh); setSimRun(false); }}
                    style={sel({ borderRadius: 9, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.15s' }, ivId === i.id)}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
                      <span style={{ fontSize: '1.3rem' }}>{i.icon}</span>
                      <span style={{ fontSize: '0.68rem', fontWeight: 700, background: i.complexity === 'LOW' ? 'rgba(34,197,94,0.15)' : i.complexity === 'MEDIUM' ? 'rgba(245,158,11,0.15)' : 'rgba(239,68,68,0.15)', color: i.complexity === 'LOW' ? '#22c55e' : i.complexity === 'MEDIUM' ? '#f59e0b' : '#ef4444', borderRadius: 4, padding: '2px 7px' }}>{i.complexity}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 3 }}>{i.label}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 6 }}>{i.desc}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      <span>💧 {i.waterBenefit}</span>
                      <span>{i.costRange}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── SCENARIO BUILDER ── */}
      <div style={S.section}>
        <SecHead icon={<Target size={16} color="#f59e0b" />} title={`Build Scenario — ${iv.label}`} />
        <div style={{ padding: 20, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <div>
            <div style={{ marginBottom: 4, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Intervention Parameters</div>
            <div style={{ background: 'var(--bg-dark)', borderRadius: 8, padding: '14px 16px' }}>
              <SliderRow label="Capacity (m³)" value={capacity} min={1000} max={50000} step={500} unit=" m³" onChange={setCapacity} />
              <SliderRow label="Area Covered (ha)" value={area} min={10} max={1000} step={10} unit=" ha" onChange={setArea} />
              <SliderRow label="Implementation %" value={implPct} min={10} max={100} unit="%" onChange={setImplPct} />
              <SliderRow label="Budget (₹ Lakh)" value={budget} min={1} max={100} unit="L" onChange={setBudget} />
            </div>
          </div>
          <div>
            <div style={{ marginBottom: 4, fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>What-If Controls</div>
            <div style={{ background: 'var(--bg-dark)', borderRadius: 8, padding: '14px 16px' }}>
              <SliderRow label="Rainfall Change" value={rfChange} min={-30} max={30} unit="%" onChange={setRfChange} />
              <SliderRow label="Extraction Reduction" value={extractionPct} min={-20} max={50} unit="%" onChange={setExtractionPct} />
              <SliderRow label="Irrigation Efficiency Gain" value={efficiencyPct} min={0} max={50} unit="%" onChange={setEfficiencyPct} />
            </div>
          </div>
        </div>
        <div style={{ padding: '0 20px 20px', display: 'flex', justifyContent: 'center' }}>
          <button onClick={runSim} disabled={simLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 9, padding: '12px 36px', fontWeight: 700, fontSize: '1rem', cursor: simLoading ? 'wait' : 'pointer', opacity: simLoading ? 0.7 : 1, transition: 'all 0.2s' }}>
            {simLoading ? <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Zap size={16} />}
            {simLoading ? 'Running Simulation…' : 'Run Impact Simulation'}
          </button>
        </div>
      </div>

      {/* ── BEFORE / AFTER ── */}
      <div style={S.section}>
        <SecHead icon={<BarChart2 size={16} color="#3b82f6" />} title="Current vs After Intervention (Estimated)" badge={
          !simRun ? <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 8 }}>Run simulation to see projections</span> : null
        } />
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 12, padding: '10px 16px', borderBottom: '1px solid var(--border-glass)' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Metric</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Current</span>
            <span style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: 700, textTransform: 'uppercase' }}>After Intervention</span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase' }}>Change</span>
          </div>
          <CompareRow label="Water Health Score" before={village.health} after={simRun ? result.healthAfter : village.health} unit="" />
          <CompareRow label="Groundwater (m bgl)" before={village.gw} after={simRun ? result.gwAfter : village.gw} unit="m" betterLow />
          <CompareRow label="Drought Risk Score" before={village.drought} after={simRun ? result.droughtAfter : village.drought} unit="" betterLow />
          <CompareRow label="Water Deficit (MCM)" before={village.deficit} after={simRun ? result.deficitAfter : village.deficit} unit=" MCM" betterLow />
          <CompareRow label="Recharge Potential" before={village.recharge} after={simRun ? result.rechargeAfter : village.recharge} unit="%" />
          <div style={{ padding: '10px 16px', fontSize: '0.75rem', color: 'var(--border-glass)' }}>
            ⓘ Estimated impact — model projections, not guaranteed outcomes. Confidence: {simRun ? '84%' : 'N/A'}
          </div>
        </div>
      </div>

      {/* ── IMPACT ANALYSIS ROW ── */}
      {simRun && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: 16, marginBottom: 20 }}>
          {/* Impact Score */}
          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Award size={16} color="#f59e0b" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Intervention Impact Score</span>
            </div>
            <div style={{ textAlign: 'center', marginBottom: 14 }}>
              <div style={{ fontSize: '3rem', fontWeight: 900, color: impactColor, lineHeight: 1 }}>{result.impactScore}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 2 }}>out of 100</div>
              <span style={{ display: 'inline-block', background: `${impactColor}22`, color: impactColor, border: `1px solid ${impactColor}44`, borderRadius: 20, padding: '3px 12px', fontSize: '0.78rem', fontWeight: 800 }}>{impactLabel}</span>
            </div>
            <ScoreBar label="Water Saving" score={result.scores.waterSaving} color="#3b82f6" />
            <ScoreBar label="Groundwater Benefit" score={result.scores.gwBenefit} color="#06b6d4" />
            <ScoreBar label="Drought Reduction" score={result.scores.droughtReduction} color="#f59e0b" />
            <ScoreBar label="Community Benefit" score={result.scores.communityBenefit} color="#a78bfa" />
            <ScoreBar label="Feasibility" score={result.scores.feasibility} color="#22c55e" />
            <ScoreBar label="Cost Effectiveness" score={result.scores.costEffectiveness} color="#f97316" />
          </div>

          {/* Water Benefit */}
          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Droplets size={16} color="#3b82f6" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Water Benefit (Model Estimate)</span>
            </div>
            <WaterBars current={village.demand} saved={result.waterSaved} />
            <div style={{ marginTop: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Water Saved</span>
                <span style={{ color: '#3b82f6', fontWeight: 700 }}>{result.waterSaved.toFixed(1)} MCM/yr</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Demand Reduction</span>
                <span style={{ color: '#22c55e', fontWeight: 700 }}>{((result.waterSaved / village.demand) * 100).toFixed(0)}%</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Annual Benefit</span>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>₹{(result.waterSaved * 0.45).toFixed(1)} Cr est.</span>
              </div>
            </div>
          </div>

          {/* GW + Drought */}
          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <TrendingDown size={16} color="#06b6d4" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Groundwater & Drought Impact</span>
            </div>
            <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
              <GwTrendChart baseline={village.gw} projected={result.gwAfter} />
              <DroughtGauge before={village.drought} after={result.droughtAfter} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>GW Improvement</span>
              <span style={{ color: '#22c55e', fontWeight: 700 }}>+{(village.gw - result.gwAfter).toFixed(1)}m projected</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Drought Reduction</span>
              <span style={{ color: '#f59e0b', fontWeight: 700 }}>−{(village.drought - result.droughtAfter).toFixed(0)} pts projected</span>
            </div>
            <div style={{ marginTop: 8, fontSize: '0.75rem', color: 'var(--border-glass)' }}>Estimated drought risk reduction is primarily associated with improved recharge and water availability.</div>
          </div>
        </div>
      )}

      {/* ── COMMUNITY & COST ── */}
      {simRun && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {/* Community Impact */}
          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Users size={16} color="#a78bfa" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Community Impact</span>
            </div>
            {[
              { l: 'Households Benefited', v: iv.households.toLocaleString(), c: '#a78bfa' },
              { l: 'Farmers Benefited', v: iv.farmers.toLocaleString(), c: '#3b82f6' },
              { l: 'Agricultural Area', v: `${iv.area} ha`, c: '#22c55e' },
              { l: 'Expected Water Availability', v: `+${((result.waterSaved / village.demand) * 100).toFixed(0)}%`, c: '#06b6d4' },
            ].map(({ l, v, c }) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{l}</span>
                <span style={{ fontWeight: 700, color: c }}>{v}</span>
              </div>
            ))}
          </div>

          {/* Cost vs Benefit */}
          <div style={S.card}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <DollarSign size={16} color="#f97316" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Cost vs Expected Benefit</span>
            </div>
            {[
              { l: 'Estimated Cost', v: `₹${budget} Lakh`, c: '#f97316' },
              { l: 'Water Benefit', v: `${result.waterSaved.toFixed(1)} MCM/yr`, c: '#3b82f6' },
              { l: 'Cost per MCM', v: `₹${result.costPerMcm.toFixed(2)}L/MCM`, c: '#f59e0b' },
              { l: 'Groundwater Benefit', v: `+${(village.gw - result.gwAfter).toFixed(1)}m`, c: '#06b6d4' },
              { l: 'Households Benefited', v: iv.households.toLocaleString(), c: '#a78bfa' },
              { l: 'Time to Impact', v: iv.timeToImpact, c: 'var(--text-muted)' },
              { l: 'Maintenance', v: iv.maintenance, c: 'var(--text-muted)' },
              { l: 'Cost Effectiveness', v: result.scores.costEffectiveness >= 70 ? 'HIGH' : result.scores.costEffectiveness >= 45 ? 'MEDIUM' : 'LOW', c: result.scores.costEffectiveness >= 70 ? '#22c55e' : result.scores.costEffectiveness >= 45 ? '#f59e0b' : '#ef4444' },
            ].map(({ l, v, c }) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{l}</span>
                <span style={{ fontWeight: 700, color: c, fontSize: '0.88rem' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── COMPARISON TABLE ── */}
      <div style={S.section}>
        <SecHead icon={<BarChart2 size={16} color="#3b82f6" />} title="Compare Interventions" />
        <div style={{ overflowX: 'auto', padding: '0 0 4px' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem' }}>
            <thead>
              <tr style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid var(--border-glass)' }}>
                {['#', 'Intervention', 'Cost', 'Water Saving', 'GW Benefit', 'Drought ↓', 'Households', 'Feasibility', 'Score', 'Select'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisons.map((i, idx) => {
                const isSelected = i.id === ivId;
                return (
                  <tr key={i.id} onClick={() => { setIvId(i.id); setCapacity(i.area * 26); setArea(i.area); setBudget(i.costLakh); setSimRun(false); }}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: isSelected ? 'rgba(59,130,246,0.08)' : 'transparent', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.05)')}
                    onMouseLeave={e => (e.currentTarget.style.background = isSelected ? 'rgba(59,130,246,0.08)' : 'transparent')}>
                    <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{idx + 1}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontWeight: 700 }}>{i.icon} {i.label}</span>
                      {idx === 0 && <span style={{ marginLeft: 6, fontSize: '0.65rem', background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 4, padding: '1px 5px', fontWeight: 800 }}>BEST</span>}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#f97316', fontWeight: 700 }}>₹{i.costLakh}L</td>
                    <td style={{ padding: '10px 14px', color: '#3b82f6', fontWeight: 700 }}>{i.result.waterSaved.toFixed(1)} MCM</td>
                    <td style={{ padding: '10px 14px', color: '#06b6d4', fontWeight: 700 }}>+{(village.gw - i.result.gwAfter).toFixed(1)}m</td>
                    <td style={{ padding: '10px 14px', color: '#f59e0b', fontWeight: 700 }}>−{(village.drought - i.result.droughtAfter).toFixed(0)}pts</td>
                    <td style={{ padding: '10px 14px', color: '#a78bfa' }}>{i.households.toLocaleString()}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 700, color: i.complexity === 'LOW' ? '#22c55e' : i.complexity === 'MEDIUM' ? '#f59e0b' : '#ef4444' }}>{i.complexity === 'LOW' ? 'HIGH' : i.complexity === 'MEDIUM' ? 'MEDIUM' : 'LOW'}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontWeight: 800, color: i.result.impactScore >= 80 ? '#22c55e' : i.result.impactScore >= 60 ? '#f59e0b' : '#ef4444' }}>{i.result.impactScore}/100</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {isSelected
                        ? <span style={{ fontSize: '0.72rem', color: '#3b82f6', fontWeight: 800 }}>SELECTED</span>
                        : <button onClick={e => { e.stopPropagation(); setIvId(i.id); setCapacity(i.area * 26); setArea(i.area); setBudget(i.costLakh); setSimRun(false); }} style={{ fontSize: '0.75rem', background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 5, padding: '4px 10px', cursor: 'pointer', fontWeight: 700 }}>Select</button>}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── AI RECOMMENDATION ── */}
      <div style={S.section}>
        <SecHead icon={<Award size={16} color="#f59e0b" />} title="AI Recommended Intervention" badge={
          <span style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)' }}>Powered by JalRakshak Multi-Agent System</span>
        } />
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
            <div style={{ flex: '0 0 auto', textAlign: 'center', background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '18px 24px' }}>
              <div style={{ fontSize: '2.2rem', marginBottom: 4 }}>{bestIv.icon}</div>
              <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 2 }}>{bestIv.label}</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#22c55e' }}>{bestIv.result.impactScore}/100</div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Impact Score</div>
            </div>
            <div style={{ flex: 1, minWidth: 260 }}>
              <div style={{ fontWeight: 700, color: '#f59e0b', marginBottom: 10 }}>Why is this recommended?</div>
              <ul style={{ margin: 0, paddingLeft: 18, color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 2 }}>
                <li>High recharge potential for the selected village conditions</li>
                <li>Significant groundwater benefit: +{(village.gw - bestIv.result.gwAfter).toFixed(1)}m estimated</li>
                <li>High community benefit — {bestIv.households.toLocaleString()} households potentially affected</li>
                <li>Suitable for current water stress and deficit conditions</li>
                <li>Strong drought resilience potential (−{(village.drought - bestIv.result.droughtAfter).toFixed(0)} pts estimated)</li>
              </ul>

              {/* Agent trace visualization */}
              <div style={{ marginTop: 14, background: 'var(--bg-dark)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase' }}>Multi-Agent Analysis Flow</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
                  {['Groundwater Agent', 'Drought Agent', 'Water Budget Agent', 'Recharge Agent', 'Crop Agent', 'Community Agent', 'AI Orchestrator', 'IBM Granite'].map((agent, i, arr) => (
                    <React.Fragment key={agent}>
                      <span style={{ fontSize: '0.72rem', background: 'rgba(59,130,246,0.12)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 4, padding: '3px 8px' }}>{agent}</span>
                      {i < arr.length - 1 && <ChevronRight size={12} color="var(--border-glass)" />}
                    </React.Fragment>
                  ))}
                </div>
                <button onClick={() => nav('/admin/agent-trace')} style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#3b82f6', background: 'none', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontWeight: 700 }}>
                  <BrainCircuit size={13} /> View Agent Trace
                </button>
              </div>
            </div>

            {/* Confidence */}
            <div style={{ flex: '0 0 auto', background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', borderRadius: 10, padding: '16px 18px', minWidth: 180 }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 10 }}>AI Confidence</div>
              <div style={{ fontSize: '2.2rem', fontWeight: 900, color: '#22c55e', marginBottom: 4 }}>84%</div>
              <ScoreBar label="Data Quality" score={82} color="#3b82f6" />
              <ScoreBar label="Model Agreement" score={86} color="#22c55e" />
              <ScoreBar label="Data Freshness" score={78} color="#f59e0b" />
              <ScoreBar label="Historical Evidence" score={88} color="#a78bfa" />
              <div style={{ marginTop: 8, fontSize: '0.72rem', color: 'var(--border-glass)', lineHeight: 1.5 }}>Confidence indicates data reliability. It does not guarantee the actual future outcome.</div>
            </div>
          </div>

          {/* AI Explanation */}
          <div style={{ marginTop: 16, background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 8, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <BrainCircuit size={20} color="#3b82f6" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <div style={{ fontWeight: 700, color: '#3b82f6', marginBottom: 5, fontSize: '0.88rem' }}>AI Explanation (IBM Granite)</div>
              <div style={{ color: '#cbd5e1', fontSize: '0.88rem', lineHeight: 1.7 }}>
                The <strong>{bestIv.label}</strong> is recommended for {village.name} because the selected village has high runoff potential,
                declining groundwater ({village.gw}m bgl), and an elevated water deficit of {village.deficit} MCM.
                The simulated intervention could improve recharge to an estimated {bestIv.result.rechargeAfter.toFixed(0)}%,
                reduce seasonal water stress, and benefit approximately {bestIv.households.toLocaleString()} households.
                These are model-estimated projections — actual outcomes depend on site-specific conditions.
              </div>
              <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {['Groundwater', 'Rainfall', 'Water Demand', 'Recharge Potential', 'Drought Risk', 'Agricultural Area'].map(d => (
                  <span key={d} style={{ fontSize: '0.68rem', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 4, padding: '2px 8px' }}>📊 {d}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── IMPLEMENTATION PLAN ── */}
      <div style={S.section}>
        <SecHead icon={<Clock size={16} color="#22c55e" />} title="Suggested Implementation Plan" />
        <div style={{ padding: 20 }}>
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto', paddingBottom: 8 }}>
            {[
              { phase: 1, label: 'Field Assessment', duration: 'Wk 1–2', color: '#3b82f6' },
              { phase: 2, label: 'Technical Validation', duration: 'Wk 3–4', color: '#8b5cf6' },
              { phase: 3, label: 'Community Approval', duration: 'Wk 5–6', color: '#06b6d4' },
              { phase: 4, label: 'Construction', duration: iv.timeToImpact, color: '#f59e0b' },
              { phase: 5, label: 'Monitoring', duration: 'Ongoing', color: '#22c55e' },
              { phase: 6, label: 'Impact Evaluation', duration: '6m later', color: '#10b981' },
            ].map((p, i) => (
              <div key={p.phase} style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ textAlign: 'center', minWidth: 100 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: `${p.color}22`, border: `2px solid ${p.color}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.82rem', fontWeight: 800, color: p.color, margin: '0 auto 6px' }}>{p.phase}</div>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, marginBottom: 2 }}>{p.label}</div>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{p.duration}</div>
                </div>
                {i < 5 && <div style={{ width: 30, height: 2, background: 'rgba(255,255,255,0.08)', flexShrink: 0 }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── ASSUMPTIONS + RISKS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><Info size={15} color="#3b82f6" /><span style={{ fontWeight: 700, fontSize: '0.92rem' }}>Simulation Assumptions</span></div>
          {['Annual rainfall remains within selected scenario range.', 'Intervention operates at estimated capacity.', 'No major land-use change occurs.', 'Agricultural demand follows current assumptions.', 'Recharge response follows the selected model assumptions.'].map((a, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <span style={{ color: '#3b82f6', flexShrink: 0 }}>•</span>{a}
            </div>
          ))}
        </div>
        <div style={S.card}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}><AlertTriangle size={15} color="#f59e0b" /><span style={{ fontWeight: 700, fontSize: '0.92rem' }}>Risks & Limitations</span></div>
          {['Actual recharge may vary by soil and geology.', 'Construction feasibility requires field assessment.', 'Rainfall variability may change outcomes.', 'Cost estimates are indicative only.', 'Simulation results are not guarantees.'].map((r, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 6, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              <span style={{ color: '#f59e0b', flexShrink: 0 }}>⚠</span>{r}
            </div>
          ))}
        </div>
      </div>

      {/* ── SAVED SCENARIOS ── */}
      <div style={S.section}>
        <SecHead icon={<Save size={16} color="var(--text-muted)" />} title="Saved Scenarios" />
        <div style={{ padding: 20, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
          {savedScenarios.map(sc => (
            <div key={sc.id} style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', borderRadius: 9, padding: '14px 16px', minWidth: 210 }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', marginBottom: 4 }}>{sc.name}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: 8 }}>{sc.village} · {sc.intervention}</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 800, color: '#22c55e', fontSize: '0.9rem' }}>{sc.score}/100</span>
                <span style={{ fontSize: '0.68rem', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 4, padding: '2px 7px' }}>{sc.status}</span>
              </div>
              <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                <button style={{ flex: 1, fontSize: '0.72rem', background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 5, padding: '4px 0', cursor: 'pointer', fontWeight: 700 }}>View</button>
                <button style={{ flex: 1, fontSize: '0.72rem', background: 'rgba(100,116,139,0.1)', color: 'var(--text-muted)', border: '1px solid rgba(100,116,139,0.2)', borderRadius: 5, padding: '4px 0', cursor: 'pointer' }}>Duplicate</button>
                <button onClick={() => setSavedScenarios(s => s.filter(x => x.id !== sc.id))} style={{ flex: 1, fontSize: '0.72rem', background: 'rgba(239,68,68,0.08)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 5, padding: '4px 0', cursor: 'pointer' }}>Delete</button>
              </div>
            </div>
          ))}
          {savedScenarios.length === 0 && <div style={{ color: 'var(--border-glass)', fontSize: '0.85rem' }}>No saved scenarios yet.</div>}
        </div>
      </div>

      {/* ── AUDIT TRAIL ── */}
      <div style={S.section}>
        <SecHead icon={<Shield size={16} color="var(--text-muted)" />} title="Audit Trail" />
        <div style={{ padding: 20 }}>
          {auditTrail.slice().reverse().map((e, i) => (
            <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 8, fontSize: '0.82rem', alignItems: 'flex-start' }}>
              <span style={{ color: 'var(--border-glass)', flexShrink: 0, minWidth: 45 }}>{e.time}</span>
              <span style={{ color: 'var(--text-muted)' }}>{e.event}</span>
              <span style={{ color: 'var(--text-muted)', marginLeft: 'auto', flexShrink: 0 }}>{e.actor}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── ADMINISTRATOR DECISION ── */}
      <div style={{ ...S.card, marginBottom: 20, border: '1px solid rgba(59,130,246,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <Shield size={16} color="#3b82f6" />
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>Administrator Decision</span>
          {decisionDone && (
            <span style={{ marginLeft: 10, fontSize: '0.78rem', fontWeight: 800, color: decisionDone.type === 'approve' ? '#22c55e' : decisionDone.type === 'review' ? '#f59e0b' : '#ef4444', background: decisionDone.type === 'approve' ? 'rgba(34,197,94,0.1)' : decisionDone.type === 'review' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)', border: `1px solid ${decisionDone.type === 'approve' ? 'rgba(34,197,94,0.3)' : decisionDone.type === 'review' ? 'rgba(245,158,11,0.3)' : 'rgba(239,68,68,0.3)'}`, borderRadius: 6, padding: '3px 10px' }}>
              {decisionDone.type === 'approve' ? '✓ APPROVED' : decisionDone.type === 'review' ? '⟳ UNDER REVIEW' : '✗ REJECTED'}
            </span>
          )}
        </div>
        {decisionDone?.note && <div style={{ marginBottom: 14, fontSize: '0.82rem', color: 'var(--text-muted)', background: 'var(--bg-dark)', borderRadius: 6, padding: '8px 12px' }}>Note: {decisionDone.note}</div>}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={() => setDecisionModal('approve')} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(34,197,94,0.15)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.35)', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
            <ThumbsUp size={15} /> Approve
          </button>
          <button onClick={() => setDecisionModal('review')} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(245,158,11,0.12)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
            <MessageSquare size={15} /> Request Technical Review
          </button>
          <button onClick={() => setDecisionModal('reject')} style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'rgba(239,68,68,0.1)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem' }}>
            <XCircle size={15} /> Reject
          </button>
          <button onClick={() => setShowActionModal(true)} style={{ display: 'flex', alignItems: 'center', gap: 7, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 20px', fontWeight: 700, cursor: 'pointer', fontSize: '0.9rem', marginLeft: 'auto' }}>
            <ClipboardList size={15} /> Add to Action Plan
          </button>
        </div>
      </div>
    </div>
  );
}
