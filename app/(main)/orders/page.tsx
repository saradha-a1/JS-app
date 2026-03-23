'use client';
import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Download, Edit, Trash2, ArrowLeft, ShoppingCart } from 'lucide-react';
import SkeletonRow from '@/components/SkeletonRow';
import { generateOrderPDF, OrderPDFData } from '@/lib/utils/pdfOrder';

interface Customer { _id: string; first_name: string; last_name: string; billing_address?: string; gstin?: string; mobile?: string; contact?: string; }
interface Quotation { _id: string; quotation_id: string; items: OItem[]; customer_id?: string; from_location?: string; to_location?: string; }
interface OItem { description: string; qty: number; rate: number; basicAmount: number; cgst: number; cgstAmount: number; sgst: number; sgstAmount: number; igst: number; igstAmount: number; grandTotal: number; }
interface Order { _id: string; order_id: string; customer_id: string; quotation_id?: string; date: string; purchaser_name: string; billing_gstin: string; billing_address: string; purchaser_contact: string; receiver_name: string; delivery_gstin: string; delivery_address: string; receiver_contact: string; items: OItem[]; discount_percent: number; other_charges: number; total_basic: number; total_tax: number; grand_total: number; final_amount: number; status: string; }

const blankItem = (): OItem => ({ description: '', qty: 1, rate: 0, basicAmount: 0, cgst: 0, cgstAmount: 0, sgst: 0, sgstAmount: 0, igst: 0, igstAmount: 0, grandTotal: 0 });
const blankForm = { orderId: '', customerId: '', quotationId: '', date: new Date().toISOString().split('T')[0], purchaserName: '', billingGstin: '', billingAddress: '', purchaserContact: '', receiverName: '', deliveryGstin: '', deliveryAddress: '', receiverContact: '', discountPercent: 0, otherCharges: 0, status: 'processing' };
const inputCls = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4F6BED]/20 focus:border-[#4F6BED] transition-colors';
const labelCls = 'block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5';

function calcItem(item: OItem): OItem {
  const basicAmount = item.qty * item.rate;
  const igstAmount = item.igst > 0 ? basicAmount * item.igst / 100 : 0;
  const cgstAmount = item.igst > 0 ? 0 : basicAmount * item.cgst / 100;
  const sgstAmount = item.igst > 0 ? 0 : basicAmount * item.sgst / 100;
  return { ...item, basicAmount, cgstAmount, sgstAmount, igstAmount, grandTotal: basicAmount + cgstAmount + sgstAmount + igstAmount };
}

const statusMap: Record<string, { bg: string; color: string; label: string }> = {
  processing: { bg: '#FFF7ED', color: '#D97706', label: 'Processing' },
  shipped: { bg: '#EFF6FF', color: '#3B82F6', label: 'Shipped' },
  delivered: { bg: '#ECFDF5', color: '#059669', label: 'Delivered' },
};

export default function OrdersPage() {
  const [view, setView] = useState<'list' | 'add'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState(blankForm);
  const [items, setItems] = useState<OItem[]>([blankItem()]);

  const load = async () => {
    setLoading(true);
    const [oData, cData, qData] = await Promise.all([fetch('/api/orders').then(r => r.json()), fetch('/api/customers').then(r => r.json()), fetch('/api/quotations').then(r => r.json())]);
    setOrders(Array.isArray(oData) ? oData : []);
    setCustomers(Array.isArray(cData) ? cData : []);
    setQuotations(Array.isArray(qData) ? qData : []);
    setLoading(false);
  };

  useEffect(() => {
    if (view === 'list') { load(); resetForm(); }
    else if (!editingId && !form.orderId)
      setForm(f => ({ ...f, orderId: 'ORD' + Math.floor(Math.random() * 100000).toString().padStart(5, '0') }));
  }, [view]);

  const resetForm = () => { setEditingId(null); setForm(blankForm); setItems([blankItem()]); };

  const updateItem = (idx: number, field: keyof OItem, value: string | number) => {
    setItems(prev => {
      const next = [...prev];
      const updated = { ...next[idx], [field]: field === 'description' ? value : parseFloat(value as string) || 0 };
      if (field === 'igst' && (updated.igst as number) > 0) { updated.cgst = 0; updated.sgst = 0; }
      if ((field === 'cgst' || field === 'sgst') && (updated[field] as number) > 0) updated.igst = 0;
      next[idx] = calcItem(updated);
      return next;
    });
  };

  const totalBasic = items.reduce((s, i) => s + i.basicAmount, 0);
  const totalCgst = items.reduce((s, i) => s + i.cgstAmount, 0);
  const totalSgst = items.reduce((s, i) => s + i.sgstAmount, 0);
  const totalIgst = items.reduce((s, i) => s + i.igstAmount, 0);
  const totalTax = totalCgst + totalSgst + totalIgst;
  const grandTotal = items.reduce((s, i) => s + i.grandTotal, 0);
  const finalAmount = grandTotal - (grandTotal * form.discountPercent / 100) + form.otherCharges;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = { order_id: form.orderId, customer_id: form.customerId, quotation_id: form.quotationId, date: form.date, purchaser_name: form.purchaserName, billing_gstin: form.billingGstin, billing_address: form.billingAddress, purchaser_contact: form.purchaserContact, receiver_name: form.receiverName, delivery_gstin: form.deliveryGstin, delivery_address: form.deliveryAddress, receiver_contact: form.receiverContact, items, discount_percent: form.discountPercent, other_charges: form.otherCharges, total_basic: totalBasic, total_tax: totalTax, grand_total: grandTotal, final_amount: finalAmount, status: form.status };
    if (editingId) await fetch(`/api/orders/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    else await fetch('/api/orders', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setView('list');
  };

  const handleEdit = (o: Order) => {
    setEditingId(o._id);
    setForm({ orderId: o.order_id, customerId: o.customer_id, quotationId: o.quotation_id || '', date: o.date, purchaserName: o.purchaser_name, billingGstin: o.billing_gstin || '', billingAddress: o.billing_address || '', purchaserContact: o.purchaser_contact || '', receiverName: o.receiver_name || '', deliveryGstin: o.delivery_gstin || '', deliveryAddress: o.delivery_address || '', receiverContact: o.receiver_contact || '', discountPercent: o.discount_percent || 0, otherCharges: o.other_charges || 0, status: o.status || 'processing' });
    setItems(Array.isArray(o.items) && o.items.length > 0 ? o.items : [blankItem()]);
    setView('add');
  };

  const buildPDFData = (source: 'form' | 'record', o?: Order): OrderPDFData => {
    if (source === 'record' && o) return { id: o.order_id, date: new Date(o.date).toLocaleDateString('en-GB'), billing: { name: o.purchaser_name, address: o.billing_address || '', gstin: o.billing_gstin || '', contact: o.purchaser_contact || '' }, shipping: { name: o.receiver_name || '', address: o.delivery_address || '', gstin: o.delivery_gstin || '', contact: o.receiver_contact || '' }, items: o.items, totalAmount: o.total_basic, totalTax: o.total_tax, grandTotal: o.grand_total, discountPercent: o.discount_percent || 0, otherCharges: o.other_charges || 0 };
    return { id: form.orderId, date: new Date(form.date).toLocaleDateString('en-GB'), billing: { name: form.purchaserName, address: form.billingAddress, gstin: form.billingGstin, contact: form.purchaserContact }, shipping: { name: form.receiverName, address: form.deliveryAddress, gstin: form.deliveryGstin, contact: form.receiverContact }, items, totalAmount: totalBasic, totalTax, grandTotal, discountPercent: form.discountPercent, otherCharges: form.otherCharges };
  };

  const filtered = orders.filter(o => o.order_id.toLowerCase().includes(search.toLowerCase()) || (o.purchaser_name || '').toLowerCase().includes(search.toLowerCase()));
  const toggleSelect = (id: string) => { const s = new Set(selectedIds); s.has(id) ? s.delete(id) : s.add(id); setSelectedIds(s); };

  if (view === 'list') return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1F2937]">Orders</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">{orders.length} total orders</p>
        </div>
        <div className="flex gap-2.5">
          {selectedIds.size > 0 && (
            <button onClick={async () => { if (!selectedIds.size || !confirm(`Delete ${selectedIds.size}?`)) return; await Promise.all([...selectedIds].map(id => fetch(`/api/orders/${id}`, { method: 'DELETE' }))); setSelectedIds(new Set()); load(); }}
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
            <input type="text" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6BED]/20 focus:border-[#4F6BED] transition-colors" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
              <tr>
                <th className="px-4 py-3 w-10"><input type="checkbox" className="w-4 h-4 rounded accent-[#4F6BED]" checked={filtered.length > 0 && selectedIds.size === filtered.length} onChange={e => setSelectedIds(e.target.checked ? new Set(filtered.map(f => f._id)) : new Set())} /></th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Order ID</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Customer</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Status</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide text-right">Final Amount</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? <SkeletonRow cols={7} />
                : filtered.length === 0 ? <tr><td colSpan={7} className="px-4 py-14 text-center"><ShoppingCart size={36} className="mx-auto mb-3 text-gray-300" /><p className="text-[#6B7280] text-sm font-medium">No orders found</p></td></tr>
                  : filtered.map(o => {
                    const st = statusMap[o.status] || { bg: '#F9FAFB', color: '#6B7280', label: o.status };
                    return (
                      <tr key={o._id} className={`hover:bg-[#F9FAFB] transition-colors ${selectedIds.has(o._id) ? 'bg-[#EEF2FF]' : ''}`}>
                        <td className="px-4 py-3.5"><input type="checkbox" className="w-4 h-4 rounded accent-[#4F6BED]" checked={selectedIds.has(o._id)} onChange={() => toggleSelect(o._id)} /></td>
                        <td className="px-4 py-3.5 text-sm font-semibold text-[#4F6BED]">{o.order_id}</td>
                        <td className="px-4 py-3.5 text-sm text-[#6B7280]">{new Date(o.date).toLocaleDateString('en-GB')}</td>
                        <td className="px-4 py-3.5 text-sm font-medium text-[#1F2937]">{o.purchaser_name || '—'}</td>
                        <td className="px-4 py-3.5"><span className="px-2.5 py-1 rounded-lg text-xs font-semibold" style={{ background: st.bg, color: st.color }}>{st.label}</span></td>
                        <td className="px-4 py-3.5 text-sm font-bold text-[#1F2937] text-right">₹{(o.final_amount > 0 ? o.final_amount : (() => { const gt = Array.isArray(o.items) ? o.items.reduce((s, i) => s + (i.grandTotal || 0), 0) : 0; return gt - gt * ((o.discount_percent || 0) / 100) + (o.other_charges || 0); })()).toFixed(2)}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex justify-center gap-1">
                            <button onClick={() => generateOrderPDF(buildPDFData('record', o), 'view')} className="p-1.5 text-[#4F6BED] hover:bg-[#EEF2FF] rounded-lg transition-colors"><Eye size={14} /></button>
                            <button onClick={() => generateOrderPDF(buildPDFData('record', o), 'save')} className="p-1.5 text-[#059669] hover:bg-[#ECFDF5] rounded-lg transition-colors"><Download size={14} /></button>
                            <button onClick={() => handleEdit(o)} className="p-1.5 text-[#D97706] hover:bg-[#FFF7ED] rounded-lg transition-colors"><Edit size={14} /></button>
                            <button onClick={async () => { if (!confirm('Delete?')) return; await fetch(`/api/orders/${o._id}`, { method: 'DELETE' }); load(); }} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
          <h2 className="text-2xl font-bold text-[#1F2937]">{editingId ? 'Edit Order' : 'New Order'}</h2>
        </div>
        <p className="text-sm text-[#6B7280] ml-11">Fill in the order details below</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <form onSubmit={handleSubmit}>
          {/* Basic info */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
            <div><label className={labelCls}>Order ID</label><input readOnly value={form.orderId} className={`${inputCls} bg-[#F9FAFB] cursor-not-allowed text-[#9CA3AF]`} /></div>
            <div><label className={labelCls}>Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required className={inputCls} /></div>
            <div><label className={labelCls}>Status</label><select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={inputCls}><option value="processing">Processing</option><option value="shipped">Shipped</option><option value="delivered">Delivered</option></select></div>
            <div><label className={labelCls}>Customer</label><select value={form.customerId} onChange={e => { const c = customers.find(c => c._id === e.target.value); setForm(f => ({ ...f, customerId: e.target.value, purchaserName: c ? `${c.first_name} ${c.last_name || ''}`.trim() : '', billingAddress: c?.billing_address || '', billingGstin: c?.gstin || '', purchaserContact: c?.mobile || c?.contact || '' })); }} className={inputCls}><option value="">— Select Customer —</option>{customers.map(c => <option key={c._id} value={c._id}>{c.first_name} {c.last_name || ''}</option>)}</select></div>
            <div><label className={labelCls}>Quotation (optional)</label><select value={form.quotationId} onChange={e => { const q = quotations.find(q => q._id === e.target.value); setForm(f => ({ ...f, quotationId: e.target.value })); if (quotations.find(q => q._id === e.target.value)?.items?.length) setItems(quotations.find(q => q._id === e.target.value)!.items.map(i => calcItem({ ...blankItem(), ...i }))); }} className={inputCls}><option value="">— Select Quotation —</option>{quotations.map(q => <option key={q._id} value={q._id}>{q.quotation_id}</option>)}</select></div>
          </div>

          {/* Billing / Shipping */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-6">
            {[
              { title: 'Billing Details', bg: '#EEF2FF', color: '#4F6BED', fields: [['Purchaser Name', 'purchaserName'], ['Billing GSTIN', 'billingGstin'], ['Purchaser Contact', 'purchaserContact']], addr: ['billingAddress', 'Billing Address'] },
              { title: 'Shipping Details', bg: '#ECFDF5', color: '#059669', fields: [['Receiver Name', 'receiverName'], ['Delivery GSTIN', 'deliveryGstin'], ['Receiver Contact', 'receiverContact']], addr: ['deliveryAddress', 'Delivery Address'] },
            ].map(section => (
              <div key={section.title} className="p-4 rounded-2xl border border-gray-100 bg-[#F9FAFB]">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-2 h-2 rounded-full" style={{ background: section.color }} />
                  <h3 className="text-xs font-bold text-[#1F2937] uppercase tracking-wide">{section.title}</h3>
                </div>
                <div className="space-y-3">
                  {section.fields.map(([lbl, key]) => (
                    <div key={key}><label className={labelCls}>{lbl}</label><input value={(form as any)[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} className={inputCls} /></div>
                  ))}
                  <div><label className={labelCls}>{section.addr[1]}</label><textarea rows={2} value={(form as any)[section.addr[0]]} onChange={e => setForm({ ...form, [section.addr[0]]: e.target.value })} className={`${inputCls} resize-none`} /></div>
                </div>
              </div>
            ))}
          </div>

          {/* Items */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <div><h3 className="text-sm font-bold text-[#1F2937]">Item Details</h3><p className="text-xs text-[#6B7280] mt-0.5">Add items with pricing and GST</p></div>
              <button type="button" onClick={() => setItems([...items, blankItem()])} className="flex items-center gap-1.5 px-3 py-2 bg-[#4F6BED] text-white text-xs font-medium rounded-xl hover:bg-[#4459d6] transition-colors"><Plus size={13} /> Add Row</button>
            </div>
            <div className="border border-gray-100 rounded-2xl overflow-hidden overflow-x-auto">
              <table className="w-full text-sm min-w-[1000px]">
                <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
                  <tr>
                    <th className="px-3 py-3 w-8 text-center text-xs font-semibold text-[#6B7280]">#</th>
                    <th className="px-3 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Description</th>
                    <th className="px-3 py-3 w-16 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Qty</th>
                    <th className="px-3 py-3 w-24 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Rate</th>
                    <th className="px-3 py-3 w-24 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Basic</th>
                    <th className="px-3 py-3 w-20 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">CGST%</th>
                    <th className="px-3 py-3 w-24 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">CGST Amt</th>
                    <th className="px-3 py-3 w-20 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">SGST%</th>
                    <th className="px-3 py-3 w-24 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">SGST Amt</th>
                    <th className="px-3 py-3 w-20 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">IGST%</th>
                    <th className="px-3 py-3 w-24 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">IGST Amt</th>
                    <th className="px-3 py-3 w-28 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Total</th>
                    <th className="px-3 py-3 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-[#F9FAFB] transition-colors">
                      <td className="px-3 py-2 text-center text-xs text-[#9CA3AF]">{idx + 1}</td>
                      <td className="px-3 py-2"><input value={item.description} onChange={e => updateItem(idx, 'description', e.target.value)} className="w-full px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#4F6BED]/30 focus:border-[#4F6BED]" /></td>
                      <td className="px-3 py-2"><input type="text" inputMode="numeric" value={item.qty === 0 ? '' : item.qty} placeholder="0" onFocus={e => e.target.select()} onChange={e => updateItem(idx, 'qty', e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs text-center focus:outline-none focus:ring-1 focus:ring-[#4F6BED]/30" /></td>
                      <td className="px-3 py-2"><input type="text" inputMode="decimal" value={item.rate === 0 ? '' : item.rate} placeholder="0.00" onFocus={e => e.target.select()} onChange={e => updateItem(idx, 'rate', e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#4F6BED]/30" /></td>
                      <td className="px-3 py-2"><input readOnly value={item.basicAmount.toFixed(2)} className="w-full px-2 py-1.5 bg-[#F9FAFB] border border-gray-100 rounded-lg text-xs text-[#9CA3AF]" /></td>
                      <td className="px-3 py-2"><input type="text" inputMode="decimal" value={item.cgst === 0 ? '' : item.cgst} placeholder="0" onFocus={e => e.target.select()} disabled={item.igst > 0} onChange={e => updateItem(idx, 'cgst', e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#4F6BED]/30 disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF]" /></td>
                      <td className="px-3 py-2"><input readOnly value={item.cgstAmount.toFixed(2)} className="w-full px-2 py-1.5 bg-[#F9FAFB] border border-gray-100 rounded-lg text-xs text-[#9CA3AF]" /></td>
                      <td className="px-3 py-2"><input type="text" inputMode="decimal" value={item.sgst === 0 ? '' : item.sgst} placeholder="0" onFocus={e => e.target.select()} disabled={item.igst > 0} onChange={e => updateItem(idx, 'sgst', e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#4F6BED]/30 disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF]" /></td>
                      <td className="px-3 py-2"><input readOnly value={item.sgstAmount.toFixed(2)} className="w-full px-2 py-1.5 bg-[#F9FAFB] border border-gray-100 rounded-lg text-xs text-[#9CA3AF]" /></td>
                      <td className="px-3 py-2"><input type="text" inputMode="decimal" value={item.igst === 0 ? '' : item.igst} placeholder="0" onFocus={e => e.target.select()} disabled={item.cgst > 0 || item.sgst > 0} onChange={e => updateItem(idx, 'igst', e.target.value)} className="w-full px-2 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#4F6BED]/30 disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF]" /></td>
                      <td className="px-3 py-2"><input readOnly value={item.igstAmount.toFixed(2)} className="w-full px-2 py-1.5 bg-[#F9FAFB] border border-gray-100 rounded-lg text-xs text-[#9CA3AF]" /></td>
                      <td className="px-3 py-2"><input readOnly value={item.grandTotal.toFixed(2)} className="w-full px-2 py-1.5 bg-[#EEF2FF] border border-[#c7d2fe] rounded-lg text-xs font-semibold text-[#4F6BED]" /></td>
                      <td className="px-3 py-2 text-center"><button type="button" onClick={() => setItems(items.filter((_, i) => i !== idx))} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={12} /></button></td>
                    </tr>
                  ))}
                </tbody>
                <tfoot style={{ background: '#F9FAFB', borderTop: '1px solid #F3F4F6' }}>
                  <tr>
                    <td colSpan={4} className="px-3 py-2.5 text-right text-xs font-semibold text-[#6B7280]">Totals:</td>
                    <td className="px-3 py-2.5 text-xs font-semibold text-[#1F2937]">{totalBasic.toFixed(2)}</td>
                    <td /><td className="px-3 py-2.5 text-xs font-semibold text-[#1F2937]">{totalCgst.toFixed(2)}</td>
                    <td /><td className="px-3 py-2.5 text-xs font-semibold text-[#1F2937]">{totalSgst.toFixed(2)}</td>
                    <td /><td className="px-3 py-2.5 text-xs font-semibold text-[#1F2937]">{totalIgst.toFixed(2)}</td>
                    <td className="px-3 py-2.5 text-xs font-bold text-[#4F6BED]">{grandTotal.toFixed(2)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Discount / Charges */}
          <div className="flex flex-wrap gap-5 items-end mb-6 p-4 bg-[#F9FAFB] rounded-2xl border border-gray-100">
            <div>
              <label className={labelCls}>Discount (%)</label>
              <input type="number" min="0" max="100" step="0.01" placeholder="0" value={form.discountPercent || ''} onChange={e => setForm({ ...form, discountPercent: parseFloat(e.target.value) || 0 })} className="w-36 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6BED]/20 focus:border-[#4F6BED] transition-colors bg-white" />
            </div>
            <div>
              <label className={labelCls}>Other Charges (₹)</label>
              <input type="number" min="0" step="0.01" placeholder="0.00" value={form.otherCharges || ''} onChange={e => setForm({ ...form, otherCharges: parseFloat(e.target.value) || 0 })} className="w-36 px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6BED]/20 focus:border-[#4F6BED] transition-colors bg-white" />
            </div>
            <div className="ml-auto text-right">
              <div className="text-sm text-[#6B7280] mb-1">Grand Total: <span className="font-semibold text-[#1F2937]">₹{grandTotal.toFixed(2)}</span></div>
              <div className="text-lg font-bold text-[#4F6BED]">Final: ₹{finalAmount.toFixed(2)}</div>
            </div>
          </div>

          <div className="flex gap-2.5 pt-4 border-t border-gray-100">
            <button type="submit" className="px-5 py-2.5 bg-[#4F6BED] text-white rounded-xl text-sm font-semibold hover:bg-[#4459d6] transition-colors">{editingId ? 'Update Order' : 'Save Order'}</button>
            <button type="button" onClick={() => generateOrderPDF(buildPDFData('form'), 'view')} className="flex items-center gap-2 px-5 py-2.5 bg-[#EFF6FF] text-[#3B82F6] rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"><Eye size={14} /> Preview PDF</button>
            <button type="button" onClick={() => generateOrderPDF(buildPDFData('form'), 'save')} className="flex items-center gap-2 px-5 py-2.5 bg-[#ECFDF5] text-[#059669] rounded-xl text-sm font-medium hover:bg-green-100 transition-colors"><Download size={14} /> Download PDF</button>
            <button type="button" onClick={() => setView('list')} className="px-5 py-2.5 border border-gray-200 text-[#6B7280] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors ml-auto">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
