import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { User, Clock, Bell, Save, CheckCircle2, Palette, Sun, CloudMoon, Moon } from 'lucide-react';

const themeOptions = [
  { key: 'light', label: 'Light', icon: Sun, desc: 'Clean, warm tones' },
  { key: 'moonlight', label: 'Moonlight', icon: CloudMoon, desc: 'Soft blue-grey dusk' },
  { key: 'dark', label: 'Dark', icon: Moon, desc: 'Deep charcoal' },
];

export default function Settings() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState({ name: '', productive_hours_start: '09:00', productive_hours_end: '17:00', nudge_enabled: true, focus_duration: 25, break_duration: 5 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { loadSettings(); }, []);

  const loadSettings = async () => {
    try {
      const { data } = await settingsAPI.get();
      setSettings({
        name: data.name || '',
        productive_hours_start: data.preferences?.productive_hours_start || '09:00',
        productive_hours_end: data.preferences?.productive_hours_end || '17:00',
        nudge_enabled: data.preferences?.nudge_enabled !== false,
        focus_duration: data.preferences?.focus_duration || 25,
        break_duration: data.preferences?.break_duration || 5,
      });
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await settingsAPI.update(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { console.error(e); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }} /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto" data-testid="settings-page">
      <div className="mb-8">
        <h1 className="font-['Manrope'] text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Settings</h1>
        <p className="font-['Figtree'] mt-1" style={{ color: 'var(--text-secondary)' }}>Customize Prodict AI to fit your workflow.</p>
      </div>

      <div className="space-y-6">
        {/* Theme Selection */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} data-testid="theme-settings">
          <h3 className="font-['Manrope'] text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Palette className="w-5 h-5" style={{ color: 'var(--brand-primary)' }} /> Appearance
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {themeOptions.map(({ key, label, icon: Icon, desc }) => (
              <button
                key={key}
                data-testid={`theme-${key}`}
                onClick={() => setTheme(key)}
                className="p-4 rounded-xl text-left transition-all duration-200"
                style={{
                  background: theme === key ? 'color-mix(in srgb, var(--brand-primary) 12%, var(--bg-primary))' : 'var(--bg-tertiary)',
                  border: theme === key ? '2px solid var(--brand-primary)' : '2px solid transparent',
                }}
              >
                <Icon className="w-6 h-6 mb-2" style={{ color: theme === key ? 'var(--brand-primary)' : 'var(--text-secondary)' }} />
                <p className="text-sm font-semibold font-['Manrope']" style={{ color: 'var(--text-primary)' }}>{label}</p>
                <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Profile */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} data-testid="profile-settings">
          <h3 className="font-['Manrope'] text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <User className="w-5 h-5" style={{ color: 'var(--brand-primary)' }} /> Profile
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs tracking-[0.15em] uppercase font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Name</label>
              <input data-testid="settings-name" value={settings.name} onChange={(e) => setSettings({...settings, name: e.target.value})}
                className="w-full px-4 py-3 rounded-xl outline-none transition-all font-['Figtree'] t-input" />
            </div>
            <div>
              <label className="block text-xs tracking-[0.15em] uppercase font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Email</label>
              <input value={user?.email || ''} disabled
                className="w-full px-4 py-3 rounded-xl font-['Figtree'] cursor-not-allowed"
                style={{ background: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)' }} />
            </div>
          </div>
        </div>

        {/* Productivity */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} data-testid="productivity-settings">
          <h3 className="font-['Manrope'] text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Clock className="w-5 h-5" style={{ color: 'var(--success)' }} /> Productivity
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-[0.15em] uppercase font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Productive Hours Start</label>
              <input data-testid="settings-hours-start" type="time" value={settings.productive_hours_start}
                onChange={(e) => setSettings({...settings, productive_hours_start: e.target.value})}
                className="w-full px-4 py-3 rounded-xl outline-none font-['Figtree'] t-input" />
            </div>
            <div>
              <label className="block text-xs tracking-[0.15em] uppercase font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Productive Hours End</label>
              <input data-testid="settings-hours-end" type="time" value={settings.productive_hours_end}
                onChange={(e) => setSettings({...settings, productive_hours_end: e.target.value})}
                className="w-full px-4 py-3 rounded-xl outline-none font-['Figtree'] t-input" />
            </div>
            <div>
              <label className="block text-xs tracking-[0.15em] uppercase font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Focus Duration (min)</label>
              <input data-testid="settings-focus-duration" type="number" value={settings.focus_duration}
                onChange={(e) => setSettings({...settings, focus_duration: parseInt(e.target.value) || 25})}
                className="w-full px-4 py-3 rounded-xl outline-none font-['Figtree'] t-input" />
            </div>
            <div>
              <label className="block text-xs tracking-[0.15em] uppercase font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Break Duration (min)</label>
              <input data-testid="settings-break-duration" type="number" value={settings.break_duration}
                onChange={(e) => setSettings({...settings, break_duration: parseInt(e.target.value) || 5})}
                className="w-full px-4 py-3 rounded-xl outline-none font-['Figtree'] t-input" />
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="rounded-2xl p-6" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} data-testid="notification-settings">
          <h3 className="font-['Manrope'] text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Bell className="w-5 h-5" style={{ color: 'var(--warning)' }} /> Notifications
          </h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input data-testid="settings-nudge-toggle" type="checkbox" checked={settings.nudge_enabled}
                onChange={(e) => setSettings({...settings, nudge_enabled: e.target.checked})}
                className="sr-only peer" />
              <div className="w-11 h-6 rounded-full transition-colors peer-checked:bg-[--success]" style={{ background: settings.nudge_enabled ? 'var(--success)' : 'var(--bg-secondary)' }} />
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
            </div>
            <span className="text-sm font-['Figtree']" style={{ color: 'var(--text-primary)' }}>Enable AI nudges and reminders</span>
          </label>
        </div>

        <button data-testid="settings-save-button" onClick={handleSave} disabled={saving}
          className="w-full py-3 px-4 rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50"
          style={{ background: saved ? 'var(--success)' : 'var(--brand-primary)', color: 'var(--text-inverse)' }}>
          {saved ? <><CheckCircle2 className="w-5 h-5" /> Saved!</> : saving ? 'Saving...' : <><Save className="w-5 h-5" /> Save Settings</>}
        </button>
      </div>
    </div>
  );
}
