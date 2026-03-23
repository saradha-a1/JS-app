'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || 'Login failed'); setLoading(false); return; }
      router.push('/dashboard');
    } catch {
      setError('Network error'); setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl w-full items-center">
        <div className="flex justify-center">
          <svg viewBox="0 0 400 300" className="w-full max-w-md h-auto">
            <defs>
              <linearGradient id="tg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#D9241C', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#a31a14', stopOpacity: 1 }} />
              </linearGradient>
            </defs>
            <ellipse cx="200" cy="280" rx="160" ry="30" fill="#d1d5db" opacity="0.5" />
            <rect x="80" y="140" width="240" height="100" rx="8" fill="url(#tg)" />
            <rect x="280" y="160" width="60" height="80" fill="url(#tg)" />
            <rect x="300" y="150" width="40" height="20" fill="#e0e7ff" />
            <circle cx="130" cy="245" r="25" fill="#1f2937" /><circle cx="130" cy="245" r="15" fill="#4b5563" /><circle cx="130" cy="245" r="8" fill="#9ca3af" />
            <circle cx="280" cy="245" r="25" fill="#1f2937" /><circle cx="280" cy="245" r="15" fill="#4b5563" /><circle cx="280" cy="245" r="8" fill="#9ca3af" />
          </svg>
        </div>
        <div>
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-6">
              <div className="text-2xl font-bold text-[#1e3a5f]">JS PACKERS</div>
              <div className="text-sm text-gray-500">ERP Management System</div>
            </div>
            {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <input type="text" value={formData.username} onChange={e => setFormData({ ...formData, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" placeholder="Enter username" required disabled={loading} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input type="password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none" placeholder="Enter password" required disabled={loading} />
              </div>
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-[#1e3a5f] text-white font-medium rounded-lg hover:bg-[#2d4a6f] transition disabled:opacity-50">
                {loading ? 'Signing in...' : 'SIGN IN'}
              </button>
            </form>
            <div className="mt-4 text-center">
              <button onClick={() => router.push('/signup')} className="text-sm text-[#1e3a5f] hover:underline">Create New Account</button>
            </div>
          </div>
          <p className="text-center mt-4 text-sm text-gray-500">© 2025 JS Packers and Movers. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
