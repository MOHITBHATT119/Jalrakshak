import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink, Navigate, Link } from 'react-router-dom';
import { Sun, Moon, Menu, X, Sprout, LogOut, User } from 'lucide-react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';

// Existing Pages
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import HydroAtlas from './pages/HydroAtlas';
import GroundwaterExplorer from './pages/GroundwaterExplorer';
import DroughtIntelligence from './pages/DroughtIntelligence';
import CropAdvisor from './pages/CropAdvisor';
import RechargePlanner from './pages/RechargePlanner';
import WaterBudget from './pages/WaterBudget';
import WhatIfSimulator from './pages/WhatIfSimulator';
import CommunityPriority from './pages/CommunityPriority';
import WaterCopilot from './pages/WaterCopilot';
import CommunityReports from './pages/community/CommunityReports';
import DataTrust from './pages/DataTrust';
import Settings from './pages/Settings';
import Reports from './pages/Reports';

// Admin Context & Components
import { AdminAuthProvider } from './context/AdminAuthContext';
import { ReportProvider } from './context/ReportContext';
import { ProtectedAdminRoute } from './components/admin/ProtectedAdminRoute';
import AdminLayout from './components/admin/AdminLayout';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import Alerts from './pages/admin/Alerts';
import Approvals from './pages/admin/Approvals';
import AgentTrace from './pages/admin/AgentTrace';
import FieldReports from './pages/admin/FieldReports';
import Users from './pages/admin/Users';
import Villages from './pages/admin/Villages';
import DataSources from './pages/admin/DataSources';
import ActionPlan from './pages/admin/ActionPlan';
import InterventionImpact from './pages/admin/InterventionImpact';

// Farmer Context & Components
import { FarmerAuthProvider, useFarmerAuth } from './context/FarmerAuthContext';
import ProtectedFarmerRoute from './components/farmer/ProtectedFarmerRoute';
import FarmerLogin from './pages/farmer/FarmerLogin';
import FarmerSignup from './pages/farmer/FarmerSignup';
import FarmerDashboard from './pages/farmer/FarmerDashboard';
import WatsonAssistantChat from './components/common/WatsonAssistantChat';

import { getHealth } from './services/api';
import { Droplet, LayoutDashboard, Map, Waves, CloudRain, Hammer, Lightbulb, Bot, FileText, FlaskConical } from 'lucide-react';

type Mode = 'farmer' | 'community' | 'admin';

const NAV_LINKS = [
  { to: '/dashboard',        icon: <LayoutDashboard size={16}/>, enLabel: 'Dashboard',  guLabel: 'ડૅશબોર્ડ' },
  { to: '/hydro-atlas',      icon: <Map size={16}/>,             enLabel: 'Atlas',       guLabel: 'નકશો' },
  { to: '/groundwater',      icon: <Waves size={16}/>,           enLabel: 'Groundwater', guLabel: 'ભૂગર્ભ જળ' },
  { to: '/drought',          icon: <CloudRain size={16}/>,       enLabel: 'Drought',     guLabel: 'દુષ્કાળ' },
  { to: '/crops',            icon: <Sprout size={16}/>,          enLabel: 'Crops',       guLabel: 'પાક' },
  { to: '/recharge',         icon: <Hammer size={16}/>,          enLabel: 'Recharge',    guLabel: 'રિચાર્જ' },
  { to: '/simulator',        icon: <Lightbulb size={16}/>,       enLabel: 'Simulator',   guLabel: 'શું-જો' },
  { to: '/copilot',          icon: <Bot size={16}/>,             enLabel: 'Copilot',     guLabel: 'સહ-પાઇલોટ' },
  { to: '/community/reports',icon: <FileText size={16}/>,        enLabel: 'Reports',     guLabel: 'રિપોર્ટ' },
] as const;

function TopNav({ mode, setMode, demoMode, lang, setLang }: {
  mode: Mode; setMode: (m: Mode) => void;
  demoMode: boolean; lang: 'en' | 'gu'; setLang: (l: 'en' | 'gu') => void;
}) {
  const t = (en: string, gu: string) => lang === 'gu' ? gu : en;
  const { theme, toggleTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { farmerUser, isAuthenticated: isFarmerAuthenticated, logout: farmerLogout } = useFarmerAuth();

  return (
    <>
      <nav className="top-nav">
        {/* Brand */}
        <div className="top-nav-brand">
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h2 style={{display:'flex', alignItems:'center', gap:'8px', margin: 0}}>
              <Droplet color="#60a5fa" /> JalRakshak
            </h2>
          </Link>
          {demoMode && <span className="badge badge-demo">DEMO</span>}
        </div>

        {/* Desktop links */}
        <div className="top-nav-links">
          {NAV_LINKS.map(l => (
            <NavLink key={l.to} to={l.to} style={{display:'flex', gap:'6px', alignItems:'center'}}>
              {l.icon} {t(l.enLabel, l.guLabel)}
            </NavLink>
          ))}
        </div>

        {/* Controls */}
        <div className="top-nav-controls" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Farmer Profile Pill or Quick Link */}
          {isFarmerAuthenticated && farmerUser ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <NavLink
                to="/farmer/dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  borderRadius: 20,
                  padding: '4px 10px',
                  color: '#34d399',
                  textDecoration: 'none',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                }}
              >
                <Sprout size={13} />
                <span className="hide-xs">{farmerUser.name}</span>
              </NavLink>
              <button
                onClick={farmerLogout}
                title="Log out from farmer account"
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <NavLink
              to="/farmer/login"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(16, 185, 129, 0.12)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                borderRadius: 8,
                padding: '4px 9px',
                color: '#34d399',
                textDecoration: 'none',
                fontSize: '0.78rem',
                fontWeight: 600,
              }}
            >
              <Sprout size={13} />
              <span className="hide-xs">{lang === 'gu' ? 'ખેડૂત લૉગિન' : 'Farmer'}</span>
            </NavLink>
          )}

          {/* Theme Toggle */}
          <button onClick={toggleTheme} className="theme-toggle-btn"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            <span className="hide-xs">{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          {/* Language Toggle */}
          <button
            onClick={() => setLang(lang === 'en' ? 'gu' : 'en')}
            title={lang === 'en' ? 'Switch to Gujarati' : 'Switch to English'}
            style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              padding: '5px 10px', borderRadius: 6, cursor: 'pointer',
              background: 'rgba(59,130,246,0.15)',
              border: '1px solid rgba(59,130,246,0.4)',
              color: '#93c5fd', fontWeight: 700, fontSize: '0.82rem',
              letterSpacing: '0.05em', transition: 'all 0.2s',
            }}
          >
            {lang === 'en' ? 'EN' : 'ગુ'}
          </button>

          {/* Hamburger — only visible on mobile via CSS */}
          <button
            className="nav-hamburger"
            onClick={() => setMobileOpen(o => !o)}
            aria-label="Open navigation"
          >
            <Menu size={22} />
          </button>
        </div>
      </nav>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="mobile-nav-drawer open">
          <div className="mobile-nav-backdrop" onClick={() => setMobileOpen(false)} />
          <div className="mobile-nav-panel">
            <div className="mobile-nav-header">
              <Link to="/" onClick={() => setMobileOpen(false)} style={{ textDecoration: 'none', color: 'inherit' }}>
                <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Droplet color="#60a5fa" size={20} /> JalRakshak
                </h2>
              </Link>
              <button onClick={() => setMobileOpen(false)}
                style={{ background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)', display:'flex' }}>
                <X size={22} />
              </button>
            </div>
            {NAV_LINKS.map(l => (
              <NavLink key={l.to} to={l.to} onClick={() => setMobileOpen(false)}
                style={{display:'flex', gap:'10px', alignItems:'center'}}>
                {l.icon} {t(l.enLabel, l.guLabel)}
              </NavLink>
            ))}
            <div style={{ borderTop: '1px solid var(--border-glass)', marginTop: 12, paddingTop: 12 }}>
              <NavLink to="/farmer/dashboard" onClick={() => setMobileOpen(false)}
                style={{display:'flex', gap:'10px', alignItems:'center', color: '#34d399'}}>
                <Sprout size={16} /> Farmer Hub
              </NavLink>
              <NavLink to="/admin/login" onClick={() => setMobileOpen(false)}
                style={{display:'flex', gap:'10px', alignItems:'center', color: '#3b82f6', marginTop: 8}}>
                <User size={16} /> Admin Command
              </NavLink>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function MainAppLayout({ mode, setMode, lang, setLang, demoMode, ctx }: any) {
  return (
    <div className="app-layout">
      <TopNav mode={mode} setMode={setMode} demoMode={demoMode} lang={lang} setLang={setLang} />
      <div className="main-content">
        {demoMode && (
          <div className="demo-banner">
            <FlaskConical size={15} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 6 }} /><strong>DEMO MODE</strong> — IBM Granite AI unavailable. Showing deterministic calculations and safe fallback responses. Add WATSONX_API_KEY to .env to enable full AI.
          </div>
        )}
        <Routes>
          <Route path="/dashboard" element={<Dashboard {...ctx} />} />
          <Route path="/hydro-atlas" element={<HydroAtlas {...ctx} />} />
          <Route path="/groundwater" element={<GroundwaterExplorer {...ctx} />} />
          <Route path="/drought" element={<DroughtIntelligence {...ctx} />} />
          <Route path="/drought-intelligence" element={<DroughtIntelligence {...ctx} />} />
          <Route path="/crops" element={<CropAdvisor {...ctx} />} />
          <Route path="/crop-advisor" element={<CropAdvisor {...ctx} />} />
          <Route path="/recharge" element={<RechargePlanner {...ctx} />} />
          <Route path="/water-budget" element={<WaterBudget {...ctx} />} />
          <Route path="/simulator" element={<WhatIfSimulator {...ctx} />} />
          <Route path="/what-if" element={<WhatIfSimulator {...ctx} />} />
          <Route path="/community" element={<CommunityPriority {...ctx} />} />
          <Route path="/community-priority" element={<CommunityPriority {...ctx} />} />
          <Route path="/copilot" element={<WaterCopilot {...ctx} />} />
          <Route path="/water-copilot" element={<WaterCopilot {...ctx} />} />
          <Route path="/community/reports" element={<CommunityReports {...ctx} />} />
          <Route path="/data-trust" element={<DataTrust {...ctx} />} />
          <Route path="/settings" element={<Settings {...ctx} />} />
          <Route path="/*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  const [mode, setMode] = useState<Mode>('community');
  const [lang, setLang] = useState<'en' | 'gu'>('en');
  const [demoMode, setDemoMode] = useState(true);
  const [selectedVillage, setSelectedVillage] = useState('V001');

  useEffect(() => {
    getHealth().then(h => setDemoMode(h.demo_mode)).catch(() => setDemoMode(true));
  }, []);

  const ctx = { mode, lang, selectedVillage, setSelectedVillage, demoMode };

  return (
    <ThemeProvider>
      <LanguageProvider>
        <AdminAuthProvider>
          <FarmerAuthProvider>
            <ReportProvider>
              <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                <Routes>
                  <Route path="/" element={<LandingPage setMode={setMode} />} />
                  
                  {/* Farmer Auth & Portal Routes */}
                  <Route path="/farmer/login" element={<FarmerLogin />} />
                  <Route path="/farmer/signup" element={<FarmerSignup />} />
                  <Route
                    path="/farmer/dashboard"
                    element={
                      <ProtectedFarmerRoute>
                        <FarmerDashboard />
                      </ProtectedFarmerRoute>
                    }
                  />

                  {/* Admin Routes */}
                  <Route path="/admin/login" element={<AdminLogin />} />
                  
                  <Route element={<ProtectedAdminRoute />}>
                    <Route element={<AdminLayout />}>
                      <Route path="/admin/dashboard" element={<AdminDashboard />} />
                      <Route path="/admin/hydro-atlas" element={<HydroAtlas {...ctx} />} />
                      <Route path="/admin/alerts" element={<Alerts />} />
                      <Route path="/admin/groundwater" element={<GroundwaterExplorer {...ctx} />} />
                      <Route path="/admin/drought" element={<DroughtIntelligence {...ctx} />} />
                      <Route path="/admin/water-budget" element={<WaterBudget {...ctx} />} />
                      <Route path="/admin/what-if" element={<WhatIfSimulator {...ctx} />} />
                      <Route path="/admin/crop-advisor" element={<CropAdvisor {...ctx} />} />
                      <Route path="/admin/recharge-planner" element={<RechargePlanner {...ctx} />} />
                      <Route path="/admin/community-priority" element={<CommunityPriority {...ctx} />} />
                      <Route path="/admin/intervention-impact" element={<InterventionImpact />} />
                      <Route path="/admin/action-plan" element={<ActionPlan />} />
                      <Route path="/admin/approvals" element={<Approvals />} />
                      <Route path="/admin/copilot" element={<WaterCopilot {...ctx} />} />
                      <Route path="/admin/agent-trace" element={<AgentTrace />} />
                      <Route path="/admin/reports" element={<Reports {...ctx} />} />
                      <Route path="/admin/data-trust" element={<DataTrust {...ctx} />} />
                      <Route path="/admin/field-reports" element={<FieldReports />} />
                      <Route path="/admin/users" element={<Users />} />
                      <Route path="/admin/villages" element={<Villages />} />
                      <Route path="/admin/data-sources" element={<DataSources />} />
                      <Route path="/admin/settings" element={<Settings {...ctx} />} />
                      <Route path="/admin/*" element={<Navigate to="/admin/dashboard" replace />} />
                    </Route>
                  </Route>

                  {/* Regular App Routes */}
                  <Route path="/*" element={<MainAppLayout mode={mode} setMode={setMode} lang={lang} setLang={setLang} demoMode={demoMode} ctx={ctx} />} />
                </Routes>
                {/* Floating IBM Watson Assistant Chatbot */}
                <WatsonAssistantChat />
              </Router>
            </ReportProvider>
          </FarmerAuthProvider>
        </AdminAuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}

export default App;
