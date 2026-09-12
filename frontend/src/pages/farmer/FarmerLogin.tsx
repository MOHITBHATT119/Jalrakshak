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
  Eye,
  EyeOff,
  UserCheck,
  ChevronRight,
  HelpCircle,
} from 'lucide-react';
import { useFarmerAuth } from '../../context/FarmerAuthContext';
import { useLanguage } from '../../context/LanguageContext';

export default function FarmerLogin() {
  const { login, demoLogin, isAuthenticated } = useFarmerAuth();
  const { lang, setLang } = useLanguage();
  const navigate = useNavigate();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/farmer/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError(lang === 'gu' ? 'કૃપા કરીને મોબાઇલ નંબર/ઈમેલ અને પાસવર્ડ દાખલ કરો.' : 'Please enter your mobile number/email and password.');
      return;
    }
    setError(null);
    setLoading(true);

    const err = await login(identifier.trim(), password.trim());
    setLoading(false);
    if (err) {
      setError(err);
    } else {
      navigate('/farmer/dashboard', { replace: true });
    }
  };

  const handleDemoLogin = async (email: string = 'ravi.desai@khet.in') => {
    setError(null);
    setDemoLoading(true);
    const err = await demoLogin(email);
    setDemoLoading(false);
    if (err) {
      setError(err);
    } else {
      navigate('/farmer/dashboard', { replace: true });
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(ellipse at 20% 20%, rgba(16, 185, 129, 0.15), transparent 40%), radial-gradient(ellipse at 80% 80%, rgba(14, 165, 233, 0.12), transparent 40%), #030712',
      color: '#f8fafc',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: '24px 16px',
      boxSizing: 'border-box',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      {/* Top Header Navigation */}
      <header style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: 1100,
        width: '100%',
        margin: '0 auto 24px auto',
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', color: '#fff' }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #10b981, #0284c7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)',
          }}>
            <Sprout size={22} color="#fff" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.2rem', letterSpacing: '-0.02em', background: 'linear-gradient(to right, #34d399, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              JalRakshak AI
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
              {lang === 'gu' ? 'ખેડૂત કલ્યાણ અને જળ પોર્ટલ' : 'Farmer Groundwater & Advisory Portal'}
            </div>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {/* Language Switcher */}
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
              transition: 'all 0.2s ease',
            }}
          >
            <Languages size={15} color="#38bdf8" />
            <span>{lang === 'en' ? 'ગુજરાતી' : 'English'}</span>
          </button>

          <Link
            to="/admin/login"
            style={{
              fontSize: '0.8rem',
              color: '#94a3b8',
              textDecoration: 'none',
              padding: '6px 12px',
              borderRadius: 8,
              border: '1px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            {lang === 'gu' ? 'એડમિન લૉગિન' : 'Admin Login'}
          </Link>
        </div>
      </header>

      {/* Main Container */}
      <main style={{
        maxWidth: 1050,
        width: '100%',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: 32,
        alignItems: 'center',
      }}>
        {/* Left Column: Context / Value Prop */}
        <div style={{ padding: '12px 8px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.3)',
            color: '#34d399',
            padding: '4px 12px',
            borderRadius: 30,
            fontSize: '0.78rem',
            fontWeight: 600,
            marginBottom: 18,
          }}>
            <Sparkles size={14} />
            {lang === 'gu' ? 'સૌરાષ્ટ્રના ખેડૂતો માટે સમર્પિત AI' : 'Dedicated AI for Saurashtra Farmers'}
          </div>

          <h1 style={{
            fontSize: '2.4rem',
            fontWeight: 800,
            lineHeight: 1.15,
            marginBottom: 16,
            letterSpacing: '-0.03em',
          }}>
            {lang === 'gu' ? (
              <>
                તમારા ગામના ભૂગર્ભ જળ અને <br />
                <span style={{ background: 'linear-gradient(to right, #34d399, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  પાક માટે સચોટ માર્ગદર્શન.
                </span>
              </>
            ) : (
              <>
                Hyper-local Groundwater & <br />
                <span style={{ background: 'linear-gradient(to right, #34d399, #38bdf8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Smart Crop Guidance.
                </span>
              </>
            )}
          </h1>

          <p style={{ fontSize: '0.96rem', color: '#94a3b8', lineHeight: 1.6, marginBottom: 24, maxWidth: 460 }}>
            {lang === 'gu'
              ? 'લૉગિન કરીને તમારા ગામના જળ સ્તર, આગામી વરસાદની આગાહી અને ઓછા પાણીમાં વધુ નફો આપતા પાકોની ભલામણો જુઓ.'
              : 'Log in to access village-level aquifer health, water budget telemetry, AI drought alerts, and tailored crop shift advice.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              {
                icon: Droplets,
                color: '#38bdf8',
                title: lang === 'gu' ? 'ગામનું સચોટ જળ સ્તર' : 'Local Aquifer Water Depth',
                desc: lang === 'gu' ? 'છેલ્લા 5 વર્ષના ડેટા સાથે લાઈવ સ્તર' : 'Real-time depth vs 5-year Saurashtra trends',
              },
              {
                icon: Sprout,
                color: '#34d399',
                title: lang === 'gu' ? 'પાક સલાહકાર એજન્ટ' : 'Crop Water Optimization',
                desc: lang === 'gu' ? 'કપાસ અને મગફળી માટે પાણી બચાવતી પદ્ધતિઓ' : 'Calculated water savings vs standard cash crops',
              },
              {
                icon: ShieldCheck,
                color: '#a78bfa',
                title: lang === 'gu' ? 'વૉટર કો-પાઇલટ AI' : 'Multilingual Voice & Text Copilot',
                desc: lang === 'gu' ? 'ગુજરાતી અને અંગ્રેજીમાં ત્વરિત સવાલ-જવાબ' : 'Direct queries in Gujarati and English',
              },
            ].map((item, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{
                  width: 34,
                  height: 34,
                  borderRadius: 10,
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <item.icon size={18} color={item.color} />
                </div>
                <div>
                  <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#f1f5f9' }}>{item.title}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Glassmorphism Login Card */}
        <div style={{
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: 20,
          padding: '32px 28px',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(16, 185, 129, 0.1)',
        }}>
          <div style={{ marginBottom: 24 }}>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 6px 0', color: '#fff' }}>
              {lang === 'gu' ? 'ખેડૂત લૉગિન' : 'Farmer Portal Login'}
            </h2>
            <p style={{ margin: 0, fontSize: '0.82rem', color: '#94a3b8' }}>
              {lang === 'gu' ? 'તમારા મોબાઈલ નંબર અથવા ઈમેલ વડે પ્રવેશ કરો' : 'Access your personalized farm water dashboard'}
            </p>
          </div>

          {/* Quick 1-Click Demo Evaluation Box */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(14, 165, 233, 0.08))',
            border: '1px dashed rgba(52, 211, 153, 0.35)',
            borderRadius: 12,
            padding: '12px 14px',
            marginBottom: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 5 }}>
                <Sparkles size={12} />
                {lang === 'gu' ? 'ઝડપી ડેમો લૉગિન' : '1-Click Demo Evaluation'}
              </span>
              <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Password: farmer123</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <button
                type="button"
                disabled={demoLoading || loading}
                onClick={() => handleDemoLogin('ravi.desai@khet.in')}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  color: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#38bdf8' }}>Ravi Desai</div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Amreli • 4.5 Ha</div>
              </button>

              <button
                type="button"
                disabled={demoLoading || loading}
                onClick={() => handleDemoLogin('bhavesh.joshi@khet.in')}
                style={{
                  background: 'rgba(255, 255, 255, 0.06)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  borderRadius: 8,
                  padding: '8px 10px',
                  color: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#34d399' }}>Bhavesh Joshi</div>
                <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Surendranagar • 6 Ha</div>
              </button>
            </div>
          </div>

          {error && (
            <div style={{
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 10,
              padding: '10px 14px',
              marginBottom: 18,
              color: '#fca5a5',
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 500, color: '#cbd5e1', marginBottom: 6 }}>
                {lang === 'gu' ? 'મોબાઇલ નંબર અથવા ઈમેલ' : 'Mobile Number or Email'}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder={lang === 'gu' ? 'દા.ત. 98250 11003 અથવા ravi@khet.in' : 'e.g. +91 98250 11003 or ravi.desai@khet.in'}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 10,
                    padding: '11px 14px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <label style={{ fontSize: '0.8rem', fontWeight: 500, color: '#cbd5e1' }}>
                  {lang === 'gu' ? 'પાસવર્ડ' : 'Password'}
                </label>
                <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                  {lang === 'gu' ? 'સહાય: 1800-JAL-RAKSHAK' : 'Help: 1800-JAL-RAKSHAK'}
                </span>
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    background: 'rgba(15, 23, 42, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.15)',
                    borderRadius: 10,
                    padding: '11px 40px 11px 14px',
                    color: '#fff',
                    fontSize: '0.9rem',
                    outline: 'none',
                    transition: 'border-color 0.2s ease',
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    color: '#64748b',
                    cursor: 'pointer',
                    padding: 0,
                  }}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || demoLoading}
              style={{
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                padding: '12px 16px',
                fontSize: '0.92rem',
                fontWeight: 600,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                transition: 'all 0.2s ease',
                marginTop: 6,
              }}
            >
              {loading ? (
                <span>{lang === 'gu' ? 'ચકાસણી થઈ રહી છે…' : 'Signing in…'}</span>
              ) : (
                <>
                  <span>{lang === 'gu' ? 'લૉગિન કરો' : 'Sign In as Farmer'}</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div style={{
            marginTop: 22,
            paddingTop: 18,
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            textAlign: 'center',
            fontSize: '0.84rem',
            color: '#94a3b8',
          }}>
            {lang === 'gu' ? 'નવા ખેડૂત છો? ' : "Don't have an account? "}
            <Link
              to="/farmer/signup"
              style={{
                color: '#34d399',
                fontWeight: 600,
                textDecoration: 'none',
                marginLeft: 4,
              }}
            >
              {lang === 'gu' ? 'અહીં નોંધણી કરો (Sign Up)' : 'Register here'}
            </Link>
          </div>
        </div>
      </main>

      {/* Footer info */}
      <footer style={{
        maxWidth: 1100,
        width: '100%',
        margin: '24px auto 0 auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        fontSize: '0.74rem',
        color: '#64748b',
        flexWrap: 'wrap',
        gap: 10,
      }}>
        <div>JalRakshak AI — Saurashtra Water & Drought Intelligence Platform</div>
        <div style={{ display: 'flex', gap: 16 }}>
          <Link to="/" style={{ color: '#94a3b8', textDecoration: 'none' }}>Home</Link>
          <Link to="/hydro-atlas" style={{ color: '#94a3b8', textDecoration: 'none' }}>Hydro Atlas</Link>
          <Link to="/admin/login" style={{ color: '#94a3b8', textDecoration: 'none' }}>Admin Command</Link>
        </div>
      </footer>
    </div>
  );
}
