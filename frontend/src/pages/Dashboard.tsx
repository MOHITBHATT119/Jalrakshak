import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { getVillages, getWaterHealth, getDroughtRisk, getGroundwater, Village } from '../services/api';
import { PageTransition, CardTransition } from '../components/Transitions';
import { LayoutDashboard, Map as MapIcon, Sprout, Hammer, Lightbulb, Droplet, AlertTriangle, Activity } from 'lucide-react';
import VillageSelect from '../components/VillageSelect';

interface Props { selectedVillage: string; setSelectedVillage: (v: string) => void; mode: string; lang: string; demoMode: boolean; }

const T: Record<string, { gu: string }> = {
  // Header
  'Dashboard':                       { gu: 'ડૅશબોર્ડ' },
  'Water intelligence overview for Saurashtra': { gu: 'સૌરાષ્ટ્ર માટે જળ ગુપ્તચર ઝાંખી' },

  // Stat card labels
  'Water Health Score':              { gu: 'જળ સ્વાસ્થ્ય સ્કોર' },
  'Drought Risk':                    { gu: 'દુષ્કાળનું જોખમ' },
  'Groundwater Depth':               { gu: 'ભૂગર્ભ જળની ઊંડાઈ' },
  'Annual Change':                   { gu: 'વાર્ષિક ફેરફાર' },
  'Below ground surface':            { gu: 'જમીનની સપાટી નીચે' },
  'per year (↑ = deeper)':          { gu: 'પ્રતિ વર્ષ (↑ = ઊંડું)' },
  'Trend:':                          { gu: 'વલણ:' },

  // Score breakdown card
  'Water Health Score Breakdown':    { gu: 'જળ સ્વાસ્થ્ય સ્કોર વિશ્લેષણ' },
  'WHY IS THE SCORE THIS VALUE?':    { gu: 'સ્કોર આ મૂલ્ય શા માટે છે?' },

  // Score ring labels
  'Groundwater':                     { gu: 'ભૂગર્ભ જળ' },
  'Rainfall':                        { gu: 'વરસાદ' },
  'Drought':                         { gu: 'દુષ્કાળ' },
  'Demand':                          { gu: 'માંગ' },
  'Recharge':                        { gu: 'રિચાર્જ' },
  'OVERALL':                         { gu: 'એકંદર' },

  // Chart titles
  'Groundwater Depth Trend (m)':     { gu: 'ભૂગર્ભ જળ ઊંડાઈ વલણ (m)' },
  '↑ = deeper = more depletion':    { gu: '↑ = ઊંડું = વધુ ઘટાડો' },
  'Drought Risk Factors':            { gu: 'દુષ્કાળના જોખમ પરિબળો' },
  'No data':                         { gu: 'ડેટા નથી' },

  // Recommended actions — card header
  'Recommended Actions':             { gu: 'ભલામણ કરેલ ક્રિયાઓ' },
  'RISK':                            { gu: 'જોખમ' },

  // Recommended actions — SEVERE
  'Declare drought preparedness - activate emergency water protocols':
    { gu: 'દુષ્કાળ સજ્જતા જાહેર કરો — કટોકટી જળ પ્રોટોકોલ સક્રિય કરો' },
  'Immediately restrict non-essential groundwater extraction':
    { gu: 'તાત્કાળ બિન-જરૂરી ભૂગર્ભ જળ ઉત્ખનન પ્રતિબંધ લગાવો' },
  'Prioritise drinking water supply for all communities':
    { gu: 'તમામ સમુદાયો માટે પીવાના પાણી પુરવઠાને પ્રાધાન્ય આપો' },
  'Activate recharge structure maintenance and new construction':
    { gu: 'રિચાર્જ સ્ટ્રક્ચર જાળવણી અને નવું બાંધકામ સક્રિય કરો' },
  'Switch remaining crops to drought-tolerant varieties':
    { gu: 'બાકી પાકોને દુષ્કાળ-સહિષ્ણુ જાતોમાં બદલો' },
  'Coordinate with district water board for emergency support':
    { gu: 'કટોકટી સહાય માટે જિલ્લા જળ બોર્ડ સાથે સંકલન કરો' },

  // Recommended actions — HIGH
  'Alert Gram Panchayat and water committee for action':
    { gu: 'ગ્રામ પંચાયત અને જળ સમિતિને પગલાં માટે સૂચિત કરો' },
  'Reduce agricultural groundwater extraction by 30%':
    { gu: 'કૃષિ ભૂગર્ભ જળ ઉત્ખનન ૩૦% ઘટાડો' },
  'Begin crop substitution planning for next season':
    { gu: 'આવતી સીઝન માટે પાક પ્રતિસ્થાપન આયોજન શરૂ કરો' },
  'Survey and repair existing recharge structures':
    { gu: 'હાલની રિચાર્જ સ્ટ્રક્ચરની સર્વે અને સમારકામ કરો' },
  'Implement micro-irrigation for water-intensive crops':
    { gu: 'વધુ પાણી વાપરતા પાકો માટે ટપક સિંચાઈ લાગુ કરો' },

  // Recommended actions — MODERATE
  'Monitor groundwater levels weekly':
    { gu: 'સાપ્તાહિક ભૂગર્ભ જળ સ્તર નિરીક્ષણ કરો' },
  'Promote water-efficient irrigation methods':
    { gu: 'પાણી-કાર્યક્ષમ સિંચાઈ પદ્ધતિઓ પ્રોત્સાહિત કરો' },
  'Plan new recharge structures before next monsoon':
    { gu: 'આગામી ચોમાસા પહેલાં નવી રિચાર્જ સ્ટ્રક્ચર આયોજન કરો' },
  'Encourage drought-tolerant crop adoption':
    { gu: 'દુષ્કાળ-સહિષ્ણુ પાક અપનાવવા પ્રોત્સાહિત કરો' },
  'Review water allocation among user groups':
    { gu: 'વપરાશ જૂથો વચ્ચે જળ ફાળવણીની સમીક્ષા કરો' },

  // Recommended actions — LOW
  'Continue regular monitoring of groundwater levels':
    { gu: 'ભૂગર્ભ જળ સ્તરનું નિયમિત નિરીક્ષણ ચાલુ રાખો' },
  'Maintain existing recharge structures':
    { gu: 'હાલની રિચાર્જ સ્ટ્રક્ચર જાળવો' },
  'Plan for upcoming season water requirements':
    { gu: 'આવતી સીઝન માટે જળ જરૂરિયાત આયોજન કરો' },

  // Quick nav
  'Hydro Atlas':                     { gu: 'જળ નકશો' },
  'Crop Advisor':                    { gu: 'પાક સલાહ' },
  'Recharge Plan':                   { gu: 'રિચાર્જ યોજના' },
  'What-If Sim':                     { gu: 'શું-જો સિમ્યુલેટર' },

  // Emergency
  'WATER EMERGENCY':                 { gu: 'જળ કટોકટી' },
  'is in emergency water status. Immediate action required.': { gu: 'કટોકટી જળ સ્થિતિમાં છે. તાત્કાલિક પગલાં જરૂરી છે.' },
  'Actions: Protect drinking water · Restrict extraction · Review irrigation · Activate community response.':
    { gu: 'પગલાં: પીવાના પાણીનું રક્ષણ · ઉત્ખનન પ્રતિબંધ · સિંચાઈ સમીક્ષા · સામુદાયિક પ્રતિસાદ સક્રિય કરો.' },

  // Loading
  'Loading water data...':           { gu: 'જળ ડેટા લોડ થઈ રહ્યો છે...' },
};

function t(key: string, lang: string): string {
  return (lang === 'gu' && T[key]?.gu) ? T[key].gu : key;
}

function ScoreRing({ score, label }: { score: number; label: string }) {
  const r = 36, c = 2 * Math.PI * r;
  const color = score >= 70 ? '#16a34a' : score >= 50 ? '#d97706' : score >= 30 ? '#ea580c' : '#dc2626';
  return (
    <div className="score-ring-container">
      <div style={{ position: 'relative', width: 90, height: 90 }}>
        <svg width="90" height="90" viewBox="0 0 90 90" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="45" cy="45" r={r} fill="none" stroke="var(--border-glass)" strokeWidth="8" />
          <circle cx="45" cy="45" r={r} fill="none" stroke={color} strokeWidth="8"
            strokeDasharray={`${(score / 100) * c} ${c}`} strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', textAlign: 'center' }}>
          <div style={{ fontSize: '1.1rem', fontWeight: 700, color }}>{Math.round(score)}</div>
        </div>
      </div>
      <div className="score-ring-label">{label}</div>
    </div>
  );
}

export default function Dashboard({ selectedVillage, setSelectedVillage, mode, lang }: Props) {
  const [villages, setVillages] = useState<Village[]>([]);
  const [health, setHealth] = useState<any>(null);
  const [drought, setDrought] = useState<any>(null);
  const [gw, setGw] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const nav = useNavigate();

  const tr = (k: string) => t(k, lang);

  useEffect(() => {
    getVillages().then(r => setVillages(r.villages));
  }, []);

  useEffect(() => {
    if (!selectedVillage) return;
    setLoading(true);
    Promise.all([
      getWaterHealth(selectedVillage),
      getDroughtRisk(selectedVillage),
      getGroundwater(selectedVillage),
    ]).then(([h, d, g]) => {
      setHealth(h); setDrought(d); setGw(g); setLoading(false);
    }).catch(() => setLoading(false));
  }, [selectedVillage]);

  const riskColor = (level: string) => ({ LOW: '#16a34a', MODERATE: '#d97706', HIGH: '#ea580c', SEVERE: '#dc2626' }[level] || 'var(--text-muted)');
  const categoryColor = (cat: string) => ({ HEALTHY: '#16a34a', WATCH: '#d97706', STRESSED: '#ea580c', CRITICAL: '#dc2626', EMERGENCY: '#7f1d1d' }[cat] || 'var(--text-muted)');

  const gwChartData = gw?.timeseries?.slice(-12).map((t: any) => ({
    label: `${t.year}-${String(t.month).padStart(2, '0')}`,
    depth: t.depth_m,
  })) || [];

  const scoreRingItems = health ? [
    { label: tr('Groundwater'), score: (health.components.groundwater_score / health.components.groundwater_max) * 100 },
    { label: tr('Rainfall'),    score: (health.components.rainfall_score    / health.components.rainfall_max)    * 100 },
    { label: tr('Drought'),     score: (health.components.drought_score     / health.components.drought_max)     * 100 },
    { label: tr('Demand'),      score: (health.components.demand_score      / health.components.demand_max)      * 100 },
    { label: tr('Recharge'),    score: (health.components.recharge_score    / health.components.recharge_max)    * 100 },
    { label: tr('OVERALL'),     score: health.overall_score },
  ] : [];

  const quickNav = [
    { icon: <MapIcon size={24}/>,    label: tr('Hydro Atlas'),   path: '/hydro-atlas' },
    { icon: <Sprout size={24}/>,     label: tr('Crop Advisor'),  path: '/crops' },
    { icon: <Hammer size={24}/>,     label: tr('Recharge Plan'), path: '/recharge' },
    { icon: <Lightbulb size={24}/>,  label: tr('What-If Sim'),   path: '/simulator' },
  ];

  return (
    <div>
      {/* ── Page Header ── */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        marginBottom: 24,
        animation: 'fadeInUp 0.5s ease-out',
      }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '2rem', fontWeight: 700, letterSpacing: '-0.5px' }}>
            <LayoutDashboard size={28} />
            {tr('Dashboard')}
          </h1>
          <p className="text-sm text-muted" style={{ marginTop: 4 }}>
            {tr('Water intelligence overview for Saurashtra')}
          </p>
        </div>
        <VillageSelect villages={villages} value={selectedVillage} onChange={setSelectedVillage} width={240} />
      </div>

      {/* ── Emergency Banner ── */}
      {health?.is_emergency && (
        <div className="alert alert-emergency" style={{ margin: '0 0 20px', borderRadius: 8 }}>
          <AlertTriangle size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6, color: '#ef4444' }} /><strong>{tr('WATER EMERGENCY')}</strong> — {health.village_name} {tr('is in emergency water status. Immediate action required.')}
          <br />{tr('Actions: Protect drinking water · Restrict extraction · Review irrigation · Activate community response.')}
        </div>
      )}

      <div className="page-body">
        {loading ? (
          <div className="loading"><div className="spinner" />{tr('Loading water data...')}</div>
        ) : (
          <>
            {/* ── Top Stats ── */}
            <div className="grid grid-4" style={{ marginBottom: 20 }}>
              <div className="stat-card premium-card">
                <div className="label">{tr('Water Health Score')}</div>
                <div className="value" style={{ WebkitTextFillColor: 'currentcolor', color: categoryColor(health?.category) }}>
                  {health?.overall_score?.toFixed(0) ?? '—'}
                </div>
                <div className="sub">{health?.category}</div>
              </div>
              <div className="stat-card premium-card">
                <div className="label">{tr('Drought Risk')}</div>
                <div className="value" style={{ WebkitTextFillColor: 'currentcolor', color: riskColor(drought?.risk_level) }}>
                  {drought?.risk_score?.toFixed(0) ?? '—'}/100
                </div>
                <div className="sub">{drought?.risk_level}</div>
              </div>
              <div className="stat-card premium-card">
                <div className="label">{tr('Groundwater Depth')}</div>
                <div className="value">{gw?.current_depth_m?.toFixed(1) ?? '—'}m</div>
                <div className="sub">{tr('Trend:')} {gw?.trend}</div>
              </div>
              <div className="stat-card premium-card">
                <div className="label">{tr('Annual Change')}</div>
                <div className="value" style={{ WebkitTextFillColor: 'currentcolor', color: (gw?.annual_change_m || 0) > 0 ? '#dc2626' : '#16a34a' }}>
                  {gw?.annual_change_m != null ? (gw.annual_change_m > 0 ? '+' : '') + gw.annual_change_m.toFixed(1) : '—'}m
                </div>
                <div className="sub">{tr('per year (↑ = deeper)')}</div>
              </div>
            </div>

            {/* ── Score Breakdown ── */}
            {health && (
              <div className="card premium-card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                  <div className="card-title">
                    {tr('Water Health Score Breakdown')} — {health.village_name}
                  </div>
                  <span className="badge" style={{ background: categoryColor(health.category) + '22', color: categoryColor(health.category) }}>
                    {health.category}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 16 }}>
                  {scoreRingItems.map(c => <ScoreRing key={c.label} score={c.score} label={c.label} />)}
                </div>
                {health.explanation_factors?.length > 0 && (
                  <div>
                    <div className="text-xs text-muted font-semibold" style={{ marginBottom: 6 }}>
                      {tr('WHY IS THE SCORE THIS VALUE?')}
                    </div>
                    {health.explanation_factors.map((f: string, i: number) => (
                      <div key={i} style={{ fontSize: '0.8rem', padding: '4px 0', borderBottom: '1px solid var(--border-glass)', color: 'var(--text-main)' }}>
                        • {f}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Charts Row ── */}
            <div className="grid grid-2" style={{ marginBottom: 20 }}>
              <div className="card premium-card">
                <div className="card-header">
                  <div className="card-title">
                    <Droplet size={18} style={{ marginRight: 8 }} />
                    {tr('Groundwater Depth Trend (m)')}
                  </div>
                  <span className="text-xs text-muted">{tr('↑ = deeper = more depletion')}</span>
                </div>
                {gwChartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={gwChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={2} />
                      <YAxis domain={['auto', 'auto']} reversed tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: any) => [`${v}m`, 'Depth']} />
                      <Line type="monotone" dataKey="depth" stroke="#3b82f6" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : <div className="loading">{tr('No data')}</div>}
              </div>

              <div className="card premium-card">
                <div className="card-header">
                  <div className="card-title">
                    <AlertTriangle size={18} style={{ marginRight: 8 }} />
                    {tr('Drought Risk Factors')}
                  </div>
                </div>
                {drought && (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={[
                      { name: tr('Rainfall'),     value: drought.components.rainfall_score,     max: 40 },
                      { name: tr('Groundwater'),  value: drought.components.groundwater_score,  max: 40 },
                      { name: tr('Demand'),       value: drought.components.demand_score,        max: 20 },
                    ]}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: any) => [`${v}`, lang === 'gu' ? 'જોખમ સ્કોર' : 'Risk Score']} />
                      <Bar dataKey="value" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* ── Recommended Actions ── */}
            {drought?.recommended_actions?.length > 0 && (
              <div className="card premium-card" style={{ marginBottom: 20 }}>
                <div className="card-header">
                  <div className="card-title">
                    <Activity size={18} style={{ marginRight: 8 }} />
                    {tr('Recommended Actions')}
                  </div>
                  <span className={`badge badge-${drought.risk_level.toLowerCase()}`}>
                    {drought.risk_level} {tr('RISK')}
                  </span>
                </div>
                <div className="grid grid-2">
                  {drought.recommended_actions.slice(0, 6).map((a: string, i: number) => (
                    <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid var(--border-glass)', fontSize: '0.85rem' }}>
                      <span style={{ color: '#3b82f6', fontWeight: 700, minWidth: 20 }}>{i + 1}.</span>
                      <span>{tr(a)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Quick Nav ── */}
            <div className="grid grid-4">
              {quickNav.map(n => (
                <button key={n.path} onClick={() => nav(n.path)}
                  style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)', borderRadius: 10, padding: '16px', cursor: 'pointer', textAlign: 'center', fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-main)', transition: 'background 0.2s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.12)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
                >
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8, color: '#60a5fa' }}>{n.icon}</div>
                  {n.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
