import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sprout, Droplets, Shield, Star, Info, ChevronRight, X,
  TrendingDown, CheckCircle2, AlertTriangle, Loader2,
  BarChart3, Bot, Lightbulb, ArrowRight, Activity,
  BookOpen, Zap, Leaf, Wind, Sun, FlaskConical,
} from 'lucide-react';
import { getVillages, getCropAdvice, Village, CropRecommendation } from '../services/api';
import VillageSelect from '../components/VillageSelect';
import { useTheme } from '../context/ThemeContext';

interface Props {
  selectedVillage: string;
  setSelectedVillage: (v: string) => void;
  lang: string;
  demoMode?: boolean;
}

/* ─── helpers ────────────────────────────────────────────────────────────── */
const tolColor = (t: string) => ({
  very_high: '#10b981', high: '#22c55e', moderate: '#f59e0b',
  low: '#f97316', very_low: '#ef4444',
}[t] || 'var(--text-muted)');

const tolLabel = (t: string) => ({
  very_high: 'Very High', high: 'High', moderate: 'Moderate',
  low: 'Low', very_low: 'Very Low',
}[t] || t);

const localizedTolLabel = (value: string, lang: string) => {
  const key = tolLabel(value);
  return lang === 'gu' ? (TR[key] ?? key) : key;
};

const localizedRiskLabel = (value: string | undefined, lang: string) => {
  if (!value) return '—';
  return lang === 'gu' ? (TR[value] ?? value) : value;
};

const localizedSuitability = (value: string, lang: string) => {
  const key = value.replace('_', ' ');
  if (lang !== 'gu') return key;
  const map: Record<string, string> = {
    'very high': 'ખૂબ ઉચ્ચ',
    'high': 'ઉચ્ચ',
    'moderate': 'મધ્યમ',
    'low': 'નીચું',
  };
  return map[key] ?? key;
};

/* Translate common API-generated crop-reason sentences while preserving values. */
const translateCropReason = (reason: string, lang: string) => {
  if (!reason || lang !== 'gu') return reason;

  let s = reason;

  s = s.replace(
    /(.+?) is highly drought-tolerant requiring only (\d+(?:\.\d+)?)mm water, saving ~?(\d+(?:\.\d+)?)% vs cotton/i,
    '$1 ખૂબ દુષ્કાળ-સહિષ્ણુ છે અને માત્ર $2 મિમી પાણીની જરૂર પડે છે, કોટનની સરખામણીમાં લગભગ $3% પાણીની બચત કરે છે'
  );

  s = s.replace(
    /(.+?) is highly drought-tolerant requiring only (\d+(?:\.\d+)?)mm water, saving ~?(\d+(?:\.\d+)?)% vs cotton/i,
    '$1 ખૂબ દુષ્કાળ-સહિષ્ણુ છે અને માત્ર $2 મિમી પાણીની જરૂર પડે છે, કોટનની સરખામણીમાં લગભગ $3% પાણીની બચત કરે છે'
  );

  s = s.replace(
    /(.+?) has good drought tolerance with (\d+(?:\.\d+)?)mm water requirement/i,
    '$1 સારી દુષ્કાળ સહિષ્ણુતા ધરાવે છે અને તેને $2 મિમી પાણીની જરૂર પડે છે'
  );

  return s;
};

const suitColor = (s: string) => ({
  very_high: '#10b981', high: '#22c55e', moderate: '#f59e0b', low: '#f97316',
}[s] || 'var(--text-muted)');

const riskBadge = (r: string) => {
  const m: Record<string, string> = {
    LOW: 'badge-low', MODERATE: 'badge-moderate', HIGH: 'badge-high',
    SEVERE: 'badge-severe', CRITICAL: 'badge-high',
  };
  return m[r] || 'badge-moderate';
};

/* ─── translation ────────────────────────────────────────────────────────── */
const TR: Record<string, string> = {
  /* header */
  'Crop Advisor':                               'પાક સલાહ',
  'AI-powered water-efficient crop recommendations for Saurashtra':
                                                'સૌરાષ્ટ્ર માટે AI-આધારિત જળ-કાર્યક્ષમ પાક ભલામણ',
  'Kharif':  'ખરીફ', 'Rabi': 'રવિ', 'Perennial': 'બહુ-વર્ષીય',
  /* kpi */
  'Recommended Crops':    'ભલામણ પાક',
  'Avg Water Saving':     'સ. જળ બચત',
  'Top Drought Tolerance':'ટોચ સહિષ્ણુતા',
  'Drought Risk':         'દુષ્કાળ જોખમ',
  'Best Crop':            'શ્રેષ્ઠ પાક',
  /* cards */
  'Recommended for':      'ભલામણ',
  'Water Requirement':    'જળ જરૂર',
  'Season':               'ઋતુ',
  'Drought Tolerance':    'દુષ્કાળ સહ.',
  'Water Saving vs Cotton':'કોટન કરતાં બચત',
  'Suitability Score':    'યોગ્યતા સ્કોર',
  'View Details':         'વિગત',
  'Select Crop':          'પસંદ',
  'No crops available for this season.': 'આ ઋતુ માટે પાક ઉપલબ્ધ નથી.',
  /* detail panel */
  'Crop Details':         'પાક વિગત',
  'Why AI Recommends':    'AI શા માટે ભલામણ',
  'Village Conditions':   'ગ્રામ સ્થિતિ',
  'Confidence':           'વિશ્વાસ',
  'Supporting Data':      'સહાયક ડેટા',
  'Water Comparison':     'જળ સરખામણ',
  'Cotton Water Need':    'કોટન જળ જરૂર',
  'This Crop':            'આ પાક',
  'Saving':               'બચત',
  /* practices */
  'Water Saving Practices': 'જળ બચત પ્રથા',
  'Learn More':           'વધુ જાણો',
  /* ai rec */
  'AI Recommendation':    'AI ભલામણ',
  'Best Crop:':           'શ્રેષ્ઠ પાક:',
  'Water Saved:':         'જળ બચ્યું:',
  'Risk Level:':          'જોખમ:',
  'Next Action:':         'આગળ:',
  /* actions */
  'Compare Crops':        'પાક સરખાવો',
  'Ask Copilot':          'Copilot પૂછો',
  'Run What-If':          'What-If ચલાવો',
  'Analyzing...':         'વિશ્લેષણ...',
  /* status */
  'AI Validated':         'AI ચકાસ્યું',
  'Local validation recommended': 'સ્થાનિક ચકાસણી ભલામણ',
  /* structured AI */
  'What':           'શું',
  'Why':            'કેમ',
  'Data':           'ડેટા',
  'Action':         'ક્રિયા',

  /* additional UI / dynamic headings */
  'crops recommended': 'પાકની ભલામણ',
  'crops recommended for': 'માટે પાકની ભલામણ',
  // 'Drought Risk' already defined above
  'Drought Risk regime': 'દુષ્કાળ જોખમ સ્થિતિ',
  'risk regime': 'જોખમ સ્થિતિ',
  'Actions': 'ક્રિયાઓ',
  'Season Overview': 'ઋતુ ઝાંખી',
  'Current conditions': 'વર્તમાન સ્થિતિ',
  'Best recommendation': 'શ્રેષ્ઠ ભલામણ',
  'vs Cotton baseline': 'કોટન આધારરેખાની સરખામણીમાં',
  'Similar': 'સમાન',
  'Suitability': 'યોગ્યતા',
  'Village': 'ગામ',
  'Risk': 'જોખમ',
  // 'Season' already defined above
  'Key Metrics': 'મુખ્ય માપદંડો',
  'Cotton': 'કોટન',
  // 'This Crop' already defined above
  'mm water': 'મિમી પાણી',
  'less water than Cotton': 'કોટન કરતાં ઓછું પાણી',
  'saves': 'બચત',
  'per season': 'દર સીઝનમાં',
  'Plant': 'વાવો',
  'this season': 'આ સીઝનમાં',
  'needs only': 'માત્ર જરૂરી',
  'water, saving': 'પાણી, બચત',
  'High': 'ઉચ્ચ',
  'Very High': 'ખૂબ ઉચ્ચ',
  'Moderate': 'મધ્યમ',
  'Low': 'નીચું',
  'Very Low': 'ખૂબ નીચું',
  'HIGH': 'ઉચ્ચ',
  'MODERATE': 'મધ્યમ',
  'LOW': 'નીચું',
  'SEVERE': 'ગંભીર',
  'CRITICAL': 'ગંભીર',
  'HIGH DROUGHT RISK': 'ઉચ્ચ દુષ્કાળ જોખમ',
  'MODERATE DROUGHT RISK': 'મધ્યમ દુષ્કાળ જોખમ',
  'SEVERE DROUGHT RISK': 'ગંભીર દુષ્કાળ જોખમ',
  'LOW DROUGHT RISK': 'નીચું દુષ્કાળ જોખમ',
};
const tx = (k: string, l: string) => l === 'gu' ? (TR[k] ?? k) : k;

/* ─── practice tips config ───────────────────────────────────────────────── */
const PRACTICE_ICONS: Record<string, React.ReactNode> = {
  drip:      <Droplets size={14} color="#3b82f6" />,
  mulch:     <Leaf size={14} color="#84cc16" />,
  schedule:  <Sun size={14} color="#f59e0b" />,
  monitor:   <Activity size={14} color="#10b981" />,
  group:     <Sprout size={14} color="#a78bfa" />,
  switch:    <AlertTriangle size={14} color="#ef4444" />,
  reduce:    <TrendingDown size={14} color="#f97316" />,
  deficit:   <Wind size={14} color="#06b6d4" />,
  harvest:   <Zap size={14} color="#f59e0b" />,
  fallow:    <BookOpen size={14} color="#94a3b8" />,
};

function getPracticeIcon(tip: string): React.ReactNode {
  const t = tip.toLowerCase();
  if (t.includes('drip'))    return PRACTICE_ICONS.drip;
  if (t.includes('mulch'))   return PRACTICE_ICONS.mulch;
  if (t.includes('morning') || t.includes('evening') || t.includes('schedule')) return PRACTICE_ICONS.schedule;
  if (t.includes('monitor') || t.includes('soil moisture')) return PRACTICE_ICONS.monitor;
  if (t.includes('group'))   return PRACTICE_ICONS.group;
  if (t.includes('switch') || t.includes('bajra') || t.includes('drought-tolerant crops')) return PRACTICE_ICONS.switch;
  if (t.includes('reduce') || t.includes('drinking')) return PRACTICE_ICONS.reduce;
  if (t.includes('deficit')) return PRACTICE_ICONS.deficit;
  if (t.includes('harvest') || t.includes('rainwater') || t.includes('pond')) return PRACTICE_ICONS.harvest;
  if (t.includes('fallow'))  return PRACTICE_ICONS.fallow;
  return <CheckCircle2 size={14} color="#3b82f6" />;
}

/* ─── score ring ─────────────────────────────────────────────────────────── */
function ScoreRing({ score, max = 100, color, size = 48 }: { score: number; max?: number; color: string; size?: number }) {
  const r = size * 0.38, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, score / max));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-glass)" strokeWidth="5" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="5"
        strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
        style={{ transform: 'rotate(-90deg)', transformOrigin: `${cx}px ${cy}px`, transition: 'stroke-dasharray 0.5s ease' }}
      />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: size * 0.22, fontWeight: 800, fill: color, fontFamily: 'inherit' }}>
        {Math.round(score)}
      </text>
    </svg>
  );
}

/* ─── water bar comparison ───────────────────────────────────────────────── */
function WaterBar({ cottonMm, cropMm, saving, lang = 'en' }: { cottonMm: number; cropMm: number; saving: number; lang?: string }) {
  const maxMm = Math.max(cottonMm, cropMm, 1);
  const cPct = (cottonMm / maxMm) * 100;
  const wPct = (cropMm / maxMm) * 100;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          <span>{lang === 'gu' ? 'કોટન' : 'Cotton'}</span><span style={{ color: '#ef4444' }}>{cottonMm}mm</span>
        </div>
        <div style={{ height: 10, borderRadius: 3, background: 'var(--border-glass)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${cPct}%`, background: '#ef444470', borderRadius: 3 }} />
        </div>
      </div>
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          <span>{lang === 'gu' ? 'આ પાક' : 'This Crop'}</span><span style={{ color: '#10b981' }}>{cropMm}mm</span>
        </div>
        <div style={{ height: 10, borderRadius: 3, background: 'var(--border-glass)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${wPct}%`, background: '#10b98180', borderRadius: 3, transition: 'width 0.5s ease' }} />
        </div>
      </div>
      {saving > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 8px', borderRadius: 5, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.25)' }}>
          <TrendingDown size={13} color="#10b981" />
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#10b981' }}>
            {lang === 'gu'
              ? `${saving}% કોટન કરતાં ઓછું પાણી — દર સીઝનમાં લગભગ ${Math.round(cottonMm * saving / 100)} મિમી બચત`
              : `${saving}% less water than Cotton — saves ~${Math.round(cottonMm * saving / 100)}mm per season`}
          </span>
        </div>
      )}
    </div>
  );
}

/* ─── AI structured display ──────────────────────────────────────────────── */
function AIStructured({ reason, lang: l }: { reason: string; lang: string }) {
  const sections = [
    { key: 'What', icon: <Sprout size={12} color="#3b82f6" />,    color: '#3b82f6' },
    { key: 'Why',  icon: <Lightbulb size={12} color="#f59e0b" />, color: '#f59e0b' },
    { key: 'Data', icon: <BarChart3 size={12} color="#10b981" />, color: '#10b981' },
    { key: 'Action', icon: <CheckCircle2 size={12} color="#a78bfa" />, color: '#a78bfa' },
  ];
  const sentences = reason
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .split(/[.!?]\s+/)
    .map(s => s.trim())
    .filter(Boolean);
  const chunks = sections.map((_, i) => {
    const size = Math.ceil(sentences.length / sections.length);
    const slice = sentences.slice(i * size, (i + 1) * size).join('. ');
    return slice ? slice + '.' : '';
  }).filter(c => c.length > 2);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 8 }}>
      {sections.slice(0, chunks.length).map((s, i) => (
        <div key={s.key} style={{
          display: 'flex', gap: 8, padding: '7px 10px',
          border: `1px solid ${s.color}20`,
          borderLeft: `2px solid ${s.color}`,
          borderRadius: 5, background: `${s.color}06`,
        }}>
          <div style={{ paddingTop: 1, flexShrink: 0 }}>{s.icon}</div>
          <div>
            <div style={{ fontSize: '0.58rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: s.color, marginBottom: 2 }}>
              {tx(s.key, l)}
            </div>
            <div style={{ fontSize: '0.76rem', color: 'var(--text-main)', lineHeight: 1.5 }}>{chunks[i]}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function CropAdvisor({ selectedVillage, setSelectedVillage, lang, demoMode }: Props) {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [villages, setVillages] = useState<Village[]>([]);
  const [data,    setData]    = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [season,  setSeason]  = useState('kharif');
  const [selected, setSelected] = useState<CropRecommendation | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => { getVillages().then(r => setVillages(r.villages)); }, []);

  useEffect(() => {
    if (!selectedVillage) return;
    setLoading(true);
    setData(null);
    getCropAdvice(selectedVillage, season).then(d => {
      setData(d); setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedVillage, season]);

  /* ── current crop list ── */
  const allCrops: CropRecommendation[] = data ? (
    season === 'annual' ? (data.recommendations?.perennial_crops || []) :
    season === 'rabi'   ? (data.recommendations?.rabi_crops || []) :
    (data.recommendations?.kharif_crops || [])
  ) : [];

  const best = allCrops[0] || null;
  const avgSaving = allCrops.length
    ? Math.round(allCrops.reduce((s, c) => s + Math.max(0, c.water_saving_vs_cotton_pct), 0) / allCrops.length)
    : 0;
  const topTol = best ? tolLabel(best.drought_tolerance) : '—';

  const openDetail = (c: CropRecommendation) => { setSelected(c); setPanelOpen(true); };
  const closeDetail = () => { setPanelOpen(false); setTimeout(() => setSelected(null), 220); };

  /* ── theme tokens ── */
  const card = isLight ? '#ffffff' : 'var(--bg-card)';
  const bdr  = isLight ? 'rgba(0,0,0,0.08)' : 'var(--border-glass)';
  const sub  = isLight ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.03)';

  /* cotton water reference */
  const COTTON_MM = 700;

  const SEASONS: [string, string, string][] = [
    ['kharif',  tx('Kharif', lang),    'June–Oct'],
    ['rabi',    tx('Rabi', lang),      'Oct–Mar'],
    ['annual',  tx('Perennial', lang), 'Year-round'],
  ];

  return (
    <div>
      <style>{`
        /* ── crop advisor layout ── */
        .ca-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 18px;
          align-items: start;
        }
        @media (max-width: 960px) { .ca-grid { grid-template-columns: 1fr; } }

        .ca-crops-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
          gap: 12px;
        }
        @media (max-width: 640px) { .ca-crops-grid { grid-template-columns: 1fr; } }

        /* ── panel ── */
        .ca-panel {
          background: ${card};
          border: 1px solid ${bdr};
          border-radius: 10px;
          overflow: hidden;
        }
        .ca-panel-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 11px 14px;
          border-bottom: 1px solid ${bdr};
          background: ${sub};
        }
        .ca-panel-title {
          display: flex; align-items: center; gap: 7px;
          font-size: 0.82rem; font-weight: 700; color: var(--text-main);
        }
        .ca-panel-body { padding: 14px; }

        /* ── KPI cards ── */
        .ca-kpi-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
          gap: 10px;
          margin-bottom: 18px;
        }
        .ca-kpi {
          background: ${card}; border: 1px solid ${bdr};
          border-radius: 8px; padding: 10px 12px;
        }
        .ca-kpi-label { font-size: 0.62rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.07em; color: var(--text-muted); margin-bottom: 5px; }
        .ca-kpi-val { font-size: 1.05rem; font-weight: 800; color: var(--text-main); line-height: 1.2; }
        .ca-kpi-sub { font-size: 0.62rem; color: var(--text-muted); margin-top: 2px; }

        /* ── season tabs ── */
        .ca-season-tabs {
          display: flex; gap: 0;
          border: 1px solid ${bdr};
          border-radius: 7px;
          overflow: hidden;
        }
        .ca-season-tab {
          flex: 1; padding: 6px 10px; border: none; cursor: pointer;
          font-size: 0.75rem; font-weight: 600; background: none;
          color: var(--text-muted); font-family: inherit;
          transition: all 0.12s; white-space: nowrap;
        }
        .ca-season-tab.active {
          background: var(--primary); color: #fff; font-weight: 700;
        }
        .ca-season-tab:not(.active):hover { background: ${sub}; color: var(--text-main); }

        /* ── crop card ── */
        .ca-crop-card {
          background: ${card};
          border: 1px solid ${bdr};
          border-radius: 10px;
          overflow: hidden;
          transition: box-shadow 0.15s, border-color 0.15s;
          cursor: pointer;
          position: relative;
        }
        .ca-crop-card:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,${isLight ? '0.1' : '0.3'});
          border-color: rgba(59,130,246,0.35);
        }
        .ca-crop-card.top-pick {
          border-color: rgba(16,185,129,0.5);
          box-shadow: 0 0 0 1px rgba(16,185,129,0.25);
        }
        .ca-crop-card.selected {
          border-color: var(--primary);
          box-shadow: 0 0 0 2px rgba(59,130,246,0.2);
        }

        /* ── action buttons ── */
        .ca-action-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 7px 13px; border-radius: 6px;
          font-size: 0.78rem; font-weight: 700; cursor: pointer;
          font-family: inherit; transition: all 0.15s; border: none;
          white-space: nowrap;
        }

        /* ── slide-in detail panel overlay ── */
        .ca-detail-overlay {
          position: fixed; inset: 0; z-index: 400;
          background: rgba(0,0,0,0.45);
          backdrop-filter: blur(3px);
          display: flex; justify-content: flex-end;
        }
        .ca-detail-panel {
          width: 100%; max-width: 420px;
          background: ${card};
          border-left: 1px solid ${bdr};
          height: 100%; overflow-y: auto;
          animation: caSlideIn 0.22s ease-out;
        }
        @keyframes caSlideIn {
          from { transform: translateX(100%); }
          to   { transform: translateX(0); }
        }
        .ca-detail-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px; border-bottom: 1px solid ${bdr};
          position: sticky; top: 0; background: ${card}; z-index: 1;
        }
        .ca-detail-section {
          padding: 14px 16px; border-bottom: 1px solid ${bdr};
        }
        .ca-detail-label {
          font-size: 0.6rem; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.07em; color: var(--text-muted); margin-bottom: 6px;
        }

        /* ── practice cards ── */
        .ca-practices-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: 10px;
        }
        .ca-practice-card {
          background: ${card}; border: 1px solid ${bdr};
          border-radius: 8px; padding: 10px 12px;
          display: flex; gap: 9px;
        }
        .ca-practice-icon {
          width: 28px; height: 28px; border-radius: 6px; flex-shrink: 0;
          background: rgba(59,130,246,0.08); border: 1px solid rgba(59,130,246,0.15);
          display: flex; align-items: center; justify-content: center;
        }

        /* ── ai rec panel ── */
        .ca-ai-rec {
          background: ${isLight ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.08)'};
          border: 1px solid rgba(99,102,241,0.25);
          border-radius: 10px; padding: 14px 16px;
          margin-bottom: 18px;
        }
      `}</style>

      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 9,
              background: 'linear-gradient(135deg,#16a34a,#22c55e)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(22,163,74,0.3)',
            }}>
              <Sprout size={18} color="#fff" />
            </div>
            {tx('Crop Advisor', lang)}
          </h1>
          <p className="text-sm text-muted" style={{ marginTop: 3 }}>
            {tx('AI-powered water-efficient crop recommendations for Saurashtra', lang)}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <VillageSelect villages={villages} value={selectedVillage} onChange={setSelectedVillage} width={200} />
          <div className="ca-season-tabs">
            {SEASONS.map(([v, label]) => (
              <button
                key={v}
                className={`ca-season-tab${season === v ? ' active' : ''}`}
                onClick={() => setSeason(v)}
              >{label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── LOADING ─────────────────────────────────────────────────────── */}
      {loading && (
        <div className="loading">
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', marginRight: 10 }} />
          {lang === 'gu' ? 'પાક ભલામણોનું વિશ્લેષણ...' : tx('Analyzing...', lang)}
        </div>
      )}

      {/* ── MAIN CONTENT ────────────────────────────────────────────────── */}
      {data && !loading && (
        <>
          {/* ── AI Status + Disclaimer ── */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 8, marginBottom: 16,
            padding: '8px 14px', borderRadius: 7,
            background: isLight ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${bdr}`,
            fontSize: '0.75rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
              <span style={{ fontWeight: 700, color: '#10b981' }}>{tx('AI Validated', lang)}</span>
              <span style={{ color: 'var(--text-muted)' }}>— {data.village_name}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)' }}>
              <AlertTriangle size={12} color="#f59e0b" />
              {tx('Local validation recommended', lang)}
            </div>
          </div>

          {/* ── KPI ROW ── */}
          <div className="ca-kpi-row">
            <div className="ca-kpi" style={{ borderLeft: `3px solid #3b82f6` }}>
              <div className="ca-kpi-label">{tx('Recommended Crops', lang)}</div>
              <div className="ca-kpi-val" style={{ color: '#3b82f6' }}>{allCrops.length}</div>
              <div className="ca-kpi-sub">
                {SEASONS.find(s => s[0] === season)?.[1]} {lang === 'gu' ? 'ઋતુ' : 'season'}
              </div>
            </div>
            <div className="ca-kpi" style={{ borderLeft: `3px solid #10b981` }}>
              <div className="ca-kpi-label">{tx('Avg Water Saving', lang)}</div>
              <div className="ca-kpi-val" style={{ color: '#10b981' }}>{avgSaving > 0 ? `${avgSaving}%` : '—'}</div>
              <div className="ca-kpi-sub">{tx('vs Cotton baseline', lang)}</div>
            </div>
            <div className="ca-kpi" style={{ borderLeft: `3px solid ${tolColor(best?.drought_tolerance || '')}` }}>
              <div className="ca-kpi-label">{tx('Top Drought Tolerance', lang)}</div>
              <div className="ca-kpi-val" style={{ color: tolColor(best?.drought_tolerance || '') }}>
                {best ? localizedTolLabel(best.drought_tolerance, lang) : '—'}
              </div>
              <div className="ca-kpi-sub">{tx('Best recommendation', lang)}</div>
            </div>
            <div className="ca-kpi" style={{ borderLeft: `3px solid ${data.drought_risk_level === 'LOW' ? '#10b981' : data.drought_risk_level === 'MODERATE' ? '#f59e0b' : '#ef4444'}` }}>
              <div className="ca-kpi-label">{tx('Drought Risk', lang)}</div>
              <div className="ca-kpi-val" style={{ color: data.drought_risk_level === 'LOW' ? '#10b981' : data.drought_risk_level === 'MODERATE' ? '#f59e0b' : '#ef4444' }}>
                {localizedRiskLabel(data.drought_risk_level, lang)}
              </div>
              <div className="ca-kpi-sub">{tx('Current conditions', lang)}</div>
            </div>
            <div className="ca-kpi" style={{ borderLeft: `3px solid #a78bfa` }}>
              <div className="ca-kpi-label">{tx('Best Crop', lang)}</div>
              <div className="ca-kpi-val" style={{ color: '#a78bfa', fontSize: '0.88rem' }}>{best?.name || '—'}</div>
              <div className="ca-kpi-sub">Score: {best?.score ?? '—'}</div>
            </div>
          </div>

          {/* ── AI RECOMMENDATION PANEL ── */}
          {best && (
            <div className="ca-ai-rec">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 200 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={16} color="#818cf8" />
                  </div>
                  <div>
                    <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: '#818cf8', marginBottom: 2 }}>
                      {tx('AI Recommendation', lang)}
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {tx('Best Crop:', lang)} <span style={{ color: '#10b981' }}>{best.name}</span>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  {[
                    { label: tx('Water Saved:', lang), val: best.water_saving_vs_cotton_pct > 0 ? `${best.water_saving_vs_cotton_pct}%` : 'Similar', color: '#10b981' },
                    { label: tx('Risk Level:', lang),  val: data.drought_risk_level, color: data.drought_risk_level === 'LOW' ? '#10b981' : data.drought_risk_level === 'MODERATE' ? '#f59e0b' : '#ef4444' },
                    { label: tx('Confidence:', lang),  val: best.score >= 70 ? 'HIGH' : best.score >= 50 ? 'MODERATE' : 'LOW', color: best.score >= 70 ? '#10b981' : best.score >= 50 ? '#f59e0b' : '#ef4444' },
                  ].map(m => (
                    <div key={m.label} style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>{m.label}</div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: m.color }}>{m.val}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ marginTop: 10, fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.55, borderTop: `1px solid ${bdr}`, paddingTop: 10 }}>
                <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{tx('Next Action:', lang)}</span>{' '}
                {lang === 'gu'
                  ? `${best.name} ઉગાડો — ઓછા પાણીની જરૂર (${best.water_requirement_mm}mm) અને ઉચ્ચ ઉત્પાદન.`
                  : `Plant ${best.name} this ${season} season — needs only ${best.water_requirement_mm}mm water, saving ${best.water_saving_vs_cotton_pct}% vs cotton.`
                }
              </div>
            </div>
          )}

          {/* ── MAIN GRID ── */}
          <div className="ca-grid">
            {/* LEFT: crop cards */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sprout size={14} color="#22c55e" />
                  {allCrops.length > 0
                    ? (lang === 'gu'
                      ? `${data.village_name} માટે ${allCrops.length} પાકની ભલામણ`
                      : `${allCrops.length} crops recommended for ${data.village_name}`)
                    : ''}
                </div>
                <span className={`badge ${riskBadge(data.drought_risk_level)}`} style={{ fontSize: '0.68rem' }}>
                  {data.drought_risk_level} Drought Risk
                </span>
              </div>

              {allCrops.length === 0 ? (
                <div className="ca-panel" style={{ padding: '40px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  <Sprout size={32} color="var(--text-muted)" style={{ marginBottom: 12, opacity: 0.4 }} />
                  <div>{tx('No crops available for this season.', lang)}</div>
                </div>
              ) : (
                <div className="ca-crops-grid">
                  {allCrops.map((crop, idx) => {
                    const isTop    = idx === 0;
                    const isSel    = selected?.crop_id === crop.crop_id;
                    const sc       = suitColor(crop.suitability);
                    const tc       = tolColor(crop.drought_tolerance);
                    const hasSaving = crop.water_saving_vs_cotton_pct > 0;
                    return (
                      <div
                        key={crop.crop_id}
                        className={`ca-crop-card${isTop ? ' top-pick' : ''}${isSel ? ' selected' : ''}`}
                        onClick={() => openDetail(crop)}
                      >
                        {/* Card header */}
                        <div style={{
                          padding: '10px 12px 8px',
                          background: isTop
                            ? isLight ? 'rgba(16,185,129,0.05)' : 'rgba(16,185,129,0.07)'
                            : sub,
                          borderBottom: `1px solid ${bdr}`,
                          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                        }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            {/* Rank badge */}
                            <div style={{
                              width: 26, height: 26, borderRadius: 6, flexShrink: 0,
                              background: isTop ? 'rgba(16,185,129,0.15)' : 'rgba(148,163,184,0.1)',
                              border: `1px solid ${isTop ? 'rgba(16,185,129,0.3)' : bdr}`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: '0.7rem', fontWeight: 800,
                              color: isTop ? '#10b981' : 'var(--text-muted)',
                            }}>#{idx + 1}</div>
                            <div>
                              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 5 }}>
                                {crop.name}
                                {isTop && <Star size={11} color="#f59e0b" fill="#f59e0b" />}
                              </div>
                              <div style={{ fontSize: '0.63rem', color: 'var(--text-muted)', marginTop: 1, textTransform: 'capitalize' }}>
                                {crop.season} • {crop.water_requirement_mm}mm water
                              </div>
                            </div>
                          </div>
                          <ScoreRing score={crop.score} max={85} color={sc} size={38} />
                        </div>

                        {/* Card body */}
                        <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                          {/* Metrics row */}
                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
                            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                              <div style={{ fontWeight: 600, marginBottom: 2 }}>{tx('Drought Tolerance', lang)}</div>
                              <span style={{ color: tc, fontWeight: 700, fontSize: '0.7rem' }}>
                                 {localizedTolLabel(crop.drought_tolerance, lang)}
                               </span>
                            </div>
                            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                              <div style={{ fontWeight: 600, marginBottom: 2 }}>{tx('Water Saving vs Cotton', lang)}</div>
                              {hasSaving
                                ? <span style={{ color: '#10b981', fontWeight: 700, fontSize: '0.7rem', display: 'inline-flex', alignItems: 'center', gap: 2 }}><TrendingDown size={11} /> {crop.water_saving_vs_cotton_pct}%</span>
                                : <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>
                                   {tx('Similar', lang)}
                                 </span>
                              }
                            </div>
                            <div style={{ fontSize: '0.62rem', color: 'var(--text-muted)' }}>
                              <div style={{ fontWeight: 600, marginBottom: 2 }}>{tx('Suitability', lang)}</div>
                              <span style={{ color: sc, fontWeight: 700, fontSize: '0.7rem', textTransform: 'capitalize' }}>
                                {crop.suitability.replace('_', ' ')}
                              </span>
                            </div>
                          </div>

                          {/* Reason */}
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.45, borderTop: `1px solid ${bdr}`, paddingTop: 6 }}>
                            {crop.reason}
                          </div>

                          {/* Actions */}
                          <div style={{ display: 'flex', gap: 6, marginTop: 2 }}>
                            <button
                              onClick={e => { e.stopPropagation(); openDetail(crop); }}
                              style={{
                                flex: 1, padding: '5px 0', borderRadius: 5, cursor: 'pointer',
                                background: 'none', border: `1px solid ${bdr}`,
                                color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 600,
                                fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                transition: 'all 0.12s',
                              }}
                            >
                              <Info size={11} /> {tx('View Details', lang)}
                            </button>
                            {isTop && (
                              <button
                                onClick={e => { e.stopPropagation(); openDetail(crop); }}
                                style={{
                                  flex: 1, padding: '5px 0', borderRadius: 5, cursor: 'pointer',
                                  background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                                  color: '#10b981', fontSize: '0.72rem', fontWeight: 700,
                                  fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
                                  transition: 'all 0.12s',
                                }}
                              >
                                <Star size={11} fill="#10b981" /> {tx('Select Crop', lang)}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* RIGHT SIDEBAR */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Water Saving Visual (best crop) */}
              {best && best.water_saving_vs_cotton_pct > 0 && (
                <div className="ca-panel">
                  <div className="ca-panel-head">
                    <div className="ca-panel-title">
                      <Droplets size={13} color="#3b82f6" />
                      {tx('Water Comparison', lang)}
                    </div>
                  </div>
                  <div className="ca-panel-body">
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 10 }}>
                      {tx('Cotton Water Need', lang)} vs <strong style={{ color: 'var(--text-main)' }}>{best.name}</strong>
                    </div>
                    <WaterBar
                      cottonMm={COTTON_MM}
                      cropMm={best.water_requirement_mm}
                      saving={best.water_saving_vs_cotton_pct}
                    />
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div className="ca-panel">
                <div className="ca-panel-head">
                  <div className="ca-panel-title"><Activity size={13} color="#818cf8" /> {tx('Actions', lang)}</div>
                </div>
                <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {[
                    { label: tx('Ask Copilot', lang),    icon: <Bot size={13} />,           color: '#818cf8', bg: 'rgba(99,102,241,0.1)',  brd: 'rgba(99,102,241,0.3)',  path: '/copilot'    },
                    { label: tx('Run What-If', lang),     icon: <FlaskConical size={13} />,  color: '#a78bfa', bg: 'rgba(139,92,246,0.08)', brd: 'rgba(139,92,246,0.25)', path: '/simulator'  },
                  ].map(a => (
                    <button
                      key={a.label}
                      onClick={() => navigate(a.path)}
                      style={{
                        width: '100%', display: 'flex', alignItems: 'center', gap: 7,
                        padding: '7px 10px', borderRadius: 6, cursor: 'pointer',
                        background: a.bg, border: `1px solid ${a.brd}`,
                        color: a.color, fontSize: '0.78rem', fontWeight: 700,
                        fontFamily: 'inherit', transition: 'all 0.15s',
                      }}
                    >
                      {a.icon}{a.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Season info */}
              <div className="ca-panel" style={{ padding: '12px 14px' }}>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>
                  Season Overview
                </div>
                {SEASONS.map(([v, label, period]) => (
                  <div key={v} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '5px 0', borderBottom: `1px solid ${bdr}`, fontSize: '0.75rem',
                    color: season === v ? 'var(--primary)' : 'var(--text-muted)',
                    fontWeight: season === v ? 700 : 400,
                  }}>
                    <span>{label}</span>
                    <span style={{ fontSize: '0.65rem' }}>{period}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── WATER SAVING PRACTICES ── */}
          <div style={{ marginTop: 18 }}>
            <div className="ca-panel">
              <div className="ca-panel-head">
                <div className="ca-panel-title">
                  <Lightbulb size={13} color="#f59e0b" />
                  {tx('Water Saving Practices', lang)}
                </div>
                <span className={`badge ${riskBadge(data.drought_risk_level)}`} style={{ fontSize: '0.65rem' }}>
                  {data.drought_risk_level} risk regime
                </span>
              </div>
              <div style={{ padding: '12px 14px' }}>
                <div className="ca-practices-grid">
                  {(data.water_saving_tips || []).map((tip: string, i: number) => (
                    <div key={i} className="ca-practice-card">
                      <div className="ca-practice-icon">
                        {getPracticeIcon(tip)}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-main)', lineHeight: 1.45 }}>{tip}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── EMPTY STATE ── */}
      {!data && !loading && (
        <div className="ca-panel" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Sprout size={36} color="var(--text-muted)" style={{ marginBottom: 12, opacity: 0.35 }} />
          <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: 6 }}>
            {lang === 'gu' ? 'ગામ પસંદ કરો' : 'Select a village to see crop recommendations'}
          </div>
        </div>
      )}

      {/* ── CROP DETAIL SLIDE PANEL ── */}
      {panelOpen && selected && (
        <div className="ca-detail-overlay" onClick={closeDetail}>
          <div className="ca-detail-panel" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="ca-detail-head">
              <div>
                <div style={{ fontSize: '0.62rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 3 }}>
                  {tx('Crop Details', lang)}
                </div>
                <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {selected.name}
                  {allCrops[0]?.crop_id === selected.crop_id && <Star size={13} color="#f59e0b" fill="#f59e0b" />}
                </div>
              </div>
              <button
                onClick={closeDetail}
                style={{ background: 'none', border: `1px solid ${bdr}`, borderRadius: 5, width: 28, height: 28, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontFamily: 'inherit' }}
              >
                <X size={14} />
              </button>
            </div>

            {/* Metrics grid */}
            <div className="ca-detail-section">
              <div className="ca-detail-label">{tx('Key Metrics', lang)}</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: tx('Water Requirement', lang), val: `${selected.water_requirement_mm}mm`, color: '#3b82f6' },
                  {
                    label: tx('Season', lang),
                    val: selected.season === 'kharif'
                      ? tx('Kharif', lang)
                      : selected.season === 'rabi'
                        ? tx('Rabi', lang)
                        : tx('Perennial', lang),
                    color: '#f59e0b'
                  },
                  {
                    label: tx('Drought Tolerance', lang),
                    val: localizedTolLabel(selected.drought_tolerance, lang),
                    color: tolColor(selected.drought_tolerance)
                  },
                  { label: tx('Suitability Score', lang), val: `${selected.score}/85`, color: suitColor(selected.suitability) },
                ].map(m => (
                  <div key={m.label} style={{ background: sub, borderRadius: 6, padding: '8px 10px', border: `1px solid ${bdr}` }}>
                    <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>{m.label}</div>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: m.color }}>{m.val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Water comparison */}
            <div className="ca-detail-section">
              <div className="ca-detail-label">{tx('Water Comparison', lang)}</div>
              <WaterBar cottonMm={COTTON_MM} cropMm={selected.water_requirement_mm} saving={selected.water_saving_vs_cotton_pct} lang={lang} />
            </div>

            {/* AI reason structured */}
            <div className="ca-detail-section">
              <div className="ca-detail-label">{tx('Why AI Recommends', lang)}</div>
              <AIStructured reason={selected.reason} lang={lang} />
            </div>

            {/* Village conditions */}
            <div className="ca-detail-section">
              <div className="ca-detail-label">{tx('Village Conditions', lang)}</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', fontWeight: 600,
                  padding: '4px 9px', borderRadius: 5, background: sub, border: `1px solid ${bdr}`,
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>{tx('Village', lang)}:</span>
                  <span style={{ color: 'var(--text-main)' }}>{data?.village_name || selectedVillage}</span>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', fontWeight: 600,
                  padding: '4px 9px', borderRadius: 5, background: sub, border: `1px solid ${bdr}`,
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>{tx('Risk', lang)}:</span>
                  <span className={`badge ${riskBadge(data?.drought_risk_level || 'MODERATE')}`} style={{ fontSize: '0.62rem', padding: '1px 5px' }}>
                    {data?.drought_risk_level}
                  </span>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.72rem', fontWeight: 600,
                  padding: '4px 9px', borderRadius: 5, background: sub, border: `1px solid ${bdr}`,
                }}>
                  <span style={{ color: 'var(--text-muted)' }}>{tx('Season', lang)}:</span>
                  <span style={{ color: 'var(--text-main)' }}>
                     {SEASONS.find(s => s[0] === season)?.[1] || season}
                   </span>
                </div>
              </div>
            </div>

            {/* Confidence & disclaimer */}
            <div className="ca-detail-section">
              <div className="ca-detail-label">{tx('Confidence', lang)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'var(--border-glass)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.min(100, (selected.score / 85) * 100)}%`, background: suitColor(selected.suitability), borderRadius: 3, transition: 'width 0.5s' }} />
                </div>
                <span style={{ fontSize: '0.75rem', fontWeight: 700, color: suitColor(selected.suitability), minWidth: 40 }}>
                  {Math.round((selected.score / 85) * 100)}%
                </span>
              </div>
              <div style={{
                display: 'flex', alignItems: 'flex-start', gap: 6, padding: '7px 10px',
                borderRadius: 5, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)',
                fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: 1.5,
              }}>
                <AlertTriangle size={12} color="#f59e0b" style={{ marginTop: 1, flexShrink: 0 }} />
                {data?.disclaimer || tx('Local validation recommended', lang)}
              </div>
            </div>

            {/* Action button */}
            <div style={{ padding: '12px 16px' }}>
              <button
                onClick={() => navigate('/copilot')}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '9px', borderRadius: 7, cursor: 'pointer',
                  background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)',
                  color: '#10b981', fontSize: '0.8rem', fontWeight: 700, fontFamily: 'inherit',
                  transition: 'all 0.15s',
                }}
              >
                <Bot size={14} /> {lang === 'gu' ? `${selected.name} વિશે Copilot ને પૂછો` : `Ask Copilot about ${selected.name}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
