import React, { useState, useEffect, useRef } from 'react';
import {
  FileText, RefreshCw, Zap, ClipboardList, BrainCircuit,
  CheckCircle, AlertTriangle, Info, ChevronDown, ChevronUp,
  Download, Loader2, Droplets, CloudRain, BarChart3, Bot, Home, Settings, Target,
} from 'lucide-react';
import { getVillages, generateReport, generateActionPlan, Village } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import VillageSelect from '../components/VillageSelect';

interface Props {
  selectedVillage: string;
  setSelectedVillage: (v: string) => void;
  lang: string;
  demoMode: boolean;
}

// ── Generating steps shown during animation ───────────────────────────────────
const REPORT_STEPS = [
  { id: 1, label: 'Fetching groundwater data',      icon: <Droplets size={15} color="#3b82f6" />, ms: 520 },
  { id: 2, label: 'Analysing drought indicators',   icon: <CloudRain size={15} color="#f59e0b" />, ms: 780 },
  { id: 3, label: 'Computing water health score',   icon: <BarChart3 size={15} color="#10b981" />, ms: 600 },
  { id: 4, label: 'Running IBM Granite AI model',   icon: <Bot size={15} color="#8b5cf6" />, ms: 1100 },
  { id: 5, label: 'Structuring report output',      icon: <FileText size={15} color="#64748b" />, ms: 400 },
];

const PLAN_STEPS = [
  { id: 1, label: 'Loading village profile',         icon: <Home size={15} color="#3b82f6" />, ms: 480 },
  { id: 2, label: 'Evaluating intervention options', icon: <Settings size={15} color="#f59e0b" />, ms: 720 },
  { id: 3, label: 'Prioritising actions by urgency', icon: <Target size={15} color="#ef4444" />, ms: 560 },
  { id: 4, label: 'Running IBM Granite AI model',    icon: <Bot size={15} color="#8b5cf6" />, ms: 1050 },
  { id: 5, label: 'Generating action plan',          icon: <Zap size={15} color="#eab308" />, ms: 390 },
];

// ── Boot/generating animation component ──────────────────────────────────────
function GeneratingAnimation({
  steps, current, label,
}: {
  steps: typeof REPORT_STEPS;
  current: number;
  label: string;
}) {
  return (
    <div style={{
      padding: '28px 24px',
      background: 'var(--bg-card-hover)',
      border: '1px solid var(--border-glass)',
      borderRadius: 12,
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    }}>
      {/* Top: spinning ring + label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative', width: 48, height: 48, flexShrink: 0 }}>
          {/* outer slow ring */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '2px solid rgba(59,130,246,0.15)',
          }} />
          {/* spinning arc */}
          <div style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            border: '2px solid transparent',
            borderTopColor: '#3b82f6',
            borderRightColor: '#3b82f6',
            animation: 'rpt-spin 0.9s linear infinite',
          }} />
          {/* inner dot */}
          <div style={{
            position: 'absolute', inset: '30%', borderRadius: '50%',
            background: '#3b82f6',
            animation: 'rpt-pulse 1.4s ease-in-out infinite',
          }} />
        </div>
        <div>
          <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: 3 }}>
            {label}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
            IBM Granite AI · Step {Math.min(current + 1, steps.length)} of {steps.length}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ background: 'var(--border-glass)', borderRadius: 4, height: 5, overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          borderRadius: 4,
          width: `${Math.round(((current + 1) / steps.length) * 100)}%`,
          background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
          transition: 'width 0.5s ease',
        }} />
      </div>

      {/* Steps list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map((s, i) => {
          const done    = i < current;
          const active  = i === current;
          const pending = i > current;
          return (
            <div key={s.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '8px 12px', borderRadius: 8,
              background: active ? 'rgba(59,130,246,0.08)' : done ? 'rgba(34,197,94,0.06)' : 'transparent',
              border: `1px solid ${active ? 'rgba(59,130,246,0.25)' : done ? 'rgba(34,197,94,0.15)' : 'var(--border-glass)'}`,
              opacity: pending ? 0.45 : 1,
              transition: 'all 0.35s ease',
            }}>
              {/* status icon */}
              <div style={{ width: 22, height: 22, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {done
                  ? <CheckCircle size={16} color="#22c55e" />
                  : active
                  ? <Loader2 size={16} color="#3b82f6" style={{ animation: 'rpt-spin 0.85s linear infinite' }} />
                  : <div style={{ width: 16, height: 16, borderRadius: '50%', border: '1.5px solid var(--border-glass)' }} />
                }
              </div>
              <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>{s.icon}</span>
              <span style={{
                fontSize: '0.83rem', fontWeight: active ? 700 : 500,
                color: active ? 'var(--text-main)' : done ? 'var(--text-muted)' : 'var(--text-muted)',
                flex: 1,
              }}>
                {s.label}
              </span>
              {done && (
                <span style={{ fontSize: '0.68rem', color: '#22c55e', fontWeight: 700 }}>Done</span>
              )}
              {active && (
                <span style={{ fontSize: '0.68rem', color: '#3b82f6', fontWeight: 700 }}>Running…</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Report output card ────────────────────────────────────────────────────────
function ReportOutput({ text, demoMode, t }: { text: string; demoMode: boolean; t: (en: string, gu: string) => string }) {
  const [expanded, setExpanded] = useState(false);
  const preview = text.slice(0, 420);
  const hasMore = text.length > 420;

  return (
    <div style={{ marginTop: 16 }}>
      <div style={{
        padding: '16px 18px',
        background: 'var(--bg-card-hover)',
        border: '1px solid var(--border-glass)',
        borderRadius: 10,
        fontSize: '0.875rem',
        whiteSpace: 'pre-wrap',
        lineHeight: 1.75,
        color: 'var(--text-main)',
        maxHeight: expanded ? 'none' : 280,
        overflowY: expanded ? 'visible' : 'hidden',
        position: 'relative',
        transition: 'max-height 0.3s ease',
      }}>
        {expanded ? text : preview + (hasMore ? '…' : '')}
        {!expanded && hasMore && (
          <div style={{
            position: 'absolute', bottom: 0, left: 0, right: 0, height: 48,
            background: 'linear-gradient(to bottom, transparent, var(--bg-card-hover))',
            borderRadius: '0 0 10px 10px',
          }} />
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 }}>
        {hasMore && (
          <button
            onClick={() => setExpanded(e => !e)}
            style={{
              display: 'flex', alignItems: 'center', gap: 5,
              background: 'var(--bg-card-hover)',
              border: '1px solid var(--border-glass)',
              color: 'var(--text-muted)',
              borderRadius: 7, padding: '5px 12px',
              fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer',
              fontFamily: 'inherit', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text-main)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            {expanded ? <><ChevronUp size={13}/> Show less</> : <><ChevronDown size={13}/> Read full report</>}
          </button>
        )}
        <button
          onClick={() => {
            const a = document.createElement('a');
            a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(text);
            a.download = 'water-report.txt';
            a.click();
          }}
          style={{
            display: 'flex', alignItems: 'center', gap: 5,
            background: 'rgba(59,130,246,0.08)',
            border: '1px solid rgba(59,130,246,0.25)',
            color: '#3b82f6',
            borderRadius: 7, padding: '5px 12px',
            fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer',
            fontFamily: 'inherit', transition: 'all 0.15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59,130,246,0.08)'; }}
        >
          <Download size={12}/> {t('Download', 'ડાઉનલોડ')}
        </button>
      </div>

      {demoMode && (
        <div style={{
          marginTop: 10, padding: '8px 12px',
          background: 'rgba(124,58,237,0.07)',
          border: '1px solid rgba(124,58,237,0.18)',
          borderRadius: 7,
          fontSize: '0.72rem', color: 'var(--text-muted)', lineHeight: 1.5,
          display: 'flex', alignItems: 'flex-start', gap: 6,
        }}>
          <Info size={12} style={{ marginTop: 1, color: '#8b5cf6', flexShrink: 0 }} />
          Demo Mode — Deterministic fallback analysis. Add <code style={{ background: 'var(--bg-card-hover)', padding: '0 4px', borderRadius: 3, color: 'var(--text-main)' }}>WATSONX_API_KEY</code> to enable IBM Granite AI.
        </div>
      )}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────────────────────
function EmptyState({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      gap: 10, padding: '40px 20px', textAlign: 'center',
      background: 'var(--bg-card-hover)',
      border: '1px solid var(--border-glass)',
      borderRadius: 12, marginTop: 16,
    }}>
      <div style={{ opacity: 0.35, marginBottom: 4 }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>{title}</div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', maxWidth: 320, lineHeight: 1.6 }}>{sub}</div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Reports({ selectedVillage, setSelectedVillage, lang, demoMode }: Props) {
  const { theme } = useTheme();
  const [villages,       setVillages]       = useState<Village[]>([]);
  const [report,         setReport]         = useState<any>(null);
  const [actionPlan,     setActionPlan]     = useState<any>(null);
  const [loadingReport,  setLoadingReport]  = useState(false);
  const [loadingPlan,    setLoadingPlan]    = useState(false);
  const [reportStep,     setReportStep]     = useState(0);
  const [planStep,       setPlanStep]       = useState(0);

  const reportTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const planTimers   = useRef<ReturnType<typeof setTimeout>[]>([]);

  const t = (en: string, gu: string) => lang === 'gu' ? gu : en;

  useEffect(() => {
    getVillages().then(r => setVillages(r.villages));
  }, []);

  // cleanup timers on unmount
  useEffect(() => () => {
    reportTimers.current.forEach(clearTimeout);
    planTimers.current.forEach(clearTimeout);
  }, []);

  const runStepAnimation = (
    steps: typeof REPORT_STEPS,
    setStep: (n: number) => void,
    timers: React.MutableRefObject<ReturnType<typeof setTimeout>[]>,
  ) => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setStep(0);
    let elapsed = 0;
    steps.forEach((s, i) => {
      elapsed += s.ms;
      const id = setTimeout(() => setStep(i + 1), elapsed);
      timers.current.push(id);
    });
  };

  const genReport = () => {
    setLoadingReport(true);
    setReport(null);
    setReportStep(0);
    runStepAnimation(REPORT_STEPS, setReportStep, reportTimers);
    generateReport(selectedVillage)
      .then(r => { setReport(r); setLoadingReport(false); })
      .catch(() => setLoadingReport(false));
  };

  const genPlan = () => {
    setLoadingPlan(true);
    setActionPlan(null);
    setPlanStep(0);
    runStepAnimation(PLAN_STEPS, setPlanStep, planTimers);
    generateActionPlan(selectedVillage)
      .then(r => { setActionPlan(r); setLoadingPlan(false); })
      .catch(() => setLoadingPlan(false));
  };

  const villageLabel = villages.find(v => v.village_id === selectedVillage)?.name || selectedVillage;

  const btnBase: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 7,
    padding: '10px 20px', borderRadius: 10, border: 'none',
    fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer',
    fontFamily: 'inherit', transition: 'all 0.2s',
  };
  const btnPrimary: React.CSSProperties = {
    ...btnBase,
    background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
    color: '#fff',
    boxShadow: '0 4px 14px rgba(59,130,246,0.3)',
  };
  const btnDisabled: React.CSSProperties = {
    ...btnBase,
    background: theme === 'light' ? 'rgba(0,0,0,0.07)' : 'rgba(255,255,255,0.07)',
    color: 'var(--text-muted)',
    cursor: 'not-allowed',
    boxShadow: 'none',
  };

  const selectStyle: React.CSSProperties = {
    background: theme === 'light' ? '#ffffff' : 'rgba(0,0,0,0.25)',
    border: `1px solid ${theme === 'light' ? 'rgba(0,0,0,0.14)' : 'var(--border-glass)'}`,
    color: 'var(--text-main)',
    padding: '9px 14px',
    borderRadius: 9,
    outline: 'none',
    fontFamily: 'inherit',
    fontSize: '0.9rem',
    fontWeight: 500,
    cursor: 'pointer',
    minWidth: 200,
  };

  const cardStyle: React.CSSProperties = {
    background: 'var(--bg-card)',
    border: '1px solid var(--border-glass)',
    borderRadius: 16,
    padding: 24,
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
    boxShadow: theme === 'light'
      ? '0 4px 16px rgba(0,0,0,0.07)'
      : '0 8px 32px rgba(0,0,0,0.2)',
  };

  const cardHeaderStyle: React.CSSProperties = {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 16, paddingBottom: 14,
    borderBottom: '1px solid var(--border-glass)',
  };

  return (
    <div>
      {/* ── Page header ── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ display: 'flex', alignItems: 'center', gap: 10, margin: 0, fontSize: '1.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
            <FileText size={28} color="#3b82f6" />
            {t('Village Water Report Center', 'ગ્રામ જળ અહેવાલ કેન્દ્ર')}
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            {t('AI-powered water intelligence report — IBM Granite · Deterministic analysis', 'IBM Granite AI સંચાલિત જળ અહેવાલ')}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {demoMode && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 5,
              padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
              background: 'rgba(124,58,237,0.1)', color: '#8b5cf6',
              border: '1px solid rgba(124,58,237,0.25)',
            }}>
              <BrainCircuit size={12}/> Demo Mode
            </span>
          )}
          <VillageSelect villages={villages} value={selectedVillage} onChange={setSelectedVillage} width={220} />
        </div>
      </div>

      {/* ── Two-column card grid ── */}
      <div className="page-body">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: 20, marginBottom: 20 }}>

          {/* ── Village Water Situation Report ── */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: 'rgba(59,130,246,0.1)',
                  border: '1px solid rgba(59,130,246,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FileText size={17} color="#3b82f6" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                    {t('Village Water Situation Report', 'ગ્રામ જળ સ્થિતિ અહેવાલ')}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {t('Groundwater · Drought · Recommendations', 'ભૂગર્ભ · દુષ્કાળ · ભલામણો')}
                  </div>
                </div>
              </div>
              {demoMode && (
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 20, padding: '2px 9px' }}>Demo</span>
              )}
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
              {t('Comprehensive water intelligence report for', 'સંપૂર્ણ જળ અહેવાલ —')} <strong style={{ color: 'var(--text-main)' }}>{villageLabel}</strong>
              {t(' including groundwater depth, drought risk, AI recommendations, and data limitations.', ' — ભૂગર્ભ, દુષ્કાળ, AI ભલામણ.')}
            </p>

            <button
              onClick={genReport}
              disabled={loadingReport}
              style={loadingReport ? btnDisabled : btnPrimary}
              onMouseEnter={e => { if (!loadingReport) (e.currentTarget.style.boxShadow = '0 6px 20px rgba(59,130,246,0.45)'); }}
              onMouseLeave={e => { if (!loadingReport) (e.currentTarget.style.boxShadow = '0 4px 14px rgba(59,130,246,0.3)'); }}
            >
              {loadingReport
                ? <><Loader2 size={15} style={{ animation: 'rpt-spin 0.85s linear infinite' }}/> {t('Generating…', 'બનાવી રહ્યા છે…')}</>
                : <><RefreshCw size={15}/> {t('Generate Report', 'અહેવાલ બનાવો')}</>
              }
            </button>

            {loadingReport && (
              <div style={{ marginTop: 18 }}>
                <GeneratingAnimation steps={REPORT_STEPS} current={reportStep} label={t('Generating Water Intelligence Report', 'જળ અહેવાલ બનાવી રહ્યા છે')} />
              </div>
            )}

            {!loadingReport && report && (
              <ReportOutput text={report.report_text} demoMode={demoMode} t={t} />
            )}

            {!loadingReport && !report && (
              <EmptyState
                icon={<FileText size={40} />}
                title={t('No report generated yet', 'કોઈ અહેવાલ ઉત્પન્ન થયો નથી')}
                sub={t('Select a village and click Generate Report to get a full water intelligence report.', 'ગ્રામ પસંદ કરો અને "અહેવાલ બનાવો" ક્લિક કરો.')}
              />
            )}
          </div>

          {/* ── Water Action Plan ── */}
          <div style={cardStyle}>
            <div style={cardHeaderStyle}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9,
                  background: 'rgba(139,92,246,0.1)',
                  border: '1px solid rgba(139,92,246,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Zap size={17} color="#8b5cf6" />
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
                    {t('Water Action Plan', 'જળ ક્રિયા યોજના')}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: 2 }}>
                    {t('Today · This week · This month · This season', 'આજ · આ સપ્તાહ · આ મહિનો · આ ઋતુ')}
                  </div>
                </div>
              </div>
              {demoMode && (
                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#8b5cf6', background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 20, padding: '2px 9px' }}>Demo</span>
              )}
            </div>

            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: 16, lineHeight: 1.6 }}>
              {t('Structured action plan for', 'ક્રિયા યોજના —')} <strong style={{ color: 'var(--text-main)' }}>{villageLabel}</strong>
              {t(' covering immediate steps, weekly targets, monthly goals, and seasonal strategy.', ' — ત્વરિત, સાપ્તાહિક, માસિક, ઋતુ.')}
            </p>

            <button
              onClick={genPlan}
              disabled={loadingPlan}
              style={loadingPlan ? btnDisabled : { ...btnPrimary, background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)', boxShadow: '0 4px 14px rgba(139,92,246,0.3)' }}
              onMouseEnter={e => { if (!loadingPlan) (e.currentTarget.style.boxShadow = '0 6px 20px rgba(139,92,246,0.45)'); }}
              onMouseLeave={e => { if (!loadingPlan) (e.currentTarget.style.boxShadow = '0 4px 14px rgba(139,92,246,0.3)'); }}
            >
              {loadingPlan
                ? <><Loader2 size={15} style={{ animation: 'rpt-spin 0.85s linear infinite' }}/> {t('Generating…', 'બનાવી રહ્યા છે…')}</>
                : <><ClipboardList size={15}/> {t('Generate Action Plan', 'ક્રિયા યોજના બનાવો')}</>
              }
            </button>

            {loadingPlan && (
              <div style={{ marginTop: 18 }}>
                <GeneratingAnimation steps={PLAN_STEPS} current={planStep} label={t('Generating Water Action Plan', 'જળ ક્રિયા યોજના બનાવી રહ્યા છે')} />
              </div>
            )}

            {!loadingPlan && actionPlan && (
              <ReportOutput text={actionPlan.action_plan} demoMode={demoMode} t={t} />
            )}

            {!loadingPlan && !actionPlan && (
              <EmptyState
                icon={<ClipboardList size={40} />}
                title={t('No action plan generated yet', 'કોઈ ક્રિયા યોજના ઉત્પન્ન થઈ નથી')}
                sub={t('Select a village and click Generate Action Plan to get a structured intervention plan.', 'ગ્રામ પસંદ કરો અને "ક્રિયા યોજના બનાવો" ક્લિક કરો.')}
              />
            )}
          </div>
        </div>

        {/* ── Limitation notice ── */}
        <div style={{
          display: 'flex', gap: 12, alignItems: 'flex-start',
          padding: '14px 18px',
          background: theme === 'light' ? 'rgba(14,165,233,0.06)' : 'rgba(14,165,233,0.08)',
          border: `1px solid ${theme === 'light' ? 'rgba(14,165,233,0.2)' : 'rgba(14,165,233,0.25)'}`,
          borderRadius: 10,
          fontSize: '0.85rem',
          color: 'var(--text-main)',
          lineHeight: 1.65,
        }}>
          <AlertTriangle size={16} color="#0ea5e9" style={{ marginTop: 2, flexShrink: 0 }} />
          <div>
            <strong style={{ color: 'var(--text-main)' }}>{t('Important Limitations', 'મહત્ત્વની મર્યાદાઓ')}</strong><br />
            <span style={{ color: 'var(--text-muted)' }}>
              {t(
                'This is an AI decision-support system. Reports are generated from synthetic demonstration data and AI-assisted analysis. They do not replace expert agricultural, hydrological, or engineering advice. Consult local authorities before taking significant water management decisions.',
                'આ AI નિર્ણય-સહાય પ્રણાલી છે. અહેવાલ સ્થાનિક નિષ્ણાત, કૃષિ, જળ-વિજ્ઞાન કે ઇજનેરી સલાહ બદલતી નથી.',
              )}
            </span>
          </div>
        </div>
      </div>

      {/* ── Global keyframes for this page ── */}
      <style>{`
        @keyframes rpt-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes rpt-pulse {
          0%, 100% { transform: scale(1);   opacity: 1;   }
          50%       { transform: scale(0.7); opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
