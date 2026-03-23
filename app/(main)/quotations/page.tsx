'use client';
import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Download, Edit, Trash2, ArrowLeft, ClipboardList } from 'lucide-react';
import SkeletonRow from '@/components/SkeletonRow';
import { generateQuotationPDF, QuotationPDFData } from '@/lib/utils/pdfQuotation';

interface Customer { _id: string; first_name: string; last_name: string; billing_address?: string; }
interface Estimation { _id: string; estimation_id: string; from_location: string; to_location: string; items?: { description: string; qty: number; value: string | number }[]; }
interface QItem { description: string; qty: number; rate: number; grandTotal: number; }
interface Quotation { _id: string; quotation_id: string; estimation_id: string; date: string; customer_id: string; customer_name: string; from_location: string; to_location: string; items: QItem[]; total_basic: number; total_tax: number; grand_total: number; }

const blankItem = (): QItem => ({ description: '', qty: 1, rate: 0, grandTotal: 0 });
const blankForm = { quotationId: '', estimationId: '', date: new Date().toISOString().split('T')[0], customerId: '', fromLocation: '', toLocation: '' };
const inputCls = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4F6BED]/20 focus:border-[#4F6BED] transition-colors';
const labelCls = 'block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5';

function calcItem(item: QItem): QItem {
  return { ...item, grandTotal: item.qty * item.rate };
}

export default function QuotationsPage() {
  const [view, setView] = useState<'list' | 'add'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [estimations, setEstimations] = useState<Estimation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState(blankForm);
  const [items, setItems] = useState<QItem[]>([blankItem()]);

  const load = async () => {
    setLoading(true);
    const [qData, cData, eData] = await Promise.all([fetch('/api/quotations').then(r => r.json()), fetch('/api/customers').then(r => r.json()), fetch('/api/estimations').then(r => r.json())]);
    setQuotations(Array.isArray(qData) ? qData : []);
    setCustomers(Array.isArray(cData) ? cData : []);
    setEstimations(Array.isArray(eData) ? eData : []);
    setLoading(false);
  };

  useEffect(() => {
    if (view === 'list') { load(); resetForm(); }
    else if (!editingId && !form.quotationId)
      setForm(f => ({ ...f, quotationId: 'QT' + Math.floor(Math.random() * 10000).toString().padStart(4, '0') }));
  }, [view]);

  const resetForm = () => { setEditingId(null); setForm(blankForm); setItems([blankItem()]); };

  const updateItem = (idx: number, field: keyof QItem, value: string | number) => {
    setItems(prev => {
      const next = [...prev];
      const updated = { ...next[idx], [field]: field === 'description' ? value : parseFloat(value as string) || 0 };
      next[idx] = calcItem(updated);
      return next;
    });
  };

  const grandTotal = items.reduce((s, i) => s + i.grandTotal, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c._id === form.customerId);
    const payload = { quotation_id: form.quotationId, estimation_id: form.estimationId, date: form.date, customer_id: form.customerId, customer_name: cust ? `${cust.first_name} ${cust.last_name || ''}`.trim() : '', from_location: form.fromLocation, to_location: form.toLocation, items, total_basic: grandTotal, total_tax: 0, grand_total: grandTotal };
    if (editingId) await fetch(`/api/quotations/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    else await fetch('/api/quotations', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setView('list');
  };

  const handleEdit = (q: Quotation) => {
    setEditingId(q._id);
    setForm({ quotationId: q.quotation_id, estimationId: q.estimation_id || '', date: q.date, customerId: q.customer_id || '', fromLocation: q.from_location, toLocation: q.to_location });
    setItems(Array.isArray(q.items) ? q.items : [blankItem()]);
    setView('add');
  };

  const buildPDFData = (source: 'form' | 'record', q?: Quotation): QuotationPDFData => {
    const d = source === 'record' && q ? { quotationId: q.quotation_id, date: q.date, customerName: q.customer_name, fromLocation: q.from_location, toLocation: q.to_location } : { quotationId: form.quotationId, date: form.date, customerName: customers.find(c => c._id === form.customerId)?.first_name || '', fromLocation: form.fromLocation, toLocation: form.toLocation };
    const dItems = source === 'record' && q ? (Array.isArray(q.items) ? q.items : []) : items;
    const pdfItems = dItems.map(i => ({ description: i.description, qty: i.qty, rate: i.rate, basicAmount: i.grandTotal, cgst: 0, sgst: 0, igst: 0, taxAmount: 0, grandTotal: i.grandTotal }));
    return { id: d.quotationId, date: new Date(d.date).toLocaleDateString('en-GB'), customerName: d.customerName, fromLocation: d.fromLocation, toLocation: d.toLocation, items: pdfItems, totalAmount: dItems.reduce((s, i) => s + i.grandTotal, 0), totalTax: 0, grandTotal: dItems.reduce((s, i) => s + i.grandTotal, 0) };
  };

  const filtered = quotations.filter(q => q.quotation_id.toLowerCase().includes(search.toLowerCase()) || (q.customer_name || '').toLowerCase().includes(search.toLowerCase()));
  const toggleSelect = (id: string) => { const s = new Set(selectedIds); s.has(id) ? s.delete(id) : s.add(id); setSelectedIds(s); };

  if (view === 'list') return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1F2937]">Quotations</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">{quotations.length} total quotations</p>
        </div>
        <div className="flex gap-2.5">
          {selectedIds.size > 0 && (
            <button onClick={async () => { if (!selectedIds.size || !confirm(`Delete ${selectedIds.size}?`)) return; await Promise.all([...selectedIds].map(id => fetch(`/api/quotations/${id}`, { method: 'DELETE' }))); setSelectedIds(new Set()); load(); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors">
              <Trash2 size={14} /> Delete ({selectedIds.size})
            </button>
          )}
          <button onClick={() => { resetForm(); setView('add'); }} className="flex items-center gap-2 px-4 py-2.5 bg-[#4F6BED] text-white text-sm font-medium rounded-xl hover:bg-[#4459d6] transition-colors">
            <Plus size={15} /> Create New
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input type="text" placeholder="Search quotations..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6BED]/20 focus:border-[#4F6BED] transition-colors" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
              <tr>
                <th className="px-4 py-3 w-10"><input type="checkbox" className="w-4 h-4 rounded accent-[#4F6BED]" checked={filtered.length > 0 && selectedIds.size === filtered.length} onChange={e => setSelectedIds(e.target.checked ? new Set(filtered.map(f => f._id)) : new Set())} /></th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Quotation ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Customer</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">From</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">To</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide text-right">Grand Total</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? <SkeletonRow cols={8} />
                : filtered.length === 0 ? <tr><td colSpan={8} className="px-4 py-14 text-center"><ClipboardList size={36} className="mx-auto mb-3 text-gray-300" /><p className="text-[#6B7280] text-sm font-medium">No quotations found</p></td></tr>
                  : filtered.map(q => (
                    <tr key={q._id} className={`hover:bg-[#F9FAFB] transition-colors ${selectedIds.has(q._id) ? 'bg-[#EEF2FF]' : ''}`}>
                      <td className="px-4 py-3.5"><input type="checkbox" className="w-4 h-4 rounded accent-[#4F6BED]" checked={selectedIds.has(q._id)} onChange={() => toggleSelect(q._id)} /></td>
                      <td className="px-4 py-3.5 text-sm font-semibold text-[#4F6BED]">{q.quotation_id}</td>
                      <td className="px-4 py-3.5 text-sm text-[#6B7280]">{new Date(q.date).toLocaleDateString('en-GB')}</td>
                      <td className="px-4 py-3.5 text-sm font-medium text-[#1F2937]">{q.customer_name || customers.find(c => c._id === q.customer_id)?.first_name && `${customers.find(c => c._id === q.customer_id)!.first_name} ${customers.find(c => c._id === q.customer_id)!.last_name || ''}`.trim() || '—'}</td>
                      <td className="px-4 py-3.5 text-sm text-[#6B7280]">{q.from_location}</td>
                      <td className="px-4 py-3.5 text-sm text-[#6B7280]">{q.to_location}</td>
                      <td className="px-4 py-3.5 text-sm font-bold text-[#1F2937] text-right">₹{(q.grand_total || (Array.isArray(q.items) ? q.items.reduce((s: number, i: any) => s + (i.grandTotal || 0), 0) : 0)).toFixed(2)}</td>
                      <td className="px-4 py-3.5">
                        <div className="flex justify-center gap-1">
                          <button onClick={() => generateQuotationPDF(buildPDFData('record', q), 'view')} className="p-1.5 text-[#4F6BED] hover:bg-[#EEF2FF] rounded-lg transition-colors"><Eye size={14} /></button>
                          <button onClick={() => generateQuotationPDF(buildPDFData('record', q), 'save')} className="p-1.5 text-[#059669] hover:bg-[#ECFDF5] rounded-lg transition-colors"><Download size={14} /></button>
                          <button onClick={() => handleEdit(q)} className="p-1.5 text-[#D97706] hover:bg-[#FFF7ED] rounded-lg transition-colors"><Edit size={14} /></button>
                          <button onClick={async () => { if (!confirm('Delete?')) return; await fetch(`/api/quotations/${q._id}`, { method: 'DELETE' }); load(); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
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
          <button onClick={() => setView('list')} className="p-2 hover:bg-white rounded-xl transition-colors text-[#6B7280]"><ArrowLeft size={18} /></button>
          <h2 className="text-2xl font-bold text-[#1F2937]">{editingId ? 'Edit Quotation' : 'New Quotation'}</h2>
        </div>
        <p className="text-sm text-[#6B7280] ml-11">Fill in the quotation details</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div><label className={labelCls}>Quotation ID</label><input readOnly value={form.quotationId} className={`${inputCls} bg-[#F9FAFB] cursor-not-allowed text-[#9CA3AF]`} /></div>
            <div><label className={labelCls}>Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required className={inputCls} /></div>
            <div>
              <label className={labelCls}>Customer</label>
              <select value={form.customerId} onChange={e => setForm({ ...form, customerId: e.target.value })} className={inputCls}>
                <option value="">— Select Customer —</option>
                {customers.map(c => <option key={c._id} value={c._id}>{c.first_name} {c.last_name || ''}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Estimation (optional)</label>
              <select value={form.estimationId} onChange={e => {
                const est = estimations.find(est => est._id === e.target.value);
                setForm(f => ({ ...f, estimationId: e.target.value, fromLocation: est ? est.from_location : f.fromLocation, toLocation: est ? est.to_location : f.toLocation }));
                if (est?.items?.length) {
                  setItems(est.items.map(i => calcItem({ description: i.description, qty: Number(i.qty) || 1, rate: 0, grandTotal: 0 })));
                }
              }} className={inputCls}>
                <option value="">— Select Estimation —</option>
                {estimations.map(e => <option key={e._id} value={e._id}>{e.estimation_id}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>From Location</label><input value={form.fromLocation} onChange={e => setForm({ ...form, fromLocation: e.target.value })} className={inputCls} placeholder="Origin" /></div>
            <div><label className={labelCls}>To Location</label><input value={form.toLocation} onChange={e => setForm({ ...form, toLocation: e.target.value })} className={inputCls} placeholder="Destination" /></div>
          </div>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <div><h3 className="text-sm font-bold text-[#1F2937]">Item Details</h3><p className="text-xs text-[#6B7280] mt-0.5">Add items with description, quantity and rate</p></div>
              <button type="button" onClick={() => setItems([...items, blankItem()])} className="flex items-center gap-1.5 px-3 py-2 bg-[#4F6BED] text-white text-xs font-medium rounded-xl hover:bg-[#4459d6] transition-colors"><Plus size={13} /> Add Row</button>
            </div>
            <div className="border border-gray-100 rounded-2xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm">
                <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                  <tr>
                    <th className="px-3 py-3 w-8 text-center text-xs font-semibold text-[#6B7280]">#</th>
                    <th className="px-3 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Description</th>
                    <th className="px-3 py-3 w-20 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Qty</th>
                    <th className="px-3 py-3 w-28 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Rate</th>
                    <th className="px-3 py-3 w-28 text-xs font-semibold text-[#6B7280] uppercase tracking-wide text-right">Amount</th>
                    <th className="px-3 py-3 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-3 py-2 text-center text-xs text-[#9CA3AF]">{idx + 1}</td>
                      <td className="px-3 py-2"><input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} placeholder="Enter description" className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#4F6BED]/30 focus:border-[#4F6BED]" /></td>
                      <td className="px-3 py-2"><input type="text" inputMode="numeric" value={item.qty === 0 ? '' : item.qty} placeholder="0" onFocus={e => e.target.select()} onChange={e => updateItem(idx, 'qty', e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs text-center focus:outline-none focus:ring-1 focus:ring-[#4F6BED]/30 focus:border-[#4F6BED]" /></td>
                      <td className="px-3 py-2"><input type="text" inputMode="decimal" value={item.rate === 0 ? '' : item.rate} placeholder="0.00" onFocus={e => e.target.select()} onChange={e => updateItem(idx, 'rate', e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#4F6BED]/30 focus:border-[#4F6BED]" /></td>
                      <td className="px-3 py-2 text-right"><span className="px-2.5 py-1.5 bg-[#EEF2FF] border border-[#c7d2fe] rounded-lg text-xs font-semibold text-[#4F6BED] inline-block w-full text-right">{item.grandTotal.toFixed(2)}</span></td>
                      <td className="px-3 py-2 text-center"><button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={12} /></button></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot style={{ background: '#F9FAFB', borderTop: '1px solid #F3F4F6' }}>
                  <tr>
                    <td colSpan={4} className="px-3 py-2.5 text-right text-xs font-semibold text-[#6B7280]">Grand Total:</td>
                    <td className="px-3 py-2.5 text-xs font-bold text-[#4F6BED] text-right">₹{grandTotal.toFixed(2)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          <div className="flex gap-2.5 pt-4 border-t border-gray-100">
            <button type="submit" className="px-5 py-2.5 bg-[#4F6BED] text-white rounded-xl text-sm font-semibold hover:bg-[#4459d6] transition-colors">{editingId ? 'Update' : 'Save Quotation'}</button>
            <button type="button" onClick={() => generateQuotationPDF(buildPDFData('form'), 'view')} className="flex items-center gap-2 px-5 py-2.5 bg-[#EFF6FF] text-[#3B82F6] rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"><Eye size={14} /> Preview PDF</button>
            <button type="button" onClick={() => generateQuotationPDF(buildPDFData('form'), 'save')} className="flex items-center gap-2 px-5 py-2.5 bg-[#ECFDF5] text-[#059669] rounded-xl text-sm font-medium hover:bg-green-100 transition-colors"><Download size={14} /> Download PDF</button>
            <button type="button" onClick={() => setView('list')} className="px-5 py-2.5 border border-gray-200 text-[#6B7280] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors ml-auto">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
