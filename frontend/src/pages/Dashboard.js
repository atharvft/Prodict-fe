import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { taskAPI, plannerAPI, analyticsAPI, quoteAPI } from '../services/api';
import { Clock, CheckCircle2, Flame, ArrowRight, Plus, Brain, AlertTriangle, Calendar, Heart, Quote } from 'lucide-react';
import AuraLogo from '../components/AuraLogo';
import OverwhelmMode from '../components/OverwhelmMode';

export default function Dashboard() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [schedule, setSchedule] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [quickTask, setQuickTask] = useState('');
  const [loading, setLoading] = useState(true);
  const [addingTask, setAddingTask] = useState(false);
  const [showOverwhelm, setShowOverwhelm] = useState(false);
  const [quote, setQuote] = useState(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      const [tasksRes, planRes, analyticsRes, quoteRes] = await Promise.allSettled([
        taskAPI.getAll({ status: 'pending' }),
        plannerAPI.today(),
        analyticsAPI.weekly(),
        quoteAPI.today(),
      ]);
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.data.slice(0, 5));
      if (planRes.status === 'fulfilled' && planRes.value.data.schedule !== null) setSchedule(planRes.value.data);
      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data);
      if (quoteRes.status === 'fulfilled') setQuote(quoteRes.value.data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickTask.trim()) return;
    setAddingTask(true);
    try {
      await taskAPI.create({ title: quickTask });
      setQuickTask('');
      loadData();
    } catch (e) { console.error(e); }
    finally { setAddingTask(false); }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const priorityColor = (p) => {
    const map = { critical: 'var(--danger)', high: 'var(--warning)', medium: 'var(--success)', low: 'var(--bg-secondary)' };
    return map[p] || map.medium;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }} /></div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto" data-testid="dashboard-page">
      <div className="mb-6 animate-fade-in-up flex items-start justify-between">
        <div>
          <h1 className="font-['Manrope'] text-3xl lg:text-4xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {greeting()}, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="font-['Figtree'] mt-1 text-lg" style={{ color: 'var(--text-secondary)' }}>Here's your productivity overview for today.</p>
        </div>
        <button data-testid="overwhelm-button" onClick={() => setShowOverwhelm(true)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl transition-colors font-medium text-sm flex-shrink-0"
          style={{ background: 'color-mix(in srgb, var(--success) 15%, transparent)', color: 'var(--success)', border: '1px solid color-mix(in srgb, var(--success) 25%, transparent)' }}>
          <Heart className="w-4 h-4" /> I Feel Overwhelmed
        </button>
      </div>

      {/* Quote of the Day */}
      {quote && (
        <div className="mb-6 px-6 py-4 rounded-2xl animate-fade-in-up" data-testid="quote-of-day"
          style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}>
          <div className="flex items-start gap-3">
            <Quote className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--brand-primary)', opacity: 0.6 }} />
            <div>
              <p className="font-['Figtree'] text-base italic leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                "{quote.quote}"
              </p>
              <p className="font-['Manrope'] text-sm font-medium mt-1.5" style={{ color: 'var(--text-secondary)' }}>
                — {quote.author}
              </p>
            </div>
          </div>
        </div>
      )}

      {showOverwhelm && <OverwhelmMode onClose={() => setShowOverwhelm(false)} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Tasks Done', value: analytics?.tasks_completed || 0, icon: CheckCircle2, color: 'var(--success)' },
          { label: 'Focus Time', value: `${analytics?.total_focus_minutes || 0}m`, icon: Clock, color: 'var(--brand-primary)' },
          { label: 'Streak', value: `${analytics?.streak_days || 0}d`, icon: Flame, color: 'var(--warning)' },
          { label: 'Total Tasks', value: analytics?.total_tasks || 0, icon: Brain, color: 'var(--text-secondary)' },
        ].map((s, i) => (
          <div key={s.label}
            className={`rounded-2xl p-5 hover:-translate-y-1 hover:shadow-md transition-all duration-300 animate-fade-in-up stagger-${i+1}`}
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)', boxShadow: 'var(--card-shadow)' }}
            data-testid={`stat-${s.label.toLowerCase().replace(/\s/g, '-')}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs tracking-[0.15em] uppercase font-semibold" style={{ color: 'var(--text-secondary)' }}>{s.label}</span>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <p className="font-['Manrope'] text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-2xl p-6 animate-fade-in-up" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} data-testid="quick-add-section">
            <h3 className="font-['Manrope'] text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Plus className="w-5 h-5" style={{ color: 'var(--brand-primary)' }} /> Quick Add Task
            </h3>
            <form onSubmit={handleQuickAdd} className="flex gap-3">
              <input data-testid="quick-add-input" value={quickTask} onChange={(e) => setQuickTask(e.target.value)}
                placeholder="What do you need to do?"
                className="flex-1 px-4 py-3 rounded-xl outline-none transition-all font-['Figtree'] t-input" />
              <button data-testid="quick-add-submit" type="submit" disabled={addingTask}
                className="px-6 py-3 rounded-xl transition-colors font-medium shadow-sm disabled:opacity-50"
                style={{ background: 'var(--brand-primary)', color: 'var(--text-inverse)' }}>
                {addingTask ? '...' : 'Add'}
              </button>
            </form>
          </div>

          <div className="rounded-2xl p-6 animate-fade-in-up" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} data-testid="priority-tasks-section">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-['Manrope'] text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                <AlertTriangle className="w-5 h-5" style={{ color: 'var(--warning)' }} /> Priority Tasks
              </h3>
              <Link to="/tasks" className="text-sm flex items-center gap-1 font-medium" style={{ color: 'var(--brand-primary)' }} data-testid="view-all-tasks-link">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {tasks.length === 0 ? (
              <p className="text-center py-8 font-['Figtree']" style={{ color: 'var(--text-secondary)' }}>No pending tasks. Use Brain Dump to add tasks!</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl transition-colors group" data-testid={`task-item-${t.id}`}
                    style={{ ':hover': { background: 'var(--bg-tertiary)' } }}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: priorityColor(t.priority) }} />
                    <span className="flex-1 font-['Figtree'] text-sm" style={{ color: 'var(--text-primary)' }}>{t.title}</span>
                    <span className="text-xs px-2 py-1 rounded-lg font-medium"
                      style={{ background: priorityColor(t.priority), color: t.priority === 'low' ? 'var(--text-secondary)' : 'var(--text-inverse)' }}>
                      {t.priority}
                    </span>
                    <span className="text-xs font-['JetBrains_Mono']" style={{ color: 'var(--text-secondary)' }}>{t.effort}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Link to="/chat" className="block rounded-2xl p-6 hover:-translate-y-1 hover:shadow-lg transition-all duration-300 animate-fade-in-up"
            style={{ background: `linear-gradient(135deg, var(--brand-primary), var(--brand-hover))`, color: 'var(--text-inverse)' }}
            data-testid="chat-advisor-card">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 overflow-hidden" style={{ background: 'rgba(255,255,255,0.2)' }}>
              <AuraLogo size={32} theme="dark" />
            </div>
            <h3 className="font-['Manrope'] text-xl font-bold mb-2">AI Advisor</h3>
            <p className="opacity-80 text-sm font-['Figtree']">Ask Prodict AI for help with priorities, decisions, or just vent.</p>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium">Start chatting <ArrowRight className="w-4 h-4" /></div>
          </Link>

          <div className="rounded-2xl p-6 animate-fade-in-up" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} data-testid="today-schedule-section">
            <h3 className="font-['Manrope'] text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Calendar className="w-5 h-5" style={{ color: 'var(--success)' }} /> Today's Plan
            </h3>
            {schedule?.plan?.blocks ? (
              <div className="space-y-2">
                {schedule.plan.blocks.slice(0, 5).map((b, i) => (
                  <div key={i} className="flex gap-3 text-sm p-2 rounded-lg transition-colors">
                    <span className="font-['JetBrains_Mono'] text-xs w-24 flex-shrink-0" style={{ color: 'var(--text-secondary)' }}>{b.start} - {b.end}</span>
                    <span className="font-['Figtree']" style={{ color: 'var(--text-primary)' }}>{b.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm mb-3" style={{ color: 'var(--text-secondary)' }}>No plan generated yet</p>
                <Link to="/tasks" className="text-sm font-medium" style={{ color: 'var(--brand-primary)' }}>Add tasks to generate a plan</Link>
              </div>
            )}
          </div>

          <Link to="/focus" className="block rounded-2xl p-6 hover:-translate-y-1 hover:shadow-md transition-all duration-300 animate-fade-in-up"
            style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }}
            data-testid="focus-room-card">
            <Clock className="w-8 h-8 mb-3" style={{ color: 'var(--success)' }} />
            <h3 className="font-['Manrope'] text-lg font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Focus Room</h3>
            <p className="text-sm font-['Figtree']" style={{ color: 'var(--text-secondary)' }}>Start a Pomodoro session to power through your tasks.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
