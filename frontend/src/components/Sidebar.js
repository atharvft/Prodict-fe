import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard, MessageCircle, ListTodo, Timer, BarChart3,
  Target, Settings, LogOut, ChevronLeft, ChevronRight, Sparkles
} from 'lucide-react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/chat', label: 'AI Advisor', icon: MessageCircle },
  { path: '/tasks', label: 'Tasks', icon: ListTodo },
  { path: '/focus', label: 'Focus Room', icon: Timer },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const location = useLocation();

  return (
    <aside
      data-testid="sidebar"
      className={`flex flex-col h-screen border-r border-[#2D372B]/10 bg-[#F2F0EA] transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[240px]'}`}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b border-[#2D372B]/8">
        <div className="w-9 h-9 rounded-xl bg-[#C27A63] flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-5 h-5 text-[#F9F8F6]" />
        </div>
        {!collapsed && (
          <span className="font-['Manrope'] text-xl font-bold text-[#1A1D1A] tracking-tight">AURA</span>
        )}
      </div>

      <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <NavLink
              key={path}
              to={path}
              data-testid={`nav-${label.toLowerCase().replace(/\s/g, '-')}`}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group
                ${isActive
                  ? 'bg-[#C27A63] text-[#F9F8F6] shadow-sm'
                  : 'text-[#575E56] hover:bg-[#E8E5DF] hover:text-[#1A1D1A]'
                }`}
            >
              <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-[#F9F8F6]' : 'text-[#575E56] group-hover:text-[#C27A63]'}`} />
              {!collapsed && <span className="text-sm font-medium font-['Figtree'] truncate">{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t border-[#2D372B]/8 p-3 space-y-2">
        {!collapsed && user && (
          <div className="px-2 py-1">
            <p className="text-sm font-semibold text-[#1A1D1A] font-['Manrope'] truncate">{user.name || 'User'}</p>
            <p className="text-xs text-[#575E56] truncate">{user.email}</p>
          </div>
        )}
        <button
          data-testid="logout-button"
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#D46B6B] hover:bg-[#D46B6B]/10 transition-colors w-full"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sign out</span>}
        </button>
        <button
          data-testid="toggle-sidebar"
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-1.5 rounded-lg hover:bg-[#E8E5DF] text-[#575E56] transition-colors"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
