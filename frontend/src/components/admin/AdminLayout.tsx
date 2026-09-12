import React, { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Droplet, LayoutDashboard, Map as MapIcon, Bell, Waves, CloudRain,
  PieChart, FlaskConical, Sprout, Hammer, Users, TrendingUp, ClipboardList,
  Bot, BrainCircuit, FileText, CheckCircle, ShieldCheck, MapPin, Database,
  Settings, Search, Menu, X, Sun, Moon, ChevronLeft, ChevronDown, Globe,
} from 'lucide-react';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

// ─── hook: track window width ──────────────────────────────────────────────
function useWindowWidth() {
  const [w, setW] = useState(window.innerWidth);
  useEffect(() => {
    const onResize = () => setW(window.innerWidth);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return w;
}

// ─── nav items (labels resolved at render time from translations) ───────────
type NavItem =
  | { section: string }
  | { to: string; icon: React.ReactNode; labelKey: string };

const NAV_ITEMS: NavItem[] = [
  { section: 'overview' },
  { to: '/admin/dashboard',          icon: <LayoutDashboard size={18} />, labelKey: 'dashboard' },
  { to: '/admin/hydro-atlas',         icon: <MapIcon size={18} />,         labelKey: 'hydroAtlas' },
  { to: '/admin/alerts',              icon: <Bell size={18} />,            labelKey: 'alerts' },
  { section: 'waterIntelligence' },
  { to: '/admin/groundwater',         icon: <Waves size={18} />,           labelKey: 'groundwaterExplorer' },
  { to: '/admin/drought',             icon: <CloudRain size={18} />,       labelKey: 'droughtMonitor' },
  { to: '/admin/water-budget',        icon: <PieChart size={18} />,        labelKey: 'waterBudget' },
  { to: '/admin/what-if',             icon: <FlaskConical size={18} />,    labelKey: 'whatIfSimulator' },
  { section: 'agriculture' },
  { to: '/admin/crop-advisor',        icon: <Sprout size={18} />,          labelKey: 'cropAdvisor' },
  { section: 'interventions' },
  { to: '/admin/recharge-planner',    icon: <Hammer size={18} />,          labelKey: 'rechargePlanner' },
  { to: '/admin/community-priority',  icon: <Users size={18} />,           labelKey: 'communityPriority' },
  { to: '/admin/intervention-impact', icon: <TrendingUp size={18} />,      labelKey: 'interventionImpact' },
  { to: '/admin/action-plan',         icon: <ClipboardList size={18} />,   labelKey: 'actionPlans' },
  { section: 'aiIntelligence' },
  { to: '/admin/copilot',             icon: <Bot size={18} />,             labelKey: 'waterCopilot' },
  { to: '/admin/agent-trace',         icon: <BrainCircuit size={18} />,    labelKey: 'agentTrace' },
  { to: '/admin/reports',             icon: <FileText size={18} />,        labelKey: 'aiReports' },
  { to: '/admin/approvals',           icon: <CheckCircle size={18} />,     labelKey: 'approvals' },
  { section: 'dataAndField' },
  { to: '/admin/data-trust',          icon: <ShieldCheck size={18} />,     labelKey: 'dataTrust' },
  { section: 'administration' },
  { to: '/admin/users',               icon: <Users size={18} />,           labelKey: 'farmersAndUsers' },
  { to: '/admin/villages',            icon: <MapPin size={18} />,          labelKey: 'villages' },
  { to: '/admin/data-sources',        icon: <Database size={18} />,        labelKey: 'dataSources' },
  { to: '/admin/settings',            icon: <Settings size={18} />,        labelKey: 'settings' },
];

// ─── SidebarContent (shared by desktop sidebar + mobile drawer) ───────────
function SidebarContent({
  collapsed, onClose, theme, adminRole, handleLogout,
}: {
  collapsed: boolean; onClose?: () => void;
  theme: 'dark' | 'light'; adminRole: string; handleLogout: () => void;
}) {
  const { t } = useLanguage();
  const sectionStyle: React.CSSProperties = {
    fontSize: '0.7rem', fontWeight: 700, color: '#64748b',
    padding: '14px 15px 4px', textTransform: 'uppercase', letterSpacing: '0.08em',
  };
  const navItemStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 15px',
    color: isActive
      ? (theme === 'light' ? '#1d4ed8' : '#fff')
      : (theme === 'light' ? '#374151' : '#94a3b8'),
    textDecoration: 'none',
    background: isActive
      ? (theme === 'light' ? 'rgba(37,99,235,0.08)' : 'rgba(59,130,246,0.2)')
      : 'transparent',
    borderLeft: isActive ? '3px solid #3b82f6' : '3px solid transparent',
    fontSize: '0.88rem', transition: 'all 0.2s', whiteSpace: 'nowrap',
  });

  return (
    <>
      {/* Logo row */}
      <div style={{
        padding: '16px 15px', display: 'flex', alignItems: 'center',
        justifyContent: collapsed ? 'center' : 'space-between',
        gap: 10, borderBottom: `1px solid ${theme === 'light' ? 'rgba(0,0,0,0.08)' : '#334155'}`,
        flexShrink: 0,
      }}>
        <NavLink
          to="/"
          title="Return to Home page"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
            color: 'inherit',
            cursor: 'pointer',
          }}
        >
          <Droplet size={26} color="#60a5fa" className="floating-icon" style={{ flexShrink: 0 }} />
          {!collapsed && (
            <span style={{ fontWeight: 800, fontSize: '1rem', whiteSpace: 'nowrap',
              color: theme === 'light' ? '#0f172a' : '#f8fafc' }}>
              JalRakshak AI
            </span>
          )}
        </NavLink>
        {/* Close button on mobile drawer */}
        {onClose && (
          <button onClick={onClose} style={{
            background: 'none', border: 'none', cursor: 'pointer', padding: 4,
            color: theme === 'light' ? '#475569' : '#94a3b8', display: 'flex',
          }}>
            <X size={20} />
          </button>
        )}
      </div>

      {/* Nav items */}
      <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {NAV_ITEMS.map((item, idx) => {
          if ('section' in item) {
            return !collapsed ? (
              <div key={idx} style={sectionStyle}>{t(item.section as any)}</div>
            ) : null;
          }
          const label = t(item.labelKey as any);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              title={label}
              onClick={onClose}
              style={({ isActive }) => navItemStyle(isActive)}
            >
              <span style={{ width: 20, flexShrink: 0, display: 'flex', alignItems: 'center' }}>
                {item.icon}
              </span>
              {!collapsed && label}
            </NavLink>
          );
        })}
      </div>

      {/* Profile bottom */}
      <div style={{
        padding: '12px 15px',
        borderTop: `1px solid ${theme === 'light' ? 'rgba(0,0,0,0.08)' : '#334155'}`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: collapsed ? 0 : 8 }}>
          <div style={{
            width: 32, height: 32, borderRadius: '50%', background: '#3b82f6',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 'bold', color: '#fff', flexShrink: 0, fontSize: '0.88rem',
          }}>A</div>
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: theme === 'light' ? '#0f172a' : '#f8fafc', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {t('administrator')}
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {adminRole}
              </div>
            </div>
          )}
        </div>
        {!collapsed && (
          <button onClick={handleLogout} style={{
            background: 'rgba(239,68,68,0.1)', color: '#ef4444',
            border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6,
            padding: '6px', cursor: 'pointer', fontSize: '0.78rem',
            width: '100%', fontWeight: 600,
          }}>{t('logout')}</button>
        )}
      </div>
    </>
  );
}

// ─── MAIN LAYOUT ────────────────────────────────────────────────────────────
export default function AdminLayout() {
  const windowWidth = useWindowWidth();
  const isMobile = windowWidth < 768;
  const isTablet = windowWidth >= 768 && windowWidth < 1024;

  // On mobile: sidebar hidden by default; on desktop: expanded
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  const { logout, adminRole } = useAdminAuth();
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const nav = useNavigate();
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => { setMobileSidebarOpen(false); }, [location.pathname]);

  // Close language dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-collapse on resize to mobile
  useEffect(() => {
    if (isMobile) { setSidebarOpen(false); setMobileSidebarOpen(false); }
    else if (!isTablet) setSidebarOpen(true);
  }, [isMobile, isTablet]);

  const handleLogout = () => { logout(); nav('/admin/login'); };

  const pageName = location.pathname.replace('/admin/', '').replace(/-/g, ' ');

  const topbarBg = theme === 'light' ? '#ffffff' : '#1e293b';
  const topbarBorder = theme === 'light' ? 'rgba(0,0,0,0.08)' : '#334155';
  const textColor = theme === 'light' ? '#0f172a' : '#f8fafc';
  const mutedColor = theme === 'light' ? '#475569' : '#94a3b8';
  const sidebarBg = theme === 'light' ? '#ffffff' : '#1e293b';
  const contentBg = theme === 'light' ? '#f1f5f9' : '#0f172a';

  // Collapsed = icon-only on tablet or when manually toggled on desktop
  const sidebarCollapsed = isMobile ? false : (isTablet ? !sidebarOpen : !sidebarOpen);

  return (
    <div style={{
      display: 'flex', height: '100vh', width: '100vw',
      background: theme === 'light' ? '#f1f5f9' : '#0f172a',
      color: textColor, overflow: 'hidden',
    }}>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {isMobile && mobileSidebarOpen && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 200,
            background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(2px)',
          }}
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ── SIDEBAR (desktop/tablet always present; mobile: drawer) ── */}
      <div
        id="admin-sidebar"
        style={{
          width: isMobile
            ? 260
            : (sidebarCollapsed ? 60 : 240),
          background: sidebarBg,
          borderRight: `1px solid ${topbarBorder}`,
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.25s ease, transform 0.25s ease',
          flexShrink: 0,
          // Mobile: absolute overlay drawer
          ...(isMobile ? {
            position: 'fixed',
            top: 0, left: 0, bottom: 0,
            zIndex: 210,
            transform: mobileSidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
            boxShadow: mobileSidebarOpen ? '4px 0 24px rgba(0,0,0,0.4)' : 'none',
          } : {}),
        }}
      >
        <SidebarContent
          collapsed={!isMobile && sidebarCollapsed}
          onClose={isMobile ? () => setMobileSidebarOpen(false) : undefined}
          theme={theme}
          adminRole={adminRole}
          handleLogout={handleLogout}
        />
      </div>

      {/* ── MAIN COLUMN ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        {/* ── TOPBAR ── */}
        <div
          id="admin-topbar"
          style={{
            height: 60, background: topbarBg,
            borderBottom: `1px solid ${topbarBorder}`,
            display: 'flex', alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 16px', position: 'relative', flexShrink: 0,
          }}
        >
          {/* Left: hamburger + page title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <button
              onClick={() => {
                if (isMobile) setMobileSidebarOpen(o => !o);
                else setSidebarOpen(o => !o);
              }}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                color: mutedColor, display: 'flex', alignItems: 'center',
                padding: 4, borderRadius: 6, flexShrink: 0,
              }}
              title="Toggle sidebar"
            >
              <Menu size={22} />
            </button>
            <div style={{
              fontWeight: 700, fontSize: isMobile ? '0.95rem' : '1.05rem',
              textTransform: 'capitalize', color: textColor,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>
              {pageName}
            </div>
          </div>

          {/* Right: actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 10 : 16, flexShrink: 0 }}>
            {!isMobile && (
              <span style={{ cursor: 'pointer', color: mutedColor, display: 'flex' }}>
                <Search size={18} />
              </span>
            )}
            <span style={{ cursor: 'pointer', color: mutedColor, display: 'flex' }}>
              <Bell size={18} />
            </span>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="theme-toggle-btn"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
              {!isMobile && (theme === 'dark' ? 'Light' : 'Dark')}
            </button>

            {/* Language Switcher */}
            <div ref={langRef} style={{ position: 'relative' }}>
              <button
                onClick={() => { setLangOpen(o => !o); setProfileOpen(false); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  background: langOpen ? (theme === 'light' ? 'rgba(59,130,246,0.1)' : 'rgba(59,130,246,0.15)') : 'none',
                  border: `1px solid ${langOpen ? 'rgba(59,130,246,0.5)' : 'transparent'}`,
                  borderRadius: 6, cursor: 'pointer', padding: '5px 9px',
                  color: '#3b82f6', fontWeight: 700, fontSize: '0.82rem',
                  transition: 'all 0.15s',
                }}
                title="Switch language"
              >
                <Globe size={14} />
                {lang === 'en' ? 'EN' : 'ગુ'}
                <ChevronDown size={11} style={{ transition: 'transform 0.15s', transform: langOpen ? 'rotate(180deg)' : 'none' }} />
              </button>

              {langOpen && (
                <div style={{
                  position: 'absolute', top: 36, right: 0,
                  background: topbarBg, border: `1px solid ${topbarBorder}`,
                  borderRadius: 8, padding: 4, zIndex: 400,
                  boxShadow: theme === 'light' ? '0 8px 20px rgba(0,0,0,0.1)' : '0 8px 20px rgba(0,0,0,0.45)',
                  minWidth: 130,
                }}>
                  {([
                    { code: 'en', label: 'English', native: 'English' },
                    { code: 'gu', label: 'Gujarati', native: 'ગુજરાતી' },
                  ] as const).map(opt => (
                    <button
                      key={opt.code}
                      onClick={() => { setLang(opt.code); setLangOpen(false); }}
                      style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        width: '100%', background: lang === opt.code
                          ? (theme === 'light' ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.15)')
                          : 'none',
                        border: 'none', borderRadius: 5, padding: '8px 12px',
                        cursor: 'pointer', textAlign: 'left', gap: 10,
                        color: lang === opt.code ? '#3b82f6' : textColor,
                        fontWeight: lang === opt.code ? 700 : 500,
                        fontSize: '0.84rem',
                      }}
                    >
                      <span>{opt.native}</span>
                      {lang === opt.code && (
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#3b82f6', flexShrink: 0 }} />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Admin menu */}
            <div
              style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
              onClick={() => { setProfileOpen(o => !o); setLangOpen(false); }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: '50%', background: '#3b82f6',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 800, color: '#fff', fontSize: '0.82rem', flexShrink: 0,
              }}>A</div>
              {!isMobile && <span style={{ fontSize: '0.82rem', color: textColor, display: 'inline-flex', alignItems: 'center', gap: 3 }}>{t('admin')} <ChevronDown size={12} /></span>}
            </div>
          </div>

          {/* Profile Dropdown */}
          {profileOpen && (
            <div style={{
              position: 'absolute', top: 54, right: 12,
              background: topbarBg, border: `1px solid ${topbarBorder}`,
              borderRadius: 10, padding: 10, zIndex: 300,
              boxShadow: theme === 'light'
                ? '0 10px 24px rgba(0,0,0,0.12)'
                : '0 10px 24px rgba(0,0,0,0.5)',
              minWidth: 180,
            }}>
              <div style={{ padding: '6px 10px', borderBottom: `1px solid ${topbarBorder}`, marginBottom: 6 }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: textColor }}>{t('administrator')}</div>
                <div style={{ fontSize: '0.75rem', color: mutedColor }}>{t('waterAdmin')}</div>
              </div>
              {[
                { labelKey: 'adminDashboard' as const, action: () => { nav('/admin/dashboard'); setProfileOpen(false); } },
                { labelKey: 'settings' as const,       action: () => { nav('/admin/settings');   setProfileOpen(false); } },
              ].map(({ labelKey, action }) => (
                <button key={labelKey} onClick={action} style={{
                  display: 'block', width: '100%', background: 'none', border: 'none',
                  color: textColor, padding: '8px 10px', textAlign: 'left',
                  cursor: 'pointer', borderRadius: 4, fontSize: '0.88rem',
                }}>
                  {t(labelKey)}
                </button>
              ))}
              <button onClick={handleLogout} style={{
                display: 'block', width: '100%', background: 'none', border: 'none',
                color: '#ef4444', padding: '8px 10px', textAlign: 'left',
                cursor: 'pointer', borderRadius: 4, fontSize: '0.88rem',
              }}>
                {t('logout')}
              </button>
            </div>
          )}
        </div>

        {/* ── CONTENT AREA ── */}
        <div
          id="admin-content"
          style={{
            flex: 1, overflowY: 'auto',
            padding: isMobile ? '12px 10px' : '20px',
            background: contentBg,
          }}
          onClick={() => profileOpen && setProfileOpen(false)}
        >
          <Outlet />
        </div>
      </div>
    </div>
  );
}
