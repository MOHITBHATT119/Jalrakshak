import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MapPin, Plus, Search, RefreshCw, Eye, Pencil, Trash2,
  X, AlertCircle, CheckCircle, Waves, Droplet,
  BarChart2, Sprout, ExternalLink,
  Info, Loader2, AlertTriangle,
} from 'lucide-react';
import {
  getVillages, getWaterHealth, getGroundwater, getDroughtRisk,
  getWaterBudget, getHealth, Village,
  WaterHealthResult, GroundwaterResult, DroughtResult, WaterBudgetResult,
} from '../../services/api';

// ─── LocalStorage keys ────────────────────────────────────────────────────────
const LS_EXTRA = 'jalrakshak_villages_extra'; // extra fields not in API

// ─── Extended village record (merges API + extra fields) ─────────────────────
interface VillageRecord {
  village_id: string;
  name: string;
  district: string;
  taluka: string;
  population: number;
  households: number;
  area_ha: number;
  primary_crops: string;
  lat: number;
  lon: number;
  annual_rainfall_mm: number;
  groundwater_depth_m: number;
  aquifer_type: string;
  isDemo: boolean;
  // risk fields cached from API calls
  waterHealthScore?: number;
  waterHealthCategory?: string;
  droughtRiskLevel?: string;
  droughtRiskScore?: number;
  gwTrend?: string;
  gwSeverity?: string;
}

interface ExtraFields {
  [village_id: string]: {
    taluka: string;
    households: number;
    area_ha: number;
  };
}

// ─── Add-Village form ─────────────────────────────────────────────────────────
interface AddForm {
  name: string;
  district: string;
  taluka: string;
  population: string;
  households: string;
  area_ha: string;
  primary_crops: string;
}
const BLANK_FORM: AddForm = { name: '', district: '', taluka: '', population: '', households: '', area_ha: '', primary_crops: '' };

// ─── Districts list ───────────────────────────────────────────────────────────
const DISTRICTS = [
  'Ahmedabad','Amreli','Anand','Bhavnagar','Botad','Chhota Udaipur',
  'Dahod','Dang','Devbhumi Dwarka','Gandhinagar','Gir Somnath',
  'Jamnagar','Junagadh','Kheda','Kutch','Mahisagar','Mehsana',
  'Morbi','Narmada','Navsari','Panchmahal','Patan','Porbandar',
  'Rajkot','Sabarkantha','Surat','Surendranagar','Tapi','Vadodara','Valsad',
];

// ─── Demo seed villages — realistic mixed risk distribution ──────────────────
// These match the actual backend village IDs (V001–V010) so API calls work.
// droughtRiskLevel is left undefined here; it gets filled by background API
// calls (getDroughtRisk) after load. The values below are used only when the
// backend is completely offline AND the API fetch fails.
const SEED_DEMO: VillageRecord[] = [
  { village_id: 'V001', name: 'Rajkot',              district: 'Rajkot',          taluka: 'Rajkot',          population: 1500000, households: 300000, area_ha: 45000, primary_crops: 'Cotton, Groundnut, Wheat',     lat: 22.30, lon: 70.80, annual_rainfall_mm: 650, groundwater_depth_m: 18.5, aquifer_type: 'Alluvial',   isDemo: true, droughtRiskLevel: 'HIGH',     gwTrend: 'DECLINING' },
  { village_id: 'V002', name: 'Junagadh',            district: 'Junagadh',        taluka: 'Junagadh',        population:  320000, households:  64000, area_ha: 38000, primary_crops: 'Groundnut, Cotton, Millet',    lat: 21.52, lon: 70.46, annual_rainfall_mm: 750, groundwater_depth_m: 14.2, aquifer_type: 'Alluvial',   isDemo: true, droughtRiskLevel: 'MEDIUM',   gwTrend: 'STABLE'    },
  { village_id: 'V003', name: 'Amreli',              district: 'Amreli',          taluka: 'Amreli',          population:   58000, households:  11600, area_ha: 42000, primary_crops: 'Groundnut, Cotton, Castor',    lat: 21.60, lon: 71.22, annual_rainfall_mm: 600, groundwater_depth_m: 22.1, aquifer_type: 'Hard Rock',  isDemo: true, droughtRiskLevel: 'HIGH',     gwTrend: 'DECLINING' },
  { village_id: 'V004', name: 'Bhavnagar',           district: 'Bhavnagar',       taluka: 'Bhavnagar',       population:  593000, households: 118600, area_ha: 35000, primary_crops: 'Wheat, Cotton, Sesame',        lat: 21.76, lon: 72.15, annual_rainfall_mm: 550, groundwater_depth_m: 25.3, aquifer_type: 'Alluvial',   isDemo: true, droughtRiskLevel: 'CRITICAL', gwTrend: 'CRITICAL'  },
  { village_id: 'V005', name: 'Jamnagar',            district: 'Jamnagar',        taluka: 'Jamnagar',        population:  479000, households:  95800, area_ha: 40000, primary_crops: 'Groundnut, Cotton, Vegetables', lat: 22.47, lon: 70.06, annual_rainfall_mm: 680, groundwater_depth_m: 16.8, aquifer_type: 'Alluvial',   isDemo: true, droughtRiskLevel: 'MEDIUM',   gwTrend: 'STABLE'    },
  { village_id: 'V006', name: 'Porbandar',           district: 'Porbandar',       taluka: 'Porbandar',       population:  133000, households:  26600, area_ha: 18000, primary_crops: 'Groundnut, Millet, Vegetables', lat: 21.64, lon: 69.63, annual_rainfall_mm: 720, groundwater_depth_m: 12.5, aquifer_type: 'Coastal',    isDemo: true, droughtRiskLevel: 'LOW',      gwTrend: 'STABLE'    },
  { village_id: 'V007', name: 'Surendranagar',       district: 'Surendranagar',   taluka: 'Surendranagar',   population:  180000, households:  36000, area_ha: 55000, primary_crops: 'Cotton, Wheat, Castor',        lat: 22.73, lon: 71.65, annual_rainfall_mm: 450, groundwater_depth_m: 28.7, aquifer_type: 'Hard Rock',  isDemo: true, droughtRiskLevel: 'CRITICAL', gwTrend: 'CRITICAL'  },
  { village_id: 'V008', name: 'Morbi',               district: 'Morbi',           taluka: 'Morbi',           population:  196000, households:  39200, area_ha: 32000, primary_crops: 'Cotton, Groundnut, Wheat',     lat: 22.82, lon: 70.84, annual_rainfall_mm: 500, groundwater_depth_m: 24.2, aquifer_type: 'Alluvial',   isDemo: true, droughtRiskLevel: 'HIGH',     gwTrend: 'DECLINING' },
  { village_id: 'V009', name: 'Gir Somnath',         district: 'Gir Somnath',     taluka: 'Gir Somnath',     population:  120000, households:  24000, area_ha: 28000, primary_crops: 'Groundnut, Mango, Cotton',     lat: 20.91, lon: 70.37, annual_rainfall_mm: 780, groundwater_depth_m: 11.3, aquifer_type: 'Hard Rock',  isDemo: true, droughtRiskLevel: 'LOW',      gwTrend: 'IMPROVING' },
  { village_id: 'V010', name: 'Devbhumi Dwarka',     district: 'Devbhumi Dwarka', taluka: 'Devbhumi Dwarka', population:   45000, households:   9000, area_ha: 22000, primary_crops: 'Groundnut, Cotton, Millet',    lat: 22.24, lon: 68.97, annual_rainfall_mm: 600, groundwater_depth_m: 19.8, aquifer_type: 'Coastal',    isDemo: true, droughtRiskLevel: 'MEDIUM',   gwTrend: 'DECLINING' },
];

function riskColor(level?: string) {
  if (!level) return '#64748b';
  const l = level.toUpperCase();
  if (l === 'CRITICAL' || l === 'VERY HIGH') return '#ef4444';
  if (l === 'HIGH')     return '#f97316';
  if (l === 'MEDIUM' || l === 'MODERATE') return '#f59e0b';
  if (l === 'LOW')      return '#22c55e';
  return '#64748b';
}
function riskBg(level?: string) { return riskColor(level) + '22'; }
function healthColor(score?: number) {
  if (score == null) return '#64748b';
  if (score >= 70) return '#22c55e';
  if (score >= 50) return '#f59e0b';
  if (score >= 30) return '#f97316';
  return '#ef4444';
}
function gwTrendColor(t?: string) {
  if (!t) return '#64748b';
  if (t === 'IMPROVING') return '#22c55e';
  if (t === 'STABLE')    return '#3b82f6';
  if (t === 'DECLINING') return '#f97316';
  if (t === 'CRITICAL')  return '#ef4444';
  return '#94a3b8';
}
function fmtNum(n?: number) { return n != null ? n.toLocaleString() : '—'; }

function loadExtra(): ExtraFields {
  try { const r = localStorage.getItem(LS_EXTRA); if (r) return JSON.parse(r); } catch { /**/ }
  return {};
}
function saveExtra(e: ExtraFields) {
  try { localStorage.setItem(LS_EXTRA, JSON.stringify(e)); } catch { /**/ }
}

function mergeExtra(v: Village, extra: ExtraFields): VillageRecord {
  const ex = extra[v.village_id] || {};
  return {
    village_id: v.village_id,
    name: v.name,
    district: v.district,
    taluka: (ex as any).taluka || v.district,
    population: v.population,
    households: (ex as any).households || Math.round(v.population / 5),
    area_ha: (ex as any).area_ha || v.agricultural_area_ha,
    primary_crops: v.primary_crops,
    lat: v.lat,
    lon: v.lon,
    annual_rainfall_mm: v.annual_rainfall_mm,
    groundwater_depth_m: v.groundwater_depth_m,
    aquifer_type: v.aquifer_type,
    isDemo: false,
    // droughtRiskLevel left undefined — filled by background getDroughtRisk calls
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
const cardS: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
  borderRadius: 12, padding: '16px 20px',
};

function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 9px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 800, color, background: bg, border: `1px solid ${color}44`, whiteSpace: 'nowrap' }}>
      {text}
    </span>
  );
}

function FilterSel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>{label}:</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', borderRadius: 7, padding: '5px 8px', fontSize: '0.78rem', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

function inputStyle(err = false): React.CSSProperties {
  return {
    width: '100%', padding: '9px 12px', borderRadius: 8, fontFamily: 'inherit',
    fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
    background: 'var(--bg-dark)', color: 'var(--text-main)',
    border: `1px solid ${err ? '#ef4444' : 'var(--border-glass)'}`,
    transition: 'border-color 0.2s',
  };
}
function labelStyle(): React.CSSProperties {
  return { fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 5, display: 'block' };
}

// ─── Risk Distribution — donut + legend ──────────────────────────────────────
function RiskDistributionChart({ villages }: { villages: VillageRecord[] }) {
  const ALL_BUCKETS = [
    { label: 'Critical', color: '#ef4444', keys: ['CRITICAL', 'VERY HIGH'] },
    { label: 'High',     color: '#f97316', keys: ['HIGH'] },
    { label: 'Medium',   color: '#f59e0b', keys: ['MEDIUM', 'MODERATE'] },
    { label: 'Low',      color: '#22c55e', keys: ['LOW'] },
  ];

  const total = villages.length || 1;
  const buckets = ALL_BUCKETS.map(b => ({
    ...b,
    count: villages.filter(v => b.keys.includes((v.droughtRiskLevel || '').toUpperCase())).length,
  }));

  // SVG donut: cx=48, cy=48, r=36, strokeWidth=14
  const cx = 48, cy = 48, r = 34, sw = 13;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const slices = buckets.map(b => {
    const pct = b.count / total;
    const dash = pct * circ;
    const slice = { ...b, pct, dash, offset };
    offset += dash;
    return slice;
  });

  return (
    <div style={{ ...cardS, padding: '14px 16px', minWidth: 0 }}>
      {/* Title */}
      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}>
        <BarChart2 size={12} /> Risk Overview
      </div>

      {/* Donut + legend side by side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
        {/* Donut SVG */}
        <div style={{ flexShrink: 0 }}>
          <svg width={88} height={88} viewBox="0 0 96 96">
            {/* track */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-glass)" strokeWidth={sw} />
            {/* slices */}
            {slices.map(s => s.count > 0 && (
              <circle key={s.label}
                cx={cx} cy={cy} r={r}
                fill="none"
                stroke={s.color}
                strokeWidth={sw}
                strokeDasharray={`${s.dash} ${circ - s.dash}`}
                strokeDashoffset={-s.offset}
                style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px` }}
                strokeLinecap="butt"
              />
            ))}
            {/* centre total */}
            <text x={cx} y={cy - 5} textAnchor="middle" fontSize={18} fontWeight={800} fill="var(--text-main)">{total}</text>
            <text x={cx} y={cy + 10} textAnchor="middle" fontSize={8} fontWeight={600} fill="var(--text-muted)">villages</text>
          </svg>
        </div>

        {/* Legend */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0, overflow: 'hidden' }}>
          {buckets.map(b => (
            <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
              {/* colour dot */}
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: b.color, flexShrink: 0 }} />
              {/* label */}
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', flex: '0 0 48px', fontWeight: 600 }}>{b.label}</span>
              {/* count badge */}
              <span style={{ fontSize: '0.72rem', fontWeight: 800, color: b.count > 0 ? b.color : 'var(--text-muted)', flex: '0 0 18px', textAlign: 'right' }}>{b.count}</span>
              {/* inline bar */}
              <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--border-glass)', overflow: 'hidden', minWidth: 20 }}>
                <div style={{ height: '100%', width: `${(b.count / total) * 100}%`, background: b.color, borderRadius: 3, transition: 'width 0.4s ease' }} />
              </div>
              {/* pct */}
              <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)', flex: '0 0 30px', textAlign: 'right' }}>
                {b.count > 0 ? `${Math.round((b.count / total) * 100)}%` : '—'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Health Score Ring ────────────────────────────────────────────────────────
function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const r = size / 2 - 5, c = 2 * Math.PI * r;
  const color = healthColor(score);
  return (
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--border-glass)" strokeWidth={5} />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={5}
          strokeDasharray={`${(score / 100) * c} ${c}`} strokeLinecap="round" />
      </svg>
      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', fontSize: '0.75rem', fontWeight: 800, color }}>{Math.round(score)}</div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Villages() {
  const nav = useNavigate();

  // Backend village list
  const [apiVillages, setApiVillages]   = useState<VillageRecord[]>([]);
  const [demoVillages, setDemoVillages] = useState<VillageRecord[]>([]);
  const [extra, setExtra]               = useState<ExtraFields>(loadExtra);
  const [isDemo, setIsDemo]             = useState(true);
  const [loading, setLoading]           = useState(true);

  // Filters
  const [search, setSearch]             = useState('');
  const [fDistrict, setFDistrict]       = useState('ALL');
  const [fTaluka, setFTaluka]           = useState('ALL');
  const [fRisk, setFRisk]               = useState('ALL');

  // Modals
  const [viewVillage, setViewVillage]   = useState<VillageRecord | null>(null);
  const [editVillage, setEditVillage]   = useState<VillageRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<VillageRecord | null>(null);
  const [showAdd, setShowAdd]           = useState(false);

  // Per-village detail data (fetched on demand)
  const [detailHealth, setDetailHealth]   = useState<WaterHealthResult | null>(null);
  const [detailGW, setDetailGW]           = useState<GroundwaterResult | null>(null);
  const [detailDrought, setDetailDrought] = useState<DroughtResult | null>(null);
  const [detailBudget, setDetailBudget]   = useState<WaterBudgetResult | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Add form
  const [form, setForm]   = useState<AddForm>(BLANK_FORM);
  const [errors, setErrors] = useState<Partial<AddForm>>({});

  // Edit form
  const [editForm, setEditForm]   = useState<Partial<VillageRecord>>({});
  const [editErrors, setEditErrors] = useState<Record<string, string>>({});

  // Toast
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // ── Load data ────────────────────────────────────────────────────────────────
  useEffect(() => {
    getHealth().then(h => setIsDemo(h.demo_mode)).catch(() => {});
    setLoading(true);
    getVillages()
      .then(d => {
        const records = d.villages.map(v => mergeExtra(v, extra));
        setApiVillages(records);

        // ── Background: fetch real drought risk for every village ──────────
        // Fire all requests in parallel; patch each result into state as it
        // arrives so the chart updates progressively — no blocking.
        records.forEach(rec => {
          getDroughtRisk(rec.village_id)
            .then(risk => {
              setApiVillages(prev =>
                prev.map(r =>
                  r.village_id === rec.village_id
                    ? { ...r, droughtRiskLevel: risk.risk_level, droughtRiskScore: risk.risk_score }
                    : r
                )
              );
            })
            .catch(() => { /* leave undefined — chart shows dash */ });
        });
      })
      .catch(() => {
        // Backend unavailable — use seed demo data (risk already pre-set)
        setDemoVillages(SEED_DEMO);
      })
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // All villages combined
  const allVillages: VillageRecord[] = apiVillages.length > 0
    ? [...apiVillages, ...demoVillages]
    : demoVillages.length > 0
      ? demoVillages
      : SEED_DEMO;

  // ── Filters ──────────────────────────────────────────────────────────────────
  const districtOptions = [...new Set(allVillages.map(v => v.district))].sort();
  const talukaOptions   = [...new Set(allVillages.map(v => v.taluka).filter(Boolean))].sort();

  const filtered = allVillages.filter(v => {
    const q = search.toLowerCase();
    const ms = !q || v.name.toLowerCase().includes(q) || v.district.toLowerCase().includes(q) || v.taluka?.toLowerCase().includes(q);
    const mDist = fDistrict === 'ALL' || v.district === fDistrict;
    const mTal  = fTaluka   === 'ALL' || v.taluka === fTaluka;
    const mRisk = fRisk === 'ALL' || (v.droughtRiskLevel || '').toUpperCase() === fRisk;
    return ms && mDist && mTal && mRisk;
  });

  // ── KPI counts ────────────────────────────────────────────────────────────────
  const counts = {
    total:      allVillages.length,
    critical:   allVillages.filter(v => ['CRITICAL','VERY HIGH'].includes((v.droughtRiskLevel || '').toUpperCase())).length,
    high:       allVillages.filter(v => (v.droughtRiskLevel || '').toUpperCase() === 'HIGH').length,
    stable:     allVillages.filter(v => ['LOW','STABLE'].includes((v.droughtRiskLevel || '').toUpperCase())).length,
    households: allVillages.reduce((a, v) => a + (v.households || 0), 0),
  };

  // ── Open view modal + fetch per-village data ──────────────────────────────────
  const openView = useCallback((v: VillageRecord) => {
    setViewVillage(v);
    setDetailHealth(null); setDetailGW(null); setDetailDrought(null); setDetailBudget(null);
    setDetailLoading(true);
    Promise.allSettled([
      getWaterHealth(v.village_id),
      getGroundwater(v.village_id),
      getDroughtRisk(v.village_id),
      getWaterBudget(v.village_id),
    ]).then(([h, g, d, b]) => {
      if (h.status === 'fulfilled') setDetailHealth(h.value);
      if (g.status === 'fulfilled') setDetailGW(g.value);
      if (d.status === 'fulfilled') setDetailDrought(d.value);
      if (b.status === 'fulfilled') setDetailBudget(b.value);
    }).finally(() => setDetailLoading(false));
  }, []);

  // ── Add village ───────────────────────────────────────────────────────────────
  const validateAdd = (): boolean => {
    const e: Partial<AddForm> = {};
    if (!form.name.trim())     e.name     = 'Village name is required.';
    if (!form.district)        e.district = 'District is required.';
    if (!form.taluka.trim())   e.taluka   = 'Taluka is required.';
    if (!form.population.trim() || isNaN(Number(form.population)) || Number(form.population) <= 0)
      e.population = 'Enter a valid population.';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAdd = () => {
    if (!validateAdd()) return;
    const id = `VU-${Date.now()}`;
    const newV: VillageRecord = {
      village_id: id, name: form.name.trim(), district: form.district,
      taluka: form.taluka.trim(), population: Number(form.population),
      households: Number(form.households) || Math.round(Number(form.population) / 5),
      area_ha: Number(form.area_ha) || 0,
      primary_crops: form.primary_crops.trim() || '—',
      lat: 0, lon: 0, annual_rainfall_mm: 0, groundwater_depth_m: 0,
      aquifer_type: 'Unknown', isDemo: true,
    };
    setDemoVillages(prev => [newV, ...prev]);
    // Persist extra fields
    const newExtra = { ...extra, [id]: { taluka: newV.taluka, households: newV.households, area_ha: newV.area_ha } };
    setExtra(newExtra); saveExtra(newExtra);
    setShowAdd(false); setForm(BLANK_FORM); setErrors({});
    setToast({ msg: `Village "${newV.name}" added successfully.`, ok: true });
  };

  // ── Edit village ──────────────────────────────────────────────────────────────
  const openEdit = (v: VillageRecord) => {
    setEditVillage(v);
    setEditForm({ name: v.name, district: v.district, taluka: v.taluka, population: v.population, households: v.households, area_ha: v.area_ha, primary_crops: v.primary_crops });
    setEditErrors({});
  };

  const handleEditSave = () => {
    const e: Record<string, string> = {};
    if (!String(editForm.name || '').trim()) e.name = 'Name is required.';
    if (!editForm.district) e.district = 'District is required.';
    if (editErrors !== e) setEditErrors(e);
    if (Object.keys(e).length) return;

    const update = (list: VillageRecord[]) =>
      list.map(v => v.village_id === editVillage!.village_id ? { ...v, ...editForm } : v);
    setApiVillages(prev => update(prev));
    setDemoVillages(prev => update(prev));

    const newExtra = { ...extra, [editVillage!.village_id]: {
      taluka: String(editForm.taluka || editVillage!.taluka),
      households: Number(editForm.households) || editVillage!.households,
      area_ha: Number(editForm.area_ha) || editVillage!.area_ha,
    }};
    setExtra(newExtra); saveExtra(newExtra);
    setEditVillage(null);
    setToast({ msg: `Village "${editForm.name}" updated.`, ok: true });
  };

  // ── Delete ────────────────────────────────────────────────────────────────────
  const handleDelete = () => {
    if (!deleteTarget) return;
    const id = deleteTarget.village_id;
    setApiVillages(prev => prev.filter(v => v.village_id !== id));
    setDemoVillages(prev => prev.filter(v => v.village_id !== id));
    setToast({ msg: `Village "${deleteTarget.name}" removed.`, ok: true });
    setDeleteTarget(null);
  };

  const modalOpen = !!viewVillage || !!editVillage || !!deleteTarget || showAdd;

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ color: 'var(--text-main)', animation: 'fadeInUp 0.4s ease-out' }}>

      {/* ── TOAST ─────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2100, display: 'flex', alignItems: 'center', gap: 10, background: toast.ok ? '#052e16' : '#450a0a', border: `1px solid ${toast.ok ? '#16a34a' : '#dc2626'}`, borderRadius: 10, padding: '12px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', color: toast.ok ? '#86efac' : '#fca5a5', fontSize: '0.875rem', fontWeight: 600, maxWidth: 400, animation: 'fadeInUp 0.3s ease-out' }}>
          {toast.ok ? <CheckCircle size={16} color="#22c55e" style={{ flexShrink: 0 }} /> : <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />}
          {toast.msg}
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, marginLeft: 4, display: 'flex' }}><X size={14} /></button>
        </div>
      )}

      {/* ── BACKDROP ──────────────────────────────────────────────────────── */}
      {modalOpen && (
        <div onClick={() => { setViewVillage(null); setEditVillage(null); setDeleteTarget(null); setShowAdd(false); }}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)' }} />
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          VIEW MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {viewVillage && (
        <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1100, width: '100%', maxWidth: 740, maxHeight: '92vh', overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', animation: 'fadeInModal 0.25s ease-out' }}>

          {/* header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', background: 'var(--bg-dark)', padding: '2px 7px', borderRadius: 4, color: 'var(--text-muted)' }}>{viewVillage.village_id}</span>
                {viewVillage.isDemo && <Badge text="Demo Data" color="#f59e0b" bg="rgba(245,158,11,0.1)" />}
                {viewVillage.droughtRiskLevel && <Badge text={viewVillage.droughtRiskLevel.toUpperCase()} color={riskColor(viewVillage.droughtRiskLevel)} bg={riskBg(viewVillage.droughtRiskLevel)} />}
              </div>
              <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>{viewVillage.name}</h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <span><MapPin size={11} style={{ verticalAlign: 'middle' }} /> {viewVillage.taluka} · {viewVillage.district}</span>
                <span>Pop. {fmtNum(viewVillage.population)}</span>
                <span>{fmtNum(viewVillage.households)} households</span>
              </div>
            </div>
            <button onClick={() => setViewVillage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4, flexShrink: 0 }}><X size={20} /></button>
          </div>

          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {detailLoading && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '20px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                <Loader2 size={16} className="at-spin" /> Loading water intelligence data…
              </div>
            )}

            {/* Water Health + Drought */}
            {(detailHealth || detailDrought) && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {detailHealth && (
                  <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 10 }}>Water Health Score</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <ScoreRing score={detailHealth.overall_score} />
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: healthColor(detailHealth.overall_score) }}>{detailHealth.category}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 3 }}>GW trend: <span style={{ color: gwTrendColor(detailHealth.groundwater_trend), fontWeight: 700 }}>{detailHealth.groundwater_trend}</span></div>
                        {detailHealth.is_emergency && <div style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 800, marginTop: 3, display: 'inline-flex', alignItems: 'center', gap: 3 }}><AlertTriangle size={11} /> EMERGENCY</div>}
                      </div>
                    </div>
                    {detailHealth.explanation_factors?.slice(0, 2).map((f, i) => (
                      <div key={i} style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 6, paddingTop: 6, borderTop: i === 0 ? '1px solid var(--border-glass)' : 'none', lineHeight: 1.5 }}>• {f}</div>
                    ))}
                  </div>
                )}
                {detailDrought && (
                  <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.18)', borderRadius: 10, padding: '14px 16px' }}>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 10 }}>Drought Risk</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{ fontSize: '2rem', fontWeight: 900, color: riskColor(detailDrought.risk_level), lineHeight: 1 }}>{Math.round(detailDrought.risk_score)}</div>
                      <div>
                        <div style={{ fontWeight: 800, color: riskColor(detailDrought.risk_level) }}>{detailDrought.risk_level}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Confidence: {detailDrought.confidence}</div>
                      </div>
                    </div>
                    {detailDrought.factors?.slice(0, 3).map((f, i) => (
                      <div key={i} style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 3, lineHeight: 1.4 }}>• {f}</div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Groundwater */}
            {detailGW && (
              <div style={{ background: 'rgba(6,182,212,0.05)', border: '1px solid rgba(6,182,212,0.18)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Waves size={12} /> Groundwater
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
                  {[
                    { label: 'Current Depth', val: `${detailGW.current_depth_m?.toFixed(1)}m`, color: 'var(--text-main)' },
                    { label: 'Trend', val: detailGW.trend, color: gwTrendColor(detailGW.trend) },
                    { label: 'Annual Change', val: `${(detailGW.annual_change_m || 0) > 0 ? '+' : ''}${detailGW.annual_change_m?.toFixed(1)}m`, color: (detailGW.annual_change_m || 0) > 0 ? '#ef4444' : '#22c55e' },
                    { label: '5yr Depletion', val: `${detailGW.change_pct_since_2019?.toFixed(1)}%`, color: (detailGW.change_pct_since_2019 || 0) > 15 ? '#ef4444' : '#f59e0b' },
                  ].map(({ label, val, color }) => (
                    <div key={label}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 3 }}>{label}</div>
                      <div style={{ fontWeight: 800, fontSize: '0.9rem', color }}>{val}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Water Budget */}
            {detailBudget && (
              <div style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.18)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Droplet size={12} /> Water Budget {detailBudget.year}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {[
                    { label: 'Supply', val: `${detailBudget.supply.total_mcm?.toFixed(2)} MCM`, color: '#22c55e' },
                    { label: 'Demand', val: `${detailBudget.demand.total_mcm?.toFixed(2)} MCM`, color: '#f59e0b' },
                    { label: 'Balance', val: `${(detailBudget.balance.deficit_mcm || 0) > 0 ? '-' : ''}${Math.abs(detailBudget.balance.deficit_mcm || 0).toFixed(2)} MCM`, color: (detailBudget.balance.deficit_mcm || 0) > 0 ? '#ef4444' : '#22c55e' },
                  ].map(({ label, val, color }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{label}</div>
                      <div style={{ fontWeight: 800, color }}>{val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 10 }}>
                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: 4 }}>Status: <span style={{ color: riskColor(detailBudget.balance.risk) }}>{detailBudget.balance.status}</span></div>
                </div>
              </div>
            )}

            {/* Village profile */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ ...cardS, padding: '14px 16px', borderRadius: 8 }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 10 }}>Village Profile</div>
                {[
                  ['Population', fmtNum(viewVillage.population)],
                  ['Households', fmtNum(viewVillage.households)],
                  ['Agri Area', `${fmtNum(viewVillage.area_ha)} ha`],
                  ['Aquifer', viewVillage.aquifer_type],
                  ['Rainfall', `${fmtNum(viewVillage.annual_rainfall_mm)} mm/yr`],
                  ['GW Depth', `${viewVillage.groundwater_depth_m}m`],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid var(--border-glass)', fontSize: '0.8rem' }}>
                    <span style={{ color: 'var(--text-muted)', fontWeight: 600 }}>{k}</span>
                    <span style={{ fontWeight: 700 }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ ...cardS, padding: '14px 16px', borderRadius: 8 }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Sprout size={12} /> Major Crops
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
                  {viewVillage.primary_crops.split(/[,;]/).map(c => c.trim()).filter(Boolean).map(crop => (
                    <span key={crop} style={{ padding: '3px 9px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', color: '#22c55e' }}>{crop}</span>
                  ))}
                </div>
                {viewVillage.lat !== 0 && (
                  <>
                    <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 6, marginTop: 10 }}>Coordinates</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.78rem', color: 'var(--text-muted)' }}>{viewVillage.lat.toFixed(4)}, {viewVillage.lon.toFixed(4)}</div>
                  </>
                )}
              </div>
            </div>

            {/* Recommended actions */}
            {detailDrought?.recommended_actions && detailDrought.recommended_actions.length > 0 && (
              <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 10, padding: '14px 16px' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 8 }}>Recommended Actions</div>
                {detailDrought.recommended_actions.map((a, i) => (
                  <div key={i} style={{ fontSize: '0.82rem', color: 'var(--text-main)', marginBottom: 5, paddingLeft: 12, position: 'relative', lineHeight: 1.5 }}>
                    <span style={{ position: 'absolute', left: 0, color: '#22c55e', fontWeight: 700 }}>•</span>{a}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* footer */}
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button
              onClick={() => { setViewVillage(null); nav(`/admin/groundwater`); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <ExternalLink size={13} /> View Dashboard
            </button>
            <button
              onClick={() => { setViewVillage(null); openEdit(viewVillage); }}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <Pencil size={13} /> Edit
            </button>
            <button onClick={() => setViewVillage(null)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          EDIT MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {editVillage && (
        <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1100, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', animation: 'fadeInModal 0.25s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Pencil size={16} color="#3b82f6" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>Edit Village</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{editVillage.village_id}</div>
              </div>
            </div>
            <button onClick={() => setEditVillage(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}><X size={18} /></button>
          </div>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {([
              { key: 'name', label: 'Village Name *', type: 'text' },
              { key: 'taluka', label: 'Taluka', type: 'text' },
              { key: 'population', label: 'Population', type: 'number' },
              { key: 'households', label: 'Households', type: 'number' },
              { key: 'area_ha', label: 'Agricultural Area (ha)', type: 'number' },
              { key: 'primary_crops', label: 'Major Crops', type: 'text' },
            ] as { key: keyof VillageRecord; label: string; type: string }[]).map(({ key, label, type }) => (
              <div key={key}>
                <label style={labelStyle()}>{label}</label>
                <input type={type} value={String(editForm[key] ?? '')} onChange={e => setEditForm(f => ({ ...f, [key]: type === 'number' ? Number(e.target.value) : e.target.value }))}
                  style={inputStyle(!!editErrors[key])} />
                {editErrors[key] && <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{editErrors[key]}</div>}
              </div>
            ))}
            <div>
              <label style={labelStyle()}>District *</label>
              <select value={String(editForm.district || '')} onChange={e => setEditForm(f => ({ ...f, district: e.target.value }))} style={inputStyle(!!editErrors.district)}>
                <option value="">Select district…</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '16px 24px', borderTop: '1px solid var(--border-glass)', justifyContent: 'flex-end' }}>
            <button onClick={() => setEditVillage(null)} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={handleEditSave} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 22px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              <CheckCircle size={14} /> Save Changes
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ADD MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {showAdd && (
        <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1100, width: '100%', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', animation: 'fadeInModal 0.25s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px', borderBottom: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Plus size={16} color="#22c55e" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>Add New Village</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>All required fields must be filled.</div>
              </div>
            </div>
            <button onClick={() => { setShowAdd(false); setForm(BLANK_FORM); setErrors({}); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}><X size={18} /></button>
          </div>
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={labelStyle()}>Village Name <span style={{ color: '#ef4444' }}>*</span></label>
              <input style={inputStyle(!!errors.name)} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Rajkot_V5" />
              {errors.name && <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{errors.name}</div>}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle()}>District <span style={{ color: '#ef4444' }}>*</span></label>
                <select style={inputStyle(!!errors.district)} value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))}>
                  <option value="">Select district…</option>
                  {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.district && <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{errors.district}</div>}
              </div>
              <div>
                <label style={labelStyle()}>Taluka <span style={{ color: '#ef4444' }}>*</span></label>
                <input style={inputStyle(!!errors.taluka)} value={form.taluka} onChange={e => setForm(f => ({ ...f, taluka: e.target.value }))} placeholder="e.g. Rajkot" />
                {errors.taluka && <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{errors.taluka}</div>}
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle()}>Population <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="number" min="1" style={inputStyle(!!errors.population)} value={form.population} onChange={e => setForm(f => ({ ...f, population: e.target.value }))} placeholder="e.g. 2500" />
                {errors.population && <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{errors.population}</div>}
              </div>
              <div>
                <label style={labelStyle()}>Households</label>
                <input type="number" min="1" style={inputStyle()} value={form.households} onChange={e => setForm(f => ({ ...f, households: e.target.value }))} placeholder="auto-calculated" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle()}>Agri Area (ha)</label>
                <input type="number" min="0" style={inputStyle()} value={form.area_ha} onChange={e => setForm(f => ({ ...f, area_ha: e.target.value }))} placeholder="e.g. 800" />
              </div>
              <div>
                <label style={labelStyle()}>Major Crops</label>
                <input style={inputStyle()} value={form.primary_crops} onChange={e => setForm(f => ({ ...f, primary_crops: e.target.value }))} placeholder="e.g. Cotton, Groundnut" />
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '16px 24px', borderTop: '1px solid var(--border-glass)', justifyContent: 'flex-end' }}>
            <button onClick={() => { setShowAdd(false); setForm(BLANK_FORM); setErrors({}); }} style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={handleAdd} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 22px', borderRadius: 8, border: 'none', background: '#22c55e', color: '#fff', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
              <Plus size={14} /> Add Village
            </button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          DELETE MODAL
      ══════════════════════════════════════════════════════════════════════ */}
      {deleteTarget && (
        <div onClick={e => e.stopPropagation()} style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', zIndex: 1100, width: '100%', maxWidth: 380, background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', animation: 'fadeInModal 0.25s ease-out', overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 24px 20px', gap: 12, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={20} color="#ef4444" />
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>Remove Village</div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Remove <strong style={{ color: 'var(--text-main)' }}>"{deleteTarget.name}"</strong> from the management list? API-sourced villages will reappear on next reload.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '0 24px 20px' }}>
            <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={handleDelete} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          PAGE HEADER
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ ...cardS, marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MapPin size={20} color="#3b82f6" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>Village Management</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.83rem' }}>
              Manage villages and monitor their water-risk status.
              {isDemo && <span style={{ marginLeft: 8, fontSize: '0.72rem', padding: '2px 8px', borderRadius: 20, fontWeight: 800, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>Demo Mode</span>}
            </p>
          </div>
        </div>
        <button
          onClick={() => { setShowAdd(true); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}
        >
          <Plus size={16} /> Add Village
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          KPI CARDS
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 18 }}>
        {[
          { label: 'Total Villages',    val: counts.total,      color: '#3b82f6' },
          { label: 'Critical Risk',     val: counts.critical,   color: '#ef4444' },
          { label: 'High Risk',         val: counts.high,       color: '#f97316' },
          { label: 'Stable',            val: counts.stable,     color: '#22c55e' },
          { label: 'Total Households',  val: fmtNum(counts.households), color: '#8b5cf6' },
        ].map(k => (
          <div key={k.label} style={{ ...cardS, borderLeft: `3px solid ${k.color}`, padding: '14px 18px' }}>
            <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: '1.9rem', fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          RISK CHART + FILTERS ROW
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(260px, 300px)', gap: 14, marginBottom: 14, alignItems: 'start' }}>
        {/* Filters */}
        <div style={{ ...cardS, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', borderRadius: 8, padding: '6px 11px', flex: '1 1 180px', minWidth: 160 }}>
            <Search size={14} color="var(--text-muted)" />
            <input type="text" placeholder="Search villages…" value={search} onChange={e => setSearch(e.target.value)}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.83rem', width: '100%', outline: 'none', fontFamily: 'inherit' }} />
          </div>
          <FilterSel label="District" value={fDistrict} onChange={setFDistrict}
            options={[['ALL', 'All Districts'], ...districtOptions.map(d => [d, d] as [string, string])]} />
          <FilterSel label="Taluka" value={fTaluka} onChange={setFTaluka}
            options={[['ALL', 'All Talukas'], ...talukaOptions.map(t => [t, t] as [string, string])]} />
          <FilterSel label="Risk" value={fRisk} onChange={setFRisk}
            options={[['ALL', 'All Risk'], ['CRITICAL', 'Critical'], ['HIGH', 'High'], ['MEDIUM', 'Medium'], ['LOW', 'Low']]} />
          {(search || fDistrict !== 'ALL' || fTaluka !== 'ALL' || fRisk !== 'ALL') && (
            <button onClick={() => { setSearch(''); setFDistrict('ALL'); setFTaluka('ALL'); setFRisk('ALL'); }}
              style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
              <RefreshCw size={11} /> Clear
            </button>
          )}
        </div>

        {/* Risk Distribution Chart */}
        <RiskDistributionChart villages={allVillages} />
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          VILLAGES TABLE
      ══════════════════════════════════════════════════════════════════════ */}
      <div style={{ ...cardS, padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        {loading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '32px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            <Loader2 size={16} className="at-spin" /> Loading villages from backend…
          </div>
        )}
        {!loading && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: 1000 }}>
              <thead>
                <tr style={{ background: 'var(--bg-card-hover)', borderBottom: '1px solid var(--border-glass)' }}>
                  {['Village', 'District / Taluka', 'Population', 'Households', 'Groundwater', 'Drought Risk', 'Water Health', 'Status', 'Actions'].map((h, i) => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: i >= 7 ? 'center' : 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={9} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>No villages match the current filters.</td></tr>
                )}
                {filtered.map((v, i) => (
                  <tr key={v.village_id} style={{ borderBottom: '1px solid var(--border-glass)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-card-hover)', transition: 'background 0.15s' }}>

                    {/* Village name */}
                    <td style={{ padding: '13px 16px', maxWidth: 200 }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: 3 }}>{v.name}</div>
                      <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.62rem', background: 'var(--bg-dark)', padding: '1px 5px', borderRadius: 3, color: 'var(--text-muted)' }}>{v.village_id}</span>
                        {v.isDemo && <span style={{ fontSize: '0.62rem', color: '#f59e0b', fontWeight: 700 }}>Demo</span>}
                      </div>
                    </td>

                    {/* District / Taluka */}
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ fontWeight: 600 }}>{v.district}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{v.taluka || '—'}</div>
                    </td>

                    {/* Population */}
                    <td style={{ padding: '13px 16px', fontWeight: 600 }}>{fmtNum(v.population)}</td>

                    {/* Households */}
                    <td style={{ padding: '13px 16px', color: 'var(--text-muted)' }}>{fmtNum(v.households)}</td>

                    {/* Groundwater */}
                    <td style={{ padding: '13px 16px' }}>
                      <div style={{ fontWeight: 700 }}>{v.groundwater_depth_m}m</div>
                      {v.gwTrend && (
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: gwTrendColor(v.gwTrend) }}>{v.gwTrend}</div>
                      )}
                      <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>{v.aquifer_type}</div>
                    </td>

                    {/* Drought Risk */}
                    <td style={{ padding: '13px 16px' }}>
                      {v.droughtRiskLevel
                        ? <Badge text={v.droughtRiskLevel.toUpperCase()} color={riskColor(v.droughtRiskLevel)} bg={riskBg(v.droughtRiskLevel)} />
                        : <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                      }
                    </td>

                    {/* Water Health */}
                    <td style={{ padding: '13px 16px' }}>
                      {v.waterHealthScore != null ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <ScoreRing score={v.waterHealthScore} size={36} />
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{v.waterHealthCategory}</div>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                      {(v.gwSeverity || v.droughtRiskLevel) ? (
                        <Badge
                          text={(v.gwSeverity || v.droughtRiskLevel)!.toUpperCase()}
                          color={riskColor(v.gwSeverity || v.droughtRiskLevel)}
                          bg={riskBg(v.gwSeverity || v.droughtRiskLevel)}
                        />
                      ) : (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: 5, justifyContent: 'center' }}>
                        <button onClick={() => openView(v)} title="View Details"
                          style={{ padding: '5px 7px', borderRadius: 6, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Eye size={13} />
                        </button>
                        <button onClick={() => openEdit(v)} title="Edit"
                          style={{ padding: '5px 7px', borderRadius: 6, border: '1px solid rgba(59,130,246,0.3)', background: 'rgba(59,130,246,0.08)', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => nav('/admin/groundwater')} title="View Dashboard"
                          style={{ padding: '5px 7px', borderRadius: 6, border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.08)', color: '#8b5cf6', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <ExternalLink size={13} />
                        </button>
                        <button onClick={() => setDeleteTarget(v)} title="Remove"
                          style={{ padding: '5px 7px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.08)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── DEMO DATA NOTE ────────────────────────────────────────────────────── */}
      {allVillages.some(v => v.isDemo) && (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 14px', borderRadius: 8, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)', marginBottom: 16, fontSize: '0.78rem', color: '#f59e0b' }}>
          <Info size={14} style={{ marginTop: 1, flexShrink: 0 }} />
          <span>Rows labelled <strong>Demo</strong> are synthetic seed data used when the backend API is unavailable or returns no villages. Connect the backend to see live data.</span>
        </div>
      )}

    </div>
  );
}
