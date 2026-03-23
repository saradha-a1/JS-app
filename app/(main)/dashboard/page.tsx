'use client';
import { useEffect, useState } from 'react';
import { Users, ShieldCheck, ShoppingCart, Clock, Truck, PackageCheck, UserCheck } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState({ adminCount: 0, userCount: 0, totalUsers: 0, totalCustomers: 0, totalOrders: 0, shipped: 0, delivered: 0, processing: 0 });

  useEffect(() => {
    fetch('/api/dashboard').then(r => r.json()).then(d => setStats(d));
  }, []);

  const cards = [
    {
      title: 'Admin Accounts', value: stats.adminCount,
      icon: ShieldCheck, iconBg: '#EEF2FF', iconColor: '#4F6BED',
      description: 'Administrator accounts', valueBg: '#4F6BED',
    },
    {
      title: 'User Accounts', value: stats.userCount,
      icon: UserCheck, iconBg: '#F0FDFA', iconColor: '#0D9488',
      description: 'Standard user accounts', valueBg: '#0D9488',
    },
    {
      title: 'Total Customers', value: stats.totalCustomers,
      icon: Users, iconBg: '#ECFDF5', iconColor: '#059669',
      description: 'Registered customers', valueBg: '#059669',
    },
    {
      title: 'Total Orders', value: stats.totalOrders,
      icon: ShoppingCart, iconBg: '#EFF6FF', iconColor: '#3B82F6',
      description: 'All-time orders placed', valueBg: '#3B82F6',
    },
    {
      title: 'Processing', value: stats.processing,
      icon: Clock, iconBg: '#FFF7ED', iconColor: '#D97706',
      description: 'Currently in progress', valueBg: '#D97706',
    },
    {
      title: 'Shipped', value: stats.shipped,
      icon: Truck, iconBg: '#F0FDFA', iconColor: '#0D9488',
      description: 'On the way', valueBg: '#0D9488',
    },
    {
      title: 'Delivered', value: stats.delivered,
      icon: PackageCheck, iconBg: '#F0FDF4', iconColor: '#16A34A',
      description: 'Successfully delivered', valueBg: '#16A34A',
    },
  ];

  const adminPct = stats.totalUsers > 0 ? Math.round((stats.adminCount / stats.totalUsers) * 100) : 0;
  const userPct = stats.totalUsers > 0 ? Math.round((stats.userCount / stats.totalUsers) * 100) : 0;

  return (
    <div>
      {/* Welcome banner */}
      <div
        className="rounded-2xl p-6 mb-6 flex items-center justify-between"
        style={{ background: 'linear-gradient(135deg, #4F6BED 0%, #6366f1 100%)' }}
      >
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Welcome back! 👋</h2>
          <p className="text-blue-100 text-sm">Here&apos;s what&apos;s happening with your business today.</p>
        </div>
        <div className="hidden sm:block text-right">
          <div className="text-blue-100 text-xs mb-1">JS Packers & Movers</div>
          <div className="text-white text-sm font-medium">ERP Management System</div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-6">
        {cards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{ width: 44, height: 44, background: card.iconBg }}
                >
                  <Icon size={20} style={{ color: card.iconColor }} />
                </div>
                <span
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                  style={{ background: card.valueBg }}
                >
                  {card.title}
                </span>
              </div>
              <div className="text-3xl font-bold text-[#1F2937] mb-0.5">{card.value}</div>
              <div className="text-xs text-[#6B7280]">{card.description}</div>
            </div>
          );
        })}
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {/* Account Distribution */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#1F2937] mb-1">Account Distribution</h3>
          <p className="text-xs text-[#9CA3AF] mb-5">Total {stats.totalUsers} account{stats.totalUsers !== 1 ? 's' : ''}</p>
          <div className="space-y-4">
            {/* Admin row */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#4F6BED] inline-block" />
                  <span className="text-sm text-[#374151] font-medium">Admin</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#1F2937]">{stats.adminCount}</span>
                  <span className="text-xs text-[#9CA3AF]">{adminPct}%</span>
                </div>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#EEF2FF]">
                <div className="h-2.5 rounded-full bg-[#4F6BED] transition-all duration-700" style={{ width: `${adminPct}%` }} />
              </div>
            </div>
            {/* User row */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#0D9488] inline-block" />
                  <span className="text-sm text-[#374151] font-medium">User</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-[#1F2937]">{stats.userCount}</span>
                  <span className="text-xs text-[#9CA3AF]">{userPct}%</span>
                </div>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#F0FDFA]">
                <div className="h-2.5 rounded-full bg-[#0D9488] transition-all duration-700" style={{ width: `${userPct}%` }} />
              </div>
            </div>
            {/* Stacked bar */}
            <div className="mt-4 flex rounded-full overflow-hidden h-4">
              <div className="bg-[#4F6BED] transition-all duration-700 flex items-center justify-center" style={{ width: `${adminPct}%` }}>
                {adminPct >= 20 && <span className="text-[9px] font-bold text-white">Admin</span>}
              </div>
              <div className="bg-[#0D9488] transition-all duration-700 flex items-center justify-center flex-1">
                {userPct >= 20 && <span className="text-[9px] font-bold text-white">User</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Order Status Overview */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#1F2937] mb-4">Order Status Overview</h3>
          <div className="space-y-3">
            {[
              { label: 'Processing', value: stats.processing, total: stats.totalOrders, color: '#D97706', bg: '#FFF7ED' },
              { label: 'Shipped',    value: stats.shipped,    total: stats.totalOrders, color: '#0D9488', bg: '#F0FDFA' },
              { label: 'Delivered',  value: stats.delivered,  total: stats.totalOrders, color: '#16A34A', bg: '#F0FDF4' },
            ].map(item => (
              <div key={item.label}>
                <div className="flex justify-between items-center mb-1.5">
                  <span className="text-sm text-[#6B7280]">{item.label}</span>
                  <span className="text-sm font-semibold text-[#1F2937]">{item.value}</span>
                </div>
                <div className="w-full h-2 rounded-full" style={{ background: item.bg }}>
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ background: item.color, width: stats.totalOrders > 0 ? `${(item.value / stats.totalOrders) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <h3 className="text-sm font-semibold text-[#1F2937] mb-4">Quick Summary</h3>
          <div className="space-y-3">
            {[
              { label: 'Total Orders',      value: `${stats.totalOrders} orders`,      color: '#4F6BED' },
              { label: 'Active Customers',  value: `${stats.totalCustomers} customers`, color: '#059669' },
              { label: 'Completion Rate',   value: stats.totalOrders > 0 ? `${Math.round((stats.delivered / stats.totalOrders) * 100)}%` : '0%', color: '#16A34A' },
              { label: 'Total Accounts',    value: `${stats.adminCount} admin · ${stats.userCount} user`, color: '#7C3AED' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#F9FAFB' }}>
                <span className="text-sm text-[#6B7280]">{item.label}</span>
                <span className="text-sm font-bold" style={{ color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
