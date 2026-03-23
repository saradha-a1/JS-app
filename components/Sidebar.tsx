'use client';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  Home, FileText, ClipboardList, Users, ShoppingCart,
  Receipt, KeyRound, Settings, ChevronDown, ChevronRight,
  Archive, Map, Building2, UserCog, PanelLeftClose, PanelLeftOpen,
} from 'lucide-react';

const NAV_ITEMS = [
  { id: '/dashboard',       label: 'Dashboard',      icon: Home,          iconBg: '#EEF2FF', iconColor: '#4F6BED' },
  { id: '/estimations',     label: 'Estimation',      icon: FileText,      iconBg: '#FFF7ED', iconColor: '#D97706' },
  { id: '/quotations',      label: 'Quotation',       icon: ClipboardList, iconBg: '#F5F3FF', iconColor: '#7C3AED' },
  { id: '/customers',       label: 'Customer',        icon: Users,         iconBg: '#ECFDF5', iconColor: '#059669' },
  { id: '/orders',          label: 'Orders',          icon: ShoppingCart,  iconBg: '#FFF1F2', iconColor: '#E11D48' },
  { id: '/receipts',        label: 'Receipt',         icon: Receipt,       iconBg: '#ECFEFF', iconColor: '#0891B2' },
  { id: '/change-password', label: 'Change Password', icon: KeyRound,      iconBg: '#F1F5F9', iconColor: '#475569' },
];

const MASTER_ITEMS_ALL = [
  { id: '/article-items', label: 'Article Items', icon: Archive,   iconBg: '#FFF7ED', iconColor: '#EA580C', adminOnly: false },
  { id: '/users',         label: 'Users',         icon: UserCog,   iconBg: '#EEF2FF', iconColor: '#4338CA', adminOnly: true  },
  { id: '/states',        label: 'State',         icon: Map,       iconBg: '#F0FDFA', iconColor: '#0D9488', adminOnly: false },
  { id: '/cities',        label: 'City',          icon: Building2, iconBg: '#FDF2F8', iconColor: '#DB2777', adminOnly: false },
];

export default function Sidebar({ userRole }: { userRole: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [masterOpen, setMasterOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isAdmin = userRole === 'admin';
  const MASTER_ITEMS = MASTER_ITEMS_ALL.filter(i => !i.adminOnly || isAdmin);

  const isActive = (path: string) => pathname === path || pathname.startsWith(path + '/');
  const isMasterActive = MASTER_ITEMS.some(i => isActive(i.id));

  return (
    <div
      className="flex flex-col h-screen flex-shrink-0 transition-all duration-300 overflow-hidden"
      style={{ width: collapsed ? 64 : 248, background: '#FFFFFF', borderRight: '1px solid #E5E7EB' }}
    >
      {/* Brand */}
      <div className="flex items-center h-[64px] flex-shrink-0 px-3 gap-3" style={{ borderBottom: '1px solid #F3F4F6' }}>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-9 h-9 rounded-xl hover:bg-[#F5F7FB] transition-colors flex-shrink-0 text-[#6B7280]"
          title="Toggle sidebar"
        >
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
        {!collapsed && (
          <div>
            <div className="text-sm font-bold text-[#1F2937] leading-tight">JS Packers</div>
            <div className="text-xs text-[#9CA3AF]">& Movers ERP</div>
          </div>
        )}
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="px-3 pt-2.5 pb-1">
          <span
            className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={isAdmin
              ? { background: '#EEF2FF', color: '#4F6BED' }
              : { background: '#ECFDF5', color: '#059669' }
            }
          >
            {isAdmin ? 'Admin' : 'User'}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2.5 py-2 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          const active = isActive(item.id);
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.id)}
              title={collapsed ? item.label : undefined}
              className={`w-full flex items-center gap-3 rounded-xl transition-all text-sm font-medium ${
                active ? 'bg-[#4F6BED] text-white shadow-sm' : 'text-[#6B7280] hover:bg-[#F5F7FB] hover:text-[#1F2937]'
              }`}
              style={{ padding: collapsed ? '8px 10px' : '8px 12px' }}
            >
              <span
                className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0"
                style={{ background: active ? 'rgba(255,255,255,0.2)' : item.iconBg }}
              >
                <Icon size={15} style={{ color: active ? '#ffffff' : item.iconColor }} />
              </span>
              {!collapsed && <span className="truncate text-left">{item.label}</span>}
            </button>
          );
        })}

        {/* Master Section */}
        <div>
          <button
            onClick={() => { if (!collapsed) setMasterOpen(!masterOpen); }}
            title={collapsed ? 'Master' : undefined}
            className={`w-full flex items-center gap-3 rounded-xl transition-all text-sm font-medium ${
              isMasterActive ? 'bg-[#4F6BED] text-white shadow-sm' : 'text-[#6B7280] hover:bg-[#F5F7FB] hover:text-[#1F2937]'
            }`}
            style={{ padding: collapsed ? '8px 10px' : '8px 12px' }}
          >
            <span
              className="flex items-center justify-center w-7 h-7 rounded-lg flex-shrink-0"
              style={{ background: isMasterActive ? 'rgba(255,255,255,0.2)' : '#F1F5F9' }}
            >
              <Settings size={15} style={{ color: isMasterActive ? '#ffffff' : '#64748B' }} />
            </span>
            {!collapsed && (
              <>
                <span className="flex-1 text-left truncate">Master</span>
                {masterOpen
                  ? <ChevronDown size={13} className="flex-shrink-0 opacity-60" />
                  : <ChevronRight size={13} className="flex-shrink-0 opacity-60" />
                }
              </>
            )}
          </button>

          {masterOpen && !collapsed && (
            <div className="mt-0.5 ml-3 space-y-0.5 pl-2" style={{ borderLeft: '2px solid #E5E7EB' }}>
              {MASTER_ITEMS.map(item => {
                const Icon = item.icon;
                const active = isActive(item.id);
                return (
                  <button
                    key={item.id}
                    onClick={() => router.push(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-sm font-medium ${
                      active ? 'bg-[#4F6BED] text-white shadow-sm' : 'text-[#6B7280] hover:bg-[#F5F7FB] hover:text-[#1F2937]'
                    }`}
                  >
                    <span
                      className="flex items-center justify-center w-6 h-6 rounded-lg flex-shrink-0"
                      style={{ background: active ? 'rgba(255,255,255,0.2)' : item.iconBg }}
                    >
                      <Icon size={13} style={{ color: active ? '#ffffff' : item.iconColor }} />
                    </span>
                    <span className="truncate text-xs">{item.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="px-4 py-3 text-[10px] text-[#9CA3AF]" style={{ borderTop: '1px solid #F3F4F6' }}>
          v1.0.0 &copy; 2025 JS Packers
        </div>
      )}
    </div>
  );
}
