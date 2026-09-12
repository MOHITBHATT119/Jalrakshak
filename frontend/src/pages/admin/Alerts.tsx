import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import {
  Bell, ArrowLeft, CheckCircle, ClipboardList, UserCheck,
  BrainCircuit, XCircle, Eye, TrendingDown, CloudRain,
  Droplets, Zap, AlertTriangle, Info, ChevronRight,
} from 'lucide-react';

// ─── Types ───────────────────────────────────────────────────────────────────

interface Alert {
  id: string;
  village: string;
  type: 'GROUNDWATER_DEPLETION' | 'DROUGHT_RISK' | 'DATA_QUALITY';
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  detectedAt: string;
  priorityScore: number;
  aiConfidence: number;
  source: string;
  // detail fields
  groundwaterDecline: string;
  rainfallAnomaly: string;
  recharge: 'Low' | 'Medium' | 'High';
  extraction: 'Low' | 'Medium' | 'High';
  historicalTrend: 'Declining' | 'Stable' | 'Improving';
  aiExplanation: string;
}

// ─── Mock Data ─────────────────────────────────────────────────────────────

const ALERTS: Alert[] = [
  {
    id: 'ALT-001',
    village: 'Rajkot',
    type: 'GROUNDWATER_DEPLETION',
    severity: 'CRITICAL',
    detectedAt: '03 Sep 2026, 08:45 AM',
    priorityScore: 94,
    aiConfidence: 87,
    source: 'Groundwater Agent',
    groundwaterDecline: '3.2 m',
    rainfallAnomaly: '-22%',
    recharge: 'Low',
    extraction: 'High',
    historicalTrend: 'Declining',
    aiExplanation:
      'Groundwater conditions have deteriorated because recent groundwater levels are below the historical trend while rainfall remains below normal.',
  },
  {
    id: 'ALT-002',
    village: 'Amreli_V4',
    type: 'GROUNDWATER_DEPLETION',
    severity: 'HIGH',
    detectedAt: '02 Sep 2026, 03:10 PM',
    priorityScore: 78,
    aiConfidence: 81,
    source: 'Groundwater Agent',
    groundwaterDecline: '1.8 m',
    rainfallAnomaly: '-14%',
    recharge: 'Medium',
    extraction: 'High',
    historicalTrend: 'Declining',
    aiExplanation:
      'Groundwater levels have been declining over the past two seasons with extraction pressure exceeding natural recharge rates.',
  },
  {
    id: 'ALT-003',
    village: 'Bhavnagar_V1',
    type: 'DROUGHT_RISK',
    severity: 'HIGH',
    detectedAt: '01 Sep 2026, 11:00 AM',
    priorityScore: 85,
    aiConfidence: 79,
    source: 'Drought Agent',
    groundwaterDecline: '2.4 m',
    rainfallAnomaly: '-31%',
    recharge: 'Low',
    extraction: 'Medium',
    historicalTrend: 'Declining',
    aiExplanation:
      'Cumulative rainfall deficit for the season is significantly below historical norms, elevating drought risk to HIGH for the next 30 days.',
  },
  {
    id: 'ALT-004',
    village: 'Junagadh_V2',
    type: 'DATA_QUALITY',
    severity: 'MEDIUM',
    detectedAt: '31 Aug 2026, 06:55 AM',
    priorityScore: 42,
    aiConfidence: 92,
    source: 'Data Trust Agent',
    groundwaterDecline: 'N/A',
    rainfallAnomaly: 'N/A',
    recharge: 'Medium',
    extraction: 'Medium',
    historicalTrend: 'Stable',
    aiExplanation:
      'Three consecutive sensor readings from the village IoT node are outside the expected range, indicating a possible sensor malfunction or data transmission error.',
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────

const SEV_COLOR: Record<string, string> = {
  CRITICAL: '#ef4444',
  HIGH: '#f59e0b',
  MEDIUM: '#eab308',
};

const SEV_BG: Record<string, string> = {
  CRITICAL: 'rgba(239,68,68,0.12)',
  HIGH: 'rgba(245,158,11,0.12)',
  MEDIUM: 'rgba(234,179,8,0.12)',
};

const SEV_ICON: Record<string, React.ReactNode> = {
  CRITICAL: <AlertTriangle size={14} />,
  HIGH: <AlertTriangle size={14} />,
  MEDIUM: <Info size={14} />,
};

const TYPE_LABEL: Record<string, string> = {
  GROUNDWATER_DEPLETION: 'Groundwater Depletion',
  DROUGHT_RISK: 'Drought Risk',
  DATA_QUALITY: 'Data Quality',
};

// ─── Mini SVG Sparkline ────────────────────────────────────────────────────

function Sparkline({ color, declining }: { color: string; declining: boolean }) {
  // 8-point trend path (normalised 0-40 px height, 120 px wide)
  const pts = declining
    ? [38, 35, 33, 30, 27, 22, 18, 12]
    : [12, 15, 13, 16, 14, 17, 15, 18];

  const points = pts
    .map((y, i) => `${(i / 7) * 110 + 5},${y + 2}`)
    .join(' ');

  return (
    <svg width="120" height="44" viewBox="0 0 120 44" style={{ display: 'block' }}>
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {pts.map((y, i) => (
        <circle
          key={i}
          cx={(i / 7) * 110 + 5}
          cy={y + 2}
          r="2.2"
          fill={color}
          opacity={i === pts.length - 1 ? 1 : 0.35}
        />
      ))}
    </svg>
  );
}

// ─── Bar Chart (Rainfall) ─────────────────────────────────────────────────

function RainfallBars() {
  const months = ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'];
  const normal = [28, 35, 48, 82, 110, 95];
  const actual = [22, 28, 31, 60, 74, 68];
  const maxVal = 120;
  const barH = 80;

  return (
    <svg width="220" height="110" viewBox="0 0 220 110" style={{ display: 'block' }}>
      {months.map((m, i) => {
        const x = i * 36 + 6;
        const nH = (normal[i] / maxVal) * barH;
        const aH = (actual[i] / maxVal) * barH;
        return (
          <g key={m}>
            {/* normal */}
            <rect x={x} y={barH - nH + 5} width={12} height={nH} fill="#3b82f6" opacity={0.35} rx="2" />
            {/* actual */}
            <rect x={x + 13} y={barH - aH + 5} width={12} height={aH} fill="#ef4444" opacity={0.75} rx="2" />
            <text x={x + 6} y={100} fontSize="8" fill="var(--text-muted)" textAnchor="middle">{m}</text>
          </g>
        );
      })}
      {/* legend */}
      <rect x={5} y={105} width={8} height={4} fill="#3b82f6" opacity={0.45} rx="1" />
      <text x={16} y={109} fontSize="7.5" fill="var(--text-muted)">Normal</text>
      <rect x={65} y={105} width={8} height={4} fill="#ef4444" opacity={0.75} rx="1" />
      <text x={76} y={109} fontSize="7.5" fill="var(--text-muted)">Actual</text>
    </svg>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────

function SevBadge({ severity }: { severity: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: '4px',
      background: SEV_BG[severity], color: SEV_COLOR[severity],
      border: `1px solid ${SEV_COLOR[severity]}44`,
      borderRadius: '4px', padding: '2px 8px', fontSize: '0.75rem', fontWeight: 700,
    }}>
      {SEV_ICON[severity]}{severity}
    </span>
  );
}

// ─── Alert Detail ─────────────────────────────────────────────────────────

function AlertDetail({ alert, onBack }: { alert: Alert; onBack: () => void }) {
  const nav = useNavigate();
  const { t } = useLanguage();
  const [status, setStatus] = useState<string | null>(null);

  const col = SEV_COLOR[alert.severity];
  const bg = SEV_BG[alert.severity];

  const row = (label: string, value: string | React.ReactNode, valueColor?: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid var(--border-glass)' }}>
      <span style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{label}</span>
      <span style={{ fontWeight: 600, fontSize: '0.88rem', color: valueColor || 'var(--text-main)' }}>{value}</span>
    </div>
  );

  const actionBtn = (
    label: string,
    icon: React.ReactNode,
    bg: string,
    color: string,
    border: string,
    onClick: () => void,
    disabled?: boolean,
  ) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
        background: bg, color, border, borderRadius: '6px',
        padding: '10px 0', fontWeight: 600, fontSize: '0.88rem',
        cursor: disabled ? 'default' : 'pointer', opacity: disabled ? 0.5 : 1,
        transition: 'opacity 0.15s',
      }}
    >
      {icon}{label}
    </button>
  );

  return (
    <div>
      {/* Back */}
      <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', marginBottom: '18px', fontSize: '0.9rem', padding: 0 }}>
        <ArrowLeft size={16} /> {t('backToAlerts')}
      </button>

      {/* Header card */}
      <div style={{ background: 'var(--bg-card)', border: `1px solid ${col}55`, borderLeft: `4px solid ${col}`, borderRadius: '10px', padding: '22px 24px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
              <SevBadge severity={alert.severity} />
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{alert.id}</span>
            </div>
            <h2 style={{ margin: '0 0 4px 0', fontSize: '1.4rem' }}>{TYPE_LABEL[alert.type]} Alert</h2>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Village: <strong style={{ color: 'var(--text-main)' }}>{alert.village}</strong></div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Detected</div>
            <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{alert.detectedAt}</div>
            <div style={{ marginTop: '8px', display: 'flex', gap: '16px', justifyContent: 'flex-end' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: col }}>{alert.priorityScore}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Priority / 100</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#22c55e' }}>{alert.aiConfidence}%</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>AI Confidence</div>
              </div>
            </div>
            <div style={{ marginTop: '6px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Source: <span style={{ color: '#3b82f6' }}>{alert.source}</span></div>
          </div>
        </div>
      </div>

      {/* Two-column body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '18px' }}>

        {/* Why did this alert occur */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
            <TrendingDown size={16} color={col} /> Why Did This Alert Occur?
          </h3>
          {row('Groundwater Decline', alert.groundwaterDecline !== 'N/A' ? alert.groundwaterDecline : '—', alert.groundwaterDecline !== 'N/A' ? '#ef4444' : 'var(--text-muted)')}
          {row('Rainfall Anomaly', alert.rainfallAnomaly !== 'N/A' ? alert.rainfallAnomaly : '—', alert.rainfallAnomaly !== 'N/A' ? '#f59e0b' : 'var(--text-muted)')}
          {row('Recharge', alert.recharge, alert.recharge === 'Low' ? '#ef4444' : alert.recharge === 'Medium' ? '#f59e0b' : '#22c55e')}
          {row('Extraction', alert.extraction, alert.extraction === 'High' ? '#ef4444' : alert.extraction === 'Medium' ? '#f59e0b' : '#22c55e')}
          {row('Historical Trend', alert.historicalTrend, alert.historicalTrend === 'Declining' ? '#ef4444' : alert.historicalTrend === 'Stable' ? '#f59e0b' : '#22c55e')}
        </div>

        {/* Evidence charts */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '20px' }}>
          <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
            <Droplets size={16} color="#3b82f6" /> Evidence
          </h3>

          <div style={{ marginBottom: '14px' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Groundwater Level Trend (m bgl)
            </div>
            <div style={{ background: 'var(--bg-dark)', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Sparkline color={alert.historicalTrend === 'Declining' ? '#ef4444' : '#22c55e'} declining={alert.historicalTrend === 'Declining'} />
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#ef4444', fontWeight: 700, fontSize: '1.1rem' }}>
                  {alert.groundwaterDecline !== 'N/A' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <TrendingDown size={14} /> {alert.groundwaterDecline}
                    </span>
                  ) : '—'}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>vs baseline</div>
              </div>
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Rainfall vs Normal (mm)
            </div>
            <div style={{ background: 'var(--bg-dark)', borderRadius: '8px', padding: '10px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <RainfallBars />
              <div style={{ textAlign: 'right' }}>
                <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: '1.1rem' }}>
                  {alert.rainfallAnomaly !== 'N/A' ? alert.rainfallAnomaly : '—'}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>anomaly</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Explanation */}
      <div style={{ background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: '10px', padding: '18px 22px', marginBottom: '18px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
        <BrainCircuit size={22} color="#3b82f6" style={{ flexShrink: 0, marginTop: '2px' }} />
        <div>
          <div style={{ fontWeight: 700, color: '#3b82f6', marginBottom: '5px', fontSize: '0.92rem' }}>AI Explanation</div>
          <div style={{ color: '#cbd5e1', fontSize: '0.92rem', lineHeight: 1.65 }}>{alert.aiExplanation}</div>
        </div>
      </div>

      {/* Recommended Actions */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '20px', marginBottom: '20px' }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-main)' }}>
          <ClipboardList size={16} color="#22c55e" /> Recommended Actions
        </h3>
        <ol style={{ margin: 0, paddingLeft: '20px', color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 2 }}>
          <li>Verify groundwater measurement</li>
          <li>Review extraction pressure</li>
          <li>Assess recharge opportunities</li>
          <li>Contact village water committee</li>
        </ol>
      </div>

      {/* Admin Actions */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: '10px', padding: '20px' }}>
        <h3 style={{ margin: '0 0 14px 0', fontSize: '1rem', color: 'var(--text-main)' }}>What Should Admin Do?</h3>

        {status && (
          <div style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: '6px', padding: '10px 14px', marginBottom: '14px', fontSize: '0.88rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle size={15} /> {status}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
          {actionBtn('Acknowledge', <CheckCircle size={15} />, 'rgba(34,197,94,0.15)', '#22c55e', '1px solid rgba(34,197,94,0.35)', () => setStatus(`Alert ${alert.id} acknowledged.`))}
          {actionBtn('Create Action Plan', <ClipboardList size={15} />, '#3b82f6', '#fff', 'none', () => nav('/admin/action-plan'))}
          {actionBtn('Assign', <UserCheck size={15} />, 'rgba(139,92,246,0.15)', '#a78bfa', '1px solid rgba(139,92,246,0.35)', () => setStatus(`Alert ${alert.id} assigned for review.`))}
          {actionBtn('View Agent Trace', <BrainCircuit size={15} />, 'rgba(59,130,246,0.12)', '#60a5fa', '1px solid rgba(59,130,246,0.3)', () => nav('/admin/agent-trace'))}
          {actionBtn('Resolve', <CheckCircle size={15} />, 'rgba(34,197,94,0.15)', '#22c55e', '1px solid rgba(34,197,94,0.35)', () => setStatus(`Alert ${alert.id} marked as resolved.`))}
          {actionBtn('Dismiss', <XCircle size={15} />, 'rgba(239,68,68,0.1)', '#ef4444', '1px solid rgba(239,68,68,0.25)', () => setStatus(`Alert ${alert.id} dismissed.`))}
        </div>
      </div>
    </div>
  );
}

// ─── Alert List ───────────────────────────────────────────────────────────

function AlertList({ onSelect }: { onSelect: (a: Alert) => void }) {
  const { t } = useLanguage();
  const [filter, setFilter] = useState<'ALL' | 'CRITICAL' | 'HIGH' | 'MEDIUM'>('ALL');

  const visible = ALERTS.filter(a => filter === 'ALL' || a.severity === filter);

  const filterBtn = (label: string, val: typeof filter, color?: string) => (
    <button
      key={val}
      onClick={() => setFilter(val)}
      style={{
        background: filter === val ? (color ? `${color}22` : 'rgba(59,130,246,0.18)') : 'transparent',
        color: filter === val ? (color || '#60a5fa') : 'var(--text-muted)',
        border: `1px solid ${filter === val ? (color ? `${color}55` : 'rgba(59,130,246,0.4)') : 'var(--border-glass)'}`,
        borderRadius: '6px', padding: '6px 14px', cursor: 'pointer',
        fontWeight: filter === val ? 700 : 400, fontSize: '0.85rem',
        transition: 'all 0.15s',
      }}
    >
      {label}
    </button>
  );

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px', flexWrap: 'wrap', gap: '10px' }}>
        <div>
          <h2 style={{ margin: '0 0 3px 0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Bell size={20} color="#ef4444" /> {t('alerts')}
          </h2>
          <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.88rem' }}>{ALERTS.filter(a => a.severity === 'CRITICAL').length} critical · {ALERTS.length} total active</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {filterBtn(t('all'), 'ALL')}
          {filterBtn(t('critical'), 'CRITICAL', '#ef4444')}
          {filterBtn(t('high'), 'HIGH', '#f59e0b')}
          {filterBtn(t('medium'), 'MEDIUM', '#eab308')}
        </div>
      </div>

      {/* List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {visible.map(alert => (
          <div
            key={alert.id}
            onClick={() => onSelect(alert)}
            style={{
              background: 'var(--bg-card)',
              border: `1px solid ${SEV_COLOR[alert.severity]}44`,
              borderLeft: `4px solid ${SEV_COLOR[alert.severity]}`,
              borderRadius: '8px',
              padding: '16px 20px',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '14px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-card)')}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px', flexWrap: 'wrap' }}>
                <SevBadge severity={alert.severity} />
                <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{TYPE_LABEL[alert.type]}</span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{alert.id}</span>
              </div>
              <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <span>Village: <strong style={{ color: 'var(--text-main)' }}>{alert.village}</strong></span>
                <span>Detected: {alert.detectedAt}</span>
                <span>Source: <span style={{ color: '#3b82f6' }}>{alert.source}</span></span>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '18px', flexShrink: 0 }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: SEV_COLOR[alert.severity] }}>{alert.priorityScore}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Priority</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#22c55e' }}>{alert.aiConfidence}%</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Confidence</div>
              </div>
              <ChevronRight size={18} color="#475569" />
            </div>
          </div>
        ))}

        {visible.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#475569', background: 'var(--bg-card)', borderRadius: '8px', border: '1px dashed var(--border-glass)' }}>
            No alerts match this filter.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────

export default function Alerts() {
  const [selected, setSelected] = useState<Alert | null>(null);

  return (
    <div>
      {selected
        ? <AlertDetail alert={selected} onBack={() => setSelected(null)} />
        : <AlertList onSelect={setSelected} />}
    </div>
  );
}
