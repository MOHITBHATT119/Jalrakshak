import React, { useEffect, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { getVillages, getGroundwater, Village } from '../services/api';
import VillageSelect from '../components/VillageSelect';
import { Droplets, Search } from 'lucide-react';

interface Props {
  selectedVillage: string;
  setSelectedVillage: (v: string) => void;
  lang: string;
}

const T: Record<string, { gu: string }> = {
  // Header
  'Groundwater Explorer': {
    gu: 'ભૂગર્ભ જળ સંશોધક'
  },
  'Groundwater depth monitoring and trend analysis': {
    gu: 'ભૂગર્ભ જળ ઊંડાઈ નિરીક્ષણ અને વલણ વિશ્લેષણ'
  },
  'Loading groundwater data...': {
    gu: 'ભૂગર્ભ જળ ડેટા લોડ થઈ રહ્યો છે...'
  },

  // Stat cards
  'Current Depth': {
    gu: 'વર્તમાન ઊંડાઈ'
  },
  'Below ground surface': {
    gu: 'જમીનની સપાટી નીચે'
  },
  'Trend': {
    gu: 'વલણ'
  },
  'Long-term direction': {
    gu: 'લાંબા ગાળાની દિશા'
  },
  'Annual Change': {
    gu: 'વાર્ષિક ફેરફાર'
  },
  'vs last year': {
    gu: 'ગયા વર્ષની સરખામણીમાં'
  },
  '5yr Depletion': {
    gu: '૫ વર્ષનો ઘટાડો'
  },
  'Since 2019 baseline': {
    gu: '૨૦૧૯ બેઝલાઇનથી'
  },

  // Chart card
  'Groundwater Depth Over Time': {
    gu: 'સમય સાથે ભૂગર્ભ જળ ઊંડાઈ'
  },
  'Note: Y-axis shows depth below surface. Higher values = deeper water = more depletion.': {
    gu: 'નોંધ: Y-અક્ષ સપાટી નીચેની ઊંડાઈ દર્શાવે છે. વધુ મૂલ્ય = ઊંડું પાણી = વધુ ઘટાડો.'
  },
  'Depth (m)': {
    gu: 'ઊંડાઈ (m)'
  },
  'Depth below ground': {
    gu: 'જમીન નીચે ઊંડાઈ'
  },
  '2019 baseline': {
    gu: '૨૦૧૯ આધારરેખા'
  },

  // Evidence card
  'Evidence & Analysis': {
    gu: 'પુરાવા અને વિશ્લેષણ'
  },
  'Severity:': {
    gu: 'તીવ્રતા:'
  },
  'Confidence:': {
    gu: 'વિશ્વાસ:'
  },

  // Severity values
  'MODERATE': {
    gu: 'મધ્યમ'
  },
  'HIGH': {
    gu: 'ઉચ્ચ'
  },
  'LOW': {
    gu: 'નીચું'
  },
  'CRITICAL': {
    gu: 'ગંભીર'
  },
  'IMPROVING': {
    gu: 'સુધારો'
  },
  'STABLE': {
    gu: 'સ્થિર'
  },
  'DECLINING': {
    gu: 'ઘટતું'
  },

  // Confidence values
  'VERY HIGH': {
    gu: 'ખૂબ ઉચ્ચ'
  },
  'MEDIUM': {
    gu: 'મધ્યમ'
  },

  // Data notes
  'Synthetic demonstration data. Not official government measurements.': {
    gu: 'સિન્થેટિક ડેમો ડેટા. સત્તાવાર સરકારી માપન નથી.'
  },

  // Dynamic depletion
  'Cumulative depletion': {
    gu: 'સંચિત ઘટાડો'
  },
  'since 2019': {
    gu: '૨૦૧૯ થી'
  }
};

/**
 * Translate static UI text.
 */
function tr(key: string, lang: string): string {
  return lang === 'gu' && T[key]?.gu ? T[key].gu : key;
}

/**
 * Translate severity/confidence values without changing
 * the original backend/API values.
 */
function translateValue(value: string | undefined, lang: string): string {
  if (!value) return '—';

  if (lang !== 'gu') {
    return value;
  }

  return T[value]?.gu || value;
}

/**
 * Translate the data note coming from the API.
 * Keeps unknown/custom backend messages unchanged.
 */
function translateDataNote(value: string | undefined, lang: string): string {
  if (!value) return '';

  if (lang !== 'gu') {
    return value;
  }

  // Exact known message
  if (T[value]?.gu) {
    return T[value].gu;
  }

  // Handle dynamic cumulative depletion messages.
  // Example:
  // "Cumulative depletion of 40.8% since 2019"
  const depletionMatch = value.match(
    /Cumulative depletion of\s+([\d.]+)%\s+since 2019/i
  );

  if (depletionMatch) {
    const percentage = depletionMatch[1];
    return `૨૦૧૯ થી સંચિત ઘટાડો ${percentage}%`;
  }

  // Handle strings containing both phrases.
  let translated = value;

  translated = translated.replace(
    /Cumulative depletion of\s+([\d.]+)%\s+since 2019/gi,
    (_match, percentage) => `૨૦૧૯ થી સંચિત ઘટાડો ${percentage}%`
  );

  translated = translated.replace(
    /Synthetic demonstration data\. Not official government measurements\./gi,
    'સિન્થેટિક ડેમો ડેટા. સત્તાવાર સરકારી માપન નથી.'
  );

  return translated;
}

export default function GroundwaterExplorer({
  selectedVillage,
  setSelectedVillage,
  lang
}: Props) {
  const [villages, setVillages] = useState<Village[]>([]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [timeRange, setTimeRange] = useState<number>(5);

  const t = (key: string) => tr(key, lang);

  useEffect(() => {
    getVillages()
      .then(r => setVillages(Array.isArray(r?.villages) ? r.villages : []))
      .catch(() => setVillages([]));
  }, []);

  useEffect(() => {
    if (!selectedVillage) return;

    setLoading(true);

    getGroundwater(selectedVillage)
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [selectedVillage]);

  const chartData = (() => {
    if (!data?.timeseries?.length) return [];

    const maxYear = Math.max(
      ...data.timeseries.map((t: any) => parseInt(t.year))
    );

    const cutoff = maxYear - timeRange;

    return data.timeseries
      .filter((t: any) => parseInt(t.year) > cutoff)
      .map((t: any) => ({
        label: `${t.year}-${String(t.month).padStart(2, '0')}`,
        depth: t.depth_m,
        quality: t.quality
      }));
  })();

  const trendColor = (
    {
      IMPROVING: '#16a34a',
      STABLE: '#3b82f6',
      DECLINING: '#ea580c',
      CRITICAL: '#dc2626'
    } as Record<string, string>
  )[data?.trend] || 'var(--text-muted)';

  /**
   * Dynamic Gujarati data note.
   */
  const displayDataNote = translateDataNote(data?.data_note, lang);

  /**
   * Dynamic Gujarati severity.
   */
  const displaySeverity = translateValue(data?.severity, lang);

  /**
   * Dynamic Gujarati confidence.
   */
  const displayConfidence = translateValue(data?.confidence, lang);

  return (
    <div>
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h1>
            <Droplets
              size={26}
              style={{
                display: 'inline',
                verticalAlign: 'middle',
                marginRight: 8,
                color: '#3b82f6'
              }}
            />
            {t('Groundwater Explorer')}
          </h1>

          <p className="text-sm text-muted">
            {t('Groundwater depth monitoring and trend analysis')}
          </p>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <VillageSelect
            villages={villages}
            value={selectedVillage}
            onChange={setSelectedVillage}
            width={220}
          />

          <div className="mode-selector">
            {[1, 3, 5].map(y => (
              <button
                key={y}
                className={`mode-btn ${
                  timeRange === y ? 'active' : ''
                }`}
                onClick={() => setTimeRange(y)}
              >
                {y}yr
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loading">
            <div className="spinner" />
            {t('Loading groundwater data...')}
          </div>
        ) : data ? (
          <>
            {/* ── Stat cards ── */}
            <div
              className="grid grid-4"
              style={{ marginBottom: 20 }}
            >
              <div className="stat-card">
                <div className="label">
                  {t('Current Depth')}
                </div>

                <div className="value">
                  {data.current_depth_m?.toFixed(1)}m
                </div>

                <div className="sub">
                  {t('Below ground surface')}
                </div>
              </div>

              <div className="stat-card">
                <div className="label">
                  {t('Trend')}
                </div>

                <div
                  className="value"
                  style={{
                    WebkitTextFillColor: 'currentcolor',
                    color: trendColor,
                    fontSize: '1.2rem'
                  }}
                >
                  {translateValue(data.trend, lang)}
                </div>

                <div className="sub">
                  {t('Long-term direction')}
                </div>
              </div>

              <div className="stat-card">
                <div className="label">
                  {t('Annual Change')}
                </div>

                <div
                  className="value"
                  style={{
                    WebkitTextFillColor: 'currentcolor',
                    color:
                      (data.annual_change_m || 0) > 0
                        ? '#dc2626'
                        : '#16a34a'
                  }}
                >
                  {data.annual_change_m != null
                    ? (data.annual_change_m > 0 ? '+' : '') +
                      data.annual_change_m.toFixed(1)
                    : '—'}
                  m
                </div>

                <div className="sub">
                  {t('vs last year')}
                </div>
              </div>

              <div className="stat-card">
                <div className="label">
                  {t('5yr Depletion')}
                </div>

                <div
                  className="value"
                  style={{
                    WebkitTextFillColor: 'currentcolor',
                    color:
                      data.change_pct_since_2019 > 15
                        ? '#dc2626'
                        : '#d97706'
                  }}
                >
                  {data.change_pct_since_2019?.toFixed(1)}%
                </div>

                <div className="sub">
                  {t('Since 2019 baseline')}
                </div>
              </div>
            </div>

            {/* ── Depth chart ── */}
            <div
              className="card"
              style={{ marginBottom: 20 }}
            >
              <div className="card-header">
                <div className="card-title">
                  {t('Groundwater Depth Over Time')} —{' '}
                  {data.village_name}
                </div>

                <span
                  className={`badge badge-${data.trend?.toLowerCase()}`}
                >
                  {translateValue(data.trend, lang)}
                </span>
              </div>

              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  marginBottom: 8
                }}
              >
                {t(
                  'Note: Y-axis shows depth below surface. Higher values = deeper water = more depletion.'
                )}
              </div>

              <ResponsiveContainer
                width="100%"
                height={280}
              >
                <LineChart
                  data={chartData}
                  margin={{
                    top: 5,
                    right: 20,
                    left: 10,
                    bottom: 5
                  }}
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="var(--border-glass)"
                  />

                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10 }}
                    interval={Math.max(
                      0,
                      Math.floor(chartData.length / 10) - 1
                    )}
                    minTickGap={40}
                  />

                  <YAxis
                    domain={['auto', 'auto']}
                    reversed
                    tick={{ fontSize: 10 }}
                    label={{
                      value: t('Depth (m)'),
                      angle: -90,
                      position: 'insideLeft',
                      offset: 10,
                      fontSize: 11
                    }}
                  />

                  <Tooltip
                    formatter={(v: any) => [
                      `${v}m`,
                      t('Depth below ground')
                    ]}
                  />

                  <Line
                    type="monotone"
                    dataKey="depth"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={
                      chartData.length <= 24
                        ? { r: 3 }
                        : false
                    }
                    activeDot={{ r: 5 }}
                  />

                  {data.historical_depth_m && (
                    <ReferenceLine
                      y={data.historical_depth_m}
                      stroke="#16a34a"
                      strokeDasharray="4 4"
                      label={{
                        value: t('2019 baseline'),
                        fontSize: 10,
                        fill: '#16a34a'
                      }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* ── Evidence ── */}
            <div
              className="card"
              style={{ marginBottom: 20 }}
            >
              <div className="card-header">
                <div className="card-title">
                  <Search
                    size={16}
                    style={{
                      display: 'inline',
                      verticalAlign: 'middle',
                      marginRight: 6,
                      color: '#3b82f6'
                    }}
                  />

                  {t('Evidence & Analysis')}
                </div>
              </div>

              {data.evidence?.map(
                (e: string, i: number) => (
                  <div
                    key={i}
                    style={{
                      padding: '8px 0',
                      borderBottom:
                        '1px solid var(--border-glass)',
                      fontSize: '0.875rem'
                    }}
                  >
                    • {e}
                  </div>
                )
              )}

              {/* ── Severity / Confidence / Data Note ── */}
              <div
                style={{
                  marginTop: 12,
                  padding: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  borderRadius: 6,
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)'
                }}
              >
                {t('Severity:')}{' '}
                <strong>
                  {displaySeverity}
                </strong>

                {' · '}

                {t('Confidence:')}{' '}
                <strong>
                  {displayConfidence}
                </strong>

                {displayDataNote && (
                  <>
                    {' · '}
                    {displayDataNote}
                  </>
                )}
              </div>

              {/* ── Cumulative Depletion ── */}
              {data.change_pct_since_2019 != null && (
                <div
                  style={{
                    marginTop: 10,
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)'
                  }}
                >
                  {lang === 'gu'
                    ? `૨૦૧૯ થી સંચિત ઘટાડો ${data.change_pct_since_2019.toFixed(
                        1
                      )}%`
                    : `Cumulative depletion of ${data.change_pct_since_2019.toFixed(
                        1
                      )}% since 2019`}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}