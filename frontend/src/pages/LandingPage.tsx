import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Droplet, Settings, Users, Wheat, Bot, Activity, CloudRain, Sprout, Hammer, Lightbulb, ChevronRight, ShieldCheck, MapPin } from 'lucide-react';

type Mode = 'farmer' | 'community' | 'admin';

export default function LandingPage({ setMode }: { setMode: (m: Mode) => void }) {
  const nav = useNavigate();
  const cardsRef = useRef<HTMLDivElement>(null);

  const handleSelectRole = (role: Mode) => {
    if (role === 'admin') {
      nav('/admin/login');
    } else if (role === 'farmer') {
      nav('/farmer/login');
    } else {
      setMode(role);
      nav('/dashboard');
    }
  };

  // Mouse tracking for glowing cards
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!cardsRef.current) return;
      const cards = cardsRef.current.getElementsByClassName('role-card');
      for (const card of Array.from(cards)) {
        const rect = (card as HTMLElement).getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        (card as HTMLElement).style.setProperty('--mouse-x', `${x}px`);
        (card as HTMLElement).style.setProperty('--mouse-y', `${y}px`);
      }
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div style={{ backgroundColor: '#030712', minHeight: '100vh', position: 'relative', overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Inline Styles for Advanced Animations */}
      <style>{`
        @keyframes blobBounce {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(40px, -60px) scale(1.2); }
          66% { transform: translate(-30px, 30px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes textShine {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes floatSmooth {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(2deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        @keyframes borderRotate {
          100% { transform: rotate(1turn); }
        }
        .bg-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(120px);
          z-index: 0;
          opacity: 0.5;
          animation: blobBounce 25s infinite alternate cubic-bezier(0.4, 0, 0.2, 1);
        }
        .text-gradient-shine {
          background: linear-gradient(
            to right,
            #60a5fa 20%,
            #c084fc 30%,
            #f472b6 70%,
            #60a5fa 80%
          );
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          text-fill-color: transparent;
          background-size: 200% auto;
          animation: textShine 5s linear infinite;
        }
        .role-card {
          position: relative;
          border-radius: 24px;
          overflow: hidden;
          transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
          background: rgba(15, 23, 42, 0.6);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.08);
          z-index: 1;
          cursor: pointer;
          display: flex;
          flex-direction: column;
          height: 100%;
        }
        .role-card::before {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(600px circle at var(--mouse-x) var(--mouse-y), rgba(255, 255, 255, 0.1), transparent 40%);
          z-index: -1;
          opacity: 0;
          transition: opacity 0.5s;
        }
        .role-card:hover::before {
          opacity: 1;
        }
        .role-card:hover {
          transform: translateY(-8px) scale(1.02);
          border-color: rgba(96, 165, 250, 0.4);
          box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.8), 0 0 30px rgba(59, 130, 246, 0.25);
        }
        .icon-ring {
          width: 72px;
          height: 72px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(30, 41, 59, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.5s ease;
          position: relative;
        }
        .role-card:hover .icon-ring {
          background: rgba(59, 130, 246, 0.15);
          border-color: rgba(96, 165, 250, 0.5);
          box-shadow: 0 0 25px rgba(59, 130, 246, 0.5);
          transform: scale(1.1);
        }
        .animated-border-btn {
          position: relative;
          background: transparent;
          color: #fff;
          font-weight: 600;
          border: none;
          border-radius: 999px;
          padding: 16px 36px;
          overflow: hidden;
          cursor: pointer;
          z-index: 1;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .animated-border-btn::before {
          content: '';
          position: absolute;
          top: -50%; left: -50%; width: 200%; height: 200%;
          background: conic-gradient(transparent, rgba(96, 165, 250, 1), transparent 30%);
          animation: borderRotate 3s linear infinite;
          z-index: -2;
        }
        .animated-border-btn::after {
          content: '';
          position: absolute;
          inset: 2px;
          background: #0f172a;
          border-radius: 999px;
          z-index: -1;
          transition: background 0.3s;
        }
        .animated-border-btn:hover::after {
          background: rgba(15, 23, 42, 0.8);
        }
        .floating-element {
          animation: floatSmooth 6s ease-in-out infinite;
        }

        .feature-grid {
          width: 100%;
        }

        @media (max-width: 900px) {
          .feature-grid {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
        }

        @media (max-width: 560px) {
          .feature-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Deep Background Orbs */}
      <div className="bg-orb" style={{ width: '600px', height: '600px', background: '#1e3a8a', top: '-20%', left: '-10%' }} />
      <div className="bg-orb" style={{ width: '500px', height: '500px', background: '#581c87', bottom: '-20%', right: '-5%', animationDelay: '-5s' }} />
      <div className="bg-orb" style={{ width: '400px', height: '400px', background: '#0f766e', top: '30%', right: '20%', animationDelay: '-10s', opacity: 0.3 }} />

      {/* Main Content Overlay */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', minHeight: '100vh', padding: '60px 24px' }}>
        
        {/* Header Badges */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '40px', animation: 'floatSmooth 8s ease-in-out infinite' }}>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 16px', borderRadius: '999px', fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(8px)' }}>
            <ShieldCheck size={14} color="#22c55e" /> Validated Data
          </div>
          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 16px', borderRadius: '999px', fontSize: '0.8rem', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: '6px', backdropFilter: 'blur(8px)' }}>
            <MapPin size={14} color="#3b82f6" /> Saurashtra Region
          </div>
        </div>

        {/* Hero Section */}
        <div style={{ textAlign: 'center', maxWidth: '900px', marginBottom: '80px' }}>
          <div className="floating-element" style={{ display: 'inline-flex', marginBottom: '24px' }}>
            <div style={{ background: 'linear-gradient(135deg, #1e3a8a, #3b82f6)', padding: '20px', borderRadius: '24px', boxShadow: '0 20px 40px -10px rgba(59, 130, 246, 0.5), inset 0 1px 0 rgba(255,255,255,0.3)' }}>
              <Droplet size={48} color="#fff" strokeWidth={1.5} />
            </div>
          </div>
          <h1 style={{ fontSize: 'clamp(3rem, 8vw, 5rem)', fontWeight: 800, margin: '0 0 16px 0', letterSpacing: '-0.03em', lineHeight: 1.1 }}>
            <span className="text-gradient-shine">JalRakshak AI </span>
          </h1>
          <p style={{ fontSize: 'clamp(1.1rem, 3vw, 1.4rem)', color: '#94a3b8', marginBottom: '40px', lineHeight: 1.6, maxWidth: '700px', margin: '0 auto 40px auto' }}>
            A next-generation platform transforming regional water data into intelligent, actionable strategy. Experience precision drought monitoring and crop advisory.
          </p>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <button className="animated-border-btn" onClick={() => nav('/copilot')}>
              <Bot size={20} color="#60a5fa" />
              Ask Water Copilot
              <ChevronRight size={18} color="#94a3b8" style={{ marginLeft: '4px' }} />
            </button>
          </div>
        </div>

        {/* Roles Grid */}
        <div style={{ width: '100%', maxWidth: '1100px', marginBottom: '80px' }}>
          <h2 style={{ textAlign: 'center', fontSize: '1.75rem', fontWeight: 700, color: '#f8fafc', marginBottom: '40px' }}>
            Select Your Workspace
          </h2>
          <div ref={cardsRef} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            
            {/* Admin */}
            <div className="role-card" onClick={() => handleSelectRole('admin')} style={{ padding: '32px' }}>
              <div>
                <div className="icon-ring" style={{ marginBottom: '24px' }}>
                  <Settings size={32} color="#a78bfa" strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>Administrator</h3>
                <p style={{ color: '#94a3b8', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  Command center for government officials. Monitor regional budgets, drought intelligence, and policy planning with IBM Granite AI.
                </p>
              </div>
              <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', color: '#a78bfa', fontSize: '0.9rem', fontWeight: 600 }}>
                Enter Portal <ChevronRight size={16} style={{ marginLeft: 4 }} />
              </div>
            </div>

            {/* Community */}
            <div className="role-card" onClick={() => handleSelectRole('community')} style={{ padding: '32px' }}>
              <div>
                <div className="icon-ring" style={{ marginBottom: '24px' }}>
                  <Users size={32} color="#34d399" strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>Community</h3>
                <p style={{ color: '#94a3b8', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  Tools for village panchayats. Plan recharge structures, track local water health, and request state interventions.
                </p>
              </div>
              <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', color: '#34d399', fontSize: '0.9rem', fontWeight: 600 }}>
                Enter Portal <ChevronRight size={16} style={{ marginLeft: 4 }} />
              </div>
            </div>

            {/* Farmer */}
            <div className="role-card" onClick={() => handleSelectRole('farmer')} style={{ padding: '32px' }}>
              <div>
                <div className="icon-ring" style={{ marginBottom: '24px' }}>
                  <Wheat size={32} color="#fcd34d" strokeWidth={1.5} />
                </div>
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#fff', marginBottom: '12px' }}>Farmer</h3>
                <p style={{ color: '#94a3b8', lineHeight: 1.6, fontSize: '0.95rem' }}>
                  Personalized agricultural intelligence. Get AI crop advisory, weather alerts, and water availability forecasts.
                </p>
              </div>
              <div style={{ marginTop: '32px', display: 'flex', alignItems: 'center', color: '#fcd34d', fontSize: '0.9rem', fontWeight: 600 }}>
                Enter Portal <ChevronRight size={16} style={{ marginLeft: 4 }} />
              </div>
            </div>

          </div>
        </div>

        {/* Feature Grid Mini */}
        <div className="feature-grid" style={{ width: '100%', maxWidth: '1100px', display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '16px' }}>
          {[
            { icon: <Activity size={24} color="#60a5fa"/>, title: 'Water Health Score', route: '/dashboard' },
            { icon: <CloudRain size={24} color="#a78bfa"/>, title: 'Drought Intelligence', route: '/drought' },
            { icon: <Sprout size={24} color="#34d399"/>, title: 'Crop Advisory', route: '/crops' },
            { icon: <Hammer size={24} color="#fcd34d"/>, title: 'Recharge Planning', route: '/recharge' },
            { icon: <Lightbulb size={24} color="#f472b6"/>, title: 'What-If Simulator', route: '/simulator' },
          ].map((f, i) => (
            <div 
              key={i}
              onClick={() => nav(f.route)}
              style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '16px', padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', cursor: 'pointer', transition: 'background 0.3s' }}
              onMouseOver={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
              onMouseOut={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
            >
              <div style={{ background: 'rgba(15,23,42,0.8)', padding: '10px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {f.icon}
              </div>
              <div style={{ fontWeight: 600, color: '#e2e8f0', fontSize: '0.95rem' }}>{f.title}</div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '60px', textAlign: 'center', fontSize: '0.8rem', color: '#475569', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span>Powered by IBM watsonx.ai</span>
          <span>•</span>
          <span>Saurashtra 2026</span>
          <span>•</span>
          <span>Demonstration Mode</span>
        </div>

      </div>
    </div>
  );
}
