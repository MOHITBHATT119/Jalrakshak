import React, { useState, useEffect, useRef } from 'react';
import {
  Bot, X, Send, Sparkles, MessageSquare, Minimize2,
  Settings as SettingsIcon, Check, ExternalLink, RefreshCw,
  Languages, ChevronRight, Droplets, Info
} from 'lucide-react';
import { sendCopilot, getVillages, Village } from '../../services/api';
import { useLanguage } from '../../context/LanguageContext';

export interface WatsonConfig {
  integrationID: string;
  region: string;
  serviceInstanceID: string;
  useOfficialScript: boolean;
}

const STORAGE_KEY = 'jalrakshak_watson_config';

const DEFAULT_CONFIG: WatsonConfig = {
  integrationID: (import.meta as any).env?.VITE_WATSON_ASSISTANT_INTEGRATION_ID || '',
  region: (import.meta as any).env?.VITE_WATSON_ASSISTANT_REGION || 'us-south',
  serviceInstanceID: (import.meta as any).env?.VITE_WATSON_ASSISTANT_SERVICE_INSTANCE_ID || '',
  useOfficialScript: false,
};

function loadStoredConfig(): WatsonConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_CONFIG;
}

function saveConfig(cfg: WatsonConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg));
  } catch {
    // ignore
  }
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  time: string;
}

const SUGGESTIONS = [
  { en: 'What is the groundwater status in Amreli?', gu: 'અમરેલીમાં ભૂગર્ભ જળની સ્થિતિ શું છે?' },
  { en: 'Which crop saves the most water in Saurashtra?', gu: 'સૌરાષ્ટ્રમાં કયો પાક સૌથી ઓછું પાણી વાપરે છે?' },
  { en: 'How to plan rainwater recharge for my village?', gu: 'મારા ગામ માટે વરસાદી પાણી રિચાર્જ કેવી રીતે આયોજન કરવું?' },
];

export default function WatsonAssistantChat() {
  const { lang, setLang } = useLanguage();
  const [config, setConfig] = useState<WatsonConfig>(loadStoredConfig);
  const [isOpen, setIsOpen] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [villages, setVillages] = useState<Village[]>([]);
  const [selectedVillage, setSelectedVillage] = useState<string>('');
  const [tempConfig, setTempConfig] = useState<WatsonConfig>(config);
  const [configSaved, setConfigSaved] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load villages for context
  useEffect(() => {
    getVillages()
      .then(res => {
        if (res && Array.isArray(res.villages)) {
          setVillages(res.villages);
          if (res.villages.length > 0) {
            setSelectedVillage(res.villages[0].village_id);
          }
        }
      })
      .catch(() => {});
  }, []);

  // Check if official IBM Watson Assistant script should be loaded
  useEffect(() => {
    if (config.useOfficialScript && config.integrationID && config.serviceInstanceID) {
      // Official IBM Watson Assistant web chat loader
      const w = window as any;
      w.watsonAssistantChatOptions = {
        integrationID: config.integrationID,
        region: config.region || 'us-south',
        serviceInstanceID: config.serviceInstanceID,
        onLoad: async (instance: any) => {
          await instance.render();
        },
      };

      const existingScript = document.getElementById('watson-assistant-script');
      if (!existingScript) {
        const script = document.createElement('script');
        script.id = 'watson-assistant-script';
        script.src = `https://web-chat.global.assistant.watson.appdomain.cloud/loadWatsonAssistantChat.js`;
        document.head.appendChild(script);
      }
    }
  }, [config]);

  // Initial welcome message
  useEffect(() => {
    if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          text: lang === 'gu'
            ? 'નમસ્તે! હું IBM Watson Assistant છું. હું સૌરાષ્ટ્રના જળ વ્યવસ્થાપન, ભૂગર્ભ જળ, દુષ્કાળ ચેતવણી અને પાક પસંદગી અંગે તમને સહાય કરી શકું છું. તમે કઈ માહિતી જાણવા માંગો છો?'
            : 'Hello! I am your IBM Watson Assistant for JalRakshak AI. Ask me anything about groundwater depth, rainfall deficits, crop advisory, or recharge planning.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        }
      ]);
    }
  }, [lang]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: ChatMessage = {
      id: String(Date.now()),
      role: 'user',
      text: query,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await sendCopilot(query, selectedVillage || undefined, lang);
      const assistantMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        text: res.response || (lang === 'gu' ? 'જવાબ તૈયાર કરવામાં અસમર્થ.' : 'No response received.'),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: String(Date.now() + 1),
        role: 'assistant',
        text: lang === 'gu'
          ? 'માફ કરશો, સર્વર સાથે જોડાણ થઈ શક્યું નથી. કૃપા કરીને બેકએન્ડ શરૂ છે કે નહીં તે ચકાસો.'
          : 'Could not connect to the backend server. Please verify the backend is running on port 8001.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = () => {
    setConfig(tempConfig);
    saveConfig(tempConfig);
    setConfigSaved(true);
    setTimeout(() => {
      setConfigSaved(false);
      setShowConfigModal(false);
    }, 1200);
  };

  // If official script is active and loaded, IBM Watson Assistant renders its own official overlay
  if (config.useOfficialScript && config.integrationID && config.serviceInstanceID) {
    return null;
  }

  return (
    <>
      {/* ── FLOATING BUTTON (BOTTOM RIGHT) ── */}
      {!isOpen && (
        <button
          id="ibm-watson-chatbot-launcher"
          onClick={() => setIsOpen(true)}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '12px 18px',
            borderRadius: 30,
            background: 'linear-gradient(135deg, #0f62fe 0%, #0043ce 100%)',
            color: '#fff',
            border: '1px solid rgba(255, 255, 255, 0.25)',
            boxShadow: '0 8px 30px rgba(15, 98, 254, 0.45), 0 0 15px rgba(56, 189, 248, 0.3)',
            cursor: 'pointer',
            fontFamily: 'Inter, system-ui, sans-serif',
            fontSize: '0.88rem',
            fontWeight: 700,
            transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            backdropFilter: 'blur(8px)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
            e.currentTarget.style.boxShadow = '0 12px 35px rgba(15, 98, 254, 0.6), 0 0 20px rgba(56, 189, 248, 0.4)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.transform = 'translateY(0) scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 30px rgba(15, 98, 254, 0.45), 0 0 15px rgba(56, 189, 248, 0.3)';
          }}
        >
          <div style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: 'rgba(255, 255, 255, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Bot size={17} color="#fff" />
          </div>
          <span>{lang === 'gu' ? 'IBM Watson ચેટબોટ' : 'IBM Watson Assistant'}</span>
          <span style={{
            display: 'inline-block',
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#34d399',
            boxShadow: '0 0 8px #34d399',
          }} />
        </button>
      )}

      {/* ── CHAT WINDOW (EXPANDED) ── */}
      {isOpen && (
        <div
          id="ibm-watson-chat-window"
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            width: 400,
            maxWidth: 'calc(100vw - 32px)',
            height: 600,
            maxHeight: 'calc(100vh - 48px)',
            borderRadius: 16,
            background: '#0a0f1d',
            border: '1px solid rgba(59, 130, 246, 0.3)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 30px rgba(15, 98, 254, 0.25)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'Inter, system-ui, sans-serif',
            animation: 'watsonSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        >
          <style>{`
            @keyframes watsonSlideUp {
              from { opacity: 0; transform: translateY(16px) scale(0.96); }
              to { opacity: 1; transform: translateY(0) scale(1); }
            }
            .watson-chip:hover {
              background: rgba(59, 130, 246, 0.25) !important;
              border-color: rgba(59, 130, 246, 0.5) !important;
            }
          `}</style>

          {/* ── HEADER ── */}
          <div style={{
            padding: '12px 16px',
            background: 'linear-gradient(135deg, #0f62fe 0%, #1e40af 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid rgba(255, 255, 255, 0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 34,
                height: 34,
                borderRadius: 10,
                background: 'rgba(255, 255, 255, 0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
              }}>
                <Bot size={19} color="#fff" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', lineHeight: 1.2 }}>
                  IBM Watson Assistant
                </div>
                <div style={{ fontSize: '0.72rem', color: '#93c5fd', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399' }} />
                  {lang === 'gu' ? 'ઓનલાઇન · AI જળ સહાયક' : 'Online · Watsonx AI'}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {/* Language toggle */}
              <button
                onClick={() => setLang(lang === 'en' ? 'gu' : 'en')}
                title="Toggle Language (English / Gujarati)"
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  padding: '4px 8px',
                  borderRadius: 12,
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Languages size={12} />
                <span>{lang === 'en' ? 'GU' : 'EN'}</span>
              </button>

              {/* Config button */}
              <button
                onClick={() => {
                  setTempConfig(config);
                  setShowConfigModal(v => !v);
                }}
                title="IBM Watson Assistant Settings"
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <SettingsIcon size={14} />
              </button>

              {/* Close / Minimize */}
              <button
                onClick={() => setIsOpen(false)}
                title="Minimize"
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  color: '#fff',
                  width: 28,
                  height: 28,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* ── SETTINGS DRAWER OVERLAY ── */}
          {showConfigModal && (
            <div style={{
              background: '#0d1527',
              borderBottom: '1px solid rgba(59, 130, 246, 0.3)',
              padding: '14px 16px',
              fontSize: '0.8rem',
              color: '#cbd5e1',
            }}>
              <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#60a5fa', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <SettingsIcon size={14} /> IBM Watson Assistant Integration
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginBottom: 12 }}>
                Connect your live IBM Cloud Watson Assistant instance:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: 3 }}>
                    Integration ID:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 5e0b6d21-..."
                    value={tempConfig.integrationID}
                    onChange={e => setTempConfig({ ...tempConfig, integrationID: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontSize: '0.78rem',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.7rem', color: '#94a3b8', marginBottom: 3 }}>
                    Service Instance ID:
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 43a0d5c8-..."
                    value={tempConfig.serviceInstanceID}
                    onChange={e => setTempConfig({ ...tempConfig, serviceInstanceID: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '6px 10px',
                      borderRadius: 6,
                      background: 'rgba(0,0,0,0.4)',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#fff',
                      fontSize: '0.78rem',
                      fontFamily: 'monospace',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', fontSize: '0.74rem' }}>
                    <input
                      type="checkbox"
                      checked={tempConfig.useOfficialScript}
                      onChange={e => setTempConfig({ ...tempConfig, useOfficialScript: e.target.checked })}
                    />
                    <span>Load official IBM web-chat script</span>
                  </label>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 6 }}>
                  <button
                    onClick={() => setShowConfigModal(false)}
                    style={{
                      padding: '5px 12px',
                      borderRadius: 6,
                      background: 'transparent',
                      border: '1px solid rgba(255,255,255,0.15)',
                      color: '#94a3b8',
                      fontSize: '0.75rem',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveConfiguration}
                    style={{
                      padding: '5px 14px',
                      borderRadius: 6,
                      background: '#0f62fe',
                      border: 'none',
                      color: '#fff',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    {configSaved ? <Check size={13} /> : null}
                    {configSaved ? 'Saved!' : 'Save Settings'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ── VILLAGE CONTEXT BAR ── */}
          <div style={{
            padding: '6px 12px',
            background: 'rgba(15, 98, 254, 0.08)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.06)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.72rem',
            color: '#94a3b8',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <Droplets size={12} color="#38bdf8" />
              <span>{lang === 'gu' ? 'સંદર્ભ ગામ:' : 'Village Context:'}</span>
            </div>
            <select
              value={selectedVillage}
              onChange={e => setSelectedVillage(e.target.value)}
              style={{
                background: '#0d1527',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: '#e2e8f0',
                borderRadius: 4,
                padding: '2px 6px',
                fontSize: '0.72rem',
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              {villages.map(v => (
                <option key={v.village_id} value={v.village_id}>
                  {v.name} ({v.district})
                </option>
              ))}
            </select>
          </div>

          {/* ── MESSAGES LIST ── */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}>
            {messages.map(msg => (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: msg.role === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                    background: msg.role === 'user'
                      ? 'linear-gradient(135deg, #0f62fe 0%, #1d4ed8 100%)'
                      : 'rgba(255, 255, 255, 0.06)',
                    color: '#f8fafc',
                    fontSize: '0.84rem',
                    lineHeight: 1.5,
                    border: msg.role === 'user'
                      ? '1px solid rgba(255, 255, 255, 0.15)'
                      : '1px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: msg.role === 'user'
                      ? '0 4px 12px rgba(15, 98, 254, 0.3)'
                      : 'none',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {msg.text}
                </div>
                <div style={{ fontSize: '0.66rem', color: '#64748b', marginTop: 3, padding: '0 4px' }}>
                  {msg.time}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '10px 14px',
                borderRadius: '14px 14px 14px 2px',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                alignSelf: 'flex-start',
                color: '#93c5fd',
                fontSize: '0.8rem',
              }}>
                <RefreshCw size={13} className="spin" style={{ animation: 'spin 1s linear infinite' }} />
                <span>{lang === 'gu' ? 'IBM Watson વિચારી રહ્યું છે…' : 'IBM Watson is thinking…'}</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* ── QUICK SUGGESTIONS ── */}
          {messages.length <= 2 && (
            <div style={{
              padding: '6px 12px 10px',
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
              borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>
                {lang === 'gu' ? 'ઝડપી પ્રશ્નો' : 'Suggested Questions'}
              </div>
              {SUGGESTIONS.map((s, idx) => (
                <button
                  key={idx}
                  className="watson-chip"
                  onClick={() => handleSend(lang === 'gu' ? s.gu : s.en)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.04)',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    borderRadius: 8,
                    padding: '6px 10px',
                    fontSize: '0.74rem',
                    color: '#cbd5e1',
                    textAlign: 'left',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    transition: 'all 0.15s',
                  }}
                >
                  <span>{lang === 'gu' ? s.gu : s.en}</span>
                  <ChevronRight size={12} color="#3b82f6" />
                </button>
              ))}
            </div>
          )}

          {/* ── INPUT BAR ── */}
          <form
            onSubmit={e => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: '10px 12px',
              background: '#070b14',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <input
              type="text"
              placeholder={lang === 'gu' ? 'IBM Watson ને જળ વિશે પૂછો...' : 'Ask IBM Watson about water...'}
              value={input}
              onChange={e => setInput(e.target.value)}
              disabled={loading}
              style={{
                flex: 1,
                padding: '9px 12px',
                borderRadius: 8,
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.12)',
                color: '#fff',
                fontSize: '0.84rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: input.trim() && !loading ? '#0f62fe' : 'rgba(255, 255, 255, 0.08)',
                border: 'none',
                color: input.trim() && !loading ? '#fff' : '#64748b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: input.trim() && !loading ? 'pointer' : 'default',
                transition: 'all 0.2s',
              }}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
