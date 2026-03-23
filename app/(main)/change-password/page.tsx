'use client';
import { useState } from 'react';
import { Lock, Eye, EyeOff, CheckCircle2, AlertCircle } from 'lucide-react';

const inputCls = 'w-full px-3.5 py-2.5 pr-12 border border-gray-200 rounded-xl text-sm text-[#1F2937] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#4F6BED]/20 focus:border-[#4F6BED] transition-colors';
const labelCls = 'block text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5';

export default function ChangePasswordPage() {
  const [form, setForm] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [show, setShow] = useState({ current: false, new: false, confirm: false });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    if (form.newPassword !== form.confirmPassword) {
      setMessage({ type: 'error', text: 'New password and confirm password do not match.' });
      return;
    }
    if (form.newPassword.length < 6) {
      setMessage({ type: 'error', text: 'New password must be at least 6 characters.' });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: data.message || 'Password changed successfully.' });
        setForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to change password.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const PasswordField = ({ id, value, fieldKey, label, placeholder }: { id: string; value: string; fieldKey: 'current' | 'new' | 'confirm'; label: string; placeholder: string }) => (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="relative">
        <input
          id={id} type={show[fieldKey] ? 'text' : 'password'} required value={value}
          onChange={e => setForm(f => ({ ...f, [fieldKey === 'current' ? 'currentPassword' : fieldKey === 'new' ? 'newPassword' : 'confirmPassword']: e.target.value }))}
          placeholder={placeholder} className={inputCls}
        />
        <button type="button" onClick={() => setShow(s => ({ ...s, [fieldKey]: !s[fieldKey] }))}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition-colors">
          {show[fieldKey] ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );

  return (
    <div className="max-w-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-[#1F2937]">Change Password</h2>
        <p className="text-sm text-[#6B7280] mt-0.5">Update your account password securely</p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {/* Icon header */}
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-gray-100">
          <div className="w-12 h-12 rounded-2xl bg-[#EEF2FF] flex items-center justify-center">
            <Lock size={22} className="text-[#4F6BED]" />
          </div>
          <div>
            <div className="text-sm font-semibold text-[#1F2937]">Security Settings</div>
            <div className="text-xs text-[#6B7280]">Choose a strong password to protect your account</div>
          </div>
        </div>

        {message && (
          <div className={`mb-5 flex items-start gap-3 px-4 py-3 rounded-xl text-sm font-medium ${message.type === 'success' ? 'bg-[#ECFDF5] text-[#059669] border border-green-100' : 'bg-[#FEF2F2] text-red-600 border border-red-100'}`}>
            {message.type === 'success' ? <CheckCircle2 size={16} className="mt-0.5 flex-shrink-0" /> : <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <PasswordField id="currentPassword" value={form.currentPassword} fieldKey="current" label="Current Password" placeholder="Enter your current password" />
          <PasswordField id="newPassword" value={form.newPassword} fieldKey="new" label="New Password" placeholder="Enter new password (min. 6 characters)" />
          <PasswordField id="confirmPassword" value={form.confirmPassword} fieldKey="confirm" label="Confirm New Password" placeholder="Re-enter new password" />

          {form.newPassword && form.confirmPassword && form.newPassword !== form.confirmPassword && (
            <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle size={12} /> Passwords do not match</p>
          )}

          <div className="pt-2">
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-[#4F6BED] text-white rounded-xl text-sm font-semibold hover:bg-[#4459d6] disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
              {loading ? 'Updating Password...' : 'Update Password'}
            </button>
          </div>
        </form>

        <div className="mt-5 p-4 bg-[#F9FAFB] rounded-xl border border-gray-100">
          <p className="text-xs font-semibold text-[#6B7280] mb-2">Password requirements:</p>
          <ul className="text-xs text-[#9CA3AF] space-y-1">
            <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-[#9CA3AF]" /> Minimum 6 characters</li>
            <li className="flex items-center gap-1.5"><div className="w-1 h-1 rounded-full bg-[#9CA3AF]" /> New password must differ from current</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
