import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Users as UsersIcon, UserPlus, Search, RefreshCw, Eye, Pencil,
  Trash2, X, AlertCircle, CheckCircle2, ShieldCheck, ShieldOff,
  UserCheck, UserX, Database, Leaf, Users2,
  Crown, ClipboardList, MoreVertical, Sprout, Trees, Ban,
} from 'lucide-react';

// ─── LocalStorage key ─────────────────────────────────────────────────────────
const LS_KEY = 'jalrakshak_users_v1';

declare const __API_BASE__: string;
const _API_BASE = (typeof __API_BASE__ !== 'undefined' && __API_BASE__)
  ? `${__API_BASE__}/api/v1`
  : '/api/v1';

// ─── Types ───────────────────────────────────────────────────────────────────
export type Role = 'Water Administrator' | 'Community' | 'Farmer' | 'Evaluator';
export type UserStatus = 'Active' | 'Inactive' | 'Suspended';

export interface UserRecord {
  id: string;
  name: string;
  email: string;
  role: Role;
  village: string;
  district: string;
  status: UserStatus;
  lastActive: string;    // ISO date string
  createdAt: string;     // ISO date string
  isDemo: boolean;
  phone?: string;
  notes?: string;
  land_area_ha?: number;
  primary_crops?: string;
}

// ─── Demo seed data ───────────────────────────────────────────────────────────
const SEED_USERS: UserRecord[] = [
  { id: 'U001', name: 'Arjun Patel',      email: 'arjun.patel@jalrakshak.gov',     role: 'Water Administrator', village: 'Rajkot',        district: 'Rajkot',          status: 'Active',    lastActive: '2025-01-15', createdAt: '2024-03-01', isDemo: true, phone: '+91 98250 11001' },
  { id: 'U002', name: 'Meena Sharma',     email: 'meena.sharma@village.in',        role: 'Community',           village: 'Junagadh',      district: 'Junagadh',        status: 'Active',    lastActive: '2025-01-14', createdAt: '2024-04-10', isDemo: true, phone: '+91 98250 11002' },
  { id: 'U003', name: 'Ravi Desai',       email: 'ravi.desai@khet.in',             role: 'Farmer',              village: 'Amreli',        district: 'Amreli',          status: 'Active',    lastActive: '2025-01-12', createdAt: '2024-05-22', isDemo: true, phone: '+91 98250 11003', land_area_ha: 4.5, primary_crops: 'Cotton, Groundnut' },
  { id: 'U004', name: 'Priya Nair',       email: 'priya.nair@eval.org',            role: 'Evaluator',           village: 'Bhavnagar',     district: 'Bhavnagar',       status: 'Active',    lastActive: '2025-01-10', createdAt: '2024-06-01', isDemo: true, phone: '+91 98250 11004' },
  { id: 'U005', name: 'Suresh Kulkarni',  email: 'suresh.k@jalrakshak.gov',        role: 'Water Administrator', village: 'Jamnagar',      district: 'Jamnagar',        status: 'Active',    lastActive: '2025-01-13', createdAt: '2024-03-15', isDemo: true, phone: '+91 98250 11005' },
  { id: 'U006', name: 'Kavita Mehta',     email: 'kavita.mehta@village.in',        role: 'Community',           village: 'Porbandar',     district: 'Porbandar',       status: 'Inactive',  lastActive: '2024-12-20', createdAt: '2024-07-01', isDemo: true, phone: '+91 98250 11006' },
  { id: 'U007', name: 'Bhavesh Joshi',    email: 'bhavesh.joshi@khet.in',          role: 'Farmer',              village: 'Surendranagar', district: 'Surendranagar',   status: 'Active',    lastActive: '2025-01-11', createdAt: '2024-08-05', isDemo: true, phone: '+91 98250 11007', land_area_ha: 6.0, primary_crops: 'Groundnut, Wheat' },
  { id: 'U008', name: 'Neha Yadav',       email: 'neha.yadav@community.in',        role: 'Community',           village: 'Morbi',         district: 'Morbi',           status: 'Active',    lastActive: '2025-01-09', createdAt: '2024-09-10', isDemo: true, phone: '+91 98250 11008' },
  { id: 'U009', name: 'Dinesh Rathod',    email: 'dinesh.rathod@khet.in',          role: 'Farmer',              village: 'Gir Somnath',   district: 'Gir Somnath',     status: 'Suspended', lastActive: '2024-11-30', createdAt: '2024-10-01', isDemo: true, phone: '+91 98250 11009', land_area_ha: 3.2, primary_crops: 'Wheat, Cumin' },
  { id: 'U010', name: 'Ankita Singh',     email: 'ankita.singh@eval.org',          role: 'Evaluator',           village: 'Devbhumi Dwarka', district: 'Devbhumi Dwarka', status: 'Active',  lastActive: '2025-01-08', createdAt: '2024-11-01', isDemo: true, phone: '+91 98250 11010' },
  { id: 'U011', name: 'Raj Solanki',      email: 'raj.solanki@jalrakshak.gov',     role: 'Water Administrator', village: 'Ahmedabad',     district: 'Ahmedabad',       status: 'Active',    lastActive: '2025-01-15', createdAt: '2024-02-01', isDemo: true, phone: '+91 98250 11011' },
  { id: 'U012', name: 'Geeta Prajapati',  email: 'geeta.prajapati@village.in',     role: 'Community',           village: 'Gandhinagar',   district: 'Gandhinagar',     status: 'Inactive',  lastActive: '2024-10-05', createdAt: '2024-12-01', isDemo: true, phone: '+91 98250 11012' },
];

// ─── Roles config ─────────────────────────────────────────────────────────────
const ROLES: Role[] = ['Water Administrator', 'Community', 'Farmer', 'Evaluator'];

const ROLE_META: Record<Role, { color: string; bg: string; icon: React.ReactNode; description: string; permissions: string[] }> = {
  'Water Administrator': {
    color: '#3b82f6', bg: 'rgba(59,130,246,0.12)',
    icon: <Crown size={13} />,
    description: 'Full platform access. Manages villages, users, AI settings, approvals and all data.',
    permissions: ['View all dashboards', 'Manage villages & users', 'Configure AI & watsonx', 'Approve field reports', 'Export all data', 'Manage roles & permissions', 'Access AI Reports', 'View Agent Trace'],
  },
  'Community': {
    color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)',
    icon: <Users2 size={13} />,
    description: 'Village-level data management. Can submit field reports, manage village actions.',
    permissions: ['View dashboards (own village)', 'Submit field reports', 'Manage village action plans', 'View community priorities', 'Access Water Copilot', 'View intervention impact'],
  },
  'Farmer': {
    color: '#22c55e', bg: 'rgba(34,197,94,0.12)',
    icon: <Leaf size={13} />,
    description: 'Advisory access. Sees crop recommendations, groundwater data and drought alerts.',
    permissions: ['View water dashboard', 'Crop advisor & recommendations', 'Groundwater depth data', 'Drought risk alerts', 'Recharge planner (read)', 'Water budget (own village)'],
  },
  'Evaluator': {
    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',
    icon: <ClipboardList size={13} />,
    description: 'Read-only / demo access for NGOs, auditors and assessors.',
    permissions: ['View all dashboards (read-only)', 'Export reports', 'View AI analysis', 'Access demo data', 'Community priority (read)', 'No data modification'],
  },
};

const DISTRICTS = [
  'Ahmedabad','Amreli','Anand','Bhavnagar','Botad','Devbhumi Dwarka',
  'Gandhinagar','Gir Somnath','Jamnagar','Junagadh','Kutch','Morbi',
  'Porbandar','Rajkot','Surendranagar','Vadodara',
];

// ─── Helpers ─────────────────────────────────────────────────────────────────
function statusColor(s: UserStatus) {
  if (s === 'Active')    return '#22c55e';
  if (s === 'Inactive')  return '#64748b';
  if (s === 'Suspended') return '#ef4444';
  return '#64748b';
}
function statusBg(s: UserStatus) { return statusColor(s) + '18'; }

function fmtDate(iso: string) {
  try { return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }); }
  catch { return iso; }
}

function daysAgo(iso: string) {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 30)  return `${diff}d ago`;
  if (diff < 365) return `${Math.floor(diff / 30)}mo ago`;
  return `${Math.floor(diff / 365)}y ago`;
}

function genId(users: UserRecord[]) {
  const nums = users.map(u => parseInt(u.id.replace('U', ''), 10)).filter(n => !isNaN(n));
  const next = nums.length ? Math.max(...nums) + 1 : 1;
  return `U${String(next).padStart(3, '0')}`;
}

// ─── Persist helpers ──────────────────────────────────────────────────────────
function loadUsers(): UserRecord[] {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw) as UserRecord[];
  } catch { /**/ }
  return SEED_USERS;
}
function saveUsers(users: UserRecord[]) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(users)); } catch { /**/ }
}

// ─── Shared style primitives ──────────────────────────────────────────────────
const cardS: React.CSSProperties = {
  background: 'var(--bg-card)', border: '1px solid var(--border-glass)',
  borderRadius: 12, padding: '16px 20px',
};

function inputStyle(err = false): React.CSSProperties {
  return {
    width: '100%', padding: '9px 12px', borderRadius: 8, fontFamily: 'inherit',
    fontSize: '0.88rem', outline: 'none', boxSizing: 'border-box',
    background: 'var(--bg-dark)', color: 'var(--text-main)',
    border: `1px solid ${err ? '#ef4444' : 'var(--border-glass)'}`,
    transition: 'border-color 0.2s',
  };
}
function labelS(): React.CSSProperties {
  return { display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: 5 };
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: Role }) {
  const m = ROLE_META[role] || ROLE_META['Farmer'];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 800, color: m.color, background: m.bg, border: `1px solid ${m.color}33`, whiteSpace: 'nowrap' }}>
      {m.icon}{role}
    </span>
  );
}

function StatusBadge({ status }: { status: UserStatus }) {
  const c = statusColor(status);
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 20, fontSize: '0.68rem', fontWeight: 800, color: c, background: statusBg(status), border: `1px solid ${c}33`, whiteSpace: 'nowrap' }}>
      {status === 'Active' ? <UserCheck size={10} /> : status === 'Suspended' ? <UserX size={10} /> : <ShieldOff size={10} />}
      {status}
    </span>
  );
}

function FilterSel({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 700, whiteSpace: 'nowrap' }}>{label}:</span>
      <select value={value} onChange={e => onChange(e.target.value)}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border-glass)', color: 'var(--text-main)', borderRadius: 7, padding: '5px 8px', fontSize: '0.78rem', outline: 'none', fontFamily: 'inherit', cursor: 'pointer' }}>
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  );
}

// ─── Modal Overlay wrapper ────────────────────────────────────────────────────
function ModalBackdrop({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(3px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}
    >
      <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxHeight: '92vh', overflowY: 'auto' }}>
        {children}
      </div>
    </div>
  );
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export default function Users() {
  const [users, setUsers]       = useState<UserRecord[]>([]);
  const [search, setSearch]     = useState('');
  const [fRole, setFRole]       = useState('ALL');
  const [fStatus, setFStatus]   = useState('ALL');
  const [fDistrict, setFDistrict] = useState('ALL');
  const [showAdd, setShowAdd]   = useState(false);
  const [viewUser, setViewUser] = useState<UserRecord | null>(null);
  const [editUser, setEditUser] = useState<UserRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRecord | null>(null);
  const [actionMenu, setActionMenu] = useState<string | null>(null);
  const [showRoles, setShowRoles] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  // Add/edit form
  const BLANK = {
    name: '',
    email: '',
    role: 'Farmer' as Role,
    village: '',
    district: 'Amreli',
    status: 'Active' as UserStatus,
    phone: '',
    notes: '',
    land_area_ha: 3.5,
    primary_crops: 'Cotton, Groundnut',
  };
  const [form, setForm] = useState({ ...BLANK });
  const [formErrs, setFormErrs] = useState<Record<string, string>>({});

  // ── Sync with backend API ─────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setIsSyncing(true);
    const token = sessionStorage.getItem('jalrakshak_admin_token');
    try {
      const res = await fetch(`${_API_BASE}/admin/users`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        if (data && Array.isArray(data.users)) {
          const mapped: UserRecord[] = data.users.map((u: any) => ({
            id: u.id,
            name: u.name,
            email: u.email || '',
            phone: u.phone || '',
            role: u.role as Role,
            village: u.village || '',
            district: u.district || '',
            status: u.status as UserStatus,
            lastActive: u.last_active ? u.last_active.slice(0, 10) : new Date().toISOString().slice(0, 10),
            createdAt: u.created_at ? u.created_at.slice(0, 10) : new Date().toISOString().slice(0, 10),
            isDemo: Boolean(u.is_demo),
            notes: u.notes || '',
            land_area_ha: Number(u.land_area_ha || 0),
            primary_crops: u.primary_crops || '',
          }));
          setUsers(mapped);
          saveUsers(mapped);
          setIsSyncing(false);
          return;
        }
      }
    } catch {
      // offline
    }
    setUsers(loadUsers());
    setIsSyncing(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Persist whenever users change
  useEffect(() => {
    if (users.length) saveUsers(users);
  }, [users]);

  // Dismiss action menu on outside click
  useEffect(() => {
    if (!actionMenu) return;
    const h = () => setActionMenu(null);
    window.addEventListener('click', h);
    return () => window.removeEventListener('click', h);
  }, [actionMenu]);

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const farmers = users.filter(u => u.role === 'Farmer');
    const totalLand = farmers.reduce((sum, f) => sum + (f.land_area_ha || 0), 0);
    return {
      total:     users.length,
      active:    users.filter(u => u.status === 'Active').length,
      farmers:   farmers.length,
      totalLand: totalLand.toFixed(1),
      community: users.filter(u => u.role === 'Community').length,
      admins:    users.filter(u => u.role === 'Water Administrator').length,
    };
  }, [users]);

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return users.filter(u => {
      if (fRole !== 'ALL' && u.role !== fRole) return false;
      if (fStatus !== 'ALL' && u.status !== fStatus) return false;
      if (fDistrict !== 'ALL' && u.district !== fDistrict) return false;
      if (q && !u.name.toLowerCase().includes(q) && !u.email.toLowerCase().includes(q) && !u.village.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [users, search, fRole, fStatus, fDistrict]);

  const districtOptions: [string, string][] = useMemo(() => {
    const d = [...new Set(users.map(u => u.district))].sort();
    return [['ALL', 'All Districts'], ...d.map(x => [x, x] as [string, string])];
  }, [users]);

  // ── Form validation ───────────────────────────────────────────────────────
  function validateForm(f: typeof form) {
    const e: Record<string, string> = {};
    if (!f.name.trim())  e.name  = 'Name is required';
    if (!f.email.trim() && !f.phone.trim()) e.email = 'Email or phone number is required';
    if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Invalid email address';
    if (!f.village.trim()) e.village = 'Village/location is required';
    if (!f.district)    e.district = 'District is required';
    return e;
  }

  // ── Add user ──────────────────────────────────────────────────────────────
  async function handleAdd() {
    const errs = validateForm(form);
    if (Object.keys(errs).length) { setFormErrs(errs); return; }
    const now = new Date().toISOString().slice(0, 10);
    const tempId = genId(users);
    const nu: UserRecord = {
      id: tempId,
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      village: form.village.trim(),
      district: form.district,
      status: form.status,
      lastActive: now,
      createdAt: now,
      isDemo: false,
      phone: form.phone.trim() || undefined,
      notes: form.notes.trim() || undefined,
      land_area_ha: Number(form.land_area_ha) || 0,
      primary_crops: form.primary_crops || '',
    };

    const token = sessionStorage.getItem('jalrakshak_admin_token');
    try {
      const res = await fetch(`${_API_BASE}/admin/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          role: form.role,
          village: form.village.trim(),
          district: form.district,
          land_area_ha: Number(form.land_area_ha) || 0,
          primary_crops: form.primary_crops || '',
          status: form.status,
          notes: form.notes.trim() || undefined,
        }),
      });
      if (res.ok) {
        const created = await res.json();
        nu.id = created.id;
      }
    } catch {
      // offline fallback
    }

    setUsers(prev => [nu, ...prev]);
    setShowAdd(false);
    setForm({ ...BLANK });
    setFormErrs({});
  }

  // ── Edit user ─────────────────────────────────────────────────────────────
  function openEdit(u: UserRecord) {
    setForm({
      name: u.name,
      email: u.email,
      role: u.role,
      village: u.village,
      district: u.district,
      status: u.status,
      phone: u.phone ?? '',
      notes: u.notes ?? '',
      land_area_ha: u.land_area_ha || 3.5,
      primary_crops: u.primary_crops || 'Cotton, Groundnut',
    });
    setFormErrs({});
    setEditUser(u);
  }

  async function handleEditSave() {
    if (!editUser) return;
    const errs = validateForm(form);
    if (Object.keys(errs).length) { setFormErrs(errs); return; }

    const token = sessionStorage.getItem('jalrakshak_admin_token');
    try {
      await fetch(`${_API_BASE}/admin/users/${editUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim() || undefined,
          phone: form.phone.trim() || undefined,
          role: form.role,
          village: form.village.trim(),
          district: form.district,
          land_area_ha: Number(form.land_area_ha) || 0,
          primary_crops: form.primary_crops || '',
          status: form.status,
          notes: form.notes.trim() || undefined,
        }),
      });
    } catch {
      // offline fallback
    }

    setUsers(prev => prev.map(u => u.id === editUser.id
      ? {
          ...u,
          name: form.name.trim(),
          email: form.email.trim(),
          role: form.role,
          village: form.village.trim(),
          district: form.district,
          status: form.status,
          phone: form.phone.trim() || undefined,
          notes: form.notes.trim() || undefined,
          land_area_ha: Number(form.land_area_ha) || 0,
          primary_crops: form.primary_crops || '',
        }
      : u));
    setEditUser(null);
    setForm({ ...BLANK });
    setFormErrs({});
  }

  // ── Toggle status ─────────────────────────────────────────────────────────
  async function toggleStatus(u: UserRecord, forcedStatus?: UserStatus) {
    const next: UserStatus = forcedStatus || (u.status === 'Active' ? 'Suspended' : 'Active');
    const token = sessionStorage.getItem('jalrakshak_admin_token');
    try {
      await fetch(`${_API_BASE}/admin/users/${u.id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ status: next }),
      });
    } catch {
      // offline fallback
    }
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, status: next } : x));
  }

  // ── Change role ───────────────────────────────────────────────────────────
  function cycleRole(u: UserRecord) {
    const idx = ROLES.indexOf(u.role);
    const next = ROLES[(idx + 1) % ROLES.length];
    setUsers(prev => prev.map(x => x.id === u.id ? { ...x, role: next } : x));
  }

  // ── Delete ────────────────────────────────────────────────────────────────
  async function handleDelete() {
    if (!deleteTarget) return;
    const token = sessionStorage.getItem('jalrakshak_admin_token');
    try {
      await fetch(`${_API_BASE}/admin/users/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
    } catch {
      // offline fallback
    }
    setUsers(prev => prev.filter(u => u.id !== deleteTarget.id));
    setDeleteTarget(null);
    if (viewUser?.id === deleteTarget.id) setViewUser(null);
  }

  // ── User form (shared for add & edit) ─────────────────────────────────────
  function UserForm({ title, subtitle, iconColor, onSave, onCancel }: { title: string; subtitle: string; iconColor: string; onSave: () => void; onCancel: () => void }) {
    const isFarmer = form.role === 'Farmer';

    return (
      <div style={{ width: '100%', maxWidth: 580, background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', overflow: 'hidden', animation: 'fadeInModal 0.22s ease-out', margin: '0 auto' }}>
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border-glass)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: `${iconColor}18`, border: `1px solid ${iconColor}44`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={16} color={iconColor} />
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '0.96rem' }}>{title}</div>
              <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>{subtitle}</div>
            </div>
          </div>
          <button onClick={onCancel} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}><X size={18} /></button>
        </div>
        {/* body */}
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Name */}
          <div>
            <label style={labelS()}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
            <input style={inputStyle(!!formErrs.name)} value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Kishore Patel" />
            {formErrs.name && <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{formErrs.name}</div>}
          </div>

          {/* Email & Phone row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelS()}>Email Address</label>
              <input type="email" style={inputStyle(!!formErrs.email)} value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="e.g. kishore@khet.in" />
              {formErrs.email && <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{formErrs.email}</div>}
            </div>
            <div>
              <label style={labelS()}>Phone Number</label>
              <input style={inputStyle()} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98250 12345" />
            </div>
          </div>

          {/* Role + Status row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelS()}>Role <span style={{ color: '#ef4444' }}>*</span></label>
              <select style={inputStyle()} value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value as Role }))}>
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={labelS()}>Account Status</label>
              <select style={inputStyle()} value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value as UserStatus }))}>
                <option value="Active">Active (Approved)</option>
                <option value="Inactive">Inactive</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Village + District row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <div>
              <label style={labelS()}>Village / Location <span style={{ color: '#ef4444' }}>*</span></label>
              <input style={inputStyle(!!formErrs.village)} value={form.village} onChange={e => setForm(f => ({ ...f, village: e.target.value }))} placeholder="e.g. Amreli" />
              {formErrs.village && <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{formErrs.village}</div>}
            </div>
            <div>
              <label style={labelS()}>District <span style={{ color: '#ef4444' }}>*</span></label>
              <select style={inputStyle(!!formErrs.district)} value={form.district} onChange={e => setForm(f => ({ ...f, district: e.target.value }))}>
                <option value="">Select district…</option>
                {DISTRICTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              {formErrs.district && <div style={{ fontSize: '0.72rem', color: '#ef4444', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}><AlertCircle size={11} />{formErrs.district}</div>}
            </div>
          </div>

          {/* Farmer-Specific Fields */}
          {isFarmer && (
            <div style={{
              background: 'rgba(34, 197, 94, 0.08)',
              border: '1px solid rgba(34, 197, 94, 0.25)',
              borderRadius: 10,
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Sprout size={14} /> Farm &amp; Crop Details
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 12 }}>
                <div>
                  <label style={labelS()}>Land Area (Ha)</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    style={inputStyle()}
                    value={form.land_area_ha}
                    onChange={e => setForm(f => ({ ...f, land_area_ha: parseFloat(e.target.value) || 0 }))}
                    placeholder="4.5"
                  />
                </div>
                <div>
                  <label style={labelS()}>Primary Crops</label>
                  <input
                    type="text"
                    style={inputStyle()}
                    value={form.primary_crops}
                    onChange={e => setForm(f => ({ ...f, primary_crops: e.target.value }))}
                    placeholder="e.g. Cotton, Groundnut, Wheat"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label style={labelS()}>Notes (optional)</label>
            <textarea rows={2} style={{ ...inputStyle(), resize: 'vertical' }} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Any additional notes…" />
          </div>
        </div>

        {/* footer */}
        <div style={{ display: 'flex', gap: 8, padding: '14px 22px', borderTop: '1px solid var(--border-glass)', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={{ padding: '9px 18px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.86rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
          <button onClick={onSave} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 20px', borderRadius: 8, border: 'none', background: iconColor, color: '#fff', fontSize: '0.86rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
            <CheckCircle2 size={14} /> Save
          </button>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div style={{ color: 'var(--text-main)', animation: 'fadeInUp 0.4s ease-out' }}>

      {/* ══ MODALS ══════════════════════════════════════════════════════════ */}

      {/* Add User */}
      {showAdd && (
        <ModalBackdrop onClose={() => { setShowAdd(false); setForm({ ...BLANK }); setFormErrs({}); }}>
          <UserForm
            title="Add New Platform User / Farmer" subtitle="Assign permissions, farm details, and credentials." iconColor="#22c55e"
            onSave={handleAdd}
            onCancel={() => { setShowAdd(false); setForm({ ...BLANK }); setFormErrs({}); }}
          />
        </ModalBackdrop>
      )}

      {/* Edit User */}
      {editUser && (
        <ModalBackdrop onClose={() => { setEditUser(null); setForm({ ...BLANK }); setFormErrs({}); }}>
          <UserForm
            title="Edit User Profile" subtitle={`Editing ID: ${editUser.id}`} iconColor="#3b82f6"
            onSave={handleEditSave}
            onCancel={() => { setEditUser(null); setForm({ ...BLANK }); setFormErrs({}); }}
          />
        </ModalBackdrop>
      )}

      {/* Delete Confirm */}
      {deleteTarget && (
        <ModalBackdrop onClose={() => setDeleteTarget(null)}>
          <div style={{ width: '100%', maxWidth: 380, background: 'var(--bg-card)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', overflow: 'hidden', animation: 'fadeInModal 0.22s ease-out', margin: '0 auto' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '28px 24px 20px', gap: 12, textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Trash2 size={20} color="#ef4444" />
              </div>
              <div style={{ fontWeight: 800, fontSize: '1.05rem' }}>Remove User</div>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                Permanently remove <strong style={{ color: 'var(--text-main)' }}>"{deleteTarget.name}"</strong> ({deleteTarget.role}) from the platform?
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, padding: '0 24px 20px' }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '10px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit' }}>Cancel</button>
              <button onClick={handleDelete} style={{ flex: 1, padding: '10px', borderRadius: 8, border: 'none', background: '#ef4444', color: '#fff', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit' }}>Remove</button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* View User Details */}
      {viewUser && (
        <ModalBackdrop onClose={() => setViewUser(null)}>
          <div style={{ width: '100%', maxWidth: 580, background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 16, boxShadow: '0 24px 80px rgba(0,0,0,0.6)', overflow: 'hidden', animation: 'fadeInModal 0.22s ease-out', margin: '0 auto' }}>
            {/* header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '18px 22px', borderBottom: '1px solid var(--border-glass)', background: 'var(--bg-card-hover)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: ROLE_META[viewUser.role]?.bg || 'rgba(34,197,94,0.12)', border: `1px solid ${ROLE_META[viewUser.role]?.color || '#22c55e'}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', fontWeight: 800, color: ROLE_META[viewUser.role]?.color || '#22c55e' }}>
                  {viewUser.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {viewUser.name}
                    {viewUser.isDemo && <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.12)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 4, padding: '1px 6px' }}>Demo Data</span>}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 1 }}>{viewUser.email || viewUser.phone || 'No direct contact'}</div>
                </div>
              </div>
              <button onClick={() => setViewUser(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}><X size={18} /></button>
            </div>

            <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Profile info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  ['User ID', viewUser.id],
                  ['Role', null],
                  ['Status', null],
                  ['Village', viewUser.village],
                  ['District', viewUser.district],
                  ['Phone', viewUser.phone ?? '—'],
                  ['Last Active', fmtDate(viewUser.lastActive)],
                  ['Member Since', fmtDate(viewUser.createdAt)],
                ].map(([k, v]) => (
                  <div key={k as string} style={{ background: 'var(--bg-card-hover)', border: '1px solid var(--border-glass)', borderRadius: 8, padding: '10px 14px' }}>
                    <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 5 }}>{k}</div>
                    {k === 'Role'   ? <RoleBadge role={viewUser.role} /> :
                     k === 'Status' ? <StatusBadge status={viewUser.status} /> :
                     <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)' }}>{v}</span>}
                  </div>
                ))}
              </div>

              {/* Farmer details if Farmer */}
              {viewUser.role === 'Farmer' && (
                <div style={{ background: 'rgba(34, 197, 94, 0.08)', border: '1px solid rgba(34, 197, 94, 0.25)', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#22c55e', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Sprout size={13} /> Farm Characteristics
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 10, fontSize: '0.82rem' }}>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Land Area: </span>
                      <strong>{viewUser.land_area_ha || 0} Hectares</strong>
                    </div>
                    <div>
                      <span style={{ color: 'var(--text-muted)' }}>Primary Crops: </span>
                      <strong>{viewUser.primary_crops || 'Not specified'}</strong>
                    </div>
                  </div>
                </div>
              )}

              {/* Notes */}
              {viewUser.notes && (
                <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.18)', borderRadius: 8, padding: '12px 14px' }}>
                  <div style={{ fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 6 }}>Notes</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>{viewUser.notes}</div>
                </div>
              )}
            </div>

            {/* footer */}
            <div style={{ padding: '14px 22px', borderTop: '1px solid var(--border-glass)', display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button onClick={() => { setViewUser(null); openEdit(viewUser); }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                <Pencil size={13} /> Edit
              </button>
              {viewUser.status === 'Active' ? (
                <button onClick={() => { toggleStatus(viewUser, 'Suspended'); setViewUser(prev => prev ? { ...prev, status: 'Suspended' } : null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: 'rgba(239,68,68,0.15)', color: '#ef4444', fontSize: '0.83rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <Ban size={13} /> Suspend Account
                </button>
              ) : (
                <button onClick={() => { toggleStatus(viewUser, 'Active'); setViewUser(prev => prev ? { ...prev, status: 'Active' } : null); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, border: 'none', background: 'rgba(34,197,94,0.15)', color: '#22c55e', fontSize: '0.83rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                  <UserCheck size={13} /> Activate / Approve
                </button>
              )}
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* ══ PAGE HEADER ════════════════════════════════════════════════════ */}
      <div style={{ ...cardS, marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'rgba(59,130,246,0.12)', border: '1px solid rgba(59,130,246,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <UsersIcon size={20} color="#3b82f6" />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 800 }}>Farmers &amp; Platform Users</h1>
            <p style={{ margin: '3px 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Comprehensive administration of registered farmers, farm acreage, and platform roles.
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            onClick={fetchUsers}
            disabled={isSyncing}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}
          >
            <RefreshCw size={14} className={isSyncing ? 'spin' : ''} /> {isSyncing ? 'Syncing…' : 'Sync DB'}
          </button>
          <button onClick={() => setShowRoles(r => !r)}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 14px', borderRadius: 8, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.83rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <ShieldCheck size={14} /> Roles &amp; Permissions
          </button>
          <button onClick={() => { setForm({ ...BLANK }); setFormErrs({}); setShowAdd(true); }}
            style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 16px', fontWeight: 700, fontSize: '0.88rem', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0 }}>
            <UserPlus size={15} /> Add Farmer / User
          </button>
        </div>
      </div>

      {/* ══ KPI CARDS ════════════════════════════════════════════════════ */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 12, marginBottom: 18 }}>
        {([
          { label: 'Registered Farmers', val: kpis.farmers,   color: '#22c55e', icon: <Sprout size={16} /> },
          { label: 'Farm Land Covered',  val: `${kpis.totalLand} Ha`, color: '#34d399', icon: <Trees size={16} /> },
          { label: 'Active Platform Users', val: kpis.active,  color: '#3b82f6', icon: <UserCheck size={16} /> },
          { label: 'Water Administrators', val: kpis.admins,   color: '#60a5fa', icon: <Crown size={16} /> },
          { label: 'Community Users',    val: kpis.community, color: '#8b5cf6', icon: <Users2 size={16} /> },
        ] as const).map(k => (
          <div key={k.label} style={{ ...cardS, borderLeft: `3px solid ${k.color}`, padding: '14px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: '0.71rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k.label}</span>
              <span style={{ color: k.color }}>{k.icon}</span>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.val}</div>
          </div>
        ))}
      </div>

      {/* Quick Filter Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
        {[
          { label: 'All Users', key: 'ALL' },
          { label: `🌾 Farmers Only (${kpis.farmers})`, key: 'Farmer' },
          { label: '💧 Water Administrators', key: 'Water Administrator' },
          { label: '👥 Community Users', key: 'Community' },
        ].map(tab => {
          const isActive = fRole === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFRole(tab.key)}
              style={{
                background: isActive ? '#3b82f6' : 'var(--bg-card)',
                color: isActive ? '#fff' : 'var(--text-muted)',
                border: `1px solid ${isActive ? '#3b82f6' : 'var(--border-glass)'}`,
                padding: '6px 14px',
                borderRadius: 8,
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ══ ROLES & PERMISSIONS SECTION (collapsible) ════════════════════ */}
      {showRoles && (
        <div style={{ ...cardS, marginBottom: 18, padding: 0, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 20px', borderBottom: '1px solid var(--border-glass)', background: 'var(--bg-card-hover)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontWeight: 800, fontSize: '0.88rem' }}>
              <ShieldCheck size={15} color="#3b82f6" /> Roles &amp; Permissions
            </div>
            <button onClick={() => setShowRoles(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', padding: 4 }}><X size={16} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 0 }}>
            {ROLES.map((role, i) => {
              const m = ROLE_META[role];
              return (
                <div key={role} style={{ padding: '16px 20px', borderRight: i < 3 ? '1px solid var(--border-glass)' : 'none', borderBottom: '1px solid var(--border-glass)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: m.bg, border: `1px solid ${m.color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: m.color, flexShrink: 0 }}>
                      {m.icon}
                    </div>
                    <span style={{ fontWeight: 800, fontSize: '0.85rem', color: m.color }}>{role}</span>
                  </div>
                  <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', lineHeight: 1.55, marginBottom: 10 }}>{m.description}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {m.permissions.map(p => (
                      <div key={p} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        <CheckCircle2 size={10} color={m.color} />{p}
                      </div>
                    ))}
                  </div>
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Database size={10} color="var(--text-muted)" />
                    <span style={{ fontSize: '0.67rem', color: 'var(--text-muted)' }}>{users.filter(u => u.role === role).length} user{users.filter(u => u.role === role).length !== 1 ? 's' : ''} assigned</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ FILTERS ══════════════════════════════════════════════════════ */}
      <div style={{ ...cardS, marginBottom: 14, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, background: 'var(--bg-dark)', border: '1px solid var(--border-glass)', borderRadius: 8, padding: '6px 11px', flex: '1 1 180px', minWidth: 160 }}>
          <Search size={14} color="var(--text-muted)" />
          <input type="text" placeholder="Search by name, email or village…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.83rem', width: '100%', outline: 'none', fontFamily: 'inherit' }} />
        </div>
        <FilterSel label="Role"     value={fRole}     onChange={setFRole}
          options={[['ALL', 'All Roles'], ...ROLES.map(r => [r, r] as [string, string])]} />
        <FilterSel label="Status"   value={fStatus}   onChange={setFStatus}
          options={[['ALL', 'All Status'], ['Active', 'Active'], ['Inactive', 'Inactive'], ['Suspended', 'Suspended']]} />
        <FilterSel label="District" value={fDistrict} onChange={setFDistrict} options={districtOptions} />
        {(search || fRole !== 'ALL' || fStatus !== 'ALL' || fDistrict !== 'ALL') && (
          <button onClick={() => { setSearch(''); setFRole('ALL'); setFStatus('ALL'); setFDistrict('ALL'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 10px', borderRadius: 7, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
            <RefreshCw size={11} /> Clear
          </button>
        )}
        <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
          {filtered.length} of {users.length} records
        </span>
      </div>

      {/* ══ USERS TABLE ══════════════════════════════════════════════════ */}
      <div style={{ ...cardS, padding: 0, overflow: 'hidden', marginBottom: 24 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', minWidth: 960 }}>
            <thead>
              <tr style={{ background: 'var(--bg-card-hover)', borderBottom: '1px solid var(--border-glass)' }}>
                {['Name', 'Contact', 'Role', 'Village / District', 'Land & Crops', 'Status', 'Last Active', 'Actions'].map((h, i) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: i >= 7 ? 'center' : 'left', color: 'var(--text-muted)', fontWeight: 700, fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>No users match the current filters.</td></tr>
              )}
              {filtered.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--border-glass)', background: i % 2 === 0 ? 'transparent' : 'var(--bg-card-hover)', transition: 'background 0.15s' }}>

                  {/* Name */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                      <div style={{ width: 32, height: 32, borderRadius: '50%', background: ROLE_META[u.role]?.bg || 'rgba(34,197,94,0.12)', border: `1px solid ${ROLE_META[u.role]?.color || '#22c55e'}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.78rem', fontWeight: 800, color: ROLE_META[u.role]?.color || '#22c55e', flexShrink: 0 }}>
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 5 }}>
                          {u.name}
                          {u.isDemo && <span style={{ fontSize: '0.58rem', fontWeight: 800, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 3, padding: '1px 4px' }}>Demo</span>}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{u.id}</div>
                      </div>
                    </div>
                  </td>

                  {/* Contact */}
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                    <div>{u.email || '—'}</div>
                    {u.phone && <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>{u.phone}</div>}
                  </td>

                  {/* Role */}
                  <td style={{ padding: '12px 16px' }}><RoleBadge role={u.role} /></td>

                  {/* Village / District */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ fontWeight: 600 }}>{u.village}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{u.district}</div>
                  </td>

                  {/* Land & Crops */}
                  <td style={{ padding: '12px 16px' }}>
                    {u.role === 'Farmer' ? (
                      <div>
                        <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#22c55e' }}>
                          {u.land_area_ha ? `${u.land_area_ha} Ha` : '—'}
                        </span>
                        {u.primary_crops && (
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {u.primary_crops}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem' }}>—</span>
                    )}
                  </td>

                  {/* Status */}
                  <td style={{ padding: '12px 16px' }}><StatusBadge status={u.status} /></td>

                  {/* Last Active */}
                  <td style={{ padding: '12px 16px', color: 'var(--text-muted)', fontSize: '0.78rem', whiteSpace: 'nowrap' }}>
                    <div>{daysAgo(u.lastActive)}</div>
                    <div style={{ fontSize: '0.68rem' }}>{fmtDate(u.lastActive)}</div>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      {/* View */}
                      <button title="View details" onClick={() => setViewUser(u)}
                        style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Eye size={13} />
                      </button>
                      {/* Edit */}
                      <button title="Edit user" onClick={() => openEdit(u)}
                        style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border-glass)', background: 'transparent', color: '#3b82f6', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Pencil size={13} />
                      </button>
                      {/* More */}
                      <div style={{ position: 'relative' }}>
                        <button title="More actions" onClick={e => { e.stopPropagation(); setActionMenu(actionMenu === u.id ? null : u.id); }}
                          style={{ width: 30, height: 30, borderRadius: 6, border: '1px solid var(--border-glass)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <MoreVertical size={13} />
                        </button>
                        {actionMenu === u.id && (
                          <div onClick={e => e.stopPropagation()} style={{ position: 'absolute', right: 0, top: 34, zIndex: 500, background: 'var(--bg-card)', border: '1px solid var(--border-glass)', borderRadius: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.35)', minWidth: 180, overflow: 'hidden', animation: 'fadeInModal 0.15s ease-out' }}>
                            {[
                              { label: 'Change Role', icon: <ShieldCheck size={13} />, color: '#3b82f6', action: () => { cycleRole(u); setActionMenu(null); } },
                              {
                                label: u.status === 'Active' ? 'Suspend Account' : 'Activate Account',
                                icon: u.status === 'Active' ? <Ban size={13} /> : <UserCheck size={13} />,
                                color: u.status === 'Active' ? '#ef4444' : '#22c55e',
                                action: () => { toggleStatus(u); setActionMenu(null); }
                              },
                              { label: 'Delete', icon: <Trash2 size={13} />, color: '#ef4444', action: () => { setDeleteTarget(u); setActionMenu(null); } },
                            ].map(item => (
                              <button key={item.label} onClick={item.action}
                                style={{ width: '100%', padding: '9px 14px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', fontWeight: 600, color: item.color, fontFamily: 'inherit', textAlign: 'left' }}>
                                {item.icon}{item.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Table footer */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border-glass)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 5 }}>
            <Database size={11} />
            Data synchronized with backend SQL database.
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            Showing {filtered.length} record{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeInModal { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: scale(1); } }
        @keyframes fadeInUp    { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
