import React, { useState, useEffect } from 'react';
import { taskAPI, plannerAPI } from '../services/api';
import { Plus, Brain, Wand2, Trash2, ChevronDown, ChevronUp, Clock, Tag, AlertTriangle, CheckCircle2, RotateCcw, ArrowUpDown } from 'lucide-react';

const STATUS_OPTIONS = ['pending', 'in_progress', 'done', 'deferred'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];
const TYPE_OPTIONS = ['work', 'personal', 'health', 'career', 'learning', 'admin'];

const priorityStyle = { critical: 'bg-[#D46B6B] text-white', high: 'bg-[#E8B273] text-[#1A1D1A]', medium: 'bg-[#8BA38A] text-white', low: 'bg-[#E8E5DF] text-[#575E56]' };
const statusStyle = { pending: 'text-[#E8B273]', in_progress: 'text-[#C27A63]', done: 'text-[#8BA38A]', deferred: 'text-[#575E56]' };

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [brainDumpText, setBrainDumpText] = useState('');
  const [showBrainDump, setShowBrainDump] = useState(false);
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', task_type: 'work', priority: 'medium', effort: '1h', deadline: '' });
  const [filter, setFilter] = useState({ status: '', priority: '', task_type: '' });
  const [loading, setLoading] = useState(true);
  const [dumping, setDumping] = useState(false);
  const [prioritizing, setPrioritizing] = useState(false);
  const [rankings, setRankings] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [aiNotice, setAiNotice] = useState(null);

  useEffect(() => { loadTasks(); }, [filter]);

  const loadTasks = async () => {
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.priority) params.priority = filter.priority;
      if (filter.task_type) params.task_type = filter.task_type;
      const { data } = await taskAPI.getAll(params);
      setTasks(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleBrainDump = async () => {
    if (!brainDumpText.trim()) return;
    setDumping(true);
    try {
      const { data } = await taskAPI.brainDump(brainDumpText);
      setBrainDumpText('');
      setShowBrainDump(false);
      if (data.ai_unavailable) {
        setAiNotice('AI is recharging. Tasks were parsed using basic rules — you can edit them to fine-tune.');
        setTimeout(() => setAiNotice(null), 8000);
      }
      loadTasks();
    } catch (e) { console.error(e); }
    finally { setDumping(false); }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    try {
      await taskAPI.create(newTask);
      setNewTask({ title: '', task_type: 'work', priority: 'medium', effort: '1h', deadline: '' });
      setShowAddTask(false);
      loadTasks();
    } catch (e) { console.error(e); }
  };

  const updateStatus = async (id, status) => {
    try { await taskAPI.update(id, { status }); loadTasks(); } catch (e) { console.error(e); }
  };

  const deleteTask = async (id) => {
    try { await taskAPI.delete(id); loadTasks(); } catch (e) { console.error(e); }
  };

  const handlePrioritize = async () => {
    setPrioritizing(true);
    try {
      const { data } = await taskAPI.prioritize();
      setRankings(data.rankings || []);
    } catch (e) { console.error(e); }
    finally { setPrioritizing(false); }
  };

  const generatePlan = async () => {
    setGenerating(true);
    try { await plannerAPI.generate(); } catch (e) { console.error(e); }
    finally { setGenerating(false); }
  };

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto" data-testid="tasks-page">
      {aiNotice && (
        <div className="mb-4 px-4 py-3 rounded-xl bg-[#E8B273]/10 border border-[#E8B273]/20 text-[#E8B273] text-sm font-['Figtree'] animate-fade-in-up flex items-center justify-between" data-testid="ai-notice">
          <span>{aiNotice}</span>
          <button onClick={() => setAiNotice(null)} className="text-[#E8B273] hover:text-[#C27A63] ml-3 font-bold">x</button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-['Manrope'] text-3xl font-bold text-[#1A1D1A] tracking-tight">Tasks</h1>
          <p className="text-[#575E56] font-['Figtree'] mt-1">Manage and organize your work with AI assistance.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button data-testid="brain-dump-toggle" onClick={() => setShowBrainDump(!showBrainDump)} className="flex items-center gap-2 px-4 py-2.5 bg-[#C27A63] text-[#F9F8F6] rounded-xl hover:bg-[#A6634D] transition-colors font-medium text-sm shadow-sm">
            <Brain className="w-4 h-4" /> Brain Dump
          </button>
          <button data-testid="add-task-toggle" onClick={() => setShowAddTask(!showAddTask)} className="flex items-center gap-2 px-4 py-2.5 bg-[#E8E5DF] text-[#1A1D1A] rounded-xl hover:bg-[#DEDAD2] transition-colors font-medium text-sm">
            <Plus className="w-4 h-4" /> Add Task
          </button>
          <button data-testid="prioritize-button" onClick={handlePrioritize} disabled={prioritizing} className="flex items-center gap-2 px-4 py-2.5 bg-transparent border border-[#2D372B]/20 text-[#1A1D1A] rounded-xl hover:bg-[#2D372B]/5 transition-colors font-medium text-sm disabled:opacity-50">
            <ArrowUpDown className="w-4 h-4" /> {prioritizing ? 'Analyzing...' : 'AI Prioritize'}
          </button>
          <button data-testid="generate-plan-button" onClick={generatePlan} disabled={generating} className="flex items-center gap-2 px-4 py-2.5 bg-transparent border border-[#2D372B]/20 text-[#1A1D1A] rounded-xl hover:bg-[#2D372B]/5 transition-colors font-medium text-sm disabled:opacity-50">
            <Wand2 className="w-4 h-4" /> {generating ? 'Generating...' : 'Generate Plan'}
          </button>
        </div>
      </div>

      {showBrainDump && (
        <div className="bg-[#F9F8F6] border border-[#2D372B]/10 rounded-2xl p-6 mb-6 animate-fade-in-up" data-testid="brain-dump-section">
          <h3 className="font-['Manrope'] text-lg font-semibold text-[#1A1D1A] mb-3 flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#C27A63]" /> Brain Dump
          </h3>
          <p className="text-sm text-[#575E56] mb-3 font-['Figtree']">Pour out everything on your mind. AURA will parse it into structured tasks.</p>
          <textarea
            data-testid="brain-dump-textarea"
            value={brainDumpText}
            onChange={(e) => setBrainDumpText(e.target.value)}
            rows={4}
            placeholder="e.g. I need to finish the project report, prepare for tomorrow's meeting, buy groceries, and go for a run..."
            className="w-full px-4 py-3 bg-[#F2F0EA] border border-[#2D372B]/10 rounded-xl focus:bg-[#F9F8F6] focus:border-[#C27A63] focus:ring-2 focus:ring-[#C27A63]/20 outline-none transition-all font-['Figtree'] text-sm resize-none"
          />
          <div className="flex justify-end mt-3">
            <button data-testid="brain-dump-submit" onClick={handleBrainDump} disabled={dumping || !brainDumpText.trim()} className="flex items-center gap-2 px-5 py-2.5 bg-[#C27A63] text-[#F9F8F6] rounded-xl hover:bg-[#A6634D] transition-colors font-medium text-sm shadow-sm disabled:opacity-50">
              <Wand2 className="w-4 h-4" /> {dumping ? 'Parsing...' : 'Parse Tasks'}
            </button>
          </div>
        </div>
      )}

      {showAddTask && (
        <form onSubmit={handleAddTask} className="bg-[#F9F8F6] border border-[#2D372B]/10 rounded-2xl p-6 mb-6 animate-fade-in-up" data-testid="add-task-form">
          <h3 className="font-['Manrope'] text-lg font-semibold text-[#1A1D1A] mb-4">New Task</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <input data-testid="new-task-title" value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} placeholder="Task title" className="w-full px-4 py-3 bg-[#F2F0EA] border border-[#2D372B]/10 rounded-xl focus:bg-[#F9F8F6] focus:border-[#C27A63] focus:ring-2 focus:ring-[#C27A63]/20 outline-none transition-all font-['Figtree']" required />
            </div>
            <select data-testid="new-task-type" value={newTask.task_type} onChange={(e) => setNewTask({...newTask, task_type: e.target.value})} className="px-4 py-3 bg-[#F2F0EA] border border-[#2D372B]/10 rounded-xl focus:border-[#C27A63] outline-none font-['Figtree'] text-sm">
              {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            <select data-testid="new-task-priority" value={newTask.priority} onChange={(e) => setNewTask({...newTask, priority: e.target.value})} className="px-4 py-3 bg-[#F2F0EA] border border-[#2D372B]/10 rounded-xl focus:border-[#C27A63] outline-none font-['Figtree'] text-sm">
              {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
            <input data-testid="new-task-effort" value={newTask.effort} onChange={(e) => setNewTask({...newTask, effort: e.target.value})} placeholder="Effort (e.g. 2h)" className="px-4 py-3 bg-[#F2F0EA] border border-[#2D372B]/10 rounded-xl focus:border-[#C27A63] outline-none font-['Figtree'] text-sm" />
            <input data-testid="new-task-deadline" type="date" value={newTask.deadline} onChange={(e) => setNewTask({...newTask, deadline: e.target.value})} className="px-4 py-3 bg-[#F2F0EA] border border-[#2D372B]/10 rounded-xl focus:border-[#C27A63] outline-none font-['Figtree'] text-sm" />
          </div>
          <div className="flex justify-end mt-4">
            <button data-testid="add-task-submit" type="submit" className="px-5 py-2.5 bg-[#C27A63] text-[#F9F8F6] rounded-xl hover:bg-[#A6634D] transition-colors font-medium text-sm shadow-sm">Create Task</button>
          </div>
        </form>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        <select data-testid="filter-status" value={filter.status} onChange={(e) => setFilter({...filter, status: e.target.value})} className="px-3 py-2 bg-[#F2F0EA] border border-[#2D372B]/10 rounded-xl text-sm font-['Figtree'] outline-none focus:border-[#C27A63]">
          <option value="">All Status</option>
          {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
        </select>
        <select data-testid="filter-priority" value={filter.priority} onChange={(e) => setFilter({...filter, priority: e.target.value})} className="px-3 py-2 bg-[#F2F0EA] border border-[#2D372B]/10 rounded-xl text-sm font-['Figtree'] outline-none focus:border-[#C27A63]">
          <option value="">All Priority</option>
          {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
        </select>
        <select data-testid="filter-type" value={filter.task_type} onChange={(e) => setFilter({...filter, task_type: e.target.value})} className="px-3 py-2 bg-[#F2F0EA] border border-[#2D372B]/10 rounded-xl text-sm font-['Figtree'] outline-none focus:border-[#C27A63]">
          <option value="">All Types</option>
          {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
        </select>
      </div>

      {rankings.length > 0 && (
        <div className="bg-[#F2F0EA] border border-[#2D372B]/10 rounded-2xl p-6 mb-6 animate-fade-in-up" data-testid="rankings-section">
          <h3 className="font-['Manrope'] text-lg font-semibold text-[#1A1D1A] mb-3 flex items-center gap-2"><ArrowUpDown className="w-5 h-5 text-[#C27A63]" /> AI Priority Rankings</h3>
          <div className="space-y-2">
            {rankings.map((r, i) => {
              const task = tasks.find(t => t.id === r.task_id);
              return (
                <div key={i} className="flex items-center gap-3 p-3 bg-[#F9F8F6] rounded-xl">
                  <span className="w-7 h-7 rounded-full bg-[#C27A63] text-[#F9F8F6] flex items-center justify-center text-xs font-bold">{r.rank}</span>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[#1A1D1A]">{task?.title || 'Unknown task'}</p>
                    <p className="text-xs text-[#575E56]">{r.rationale}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 border-[#C27A63] border-t-transparent rounded-full animate-spin" /></div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16">
          <Brain className="w-12 h-12 text-[#C27A63]/40 mx-auto mb-4" />
          <h3 className="font-['Manrope'] text-xl font-semibold text-[#1A1D1A] mb-2">No tasks yet</h3>
          <p className="text-[#575E56] font-['Figtree']">Use Brain Dump to pour out your thoughts, or add tasks manually.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="bg-[#F9F8F6] border border-[#2D372B]/10 rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 group" data-testid={`task-card-${t.id}`}>
              <div className="flex items-start gap-3">
                <button onClick={() => updateStatus(t.id, t.status === 'done' ? 'pending' : 'done')} data-testid={`task-toggle-${t.id}`} className={`mt-0.5 flex-shrink-0 ${t.status === 'done' ? 'text-[#8BA38A]' : 'text-[#E8E5DF] hover:text-[#8BA38A]'} transition-colors`}>
                  <CheckCircle2 className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-['Figtree'] font-medium text-[#1A1D1A] ${t.status === 'done' ? 'line-through opacity-50' : ''}`}>{t.title}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className={`text-xs px-2 py-0.5 rounded-lg font-medium ${priorityStyle[t.priority] || ''}`}>{t.priority}</span>
                    <span className="text-xs text-[#575E56] flex items-center gap-1"><Tag className="w-3 h-3" />{t.task_type}</span>
                    <span className="text-xs text-[#575E56] flex items-center gap-1"><Clock className="w-3 h-3" />{t.effort}</span>
                    {t.postpone_count > 0 && (
                      <span className="text-xs text-[#D46B6B] flex items-center gap-1"><AlertTriangle className="w-3 h-3" />Postponed {t.postpone_count}x</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)} className="text-xs px-2 py-1 bg-[#F2F0EA] rounded-lg border-none outline-none font-['Figtree']" data-testid={`task-status-${t.id}`}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                  <button onClick={() => deleteTask(t.id)} data-testid={`task-delete-${t.id}`} className="p-1.5 rounded-lg hover:bg-[#D46B6B]/10 text-[#575E56] hover:text-[#D46B6B] transition-colors">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
