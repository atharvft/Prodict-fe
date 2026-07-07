import React, { useState, useEffect, useCallback } from 'react';
import { calendarAPI, taskAPI } from '../services/api';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock, Plus } from 'lucide-react';

const priorityDot = (p) => ({ critical: 'var(--danger)', high: 'var(--warning)', medium: 'var(--success)', low: 'var(--text-secondary)' }[p] || 'var(--success)');

export default function CalendarView() {
  const [weekData, setWeekData] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekStart, setWeekStart] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - d.getDay() + 1);
    return d.toISOString().slice(0, 10);
  });

  const loadWeek = useCallback(async () => {
    setLoading(true);
    try {
      const [w, e] = await Promise.allSettled([calendarAPI.week(weekStart), calendarAPI.events()]);
      if (w.status === 'fulfilled') setWeekData(w.value.data);
      if (e.status === 'fulfilled') setEvents(e.value.data.events || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [weekStart]);

  useEffect(() => { loadWeek(); }, [loadWeek]);

  const navigate = (dir) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + (dir * 7));
    setWeekStart(d.toISOString().slice(0, 10));
  };

  const today = new Date().toISOString().slice(0, 10);

  const getEventsForDay = (dateStr) => events.filter(e => e.date === dateStr);

  if (loading && !weekData) return <div className="flex items-center justify-center h-full"><div className="w-8 h-8 border-2 rounded-full animate-spin" style={{ borderColor: 'var(--brand-primary)', borderTopColor: 'transparent' }} /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto" data-testid="calendar-page">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-['Manrope'] text-3xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>Calendar</h1>
          <p className="font-['Figtree'] mt-1" style={{ color: 'var(--text-secondary)' }}>View your tasks and schedule across the week.</p>
        </div>
        <div className="flex items-center gap-3">
          <button data-testid="calendar-prev" onClick={() => navigate(-1)} className="p-2 rounded-xl transition-colors" style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-['Manrope'] font-semibold text-sm min-w-[140px] text-center" style={{ color: 'var(--text-primary)' }}>
            {weekData?.week_start ? new Date(weekData.week_start + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''} — {weekData?.days?.[6]?.date ? new Date(weekData.days[6].date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}
          </span>
          <button data-testid="calendar-next" onClick={() => navigate(1)} className="p-2 rounded-xl transition-colors" style={{ border: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-3" data-testid="calendar-grid">
        {(weekData?.days || []).map((day) => {
          const isToday = day.date === today;
          const dayEvents = getEventsForDay(day.date);
          const allItems = [...day.tasks, ...dayEvents.filter(ev => !day.tasks.find(t => t.id === ev.id))];

          return (
            <div key={day.date} className="rounded-2xl p-4 min-h-[300px] transition-all"
              style={{
                background: isToday ? 'color-mix(in srgb, var(--brand-primary) 8%, var(--bg-primary))' : 'var(--bg-primary)',
                border: isToday ? '2px solid var(--brand-primary)' : '1px solid var(--border-color)',
              }}
              data-testid={`calendar-day-${day.date}`}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>{day.day_name.slice(0, 3)}</p>
                  <p className="font-['Manrope'] text-lg font-bold" style={{ color: isToday ? 'var(--brand-primary)' : 'var(--text-primary)' }}>
                    {new Date(day.date + 'T00:00:00').getDate()}
                  </p>
                </div>
                {isToday && <div className="w-2 h-2 rounded-full" style={{ background: 'var(--brand-primary)' }} />}
              </div>

              {/* Schedule blocks */}
              {day.schedule?.blocks?.slice(0, 3).map((block, i) => (
                <div key={i} className="mb-1.5 px-2 py-1.5 rounded-lg text-xs" style={{
                  background: block.type === 'break' ? 'color-mix(in srgb, var(--success) 12%, transparent)' : 'color-mix(in srgb, var(--brand-primary) 12%, transparent)',
                  color: block.type === 'break' ? 'var(--success)' : 'var(--brand-primary)'
                }}>
                  <span className="font-['JetBrains_Mono']">{block.start}</span> {block.label?.slice(0, 15)}{block.label?.length > 15 ? '...' : ''}
                </div>
              ))}

              {/* Tasks with deadlines */}
              {allItems.slice(0, 4).map((item) => (
                <div key={item.id} className="flex items-center gap-1.5 mb-1 px-2 py-1 rounded-lg text-xs" style={{ background: 'var(--bg-tertiary)' }}>
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: priorityDot(item.priority) }} />
                  <span className="truncate font-['Figtree']" style={{ color: 'var(--text-primary)' }}>{item.title?.slice(0, 18)}{item.title?.length > 18 ? '...' : ''}</span>
                </div>
              ))}

              {/* Focus sessions */}
              {day.focus_sessions?.map((fs, i) => (
                <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs mb-1" style={{ background: 'color-mix(in srgb, var(--warning) 10%, transparent)', color: 'var(--warning)' }}>
                  <Clock className="w-3 h-3" /> {fs.duration_min}m focus
                </div>
              ))}

              {allItems.length === 0 && !day.schedule && day.focus_sessions?.length === 0 && (
                <p className="text-xs text-center pt-4" style={{ color: 'var(--text-secondary)', opacity: 0.5 }}>No events</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Upcoming events list */}
      {events.length > 0 && (
        <div className="mt-8 rounded-2xl p-6" style={{ background: 'var(--bg-primary)', border: '1px solid var(--border-color)' }} data-testid="upcoming-events">
          <h3 className="font-['Manrope'] text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
            <CalendarIcon className="w-5 h-5" style={{ color: 'var(--brand-primary)' }} /> Upcoming Deadlines
          </h3>
          <div className="space-y-2">
            {events.filter(e => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 8).map((e) => (
              <div key={e.id} className="flex items-center gap-3 p-3 rounded-xl" style={{ background: 'var(--bg-tertiary)' }}>
                <div className="w-2 h-2 rounded-full" style={{ background: priorityDot(e.priority) }} />
                <span className="flex-1 text-sm font-['Figtree']" style={{ color: 'var(--text-primary)' }}>{e.title}</span>
                <span className="text-xs font-['JetBrains_Mono']" style={{ color: 'var(--text-secondary)' }}>{e.date}</span>
                <span className="text-xs px-2 py-0.5 rounded-lg" style={{ background: priorityDot(e.priority), color: e.priority === 'low' ? 'var(--text-secondary)' : 'var(--text-inverse)' }}>{e.priority}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
