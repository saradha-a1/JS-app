'use client';
import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Download, Edit, Trash2, ArrowLeft, ChevronDown, FileText } from 'lucide-react';
import SkeletonRow from '@/components/SkeletonRow';
import { generateEstimationPDF, EstimationPDFData } from '@/lib/utils/pdfEstimation';

interface EstItem { description: string; qty: number; value: string | number; }
interface Est {
  _id: string; estimation_id: string; date: string;
  from_name: string; to_name: string;
  from_location: string; to_location: string;
  items: EstItem[]; total_amount: number;
}
interface ArticleItem { _id: string; name: string; }

const CUSTOM_VALUE = '__custom__';
const blankForm = {
  estimationId: '', date: new Date().toISOString().split('T')[0],
  fromName: '', toName: '', fromLocation: '', toLocation: '',
};
const inputCls = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4F6BED]/20 focus:border-[#4F6BED] transition-colors';
const labelCls = 'block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5';

export default function EstimationsPage() {
  const [view, setView] = useState<'list' | 'add'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [estimations, setEstimations] = useState<Est[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [items, setItems] = useState<EstItem[]>([]);
  const [form, setForm] = useState(blankForm);
  const [articleItems, setArticleItems] = useState<ArticleItem[]>([]);
  const [customRows, setCustomRows] = useState<Record<number, boolean>>({});

  const load = async () => {
    setLoading(true);
    const data = await fetch('/api/estimations').then(r => r.json());
    setEstimations(data); setLoading(false);
  };

  const loadArticleItems = async () => {
    try {
      const data = await fetch('/api/article-items').then(r => r.json());
      if (Array.isArray(data)) setArticleItems(data);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    if (view === 'list') { load(); resetForm(); }
    else {
      loadArticleItems();
      if (!editingId && !form.estimationId)
        setForm(f => ({ ...f, estimationId: 'ES' + Math.floor(Math.random() * 10000).toString().padStart(4, '0') }));
    }
  }, [view]);

  const resetForm = () => { setEditingId(null); setItems([]); setForm(blankForm); setCustomRows({}); };

  const handleEdit = (r: Est) => {
    setEditingId(r._id);
    setForm({ estimationId: r.estimation_id, date: r.date, fromName: r.from_name, toName: r.to_name, fromLocation: r.from_location, toLocation: r.to_location });
    setItems(Array.isArray(r.items) ? r.items : JSON.parse((r.items as any) || '[]'));
    setView('add');
    loadArticleItems();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      estimation_id: form.estimationId, date: form.date,
      from_name: form.fromName, to_name: form.toName,
      from_location: form.fromLocation, to_location: form.toLocation,
      items, total_amount: 0,
    };
    if (editingId)
      await fetch(`/api/estimations/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    else
      await fetch('/api/estimations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setView('list');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return;
    await fetch(`/api/estimations/${id}`, { method: 'DELETE' }); load();
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.size || !confirm(`Delete ${selectedIds.size}?`)) return;
    await Promise.all([...selectedIds].map(id => fetch(`/api/estimations/${id}`, { method: 'DELETE' })));
    setSelectedIds(new Set()); load();
  };

  const handlePDF = (source: 'record' | 'form', action: 'view' | 'save', r?: Est) => {
    const d = source === 'record' && r ? { estimationId: r.estimation_id, date: r.date, fromName: r.from_name, toName: r.to_name, fromLocation: r.from_location, toLocation: r.to_location } : form;
    const dItems = source === 'record' && r ? (Array.isArray(r.items) ? r.items : JSON.parse((r.items as any) || '[]')) : items;
    generateEstimationPDF({ id: d.estimationId, date: new Date(d.date).toLocaleDateString('en-GB'), fromName: d.fromName, toName: d.toName, fromLocation: d.fromLocation, toLocation: d.toLocation, items: dItems } as EstimationPDFData, action);
  };

  const updateItem = (idx: number, field: keyof EstItem, val: string | number) => {
    const n = [...items]; n[idx] = { ...n[idx], [field]: val }; setItems(n);
  };

  const handleDescriptionSelect = (idx: number, val: string) => {
    if (val === CUSTOM_VALUE) { setCustomRows(p => ({ ...p, [idx]: true })); updateItem(idx, 'description', ''); }
    else { setCustomRows(p => ({ ...p, [idx]: false })); updateItem(idx, 'description', val); }
  };

  const isCustomRow = (idx: number) => {
    if (customRows[idx]) return true;
    const desc = items[idx]?.description;
    if (!desc) return false;
    return !articleItems.some(a => a.name === desc);
  };

  const filtered = estimations.filter(e =>
    e.estimation_id.toLowerCase().includes(search.toLowerCase()) ||
    e.from_name.toLowerCase().includes(search.toLowerCase())
  );

  if (view === 'list') return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1F2937]">Estimations</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">{estimations.length} total estimations</p>
        </div>
        <div className="flex gap-2.5">
          {selectedIds.size > 0 && (
            <button onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors">
              <Trash2 size={14} /> Delete ({selectedIds.size})
            </button>
          )}
          <button onClick={() => { resetForm(); setView('add'); }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#4F6BED] text-white text-sm font-medium rounded-xl hover:bg-[#4459d6] transition-colors">
            <Plus size={15} /> Create New
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input type="text" placeholder="Search by ID or name..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6BED]/20 focus:border-[#4F6BED] transition-colors" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
              <tr>
                <th className="px-4 py-3 w-10">
                  <input type="checkbox" className="w-4 h-4 rounded accent-[#4F6BED]"
                    onChange={e => setSelectedIds(e.target.checked ? new Set(filtered.map(f => f._id)) : new Set())}
                    checked={filtered.length > 0 && selectedIds.size === filtered.length} />
                </th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">From Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">From Location</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">To Location</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <SkeletonRow cols={7} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-14 text-center">
                    <FileText size={36} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-[#6B7280] text-sm font-medium">No estimations found</p>
                  </td>
                </tr>
              ) : filtered.map(r => (
                <tr key={r._id} className={`hover:bg-[#F9FAFB] transition-colors ${selectedIds.has(r._id) ? 'bg-[#EEF2FF]' : ''}`}>
                  <td className="px-4 py-3.5">
                    <input type="checkbox" className="w-4 h-4 rounded accent-[#4F6BED]" checked={selectedIds.has(r._id)}
                      onChange={() => { const s = new Set(selectedIds); s.has(r._id) ? s.delete(r._id) : s.add(r._id); setSelectedIds(s); }} />
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="text-sm font-semibold text-[#4F6BED]">{r.estimation_id}</span>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-[#6B7280]">{new Date(r.date).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-3.5 text-sm font-medium text-[#1F2937]">{r.from_name}</td>
                  <td className="px-4 py-3.5 text-sm text-[#6B7280]">{r.from_location}</td>
                  <td className="px-4 py-3.5 text-sm text-[#6B7280]">{r.to_location}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => handlePDF('record', 'view', r)} className="p-1.5 text-[#4F6BED] hover:bg-[#EEF2FF] rounded-lg transition-colors" title="Preview PDF"><Eye size={14} /></button>
                      <button onClick={() => handlePDF('record', 'save', r)} className="p-1.5 text-[#059669] hover:bg-[#ECFDF5] rounded-lg transition-colors" title="Download PDF"><Download size={14} /></button>
                      <button onClick={() => handleEdit(r)} className="p-1.5 text-[#D97706] hover:bg-[#FFF7ED] rounded-lg transition-colors" title="Edit"><Edit size={14} /></button>
                      <button onClick={() => handleDelete(r._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <button onClick={() => setView('list')} className="p-2 hover:bg-white rounded-xl transition-colors text-[#6B7280]">
            <ArrowLeft size={18} />
          </button>
          <h2 className="text-2xl font-bold text-[#1F2937]">{editingId ? 'Edit Estimation' : 'New Estimation'}</h2>
        </div>
        <p className="text-sm text-[#6B7280] ml-11">{editingId ? 'Update estimation details' : 'Fill in the details to create a new estimation'}</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div>
              <label className={labelCls}>Estimation ID</label>
              <input readOnly value={form.estimationId} className={`${inputCls} bg-[#F9FAFB] cursor-not-allowed text-[#9CA3AF]`} />
            </div>
            <div>
              <label className={labelCls}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className={inputCls} required />
            </div>
            <div>
              <label className={labelCls}>From Name</label>
              <input value={form.fromName} onChange={e => setForm({ ...form, fromName: e.target.value })} className={inputCls} placeholder="Customer name" required />
            </div>
            <div>
              <label className={labelCls}>To Name</label>
              <input value={form.toName} onChange={e => setForm({ ...form, toName: e.target.value })} className={inputCls} placeholder="Receiver name" required />
            </div>
            <div>
              <label className={labelCls}>From Location</label>
              <input value={form.fromLocation} onChange={e => setForm({ ...form, fromLocation: e.target.value })} className={inputCls} placeholder="Origin" />
            </div>
            <div>
              <label className={labelCls}>To Location</label>
              <input value={form.toLocation} onChange={e => setForm({ ...form, toLocation: e.target.value })} className={inputCls} placeholder="Destination" />
            </div>
          </div>

          {/* Items */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-sm font-bold text-[#1F2937]">Item Details</h3>
                <p className="text-xs text-[#6B7280] mt-0.5">Select articles to be moved</p>
              </div>
              <button type="button" onClick={() => setItems([...items, { description: '', qty: 1, value: '' }])}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#4F6BED] text-white text-xs font-medium rounded-xl hover:bg-[#4459d6] transition-colors">
                <Plus size={13} /> Add Item
              </button>
            </div>

            <div className="border border-gray-100 rounded-2xl overflow-hidden">
              <table className="w-full text-sm">
                <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                  <tr>
                    <th className="px-3 py-3 w-12 text-center text-xs font-semibold text-[#6B7280] uppercase tracking-wide">S.No</th>
                    <th className="px-3 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Article Name</th>
                    <th className="px-3 py-3 w-20 text-xs font-semibold text-[#6B7280] uppercase tracking-wide text-center">Nos</th>
                    <th className="px-3 py-3 w-44 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Type of Packing</th>
                    <th className="px-3 py-3 w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.length === 0 && (
                    <tr><td colSpan={5} className="px-4 py-8 text-center text-[#9CA3AF] text-xs">No items added. Click "Add Item" to begin.</td></tr>
                  )}
                  {items.map((item, idx) => {
                    const custom = isCustomRow(idx);
                    const currentSelectVal = custom ? CUSTOM_VALUE : (item.description || '');
                    return (
                      <tr key={idx} className="hover:bg-[#F9FAFB] transition-colors">
                        <td className="px-3 py-2.5 text-center text-xs text-[#9CA3AF] font-medium">{idx + 1}</td>
                        <td className="px-3 py-2">
                          <div className="space-y-1.5">
                            <div className="relative">
                              <select value={currentSelectVal} onChange={e => handleDescriptionSelect(idx, e.target.value)}
                                className="w-full pl-3 pr-8 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6BED]/20 focus:border-[#4F6BED] appearance-none bg-white transition-colors">
                                <option value="">— Select article —</option>
                                {articleItems.map(a => <option key={a._id} value={a.name}>{a.name}</option>)}
                                <option value={CUSTOM_VALUE}>Other (Custom)</option>
                              </select>
                              <ChevronDown size={13} className="absolute right-2.5 top-2.5 text-gray-400 pointer-events-none" />
                            </div>
                            {custom && (
                              <input type="text" value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)}
                                placeholder="Enter custom article..." autoFocus
                                className="w-full px-3 py-2 border border-amber-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 bg-amber-50 transition-colors" />
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <input type="number" min={1} value={item.qty} onChange={e => updateItem(idx, 'qty', Number(e.target.value))}
                            className="w-full px-2 py-2 border border-gray-200 rounded-xl text-sm text-center focus:outline-none focus:ring-2 focus:ring-[#4F6BED]/20 focus:border-[#4F6BED] transition-colors" />
                        </td>
                        <td className="px-3 py-2">
                          <input type="text" value={item.value as string} onChange={e => updateItem(idx, 'value', e.target.value)}
                            placeholder="e.g. Double wrap"
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6BED]/20 focus:border-[#4F6BED] transition-colors" />
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button type="button" onClick={() => {
                            setItems(items.filter((_, i) => i !== idx));
                            setCustomRows(prev => {
                              const next: Record<number, boolean> = {};
                              Object.entries(prev).forEach(([k, v]) => { const ki = Number(k); if (ki < idx) next[ki] = v; else if (ki > idx) next[ki - 1] = v; });
                              return next;
                            });
                          }} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2.5 pt-4 border-t border-gray-100">
            <button type="submit"
              className="px-5 py-2.5 bg-[#4F6BED] text-white rounded-xl text-sm font-semibold hover:bg-[#4459d6] transition-colors">
              {editingId ? 'Update' : 'Save Estimation'}
            </button>
            <button type="button" onClick={() => handlePDF('form', 'view')}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#EFF6FF] text-[#3B82F6] rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors">
              <Eye size={14} /> Preview PDF
            </button>
            <button type="button" onClick={() => handlePDF('form', 'save')}
              className="flex items-center gap-2 px-5 py-2.5 bg-[#ECFDF5] text-[#059669] rounded-xl text-sm font-medium hover:bg-green-100 transition-colors">
              <Download size={14} /> Download PDF
            </button>
            <button type="button" onClick={() => setView('list')}
              className="px-5 py-2.5 border border-gray-200 text-[#6B7280] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors ml-auto">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
