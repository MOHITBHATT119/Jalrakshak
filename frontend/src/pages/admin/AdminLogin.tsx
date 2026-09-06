import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Droplet,
  Eye,
  EyeOff,
  Lock,
  User,
  ShieldCheck,
  ArrowLeft,
  Waves,
  Activity,
  CloudRain,
  Sparkles,
  ChevronRight,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';

export default function AdminLogin() {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, isAuthenticated } = useAdminAuth();
  const nav = useNavigate();

  useEffect(() => {
    if (isAuthenticated) {
      nav('/admin/dashboard', { replace: true });
    }
  }, [isAuthenticated, nav]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (username === 'admin' && password === 'admin123') {
      setIsLoading(true);
      login();

      setTimeout(() => {
        nav('/admin/dashboard', { replace: true });
      }, 450);
    } else {
      setError('Invalid username or password. Try again.');
    }
  };

  return (
    <div className="admin-login-page">
      <style>{`
        * {
          box-sizing: border-box;
        }

        .admin-login-page {
          min-height: 100vh;
          width: 100%;
          position: relative;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 32px 20px;
          font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
          background:
            radial-gradient(circle at 15% 20%, rgba(37,99,235,.22), transparent 32%),
            radial-gradient(circle at 85% 80%, rgba(124,58,237,.20), transparent 30%),
            linear-gradient(135deg, #020617 0%, #071226 48%, #030712 100%);
          color: #f8fafc;
        }

        .login-grid {
          position: absolute;
          inset: 0;
          opacity: .18;
          background-image:
            linear-gradient(rgba(96,165,250,.10) 1px, transparent 1px),
            linear-gradient(90deg, rgba(96,165,250,.10) 1px, transparent 1px);
          background-size: 55px 55px;
          mask-image: linear-gradient(to bottom, transparent, black 25%, black 75%, transparent);
          pointer-events: none;
        }

        .orb {
          position: absolute;
          border-radius: 999px;
          filter: blur(70px);
          pointer-events: none;
          animation: orbFloat 12s ease-in-out infinite;
        }

        .orb-one {
          width: 260px;
          height: 260px;
          background: rgba(37,99,235,.22);
          left: -80px;
          top: 12%;
        }

        .orb-two {
          width: 320px;
          height: 320px;
          background: rgba(124,58,237,.18);
          right: -110px;
          bottom: 5%;
          animation-delay: -4s;
        }

        .orb-three {
          width: 180px;
          height: 180px;
          background: rgba(6,182,212,.12);
          right: 28%;
          top: -70px;
          animation-delay: -7s;
        }

        @keyframes orbFloat {
          0%, 100% {
            transform: translate3d(0,0,0) scale(1);
          }
          50% {
            transform: translate3d(25px,-30px,0) scale(1.08);
          }
        }

        .login-shell {
          position: relative;
          z-index: 2;
          width: min(1040px, 100%);
          min-height: 610px;
          display: grid;
          grid-template-columns: 1fr 430px;
          border: 1px solid rgba(148,163,184,.16);
          border-radius: 30px;
          overflow: hidden;
          background: rgba(7,18,38,.72);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          box-shadow:
            0 40px 100px rgba(0,0,0,.55),
            0 0 70px rgba(37,99,235,.08),
            inset 0 1px 0 rgba(255,255,255,.08);
          animation: shellIn .7s cubic-bezier(.2,.8,.2,1);
        }

        @keyframes shellIn {
          from {
            opacity: 0;
            transform: translateY(25px) scale(.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .brand-panel {
          position: relative;
          padding: 52px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          border-right: 1px solid rgba(148,163,184,.12);
          background:
            radial-gradient(circle at 20% 20%, rgba(59,130,246,.14), transparent 34%),
            linear-gradient(145deg, rgba(15,23,42,.58), rgba(15,23,42,.18));
        }

        .brand-top {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .brand-mark {
          width: 44px;
          height: 44px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #2563eb, #7c3aed);
          box-shadow: 0 12px 30px rgba(37,99,235,.35);
          animation: markPulse 3s ease-in-out infinite;
        }

        @keyframes markPulse {
          0%, 100% { box-shadow: 0 12px 30px rgba(37,99,235,.30); }
          50% { box-shadow: 0 12px 42px rgba(124,58,237,.48); }
        }

        .brand-name {
          font-size: 1.05rem;
          font-weight: 800;
          letter-spacing: -.02em;
        }

        .brand-version {
          color: #64748b;
          font-size: .72rem;
          margin-top: 2px;
        }

        .hero-content {
          max-width: 520px;
        }

        .eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 7px;
          padding: 7px 12px;
          border-radius: 999px;
          border: 1px solid rgba(96,165,250,.20);
          background: rgba(59,130,246,.07);
          color: #93c5fd;
          font-size: .75rem;
          font-weight: 700;
          margin-bottom: 20px;
        }

        .hero-title {
          margin: 0;
          font-size: clamp(2.3rem, 5vw, 4rem);
          line-height: 1.04;
          letter-spacing: -.045em;
          font-weight: 850;
        }

        .hero-gradient {
          background: linear-gradient(100deg, #60a5fa, #a78bfa, #f472b6, #60a5fa);
          background-size: 250% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shine 6s linear infinite;
        }

        @keyframes shine {
          to { background-position: 250% center; }
        }

        .hero-description {
          color: #94a3b8;
          line-height: 1.75;
          font-size: .98rem;
          max-width: 500px;
          margin: 22px 0 28px;
        }

        .intelligence-list {
          display: grid;
          grid-template-columns: repeat(2, minmax(0,1fr));
          gap: 10px;
        }

        .intelligence-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px;
          border: 1px solid rgba(148,163,184,.10);
          border-radius: 14px;
          background: rgba(15,23,42,.48);
          color: #cbd5e1;
          font-size: .78rem;
          transition: .25s ease;
        }

        .intelligence-item:hover {
          transform: translateY(-2px);
          border-color: rgba(96,165,250,.28);
          background: rgba(30,41,59,.55);
        }

        .mini-icon {
          width: 30px;
          height: 30px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(59,130,246,.10);
          color: #60a5fa;
          flex-shrink: 0;
        }

        .brand-footer {
          color: #475569;
          font-size: .72rem;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .form-panel {
          padding: 42px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          background: rgba(2,6,23,.38);
        }

        .secure-badge {
          width: 52px;
          height: 52px;
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, rgba(37,99,235,.18), rgba(124,58,237,.18));
          border: 1px solid rgba(96,165,250,.18);
          color: #60a5fa;
          margin-bottom: 20px;
        }

        .form-title {
          margin: 0;
          font-size: 1.8rem;
          font-weight: 800;
          letter-spacing: -.03em;
        }

        .form-subtitle {
          margin: 8px 0 26px;
          color: #64748b;
          font-size: .83rem;
          line-height: 1.55;
        }

        .error-box {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 16px;
          padding: 11px 13px;
          border-radius: 12px;
          color: #fca5a5;
          background: rgba(220,38,38,.10);
          border: 1px solid rgba(248,113,113,.20);
          font-size: .78rem;
        }

        .field {
          margin-bottom: 16px;
        }

        .field-label {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-bottom: 7px;
          color: #cbd5e1;
          font-size: .78rem;
          font-weight: 650;
        }

        .input-wrap {
          position: relative;
        }

        .input-icon {
          position: absolute;
          left: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #64748b;
          pointer-events: none;
          transition: color .2s;
        }

        /* Dark, solid inputs: prevents browser/OS light autofill styling */
        .field-input,
        .field-input[type="text"],
        .field-input[type="password"] {
          width: 100%;
          height: 48px;
          padding: 0 44px;
          border-radius: 13px;
          border: 1px solid rgba(96,165,250,.18);
          outline: none;
          color: #f8fafc !important;
          -webkit-text-fill-color: #f8fafc !important;
          background-color: #0b1426 !important;
          background: #0b1426 !important;
          caret-color: #60a5fa;
          font-size: .88rem;
          transition: .22s ease;
          appearance: none;
          -webkit-appearance: none;
        }

        .field-input::placeholder {
          color: #64748b !important;
          opacity: 1;
        }

        .field-input:hover {
          border-color: rgba(96,165,250,.38);
          background-color: #0e1a2f !important;
          background: #0e1a2f !important;
        }

        .field-input:focus {
          border-color: #3b82f6;
          color: #ffffff !important;
          -webkit-text-fill-color: #ffffff !important;
          background-color: #0b1426 !important;
          background: #0b1426 !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,.14);
        }

        /* Chrome/Edge/Safari autofill can force a white input background. */
        .field-input:-webkit-autofill,
        .field-input:-webkit-autofill:hover,
        .field-input:-webkit-autofill:focus,
        .field-input:-webkit-autofill:active {
          -webkit-text-fill-color: #f8fafc !important;
          -webkit-box-shadow: 0 0 0 1000px #0b1426 inset !important;
          box-shadow: 0 0 0 1000px #0b1426 inset !important;
          background-color: #0b1426 !important;
          background: #0b1426 !important;
          caret-color: #60a5fa;
          transition: background-color 9999s ease-out 0s;
        }

        /* Edge/Chrome password manager overlays */
        .field-input:autofill {
          background-color: #0b1426 !important;
          color: #f8fafc !important;
        }

        .input-wrap:focus-within .input-icon {
          color: #60a5fa;
        }

        .password-toggle {
          position: absolute;
          right: 9px;
          top: 50%;
          transform: translateY(-50%);
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 9px;
          color: #64748b;
          background: transparent;
          cursor: pointer;
          transition: .2s;
        }

        .password-toggle:hover {
          color: #93c5fd;
          background: rgba(59,130,246,.10);
        }

        .login-button {
          position: relative;
          width: 100%;
          height: 50px;
          margin-top: 6px;
          border: 0;
          border-radius: 14px;
          color: white;
          background: linear-gradient(100deg, #2563eb, #7c3aed);
          font-size: .88rem;
          font-weight: 750;
          cursor: pointer;
          overflow: hidden;
          box-shadow: 0 14px 30px rgba(37,99,235,.22);
          transition: .25s ease;
        }

        .login-button::before {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(100deg, transparent, rgba(255,255,255,.20), transparent);
          transform: translateX(-100%);
          transition: transform .55s ease;
        }

        .login-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 18px 38px rgba(37,99,235,.32);
        }

        .login-button:hover::before {
          transform: translateX(100%);
        }

        .login-button:active {
          transform: translateY(0);
        }

        .login-button:disabled {
          opacity: .75;
          cursor: wait;
        }

        .login-button-content {
          position: relative;
          z-index: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,.35);
          border-top-color: white;
          border-radius: 50%;
          animation: spin .7s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .security-note {
          display: flex;
          align-items: flex-start;
          gap: 9px;
          margin-top: 18px;
          padding: 11px 12px;
          border-radius: 12px;
          color: #64748b;
          background: rgba(15,23,42,.42);
          border: 1px solid rgba(148,163,184,.08);
          font-size: .7rem;
          line-height: 1.45;
        }

        .back-button {
          align-self: center;
          display: inline-flex;
          align-items: center;
          gap: 7px;
          margin-top: 22px;
          padding: 7px 10px;
          border: none;
          background: transparent;
          color: #64748b;
          cursor: pointer;
          font-size: .76rem;
          transition: .2s;
        }

        .back-button:hover {
          color: #93c5fd;
          transform: translateX(-2px);
        }

        .status-line {
          display: flex;
          align-items: center;
          gap: 7px;
          margin-top: 18px;
          color: #64748b;
          font-size: .68rem;
        }

        .status-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 10px rgba(34,197,94,.8);
        }

        @media (max-width: 850px) {
          .login-shell {
            grid-template-columns: 1fr;
            max-width: 500px;
          }

          .brand-panel {
            min-height: auto;
            padding: 32px;
            border-right: none;
            border-bottom: 1px solid rgba(148,163,184,.12);
          }

          .hero-content {
            margin-top: 36px;
          }

          .hero-title {
            font-size: 2.5rem;
          }

          .brand-footer {
            margin-top: 35px;
          }

          .form-panel {
            padding: 34px 32px;
          }
        }

        @media (max-width: 480px) {
          .admin-login-page {
            padding: 14px;
          }

          .login-shell {
            border-radius: 22px;
          }

          .brand-panel,
          .form-panel {
            padding: 25px 20px;
          }

          .intelligence-list {
            grid-template-columns: 1fr;
          }

          .hero-title {
            font-size: 2.15rem;
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .orb,
          .brand-mark,
          .hero-gradient,
          .login-shell {
            animation: none !important;
          }

          * {
            scroll-behavior: auto !important;
          }
        }
      `}</style>

      <div className="login-grid" />
      <div className="orb orb-one" />
      <div className="orb orb-two" />
      <div className="orb orb-three" />

      <main className="login-shell">
        {/* LEFT BRAND / PRODUCT PANEL */}
        <section className="brand-panel">
          <div className="brand-top">
            <div className="brand-mark">
              <Droplet size={25} color="#fff" strokeWidth={1.7} />
            </div>

            <div>
              <div className="brand-name">JalRakshak AI </div>
              <div className="brand-version">Water Intelligence Platform</div>
            </div>
          </div>

          <div className="hero-content">
            <div className="eyebrow">
              <Sparkles size={13} />
              REGIONAL WATER COMMAND CENTER
            </div>

            <h1 className="hero-title">
              Intelligent water
              <br />
              <span className="hero-gradient">management.</span>
            </h1>

            <p className="hero-description">
              A unified command center for groundwater monitoring, drought
              intelligence, crop advisory and recharge planning across
              Saurashtra.
            </p>

            <div className="intelligence-list">
              <div className="intelligence-item">
                <span className="mini-icon">
                  <Activity size={16} />
                </span>
                Groundwater Intelligence
              </div>

              <div className="intelligence-item">
                <span className="mini-icon">
                  <CloudRain size={16} />
                </span>
                Drought Early Warning
              </div>

              <div className="intelligence-item">
                <span className="mini-icon">
                  <Waves size={16} />
                </span>
                Recharge Planning
              </div>

              <div className="intelligence-item">
                <span className="mini-icon">
                  <ShieldCheck size={16} />
                </span>
                AI-Assisted Decisions
              </div>
            </div>
          </div>

          <div className="brand-footer">
            <ShieldCheck size={14} />
            Powered by IBM Granite • Saurashtra Water Intelligence
          </div>
        </section>

        {/* RIGHT LOGIN PANEL */}
        <section className="form-panel">
          <div className="secure-badge">
            <Lock size={24} />
          </div>

          <h2 className="form-title">Admin Access</h2>

          <p className="form-subtitle">
            Sign in to access the JalRakshak regional water management
            command center.
          </p>

          {error && (
            <div className="error-box" role="alert">
              <AlertTriangleIcon />
              {error}
            </div>
          )}

          <form onSubmit={handleLogin}>
            {/* USERNAME */}
            <div className="field">
              <label className="field-label" htmlFor="admin-username">
                <User size={14} />
                Username
              </label>

              <div className="input-wrap">
                <User className="input-icon" size={17} />

                <input
                  id="admin-username"
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  onFocus={() => setFocused('username')}
                  onBlur={() => setFocused('')}
                  autoComplete="username"
                  placeholder="Enter admin username"
                  className="field-input"
                  aria-label="Admin username"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="field">
              <label className="field-label" htmlFor="admin-password">
                <Lock size={14} />
                Password
              </label>

              <div className="input-wrap">
                <Lock className="input-icon" size={17} />

                <input
                  id="admin-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused('')}
                  autoComplete="current-password"
                  placeholder="Enter admin password"
                  className="field-input"
                  aria-label="Admin password"
                />

                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff size={17} />
                  ) : (
                    <Eye size={17} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-button"
              disabled={isLoading}
            >
              <span className="login-button-content">
                {isLoading ? (
                  <>
                    <span className="spinner" />
                    Opening Command Center...
                  </>
                ) : (
                  <>
                    <Lock size={16} />
                    Enter Admin Command Center
                    <ChevronRight size={16} />
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="security-note">
            <ShieldCheck
              size={15}
              style={{ color: '#60a5fa', flexShrink: 0, marginTop: 1 }}
            />
            <span>
              Protected administrator area. Demo authentication is enabled
              for the hackathon environment.
            </span>
          </div>

          <div className="status-line">
            <span className="status-dot" />
            JalRakshak services ready
          </div>

          <button
            type="button"
            className="back-button"
            onClick={() => nav('/')}
          >
            <ArrowLeft size={15} />
            Back to Role Selection
          </button>
        </section>
      </main>
    </div>
  );
}

/* Small local icon component keeps the error UI independent of extra imports. */
function AlertTriangleIcon() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
