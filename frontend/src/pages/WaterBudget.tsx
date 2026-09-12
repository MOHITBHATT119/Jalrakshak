import React, { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { getVillages, getWaterBudget, Village } from '../services/api';
import VillageSelect from '../components/VillageSelect';
import { Scale, Lightbulb, TrendingDown } from 'lucide-react';

interface Props { selectedVillage: string; setSelectedVillage: (v: string) => void; lang: string; }

const STATUS_COLORS: Record<string, string> = {
  SURPLUS: '#16a34a', BALANCED: '#3b82f6', DEFICIT: '#ea580c', SEVERE_DEFICIT: '#dc2626',
};

const T: Record<string, { gu: string }> = {
  // Header
  'Water Budget':                             { gu: 'જળ બજેટ' },
  'Water supply vs demand balance analysis':  { gu: 'જળ પુરવઠો અને માંગ સંતુલન વિશ્લેષણ' },
  'Calculating water budget...':              { gu: 'જળ બજેટ ગણતરી...' },

  // Stat cards
  'Total Supply':                             { gu: 'કુલ પુરવઠો' },
  'Estimated annual':                         { gu: 'અંદાજિત વાર્ષિક' },
  'Total Demand':                             { gu: 'કુલ માંગ' },
  'Including all sectors':                    { gu: 'તમામ ક્ષેત્રો સહિત' },
  'Balance':                                  { gu: 'સંતુલન' },
  'Risk Level':                               { gu: 'જોખમ સ્તર' },
  'Water risk':                               { gu: 'જળ જોખમ' },

  // Charts
  'Supply vs Demand':                         { gu: 'પુરવઠો વિ. માંગ' },
  'Supply':                                   { gu: 'પુરવઠો' },
  'Demand':                                   { gu: 'માંગ' },
  'Demand Breakdown':                         { gu: 'માંગ વિભાજન' },
  'Agriculture':                              { gu: 'કૃષિ' },
  'Domestic':                                 { gu: 'ઘરેલુ' },
  'Industrial':                               { gu: 'ઔદ્યોગિક' },

  // Savings
  'Potential Water Savings':                  { gu: 'સંભવિત જળ બચત' },
};

function tr(key: string, lang: string): string {
  return (lang === 'gu' && T[key]?.gu) ? T[key].gu : key;
}

export default function WaterBudget({ selectedVillage, setSelectedVillage, lang }: Props) {
  const [villages, setVillages] = useState<Village[]>([]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const t = (key: string) => tr(key, lang);

  useEffect(() => { getVillages().then(r => setVillages(Array.isArray(r?.villages) ? r.villages : [])).catch(() => {}); }, []);

  useEffect(() => {
    if (!selectedVillage) return;
    setLoading(true);
    getWaterBudget(selectedVillage).then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, [selectedVillage]);

  const demandPie = data ? [
    { name: t('Agriculture'), value: data.demand.agricultural_mcm, color: '#3b82f6' },
    { name: t('Domestic'),    value: data.demand.domestic_mcm,     color: '#22c55e' },
    { name: t('Industrial'),  value: data.demand.industrial_mcm,   color: '#f59e0b' },
  ] : [];

  const supplyDemandBar = data ? [
    { name: t('Supply'), value: data.supply.total_mcm, fill: '#22c55e' },
    { name: t('Demand'), value: data.demand.total_mcm, fill: '#ef4444' },
  ] : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>
            <Scale size={26} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: '#3b82f6' }} />
            {t('Water Budget')}
          </h1>
          <p className="text-sm text-muted">{t('Water supply vs demand balance analysis')}</p>
        </div>
        <VillageSelect villages={villages} value={selectedVillage} onChange={setSelectedVillage} width={220} />
      </div>

      <div className="page-body">
        {loading ? (
          <div className="loading"><div className="spinner" />{t('Calculating water budget...')}</div>
        ) : data && (
          <>
            {/* ── Stat cards ── */}
            <div className="grid grid-4" style={{ marginBottom: 20 }}>
              <div className="stat-card">
                <div className="label">{t('Total Supply')}</div>
                <div className="value" style={{ color: '#16a34a' }}>{data.supply.total_mcm} MCM</div>
                <div className="sub">{t('Estimated annual')}</div>
              </div>
              <div className="stat-card">
                <div className="label">{t('Total Demand')}</div>
                <div className="value" style={{ color: '#dc2626' }}>{data.demand.total_mcm} MCM</div>
                <div className="sub">{t('Including all sectors')}</div>
              </div>
              <div className="stat-card">
                <div className="label">{t('Balance')}</div>
                <div className="value" style={{ color: STATUS_COLORS[data.balance.status] }}>
                  {data.balance.deficit_mcm > 0 ? '+' : ''}{data.balance.deficit_mcm} MCM
                </div>
                <div className="sub">{data.balance.status.replace('_', ' ')}</div>
              </div>
              <div className="stat-card">
                <div className="label">{t('Risk Level')}</div>
                <div className="value" style={{ fontSize: '1rem', color: STATUS_COLORS[data.balance.status] || 'var(--text-muted)' }}>
                  {data.balance.risk}
                </div>
                <div className="sub">{t('Water risk')}</div>
              </div>
            </div>

            {/* ── Charts ── */}
            <div className="grid grid-2" style={{ marginBottom: 20 }}>
              <div className="card">
                <div className="card-header"><div className="card-title">{t('Supply vs Demand')}</div></div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={supplyDemandBar} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-glass)" />
                    <XAxis type="number" tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
                    <Tooltip formatter={(v: any) => [`${v} MCM`, '']} />
                    <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                      {supplyDemandBar.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="card">
                <div className="card-header"><div className="card-title">{t('Demand Breakdown')}</div></div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={demandPie} cx="50%" cy="50%" outerRadius={80} dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={true} fontSize={10}>
                      {demandPie.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => [`${v} MCM`, '']} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* ── Potential savings ── */}
            {data.potential_savings?.length > 0 && (
              <div className="card" style={{ marginBottom: 16 }}>
                <div className="card-header">
                  <div className="card-title">
                    <Lightbulb size={18} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 8, color: '#eab308' }} />
                    {t('Potential Water Savings')}
                  </div>
                </div>
                {data.potential_savings.map((s: any, i: number) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-glass)', fontSize: '0.875rem' }}>
                    <span>{s.measure}</span>
                    <span style={{ color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                      <TrendingDown size={14} /> {s.saving_mcm} MCM/yr
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: 6 }}>
              {data.data_note} MCM = Million Cubic Metres.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
