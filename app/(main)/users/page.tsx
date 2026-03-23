'use client';
import { useState, useEffect } from 'react';
import { UserCog, Plus, Pencil, Trash2, X, Eye, EyeOff } from 'lucide-react';
import SkeletonRow from '@/components/SkeletonRow';
import { useRouter } from 'next/navigation';

interface User {
  _id: string; username: string; email: string;
  full_name?: string; role?: string; status?: string; createdAt?: string;
}

const inputCls = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4F6BED]/20 focus:border-[#4F6BED] transition-colors';
const labelCls = 'block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5';

const blankForm = { username: '', email: '', password: '', full_name: '', role: 'user', status: 'active' };

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentRole, setCurrentRole] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [form, setForm] = useState(blankForm);
  const [showPwd, setShowPwd] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/auth/me')
      .then(r => r.json())
      .then(d => {
        const role = d.user?.role || d.role;
        if (role !== 'admin') { router.replace('/dashboard'); return; }
        setCurrentRole(role);
        loadUsers();
      })
      .catch(() => router.replace('/dashboard'));
  }, []);

  const loadUsers = () => {
    setLoading(true);
    fetch('/api/users')
      .then(r => r.json())
      .then(data => { setUsers(Array.isArray(data) ? data : []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const openCreate = () => { setEditingUser(null); setForm(blankForm); setError(''); setShowForm(true); };
  const openEdit = (u: User) => {
    setEditingUser(u);
    setForm({ username: u.username, email: u.email, password: '', full_name: u.full_name || '', role: u.role || 'user', status: u.status || 'active' });
    setError(''); setShowPwd(false); setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError('');
    try {
      if (editingUser) {
        const body: Record<string, string> = { role: form.role, status: form.status, username: form.username };
        const res = await fetch(`/api/users/${editingUser._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed'); setSaving(false); return; }
      } else {
        if (!form.password) { setError('Password is required'); setSaving(false); return; }
        const res = await fetch('/api/users', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        if (!res.ok) { const d = await res.json(); setError(d.error || 'Failed'); setSaving(false); return; }
      }
      setShowForm(false); loadUsers();
    } catch { setError('Something went wrong'); }
    setSaving(false);
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`Delete user "${u.username}"? This cannot be undone.`)) return;
    await fetch(`/api/users/${u._id}`, { method: 'DELETE' });
    loadUsers();
  };

  const toggleStatus = async (u: User) => {
    const newStatus = u.status === 'active' ? 'inactive' : 'active';
    await fetch(`/api/users/${u._id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus }) });
    loadUsers();
  };

  const statusBadge = (status?: string) => {
    if (!status || status === 'active') return { bg: '#ECFDF5', color: '#059669', label: 'Active' };
    return { bg: '#FEF2F2', color: '#DC2626', label: 'Inactive' };
  };

  const roleBadge = (role?: string) => {
    if (role === 'admin') return { bg: '#EEF2FF', color: '#4F6BED', label: 'Admin' };
    return { bg: '#F0FDFA', color: '#0D9488', label: 'User' };
  };

  if (currentRole !== 'admin' && !loading) return null;

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1F2937]">User Management</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">{users.length} user{users.length !== 1 ? 's' : ''} in system</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-colors"
          style={{ background: '#4F6BED' }}
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide w-12">S.No</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">User</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Email</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Full Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Role</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <SkeletonRow cols={7} />
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center">
                    <UserCog size={36} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-[#6B7280] text-sm font-medium">No users found</p>
                  </td>
                </tr>
              ) : users.map((user, idx) => {
                const role = roleBadge(user.role);
                const status = statusBadge(user.status);
                return (
                  <tr key={user._id} className="hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-4 py-3.5 text-sm text-[#9CA3AF]">{idx + 1}</td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-[#EEF2FF] flex items-center justify-center text-xs font-bold text-[#4F6BED] flex-shrink-0">
                          {(user.username[0] || '?').toUpperCase()}
                        </div>
                        <span className="text-sm font-medium text-[#1F2937]">{user.username}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-sm text-[#6B7280]">{user.email || '—'}</td>
                    <td className="px-4 py-3.5 text-sm text-[#1F2937]">{user.full_name || '—'}</td>
                    <td className="px-4 py-3.5">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: role.bg, color: role.color }}>{role.label}</span>
                    </td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={() => toggleStatus(user)}
                        className="px-2.5 py-1 rounded-lg text-xs font-semibold transition-opacity hover:opacity-80"
                        style={{ background: status.bg, color: status.color }}
                      >
                        {status.label}
                      </button>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex justify-center gap-1">
                        <button onClick={() => openEdit(user)} className="p-1.5 text-[#4F6BED] hover:bg-[#EEF2FF] rounded-lg transition-colors" title="Edit"><Pencil size={14} /></button>
                        <button onClick={() => handleDelete(user)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={14} /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.4)' }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-[#1F2937]">{editingUser ? 'Edit User' : 'Add New User'}</h3>
              <button onClick={() => setShowForm(false)} className="p-1.5 rounded-lg hover:bg-gray-100 text-[#6B7280]"><X size={18} /></button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Username — shown for both create and edit */}
              <div>
                <label className={labelCls}>Username *</label>
                <input className={inputCls} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required placeholder="Enter username" />
              </div>

              {/* Create-only fields */}
              {!editingUser && (
                <>
                  <div>
                    <label className={labelCls}>Email *</label>
                    <input type="email" className={inputCls} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required placeholder="Enter email" />
                  </div>
                  <div>
                    <label className={labelCls}>Password *</label>
                    <div className="relative">
                      <input type={showPwd ? 'text' : 'password'} className={inputCls} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required placeholder="Enter password" />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280]">
                        {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>Status</label>
                    <select className={inputCls} value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </>
              )}

              {/* Role — always shown */}
              <div>
                <label className={labelCls}>Category (Role)</label>
                <select className={inputCls} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-[#6B7280] hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60" style={{ background: '#4F6BED' }}>
                  {saving ? 'Saving...' : editingUser ? 'Update User' : 'Create User'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
