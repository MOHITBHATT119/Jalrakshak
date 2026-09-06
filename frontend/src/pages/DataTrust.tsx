import React, { useEffect, useState } from 'react';
import { getHealth, getCommunityPriority } from '../services/api';
import { Search, Bot, AlertTriangle } from 'lucide-react';

interface Props { lang: string; }

export default function DataTrust({ lang }: Props) {
  const [health, setHealth] = useState<any>(null);
  const [priority, setPriority] = useState<any>(null);

  useEffect(() => {
    getHealth().then(setHealth);
    getCommunityPriority().then(setPriority);
  }, []);

  return (
    <div>
      <div className="page-header">
        <h1><Search size={24} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: '#3b82f6' }} />{lang === 'gu' ? 'ડેટા ટ્રસ્ટ' : 'Data Trust'}</h1>
        <p className="text-sm text-muted">Data quality, freshness, and confidence indicators</p>
      </div>
      <div className="page-body">
        <div className="alert alert-warning" style={{ marginBottom: 16 }}>
          <strong>SYNTHETIC DEMO DATA</strong> — All data in this application is synthetic demonstration data. It is NOT official government measurements, NOT real hydrogeological surveys, and NOT real agricultural statistics.
        </div>

        <div className="grid grid-2" style={{ marginBottom: 20 }}>
          {/* System Status */}
          <div className="card">
            <div className="card-header"><div className="card-title">System Status</div></div>
            {health && (
              <div>
                {[
                  { label: 'API Status', value: health.status, good: health.status === 'ok' },
                  { label: 'IBM Granite Model', value: health.granite_model },
                  { label: 'Watsonx Configured', value: health.watsonx_configured ? 'YES' : 'NO', good: health.watsonx_configured },
                  { label: 'Mode', value: health.demo_mode ? 'DEMO MODE' : 'LIVE AI', good: !health.demo_mode },
                ].map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-glass)', fontSize: '0.875rem' }}>
                    <span style={{ color: 'var(--text-main)' }}>{row.label}</span>
                    <span style={{ fontWeight: 600, color: row.good !== undefined ? (row.good ? '#16a34a' : '#ea580c') : 'var(--text-main)' }}>{row.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Data Sources */}
          <div className="card">
            <div className="card-header"><div className="card-title">Data Sources</div></div>
            {[
              { source: 'Groundwater Data', type: 'SYNTHETIC DEMO', freshness: '2019–2024', completeness: '10/10 villages', confidence: 'LOW' },
              { source: 'Rainfall Data', type: 'SYNTHETIC DEMO', freshness: '2019–2023', completeness: '2/10 villages detailed', confidence: 'LOW' },
              { source: 'Village Data', type: 'SYNTHETIC DEMO', freshness: 'Static', completeness: '10/10 villages', confidence: 'MODERATE' },
              { source: 'Water Demand', type: 'SYNTHETIC DEMO', freshness: '2019–2023', completeness: '4/10 villages', confidence: 'LOW' },
              { source: 'Recharge Data', type: 'SYNTHETIC DEMO', freshness: '2019–2022', completeness: '4/10 villages', confidence: 'LOW' },
              { source: 'Crop Database', type: 'STATIC REFERENCE', freshness: '2024', completeness: '20 crops', confidence: 'MODERATE' },
            ].map(d => (
              <div key={d.source} style={{ padding: '8px 0', borderBottom: '1px solid var(--border-glass)', fontSize: '0.8rem' }}>
                <div style={{ fontWeight: 600, marginBottom: 2 }}>{d.source}</div>
                <div style={{ color: '#7c3aed', fontSize: '0.72rem', marginBottom: 2 }}>
                  <span style={{ background: '#e9d5ff', padding: '1px 6px', borderRadius: 3 }}>{d.type}</span>
                </div>
                <div style={{ color: 'var(--text-muted)' }}>Freshness: {d.freshness} · {d.completeness} · Confidence: {d.confidence}</div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Transparency */}
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header"><div className="card-title"><Bot size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: '#3b82f6' }} />AI Transparency</div></div>
          <div className="grid grid-2">
            {[
              { aspect: 'Groundwater Calculations', method: 'Deterministic Python', detail: 'Mathematical trend analysis from data' },
              { aspect: 'Drought Risk Scores', method: 'Deterministic Python', detail: 'Weighted multi-factor algorithm' },
              { aspect: 'Water Health Score', method: 'Deterministic Python', detail: 'Composite 0–100 score from 5 components' },
              { aspect: 'Water Budget', method: 'Deterministic Python', detail: 'Supply vs demand calculation' },
              { aspect: 'Scenario Simulation', method: 'Deterministic Python', detail: 'Linear impact model' },
              { aspect: 'Natural Language', method: 'IBM Granite / Demo Fallback', detail: 'Explanations, reports, chat responses' },
              { aspect: 'Crop Recommendations', method: 'Scoring Algorithm', detail: 'Database + drought tolerance scoring' },
              { aspect: 'Recharge Recommendations', method: 'Rule-based + Aquifer Type', detail: 'Structure suitability matching' },
            ].map(r => (
              <div key={r.aspect} style={{ padding: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: 6, fontSize: '0.8rem' }}>
                <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{r.aspect}</div>
                <div style={{ color: '#3b82f6', fontSize: '0.72rem', margin: '2px 0' }}>{r.method}</div>
                <div style={{ color: 'var(--text-muted)' }}>{r.detail}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><div className="card-title"><AlertTriangle size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: '#f59e0b' }} />Limitations & Disclaimers</div></div>
          {[
            'All data is synthetic demonstration data — not real government or hydrogeological measurements',
            'This system is a decision-support tool, not a replacement for expert advice',
            'Agricultural recommendations require local agricultural validation',
            'Recharge recommendations require field survey and engineering validation',
            'Water demand and supply calculations are estimated, not metered',
            'IBM Granite responses in demo mode are deterministic fallbacks, not actual AI',
          ].map((d, i) => (
            <div key={i} style={{ padding: '6px 0', borderBottom: '1px solid var(--border-glass)', fontSize: '0.875rem', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <AlertTriangle size={14} style={{ color: '#ea580c', flexShrink: 0, marginTop: 3 }} /><span>{d}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
