import React, { useState, useEffect } from 'react';
import { distractionAPI } from '../services/api';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { ShieldAlert, Plus, Clock, TrendingDown, Lightbulb, Loader2 } from 'lucide-react';

const CATEGORIES = [
  { key: 'social_media', label: 'Social Media', color: 'var(--danger)' },
  { key: 'entertainment', label: 'Entertainment', color: 'var(--warning)' },
  { key: 'news', label: 'News', color: 'var(--brand-primary)' },
  { key: 'shopping', label: 'Shopping', color: '#A6634D' },
  { key: 'other', label: 'Other', color: 'var(--text-secondary)' },
];
const PIE_COLORS = ['#D46B6B', '#E8B273', '#C27A63', '#A6634D', '#575E56'];

export default function DistractionMonitor() {
  const [data, setData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [showLog, setShowLog] = useState(false);
  const [logForm, setLogForm] = useState({ category: 'social_media', duration_min: 15, app_name: '', notes: '' });
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try { const { data: d } = await distractionAPI.getAll(7); setData(d); } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleLog = async (e) => {
    e.preventDefault(); setLogging(true);
    try { await distractionAPI.log(logForm); setLogForm({ category: 'social_media', duration_min: 15, app_name: '', notes: '' }); setShowLog(false); loadData(); } catch (e) { console.error(e); }
    finally { setLogging(false); }
  };

  const getAnalysis = async () => {
    setAnalyzing(true);
    try { const { data: d } = await distractionAPI.analysis(); setAnalysis(d); } catch (e) { console.error(e); }
    finally { setAnalyzing(false); }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }} /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto" data-testid="distraction-page">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-['Manrope'] text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Distraction Monitor</h1>
          <p className="font-['Figtree'] mt-1" style={{ color: 'var(--text-secondary)' }}>Track and reduce your distractions for better focus.</p>
        </div>
        <div className="flex gap-2">
          <button data-testid="log-distraction-toggle" onClick={() => setShowLog(!showLog)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm shadow-sm" style={{ background: 'var(--brand-primary)', color: 'var(--text-inverse)' }}>
            <Plus className="w-4 h-4" /> Log Distraction
          </button>
          <button data-testid="get-analysis-button" onClick={getAnalysis} disabled={analyzing} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm disabled:opacity-50" style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lightbulb className="w-4 h-4" />} AI Insights
          </button>
        </div>
      </div>

      {showLog && (
        <form onSubmit={handleLog} className="rounded-2xl p-6 mb-6 animate-fade-in-up" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} data-testid="log-distraction-form">
          <h3 className="font-['Manrope'] text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Log a Distraction</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <select data-testid="distraction-category" value={logForm.category} onChange={(e) => setLogForm({...logForm, category: e.target.value})} className="px-4 py-3 rounded-xl outline-none font-['Figtree'] text-sm t-input">
              {CATEGORIES.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <div className="flex items-center gap-2">
              <input data-testid="distraction-duration" type="number" min="1" value={logForm.duration_min} onChange={(e) => setLogForm({...logForm, duration_min: parseInt(e.target.value) || 1})} className="flex-1 px-4 py-3 rounded-xl outline-none font-['Figtree'] text-sm t-input" />
              <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>min</span>
            </div>
            <input data-testid="distraction-app" value={logForm.app_name} onChange={(e) => setLogForm({...logForm, app_name: e.target.value})} placeholder="App/Site (e.g. Instagram)" className="px-4 py-3 rounded-xl outline-none font-['Figtree'] text-sm t-input" />
            <input value={logForm.notes} onChange={(e) => setLogForm({...logForm, notes: e.target.value})} placeholder="Notes (optional)" className="px-4 py-3 rounded-xl outline-none font-['Figtree'] text-sm t-input" />
          </div>
          <div className="flex justify-end mt-4">
            <button data-testid="log-distraction-submit" type="submit" disabled={logging} className="px-5 py-2.5 rounded-xl font-medium text-sm shadow-sm disabled:opacity-50" style={{ background: 'var(--brand-primary)', color: 'var(--text-inverse)' }}>
              {logging ? 'Logging...' : 'Log Distraction'}
            </button>
          </div>
        </form>
      )}

      {analysis && (
        <div className="rounded-2xl p-6 mb-6 animate-fade-in-up" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} data-testid="distraction-analysis">
          <h3 className="font-['Manrope'] text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Lightbulb className="w-5 h-5" style={{ color: 'var(--warning)' }} /> AI Distraction Analysis
          </h3>
          <p className="text-sm font-['Figtree'] leading-relaxed mb-4" style={{ color: 'var(--text-primary)' }}>{analysis.analysis}</p>
          {analysis.tips?.length > 0 && (
            <div className="space-y-2">
              {analysis.tips.map((tip, i) => (
                <div key={i} className="flex items-start gap-2 p-3 rounded-xl text-sm font-['Figtree']" style={{ background: 'color-mix(in srgb, var(--success) 10%, var(--bg-primary))', color: 'var(--text-primary)' }}>
                  <TrendingDown className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--success)' }} /> {tip}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} data-testid="distraction-total">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs tracking-[0.15em] uppercase font-semibold" style={{ color: 'var(--text-secondary)' }}>Total Wasted</span>
            <Clock className="w-5 h-5" style={{ color: 'var(--danger)' }} />
          </div>
          <p className="font-['Manrope'] text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{data?.total_minutes || 0}m</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs tracking-[0.15em] uppercase font-semibold" style={{ color: 'var(--text-secondary)' }}>Entries</span>
            <ShieldAlert className="w-5 h-5" style={{ color: 'var(--warning)' }} />
          </div>
          <p className="font-['Manrope'] text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{data?.logs?.length || 0}</p>
        </div>
        <div className="rounded-2xl p-5" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs tracking-[0.15em] uppercase font-semibold" style={{ color: 'var(--text-secondary)' }}>Avg / Day</span>
            <TrendingDown className="w-5 h-5" style={{ color: 'var(--brand-primary)' }} />
          </div>
          <p className="font-['Manrope'] text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{data?.total_minutes ? Math.round(data.total_minutes / 7) : 0}m</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="rounded-2xl p-6" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} data-testid="distraction-daily-chart">
          <h3 className="font-['Manrope'] text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Daily Distraction Time</h3>
          {data?.daily_totals?.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data.daily_totals}>
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: 'var(--text-secondary)', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', borderRadius: 12, fontFamily: 'Figtree' }} />
                <Bar dataKey="minutes" fill="#D46B6B" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center py-12 font-['Figtree']" style={{ color: 'var(--text-secondary)' }}>Log distractions to see trends</p>}
        </div>
        <div className="rounded-2xl p-6" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} data-testid="distraction-category-chart">
          <h3 className="font-['Manrope'] text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>By Category</h3>
          {data?.by_category?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart><Pie data={data.by_category} dataKey="minutes" nameKey="category" cx="50%" cy="50%" outerRadius={75} innerRadius={40} paddingAngle={4}>
                  {data.by_category.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie><Tooltip /></PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {data.by_category.map((c, i) => <span key={c.category} className="flex items-center gap-1.5 text-xs" style={{ color: 'var(--text-secondary)' }}><span className="w-3 h-3 rounded-sm" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />{c.category.replace('_', ' ')} ({c.minutes}m)</span>)}
              </div>
            </>
          ) : <p className="text-center py-12 font-['Figtree']" style={{ color: 'var(--text-secondary)' }}>No data yet</p>}
        </div>
      </div>

      {data?.logs?.length > 0 && (
        <div className="rounded-2xl p-6" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} data-testid="distraction-log-list">
          <h3 className="font-['Manrope'] text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Recent Distractions</h3>
          <div className="space-y-2">
            {data.logs.slice(0, 15).map((d) => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: 'var(--danger)' }} />
                <div className="flex-1">
                  <p className="text-sm font-medium font-['Figtree']" style={{ color: 'var(--text-primary)' }}>{d.app_name || d.category.replace('_', ' ')}</p>
                  {d.notes && <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{d.notes}</p>}
                </div>
                <span className="text-sm font-['JetBrains_Mono']" style={{ color: 'var(--danger)' }}>{d.duration_min}m</span>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{d.created_at?.slice(5, 10)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
