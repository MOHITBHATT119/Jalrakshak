import React, { useEffect, useState } from 'react';
import { getCommunityPriority } from '../services/api';
import {
  Users, TrendingDown, TrendingUp, Minus, AlertTriangle,
  Droplets, CloudRain, Eye, ChevronUp, ChevronDown, Filter,
  Activity, ShieldAlert, RefreshCw, X, ChevronRight,
} from 'lucide-react';

interface Props { setSelectedVillage: (v: string) => void; lang: string; }

const T: Record<string, { gu: string }> = {
  'Community Priority':                 { gu: 'સામુદાયિક પ્રાધાન્ય' },
  'AI-ranked villages by water stress urgency · Higher score = more urgent attention':
                                        { gu: 'AI-ક્રમાંકિત ગામો — વધુ સ્કોર = વધુ તાત્કાળ ધ્યાન' },
  'Live ranking':                       { gu: 'જીવંત ક્રમાંક' },
  'Refresh':                            { gu: 'તાજું કરો' },
  'Ranking communities…':               { gu: 'સમુદાયો ક્રમાંકિત થઈ રહ્યા છે…' },
  // Summary cards
  'Emergency':                          { gu: 'કટોકટી' },
  'Urgent':                             { gu: 'તાત્કાળ' },
  'High':                               { gu: 'ઉચ્ચ' },
  'Medium':                             { gu: 'મધ્યમ' },
  'villages':                           { gu: 'ગામો' },
  // Table header
  'Ranked Villages by Water Priority':  { gu: 'જળ પ્રાધાન્ય અનુસાર ક્રમાંકિત ગામો' },
  '#':                                  { gu: '#' },
  'Village':                            { gu: 'ગામ' },
  'Priority':                           { gu: 'પ્રાધાન્ય' },
  'Health Score':                       { gu: 'સ્વાસ્થ્ય સ્કોર' },
  'Drought Risk':                       { gu: 'દુષ્કાળ જોખમ' },
  'GW Trend':                           { gu: 'ભૂ.જ. વલણ' },
  'Key Issues':                         { gu: 'મુખ્ય સમસ્યાઓ' },
  'Action':                             { gu: 'ક્રિયા' },
  // Filter labels
  'All':                                { gu: 'બધા' },
  // Row
  'View':                               { gu: 'જુઓ' },
  'No villages match the selected filter.': { gu: 'પસંદ કરેલ ફિલ્ટર સાથે કોઈ ગામ મળ્યું નહીં.' },
  // TrendBadge
  'Declining':                          { gu: 'ઘટી રહ્યું' },
  'Improving':                          { gu: 'સુધરી રહ્યું' },
  'Stable':                             { gu: 'સ્થિર' },
  // Footer
  'Powered by IBM Granite AI':          { gu: 'IBM Granite AI દ્વારા સંચાલિત' },
  // Modal
  'Details':                            { gu: 'વિગતો' },
  'District':                           { gu: 'જિલ્લો' },
  'Priority Score':                     { gu: 'પ્રાધાન્ય સ્કોર' },
  'Health Score (modal)':               { gu: 'સ્વાસ્થ્ય સ્કોર' },
  'GW Trend (modal)':                   { gu: 'ભૂ.જ. વલણ' },
  'Key Issues:':                        { gu: 'મુખ્ય સમસ્યાઓ:' },
  'Close':                              { gu: 'બંધ કરો' },
};

function tr(key: string, lang: string): string {
  return (lang === 'gu' && T[key]?.gu) ? T[key].gu : key;
}

// ─── colour maps ──────────────────────────────────────────────────────────────
const LEVEL_COLOR: Record<string, string> = {
  EMERGENCY: '#ef4444', URGENT: '#f97316', HIGH: '#f59e0b', MEDIUM: '#3b82f6', LOW: '#22c55e',
};
const LEVEL_BG: Record<string, string> = {
  EMERGENCY: 'rgba(239,68,68,0.18)', URGENT: 'rgba(249,115,22,0.15)',
  HIGH: 'rgba(245,158,11,0.15)', MEDIUM: 'rgba(59,130,246,0.15)', LOW: 'rgba(34,197,94,0.12)',
};
const RISK_COLOR: Record<string, string> = {
  SEVERE: '#ef4444', HIGH: '#f59e0b', MODERATE: '#eab308', LOW: '#22c55e',
};
const RISK_BG: Record<string, string> = {
  SEVERE: 'rgba(239,68,68,0.18)', HIGH: 'rgba(245,158,11,0.15)',
  MODERATE: 'rgba(234,179,8,0.15)', LOW: 'rgba(34,197,94,0.12)',
};
const HEALTH_COLOR = (score: number) =>
  score >= 70 ? '#22c55e' : score >= 45 ? '#f59e0b' : '#ef4444';

// ─── sub-components ──────────────────────────────────────────────────────────

function PriorityRing({ score, level }: { score: number; level: string }) {
  const c = LEVEL_COLOR[level] ?? '#3b82f6';
  const r = 22, circ = 2 * Math.PI * r;
  const fill = circ - (score / 100) * circ;
  return (
    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
      <svg width={56} height={56} viewBox="0 0 56 56" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={28} cy={28} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={5} />
        <circle cx={28} cy={28} r={r} fill="none" stroke={c} strokeWidth={5}
          strokeDasharray={circ} strokeDashoffset={fill}
          strokeLinecap="round" style={{ transition: 'stroke-dashoffset 0.8s ease' }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, color: c,
      }}>{score}</div>
    </div>
  );
}

function HealthBar({ score }: { score: number }) {
  const col = HEALTH_COLOR(score);
  return (
    <div style={{ minWidth: 80 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: col }}>{score}</span>
        <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>/100</span>
      </div>
      <div style={{ height: 5, borderRadius: 3, background: 'var(--border-glass)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${score}%`, borderRadius: 3,
          background: `linear-gradient(90deg, ${col}99, ${col})`,
          transition: 'width 0.8s ease',
        }} />
      </div>
    </div>
  );
}

function TrendBadge({ trend, lang }: { trend: string; lang: string }) {
  const u = trend?.toUpperCase();
  const t = (k: string) => tr(k, lang);
  if (u === 'DECLINING') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#ef4444', fontSize: '0.78rem', fontWeight: 700 }}>
      <TrendingDown size={13} /> {t('Declining')}
    </span>
  );
  if (u === 'IMPROVING') return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: '#22c55e', fontSize: '0.78rem', fontWeight: 700 }}>
      <TrendingUp size={13} /> {t('Improving')}
    </span>
  );
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 700 }}>
      <Minus size={13} /> {t('Stable')}
    </span>
  );
}

function RiskPill({ label }: { label: string }) {
  const u = label?.toUpperCase();
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px', borderRadius: 20,
      fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.04em',
      background: RISK_BG[u] ?? 'rgba(100,116,139,0.15)',
      color: RISK_COLOR[u] ?? '#94a3b8',
      border: `1px solid ${(RISK_COLOR[u] ?? '#94a3b8') + '44'}`,
    }}>{label}</span>
  );
}

function LevelBadge({ level, showLabel = true }: { level: string; showLabel?: boolean }) {
  const c = LEVEL_COLOR[level] ?? '#3b82f6';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.05em',
      background: LEVEL_BG[level] ?? 'rgba(59,130,246,0.15)',
      color: c, border: `1px solid ${c}44`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: c, flexShrink: 0 }} />
      {showLabel && level}
    </span>
  );
}

// ─── Stat summary card ────────────────────────────────────────────────────────
function SummaryCard({ label, count, color, bg, icon, lang }: {
  label: string; count: number; color: string; bg: string; icon: React.ReactNode; lang: string;
}) {
  return (
    <div className="stat-card" style={{
      background: bg, borderColor: `${color}30`,
      borderLeft: `3px solid ${color}`,
      display: 'flex', flexDirection: 'column', gap: 8, padding: '18px 20px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '0.78rem', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
        <span style={{ color, opacity: 0.7 }}>{icon}</span>
      </div>
      <div style={{ fontSize: '2.4rem', fontWeight: 900, color, lineHeight: 1 }}>{count}</div>
      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{tr('villages', lang)}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function CommunityPriority({ setSelectedVillage, lang }: Props) {
  const t = (key: string) => tr(key, lang);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filterLevel, setFilterLevel] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<'priority' | 'health' | 'rank'>('rank');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  const [viewModalVillage, setViewModalVillage] = useState<any>(null);

  useEffect(() => {
    getCommunityPriority()
      .then(d => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const toggleSort = (col: typeof sortBy) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  const SortIcon = ({ col }: { col: typeof sortBy }) =>
    sortBy === col
      ? (sortDir === 'asc' ? <ChevronUp size={13} /> : <ChevronDown size={13} />)
      : <ChevronDown size={13} style={{ opacity: 0.3 }} />;

  const villages: any[] = data?.ranked_villages ?? [];
  const filtered = villages
    .filter(v => filterLevel === 'ALL' || v.priority_level === filterLevel)
    .sort((a, b) => {
      let va = sortBy === 'rank' ? villages.indexOf(a) : sortBy === 'health' ? a.water_health_score : a.priority_score;
      let vb = sortBy === 'rank' ? villages.indexOf(b) : sortBy === 'health' ? b.water_health_score : b.priority_score;
      return sortDir === 'asc' ? va - vb : vb - va;
    });

  const levels = ['ALL', 'EMERGENCY', 'URGENT', 'HIGH', 'MEDIUM', 'LOW'];

  return (
    <div style={{ animation: 'fadeInUp 0.5s ease-out' }}>

      {/* ── Page header ── */}
      <div style={{
        background: 'var(--bg-card)',
        border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: 16, padding: '24px 28px', marginBottom: 24,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(59,130,246,0.2)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Users size={20} color="#60a5fa" />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: 0 }}>
              {t('Community Priority')}
            </h1>
          </div>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.88rem' }}>
            {t('AI-ranked villages by water stress urgency · Higher score = more urgent attention')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={13} color="#3b82f6" />
            {t('Live ranking')}
          </div>
          <button
            onClick={() => { setLoading(true); getCommunityPriority().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false)); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', color: '#60a5fa', borderRadius: 8, padding: '7px 14px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 600 }}
          >
            <RefreshCw size={13} /> {t('Refresh')}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="loading" style={{ padding: 80 }}>
          <div className="spinner" style={{ marginRight: 14 }} />
          {t('Ranking communities…')}
        </div>
      ) : data && (
        <>
          {/* ── Summary cards ── */}
          <div className="grid grid-4" style={{ marginBottom: 24 }}>
            <SummaryCard label={t('Emergency')} count={data.emergency_count} color="#ef4444"
              bg="rgba(239,68,68,0.07)" icon={<AlertTriangle size={18} />} lang={lang} />
            <SummaryCard label={t('Urgent')} count={data.urgent_count} color="#f97316"
              bg="rgba(249,115,22,0.07)" icon={<ShieldAlert size={18} />} lang={lang} />
            <SummaryCard label={t('High')} count={data.high_count} color="#f59e0b"
              bg="rgba(245,158,11,0.07)" icon={<CloudRain size={18} />} lang={lang} />
            <SummaryCard label={t('Medium')} count={data.medium_count} color="#3b82f6"
              bg="rgba(59,130,246,0.07)" icon={<Droplets size={18} />} lang={lang} />
          </div>

          {/* ── Table card ── */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

            {/* Card header */}
            <div style={{
              padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#3b82f6', boxShadow: '0 0 8px #3b82f6' }} />
                <span style={{ fontWeight: 700, fontSize: '1rem' }}>{t('Ranked Villages by Water Priority')}</span>
                <span style={{ background: 'rgba(59,130,246,0.15)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 20, padding: '2px 10px', fontSize: '0.75rem', fontWeight: 700 }}>
                  {filtered.length} villages
                </span>
              </div>

              {/* Level filter pills */}
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <Filter size={13} color="#64748b" />
                {levels.map(lv => {
                  const c = lv === 'ALL' ? '#3b82f6' : (LEVEL_COLOR[lv] ?? '#3b82f6');
                  const active = filterLevel === lv;
                  return (
                    <button key={lv} onClick={() => setFilterLevel(lv)} style={{
                      padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                      cursor: 'pointer', transition: 'all 0.15s',
                      background: active ? `${c}22` : 'transparent',
                      color: active ? c : '#475569',
                      border: `1px solid ${active ? `${c}55` : 'var(--border-glass)'}`,
                    }}>{lv === 'ALL' ? t('All') : lv}</button>
                  );
                })}
              </div>
            </div>

            {/* Table */}
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-dark)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {[
                      { label: t('#'), col: null, w: 44 },
                      { label: t('Village'), col: null, w: 170 },
                      { label: t('Priority'), col: 'priority' as const, w: 90 },
                      { label: t('Health Score'), col: 'health' as const, w: 110 },
                      { label: t('Drought Risk'), col: null, w: 100 },
                      { label: t('GW Trend'), col: null, w: 100 },
                      { label: t('Key Issues'), col: null, w: 220 },
                      { label: t('Action'), col: null, w: 80 },
                    ].map(({ label, col, w }) => (
                      <th key={label}
                        onClick={col ? () => toggleSort(col) : undefined}
                        style={{
                          padding: '12px 16px', textAlign: 'left', fontWeight: 700,
                          fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                          color: col && sortBy === col ? '#60a5fa' : '#475569',
                          cursor: col ? 'pointer' : 'default',
                          userSelect: 'none', width: w,
                          whiteSpace: 'nowrap',
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          {label}{col && <SortIcon col={col} />}
                        </span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((v: any, i: number) => {
                    const isEmergency = v.is_emergency || v.priority_level === 'EMERGENCY';
                    const globalRank = villages.indexOf(v) + 1;
                    const col = LEVEL_COLOR[v.priority_level] ?? '#3b82f6';

                    return (
                      <tr key={v.village_id}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          background: isEmergency
                            ? 'rgba(239,68,68,0.05)'
                            : i % 2 === 0 ? 'transparent' : 'var(--bg-card-hover)',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(59,130,246,0.07)')}
                        onMouseLeave={e => (e.currentTarget.style.background = isEmergency ? 'rgba(239,68,68,0.05)' : i % 2 === 0 ? 'transparent' : 'var(--bg-card-hover)')}
                      >
                        {/* Rank */}
                        <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                            width: 28, height: 28, borderRadius: '50%',
                            background: globalRank <= 3 ? `${col}22` : 'var(--bg-card-hover)',
                            border: globalRank <= 3 ? `1px solid ${col}44` : '1px solid transparent',
                            fontSize: '0.8rem', fontWeight: 800,
                            color: globalRank <= 3 ? col : '#94a3b8',
                          }}>{globalRank}</span>
                        </td>

                        {/* Village */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontWeight: 700, marginBottom: 2, display: 'flex', alignItems: 'center', gap: 6 }}>
                            {v.village_name}
                            {isEmergency && (
                              <span style={{
                                fontSize: '0.62rem', fontWeight: 800, letterSpacing: '0.06em',
                                background: 'rgba(239,68,68,0.2)', color: '#ef4444',
                                border: '1px solid rgba(239,68,68,0.4)',
                                padding: '1px 6px', borderRadius: 4,
                              }}>EMERGENCY</span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{v.district}</div>
                        </td>

                        {/* Priority */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <PriorityRing score={v.priority_score} level={v.priority_level} />
                            <LevelBadge level={v.priority_level} />
                          </div>
                        </td>

                        {/* Health Score */}
                        <td style={{ padding: '12px 16px' }}>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                            {v.water_health_category}
                          </div>
                          <HealthBar score={v.water_health_score} />
                        </td>

                        {/* Drought Risk */}
                        <td style={{ padding: '12px 16px' }}>
                          <RiskPill label={v.drought_risk} />
                        </td>

                        {/* GW Trend */}
                        <td style={{ padding: '12px 16px' }}>
                          <TrendBadge trend={v.groundwater_trend} lang={lang} />
                        </td>

                        {/* Key Issues */}
                        <td style={{ padding: '12px 16px', maxWidth: 220 }}>
                          {v.key_issues?.slice(0, 2).map((issue: string, j: number) => (
                            <div key={j} style={{
                              display: 'flex', alignItems: 'flex-start', gap: 5,
                              fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: j === 0 ? 4 : 0,
                            }}>
                              <ChevronRight size={12} style={{ color: col, marginTop: 2, flexShrink: 0 }} />
                              <span>{issue}</span>
                            </div>
                          ))}
                        </td>

                        {/* Action */}
                        <td style={{ padding: '12px 16px' }}>
                          <button
                            onClick={() => { setSelectedVillage(v.village_id); setViewModalVillage(v); }}
                            style={{
                              display: 'inline-flex', alignItems: 'center', gap: 5,
                              padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
                              background: 'rgba(59,130,246,0.12)',
                              border: '1px solid rgba(59,130,246,0.3)',
                              color: '#60a5fa', fontWeight: 700, fontSize: '0.8rem',
                              transition: 'all 0.15s',
                              whiteSpace: 'nowrap',
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.25)';
                              (e.currentTarget as HTMLButtonElement).style.borderColor = '#3b82f6';
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(59,130,246,0.12)';
                              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(59,130,246,0.3)';
                            }}
                          >
                            <Eye size={13} /> {t('View')}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  {t('No villages match the selected filter.')}
                </div>
              )}
            </div>

            {/* Footer note */}
            <div style={{
              padding: '12px 22px', borderTop: '1px solid rgba(255,255,255,0.04)',
              fontSize: '0.75rem', color: '#334155',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
            }}>
              <span>{villages[0]?.data_note || 'Synthetic demonstration data. Not official government measurements.'}</span>
              <span style={{ color: '#1e3a5c' }}>{t('Powered by IBM Granite AI')}</span>
            </div>
          </div>
        </>
      )}

      {/* Modal */}
      {viewModalVillage && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
          <div className="card" style={{ width: '100%', maxWidth: 500, padding: 24, position: 'relative', margin: 20 }}>
            <button onClick={() => setViewModalVillage(null)} aria-label="Close" style={{ position: 'absolute', top: 16, right: 16, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}><X size={18} /></button>
            <h2 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Eye size={20} color="#3b82f6" /> {viewModalVillage.village_name} {t('Details')}
            </h2>
            <div style={{ display: 'grid', gap: 12, fontSize: '0.9rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('District')}</span>
                <strong>{viewModalVillage.district}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('Priority Score')}</span>
                <strong>{viewModalVillage.priority_score} ({viewModalVillage.priority_level})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('Health Score (modal)')}</span>
                <strong>{viewModalVillage.water_health_score} ({viewModalVillage.water_health_category})</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('Drought Risk')}</span>
                <strong>{viewModalVillage.drought_risk}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border-glass)', paddingBottom: 8 }}>
                <span style={{ color: 'var(--text-muted)' }}>{t('GW Trend (modal)')}</span>
                <strong>{viewModalVillage.groundwater_trend}</strong>
              </div>
              <div style={{ marginTop: 8 }}>
                <strong style={{ display: 'block', marginBottom: 6 }}>{t('Key Issues:')}</strong>
                <ul style={{ margin: 0, paddingLeft: 20, color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {viewModalVillage.key_issues?.map((issue: string, i: number) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            </div>
            <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
               <button onClick={() => setViewModalVillage(null)} className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>{t('Close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
