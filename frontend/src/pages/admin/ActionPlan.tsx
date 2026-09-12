import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import {
  ClipboardList, Clock, MapPin, DollarSign, Calendar,
  MoreVertical, Plus, Search, Filter, Play, CheckCircle2,
  X, Eye, Pencil, RefreshCw, Trash2, AlertCircle, CheckCircle,
} from 'lucide-react';
import { getVillages, generateActionPlan, Village } from '../../services/api';

// ─── Data model ──────────────────────────────────────────────────────────────

interface Plan {
  id: string;
  title: string;
  interventionType: string;
  village: string;
  district: string;
  status: 'PLANNED' | 'IN PROGRESS' | 'COMPLETED';
  budget: number;
  startDate: string;
  targetDate: string;
  owner: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

const LS_KEY = 'jalrakshak_action_plans';

const SEED_PLANS: Plan[] = [
  { id: 'AP-101', title: 'Check Dam Construction',      interventionType: 'Check Dam',         village: 'Rajkot',       district: 'Rajkot',    status: 'IN PROGRESS', budget: 20, startDate: '2026-10-01', targetDate: '2027-03-31', owner: 'Ramesh Patel',  priority: 'HIGH',     description: '' },
  { id: 'AP-102', title: 'Farm Pond Excavation',        interventionType: 'Farm Pond',         village: 'Amreli_V4',    district: 'Amreli',    status: 'PLANNED',     budget: 8,  startDate: '2026-11-15', targetDate: '2026-12-30', owner: 'Suresh Kumar', priority: 'MEDIUM',   description: '' },
  { id: 'AP-103', title: 'Drip Irrigation Subsidy Drive', interventionType: 'Drip Irrigation', village: 'Bhavnagar_V1', district: 'Bhavnagar', status: 'IN PROGRESS', budget: 12, startDate: '2026-09-01', targetDate: '2026-11-30', owner: 'Meena Desai',  priority: 'CRITICAL', description: '' },
  { id: 'AP-104', title: 'Percolation Tank Maintenance', interventionType: 'Percolation Tank', village: 'Morbi',        district: 'Morbi',     status: 'COMPLETED',   budget: 15, startDate: '2026-05-10', targetDate: '2026-08-20', owner: 'Rajesh Singh', priority: 'MEDIUM',   description: '' },
  { id: 'AP-105', title: 'Community Recharge Well',     interventionType: 'Recharge Well',     village: 'Jamnagar',     district: 'Jamnagar',  status: 'PLANNED',     budget: 3,  startDate: '2026-12-01', targetDate: '2027-01-15', owner: 'Vikram Joshi', priority: 'LOW',      description: '' },
];

function loadPlans(): Plan[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as Plan[];
  } catch { /* ignore */ }
  return SEED_PLANS;
}

function savePlans(plans: Plan[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(plans)); } catch { /* ignore */ }
}

function nextId(plans: Plan[]): string {
  const nums = plans.map(p => parseInt(p.id.replace('AP-', ''), 10)).filter(n => !isNaN(n));
  const max = nums.length ? Math.max(...nums) : 100;
  return `AP-${max + 1}`;
}

// ─── Status / priority helpers ────────────────────────────────────────────────

function statusColor(s: string) {
  switch (s) {
    case 'COMPLETED':   return '#22c55e';
    case 'IN PROGRESS': return '#f59e0b';
    case 'PLANNED':     return '#3b82f6';
    default:            return 'var(--text-muted)';
  }
}
function statusBg(s: string) {
  switch (s) {
    case 'COMPLETED':   return 'rgba(34,197,94,0.15)';
    case 'IN PROGRESS': return 'rgba(245,158,11,0.15)';
    case 'PLANNED':     return 'rgba(59,130,246,0.15)';
    default:            return 'rgba(0,0,0,0.1)';
  }
}
function statusIcon(s: string) {
  switch (s) {
    case 'COMPLETED':   return <CheckCircle2 size={14} />;
    case 'IN PROGRESS': return <Play size={14} />;
    case 'PLANNED':     return <Clock size={14} />;
    default:            return null;
  }
}

function priorityColor(p: string) {
  switch (p) {
    case 'CRITICAL': return '#ef4444';
    case 'HIGH':     return '#f97316';
    case 'MEDIUM':   return '#f59e0b';
    case 'LOW':      return '#22c55e';
    default:         return 'var(--text-muted)';
  }
}

// ─── Blank form state ─────────────────────────────────────────────────────────

interface FormState {
  title: string;
  interventionType: string;
  district: string;
  village: string;
  startDate: string;
  targetDate: string;
  budget: string;
  owner: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
}

const BLANK_FORM: FormState = {
  title: '', interventionType: '', district: '', village: '',
  startDate: '', targetDate: '', budget: '', owner: '',
  priority: 'MEDIUM', description: '',
};

const INTERVENTION_TYPES = [
  'Check Dam', 'Farm Pond', 'Recharge Well', 'Percolation Tank',
  'Drip Irrigation', 'Crop Switching', 'Other',
];

const DISTRICTS = [
  'Ahmedabad', 'Amreli', 'Anand', 'Bhavnagar', 'Botad', 'Chhota Udaipur',
  'Dahod', 'Dang', 'Devbhumi Dwarka', 'Gandhinagar', 'Gir Somnath',
  'Jamnagar', 'Junagadh', 'Kheda', 'Kutch', 'Mahisagar', 'Mehsana',
  'Morbi', 'Narmada', 'Navsari', 'Panchmahal', 'Patan', 'Porbandar',
  'Rajkot', 'Sabarkantha', 'Surat', 'Surendranagar', 'Tapi', 'Vadodara',
  'Valsad',
];

// ─── Field validation ─────────────────────────────────────────────────────────

function validate(f: FormState): Partial<Record<keyof FormState, string>> {
  const e: Partial<Record<keyof FormState, string>> = {};
  if (!f.title.trim())            e.title            = 'Plan name is required.';
  if (!f.interventionType)        e.interventionType = 'Select an intervention type.';
  if (!f.district.trim())         e.district         = 'District is required.';
  if (!f.village.trim())          e.village          = 'Village is required.';
  if (!f.startDate)               e.startDate        = 'Start date is required.';
  if (!f.targetDate)              e.targetDate       = 'End date is required.';
  if (f.startDate && f.targetDate && f.targetDate < f.startDate)
                                  e.targetDate       = 'End date must be after start date.';
  if (!f.budget.trim())           e.budget           = 'Budget is required.';
  else if (isNaN(Number(f.budget)) || Number(f.budget) <= 0)
                                  e.budget           = 'Enter a valid positive number.';
  if (!f.owner.trim())            e.owner            = 'Owner name is required.';
  return e;
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function ActionPlan() {
  const { t } = useLanguage();
  const [plans, setPlans]           = useState<Plan[]>(loadPlans);
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL');

  // Modal state
  const [modalMode, setModalMode]   = useState<'none' | 'create' | 'edit' | 'view' | 'status' | 'delete'>('none');
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [form, setForm]             = useState<FormState>(BLANK_FORM);
  const [errors, setErrors]         = useState<Partial<Record<keyof FormState, string>>>({});
  const [saving, setSaving]         = useState(false);

  // Context menu
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Notification
  const [toast, setToast]           = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Village list from backend
  const [backendVillages, setBackendVillages] = useState<Village[]>([]);

  useEffect(() => {
    getVillages().then(d => setBackendVillages(Array.isArray(d?.villages) ? d.villages : [])).catch(() => {});
  }, []);

  // Persist whenever plans change
  useEffect(() => { savePlans(plans); }, [plans]);

  // Close context menu on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  // ── Derived ─────────────────────────────────────────────────────────────

  const filteredPlans = plans.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = p.title.toLowerCase().includes(q) || p.village.toLowerCase().includes(q) || p.district.toLowerCase().includes(q);
    const matchStatus = filterStatus === 'ALL' || p.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // ── Modal helpers ────────────────────────────────────────────────────────

  const openCreate = () => {
    setForm(BLANK_FORM);
    setErrors({});
    setActivePlan(null);
    setModalMode('create');
  };

  const openEdit = (p: Plan) => {
    setForm({
      title: p.title, interventionType: p.interventionType,
      district: p.district, village: p.village,
      startDate: p.startDate, targetDate: p.targetDate,
      budget: String(p.budget), owner: p.owner,
      priority: p.priority, description: p.description,
    });
    setErrors({});
    setActivePlan(p);
    setModalMode('edit');
    setMenuOpenId(null);
  };

  const openView = (p: Plan) => {
    setActivePlan(p);
    setModalMode('view');
    setMenuOpenId(null);
  };

  const openStatus = (p: Plan) => {
    setActivePlan(p);
    setModalMode('status');
    setMenuOpenId(null);
  };

  const openDelete = (p: Plan) => {
    setActivePlan(p);
    setModalMode('delete');
    setMenuOpenId(null);
  };

  const closeModal = () => {
    setModalMode('none');
    setActivePlan(null);
    setErrors({});
  };

  const setField = <K extends keyof FormState>(k: K, v: FormState[K]) => {
    setForm(f => ({ ...f, [k]: v }));
    if (errors[k]) setErrors(e => { const n = { ...e }; delete n[k]; return n; });
  };

  // ── Save (create / edit) ─────────────────────────────────────────────────

  const handleSave = async () => {
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setSaving(true);
    try {
      // Try backend if a matching village_id exists
      const matchedVillage = backendVillages.find(
        v => v.name.toLowerCase() === form.village.toLowerCase() || v.village_id.toLowerCase() === form.village.toLowerCase()
      );
      if (matchedVillage) {
        await generateActionPlan(matchedVillage.village_id).catch(() => {/* non-blocking */});
      }
    } catch { /* proceed with local */ }

    if (modalMode === 'create') {
      const newPlan: Plan = {
        id: nextId(plans),
        title: form.title.trim(),
        interventionType: form.interventionType,
        district: form.district.trim(),
        village: form.village.trim(),
        status: 'PLANNED',
        budget: Number(form.budget),
        startDate: form.startDate,
        targetDate: form.targetDate,
        owner: form.owner.trim(),
        priority: form.priority,
        description: form.description.trim(),
      };
      setPlans(prev => [newPlan, ...prev]);
      setToast({ msg: 'Action Plan created successfully.', type: 'success' });
    } else if (modalMode === 'edit' && activePlan) {
      setPlans(prev => prev.map(p =>
        p.id === activePlan.id
          ? {
              ...p,
              title: form.title.trim(),
              interventionType: form.interventionType,
              district: form.district.trim(),
              village: form.village.trim(),
              budget: Number(form.budget),
              startDate: form.startDate,
              targetDate: form.targetDate,
              owner: form.owner.trim(),
              priority: form.priority,
              description: form.description.trim(),
            }
          : p
      ));
      setToast({ msg: 'Action Plan updated successfully.', type: 'success' });
    }

    setSaving(false);
    closeModal();
  };

  // ── Change status ────────────────────────────────────────────────────────

  const handleChangeStatus = (newStatus: Plan['status']) => {
    if (!activePlan) return;
    setPlans(prev => prev.map(p => p.id === activePlan.id ? { ...p, status: newStatus } : p));
    setToast({ msg: `Status changed to "${newStatus}".`, type: 'success' });
    closeModal();
  };

  // ── Delete ───────────────────────────────────────────────────────────────

  const handleDelete = () => {
    if (!activePlan) return;
    setPlans(prev => prev.filter(p => p.id !== activePlan.id));
    setToast({ msg: `Plan "${activePlan.title}" deleted.`, type: 'success' });
    closeModal();
  };

  const modalOpen = modalMode !== 'none';

  // ── Shared form field style ──────────────────────────────────────────────

  const inputStyle = (hasErr: boolean): React.CSSProperties => ({
    width: '100%', padding: '9px 12px', borderRadius: 8, fontFamily: 'inherit',
    fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
    background: 'var(--bg-dark)', color: 'var(--text-main)',
    border: `1px solid ${hasErr ? '#ef4444' : 'var(--border-glass)'}`,
    transition: 'border-color 0.2s',
  });

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ color: 'var(--text-main)', animation: 'fadeInUp 0.4s ease-out' }}>

      {/* ── TOAST ──────────────────────────────────────────────────────── */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 2000,
          display: 'flex', alignItems: 'center', gap: 10,
          background: toast.type === 'success' ? '#052e16' : '#450a0a',
          border: `1px solid ${toast.type === 'success' ? '#16a34a' : '#dc2626'}`,
          borderRadius: 10, padding: '12px 18px', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          color: toast.type === 'success' ? '#86efac' : '#fca5a5',
          fontSize: '0.875rem', fontWeight: 600, maxWidth: 380,
          animation: 'fadeInUp 0.3s ease-out',
        }}>
          {toast.type === 'success'
            ? <CheckCircle size={16} color="#22c55e" style={{ flexShrink: 0 }} />
            : <AlertCircle size={16} color="#ef4444" style={{ flexShrink: 0 }} />}
          {toast.msg}
          <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', display: 'flex', padding: 0, marginLeft: 4 }}>
            <X size={14} />
          </button>
        </div>
      )}

      {/* ── MODAL BACKDROP + CENTERING WRAPPER ─────────────────────────── */}
      {modalOpen && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(3px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        />
      )}

      {/* ── CREATE / EDIT MODAL ─────────────────────────────────────────── */}
      {(modalMode === 'create' || modalMode === 'edit') && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed', inset: 0, zIndex: 1100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 640,
            maxHeight: '90vh', overflowY: 'auto',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-glass)',
            borderRadius: 16,
            boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            animation: 'fadeInUp 0.25s ease-out',
          }}
        >
          {/* Modal header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '20px 24px', borderBottom: '1px solid var(--border-glass)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 9, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ClipboardList size={17} color="#3b82f6" />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>
                  {modalMode === 'create' ? t('create') + ' ' + t('actionPlan') : t('edit') + ' ' + t('actionPlan')}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>
                  {modalMode === 'create' ? 'All required fields must be filled.' : `Editing ${activePlan?.id}`}
                </div>
              </div>
            </div>
            <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4, borderRadius: 6 }}>
              <X size={20} />
            </button>
          </div>

          {/* Modal body */}
          <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 18 }}>

            {/* Plan Name */}
            <div>
              <label style={labelStyle}>Plan Name <Req /></label>
              <input
                style={inputStyle(!!errors.title)}
                value={form.title}
                onChange={e => setField('title', e.target.value)}
                placeholder="e.g. Check Dam Construction – Village Rajkot"
              />
              {errors.title && <ErrMsg msg={errors.title} />}
            </div>

            {/* Intervention Type */}
            <div>
              <label style={labelStyle}>Intervention Type <Req /></label>
              <select
                style={inputStyle(!!errors.interventionType)}
                value={form.interventionType}
                onChange={e => setField('interventionType', e.target.value)}
              >
                <option value="">Select type…</option>
                {INTERVENTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.interventionType && <ErrMsg msg={errors.interventionType} />}
            </div>

            {/* District + Village */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>District <Req /></label>
                {backendVillages.length > 0 ? (
                  <select
                    style={inputStyle(!!errors.district)}
                    value={form.district}
                    onChange={e => setField('district', e.target.value)}
                  >
                    <option value="">Select district…</option>
                    {[...new Set(backendVillages.map(v => v.district))].sort().map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                ) : (
                  <select
                    style={inputStyle(!!errors.district)}
                    value={form.district}
                    onChange={e => setField('district', e.target.value)}
                  >
                    <option value="">Select district…</option>
                    {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                )}
                {errors.district && <ErrMsg msg={errors.district} />}
              </div>
              <div>
                <label style={labelStyle}>Village <Req /></label>
                {backendVillages.length > 0 ? (
                  <select
                    style={inputStyle(!!errors.village)}
                    value={form.village}
                    onChange={e => setField('village', e.target.value)}
                  >
                    <option value="">Select village…</option>
                    {backendVillages
                      .filter(v => !form.district || v.district === form.district)
                      .map(v => (
                        <option key={v.village_id} value={v.name}>{v.name}</option>
                      ))}
                  </select>
                ) : (
                  <input
                    style={inputStyle(!!errors.village)}
                    value={form.village}
                    onChange={e => setField('village', e.target.value)}
                    placeholder="Village name"
                  />
                )}
                {errors.village && <ErrMsg msg={errors.village} />}
              </div>
            </div>

            {/* Start Date + End Date */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Start Date <Req /></label>
                <input
                  type="date"
                  style={inputStyle(!!errors.startDate)}
                  value={form.startDate}
                  onChange={e => setField('startDate', e.target.value)}
                />
                {errors.startDate && <ErrMsg msg={errors.startDate} />}
              </div>
              <div>
                <label style={labelStyle}>End Date <Req /></label>
                <input
                  type="date"
                  style={inputStyle(!!errors.targetDate)}
                  value={form.targetDate}
                  onChange={e => setField('targetDate', e.target.value)}
                />
                {errors.targetDate && <ErrMsg msg={errors.targetDate} />}
              </div>
            </div>

            {/* Budget + Owner */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div>
                <label style={labelStyle}>Budget (₹ Lakh) <Req /></label>
                <input
                  type="number"
                  min="0"
                  step="0.1"
                  style={inputStyle(!!errors.budget)}
                  value={form.budget}
                  onChange={e => setField('budget', e.target.value)}
                  placeholder="e.g. 12.5"
                />
                {errors.budget && <ErrMsg msg={errors.budget} />}
              </div>
              <div>
                <label style={labelStyle}>Owner <Req /></label>
                <input
                  style={inputStyle(!!errors.owner)}
                  value={form.owner}
                  onChange={e => setField('owner', e.target.value)}
                  placeholder="Responsible officer"
                />
                {errors.owner && <ErrMsg msg={errors.owner} />}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label style={labelStyle}>Priority</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
                {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as Plan['priority'][]).map(p => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setField('priority', p)}
                    style={{
                      padding: '6px 16px', borderRadius: 20, border: '1px solid',
                      fontSize: '0.78rem', fontWeight: 800, cursor: 'pointer',
                      letterSpacing: '0.04em', transition: 'all 0.15s',
                      borderColor: form.priority === p ? priorityColor(p) : 'var(--border-glass)',
                      background: form.priority === p ? priorityColor(p) + '22' : 'transparent',
                      color: form.priority === p ? priorityColor(p) : 'var(--text-muted)',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <label style={labelStyle}>Description</label>
              <textarea
                rows={3}
                style={{ ...inputStyle(false), resize: 'vertical', lineHeight: 1.6 }}
                value={form.description}
                onChange={e => setField('description', e.target.value)}
                placeholder="Optional notes or objectives…"
              />
            </div>
          </div>

          {/* Modal footer */}
          <div style={{
            display: 'flex', justifyContent: 'flex-end', gap: 10,
            padding: '16px 24px', borderTop: '1px solid var(--border-glass)',
          }}>
            <button
              onClick={closeModal}
              style={{ padding: '9px 20px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.88rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
            >
              {t('cancel')}
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 22px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontSize: '0.88rem', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.7 : 1, fontFamily: 'inherit' }}
            >
              {saving ? 'Saving…' : modalMode === 'create' ? <><ClipboardList size={15} /> Create Action Plan</> : <><CheckCircle2 size={15} /> Save Changes</>}
            </button>
          </div>
        </div>
        </div>
      )}

      {/* ── VIEW MODAL ──────────────────────────────────────────────────── */}
      {modalMode === 'view' && activePlan && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed', inset: 0, zIndex: 1100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 520,
            maxHeight: '90vh', overflowY: 'auto',
            background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
            borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            animation: 'fadeInUp 0.25s ease-out', overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border-glass)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.72rem', background: 'var(--bg-dark)', padding: '2px 8px', borderRadius: 4, color: 'var(--text-muted)', fontWeight: 700 }}>{activePlan.id}</span>
              <span style={{ fontWeight: 800, fontSize: '1rem' }}>{activePlan.title}</span>
            </div>
            <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}><X size={18} /></button>
          </div>
          <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {([
              ['Intervention Type', activePlan.interventionType],
              ['Location', `${activePlan.village}, ${activePlan.district} District`],
              ['Timeline', `${activePlan.startDate} → ${activePlan.targetDate}`],
              ['Budget', `₹${activePlan.budget} Lakh`],
              ['Owner', activePlan.owner],
              ['Priority', activePlan.priority],
            ] as [string, string][]).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-glass)' }}>
                <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>{k}</span>
                <span style={{ fontSize: '0.88rem', fontWeight: 700, color: k === 'Priority' ? priorityColor(v) : 'var(--text-main)' }}>{v}</span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border-glass)' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Status</span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, background: statusBg(activePlan.status), color: statusColor(activePlan.status), border: `1px solid ${statusColor(activePlan.status)}44` }}>
                {statusIcon(activePlan.status)} {activePlan.status}
              </span>
            </div>
            {activePlan.description && (
              <div style={{ padding: '8px 0' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Description</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', lineHeight: 1.6 }}>{activePlan.description}</div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '14px 22px', borderTop: '1px solid var(--border-glass)' }}>
            <button onClick={() => openEdit(activePlan)} style={{ flex: 1, padding: '9px', borderRadius: 8, border: 'none', background: '#3b82f6', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>Edit Plan</button>
            <button onClick={closeModal} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>Close</button>
          </div>
        </div>
        </div>
      )}

      {/* ── CHANGE STATUS MODAL ─────────────────────────────────────────── */}
      {modalMode === 'status' && activePlan && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed', inset: 0, zIndex: 1100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 380,
            background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
            borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            animation: 'fadeInUp 0.25s ease-out', overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border-glass)' }}>
            <span style={{ fontWeight: 800, fontSize: '1rem' }}>Change Status</span>
            <button onClick={closeModal} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}><X size={18} /></button>
          </div>
          <div style={{ padding: '20px 22px' }}>
            <p style={{ margin: '0 0 16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Current status: <strong style={{ color: statusColor(activePlan.status) }}>{activePlan.status}</strong>
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(['PLANNED', 'IN PROGRESS', 'COMPLETED'] as Plan['status'][]).map(s => (
                <button
                  key={s}
                  onClick={() => handleChangeStatus(s)}
                  disabled={activePlan.status === s}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 16px', borderRadius: 8,
                    border: `1px solid ${activePlan.status === s ? statusColor(s) + '55' : 'var(--border-glass)'}`,
                    background: activePlan.status === s ? statusBg(s) : 'transparent',
                    color: activePlan.status === s ? statusColor(s) : 'var(--text-main)',
                    cursor: activePlan.status === s ? 'default' : 'pointer',
                    opacity: activePlan.status === s ? 0.6 : 1,
                    fontWeight: 700, fontSize: '0.88rem', fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                >
                  {statusIcon(s)}
                  {s}
                  {activePlan.status === s && <span style={{ marginLeft: 'auto', fontSize: '0.72rem' }}>Current</span>}
                </button>
              ))}
            </div>
          </div>
          <div style={{ padding: '12px 22px', borderTop: '1px solid var(--border-glass)' }}>
            <button onClick={closeModal} style={{ width: '100%', padding: '9px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          </div>
        </div>
        </div>
      )}

      {/* ── DELETE CONFIRM MODAL ────────────────────────────────────────── */}
      {modalMode === 'delete' && activePlan && (
        <div
          onClick={closeModal}
          style={{
            position: 'fixed', inset: 0, zIndex: 1100,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px',
          }}
        >
        <div
          onClick={e => e.stopPropagation()}
          style={{
            width: '100%', maxWidth: 380,
            background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
            animation: 'fadeInUp 0.25s ease-out', overflow: 'hidden',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 24px 20px', gap: 12, textAlign: 'center' }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Trash2 size={20} color="#ef4444" />
            </div>
            <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>Delete Action Plan</div>
            <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              Are you sure you want to delete <strong style={{ color: 'var(--text-main)' }}>"{activePlan.title}"</strong>?
              This action cannot be undone.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, padding: '0 24px 20px' }}>
            <button onClick={closeModal} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
            <button onClick={handleDelete} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit' }}>Delete</button>
          </div>
        </div>
        </div>
      )}

      {/* ── HEADER ─────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 12, padding: '20px 24px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{ width: 38, height: 38, borderRadius: 9, background: 'rgba(59,130,246,0.15)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ClipboardList size={18} color="#3b82f6" />
            </div>
            <h1 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800 }}>{t('actionPlan')}</h1>
          </div>
          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Track and manage water intervention projects across villages.</p>
        </div>
        <button
          onClick={openCreate}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 18px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', fontFamily: 'inherit' }}
        >
          <Plus size={16} /> {t('newPlan')}
        </button>
      </div>

      {/* ── SUMMARY STATS ──────────────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: t('actionPlan'),  val: plans.length,                                              color: '#3b82f6' },
          { label: t('inProgress'),  val: plans.filter(p => p.status === 'IN PROGRESS').length,      color: '#f59e0b' },
          { label: t('completed'),   val: plans.filter(p => p.status === 'COMPLETED').length,        color: '#22c55e' },
          { label: t('budget'),      val: '₹' + plans.reduce((a, p) => a + p.budget, 0).toFixed(1) + ' L', color: '#a78bfa' },
        ].map((s, i) => (
          <div key={i} style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderLeft: `3px solid ${s.color}`, borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>{s.label}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 800, color: s.color }}>{s.val}</div>
          </div>
        ))}
      </div>

      {/* ── FILTERS ────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 10, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', borderRadius: 8, padding: '6px 12px', width: '100%', maxWidth: 300 }}>
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            placeholder="Search plans or villages..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.88rem', width: '100%', outline: 'none' }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Filter size={16} color="var(--text-muted)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Filter:</span>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{ background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', borderRadius: 6, padding: '6px 10px', fontSize: '0.85rem', outline: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <option value="ALL">{t('all')}</option>
            <option value="PLANNED">{t('planned')}</option>
            <option value="IN PROGRESS">{t('inProgress')}</option>
            <option value="COMPLETED">{t('completed')}</option>
          </select>
        </div>
      </div>

      {/* ── TABLE ──────────────────────────────────────────────────────── */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 10, overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem', minWidth: 800 }}>
          <thead>
            <tr style={{ background: 'var(--bg-card-hover)', borderBottom: '1px solid var(--border-glass)' }}>
              {[t('title'), t('location'), t('status'), t('budget'), t('owner'), t('recommendedAction')].map((h, i) => (
                <th key={h} style={{ padding: '14px 20px', textAlign: i === 5 ? 'center' : 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredPlans.length > 0 ? filteredPlans.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: '1px solid var(--border-glass)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-card-hover)' }}>

                {/* Details */}
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: 800, color: 'var(--text-main)', marginBottom: 4 }}>{p.title}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ background: 'var(--bg-dark)', padding: '2px 6px', borderRadius: 4 }}>{p.id}</span>
                    {p.interventionType && (
                      <span style={{ padding: '2px 6px', borderRadius: 4, background: 'rgba(59,130,246,0.1)', color: '#60a5fa', border: '1px solid rgba(59,130,246,0.2)' }}>{p.interventionType}</span>
                    )}
                  </div>
                </td>

                {/* Location */}
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                    <MapPin size={12} color="#3b82f6" /> {p.village}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.district} Dist.</div>
                </td>

                {/* Status */}
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 800, letterSpacing: '0.04em', background: statusBg(p.status), color: statusColor(p.status), border: `1px solid ${statusColor(p.status)}44` }}>
                      {statusIcon(p.status)} {p.status}
                    </span>
                    <span style={{ display: 'inline-block', padding: '2px 8px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.04em', background: priorityColor(p.priority) + '18', color: priorityColor(p.priority), border: `1px solid ${priorityColor(p.priority)}44`, width: 'fit-content' }}>
                      {p.priority}
                    </span>
                  </div>
                </td>

                {/* Timeline & Budget */}
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4, fontSize: '0.8rem' }}>
                    <Calendar size={14} color="var(--text-muted)" /> {p.startDate} – {p.targetDate}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', fontWeight: 600, color: '#10b981' }}>
                    <DollarSign size={14} /> ₹{p.budget} Lakh
                  </div>
                </td>

                {/* Owner */}
                <td style={{ padding: '16px 20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 26, height: 26, borderRadius: '50%', background: '#3b82f6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                      {p.owner.charAt(0).toUpperCase()}
                    </div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{p.owner}</span>
                  </div>
                </td>

                {/* Action menu */}
                <td style={{ padding: '16px 20px', textAlign: 'center', position: 'relative' }}>
                  <button
                    onClick={() => setMenuOpenId(menuOpenId === p.id ? null : p.id)}
                    style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: 6, borderRadius: 6, display: 'inline-flex', transition: 'background 0.15s' }}
                    title="Actions"
                  >
                    <MoreVertical size={18} />
                  </button>

                  {menuOpenId === p.id && (
                    <div
                      ref={menuRef}
                      style={{
                        position: 'absolute', right: 12, top: 44, zIndex: 500,
                        background: 'var(--bg-card)',
                        border: '1px solid var(--border-glass)',
                        borderRadius: 10,
                        boxShadow: '0 10px 36px rgba(0,0,0,0.45)',
                        minWidth: 160,
                        overflow: 'hidden',
                        animation: 'fadeInUp 0.15s ease-out',
                      }}
                    >
                      {[
                        { label: 'View',          icon: <Eye size={14} />,       action: () => openView(p),   color: undefined },
                        { label: 'Edit',          icon: <Pencil size={14} />,    action: () => openEdit(p),   color: undefined },
                        { label: 'Change Status', icon: <RefreshCw size={14} />, action: () => openStatus(p), color: undefined },
                        { label: 'Delete',        icon: <Trash2 size={14} />,    action: () => openDelete(p), color: '#ef4444' },
                      ].map((item, idx, arr) => (
                        <button
                          key={item.label}
                          onClick={item.action}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            width: '100%', padding: '10px 14px',
                            background: 'none', border: 'none',
                            borderBottom: idx < arr.length - 1 ? '1px solid var(--border-glass)' : 'none',
                            color: item.color ?? 'var(--text-main)',
                            fontSize: '0.85rem', fontWeight: 600,
                            cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit',
                            transition: 'background 0.12s',
                          }}
                          onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg-card-hover)')}
                          onMouseLeave={e => (e.currentTarget.style.background = 'none')}
                        >
                          {item.icon} {item.label}
                        </button>
                      ))}
                    </div>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  No action plans found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ── Tiny helpers ────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 3,
  fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 5,
};

function Req() {
  return <span style={{ color: '#ef4444', fontSize: '0.85rem', lineHeight: 1 }}>*</span>;
}

function ErrMsg({ msg }: { msg: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 4, fontSize: '0.75rem', color: '#ef4444' }}>
      <AlertCircle size={11} /> {msg}
    </div>
  );
}
