'use client';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut } from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function MainLayoutClient({ children, userName, userRole }: { children: React.ReactNode; userName: string; userRole: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const getPageTitle = () => {
    if (pathname === '/' || pathname === '/dashboard') return 'Dashboard';
    if (pathname.includes('receipt')) return 'Receipt Management';
    if (pathname.includes('users')) return 'User Management';
    if (pathname.includes('customer')) return 'Customer Management';
    if (pathname.includes('estimation')) return 'Estimations';
    if (pathname.includes('quotation')) return 'Quotations';
    if (pathname.includes('orders')) return 'Orders';
    if (pathname.includes('article-items')) return 'Article Items';
    if (pathname.includes('states')) return 'State Master';
    if (pathname.includes('cities')) return 'City Master';
    if (pathname.includes('change-password')) return 'Change Password';
    return 'JS Packers and Movers';
  };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <div className="min-h-screen flex" style={{ background: '#F5F7FB' }}>
      <Sidebar userRole={userRole} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top header */}
        <header
          className="flex items-center justify-between px-6 flex-shrink-0"
          style={{ height: 64, background: '#FFFFFF', borderBottom: '1px solid #E5E7EB' }}
        >
          <div>
            <h1 className="text-lg font-semibold text-[#1F2937]">{getPageTitle()}</h1>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center justify-center rounded-xl text-white text-xs font-bold flex-shrink-0"
                style={{ width: 36, height: 36, background: userRole === 'admin' ? '#4F6BED' : '#059669' }}
              >
                {getInitials(userName || 'U')}
              </div>
              <div className="hidden sm:block">
                <div className="text-sm font-semibold text-[#1F2937] leading-tight">{userName}</div>
                <div className="text-xs text-[#9CA3AF] capitalize">{userRole === 'admin' ? 'Administrator' : 'User'}</div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-[#6B7280] hover:bg-red-50 hover:text-red-600 border border-gray-200 hover:border-red-200"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </header>

        {/* Content area */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
