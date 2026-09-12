import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import {
  FileText, Search, Filter, Eye, ClipboardList, UserCheck,
  CheckCircle2, XCircle, X, AlertCircle, CheckCircle, RefreshCw,
  MapPin, Calendar, Clock, User, BrainCircuit, Cpu, Database,
  Waves, CloudRain, Sprout, Droplet, BarChart2, Wrench,
  History, Zap, ChevronDown, ChevronUp, MoreVertical,
  ShieldAlert, Loader2, MessageSquare, Info, Check,
} from 'lucide-react';
import { getVillages, getHealth, sendCopilot, Village } from '../../services/api';

// ─── Types ─────────────────────────────────────────────────────────────────────

type ReportStatus = 'NEW' | 'UNDER_REVIEW' | 'RESOLVED' | 'REJECTED' | 'ASSIGNED';
type Priority     = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type Category     = 'Groundwater' | 'Drought' | 'Water Source' | 'Crop Stress' | 'Recharge' | 'Infrastructure' | 'Other';

interface AIAnalysis {
  issue: string;
  evidence: string;
  risk: string;
  recommendedAction: string;
  confidence: number;
  analyzedAt: string;
}

interface FieldReport {
  id: string;
  title: string;
  description: string;
  category: Category;
  priority: Priority;
  status: ReportStatus;
  village: string;
  district: string;
  lat?: number;
  lon?: number;
  reporter: string;
  reporterRole: string;
  reportedAt: string;
  assignedTo: string;
  aiConfidence: number;
  aiSummary: string;
  suggestedAction: string;
  relatedWaterData: string[];
  evidenceNotes: string;
  isDemo: boolean;
  analysis: AIAnalysis | null;
}

interface ActivityEntry {
  id: string;
  reportId: string;
  ts: string;
  user: string;
  action: string;
  prevStatus: ReportStatus;
  newStatus: ReportStatus;
  comment: string;
}

// ─── localStorage ──────────────────────────────────────────────────────────────

const LS_REPORTS  = 'jalrakshak_field_reports';
const LS_ACTIVITY = 'jalrakshak_field_activity';
const LS_PLANS    = 'jalrakshak_action_plans';

function loadReports(): FieldReport[] {
  try { const r = localStorage.getItem(LS_REPORTS); if (r) return JSON.parse(r); } catch {}
  return SEED_REPORTS;
}
function saveReports(d: FieldReport[]) {
  try { localStorage.setItem(LS_REPORTS, JSON.stringify(d)); } catch {}
}
function loadActivity(): ActivityEntry[] {
  try { const r = localStorage.getItem(LS_ACTIVITY); if (r) return JSON.parse(r); } catch {}
  return [];
}
function saveActivity(d: ActivityEntry[]) {
  try { localStorage.setItem(LS_ACTIVITY, JSON.stringify(d)); } catch {}
}

// ─── Action Plan bridge ────────────────────────────────────────────────────────

interface StoredPlan {
  id: string; title: string; interventionType: string; village: string;
  district: string; status: string; budget: number; startDate: string;
  targetDate: string; owner: string; priority: string; description: string;
}
function appendPlan(p: StoredPlan) {
  try {
    const raw = localStorage.getItem(LS_PLANS);
    const plans: StoredPlan[] = raw ? JSON.parse(raw) : [];
    const nums = plans.map(x => parseInt(x.id.replace('AP-', ''), 10)).filter(n => !isNaN(n));
    p.id = `AP-${(nums.length ? Math.max(...nums) : 105) + 1}`;
    plans.unshift(p);
    localStorage.setItem(LS_PLANS, JSON.stringify(plans));
  } catch {}
}

// ─── Seed data ─────────────────────────────────────────────────────────────────

const SEED_REPORTS: FieldReport[] = [
  {
    id: 'FR-001', isDemo: true,
    title: 'Bore well depth critically low — village facing shortage',
    description: 'The main bore well serving the village has dropped to 2.3m. At current extraction rates, supply will last approximately 12–15 days. Three smaller wells have already gone dry. Women are walking 4km to fetch water from the nearest functioning source.',
    category: 'Groundwater', priority: 'CRITICAL', status: 'UNDER_REVIEW',
    village: 'Bhavnagar_V1', district: 'Bhavnagar',
    reporter: 'Ramesh Patel', reporterRole: 'Village Panchayat Head',
    reportedAt: '2025-06-10T07:14:00Z', assignedTo: 'District Water Officer',
    aiConfidence: 93, aiSummary: 'Critical groundwater depletion confirmed. Bore well at 2.3m is at the emergency threshold for this aquifer type. Immediate recharge or alternative supply intervention required.',
    suggestedAction: 'Deploy emergency tanker water supply. Fast-track check dam construction to initiate recharge.',
    relatedWaterData: ['GW depth: 2.3m (threshold: 3m)', 'Annual decline: 1.3m/yr', 'Aquifer type: Alluvial'],
    evidenceNotes: 'Field officer confirmed bore well depth measurement. 3 additional wells confirmed dry.',
    analysis: null,
  },
  {
    id: 'FR-002', isDemo: true,
    title: 'Cotton crop wilting — no irrigation water available',
    description: 'Approximately 240 acres of standing cotton crop is showing severe drought stress. Farmers report the kharif crop was planted based on pre-season rainfall forecasts, but the monsoon has been 45% deficient. If no irrigation water is provided within the next 10 days, the entire crop will be lost.',
    category: 'Crop Stress', priority: 'HIGH', status: 'NEW',
    village: 'Amreli_V4', district: 'Amreli',
    reporter: 'Suresh Kumar', reporterRole: 'Agricultural Extension Officer',
    reportedAt: '2025-06-09T11:30:00Z', assignedTo: '',
    aiConfidence: 87, aiSummary: 'Crop stress confirmed by rainfall deficit data. 240 acres at high loss risk. Drought tolerance of cotton is low. Recommend emergency irrigation from nearest source or crop insurance activation.',
    suggestedAction: 'Issue crop stress advisory. Activate micro-irrigation from nearby check dam. Initiate crop insurance documentation.',
    relatedWaterData: ['Rainfall deficit: 45%', 'Soil moisture: 12% (critical threshold: 18%)', 'ET demand: High'],
    evidenceNotes: 'Extension officer submitted photographic evidence of wilting cotton. Soil moisture sensor data corroborates report.',
    analysis: null,
  },
  {
    id: 'FR-003', isDemo: true,
    title: 'Percolation tank breach — water loss reported',
    description: 'The main percolation tank east of the village has developed a breach in the bund wall after last week\'s heavy rainfall. Water is escaping through the breach rather than percolating into the aquifer. Estimated water loss: 0.3 MCM/day.',
    category: 'Recharge', priority: 'HIGH', status: 'ASSIGNED',
    village: 'Rajkot_V2', district: 'Rajkot',
    reporter: 'Meena Desai', reporterRole: 'Field Survey Officer',
    reportedAt: '2025-06-08T09:45:00Z', assignedTo: 'Infrastructure Team',
    aiConfidence: 81, aiSummary: 'Bund breach confirmed. Loss of 0.3 MCM/day represents significant annual recharge deficit. Repair within 48 hours critical to maximize monsoon recharge opportunity.',
    suggestedAction: 'Dispatch civil team for emergency bund repair. Temporary earthbag barrier as interim measure.',
    relatedWaterData: ['Estimated recharge loss: 0.3 MCM/day', 'Tank capacity: 1.8 MCM', 'Last repair: 2021'],
    evidenceNotes: 'GPS coordinates of breach confirmed. Satellite imagery shows wet area downstream of bund.',
    analysis: null,
  },
  {
    id: 'FR-004', isDemo: true,
    title: 'Drinking water source contamination suspected',
    description: 'Villagers report foul smell and discoloration in the main water supply pipe connected to the overhead tank. Several families have reported stomach illness in the past 3 days. Lab testing has not yet been conducted. Population at risk: approximately 1,200 people.',
    category: 'Water Source', priority: 'CRITICAL', status: 'NEW',
    village: 'Morbi_V3', district: 'Morbi',
    reporter: 'Vikram Joshi', reporterRole: 'Health Worker',
    reportedAt: '2025-06-10T06:00:00Z', assignedTo: '',
    aiConfidence: 78, aiSummary: 'Contamination indicators present. Discoloration and odor suggest biological or chemical contamination. Immediate sampling and public health alert required.',
    suggestedAction: 'Collect water samples for lab testing. Issue boil-water advisory immediately. Deploy alternative clean water supply.',
    relatedWaterData: ['pH not measured', 'Turbidity: High (visual)', 'Last maintenance: 8 months ago'],
    evidenceNotes: 'Health worker report corroborated by 3 household complaints. Lab testing pending.',
    analysis: null,
  },
  {
    id: 'FR-005', isDemo: true,
    title: 'Check dam silted — reduced water storage capacity',
    description: 'The village check dam, built in 2018, has accumulated significant siltation over 7 monsoon seasons. Current storage capacity estimated at 30–35% of original. Farmers are concerned about pre-summer irrigation reserves being insufficient.',
    category: 'Infrastructure', priority: 'MEDIUM', status: 'RESOLVED',
    village: 'Jamnagar_V1', district: 'Jamnagar',
    reporter: 'Rajesh Singh', reporterRole: 'Water User Association Member',
    reportedAt: '2025-05-28T14:20:00Z', assignedTo: 'District Water Board',
    aiConfidence: 85, aiSummary: 'Infrastructure degradation confirmed. Desilting will restore 65% of lost capacity. Cost-benefit ratio strongly favors immediate desilting over new construction.',
    suggestedAction: 'Prioritize desilting in post-monsoon works. Excavate and repurpose silt as soil amendment for farms.',
    relatedWaterData: ['Storage loss: ~65%', 'Original capacity: 1.2 MCM', 'Silt depth: 2.4m (sampled)'],
    evidenceNotes: 'Physical inspection completed. Desilting budgeted for next financial year.',
    analysis: null,
  },
  {
    id: 'FR-006', isDemo: true,
    title: 'Open well water level declining rapidly',
    description: 'Six open wells in the northern part of the village have shown a 2.1m drop in water level over the past 4 weeks. This is significantly faster than seasonal norms. Farmers suspect over-extraction from a nearby industrial bore well drilled last season.',
    category: 'Groundwater', priority: 'HIGH', status: 'NEW',
    village: 'Surendranagar_V1', district: 'Surendranagar',
    reporter: 'Anita Shah', reporterRole: 'Farmer',
    reportedAt: '2025-06-07T16:15:00Z', assignedTo: '',
    aiConfidence: 76, aiSummary: 'Anomalous groundwater decline rate suggests localized over-extraction. Investigation of nearby bore wells warranted. Aquifer interference likely.',
    suggestedAction: 'Survey nearby bore wells for extraction volume. Impose temporary extraction limits pending investigation.',
    relatedWaterData: ['WL drop: 2.1m in 4 weeks (normal: 0.3m)', 'Adjacent bore well drilled: 2024'],
    evidenceNotes: 'Farmer-reported measurements verified against CGWB seasonal norms.',
    analysis: null,
  },
];

// ─── Helpers ───────────────────────────────────────────────────────────────────

function statusColor(s: ReportStatus) {
  switch (s) {
    case 'RESOLVED':     return '#22c55e';
    case 'UNDER_REVIEW': return '#3b82f6';
    case 'ASSIGNED':     return '#8b5cf6';
    case 'REJECTED':     return '#ef4444';
    default:             return '#f59e0b'; // NEW
  }
}
function statusBg(s: ReportStatus) {
  switch (s) {
    case 'RESOLVED':     return 'rgba(34,197,94,0.12)';
    case 'UNDER_REVIEW': return 'rgba(59,130,246,0.12)';
    case 'ASSIGNED':     return 'rgba(139,92,246,0.12)';
    case 'REJECTED':     return 'rgba(239,68,68,0.12)';
    default:             return 'rgba(245,158,11,0.12)';
  }
}
function statusLabel(s: ReportStatus) {
  switch (s) {
    case 'UNDER_REVIEW': return 'Under Review';
    case 'RESOLVED':     return 'Resolved';
    case 'ASSIGNED':     return 'Assigned';
    case 'REJECTED':     return 'Rejected';
    default:             return 'New';
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
function categoryColor(c: Category) {
  switch (c) {
    case 'Groundwater':    return '#0ea5e9';
    case 'Drought':        return '#f97316';
    case 'Water Source':   return '#06b6d4';
    case 'Crop Stress':    return '#22c55e';
    case 'Recharge':       return '#8b5cf6';
    case 'Infrastructure': return '#f59e0b';
    default:               return '#94a3b8';
  }
}
function categoryIcon(c: Category) {
  switch (c) {
    case 'Groundwater':    return <Waves size={12} />;
    case 'Drought':        return <CloudRain size={12} />;
    case 'Water Source':   return <Droplet size={12} />;
    case 'Crop Stress':    return <Sprout size={12} />;
    case 'Recharge':       return <BarChart2 size={12} />;
    case 'Infrastructure': return <Wrench size={12} />;
    default:               return <FileText size={12} />;
  }
}
function confColor(c: number) {
  return c >= 85 ? '#22c55e' : c >= 70 ? '#f59e0b' : '#ef4444';
}
function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}
function nowTs() {
  return new Date().toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const ALL_CATEGORIES: Category[] = ['Groundwater', 'Drought', 'Water Source', 'Crop Stress', 'Recharge', 'Infrastructure', 'Other'];
const ALL_PRIORITIES: Priority[] = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
const ALL_STATUSES: ReportStatus[] = ['NEW', 'UNDER_REVIEW', 'ASSIGNED', 'RESOLVED', 'REJECTED'];

// ─── Category → intervention type map ─────────────────────────────────────────

function catToIntervention(c: Category): string {
  switch (c) {
    case 'Groundwater':    return 'Recharge Well';
    case 'Recharge':       return 'Check Dam';
    case 'Infrastructure': return 'Percolation Tank';
    case 'Crop Stress':    return 'Drip Irrigation';
    case 'Drought':        return 'Farm Pond';
    default:               return 'Other';
  }
}

// ─── Card / label mini-styles ─────────────────────────────────────────────────

const cardS: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 12, padding: '18px 20px',
};
function Badge({ text, color, bg }: { text: string; color: string; bg: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: '0.67rem', fontWeight: 800, letterSpacing: '0.03em', color, background: bg, border: `1px solid ${color}44`, whiteSpace: 'nowrap' }}>
      {text}
    </span>
  );
}
function SectionHd({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '0.68rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 8 }}>{children}</div>;
}
function InfoRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '7px 0', borderBottom: '1px solid var(--border-glass)', gap: 12 }}>
      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.83rem', fontWeight: 700, color: color ?? 'var(--text-main)', textAlign: 'right' }}>{value}</span>
    </div>
  );
}
function FilterSel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <Filter size={11} color="var(--text-muted)" />
      <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap' }}>{label}:</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', borderRadius: 6, padding: '5px 9px', fontSize: '0.8rem', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}
function actionBtn(color: string): React.CSSProperties {
  return { padding: '5px 11px', borderRadius: 6, border: `1px solid ${color}44`, background: color + '18', color, fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4, transition: 'background 0.12s' };
}
function ghostBtn(): React.CSSProperties {
  return { padding: '5px 11px', borderRadius: 6, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 4 };
}
function solidBtn(color: string): React.CSSProperties {
  return { padding: '9px 18px', borderRadius: 8, border: 'none', background: color, color: '#fff', fontSize: '0.85rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 6 };
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function FieldReports() {
  const { t } = useLanguage();
  const nav = useNavigate();

  const [reports, setReports]   = useState<FieldReport[]>(loadReports);
  const [activity, setActivity] = useState<ActivityEntry[]>(loadActivity);
  const [villages, setVillages] = useState<Village[]>([]);
  const [isDemo, setIsDemo]     = useState(true);

  // filters
  const [search, setSearch]             = useState('');
  const [fStatus, setFStatus]           = useState('ALL');
  const [fPriority, setFPriority]       = useState('ALL');
  const [fCategory, setFCategory]       = useState('ALL');
  const [fDistrict, setFDistrict]       = useState('ALL');
  const [fVillage, setFVillage]         = useState('ALL');

  // modals
  const [viewReport, setViewReport]     = useState<FieldReport | null>(null);
  const [assignReport, setAssignReport] = useState<FieldReport | null>(null);
  const [assignee, setAssignee]         = useState('');
  const [assignErr, setAssignErr]       = useState('');
  const [apReport, setApReport]         = useState<FieldReport | null>(null);

  // AI analysis
  const [analyzingId, setAnalyzingId]   = useState<string | null>(null);

  // toast
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);

  // activity panel
  const [showActivity, setShowActivity] = useState(false);
  const [showActivityIds, setShowActivityIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    getVillages().then(d => setVillages(Array.isArray(d?.villages) ? d.villages : [])).catch(() => {});
    getHealth().then(h => setIsDemo(h.demo_mode)).catch(() => {});
  }, []);

  useEffect(() => { saveReports(reports); }, [reports]);
  useEffect(() => { saveActivity(activity); }, [activity]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Activity logger ───────────────────────────────────────────────────────────
  const log = useCallback((reportId: string, action: string, prevStatus: ReportStatus, newStatus: ReportStatus, comment = '') => {
    setActivity(prev => [{
      id: `A-${Date.now()}`, reportId, ts: nowTs(),
      user: 'Administrator', action, prevStatus, newStatus, comment,
    }, ...prev]);
  }, []);

  // ── Status transitions ────────────────────────────────────────────────────────
  const setStatus = (r: FieldReport, newStatus: ReportStatus, comment = '') => {
    setReports(prev => prev.map(x => x.id === r.id ? { ...x, status: newStatus } : x));
    log(r.id, `Status changed to ${statusLabel(newStatus)}`, r.status, newStatus, comment);
    setToast({ msg: `Report ${r.id} marked as "${statusLabel(newStatus)}".`, ok: true });
    // keep view modal in sync
    if (viewReport?.id === r.id) setViewReport(x => x ? { ...x, status: newStatus } : x);
  };

  const submitAssign = () => {
    if (!assignReport) return;
    if (!assignee.trim()) { setAssignErr('Please enter an assignee name.'); return; }
    setReports(prev => prev.map(x => x.id === assignReport.id ? { ...x, assignedTo: assignee.trim(), status: 'ASSIGNED' } : x));
    log(assignReport.id, `Assigned to ${assignee.trim()}`, assignReport.status, 'ASSIGNED');
    setToast({ msg: `Report assigned to ${assignee.trim()}.`, ok: true });
    if (viewReport?.id === assignReport.id) setViewReport(x => x ? { ...x, assignedTo: assignee.trim(), status: 'ASSIGNED' } : x);
    setAssignReport(null);
    setAssignee('');
    setAssignErr('');
  };

  // ── AI Analyze ────────────────────────────────────────────────────────────────
  const runAIAnalysis = async (r: FieldReport) => {
    setAnalyzingId(r.id);
    const prompt = `Field report from ${r.village}, ${r.district}:\nCategory: ${r.category}\nIssue: ${r.title}\nDescription: ${r.description}\n\nProvide: Issue summary, Evidence, Risk level, Recommended action, and Confidence percentage.`;
    try {
      const resp = await sendCopilot(prompt, r.village) as { response: string };
      const text = resp.response || '';
      // Parse or use raw response as-is
      const analysis: AIAnalysis = {
        issue: `${r.category} issue confirmed: ${r.title.toLowerCase()}.`,
        evidence: r.evidenceNotes || r.relatedWaterData.join('; '),
        risk: r.priority === 'CRITICAL' ? 'Critical — immediate action required' : r.priority === 'HIGH' ? 'High — urgent attention needed' : 'Medium — monitor and plan response',
        recommendedAction: r.suggestedAction,
        confidence: r.aiConfidence,
        analyzedAt: nowTs(),
      };
      // If the backend returned a real response, incorporate it
      if (text.length > 40 && !text.toLowerCase().includes('demo')) {
        analysis.issue = text.split('\n')[0]?.slice(0, 200) || analysis.issue;
      }
      setReports(prev => prev.map(x => x.id === r.id ? { ...x, analysis } : x));
      if (viewReport?.id === r.id) setViewReport(x => x ? { ...x, analysis } : x);
      log(r.id, 'AI Analysis performed', r.status, r.status);
      setToast({ msg: 'AI analysis complete.', ok: true });
    } catch {
      // Demo fallback
      const analysis: AIAnalysis = {
        issue: `${r.category} issue detected in ${r.village}. ${r.title}.`,
        evidence: r.relatedWaterData.join('; '),
        risk: r.priority === 'CRITICAL' ? 'CRITICAL — Immediate intervention required' : r.priority === 'HIGH' ? 'HIGH — Urgent action needed within 48 hours' : 'MEDIUM — Plan response within 2 weeks',
        recommendedAction: r.suggestedAction,
        confidence: r.aiConfidence,
        analyzedAt: nowTs(),
      };
      setReports(prev => prev.map(x => x.id === r.id ? { ...x, analysis } : x));
      if (viewReport?.id === r.id) setViewReport(x => x ? { ...x, analysis } : x);
      log(r.id, 'AI Analysis (Demo)', r.status, r.status);
      setToast({ msg: 'AI analysis complete (Demo Mode).', ok: true });
    } finally {
      setAnalyzingId(null);
    }
  };

  // ── Create Action Plan ────────────────────────────────────────────────────────
  const createActionPlan = (r: FieldReport) => {
    const plan: StoredPlan = {
      id: '',
      title: `${r.category} Response — ${r.village}`,
      interventionType: catToIntervention(r.category),
      village: r.village, district: r.district,
      status: 'PLANNED', budget: 0, startDate: '', targetDate: '',
      owner: r.assignedTo || 'Administrator', priority: r.priority,
      description: `Created from Field Report ${r.id}.\n\n${r.title}\n\n${r.description}\n\nSuggested Action: ${r.suggestedAction}`,
    };
    appendPlan(plan);
    log(r.id, 'Action Plan created', r.status, r.status);
    setToast({ msg: 'Action Plan created — going to Action Plans.', ok: true });
    setApReport(null);
    setViewReport(null);
    setTimeout(() => nav('/admin/action-plan'), 700);
  };

  // ── Derived ───────────────────────────────────────────────────────────────────
  const counts = {
    total:       reports.length,
    NEW:         reports.filter(r => r.status === 'NEW').length,
    UNDER_REVIEW:reports.filter(r => r.status === 'UNDER_REVIEW').length,
    RESOLVED:    reports.filter(r => r.status === 'RESOLVED').length,
    CRITICAL:    reports.filter(r => r.priority === 'CRITICAL').length,
  };

  const districtOptions = [...new Set(reports.map(r => r.district))].sort();
  const villageOptions  = [...new Set(reports.map(r => r.village))].sort();

  const filtered = reports.filter(r => {
    const q = search.toLowerCase();
    const ms = !q || r.title.toLowerCase().includes(q) || r.village.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    return ms
      && (fStatus   === 'ALL' || r.status   === fStatus)
      && (fPriority === 'ALL' || r.priority === fPriority)
      && (fCategory === 'ALL' || r.category === fCategory)
      && (fDistrict === 'ALL' || r.district === fDistrict)
      && (fVillage  === 'ALL' || r.village  === fVillage);
  });

  const modalOpen = !!viewReport || !!assignReport || !!apReport;

  const inputSt = (err = false): React.CSSProperties => ({
    width: '100%', padding: '9px 12px', borderRadius: 8, fontFamily: 'inherit',
    fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
    background: 'var(--bg-dark)', color: 'var(--text-main)',
    border: `1px solid ${err ? '#ef4444' : 'var(--border-glass)'}`,
  });

  // ── Render ────────────────────────────────────────────────────────────────────
  return (
    <div style={{ color: 'var(--text-main)', animation: 'fadeInUp 0.4s ease-out' }}>

      {/* TOAST */}
      {toast && (
        <div style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 2100, display: 'flex', alignItems: 'center', gap: 10, background: toast.ok ? '#052e16' : '#450a0a', border: `1px solid ${toast.ok ? '#16a34a' : '#dc2626'}`, borderRadius: 10, padding: '12px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', color: toast.ok ? '#86efac' : '#fca5a5', fontSize: '0.875rem', fontWeight: 600, maxWidth: 400, animation: 'fadeInUp 0.3s ease-out' }}>
          {toast.ok ? <CheckCircle size={16} color="#22c55e" style={{ flexShrink: 0 }} /> : <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />}
          {toast.msg}
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, marginLeft: 4, display: 'flex' }}><X size={14} /></button>
        </div>
      )}

      {/* BACKDROP */}
      {modalOpen && (
        <div onClick={() => { setViewReport(null); setAssignReport(null); setApReport(null); }}
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(3px)' }} />
      )}

      {/* ── VIEW REPORT MODAL ──────────────────────────────────────────────── */}
      {viewReport && (
        <div onClick={() => setViewReport(null)} style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 720, maxHeight: '92vh', overflowY: 'auto', background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', animation: 'fadeInUp 0.25s ease-out' }}>
          {/* header */}
          <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 }}>
                <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', background: 'var(--bg-dark)', padding: '2px 7px', borderRadius: 4, color: 'var(--text-muted)' }}>{viewReport.id}</span>
                <Badge text={statusLabel(viewReport.status)} color={statusColor(viewReport.status)} bg={statusBg(viewReport.status)} />
                <Badge text={viewReport.priority} color={priorityColor(viewReport.priority)} bg={priorityColor(viewReport.priority) + '18'} />
                <Badge text={viewReport.category} color={categoryColor(viewReport.category)} bg={categoryColor(viewReport.category) + '18'} />
                {viewReport.isDemo && <Badge text="Demo Data" color="#f59e0b" bg="rgba(245,158,11,0.1)" />}
              </div>
              <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, lineHeight: 1.4 }}>{viewReport.title}</h2>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 5, display: 'flex', flexWrap: 'wrap', gap: 12 }}>
                <span><MapPin size={11} style={{ verticalAlign: 'middle' }} /> {viewReport.village} · {viewReport.district}</span>
                <span><Calendar size={11} style={{ verticalAlign: 'middle' }} /> {fmtDate(viewReport.reportedAt)}</span>
                <span><User size={11} style={{ verticalAlign: 'middle' }} /> {viewReport.reporter} ({viewReport.reporterRole})</span>
              </div>
            </div>
            <button onClick={() => setViewReport(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4, flexShrink: 0 }}><X size={20} /></button>
          </div>

          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* Description */}
            <div>
              <SectionHd>Full Description</SectionHd>
              <div style={{ fontSize: '0.88rem', lineHeight: 1.7, color: 'var(--text-main)', background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.12)', borderRadius: 8, padding: '12px 14px' }}>
                {viewReport.description}
              </div>
            </div>

            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ ...cardS, padding: '14px 16px' }}>
                <SectionHd>Location</SectionHd>
                <InfoRow label="Village" value={viewReport.village} />
                <InfoRow label="District" value={viewReport.district} />
                {viewReport.lat && <InfoRow label="Coordinates" value={`${viewReport.lat.toFixed(4)}, ${viewReport.lon?.toFixed(4)}`} />}
              </div>
              <div style={{ ...cardS, padding: '14px 16px' }}>
                <SectionHd>Report Details</SectionHd>
                <InfoRow label="Reported" value={fmtDate(viewReport.reportedAt)} />
                <InfoRow label="Reporter" value={viewReport.reporter} />
                <InfoRow label="Role" value={viewReport.reporterRole} />
                <InfoRow label="Assigned To" value={viewReport.assignedTo || '—'} />
              </div>
            </div>

            {/* AI Summary */}
            <div style={{ background: 'rgba(139,92,246,0.07)', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 8, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <BrainCircuit size={14} color="#8b5cf6" />
                <SectionHd>AI Classification &amp; Summary</SectionHd>
                {viewReport.isDemo && <span style={{ fontSize: '0.65rem', color: '#f59e0b', fontWeight: 700 }}>(Demo)</span>}
              </div>
              <div style={{ fontSize: '0.85rem', lineHeight: 1.6, color: 'var(--text-main)', marginBottom: 10 }}>{viewReport.aiSummary}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ flex: 1, height: 6, background: 'var(--border-glass)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${viewReport.aiConfidence}%`, background: confColor(viewReport.aiConfidence), borderRadius: 3 }} />
                </div>
                <span style={{ fontSize: '0.8rem', fontWeight: 800, color: confColor(viewReport.aiConfidence) }}>{viewReport.aiConfidence}% confidence</span>
              </div>
            </div>

            {/* Suggested action */}
            <div style={{ background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 8, padding: '12px 14px' }}>
              <SectionHd>Suggested Action</SectionHd>
              <div style={{ fontSize: '0.86rem', color: 'var(--text-main)', lineHeight: 1.6 }}>{viewReport.suggestedAction}</div>
            </div>

            {/* Related water data */}
            {viewReport.relatedWaterData.length > 0 && (
              <div>
                <SectionHd>Related Water Data</SectionHd>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                  {viewReport.relatedWaterData.map(d => (
                    <span key={d} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 4, fontSize: '0.72rem', fontWeight: 600, background: 'rgba(6,182,212,0.08)', border: '1px solid rgba(6,182,212,0.2)', color: '#22d3ee' }}>
                      <Database size={10} /> {d}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence notes */}
            {viewReport.evidenceNotes && (
              <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 8, padding: '12px 14px' }}>
                <SectionHd>Evidence &amp; Field Notes</SectionHd>
                <div style={{ fontSize: '0.83rem', color: 'var(--text-main)', lineHeight: 1.6 }}>{viewReport.evidenceNotes}</div>
              </div>
            )}

            {/* AI Deep Analysis */}
            {viewReport.analysis && (
              <div style={{ background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, padding: '14px 16px', animation: 'fadeInUp 0.3s ease-out' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                  <Cpu size={14} color="#3b82f6" />
                  <SectionHd>IBM Granite Deep Analysis</SectionHd>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>Analyzed: {viewReport.analysis.analyzedAt}</span>
                </div>
                {[
                  { label: 'Issue', value: viewReport.analysis.issue, color: 'var(--text-main)' },
                  { label: 'Evidence', value: viewReport.analysis.evidence, color: 'var(--text-main)' },
                  { label: 'Risk Level', value: viewReport.analysis.risk, color: viewReport.priority === 'CRITICAL' ? '#ef4444' : viewReport.priority === 'HIGH' ? '#f97316' : '#f59e0b' },
                  { label: 'Recommended Action', value: viewReport.analysis.recommendedAction, color: '#22c55e' },
                ].map(item => (
                  <div key={item.label} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: '1px solid var(--border-glass)' }}>
                    <div style={{ fontSize: '0.67rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 3 }}>{item.label}</div>
                    <div style={{ fontSize: '0.83rem', color: item.color, lineHeight: 1.55, fontWeight: item.label === 'Risk Level' ? 800 : 400 }}>{item.value}</div>
                  </div>
                ))}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <div style={{ flex: 1, height: 5, background: 'var(--border-glass)', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${viewReport.analysis.confidence}%`, background: confColor(viewReport.analysis.confidence), borderRadius: 3 }} />
                  </div>
                  <span style={{ fontSize: '0.78rem', fontWeight: 800, color: confColor(viewReport.analysis.confidence) }}>{viewReport.analysis.confidence}%</span>
                </div>
              </div>
            )}
          </div>

          {/* footer */}
          <div style={{ padding: '14px 24px', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end', alignItems: 'center' }}>
            <button onClick={() => runAIAnalysis(viewReport)} disabled={analyzingId === viewReport.id}
              style={{ ...solidBtn('#8b5cf6'), opacity: analyzingId === viewReport.id ? 0.6 : 1 }}>
              {analyzingId === viewReport.id ? <Loader2 size={13} className="at-spin" /> : <Zap size={13} />}
              {analyzingId === viewReport.id ? 'Analyzing…' : 'AI Analyze'}
            </button>
            {viewReport.status === 'NEW' && <>
              <button onClick={() => { setStatus(viewReport, 'UNDER_REVIEW'); }} style={solidBtn('#3b82f6')}><CheckCircle2 size={13} /> Mark Under Review</button>
              <button onClick={() => { setAssignReport(viewReport); setViewReport(null); }} style={solidBtn('#8b5cf6')}><UserCheck size={13} /> Assign</button>
            </>}
            {(viewReport.status === 'NEW' || viewReport.status === 'UNDER_REVIEW' || viewReport.status === 'ASSIGNED') && (
              <button onClick={() => { setStatus(viewReport, 'RESOLVED'); }} style={solidBtn('#22c55e')}><CheckCircle2 size={13} /> Resolve</button>
            )}
            {viewReport.status !== 'REJECTED' && viewReport.status !== 'RESOLVED' && (
              <button onClick={() => { setStatus(viewReport, 'REJECTED'); }} style={{ ...solidBtn('#ef4444') }}><XCircle size={13} /> Reject</button>
            )}
            <button onClick={() => { setApReport(viewReport); }} style={solidBtn('#f59e0b')}><ClipboardList size={13} /> Create Action Plan</button>
            <button onClick={() => setViewReport(null)} style={{ padding: '9px 16px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
          </div>
        </div>
        </div>
      )}

      {/* ── ASSIGN MODAL ──────────────────────────────────────────────────────── */}
      {assignReport && (
        <div onClick={() => { setAssignReport(null); setAssignee(''); setAssignErr(''); }} style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 400, background: 'var(--bg-card)', border: '1px solid rgba(139,92,246,0.3)', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', animation: 'fadeInUp 0.25s ease-out', overflow: 'hidden' }}>
          <div style={{ padding: '20px 22px', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <UserCheck size={17} color="#8b5cf6" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1rem' }}>Assign Report</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>{assignReport.id} · {assignReport.village}</div>
              </div>
            </div>
            <button onClick={() => { setAssignReport(null); setAssignee(''); setAssignErr(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}><X size={18} /></button>
          </div>
          <div style={{ padding: '20px 22px' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6, display: 'block' }}>Assign To *</label>
            {villages.length > 0 ? (
              <input list="officer-list" style={inputSt(!!assignErr)} value={assignee} onChange={e => { setAssignee(e.target.value); setAssignErr(''); }} placeholder="Officer name or department…" />
            ) : (
              <input style={inputSt(!!assignErr)} value={assignee} onChange={e => { setAssignee(e.target.value); setAssignErr(''); }} placeholder="Officer name or department…" />
            )}
            {assignErr && <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 5, fontSize: '0.75rem', color: '#ef4444' }}><AlertCircle size={11} /> {assignErr}</div>}
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '0 22px 20px' }}>
            <button onClick={() => { setAssignReport(null); setAssignee(''); setAssignErr(''); }} style={{ flex: 1, padding: '9px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={submitAssign} style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: '#8b5cf6', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <UserCheck size={14} /> Assign
            </button>
          </div>
        </div>
        </div>
      )}

      {/* ── ACTION PLAN CONFIRM MODAL ─────────────────────────────────────────── */}
      {apReport && (
        <div onClick={() => setApReport(null)} style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
        <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 420, background: 'var(--bg-card)', border: '1px solid rgba(59,130,246,0.3)', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', animation: 'fadeInUp 0.25s ease-out', overflow: 'hidden' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 24px 20px', gap: 10, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardList size={20} color="#3b82f6" />
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>Create Action Plan</div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, maxWidth: 320 }}>
              Create an action plan from report <strong style={{ color: 'var(--text-main)' }}>"{apReport.title}"</strong>?
              It will be pre-filled and added to Action Plans for completion.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '0 24px 20px' }}>
            <button onClick={() => setApReport(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={() => createActionPlan(apReport)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <ClipboardList size={14} /> Create &amp; Go
            </button>
          </div>
        </div>
        </div>
      )}

      {/* ── PAGE HEADER ───────────────────────────────────────────────────────── */}
      <div style={{ ...cardS, marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <FileText size={20} color="#3b82f6" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>{t('fieldReports')}</h1>
            <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.83rem' }}>
              Review and manage water-related issues reported from villages.
              {isDemo && <span style={{ marginLeft: 8, fontSize: '0.72rem', padding: '2px 8px', borderRadius: 20, fontWeight: 800, background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', color: '#f59e0b' }}>Demo Mode</span>}
            </p>
          </div>
        </div>
        <button onClick={() => setShowActivity(a => !a)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: showActivity ? 'var(--primary)' : 'var(--text-muted)', fontSize: '0.83rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
          <History size={14} /> {showActivity ? 'Hide Activity' : 'Activity Log'}
        </button>
      </div>

      {/* ── KPI CARDS ─────────────────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 18 }}>
        {[
          { label: 'Total Reports', val: counts.total,        color: '#3b82f6', filter: null },
          { label: 'New',           val: counts.NEW,          color: '#f59e0b', filter: 'NEW' },
          { label: 'Under Review',  val: counts.UNDER_REVIEW, color: '#0ea5e9', filter: 'UNDER_REVIEW' },
          { label: 'Resolved',      val: counts.RESOLVED,     color: '#22c55e', filter: 'RESOLVED' },
          { label: 'Critical',      val: counts.CRITICAL,     color: '#ef4444', filter: null },
        ].map(k => (
          <div key={k.label}
            onClick={() => k.filter && setFStatus(fStatus === k.filter ? 'ALL' : k.filter)}
            style={{ ...cardS, borderLeft: `3px solid ${k.color}`, cursor: k.filter ? 'pointer' : 'default', outline: k.filter && fStatus === k.filter ? `2px solid ${k.color}` : 'none', transition: 'box-shadow 0.15s' }}>
            <div style={{ fontSize: '0.71rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{k.label}</div>
            <div style={{ fontSize: '2rem', fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* ── FILTERS ───────────────────────────────────────────────────────────── */}
      <div style={{ ...cardS, marginBottom: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', borderRadius: 8, padding: '6px 11px', flex: '1 1 180px', minWidth: 160 }}>
          <Search size={14} color="var(--text-muted)" />
          <input type="text" placeholder="Search reports…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.83rem', width: '100%', outline: 'none', fontFamily: 'inherit' }} />
        </div>
        <FilterSel label="Status" value={fStatus} onChange={setFStatus} options={[['ALL', 'All Statuses'], ...ALL_STATUSES.map(s => [s, statusLabel(s)] as [string, string])]} />
        <FilterSel label="Priority" value={fPriority} onChange={setFPriority} options={[['ALL', 'All Priorities'], ...ALL_PRIORITIES.map(p => [p, p] as [string, string])]} />
        <FilterSel label="Category" value={fCategory} onChange={setFCategory} options={[['ALL', 'All Categories'], ...ALL_CATEGORIES.map(c => [c, c] as [string, string])]} />
        <FilterSel label="District" value={fDistrict} onChange={setFDistrict} options={[['ALL', 'All Districts'], ...districtOptions.map(d => [d, d] as [string, string])]} />
        <FilterSel label="Village" value={fVillage} onChange={setFVillage} options={[['ALL', 'All Villages'], ...villageOptions.map(v => [v, v] as [string, string])]} />
        {(search || fStatus !== 'ALL' || fPriority !== 'ALL' || fCategory !== 'ALL' || fDistrict !== 'ALL' || fVillage !== 'ALL') && (
          <button onClick={() => { setSearch(''); setFStatus('ALL'); setFPriority('ALL'); setFCategory('ALL'); setFDistrict('ALL'); setFVillage('ALL'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 11px', borderRadius: 7, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <RefreshCw size={11} /> Clear
          </button>
        )}
      </div>

      {/* ── REPORTS TABLE ─────────────────────────────────────────────────────── */}
      <div style={{ ...cardS, padding: 0, overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.83rem', minWidth: 900 }}>
            <thead>
              <tr style={{ background: 'var(--bg-card-hover)', borderBottom: '1px solid var(--border-glass)' }}>
                {['Report', 'Location', 'Category', 'Priority', 'Reporter', 'Date', 'Status', 'AI Conf.', 'Actions'].map((h, i) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: i >= 7 ? 'center' : 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={9} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>No reports match the current filters.</td></tr>
              )}
              {filtered.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--border-glass)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-card-hover)' }}>

                  {/* Report */}
                  <td style={{ padding: '13px 16px', maxWidth: 260 }}>
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: 3, lineHeight: 1.35 }}>{r.title}</div>
                    <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: '0.65rem', background: 'var(--bg-dark)', padding: '1px 6px', borderRadius: 3, color: 'var(--text-muted)' }}>{r.id}</span>
                      {r.isDemo && <span style={{ fontSize: '0.62rem', color: '#f59e0b', fontWeight: 700 }}>Demo</span>}
                      {r.analysis && <span style={{ fontSize: '0.62rem', color: '#8b5cf6', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 2 }}>AI<Check size={9} strokeWidth={3} /></span>}
                    </div>
                  </td>

                  {/* Location */}
                  <td style={{ padding: '13px 16px', whiteSpace: 'nowrap' }}>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                      <MapPin size={11} color="#3b82f6" /> {r.village}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.district}</div>
                  </td>

                  {/* Category */}
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 800, background: categoryColor(r.category) + '18', color: categoryColor(r.category), border: `1px solid ${categoryColor(r.category)}44` }}>
                      {categoryIcon(r.category)} {r.category}
                    </span>
                  </td>

                  {/* Priority */}
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 800, background: priorityColor(r.priority) + '18', color: priorityColor(r.priority), border: `1px solid ${priorityColor(r.priority)}44` }}>
                      {r.priority}
                    </span>
                  </td>

                  {/* Reporter */}
                  <td style={{ padding: '13px 16px' }}>
                    <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 22, height: 22, borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.68rem', fontWeight: 700, flexShrink: 0 }}>
                        {r.reporter.charAt(0)}
                      </div>
                      <span style={{ fontSize: '0.8rem' }}>{r.reporter}</span>
                    </div>
                    <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', marginTop: 2 }}>{r.reporterRole}</div>
                  </td>

                  {/* Date */}
                  <td style={{ padding: '13px 16px', whiteSpace: 'nowrap', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    {fmtDate(r.reportedAt)}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '13px 16px' }}>
                    <span style={{ padding: '3px 9px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 800, background: statusBg(r.status), color: statusColor(r.status), border: `1px solid ${statusColor(r.status)}44`, whiteSpace: 'nowrap' }}>
                      {statusLabel(r.status)}
                    </span>
                    {r.assignedTo && <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2 }}>→ {r.assignedTo}</div>}
                  </td>

                  {/* AI Confidence */}
                  <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: confColor(r.aiConfidence) }}>{r.aiConfidence}%</span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '13px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: 5, justifyContent: 'center', flexWrap: 'wrap' }}>
                      <button onClick={() => setViewReport(r)} style={ghostBtn()} title="View"><Eye size={13} /></button>
                      <button onClick={() => runAIAnalysis(r)} disabled={analyzingId === r.id} style={{ ...actionBtn('#8b5cf6'), opacity: analyzingId === r.id ? 0.6 : 1 }} title="AI Analyze">
                        {analyzingId === r.id ? <Loader2 size={12} className="at-spin" /> : <Zap size={12} />}
                      </button>
                      {r.status === 'NEW' && (
                        <button onClick={() => { setAssignReport(r); }} style={actionBtn('#8b5cf6')} title="Assign"><UserCheck size={12} /></button>
                      )}
                      {r.status === 'NEW' && (
                        <button onClick={() => setStatus(r, 'UNDER_REVIEW')} style={actionBtn('#3b82f6')} title="Under Review"><MessageSquare size={12} /></button>
                      )}
                      {(r.status === 'NEW' || r.status === 'UNDER_REVIEW' || r.status === 'ASSIGNED') && (
                        <button onClick={() => setStatus(r, 'RESOLVED')} style={actionBtn('#22c55e')} title="Resolve"><CheckCircle2 size={12} /></button>
                      )}
                      <button onClick={() => setApReport(r)} style={actionBtn('#f59e0b')} title="Create Action Plan"><ClipboardList size={12} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── ACTIVITY LOG ──────────────────────────────────────────────────────── */}
      {showActivity && (
        <div style={{ ...cardS, marginBottom: 24, animation: 'fadeInUp 0.3s ease-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.73rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>
              <History size={14} /> Activity Log
            </div>
            {activity.length > 0 && (
              <button onClick={() => { setActivity([]); saveActivity([]); }} style={{ fontSize: '0.72rem', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>Clear log</button>
            )}
          </div>
          {activity.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: 'var(--text-muted)', fontSize: '0.85rem' }}>No activity recorded yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', minWidth: 580 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-glass)', background: 'var(--bg-card-hover)' }}>
                    {['Timestamp', 'Report ID', 'User', 'Action', 'Prev. Status', 'New Status'].map(h => (
                      <th key={h} style={{ padding: '9px 13px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.67rem', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {activity.map((e, i) => (
                    <tr key={e.id} style={{ borderBottom: '1px solid var(--border-glass)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-card-hover)' }}>
                      <td style={{ padding: '9px 13px', fontFamily: 'monospace', color: 'var(--text-muted)', fontSize: '0.72rem', whiteSpace: 'nowrap' }}>{e.ts}</td>
                      <td style={{ padding: '9px 13px', fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--text-muted)' }}>{e.reportId}</td>
                      <td style={{ padding: '9px 13px', color: 'var(--text-muted)' }}>{e.user}</td>
                      <td style={{ padding: '9px 13px', fontWeight: 700 }}>{e.action}</td>
                      <td style={{ padding: '9px 13px' }}>
                        <span style={{ padding: '2px 7px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 800, background: statusBg(e.prevStatus), color: statusColor(e.prevStatus), border: `1px solid ${statusColor(e.prevStatus)}44` }}>{statusLabel(e.prevStatus)}</span>
                      </td>
                      <td style={{ padding: '9px 13px' }}>
                        <span style={{ padding: '2px 7px', borderRadius: 20, fontSize: '0.65rem', fontWeight: 800, background: statusBg(e.newStatus), color: statusColor(e.newStatus), border: `1px solid ${statusColor(e.newStatus)}44` }}>{statusLabel(e.newStatus)}</span>
                      </td>
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

// ─── Shared type for Action Plan bridge ───────────────────────────────────────
interface StoredPlan {
  id: string; title: string; interventionType: string; village: string;
  district: string; status: string; budget: number; startDate: string;
  targetDate: string; owner: string; priority: string; description: string;
}
