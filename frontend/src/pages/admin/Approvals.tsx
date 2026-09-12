import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import {
  CheckCircle2, XCircle, FlaskConical, Eye, Search, Filter,
  ClipboardList, ChevronDown, X, AlertCircle, CheckCircle,
  Waves, CloudRain, BarChart2, Cpu, Database, Users, Droplet,
  Sprout, ShieldAlert, TrendingDown, Calendar, MapPin, Info,
  Clock, BrainCircuit, History, RefreshCw,
} from 'lucide-react';
import { getVillages, getHealth, Village } from '../../services/api';

// ─── Types ────────────────────────────────────────────────────────────────────

type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'TECHNICAL_REVIEW';
type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type RecType = 'Recharge' | 'Crop Switch' | 'Water Conservation' | 'Drought Response' | 'Infrastructure';

interface Evidence {
  groundwater: string;
  rainfall: string;
  waterBudget: string;
  communityRisk: string;
}

interface Recommendation {
  id: string;
  title: string;
  type: RecType;
  village: string;
  district: string;
  status: ApprovalStatus;
  priority: Priority;
  confidence: number;
  reason: string;
  supportingData: string[];
  agents: string[];
  createdAt: string;
  isDemo: boolean;
  // Detail panel fields
  whyRecommended: string;
  evidence: Evidence;
  expectedBenefit: string;
  budgetImpact: string;
  assumptions: string;
  dataSources: string[];
}

interface HistoryEntry {
  id: string;
  recId: string;
  ts: string;
  action: string;
  user: string;
  prevStatus: ApprovalStatus;
  newStatus: ApprovalStatus;
  comment: string;
}

// ─── localStorage ─────────────────────────────────────────────────────────────

const LS_RECS  = 'jalrakshak_approvals_recs';
const LS_HIST  = 'jalrakshak_approvals_history';
const LS_PLANS = 'jalrakshak_action_plans';

function loadRecs(): Recommendation[] {
  try { const r = localStorage.getItem(LS_RECS); if (r) return JSON.parse(r); } catch {}
  return SEED_RECS;
}
function saveRecs(d: Recommendation[]) {
  try { localStorage.setItem(LS_RECS, JSON.stringify(d)); } catch {}
}
function loadHist(): HistoryEntry[] {
  try { const r = localStorage.getItem(LS_HIST); if (r) return JSON.parse(r); } catch {}
  return [];
}
function saveHist(d: HistoryEntry[]) {
  try { localStorage.setItem(LS_HIST, JSON.stringify(d)); } catch {}
}

// ─── Action Plan integration ──────────────────────────────────────────────────

interface StoredPlan {
  id: string; title: string; interventionType: string; village: string;
  district: string; status: string; budget: number; startDate: string;
  targetDate: string; owner: string; priority: string; description: string;
}
function loadStoredPlans(): StoredPlan[] {
  try { const r = localStorage.getItem(LS_PLANS); if (r) return JSON.parse(r); } catch {}
  return [];
}
function appendPlan(p: StoredPlan) {
  const plans = loadStoredPlans();
  const nums = plans.map(x => parseInt(x.id.replace('AP-', ''), 10)).filter(n => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 105;
  p.id = `AP-${max + 1}`;
  plans.unshift(p);
  try { localStorage.setItem(LS_PLANS, JSON.stringify(plans)); } catch {}
}

// ─── Seed data ────────────────────────────────────────────────────────────────

const SEED_RECS: Recommendation[] = [
  {
    id: 'REC-001', title: 'Construct 2 Check Dams in Upper Watershed',
    type: 'Recharge', village: 'Bhavnagar_V1', district: 'Bhavnagar',
    status: 'PENDING', priority: 'CRITICAL', confidence: 91, isDemo: true,
    reason: 'Groundwater depth has declined 34% since 2019. Aquifer recharge is the highest-priority intervention to prevent complete depletion before next monsoon.',
    supportingData: ['Groundwater depth: 18.4m (critical)', 'Annual decline: 1.3m/yr', 'Recharge potential: 1.4 MCM'],
    agents: ['Groundwater Agent', 'Recharge Agent', 'IBM Granite'],
    createdAt: '2025-06-10T09:14:00Z',
    whyRecommended: 'Multi-year groundwater timeseries shows accelerating depletion. Two topographically suitable check-dam sites identified in the upper watershed with high runoff capture potential. IBM Granite synthesis confirmed this as the highest-impact action.',
    evidence: {
      groundwater: 'Depth at 18.4m vs historical 12.1m. Annual change −1.3m/yr for 3 consecutive seasons. Severity: CRITICAL.',
      rainfall: 'Rainfall 42% below 10-year normal in last 2 seasons. Low recharge from natural infiltration.',
      waterBudget: 'Supply: 3.2 MCM. Demand: 5.8 MCM. Deficit: 2.6 MCM. Status: CRITICAL.',
      communityRisk: '2,847 people dependent on this aquifer. Agricultural area: 840 ha. Primary crop: Cotton (high water use).',
    },
    expectedBenefit: 'Estimated 1.4 MCM additional annual recharge. Projected to reduce groundwater decline rate by 60% within 2 seasons. Supports 420 ha of irrigated agriculture.',
    budgetImpact: '₹18–22 Lakh for 2 check dams. Estimated ROI: ₹4.2L/year in avoided water stress costs.',
    assumptions: 'Assumes monsoon rainfall ≥ 450mm. Site suitability based on topographic analysis and soil permeability data. Community cooperation required for land access.',
    dataSources: ['CGWB groundwater depth database', 'IMD rainfall records', 'Topographic DEM analysis', 'Soil permeability surveys'],
  },
  {
    id: 'REC-002', title: 'Shift Kharif Crop to Pearl Millet (Bajra)',
    type: 'Crop Switch', village: 'Amreli_V4', district: 'Amreli',
    status: 'PENDING', priority: 'HIGH', confidence: 83, isDemo: true,
    reason: 'Current cotton cultivation requires 950mm/season under drought stress conditions. Switching to bajra reduces agricultural water demand by 58% and maintains income viability.',
    supportingData: ['Cotton water need: 950mm', 'Bajra water need: 350mm', 'Saving: 58% reduction', 'Market price: Viable'],
    agents: ['Crop Advisor Agent', 'Drought Agent', 'IBM Granite'],
    createdAt: '2025-06-09T14:22:00Z',
    whyRecommended: 'Drought risk scored at 78%. Under current conditions cotton yields are projected to drop 45%. Pearl millet is drought-tolerant, matches soil profile, and has stable MSP support.',
    evidence: {
      groundwater: 'Depth at 14.2m. Annual change −1.1m/yr. Severity: HIGH.',
      rainfall: 'Rainfall 38% below normal. Drought risk score 78%.',
      waterBudget: 'Agricultural demand 71% of total. Switching crop reduces total demand by ~41%.',
      communityRisk: '1,240 farmers in the command area. Average landholding: 2.4 ha.',
    },
    expectedBenefit: 'Reduces agricultural water demand by ~2.3 MCM/season. Improves groundwater balance by 40%. Maintains farmer income through MSP-backed bajra procurement.',
    budgetImpact: '₹2.5L for seed subsidies + ₹1L farmer training. Cost-recovery in 1 season.',
    assumptions: 'Requires MSP procurement infrastructure. Assumes farmer willingness. Market price parity maintained.',
    dataSources: ['Crop water requirement database', 'NFSM crop suitability maps', 'IMD drought index', 'Farmer census data'],
  },
  {
    id: 'REC-003', title: 'Install Drip Irrigation on 320 ha',
    type: 'Water Conservation', village: 'Rajkot_V2', district: 'Rajkot',
    status: 'APPROVED', priority: 'HIGH', confidence: 87, isDemo: true,
    reason: 'Flood irrigation efficiency at 42%. Drip systems achieve 88–92% efficiency, reducing overall water use by 46% on the same cropped area.',
    supportingData: ['Current irrigation efficiency: 42%', 'Drip efficiency: 90%', 'Area: 320 ha', 'Water saving: 1.8 MCM/yr'],
    agents: ['Water Budget Agent', 'Recharge Agent', 'IBM Granite'],
    createdAt: '2025-06-07T10:05:00Z',
    whyRecommended: 'Water budget analysis shows 71% of demand is agricultural. Field surveys confirm flood irrigation dominance. Drip irrigation subsidy is available under PMKSY. Payback period: 2.2 years.',
    evidence: {
      groundwater: 'Depth at 11.8m. Stable trend. Moderate risk.',
      rainfall: 'Rainfall near normal. Deficit largely from inefficient irrigation.',
      waterBudget: 'Demand: 4.8 MCM. 71% agricultural. Drip would save 1.8 MCM annually.',
      communityRisk: 'Moderate risk. Irrigation efficiency main driver of water stress.',
    },
    expectedBenefit: '1.8 MCM/yr water saving. Groundwater recharge improves. Yield quality improvement from precision irrigation.',
    budgetImpact: '₹12L total. 50% subsidy available under PMKSY. Net cost: ₹6L.',
    assumptions: 'PMKSY subsidy continuity assumed. Farmer training required. Power supply reliability needed.',
    dataSources: ['Farm census', 'Irrigation efficiency surveys', 'PMKSY eligibility database', 'Water budget model'],
  },
  {
    id: 'REC-004', title: 'Emergency Drought Relief: Water Tanker Routes',
    type: 'Drought Response', village: 'Morbi_V3', district: 'Morbi',
    status: 'REJECTED', priority: 'CRITICAL', confidence: 76, isDemo: true,
    reason: 'Immediate water supply shortage. Village wells below critical threshold (2.1m). Tanker routing recommended as bridge measure pending recharge infrastructure.',
    supportingData: ['Well depth: 2.1m (critical)', 'Days of supply: ~18', 'Population: 1,840', 'Alternative source: 14km away'],
    agents: ['Groundwater Agent', 'Community Priority Agent', 'IBM Granite'],
    createdAt: '2025-06-05T08:30:00Z',
    whyRecommended: 'Groundwater at emergency level. Immediate intervention needed. Tanker routing identified as fastest deployable option while structural recharge solutions are implemented.',
    evidence: {
      groundwater: 'Well depth 2.1m. Historical minimum 4.8m. Immediate emergency.',
      rainfall: 'No forecast rainfall in next 21 days. Prolonged dry spell.',
      waterBudget: 'Supply: 0.4 MCM. Demand: 1.2 MCM. Critical deficit.',
      communityRisk: '1,840 people. 3 schools, 1 health center at risk.',
    },
    expectedBenefit: 'Immediate water security for 1,840 residents for 60 days while permanent solution is implemented.',
    budgetImpact: '₹4.2L for 60-day tanker operations.',
    assumptions: 'Road access confirmed. Tanker availability from district depot. Emergency fund allocation needed.',
    dataSources: ['CGWB emergency monitoring', 'District water supply dept', 'IMD 21-day forecast'],
  },
  {
    id: 'REC-005', title: 'Percolation Tank Restoration — 3 Sites',
    type: 'Recharge', village: 'Jamnagar_V1', district: 'Jamnagar',
    status: 'TECHNICAL_REVIEW', priority: 'MEDIUM', confidence: 79, isDemo: true,
    reason: '3 percolation tanks have silted up to 80% capacity. Desilting and bund repair would restore 0.9 MCM annual recharge potential.',
    supportingData: ['Silt load: 78–84%', 'Recharge loss: 0.9 MCM/yr', 'Repair cost: ₹8.5L', 'Last maintained: 2018'],
    agents: ['Recharge Agent', 'Groundwater Agent', 'IBM Granite'],
    createdAt: '2025-06-08T16:45:00Z',
    whyRecommended: 'Infrastructure audit reveals 3 percolation tanks with heavy siltation. Restoration is highly cost-effective vs new construction. Hydrological model confirms restored recharge potential.',
    evidence: {
      groundwater: 'Depth at 13.6m. Declining at 0.8m/yr. Moderate-high risk.',
      rainfall: 'Normal to slightly below normal. Percolation infrastructure critical for harvesting available rainfall.',
      waterBudget: 'Current recharge: 0.3 MCM. Post-restoration: 1.2 MCM.',
      communityRisk: '2,100 people. Moderate risk, trending high.',
    },
    expectedBenefit: 'Restore 0.9 MCM annual recharge. Arrest groundwater decline. Benefit 2,100 residents and 560 ha farmland.',
    budgetImpact: '₹8.5L for desilting + bund repair. Cost per MCM restored: ₹9.4L — highly cost-effective.',
    assumptions: 'Assumes silt can be used locally as soil amendment. Access roads to tank sites required.',
    dataSources: ['Field inspection reports 2024', 'GWSSB infrastructure database', 'Hydrological recharge model'],
  },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusColor(s: ApprovalStatus) {
  switch (s) {
    case 'APPROVED':         return '#22c55e';
    case 'REJECTED':         return '#ef4444';
    case 'TECHNICAL_REVIEW': return '#f59e0b';
    default:                 return '#3b82f6';
  }
}
function statusBg(s: ApprovalStatus) {
  switch (s) {
    case 'APPROVED':         return 'rgba(34,197,94,0.12)';
    case 'REJECTED':         return 'rgba(239,68,68,0.12)';
    case 'TECHNICAL_REVIEW': return 'rgba(245,158,11,0.12)';
    default:                 return 'rgba(59,130,246,0.12)';
  }
}
function statusLabel(s: ApprovalStatus) {
  switch (s) {
    case 'TECHNICAL_REVIEW': return 'Tech Review';
    case 'APPROVED':         return 'Approved';
    case 'REJECTED':         return 'Rejected';
    default:                 return 'Pending';
  }
}
function priorityColor(p: Priority) {
  switch (p) {
    case 'CRITICAL': return '#ef4444';
    case 'HIGH':     return '#f97316';
    case 'MEDIUM':   return '#f59e0b';
    case 'LOW':      return '#22c55e';
  }
}
function confColor(c: number) {
  return c >= 85 ? '#22c55e' : c >= 70 ? '#f59e0b' : '#ef4444';
}
function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}
function nowIso() { return new Date().toISOString(); }
function nowTs() {
  return new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}
function recTypeColor(t: RecType) {
  switch (t) {
    case 'Recharge':          return '#06b6d4';
    case 'Crop Switch':       return '#22c55e';
    case 'Water Conservation':return '#8b5cf6';
    case 'Drought Response':  return '#ef4444';
    case 'Infrastructure':    return '#f59e0b';
  }
}
function typeIcon(t: RecType) {
  switch (t) {
    case 'Recharge':          return <Droplet size={13} />;
    case 'Crop Switch':       return <Sprout size={13} />;
    case 'Water Conservation':return <Waves size={13} />;
    case 'Drought Response':  return <CloudRain size={13} />;
    case 'Infrastructure':    return <BarChart2 size={13} />;
  }
}
const ALL_REC_TYPES: RecType[] = ['Recharge', 'Crop Switch', 'Water Conservation', 'Drought Response', 'Infrastructure'];

// ─── Shared micro-components ─────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
  borderRadius: 12, padding: '18px 20px',
};
const labelStyle: React.CSSProperties = {
  fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5, display: 'block',
};
function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>{children}</div>;
}
function EvidenceBlock({ label, text }: { label: string; text: string }) {
  return (
    <div style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', borderRadius: 8, padding: '10px 12px', marginBottom: 8 }}>
      <div style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.55 }}>{text}</div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function Approvals() {
  const { t } = useLanguage();
  const nav = useNavigate();

  const [recs, setRecs]       = useState<Recommendation[]>(loadRecs);
  const [history, setHistory] = useState<HistoryEntry[]>(loadHist);
  const [villages, setVillages] = useState<Village[]>([]);
  const [isDemo, setIsDemo]   = useState(true);

  // filters
  const [search, setSearch]           = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterPriority, setFilterPriority] = useState<string>('ALL');
  const [filterVillage, setFilterVillage]   = useState<string>('ALL');
  const [filterType, setFilterType]         = useState<string>('ALL');

  // modals
  const [detailRec, setDetailRec]     = useState<Recommendation | null>(null);
  const [rejectRec, setRejectRec]     = useState<Recommendation | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectErr, setRejectErr]     = useState('');
  const [apModal, setApModal]         = useState<Recommendation | null>(null);

  // toast
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // history panel
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    getVillages().then(d => setVillages(Array.isArray(d?.villages) ? d.villages : [])).catch(() => {});
    getHealth().then(h => setIsDemo(h.demo_mode)).catch(() => {});
  }, []);

  useEffect(() => { saveRecs(recs); }, [recs]);
  useEffect(() => { saveHist(history); }, [history]);

  // auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // ── History helper ──────────────────────────────────────────────────────────
  const addHistory = useCallback((recId: string, action: string, prevStatus: ApprovalStatus, newStatus: ApprovalStatus, comment = '') => {
    const entry: HistoryEntry = {
      id: `H-${Date.now()}`, recId, ts: nowTs(),
      action, user: 'Administrator', prevStatus, newStatus, comment,
    };
    setHistory(prev => [entry, ...prev]);
  }, []);

  // ── Actions ─────────────────────────────────────────────────────────────────

  const approve = (rec: Recommendation) => {
    setRecs(prev => prev.map(r => r.id === rec.id ? { ...r, status: 'APPROVED' } : r));
    addHistory(rec.id, 'Approved', rec.status, 'APPROVED');
    setToast({ msg: `Recommendation "${rec.title}" approved.`, type: 'success' });
  };

  const submitReject = () => {
    if (!rejectRec) return;
    if (!rejectReason.trim()) { setRejectErr('Please provide a rejection reason.'); return; }
    setRecs(prev => prev.map(r => r.id === rejectRec.id ? { ...r, status: 'REJECTED' } : r));
    addHistory(rejectRec.id, 'Rejected', rejectRec.status, 'REJECTED', rejectReason.trim());
    setToast({ msg: `Recommendation rejected.`, type: 'success' });
    setRejectRec(null);
    setRejectReason('');
    setRejectErr('');
  };

  const requestReview = (rec: Recommendation) => {
    setRecs(prev => prev.map(r => r.id === rec.id ? { ...r, status: 'TECHNICAL_REVIEW' } : r));
    addHistory(rec.id, 'Sent to Technical Review', rec.status, 'TECHNICAL_REVIEW');
    setToast({ msg: `Sent for technical review.`, type: 'success' });
  };

  const createActionPlan = (rec: Recommendation) => {
    const plan: StoredPlan = {
      id: '', // will be set by appendPlan
      title: rec.title,
      interventionType: rec.type === 'Recharge' ? 'Check Dam' : rec.type === 'Crop Switch' ? 'Crop Switching' : rec.type === 'Water Conservation' ? 'Drip Irrigation' : rec.type === 'Drought Response' ? 'Other' : 'Percolation Tank',
      village: rec.village,
      district: rec.district,
      status: 'PLANNED',
      budget: 0,
      startDate: '',
      targetDate: '',
      owner: 'Administrator',
      priority: rec.priority,
      description: `Auto-created from AI Recommendation ${rec.id}. ${rec.reason}`,
    };
    appendPlan(plan);
    addHistory(rec.id, 'Action Plan Created', rec.status, rec.status, `Action Plan created from approval`);
    setToast({ msg: 'Action Plan created — visit Action Plans to complete it.', type: 'success' });
    setApModal(null);
    setDetailRec(null);
    setTimeout(() => nav('/admin/action-plan'), 800);
  };

  // ── Derived ──────────────────────────────────────────────────────────────────

  const counts = {
    PENDING:          recs.filter(r => r.status === 'PENDING').length,
    APPROVED:         recs.filter(r => r.status === 'APPROVED').length,
    REJECTED:         recs.filter(r => r.status === 'REJECTED').length,
    TECHNICAL_REVIEW: recs.filter(r => r.status === 'TECHNICAL_REVIEW').length,
  };

  const filteredRecs = recs.filter(r => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.title.toLowerCase().includes(q) || r.village.toLowerCase().includes(q) || r.district.toLowerCase().includes(q) || r.reason.toLowerCase().includes(q);
    const matchStatus   = filterStatus   === 'ALL' || r.status   === filterStatus;
    const matchPriority = filterPriority === 'ALL' || r.priority === filterPriority;
    const matchVillage  = filterVillage  === 'ALL' || r.village  === filterVillage;
    const matchType     = filterType     === 'ALL' || r.type     === filterType;
    return matchSearch && matchStatus && matchPriority && matchVillage && matchType;
  });

  const villageOptions = [...new Set(recs.map(r => r.village))].sort();

  const modalOpen = !!detailRec || !!rejectRec || !!apModal;

  // input helper
  const inputStyle = (err = false): React.CSSProperties => ({
    width: '100%', padding: '9px 12px', borderRadius: 8, fontFamily: 'inherit',
    fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
    background: 'var(--bg-dark)', color: 'var(--text-main)',
    border: `1px solid ${err ? '#ef4444' : 'var(--border-glass)'}`,
  });

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ color: 'var(--text-main)', animation: 'fadeInUp 0.4s ease-out' }}>

      {/* ── TOAST ──────────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 2100,
          display: 'flex', alignItems: 'center', gap: 10,
          background: toast.type === 'success' ? '#052e16' : '#450a0a',
          border: `1px solid ${toast.type === 'success' ? '#16a34a' : '#dc2626'}`,
          borderRadius: 10, padding: '12px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          color: toast.type === 'success' ? '#86efac' : '#fca5a5',
          fontSize: '0.875rem', fontWeight: 600, maxWidth: 400,
          animation: 'fadeInUp 0.3s ease-out',
        }}>
          {toast.type === 'success'
            ? <CheckCircle size={16} color="#22c55e" style={{ flexShrink: 0 }} />
            : <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />}
          {toast.msg}
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0, marginLeft: 4 }}><X size={14} /></button>
        </div>
      )}

      {/* ── MODAL BACKDROP ─────────────────────────────────────────────────── */}
      {modalOpen && (
        <div onClick={() => { setDetailRec(null); setRejectRec(null); setApModal(null); }}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)' }} />
      )}

      {/* ── VIEW DETAILS MODAL ─────────────────────────────────────────────── */}
      {detailRec && (
        <div onClick={e => e.stopPropagation()} style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          zIndex: 1100, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto',
          background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
          borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          animation: 'fadeInUp 0.25s ease-out',
        }}>
          {/* header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', background: 'var(--bg-dark)', padding: '2px 7px', borderRadius: 4, color: 'var(--text-muted)' }}>{detailRec.id}</span>
                <span style={{ fontSize: '0.72rem', padding: '2px 8px', borderRadius: 20, fontWeight: 800, background: statusBg(detailRec.status), color: statusColor(detailRec.status), border: `1px solid ${statusColor(detailRec.status)}44` }}>{statusLabel(detailRec.status)}</span>
                <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 20, fontWeight: 800, background: priorityColor(detailRec.priority) + '18', color: priorityColor(detailRec.priority), border: `1px solid ${priorityColor(detailRec.priority)}44` }}>{detailRec.priority}</span>
                {detailRec.isDemo && <span style={{ fontSize: '0.68rem', padding: '2px 8px', borderRadius: 20, fontWeight: 800, background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.3)' }}>Demo Data</span>}
              </div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.4 }}>{detailRec.title}</h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 4, display: 'flex', gap: 10 }}>
                <span><MapPin size={11} style={{ verticalAlign: 'middle' }} /> {detailRec.village} · {detailRec.district}</span>
                <span><Calendar size={11} style={{ verticalAlign: 'middle' }} /> {fmtDate(detailRec.createdAt)}</span>
              </div>
            </div>
            <button onClick={() => setDetailRec(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', flexShrink: 0, display: 'flex', padding: 4 }}><X size={20} /></button>
          </div>

          {/* body */}
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Why recommended */}
            <div>
              <SectionLabel>AI Recommendation</SectionLabel>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-main)', lineHeight: 1.65, background: 'rgba(59,130,246,0.07)', border: '1px solid rgba(59,130,246,0.15)', borderRadius: 8, padding: '12px 14px' }}>
                {detailRec.whyRecommended}
              </div>
            </div>

            {/* Evidence */}
            <div>
              <SectionLabel>Supporting Evidence</SectionLabel>
              <EvidenceBlock label="Groundwater Evidence" text={detailRec.evidence.groundwater} />
              <EvidenceBlock label="Rainfall / Drought Evidence" text={detailRec.evidence.rainfall} />
              <EvidenceBlock label="Water Budget Impact" text={detailRec.evidence.waterBudget} />
              <EvidenceBlock label="Community Risk" text={detailRec.evidence.communityRisk} />
            </div>

            {/* Benefit + Budget */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '12px 14px' }}>
                <SectionLabel>Expected Benefit</SectionLabel>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-main)', lineHeight: 1.55 }}>{detailRec.expectedBenefit}</div>
              </div>
              <div style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, padding: '12px 14px' }}>
                <SectionLabel>Budget Impact</SectionLabel>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-main)', lineHeight: 1.55 }}>{detailRec.budgetImpact}</div>
              </div>
            </div>

            {/* Confidence */}
            <div>
              <SectionLabel>Confidence Score</SectionLabel>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1, height: 8, background: 'var(--border-glass)', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${detailRec.confidence}%`, background: confColor(detailRec.confidence), borderRadius: 4, transition: 'width 0.6s ease' }} />
                </div>
                <span style={{ fontWeight: 800, fontSize: '1rem', color: confColor(detailRec.confidence), minWidth: 44 }}>{detailRec.confidence}%</span>
              </div>
            </div>

            {/* Agents + IBM */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <SectionLabel>Agents Involved</SectionLabel>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {detailRec.agents.map(a => (
                    <span key={a} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, background: 'rgba(139,92,246,0.1)', border: '1px solid rgba(139,92,246,0.2)', color: '#a78bfa' }}>
                      <BrainCircuit size={10} /> {a}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <SectionLabel>AI Model</SectionLabel>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px', background: 'rgba(59,130,246,0.07)', borderRadius: 8, border: '1px solid rgba(59,130,246,0.15)' }}>
                  <Cpu size={14} color="#3b82f6" />
                  <span style={{ fontSize: '0.82rem', fontWeight: 700 }}>IBM Granite 4 H Small</span>
                  {detailRec.isDemo && <span style={{ fontSize: '0.68rem', color: '#f59e0b' }}>(Demo)</span>}
                </div>
              </div>
            </div>

            {/* Data sources */}
            <div>
              <SectionLabel>Data Sources</SectionLabel>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {detailRec.dataSources.map(d => (
                  <span key={d} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', color: '#22d3ee' }}>
                    <Database size={10} /> {d}
                  </span>
                ))}
              </div>
            </div>

            {/* Assumptions */}
            <div style={{ background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '12px 14px' }}>
              <SectionLabel>Assumptions &amp; Limitations</SectionLabel>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.55 }}>{detailRec.assumptions}</div>
            </div>
          </div>

          {/* footer actions */}
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {detailRec.status === 'PENDING' && <>
              <button onClick={() => { approve(detailRec); setDetailRec(null); }} style={btnStyle('#22c55e')}><CheckCircle2 size={14} /> Approve</button>
              <button onClick={() => { setRejectRec(detailRec); setDetailRec(null); }} style={btnStyle('#ef4444')}><XCircle size={14} /> Reject</button>
              <button onClick={() => { requestReview(detailRec); setDetailRec(null); }} style={btnStyle('#f59e0b')}><FlaskConical size={14} /> Tech Review</button>
            </>}
            {detailRec.status === 'APPROVED' && (
              <button onClick={() => { setApModal(detailRec); }} style={btnStyle('#3b82f6')}><ClipboardList size={14} /> Create Action Plan</button>
            )}
            <button onClick={() => setDetailRec(null)} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
          </div>
        </div>
      )}

      {/* ── REJECT REASON MODAL ──────────────────────────────────────────────── */}
      {rejectRec && (
        <div onClick={e => e.stopPropagation()} style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          zIndex: 1100, width: '100%', maxWidth: 440,
          background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          animation: 'fadeInUp 0.25s ease-out', overflow: 'hidden',
        }}>
          <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <XCircle size={17} color="#ef4444" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>Reject Recommendation</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>Provide a reason for rejection.</div>
              </div>
            </div>
            <button onClick={() => { setRejectRec(null); setRejectReason(''); setRejectErr(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}><X size={18} /></button>
          </div>
          <div style={{ padding: '20px 22px' }}>
            <p style={{ margin: '0 0 14px', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
              Rejecting: <strong style={{ color: 'var(--text-main)' }}>"{rejectRec.title}"</strong>
            </p>
            <label style={labelStyle}>Rejection Reason *</label>
            <textarea
              rows={4}
              style={{ ...inputStyle(!!rejectErr), resize: 'vertical', lineHeight: 1.6 }}
              value={rejectReason}
              onChange={e => { setRejectReason(e.target.value); setRejectErr(''); }}
              placeholder="Explain why this recommendation is being rejected…"
            />
            {rejectErr && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5, fontSize: '0.75rem', color: '#ef4444' }}>
                <AlertCircle size={11} /> {rejectErr}
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '0 22px 20px' }}>
            <button onClick={() => { setRejectRec(null); setRejectReason(''); setRejectErr(''); }} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={submitReject} style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <XCircle size={14} /> Confirm Reject
            </button>
          </div>
        </div>
      )}

      {/* ── ACTION PLAN CONFIRM MODAL ─────────────────────────────────────────── */}
      {apModal && (
        <div onClick={e => e.stopPropagation()} style={{
          position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          zIndex: 1100, width: '100%', maxWidth: 420,
          background: 'var(--bg-card)', border: '1px solid rgba(59,130,246,0.3)',
          borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          animation: 'fadeInUp 0.25s ease-out', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 24px 20px', gap: 10, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardList size={20} color="#3b82f6" />
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>Create Action Plan</div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 320 }}>
              Create an action plan from <strong style={{ color: 'var(--text-main)' }}>"{apModal.title}"</strong>?
              It will be pre-filled and added to Action Plans for completion.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '0 24px 20px' }}>
            <button onClick={() => setApModal(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={() => createActionPlan(apModal)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <ClipboardList size={14} /> Create &amp; Go
            </button>
          </div>
        </div>
      )}

      {/* ── PAGE HEADER ────────────────────────────────────────────────────────── */}
      <div style={{ ...cardStyle, marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle2 size={20} color="#22c55e" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>{t('aiRecommendations')}</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.83rem' }}>
              Review, validate and approve AI-generated water interventions.
              {isDemo && <span style={{ marginLeft: 8, fontSize: '0.72rem', padding: '2px 8px', borderRadius: 20, fontWeight: 800, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>Demo Mode</span>}
            </p>
          </div>
        </div>
        <button onClick={() => setShowHistory(h => !h)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: showHistory ? 'var(--primary)' : 'var(--text-muted)', fontSize: '0.84rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          <History size={15} /> {showHistory ? 'Hide History' : 'Approval History'}
        </button>
      </div>

      {/* ── KPI CARDS ──────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 20 }}>
        {([
          { label: t('pending'),         val: counts.PENDING,          color: '#3b82f6',  status: 'PENDING'          as ApprovalStatus },
          { label: t('approved'),        val: counts.APPROVED,         color: '#22c55e',  status: 'APPROVED'         as ApprovalStatus },
          { label: t('rejected'),        val: counts.REJECTED,         color: '#ef4444',  status: 'REJECTED'         as ApprovalStatus },
          { label: 'Technical Review',   val: counts.TECHNICAL_REVIEW, color: '#f59e0b',  status: 'TECHNICAL_REVIEW' as ApprovalStatus },
        ] as { label: string; val: number; color: string; status: ApprovalStatus }[]).map(k => (
          <div key={k.label}
            onClick={() => setFilterStatus(filterStatus === k.status ? 'ALL' : k.status)}
            style={{ ...cardStyle, borderLeft: `3px solid ${k.color}`, cursor: 'pointer', transition: 'box-shadow 0.15s', outline: filterStatus === k.status ? `2px solid ${k.color}` : 'none' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* ── FILTERS ────────────────────────────────────────────────────────────── */}
      <div style={{ ...cardStyle, marginBottom: 16, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', borderRadius: 8, padding: '7px 12px', flex: '1 1 200px', minWidth: 180 }}>
          <Search size={15} color="var(--text-muted)" />
          <input type="text" placeholder="Search recommendations…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.85rem', width: '100%', outline: 'none', fontFamily: 'inherit' }} />
        </div>
        {/* Status */}
        <FilterSelect label="Status" value={filterStatus} onChange={setFilterStatus} options={[
          ['ALL', 'All Statuses'], ['PENDING', 'Pending'], ['APPROVED', 'Approved'],
          ['REJECTED', 'Rejected'], ['TECHNICAL_REVIEW', 'Technical Review'],
        ]} />
        {/* Priority */}
        <FilterSelect label="Priority" value={filterPriority} onChange={setFilterPriority} options={[
          ['ALL', 'All Priorities'], ['CRITICAL', 'Critical'], ['HIGH', 'High'], ['MEDIUM', 'Medium'], ['LOW', 'Low'],
        ]} />
        {/* Type */}
        <FilterSelect label="Type" value={filterType} onChange={setFilterType} options={[
          ['ALL', 'All Types'], ...ALL_REC_TYPES.map(t => [t, t] as [string, string]),
        ]} />
        {/* Village */}
        <FilterSelect label="Village" value={filterVillage} onChange={setFilterVillage} options={[
          ['ALL', 'All Villages'], ...villageOptions.map(v => [v, v] as [string, string]),
        ]} />
        {(search || filterStatus !== 'ALL' || filterPriority !== 'ALL' || filterVillage !== 'ALL' || filterType !== 'ALL') && (
          <button onClick={() => { setSearch(''); setFilterStatus('ALL'); setFilterPriority('ALL'); setFilterVillage('ALL'); setFilterType('ALL'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 12px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <RefreshCw size={12} /> Clear
          </button>
        )}
      </div>

      {/* ── RECOMMENDATIONS LIST ───────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {filteredRecs.length === 0 && (
          <div style={{ ...cardStyle, textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
            No recommendations match your filters.
          </div>
        )}
        {filteredRecs.map(rec => (
          <div key={rec.id} style={{ ...cardStyle, borderLeft: `3px solid ${statusColor(rec.status)}` }}>
            {/* Top row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* badges row */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.68rem', background: 'var(--bg-dark)', padding: '2px 7px', borderRadius: 4, color: 'var(--text-muted)' }}>{rec.id}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 800, background: recTypeColor(rec.type) + '18', color: recTypeColor(rec.type), border: `1px solid ${recTypeColor(rec.type)}44` }}>
                    {typeIcon(rec.type)} {rec.type}
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 800, background: statusBg(rec.status), color: statusColor(rec.status), border: `1px solid ${statusColor(rec.status)}44` }}>{statusLabel(rec.status)}</span>
                  <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 800, background: priorityColor(rec.priority) + '18', color: priorityColor(rec.priority), border: `1px solid ${priorityColor(rec.priority)}44` }}>{rec.priority}</span>
                  {rec.isDemo && <span style={{ padding: '2px 7px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 700, background: 'rgba(245,158,11,0.08)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.25)' }}>Demo Data</span>}
                </div>
                {/* title */}
                <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 6 }}>{rec.title}</div>
                {/* location + date */}
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                  <span><MapPin size={11} style={{ verticalAlign: 'middle' }} /> {rec.village} · {rec.district}</span>
                  <span><Calendar size={11} style={{ verticalAlign: 'middle' }} /> {fmtDate(rec.createdAt)}</span>
                  <span><BrainCircuit size={11} style={{ verticalAlign: 'middle' }} /> {rec.agents.join(' → ')}</span>
                </div>
              </div>
              {/* Confidence */}
              <div style={{ textAlign: 'center', flexShrink: 0 }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, color: confColor(rec.confidence), lineHeight: 1 }}>{rec.confidence}%</div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Confidence</div>
              </div>
            </div>

            {/* Reason */}
            <div style={{ marginTop: 10, padding: '10px 12px', background: 'var(--bg-dark)', borderRadius: 8, fontSize: '0.82rem', color: 'var(--text-main)', lineHeight: 1.55 }}>
              {rec.reason}
            </div>

            {/* Supporting data pills */}
            <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {rec.supportingData.map(d => (
                <span key={d} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 4, fontSize: '0.7rem', fontWeight: 600, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.18)', color: '#22d3ee' }}>
                  <Info size={9} /> {d}
                </span>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <button onClick={() => setDetailRec(rec)} style={{ ...ghostBtn, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                <Eye size={13} /> View Details
              </button>
              {rec.status === 'PENDING' && <>
                <button onClick={() => approve(rec)} style={{ ...actionBtn('#22c55e'), display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <CheckCircle2 size={13} /> Approve
                </button>
                <button onClick={() => { setRejectRec(rec); setRejectReason(''); setRejectErr(''); }} style={{ ...actionBtn('#ef4444'), display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <XCircle size={13} /> Reject
                </button>
                <button onClick={() => requestReview(rec)} style={{ ...actionBtn('#f59e0b'), display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <FlaskConical size={13} /> Tech Review
                </button>
              </>}
              {rec.status === 'APPROVED' && (
                <button onClick={() => setApModal(rec)} style={{ ...actionBtn('#3b82f6'), display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                  <ClipboardList size={13} /> Create Action Plan
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── APPROVAL HISTORY ──────────────────────────────────────────────────── */}
      {showHistory && (
        <div style={{ ...cardStyle, marginBottom: 24, animation: 'fadeInUp 0.3s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
              <History size={14} /> Approval History
            </div>
            {history.length > 0 && (
              <button onClick={() => { setHistory([]); saveHist([]); }} style={{ fontSize: '0.72rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Clear history</button>
            )}
          </div>

          {history.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No approval actions recorded yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: 620 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)', background: 'var(--bg-card-hover)' }}>
                    {['Timestamp', 'Action', 'User', 'Prev. Status', 'New Status', 'Comment'].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map((e, i) => (
                    <tr key={e.id} style={{ borderBottom: '1px solid var(--border-glass)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-card-hover)' }}>
                      <td style={{ padding: '10px 14px', fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.75rem', whiteSpace: 'nowrap' }}>{e.ts}</td>
                      <td style={{ padding: '10px 14px', fontWeight: 700 }}>{e.action}</td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)' }}>{e.user}</td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 800, background: statusBg(e.prevStatus), color: statusColor(e.prevStatus), border: `1px solid ${statusColor(e.prevStatus)}44` }}>{statusLabel(e.prevStatus)}</span>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 800, background: statusBg(e.newStatus), color: statusColor(e.newStatus), border: `1px solid ${statusColor(e.newStatus)}44` }}>{statusLabel(e.newStatus)}</span>
                      </td>
                      <td style={{ padding: '10px 14px', color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.comment || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Tiny helpers ─────────────────────────────────────────────────────────────

function FilterSelect({ label, value, onChange, options }: {
  label: string; value: string;
  onChange: (v: string) => void;
  options: [string, string][];
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <Filter size={12} color="var(--text-muted)" />
      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}:</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', borderRadius: 6, padding: '6px 10px', fontSize: '0.82rem', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

function btnStyle(color: string): React.CSSProperties {
  return { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: color, color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'opacity 0.15s' };
}
const actionBtn = (color: string): React.CSSProperties => ({
  padding: '6px 13px', borderRadius: 7, border: `1px solid ${color}44`,
  background: color + '18', color: color,
  fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
  transition: 'background 0.15s',
});
const ghostBtn: React.CSSProperties = {
  padding: '6px 13px', borderRadius: 7, border: '1px solid var(--border-glass)',
  background: 'transparent', color: 'var(--text-muted)',
  fontSize: '0.78rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
};
