import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { taskAPI, plannerAPI, analyticsAPI, focusAPI } from '../services/api';
import { Clock, CheckCircle2, Flame, ArrowRight, Plus, Brain, AlertTriangle, Calendar, Heart } from 'lucide-react';
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, planRes, analyticsRes] = await Promise.allSettled([
        taskAPI.getAll({ status: 'pending' }),
        plannerAPI.today(),
        analyticsAPI.weekly(),
      ]);
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.data.slice(0, 5));
      if (planRes.status === 'fulfilled' && planRes.value.data.schedule !== null) setSchedule(planRes.value.data);
      if (analyticsRes.status === 'fulfilled') setAnalytics(analyticsRes.value.data);
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
    const map = { critical: 'bg-[#D46B6B] text-white', high: 'bg-[#E8B273] text-[#1A1D1A]', medium: 'bg-[#8BA38A] text-white', low: 'bg-[#E8E5DF] text-[#575E56]' };
    return map[p] || map.medium;
  };

  if (loading) return (
    <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-[#C27A63] border-t-transparent rounded-full animate-spin" /></div>
  );

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto" data-testid="dashboard-page">
      <div className="mb-8 animate-fade-in-up flex items-start justify-between">
        <div>
          <h1 className="font-['Manrope'] text-3xl lg:text-4xl font-bold text-[#1A1D1A] tracking-tight">
            {greeting()}, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-[#575E56] font-['Figtree'] mt-1 text-lg">Here's your productivity overview for today.</p>
        </div>
        <button data-testid="overwhelm-button" onClick={() => setShowOverwhelm(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#8BA38A]/10 border border-[#8BA38A]/20 text-[#8BA38A] rounded-xl hover:bg-[#8BA38A]/20 transition-colors font-medium text-sm flex-shrink-0">
          <Heart className="w-4 h-4" /> I Feel Overwhelmed
        </button>
      </div>

      {showOverwhelm && <OverwhelmMode onClose={() => setShowOverwhelm(false)} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Tasks Done', value: analytics?.tasks_completed || 0, icon: CheckCircle2, color: '#8BA38A' },
          { label: 'Focus Time', value: `${analytics?.total_focus_minutes || 0}m`, icon: Clock, color: '#C27A63' },
          { label: 'Streak', value: `${analytics?.streak_days || 0}d`, icon: Flame, color: '#E8B273' },
          { label: 'Total Tasks', value: analytics?.total_tasks || 0, icon: Brain, color: '#575E56' },
        ].map((s, i) => (
          <div key={s.label} className={`bg-[#F9F8F6] border border-[#2D372B]/10 rounded-2xl p-5 hover:-translate-y-1 hover:shadow-md transition-all duration-300 animate-fade-in-up stagger-${i+1}`} data-testid={`stat-${s.label.toLowerCase().replace(/\s/g, '-')}`}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs tracking-[0.15em] uppercase font-semibold text-[#575E56]">{s.label}</span>
              <s.icon className="w-5 h-5" style={{ color: s.color }} />
            </div>
            <p className="font-['Manrope'] text-2xl font-bold text-[#1A1D1A]">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#F9F8F6] border border-[#2D372B]/10 rounded-2xl p-6 animate-fade-in-up" data-testid="quick-add-section">
            <h3 className="font-['Manrope'] text-lg font-semibold text-[#1A1D1A] mb-4 flex items-center gap-2">
              <Plus className="w-5 h-5 text-[#C27A63]" /> Quick Add Task
            </h3>
            <form onSubmit={handleQuickAdd} className="flex gap-3">
              <input
                data-testid="quick-add-input"
                value={quickTask}
                onChange={(e) => setQuickTask(e.target.value)}
                placeholder="What do you need to do?"
                className="flex-1 px-4 py-3 bg-[#F2F0EA] border border-[#2D372B]/10 rounded-xl focus:bg-[#F9F8F6] focus:border-[#C27A63] focus:ring-2 focus:ring-[#C27A63]/20 outline-none transition-all font-['Figtree']"
              />
              <button
                data-testid="quick-add-submit"
                type="submit"
                disabled={addingTask}
                className="px-6 py-3 bg-[#C27A63] text-[#F9F8F6] rounded-xl hover:bg-[#A6634D] transition-colors font-medium shadow-sm disabled:opacity-50"
              >
                {addingTask ? '...' : 'Add'}
              </button>
            </form>
          </div>

          <div className="bg-[#F9F8F6] border border-[#2D372B]/10 rounded-2xl p-6 animate-fade-in-up" data-testid="priority-tasks-section">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-['Manrope'] text-lg font-semibold text-[#1A1D1A] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-[#E8B273]" /> Priority Tasks
              </h3>
              <Link to="/tasks" className="text-sm text-[#C27A63] hover:text-[#A6634D] flex items-center gap-1 font-medium" data-testid="view-all-tasks-link">
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            {tasks.length === 0 ? (
              <p className="text-[#575E56] text-center py-8 font-['Figtree']">No pending tasks. Use Brain Dump to add tasks!</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F2F0EA] transition-colors group" data-testid={`task-item-${t.id}`}>
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: t.priority === 'high' || t.priority === 'critical' ? '#D46B6B' : '#8BA38A' }} />
                    <span className="flex-1 text-[#1A1D1A] font-['Figtree'] text-sm">{t.title}</span>
                    <span className={`text-xs px-2 py-1 rounded-lg font-medium ${priorityColor(t.priority)}`}>{t.priority}</span>
                    <span className="text-xs text-[#575E56] font-['JetBrains_Mono']">{t.effort}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <Link to="/chat" className="block bg-gradient-to-br from-[#C27A63] to-[#A6634D] rounded-2xl p-6 text-[#F9F8F6] hover:-translate-y-1 hover:shadow-lg transition-all duration-300 animate-fade-in-up" data-testid="chat-advisor-card">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center mb-3 overflow-hidden">
              <AuraLogo size={32} />
            </div>
            <h3 className="font-['Manrope'] text-xl font-bold mb-2">AI Advisor</h3>
            <p className="text-[#F9F8F6]/80 text-sm font-['Figtree']">Ask AURA for help with priorities, decisions, or just vent.</p>
            <div className="mt-4 flex items-center gap-1 text-sm font-medium">Start chatting <ArrowRight className="w-4 h-4" /></div>
          </Link>

          <div className="bg-[#F9F8F6] border border-[#2D372B]/10 rounded-2xl p-6 animate-fade-in-up" data-testid="today-schedule-section">
            <h3 className="font-['Manrope'] text-lg font-semibold text-[#1A1D1A] mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#8BA38A]" /> Today's Plan
            </h3>
            {schedule?.plan?.blocks ? (
              <div className="space-y-2">
                {schedule.plan.blocks.slice(0, 5).map((b, i) => (
                  <div key={i} className="flex gap-3 text-sm p-2 rounded-lg hover:bg-[#F2F0EA] transition-colors">
                    <span className="font-['JetBrains_Mono'] text-[#575E56] text-xs w-24 flex-shrink-0">{b.start} - {b.end}</span>
                    <span className="text-[#1A1D1A] font-['Figtree']">{b.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-[#575E56] text-sm mb-3">No plan generated yet</p>
                <Link to="/tasks" className="text-sm text-[#C27A63] hover:text-[#A6634D] font-medium">Add tasks to generate a plan</Link>
              </div>
            )}
          </div>

          <Link to="/focus" className="block bg-[#F2F0EA] border border-[#2D372B]/10 rounded-2xl p-6 hover:-translate-y-1 hover:shadow-md transition-all duration-300 animate-fade-in-up" data-testid="focus-room-card">
            <Clock className="w-8 h-8 text-[#8BA38A] mb-3" />
            <h3 className="font-['Manrope'] text-lg font-bold text-[#1A1D1A] mb-1">Focus Room</h3>
            <p className="text-[#575E56] text-sm font-['Figtree']">Start a Pomodoro session to power through your tasks.</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
