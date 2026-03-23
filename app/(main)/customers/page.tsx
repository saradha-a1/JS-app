'use client';
import { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit, Trash2, FileUp, X, Users } from 'lucide-react';
import SkeletonRow from '@/components/SkeletonRow';

interface Customer { _id: string; first_name: string; last_name: string; email: string; mobile: string; contact: string; gstin: string; billing_address: string; }
const blank = { first_name: '', last_name: '', email: '', mobile: '', contact: '', gstin: '', billing_address: '' };

const inputCls = 'w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4F6BED]/20 focus:border-[#4F6BED] transition-colors';
const labelCls = 'block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [form, setForm] = useState(blank);
  const [isImporting, setIsImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    const data = await fetch('/api/customers').then(r => r.json());
    setCustomers(data); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      const rows = text.split(/\r?\n/).filter(Boolean);
      if (rows.length < 2) { alert('Empty CSV'); setIsImporting(false); return; }
      const headers = rows[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      const data = rows.slice(1).map(row => {
        const vals = row.split(',');
        const obj: any = {};
        headers.forEach((h, i) => { obj[h] = (vals[i] || '').trim().replace(/^"|"$/g, ''); });
        return {
          first_name: obj.first_name || obj.customer_fname || obj.customer_name || '',
          last_name: obj.last_name || obj.customer_lname || '',
          email: obj.email || obj.customer_email || '',
          mobile: obj.mobile || obj.mobile_number || '',
          contact: obj.contact || '',
          gstin: obj.gstin || '',
          billing_address: obj.billing_address || obj.address || '',
        };
      }).filter(d => d.first_name);
      await Promise.all(data.map(d => fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(d) })));
      alert(`Imported ${data.length} customers!`);
      load(); setIsImporting(false);
      if (fileRef.current) fileRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const openModal = (c?: Customer) => {
    if (c) { setForm({ first_name: c.first_name, last_name: c.last_name || '', email: c.email || '', mobile: c.mobile || '', contact: c.contact || '', gstin: c.gstin || '', billing_address: c.billing_address || '' }); setCurrentId(c._id); setIsEditing(true); }
    else { setForm(blank); setCurrentId(null); setIsEditing(false); }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing && currentId) await fetch(`/api/customers/${currentId}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    else await fetch('/api/customers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
    setShowModal(false); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this customer?')) return;
    await fetch(`/api/customers/${id}`, { method: 'DELETE' }); load();
  };

  const filtered = customers.filter(c =>
    (c.first_name + ' ' + (c.last_name || '')).toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
    (c.mobile || '').includes(search)
  );

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#1F2937]">Customers</h2>
          <p className="text-sm text-[#6B7280] mt-0.5">{customers.length} total customers</p>
        </div>
        <div className="flex gap-2.5">
          <input type="file" accept=".csv" ref={fileRef} className="hidden" onChange={handleFileUpload} />
          <button onClick={() => fileRef.current?.click()} disabled={isImporting}
            className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-[#6B7280] text-sm font-medium rounded-xl hover:bg-gray-50 disabled:opacity-50 transition-colors">
            <FileUp size={15} /> {isImporting ? 'Importing...' : 'Import CSV'}
          </button>
          <button onClick={() => openModal()}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#4F6BED] text-white text-sm font-medium rounded-xl hover:bg-[#4459d6] transition-colors">
            <Plus size={15} /> Add Customer
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {/* Search bar */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative max-w-sm">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input type="text" placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4F6BED]/20 focus:border-[#4F6BED] transition-colors" />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead style={{ background: '#F9FAFB', borderBottom: '1px solid #F3F4F6' }}>
              <tr>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Name</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Mobile</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Email</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">GSTIN</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide">Billing Address</th>
                <th className="px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wide text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <SkeletonRow cols={6} />
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-14 text-center">
                    <Users size={36} className="mx-auto mb-3 text-gray-300" />
                    <p className="text-[#6B7280] text-sm font-medium">No customers found</p>
                    <p className="text-gray-400 text-xs mt-1">Add your first customer to get started</p>
                  </td>
                </tr>
              ) : filtered.map(c => (
                <tr key={c._id} className="hover:bg-[#F9FAFB] transition-colors">
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#EEF2FF] flex items-center justify-center text-xs font-bold text-[#4F6BED] flex-shrink-0">
                        {(c.first_name[0] || '?').toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-[#1F2937]">{c.first_name} {c.last_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 text-sm text-[#6B7280]">{c.mobile || '—'}</td>
                  <td className="px-4 py-3.5 text-sm text-[#6B7280]">{c.email || '—'}</td>
                  <td className="px-4 py-3.5 text-sm text-[#6B7280]">{c.gstin || '—'}</td>
                  <td className="px-4 py-3.5 text-sm text-[#6B7280] max-w-xs truncate">{c.billing_address || '—'}</td>
                  <td className="px-4 py-3.5">
                    <div className="flex justify-center gap-1">
                      <button onClick={() => openModal(c)} className="p-1.5 text-[#4F6BED] hover:bg-[#EEF2FF] rounded-lg transition-colors" title="Edit"><Edit size={15} /></button>
                      <button onClick={() => handleDelete(c._id)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete"><Trash2 size={15} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-[#1F2937]">{isEditing ? 'Edit Customer' : 'Add New Customer'}</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">{isEditing ? 'Update customer details' : 'Fill in the customer information'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors">
                <X size={18} className="text-[#6B7280]" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {([['First Name', 'first_name', true], ['Last Name', 'last_name', false], ['Mobile', 'mobile', false], ['Contact (Alt)', 'contact', false], ['Email', 'email', false], ['GSTIN', 'gstin', false]] as [string, string, boolean][]).map(([label, field, req]) => (
                  <div key={field}>
                    <label className={labelCls}>{label} {req && <span className="text-red-400">*</span>}</label>
                    <input type="text" required={req} value={(form as any)[field]} onChange={e => setForm({ ...form, [field]: e.target.value })} className={inputCls} />
                  </div>
                ))}
                <div className="sm:col-span-2">
                  <label className={labelCls}>Billing Address</label>
                  <textarea rows={2} value={form.billing_address} onChange={e => setForm({ ...form, billing_address: e.target.value })}
                    className={`${inputCls} resize-none`} />
                </div>
              </div>
              <div className="flex justify-end gap-2.5 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-[#6B7280] hover:bg-gray-50 transition-colors">Cancel</button>
                <button type="submit"
                  className="px-5 py-2.5 bg-[#4F6BED] text-white rounded-xl text-sm font-medium hover:bg-[#4459d6] transition-colors">
                  {isEditing ? 'Update Customer' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
