'use client';
import { useState, useEffect } from 'react';
import { Plus, Search, Eye, Download, Edit, Trash2, ArrowLeft, Receipt } from 'lucide-react';
import SkeletonRow from '@/components/SkeletonRow';
import { generateReceiptPDF, ReceiptPDFData } from '@/lib/utils/pdfReceipt';

interface Customer { _id: string; first_name: string; last_name: string; billing_address?: string; }
interface ReceiptRecord {
  _id: string; receipt_no: string; date: string; branch_location: string;
  service_tax_no: string; customer_id: string; customer_name: string;
  address: string; bill_no: string; gc_no: string; payment_type: string;
  bank_name: string; cheque_no: string; cheque_date: string;
  particulars: string; amount: number;
}

const blankForm = {
  receiptNo: '', date: new Date().toISOString().split('T')[0],
  branchLocation: '', serviceTaxNo: '', customerId: '', address: '',
  billNo: '', gcNo: '', paymentType: 'Cash', bankName: '',
  chequeNo: '', chequeDate: '', particulars: '', amount: 0,
};
const inputCls = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4F6BED]/20 focus:border-[#4F6BED] transition-colors';
const labelCls = 'block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5';

const paymentBadge = (type: string) => {
  const map: Record<string, { bg: string; color: string }> = {
    Cash: { bg: '#ECFDF5', color: '#059669' },
    Cheque: { bg: '#EFF6FF', color: '#3B82F6' },
    Online: { bg: '#F5F3FF', color: '#7C3AED' },
  };
  return map[type] || { bg: '#F9FAFB', color: '#6B7280' };
};

export default function ReceiptsPage() {
  const [view, setView] = useState<'list' | 'add'>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [receipts, setReceipts] = useState<ReceiptRecord[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [form, setForm] = useState(blankForm);

  const load = async () => {
    setLoading(true);
    const [rData, cData] = await Promise.all([fetch('/api/receipts').then(r => r.json()), fetch('/api/customers').then(r => r.json())]);
    setReceipts(Array.isArray(rData) ? rData : []);
    setCustomers(Array.isArray(cData) ? cData : []);
    setLoading(false);
  };

  useEffect(() => {
    if (view === 'list') { load(); resetForm(); }
    else if (!editingId && !form.receiptNo)
      setForm(f => ({ ...f, receiptNo: 'RCT' + Math.floor(Math.random() * 10000).toString().padStart(4, '0') }));
  }, [view]);

  const resetForm = () => { setEditingId(null); setForm(blankForm); };

  const handleCustomerChange = (id: string) => {
    const c = customers.find(c => c._id === id);
    setForm(f => ({ ...f, customerId: id, address: c?.billing_address || '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cust = customers.find(c => c._id === form.customerId);
    const payload = {
      receipt_no: form.receiptNo, date: form.date, branch_location: form.branchLocation,
      service_tax_no: form.serviceTaxNo, customer_id: form.customerId,
      customer_name: cust ? `${cust.first_name} ${cust.last_name || ''}`.trim() : '',
      address: form.address, bill_no: form.billNo, gc_no: form.gcNo,
      payment_type: form.paymentType, bank_name: form.bankName,
      cheque_no: form.chequeNo, cheque_date: form.chequeDate,
      particulars: form.particulars, amount: form.amount,
    };
    if (editingId)
      await fetch(`/api/receipts/${editingId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    else
      await fetch('/api/receipts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    setView('list');
  };

  const handleEdit = (r: ReceiptRecord) => {
    setEditingId(r._id);
    setForm({ receiptNo: r.receipt_no, date: r.date, branchLocation: r.branch_location || '', serviceTaxNo: r.service_tax_no || '', customerId: r.customer_id || '', address: r.address || '', billNo: r.bill_no || '', gcNo: r.gc_no || '', paymentType: r.payment_type || 'Cash', bankName: r.bank_name || '', chequeNo: r.cheque_no || '', chequeDate: r.cheque_date || '', particulars: r.particulars || '', amount: r.amount || 0 });
    setView('add');
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete?')) return;
    await fetch(`/api/receipts/${id}`, { method: 'DELETE' }); load();
  };

  const handleBulkDelete = async () => {
    if (!selectedIds.size || !confirm(`Delete ${selectedIds.size}?`)) return;
    await Promise.all([...selectedIds].map(id => fetch(`/api/receipts/${id}`, { method: 'DELETE' })));
    setSelectedIds(new Set()); load();
  };

  const buildPDF = (source: 'form' | 'record', r?: ReceiptRecord): ReceiptPDFData => {
    if (source === 'record' && r) return { receiptNo: r.receipt_no, receiptDate: new Date(r.date).toLocaleDateString('en-GB'), serviceTax: r.service_tax_no || '', branchLocation: r.branch_location || '', customerName: r.customer_name || '', address: r.address || '', billNo: r.bill_no || '', goodConsignmentNo: r.gc_no || '', paymentType: r.payment_type || '', bankName: r.bank_name || '', accountChequeNo: r.cheque_no || '', chequeDate: r.cheque_date || '', items: [{ description: r.particulars || 'Service', amount: r.amount || 0 }], totalAmount: r.amount || 0 };
    const cust = customers.find(c => c._id === form.customerId);
    return { receiptNo: form.receiptNo, receiptDate: new Date(form.date).toLocaleDateString('en-GB'), serviceTax: form.serviceTaxNo, branchLocation: form.branchLocation, customerName: cust ? `${cust.first_name} ${cust.last_name || ''}`.trim() : '', address: form.address, billNo: form.billNo, goodConsignmentNo: form.gcNo, paymentType: form.paymentType, bankName: form.bankName, accountChequeNo: form.chequeNo, chequeDate: form.chequeDate, items: [{ description: form.particulars || 'Service', amount: form.amount }], totalAmount: form.amount };
  };

  const filtered = receipts.filter(r => r.receipt_no.toLowerCase().includes(search.toLowerCase()) || (r.customer_name || '').toLowerCase().includes(search.toLowerCase()));
  const toggleSelect = (id: string) => { const s = new Set(selectedIds); s.has(id) ? s.delete(id) : s.add(id); setSelectedIds(s); };
  const showBankFields = form.paymentType === 'Cheque' || form.paymentType === 'Online';

  if (view === 'list') return (
    <div>
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1F2937]">Receipts</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">{receipts.length} total receipts</p>
        </div>
        <div className="flex gap-2.5">
          {selectedIds.size > 0 && (
            <button onClick={handleBulkDelete} className="flex items-center gap-2 px-4 py-2.5 bg-red-500 text-white text-sm font-medium rounded-xl hover:bg-red-600 transition-colors">
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
            <input type="text" placeholder="Search receipts..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6BED]/20 focus:border-[#4F6BED] transition-colors" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
              <tr>
                <th className="px-4 py-3 w-10"><input type="checkbox" className="w-4 h-4 rounded accent-[#4F6BED]" checked={filtered.length > 0 && selectedIds.size === filtered.length} onChange={e => setSelectedIds(e.target.checked ? new Set(filtered.map(f => f._id)) : new Set())} /></th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Receipt No</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Date</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Customer</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Payment</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide text-right">Amount</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? <SkeletonRow cols={7} />
                : filtered.length === 0 ? <tr><td colSpan={7} className="px-4 py-14 text-center"><Receipt size={36} className="mx-auto mb-3 text-gray-300" /><p className="text-[#6B7280] text-sm font-medium">No receipts found</p></td></tr>
                  : filtered.map(r => {
                    const pb = paymentBadge(r.payment_type);
                    return (
                      <tr key={r._id} className={`hover:bg-[#F9FAFB] transition-colors ${selectedIds.has(r._id) ? 'bg-[#EEF2FF]' : ''}`}>
                        <td className="px-4 py-3.5"><input type="checkbox" className="w-4 h-4 rounded accent-[#4F6BED]" checked={selectedIds.has(r._id)} onChange={() => toggleSelect(r._id)} /></td>
                        <td className="px-4 py-3.5 text-sm font-semibold text-[#4F6BED]">{r.receipt_no}</td>
                        <td className="px-4 py-3.5 text-sm text-[#6B7280]">{new Date(r.date).toLocaleDateString('en-GB')}</td>
                        <td className="px-4 py-3.5 text-sm font-medium text-[#1F2937]">{r.customer_name || '—'}</td>
                        <td className="px-4 py-3.5"><span className="px-2 py-0.5 rounded-lg text-xs font-semibold" style={{ background: pb.bg, color: pb.color }}>{r.payment_type || '—'}</span></td>
                        <td className="px-4 py-3.5 text-sm font-bold text-[#1F2937] text-right">₹{(r.amount || 0).toFixed(2)}</td>
                        <td className="px-4 py-3.5">
                          <div className="flex justify-center gap-1">
                            <button onClick={() => generateReceiptPDF(buildPDF('record', r), 'view')} className="p-1.5 text-[#4F6BED] hover:bg-[#EEF2FF] rounded-lg transition-colors"><Eye size={14} /></button>
                            <button onClick={() => generateReceiptPDF(buildPDF('record', r), 'save')} className="p-1.5 text-[#059669] hover:bg-[#ECFDF5] rounded-lg transition-colors"><Download size={14} /></button>
                            <button onClick={() => handleEdit(r)} className="p-1.5 text-[#D97706] hover:bg-[#FFF7ED] rounded-lg transition-colors"><Edit size={14} /></button>
                            <button onClick={() => handleDelete(r._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 size={14} /></button>
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
          <h2 className="text-2xl font-bold text-[#1F2937]">{editingId ? 'Edit Receipt' : 'New Receipt'}</h2>
        </div>
        <p className="text-sm text-[#6B7280] ml-11">Fill in the receipt details below</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div><label className={labelCls}>Receipt No</label><input readOnly value={form.receiptNo} className={`${inputCls} bg-[#F9FAFB] cursor-not-allowed text-[#9CA3AF]`} /></div>
            <div><label className={labelCls}>Date</label><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required className={inputCls} /></div>
            <div><label className={labelCls}>Branch Location</label><input value={form.branchLocation} onChange={e => setForm({ ...form, branchLocation: e.target.value })} className={inputCls} /></div>
            <div><label className={labelCls}>Service Tax No</label><input value={form.serviceTaxNo} onChange={e => setForm({ ...form, serviceTaxNo: e.target.value })} className={inputCls} /></div>
            <div>
              <label className={labelCls}>Customer</label>
              <select value={form.customerId} onChange={e => handleCustomerChange(e.target.value)} className={inputCls}>
                <option value="">— Select Customer —</option>
                {customers.map(c => <option key={c._id} value={c._id}>{c.first_name} {c.last_name || ''}</option>)}
              </select>
            </div>
            <div><label className={labelCls}>Bill No</label><input value={form.billNo} onChange={e => setForm({ ...form, billNo: e.target.value })} className={inputCls} /></div>
          </div>

          <div><label className={labelCls}>Address</label><textarea rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={`${inputCls} resize-none`} /></div>

          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>GC No (Consignment No)</label><input value={form.gcNo} onChange={e => setForm({ ...form, gcNo: e.target.value })} className={inputCls} /></div>
            <div>
              <label className={labelCls}>Payment Type</label>
              <select value={form.paymentType} onChange={e => setForm({ ...form, paymentType: e.target.value })} className={inputCls}>
                <option value="Cash">Cash</option>
                <option value="Cheque">Cheque</option>
                <option value="Online">Online</option>
              </select>
            </div>
          </div>

          {showBankFields && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-[#F9FAFB] rounded-2xl border border-gray-100">
              <div><label className={labelCls}>Bank Name</label><input value={form.bankName} onChange={e => setForm({ ...form, bankName: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Cheque / Ref No</label><input value={form.chequeNo} onChange={e => setForm({ ...form, chequeNo: e.target.value })} className={inputCls} /></div>
              <div><label className={labelCls}>Cheque Date</label><input type="date" value={form.chequeDate} onChange={e => setForm({ ...form, chequeDate: e.target.value })} className={inputCls} /></div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div><label className={labelCls}>Particulars</label><textarea rows={2} value={form.particulars} onChange={e => setForm({ ...form, particulars: e.target.value })} required className={`${inputCls} resize-none`} /></div>
            <div><label className={labelCls}>Amount (₹)</label><input type="number" min="0" step="0.01" placeholder="0.00" value={form.amount || ''} onChange={e => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} required className={inputCls} /></div>
          </div>

          <div className="flex gap-2.5 pt-2 border-t border-gray-100">
            <button type="submit" className="px-5 py-2.5 bg-[#4F6BED] text-white rounded-xl text-sm font-semibold hover:bg-[#4459d6] transition-colors">{editingId ? 'Update' : 'Save Receipt'}</button>
            <button type="button" onClick={() => generateReceiptPDF(buildPDF('form'), 'view')} className="flex items-center gap-2 px-5 py-2.5 bg-[#EFF6FF] text-[#3B82F6] rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"><Eye size={14} /> Preview PDF</button>
            <button type="button" onClick={() => generateReceiptPDF(buildPDF('form'), 'save')} className="flex items-center gap-2 px-5 py-2.5 bg-[#ECFDF5] text-[#059669] rounded-xl text-sm font-medium hover:bg-green-100 transition-colors"><Download size={14} /> Download PDF</button>
            <button type="button" onClick={() => setView('list')} className="px-5 py-2.5 border border-gray-200 text-[#6B7280] rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors ml-auto">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
