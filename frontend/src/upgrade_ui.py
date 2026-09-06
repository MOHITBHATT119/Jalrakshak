import os
import re

base_dir = r"d:\DARSHAK\IBM\PROJECT\jalrakshak-ai\frontend\src"

# 1. Update index.css
css_path = os.path.join(base_dir, "index.css")
with open(css_path, "r", encoding="utf-8") as f:
    css = f.read()

premium_css = """
/* Premium Animations */
@keyframes gradientBG {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
  100% { transform: translateY(0px); }
}
@keyframes pulseGlowPremium {
  0% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.4); }
  50% { box-shadow: 0 0 30px rgba(59, 130, 246, 0.8), 0 0 10px rgba(139, 92, 246, 0.6); }
  100% { box-shadow: 0 0 15px rgba(59, 130, 246, 0.4); }
}

.animated-gradient-bg {
  background: linear-gradient(-45deg, #0a0e17, #1e3a5f, #0f2744, #0f172a);
  background-size: 400% 400%;
  animation: gradientBG 15s ease infinite;
}

.floating-icon {
  animation: float 4s ease-in-out infinite;
}

.premium-card {
  position: relative;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.premium-card::before {
  content: '';
  position: absolute;
  top: 0; left: -100%; width: 50%; height: 100%;
  background: linear-gradient(to right, transparent, rgba(255,255,255,0.1), transparent);
  transform: skewX(-25deg);
  transition: all 0.75s;
}
.premium-card:hover::before {
  left: 125%;
}
.premium-card:hover {
  transform: translateY(-5px) scale(1.02);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4), 0 0 15px rgba(59, 130, 246, 0.3);
  border-color: rgba(96, 165, 250, 0.5);
}

.icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
"""
if "premium-card" not in css:
    with open(css_path, "a", encoding="utf-8") as f:
        f.write("\n" + premium_css)


# 2. Update AdminLogin.tsx
admin_login_path = os.path.join(base_dir, "pages", "admin", "AdminLogin.tsx")
with open(admin_login_path, "r", encoding="utf-8") as f:
    admin_login = f.read()

admin_login = admin_login.replace(
    "import { useNavigate } from 'react-router-dom';",
    "import { useNavigate } from 'react-router-dom';\nimport { Droplet, Eye, EyeOff, Lock, User } from 'lucide-react';"
)
admin_login = admin_login.replace(
    "<div style={{ minHeight: '100vh', background: 'linear-gradient(180deg, #1e3a5f 0%, #0f2744 60%, #0a1929 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>",
    "<div className=\"animated-gradient-bg\" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>"
)
admin_login = admin_login.replace(
    "<div style={{ fontSize: '3rem', marginBottom: '10px' }}>💧</div>",
    "<div className=\"floating-icon\" style={{ display: 'flex', justifyContent: 'center', marginBottom: '15px', color: '#60a5fa' }}><Droplet size={56} strokeWidth={1.5} /></div>"
)
admin_login = admin_login.replace(
    "<label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#93c5fd' }}>Username</label>",
    "<label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', marginBottom: '5px', color: '#93c5fd' }}><User size={14}/> Username</label>"
)
admin_login = admin_login.replace(
    "<label style={{ display: 'block', fontSize: '0.85rem', marginBottom: '5px', color: '#93c5fd' }}>Password</label>",
    "<label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem', marginBottom: '5px', color: '#93c5fd' }}><Lock size={14}/> Password</label>"
)
admin_login = admin_login.replace(
    "<button type=\"button\" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '32px', background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer' }}>👁</button>",
    "<button type=\"button\" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '10px', top: '32px', background: 'none', border: 'none', color: '#93c5fd', cursor: 'pointer' }}>{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>"
)
admin_login = admin_login.replace(
    "border: '1px solid rgba(255, 255, 255, 0.1)'",
    "border: '1px solid rgba(255, 255, 255, 0.15)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'"
)
with open(admin_login_path, "w", encoding="utf-8") as f:
    f.write(admin_login)


# 3. Update AdminLayout.tsx
admin_layout_path = os.path.join(base_dir, "components", "admin", "AdminLayout.tsx")
with open(admin_layout_path, "r", encoding="utf-8") as f:
    admin_layout = f.read()

if "lucide-react" not in admin_layout:
    admin_layout = admin_layout.replace(
        "import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';",
        "import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';\nimport { Droplet, LayoutDashboard, Map as MapIcon, Bell, Waves, CloudRain, PieChart, FlaskConical, Sprout, Hammer, Users, TrendingUp, ClipboardList, Bot, BrainCircuit, FileText, CheckCircle, ShieldCheck, MapPin, Database, Settings, Search, LogOut, Menu } from 'lucide-react';"
    )
    admin_layout = admin_layout.replace("<span style={{ fontSize: '1.5rem' }}>💧</span>", "<Droplet size={28} color=\"#60a5fa\" className=\"floating-icon\" />")
    
    # Replace sidebar icons
    replacements = {
        "🏠": "<LayoutDashboard size={18} />",
        "🗺️": "<MapIcon size={18} />",
        "🔔": "<Bell size={18} />",
        "💧": "<Waves size={18} />",
        "🌦️": "<CloudRain size={18} />",
        "📊": "<PieChart size={18} />",
        "🔬": "<FlaskConical size={18} />",
        "🌾": "<Sprout size={18} />",
        "💦": "<Hammer size={18} />",
        "🏘️": "<Users size={18} />",
        "📈": "<TrendingUp size={18} />",
        "📋": "<ClipboardList size={18} />",
        "🤖": "<Bot size={18} />",
        "🧠": "<BrainCircuit size={18} />",
        "📄": "<FileText size={18} />",
        "✅": "<CheckCircle size={18} />",
        "🛡️": "<ShieldCheck size={18} />",
        "📍": "<MapPin size={18} />",
        "👥": "<Users size={18} />",
        "🗄️": "<Database size={18} />",
        "⚙️": "<Settings size={18} />",
        "🔍": "<Search size={18} />",
        "☰": "<Menu size={24} />"
    }
    for old, new in replacements.items():
        admin_layout = admin_layout.replace(f">{old}<", f">{new}<")
        admin_layout = admin_layout.replace(f"'{old}'", f"'{new}'")
        admin_layout = admin_layout.replace(f"\"{old}\"", f"\"{new}\"")

    with open(admin_layout_path, "w", encoding="utf-8") as f:
        f.write(admin_layout)


# 4. Update LandingPage.tsx
landing_path = os.path.join(base_dir, "pages", "LandingPage.tsx")
with open(landing_path, "r", encoding="utf-8") as f:
    landing = f.read()

if "lucide-react" not in landing:
    landing = landing.replace(
        "import { useNavigate } from 'react-router-dom';",
        "import { useNavigate } from 'react-router-dom';\nimport { Droplet, Settings, Users, Wheat, Bot, Activity, CloudRain, Sprout, Hammer, Lightbulb } from 'lucide-react';"
    )
    landing = landing.replace("background: 'linear-gradient(180deg, #1e3a5f 0%, #0f2744 60%, #0a1929 100%)'", "className: 'animated-gradient-bg'")
    landing = landing.replace("<div style={{ minHeight: '100vh', className: 'animated-gradient-bg', color: '#fff', display: 'flex', flexDirection: 'column' }}>", "<div className=\"animated-gradient-bg\" style={{ minHeight: '100vh', color: '#fff', display: 'flex', flexDirection: 'column' }}>")
    
    # Replace large icons
    landing = landing.replace("<div style={{ fontSize: '4rem', marginBottom: '16px' }}>💧</div>", "<div className=\"floating-icon\" style={{ marginBottom: '16px', color: '#60a5fa' }}><Droplet size={64} strokeWidth={1.5} /></div>")
    landing = landing.replace("<div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚙️</div>", "<div style={{ marginBottom: '16px', color: '#93c5fd' }}><Settings size={48} strokeWidth={1.5} /></div>")
    landing = landing.replace("<div style={{ fontSize: '3rem', marginBottom: '16px' }}>🏘️</div>", "<div style={{ marginBottom: '16px', color: '#93c5fd' }}><Users size={48} strokeWidth={1.5} /></div>")
    landing = landing.replace("<div style={{ fontSize: '3rem', marginBottom: '16px' }}>🌾</div>", "<div style={{ marginBottom: '16px', color: '#93c5fd' }}><Wheat size={48} strokeWidth={1.5} /></div>")
    landing = landing.replace("🤖 Or Ask Water Copilot", "<Bot size={18} style={{marginRight:8}}/> Or Ask Water Copilot")
    
    # Replace small feature icons
    landing = landing.replace("icon: '💧'", "icon: <Activity size={32} color=\"#60a5fa\"/>")
    landing = landing.replace("icon: '🌡️'", "icon: <CloudRain size={32} color=\"#60a5fa\"/>")
    landing = landing.replace("icon: '🌱'", "icon: <Sprout size={32} color=\"#60a5fa\"/>")
    landing = landing.replace("icon: '🏗️'", "icon: <Hammer size={32} color=\"#60a5fa\"/>")
    landing = landing.replace("icon: '🤖'", "icon: <Bot size={32} color=\"#60a5fa\"/>")
    landing = landing.replace("icon: '🔮'", "icon: <Lightbulb size={32} color=\"#60a5fa\"/>")

    landing = re.sub(
        r"style={{ flex: '1 1 250px', background: 'rgba\(255,255,255,0\.1\)', border: '1px solid rgba\(255,255,255,0\.2\)', borderRadius: 12, padding: '30px 20px', cursor: 'pointer', transition: 'transform 0\.2s, background 0\.2s' }}",
        r"className=\"premium-card\" style={{ flex: '1 1 250px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16, padding: '30px 20px', cursor: 'pointer', backdropFilter: 'blur(10px)' }}",
        landing
    )
    landing = re.sub(r"onMouseOver=\{\(e\) => e\.currentTarget\.style\.background = '[^']+'\}", "", landing)
    landing = re.sub(r"onMouseOut=\{\(e\) => e\.currentTarget\.style\.background = '[^']+'\}", "", landing)
    
    landing = re.sub(
        r"style=\{\{ background: 'rgba\(255,255,255,0\.07\)', border: '1px solid rgba\(255,255,255,0\.12\)', borderRadius: 12, padding: '20px 16px', textAlign: 'center', cursor: 'pointer', transition: 'transform 0\.2s' \}\}",
        r"className=\"premium-card\" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: '20px 16px', textAlign: 'center', cursor: 'pointer' }}",
        landing
    )
    landing = re.sub(r"onMouseOver=\{\(e\) => e\.currentTarget\.style\.transform = '[^']+'\}", "", landing)
    landing = re.sub(r"onMouseOut=\{\(e\) => e\.currentTarget\.style\.transform = '[^']+'\}", "", landing)

    with open(landing_path, "w", encoding="utf-8") as f:
        f.write(landing)


# 5. Update App.tsx TopNav
app_path = os.path.join(base_dir, "App.tsx")
with open(app_path, "r", encoding="utf-8") as f:
    app_tsx = f.read()

if "lucide-react" not in app_tsx:
    app_tsx = app_tsx.replace(
        "import { getHealth } from './services/api';",
        "import { getHealth } from './services/api';\nimport { Droplet, LayoutDashboard, Map, Waves, CloudRain, Sprout, Hammer, Lightbulb, Bot, Wheat, Users } from 'lucide-react';"
    )
    app_tsx = app_tsx.replace("<h2>💧 JalRakshak</h2>", "<h2 style={{display:'flex', alignItems:'center', gap:'8px'}}><Droplet color=\"#60a5fa\" /> JalRakshak</h2>")
    
    # We will just inject icons inside the NavLinks directly
    app_tsx = app_tsx.replace(">{t('Dashboard', 'ડૅશબોર્ડ')}</NavLink>", " style={{display:'flex', gap:'6px', alignItems:'center'}}><LayoutDashboard size={16}/> {t('Dashboard', 'ડૅશબોર્ડ')}</NavLink>")
    app_tsx = app_tsx.replace(">{t('Atlas', 'નકશો')}</NavLink>", " style={{display:'flex', gap:'6px', alignItems:'center'}}><Map size={16}/> {t('Atlas', 'નકશો')}</NavLink>")
    app_tsx = app_tsx.replace(">{t('Groundwater', 'ભૂગર્ભ જળ')}</NavLink>", " style={{display:'flex', gap:'6px', alignItems:'center'}}><Waves size={16}/> {t('Groundwater', 'ભૂગર્ભ જળ')}</NavLink>")
    app_tsx = app_tsx.replace(">{t('Drought', 'દુષ્કાળ')}</NavLink>", " style={{display:'flex', gap:'6px', alignItems:'center'}}><CloudRain size={16}/> {t('Drought', 'દુષ્કાળ')}</NavLink>")
    app_tsx = app_tsx.replace(">{t('Crops', 'પાક')}</NavLink>", " style={{display:'flex', gap:'6px', alignItems:'center'}}><Sprout size={16}/> {t('Crops', 'પાક')}</NavLink>")
    app_tsx = app_tsx.replace(">{t('Recharge', 'રિચાર્જ')}</NavLink>", " style={{display:'flex', gap:'6px', alignItems:'center'}}><Hammer size={16}/> {t('Recharge', 'રિચાર્જ')}</NavLink>")
    app_tsx = app_tsx.replace(">{t('Simulator', 'શું-જો')}</NavLink>", " style={{display:'flex', gap:'6px', alignItems:'center'}}><Lightbulb size={16}/> {t('Simulator', 'શું-જો')}</NavLink>")
    app_tsx = app_tsx.replace(">{t('Copilot', 'સહ-પાઇલોટ')}</NavLink>", " style={{display:'flex', gap:'6px', alignItems:'center'}}><Bot size={16}/> {t('Copilot', 'સહ-પાઇલોટ')}</NavLink>")

    app_tsx = app_tsx.replace(">{t('🌾 Farmer', '🌾 ખેડૂત')}</option>", ">{t('Farmer', 'ખેડૂત')}</option>")
    app_tsx = app_tsx.replace(">{t('🏘 Community', '🏘 સમુદાય')}</option>", ">{t('Community', 'સમુદાય')}</option>")

    with open(app_path, "w", encoding="utf-8") as f:
        f.write(app_tsx)


# 6. Update AdminDashboard.tsx
admin_dash_path = os.path.join(base_dir, "pages", "admin", "AdminDashboard.tsx")
with open(admin_dash_path, "r", encoding="utf-8") as f:
    admin_dash = f.read()

if "lucide-react" not in admin_dash:
    admin_dash = admin_dash.replace(
        "import { useNavigate } from 'react-router-dom';",
        "import { useNavigate } from 'react-router-dom';\nimport { Map as MapIcon, ShieldAlert, Activity, Droplet, Sprout, Bell, RefreshCw, Zap, TrendingDown, ClipboardList } from 'lucide-react';"
    )
    admin_dash = admin_dash.replace("<span style={{fontSize: '3rem', marginBottom: '10px'}}>🗺️</span>", "<MapIcon size={48} color=\"#64748b\" style={{marginBottom: '10px'}} />")
    admin_dash = admin_dash.replace("Refresh Data", "<RefreshCw size={14} style={{marginRight: '6px'}}/> Refresh Data")
    admin_dash = admin_dash.replace("style={{ background: '#1e293b'", "className=\"premium-card\" style={{ background: '#1e293b'")
    
    with open(admin_dash_path, "w", encoding="utf-8") as f:
        f.write(admin_dash)


# 7. Update Dashboard.tsx
dash_path = os.path.join(base_dir, "pages", "Dashboard.tsx")
with open(dash_path, "r", encoding="utf-8") as f:
    dash = f.read()

if "lucide-react" not in dash:
    dash = dash.replace(
        "import { PageTransition, CardTransition } from '../components/Transitions';",
        "import { PageTransition, CardTransition } from '../components/Transitions';\nimport { LayoutDashboard, Map as MapIcon, Sprout, Hammer, Lightbulb, Droplet, AlertTriangle, Activity } from 'lucide-react';"
    )
    dash = dash.replace("📊 {lang === 'gu' ? 'ડૅશબોર્ડ' : 'Dashboard'}", "<LayoutDashboard size={28} style={{marginRight:10}}/> {lang === 'gu' ? 'ડૅશબોર્ડ' : 'Dashboard'}")
    dash = dash.replace("💧 Groundwater Depth Trend (m)", "<Droplet size={18} style={{marginRight:8}}/> Groundwater Depth Trend (m)")
    dash = dash.replace("🌡️ Drought Risk Factors", "<AlertTriangle size={18} style={{marginRight:8}}/> Drought Risk Factors")
    dash = dash.replace("⚡ Recommended Actions", "<Activity size={18} style={{marginRight:8}}/> Recommended Actions")
    
    dash = dash.replace("icon: '🗺️'", "icon: <MapIcon size={24}/>")
    dash = dash.replace("icon: '🌱'", "icon: <Sprout size={24}/>")
    dash = dash.replace("icon: '🏗️'", "icon: <Hammer size={24}/>")
    dash = dash.replace("icon: '🔮'", "icon: <Lightbulb size={24}/>")

    dash = dash.replace("className=\"card\"", "className=\"card premium-card\"")
    dash = dash.replace("className=\"stat-card\"", "className=\"stat-card premium-card\"")
    
    with open(dash_path, "w", encoding="utf-8") as f:
        f.write(dash)

print("UI Upgraded successfully.")
