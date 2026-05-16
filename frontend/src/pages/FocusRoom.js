import React, { useState, useEffect, useRef } from 'react';
import { focusAPI, taskAPI } from '../services/api';
import { Play, Pause, Square, RotateCcw, Clock, CheckCircle2, Flame } from 'lucide-react';

export default function FocusRoom() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState('');
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [phase, setPhase] = useState('idle');
  const intervalRef = useRef(null);

  useEffect(() => { loadData(); return () => clearInterval(intervalRef.current); }, []);

  const loadData = async () => {
    try {
      const [t, s] = await Promise.allSettled([taskAPI.getAll({ status: 'pending' }), focusAPI.history()]);
      if (t.status === 'fulfilled') setTasks(t.value.data);
      if (s.status === 'fulfilled') setSessions(s.value.data.slice(0, 10));
    } catch (e) { console.error(e); }
  };

  const startSession = async () => {
    try {
      const { data } = await focusAPI.start({ task_id: selectedTask || null, duration_min: duration });
      setSessionId(data.id); setTimeLeft(duration * 60); setIsRunning(true); setIsPaused(false); setPhase('focus');
      intervalRef.current = setInterval(() => { setTimeLeft(prev => { if (prev <= 1) { clearInterval(intervalRef.current); setIsRunning(false); setPhase('complete'); return 0; } return prev - 1; }); }, 1000);
    } catch (e) { console.error(e); }
  };

  const pauseSession = () => {
    if (isPaused) { intervalRef.current = setInterval(() => { setTimeLeft(prev => { if (prev <= 1) { clearInterval(intervalRef.current); setIsRunning(false); setPhase('complete'); return 0; } return prev - 1; }); }, 1000); setIsPaused(false); }
    else { clearInterval(intervalRef.current); setIsPaused(true); }
  };

  const endSession = async (completed = false) => {
    clearInterval(intervalRef.current);
    if (sessionId) { try { await focusAPI.end(sessionId, { completed }); } catch (e) { console.error(e); } }
    setIsRunning(false); setIsPaused(false); setSessionId(null); setPhase('idle'); setTimeLeft(duration * 60); loadData();
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const progress = phase === 'idle' ? 0 : ((duration * 60 - timeLeft) / (duration * 60)) * 100;
  const circumference = 2 * Math.PI * 140;
  const strokeOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto" data-testid="focus-room-page">
      <div className="mb-8">
        <h1 className="font-['Manrope'] text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Focus Room</h1>
        <p className="font-['Figtree'] mt-1" style={{ color: 'var(--text-secondary)' }}>Deep work powered by Pomodoro technique.</p>
      </div>
      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <div className="rounded-2xl p-8 relative overflow-hidden" data-testid="timer-section"
            style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)',
              backgroundImage: isRunning ? `url(https://static.prod-images.emergentagent.com/jobs/f4b546d4-bdf7-4ed7-97de-31eac23af15e/images/c953d050f8aa1f749cce2df044ec5ee8aeab456f04b1e541082007a97cb1af0c.png)` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {isRunning && <div className="absolute inset-0" style={{ background: 'color-mix(in srgb, var(--bg-primary) 85%, transparent)', backdropFilter: 'blur(4px)' }} />}
            <div className="relative z-10 flex flex-col items-center">
              <div className="relative w-72 h-72 mb-8">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 300 300">
                  <circle cx="150" cy="150" r="140" fill="none" stroke="var(--bg-secondary)" strokeWidth="6" />
                  <circle cx="150" cy="150" r="140" fill="none" stroke="var(--brand-primary)" strokeWidth="6"
                    strokeDasharray={circumference} strokeDashoffset={strokeOffset} strokeLinecap="round"
                    className={`transition-all duration-1000 ${isRunning && !isPaused ? 'animate-pulse-ring' : ''}`}
                    style={{ filter: isRunning ? 'drop-shadow(0 0 8px color-mix(in srgb, var(--brand-primary) 40%, transparent))' : 'none' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-['JetBrains_Mono'] text-5xl font-bold" style={{ color: 'var(--text-primary)' }} data-testid="timer-display">{formatTime(timeLeft)}</span>
                  <span className="text-sm mt-2 font-['Figtree'] capitalize" style={{ color: 'var(--text-secondary)' }}>{phase === 'idle' ? 'Ready' : phase === 'complete' ? 'Complete!' : isPaused ? 'Paused' : 'Focusing'}</span>
                </div>
              </div>
              {phase === 'idle' && (
                <div className="w-full max-w-sm space-y-4 mb-6">
                  <div>
                    <label className="block text-xs tracking-[0.15em] uppercase font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Select Task</label>
                    <select data-testid="focus-task-select" value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)} className="w-full px-4 py-3 rounded-xl outline-none font-['Figtree'] text-sm t-input">
                      <option value="">No specific task</option>
                      {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs tracking-[0.15em] uppercase font-semibold mb-2" style={{ color: 'var(--text-secondary)' }}>Duration (minutes)</label>
                    <div className="flex gap-2">
                      {[15, 25, 45, 60].map(d => (
                        <button key={d} data-testid={`duration-${d}`} onClick={() => { setDuration(d); setTimeLeft(d * 60); }}
                          className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
                          style={{ background: duration === d ? 'var(--brand-primary)' : 'var(--bg-secondary)', color: duration === d ? 'var(--text-inverse)' : 'var(--text-secondary)' }}>
                          {d}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              <div className="flex gap-3">
                {phase === 'idle' && <button data-testid="start-focus-button" onClick={startSession} className="flex items-center gap-2 px-8 py-3 rounded-xl font-medium shadow-sm text-lg" style={{ background: 'var(--brand-primary)', color: 'var(--text-inverse)' }}><Play className="w-5 h-5" /> Start Focus</button>}
                {phase === 'focus' && (<>
                  <button data-testid="pause-focus-button" onClick={pauseSession} className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}>{isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}{isPaused ? 'Resume' : 'Pause'}</button>
                  <button data-testid="stop-focus-button" onClick={() => endSession(false)} className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium" style={{ background: 'color-mix(in srgb, var(--danger) 15%, transparent)', color: 'var(--danger)' }}><Square className="w-5 h-5" /> Stop</button>
                </>)}
                {phase === 'complete' && (<>
                  <button data-testid="complete-focus-button" onClick={() => endSession(true)} className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium shadow-sm" style={{ background: 'var(--success)', color: 'var(--text-inverse)' }}><CheckCircle2 className="w-5 h-5" /> Mark Complete</button>
                  <button onClick={() => endSession(false)} className="flex items-center gap-2 px-6 py-3 rounded-xl font-medium" style={{ background: 'var(--bg-secondary)', color: 'var(--text-primary)' }}><RotateCcw className="w-5 h-5" /> Reset</button>
                </>)}
              </div>
            </div>
          </div>
        </div>
        <div className="lg:col-span-2">
          <div className="rounded-2xl p-6" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} data-testid="session-history">
            <h3 className="font-['Manrope'] text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <Flame className="w-5 h-5" style={{ color: 'var(--warning)' }} /> Recent Sessions
            </h3>
            {sessions.length === 0 ? (
              <p className="text-sm text-center py-8 font-['Figtree']" style={{ color: 'var(--text-secondary)' }}>No sessions yet. Start your first focus session!</p>
            ) : (
              <div className="space-y-2">{sessions.map((s) => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl transition-colors">
                  <div className="w-2 h-2 rounded-full" style={{ background: s.completed ? 'var(--success)' : 'var(--danger)' }} />
                  <div className="flex-1"><p className="text-sm font-['Figtree']" style={{ color: 'var(--text-primary)' }}>{s.duration_min}min session</p><p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{s.actual_min}min completed</p></div>
                  {s.completed && <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--success)' }} />}
                </div>
              ))}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
