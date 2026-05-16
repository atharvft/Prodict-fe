import React, { useState, useEffect } from 'react';
import { analyticsAPI } from '../services/api';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { BarChart3, Clock, Flame, AlertTriangle, Activity, FileText, Award, Loader2, TrendingUp } from 'lucide-react';

const COLORS = ['#C27A63', '#8BA38A', '#E8B273', '#575E56', '#D46B6B', '#A6634D'];

export default function Analytics() {
  const [weekly, setWeekly] = useState(null);
  const [procrastination, setProcrastination] = useState(null);
  const [burnout, setBurnout] = useState(null);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingReport, setLoadingReport] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => { loadAnalytics(); }, []);

  const loadAnalytics = async () => {
    try {
      const [w, p, b] = await Promise.allSettled([analyticsAPI.weekly(), analyticsAPI.procrastination(), analyticsAPI.burnout()]);
      if (w.status === 'fulfilled') setWeekly(w.value.data);
      if (p.status === 'fulfilled') setProcrastination(p.value.data);
      if (b.status === 'fulfilled') setBurnout(b.value.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const generateReport = async () => {
    setLoadingReport(true);
    try {
      const { data } = await analyticsAPI.weeklyReport();
      setReport(data);
      setShowReport(true);
    } catch (e) { console.error(e); }
    finally { setLoadingReport(false); }
  };

  const burnoutColor = (level) => ({ low: 'var(--success)', medium: 'var(--warning)', high: 'var(--danger)' }[level] || 'var(--success)');
  const gradeColors = { A: '#8BA38A', B: '#C27A63', C: '#E8B273', D: '#D46B6B' };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-[#C27A63] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto" data-testid="analytics-page">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="font-['Manrope'] text-3xl font-bold text-[#1A1D1A] tracking-tight">Analytics</h1>
          <p className="text-[#575E56] font-['Figtree'] mt-1">Track your productivity patterns and behavioral insights.</p>
        </div>
        <button data-testid="generate-report-button" onClick={generateReport} disabled={loadingReport}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C27A63] text-[#F9F8F6] rounded-xl hover:bg-[#A6634D] transition-colors font-medium text-sm shadow-sm disabled:opacity-50">
          {loadingReport ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</> : <><FileText className="w-4 h-4" /> Weekly Report</>}
        </button>
      </div>

      {/* Weekly Report Modal */}
      {showReport && report && (
        <div className="bg-[#F9F8F6] border border-[#2D372B]/10 rounded-2xl p-6 mb-6 animate-fade-in-up" data-testid="weekly-report-section">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl font-['Manrope']"
                style={{ backgroundColor: gradeColors[report.grade] || '#8BA38A' }}>
                {report.grade}
              </div>
              <div>
                <h3 className="font-['Manrope'] text-xl font-bold text-[#1A1D1A]">Weekly Productivity Report</h3>
                <p className="text-xs text-[#575E56]">Last 7 days</p>
              </div>
            </div>
            <button onClick={() => setShowReport(false)} className="text-sm text-[#575E56] hover:text-[#1A1D1A] px-3 py-1 rounded-lg hover:bg-[#E8E5DF]">Close</button>
          </div>

          {report.ai_unavailable && (
            <div className="mb-4 px-3 py-2 rounded-lg bg-[#E8B273]/10 border border-[#E8B273]/20 text-[#E8B273] text-xs font-['Figtree']">
              AI analysis is temporarily unavailable. Showing data-based summary.
            </div>
          )}

          <p className="text-[#1A1D1A] font-['Figtree'] leading-relaxed mb-5 whitespace-pre-line" data-testid="report-narrative">{report.narrative}</p>

          {report.highlights?.length > 0 && (
            <div className="mb-5">
              <p className="text-xs tracking-[0.15em] uppercase font-semibold text-[#575E56] mb-2">Highlights</p>
              <div className="flex flex-wrap gap-2">
                {report.highlights.map((h, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#8BA38A]/10 text-[#8BA38A] rounded-lg text-sm font-['Figtree']">
                    <Award className="w-3.5 h-3.5" /> {h}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Focus Time Trend */}
          {report.daily_focus?.length > 0 && (
            <div className="mb-5">
              <p className="text-xs tracking-[0.15em] uppercase font-semibold text-[#575E56] mb-3">Focus Time Trend</p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={report.daily_focus}>
                  <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fill: '#575E56', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#575E56', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: '#F9F8F6', border: '1px solid rgba(45,55,43,0.1)', borderRadius: 12, fontFamily: 'Figtree' }} />
                  <Line type="monotone" dataKey="minutes" stroke="#C27A63" strokeWidth={2.5} dot={{ fill: '#C27A63', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {report.recommendations?.length > 0 && (
            <div>
              <p className="text-xs tracking-[0.15em] uppercase font-semibold text-[#575E56] mb-2">Recommendations</p>
              <div className="space-y-2">
                {report.recommendations.map((r, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-[#C27A63]/5 rounded-xl text-sm text-[#1A1D1A] font-['Figtree']">
                    <TrendingUp className="w-4 h-4 text-[#C27A63] flex-shrink-0 mt-0.5" /> {r}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Tasks Completed', value: weekly?.tasks_completed || 0, icon: BarChart3, color: '#8BA38A' },
          { label: 'Focus Time', value: `${weekly?.total_focus_minutes || 0}m`, icon: Clock, color: '#C27A63' },
          { label: 'Streak', value: `${weekly?.streak_days || 0} days`, icon: Flame, color: '#E8B273' },
          { label: 'Burnout Risk', value: burnout?.risk_level || 'low', icon: Activity, color: burnoutColor(burnout?.risk_level) },
        ].map((s, i) => (
          <div key={s.label} className={`bg-[#F9F8F6] border border-[#2D372B]/10 rounded-2xl p-5 animate-fade-in-up stagger-${i+1}`} data-testid={`analytics-stat-${s.label.toLowerCase().replace(/\s/g, '-')}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs tracking-[0.15em] uppercase font-semibold text-[#575E56]">{s.label}</span>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <p className="font-['Manrope'] text-2xl font-bold text-[#1A1D1A] capitalize">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-[#F9F8F6] border border-[#2D372B]/10 rounded-2xl p-6" data-testid="daily-completions-chart">
          <h3 className="font-['Manrope'] text-lg font-semibold text-[#1A1D1A] mb-4">Daily Task Completions</h3>
          {weekly?.daily_completions?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weekly.daily_completions}>
                <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} tick={{ fill: '#575E56', fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#575E56', fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ background: '#F9F8F6', border: '1px solid rgba(45,55,43,0.1)', borderRadius: 12, fontFamily: 'Figtree' }} />
                <Bar dataKey="count" fill="#C27A63" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-[#575E56] text-center py-12 font-['Figtree']">Complete some tasks to see your progress!</p>}
        </div>

        <div className="bg-[#F9F8F6] border border-[#2D372B]/10 rounded-2xl p-6" data-testid="task-type-chart">
          <h3 className="font-['Manrope'] text-lg font-semibold text-[#1A1D1A] mb-4">Task Type Breakdown</h3>
          {weekly?.task_type_breakdown?.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={weekly.task_type_breakdown} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={90} innerRadius={50} paddingAngle={4}>
                  {weekly.task_type_breakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#F9F8F6', border: '1px solid rgba(45,55,43,0.1)', borderRadius: 12, fontFamily: 'Figtree' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-[#575E56] text-center py-12 font-['Figtree']">Add tasks to see breakdown!</p>}
          {weekly?.task_type_breakdown?.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-4 justify-center">
              {weekly.task_type_breakdown.map((t, i) => (
                <span key={t.type} className="flex items-center gap-1.5 text-xs text-[#575E56]">
                  <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                  {t.type} ({t.count})
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-[#F9F8F6] border border-[#2D372B]/10 rounded-2xl p-6" data-testid="procrastination-section">
          <h3 className="font-['Manrope'] text-lg font-semibold text-[#1A1D1A] mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#E8B273]" /> Procrastination Analysis
          </h3>
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-[#575E56]">Procrastination Rate</span>
              <span className="font-['Manrope'] font-bold text-[#1A1D1A]">{procrastination?.procrastination_rate || 0}%</span>
            </div>
            <div className="w-full h-3 bg-[#E8E5DF] rounded-full overflow-hidden">
              <div className="h-full bg-[#E8B273] rounded-full transition-all duration-500" style={{ width: `${Math.min(procrastination?.procrastination_rate || 0, 100)}%` }} />
            </div>
          </div>
          {procrastination?.analysis?.patterns?.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-xs tracking-[0.15em] uppercase font-semibold text-[#575E56]">Patterns</p>
              {procrastination.analysis.patterns.map((p, i) => (
                <p key={i} className="text-sm text-[#1A1D1A] p-2 bg-[#F2F0EA] rounded-lg font-['Figtree']">{p}</p>
              ))}
            </div>
          )}
          {procrastination?.analysis?.suggestions?.length > 0 && (
            <div className="space-y-2 mt-4">
              <p className="text-xs tracking-[0.15em] uppercase font-semibold text-[#575E56]">Suggestions</p>
              {procrastination.analysis.suggestions.map((s, i) => (
                <p key={i} className="text-sm text-[#8BA38A] p-2 bg-[#8BA38A]/10 rounded-lg font-['Figtree']">{s}</p>
              ))}
            </div>
          )}
        </div>

        <div className="bg-[#F9F8F6] border border-[#2D372B]/10 rounded-2xl p-6" data-testid="burnout-section">
          <h3 className="font-['Manrope'] text-lg font-semibold text-[#1A1D1A] mb-4 flex items-center gap-2">
            <Activity className="w-5 h-5" style={{ color: burnoutColor(burnout?.risk_level) }} /> Burnout Monitor
          </h3>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-white font-bold text-xl font-['Manrope']"
              style={{ backgroundColor: burnoutColor(burnout?.risk_level) }}>
              {(burnout?.risk_level || 'low').toUpperCase().slice(0, 1)}
            </div>
            <div>
              <p className="font-['Manrope'] text-xl font-bold text-[#1A1D1A] capitalize">{burnout?.risk_level || 'Low'} Risk</p>
              <p className="text-sm text-[#575E56]">Completion rate: {burnout?.completion_rate || 0}%</p>
            </div>
          </div>
          {burnout?.factors?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs tracking-[0.15em] uppercase font-semibold text-[#575E56]">Contributing Factors</p>
              {burnout.factors.map((f, i) => (
                <p key={i} className="text-sm text-[#1A1D1A] p-2 bg-[#F2F0EA] rounded-lg font-['Figtree']">{f}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
