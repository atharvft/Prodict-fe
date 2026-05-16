import React, { useState, useEffect } from 'react';
import { settingsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Settings as SettingsIcon, User, Clock, Bell, Save, CheckCircle2 } from 'lucide-react';

export default function Settings() {
  const { user } = useAuth();
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

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-[#C27A63] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-3xl mx-auto" data-testid="settings-page">
      <div className="mb-8">
        <h1 className="font-['Manrope'] text-3xl font-bold text-[#1A1D1A] tracking-tight">Settings</h1>
        <p className="text-[#575E56] font-['Figtree'] mt-1">Customize AURA to fit your workflow.</p>
      </div>

      <div className="space-y-6">
        <div className="bg-[#F9F8F6] border border-[#2D372B]/10 rounded-2xl p-6" data-testid="profile-settings">
          <h3 className="font-['Manrope'] text-lg font-semibold text-[#1A1D1A] mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-[#C27A63]" /> Profile
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs tracking-[0.15em] uppercase font-semibold text-[#575E56] mb-2">Name</label>
              <input data-testid="settings-name" value={settings.name} onChange={(e) => setSettings({...settings, name: e.target.value})}
                className="w-full px-4 py-3 bg-[#F2F0EA] border border-[#2D372B]/10 rounded-xl focus:bg-[#F9F8F6] focus:border-[#C27A63] focus:ring-2 focus:ring-[#C27A63]/20 outline-none transition-all font-['Figtree']" />
            </div>
            <div>
              <label className="block text-xs tracking-[0.15em] uppercase font-semibold text-[#575E56] mb-2">Email</label>
              <input value={user?.email || ''} disabled
                className="w-full px-4 py-3 bg-[#E8E5DF] border border-[#2D372B]/10 rounded-xl font-['Figtree'] text-[#575E56] cursor-not-allowed" />
            </div>
          </div>
        </div>

        <div className="bg-[#F9F8F6] border border-[#2D372B]/10 rounded-2xl p-6" data-testid="productivity-settings">
          <h3 className="font-['Manrope'] text-lg font-semibold text-[#1A1D1A] mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#8BA38A]" /> Productivity
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs tracking-[0.15em] uppercase font-semibold text-[#575E56] mb-2">Productive Hours Start</label>
              <input data-testid="settings-hours-start" type="time" value={settings.productive_hours_start}
                onChange={(e) => setSettings({...settings, productive_hours_start: e.target.value})}
                className="w-full px-4 py-3 bg-[#F2F0EA] border border-[#2D372B]/10 rounded-xl focus:border-[#C27A63] outline-none font-['Figtree']" />
            </div>
            <div>
              <label className="block text-xs tracking-[0.15em] uppercase font-semibold text-[#575E56] mb-2">Productive Hours End</label>
              <input data-testid="settings-hours-end" type="time" value={settings.productive_hours_end}
                onChange={(e) => setSettings({...settings, productive_hours_end: e.target.value})}
                className="w-full px-4 py-3 bg-[#F2F0EA] border border-[#2D372B]/10 rounded-xl focus:border-[#C27A63] outline-none font-['Figtree']" />
            </div>
            <div>
              <label className="block text-xs tracking-[0.15em] uppercase font-semibold text-[#575E56] mb-2">Focus Duration (min)</label>
              <input data-testid="settings-focus-duration" type="number" value={settings.focus_duration}
                onChange={(e) => setSettings({...settings, focus_duration: parseInt(e.target.value) || 25})}
                className="w-full px-4 py-3 bg-[#F2F0EA] border border-[#2D372B]/10 rounded-xl focus:border-[#C27A63] outline-none font-['Figtree']" />
            </div>
            <div>
              <label className="block text-xs tracking-[0.15em] uppercase font-semibold text-[#575E56] mb-2">Break Duration (min)</label>
              <input data-testid="settings-break-duration" type="number" value={settings.break_duration}
                onChange={(e) => setSettings({...settings, break_duration: parseInt(e.target.value) || 5})}
                className="w-full px-4 py-3 bg-[#F2F0EA] border border-[#2D372B]/10 rounded-xl focus:border-[#C27A63] outline-none font-['Figtree']" />
            </div>
          </div>
        </div>

        <div className="bg-[#F9F8F6] border border-[#2D372B]/10 rounded-2xl p-6" data-testid="notification-settings">
          <h3 className="font-['Manrope'] text-lg font-semibold text-[#1A1D1A] mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#E8B273]" /> Notifications
          </h3>
          <label className="flex items-center gap-3 cursor-pointer">
            <div className="relative">
              <input data-testid="settings-nudge-toggle" type="checkbox" checked={settings.nudge_enabled}
                onChange={(e) => setSettings({...settings, nudge_enabled: e.target.checked})}
                className="sr-only peer" />
              <div className="w-11 h-6 bg-[#E8E5DF] rounded-full peer-checked:bg-[#8BA38A] transition-colors" />
              <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-5" />
            </div>
            <span className="text-sm text-[#1A1D1A] font-['Figtree']">Enable AI nudges and reminders</span>
          </label>
        </div>

        <button data-testid="settings-save-button" onClick={handleSave} disabled={saving}
          className={`w-full py-3 px-4 rounded-xl font-medium transition-all shadow-sm flex items-center justify-center gap-2 ${
            saved ? 'bg-[#8BA38A] text-[#F9F8F6]' : 'bg-[#C27A63] text-[#F9F8F6] hover:bg-[#A6634D]'
          } disabled:opacity-50`}>
          {saved ? <><CheckCircle2 className="w-5 h-5" /> Saved!</> : saving ? 'Saving...' : <><Save className="w-5 h-5" /> Save Settings</>}
        </button>
      </div>
    </div>
  );
}
