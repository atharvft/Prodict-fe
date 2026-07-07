import React, { useState, useEffect, useRef, useCallback } from 'react';
import { taskAPI, plannerAPI } from '../services/api';
import { Plus, Brain, Wand2, Trash2, Clock, Tag, AlertTriangle, CheckCircle2, ArrowUpDown, Mic, MicOff } from 'lucide-react';

const STATUS_OPTIONS = ['pending', 'in_progress', 'done', 'deferred'];
const PRIORITY_OPTIONS = ['low', 'medium', 'high', 'critical'];
const TYPE_OPTIONS = ['work', 'personal', 'health', 'career', 'learning', 'admin'];

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
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const loadTasks = useCallback(async () => {
    try {
      const params = {};
      if (filter.status) params.status = filter.status;
      if (filter.priority) params.priority = filter.priority;
      if (filter.task_type) params.task_type = filter.task_type;
      const { data } = await taskAPI.getAll(params);
      setTasks(data);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [filter]);

  useEffect(() => { loadTasks(); }, [loadTasks]);

  const handleBrainDump = async () => {
    if (!brainDumpText.trim()) return;
    setDumping(true);
    try {
      const { data } = await taskAPI.brainDump(brainDumpText);
      setBrainDumpText('');
      setShowBrainDump(false);
      if (data.ai_unavailable) { setAiNotice('AI is recharging. Tasks parsed with basic rules.'); setTimeout(() => setAiNotice(null), 6000); }
      loadTasks();
    } catch (e) { console.error(e); }
    finally { setDumping(false); }
  };

  const handleAddTask = async (e) => {
    e.preventDefault();
    if (!newTask.title.trim()) return;
    try { await taskAPI.create(newTask); setNewTask({ title: '', task_type: 'work', priority: 'medium', effort: '1h', deadline: '' }); setShowAddTask(false); loadTasks(); } catch (e) { console.error(e); }
  };

  const updateStatus = async (id, status) => { try { await taskAPI.update(id, { status }); loadTasks(); } catch (e) { console.error(e); } };
  const deleteTask = async (id) => { try { await taskAPI.delete(id); loadTasks(); } catch (e) { console.error(e); } };

  const handlePrioritize = async () => {
    setPrioritizing(true);
    try { const { data } = await taskAPI.prioritize(); setRankings(data.rankings || []); } catch (e) { console.error(e); }
    finally { setPrioritizing(false); }
  };

  const generatePlan = async () => {
    setGenerating(true);
    try { await plannerAPI.generate(); } catch (e) { console.error(e); }
    finally { setGenerating(false); }
  };

  const toggleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) return;
    if (listening) { recognitionRef.current?.stop(); setListening(false); return; }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    const r = new SR(); r.continuous = false; r.interimResults = false; r.lang = 'en-US';
    r.onresult = (e) => { setBrainDumpText(prev => prev + ' ' + e.results[0][0].transcript); setListening(false); };
    r.onerror = () => setListening(false); r.onend = () => setListening(false);
    recognitionRef.current = r; r.start(); setListening(true);
  };

  const priorityBg = (p) => ({ critical: 'var(--danger)', high: 'var(--warning)', medium: 'var(--success)', low: 'var(--bg-secondary)' }[p] || 'var(--success)');

  return (
    <div className="p-6 lg:p-8 max-w-6xl mx-auto" data-testid="tasks-page">
      {aiNotice && (
        <div className="mb-4 px-4 py-3 rounded-xl text-sm font-['Figtree'] animate-fade-in-up flex items-center justify-between" data-testid="ai-notice"
          style={{ background: 'color-mix(in srgb, var(--warning) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--warning) 25%, transparent)', color: 'var(--warning)' }}>
          <span>{aiNotice}</span><button onClick={() => setAiNotice(null)} className="font-bold ml-3">x</button>
        </div>
      )}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-['Manrope'] text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Tasks</h1>
          <p className="font-['Figtree'] mt-1" style={{ color: 'var(--text-secondary)' }}>Manage and organize your work with AI assistance.</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button data-testid="brain-dump-toggle" onClick={() => setShowBrainDump(!showBrainDump)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm shadow-sm" style={{ background: 'var(--brand-primary)', color: 'var(--text-inverse)' }}>
            <Brain className="w-4 h-4" /> Brain Dump
          </button>
          <button data-testid="add-task-toggle" onClick={() => setShowAddTask(!showAddTask)} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>
            <Plus className="w-4 h-4" /> Add Task
          </button>
          <button data-testid="prioritize-button" onClick={handlePrioritize} disabled={prioritizing} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm disabled:opacity-50" style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            <ArrowUpDown className="w-4 h-4" /> {prioritizing ? 'Analyzing...' : 'AI Prioritize'}
          </button>
          <button data-testid="generate-plan-button" onClick={generatePlan} disabled={generating} className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm disabled:opacity-50" style={{ border: '1px solid var(--border-color)', color: 'var(--text-primary)' }}>
            <Wand2 className="w-4 h-4" /> {generating ? 'Generating...' : 'Generate Plan'}
          </button>
        </div>
      </div>

      {showBrainDump && (
        <div className="rounded-2xl p-6 mb-6 animate-fade-in-up" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} data-testid="brain-dump-section">
          <h3 className="font-['Manrope'] text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <Brain className="w-5 h-5" style={{ color: 'var(--brand-primary)' }} /> Brain Dump
          </h3>
          <p className="text-sm mb-3 font-['Figtree']" style={{ color: 'var(--text-secondary)' }}>Pour out everything on your mind. Prodict AI will parse it into structured tasks.</p>
          <textarea data-testid="brain-dump-textarea" value={brainDumpText} onChange={(e) => setBrainDumpText(e.target.value)} rows={4}
            placeholder="e.g. I need to finish the project report, prepare for tomorrow's meeting, buy groceries, and go for a run..."
            className="w-full px-4 py-3 rounded-xl outline-none transition-all font-['Figtree'] text-sm resize-none t-input" />
          <div className="flex justify-between mt-3">
            <button type="button" data-testid="voice-brain-dump" onClick={toggleVoice}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium"
              style={{ background: listening ? 'var(--danger)' : 'var(--bg-secondary)', color: listening ? 'var(--text-inverse)' : 'var(--text-secondary)' }}>
              {listening ? <><MicOff className="w-4 h-4" /> Stop</> : <><Mic className="w-4 h-4" /> Voice Input</>}
            </button>
            <button data-testid="brain-dump-submit" onClick={handleBrainDump} disabled={dumping || !brainDumpText.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm shadow-sm disabled:opacity-50"
              style={{ background: 'var(--brand-primary)', color: 'var(--text-inverse)' }}>
              <Wand2 className="w-4 h-4" /> {dumping ? 'Parsing...' : 'Parse Tasks'}
            </button>
          </div>
        </div>
      )}

      {showAddTask && (
        <form onSubmit={handleAddTask} className="rounded-2xl p-6 mb-6 animate-fade-in-up" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} data-testid="add-task-form">
          <h3 className="font-['Manrope'] text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>New Task</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2"><input data-testid="new-task-title" value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} placeholder="Task title" className="w-full px-4 py-3 rounded-xl outline-none transition-all font-['Figtree'] t-input" required /></div>
            <select data-testid="new-task-type" value={newTask.task_type} onChange={(e) => setNewTask({...newTask, task_type: e.target.value})} className="px-4 py-3 rounded-xl outline-none font-['Figtree'] text-sm t-input">
              {TYPE_OPTIONS.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
            </select>
            <select data-testid="new-task-priority" value={newTask.priority} onChange={(e) => setNewTask({...newTask, priority: e.target.value})} className="px-4 py-3 rounded-xl outline-none font-['Figtree'] text-sm t-input">
              {PRIORITY_OPTIONS.map(p => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
            </select>
            <input data-testid="new-task-effort" value={newTask.effort} onChange={(e) => setNewTask({...newTask, effort: e.target.value})} placeholder="Effort (e.g. 2h)" className="px-4 py-3 rounded-xl outline-none font-['Figtree'] text-sm t-input" />
            <input data-testid="new-task-deadline" type="date" value={newTask.deadline} onChange={(e) => setNewTask({...newTask, deadline: e.target.value})} className="px-4 py-3 rounded-xl outline-none font-['Figtree'] text-sm t-input" />
          </div>
          <div className="flex justify-end mt-4">
            <button data-testid="add-task-submit" type="submit" className="px-5 py-2.5 rounded-xl font-medium text-sm shadow-sm" style={{ background: 'var(--brand-primary)', color: 'var(--text-inverse)' }}>Create Task</button>
          </div>
        </form>
      )}

      <div className="flex gap-2 mb-6 flex-wrap">
        {[{ key: 'status', opts: STATUS_OPTIONS, label: 'All Status' }, { key: 'priority', opts: PRIORITY_OPTIONS, label: 'All Priority' }, { key: 'task_type', opts: TYPE_OPTIONS, label: 'All Types' }].map(f => (
          <select key={f.key} data-testid={`filter-${f.key}`} value={filter[f.key]} onChange={(e) => setFilter({...filter, [f.key]: e.target.value})}
            className="px-3 py-2 rounded-xl text-sm font-['Figtree'] outline-none t-input">
            <option value="">{f.label}</option>
            {f.opts.map(o => <option key={o} value={o}>{o.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}</option>)}
          </select>
        ))}
      </div>

      {rankings.length > 0 && (
        <div className="rounded-2xl p-6 mb-6 animate-fade-in-up" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-color)' }} data-testid="rankings-section">
          <h3 className="font-['Manrope'] text-lg font-semibold mb-3 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}><ArrowUpDown className="w-5 h-5" style={{ color: 'var(--brand-primary)' }} /> AI Priority Rankings</h3>
          <div className="space-y-2">{rankings.map((r, i) => { const task = tasks.find(t => t.id === r.task_id); return (
            <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-primary)' }}>
              <span className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ background: 'var(--brand-primary)', color: 'var(--text-inverse)' }}>{r.rank}</span>
              <div className="flex-1"><p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{task?.title || 'Unknown'}</p><p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{r.rationale}</p></div>
            </div>); })}</div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-6 h-6 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }} /></div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16">
          <Brain className="w-12 h-12 mx-auto mb-4" style={{ color: 'color-mix(in srgb, var(--brand-primary) 40%, transparent)' }} />
          <h3 className="font-['Manrope'] text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>No tasks yet</h3>
          <p className="font-['Figtree']" style={{ color: 'var(--text-secondary)' }}>Use Brain Dump to pour out your thoughts, or add tasks manually.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((t) => (
            <div key={t.id} className="rounded-xl p-4 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 group" data-testid={`task-card-${t.id}`}
              style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}>
              <div className="flex items-start gap-3">
                <button onClick={() => updateStatus(t.id, t.status === 'done' ? 'pending' : 'done')} data-testid={`task-toggle-${t.id}`} className="mt-0.5 flex-shrink-0 transition-colors" style={{ color: t.status === 'done' ? 'var(--success)' : 'var(--bg-secondary)' }}>
                  <CheckCircle2 className="w-5 h-5" />
                </button>
                <div className="flex-1 min-w-0">
                  <p className={`font-['Figtree'] font-medium ${t.status === 'done' ? 'line-through opacity-50' : ''}`} style={{ color: 'var(--text-primary)' }}>{t.title}</p>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <span className="text-xs px-2 py-0.5 rounded-lg font-medium" style={{ background: priorityBg(t.priority), color: t.priority === 'low' ? 'var(--text-secondary)' : 'var(--text-inverse)' }}>{t.priority}</span>
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}><Tag className="w-3 h-3" />{t.task_type}</span>
                    <span className="text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}><Clock className="w-3 h-3" />{t.effort}</span>
                    {t.postpone_count > 0 && <span className="text-xs flex items-center gap-1" style={{ color: 'var(--danger)' }}><AlertTriangle className="w-3 h-3" />Postponed {t.postpone_count}x</span>}
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <select value={t.status} onChange={(e) => updateStatus(t.id, e.target.value)} className="text-xs px-2 py-1 rounded-lg outline-none font-['Figtree'] t-input" data-testid={`task-status-${t.id}`}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                  <button onClick={() => deleteTask(t.id)} data-testid={`task-delete-${t.id}`} className="p-1.5 rounded-lg transition-colors" style={{ color: 'var(--text-secondary)' }}>
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
