import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  getDataStatus, uploadDataCsv, resetDataTable, previewDataTable,
  DataStatusResponse, DataTableStat,
} from '../../services/api';
import {
  Database, Upload, RefreshCw, Trash2, Eye, CheckCircle, CheckCircle2, AlertCircle,
  AlertTriangle, Clock, FileText, ChevronDown, ChevronUp, Info,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// TYPES & CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

const TABLE_META: Record<string, {
  label: string;
  description: string;
  requiredCols: string;
  downloadTemplate: string[][];
}> = {
  villages: {
    label: 'Villages',
    description: 'Master list of villages with geographic and baseline water data.',
    requiredCols: 'village_id, name, district, lat, lon, population, agricultural_area_ha, primary_crops, annual_rainfall_mm, groundwater_depth_m, aquifer_type',
    downloadTemplate: [
      ['village_id','name','district','lat','lon','population','agricultural_area_ha','primary_crops','annual_rainfall_mm','groundwater_depth_m','aquifer_type'],
      ['V001','Rajkot','Rajkot','22.3039','70.8022','1500000','45000','Cotton;Groundnut','650','18.5','alluvial'],
    ],
  },
  groundwater: {
    label: 'Groundwater',
    description: 'Monthly groundwater depth measurements per village (metres below ground level).',
    requiredCols: 'village_id, year, month, depth_m, change_from_prev_year_m, quality',
    downloadTemplate: [
      ['village_id','year','month','depth_m','change_from_prev_year_m','quality'],
      ['V001','2024','6','19.2','0.4','moderate'],
    ],
  },
  rainfall: {
    label: 'Rainfall',
    description: 'Monthly rainfall measurements with historical average and deficit percentage.',
    requiredCols: 'village_id, year, month, rainfall_mm, historical_avg_mm, deficit_pct, season',
    downloadTemplate: [
      ['village_id','year','month','rainfall_mm','historical_avg_mm','deficit_pct','season'],
      ['V001','2024','6','85.2','120.5','-29.2','kharif'],
    ],
  },
  'water-demand': {
    label: 'Water Demand',
    description: 'Annual water demand and supply data per village (Million Cubic Metres).',
    requiredCols: 'village_id, year, domestic_demand_mcm, agricultural_demand_mcm, industrial_demand_mcm, total_demand_mcm, available_supply_mcm, deficit_mcm',
    downloadTemplate: [
      ['village_id','year','domestic_demand_mcm','agricultural_demand_mcm','industrial_demand_mcm','total_demand_mcm','available_supply_mcm','deficit_mcm'],
      ['V001','2024','46.5','195.0','30.0','271.5','220.0','-51.5'],
    ],
  },
  recharge: {
    label: 'Recharge Structures',
    description: 'Recharge infrastructure inventory with estimated recharge volumes.',
    requiredCols: 'village_id, year, structure_type, count, estimated_recharge_mcm, status, notes',
    downloadTemplate: [
      ['village_id','year','structure_type','count','estimated_recharge_mcm','status','notes'],
      ['V001','2024','check_dam','14','9.8','operational','Aji river basin'],
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function downloadCsv(rows: string[][], filename: string) {
  const csv = rows.map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function statusColor(s: DataTableStat) {
  return s.has_live ? '#22c55e' : '#f59e0b';
}

// ─────────────────────────────────────────────────────────────────────────────
// SHARED STYLE HELPERS  (all use CSS vars → theme-aware)
// ─────────────────────────────────────────────────────────────────────────────

const cardBase: React.CSSProperties = {
  background: 'var(--bg-card)',
  border: '1px solid var(--border-glass)',
  borderRadius: 10,
  overflow: 'hidden',
};

function actionBtn(color: string): React.CSSProperties {
  return {
    background: `${color}18`,
    color,
    border: `1px solid ${color}44`,
    borderRadius: 6,
    padding: '6px 12px',
    cursor: 'pointer',
    fontWeight: 600,
    fontSize: '0.78rem',
    fontFamily: 'inherit',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    whiteSpace: 'nowrap' as const,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Stat pill
// ─────────────────────────────────────────────────────────────────────────────
function Stat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div style={{ fontSize: '0.67rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 2, fontWeight: 600 }}>{label}</div>
      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: color ?? 'var(--text-main)' }}>{value}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TABLE CARD
// ─────────────────────────────────────────────────────────────────────────────
function TableCard({ tableKey, meta, stat, onRefresh }: {
  tableKey: string;
  meta: typeof TABLE_META[string];
  stat: DataTableStat;
  onRefresh: () => void;
}) {
  const [uploading, setUploading]   = useState(false);
  const [resetting, setResetting]   = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [preview, setPreview]       = useState<any[] | null>(null);
  const [msg, setMsg]               = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const flash = (type: 'ok' | 'err', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 5000);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const result = await uploadDataCsv(tableKey, file);
      flash('ok', result.message ?? `Uploaded ${result.count} rows.`);
      onRefresh();
    } catch (err: any) {
      flash('err', err?.response?.data?.detail ?? 'Upload failed.');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleReset = async () => {
    if (!window.confirm(`Delete all LIVE rows from "${meta.label}"? Demo data will remain.`)) return;
    setResetting(true);
    try {
      const r = await resetDataTable(tableKey);
      flash('ok', r.message);
      setPreview(null);
      onRefresh();
    } catch (err: any) {
      flash('err', err?.response?.data?.detail ?? 'Reset failed.');
    } finally {
      setResetting(false);
    }
  };

  const handlePreview = async () => {
    if (previewing) { setPreviewing(false); setPreview(null); return; }
    setPreviewing(true);
    try {
      const r = await previewDataTable(tableKey);
      setPreview(r.rows ?? []);
    } catch {
      setPreview([]);
    }
  };

  const color = statusColor(stat);

  return (
    <div style={{ ...cardBase, borderLeft: `4px solid ${color}` }}>

      {/* ── Header ── */}
      <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
            <Database size={16} color={color} />
            <span style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>{meta.label}</span>
            <span style={{
              background: `${color}22`, color, border: `1px solid ${color}55`,
              borderRadius: 4, padding: '1px 7px', fontSize: '0.68rem', fontWeight: 800,
              textTransform: 'uppercase', letterSpacing: '0.05em',
            }}>
              {stat.has_live ? 'LIVE' : 'DEMO'}
            </span>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>{meta.description}</div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', alignItems: 'center' }}>
          <button
            onClick={() => downloadCsv(meta.downloadTemplate, `${tableKey}_template.csv`)}
            style={actionBtn('#3b82f6')}
            title="Download CSV template"
          >
            <FileText size={13} /> Template
          </button>
          <label style={{ ...actionBtn('#22c55e'), opacity: uploading ? 0.6 : 1, pointerEvents: uploading ? 'none' : 'auto' }}>
            {uploading
              ? <><RefreshCw size={13} className="ds-spin" /> Uploading…</>
              : <><Upload size={13} /> Upload CSV</>}
            <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleUpload} />
          </label>
          <button onClick={handlePreview} style={actionBtn('#8b5cf6')}>
            <Eye size={13} /> {previewing ? 'Hide' : 'Preview'}
            {previewing ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          {stat.has_live && (
            <button onClick={handleReset} style={actionBtn('#ef4444')} disabled={resetting}>
              {resetting ? <RefreshCw size={13} className="ds-spin" /> : <Trash2 size={13} />}
              Reset Live
            </button>
          )}
        </div>
      </div>

      {/* ── Stats row ── */}
      <div style={{
        padding: '10px 20px 14px',
        display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-end',
        borderTop: '1px solid var(--border-glass)',
        background: 'var(--bg-card-hover)',
      }}>
        <Stat label="Total Rows"   value={stat.total_rows.toString()} />
        <Stat label="Live Rows"    value={stat.live_rows.toString()}  color="#22c55e" />
        <Stat label="Demo Rows"    value={stat.demo_rows.toString()}  color="#f59e0b" />
        <Stat label="Last Updated" value={stat.last_updated ? new Date(stat.last_updated).toLocaleString('en-IN') : '—'} />
        <div style={{ marginLeft: 'auto', fontSize: '0.72rem', color: 'var(--text-muted)', maxWidth: 480, lineHeight: 1.6 }}>
          <span style={{ fontWeight: 600 }}>Required cols: </span>
          <code style={{ color: '#3b82f6', fontFamily: 'monospace', fontSize: '0.7rem' }}>{meta.requiredCols}</code>
        </div>
      </div>

      {/* ── Flash message ── */}
      {msg && (
        <div style={{
          margin: '0 20px 12px',
          padding: '9px 14px', borderRadius: 7, fontSize: '0.83rem',
          background: msg.type === 'ok' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          color: msg.type === 'ok' ? '#16a34a' : '#dc2626',
          border: `1px solid ${msg.type === 'ok' ? 'rgba(34,197,94,0.35)' : 'rgba(239,68,68,0.35)'}`,
          display: 'flex', alignItems: 'center', gap: 7,
        }}>
          {msg.type === 'ok' ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
          {msg.text}
        </div>
      )}

      {/* ── Preview table ── */}
      {previewing && preview !== null && (
        <div style={{ padding: '0 20px 16px', overflowX: 'auto', maxHeight: 320 }}>
          {preview.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.83rem', padding: '12px 0' }}>No rows found.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.75rem' }}>
              <thead>
                <tr style={{ background: 'var(--bg-card-hover)', borderBottom: '1px solid var(--border-glass)' }}>
                  {Object.keys(preview[0]).map(k => (
                    <th key={k} style={{
                      padding: '6px 10px', textAlign: 'left',
                      color: 'var(--text-muted)', whiteSpace: 'nowrap',
                      fontWeight: 700, fontSize: '0.67rem',
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                    }}>{k}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.slice(0, 20).map((row, i) => (
                  <tr key={i} style={{
                    background: i % 2 === 0 ? 'transparent' : 'var(--bg-card-hover)',
                    borderBottom: '1px solid var(--border-glass)',
                  }}>
                    {Object.values(row).map((v: any, j) => (
                      <td key={j} style={{
                        padding: '5px 10px',
                        color: v === 'live' ? '#22c55e' : 'var(--text-main)',
                        fontWeight: v === 'live' ? 700 : 400,
                        whiteSpace: 'nowrap',
                        fontSize: '0.75rem',
                      }}>
                        {v?.toString() ?? '—'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {preview.length > 20 && (
            <div style={{ marginTop: 6, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Showing first 20 of {preview.length} rows.
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────

export default function DataSources() {
  const { t } = useLanguage();
  const [status, setStatus]   = useState<DataStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      setStatus(await getDataStatus());
    } catch {
      setStatus(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStatus(); }, []);

  const isLive = status?.data_mode === 'live';

  return (
    <div style={{ color: 'var(--text-main)', fontFamily: 'inherit', animation: 'fadeInUp 0.4s ease-out' }}>

      {/* ── Header ── */}
      <div style={{
        ...cardBase,
        marginBottom: 20,
        padding: '18px 22px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        flexWrap: 'wrap', gap: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 10,
            background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <Database size={20} color="#3b82f6" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {t('dataSources')}
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: '0.83rem', color: 'var(--text-muted)' }}>
              Upload real government data to switch from demo to live mode. All analysis agents update instantly.
            </p>
          </div>
        </div>
        <button
          onClick={fetchStatus}
          style={actionBtn('#3b82f6')}
        >
          <RefreshCw size={14} className={loading ? 'ds-spin' : ''} /> {t('refresh')}
        </button>
      </div>

      {/* ── Global data mode banner ── */}
      <div style={{
        display: 'flex', alignItems: 'flex-start', gap: 14,
        background: isLive ? 'rgba(34,197,94,0.08)' : 'rgba(245,158,11,0.08)',
        border: `1px solid ${isLive ? 'rgba(34,197,94,0.3)' : 'rgba(245,158,11,0.3)'}`,
        borderRadius: 12, padding: '16px 20px', marginBottom: 20,
      }}>
        <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', marginTop: 2 }}>{isLive ? <CheckCircle2 size={32} color="#16a34a" /> : <AlertCircle size={32} color="#d97706" />}</div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '1rem', color: isLive ? '#16a34a' : '#d97706', marginBottom: 4 }}>
            {isLive ? 'LIVE DATA MODE' : 'DEMONSTRATION DATA MODE'}
          </div>
          <div style={{ fontSize: '0.83rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            {status?.description ?? 'Loading data status…'}
          </div>
          {!isLive && (
            <div style={{ marginTop: 6, fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Upload real CSV data below to switch to Live Mode. The entire website — all dashboards, agents, and reports — will automatically use your real data.
            </div>
          )}
        </div>
      </div>

      {/* ── How it works ── */}
      <div style={{
        background: 'rgba(59,130,246,0.06)',
        border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: 12, padding: '16px 20px', marginBottom: 20,
      }}>
        <div style={{ fontWeight: 700, marginBottom: 10, fontSize: '0.88rem', color: '#3b82f6', display: 'flex', alignItems: 'center', gap: 7 }}>
          <Info size={15} /> How Real-Time Data Works
        </div>
        <ol style={{ margin: 0, paddingLeft: 20, fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 2.1 }}>
          <li>Download the CSV template for any table below.</li>
          <li>Fill it with your real government / field data — keep column headers exactly as shown.</li>
          <li>Upload the filled CSV — it is stored in the live database instantly.</li>
          <li><strong style={{ color: 'var(--text-main)' }}>Every API, dashboard, chart, report, and AI analysis immediately uses your real data.</strong></li>
          <li>Live rows are tagged <span style={{ color: '#22c55e', fontWeight: 700 }}>LIVE</span>; demo rows stay as fallback for any missing villages.</li>
          <li>Use "Reset Live" to remove uploaded data and revert a table to demo mode.</li>
        </ol>
      </div>

      {/* ── Table cards ── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} className="ds-spin" style={{ marginBottom: 12, display: 'block', margin: '0 auto 12px' }} />
          <div>Loading data status…</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          {Object.entries(TABLE_META).map(([key, meta]) => {
            const statsKey = key.replace('-', '_');
            const stat: DataTableStat = status?.tables[statsKey] ?? {
              total_rows: 0,
              live_rows: 0,
              estimated_rows: 0,
              demo_rows: 0,
              has_live: false,
              has_estimated: false,
              last_updated: null,
            };
            return (
              <TableCard
                key={key}
                tableKey={key}
                meta={meta}
                stat={stat}
                onRefresh={fetchStatus}
              />
            );
          })}
        </div>
      )}

      {/* ── API reference ── */}
      <div style={{ ...cardBase, padding: '20px 22px' }}>
        <div style={{ fontWeight: 700, marginBottom: 14, fontSize: '0.88rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 7 }}>
          <FileText size={15} color="var(--text-muted)" /> API Endpoints
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 400, marginLeft: 4 }}>(for system integration)</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: 10 }}>
          {[
            ['GET',    '/api/v1/data/status',             'Data mode & table statistics'],
            ['POST',   '/api/v1/data/upload/villages',    'Upload villages CSV'],
            ['POST',   '/api/v1/data/upload/groundwater', 'Upload groundwater CSV'],
            ['POST',   '/api/v1/data/upload/rainfall',    'Upload rainfall CSV'],
            ['POST',   '/api/v1/data/upload/water-demand','Upload water demand CSV'],
            ['POST',   '/api/v1/data/upload/recharge',    'Upload recharge CSV'],
            ['GET',    '/api/v1/data/preview/{table}',    'Preview current table data'],
            ['DELETE', '/api/v1/data/reset/{table}',      'Delete live rows (revert to demo)'],
            ['POST',   '/api/v1/data/entry/groundwater',  'Manual groundwater entry (JSON)'],
            ['POST',   '/api/v1/data/entry/rainfall',     'Manual rainfall entry (JSON)'],
            ['POST',   '/api/v1/data/entry/water-demand', 'Manual water demand entry (JSON)'],
          ].map(([method, path, desc]) => (
            <div key={path} style={{ display: 'flex', gap: 9, alignItems: 'flex-start', padding: '6px 0', borderBottom: '1px solid var(--border-glass)' }}>
              <span style={{
                fontFamily: 'monospace', fontSize: '0.67rem', fontWeight: 800,
                color: method === 'GET' ? '#16a34a' : method === 'POST' ? '#2563eb' : '#dc2626',
                background: method === 'GET' ? 'rgba(34,197,94,0.1)' : method === 'POST' ? 'rgba(59,130,246,0.1)' : 'rgba(239,68,68,0.1)',
                border: `1px solid ${method === 'GET' ? 'rgba(34,197,94,0.3)' : method === 'POST' ? 'rgba(59,130,246,0.3)' : 'rgba(239,68,68,0.3)'}`,
                borderRadius: 3, padding: '2px 5px', flexShrink: 0, marginTop: 1,
                letterSpacing: '0.03em',
              }}>{method}</span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: 'monospace', fontSize: '0.74rem', color: '#3b82f6', marginBottom: 1, wordBreak: 'break-all' }}>{path}</div>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{desc}</div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 14, fontSize: '0.75rem', color: 'var(--text-muted)', borderTop: '1px solid var(--border-glass)', paddingTop: 12 }}>
          Full interactive docs:{' '}
          <a href="http://localhost:8001/docs" target="_blank" rel="noreferrer" style={{ color: '#3b82f6', textDecoration: 'none', fontWeight: 600 }}>
            http://localhost:8001/docs
          </a>
        </div>
      </div>

      <style>{`
        .ds-spin { animation: ds-rotate 1s linear infinite; display: inline-flex; }
        @keyframes ds-rotate { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
