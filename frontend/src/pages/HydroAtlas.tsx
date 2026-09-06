// src/pages/HydroAtlas.tsx
import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup, ZoomControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { getVillages, getWaterHealth, getDroughtRisk, Village } from '../services/api';
import { Map, X } from 'lucide-react';

interface Props { selectedVillage: string; setSelectedVillage: (v: string) => void; lang: string; }

// Real lat/lon coordinates for the 10 Saurashtra districts
const VILLAGE_COORDS: Record<string, [number, number]> = {
  V001: [22.3039, 70.8022],  // Rajkot
  V002: [21.5222, 70.4579],  // Junagadh
  V003: [21.6043, 71.2211],  // Amreli
  V004: [21.7645, 72.1519],  // Bhavnagar
  V005: [22.4707, 70.0577],  // Jamnagar
  V006: [21.6417, 69.6293],  // Porbandar
  V007: [20.9042, 70.3670],  // Gir Somnath
  V008: [22.7277, 71.6370],  // Surendranagar
  V009: [22.8120, 70.8236],  // Morbi
  V010: [22.2442, 68.9685],  // Devbhumi Dwarka
};

const healthColor = (cat: string) => ({ GOOD: '#16a34a', MODERATE: '#d97706', STRESSED: '#ea580c', CRITICAL: '#dc2626' }[cat] || '#6b7280');

// Saurashtra center
const MAP_CENTER: [number, number] = [21.9, 70.8];

// ── Translation table ──────────────────────────────────────────────────────
const T: Record<string, { gu: string }> = {
  'Hydro Atlas':                        { gu: 'જળ નકશો' },
  'Saurashtra Water Health Map — all 10 districts': { gu: 'સૌરાષ્ટ્ર જળ સ્વાસ્થ્ય નકશો — તમામ ૧૦ જિલ્લા' },
  'Synthetic demonstration data':       { gu: 'સિન્થેટિક દર્શન ડેટા' },
  'Synthetic demonstration data. Not official government measurements.':
    { gu: 'સિન્થેટિક દર્શન ડેટા. સરકારી માપ નહીં.' },

  // Legend
  'Water Health Status':                { gu: 'જળ સ્વાસ્થ્ય સ્થિતિ' },
  'GOOD':                               { gu: 'સારું' },
  'MODERATE':                           { gu: 'મધ્યમ' },
  'STRESSED':                           { gu: 'તણાવગ્રસ્ત' },
  'CRITICAL':                           { gu: 'ગંભીર' },

  // District list
  'All Districts':                      { gu: 'તમામ જિલ્લા' },
  'Loading…':                           { gu: 'લોડ થઈ રહ્યું છે…' },

  // Detail panel labels
  'District':                           { gu: 'જિલ્લો' },
  'Water Health Score':                 { gu: 'જળ સ્વાસ્થ્ય સ્કોર' },
  'Groundwater Trend':                  { gu: 'ભૂગર્ભ જળ વલણ' },
  'Drought Risk':                       { gu: 'દુષ્કાળ જોખમ' },
  'Population':                         { gu: 'વસ્તી' },
  'Annual Rainfall':                    { gu: 'વાર્ષિક વરસાદ' },
  'Loading health data…':               { gu: 'સ્વાસ્થ્ય ડેટા લોડ થઈ રહ્યો છે…' },
  'Loading drought data…':              { gu: 'દુષ્કાળ ડેટા લોડ થઈ રહ્યો છે…' },

  // Map popup labels
  'District (popup)':                   { gu: 'જિલ્લો' },
  'Water Health Score:':                { gu: 'જળ સ્વાસ્થ્ય સ્કોર:' },
  'GW Trend:':                          { gu: 'ભૂગર્ભ જળ:' },
  'Drought Risk:':                      { gu: 'દુષ્કાળ:' },
  'Population:':                        { gu: 'વસ્તી:' },
  'Rainfall:':                          { gu: 'વરસાદ:' },
};

function tr(key: string, lang: string): string {
  return (lang === 'gu' && T[key]?.gu) ? T[key].gu : key;
}

export default function HydroAtlas({ selectedVillage, setSelectedVillage, lang }: Props) {
  const [villages, setVillages] = useState<Village[]>([]);
  const [healthData, setHealthData] = useState<Record<string, any>>({});
  const [droughtData, setDroughtData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [tooltip, setTooltip] = useState<{ village: Village } | null>(null);

  const t = (key: string) => tr(key, lang);

  useEffect(() => {
    getVillages().then(r => {
      setVillages(r.villages);
      setLoading(false);
      r.villages.forEach((v: Village) => {
        getWaterHealth(v.village_id).then(h => setHealthData(prev => ({ ...prev, [v.village_id]: h })));
        getDroughtRisk(v.village_id).then(d => setDroughtData(prev => ({ ...prev, [v.village_id]: d })));
      });
    });
  }, []);

  const tv = tooltip?.village ?? null;
  const th = tv ? healthData[tv.village_id] : null;
  const td = tv ? droughtData[tv.village_id] : null;

  // Legend entries translated
  const LEGEND_ENTRIES: Array<[string, string]> = [
    ['GOOD', '#16a34a'],
    ['MODERATE', '#d97706'],
    ['STRESSED', '#ea580c'],
    ['CRITICAL', '#dc2626'],
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>
            <Map size={26} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: '#3b82f6' }} />
            {t('Hydro Atlas')}
          </h1>
          <p className="text-sm text-muted">
            {t('Saurashtra Water Health Map — all 10 districts')}
          </p>
        </div>
        <div className="text-xs text-muted">
          {t('Synthetic demonstration data')}
        </div>
      </div>

      <div className="page-body">
        <div className="alert alert-info" style={{ marginBottom: 16 }}>
          {t('Synthetic demonstration data. Not official government measurements.')}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16, alignItems: 'start' }}>
          {/* ── Real Map ── */}
          {/* z-index: 0 isolates Leaflet tile z-indexes so they never overlap the sticky navbar */}
          <div style={{
            borderRadius: 16,
            overflow: 'hidden',
            border: '1px solid var(--border-glass)',
            position: 'relative',
            zIndex: 0,
          }}>
            <MapContainer
              center={MAP_CENTER}
              zoom={8}
              style={{ height: '520px', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                maxZoom={19}
              />

              <ZoomControl position="bottomright" />

              {villages.map(v => {
                const coords = VILLAGE_COORDS[v.village_id];
                if (!coords) return null;
                const h = healthData[v.village_id];
                const d = droughtData[v.village_id];
                const color = h ? healthColor(h.category) : '#94a3b8';
                const isSelected = selectedVillage === v.village_id;

                return (
                  <CircleMarker
                    key={v.village_id}
                    center={coords}
                    radius={isSelected ? 16 : 11}
                    pathOptions={{
                      fillColor: color,
                      color: isSelected ? '#ffffff' : 'rgba(255,255,255,0.7)',
                      weight: isSelected ? 3 : 1.5,
                      fillOpacity: 0.9,
                    }}
                    eventHandlers={{
                      click: () => {
                        setSelectedVillage(v.village_id);
                        setTooltip({ village: v });
                      },
                    }}
                  >
                    <>
                      {/* Always-visible label tooltip */}
                      <Tooltip
                        permanent
                        direction="top"
                        offset={[0, -10]}
                        opacity={1}
                        className="hydro-map-label"
                      >
                        <span style={{ fontWeight: 600, fontSize: '0.72rem' }}>{v.name}</span>
                        {h && (
                          <span style={{
                            marginLeft: 4,
                            background: color,
                            color: '#fff',
                            borderRadius: 4,
                            padding: '1px 5px',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                          }}>
                            {h.overall_score?.toFixed(0)}
                          </span>
                        )}
                      </Tooltip>

                      <Popup className="hydro-map-popup">
                        <div style={{ minWidth: 180 }}>
                          <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 6 }}>{v.name}</div>
                          <div style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: 8 }}>
                            {v.district} {lang === 'gu' ? 'જિલ્લો' : 'District'}
                          </div>
                          {h && (
                            <div style={{ marginBottom: 6 }}>
                              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{t('Water Health Score:')} </span>
                              <span style={{ fontWeight: 700, color: healthColor(h.category), fontSize: '1.1rem' }}>{h.overall_score?.toFixed(0)}</span>
                              <span style={{
                                marginLeft: 8,
                                background: color,
                                color: '#fff',
                                borderRadius: 4,
                                padding: '2px 8px',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                              }}>
                                {t(h.category)}
                              </span>
                            </div>
                          )}
                          {h?.groundwater_trend && (
                            <div style={{ marginBottom: 6, fontSize: '0.8rem' }}>
                              <span style={{ color: '#94a3b8' }}>{t('GW Trend:')} </span>
                              <span style={{ fontWeight: 600 }}>{h.groundwater_trend}</span>
                            </div>
                          )}
                          {d?.risk_level && (
                            <div style={{ marginBottom: 6, fontSize: '0.8rem' }}>
                              <span style={{ color: '#94a3b8' }}>{t('Drought Risk:')} </span>
                              <span style={{ fontWeight: 600 }}>{d.risk_level} ({d.risk_score})</span>
                            </div>
                          )}
                          <div style={{ marginBottom: 4, fontSize: '0.8rem' }}>
                            <span style={{ color: '#94a3b8' }}>{t('Population:')} </span>
                            <span style={{ fontWeight: 600 }}>{Number(v.population).toLocaleString()}</span>
                          </div>
                          <div style={{ fontSize: '0.8rem' }}>
                            <span style={{ color: '#94a3b8' }}>{t('Rainfall:')} </span>
                            <span style={{ fontWeight: 600 }}>{v.annual_rainfall_mm} mm/yr</span>
                          </div>
                        </div>
                      </Popup>
                    </>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>

          {/* Legend + Info Panel */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Legend */}
            <div className="card" style={{ padding: '14px 18px' }}>
              <div className="card-title" style={{ fontSize: '0.85rem', marginBottom: 10 }}>
                {t('Water Health Status')}
              </div>
              {LEGEND_ENTRIES.map(([label, color]) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>{t(label)}</span>
                </div>
              ))}
            </div>

            {/* Village list / selected detail */}
            {tooltip && tv ? (
              <div className="card">
                <div className="card-header">
                  <div className="card-title">{tv.name}</div>
                  <button
                    onClick={() => setTooltip(null)}
                    aria-label="Close"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                  >
                    <X size={15} />
                  </button>
                </div>
                <div style={{ fontSize: '0.85rem' }}>
                  <div style={{ marginBottom: 10 }}>
                    <div className="text-xs text-muted">{t('District')}</div>
                    <div>{tv.district}</div>
                  </div>
                  {th ? (
                    <>
                      <div style={{ marginBottom: 6 }}>
                        <div className="text-xs text-muted">{t('Water Health Score')}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: '1.5rem', fontWeight: 700, color: healthColor(th.category) }}>
                            {th.overall_score?.toFixed(0)}
                          </span>
                          <span className={`badge badge-${th.category.toLowerCase()}`}>{t(th.category)}</span>
                        </div>
                      </div>
                      <div style={{ marginBottom: 8 }}>
                        <div className="text-xs text-muted">{t('Groundwater Trend')}</div>
                        <span className={`badge badge-${th.groundwater_trend?.toLowerCase()}`}>{th.groundwater_trend}</span>
                      </div>
                    </>
                  ) : (
                    <div style={{ marginBottom: 8, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {t('Loading health data…')}
                    </div>
                  )}
                  {td ? (
                    <div style={{ marginBottom: 10 }}>
                      <div className="text-xs text-muted">{t('Drought Risk')}</div>
                      <span className={`badge badge-${td.risk_level?.toLowerCase()}`}>
                        {td.risk_level} ({td.risk_score})
                      </span>
                    </div>
                  ) : (
                    <div style={{ marginBottom: 10, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {t('Loading drought data…')}
                    </div>
                  )}
                  <div style={{ marginBottom: 8, fontSize: '0.8rem' }}>
                    <div className="text-xs text-muted">{t('Population')}</div>
                    <div>{Number(tv.population).toLocaleString()}</div>
                  </div>
                  <div style={{ fontSize: '0.8rem' }}>
                    <div className="text-xs text-muted">{t('Annual Rainfall')}</div>
                    <div>{tv.annual_rainfall_mm} mm</div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div className="card-title" style={{ marginBottom: 8 }}>{t('All Districts')}</div>
                {villages.length === 0 && (
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', padding: '8px 0' }}>
                    {t('Loading…')}
                  </div>
                )}
                {villages.map(v => {
                  const h = healthData[v.village_id];
                  return (
                    <div
                      key={v.village_id}
                      onClick={() => {
                        setSelectedVillage(v.village_id);
                        setTooltip({ village: v });
                      }}
                      style={{
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        padding: '6px 8px', borderRadius: 6, cursor: 'pointer',
                        background: selectedVillage === v.village_id ? 'rgba(59, 130, 246, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      }}
                    >
                      <span style={{ fontSize: '0.82rem' }}>{v.name}</span>
                      {h
                        ? <span className={`badge badge-${h.category.toLowerCase()}`}>{h.overall_score?.toFixed(0)}</span>
                        : <span style={{ fontSize: '0.7rem', color: '#9ca3af' }}>…</span>
                      }
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
