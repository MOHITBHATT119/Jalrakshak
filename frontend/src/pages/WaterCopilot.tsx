import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Bot, Send, RotateCcw, Trash2, Copy, Check, ChevronRight,
  Droplet, CloudRain, AlertTriangle, Activity, Zap, Leaf,
  Wifi, WifiOff, Clock, Database, MessageSquare, Plus,
  MapPin, TrendingDown, BarChart2, Shield, Settings, Sparkles,
} from 'lucide-react';
import {
  sendCopilot, getVillages, getWaterHealth, getGroundwater,
  getDroughtRisk, getWaterBudget, Village,
} from '../services/api';
import VillageSelect from '../components/VillageSelect';
import { useTheme } from '../context/ThemeContext';

interface Props {
  selectedVillage: string;
  setSelectedVillage: (v: string) => void;
  lang: string;
  demoMode: boolean;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  demo?: boolean;
  sources?: { label: string; value: string }[];
  confidence?: string;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  villageId: string;
}

interface ContextData {
  health: any;
  gw: any;
  drought: any;
  budget: any;
  loading: boolean;
}

const uid = () => Math.random().toString(36).slice(2, 10);

/** All static UI strings with Gujarati translations */
const T = {
  // Header
  appTitle:        { en: 'JalRakshak Water Copilot', gu: 'જળરક્ષક વોટર કો-પાઇલટ' },
  appSubtitle:     { en: 'AI-powered water intelligence for Saurashtra', gu: 'સૌરાષ્ટ્ર માટે AI-સક્ષમ જળ બુદ્ધિ' },
  granite:         { en: 'IBM Granite 3.3', gu: 'IBM Granite 3.3' },
  aiOnline:        { en: 'AI Online', gu: 'AI ઓનલાઇન' },
  demo:            { en: 'Demo', gu: 'ડેમો' },
  // Sidebar
  newChat:         { en: 'New Chat', gu: 'નવી વાત' },
  newConversation: { en: 'New Conversation', gu: 'નવી વાતચીત' },
  today:           { en: 'Today', gu: 'આજે' },
  previous:        { en: 'Previous', gu: 'અગાઉની' },
  noConversations: { en: 'No conversations yet', gu: 'હજુ કોઈ વાતચીત નથી' },
  useVillageData:  { en: 'Use village data', gu: 'ગ્રામ ડેટા વાપરો' },
  // Welcome
  welcomeTitle:    { en: 'How can I help with water management?', gu: 'જળ વ્યવસ્થાપનમાં હું કેવી રીતે મદદ કરી શકું?' },
  welcomeSubWithV: { en: (v: string) => `Analyzing ${v} — ask me anything about groundwater, drought, crops, or recharge.`,
                     gu: (v: string) => `${v}નું વિશ્લેષણ — ભૂગર્ભ જળ, દુષ્કાળ, પાક અથવા રિચાર્જ વિશે કઈ પણ પૂછો.` },
  welcomeSub:      { en: 'Select a village and ask me anything about water management.', gu: 'એક ગ્રામ પસંદ કરો અને જળ વ્યવસ્થાપન વિશે કઈ પણ પૂછો.' },
  // Input
  inputPlaceholder:{ en: 'Ask about groundwater, drought, crops, recharge...', gu: 'જળ વ્યવસ્થાપન વિશે પૂછો...' },
  inputPlaceholderMobile: { en: 'Ask about water…', gu: 'જળ વિશે પૂછો...' },
  inputHint:       { en: 'Enter to send · Shift+Enter for new line · Powered by IBM Granite', gu: 'Enter = મોકલો · Shift+Enter = નવી લાઇન · IBM Granite દ્વારા' },
  // Messages
  copyText:        { en: 'Copy', gu: 'કૉપિ' },
  copiedText:      { en: 'Copied', gu: 'કૉપિ થયું' },
  // Demo banner
  demoTitle:       { en: 'Demo Mode', gu: 'ડેમો મોડ' },
  demoDesc:        { en: 'Responses are deterministic fallbacks, not IBM Granite. Add', gu: 'જવાબો નિર્ધારિત ફૉલ-બૅક છે, IBM Granite નહીં. ઉમેરો' },
  demoDesc2:       { en: 'to .env for real AI.', gu: '.env ફાઇલમાં સાચા AI માટે.' },
  // Sources
  srcEngine:       { en: 'Engine', gu: 'એન્જિન' },
  srcVillage:      { en: 'Village', gu: 'ગ્રામ' },
  srcTime:         { en: 'Time', gu: 'સમય' },
  demoFallback:    { en: 'Deterministic fallback', gu: 'નિર્ધારિત ફૉલ-બૅક' },
  // Context panel
  waterContext:    { en: 'Water Context', gu: 'જળ સંદર્ભ' },
  noVillage:       { en: 'No village selected', gu: 'કોઈ ગ્રામ પસંદ નથી' },
  villageProfile:  { en: 'Village Profile', gu: 'ગ્રામ પ્રોફાઇલ' },
  population:      { en: 'Population', gu: 'વસ્તી' },
  agriArea:        { en: 'Agri Area', gu: 'ખેત વિસ્તાર' },
  aquifer:         { en: 'Aquifer', gu: 'ભૂગર્ભ જળ સ્તર' },
  crops:           { en: 'Crops', gu: 'પાક' },
  mWaterHealth:    { en: 'Water Health', gu: 'જળ સ્વાસ્થ્ય' },
  mGroundwater:    { en: 'Groundwater', gu: 'ભૂગર્ભ જળ' },
  mRainfall:       { en: 'Rainfall', gu: 'વરસાદ' },
  mAnnualAvg:      { en: 'Annual avg', gu: 'વાર્ષિક સરેરાશ' },
  mDroughtRisk:    { en: 'Drought Risk', gu: 'દુષ્કાળ જોખમ' },
  mWaterDeficit:   { en: 'Water Deficit', gu: 'જળ ઘટ' },
  mRechargePotential: { en: 'Recharge Potential', gu: 'રિચાર્જ ક્ષમતા' },
  mEstimated:      { en: 'Estimated', gu: 'અંદાજ' },
};

const t = (key: keyof typeof T, lang: string): string => {
  const entry = T[key] as { en: string; gu: string };
  return lang === 'gu' ? entry.gu : entry.en;
};

const QUICK_PROMPTS = [
  { icon: <TrendingDown size={15} />, label: 'Why is groundwater declining?',   gu: 'ભૂગર્ભ જળ કેમ ઘટે છે?' },
  { icon: <CloudRain size={15} />,    label: 'What is the drought risk here?',   gu: 'દુષ્કાળનું જોખમ કેટલું છે?' },
  { icon: <Leaf size={15} />,         label: 'Which crop saves the most water?', gu: 'ક્યો પાક ઓછો પાણી માંગે?' },
  { icon: <Droplet size={15} />,      label: 'Where should we recharge water?',  gu: 'જળ રિચાર્જ ક્યાં કરવું?' },
  { icon: <Activity size={15} />,     label: "Explain this village's water health", gu: 'ગ્રામ જળ સ્વાસ્થ્ય સમજાવો' },
  { icon: <Zap size={15} />,          label: 'Create a water action plan',        gu: 'જળ ક્રિયા યોજના બનાવો' },
];

const CHIPS_EN = ['Analyze groundwater', 'Check drought', 'Recommend crop', 'Plan recharge', 'Run simulation'];
const CHIPS_GU = ['ભૂગર્ભ જળ વિશ્લેષણ', 'દુષ્કાળ તપાસ', 'પાકની ભલામણ', 'રિચાર્જ આયોજન', 'સિમ્યુલેશન'];

function parseMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/`(.*?)`/g, '<code style="background:rgba(59,130,246,0.15);padding:1px 5px;border-radius:3px;font-size:0.85em">$1</code>')
    .replace(/^### (.*)/gm, '<div style="font-weight:800;font-size:1rem;margin:10px 0 4px;color:var(--text-main)">$1</div>')
    .replace(/^## (.*)/gm,  '<div style="font-weight:800;font-size:1.05rem;margin:10px 0 4px;color:#60a5fa">$1</div>')
    .replace(/^# (.*)/gm,   '<div style="font-weight:900;font-size:1.1rem;margin:10px 0 5px;color:#60a5fa">$1</div>')
    .replace(/^\- (.*)/gm,  '<div style="padding:2px 0 2px 12px;border-left:2px solid rgba(59,130,246,0.3)">• $1</div>')
    .replace(/\n/g, '<br/>');
}

function TypingIndicator() {
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center', padding: '4px 2px' }}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{
          width: 7, height: 7, borderRadius: '50%', background: '#3b82f6',
          animation: 'copilotBounce 1.2s ease-in-out infinite',
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
    </div>
  );
}

function CopyBtn({ text, lang }: { text: string; lang: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy} title="Copy response" style={{
      background: 'none', border: 'none', cursor: 'pointer', padding: '3px 6px',
      borderRadius: 5, color: copied ? '#22c55e' : '#64748b',
      display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.72rem',
      transition: 'color 0.2s',
    }}>
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? t('copiedText', lang) : t('copyText', lang)}
    </button>
  );
}

function ContextPanel({ villageId, villages, ctx, lang }: { villageId: string; villages: Village[]; ctx: ContextData; lang: string }) {
  const village = villages.find(v => v.village_id === villageId);
  const catColor = (c: string) => ({ HEALTHY: '#16a34a', WATCH: '#d97706', STRESSED: '#ea580c', CRITICAL: '#dc2626', EMERGENCY: '#7f1d1d' }[c] || '#64748b');
  const riskColor = (r: string) => ({ LOW: '#16a34a', MODERATE: '#d97706', HIGH: '#ea580c', SEVERE: '#dc2626' }[r] || '#64748b');
  const trendColor = (tr: string) => ({ IMPROVING: '#16a34a', STABLE: '#3b82f6', DECLINING: '#ea580c', CRITICAL: '#dc2626' }[tr] || '#64748b');

  const metrics = ctx.loading ? [] : [
    {
      icon: <Activity size={14} />, label: t('mWaterHealth', lang),
      value: ctx.health?.overall_score != null ? `${ctx.health.overall_score.toFixed(0)}/100` : '—',
      sub: ctx.health?.category || '—',
      color: catColor(ctx.health?.category),
    },
    {
      icon: <Droplet size={14} />, label: t('mGroundwater', lang),
      value: ctx.gw?.current_depth_m != null ? `${ctx.gw.current_depth_m.toFixed(1)}m` : '—',
      sub: ctx.gw?.trend || '—',
      color: trendColor(ctx.gw?.trend),
    },
    {
      icon: <CloudRain size={14} />, label: t('mRainfall', lang),
      value: village?.annual_rainfall_mm != null ? `${village.annual_rainfall_mm}mm` : '—',
      sub: t('mAnnualAvg', lang),
      color: '#3b82f6',
    },
    {
      icon: <AlertTriangle size={14} />, label: t('mDroughtRisk', lang),
      value: ctx.drought?.risk_score != null ? `${ctx.drought.risk_score.toFixed(0)}/100` : '—',
      sub: ctx.drought?.risk_level || '—',
      color: riskColor(ctx.drought?.risk_level),
    },
    {
      icon: <BarChart2 size={14} />, label: t('mWaterDeficit', lang),
      value: ctx.budget?.balance?.deficit_mcm != null ? `${Math.abs(ctx.budget.balance.deficit_mcm).toFixed(2)} MCM` : '—',
      sub: ctx.budget?.balance?.status || '—',
      color: (ctx.budget?.balance?.deficit_mcm || 0) > 0 ? '#dc2626' : '#16a34a',
    },
    {
      icon: <Shield size={14} />, label: t('mRechargePotential', lang),
      value: ctx.budget?.supply?.recharge_mcm != null ? `${ctx.budget.supply.recharge_mcm.toFixed(2)} MCM` : '—',
      sub: t('mEstimated', lang),
      color: '#22c55e',
    },
  ];

  return (
    <div className="cp-ctx-panel" style={{
      width: 260, flexShrink: 0,
      borderLeft: '1px solid var(--border-glass)',
      display: 'flex', flexDirection: 'column',
      background: 'rgba(0,0,0,0.15)',
      overflowY: 'auto',
    }}>
      {/* Panel header */}
      <div style={{ padding: '14px 16px 10px', borderBottom: '1px solid var(--border-glass)' }}>
        <div style={{ fontSize: '0.7rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#3b82f6', marginBottom: 8 }}>
          {t('waterContext', lang)}
        </div>
        {village ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <MapPin size={12} color="#3b82f6" />
            <span style={{ fontSize: '0.875rem', fontWeight: 700, color: 'var(--text-main)' }}>{village.name}</span>
            <span style={{ fontSize: '0.68rem', color: '#64748b', background: 'rgba(255,255,255,0.06)', borderRadius: 3, padding: '1px 5px' }}>
              {village.district}
            </span>
          </div>
        ) : (
          <div style={{ fontSize: '0.8rem', color: '#64748b' }}>{t('noVillage', lang)}</div>
        )}
      </div>

      {/* Metrics */}
      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {ctx.loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}>
            <div className="spinner" style={{ width: 24, height: 24 }} />
          </div>
        ) : metrics.map(m => (
          <div key={m.label} className="cp-ctx-metric" style={{
            background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)',
            borderLeft: `3px solid ${m.color}`,
            borderRadius: 8, padding: '8px 10px',
            display: 'flex', alignItems: 'center', gap: 8,
          }}>
            <div style={{ color: m.color, flexShrink: 0 }}>{m.icon}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {m.label}
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 800, color: m.color }}>{m.value}</div>
              <div style={{ fontSize: '0.65rem', color: '#64748b' }}>{m.sub}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Village info */}
      {village && (
        <div className="cp-ctx-profile" style={{ margin: '0 12px 12px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 8, padding: '10px 12px' }}>
          <div style={{ fontSize: '0.65rem', color: '#3b82f6', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            {t('villageProfile', lang)}
          </div>
          {[
            [t('population', lang), village.population?.toLocaleString()],
            [t('agriArea', lang), `${village.agricultural_area_ha?.toLocaleString()} ha`],
            [t('aquifer', lang), village.aquifer_type],
            [t('crops', lang), village.primary_crops?.split(';').slice(0,2).join(', ')],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', padding: '2px 0', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
              <span style={{ color: '#64748b' }}>{k}</span>
              <span style={{ color: 'var(--text-main)', fontWeight: 600, textAlign: 'right', maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function WaterCopilot({ selectedVillage, setSelectedVillage, lang, demoMode }: Props) {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [villages, setVillages] = useState<Village[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [useVillageCtx, setUseVillageCtx] = useState(true);
  const [focused, setFocused] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const [winW, setWinW] = useState(window.innerWidth);
  const [ctx, setCtx] = useState<ContextData>({ health: null, gw: null, drought: null, budget: null, loading: false });
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // track viewport width for responsive layout
  useEffect(() => {
    const handler = () => setWinW(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const isMobile  = winW < 768;
  const isTablet  = winW < 1100;
  // on desktop always show both panels; on tablet hide right; on mobile hide both
  const sidebarVisible  = !isMobile || showSidebar;
  const contextVisible  = !isTablet || showContext;

  const activeConv = conversations.find(c => c.id === activeConvId);
  const messages = activeConv?.messages || [];

  // Load villages
  useEffect(() => { getVillages().then(r => setVillages(r.villages)); }, []);

  // Load context when village changes
  useEffect(() => {
    if (!selectedVillage) return;
    setCtx(p => ({ ...p, loading: true }));
    Promise.allSettled([
      getWaterHealth(selectedVillage),
      getGroundwater(selectedVillage),
      getDroughtRisk(selectedVillage),
      getWaterBudget(selectedVillage),
    ]).then(([h, g, d, b]) => {
      setCtx({
        health:  h.status === 'fulfilled' ? h.value : null,
        gw:      g.status === 'fulfilled' ? g.value : null,
        drought: d.status === 'fulfilled' ? d.value : null,
        budget:  b.status === 'fulfilled' ? b.value : null,
        loading: false,
      });
    });
  }, [selectedVillage]);

  // Scroll to bottom on new messages — directly set scrollTop for reliability
  useEffect(() => {
    const el = messagesContainerRef.current;
    if (!el) return;
    // Use instant scroll when a new message arrives so the view snaps immediately
    el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

  const newConversation = useCallback(() => {
    const id = uid();
    const conv: Conversation = {
      id, title: t('newConversation', lang),
      messages: [], createdAt: new Date(),
      villageId: selectedVillage,
    };
    setConversations(prev => [conv, ...prev]);
    setActiveConvId(id);
  }, [selectedVillage, lang]);

  // Create first conversation
  useEffect(() => {
    if (conversations.length === 0) newConversation();
  }, []);

  const deleteConversation = (id: string) => {
    setConversations(prev => prev.filter(c => c.id !== id));
    if (activeConvId === id) {
      const remaining = conversations.filter(c => c.id !== id);
      if (remaining.length > 0) setActiveConvId(remaining[0].id);
      else newConversation();
    }
  };

  const updateMessages = (id: string, msgs: Message[]) => {
    setConversations(prev => prev.map(c =>
      c.id === id ? {
        ...c,
        messages: msgs,
        title: msgs.find(m => m.role === 'user')?.text.slice(0, 40) || c.title,
      } : c
    ));
  };

  const send = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    if (!activeConvId) return;
    setInput('');

    const userMsg: Message = { id: uid(), role: 'user', text: msg, timestamp: new Date() };
    const nextMsgs = [...messages, userMsg];
    updateMessages(activeConvId, nextMsgs);
    setLoading(true);

    try {
      const r = await sendCopilot(msg, useVillageCtx && selectedVillage ? selectedVillage : undefined, lang);
      const aiMsg: Message = {
        id: uid(), role: 'assistant', text: r.response,
        timestamp: new Date(), demo: r.demo_mode,
        sources: [
          { label: t('srcEngine', lang), value: r.demo_mode ? t('demoFallback', lang) : 'IBM Granite 3.3' },
          { label: t('srcVillage', lang), value: selectedVillage || 'Global' },
          { label: t('srcTime', lang), value: new Date().toLocaleTimeString() },
        ],
        confidence: r.demo_mode ? 'MODERATE' : 'HIGH',
      };
      updateMessages(activeConvId, [...nextMsgs, aiMsg]);
    } catch {
      const errMsg: Message = {
        id: uid(), role: 'assistant',
        text: '⚠️ Could not reach the backend. Please ensure the backend server is running on port 8001.',
        timestamp: new Date(),
      };
      updateMessages(activeConvId, [...nextMsgs, errMsg]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 140) + 'px';
  };

  const villageName = villages.find(v => v.village_id === selectedVillage)?.name || selectedVillage;

  // group conversations by day
  const today = new Date().toDateString();
  const todayConvs = conversations.filter(c => c.createdAt.toDateString() === today);
  const prevConvs  = conversations.filter(c => c.createdAt.toDateString() !== today);

  const showWelcome = messages.length === 0 && !loading;

  return (
    <>
      <style>{`
        @keyframes copilotBounce {
          0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)}
        }
        @keyframes copilotFadeIn {
          from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)}
        }
        @keyframes cpSlideIn {
          from{transform:translateX(-100%)} to{transform:translateX(0)}
        }
        @keyframes cpSlideInRight {
          from{transform:translateX(100%)} to{transform:translateX(0)}
        }
        .cp-msg { animation: copilotFadeIn 0.25s ease-out; }
        .cp-conv-btn:hover { background: rgba(59,130,246,0.1) !important; }
        .cp-chip:hover { background: rgba(59,130,246,0.18) !important; border-color: rgba(59,130,246,0.5) !important; }
        .cp-quick:hover { background: rgba(59,130,246,0.12) !important; border-color: rgba(59,130,246,0.35) !important; transform: translateY(-1px); }
        .cp-send:hover:not(:disabled) { background: #2563eb !important; }
        .cp-send:disabled { opacity: 0.45; cursor: not-allowed; }
        .cp-icon-btn { background:none; border:none; cursor:pointer; padding:6px; border-radius:7px; display:flex; align-items:center; justify-content:center; color:#64748b; transition:background 0.15s,color 0.15s; }
        .cp-icon-btn:hover { background:rgba(59,130,246,0.12); color:#60a5fa; }
        .cp-overlay { position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:200;backdrop-filter:blur(3px); }
        .cp-drawer-left  { animation: cpSlideIn 0.22s ease-out; }
        .cp-drawer-right { animation: cpSlideInRight 0.22s ease-out; }

        /* ── Light theme overrides ── */
        [data-theme="light"] .cp-header       { background: rgba(255,255,255,0.85) !important; backdrop-filter: blur(8px); }
        [data-theme="light"] .cp-sidebar      { background: #f1f5f9 !important; }
        [data-theme="light"] .cp-new-chat-btn { background: rgba(37,99,235,0.08) !important; border-color: rgba(37,99,235,0.25) !important; color: #1d4ed8 !important; }
        [data-theme="light"] .cp-conv-item    { color: #334155 !important; }
        [data-theme="light"] .cp-conv-item-active { color: #1d4ed8 !important; }
        [data-theme="light"] .cp-conv-btn:hover { background: rgba(37,99,235,0.08) !important; }
        [data-theme="light"] .cp-toggle-track-off { background: rgba(0,0,0,0.12) !important; border-color: rgba(0,0,0,0.15) !important; }
        [data-theme="light"] .cp-chat-area    { background: transparent !important; }
        [data-theme="light"] .cp-input-row    { background: rgba(255,255,255,0.9) !important; border-top-color: rgba(0,0,0,0.08) !important; }
        [data-theme="light"] .cp-input-box    { background: rgba(255,255,255,0.95) !important; border-color: rgba(0,0,0,0.15) !important; }
        [data-theme="light"] .cp-input-box:focus-within { border-color: rgba(37,99,235,0.5) !important; box-shadow: 0 0 0 2px rgba(37,99,235,0.1) !important; }
        [data-theme="light"] .cp-input-box textarea { color: #0f172a !important; }
        [data-theme="light"] .cp-input-box textarea::placeholder { color: #94a3b8 !important; }
        [data-theme="light"] .cp-hint-text    { color: #94a3b8 !important; }
        [data-theme="light"] .cp-ai-bubble    { background: rgba(0,0,0,0.04) !important; border-color: rgba(0,0,0,0.1) !important; color: #0f172a !important; }
        [data-theme="light"] .cp-ai-bubble strong, [data-theme="light"] .cp-ai-bubble b { color: #0f172a; }
        [data-theme="light"] .cp-quick-btn    { background: rgba(0,0,0,0.03) !important; border-color: rgba(0,0,0,0.1) !important; color: #0f172a !important; }
        [data-theme="light"] .cp-chip         { background: rgba(37,99,235,0.07) !important; border-color: rgba(37,99,235,0.2) !important; color: #1d4ed8 !important; }
        [data-theme="light"] .cp-chip:hover   { background: rgba(37,99,235,0.14) !important; }
        [data-theme="light"] .cp-demo-banner  { background: rgba(217,119,6,0.07) !important; border-color: rgba(217,119,6,0.25) !important; }
        [data-theme="light"] .cp-ctx-panel    { background: rgba(255,255,255,0.9) !important; border-left-color: rgba(0,0,0,0.08) !important; }
        [data-theme="light"] .cp-ctx-metric   { background: rgba(0,0,0,0.025) !important; border-color: rgba(0,0,0,0.08) !important; }
        [data-theme="light"] .cp-ctx-profile  { background: rgba(37,99,235,0.05) !important; border-color: rgba(37,99,235,0.15) !important; }
        [data-theme="light"] .cp-icon-btn     { color: #475569 !important; }
        [data-theme="light"] .cp-icon-btn:hover { background: rgba(37,99,235,0.1) !important; color: #1d4ed8 !important; }
        [data-theme="light"] .cp-badge-granite { background: rgba(99,102,241,0.1) !important; border-color: rgba(99,102,241,0.25) !important; color: #4f46e5 !important; }
        [data-theme="light"] .cp-typing-bubble { background: rgba(0,0,0,0.04) !important; border-color: rgba(0,0,0,0.1) !important; }
        [data-theme="light"] .cp-source-tag   { background: rgba(99,102,241,0.08) !important; border-color: rgba(99,102,241,0.18) !important; color: #4f46e5 !important; }
        [data-theme="light"] .cp-msg-footer   { color: #94a3b8 !important; }
      `}</style>

      {/* Mobile overlay — close panels when tapping outside */}
      {isMobile && showSidebar  && <div className="cp-overlay" onClick={() => setShowSidebar(false)} />}
      {isTablet && showContext   && <div className="cp-overlay" onClick={() => setShowContext(false)} />}

      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 72px)', overflow: 'hidden' }}>

        {/* ── Top Header ── */}
        <div className="cp-header" style={{
          borderBottom: '1px solid var(--border-glass)',
          padding: isMobile ? '10px 12px' : '12px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
          background: 'rgba(0,0,0,0.2)', flexShrink: 0,
          overflow: 'visible',
          zIndex: 50,
          position: 'relative',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            {/* Hamburger — sidebar toggle on mobile */}
            {isMobile && (
              <button className="cp-icon-btn" onClick={() => setShowSidebar(v => !v)} title="Conversations">
                <MessageSquare size={18} />
              </button>
            )}
            <div style={{ width: 34, height: 34, borderRadius: 9, background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Bot size={18} color="#fff" />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: isMobile ? '0.88rem' : '1rem', color: 'var(--text-main)', lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {t('appTitle', lang)}
              </div>
              {!isMobile && <div style={{ fontSize: '0.72rem', color: '#64748b' }}>{t('appSubtitle', lang)}</div>}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, minWidth: 0 }}>
            {/* badges — hidden on small phones */}
            {!isMobile && (
              <>
                <div className="cp-badge-granite" style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)', fontSize: '0.7rem', fontWeight: 700, color: '#818cf8', whiteSpace: 'nowrap' }}>
                  <Database size={11} /> {t('granite', lang)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, background: demoMode ? 'rgba(245,158,11,0.1)' : 'rgba(16,185,129,0.1)', border: `1px solid ${demoMode ? 'rgba(245,158,11,0.3)' : 'rgba(16,185,129,0.3)'}`, fontSize: '0.7rem', fontWeight: 700, color: demoMode ? '#f59e0b' : '#10b981', whiteSpace: 'nowrap' }}>
                  {demoMode ? <WifiOff size={11} /> : <Wifi size={11} />}
                  {demoMode ? t('demo', lang) : t('aiOnline', lang)}
                </div>
              </>
            )}
            {/* Village selector — aligned right so dropdown opens leftward (not off-screen) */}
            <VillageSelect
              villages={villages}
              value={selectedVillage}
              onChange={setSelectedVillage}
              width={isMobile ? 140 : 200}
              dropdownAlign="right"
            />
            {/* Context panel toggle on tablet/mobile */}
            {isTablet && (
              <button className="cp-icon-btn" onClick={() => setShowContext(v => !v)} title="Water Context"
                style={{ background: showContext ? 'rgba(59,130,246,0.15)' : undefined, color: showContext ? '#60a5fa' : undefined, flexShrink: 0 }}>
                <BarChart2 size={18} />
              </button>
            )}
          </div>
        </div>

        {/* ── Main layout ── */}
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden', minHeight: 0, position: 'relative' }}>

          {/* ── LEFT: Conversation history ── */}
          {/* On mobile: slide-over drawer. On desktop: fixed sidebar */}
          {(sidebarVisible) && (
          <div className={`cp-sidebar${isMobile ? ' cp-drawer-left' : ''}`} style={{
            width: 220, flexShrink: 0, borderRight: '1px solid var(--border-glass)',
            display: 'flex', flexDirection: 'column', background: 'rgba(10,15,28,0.97)',
            ...(isMobile ? { position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 210 } : {}),
          }}>
            <div style={{ padding: '10px 10px 6px', borderBottom: '1px solid var(--border-glass)', flexShrink: 0 }}>
              <button className="cp-new-chat-btn" onClick={newConversation} style={{
                width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 0', borderRadius: 7, background: 'rgba(59,130,246,0.12)',
                border: '1px solid rgba(59,130,246,0.25)', color: '#60a5fa',
                cursor: 'pointer', fontSize: '0.8rem', fontWeight: 700, transition: 'all 0.2s',
              }}>
                <Plus size={14} /> {t('newChat', lang)}
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '6px 8px' }}>
              {[{ label: t('today', lang), items: todayConvs }, { label: t('previous', lang), items: prevConvs }].map(group => (
                group.items.length === 0 ? null :
                <div key={group.label}>
                  <div style={{ fontSize: '0.62rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.07em', padding: '8px 4px 4px' }}>
                    {group.label}
                  </div>
                  {group.items.map(conv => (
                    <div key={conv.id} className="cp-conv-btn" style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      borderRadius: 6, marginBottom: 2,
                      background: conv.id === activeConvId ? 'rgba(59,130,246,0.15)' : 'transparent',
                      border: `1px solid ${conv.id === activeConvId ? 'rgba(59,130,246,0.3)' : 'transparent'}`,
                      transition: 'all 0.15s',
                    }}>
                      <button onClick={() => setActiveConvId(conv.id)}
                        className={conv.id === activeConvId ? 'cp-conv-item-active' : 'cp-conv-item'}
                        style={{
                        flex: 1, background: 'none', border: 'none', cursor: 'pointer',
                        textAlign: 'left', padding: '7px 8px',
                        color: conv.id === activeConvId ? '#93c5fd' : '#94a3b8',
                        fontSize: '0.78rem', lineHeight: 1.3,
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        <MessageSquare size={11} style={{ marginRight: 5, verticalAlign: 'middle', opacity: 0.6 }} />
                        {conv.title}
                      </button>
                      <button onClick={() => deleteConversation(conv.id)} title="Delete" style={{
                        background: 'none', border: 'none', cursor: 'pointer', padding: '6px 6px',
                        color: '#475569', display: 'flex', flexShrink: 0, borderRadius: 4,
                        transition: 'color 0.15s',
                      }}
                        onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                        onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              ))}
              {conversations.length === 0 && (
                <div style={{ fontSize: '0.75rem', color: '#475569', textAlign: 'center', padding: 16 }}>
                  {t('noConversations', lang)}
                </div>
              )}
            </div>

            {/* Use village context toggle */}
            <div style={{ padding: '10px 12px', borderTop: '1px solid var(--border-glass)', flexShrink: 0 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <div onClick={() => setUseVillageCtx(v => !v)}
                  className={!useVillageCtx ? 'cp-toggle-track-off' : ''}
                  style={{
                  width: 32, height: 18, borderRadius: 9,
                  background: useVillageCtx ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  position: 'relative', transition: 'background 0.2s', cursor: 'pointer', flexShrink: 0,
                }}>
                  <div style={{
                    width: 12, height: 12, borderRadius: '50%', background: '#fff',
                    position: 'absolute', top: 2,
                    left: useVillageCtx ? 16 : 2,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                  }} />
                </div>
                <span style={{ fontSize: '0.72rem', color: '#64748b', lineHeight: 1.3, userSelect: 'none' }}>
                  {t('useVillageData', lang)}
                </span>
              </label>
            </div>
          </div>
          )}

          {/* ── CENTER: Chat ── */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>

            {/* Messages area — outer div scrolls, inner div anchors content to bottom */}
            <div ref={messagesContainerRef} style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: isMobile ? '12px 12px' : '20px 24px', gap: 16, minHeight: '100%' }}>

              {/* Welcome screen */}
              {showWelcome && (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0', animation: 'copilotFadeIn 0.4s ease-out' }}>
                  <div style={{ width: 64, height: 64, borderRadius: 18, background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: '0 8px 32px rgba(59,130,246,0.3)' }}>
                    <Bot size={30} color="#fff" />
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: 6 }}>
                    {t('welcomeTitle', lang)}
                  </div>
                  <div style={{ fontSize: '0.875rem', color: '#64748b', marginBottom: 28, textAlign: 'center', maxWidth: 440 }}>
                    {selectedVillage
                      ? (T.welcomeSubWithV[lang === 'gu' ? 'gu' : 'en'] as (v: string) => string)(villageName)
                      : t('welcomeSub', lang)}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 10, width: '100%', maxWidth: 600 }}>
                    {QUICK_PROMPTS.map(p => (
                      <button key={p.label} className="cp-quick cp-quick-btn" onClick={() => send(lang === 'gu' ? p.gu : p.label)}
                        style={{
                          display: 'flex', alignItems: 'flex-start', gap: 10, padding: '12px 14px',
                          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-glass)',
                          borderRadius: 10, cursor: 'pointer', textAlign: 'left', color: 'var(--text-main)',
                          fontSize: '0.82rem', lineHeight: 1.4, transition: 'all 0.2s',
                        }}>
                        <span style={{ color: '#3b82f6', marginTop: 1, flexShrink: 0 }}>{p.icon}</span>
                        <span>{lang === 'gu' ? p.gu : p.label}</span>
                        <ChevronRight size={13} style={{ marginLeft: 'auto', marginTop: 2, color: '#475569', flexShrink: 0 }} />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Messages */}
              {messages.map((m) => (
                <div key={m.id} className="cp-msg" style={{
                  display: 'flex',
                  flexDirection: m.role === 'user' ? 'row-reverse' : 'row',
                  gap: 10, alignItems: 'flex-start',
                }}>
                  {/* Avatar */}
                  {m.role === 'assistant' && (
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2 }}>
                      <Bot size={16} color="#fff" />
                    </div>
                  )}
                  <div style={{ maxWidth: '75%', display: 'flex', flexDirection: 'column', gap: 4, alignItems: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                    <div className={m.role === 'assistant' ? 'cp-ai-bubble' : ''}
                      style={{
                        padding: '11px 15px', borderRadius: m.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                        background: m.role === 'user'
                          ? 'linear-gradient(135deg,#1d4ed8,#2563eb)'
                          : 'rgba(255,255,255,0.05)',
                        border: m.role === 'user' ? 'none' : '1px solid var(--border-glass)',
                        color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: 1.65,
                        boxShadow: m.role === 'user' ? '0 4px 14px rgba(37,99,235,0.3)' : 'none',
                      }}>
                      {m.role === 'assistant'
                        ? <div dangerouslySetInnerHTML={{ __html: parseMarkdown(m.text) }} />
                        : m.text}
                    </div>

                    {/* Message footer */}
                    <div className="cp-msg-footer" style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.65rem', color: '#475569', padding: '0 4px' }}>
                      <Clock size={10} />
                      <span>{m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {m.role === 'assistant' && (
                        <>
                          <span style={{ color: m.demo ? '#f59e0b' : '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                            {m.demo ? <><Settings size={10} /> Demo</> : <><Sparkles size={10} /> Granite</>}
                          </span>
                          {m.confidence && (
                            <span style={{ padding: '1px 6px', borderRadius: 3, background: 'rgba(59,130,246,0.1)', color: '#60a5fa', fontWeight: 700, fontSize: '0.6rem' }}>
                              {m.confidence}
                            </span>
                          )}
                          <CopyBtn text={m.text} lang={lang} />
                        </>
                      )}
                    </div>

                    {/* Sources */}
                    {m.sources && m.sources.length > 0 && (
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', padding: '0 4px' }}>
                        {m.sources.map(s => (
                          <span key={s.label} className="cp-source-tag" style={{ fontSize: '0.62rem', padding: '2px 7px', borderRadius: 4, background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', color: '#818cf8' }}>
                            {s.label}: {s.value}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="cp-msg" style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 9, background: 'linear-gradient(135deg,#1d4ed8,#7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Bot size={16} color="#fff" />
                  </div>
                  <div className="cp-typing-bubble" style={{ padding: '12px 16px', borderRadius: '16px 16px 16px 4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-glass)' }}>
                    <TypingIndicator />
                  </div>
                </div>
              )}

              </div>
            </div>

            {/* Suggestion chips — hidden on mobile to save vertical space */}
            {messages.length > 0 && !loading && !isMobile && (
              <div style={{ padding: '0 24px 8px', display: 'flex', gap: 6, flexWrap: 'wrap', flexShrink: 0 }}>
                {(lang === 'gu' ? CHIPS_GU : CHIPS_EN).map((c, i) => (
                  <button key={c} className="cp-chip" onClick={() => send(lang === 'gu' ? CHIPS_GU[i] : CHIPS_EN[i])}
                    style={{
                      padding: '5px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 600,
                      background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.25)',
                      color: '#93c5fd', cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap',
                    }}>
                    {c}
                  </button>
                ))}
              </div>
            )}

            {/* Demo mode banner */}
            {demoMode && (
              <div className="cp-demo-banner" style={{
                margin: isMobile ? '0 10px 8px' : '0 24px 8px', padding: '8px 14px', borderRadius: 8,
                background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)',
                fontSize: '0.72rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0,
              }}>
                <WifiOff size={12} color="#f59e0b" />
                <span style={{ color: '#d97706' }}>
                  <strong>{t('demoTitle', lang)}</strong> — {t('demoDesc', lang)}{' '}
                  <code style={{ background: 'rgba(245,158,11,0.15)', padding: '0 4px', borderRadius: 3 }}>WATSONX_API_KEY</code>{' '}
                  {t('demoDesc2', lang)}
                </span>
              </div>
            )}

            {/* Input row */}
            <div className="cp-input-row" style={{
              padding: isMobile ? '8px 10px 12px' : '8px 24px 14px', borderTop: '1px solid var(--border-glass)',
              background: 'rgba(0,0,0,0.15)', flexShrink: 0,
            }}>
              <div className="cp-input-box" style={{
                display: 'flex', gap: 10, alignItems: 'center',
                background: 'rgba(255,255,255,0.04)', border: `1px solid ${focused ? 'rgba(59,130,246,0.5)' : 'var(--border-glass)'}`,
                borderRadius: 14, padding: '0 10px 0 16px',
                transition: 'border-color 0.2s, box-shadow 0.2s',
                boxShadow: focused ? '0 0 0 2px rgba(59,130,246,0.1)' : 'none',
              }}>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={handleTextareaChange}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder={isMobile ? t('inputPlaceholderMobile', lang) : t('inputPlaceholder', lang)}
                  disabled={loading}
                  rows={1}
                  autoComplete="off"
                  spellCheck={false}
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    boxShadow: 'none',
                    color: 'var(--text-main)', fontSize: '0.9rem', lineHeight: 1.5,
                    resize: 'none', padding: '10px 0', minHeight: 24, maxHeight: 140,
                    caretColor: '#60a5fa', fontFamily: 'inherit',
                  }}
                />
                <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', flexShrink: 0 }}>
                  {messages.length > 0 && (
                    <button onClick={() => { if (activeConvId) updateMessages(activeConvId, []); }} title="Clear chat"
                      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 7, color: '#475569', display: 'flex', transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#475569')}
                    >
                      <RotateCcw size={15} />
                    </button>
                  )}
                  <button className="cp-send" onClick={() => send()} disabled={loading || !input.trim()}
                    style={{
                      width: 36, height: 36, borderRadius: 9, background: '#3b82f6',
                      border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      transition: 'background 0.2s', flexShrink: 0,
                    }}>
                    <Send size={16} color="#fff" />
                  </button>
                </div>
              </div>
              {!isMobile && (
                <div className="cp-hint-text" style={{ fontSize: '0.62rem', color: '#334155', textAlign: 'center', marginTop: 6 }}>
                  {t('inputHint', lang)}
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Context panel ── */}
          {contextVisible && (
            <div className={isTablet ? 'cp-drawer-right' : ''}
              style={isTablet ? {
                position: 'absolute', top: 0, right: 0, bottom: 0, zIndex: 210,
                boxShadow: '-4px 0 24px rgba(0,0,0,0.5)',
              } : {}}>
              <ContextPanel villageId={selectedVillage} villages={villages} ctx={ctx} lang={lang} />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
