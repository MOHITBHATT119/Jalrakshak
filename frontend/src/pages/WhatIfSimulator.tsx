import React, { useEffect, useRef, useState } from 'react';
import {
  Play, RotateCcw, Zap, CloudRain, Droplets, Leaf, Recycle,
  TrendingUp, TrendingDown, Minus, ChevronRight, Brain,
  FlaskConical, BarChart3, Sparkles, AlertTriangle,
  Info, Loader2, Target, CheckCircle2, ArrowRight,
  Lightbulb, ShieldCheck, Activity,
} from 'lucide-react';
import { getVillages, runScenario, sendCopilot, Village } from '../services/api';
import VillageSelect from '../components/VillageSelect';
import { useTheme } from '../context/ThemeContext';

interface Props {
  selectedVillage: string;
  setSelectedVillage: (v: string) => void;
  lang: string;
  demoMode: boolean;
}

/* ─── pure helpers (no UI) ───────────────────────────────────────────────── */
const healthColor = (s: number) =>
  s >= 70 ? '#10b981' : s >= 50 ? '#f59e0b' : s >= 30 ? '#f97316' : '#ef4444';

const riskColor = (s: number) =>
  s <= 30 ? '#10b981' : s <= 50 ? '#f59e0b' : s <= 70 ? '#f97316' : '#ef4444';

const deltaColor = (v: number, good: 'pos' | 'neg') => {
  if (Math.abs(v) < 0.05) return 'var(--text-muted)';
  return (good === 'pos' ? v > 0 : v < 0) ? '#10b981' : '#ef4444';
};

const fmtDelta = (v: number, unit = '') =>
  `${v > 0 ? '+' : ''}${v.toFixed(1)}${unit}`;

const badgeClass = (cat: string) => {
  const c = (cat || '').toLowerCase();
  if (c === 'good') return 'badge-low';
  if (c === 'moderate') return 'badge-moderate';
  if (c === 'critical' || c === 'high') return 'badge-high';
  return 'badge-severe';
};

const balanceBadge = (s: string) => {
  const v = (s || '').toLowerCase();
  if (v === 'surplus') return 'badge-low';
  if (v === 'deficit') return 'badge-high';
  return 'badge-moderate';
};

/* ─── translation ────────────────────────────────────────────────────────── */
const TR: Record<string, string> = {
  'What-If Simulator':                      'શું-જો સિમ્યુલેટર',
  'Test water-management scenarios and compare projected outcomes.':
                                            'જળ-વ્યવસ્થાપન સ્થિતિ ચકાસો અને અનુમાનિત પરિણામ સરખાવો.',
  'Scenario Parameters':                    'સ્થિતિ ચલ',
  'Reset Scenario':                         'સ્થિતિ રીસેટ',
  'Rainfall Change':                        'વરસાદ ફેરફાર',
  'Monsoon deviation from baseline':        'ચોમાસું વિચલન',
  'GW Extraction':                          'ભૂગર્ભ ઉત્ખનન',
  'Change in groundwater pumping':          'ભૂ.જ. પમ્પિંગ ફેરફાર',
  'Irrigation Efficiency':                  'સિંચાઈ કાર્યક્ષમતા',
  'Improvement in irrigation methods':      'સિંચાઈ સુધારો',
  'Crop Switching':                         'પાક પરિવર્તન',
  '% farmers to drought-tolerant crops':    '% ખેડૂત → સહિષ્ણુ પાક',
  'Recharge Intervention':                  'રિચાર્જ હસ્તક્ષેપ',
  'Artificial recharge / check-dams':       'ચેક-ડૅમ / રિચાર્જ',
  'Quick Presets':                          'ઝડપી પ્રિસેટ',
  'Drought Year':                           'દુષ્કાળ વર્ષ',
  'Good Monsoon':                           'ઉત્તમ ચોમાસું',
  'Conservation':                           'જળ સંરક્ષણ',
  'Best Case':                              'શ્રેષ્ઠ સ્થિતિ',
  'Scenario Summary':                       'સ્થિતિ સારાંશ',
  'Run Simulation':                         'સિમ્યુલેશન ચલાવો',
  'Running…':                               'ચાલી રહ્યું છે…',
  'Simulating scenario…':                   'સ્થિતિ ગણવામાં આવી રહી છે…',
  'Calculating water impact for':           'જળ અસર ગણાઈ રહી છે',
  'No Simulation Yet':                      'હજી સિમ્યુલેશન નથી',
  'Configure parameters on the left, then run the simulation.':
                                            'ડાબી બાજુ ચલ સેટ કરો, પછી સિમ્યુલેશન ચલાવો.',
  'Scenario Results':                       'સ્થિતિ પરિણામ',
  'Projected Water Health':                 'અનુ. જળ સ્વાસ્થ્ય',
  'Drought Risk Change':                    'દુષ્કાળ જોખમ ફેરફાર',
  'Water Supply Change':                    'જળ પુરવઠો ફેરફાર',
  'Water Balance Change':                   'જળ સંતુલન ફેરફાર',
  'Current':                                'વર્તમાન',
  'Projected':                              'અનુ.',
  'Baseline vs Scenario':                   'આધારરેખા vs સ્થિતિ',
  'Indicator':                              'સૂચક',
  'Change':                                 'ફેરફાર',
  'Water Health Score':                     'જળ સ્વાસ્થ્ય',
  'Drought Risk Score':                     'દુષ્કાળ જોખમ',
  'Water Supply':                           'જળ પુરવઠો',
  'Water Demand':                           'જળ માંગ',
  'Water Balance':                          'જળ સંતુલન',
  'Balance Status:':                        'સ્થિતિ:',
  'AI Explanation':                         'AI સ્પષ્ટીકરણ',
  'Why did the scenario change?':           'સ્થિતિ કેમ બદલાઈ?',
  'Explain this scenario':                  'સ્થિતિ સ્પષ્ટ કરો',
  'Analyzing…':                             'વિશ્લેષણ…',
  'What':                                   'શું',
  'Impact':                                 'અસર',
  'Reason':                                 'કારણ',
  'Confidence':                             'વિશ્વાસ',
  'Recommendation':                         'ભલામણ',
  'Demo Mode — using fallback response':    'ડેમો મોડ — ફૉલ-બૅક ઉત્તર',
};
function tx(k: string, l: string) { return l === 'gu' ? (TR[k] ?? k) : k; }

/* ─── SVG arc gauge ──────────────────────────────────────────────────────── */
function ScoreArc({ score, color, size = 80 }: { score: number; color: string; size?: number }) {
  const r = size * 0.37, cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(1, Math.max(0, score / 100));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--border-glass)" strokeWidth="6" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={`${pct * circ} ${circ}`} strokeLinecap="round"
        style={{ transform:'rotate(-90deg)', transformOrigin:`${cx}px ${cy}px`, transition:'stroke-dasharray 0.55s ease' }} />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        style={{ fontSize: size * 0.21, fontWeight: 800, fill: color, fontFamily:'inherit' }}>
        {Math.round(score)}
      </text>
    </svg>
  );
}

/* ─── compact +/− stepper ────────────────────────────────────────────────── */
interface StepperProps {
  value: number; min: number; max: number; step: number;
  unit?: string; accentColor: string;
  onChange: (v: number) => void;
}
function Stepper({ value, min, max, step, unit = '%', accentColor, onChange }: StepperProps) {
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const valColor = value > 0 ? '#3b82f6' : value < 0 ? '#ef4444' : 'var(--text-muted)';
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4 }}>
      <button
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        aria-label="Decrease"
        style={{
          width:26, height:26, border:'1px solid var(--border-glass)', borderRadius:5,
          background:'none', cursor:'pointer', color:'var(--text-muted)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontWeight:700, fontSize:'1rem', lineHeight:1,
          opacity: value <= min ? 0.35 : 1, transition:'all 0.12s',
          fontFamily:'inherit',
        }}
      >−</button>
      <input
        type="number" value={value} min={min} max={max} step={step}
        onChange={e => onChange(clamp(Number(e.target.value)))}
        style={{
          width:52, textAlign:'center', padding:'3px 4px',
          border:`1px solid ${accentColor}50`,
          borderRadius:5, background:'none',
          color: valColor, fontWeight:800, fontSize:'0.82rem',
          outline:'none', fontFamily:'inherit',
        }}
      />
      <button
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        aria-label="Increase"
        style={{
          width:26, height:26, border:'1px solid var(--border-glass)', borderRadius:5,
          background:'none', cursor:'pointer', color:'var(--text-muted)',
          display:'flex', alignItems:'center', justifyContent:'center',
          fontWeight:700, fontSize:'1rem', lineHeight:1,
          opacity: value >= max ? 0.35 : 1, transition:'all 0.12s',
          fontFamily:'inherit',
        }}
      >+</button>
      <span style={{ fontSize:'0.72rem', color:'var(--text-muted)', marginLeft:1 }}>{unit}</span>
    </div>
  );
}

/* ─── segmented option row ───────────────────────────────────────────────── */
function SegmentRow({ options, value, accentColor, onChange }: {
  options: number[]; value: number; accentColor: string; onChange: (v: number) => void;
}) {
  return (
    <div style={{ display:'flex', gap:3 }}>
      {options.map(opt => {
        const active = opt === value;
        return (
          <button key={opt}
            onClick={() => onChange(opt)}
            style={{
              flex:1, padding:'4px 0', border: `1px solid ${active ? accentColor : 'var(--border-glass)'}`,
              borderRadius:4, background: active ? `${accentColor}18` : 'none',
              color: active ? accentColor : 'var(--text-muted)', cursor:'pointer',
              fontSize:'0.68rem', fontWeight: active ? 700 : 500,
              transition:'all 0.12s', fontFamily:'inherit',
              whiteSpace:'nowrap',
            }}
          >
            {opt > 0 ? `+${opt}%` : `${opt}%`}
          </button>
        );
      })}
    </div>
  );
}

/* ─── compact progress bar ───────────────────────────────────────────────── */
function CompactBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.abs(value) / Math.abs(max) * 100);
  return (
    <div style={{ height:3, borderRadius:2, background:'var(--border-glass)', overflow:'hidden', marginTop:6 }}>
      <div style={{
        height:'100%', width:`${pct}%`, borderRadius:2,
        background: color, transition:'width 0.3s ease',
      }} />
    </div>
  );
}

/* ─── parameter card ─────────────────────────────────────────────────────── */
interface ParamCardProps {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: number;
  min: number; max: number; step: number;
  accentColor: string;
  controlType: 'stepper' | 'segment';
  segments?: number[];
  onChange: (v: number) => void;
}
function ParamCard({
  icon, label, description, value, min, max, step,
  accentColor, controlType, segments, onChange,
}: ParamCardProps) {
  const isActive = value !== 0;
  return (
    <div style={{
      border: `1px solid ${isActive ? accentColor + '55' : 'var(--border-glass)'}`,
      borderLeft: `3px solid ${isActive ? accentColor : 'transparent'}`,
      borderRadius:8, padding:'10px 12px',
      background: isActive ? `${accentColor}06` : 'none',
      transition:'all 0.15s',
    }}>
      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:8, gap:8 }}>
        <div style={{ display:'flex', alignItems:'center', gap:7, minWidth:0 }}>
          <div style={{
            width:26, height:26, borderRadius:5, flexShrink:0,
            background:`${accentColor}14`, border:`1px solid ${accentColor}28`,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>{icon}</div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:'0.8rem', fontWeight:700, color:'var(--text-main)', lineHeight:1.2 }}>{label}</div>
            <div style={{ fontSize:'0.65rem', color:'var(--text-muted)', marginTop:1, whiteSpace:'nowrap', overflow:'hidden', textOverflow:'ellipsis' }}>{description}</div>
          </div>
        </div>
        <div style={{
          fontSize:'0.82rem', fontWeight:800, flexShrink:0,
          color: value > 0 ? '#3b82f6' : value < 0 ? '#ef4444' : 'var(--text-muted)',
          minWidth:36, textAlign:'right',
        }}>
          {value > 0 ? '+' : ''}{value}%
        </div>
      </div>

      {controlType === 'stepper' ? (
        <Stepper value={value} min={min} max={max} step={step} accentColor={accentColor} onChange={onChange} />
      ) : (
        <SegmentRow options={segments!} value={value} accentColor={accentColor} onChange={onChange} />
      )}

      <CompactBar value={value} max={Math.max(Math.abs(min), Math.abs(max))} color={accentColor} />
    </div>
  );
}

/* ─── comparison bar row ─────────────────────────────────────────────────── */
function CmpRow({ label, curr, scen, unit = '', good, max: barMax }: {
  label: string; curr: number; scen: number; unit?: string; good: 'pos'|'neg'; max: number;
}) {
  const delta = scen - curr;
  const dc = deltaColor(delta, good);
  const DI = delta > 0.05 ? TrendingUp : delta < -0.05 ? TrendingDown : Minus;
  const cPct = Math.min(100, (curr / barMax) * 100);
  const sPct = Math.min(100, (scen / barMax) * 100);
  return (
    <div style={{ padding:'9px 0', borderBottom:'1px solid var(--border-glass)' }}>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:5 }}>
        <span style={{ fontSize:'0.78rem', color:'var(--text-main)', fontWeight:500 }}>{label}</span>
        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
          <span style={{ fontSize:'0.75rem', color:'var(--text-muted)' }}>{curr.toFixed(1)}{unit}</span>
          <ArrowRight size={11} color="var(--text-muted)" />
          <span style={{ fontSize:'0.78rem', fontWeight:700, color:'var(--text-main)' }}>{scen.toFixed(1)}{unit}</span>
          <div style={{ display:'flex', alignItems:'center', gap:3, fontSize:'0.75rem', fontWeight:700, color:dc, minWidth:52 }}>
            <DI size={11} />{fmtDelta(delta, unit)}
          </div>
        </div>
      </div>
      {/* Dual-track progress bar */}
      <div style={{ position:'relative', height:5, borderRadius:3, background:'var(--border-glass)' }}>
        <div style={{ position:'absolute', left:0, top:0, height:'100%', width:`${cPct}%`, background:'rgba(148,163,184,0.45)', borderRadius:3 }} />
        <div style={{
          position:'absolute', left:0, top:0, height:'100%', width:`${sPct}%`,
          background: dc, borderRadius:3, opacity:0.8, transition:'width 0.5s ease',
        }} />
      </div>
    </div>
  );
}

/* ─── AI explanation structured view ────────────────────────────────────── */
function AIStructured({ text, lang }: { text: string; lang: string }) {
  // Parse AI text into 5 structured sections: WHAT / IMPACT / REASON / CONFIDENCE / RECOMMENDATION
  const sections = [
    { key: 'What',           icon: <Target size={13} color="#3b82f6" />,    color:'#3b82f6' },
    { key: 'Impact',         icon: <Activity size={13} color="#f59e0b" />,  color:'#f59e0b' },
    { key: 'Reason',         icon: <Lightbulb size={13} color="#a78bfa" />, color:'#a78bfa' },
    { key: 'Confidence',     icon: <ShieldCheck size={13} color="#10b981" />,color:'#10b981' },
    { key: 'Recommendation', icon: <CheckCircle2 size={13} color="#06b6d4" />,color:'#06b6d4' },
  ];

  // Split into ~5 equal paragraphs or sentences
  const sentences = text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .split(/[.!?]\s+/)
    .map(s => s.trim())
    .filter(Boolean);

  const chunkSize = Math.ceil(sentences.length / sections.length);
  const chunks = sections.map((s, i) =>
    sentences.slice(i * chunkSize, (i + 1) * chunkSize).join('. ') + (sentences[(i + 1) * chunkSize - 1] ? '.' : '')
  ).filter(c => c.trim().length > 1);

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
      {sections.slice(0, chunks.length).map((s, i) => (
        <div key={s.key} style={{
          display:'flex', gap:10, padding:'9px 12px',
          border:`1px solid ${s.color}22`,
          borderLeft:`3px solid ${s.color}`,
          borderRadius:6,
          background:`${s.color}07`,
        }}>
          <div style={{ paddingTop:1, flexShrink:0 }}>{s.icon}</div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:'0.6rem', fontWeight:800, textTransform:'uppercase', letterSpacing:'0.07em', color:s.color, marginBottom:3 }}>
              {tx(s.key, lang)}
            </div>
            <div style={{ fontSize:'0.78rem', color:'var(--text-main)', lineHeight:1.55 }}>
              {chunks[i]}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════════════════ */
export default function WhatIfSimulator({ selectedVillage, setSelectedVillage, lang, demoMode }: Props) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [villages,     setVillages]     = useState<Village[]>([]);
  const [rainfall,     setRainfall]     = useState(0);
  const [extraction,   setExtraction]   = useState(0);
  const [irrigation,   setIrrigation]   = useState(0);
  const [cropSwitch,   setCropSwitch]   = useState(0);
  const [recharge,     setRecharge]     = useState(0);
  const [result,       setResult]       = useState<any>(null);
  const [loading,      setLoading]      = useState(false);
  const [aiText,       setAiText]       = useState('');
  const [aiLoading,    setAiLoading]    = useState(false);
  const [activePreset, setActivePreset] = useState<string|null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => { getVillages().then(r => setVillages(Array.isArray(r?.villages) ? r.villages : [])).catch(() => {}); }, []);

  /* ── presets ── */
  const PRESETS = [
    { key:'drought',  label:tx('Drought Year',  lang), icon:<AlertTriangle size={13} color="#ef4444" />, accent:'#ef4444', desc:'-30% rain, +10% extract', r:-30, e:10,  i:0,  c:0,  rch:0  },
    { key:'monsoon',  label:tx('Good Monsoon',   lang), icon:<CloudRain     size={13} color="#3b82f6" />, accent:'#3b82f6', desc:'+30% rain',               r:30,  e:0,   i:0,  c:0,  rch:0  },
    { key:'conserve', label:tx('Conservation',   lang), icon:<Leaf          size={13} color="#10b981" />, accent:'#10b981', desc:'-20% extract, +30% irrig', r:0,   e:-20, i:30, c:50, rch:60 },
    { key:'best',     label:tx('Best Case',      lang), icon:<Sparkles      size={13} color="#a78bfa" />, accent:'#a78bfa', desc:'+20% rain, max actions',   r:20,  e:-30, i:40, c:70, rch:80 },
  ];

  const applyPreset = (p: typeof PRESETS[0]) => {
    setRainfall(p.r); setExtraction(p.e); setIrrigation(p.i);
    setCropSwitch(p.c); setRecharge(p.rch);
    setActivePreset(p.key); setAiText('');
  };

  const resetAll = () => {
    setRainfall(0); setExtraction(0); setIrrigation(0);
    setCropSwitch(0); setRecharge(0);
    setActivePreset(null); setResult(null); setAiText('');
  };

  /* ── simulation ── */
  const runSim = () => {
    if (!selectedVillage) return;
    setLoading(true); setAiText('');
    runScenario({
      village_id: selectedVillage,
      rainfall_change_pct: rainfall,
      extraction_change_pct: extraction,
      irrigation_efficiency_pct: irrigation,
      crop_switching_pct: cropSwitch,
      recharge_intervention_pct: recharge,
    }).then(d => {
      setResult(d); setLoading(false);
      setTimeout(() => resultsRef.current?.scrollIntoView({ behavior:'smooth', block:'start' }), 80);
    }).catch(() => setLoading(false));
  };

  const explainAI = () => {
    if (!result) return;
    setAiLoading(true);
    const msg = `What-if simulation — rainfall ${rainfall > 0 ? '+' : ''}${rainfall}%, extraction ${extraction > 0 ? '+' : ''}${extraction}%, irrigation efficiency +${irrigation}%, crop switching ${cropSwitch}%, recharge ${recharge}%. Water health changed from ${result.current.water_health_score} to ${result.scenario.water_health_score} (${result.changes.health_score_change > 0 ? '+' : ''}${result.changes.health_score_change}). Drought risk went from ${result.current.drought_risk_level} to ${result.scenario.drought_risk_level}. Explain in 5 clear points: What changed, Impact on water resources, Reason behind the change, Confidence level, and Recommendation for village action.`;
    sendCopilot(msg, selectedVillage).then(r => {
      setAiText(r.response); setAiLoading(false);
    }).catch(() => setAiLoading(false));
  };

  const villageName = villages.find(v => v.village_id === selectedVillage)?.name || '—';
  const anyChanged = rainfall !== 0 || extraction !== 0 || irrigation !== 0 || cropSwitch !== 0 || recharge !== 0;

  /* ── theme tokens ── */
  const card  = isLight ? '#ffffff' : 'var(--bg-card)';
  const bdr   = isLight ? 'rgba(0,0,0,0.08)' : 'var(--border-glass)';
  const sub   = isLight ? 'rgba(0,0,0,0.025)' : 'rgba(255,255,255,0.03)';

  /* ── scenario summary rows ── */
  const summaryRows = [
    { label: tx('Rainfall Change', lang),       val: rainfall,   color:'#3b82f6' },
    { label: tx('GW Extraction', lang),          val: extraction, color:'#f97316' },
    { label: tx('Irrigation Efficiency', lang),  val: irrigation, color:'#10b981' },
    { label: tx('Crop Switching', lang),         val: cropSwitch, color:'#84cc16' },
    { label: tx('Recharge Intervention', lang),  val: recharge,   color:'#a78bfa' },
  ].filter(r => r.val !== 0);

  return (
    <div>
      <style>{`
        /* ── sim page global ── */
        .sim-layout {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 860px) {
          .sim-layout { grid-template-columns: 1fr; }
        }

        .sim-panel {
          background: ${card};
          border: 1px solid ${bdr};
          border-radius: 10px;
          overflow: hidden;
        }
        .sim-panel-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 11px 14px;
          border-bottom: 1px solid ${bdr};
          background: ${sub};
        }
        .sim-panel-title {
          display: flex; align-items: center; gap: 7px;
          font-size: 0.82rem; font-weight: 700; color: var(--text-main);
        }
        .sim-panel-body { padding: 12px 14px; }

        /* ── ghost button ── */
        .sim-ghost-btn {
          display: flex; align-items: center; gap: 4px;
          padding: 4px 9px; border-radius: 5px;
          border: 1px solid ${bdr}; background: none;
          cursor: pointer; font-size: 0.71rem; font-weight: 700;
          color: var(--text-muted); font-family: inherit;
          transition: all 0.12s;
        }
        .sim-ghost-btn:hover { background: ${sub}; color: var(--text-main); }

        /* ── primary run button ── */
        .sim-run-btn {
          width: 100%; display: flex; align-items: center; justify-content: center;
          gap: 7px; padding: 10px; border-radius: 7px;
          border: none; cursor: pointer; font-family: inherit;
          font-size: 0.84rem; font-weight: 800; letter-spacing: 0.02em;
          transition: all 0.18s;
        }
        .sim-run-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        /* ── preset buttons ── */
        .sim-preset-btn {
          display: flex; align-items: center; gap: 7px;
          width: 100%; padding: 7px 9px; border-radius: 6px;
          border: 1px solid ${bdr}; background: none;
          cursor: pointer; font-family: inherit; text-align: left;
          font-size: 0.75rem; font-weight: 600; color: var(--text-main);
          transition: all 0.12s;
        }
        .sim-preset-btn:hover { background: ${sub}; }

        /* ── metric header ── */
        .sim-metric-hd {
          display: grid; grid-template-columns: 1fr 72px 72px 68px;
          gap: 6px; padding: 7px 12px;
          font-size: 0.62rem; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.07em; color: var(--text-muted);
          border-bottom: 1px solid ${bdr}; background: ${sub};
        }

        /* ── score transition row ── */
        .sim-score-row {
          display: flex; align-items: center; gap: 12px;
          padding: 16px; background: ${sub};
          border-bottom: 1px solid ${bdr};
          flex-wrap: wrap; justify-content: center;
        }
        .sim-score-box {
          display: flex; flex-direction: column; align-items: center; gap: 4;
          padding: 12px 18px; border-radius: 8px;
          border: 1px solid ${bdr};
          background: ${isLight ? '#fff' : 'rgba(255,255,255,0.04)'};
          flex: 1; min-width: 110px;
        }
        .sim-score-lbl {
          font-size: 0.58rem; font-weight: 800; text-transform: uppercase;
          letter-spacing: 0.07em; color: var(--text-muted); margin-bottom: 2px;
        }

        /* ── KPI grid ── */
        .sim-kpi-grid {
          display: grid; grid-template-columns: repeat(auto-fit, minmax(130px,1fr)); gap: 8px;
        }
        .sim-kpi-card {
          background: ${card}; border: 1px solid ${bdr};
          border-radius: 8px; padding: 10px 12px;
        }

        /* ── AI section ── */
        .sim-ai-btn {
          display: flex; align-items: center; gap: 6px;
          padding: 6px 12px; border-radius: 6px; cursor: pointer;
          border: 1px solid rgba(139,92,246,0.3);
          background: linear-gradient(135deg,rgba(99,102,241,0.1),rgba(139,92,246,0.1));
          color: #a78bfa; font-size: 0.78rem; font-weight: 700;
          font-family: inherit; transition: all 0.15s;
        }
        .sim-ai-btn:hover { background: linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.18)); }
        .sim-ai-btn:disabled { opacity: 0.45; cursor: not-allowed; }

        /* ── number input reset ── */
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance:none; margin:0; }
        input[type=number] { -moz-appearance:textfield; }
      `}</style>

      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div className="page-header">
        <div>
          <h1 style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{
              width:38, height:38, borderRadius:9,
              background:'linear-gradient(135deg,#6366f1,#a78bfa)',
              display:'flex', alignItems:'center', justifyContent:'center',
              boxShadow:'0 4px 12px rgba(99,102,241,0.3)',
            }}>
              <FlaskConical size={18} color="#fff" />
            </div>
            {tx('What-If Simulator', lang)}
          </h1>
          <p className="text-sm text-muted" style={{ marginTop:3 }}>
            {tx('Test water-management scenarios and compare projected outcomes.', lang)}
          </p>
        </div>
        <VillageSelect villages={villages} value={selectedVillage} onChange={setSelectedVillage} width={210} />
      </div>

      {/* ── TWO-COLUMN LAYOUT ────────────────────────────────────────────── */}
      <div className="sim-layout">

        {/* ══════════ LEFT: PARAMETERS ══════════ */}
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Parameters panel */}
          <div className="sim-panel">
            <div className="sim-panel-head">
              <div className="sim-panel-title">
                <div style={{
                  width:22, height:22, borderRadius:5,
                  background:'rgba(99,102,241,0.12)', border:'1px solid rgba(99,102,241,0.25)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <FlaskConical size={12} color="#818cf8" />
                </div>
                {tx('Scenario Parameters', lang)}
              </div>
              {anyChanged && (
                <button className="sim-ghost-btn" onClick={resetAll}>
                  <RotateCcw size={10} /> {tx('Reset Scenario', lang)}
                </button>
              )}
            </div>

            <div className="sim-panel-body" style={{ display:'flex', flexDirection:'column', gap:8 }}>

              {/* Rainfall — stepper (can be negative) */}
              <ParamCard
                icon={<CloudRain size={13} color="#3b82f6" />}
                label={tx('Rainfall Change', lang)}
                description={tx('Monsoon deviation from baseline', lang)}
                value={rainfall} min={-50} max={50} step={5}
                accentColor="#3b82f6" controlType="stepper"
                onChange={v => { setRainfall(v); setActivePreset(null); }}
              />

              {/* GW Extraction — segmented (neg/zero/pos) */}
              <ParamCard
                icon={<Droplets size={13} color="#f97316" />}
                label={tx('GW Extraction', lang)}
                description={tx('Change in groundwater pumping', lang)}
                value={extraction} min={-50} max={50} step={10}
                accentColor="#f97316" controlType="segment"
                segments={[-30, -20, -10, 0, 10, 20, 30]}
                onChange={v => { setExtraction(v); setActivePreset(null); }}
              />

              {/* Irrigation — segmented (0→positive) */}
              <ParamCard
                icon={<TrendingUp size={13} color="#10b981" />}
                label={tx('Irrigation Efficiency', lang)}
                description={tx('Improvement in irrigation methods', lang)}
                value={irrigation} min={0} max={50} step={10}
                accentColor="#10b981" controlType="segment"
                segments={[0, 10, 20, 30, 40, 50]}
                onChange={v => { setIrrigation(v); setActivePreset(null); }}
              />

              {/* Crop Switching — stepper */}
              <ParamCard
                icon={<Leaf size={13} color="#84cc16" />}
                label={tx('Crop Switching', lang)}
                description={tx('% farmers to drought-tolerant crops', lang)}
                value={cropSwitch} min={0} max={100} step={10}
                accentColor="#84cc16" controlType="stepper"
                onChange={v => { setCropSwitch(v); setActivePreset(null); }}
              />

              {/* Recharge — stepper */}
              <ParamCard
                icon={<Recycle size={13} color="#a78bfa" />}
                label={tx('Recharge Intervention', lang)}
                description={tx('Artificial recharge / check-dams', lang)}
                value={recharge} min={0} max={100} step={10}
                accentColor="#a78bfa" controlType="stepper"
                onChange={v => { setRecharge(v); setActivePreset(null); }}
              />

              {/* Run button */}
              <button
                className="sim-run-btn"
                onClick={runSim}
                disabled={loading || !selectedVillage}
                style={{
                  marginTop:4,
                  background: loading || !selectedVillage
                    ? 'rgba(99,102,241,0.28)'
                    : 'linear-gradient(135deg,#4f46e5,#7c3aed)',
                  color:'#fff',
                  boxShadow: loading || !selectedVillage ? 'none' : '0 3px 12px rgba(99,102,241,0.35)',
                }}
              >
                {loading
                  ? <><Loader2 size={15} style={{ animation:'spin 1s linear infinite' }} /> {tx('Running…', lang)}</>
                  : <><Play size={14} /> {tx('Run Simulation', lang)}</>
                }
              </button>
            </div>
          </div>

          {/* Quick Presets */}
          <div className="sim-panel">
            <div className="sim-panel-head">
              <div className="sim-panel-title">
                <div style={{
                  width:22, height:22, borderRadius:5,
                  background:'rgba(245,158,11,0.12)', border:'1px solid rgba(245,158,11,0.25)',
                  display:'flex', alignItems:'center', justifyContent:'center',
                }}>
                  <Zap size={12} color="#f59e0b" />
                </div>
                {tx('Quick Presets', lang)}
              </div>
            </div>
            <div className="sim-panel-body" style={{ display:'flex', flexDirection:'column', gap:5 }}>
              {PRESETS.map(p => (
                <button
                  key={p.key}
                  className="sim-preset-btn"
                  onClick={() => applyPreset(p)}
                  style={{
                    background: activePreset === p.key ? `${p.accent}10` : undefined,
                    border: `1px solid ${activePreset === p.key ? p.accent + '50' : bdr}`,
                    color: activePreset === p.key ? p.accent : undefined,
                  }}
                >
                  <div style={{
                    width:22, height:22, borderRadius:5, flexShrink:0,
                    background:`${p.accent}14`, display:'flex', alignItems:'center', justifyContent:'center',
                  }}>{p.icon}</div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:'0.75rem' }}>{p.label}</div>
                    <div style={{ fontSize:'0.63rem', color:'var(--text-muted)', marginTop:1 }}>{p.desc}</div>
                  </div>
                  {activePreset === p.key && <CheckCircle2 size={13} color={p.accent} style={{ flexShrink:0 }} />}
                </button>
              ))}
            </div>
          </div>

          {/* Scenario summary */}
          {anyChanged && (
            <div className="sim-panel">
              <div className="sim-panel-head">
                <div className="sim-panel-title">
                  <Info size={12} color="#64748b" />
                  {tx('Scenario Summary', lang)}
                </div>
              </div>
              <div className="sim-panel-body" style={{ display:'flex', flexDirection:'column', gap:4 }}>
                {summaryRows.map(r => (
                  <div key={r.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize:'0.75rem', padding:'3px 0' }}>
                    <span style={{ color:'var(--text-muted)' }}>{r.label}</span>
                    <span style={{
                      fontWeight:700, color: r.val > 0 ? '#3b82f6' : '#ef4444',
                      background: r.val > 0 ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)',
                      borderRadius:4, padding:'1px 6px', fontSize:'0.72rem',
                    }}>
                      {r.val > 0 ? '+' : ''}{r.val}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ══════════ RIGHT: RESULTS ══════════ */}
        <div ref={resultsRef} style={{ display:'flex', flexDirection:'column', gap:12 }}>

          {/* Empty / loading state */}
          {!result && !loading && (
            <div className="sim-panel" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:260, gap:14, textAlign:'center', padding:'32px 24px' }}>
              <div style={{ width:56, height:56, borderRadius:8, background:'rgba(99,102,241,0.08)', border:'1px dashed rgba(99,102,241,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                <FlaskConical size={24} color="#818cf8" />
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:'0.95rem', color:'var(--text-main)', marginBottom:5 }}>
                  {tx('No Simulation Yet', lang)}
                </div>
                <div style={{ fontSize:'0.78rem', color:'var(--text-muted)', lineHeight:1.55, maxWidth:280 }}>
                  {tx('Configure parameters on the left, then run the simulation.', lang)}
                </div>
              </div>
            </div>
          )}

          {loading && (
            <div className="sim-panel" style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:260, gap:12 }}>
              <Loader2 size={28} color="#818cf8" style={{ animation:'spin 1s linear infinite' }} />
              <div style={{ textAlign:'center' }}>
                <div style={{ fontWeight:700, color:'var(--text-main)', marginBottom:3 }}>{tx('Simulating scenario…', lang)}</div>
                <div style={{ fontSize:'0.78rem', color:'var(--text-muted)' }}>{tx('Calculating water impact for', lang)} {villageName}</div>
              </div>
            </div>
          )}

          {result && !loading && (
            <>
              {/* ── Results panel ─────────────────────────────────────── */}
              <div className="sim-panel">
                <div className="sim-panel-head">
                  <div className="sim-panel-title">
                    <div style={{ width:22, height:22, borderRadius:5, background:'rgba(59,130,246,0.12)', border:'1px solid rgba(59,130,246,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <BarChart3 size={12} color="#60a5fa" />
                    </div>
                    {tx('Scenario Results', lang)}
                    <span style={{ fontWeight:400, color:'var(--text-muted)', fontSize:'0.72rem' }}>— {villageName}</span>
                  </div>
                  {demoMode && (
                    <span style={{ fontSize:'0.63rem', fontWeight:800, padding:'2px 7px', borderRadius:4, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', color:'#f59e0b' }}>DEMO</span>
                  )}
                </div>

                {/* Score transition */}
                <div className="sim-score-row">
                  <div className="sim-score-box">
                    <div className="sim-score-lbl">{tx('Current', lang)}</div>
                    <ScoreArc score={result.current.water_health_score} color={healthColor(result.current.water_health_score)} size={76} />
                    <span className={`badge ${badgeClass(result.current.water_health_category)}`} style={{ fontSize:'0.62rem', marginTop:3 }}>
                      {result.current.water_health_category}
                    </span>
                    <div style={{ fontSize:'0.63rem', color:'var(--text-muted)', marginTop:2 }}>
                      Drought: <strong style={{ color:riskColor(result.current.drought_risk_score) }}>{result.current.drought_risk_level}</strong>
                    </div>
                  </div>

                  <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4, flexShrink:0 }}>
                    <ChevronRight size={22} color={
                      result.changes.health_score_change > 0 ? '#10b981'
                      : result.changes.health_score_change < 0 ? '#ef4444'
                      : 'var(--text-muted)'
                    } />
                    <div style={{
                      fontSize:'0.68rem', fontWeight:800, padding:'2px 7px', borderRadius:4,
                      background: result.changes.health_score_change > 0 ? 'rgba(16,185,129,0.1)' : result.changes.health_score_change < 0 ? 'rgba(239,68,68,0.1)' : 'rgba(100,116,139,0.1)',
                      border:`1px solid ${result.changes.health_score_change > 0 ? 'rgba(16,185,129,0.25)' : result.changes.health_score_change < 0 ? 'rgba(239,68,68,0.25)' : 'rgba(100,116,139,0.15)'}`,
                      color: result.changes.health_score_change > 0 ? '#10b981' : result.changes.health_score_change < 0 ? '#ef4444' : 'var(--text-muted)',
                      whiteSpace:'nowrap',
                    }}>
                      {fmtDelta(result.changes.health_score_change)} pts
                    </div>
                  </div>

                  <div className="sim-score-box">
                    <div className="sim-score-lbl">{tx('Projected', lang)}</div>
                    <ScoreArc score={result.scenario.water_health_score} color={healthColor(result.scenario.water_health_score)} size={76} />
                    <span className={`badge ${badgeClass(result.scenario.water_health_category)}`} style={{ fontSize:'0.62rem', marginTop:3 }}>
                      {result.scenario.water_health_category}
                    </span>
                    <div style={{ fontSize:'0.63rem', color:'var(--text-muted)', marginTop:2 }}>
                      Drought: <strong style={{ color:riskColor(result.scenario.drought_risk_score) }}>{result.scenario.drought_risk_level}</strong>
                    </div>
                  </div>
                </div>

                {/* Metric header */}
                <div className="sim-metric-hd">
                  <div>{tx('Indicator', lang)}</div>
                  <div style={{ textAlign:'right' }}>{tx('Current', lang)}</div>
                  <div style={{ textAlign:'right' }}>{tx('Projected', lang)}</div>
                  <div style={{ textAlign:'right' }}>{tx('Change', lang)}</div>
                </div>

                {/* Comparison rows */}
                <div style={{ padding:'0 12px 4px' }}>
                  <CmpRow label={tx('Water Health Score', lang)} curr={result.current.water_health_score}  scen={result.scenario.water_health_score}  good="pos" max={100} />
                  <CmpRow label={tx('Drought Risk Score', lang)} curr={result.current.drought_risk_score}   scen={result.scenario.drought_risk_score}   good="neg" max={100} />
                  <CmpRow label={tx('Water Supply', lang)}       curr={result.current.water_supply_mcm}     scen={result.scenario.water_supply_mcm}     unit=" MCM" good="pos" max={Math.max(result.current.water_supply_mcm, result.scenario.water_supply_mcm) * 1.2} />
                  <CmpRow label={tx('Water Demand', lang)}       curr={result.current.water_demand_mcm}     scen={result.scenario.water_demand_mcm}     unit=" MCM" good="neg" max={Math.max(result.current.water_demand_mcm, result.scenario.water_demand_mcm) * 1.2} />
                  <CmpRow label={tx('Water Balance', lang)}      curr={result.current.water_balance_mcm}    scen={result.scenario.water_balance_mcm}    unit=" MCM" good="pos" max={Math.max(Math.abs(result.current.water_balance_mcm), Math.abs(result.scenario.water_balance_mcm)) * 1.5 || 10} />
                </div>

                {/* Balance status */}
                <div style={{
                  display:'flex', alignItems:'center', gap:8, flexWrap:'wrap',
                  padding:'8px 12px 10px', borderTop:`1px solid ${bdr}`,
                  background:sub, fontSize:'0.72rem',
                }}>
                  <span style={{ color:'var(--text-muted)', fontWeight:600 }}>{tx('Balance Status:', lang)}</span>
                  <span className={`badge ${balanceBadge(result.current.balance_status)}`} style={{ fontSize:'0.65rem' }}>
                    {tx('Current', lang)}: {result.current.balance_status}
                  </span>
                  <ChevronRight size={11} color="var(--text-muted)" />
                  <span className={`badge ${balanceBadge(result.scenario.balance_status)}`} style={{ fontSize:'0.65rem' }}>
                    {tx('Projected', lang)}: {result.scenario.balance_status}
                  </span>
                </div>
              </div>

              {/* ── KPI delta cards ─────────────────────────────────────── */}
              <div className="sim-kpi-grid">
                {[
                  { label: tx('Water Health Score', lang), val: result.changes.health_score_change, unit:' pts', good:'pos' as const },
                  { label: tx('Drought Risk Score', lang), val: result.changes.drought_risk_change,  unit:' pts', good:'neg' as const },
                  { label: tx('Water Supply', lang),       val: result.changes.supply_change_mcm,    unit:' MCM', good:'pos' as const },
                  { label: tx('Water Balance', lang),      val: result.changes.balance_change_mcm,   unit:' MCM', good:'pos' as const },
                ].map(m => {
                  const dc = deltaColor(m.val, m.good);
                  const DI = m.val > 0.05 ? TrendingUp : m.val < -0.05 ? TrendingDown : Minus;
                  return (
                    <div key={m.label} className="sim-kpi-card">
                      <div style={{ fontSize:'0.62rem', fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--text-muted)', marginBottom:6 }}>
                        {m.label}
                      </div>
                      <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                        <div style={{ width:26, height:26, borderRadius:6, background:`${dc}12`, display:'flex', alignItems:'center', justifyContent:'center' }}>
                          <DI size={13} color={dc} />
                        </div>
                        <div style={{ fontSize:'1rem', fontWeight:800, color:dc }}>
                          {fmtDelta(m.val, m.unit)}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* ── AI Explanation ──────────────────────────────────────── */}
              <div className="sim-panel">
                <div className="sim-panel-head">
                  <div className="sim-panel-title">
                    <div style={{ width:22, height:22, borderRadius:5, background:'rgba(139,92,246,0.12)', border:'1px solid rgba(139,92,246,0.25)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <Brain size={12} color="#a78bfa" />
                    </div>
                    {tx('AI Explanation', lang)}
                    <span style={{ fontSize:'0.63rem', fontWeight:700, color:'#818cf8', background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)', borderRadius:4, padding:'1px 6px' }}>
                      IBM Granite
                    </span>
                    <span style={{ fontSize:'0.65rem', color:'var(--text-muted)', fontWeight:400 }}>— {tx('Why did the scenario change?', lang)}</span>
                  </div>
                  <button
                    className="sim-ai-btn"
                    onClick={explainAI}
                    disabled={aiLoading}
                  >
                    {aiLoading
                      ? <><Loader2 size={12} style={{ animation:'spin 1s linear infinite' }} /> {tx('Analyzing…', lang)}</>
                      : <><Sparkles size={12} /> {tx('Explain this scenario', lang)}</>
                    }
                  </button>
                </div>
                <div className="sim-panel-body">
                  {aiText ? (
                    <div>
                      <AIStructured text={aiText} lang={lang} />
                      {demoMode && (
                        <div style={{
                          marginTop:10, display:'flex', alignItems:'center', gap:5,
                          fontSize:'0.7rem', color:'#7c3aed',
                          background:'rgba(124,58,237,0.07)', borderRadius:5,
                          padding:'4px 9px', border:'1px solid rgba(124,58,237,0.18)',
                        }}>
                          <Info size={11} /> {tx('Demo Mode — using fallback response', lang)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'6px 0', color:'var(--text-muted)', fontSize:'0.78rem' }}>
                      <Brain size={18} color="#a78bfa" style={{ flexShrink:0 }} />
                      {lang === 'gu'
                        ? 'IBM Granite ને સ્પષ્ટ કરવા કહો — ઉપર "સ્થિતિ સ્પષ્ટ કરો" ક્લિક કરો.'
                        : 'Click "Explain this scenario" above to get a structured AI breakdown — What changed, why, and what to do next.'
                      }
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
