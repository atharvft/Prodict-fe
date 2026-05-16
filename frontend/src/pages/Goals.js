import React, { useState, useEffect } from 'react';
import { goalAPI } from '../services/api';
import { Target, Plus, ChevronRight, Sparkles } from 'lucide-react';

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [showAdd, setShowAdd] = useState(false);
  const [newGoal, setNewGoal] = useState({ title: '', deadline: '' });
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [expandedGoal, setExpandedGoal] = useState(null);

  useEffect(() => { loadGoals(); }, []);

  const loadGoals = async () => {
    try { const { data } = await goalAPI.getAll(); setGoals(data); }
    catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newGoal.title.trim()) return;
    setCreating(true);
    try {
      await goalAPI.create(newGoal);
      setNewGoal({ title: '', deadline: '' });
      setShowAdd(false);
      loadGoals();
    } catch (e) { console.error(e); }
    finally { setCreating(false); }
  };

  const updateProgress = async (id, progress) => {
    try { await goalAPI.updateProgress(id, progress); loadGoals(); }
    catch (e) { console.error(e); }
  };

  if (loading) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 border-[#C27A63] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto" data-testid="goals-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-['Manrope'] text-3xl font-bold text-[#1A1D1A] tracking-tight">Goals</h1>
          <p className="text-[#575E56] font-['Figtree'] mt-1">Set goals and let AURA generate AI-powered roadmaps.</p>
        </div>
        <button data-testid="add-goal-toggle" onClick={() => setShowAdd(!showAdd)}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#C27A63] text-[#F9F8F6] rounded-xl hover:bg-[#A6634D] transition-colors font-medium text-sm shadow-sm">
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleCreate} className="bg-[#F9F8F6] border border-[#2D372B]/10 rounded-2xl p-6 mb-6 animate-fade-in-up" data-testid="add-goal-form">
          <h3 className="font-['Manrope'] text-lg font-semibold text-[#1A1D1A] mb-4">Create New Goal</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <input data-testid="goal-title-input" value={newGoal.title} onChange={(e) => setNewGoal({...newGoal, title: e.target.value})}
              placeholder="e.g. Learn React in 30 days" className="sm:col-span-2 px-4 py-3 bg-[#F2F0EA] border border-[#2D372B]/10 rounded-xl focus:bg-[#F9F8F6] focus:border-[#C27A63] focus:ring-2 focus:ring-[#C27A63]/20 outline-none transition-all font-['Figtree']" required />
            <input data-testid="goal-deadline-input" type="date" value={newGoal.deadline} onChange={(e) => setNewGoal({...newGoal, deadline: e.target.value})}
              className="px-4 py-3 bg-[#F2F0EA] border border-[#2D372B]/10 rounded-xl focus:border-[#C27A63] outline-none font-['Figtree'] text-sm" />
            <button data-testid="goal-submit-button" type="submit" disabled={creating}
              className="px-5 py-3 bg-[#C27A63] text-[#F9F8F6] rounded-xl hover:bg-[#A6634D] transition-colors font-medium text-sm shadow-sm disabled:opacity-50 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4" /> {creating ? 'Generating roadmap...' : 'Create with AI Roadmap'}
            </button>
          </div>
        </form>
      )}

      {goals.length === 0 ? (
        <div className="text-center py-16">
          <Target className="w-12 h-12 text-[#C27A63]/40 mx-auto mb-4" />
          <h3 className="font-['Manrope'] text-xl font-semibold text-[#1A1D1A] mb-2">No goals yet</h3>
          <p className="text-[#575E56] font-['Figtree']">Create a goal and AURA will generate a phased roadmap for you.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((g) => (
            <div key={g.id} className="bg-[#F9F8F6] border border-[#2D372B]/10 rounded-2xl p-6 hover:shadow-md transition-all animate-fade-in-up" data-testid={`goal-card-${g.id}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="font-['Manrope'] text-xl font-semibold text-[#1A1D1A]">{g.title}</h3>
                  {g.deadline && <p className="text-sm text-[#575E56] mt-1">Deadline: {new Date(g.deadline).toLocaleDateString()}</p>}
                </div>
                <button onClick={() => setExpandedGoal(expandedGoal === g.id ? null : g.id)} className="p-2 hover:bg-[#E8E5DF] rounded-lg transition-colors">
                  <ChevronRight className={`w-5 h-5 text-[#575E56] transition-transform ${expandedGoal === g.id ? 'rotate-90' : ''}`} />
                </button>
              </div>

              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-[#575E56]">Progress</span>
                  <span className="font-['Manrope'] font-bold text-[#1A1D1A]">{g.progress}%</span>
                </div>
                <div className="w-full h-3 bg-[#E8E5DF] rounded-full overflow-hidden">
                  <div className="h-full bg-[#8BA38A] rounded-full transition-all duration-500" style={{ width: `${g.progress}%` }} />
                </div>
                <input type="range" min="0" max="100" value={g.progress}
                  onChange={(e) => updateProgress(g.id, parseInt(e.target.value))}
                  className="w-full mt-2 accent-[#C27A63]" data-testid={`goal-progress-${g.id}`} />
              </div>

              {expandedGoal === g.id && g.roadmap && Array.isArray(g.roadmap) && g.roadmap.length > 0 && (
                <div className="mt-4 border-t border-[#2D372B]/8 pt-4 space-y-3 animate-fade-in-up">
                  <p className="text-xs tracking-[0.15em] uppercase font-semibold text-[#575E56]">AI-Generated Roadmap</p>
                  {g.roadmap.map((phase, i) => (
                    <div key={i} className="flex gap-3 p-3 bg-[#F2F0EA] rounded-xl">
                      <div className="w-7 h-7 rounded-full bg-[#C27A63] text-[#F9F8F6] flex items-center justify-center text-xs font-bold flex-shrink-0">{phase.phase || i + 1}</div>
                      <div>
                        <p className="text-sm font-medium text-[#1A1D1A] font-['Manrope']">{phase.title}</p>
                        {phase.duration && <p className="text-xs text-[#575E56]">{phase.duration}</p>}
                        {phase.tasks && (
                          <ul className="mt-1 space-y-0.5">
                            {phase.tasks.map((task, j) => (
                              <li key={j} className="text-xs text-[#575E56] flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-[#8BA38A]" />{task}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
