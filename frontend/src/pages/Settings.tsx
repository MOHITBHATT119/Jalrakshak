import React, { useEffect, useState } from 'react';
import {
  Settings2, BrainCircuit, Database, Shield, Server,
  CheckCircle2, XCircle, AlertTriangle, RefreshCw,
  KeyRound, Terminal, Cpu, Zap, Globe, Info,
  Moon, Sun, Bell, Lock, Bot, Check,
} from 'lucide-react';
import { getHealth } from '../services/api';
import { useTheme } from '../context/ThemeContext';

interface Props { lang?: string; }

// ─── shared styles (CSS vars only → both themes) ───────────────────────────
const card: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-glass)',
  borderRadius: 14,
  overflow: 'hidden',
};

function SectionTitle({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '14px 20px',
      borderBottom: '1px solid var(--border-glass)',
      background: 'var(--bg-card-hover)',
    }}>
      <span style={{ color: '#3b82f6', display: 'flex' }}>{icon}</span>
      <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>{label}</span>
    </div>
  );
}

function InfoRow({
  label, value, valueEl, last = false,
}: {
  label: string; value?: string; valueEl?: React.ReactNode; last?: boolean;
}) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '13px 20px',
      borderBottom: last ? 'none' : '1px solid var(--border-glass)',
      gap: 12,
    }}>
      <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>{label}</span>
      {valueEl ?? (
        <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)', textAlign: 'right' }}>
          {value ?? '—'}
        </span>
      )}
    </div>
  );
}

function StatusBadge({ ok, labels }: { ok: boolean; labels: [string, string] }) {
  const color = ok ? '#22c55e' : '#ef4444';
  const bg    = ok ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)';
  const border = ok ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.04em',
      color, background: bg, border: `1px solid ${border}`,
    }}>
      {ok ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
      {ok ? labels[0] : labels[1]}
    </span>
  );
}

function ModeBadge({ demo }: { demo: boolean }) {
  const color  = demo ? '#f59e0b' : '#3b82f6';
  const bg     = demo ? 'rgba(245,158,11,0.1)' : 'rgba(59,130,246,0.1)';
  const border = demo ? 'rgba(245,158,11,0.3)' : 'rgba(59,130,246,0.3)';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '3px 10px', borderRadius: 20,
      fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.04em',
      color, background: bg, border: `1px solid ${border}`,
    }}>
      {demo ? <AlertTriangle size={11} /> : <Zap size={11} />}
      {demo ? 'DEMO MODE' : 'LIVE AI'}
    </span>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Settings({ lang }: Props) {
  const [health, setHealth]   = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(false);
  const { theme, toggleTheme } = useTheme();

  const [watsonConfig, setWatsonConfig] = useState(() => {
    try {
      const raw = localStorage.getItem('jalrakshak_watson_config');
      if (raw) return JSON.parse(raw);
    } catch {}
    return { integrationID: '', region: 'us-south', serviceInstanceID: '', useOfficialScript: false };
  });
  const [watsonSaved, setWatsonSaved] = useState(false);

  const saveWatsonConfig = () => {
    try {
      localStorage.setItem('jalrakshak_watson_config', JSON.stringify(watsonConfig));
      setWatsonSaved(true);
      setTimeout(() => setWatsonSaved(false), 2000);
    } catch {}
  };

  const fetchHealth = () => {
    setLoading(true); setError(false);
    getHealth()
      .then(h => { setHealth(h); setLoading(false); })
      .catch(() => { setError(true); setLoading(false); });
  };

  useEffect(() => { fetchHealth(); }, []);

  return (
    <div style={{ color: 'var(--text-main)', animation: 'fadeInUp 0.4s ease-out', maxWidth: 860, margin: '0 auto', width: '100%' }}>

      {/* ── PAGE HEADER ─────────────────────────────────────────────────── */}
      <div style={{
        ...card,
        marginBottom: 20,
        padding: '18px 22px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Settings2 size={20} color="#3b82f6" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>Settings</h1>
            <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              System configuration, IBM watsonx AI status and appearance.
            </p>
          </div>
        </div>
        <button
          onClick={fetchHealth}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 8,
            border: '1px solid var(--border-glass)',
            background: 'transparent', color: 'var(--text-muted)',
            fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <RefreshCw size={13} className={loading ? 'settings-spin' : ''} /> Refresh
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* ── IBM WATSONX STATUS ─────────────────────────────────────────── */}
        <div style={{ ...card, gridColumn: '1 / -1' }}>
          <SectionTitle icon={<BrainCircuit size={16} />} label="IBM Watsonx AI Status" />

          {loading && (
            <div style={{ padding: '28px 20px', display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <RefreshCw size={16} className="settings-spin" /> Loading system status…
            </div>
          )}

          {error && !loading && (
            <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: 10, color: '#ef4444', fontSize: '0.85rem' }}>
              <AlertTriangle size={16} /> Could not reach backend. Is the server running on port 8001?
            </div>
          )}

          {health && !loading && (
            <>
              {/* Status banner */}
              <div style={{
                margin: '16px 20px',
                padding: '14px 18px',
                borderRadius: 10,
                background: health.demo_mode
                  ? 'rgba(245,158,11,0.07)'
                  : 'rgba(59,130,246,0.07)',
                border: `1px solid ${health.demo_mode ? 'rgba(245,158,11,0.25)' : 'rgba(59,130,246,0.25)'}`,
                display: 'flex', alignItems: 'flex-start', gap: 12,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                  background: health.demo_mode ? 'rgba(245,158,11,0.15)' : 'rgba(59,130,246,0.15)',
                  border: `1px solid ${health.demo_mode ? 'rgba(245,158,11,0.3)' : 'rgba(59,130,246,0.3)'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {health.demo_mode
                    ? <AlertTriangle size={17} color="#f59e0b" />
                    : <Zap size={17} color="#3b82f6" />}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '0.92rem', marginBottom: 3, color: health.demo_mode ? '#d97706' : '#3b82f6' }}>
                    {health.demo_mode ? 'Running in Demo Mode' : 'Live IBM Granite AI Active'}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                    {health.demo_mode
                      ? 'IBM watsonx API key not detected. All AI responses use deterministic fallback calculations. Add WATSONX_API_KEY to .env to enable full AI.'
                      : 'IBM Granite AI is fully operational. All dashboards, reports and copilot responses use live model inference.'}
                  </div>
                </div>
              </div>

              {/* Detail rows */}
              <InfoRow label="API Status"
                valueEl={<StatusBadge ok={health.status === 'ok'} labels={['OK', 'ERROR']} />} />
              <InfoRow label="Watsonx Configured"
                valueEl={<StatusBadge ok={!!health.watsonx_configured} labels={['CONFIGURED', 'NOT CONFIGURED']} />} />
              <InfoRow label="AI Mode"
                valueEl={<ModeBadge demo={!!health.demo_mode} />} />
              <InfoRow label="Granite Model"
                value={health.granite_model ?? '—'} />
              <InfoRow label="Data Mode"
                valueEl={
                  <span style={{
                    padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 800,
                    color: health.data_mode === 'live' ? '#22c55e' : '#f59e0b',
                    background: health.data_mode === 'live' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)',
                    border: `1px solid ${health.data_mode === 'live' ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  }}>
                    {(health.data_mode ?? 'demo').toUpperCase()}
                  </span>
                } />
              <InfoRow label="Data Note" value={health.data_note ?? '—'} last />
            </>
          )}
        </div>

        {/* ── HOW TO ENABLE ──────────────────────────────────────────────── */}
        <div style={card}>
          <SectionTitle icon={<KeyRound size={16} />} label="Enable IBM Granite AI" />
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { step: '1', icon: <Terminal size={14} />, title: 'Open .env file', desc: 'Find the .env file in the project root directory.' },
              { step: '2', icon: <KeyRound size={14} />, title: 'Add API Key', desc: <>Set <code style={{ background: 'var(--bg-card-hover)', padding: '1px 5px', borderRadius: 4, fontSize: '0.78rem', color: '#3b82f6', fontFamily: 'monospace' }}>WATSONX_API_KEY=your_api_key_here</code></> },
              { step: '3', icon: <Server size={14} />, title: 'Restart backend', desc: 'Restart the Python FastAPI server.' },
            ].map(({ step, icon, title, desc }) => (
              <div key={step} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 800, color: '#3b82f6',
                }}>
                  {step}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.83rem', color: 'var(--text-main)', marginBottom: 2, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ color: '#3b82f6' }}>{icon}</span> {title}
                  </div>
                  <div style={{ fontSize: '0.77rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── IBM WATSON ASSISTANT CHATBOT ─────────────────────────────────── */}
        <div style={{ ...card, gridColumn: '1 / -1' }}>
          <SectionTitle icon={<Bot size={16} />} label="IBM Watson Assistant Web Chatbot" />
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              JalRakshak AI includes a floating <strong>IBM Watson Assistant</strong> chatbot at the bottom-right corner of every screen. By default, it connects to our integrated IBM Granite intelligence engine. You can also connect your live <strong>IBM Cloud Watson Assistant</strong> instance below.
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Watson Integration ID:
                </label>
                <input
                  type="text"
                  placeholder="e.g. 5e0b6d21-7649-4458-9be5-..."
                  value={watsonConfig.integrationID}
                  onChange={e => setWatsonConfig({ ...watsonConfig, integrationID: e.target.value })}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8,
                    background: 'var(--bg-dark)', color: 'var(--text-main)',
                    border: '1px solid var(--border-glass)', fontSize: '0.82rem',
                    fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 4 }}>
                  Watson Service Instance ID:
                </label>
                <input
                  type="text"
                  placeholder="e.g. 43a0d5c8-52c6-4866-9311-..."
                  value={watsonConfig.serviceInstanceID}
                  onChange={e => setWatsonConfig({ ...watsonConfig, serviceInstanceID: e.target.value })}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: 8,
                    background: 'var(--bg-dark)', color: 'var(--text-main)',
                    border: '1px solid var(--border-glass)', fontSize: '0.82rem',
                    fontFamily: 'monospace', boxSizing: 'border-box', outline: 'none',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginTop: 4 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.8rem' }}>
                <input
                  type="checkbox"
                  checked={watsonConfig.useOfficialScript}
                  onChange={e => setWatsonConfig({ ...watsonConfig, useOfficialScript: e.target.checked })}
                />
                <span>Load official IBM Cloud web-chat script (requires valid Integration ID)</span>
              </label>

              <button
                onClick={saveWatsonConfig}
                style={{
                  padding: '8px 20px', borderRadius: 8, border: 'none',
                  background: '#0f62fe', color: '#fff', fontWeight: 700,
                  fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'background 0.2s',
                }}
              >
                {watsonSaved ? <Check size={14} /> : null}
                {watsonSaved ? 'Saved Settings!' : 'Save Watson Settings'}
              </button>
            </div>
          </div>
        </div>

        {/* ── SECURITY NOTE ──────────────────────────────────────────────── */}
        <div style={card}>
          <SectionTitle icon={<Shield size={16} />} label="Security" />
          <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { icon: <Lock size={14} color="#22c55e" />, text: 'The API key is never sent to the frontend. It stays server-side only.' },
              { icon: <Shield size={14} color="#22c55e" />, text: 'All AI inference happens on IBM Cloud infrastructure — no data leaves the secure backend.' },
              { icon: <Globe size={14} color="#22c55e" />, text: 'Village and field data is stored locally in the backend SQLite database.' },
              { icon: <CheckCircle2 size={14} color="#22c55e" />, text: 'Admin access is protected by session-based authentication.' },
            ].map(({ icon, text }, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9 }}>
                <span style={{ flexShrink: 0, marginTop: 1 }}>{icon}</span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── APPEARANCE ─────────────────────────────────────────────────── */}
        <div style={card}>
          <SectionTitle icon={<Sun size={16} />} label="Appearance" />
          <div style={{ padding: '16px 20px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '12px 16px', borderRadius: 10,
              background: 'var(--bg-card-hover)', border: '1px solid var(--border-glass)',
            }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: 2 }}>
                  {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  {theme === 'dark' ? 'Currently using dark glassmorphic theme.' : 'Currently using light theme.'}
                </div>
              </div>
              <button
                onClick={toggleTheme}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  background: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)',
                  color: 'var(--text-main)', fontWeight: 700, fontSize: '0.82rem', fontFamily: 'inherit',
                  transition: 'background 0.2s',
                }}
              >
                {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
                Switch to {theme === 'dark' ? 'Light' : 'Dark'}
              </button>
            </div>
          </div>
        </div>

        {/* ── SYSTEM INFO ─────────────────────────────────────────────────── */}
        <div style={card}>
          <SectionTitle icon={<Cpu size={16} />} label="System Info" />
          <InfoRow label="Platform" value="JalRakshak AI 2.0" />
          <InfoRow label="Backend" value="FastAPI + IBM Granite" />
          <InfoRow label="Database" value="SQLite (local)" />
          <InfoRow label="AI Framework" value="IBM watsonx.ai" />
          <InfoRow label="Frontend" value="React + TypeScript + Vite" last />
        </div>

        {/* ── API ENDPOINTS ───────────────────────────────────────────────── */}
        <div style={{ ...card, gridColumn: '1 / -1' }}>
          <SectionTitle icon={<Terminal size={16} />} label="Backend API" />
          <div style={{ padding: '16px 20px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 8 }}>
              {[
                { method: 'GET',    path: '/api/v1/health',              desc: 'Health check & watsonx status' },
                { method: 'GET',    path: '/api/v1/villages',            desc: 'List all villages' },
                { method: 'GET',    path: '/api/v1/villages/{id}/water-health', desc: 'Water health score' },
                { method: 'GET',    path: '/api/v1/villages/{id}/groundwater',  desc: 'Groundwater depth & trend' },
                { method: 'GET',    path: '/api/v1/villages/{id}/risk',         desc: 'Drought risk assessment' },
                { method: 'POST',   path: '/api/v1/copilot',             desc: 'AI Water Copilot (Granite)' },
                { method: 'POST',   path: '/api/v1/action-plan',         desc: 'Generate action plan' },
                { method: 'GET',    path: '/api/v1/data/status',         desc: 'Data mode & table stats' },
                { method: 'POST',   path: '/api/v1/data/upload/{table}', desc: 'Upload CSV data' },
              ].map(({ method, path, desc }) => {
                const mc = method === 'GET' ? '#16a34a' : method === 'POST' ? '#2563eb' : '#dc2626';
                const mb = method === 'GET' ? 'rgba(34,197,94,0.1)' : method === 'POST' ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)';
                return (
                  <div key={path} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '6px 0', borderBottom: '1px solid var(--border-glass)' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', fontWeight: 800, color: mc, background: mb, border: `1px solid ${mc}44`, borderRadius: 3, padding: '2px 5px', flexShrink: 0, marginTop: 1 }}>
                      {method}
                    </span>
                    <div>
                      <div style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: '#3b82f6', marginBottom: 1 }}>{path}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{desc}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--border-glass)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Interactive Swagger docs:{' '}
              <a href="http://localhost:8001/docs" target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>
                http://localhost:8001/docs
              </a>
            </div>
          </div>
        </div>

      </div>

      <style>{`
        .settings-spin { animation: settings-rotate 1s linear infinite; display: inline-flex; }
        @keyframes settings-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
