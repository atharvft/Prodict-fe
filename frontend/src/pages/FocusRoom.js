import React, { useState, useEffect, useRef, useCallback } from 'react';
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

  useEffect(() => {
    loadData();
    return () => clearInterval(intervalRef.current);
  }, []);

  const loadData = async () => {
    try {
      const [tasksRes, sessionsRes] = await Promise.allSettled([
        taskAPI.getAll({ status: 'pending' }),
        focusAPI.history(),
      ]);
      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.data);
      if (sessionsRes.status === 'fulfilled') setSessions(sessionsRes.value.data.slice(0, 10));
    } catch (e) { console.error(e); }
  };

  const startSession = async () => {
    try {
      const { data } = await focusAPI.start({ task_id: selectedTask || null, duration_min: duration });
      setSessionId(data.id);
      setTimeLeft(duration * 60);
      setIsRunning(true);
      setIsPaused(false);
      setPhase('focus');
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            setPhase('complete');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (e) { console.error(e); }
  };

  const pauseSession = () => {
    if (isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            setIsRunning(false);
            setPhase('complete');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      setIsPaused(false);
    } else {
      clearInterval(intervalRef.current);
      setIsPaused(true);
    }
  };

  const endSession = async (completed = false) => {
    clearInterval(intervalRef.current);
    if (sessionId) {
      try {
        await focusAPI.end(sessionId, { completed });
      } catch (e) { console.error(e); }
    }
    setIsRunning(false);
    setIsPaused(false);
    setSessionId(null);
    setPhase('idle');
    setTimeLeft(duration * 60);
    loadData();
  };

  const formatTime = (s) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = phase === 'idle' ? 0 : ((duration * 60 - timeLeft) / (duration * 60)) * 100;
  const circumference = 2 * Math.PI * 140;
  const strokeOffset = circumference - (progress / 100) * circumference;

  return (
    <div className="p-6 lg:p-8 max-w-5xl mx-auto" data-testid="focus-room-page">
      <div className="mb-8">
        <h1 className="font-['Manrope'] text-3xl font-bold text-[#1A1D1A] tracking-tight">Focus Room</h1>
        <p className="text-[#575E56] font-['Figtree'] mt-1">Deep work powered by Pomodoro technique.</p>
      </div>

      <div className="grid lg:grid-cols-5 gap-8">
        <div className="lg:col-span-3">
          <div className="bg-[#F9F8F6] border border-[#2D372B]/10 rounded-2xl p-8 relative overflow-hidden" data-testid="timer-section"
            style={{ backgroundImage: isRunning ? `url(https://static.prod-images.emergentagent.com/jobs/f4b546d4-bdf7-4ed7-97de-31eac23af15e/images/c953d050f8aa1f749cce2df044ec5ee8aeab456f04b1e541082007a97cb1af0c.png)` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
            {isRunning && <div className="absolute inset-0 bg-[#F9F8F6]/85 backdrop-blur-sm" />}

            <div className="relative z-10 flex flex-col items-center">
              <div className="relative w-72 h-72 mb-8">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 300 300">
                  <circle cx="150" cy="150" r="140" fill="none" stroke="#E8E5DF" strokeWidth="6" />
                  <circle cx="150" cy="150" r="140" fill="none" stroke="#C27A63" strokeWidth="6"
                    strokeDasharray={circumference} strokeDashoffset={strokeOffset}
                    strokeLinecap="round" className={`transition-all duration-1000 ${isRunning && !isPaused ? 'animate-pulse-ring' : ''}`} style={{ filter: isRunning ? 'drop-shadow(0 0 8px rgba(194,122,99,0.4))' : 'none' }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="font-['JetBrains_Mono'] text-5xl font-bold text-[#1A1D1A]" data-testid="timer-display">{formatTime(timeLeft)}</span>
                  <span className="text-sm text-[#575E56] mt-2 font-['Figtree'] capitalize">{phase === 'idle' ? 'Ready' : phase === 'complete' ? 'Complete!' : isPaused ? 'Paused' : 'Focusing'}</span>
                </div>
              </div>

              {phase === 'idle' && (
                <div className="w-full max-w-sm space-y-4 mb-6">
                  <div>
                    <label className="block text-xs tracking-[0.15em] uppercase font-semibold text-[#575E56] mb-2">Select Task</label>
                    <select data-testid="focus-task-select" value={selectedTask} onChange={(e) => setSelectedTask(e.target.value)}
                      className="w-full px-4 py-3 bg-[#F2F0EA] border border-[#2D372B]/10 rounded-xl focus:border-[#C27A63] outline-none font-['Figtree'] text-sm">
                      <option value="">No specific task</option>
                      {tasks.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs tracking-[0.15em] uppercase font-semibold text-[#575E56] mb-2">Duration (minutes)</label>
                    <div className="flex gap-2">
                      {[15, 25, 45, 60].map(d => (
                        <button key={d} data-testid={`duration-${d}`} onClick={() => { setDuration(d); setTimeLeft(d * 60); }}
                          className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors ${duration === d ? 'bg-[#C27A63] text-[#F9F8F6]' : 'bg-[#E8E5DF] text-[#575E56] hover:bg-[#DEDAD2]'}`}>
                          {d}m
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                {phase === 'idle' && (
                  <button data-testid="start-focus-button" onClick={startSession}
                    className="flex items-center gap-2 px-8 py-3 bg-[#C27A63] text-[#F9F8F6] rounded-xl hover:bg-[#A6634D] transition-colors font-medium shadow-sm text-lg">
                    <Play className="w-5 h-5" /> Start Focus
                  </button>
                )}
                {phase === 'focus' && (
                  <>
                    <button data-testid="pause-focus-button" onClick={pauseSession}
                      className="flex items-center gap-2 px-6 py-3 bg-[#E8E5DF] text-[#1A1D1A] rounded-xl hover:bg-[#DEDAD2] transition-colors font-medium">
                      {isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
                      {isPaused ? 'Resume' : 'Pause'}
                    </button>
                    <button data-testid="stop-focus-button" onClick={() => endSession(false)}
                      className="flex items-center gap-2 px-6 py-3 bg-[#D46B6B]/10 text-[#D46B6B] rounded-xl hover:bg-[#D46B6B]/20 transition-colors font-medium">
                      <Square className="w-5 h-5" /> Stop
                    </button>
                  </>
                )}
                {phase === 'complete' && (
                  <>
                    <button data-testid="complete-focus-button" onClick={() => endSession(true)}
                      className="flex items-center gap-2 px-6 py-3 bg-[#8BA38A] text-[#F9F8F6] rounded-xl hover:bg-[#738C71] transition-colors font-medium shadow-sm">
                      <CheckCircle2 className="w-5 h-5" /> Mark Complete
                    </button>
                    <button onClick={() => endSession(false)}
                      className="flex items-center gap-2 px-6 py-3 bg-[#E8E5DF] text-[#1A1D1A] rounded-xl hover:bg-[#DEDAD2] transition-colors font-medium">
                      <RotateCcw className="w-5 h-5" /> Reset
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-[#F9F8F6] border border-[#2D372B]/10 rounded-2xl p-6" data-testid="session-history">
            <h3 className="font-['Manrope'] text-lg font-semibold text-[#1A1D1A] mb-4 flex items-center gap-2">
              <Flame className="w-5 h-5 text-[#E8B273]" /> Recent Sessions
            </h3>
            {sessions.length === 0 ? (
              <p className="text-[#575E56] text-sm text-center py-8 font-['Figtree']">No sessions yet. Start your first focus session!</p>
            ) : (
              <div className="space-y-2">
                {sessions.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#F2F0EA] transition-colors">
                    <div className={`w-2 h-2 rounded-full ${s.completed ? 'bg-[#8BA38A]' : 'bg-[#D46B6B]'}`} />
                    <div className="flex-1">
                      <p className="text-sm text-[#1A1D1A] font-['Figtree']">{s.duration_min}min session</p>
                      <p className="text-xs text-[#575E56]">{s.actual_min}min completed</p>
                    </div>
                    {s.completed && <CheckCircle2 className="w-4 h-4 text-[#8BA38A]" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
