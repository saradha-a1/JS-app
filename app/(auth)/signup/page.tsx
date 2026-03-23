'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ username: '', email: '', password: '', full_name: '', role: 'admin' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) { setError(data.error); return; }
    alert('Account created! Please sign in.');
    router.push('/login');
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-[#1e3a5f] mb-6 text-center">Create Account</h2>
        {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}
        <form onSubmit={handleSubmit} className="space-y-4">
          {[['Full Name', 'full_name', 'text'], ['Username', 'username', 'text'], ['Email', 'email', 'email'], ['Password', 'password', 'password']].map(([label, field, type]) => (
            <div key={field}>
              <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
              <input type={type} required value={(form as any)[field]} onChange={e => setForm({ ...form, [field]: e.target.value })}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none" />
            </div>
          ))}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
            <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 outline-none bg-white">
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" disabled={loading} className="w-full py-2.5 bg-[#D9241C] text-white font-medium rounded-lg hover:bg-red-700 transition disabled:opacity-50">
            {loading ? 'Creating...' : 'CREATE ACCOUNT'}
          </button>
        </form>
        <div className="mt-4 text-center">
          <button onClick={() => router.push('/login')} className="text-sm text-[#1e3a5f] hover:underline">Already have an account? Sign in</button>
        </div>
      </div>
    </div>
  );
}
