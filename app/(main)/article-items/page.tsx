'use client';
import { useState, useEffect } from 'react';
import { Plus, Trash2, X, Archive } from 'lucide-react';

interface ArticleItem { _id: string; name: string; description?: string; unit?: string; }
const blank = { name: '', description: '', unit: '' };
const inputCls = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4F6BED]/20 focus:border-[#4F6BED] transition-colors';
const labelCls = 'block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5';

export default function ArticleItemsPage() {
  const [items, setItems] = useState<ArticleItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(blank);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const data = await fetch('/api/article-items').then(r => r.json());
    setItems(Array.isArray(data) ? data : []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch('/api/article-items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setSaving(false);
    setShowModal(false);
    setForm(blank);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this article item?')) return;
    await fetch(`/api/article-items/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1F2937]">Article Items</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">{items.length} items in master list</p>
        </div>
        <button
          onClick={() => { setForm(blank); setShowModal(true); }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#4F6BED] text-white text-sm font-medium rounded-xl hover:bg-[#4459d6] transition-colors"
        >
          <Plus size={15} /> Add Item
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide w-14">S.No</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Description</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Unit</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan={5} className="px-4 py-10 text-center text-[#6B7280] text-sm">Loading...</td></tr>
              ) : items.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-14 text-center">
                    <Archive size={36} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-[#6B7280] text-sm font-medium">No article items yet</p>
                    <p className="text-gray-400 text-xs mt-1">Add items that will appear in estimation dropdowns</p>
                  </td>
                </tr>
              ) : items.map((item, idx) => (
                <tr key={item._id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-4 py-3.5 text-sm text-[#9CA3AF]">{idx + 1}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#FFF7ED] flex items-center justify-center flex-shrink-0">
                        <Archive size={13} className="text-[#EA580C]" />
                      </div>
                      <span className="text-sm font-medium text-[#1F2937]">{item.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-[#6B7280]">{item.description || '—'}</td>
                  <td className="px-4 py-3.5">
                    {item.unit ? (
                      <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#475569] text-xs font-medium rounded-lg">{item.unit}</span>
                    ) : <span className="text-[#6B7280] text-sm">—</span>}
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <button onClick={() => handleDelete(item._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h3 className="text-base font-bold text-[#1F2937]">Add Article Item</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">This item will appear in estimation dropdowns</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} className="text-[#6B7280]" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className={labelCls}>Name <span className="text-red-400">*</span></label>
                <input required value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={inputCls} placeholder="e.g. Sofa, Refrigerator" />
              </div>
              <div>
                <label className={labelCls}>Description</label>
                <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className={inputCls} placeholder="Optional description" />
              </div>
              <div>
                <label className={labelCls}>Unit</label>
                <input value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className={inputCls} placeholder="e.g. kg, pcs, box" />
              </div>
              <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-[#6B7280] hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit" disabled={saving}
                  className="px-5 py-2.5 bg-[#4F6BED] text-white rounded-xl text-sm font-medium hover:bg-[#4459d6] disabled:opacity-60 transition-colors">
                  {saving ? 'Saving...' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
