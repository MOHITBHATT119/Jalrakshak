import React, { useEffect, useState } from 'react';
import { getVillages, getRechargeAdvice, Village } from '../services/api';
import VillageSelect from '../components/VillageSelect';
import {
  Hammer,
  AlertTriangle,
  Dam,
  Waves,
  ArrowDownCircle,
  Layers,
  Mountain,
  Pickaxe,
} from 'lucide-react';

interface Props {
  selectedVillage: string;
  setSelectedVillage: (v: string) => void;
  lang: string;
}

const priorityColor = (p: string) =>
  ({
    HIGH: '#dc2626',
    MEDIUM: '#d97706',
    LOW: '#16a34a',
  }[p] || 'var(--text-muted)');

/* -------------------------------------------------------------------------- */
/* Translation                                                                */
/* -------------------------------------------------------------------------- */

const T: Record<string, { gu: string }> = {
  // Header
  'Recharge Planner': {
    gu: 'રિચાર્જ પ્લાનર',
  },
  'Groundwater recharge structure recommendations': {
    gu: 'ભૂગર્ભ જળ રિચાર્જ સ્ટ્રક્ચર ભલામણો',
  },
  'Analyzing recharge opportunities...': {
    gu: 'રિચાર્જ તકોનું વિશ્લેષણ...',
  },

  // Notice / disclaimer
  'Preliminary AI recommendation. Field survey and engineering validation required.': {
    gu: 'પ્રારંભિક AI ભલામણ. સ્થળ સર્વે અને ઇજનેરી ચકાસણી જરૂરી છે.',
  },
  'Preliminary AI recommendation. Field survey and engineering validation is required.': {
    gu: 'પ્રારંભિક AI ભલામણ. સ્થળ સર્વે અને ઇજનેરી ચકાસણી જરૂરી છે.',
  },
  'Field survey and engineering validation required.': {
    gu: 'સ્થળ સર્વે અને ઇજનેરી ચકાસણી જરૂરી છે.',
  },

  // Stat cards
  'Aquifer Type': {
    gu: 'જળભર પ્રકાર',
  },
  'Determines structure suitability': {
    gu: 'સ્ટ્રક્ચરની યોગ્યતા નક્કી કરે છે',
  },
  'Potential Recharge': {
    gu: 'સંભવિત રિચાર્જ',
  },
  'Estimated annual gain': {
    gu: 'અંદાજિત વાર્ષિક વૃદ્ધિ',
  },
  'GW Severity': {
    gu: 'ભૂ.જ. ગંભીરતા',
  },
  'Trend:': {
    gu: 'વલણ:',
  },

  // Structure section
  'Recommended Recharge Structures': {
    gu: 'ભલામણ કરેલ રિચાર્જ સ્ટ્રક્ચર',
  },
  'Estimated new:': {
    gu: 'અંદાજિત નવા:',
  },
  'Existing:': {
    gu: 'હાલના:',
  },
  'PRIORITY': {
    gu: 'પ્રાધાન્ય',
  },
  'Cost category:': {
    gu: 'ખર્ચ શ્રેણી:',
  },
  'Aquifer:': {
    gu: 'જળભર:',
  },

  // Existing structures
  'Existing Structures': {
    gu: 'હાલની સ્ટ્રક્ચર',
  },
  'No recorded existing structures for this village.': {
    gu: 'આ ગામ માટે કોઈ નોંધાયેલ સ્ટ્રક્ચર નથી.',
  },

  // Common dynamic values
  HIGH: {
    gu: 'ઉચ્ચ',
  },
  MEDIUM: {
    gu: 'મધ્યમ',
  },
  LOW: {
    gu: 'નીચું',
  },
  CRITICAL: {
    gu: 'ગંભીર',
  },
  MODERATE: {
    gu: 'મધ્યમ',
  },
  STABLE: {
    gu: 'સ્થિર',
  },
  DECLINING: {
    gu: 'ઘટતું',
  },
  IMPROVING: {
    gu: 'સુધરતું',
  },

  // Aquifer types
  alluvial: {
    gu: 'કાંપવાળો જળભર',
  },
  hard_rock: {
    gu: 'કઠણ ખડક જળભર',
  },
  basalt: {
    gu: 'બેસાલ્ટ જળભર',
  },
  crystalline: {
    gu: 'સ્ફટિકીય ખડક જળભર',
  },
  fractured_rock: {
    gu: 'ફ્રેક્ચર્ડ રોક જળભર',
  },
  mixed: {
    gu: 'મિશ્ર જળભર',
  },

  // Structure names
  'Check Dam': {
    gu: 'ચેક ડેમ',
  },
  'Check Dams': {
    gu: 'ચેક ડેમ',
  },
  'Farm Pond': {
    gu: 'ખેત તળાવ',
  },
  'Farm Ponds': {
    gu: 'ખેત તળાવો',
  },
  'Recharge Well': {
    gu: 'રિચાર્જ કૂવો',
  },
  'Recharge Wells': {
    gu: 'રિચાર્જ કૂવા',
  },
  'Percolation Tank': {
    gu: 'પરકોલેશન ટાંકી',
  },
  'Percolation Tanks': {
    gu: 'પરકોલેશન ટાંકીઓ',
  },
  'Contour Bund': {
    gu: 'કન્ટૂર બંડ',
  },
  'Contour Bunds': {
    gu: 'કન્ટૂર બંડ',
  },
  'Contour Trench': {
    gu: 'કન્ટૂર ટ્રેન્ચ',
  },
  'Contour Bunds & Trenches': {
    gu: 'કન્ટૂર બંડ અને ટ્રેન્ચ',
  },
  'Recharge Pit': {
    gu: 'રિચાર્જ પિટ',
  },
  'Recharge Pits': {
    gu: 'રિચાર્જ પિટ્સ',
  },

  // Cost categories
  low: {
    gu: 'ઓછો',
  },
  medium: {
    gu: 'મધ્યમ',
  },
  high: {
    gu: 'ઉચ્ચ',
  },

  // Common aquifer suitability values
  all: {
    gu: 'બધા',
  },

  // Common rationale sentences
  'Farm ponds store monsoon runoff and recharge groundwater through seepage': {
    gu: 'ખેત તળાવો ચોમાસાના વહેણને સંગ્રહિત કરે છે અને ઝરવા દ્વારા ભૂગર્ભ જળનું રિચાર્જ કરે છે.',
  },
  'Percolation tanks slow runoff and allow groundwater recharge over large areas': {
    gu: 'પરકોલેશન ટાંકીઓ વહેણની ગતિ ઘટાડે છે અને મોટા વિસ્તારમાં ભૂગર્ભ જળ રિચાર્જ થવા દે છે.',
  },
  'Contour bunds reduce runoff velocity, increase infiltration across watershed': {
    gu: 'કન્ટૂર બંડ વહેણની ગતિ ઘટાડે છે અને જળવિભાગ વિસ્તારમાં પાણીનું જમીનમાં ઉતરાણ વધારે છે.',
  },
  'Check dams slow runoff and promote groundwater recharge': {
    gu: 'ચેક ડેમ વહેણની ગતિ ઘટાડે છે અને ભૂગર્ભ જળ રિચાર્જને પ્રોત્સાહન આપે છે.',
  },
  'Recharge wells directly facilitate groundwater recharge': {
    gu: 'રિચાર્જ કૂવા સીધા ભૂગર્ભ જળ રિચાર્જમાં મદદ કરે છે.',
  },
};

/* Exact translation helper */
function tr(key: string, lang: string): string {
  return lang === 'gu' && T[key]?.gu ? T[key].gu : key;
}

/*
 * Dynamic API values need their own translation layer.
 * This prevents English backend values such as:
 * alluvial, DECLINING, HIGH, Farm Ponds, low, all
 * from appearing when Gujarati is selected.
 */
function translateDynamic(value: unknown, lang: string): string {
  if (value === null || value === undefined) return '';

  const raw = String(value).trim();

  if (lang !== 'gu') return raw;

  if (T[raw]?.gu) return T[raw].gu;

  const normalized = raw.toLowerCase().replace(/[_-]+/g, ' ').trim();

  const dynamicMap: Record<string, string> = {
    high: 'ઉચ્ચ',
    medium: 'મધ્યમ',
    low: 'ઓછો',
    critical: 'ગંભીર',
    moderate: 'મધ્યમ',
    stable: 'સ્થિર',
    declining: 'ઘટતું',
    improving: 'સુધરતું',

    alluvial: 'કાંપવાળો જળભર',
    'hard rock': 'કઠણ ખડક જળભર',
    basalt: 'બેસાલ્ટ જળભર',
    crystalline: 'સ્ફટિકીય ખડક જળભર',
    'fractured rock': 'ફ્રેક્ચર્ડ રોક જળભર',
    mixed: 'મિશ્ર જળભર',

    all: 'બધા',

    'check dam': 'ચેક ડેમ',
    'check dams': 'ચેક ડેમ',
    'farm pond': 'ખેત તળાવ',
    'farm ponds': 'ખેત તળાવો',
    'recharge well': 'રિચાર્જ કૂવો',
    'recharge wells': 'રિચાર્જ કૂવા',
    'percolation tank': 'પરકોલેશન ટાંકી',
    'percolation tanks': 'પરકોલેશન ટાંકીઓ',
    'contour bund': 'કન્ટૂર બંડ',
    'contour bunds': 'કન્ટૂર બંડ',
    'contour trench': 'કન્ટૂર ટ્રેન્ચ',
    'contour bunds & trenches': 'કન્ટૂર બંડ અને ટ્રેન્ચ',
    'recharge pit': 'રિચાર્જ પિટ',
    'recharge pits': 'રિચાર્જ પિટ્સ',

    'cost category': 'ખર્ચ શ્રેણી',
  };

  return dynamicMap[normalized] ?? raw;
}

/*
 * Translate known English sentences returned by the API.
 * For unknown AI-generated text we preserve the original text rather than
 * pretending it has been translated.
 */
function translateRationale(value: unknown, lang: string): string {
  if (value === null || value === undefined) return '';

  const raw = String(value).trim();

  if (lang !== 'gu') return raw;
  if (T[raw]?.gu) return T[raw].gu;

  const lower = raw.toLowerCase();

  if (
    lower.includes('farm ponds') &&
    lower.includes('monsoon runoff') &&
    lower.includes('seepage')
  ) {
    return 'ખેત તળાવો ચોમાસાના વહેણને સંગ્રહિત કરે છે અને ઝરવા દ્વારા ભૂગર્ભ જળનું રિચાર્જ કરે છે.';
  }

  if (
    lower.includes('percolation tanks') &&
    lower.includes('slow runoff') &&
    lower.includes('large areas')
  ) {
    return 'પરકોલેશન ટાંકીઓ વહેણની ગતિ ઘટાડે છે અને મોટા વિસ્તારમાં ભૂગર્ભ જળ રિચાર્જ થવા દે છે.';
  }

  if (
    lower.includes('contour bunds') &&
    lower.includes('runoff velocity') &&
    lower.includes('infiltration')
  ) {
    return 'કન્ટૂર બંડ વહેણની ગતિ ઘટાડે છે અને જળવિભાગ વિસ્તારમાં પાણીનું જમીનમાં ઉતરાણ વધારે છે.';
  }

  if (
    lower.includes('check dams') &&
    lower.includes('runoff') &&
    lower.includes('groundwater recharge')
  ) {
    return 'ચેક ડેમ વહેણની ગતિ ઘટાડે છે અને ભૂગર્ભ જળ રિચાર્જને પ્રોત્સાહન આપે છે.';
  }

  return raw;
}

function translateDisclaimer(value: unknown, lang: string): string {
  if (value === null || value === undefined) return '';

  const raw = String(value).trim();

  if (lang !== 'gu') return raw;
  if (T[raw]?.gu) return T[raw].gu;

  const lower = raw.toLowerCase();

  if (
    lower.includes('preliminary ai recommendation') &&
    lower.includes('field survey') &&
    lower.includes('engineering validation')
  ) {
    return 'પ્રારંભિક AI ભલામણ. સ્થળ સર્વે અને ઇજનેરી ચકાસણી જરૂરી છે.';
  }

  if (lower.includes('field survey') && lower.includes('engineering validation')) {
    return 'સ્થળ સર્વે અને ઇજનેરી ચકાસણી જરૂરી છે.';
  }

  return raw;
}

function renderStructureIcon(category: string, size = 20) {
  switch (category) {
    case 'check_dam':
      return <Dam size={size} color="#3b82f6" />;
    case 'farm_pond':
      return <Waves size={size} color="#06b6d4" />;
    case 'recharge_well':
      return <ArrowDownCircle size={size} color="#3b82f6" />;
    case 'percolation_tank':
      return <Layers size={size} color="#0284c7" />;
    case 'contour_bund':
    case 'contour_bunds':
    case 'contour_bund_trench':
      return <Mountain size={size} color="#10b981" />;
    case 'recharge_pit':
      return <Pickaxe size={size} color="#f59e0b" />;
    default:
      return <Hammer size={size} color="#3b82f6" />;
  }
}

export default function RechargePlanner({
  selectedVillage,
  setSelectedVillage,
  lang,
}: Props) {
  const [villages, setVillages] = useState<Village[]>([]);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const t = (key: string) => tr(key, lang);
  const td = (value: unknown) => translateDynamic(value, lang);

  useEffect(() => {
    getVillages().then((r) => setVillages(r.villages));
  }, []);

  useEffect(() => {
    if (!selectedVillage) return;

    setLoading(true);

    getRechargeAdvice(selectedVillage)
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [selectedVillage]);

  return (
    <div>
      {/* ------------------------------------------------------------------ */}
      {/* PAGE HEADER                                                        */}
      {/* ------------------------------------------------------------------ */}

      <div className="page-header">
        <div>
          <h1>
            <Hammer
              size={26}
              style={{
                display: 'inline',
                verticalAlign: 'middle',
                marginRight: 8,
                color: '#3b82f6',
              }}
            />
            {t('Recharge Planner')}
          </h1>

          <p className="text-sm text-muted">
            {t('Groundwater recharge structure recommendations')}
          </p>
        </div>

        <VillageSelect
          villages={villages}
          value={selectedVillage}
          onChange={setSelectedVillage}
          width={220}
        />
      </div>

      <div className="page-body">
        {/* ---------------------------------------------------------------- */}
        {/* LOADING                                                          */}
        {/* ---------------------------------------------------------------- */}

        {loading && (
          <div className="loading">
            <div className="spinner" />
            {t('Analyzing recharge opportunities...')}
          </div>
        )}

        {/* ---------------------------------------------------------------- */}
        {/* CONTENT                                                          */}
        {/* ---------------------------------------------------------------- */}

        {data && !loading && (
          <>
            {/* AI DISCLAIMER */}
            <div className="alert alert-warning" style={{ marginBottom: 16 }}>
              <AlertTriangle
                size={16}
                style={{
                  display: 'inline',
                  verticalAlign: 'middle',
                  marginRight: 6,
                  color: '#f59e0b',
                }}
              />
              {translateDisclaimer(data.disclaimer, lang)}
            </div>

            {/* ------------------------------------------------------------ */}
            {/* STAT CARDS                                                    */}
            {/* ------------------------------------------------------------ */}

            <div className="grid grid-3" style={{ marginBottom: 20 }}>
              {/* Aquifer */}
              <div className="stat-card">
                <div className="label">{t('Aquifer Type')}</div>

                <div
                  className="value"
                  style={{
                    fontSize: '1.1rem',
                    textTransform: 'capitalize',
                  }}
                >
                  {td(data.aquifer_type?.replace(/_/g, ' '))}
                </div>

                <div className="sub">
                  {t('Determines structure suitability')}
                </div>
              </div>

              {/* Potential recharge */}
              <div className="stat-card">
                <div className="label">{t('Potential Recharge')}</div>

                <div
                  className="value"
                  style={{ color: '#16a34a' }}
                >
                  {data.total_potential_recharge_mcm} MCM
                </div>

                <div className="sub">
                  {t('Estimated annual gain')}
                </div>
              </div>

              {/* GW severity */}
              <div className="stat-card">
                <div className="label">{t('GW Severity')}</div>

                <div
                  className="value"
                  style={{
                    fontSize: '1rem',
                    color: priorityColor(
                      data.groundwater_severity === 'CRITICAL'
                        ? 'HIGH'
                        : data.groundwater_severity === 'HIGH'
                          ? 'HIGH'
                          : 'MEDIUM'
                    ),
                  }}
                >
                  {td(data.groundwater_severity)}
                </div>

                <div className="sub">
                  {t('Trend:')} {td(data.groundwater_trend)}
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* RECOMMENDED STRUCTURES                                        */}
            {/* ------------------------------------------------------------ */}

            <div className="card" style={{ marginBottom: 16 }}>
              <div className="card-header">
                <div className="card-title">
                  {t('Recommended Recharge Structures')}
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {data.recommendations?.map((r: any) => {
                  const priority = String(r.priority || '').toUpperCase();

                  return (
                    <div
                      key={r.category}
                      style={{
                        border: `1px solid ${priorityColor(priority)}40`,
                        borderLeft: `4px solid ${priorityColor(priority)}`,
                        borderRadius: 8,
                        padding: '16px',
                        background:
                          priority === 'HIGH'
                            ? 'rgba(239,68,68,0.2)'
                            : priority === 'MEDIUM'
                              ? 'rgba(245,158,11,0.2)'
                              : 'rgba(16,185,129,0.2)',
                      }}
                    >
                      {/* Structure header */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: 8,
                          gap: 12,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            minWidth: 0,
                          }}
                        >
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            {renderStructureIcon(r.category, 24)}
                          </span>

                          <div>
                            <div style={{ fontWeight: 600 }}>
                              {td(r.display_name)}
                            </div>

                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: 'var(--text-muted)',
                              }}
                            >
                              {t('Estimated new:')} {r.estimated_count} ·{' '}
                              {t('Existing:')} {r.existing_count}
                            </div>
                          </div>
                        </div>

                        {/* Priority + recharge */}
                        <div
                          style={{
                            textAlign: 'right',
                            flexShrink: 0,
                          }}
                        >
                          <span
                            style={{
                              color: priorityColor(priority),
                              fontWeight: 700,
                              fontSize: '0.8rem',
                            }}
                          >
                            {td(priority)} {t('PRIORITY')}
                          </span>

                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: '#16a34a',
                              marginTop: 2,
                            }}
                          >
                            +{r.potential_recharge_mcm} MCM/yr
                          </div>
                        </div>
                      </div>

                      {/* Rationale */}
                      <div
                        style={{
                          fontSize: '0.85rem',
                          color: 'var(--text-main)',
                          lineHeight: 1.55,
                        }}
                      >
                        {translateRationale(r.rationale, lang)}
                      </div>

                      {/* Cost + aquifer */}
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          marginTop: 6,
                        }}
                      >
                        {t('Cost category:')}{' '}
                        {td(r.cost_category)} · {t('Aquifer:')}{' '}
                        {td(r.suitable_for_aquifer)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ------------------------------------------------------------ */}
            {/* EXISTING STRUCTURES                                           */}
            {/* ------------------------------------------------------------ */}

            <div className="card">
              <div className="card-header">
                <div className="card-title">
                  {t('Existing Structures')}
                </div>
              </div>

              {data.existing_structures &&
              Object.keys(data.existing_structures).length > 0 ? (
                <div className="grid grid-3">
                  {Object.entries(data.existing_structures).map(
                    ([k, v]) => (
                      <div
                        key={k}
                        style={{
                          padding: '8px 12px',
                          background: 'rgba(16,185,129,0.2)',
                          borderRadius: 6,
                          display: 'flex',
                          alignItems: 'center',
                          minWidth: 0,
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            flexShrink: 0,
                          }}
                        >
                          {renderStructureIcon(k, 16)}
                        </span>

                        <span
                          style={{
                            marginLeft: 6,
                            fontSize: '0.85rem',
                            fontWeight: 500,
                            textTransform: 'capitalize',
                          }}
                        >
                          {td(k.replace(/_/g, ' '))}:
                        </span>

                        <strong style={{ marginLeft: 4 }}>
                          {v as number}
                        </strong>
                      </div>
                    )
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted">
                  {t('No recorded existing structures for this village.')}
                </p>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
