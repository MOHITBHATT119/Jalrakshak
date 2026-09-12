import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Sprout,
  Droplets,
  Lock,
  ArrowRight,
  ShieldCheck,
  Languages,
  CheckCircle2,
  Sparkles,
  AlertCircle,
  MapPin,
  Phone,
  Mail,
  User,
  Trees,
  Check,
  ChevronLeft,
} from 'lucide-react';
import { useFarmerAuth } from '../../context/FarmerAuthContext';
import { useLanguage } from '../../context/LanguageContext';

const SAURASHTRA_DISTRICTS = [
  'Amreli',
  'Bhavnagar',
  'Botad',
  'Devbhumi Dwarka',
  'Gir Somnath',
  'Jamnagar',
  'Junagadh',
  'Morbi',
  'Porbandar',
  'Rajkot',
  'Surendranagar',
];

const COMMON_CROPS = [
  'Cotton (કપાસ)',
  'Groundnut (મગફળી)',
  'Wheat (ઘઉં)',
  'Cumin (જીરું)',
  'Sesame (તલ)',
  'Castor (એરંડા)',
  'Pearl Millet (બાજરી)',
  'Mustard (રાયડો)',
  'Chickpea (ચણા)',
];

export default function FarmerSignup() {
  const { signup, isAuthenticated } = useFarmerAuth();
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    district: 'Amreli',
    village: '',
    land_area_ha: 3.5,
    password: '',
    confirmPassword: '',
  });

  const [selectedCrops, setSelectedCrops] = useState<string[]>(['Cotton (કપાસ)', 'Groundnut (મગફળી)']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/farmer/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const toggleCrop = (crop: string) => {
    setSelectedCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.name.trim()) {
      setError(lang === 'gu' ? 'કૃપા કરીને ખેડૂતનું પૂરું નામ દાખલ કરો.' : 'Please enter farmer full name.');
      return;
    }
    if (!formData.phone.trim() && !formData.email.trim()) {
      setError(lang === 'gu' ? 'મોબાઇલ નંબર અથવા ઈમેલ દાખલ કરવો આવશ્યક છે.' : 'Either phone number or email is required.');
      return;
    }
    if (!formData.village.trim()) {
      setError(lang === 'gu' ? 'કૃપા કરીને તમારા ગામનું નામ દાખલ કરો.' : 'Please enter your village name.');
      return;
    }
    if (formData.password.length < 4) {
      setError(lang === 'gu' ? 'પાસવર્ડ ઓછામાં ઓછો 4 અક્ષરોનો હોવો જોઈએ.' : 'Password must be at least 4 characters long.');
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setError(lang === 'gu' ? 'બંને પાસવર્ડ સરખા નથી.' : 'Passwords do not match.');
      return;
    }

    setLoading(true);
    const err = await signup({
      name: formData.name.trim(),
      email: formData.email.trim() || undefined,
      phone: formData.phone.trim() || undefined,
      password: formData.password,
      village: formData.village.trim(),
      district: formData.district,
      land_area_ha: Number(formData.land_area_ha) || 0,
      primary_crops: selectedCrops.map(c => c.split(' ')[0]).join(', '),
    });

    setLoading(false);
    if (err) {
      setError(err);
    } else {
      navigate('/farmer/dashboard', { replace: true });
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 80% 20%, rgba(16, 185, 129, 0.15), transparent 40%), radial-gradient(ellipse at 20% 80%, rgba(14, 165, 233, 0.12), transparent 40%), #030712',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '24px 16px',
      boxSizing: 'border-box',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Top Header */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: 900,
        width: '100%',
        margin: '0 auto 20px auto',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#fff' }}>
          <div style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: 'linear-gradient(135deg, #10b981, #0284c7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Sprout size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', color: '#38bdf8' }}>
              JalRakshak AI
            </div>
            <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
              {lang === 'gu' ? 'ખેડૂત નોંધણી પોર્ટલ' : 'Farmer Registration'}
            </div>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setLang(lang === 'en' ? 'gu' : 'en')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#e2e8f0',
              padding: '6px 14px',
              borderRadius: 20,
              fontSize: '0.82rem',
              cursor: 'pointer',
            }}
          >
            <Languages size={15} color="#38bdf8" />
            <span>{lang === 'en' ? 'ગુજરાતી' : 'English'}</span>
          </button>
        </div>
      </header>

      {/* Main Registration Card */}
      <main style={{
        maxWidth: 760,
        width: '100%',
        margin: '0 auto',
        background: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: 20,
        padding: '32px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(16, 185, 129, 0.1)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, margin: '0 0 6px 0', color: '#fff' }}>
              {lang === 'gu' ? 'નવા ખેડૂત ખાતું બનાવો' : 'Farmer Registration'}
            </h1>
            <p style={{ margin: 0, fontSize: '0.84rem', color: '#94a3b8' }}>
              {lang === 'gu'
                ? 'તમારી જમીન અને પાકની વિગત ભરી તમારા ગામનું AI જળ પૃથક્કરણ મેળવો'
                : 'Join JalRakshak AI to get tailored crop water advice and village groundwater alerts'}
            </p>
          </div>
          <Link
            to="/farmer/login"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              color: '#38bdf8',
              fontSize: '0.82rem',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(56, 189, 248, 0.08)',
            }}
          >
            <ChevronLeft size={14} />
            {lang === 'gu' ? 'લૉગિન પર પાછા' : 'Back to Login'}
          </Link>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.3)',
            borderRadius: 10,
            padding: '12px 14px',
            marginBottom: 20,
            color: '#fca5a5',
            fontSize: '0.84rem',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            <AlertCircle size={18} color="#ef4444" style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Section 1: Personal Info */}
          <div>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <User size={14} />
              {lang === 'gu' ? '૧. વ્યક્તિગત માહિતી' : '1. Personal Information'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: 6 }}>
                  {lang === 'gu' ? 'પૂરું નામ *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder={lang === 'gu' ? 'દા.ત. રમેશભાઈ પટેલ' : 'e.g. Ramesh Patel'}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: 6 }}>
                  {lang === 'gu' ? 'મોબાઇલ નંબર *' : 'Mobile Phone (+91) *'}
                </label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91 98250 12345"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: 6 }}>
                  {lang === 'gu' ? 'ઈમેલ (વૈકલ્પિક)' : 'Email (Optional)'}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="farmer@example.com"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '0.88rem',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 2: Farm & Location */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 16 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <MapPin size={14} />
              {lang === 'gu' ? '૨. ખેતર અને ગામની વિગતો' : '2. Farm Location & Land Area'}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: 6 }}>
                  {lang === 'gu' ? 'જિલ્લો (District) *' : 'District *'}
                </label>
                <select
                  value={formData.district}
                  onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '0.88rem',
                  }}
                >
                  {SAURASHTRA_DISTRICTS.map((d) => (
                    <option key={d} value={d} style={{ background: '#0f172a', color: '#fff' }}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: 6 }}>
                  {lang === 'gu' ? 'ગામનું નામ (Village) *' : 'Village Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.village}
                  onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                  placeholder={lang === 'gu' ? 'દા.ત. બાબરા, અમરેલી' : 'e.g. Babra or Amreli'}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: 6 }}>
                  {lang === 'gu' ? 'જમીન ક્ષેત્રફળ (હેક્ટર) *' : 'Land Size (Hectares) *'}
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  required
                  value={formData.land_area_ha}
                  onChange={(e) => setFormData({ ...formData, land_area_ha: parseFloat(e.target.value) || 0 })}
                  placeholder="3.5"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '0.88rem',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Section 3: Crops */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 16 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Trees size={14} />
              {lang === 'gu' ? '૩. મુખ્ય પાકો (Primary Crops)' : '3. Crops Currently Grown'}
            </div>
            <p style={{ fontSize: '0.74rem', color: '#94a3b8', margin: '0 0 12px 0' }}>
              {lang === 'gu' ? 'તમે જે પાક વાવો છો તે પસંદ કરો (એકથી વધુ પસંદ કરી શકો છો):' : 'Select all crops you currently cultivate on your land:'}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {COMMON_CROPS.map((crop) => {
                const isSelected = selectedCrops.includes(crop);
                return (
                  <button
                    type="button"
                    key={crop}
                    onClick={() => toggleCrop(crop)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      background: isSelected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255, 255, 255, 0.05)',
                      border: isSelected ? '1px solid #10b981' : '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: 20,
                      padding: '6px 12px',
                      color: isSelected ? '#34d399' : '#cbd5e1',
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    {isSelected && <Check size={12} />}
                    <span>{crop}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 4: Security */}
          <div style={{ borderTop: '1px solid rgba(255, 255, 255, 0.08)', paddingTop: 16 }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#a78bfa', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Lock size={14} />
              {lang === 'gu' ? '૪. પાસવર્ડ સુરક્ષા' : '4. Account Security'}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: 6 }}>
                  {lang === 'gu' ? 'પાસવર્ડ બનાવો *' : 'Create Password *'}
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '0.88rem',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', color: '#cbd5e1', marginBottom: 6 }}>
                  {lang === 'gu' ? 'પાસવર્ડ ખાતરી કરો *' : 'Confirm Password *'}
                </label>
                <input
                  type="password"
                  required
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    color: '#fff',
                    fontSize: '0.88rem',
                  }}
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              padding: '14px 20px',
              fontSize: '0.96rem',
              fontWeight: 600,
              cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 18px rgba(16, 185, 129, 0.4)',
              transition: 'all 0.2s ease',
              marginTop: 10,
            }}
          >
            {loading ? (
              <span>{lang === 'gu' ? 'ખાતું બની રહ્યું છે…' : 'Creating Account…'}</span>
            ) : (
              <>
                <span>{lang === 'gu' ? 'નોંધણી પૂર્ણ કરો અને ડૅશબોર્ડ જુઓ' : 'Complete Registration & Enter Hub'}</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </main>

      {/* Footer */}
      <footer style={{
        maxWidth: 900,
        width: '100%',
        margin: '20px auto 0 auto',
        textAlign: 'center',
        fontSize: '0.75rem',
        color: '#64748b',
      }}>
        JalRakshak AI — Helping Saurashtra Farmers Conserve Water & Maximize Yield
      </footer>
    </div>
  );
}
