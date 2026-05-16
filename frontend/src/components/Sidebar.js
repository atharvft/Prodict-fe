import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  LayoutDashboard, MessageCircle, ListTodo, Timer, BarChart3,
  Target, Settings, LogOut, ChevronLeft, ChevronRight, Sun, Moon, CloudMoon
} from 'lucide-react';
import AuraLogo from './AuraLogo';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/chat', label: 'AI Advisor', icon: MessageCircle },
  { path: '/tasks', label: 'Tasks', icon: ListTodo },
  { path: '/focus', label: 'Focus Room', icon: Timer },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/settings', label: 'Settings', icon: Settings },
];

const themeIcons = { light: Sun, moonlight: CloudMoon, dark: Moon };
const themeLabels = { light: 'Light', moonlight: 'Moonlight', dark: 'Dark' };

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const { theme, cycleTheme } = useTheme();
  const location = useLocation();
  const ThemeIcon = themeIcons[theme];

  return (
    <aside
      data-testid="sidebar"
      className={`flex flex-col h-screen border-r transition-all duration-300 ${collapsed ? 'w-[72px]' : 'w-[240px]'}`}
      style={{ borderColor: 'var(--border-color)', background: 'var(--bg-tertiary)' }}
    >
      <div className="flex items-center gap-3 px-4 h-16 border-b" style={{ borderColor: 'var(--border-color)' }}>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ background: 'var(--bg-secondary)' }}>
          <AuraLogo size={32} />
        </div>
        {!collapsed && (
          <span className="font-['Manrope'] text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>AURA</span>
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
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group"
              style={{
                background: isActive ? 'var(--brand-primary)' : 'transparent',
                color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)',
              }}
            >
              <Icon className="w-5 h-5 flex-shrink-0" style={{ color: isActive ? 'var(--text-inverse)' : 'var(--text-secondary)' }} />
              {!collapsed && <span className="text-sm font-medium font-['Figtree'] truncate">{label}</span>}
            </NavLink>
          );
        })}
      </nav>

      <div className="border-t p-3 space-y-2" style={{ borderColor: 'var(--border-color)' }}>
        {/* Theme Toggle */}
        <button
          data-testid="theme-toggle"
          onClick={cycleTheme}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors w-full"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ThemeIcon className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--brand-primary)' }} />
          {!collapsed && <span className="text-sm font-medium">{themeLabels[theme]}</span>}
        </button>

        {!collapsed && user && (
          <div className="px-2 py-1">
            <p className="text-sm font-semibold font-['Manrope'] truncate" style={{ color: 'var(--text-primary)' }}>{user.name || 'User'}</p>
            <p className="text-xs truncate" style={{ color: 'var(--text-secondary)' }}>{user.email}</p>
          </div>
        )}
        <button
          data-testid="logout-button"
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors w-full"
          style={{ color: 'var(--danger)' }}
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="text-sm font-medium">Sign out</span>}
        </button>
        <button
          data-testid="toggle-sidebar"
          onClick={() => setCollapsed(!collapsed)}
          className="flex items-center justify-center w-full py-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
