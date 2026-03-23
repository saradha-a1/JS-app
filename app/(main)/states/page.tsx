'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Map } from 'lucide-react';

interface State { _id: string; name: string; code?: string; }
const blank = { name: '', code: '' };
const inputCls = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4F6BED]/20 focus:border-[#4F6BED] transition-colors';
const labelCls = 'block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5';

export default function StatesPage() {
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetch('/api/states').then(r => r.json());
    setStates(Array.isArray(data) ? data : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/states', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaving(false);
    setShowModal(false);
    setForm(blank);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this state?')) return;
    await fetch(`/api/states/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1F2937]">State Master</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">{states.length} states configured</p>
        </div>
        <button
          onClick={() => { setForm(blank); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#4F6BED] text-white text-sm font-medium rounded-xl hover:bg-[#4459d6] transition-colors"
        >
          <Plus size={15} /> Add State
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left">
          <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
            <tr>
              <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide w-14">S.No</th>
              <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">State Name</th>
              <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Code</th>
              <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-10 text-center text-[#6B7280] text-sm">Loading...</td></tr>
            ) : states.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-14 text-center">
                  <Map size={36} className="mx-auto mb-3 text-gray-300" />
                  <p className="text-[#6B7280] text-sm font-medium">No states added yet</p>
                </td>
              </tr>
            ) : states.map((state, idx) => (
              <tr key={state._id} className="hover:bg-[#F9FAFB] transition-colors">
                <td className="px-4 py-3.5 text-sm text-[#9CA3AF]">{idx + 1}</td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-[#F0FDFA] flex items-center justify-center flex-shrink-0">
                      <Map size={13} className="text-[#0D9488]" />
                    </div>
                    <span className="text-sm font-medium text-[#1F2937]">{state.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  {state.code ? (
                    <span className="px-2 py-0.5 bg-[#F0FDFA] text-[#0D9488] text-xs font-semibold rounded-lg">{state.code}</span>
                  ) : <span className="text-[#6B7280] text-sm">—</span>}
                </td>
                <td className="px-4 py-3.5 text-center">
                  <button onClick={() => handleDelete(state._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-base font-bold text-[#1F2937]">Add State</h3>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} className="text-[#6B7280]" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={labelCls}>State Name <span className="text-red-400">*</span></label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="e.g. Tamil Nadu" />
              </div>
              <div>
                <label className={labelCls}>State Code</label>
                <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className={inputCls} placeholder="e.g. TN" maxLength={3} />
              </div>
              <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-[#6B7280] hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2.5 bg-[#4F6BED] text-white rounded-xl text-sm font-medium hover:bg-[#4459d6] disabled:opacity-60 transition-colors">
                  {saving ? 'Saving...' : 'Save State'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
