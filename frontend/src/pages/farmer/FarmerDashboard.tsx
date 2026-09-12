import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Sprout,
  Droplets,
  CloudRain,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  HelpCircle,
  MessageSquare,
  Sparkles,
  MapPin,
  Calendar,
  LogOut,
  ChevronRight,
  Award,
  Layers,
  BarChart3,
  ShieldAlert,
  Compass,
  CheckCircle,
  Lightbulb,
} from 'lucide-react';
import { useFarmerAuth } from '../../context/FarmerAuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function FarmerDashboard() {
  const { farmerUser, logout } = useFarmerAuth();
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();

  const [waterHealthScore, setWaterHealthScore] = useState(64);
  const [groundwaterDepth, setGroundwaterDepth] = useState(19.2);
  const [deficitPct, setDeficitPct] = useState(-24.5);
  const [activeCopilotQuery, setActiveCopilotQuery] = useState('');

  const village = farmerUser?.village || 'Amreli';
  const district = farmerUser?.district || 'Amreli';
  const landArea = farmerUser?.land_area_ha || 4.5;
  const crops = farmerUser?.primary_crops || 'Cotton, Groundnut';

  const handleCopilotAsk = (query: string) => {
    navigate('/copilot', { state: { initialPrompt: query } });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#030712',
      color: '#f8fafc',
      fontFamily: 'Inter, system-ui, sans-serif',
      padding: '24px 20px 48px 20px',
      boxSizing: 'border-box',
    }}>
      {/* Top Banner Navigation */}
      <div style={{
        maxWidth: 1200,
        margin: '0 auto 24px auto',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: 16,
        paddingBottom: 20,
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
      }}>
        <Link
          to="/"
          title="Return to Home page"
          style={{ display: 'flex', alignItems: 'center', gap: 14, textDecoration: 'none', color: 'inherit', cursor: 'pointer' }}
        >
          <div style={{
            width: 44,
            height: 44,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #10b981, #0284c7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.3)',
          }}>
            <Sprout size={24} color="#fff" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#fff' }}>
                JalRakshak AI
              </span>
              <span style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                color: '#34d399',
                fontSize: '0.7rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 12,
                textTransform: 'uppercase',
              }}>
                {lang === 'gu' ? 'ખેડૂત હબ' : 'Farmer Hub'}
              </span>
            </div>
            <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              {lang === 'gu' ? 'સૌરાષ્ટ્ર ડિજિટલ ભૂગર્ભજળ સલાહકાર' : 'Saurashtra Digital Groundwater & Crop Advisory'}
            </div>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Language button */}
          <button
            onClick={() => setLang(lang === 'en' ? 'gu' : 'en')}
            style={{
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#cbd5e1',
              padding: '6px 12px',
              borderRadius: 8,
              fontSize: '0.8rem',
              cursor: 'pointer',
            }}
          >
            {lang === 'en' ? 'ગુજરાતી' : 'English'}
          </button>

          <Link
            to="/admin/login"
            style={{
              fontSize: '0.8rem',
              color: '#64748b',
              textDecoration: 'none',
              padding: '6px 10px',
            }}
          >
            Admin
          </Link>

          <button
            onClick={logout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              color: '#f87171',
              padding: '6px 14px',
              borderRadius: 8,
              fontSize: '0.82rem',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            <LogOut size={14} />
            <span>{lang === 'gu' ? 'લૉગ આઉટ' : 'Sign Out'}</span>
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Welcome Personalized Hero */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.14) 0%, rgba(14, 165, 233, 0.10) 100%)',
          border: '1px solid rgba(52, 211, 153, 0.25)',
          borderRadius: 20,
          padding: '28px',
          marginBottom: 28,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 20,
        }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <span style={{ fontSize: '0.82rem', color: '#34d399', fontWeight: 600 }}>
                {lang === 'gu' ? 'સુપ્રભાત / નમસ્તે,' : 'Welcome back,'}
              </span>
              <span style={{
                background: 'rgba(16, 185, 129, 0.2)',
                color: '#34d399',
                fontSize: '0.72rem',
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 12,
              }}>
                {farmerUser?.status || 'Active'}
              </span>
            </div>
            <h1 style={{ fontSize: '1.9rem', fontWeight: 800, margin: '0 0 10px 0', letterSpacing: '-0.02em', color: '#fff' }}>
              {farmerUser?.name || 'Ravi Desai'}
            </h1>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: '0.86rem', color: '#cbd5e1' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={16} color="#38bdf8" />
                <span>
                  {village}, {district}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Compass size={16} color="#34d399" />
                <span>
                  {lang === 'gu' ? `જમીન: ${landArea} હેક્ટર` : `Farm: ${landArea} Ha`}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sprout size={16} color="#f59e0b" />
                <span>
                  {lang === 'gu' ? `પાક: ${crops}` : `Crops: ${crops}`}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12 }}>
            <Link
              to="/crops"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: '#10b981',
                color: '#fff',
                padding: '12px 18px',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: '0.88rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
              }}
            >
              <Lightbulb size={16} />
              <span>{lang === 'gu' ? 'પાક સલાહ જુઓ' : 'Open Crop Advisor'}</span>
            </Link>
            <Link
              to="/hydro-atlas"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'rgba(255, 255, 255, 0.08)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#fff',
                padding: '12px 18px',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: '0.88rem',
                textDecoration: 'none',
              }}
            >
              <Compass size={16} color="#38bdf8" />
              <span>{lang === 'gu' ? 'હાઇડ્રો એટલાસ નકશો' : 'View Hydro Atlas'}</span>
            </Link>
          </div>
        </div>

        {/* 3-Column Telemetry KPI Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: 18,
          marginBottom: 28,
        }}>
          {/* Card 1: Groundwater Depth */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '22px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 500 }}>
                {lang === 'gu' ? 'ગામનું ભૂગર્ભજળ સ્તર' : 'Village Water Table Depth'}
              </span>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(56, 189, 248, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Droplets size={18} color="#38bdf8" />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
                {groundwaterDepth}
              </span>
              <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>metres bgl</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#f59e0b' }}>
              <TrendingDown size={14} />
              <span>
                {lang === 'gu' ? 'છેલ્લા વર્ષ કરતા 0.8m ઘટ્યું' : '0.8m drop compared to last year'}
              </span>
            </div>
          </div>

          {/* Card 2: Rainfall Deficit */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '22px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 500 }}>
                {lang === 'gu' ? 'ચોમાસુ વરસાદ સ્થિતિ' : 'Monsoon Rainfall Deficit'}
              </span>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(245, 158, 11, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <CloudRain size={18} color="#f59e0b" />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#f59e0b' }}>
                {deficitPct}%
              </span>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>vs historical</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.78rem', color: '#38bdf8' }}>
              <CheckCircle size={14} />
              <span>
                {lang === 'gu' ? 'આગામી 10 દિવસમાં છૂટાછવાયા વરસાદની શક્યતા' : 'Light scattered showers predicted in 10 days'}
              </span>
            </div>
          </div>

          {/* Card 3: Water Security Score */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
            padding: '22px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8', fontWeight: 500 }}>
                {lang === 'gu' ? 'ગામ જળ સુરક્ષા ઇન્ડેક્સ' : 'Village Water Security Index'}
              </span>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(16, 185, 129, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Award size={18} color="#34d399" />
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 8 }}>
              <span style={{ fontSize: '2rem', fontWeight: 800, color: '#34d399' }}>
                {waterHealthScore}
              </span>
              <span style={{ fontSize: '0.9rem', color: '#94a3b8' }}>/ 100</span>
            </div>
            <div style={{
              width: '100%',
              height: 6,
              background: 'rgba(255, 255, 255, 0.1)',
              borderRadius: 3,
              overflow: 'hidden',
            }}>
              <div style={{
                width: `${waterHealthScore}%`,
                height: '100%',
                background: 'linear-gradient(to right, #10b981, #38bdf8)',
              }} />
            </div>
          </div>
        </div>

        {/* Tailored Farm Advisory Section */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 22,
          marginBottom: 28,
        }}>
          {/* Left: AI Water-Saving Crop Switch */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 18,
            padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Sparkles size={18} color="#34d399" />
              <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                {lang === 'gu' ? `તમારા ${landArea} હેક્ટર ખેતર માટે ભલામણ` : `Tailored Advice for Your ${landArea} Ha Farm`}
              </h2>
            </div>

            <div style={{
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.2)',
              borderRadius: 12,
              padding: '16px',
              marginBottom: 16,
            }}>
              <div style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600, marginBottom: 6 }}>
                {lang === 'gu' ? 'સુધારેલ પાક વિભાજન (Crop Shift Recommendation)' : 'Smart Crop Diversification'}
              </div>
              <p style={{ margin: '0 0 12px 0', fontSize: '0.86rem', color: '#cbd5e1', lineHeight: 1.5 }}>
                {lang === 'gu'
                  ? `તમારા ગામ ${village} માં કપાસ કરતાં જીરું (Cumin) અથવા તલ (Sesame) વાવવાથી ૩૫-૪૦% પાણીની બચત થશે અને નફો પણ ઊંચો રહેશે.`
                  : `In ${village}, shifting 1.5 Ha of Cotton to Sesame/Cumin can conserve ~35-40% water while maintaining high net returns.`}
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', color: '#f8fafc' }}>
                  💧 {lang === 'gu' ? 'પાણી બચત: ~1.8 MCM' : 'Est. Water Saving: ~1.8 MCM'}
                </span>
                <span style={{ background: 'rgba(255, 255, 255, 0.08)', padding: '4px 10px', borderRadius: 6, fontSize: '0.75rem', color: '#f8fafc' }}>
                  📈 {lang === 'gu' ? 'નફો: +14% સંભવિત' : 'Projected Profit: +14%'}
                </span>
              </div>
            </div>

            <Link
              to="/crops"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                color: '#38bdf8',
                fontSize: '0.84rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              <span>{lang === 'gu' ? 'સંપૂર્ણ પાક કેલ્ક્યુલેટર ખોલો' : 'View Full Crop Simulation'}</span>
              <ChevronRight size={15} />
            </Link>
          </div>

          {/* Right: Quick AI Voice & Text Copilot */}
          <div style={{
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 18,
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <MessageSquare size={18} color="#38bdf8" />
                <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: '#fff' }}>
                  {lang === 'gu' ? 'વૉટર કો-પાઇલટ AI સહાયક' : 'Ask Water Copilot AI'}
                </h2>
              </div>
              <p style={{ fontSize: '0.84rem', color: '#94a3b8', margin: '0 0 14px 0' }}>
                {lang === 'gu'
                  ? 'તમારા પાક અને સિંચાઈ અંગે કોઈપણ સવાલ સીધા પૂછો:'
                  : 'Get instant answers in Gujarati or English tailored to your village:'}
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  lang === 'gu'
                    ? 'મારા કપાસના પાકમાં ટપક પદ્ધતિથી કેટલું પાણી બચી શકે?'
                    : 'How much water will drip irrigation save on my cotton crop?',
                  lang === 'gu'
                    ? `મારા ગામ ${village} માં આ સિઝને નવું બોરવેલ બનાવવું યોગ્ય છે?`
                    : `Is it advisable to drill a new borewell in ${village} this season?`,
                  lang === 'gu'
                    ? 'ઓછા પાણીમાં સૌથી વધુ આવક આપતા પાક કયા છે?'
                    : 'Which drought-tolerant crops yield highest revenue in Saurashtra?',
                ].map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleCopilotAsk(q)}
                    style={{
                      background: 'rgba(255, 255, 255, 0.04)',
                      border: '1px solid rgba(255, 255, 255, 0.08)',
                      borderRadius: 10,
                      padding: '10px 12px',
                      color: '#e2e8f0',
                      fontSize: '0.8rem',
                      textAlign: 'left',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 8,
                    }}
                  >
                    <span>{q}</span>
                    <ArrowRight size={14} color="#38bdf8" style={{ flexShrink: 0 }} />
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <Link
                to="/copilot"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  padding: '10px 16px',
                  borderRadius: 10,
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                }}
              >
                <span>{lang === 'gu' ? 'વૉટર કો-પાઇલટ ચેટ ખોલો' : 'Launch Full Copilot Chat'}</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Navigation Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 16,
        }}>
          <Link
            to="/drought"
            state={{ fromFarmerDashboard: true, district, village }}
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '18px',
              textDecoration: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              transition: 'all 0.2s',
            }}
          >
            <ShieldAlert size={22} color="#f59e0b" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                {lang === 'gu' ? 'દુષ્કાળ ઈન્ટેલિજન્સ' : 'Drought Intelligence'}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                {lang === 'gu' ? 'સૌરાષ્ટ્ર રિસ્ક એસેસમેન્ટ' : 'Aquifer Risk Index'}
              </div>
            </div>
          </Link>

          <Link
            to="/crops"
            state={{ district, village }}
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '18px',
              textDecoration: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              transition: 'all 0.2s',
            }}
          >
            <Sprout size={22} color="#34d399" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                {lang === 'gu' ? 'પાક સલાહકાર' : 'Crop Advisor'}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                {lang === 'gu' ? 'જળ-કાર્યક્ષમ પાક ભલામણ' : 'Water-efficient crop advice'}
              </div>
            </div>
          </Link>

          <Link
            to="/simulator"
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '18px',
              textDecoration: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              transition: 'all 0.2s',
            }}
          >
            <Layers size={22} color="#a78bfa" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                {lang === 'gu' ? 'શું-જો સિમ્યુલેટર' : 'What-If Simulator'}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                {lang === 'gu' ? 'પાક બદલાવ અને પાણી બચત' : 'Rain & crop scenarios'}
              </div>
            </div>
          </Link>

          <Link
            to="/community"
            style={{
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: 14,
              padding: '18px',
              textDecoration: 'none',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              transition: 'all 0.2s',
            }}
          >
            <MapPin size={22} color="#10b981" />
            <div>
              <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>
                {lang === 'gu' ? 'ચેકડેમ & રિચાર્જ પ્લાન' : 'Recharge Structures'}
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                {lang === 'gu' ? 'ગામમાં નવા જળ સ્ત્રોત' : 'Community interventions'}
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
