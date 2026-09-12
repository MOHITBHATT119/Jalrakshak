import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';
import {
  getVillages,
  getDroughtRisk,
  Village
} from '../services/api';
import VillageSelect from '../components/VillageSelect';
import { useFarmerAuth } from '../context/FarmerAuthContext';
import {
  Thermometer,
  AlertTriangle,
  Search,
  ChevronRight,
  Zap,
  Sprout,
  MapPin,
  RotateCcw,
  LayoutDashboard,
  MessageSquare,
  Layers,
  ArrowRight
} from 'lucide-react';

interface Props {
  selectedVillage: string;
  setSelectedVillage: (v: string) => void;
  lang: string;
}

/* ─────────────────────────────────────────────
   Risk colors
───────────────────────────────────────────── */

const riskColor = (l: string) =>
  ({
    LOW: '#16a34a',
    MODERATE: '#d97706',
    HIGH: '#ea580c',
    SEVERE: '#dc2626'
  }[l] || 'var(--text-muted)');

/* ─────────────────────────────────────────────
   Static translations
───────────────────────────────────────────── */

const T: Record<string, { gu: string }> = {
  // Header
  'Drought Intelligence': {
    gu: 'દુષ્કાળ બુદ્ધિ'
  },

  'Early warning system — risk assessment across multiple factors': {
    gu: 'પ્રારંભિક ચેતવણી — બહુવિધ પરિબળોમાં જોખમ મૂલ્યાંકન'
  },

  'Analyzing drought risk...': {
    gu: 'દુષ્કાળ જોખમનું વિશ્લેષણ થઈ રહ્યું છે...'
  },

  // Alerts
  'SEVERE DROUGHT RISK': {
    gu: 'ગંભીર દુષ્કાળ જોખમ'
  },

  'Immediate action required to prevent water crisis.': {
    gu: 'જળ સંકટ અટકાવવા તાત્કાલિક પગલાં જરૂરી છે.'
  },

  'HIGH DROUGHT RISK': {
    gu: 'ઉચ્ચ દુષ્કાળ જોખમ'
  },

  'Escalate water conservation efforts now.': {
    gu: 'હાલ જળ સંચયના પ્રયાસો વધારવા જરૂરી છે.'
  },

  // Risk gauge
  'Drought Risk Score': {
    gu: 'દુષ્કાળ જોખમ સ્કોર'
  },

  'out of 100': {
    gu: '૧૦૦ માંથી'
  },

  'DROUGHT RISK': {
    gu: 'દુષ્કાળ જોખમ'
  },

  'Confidence:': {
    gu: 'વિશ્વાસ:'
  },

  // Radar chart
  'Risk Factor Breakdown': {
    gu: 'જોખમ પરિબળ વિભાજન'
  },

  'Rainfall': {
    gu: 'વરસાદ'
  },

  'Groundwater': {
    gu: 'ભૂગર્ભ જળ'
  },

  'Demand': {
    gu: 'માંગ'
  },

  'Risk contribution': {
    gu: 'જોખમ ફાળો'
  },

  // Evidence & Actions
  'Risk Evidence': {
    gu: 'જોખમના પુરાવા'
  },

  'Recommended Actions': {
    gu: 'ભલામણ કરેલ ક્રિયાઓ'
  },

  // Risk scale
  'Drought Risk Scale Reference': {
    gu: 'દુષ્કાળ જોખમ સ્કેલ સંદર્ભ'
  },

  'Score:': {
    gu: 'સ્કોર:'
  },

  'Normal water availability, preventive monitoring': {
    gu: 'સામાન્ય જળ ઉપલબ્ધતા, નિવારક નિરીક્ષણ'
  },

  'Below-average conditions, conservation needed': {
    gu: 'સરેરાશ કરતાં ઓછી સ્થિતિ, જળ સંરક્ષણ જરૂરી'
  },

  'Significant stress, active intervention required': {
    gu: 'નોંધપાત્ર તણાવ, સક્રિય હસ્તક્ષેપ જરૂરી'
  },

  'Emergency conditions, crisis response activated': {
    gu: 'કટોકટી સ્થિતિ, કટોકટી પ્રતિસાદ સક્રિય'
  },

  // Risk levels
  LOW: {
    gu: 'નીચું'
  },

  MODERATE: {
    gu: 'મધ્યમ'
  },

  HIGH: {
    gu: 'ઉચ્ચ'
  },

  SEVERE: {
    gu: 'ગંભીર'
  },

  // Confidence
  'VERY HIGH': {
    gu: 'ખૂબ ઉચ્ચ'
  },

  MEDIUM: {
    gu: 'મધ્યમ'
  },

  // Data note
  'Synthetic demonstration data. Not official government measurements.': {
    gu: 'સિન્થેટિક ડેમો ડેટા. સત્તાવાર સરકારી માપન નથી.'
  },

  // Dashboard actions
  'Monitor groundwater levels weekly': {
    gu: 'સાપ્તાહિક ભૂગર્ભ જળ સ્તરનું નિરીક્ષણ કરો'
  },

  'Promote water-efficient irrigation methods': {
    gu: 'પાણી-કાર્યક્ષમ સિંચાઈ પદ્ધતિઓને પ્રોત્સાહિત કરો'
  },

  'Plan new recharge structures before next monsoon': {
    gu: 'આગામી ચોમાસા પહેલાં નવી રિચાર્જ સ્ટ્રક્ચરનું આયોજન કરો'
  },

  'Encourage drought-tolerant crop adoption': {
    gu: 'દુષ્કાળ-સહિષ્ણુ પાક અપનાવવા પ્રોત્સાહિત કરો'
  },

  'Review water allocation among user groups': {
    gu: 'વપરાશ જૂથો વચ્ચે જળ ફાળવણીની સમીક્ષા કરો'
  },

  'Alert Gram Panchayat and water committee for action': {
    gu: 'ગ્રામ પંચાયત અને જળ સમિતિને પગલાં માટે સૂચિત કરો'
  },

  'Reduce agricultural groundwater extraction by 30%': {
    gu: 'કૃષિ માટેના ભૂગર્ભ જળ ઉપાડમાં ૩૦% ઘટાડો કરો'
  },

  'Begin crop substitution planning for next season': {
    gu: 'આવતી સીઝન માટે પાક બદલવાનું આયોજન શરૂ કરો'
  },

  'Survey and repair existing recharge structures': {
    gu: 'હાલની રિચાર્જ સ્ટ્રક્ચરનું સર્વેક્ષણ અને સમારકામ કરો'
  },

  'Implement micro-irrigation for water-intensive crops': {
    gu: 'વધુ પાણી વાપરતા પાકો માટે સૂક્ષ્મ સિંચાઈ લાગુ કરો'
  },

  'Declare drought preparedness - activate emergency water protocols': {
    gu: 'દુષ્કાળ સજ્જતા જાહેર કરો — કટોકટી જળ પ્રોટોકોલ સક્રિય કરો'
  },

  'Immediately restrict non-essential groundwater extraction': {
    gu: 'તાત્કાલિક બિન-જરૂરી ભૂગર્ભ જળ ઉપાડ પર પ્રતિબંધ મૂકો'
  },

  'Prioritise drinking water supply for all communities': {
    gu: 'તમામ સમુદાયો માટે પીવાના પાણીના પુરવઠાને પ્રાધાન્ય આપો'
  },

  'Activate recharge structure maintenance and new construction': {
    gu: 'રિચાર્જ સ્ટ્રક્ચરની જાળવણી અને નવા બાંધકામને સક્રિય કરો'
  },

  'Switch remaining crops to drought-tolerant varieties': {
    gu: 'બાકીના પાકોને દુષ્કાળ-સહિષ્ણુ જાતોમાં બદલો'
  },

  'Coordinate with district water board for emergency support': {
    gu: 'કટોકટી સહાય માટે જિલ્લા જળ બોર્ડ સાથે સંકલન કરો'
  },

  'Continue regular monitoring of groundwater levels': {
    gu: 'ભૂગર્ભ જળ સ્તરનું નિયમિત નિરીક્ષણ ચાલુ રાખો'
  },

  'Maintain existing recharge structures': {
    gu: 'હાલની રિચાર્જ સ્ટ્રક્ચર જાળવો'
  },

  'Plan for upcoming season water requirements': {
    gu: 'આવતી સીઝન માટે પાણીની જરૂરિયાતનું આયોજન કરો'
  },

  // District & Farmer Filter translations
  'District:': {
    gu: 'જિલ્લો:'
  },
  'All Districts (10 Districts)': {
    gu: 'તમામ ૧૦ જિલ્લા (All Saurashtra)'
  },
  'Farmer Location Filter': {
    gu: 'ખેડૂત સ્થાન ફિલ્ટર'
  },
  'Registered Farmland:': {
    gu: 'નોંધાયેલ ખેતીલાયક જમીન:'
  },
  'Reset to My Village': {
    gu: 'મારા ગામ પર પાછા જાઓ'
  },
  'Open Crop Advisor': {
    gu: 'પાક સલાહકાર ખોલો'
  },
  'Navigate to Dashboard': {
    gu: 'ડેશબોર્ડ પર જાઓ'
  },
  'Ask Copilot About Drought': {
    gu: 'દુષ્કાળ વિશે Copilot ને પૂછો'
  },
  'Explore recommended drought-resilient crops and water saving': {
    gu: 'દુષ્કાળ-સહિષ્ણુ પાકો અને પાણી બચતની ભલામણો જુઓ'
  },
  'Return to your personalized farmer overview': {
    gu: 'તમારા વ્યક્તિગત ખેડૂત અવલોકન પર પાછા જાઓ'
  },
  'Get AI-powered guidance on drought mitigation': {
    gu: 'દુષ્કાળ નિવારણ માટે AI માર્ગદર્શન મેળવો'
  },
  'Amreli': { gu: 'અમરેલી' },
  'Bhavnagar': { gu: 'ભાવનગર' },
  'Devbhumi Dwarka': { gu: 'દેવભૂમિ દ્વારકા' },
  'Gir Somnath': { gu: 'ગીર સોમનાથ' },
  'Jamnagar': { gu: 'જામનગર' },
  'Junagadh': { gu: 'જૂનાગઢ' },
  'Morbi': { gu: 'મોરબી' },
  'Porbandar': { gu: 'પોરબંદર' },
  'Rajkot': { gu: 'રાજકોટ' },
  'Surendranagar': { gu: 'સુરેન્દ્રનગર' }
};

/* ─────────────────────────────────────────────
   Static translation helper
───────────────────────────────────────────── */

function tr(key: string, lang: string): string {
  return lang === 'gu' && T[key]?.gu
    ? T[key].gu
    : key;
}

/* ─────────────────────────────────────────────
   Dynamic value translation
───────────────────────────────────────────── */

function translateValue(
  value: string | undefined,
  lang: string
): string {
  if (!value) return '—';

  if (lang !== 'gu') {
    return value;
  }

  return T[value]?.gu || value;
}

/* ─────────────────────────────────────────────
   Dynamic evidence translation

   Handles API-generated text such as:

   High rainfall deficit: -39% below average
   Moderate groundwater stress: 0.5m/year decline
   Significant water deficit: 79 MCM

   Numbers remain dynamic.
───────────────────────────────────────────── */

function translateEvidence(
  text: string,
  lang: string
): string {
  if (!text || lang !== 'gu') {
    return text;
  }

  /* High rainfall deficit */
  const rainfall = text.match(
    /High rainfall deficit:\s*([+-]?\d+(?:\.\d+)?)%\s*below average/i
  );

  if (rainfall) {
    const percentage = rainfall[1];

    return `વરસાદમાં મોટો ઘટાડો: સરેરાશ કરતાં ${percentage}% ઓછો`;
  }

  /* Moderate rainfall deficit */
  const moderateRainfall = text.match(
    /Moderate rainfall deficit:\s*([+-]?\d+(?:\.\d+)?)%\s*below average/i
  );

  if (moderateRainfall) {
    const percentage = moderateRainfall[1];

    return `મધ્યમ વરસાદમાં ઘટાડો: સરેરાશ કરતાં ${percentage}% ઓછો`;
  }

  /* Significant rainfall deficit */
  const significantRainfall = text.match(
    /Significant rainfall deficit:\s*([+-]?\d+(?:\.\d+)?)%\s*below average/i
  );

  if (significantRainfall) {
    const percentage = significantRainfall[1];

    return `નોંધપાત્ર વરસાદમાં ઘટાડો: સરેરાશ કરતાં ${percentage}% ઓછો`;
  }

  /* Moderate groundwater stress */
  const groundwater = text.match(
    /Moderate groundwater stress:\s*([+-]?\d+(?:\.\d+)?)m\/year decline/i
  );

  if (groundwater) {
    const decline = groundwater[1];

    return `મધ્યમ ભૂગર્ભ જળ તણાવ: દર વર્ષે ${decline} મીટરનો ઘટાડો`;
  }

  /* High groundwater stress */
  const highGroundwater = text.match(
    /High groundwater stress:\s*([+-]?\d+(?:\.\d+)?)m\/year decline/i
  );

  if (highGroundwater) {
    const decline = highGroundwater[1];

    return `ઉચ્ચ ભૂગર્ભ જળ તણાવ: દર વર્ષે ${decline} મીટરનો ઘટાડો`;
  }

  /* Severe groundwater stress */
  const severeGroundwater = text.match(
    /Severe groundwater stress:\s*([+-]?\d+(?:\.\d+)?)m\/year decline/i
  );

  if (severeGroundwater) {
    const decline = severeGroundwater[1];

    return `ગંભીર ભૂગર્ભ જળ તણાવ: દર વર્ષે ${decline} મીટરનો ઘટાડો`;
  }

  /* Significant water deficit */
  const waterDeficit = text.match(
    /Significant water deficit:\s*([\d.]+)\s*MCM/i
  );

  if (waterDeficit) {
    const amount = waterDeficit[1];

    return `નોંધપાત્ર જળ ખાધ: ${amount} MCM`;
  }

  /* Moderate water deficit */
  const moderateWaterDeficit = text.match(
    /Moderate water deficit:\s*([\d.]+)\s*MCM/i
  );

  if (moderateWaterDeficit) {
    const amount = moderateWaterDeficit[1];

    return `મધ્યમ જળ ખાધ: ${amount} MCM`;
  }

  /* Severe water deficit */
  const severeWaterDeficit = text.match(
    /Severe water deficit:\s*([\d.]+)\s*MCM/i
  );

  if (severeWaterDeficit) {
    const amount = severeWaterDeficit[1];

    return `ગંભીર જળ ખાધ: ${amount} MCM`;
  }

  /* Generic known static translation */
  if (T[text]?.gu) {
    return T[text].gu;
  }

  return text;
}

/* ─────────────────────────────────────────────
   Risk scale
───────────────────────────────────────────── */

const RISK_SCALE = [
  {
    level: 'LOW',
    range: '0–34',
    color: '#16a34a',
    desc: 'Normal water availability, preventive monitoring'
  },
  {
    level: 'MODERATE',
    range: '35–54',
    color: '#d97706',
    desc: 'Below-average conditions, conservation needed'
  },
  {
    level: 'HIGH',
    range: '55–74',
    color: '#ea580c',
    desc: 'Significant stress, active intervention required'
  },
  {
    level: 'SEVERE',
    range: '75–100',
    color: '#dc2626',
    desc: 'Emergency conditions, crisis response activated'
  }
];

/* ─────────────────────────────────────────────
   Component
───────────────────────────────────────────── */

export default function DroughtIntelligence({
  selectedVillage,
  setSelectedVillage,
  lang
}: Props) {
  const { farmerUser, isAuthenticated } = useFarmerAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [villages, setVillages] = useState<Village[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('ALL');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const hasAutoMatchedFarmer = useRef(false);

  const t = (key: string) => tr(key, lang);

  /* Load villages */
  useEffect(() => {
    getVillages()
      .then(r => setVillages(Array.isArray(r?.villages) ? r.villages : []))
      .catch(() => setVillages([]));
  }, []);

  /* Extract unique districts */
  const districts = useMemo(() => {
    const dSet = new Set<string>();
    villages.forEach(v => {
      if (v.district) dSet.add(v.district);
    });
    return Array.from(dSet).sort();
  }, [villages]);

  /* Auto-select farmer district and village when villages or farmer profile loads */
  useEffect(() => {
    if (villages.length === 0) return;

    // Check location state first if navigated from dashboard
    const stateLoc = location.state as { district?: string; village?: string; fromFarmerDashboard?: boolean } | null;
    const targetDistrict = stateLoc?.district || (isAuthenticated && farmerUser ? farmerUser.district : null);
    const targetVillage = stateLoc?.village || (isAuthenticated && farmerUser ? farmerUser.village : null);

    if (targetDistrict && (!hasAutoMatchedFarmer.current || stateLoc?.fromFarmerDashboard)) {
      hasAutoMatchedFarmer.current = true;

      // Match village in villages list
      let matched = villages.find(
        v => v.district.toLowerCase() === targetDistrict.toLowerCase() &&
             v.name.toLowerCase() === (targetVillage || '').toLowerCase()
      );

      if (!matched && targetVillage) {
        matched = villages.find(
          v => v.district.toLowerCase() === targetDistrict.toLowerCase() &&
               (v.name.toLowerCase().includes(targetVillage.toLowerCase()) ||
                targetVillage.toLowerCase().includes(v.name.toLowerCase()))
        );
      }

      if (!matched && targetVillage) {
        matched = villages.find(v => v.village_id.toLowerCase() === targetVillage.toLowerCase());
      }

      if (!matched) {
        matched = villages.find(v => v.district.toLowerCase() === targetDistrict.toLowerCase());
      }

      if (matched) {
        setSelectedDistrict(matched.district);
        setSelectedVillage(matched.village_id);
      } else {
        setSelectedDistrict(targetDistrict);
      }
    }
  }, [villages, farmerUser, isAuthenticated, location.state, setSelectedVillage]);

  /* Filter villages by selected district */
  const filteredVillages = useMemo(() => {
    if (selectedDistrict === 'ALL') return villages;
    return villages.filter(v => v.district.toLowerCase() === selectedDistrict.toLowerCase());
  }, [villages, selectedDistrict]);

  /* Handle district change */
  const handleDistrictChange = (newDistrict: string) => {
    setSelectedDistrict(newDistrict);
    if (newDistrict === 'ALL') return;

    // Check if current selected village belongs to this district
    const currentBelongs = villages.find(
      v => v.village_id === selectedVillage && v.district.toLowerCase() === newDistrict.toLowerCase()
    );

    if (!currentBelongs) {
      // If farmer belongs to this district, select farmer's village
      if (isAuthenticated && farmerUser && farmerUser.district.toLowerCase() === newDistrict.toLowerCase()) {
        const farmerMatch = villages.find(
          v => v.district.toLowerCase() === newDistrict.toLowerCase() &&
               v.name.toLowerCase() === (farmerUser.village || '').toLowerCase()
        );
        if (farmerMatch) {
          setSelectedVillage(farmerMatch.village_id);
          return;
        }
      }
      // Otherwise pick the first village in that district
      const firstInDistrict = villages.find(
        v => v.district.toLowerCase() === newDistrict.toLowerCase()
      );
      if (firstInDistrict) {
        setSelectedVillage(firstInDistrict.village_id);
      }
    }
  };

  /* Helper to reset back to farmer's registered location */
  const handleResetToFarmerLocation = () => {
    if (!farmerUser) return;
    const matched = villages.find(
      v => v.district.toLowerCase() === farmerUser.district.toLowerCase() &&
           v.name.toLowerCase() === farmerUser.village.toLowerCase()
    ) || villages.find(
      v => v.district.toLowerCase() === farmerUser.district.toLowerCase()
    );

    if (matched) {
      setSelectedDistrict(matched.district);
      setSelectedVillage(matched.village_id);
    }
  };

  const selectedVillageObj = villages.find(v => v.village_id === selectedVillage);
  const isFarmerLocationActive = Boolean(
    isAuthenticated &&
    farmerUser &&
    selectedVillageObj &&
    selectedVillageObj.district.toLowerCase() === (farmerUser.district || '').toLowerCase() &&
    (selectedVillageObj.name.toLowerCase() === (farmerUser.village || '').toLowerCase() ||
     (farmerUser.village || '').toLowerCase().includes(selectedVillageObj.name.toLowerCase()))
  );

  /* Load drought data */
  useEffect(() => {
    if (!selectedVillage) return;

    setLoading(true);

    getDroughtRisk(selectedVillage)
      .then(d => {
        setData(d);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [selectedVillage]);

  /* Radar data */
  const radarData = data
    ? [
        {
          subject: t('Rainfall'),
          value: data.components.rainfall_score,
          max: 40
        },
        {
          subject: t('Groundwater'),
          value: data.components.groundwater_score,
          max: 40
        },
        {
          subject: t('Demand'),
          value: data.components.demand_score,
          max: 20
        }
      ].map(d => ({
        ...d,
        pct: (d.value / d.max) * 100
      }))
    : [];

  return (
    <div>
      {/* ───────────────── Header ───────────────── */}
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1>
            <Thermometer
              size={26}
              style={{
                display: 'inline',
                verticalAlign: 'middle',
                marginRight: 8,
                color: '#f59e0b'
              }}
            />

            {t('Drought Intelligence')}
          </h1>

          <p className="text-sm text-muted">
            {t(
              'Early warning system — risk assessment across multiple factors'
            )}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* District Filter Selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              background: 'var(--vs-bg, var(--bg-dark))',
              border: '1px solid var(--vs-border, rgba(59,130,246,0.25))',
              borderRadius: 8,
              boxSizing: 'border-box',
            }}
          >
            <Layers size={16} color="#38bdf8" style={{ flexShrink: 0 }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              {t('District:')}
            </span>
            <select
              value={selectedDistrict}
              onChange={e => handleDistrictChange(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--text-main)',
                fontSize: '0.86rem',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none',
                fontFamily: 'inherit',
                maxWidth: 170,
              }}
              aria-label="Filter by District"
            >
              <option value="ALL" style={{ background: '#0f172a', color: '#fff' }}>
                {t('All Districts (10 Districts)')}
              </option>
              {districts.map(d => (
                <option key={d} value={d} style={{ background: '#0f172a', color: '#fff' }}>
                  {d} {lang === 'gu' && T[d]?.gu ? `(${T[d].gu})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Village Selector (filtered by selectedDistrict) */}
          <VillageSelect
            villages={filteredVillages}
            value={selectedVillage}
            onChange={setSelectedVillage}
            width={210}
          />
        </div>
      </div>

      <div className="page-body">
        {/* ─────────────── Farmer Login Filter Active Banner ─────────────── */}
        {isAuthenticated && farmerUser && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              padding: '12px 18px',
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(14, 165, 233, 0.08))',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              borderRadius: 12,
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'rgba(16, 185, 129, 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  flexShrink: 0,
                }}
              >
                <Sprout size={18} color="#34d399" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f0fdf4' }}>
                    {t('Farmer Location Filter')}: {farmerUser.name}
                  </span>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      fontWeight: 600,
                      padding: '2px 8px',
                      borderRadius: 10,
                      background: isFarmerLocationActive
                        ? 'rgba(16, 185, 129, 0.25)'
                        : 'rgba(245, 158, 11, 0.2)',
                      border: isFarmerLocationActive
                        ? '1px solid rgba(16, 185, 129, 0.5)'
                        : '1px solid rgba(245, 158, 11, 0.5)',
                      color: isFarmerLocationActive ? '#34d399' : '#fbbf24',
                    }}
                  >
                    {isFarmerLocationActive
                      ? (lang === 'gu' ? '✓ સક્રિય ફાર્મ સ્થાન' : '✓ Active Farm Location')
                      : (lang === 'gu' ? 'અન્ય સ્થાન બ્રાઉઝ કરી રહ્યા છો' : 'Browsing Different Village')}
                  </span>
                </div>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: 2 }}>
                  <span style={{ color: '#cbd5e1' }}>{t('Registered Farmland:')}</span>{' '}
                  <strong style={{ color: '#38bdf8' }}>{farmerUser.village}</strong>,{' '}
                  <strong style={{ color: '#a78bfa' }}>{farmerUser.district}</strong>{' '}
                  ({farmerUser.land_area_ha || 4.5} ha · {farmerUser.primary_crops || 'Cotton, Groundnut'})
                </div>
              </div>
            </div>

            {!isFarmerLocationActive && (
              <button
                onClick={handleResetToFarmerLocation}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '7px 14px',
                  borderRadius: 8,
                  background: 'rgba(16, 185, 129, 0.22)',
                  border: '1px solid rgba(16, 185, 129, 0.5)',
                  color: '#34d399',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  transition: 'all 0.2s',
                }}
              >
                <RotateCcw size={14} />
                {t('Reset to My Village')} ({farmerUser.village})
              </button>
            )}
          </div>
        )}
        {/* ───────────────── Loading ───────────────── */}
        {loading ? (
          <div className="loading">
            <div className="spinner" />
            {t('Analyzing drought risk...')}
          </div>
        ) : (
          data && (
            <>
              {/* ───────────────── Alerts ───────────────── */}

              {data.risk_level === 'SEVERE' && (
                <div
                  className="alert alert-emergency"
                  style={{ marginBottom: 16 }}
                >
                  <AlertTriangle
                    size={18}
                    style={{
                      display: 'inline',
                      verticalAlign: 'middle',
                      marginRight: 6,
                      color: '#ef4444'
                    }}
                  />

                  <strong>
                    {t('SEVERE DROUGHT RISK')}
                  </strong>

                  {' — '}

                  {data.village_name}.{' '}

                  {t(
                    'Immediate action required to prevent water crisis.'
                  )}
                </div>
              )}

              {data.risk_level === 'HIGH' && (
                <div
                  className="alert alert-warning"
                  style={{ marginBottom: 16 }}
                >
                  <AlertTriangle
                    size={18}
                    style={{
                      display: 'inline',
                      verticalAlign: 'middle',
                      marginRight: 6,
                      color: '#f59e0b'
                    }}
                  />

                  <strong>
                    {t('HIGH DROUGHT RISK')}
                  </strong>

                  {' — '}

                  {data.village_name}.{' '}

                  {t(
                    'Escalate water conservation efforts now.'
                  )}
                </div>
              )}

              {/* ───────────────── Risk + Radar ───────────────── */}

              <div
                className="grid grid-2"
                style={{ marginBottom: 20 }}
              >
                {/* Risk gauge */}
                <div
                  className="card"
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 32
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      marginBottom: 8,
                      textTransform: 'uppercase',
                      letterSpacing: '0.08em'
                    }}
                  >
                    {t('Drought Risk Score')}
                  </div>

                  <div
                    style={{
                      fontSize: '4rem',
                      fontWeight: 800,
                      color: riskColor(data.risk_level),
                      lineHeight: 1
                    }}
                  >
                    {data.risk_score}
                  </div>

                  <div
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--text-muted)',
                      margin: '4px 0 16px'
                    }}
                  >
                    {t('out of 100')}
                  </div>

                  <div
                    className="progress-bar"
                    style={{
                      width: '100%',
                      height: 12
                    }}
                  >
                    <div
                      className="progress-fill"
                      style={{
                        width: `${data.risk_score}%`,
                        background: riskColor(data.risk_level)
                      }}
                    />
                  </div>

                  <div style={{ marginTop: 12 }}>
                    <span
                      className={`badge badge-${data.risk_level.toLowerCase()}`}
                      style={{
                        fontSize: '0.85rem',
                        padding: '6px 14px'
                      }}
                    >
                      {translateValue(
                        data.risk_level,
                        lang
                      )}{' '}
                      {t('DROUGHT RISK')}
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: 8,
                      fontSize: '0.75rem',
                      color: '#9ca3af'
                    }}
                  >
                    {t('Confidence:')}{' '}
                    <strong>
                      {translateValue(
                        data.confidence,
                        lang
                      )}
                    </strong>
                  </div>
                </div>

                {/* Radar */}
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">
                      {t('Risk Factor Breakdown')}
                    </div>
                  </div>

                  <ResponsiveContainer
                    width="100%"
                    height={200}
                  >
                    <RadarChart data={radarData}>
                      <PolarGrid />

                      <PolarAngleAxis
                        dataKey="subject"
                        tick={{ fontSize: 11 }}
                      />

                      <Radar
                        dataKey="pct"
                        stroke={riskColor(
                          data.risk_level
                        )}
                        fill={riskColor(
                          data.risk_level
                        )}
                        fillOpacity={0.3}
                      />

                      <Tooltip
                        formatter={(v: any) => [
                          `${v.toFixed(0)}%`,
                          t('Risk contribution')
                        ]}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* ───────────────── Evidence + Actions ───────────────── */}

              <div
                className="grid grid-2"
                style={{ marginBottom: 20 }}
              >
                {/* Risk Evidence */}
                <div className="card">
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

                      {t('Risk Evidence')}
                    </div>
                  </div>

                  {data.evidence?.map(
                    (e: string, i: number) => (
                      <div
                        key={i}
                        style={{
                          padding: '6px 0',
                          borderBottom:
                            '1px solid var(--border-glass)',
                          fontSize: '0.85rem',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                      >
                        <ChevronRight
                          size={14}
                          style={{
                            display: 'inline',
                            verticalAlign: 'middle',
                            marginRight: 4,
                            color: riskColor(
                              data.risk_level
                            ),
                            flexShrink: 0
                          }}
                        />

                        <span>
                          {translateEvidence(e, lang)}
                        </span>
                      </div>
                    )
                  )}
                </div>

                {/* Recommended Actions */}
                <div className="card">
                  <div className="card-header">
                    <div className="card-title">
                      <Zap
                        size={16}
                        style={{
                          display: 'inline',
                          verticalAlign: 'middle',
                          marginRight: 6,
                          color: '#eab308'
                        }}
                      />

                      {t('Recommended Actions')}
                    </div>
                  </div>

                  {data.recommended_actions
                    ?.slice(0, 5)
                    .map(
                      (a: string, i: number) => (
                        <div
                          key={i}
                          style={{
                            padding: '6px 0',
                            borderBottom:
                              '1px solid var(--border-glass)',
                            fontSize: '0.85rem',
                            display: 'flex',
                            gap: 8
                          }}
                        >
                          <span
                            style={{
                              color: '#3b82f6',
                              fontWeight: 700,
                              minWidth: 20
                            }}
                          >
                            {i + 1}.
                          </span>

                          <span>
                            {t(a)}
                          </span>
                        </div>
                      )
                    )}
                </div>
              </div>

              {/* ───────────────── Risk Scale ───────────────── */}

              <div className="card">
                <div className="card-header">
                  <div className="card-title">
                    {t(
                      'Drought Risk Scale Reference'
                    )}
                  </div>
                </div>

                <div className="grid grid-4">
                  {RISK_SCALE.map(
                    ({
                      level,
                      range,
                      color,
                      desc
                    }) => (
                      <div
                        key={level}
                        style={{
                          padding: 12,
                          background:
                            'rgba(255,255,255,0.05)',
                          borderRadius: 8,
                          borderLeft: `3px solid ${color}`
                        }}
                      >
                        <div
                          style={{
                            fontWeight: 600,
                            color,
                            fontSize: '0.85rem'
                          }}
                        >
                          {translateValue(
                            level,
                            lang
                          )}
                        </div>

                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-muted)'
                          }}
                        >
                          {t('Score:')} {range}
                        </div>

                        <div
                          style={{
                            fontSize: '0.75rem',
                            color: 'var(--text-main)',
                            marginTop: 4
                          }}
                        >
                          {t(desc)}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* ───────────────── Bottom Quick Actions ───────────────── */}
              <div
                style={{
                  marginTop: 24,
                  padding: '20px',
                  background: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8), rgba(30, 41, 59, 0.6))',
                  border: '1px solid var(--border-glass)',
                  borderRadius: 14,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: 16,
                }}
              >
                {/* Crop Advisor Navigation */}
                <div
                  onClick={() => navigate('/crops', { state: { selectedVillage } })}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    background: 'rgba(16, 185, 129, 0.08)',
                    border: '1px solid rgba(16, 185, 129, 0.25)',
                    borderRadius: 10,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.16)';
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.5)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(16, 185, 129, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.25)';
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(16, 185, 129, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <Sprout size={20} color="#34d399" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#34d399', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {t('Open Crop Advisor')}
                      <ChevronRight size={15} />
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 2 }}>
                      {t('Explore recommended drought-resilient crops and water saving')}
                    </div>
                  </div>
                </div>

                {/* Dashboard Navigation */}
                <div
                  onClick={() => navigate(isAuthenticated ? '/farmer/dashboard' : '/dashboard')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    background: 'rgba(56, 189, 248, 0.08)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    borderRadius: 10,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(56, 189, 248, 0.16)';
                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.5)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(56, 189, 248, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)';
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(56, 189, 248, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <LayoutDashboard size={20} color="#38bdf8" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {t('Navigate to Dashboard')}
                      <ChevronRight size={15} />
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 2 }}>
                      {t('Return to your personalized farmer overview')}
                    </div>
                  </div>
                </div>

                {/* Copilot Drought Ask */}
                <div
                  onClick={() =>
                    navigate('/copilot', {
                      state: {
                        initialPrompt:
                          lang === 'gu'
                            ? `${data?.village_name || ''} ગામ માટે દુષ્કાળ જોખમ સ્કોર ${data?.risk_score || ''}/100 છે (${data?.risk_level || ''}). અમે કયા તાત્કાલિક જળ સંચય અને સિંચાઈ પગલાં લેવા જોઈએ?`
                            : `What are the immediate drought actions and irrigation recommendations for ${data?.village_name || ''} with risk score ${data?.risk_score || ''}/100 (${data?.risk_level || ''})?`
                      }
                    })
                  }
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    padding: '14px 16px',
                    background: 'rgba(167, 139, 250, 0.08)',
                    border: '1px solid rgba(167, 139, 250, 0.25)',
                    borderRadius: 10,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(167, 139, 250, 0.16)';
                    e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.5)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(167, 139, 250, 0.08)';
                    e.currentTarget.style.borderColor = 'rgba(167, 139, 250, 0.25)';
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 10,
                      background: 'rgba(167, 139, 250, 0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <MessageSquare size={20} color="#a78bfa" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 6 }}>
                      {t('Ask Copilot About Drought')}
                      <ChevronRight size={15} />
                    </div>
                    <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 2 }}>
                      {t('Get AI-powered guidance on drought mitigation')}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}